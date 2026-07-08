const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const recommendationController = require('./recommendation.controller');
const { productRecommendationsSchema } = require('./recommendation.validation');

const router = express.Router();

const recommendationReadRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

router.use(authenticate);

router.get(
  '/customers/:customerId/products',
  authorizeRoles(...recommendationReadRoles),
  validate(productRecommendationsSchema),
  recommendationController.getCustomerProductRecommendations,
);

module.exports = router;
