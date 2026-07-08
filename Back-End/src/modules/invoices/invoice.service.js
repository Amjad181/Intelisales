const { AppError } = require('../../utils/AppError');
const { formatInvoiceResponse, getReferenceId } = require('../../utils/formatInvoiceResponse');
const { generateInvoiceNumber } = require('../../utils/invoiceNumber');
const { USER_ROLES } = require('../../models/User');
const { Customer, CUSTOMER_STATUSES } = require('../customers/customer.model');
const { Product, PRODUCT_STATUSES } = require('../products/product.model');
const { PriceList, PRICE_LIST_STATUSES } = require('../priceLists/priceList.model');
const {
  DISCOUNT_TYPES,
  INVOICE_STATUSES,
  Invoice,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} = require('./invoice.model');

const DEFAULT_TAX_RATE = 8;
const SALES_REP_MAX_DISCOUNT_PERCENTAGE = 5;

const MANAGE_INVOICE_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const READ_ALL_INVOICE_ROLES = [
  ...MANAGE_INVOICE_ROLES,
  USER_ROLES.ACCOUNTANT,
];

const WRITE_INVOICE_ROLES = [
  ...MANAGE_INVOICE_ROLES,
  USER_ROLES.SALES_REPRESENTATIVE,
];

const ARCHIVE_INVOICE_ROLES = MANAGE_INVOICE_ROLES;
const PAYMENT_MANAGEMENT_ROLES = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
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

const isSalesRepresentative = (role) => role === USER_ROLES.SALES_REPRESENTATIVE;
const isReadAllRole = (role) => READ_ALL_INVOICE_ROLES.includes(role);
const isWriteRole = (role) => WRITE_INVOICE_ROLES.includes(role);
const isArchiveRole = (role) => ARCHIVE_INVOICE_ROLES.includes(role);
const isPaymentManagementRole = (role) => PAYMENT_MANAGEMENT_ROLES.includes(role);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const populateInvoiceUsers = (query) => query
  .populate('createdBy', userPopulateSelect)
  .populate('updatedBy', userPopulateSelect)
  .populate('confirmedBy', userPopulateSelect)
  .populate('archivedBy', userPopulateSelect);

const findInvoiceById = (invoiceId) => populateInvoiceUsers(Invoice.findById(invoiceId));

