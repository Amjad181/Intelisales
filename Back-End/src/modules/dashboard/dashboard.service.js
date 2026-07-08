const { USER_ROLES, USER_STATUSES, User } = require('../../models/User');
const { Customer, CUSTOMER_STATUSES, CUSTOMER_TYPES } = require('../customers/customer.model');
const { Product, PRODUCT_STATUSES } = require('../products/product.model');
const { INVOICE_STATUSES, Invoice, PAYMENT_STATUSES } = require('../invoices/invoice.model');
const { VISIT_STATUSES, Visit } = require('../visits/visit.model');
const { formatUserResponse } = require('../../utils/formatUserResponse');

const MANAGEMENT_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const FINANCIAL_READ_ROLES = [
  ...MANAGEMENT_ROLES,
  USER_ROLES.ACCOUNTANT,
];

const RECENT_LIMIT = 5;
const DEFAULT_CURRENCY = 'SYP';

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

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
    return reference;
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

  return reference;
};

const isManagementRole = (role) => MANAGEMENT_ROLES.includes(role);
const isFinancialReadRole = (role) => FINANCIAL_READ_ROLES.includes(role);
const isSalesRepresentative = (role) => role === USER_ROLES.SALES_REPRESENTATIVE;

const getScopedCustomerIds = async (actor) => {
  if (!isSalesRepresentative(actor.role)) {
    return undefined;
  }

  const customers = await Customer.find({ assignedSalesRep: getActorId(actor) }).select('_id');
  return customers.map(getReferenceId);
};

const getCustomerScopeFilter = (actor) => (
  isSalesRepresentative(actor.role)
    ? { assignedSalesRep: getActorId(actor) }
    : {}
);

const getProductScopeFilter = (actor) => (
  isManagementRole(actor.role)
    ? {}
    : { status: PRODUCT_STATUSES.ACTIVE }
);

const getInvoiceScopeFilter = ({ actor, scopedCustomerIds = [] }) => {
  if (!isSalesRepresentative(actor.role)) {
    return {};
  }

  return {
    $or: [
      { createdBy: getActorId(actor) },
      { customerId: { $in: scopedCustomerIds } },
    ],
  };
};

const getVisitScopeFilter = (actor) => (
  isSalesRepresentative(actor.role)
    ? { salesRep: getActorId(actor) }
    : {}
);

const mergeFilters = (...filters) => {
  const meaningfulFilters = filters.filter((filter) => filter && Object.keys(filter).length > 0);

  if (meaningfulFilters.length === 0) {
    return {};
  }

  if (meaningfulFilters.length === 1) {
    return meaningfulFilters[0];
  }

  return { $and: meaningfulFilters };
};

const sumFields = (items, fields) => items.reduce((totals, item) => {
  for (const field of fields) {
    totals[field] = roundMoney((totals[field] || 0) + Number(item[field] || 0));
  }

  return totals;
}, {});

const buildCustomerSummary = async (actor) => {
  const scopeFilter = getCustomerScopeFilter(actor);
  const byType = {};

  for (const customerType of Object.values(CUSTOMER_TYPES)) {
    byType[customerType] = await Customer.countDocuments({
      ...scopeFilter,
      customerType,
    });
  }

  const [total, active, inactive] = await Promise.all([
    Customer.countDocuments(scopeFilter),
    Customer.countDocuments({ ...scopeFilter, status: CUSTOMER_STATUSES.ACTIVE }),
    Customer.countDocuments({ ...scopeFilter, status: CUSTOMER_STATUSES.INACTIVE }),
  ]);

  return {
    total,
    active,
    inactive,
    byType,
  };
};

const buildProductSummary = async (actor) => {
  if (isManagementRole(actor.role)) {
    const [total, active, inactive] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ status: PRODUCT_STATUSES.ACTIVE }),
      Product.countDocuments({ status: PRODUCT_STATUSES.INACTIVE }),
    ]);

    return { total, active, inactive };
  }

  const active = await Product.countDocuments(getProductScopeFilter(actor));

  return {
    total: active,
    active,
    inactive: 0,
  };
};

