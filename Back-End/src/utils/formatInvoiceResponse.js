const { formatUserResponse } = require('./formatUserResponse');

const isUserLike = (value) => Boolean(
  value
    && typeof value === 'object'
    && (
      Object.prototype.hasOwnProperty.call(value, 'email')
      || Object.prototype.hasOwnProperty.call(value, 'role')
      || Object.prototype.hasOwnProperty.call(value, 'name')
    ),
);

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

const formatReference = (value) => {
  if (!value) {
    return value;
  }

  if (isUserLike(value)) {
    return formatUserResponse(value);
  }

  return getReferenceId(value);
};

const formatInvoiceItem = (item) => ({
  productId: getReferenceId(item.productId),
  productCode: item.productCode,
  productName: item.productName,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  lineSubtotal: item.lineSubtotal,
  lineDiscountAmount: item.lineDiscountAmount,
  lineTaxableAmount: item.lineTaxableAmount,
  taxRate: item.taxRate,
  taxAmount: item.taxAmount,
  lineTotal: item.lineTotal,
  currency: item.currency,
  unit: item.unit,
});

const formatCustomerSnapshot = (snapshot) => {
  if (!snapshot) {
    return snapshot;
  }

  return {
    customerId: getReferenceId(snapshot.customerId),
    name: snapshot.name,
    shopName: snapshot.shopName,
    phone: snapshot.phone,
    email: snapshot.email,
    address: snapshot.address,
    customerType: snapshot.customerType,
    paymentType: snapshot.paymentType,
  };
};

const formatInvoiceResponse = (invoice) => {
  if (!invoice) {
    return invoice;
  }

  const plainInvoice = typeof invoice.toJSON === 'function'
    ? invoice.toJSON()
    : { ...invoice };
  const id = plainInvoice.id || getReferenceId(plainInvoice._id);

  return {
    id,
    invoiceNumber: plainInvoice.invoiceNumber,
    customerId: getReferenceId(plainInvoice.customerId),
    customerSnapshot: formatCustomerSnapshot(plainInvoice.customerSnapshot),
    items: (plainInvoice.items || []).map(formatInvoiceItem),
    subtotal: plainInvoice.subtotal,
    discountType: plainInvoice.discountType,
    discountValue: plainInvoice.discountValue,
    discountAmount: plainInvoice.discountAmount,
    taxableAmount: plainInvoice.taxableAmount,
    taxRate: plainInvoice.taxRate,
    taxAmount: plainInvoice.taxAmount,
    totalAmount: plainInvoice.totalAmount,
    paidAmount: plainInvoice.paidAmount,
    remainingAmount: plainInvoice.remainingAmount,
    currency: plainInvoice.currency,
    invoiceStatus: plainInvoice.invoiceStatus,
    paymentStatus: plainInvoice.paymentStatus,
    paymentMethod: plainInvoice.paymentMethod,
    sentAt: plainInvoice.sentAt,
    dueDate: plainInvoice.dueDate,
    source: plainInvoice.source,
    voiceText: plainInvoice.voiceText,
    notes: plainInvoice.notes,
    createdBy: formatReference(plainInvoice.createdBy),
    updatedBy: formatReference(plainInvoice.updatedBy),
    confirmedBy: formatReference(plainInvoice.confirmedBy),
    confirmedAt: plainInvoice.confirmedAt,
    archivedBy: formatReference(plainInvoice.archivedBy),
    archivedAt: plainInvoice.archivedAt,
    createdAt: plainInvoice.createdAt,
    updatedAt: plainInvoice.updatedAt,
  };
};

module.exports = { formatInvoiceResponse, getReferenceId };
