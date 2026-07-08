const { AppError } = require('../../utils/AppError');
const { formatCustomerResponse } = require('../../utils/formatCustomerResponse');
const { User, USER_ROLES, USER_STATUSES } = require('../../models/User');
const { INVOICE_STATUSES, Invoice, PAYMENT_STATUSES } = require('../invoices/invoice.model');
const { Customer, CUSTOMER_STATUSES } = require('./customer.model');

const MANAGE_CUSTOMER_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const ALL_CUSTOMER_READ_ROLES = [
  ...MANAGE_CUSTOMER_ROLES,
  USER_ROLES.ACCOUNTANT,
];

const userPopulateSelect = 'name email role status createdAt updatedAt';

const getActorId = (actor) => {
  if (actor.id) {
    return actor.id.toString();
  }

  if (actor._id && typeof actor._id.toString === 'function') {
    return actor._id.toString();
  }

  return actor.toString();
};

const getReferenceId = (reference) => {
  if (!reference) {
    return undefined;
  }

  if (typeof reference === 'string') {
    return reference;
  }

  if (reference._id && typeof reference._id.toString === 'function') {
    return reference._id.toString();
  }

  if (
    typeof reference.toString === 'function'
    && reference.toString !== Object.prototype.toString
  ) {
    return reference.toString();
  }

  if (reference.id && typeof reference.id === 'string') {
    return reference.id;
  }

  return undefined;
};

const isManagerLevel = (role) => MANAGE_CUSTOMER_ROLES.includes(role);
const isAllCustomerReader = (role) => ALL_CUSTOMER_READ_ROLES.includes(role);
const isSalesRepresentative = (role) => role === USER_ROLES.SALES_REPRESENTATIVE;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const populateCustomerUsers = (query) => query
  .populate('assignedSalesRep', userPopulateSelect)
  .populate('createdBy', userPopulateSelect)
  .populate('updatedBy', userPopulateSelect);

const findCustomerById = (customerId) => populateCustomerUsers(Customer.findById(customerId));

const assertSalesRepOwnsCustomer = (customer, actor) => {
  const assignedSalesRepId = getReferenceId(customer.assignedSalesRep);
  const actorId = getActorId(actor);

  if (!assignedSalesRepId || assignedSalesRepId !== actorId) {
    throw new AppError('Forbidden', 403);
  }
};

const assertCanReadCustomerBalance = (customer, actor) => {
  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
    return;
  }

  if (!isAllCustomerReader(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const ensureActiveSalesRep = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('Assigned sales representative not found', 404);
  }

  if (user.role !== USER_ROLES.SALES_REPRESENTATIVE) {
    throw new AppError('Assigned user must be a sales representative', 400);
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AppError('Assigned sales representative must be active', 400);
  }

  return user;
};

const buildCustomerFilters = (query, actor) => {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.customerType) {
    filters.customerType = query.customerType;
  }

  if (query.paymentType) {
    filters.paymentType = query.paymentType;
  }

  if (query.city) {
    filters['address.city'] = new RegExp(escapeRegex(query.city), 'i');
  }

  if (query.assignedSalesRep && isAllCustomerReader(actor.role)) {
    filters.assignedSalesRep = query.assignedSalesRep;
  }

  if (isSalesRepresentative(actor.role)) {
    filters.assignedSalesRep = getActorId(actor);
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    filters.$or = [
      { name: searchRegex },
      { contactName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { 'address.city': searchRegex },
    ];
  }

  return filters;
};

const listCustomers = async (query, actor) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filters = buildCustomerFilters(query, actor);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sortField = query.sortBy === 'city' ? 'address.city' : (query.sortBy || 'createdAt');
  const sort = { [sortField]: sortDirection };

  const [customers, total] = await Promise.all([
    populateCustomerUsers(Customer.find(filters))
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(filters),
  ]);

  return {
    count: customers.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    customers: customers.map(formatCustomerResponse),
  };
};

const getCustomerById = async (customerId, actor) => {
  const customer = await findCustomerById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
  }

  return formatCustomerResponse(customer);
};

const createCustomer = async (payload, actor) => {
  const actorId = getActorId(actor);
  const customerPayload = {
    name: payload.name,
    contactName: payload.contactName,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    notes: payload.notes,
    customerType: payload.customerType,
    paymentType: payload.paymentType,
    createdBy: actorId,
    updatedBy: actorId,
  };

  if (isManagerLevel(actor.role)) {
    customerPayload.status = payload.status || CUSTOMER_STATUSES.ACTIVE;

    if (payload.assignedSalesRep) {
      await ensureActiveSalesRep(payload.assignedSalesRep);
      customerPayload.assignedSalesRep = payload.assignedSalesRep;
    }
  } else if (isSalesRepresentative(actor.role)) {
    customerPayload.status = CUSTOMER_STATUSES.ACTIVE;
    customerPayload.assignedSalesRep = actorId;
  } else {
    throw new AppError('Forbidden', 403);
  }

  const customer = await Customer.create(customerPayload);
  return getCustomerById(getReferenceId(customer), actor);
};

