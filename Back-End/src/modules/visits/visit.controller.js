const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const visitService = require('./visit.service');

const listVisits = asyncHandler(async (req, res) => {
  const result = await visitService.listVisits(req.query, req.user);

  return sendSuccess(res, {
    message: 'Visits fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.visits,
  });
});

const getVisitById = asyncHandler(async (req, res) => {
  const visit = await visitService.getVisitById(req.params.id, req.user);

  return sendSuccess(res, {
    message: 'Visit retrieved successfully',
    data: { visit },
  });
});

const createVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.createVisit(req.body, req.user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Visit created successfully',
    data: { visit },
  });
});

const updateVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.updateVisit(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Visit updated successfully',
    data: { visit },
  });
});

const completeVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.completeVisit(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Visit completed successfully',
    data: { visit },
  });
});

const cancelVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.cancelVisit(req.params.id, req.body, req.user);

  return sendSuccess(res, {
    message: 'Visit cancelled successfully',
    data: { visit },
  });
});

const listCustomerVisits = asyncHandler(async (req, res) => {
  const result = await visitService.listCustomerVisits(req.params.id, req.query, req.user);

  return sendSuccess(res, {
    message: 'Customer visits fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.visits,
  });
});

module.exports = {
  cancelVisit,
  completeVisit,
  createVisit,
  getVisitById,
  listCustomerVisits,
  listVisits,
  updateVisit,
};