const assertWriteRole = (actor) => {
  if (!isWriteRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertPaymentManagementRole = (actor) => {
  if (!isPaymentManagementRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertInvoiceReadable = (invoice, actor) => {
  if (isSalesRepresentative(actor.role) && getReferenceId(invoice.createdBy) !== getActorId(actor)) {
    throw new AppError('Forbidden', 403);
  }

  if (!isSalesRepresentative(actor.role) && !isReadAllRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertInvoiceWritable = (invoice, actor) => {
  assertWriteRole(actor);

  if (isSalesRepresentative(actor.role) && getReferenceId(invoice.createdBy) !== getActorId(actor)) {
    throw new AppError('Forbidden', 403);
  }
};

const assertDraftInvoice = (invoice) => {
  if (invoice.invoiceStatus !== INVOICE_STATUSES.DRAFT) {
    throw new AppError('Only draft invoices can be changed', 400);
  }
};

const assertInvoiceCanAcceptPayment = (invoice) => {
  if (invoice.invoiceStatus === INVOICE_STATUSES.ARCHIVED) {
    throw new AppError('Archived invoices cannot be updated for payment', 400);
  }

  if (invoice.invoiceStatus !== INVOICE_STATUSES.CONFIRMED) {
    throw new AppError('Only confirmed invoices can be updated for payment', 400);
  }
};

const assertInvoiceCanBeMarkedSent = (invoice) => {
  if (invoice.invoiceStatus === INVOICE_STATUSES.ARCHIVED) {
    throw new AppError('Archived invoices cannot be marked as sent', 400);
  }

  if (invoice.invoiceStatus !== INVOICE_STATUSES.CONFIRMED) {
    throw new AppError('Only confirmed invoices can be marked as sent', 400);
  }

  if (invoice.paymentStatus === PAYMENT_STATUSES.PAID || Number(invoice.remainingAmount || 0) === 0) {
    throw new AppError('Fully paid invoices cannot be marked as sent', 400);
  }
};

const assertSalesRepOwnsCustomer = (customer, actor) => {
  const assignedSalesRepId = getReferenceId(customer.assignedSalesRep);
  const actorId = getActorId(actor);

  if (!assignedSalesRepId || assignedSalesRepId !== actorId) {
    throw new AppError('Forbidden', 403);
  }
};

const findActiveCustomer = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (customer.status !== CUSTOMER_STATUSES.ACTIVE) {
    throw new AppError('Customer must be active to create an invoice', 400);
  }

  return customer;
};

const assertCanCreateForCustomer = (customer, actor) => {
  assertWriteRole(actor);

  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
  }
};

const buildCustomerSnapshot = (customer) => ({
  customerId: getReferenceId(customer),
  name: customer.name,
  shopName: customer.shopName,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
  customerType: customer.customerType,
  paymentType: customer.paymentType,
});

const findActivePriceList = async (customerType) => {
  const priceList = await PriceList.findOne({
    customerType,
    status: PRICE_LIST_STATUSES.ACTIVE,
  }).sort({ updatedAt: -1, createdAt: -1 });

  if (!priceList) {
    throw new AppError('Active price list is required for this customer type', 400);
  }

  return priceList;
};

const findPriceListItem = (priceList, productId) => (
  (priceList.items || []).find((item) => getReferenceId(item.productId) === productId)
);

const getProductTaxRate = (product, fallbackTaxRate) => {
  if (product.taxRate !== undefined && product.taxRate !== null && Number(product.taxRate) > 0) {
    return Number(product.taxRate);
  }

  return fallbackTaxRate;
};

const resolveProductSnapshotItems = async ({
  customer,
  requestedItems,
  invoiceTaxRate = DEFAULT_TAX_RATE,
}) => {
  const priceList = await findActivePriceList(customer.customerType);
  const items = [];

  for (const requestedItem of requestedItems) {
    const productId = requestedItem.productId;
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Invoice product not found', 404);
    }

    if (product.status !== PRODUCT_STATUSES.ACTIVE) {
      throw new AppError('Product must be active to add to invoice', 400);
    }

    const priceListItem = findPriceListItem(priceList, productId);

    if (!priceListItem) {
      throw new AppError('Product price was not found in the active price list', 400);
    }

    const quantity = Number(requestedItem.quantity);
    const unitPrice = Number(priceListItem.price);
    const taxRate = requestedItem.taxRate !== undefined
      ? Number(requestedItem.taxRate)
      : getProductTaxRate(product, invoiceTaxRate);
    const lineSubtotal = roundMoney(quantity * unitPrice);

    items.push({
      productId,
      productCode: product.sku || product.productCode,
      productName: product.name,
      quantity,
      unitPrice,
      lineSubtotal,
      lineDiscountAmount: 0,
      lineTaxableAmount: lineSubtotal,
      taxRate,
      taxAmount: 0,
      lineTotal: lineSubtotal,
      currency: priceListItem.currency || product.currency || 'SYP',
      unit: product.unit,
    });
  }

  return items;
};

const assertSingleCurrency = (items) => {
  const currencies = new Set(items.map((item) => item.currency));

  if (currencies.size > 1) {
    throw new AppError('Invoice items must use the same currency', 400);
  }
};

const resolveDiscount = ({ subtotal, discountType, discountValue }) => {
  if (discountType === DISCOUNT_TYPES.NONE) {
    return {
      discountType: DISCOUNT_TYPES.NONE,
      discountValue: 0,
      discountAmount: 0,
    };
  }

  if (discountType === DISCOUNT_TYPES.AMOUNT) {
    if (discountValue > subtotal) {
      throw new AppError('Discount amount cannot exceed invoice subtotal', 400);
    }

    return {
      discountType,
      discountValue,
      discountAmount: roundMoney(discountValue),
    };
  }

  const discountAmount = roundMoney((subtotal * discountValue) / 100);

  return {
    discountType,
    discountValue,
    discountAmount,
  };
};

const assertSalesRepDiscountLimit = ({
  actor,
  subtotal,
  discountType,
  discountAmount,
  discountValue,
}) => {
  if (!isSalesRepresentative(actor.role) || discountType === DISCOUNT_TYPES.NONE) {
    return;
  }

  const discountPercentage = discountType === DISCOUNT_TYPES.PERCENTAGE
    ? discountValue
    : (subtotal > 0 ? (discountAmount / subtotal) * 100 : 0);

  if (discountPercentage > SALES_REP_MAX_DISCOUNT_PERCENTAGE) {
    throw new AppError('Sales representatives cannot apply discount above 5%', 403);
  }
};

const calculateInvoiceTotals = ({
  items,
  discountType = DISCOUNT_TYPES.NONE,
  discountValue = 0,
  taxRate = DEFAULT_TAX_RATE,
  actor,
}) => {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  assertSingleCurrency(items);

  const resolvedDiscount = resolveDiscount({
    subtotal,
    discountType,
    discountValue,
  });

  assertSalesRepDiscountLimit({
    actor,
    subtotal,
    ...resolvedDiscount,
  });

  const taxableAmount = roundMoney(Math.max(subtotal - resolvedDiscount.discountAmount, 0));
  let taxAmount = 0;
  let allocatedDiscountAmount = 0;
  let allocatedTaxableAmount = 0;
  let allocatedLineTotal = 0;

  const calculatedItems = items.map((item, index) => {
    const isLastItem = index === items.length - 1;
    const itemDiscountAmount = isLastItem
      ? roundMoney(resolvedDiscount.discountAmount - allocatedDiscountAmount)
      : roundMoney(
        subtotal > 0
          ? (resolvedDiscount.discountAmount * item.lineSubtotal) / subtotal
          : 0,
      );
    const itemTaxableAmount = isLastItem
      ? roundMoney(taxableAmount - allocatedTaxableAmount)
      : roundMoney(Math.max(item.lineSubtotal - itemDiscountAmount, 0));
    const itemTaxAmount = roundMoney((itemTaxableAmount * Number(item.taxRate || 0)) / 100);
    const itemLineTotal = isLastItem
      ? roundMoney(taxableAmount + taxAmount + itemTaxAmount - allocatedLineTotal)
      : roundMoney(itemTaxableAmount + itemTaxAmount);

    allocatedDiscountAmount = roundMoney(allocatedDiscountAmount + itemDiscountAmount);
    allocatedTaxableAmount = roundMoney(allocatedTaxableAmount + itemTaxableAmount);
    allocatedLineTotal = roundMoney(allocatedLineTotal + itemLineTotal);
    taxAmount = roundMoney(taxAmount + itemTaxAmount);

    return {
      ...item,
      lineDiscountAmount: itemDiscountAmount,
      lineTaxableAmount: itemTaxableAmount,
      taxAmount: itemTaxAmount,
      lineTotal: itemLineTotal,
    };
  });

  const totalAmount = roundMoney(taxableAmount + taxAmount);

  return {
    items: calculatedItems,
    subtotal,
    discountType: resolvedDiscount.discountType,
    discountValue: resolvedDiscount.discountValue,
    discountAmount: resolvedDiscount.discountAmount,
    taxableAmount,
    taxRate,
    taxAmount,
    totalAmount,
    paidAmount: 0,
    remainingAmount: totalAmount,
    currency: calculatedItems[0]?.currency || 'SYP',
  };
};

const buildInvoicePricing = async ({
  customer,
  requestedItems,
  discountType,
  discountValue,
  actor,
}) => {
  const taxRate = DEFAULT_TAX_RATE;
  const items = await resolveProductSnapshotItems({
    customer,
    requestedItems,
    invoiceTaxRate: taxRate,
  });

  return calculateInvoiceTotals({
    items,
    discountType,
    discountValue,
    taxRate,
    actor,
  });
};

const buildFilters = (query, actor) => {
  const filters = {};

  if (query.invoiceStatus) {
    filters.invoiceStatus = query.invoiceStatus;
  }

  if (query.paymentStatus) {
    filters.paymentStatus = query.paymentStatus;
  }

  if (query.customerId) {
    filters.customerId = query.customerId;
  }

  if (isSalesRepresentative(actor.role)) {
    filters.createdBy = getActorId(actor);
  } else if (query.createdBy) {
    filters.createdBy = query.createdBy;
  }

  if (query.dateFrom || query.dateTo) {
    filters.createdAt = {};

    if (query.dateFrom) {
      filters.createdAt.$gte = query.dateFrom;
    }

    if (query.dateTo) {
      filters.createdAt.$lte = query.dateTo;
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegex(query.search), 'i');
    filters.$or = [
      { invoiceNumber: searchRegex },
      { 'customerSnapshot.name': searchRegex },
      { notes: searchRegex },
    ];
  }

  return filters;
};

const listInvoices = async (query, actor) => {
  if (!isSalesRepresentative(actor.role) && !isReadAllRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filters = buildFilters(query, actor);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [query.sortBy || 'createdAt']: sortDirection };

  const [invoices, total] = await Promise.all([
    populateInvoiceUsers(Invoice.find(filters))
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filters),
  ]);

  return {
    count: invoices.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    invoices: invoices.map(formatInvoiceResponse),
  };
};

const getInvoiceById = async (invoiceId, actor) => {
  const invoice = await findInvoiceById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  assertInvoiceReadable(invoice, actor);

  return formatInvoiceResponse(invoice);
};

const getInvoiceDocumentForRead = async (invoiceId, actor) => {
  const invoice = await findInvoiceById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  assertInvoiceReadable(invoice, actor);

  return invoice;
};

const createInvoice = async (payload, actor) => {
  const customer = await findActiveCustomer(payload.customerId);
  assertCanCreateForCustomer(customer, actor);

  const pricing = await buildInvoicePricing({
    customer,
    requestedItems: payload.items,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    actor,
  });
  const actorId = getActorId(actor);

  const invoice = await Invoice.create({
    customerId: payload.customerId,
    customerSnapshot: buildCustomerSnapshot(customer),
    ...pricing,
    invoiceStatus: INVOICE_STATUSES.DRAFT,
    paymentStatus: PAYMENT_STATUSES.PENDING,
    dueDate: payload.dueDate,
    source: payload.source,
    voiceText: payload.voiceText,
    notes: payload.notes,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getInvoiceById(getReferenceId(invoice), actor);
};

const toRequestedItemsFromInvoice = (invoice) => (invoice.items || []).map((item) => ({
  productId: getReferenceId(item.productId),
  quantity: item.quantity,
  taxRate: item.taxRate,
}));

const updateInvoice = async (invoiceId, payload, actor) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  assertInvoiceWritable(invoice, actor);
  assertDraftInvoice(invoice);

  const discountType = payload.discountType !== undefined ? payload.discountType : invoice.discountType;
  const discountValue = payload.discountValue !== undefined ? payload.discountValue : invoice.discountValue;
  const requestedItems = payload.items || toRequestedItemsFromInvoice(invoice);
  const shouldReprice = payload.items || payload.discountType !== undefined || payload.discountValue !== undefined;

  if (shouldReprice) {
    const customer = await findActiveCustomer(getReferenceId(invoice.customerId));
    const pricing = await buildInvoicePricing({
      customer,
      requestedItems,
      discountType,
      discountValue,
      actor,
    });

    Object.assign(invoice, pricing);
  }

  for (const field of ['dueDate', 'source', 'voiceText', 'notes']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      invoice[field] = payload[field];
    }
  }

  invoice.updatedBy = getActorId(actor);
  await invoice.save();

  return getInvoiceById(invoiceId, actor);
};

const isDuplicateInvoiceNumberError = (error) => (
  error && error.code === 11000
);

const saveWithInvoiceNumber = async (invoice, actor) => {
  const actorId = getActorId(actor);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    invoice.invoiceNumber = await generateInvoiceNumber(Invoice);
    invoice.invoiceStatus = INVOICE_STATUSES.CONFIRMED;
    invoice.confirmedAt = new Date();
    invoice.confirmedBy = actorId;
    invoice.updatedBy = actorId;

    try {
      await invoice.save();
      return;
    } catch (error) {
      if (!isDuplicateInvoiceNumberError(error) || attempt === 2) {
        throw error;
      }
    }
  }
};

const confirmInvoice = async (invoiceId, actor) => {
  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  assertInvoiceWritable(invoice, actor);
  assertDraftInvoice(invoice);
  await saveWithInvoiceNumber(invoice, actor);

  return getInvoiceById(invoiceId, actor);
};

const archiveInvoice = async (invoiceId, actor) => {
  if (!isArchiveRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.invoiceStatus === INVOICE_STATUSES.ARCHIVED) {
    throw new AppError('Invoice is already archived', 400);
  }

  invoice.invoiceStatus = INVOICE_STATUSES.ARCHIVED;
  invoice.archivedAt = new Date();
  invoice.archivedBy = getActorId(actor);
  invoice.updatedBy = getActorId(actor);
  await invoice.save();

  return getInvoiceById(invoiceId, actor);
};

const updateInvoicePayment = async (invoiceId, payload, actor) => {
  assertPaymentManagementRole(actor);

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  assertInvoiceCanAcceptPayment(invoice);

  const paidAmount = roundMoney(payload.paidAmount);
  const totalAmount = roundMoney(invoice.totalAmount || 0);

  if (paidAmount > totalAmount) {
    throw new AppError('Paid amount cannot exceed invoice total', 400);
  }

  const remainingAmount = roundMoney(Math.max(totalAmount - paidAmount, 0));

  invoice.paidAmount = paidAmount;
  invoice.remainingAmount = remainingAmount;
  invoice.paymentMethod = payload.paymentMethod || PAYMENT_METHODS.CASH;

  if (remainingAmount === 0) {
    invoice.paymentStatus = PAYMENT_STATUSES.PAID;
  } else if (invoice.paymentStatus !== PAYMENT_STATUSES.SENT) {
    invoice.paymentStatus = PAYMENT_STATUSES.PENDING;
  }

  invoice.updatedBy = getActorId(actor);
  await invoice.save();

  return getInvoiceById(invoiceId, actor);
};

const markInvoiceSent = async (invoiceId, actor) => {
  assertPaymentManagementRole(actor);

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  assertInvoiceCanBeMarkedSent(invoice);

  invoice.paymentStatus = PAYMENT_STATUSES.SENT;
  invoice.sentAt = new Date();
  invoice.updatedBy = getActorId(actor);
  await invoice.save();

  return getInvoiceById(invoiceId, actor);
};

const listCustomerInvoices = async (customerId, query, actor) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (isSalesRepresentative(actor.role)) {
    assertSalesRepOwnsCustomer(customer, actor);
  } else if (!isReadAllRole(actor.role)) {
    throw new AppError('Forbidden', 403);
  }

  return listInvoices({
    ...query,
    customerId,
  }, actor);
};

module.exports = {
  archiveInvoice,
  createInvoice,
  getInvoiceById,
  getInvoiceDocumentForRead,
  listCustomerInvoices,
  listInvoices,
  markInvoiceSent,
  updateInvoice,
  updateInvoicePayment,
  confirmInvoice,
};