const buildInvoiceSummary = async (scopeFilter) => {
  const now = new Date();
  const confirmedFilter = mergeFilters(scopeFilter, { invoiceStatus: INVOICE_STATUSES.CONFIRMED });
  const unpaidConfirmedFilter = mergeFilters(confirmedFilter, { paymentStatus: { $ne: PAYMENT_STATUSES.PAID } });
  const overdueFilter = mergeFilters(unpaidConfirmedFilter, { dueDate: { $lt: now } });

  const [
    total,
    draft,
    confirmed,
    archived,
    sent,
    paid,
    pending,
    confirmedInvoices,
    unpaidConfirmedInvoices,
    overdueInvoices,
  ] = await Promise.all([
    Invoice.countDocuments(scopeFilter),
    Invoice.countDocuments(mergeFilters(scopeFilter, { invoiceStatus: INVOICE_STATUSES.DRAFT })),
    Invoice.countDocuments(confirmedFilter),
    Invoice.countDocuments(mergeFilters(scopeFilter, { invoiceStatus: INVOICE_STATUSES.ARCHIVED })),
    Invoice.countDocuments(mergeFilters(scopeFilter, { paymentStatus: PAYMENT_STATUSES.SENT })),
    Invoice.countDocuments(mergeFilters(scopeFilter, { paymentStatus: PAYMENT_STATUSES.PAID })),
    Invoice.countDocuments(mergeFilters(scopeFilter, { paymentStatus: PAYMENT_STATUSES.PENDING })),
    Invoice.find(confirmedFilter),
    Invoice.find(unpaidConfirmedFilter),
    Invoice.find(overdueFilter),
  ]);
  const confirmedTotals = sumFields(confirmedInvoices, ['totalAmount', 'paidAmount']);
  const unpaidTotals = sumFields(unpaidConfirmedInvoices, ['remainingAmount']);
  const overdueTotals = sumFields(overdueInvoices, ['remainingAmount']);

  return {
    total,
    draft,
    confirmed,
    archived,
    sent,
    paid,
    pending,
    totalAmount: roundMoney(confirmedTotals.totalAmount),
    paidAmount: roundMoney(confirmedTotals.paidAmount),
    remainingAmount: roundMoney(unpaidTotals.remainingAmount),
    overdueAmount: roundMoney(overdueTotals.remainingAmount),
    currency: DEFAULT_CURRENCY,
  };
};

const buildVisitSummary = async (scopeFilter) => {
  const now = new Date();
  const plannedFilter = mergeFilters(scopeFilter, { status: VISIT_STATUSES.PLANNED });

  const [
    total,
    planned,
    completed,
    cancelled,
    upcoming,
    overdue,
  ] = await Promise.all([
    Visit.countDocuments(scopeFilter),
    Visit.countDocuments(plannedFilter),
    Visit.countDocuments(mergeFilters(scopeFilter, { status: VISIT_STATUSES.COMPLETED })),
    Visit.countDocuments(mergeFilters(scopeFilter, { status: VISIT_STATUSES.CANCELLED })),
    Visit.countDocuments(mergeFilters(plannedFilter, { visitDate: { $gte: now } })),
    Visit.countDocuments(mergeFilters(plannedFilter, { visitDate: { $lt: now } })),
  ]);

  return {
    total,
    planned,
    completed,
    cancelled,
    upcoming,
    overdue,
  };
};

const formatInvoiceSummary = (invoice) => ({
  id: getReferenceId(invoice),
  invoiceNumber: invoice.invoiceNumber,
  customerId: getReferenceId(invoice.customerId),
  customerName: invoice.customerSnapshot?.name,
  invoiceStatus: invoice.invoiceStatus,
  paymentStatus: invoice.paymentStatus,
  totalAmount: invoice.totalAmount,
  paidAmount: invoice.paidAmount,
  remainingAmount: invoice.remainingAmount,
  currency: invoice.currency || DEFAULT_CURRENCY,
  dueDate: invoice.dueDate,
  createdBy: getReferenceId(invoice.createdBy),
  createdAt: invoice.createdAt,
  confirmedAt: invoice.confirmedAt,
  updatedAt: invoice.updatedAt,
});

