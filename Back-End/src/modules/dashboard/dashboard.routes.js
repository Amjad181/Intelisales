const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const dashboardController = require('./dashboard.controller');
const { recentActivitySchema } = require('./dashboard.validation');

const router = express.Router();

const allDashboardRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

const managementDashboardRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

router.use(authenticate);

router.get(
  '/summary',
  authorizeRoles(...allDashboardRoles),
  dashboardController.getSummary,
);

router.get(
  '/sales-reps',
  authorizeRoles(...managementDashboardRoles),
  dashboardController.getSalesReps,
);

router.get(
  '/recent-activity',
  authorizeRoles(...allDashboardRoles),
  validate(recentActivitySchema),
  dashboardController.getRecentActivity,
);

module.exports = router;
