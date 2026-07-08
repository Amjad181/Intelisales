const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const invoiceController = require('../invoices/invoice.controller');
const { customerInvoicesSchema } = require('../invoices/invoice.validation');
const visitController = require('../visits/visit.controller');
const { customerVisitsSchema } = require('../visits/visit.validation');
const customerController = require('./customer.controller');
const {
  assignCustomerSchema,
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  updateCustomerSchema,
} = require('./customer.validation');

const router = express.Router();

const managerLevelRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const customerReadRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

router.use(authenticate);

router
  .route('/')
  .get(
    authorizeRoles(...customerReadRoles),
    validate(listCustomersSchema),
    customerController.listCustomers,
  )
  .post(
    authorizeRoles(...managerLevelRoles, USER_ROLES.SALES_REPRESENTATIVE),
    validate(createCustomerSchema),
    customerController.createCustomer,
  );

router.patch(
  '/:id/assign',
  authorizeRoles(...managerLevelRoles),
  validate(assignCustomerSchema),
  customerController.assignCustomer,
);

router.get(
  '/:id/invoices',
  authorizeRoles(...customerReadRoles),
  validate(customerInvoicesSchema),
  invoiceController.listCustomerInvoices,
);

router.get(
  '/:id/balance',
  authorizeRoles(...customerReadRoles),
  validate(customerIdParamSchema),
  customerController.getCustomerBalance,
);

router.get(
  '/:id/visits',
  authorizeRoles(...customerReadRoles),
  validate(customerVisitsSchema),
  visitController.listCustomerVisits,
);

router
  .route('/:id')
  .get(
    authorizeRoles(...customerReadRoles),
    validate(customerIdParamSchema),
    customerController.getCustomerById,
  )
  .patch(
    authorizeRoles(...managerLevelRoles, USER_ROLES.SALES_REPRESENTATIVE),
    validate(updateCustomerSchema),
    customerController.updateCustomer,
  )
  .delete(
    authorizeRoles(...managerLevelRoles),
    validate(customerIdParamSchema),
    customerController.deactivateCustomer,
  );

module.exports = router;
