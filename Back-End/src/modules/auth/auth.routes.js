const express = require('express');

const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const { USER_ROLES } = require('../../models/User');
const authController = require('./auth.controller');
const { loginSchema, refreshTokenSchema } = require('./auth.validation');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.get('/protected-test', authenticate, authController.protectedTest);
router.get('/admin-test', authenticate, authorizeRoles(USER_ROLES.COMPANY_ADMIN), authController.adminTest);

module.exports = router;
