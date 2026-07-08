const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const priceListController = require('./priceList.controller');
const {
  createPriceListSchema,
  customerTypeParamSchema,
  listPriceListsSchema,
  priceListIdParamSchema,
  updatePriceListSchema,
} = require('./priceList.validation');

const router = express.Router();

const managerLevelRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const priceListReadRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

router.use(authenticate);

router
  .route('/')
  .get(
    authorizeRoles(...priceListReadRoles),
    validate(listPriceListsSchema),
    priceListController.listPriceLists,
  )
  .post(
    authorizeRoles(...managerLevelRoles),
    validate(createPriceListSchema),
    priceListController.createPriceList,
  );

router.get(
  '/customer-type/:customerType',
  authorizeRoles(...priceListReadRoles),
  validate(customerTypeParamSchema),
  priceListController.getActivePriceListByCustomerType,
);

router
  .route('/:id')
  .get(
    authorizeRoles(...priceListReadRoles),
    validate(priceListIdParamSchema),
    priceListController.getPriceListById,
  )
  .patch(
    authorizeRoles(...managerLevelRoles),
    validate(updatePriceListSchema),
    priceListController.updatePriceList,
  )
  .delete(
    authorizeRoles(...managerLevelRoles),
    validate(priceListIdParamSchema),
    priceListController.deactivatePriceList,
  );

module.exports = router;
