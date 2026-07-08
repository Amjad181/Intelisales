const express = require('express');

const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { USER_ROLES } = require('../../models/User');
const userController = require('./user.controller');
const {
  createUserSchema,
  listUsersSchema,
  resetPasswordSchema,
  updateUserSchema,
  userIdParamSchema,
} = require('./user.validation');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(USER_ROLES.COMPANY_ADMIN));

router
  .route('/')
  .get(validate(listUsersSchema), userController.listUsers)
  .post(validate(createUserSchema), userController.createUser);

router.patch('/:id/password', validate(resetPasswordSchema), userController.resetPassword);

router
  .route('/:id')
  .get(validate(userIdParamSchema), userController.getUserById)
  .patch(validate(updateUserSchema), userController.updateUser)
  .delete(validate(userIdParamSchema), userController.deactivateUser);

module.exports = router;
