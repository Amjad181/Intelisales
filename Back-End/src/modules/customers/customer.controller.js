const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const customerService = require('./customer.service');

const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query, req.user);

  return sendSuccess(res, {
    message: 'Customers fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.customers,
  });
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Customer retrieved successfully',
    data: { customer },
  });
});

const getCustomerBalance = asyncHandler(async (req, res) => {
  const balance = await customerService.getCustomerBalance(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Customer balance fetched successfully',
    data: balance,
  });
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Customer created successfully',
    data: { customer },
  });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Customer updated successfully',
    data: { customer },
  });
});

const assignCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.assignCustomer(
    req.params.id,
    req.body.assignedSalesRep,
    req.user,
  );

  return sendSuccess(res, {
    message: 'Customer assigned successfully',
    data: { customer },
  });
});

const deactivateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.deactivateCustomer(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Customer deactivated successfully',
    data: { customer },
  });
});

module.exports = {
  assignCustomer,
  createCustomer,
  deactivateCustomer,
  getCustomerBalance,
  getCustomerById,
  listCustomers,
  updateCustomer,
};
