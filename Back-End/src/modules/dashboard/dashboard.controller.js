const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const dashboardService = require('./dashboard.service');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user);

  return sendSuccess(res, {
    message: 'Dashboard summary fetched successfully',
    data: { summary },
  });
});

const getSalesReps = asyncHandler(async (req, res) => {
  const salesReps = await dashboardService.getSalesRepDashboard(req.user);

  return sendSuccess(res, {
    message: 'Sales representative dashboard fetched successfully',
    count: salesReps.length,
    data: { salesReps },
  });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await dashboardService.getRecentActivity(req.query, req.user);

  return sendSuccess(res, {
    message: 'Recent activity fetched successfully',
    data: { activity },
  });
});

module.exports = {
  getRecentActivity,
  getSalesReps,
  getSummary,
};
