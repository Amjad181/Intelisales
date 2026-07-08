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

const formatReference = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (isUserLike(value)) {
    return formatUserResponse(value);
  }

  if (value.id && typeof value.id === 'string') {
    return value.id;
  }

  if (value._id && typeof value._id.toString === 'function') {
    return value._id.toString();
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return value;
};

const formatCustomerResponse = (customer) => {
  if (!customer) {
    return customer;
  }

  const plainCustomer = typeof customer.toJSON === 'function'
    ? customer.toJSON()
    : { ...customer };
  const id = plainCustomer.id || (
    plainCustomer._id && typeof plainCustomer._id.toString === 'function'
      ? plainCustomer._id.toString()
      : undefined
  );

  return {
    id,
    name: plainCustomer.name,
    contactName: plainCustomer.contactName,
    phone: plainCustomer.phone,
    email: plainCustomer.email,
    address: plainCustomer.address,
    notes: plainCustomer.notes,
    assignedSalesRep: formatReference(plainCustomer.assignedSalesRep),
    customerType: plainCustomer.customerType,
    paymentType: plainCustomer.paymentType,
    status: plainCustomer.status,
    createdBy: formatReference(plainCustomer.createdBy),
    updatedBy: formatReference(plainCustomer.updatedBy),
    createdAt: plainCustomer.createdAt,
    updatedAt: plainCustomer.updatedAt,
  };
};

module.exports = { formatCustomerResponse };