const formatCustomerSummary = (customer) => {
  if (!customer || typeof customer !== 'object') {
    return getReferenceId(customer);
  }

  return {
    id: getReferenceId(customer),
    name: customer.name,
    contactName: customer.contactName,
    phone: customer.phone,
    customerType: customer.customerType,
    status: customer.status,
  };
};

const formatVisitSummary = (visit) => ({
  id: getReferenceId(visit),
  customer: formatCustomerSummary(visit.customer),
  salesRep: getReferenceId(visit.salesRep),
  visitDate: visit.visitDate,
  status: visit.status,
  purpose: visit.purpose,
  outcome: visit.outcome,
  completedAt: visit.completedAt,
  cancelledAt: visit.cancelledAt,
  createdAt: visit.createdAt,
  updatedAt: visit.updatedAt,
});

const findRecentInvoices = (scopeFilter, limit = RECENT_LIMIT) => (
  Invoice.find(scopeFilter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
);

const findRecentVisits = (scopeFilter, limit = RECENT_LIMIT) => (
  Visit.find(scopeFilter)
    .populate('customer', 'name contactName phone customerType status')
    .sort({ updatedAt: -1, visitDate: -1 })
    .limit(limit)
);

const buildRecentSummary = async ({ invoiceScopeFilter, visitScopeFilter }) => {
  const [invoices, visits] = await Promise.all([
    findRecentInvoices(invoiceScopeFilter),
    findRecentVisits(visitScopeFilter),
  ]);

  return {
    invoices: invoices.map(formatInvoiceSummary),
    visits: visits.map(formatVisitSummary),
  };
};

const getDashboardSummary = async (actor) => {
  const scopedCustomerIds = await getScopedCustomerIds(actor);
  const invoiceScopeFilter = getInvoiceScopeFilter({ actor, scopedCustomerIds });
  const visitScopeFilter = getVisitScopeFilter(actor);
  const [
    customers,
    products,
    invoices,
    visits,
    recent,
  ] = await Promise.all([
    buildCustomerSummary(actor),
    buildProductSummary(actor),
    buildInvoiceSummary(invoiceScopeFilter),
    buildVisitSummary(visitScopeFilter),
    buildRecentSummary({ invoiceScopeFilter, visitScopeFilter }),
  ]);

  return {
    scope: isSalesRepresentative(actor.role) ? 'OWN' : 'ALL',
    generatedAt: new Date().toISOString(),
    customers,
    products,
    invoices,
    visits,
    recent,
  };
};

const activityTimestamp = (item, fallbackField = 'updatedAt') => (
  item.timestamp || item[fallbackField] || item.createdAt || new Date(0)
);

const buildInvoiceActivity = (invoice) => {
  if (invoice.invoiceStatus === INVOICE_STATUSES.CONFIRMED && invoice.confirmedAt) {
    return {
      type: 'INVOICE_CONFIRMED',
      title: `Invoice ${invoice.invoiceNumber || getReferenceId(invoice)} confirmed`,
      timestamp: invoice.confirmedAt,
      entityId: getReferenceId(invoice),
      entityType: 'invoice',
    };
  }

  if (Number(invoice.paidAmount || 0) > 0 || invoice.paymentStatus === PAYMENT_STATUSES.PAID) {
    return {
      type: 'PAYMENT_UPDATED',
      title: `Payment updated for invoice ${invoice.invoiceNumber || getReferenceId(invoice)}`,
      timestamp: invoice.updatedAt || invoice.createdAt,
      entityId: getReferenceId(invoice),
      entityType: 'invoice',
    };
  }

  return {
    type: 'INVOICE_CREATED',
    title: `Invoice ${invoice.invoiceNumber || getReferenceId(invoice)} created`,
    timestamp: invoice.createdAt,
    entityId: getReferenceId(invoice),
    entityType: 'invoice',
  };
};

const buildVisitActivity = (visit) => ({
  type: visit.status === VISIT_STATUSES.COMPLETED ? 'VISIT_COMPLETED' : 'VISIT_CREATED',
  title: visit.status === VISIT_STATUSES.COMPLETED
    ? 'Visit completed'
    : 'Visit planned',
  timestamp: visit.completedAt || visit.updatedAt || visit.createdAt,
  entityId: getReferenceId(visit),
  entityType: 'visit',
});

const getRecentActivity = async (query, actor) => {
  const limit = Number(query.limit || 10);
  const scopedCustomerIds = await getScopedCustomerIds(actor);
  const invoiceScopeFilter = getInvoiceScopeFilter({ actor, scopedCustomerIds });
  const visitScopeFilter = getVisitScopeFilter(actor);
  const [invoices, visits] = await Promise.all([
    findRecentInvoices(invoiceScopeFilter, limit),
    Visit.find(visitScopeFilter)
      .sort({ updatedAt: -1, completedAt: -1, createdAt: -1 })
      .limit(limit),
  ]);
  const activity = [
    ...invoices.map(buildInvoiceActivity),
    ...visits.map(buildVisitActivity),
  ]
    .sort((left, right) => (
      new Date(activityTimestamp(right)).getTime() - new Date(activityTimestamp(left)).getTime()
    ))
    .slice(0, limit);

  return activity;
};

const getSalesRepDashboard = async () => {
  const salesReps = await User.find({
    role: USER_ROLES.SALES_REPRESENTATIVE,
  }).sort({ name: 1 });

  const summaries = [];

  for (const salesRep of salesReps) {
    const salesRepId = getReferenceId(salesRep);
    const invoiceScopeFilter = { createdBy: salesRepId };
    const confirmedInvoiceFilter = {
      ...invoiceScopeFilter,
      invoiceStatus: INVOICE_STATUSES.CONFIRMED,
    };
    const [
      assignedCustomers,
      invoiceCount,
      confirmedInvoiceCount,
      confirmedInvoices,
      visitCount,
      completedVisitCount,
    ] = await Promise.all([
      Customer.countDocuments({ assignedSalesRep: salesRepId }),
      Invoice.countDocuments(invoiceScopeFilter),
      Invoice.countDocuments(confirmedInvoiceFilter),
      Invoice.find(confirmedInvoiceFilter),
      Visit.countDocuments({ salesRep: salesRepId }),
      Visit.countDocuments({ salesRep: salesRepId, status: VISIT_STATUSES.COMPLETED }),
    ]);
    const invoiceTotals = sumFields(confirmedInvoices, ['totalAmount', 'paidAmount', 'remainingAmount']);
    const safeSalesRep = formatUserResponse(salesRep);

    summaries.push({
      id: safeSalesRep.id,
      name: safeSalesRep.name,
      email: safeSalesRep.email,
      status: safeSalesRep.status || USER_STATUSES.ACTIVE,
      assignedCustomers,
      invoiceCount,
      confirmedInvoiceCount,
      totalSalesAmount: roundMoney(invoiceTotals.totalAmount),
      paidAmount: roundMoney(invoiceTotals.paidAmount),
      remainingAmount: roundMoney(invoiceTotals.remainingAmount),
      visitCount,
      completedVisitCount,
    });
  }

  return summaries;
};

const canReadSalesRepDashboard = (actor) => isManagementRole(actor.role);

const canReadDashboard = (actor) => (
  isFinancialReadRole(actor.role) || isSalesRepresentative(actor.role)
);

module.exports = {
  canReadDashboard,
  canReadSalesRepDashboard,
  getDashboardSummary,
  getRecentActivity,
  getSalesRepDashboard,
};
