const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const invoiceController = require('./invoice.controller');
const {
  createInvoiceSchema,
  invoiceIdParamSchema,
  listInvoicesSchema,
  updateInvoicePaymentSchema,
  updateInvoiceSchema,
} = require('./invoice.validation');

const router = express.Router();

const managerLevelRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const invoiceReadRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

const invoiceWriteRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
];

const invoicePaymentRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.ACCOUNTANT,
];

router.use(authenticate);

router
  .route('/')
  .get(
    authorizeRoles(...invoiceReadRoles),
    validate(listInvoicesSchema),
    invoiceController.listInvoices,
  )
  .post(
    authorizeRoles(...invoiceWriteRoles),
    validate(createInvoiceSchema),
    invoiceController.createInvoice,
  );

router.patch(
  '/:id/confirm',
  authorizeRoles(...invoiceWriteRoles),
  validate(invoiceIdParamSchema),
  invoiceController.confirmInvoice,
);

router.patch(
  '/:id/archive',
  authorizeRoles(...managerLevelRoles),
  validate(invoiceIdParamSchema),
  invoiceController.archiveInvoice,
);

router.patch(
  '/:id/payment',
  authorizeRoles(...invoicePaymentRoles),
  validate(updateInvoicePaymentSchema),
  invoiceController.updateInvoicePayment,
);

router.patch(
  '/:id/mark-sent',
  authorizeRoles(...invoicePaymentRoles),
  validate(invoiceIdParamSchema),
  invoiceController.markInvoiceSent,
);

router.get(
  '/:id/pdf',
  authorizeRoles(...invoiceReadRoles),
  validate(invoiceIdParamSchema),
  invoiceController.getInvoicePdf,
);

router
  .route('/:id')
  .get(
    authorizeRoles(...invoiceReadRoles),
    validate(invoiceIdParamSchema),
    invoiceController.getInvoiceById,
  )
  .patch(
    authorizeRoles(...invoiceWriteRoles),
    validate(updateInvoiceSchema),
    invoiceController.updateInvoice,
  );

module.exports = router;
