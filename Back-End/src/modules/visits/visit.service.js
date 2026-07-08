const { AppError } = require('../../utils/AppError');
const { formatVisitResponse, getReferenceId } = require('../../utils/formatVisitResponse');
const { User, USER_ROLES, USER_STATUSES } = require('../../models/User');
const { Customer, CUSTOMER_STATUSES } = require('../customers/customer.model');
const { Visit, VISIT_STATUSES } = require('./visit.model');

const MANAGE_VISIT_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const READ_ALL_VISIT_ROLES = [
  ...MANAGE_VISIT_ROLES,
  USER_ROLES.ACCOUNTANT,
];

const VISIT_WRITE_ROLES = [
  ...MANAGE_VISIT_ROLES,
  USER_ROLES.SALES_REPRESENTATIVE,
];

const userPopulateSelect = 'name email role status createdAt updatedAt';
const customerPopulateSelect = 'name contactName phone customerType status assignedSalesRep';

const getActorId = (actor) => {
  if (actor.id) {
    return actor.id.toString();
  }

  if (actor._id && typeof actor._id.toString === 'function') {
    return actor._id.toString();
  }

  return actor.toString();
};

const isManagerLevel = (role) => MANAGE_VISIT_ROLES.includes(role);
const isReadAllRole = (role) => READ_ALL_VISIT_ROLES.includes(role);
const isWriteRole = (role) => VISIT_WRITE_ROLES.includes(role);
const isSalesRepresentative = (role) => role === USER_ROLES.SALES_REPRESENTATIVE;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const populateVisit = (query) => query
  .populate('customer', customerPopulateSelect)
  .populate('salesRep', userPopulateSelect)
  .populate('createdBy', userPopulateSelect)
  .populate('updatedBy', userPopulateSelect);

const findVisitById = (visitId) => populateVisit(Visit.findById(visitId));