const updateCustomer = async (customerId, payload, actor) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  let allowedFields = [
    'name',
    'contactName',
    'phone',
    'email',
    'address',
    'notes',
    'customerType',
    'paymentType',
    'status',
  ];

  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
    allowedFields = ['contactName', 'phone', 'email', 'address', 'notes'];

    const forbiddenFields = ['name', 'customerType', 'paymentType', 'status'].filter((field) => (
      Object.prototype.hasOwnProperty.call(payload, field)
    ));

    if (forbiddenFields.length > 0) {
      throw new AppError('Sales representatives cannot update this customer field', 403);
    }
  } else if (!isManagerLevel(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      customer[field] = payload[field];
    }
  }

  customer.updatedBy = getActorId(actor);
  await customer.save();

  return getCustomerById(customerId, actor);
};

const assignCustomer = async (customerId, assignedSalesRep, actor) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  await ensureActiveSalesRep(assignedSalesRep);

  customer.assignedSalesRep = assignedSalesRep;
  customer.updatedBy = getActorId(actor);
  await customer.save();

  return getCustomerById(customerId, actor);
};

const deactivateCustomer = async (customerId, actor) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  customer.status = CUSTOMER_STATUSES.INACTIVE;
  customer.updatedBy = getActorId(actor);
  await customer.save();

  return getCustomerById(customerId, actor);
};

const isInvoiceOverdue = (invoice, now = new Date()) => Boolean(
  invoice.dueDate
    && new Date(invoice.dueDate).getTime() < now.getTime()
    && invoice.paymentStatus !== PAYMENT_STATUSES.PAID
    && Number(invoice.remainingAmount || 0) > 0,
);

const formatBalanceInvoice = (invoice, now) => ({
  id: getReferenceId(invoice),
  invoiceNumber: invoice.invoiceNumber,
  totalAmount: invoice.totalAmount,
  paidAmount: invoice.paidAmount,
  remainingAmount: invoice.remainingAmount,
  currency: invoice.currency,
  paymentStatus: invoice.paymentStatus,
  dueDate: invoice.dueDate,
  isOverdue: isInvoiceOverdue(invoice, now),
});

const buildCustomerBalanceSummary = (invoices, now) => {
  const balances = new Map();
  let overdueInvoiceCount = 0;

  for (const invoice of invoices) {
    const currency = invoice.currency || 'SYP';
    const remainingAmount = roundMoney(invoice.remainingAmount || 0);
    const isOverdue = isInvoiceOverdue(invoice, now);
    const current = balances.get(currency) || {
      currency,
      totalBalance: 0,
      invoiceCount: 0,
      overdueBalance: 0,
      overdueInvoiceCount: 0,
    };

    current.totalBalance = roundMoney(current.totalBalance + remainingAmount);
    current.invoiceCount += 1;

    if (isOverdue) {
      current.overdueBalance = roundMoney(current.overdueBalance + remainingAmount);
      current.overdueInvoiceCount += 1;
      overdueInvoiceCount += 1;
    }

    balances.set(currency, current);
  }

  const balancesByCurrency = Array.from(balances.values());

  if (balancesByCurrency.length <= 1) {
    const onlyBalance = balancesByCurrency[0] || {
      currency: 'SYP',
      totalBalance: 0,
      invoiceCount: 0,
      overdueBalance: 0,
      overdueInvoiceCount: 0,
    };

    return {
      currency: onlyBalance.currency,
      totalBalance: onlyBalance.totalBalance,
      invoiceCount: onlyBalance.invoiceCount,
      overdueBalance: onlyBalance.overdueBalance,
      overdueInvoiceCount: onlyBalance.overdueInvoiceCount,
      balancesByCurrency,
    };
  }

  return {
    invoiceCount: invoices.length,
    overdueInvoiceCount,
    balancesByCurrency,
  };
};

const getCustomerBalance = async (customerId, actor) => {
  const customer = await findCustomerById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  assertCanReadCustomerBalance(customer, actor);

  const invoices = await Invoice.find({
    customerId,
    invoiceStatus: INVOICE_STATUSES.CONFIRMED,
    paymentStatus: { $ne: PAYMENT_STATUSES.PAID },
    remainingAmount: { $gt: 0 },
  }).sort({ dueDate: 1, createdAt: 1 });
  const now = new Date();
  const formattedCustomer = formatCustomerResponse(customer);

  return {
    customer: {
      id: formattedCustomer.id,
      name: formattedCustomer.name,
      customerType: formattedCustomer.customerType,
    },
    balance: buildCustomerBalanceSummary(invoices, now),
    invoices: invoices.map((invoice) => formatBalanceInvoice(invoice, now)),
  };
};

module.exports = {
  assignCustomer,
  createCustomer,
  deactivateCustomer,
  getCustomerBalance,
  getCustomerById,
  listCustomers,
  updateCustomer,
};
