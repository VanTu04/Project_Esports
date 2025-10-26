const express = require('express');
const router = express.Router();
const usersController = require('../controllers/UserController');
const roles = require('../constant/roles');

router.post("/register", usersController.register);
router.post("/login", usersController.login);
// router.post("/send-verification-email", usersController.sendVerify);
// router.post("/forgot-pass", usersController.forgetPassword);
// router.post('/change-password', checkAccessToken, usersController.changePassword);
// router.post('/login-with-google', usersController.loginWithGoogle);
// router.post('/check-otp', usersController.checkOTP);
// router.post('/refresh-token', usersController.refreshToken);
// router.put('/authenticate/user', checkRole([roles.USER]), usersController.authenticate);
router.get('/home', usersController.home);

module.exports = router;