const assertWriteRole = (actor) => {
  if (!isWriteRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertVisitReadable = (visit, actor) => {
  if (isSalesRepresentative(actor.role) && getReferenceId(visit.salesRep) !== getActorId(actor)) {
    throw new AppError('Forbidden', 403);
  }

  if (!isSalesRepresentative(actor.role) && !isReadAllRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertVisitWritable = (visit, actor) => {
  assertWriteRole(actor);

  if (isSalesRepresentative(actor.role) && getReferenceId(visit.salesRep) !== getActorId(actor)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertPlannedVisit = (visit) => {
  if (visit.status !== VISIT_STATUSES.PLANNED) {
    throw new AppError('Only planned visits can be changed', 400);
  }
};

const assertSalesRepOwnsCustomer = (customer, actor) => {
  const assignedSalesRepId = getReferenceId(customer.assignedSalesRep);
  const actorId = getActorId(actor);

  if (!assignedSalesRepId || assignedSalesRepId !== actorId) {
    throw new AppError('Forbidden', 403);
  }
};

const assertCanReadCustomerVisits = (customer, actor) => {
  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
    return;
  }

  if (!isReadAllRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const ensureActiveCustomer = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (customer.status !== CUSTOMER_STATUSES.ACTIVE) {
    throw new AppError('Customer must be active to create or update a visit', 400);
  }

  return customer;
};

const ensureActiveSalesRep = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('Sales representative not found', 404);
  }

  if (user.role !== USER_ROLES.SALES_REPRESENTATIVE) {
    throw new AppError('Assigned user must be a sales representative', 400);
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AppError('Sales representative must be active', 400);
  }

  return user;
};

const resolveCreateSalesRep = async ({ payload, customer, actor }) => {
  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
    return getActorId(actor);
  }

  if (!isManagerLevel(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  const salesRepId = payload.salesRep || getReferenceId(customer.assignedSalesRep);

  if (!salesRepId) {
    throw new AppError('salesRep is required when customer has no assigned sales representative', 400);
  }

  await ensureActiveSalesRep(salesRepId);
  return salesRepId;
};

const addSearchFilters = async (filters, search) => {
  if (!search) {
    return filters;
  }

  const searchRegex = new RegExp(escapeRegex(search), 'i');
  const matchingCustomers = await Customer.find({
    $or: [
      { name: searchRegex },
      { contactName: searchRegex },
      { phone: searchRegex },
    ],
  }).select('_id');
  const matchingCustomerIds = matchingCustomers.map(getReferenceId);

  return {
    ...filters,
    $or: [
      { purpose: searchRegex },
      { notes: searchRegex },
      ...(matchingCustomerIds.length > 0 ? [{ customer: { $in: matchingCustomerIds } }] : []),
    ],
  };
};

const buildVisitFilters = async (query, actor) => {
  let filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.outcome) {
    filters.outcome = query.outcome;
  }

  if (query.customer) {
    filters.customer = query.customer;
  }

  if (isSalesRepresentative(actor.role)) {
    filters.salesRep = getActorId(actor);
  } else if (isReadAllRole(actor.role)) {
    if (query.salesRep) {
      filters.salesRep = query.salesRep;
    }
  } else {
    throw new AppError('Forbidden', 403);
  }

  if (query.dateFrom || query.dateTo) {
    filters.visitDate = {};

    if (query.dateFrom) {
      filters.visitDate.$gte = query.dateFrom;
    }

    if (query.dateTo) {
      filters.visitDate.$lte = query.dateTo;
    }
  }

  filters = await addSearchFilters(filters, query.search);
  return filters;
};

const listVisits = async (query, actor) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filters = await buildVisitFilters(query, actor);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [query.sortBy || 'visitDate']: sortDirection };

  const [visits, total] = await Promise.all([
    populateVisit(Visit.find(filters))
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Visit.countDocuments(filters),
  ]);

  return {
    count: visits.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    visits: visits.map(formatVisitResponse),
  };
};

const getVisitById = async (visitId, actor) => {
  const visit = await findVisitById(visitId);

  if (!visit) {
    throw new AppError('Visit not found', 404);
  }

  assertVisitReadable(visit, actor);
  return formatVisitResponse(visit);
};

const createVisit = async (payload, actor) => {
  assertWriteRole(actor);

  const customer = await ensureActiveCustomer(payload.customer);
  const actorId = getActorId(actor);
  const salesRep = await resolveCreateSalesRep({ payload, customer, actor });
  const visit = await Visit.create({
    customer: payload.customer,
    salesRep,
    visitDate: payload.visitDate,
    status: VISIT_STATUSES.PLANNED,
    purpose: payload.purpose,
    notes: payload.notes,
    nextAction: payload.nextAction,
    nextVisitDate: payload.nextVisitDate,
    location: payload.location,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getVisitById(getReferenceId(visit), actor);
};

const updateVisit = async (visitId, payload, actor) => {
  const visit = await Visit.findById(visitId);

  if (!visit) {
    throw new AppError('Visit not found', 404);
  }

  assertVisitWritable(visit, actor);
  assertPlannedVisit(visit);

  if (isSalesRepresentative(actor.role)) {
    if (
      Object.prototype.hasOwnProperty.call(payload, 'customer')
      || Object.prototype.hasOwnProperty.call(payload, 'salesRep')
    ) {
      throw new AppError('Sales representatives cannot change visit customer or sales representative', 403);
    }
  } else if (!isManagerLevel(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  if (payload.customer) {
    await ensureActiveCustomer(payload.customer);
    visit.customer = payload.customer;
  }

  if (payload.salesRep) {
    await ensureActiveSalesRep(payload.salesRep);
    visit.salesRep = payload.salesRep;
  }

  for (const field of ['visitDate', 'purpose', 'notes', 'nextAction', 'nextVisitDate', 'location']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      visit[field] = payload[field];
    }
  }

  visit.updatedBy = getActorId(actor);
  await visit.save();

  return getVisitById(visitId, actor);
};

const completeVisit = async (visitId, payload, actor) => {
  const visit = await Visit.findById(visitId);

  if (!visit) {
    throw new AppError('Visit not found', 404);
  }

  assertVisitWritable(visit, actor);
  assertPlannedVisit(visit);

  visit.status = VISIT_STATUSES.COMPLETED;
  visit.outcome = payload.outcome;
  visit.completedAt = new Date();

  for (const field of ['notes', 'nextAction', 'nextVisitDate']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      visit[field] = payload[field];
    }
  }

  visit.updatedBy = getActorId(actor);
  await visit.save();

  return getVisitById(visitId, actor);
};

const cancelVisit = async (visitId, payload, actor) => {
  const visit = await Visit.findById(visitId);

  if (!visit) {
    throw new AppError('Visit not found', 404);
  }

  assertVisitWritable(visit, actor);
  assertPlannedVisit(visit);

  visit.status = VISIT_STATUSES.CANCELLED;
  visit.cancelledAt = new Date();

  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    visit.notes = payload.notes;
  }

  visit.updatedBy = getActorId(actor);
  await visit.save();

  return getVisitById(visitId, actor);
};

const listCustomerVisits = async (customerId, query, actor) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  assertCanReadCustomerVisits(customer, actor);

  return listVisits({
    ...query,
    customer: customerId,
  }, actor);
};

module.exports = {
  cancelVisit,
  completeVisit,
  createVisit,
  getVisitById,
  listCustomerVisits,
  listVisits,
  updateVisit,
};
