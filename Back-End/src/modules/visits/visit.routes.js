const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const visitController = require('./visit.controller');
const {
  cancelVisitSchema,
  completeVisitSchema,
  createVisitSchema,
  listVisitsSchema,
  updateVisitSchema,
  visitIdParamSchema,
} = require('./visit.validation');

const router = express.Router();

const managerLevelRoles = [
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.SALES_SUPERVISOR,
];

const visitReadRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
  USER_ROLES.ACCOUNTANT,
];

const visitWriteRoles = [
  ...managerLevelRoles,
  USER_ROLES.SALES_REPRESENTATIVE,
];

router.use(authenticate);

router
  .route('/')
  .get(
    authorizeRoles(...visitReadRoles),
    validate(listVisitsSchema),
    visitController.listVisits,
  )
  .post(
    authorizeRoles(...visitWriteRoles),
    validate(createVisitSchema),
    visitController.createVisit,
  );

router.patch(
  '/:id/complete',
  authorizeRoles(...visitWriteRoles),
  validate(completeVisitSchema),
  visitController.completeVisit,
);

router.patch(
  '/:id/cancel',
  authorizeRoles(...visitWriteRoles),
  validate(cancelVisitSchema),
  visitController.cancelVisit,
);

router
  .route('/:id')
  .get(
    authorizeRoles(...visitReadRoles),
    validate(visitIdParamSchema),
    visitController.getVisitById,
  )
  .patch(
    authorizeRoles(...visitWriteRoles),
    validate(updateVisitSchema),
    visitController.updateVisit,
  );

module.exports = router;
