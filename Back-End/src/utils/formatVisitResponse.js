const { formatUserResponse } = require('./formatUserResponse');

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

const isUserLike = (value) => Boolean(
  value
    && typeof value === 'object'
    && (
      Object.prototype.hasOwnProperty.call(value, 'email')
      || Object.prototype.hasOwnProperty.call(value, 'role')
      || Object.prototype.hasOwnProperty.call(value, 'name')
    ),
);

const isCustomerLike = (value) => Boolean(
  value
    && typeof value === 'object'
    && (
      Object.prototype.hasOwnProperty.call(value, 'contactName')
      || Object.prototype.hasOwnProperty.call(value, 'customerType')
      || Object.prototype.hasOwnProperty.call(value, 'phone')
    ),
);

const formatCustomerSummary = (customer) => {
  if (!customer) {
    return customer;
  }

  if (!isCustomerLike(customer)) {
    return getReferenceId(customer);
  }

  const plainCustomer = typeof customer.toJSON === 'function'
    ? customer.toJSON()
    : { ...customer };

  return {
    id: plainCustomer.id || getReferenceId(plainCustomer._id),
    name: plainCustomer.name,
    contactName: plainCustomer.contactName,
    phone: plainCustomer.phone,
    customerType: plainCustomer.customerType,
    status: plainCustomer.status,
  };
};

const formatUserSummary = (user) => {
  if (!user) {
    return user;
  }

  if (!isUserLike(user)) {
    return getReferenceId(user);
  }

  return formatUserResponse(user);
};

const formatVisitResponse = (visit) => {
  if (!visit) {
    return visit;
  }

  const plainVisit = typeof visit.toJSON === 'function'
    ? visit.toJSON()
    : { ...visit };

  return {
    id: plainVisit.id || getReferenceId(plainVisit._id),
    customer: formatCustomerSummary(plainVisit.customer),
    salesRep: formatUserSummary(plainVisit.salesRep),
    visitDate: plainVisit.visitDate,
    status: plainVisit.status,
    purpose: plainVisit.purpose,
    notes: plainVisit.notes,
    outcome: plainVisit.outcome,
    nextAction: plainVisit.nextAction,
    nextVisitDate: plainVisit.nextVisitDate,
    location: plainVisit.location,
    completedAt: plainVisit.completedAt,
    cancelledAt: plainVisit.cancelledAt,
    createdBy: formatUserSummary(plainVisit.createdBy),
    updatedBy: formatUserSummary(plainVisit.updatedBy),
    createdAt: plainVisit.createdAt,
    updatedAt: plainVisit.updatedAt,
  };
};

module.exports = {
  formatVisitResponse,
  getReferenceId,
};
