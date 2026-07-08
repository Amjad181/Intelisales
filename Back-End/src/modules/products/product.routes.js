const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const productController = require('./product.controller');
const {
  createProductSchema,
  listProductsSchema,
  priceListSchema,
  productIdParamSchema,
  updateProductPriceSchema,
  updateProductSchema,
} = require('./product.validation');

const router = express.Router();

const managerLevelRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const productReadRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

router.use(authenticate);

router
  .route('/')
  .get(
    authorizeRoles(...productReadRoles),
    validate(listProductsSchema),
    productController.listProducts,
  )
  .post(
    authorizeRoles(...managerLevelRoles),
    validate(createProductSchema),
    productController.createProduct,
  );

router.get(
  '/price-list',
  authorizeRoles(...productReadRoles),
  validate(priceListSchema),
  productController.listPriceItems,
);

router.patch(
  '/:id/price',
  authorizeRoles(...managerLevelRoles),
  validate(updateProductPriceSchema),
  productController.updateProductPrice,
);

router
  .route('/:id')
  .get(
    authorizeRoles(...productReadRoles),
    validate(productIdParamSchema),
    productController.getProductById,
  )
  .patch(
    authorizeRoles(...managerLevelRoles),
    validate(updateProductSchema),
    productController.updateProduct,
  )
  .delete(
    authorizeRoles(...managerLevelRoles),
    validate(productIdParamSchema),
    productController.deactivateProduct,
  );

module.exports = router;
