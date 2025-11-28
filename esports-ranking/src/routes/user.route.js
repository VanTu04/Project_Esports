import express from 'express';
import * as usersController from '../controllers/UserController.js';
import roles from '../constant/roles.js';
import { checkAccessToken, checkRefreshToken, checkRole } from '../middlewares/jwt_token.js';
import { uploadAvatar } from '../middlewares/multer.config.js';
import { verifyCaptcha } from '../middlewares/captcha.js';

const router = express.Router();

router.post("/register", verifyCaptcha, usersController.register);
router.post("/login", verifyCaptcha, usersController.login);
router.post('/logout', checkAccessToken, usersController.logout);
router.post('/refresh-token', checkRefreshToken, usersController.refreshToken);

// send mail
router.post("/send-verification-email", usersController.sendOtp);

//verify otp
router.post('/check-otp', usersController.checkOTP);


router.post("/forgot-pass", usersController.forgetPassword);
// router.post('/change-password', checkAccessToken, usersController.changePassword);
// router.post('/login-with-google', usersController.loginWithGoogle);

// router.post('/refresh-token', usersController.refreshToken);
// router.put('/authenticate/user', checkRole([roles.USER]), usersController.authenticate);
router.get('/home', usersController.home);

router.post('/check-exist-email', usersController.checkExistEmail);
router.post('/check-exist-username', usersController.checkExistUsername);
router.get('/profile', checkAccessToken, usersController.getProfile);

router.post('/update-profile', checkAccessToken, uploadAvatar.single('avatar'), usersController.updateProfile);

// Two-factor (email OTP) enable/disable (protected)
router.post('/two-factor/email/start', checkAccessToken, usersController.startTwoFactorEnable);
router.post('/two-factor/email/confirm', checkAccessToken, usersController.confirmTwoFactorEnable);
router.post('/two-factor/email/start-disable', checkAccessToken, usersController.startTwoFactorDisable);
router.post('/two-factor/email/confirm-disable', checkAccessToken, usersController.confirmTwoFactorDisable);
router.post('/two-factor/email/disable-by-password', checkAccessToken, usersController.disableEmailByPassword);
// login confirm for two-factor (public)
router.post('/two-factor/email/login-confirm', usersController.loginConfirm);

// Immediate disable 2FA by password (protected)
router.post('/two-factor/disable-by-password', checkAccessToken, usersController.disableTwoFactorByPassword);

// TOTP (app) two-factor
router.post('/two-factor/totp/start', checkAccessToken, usersController.startTotp);
router.post('/two-factor/totp/confirm', checkAccessToken, usersController.confirmTotp);
router.post('/two-factor/totp/disable', checkAccessToken, usersController.disableTotpController);
// disable all 2FA with password + token
router.post('/two-factor/disable-all', checkAccessToken, usersController.disableAllTwoFactor);
// login confirm for TOTP (public)
router.post('/two-factor/totp/login-confirm', usersController.loginConfirmTotp);

//ADMIN - Các route với param động (:id) phải đặt CUỐI
router.post('/new-account', checkRole([roles.ADMIN]), usersController.createNewAccountByAdmin);
router.get('/', checkRole([roles.ADMIN]), usersController.getAllUsers);
router.put('/:id', checkRole([roles.ADMIN]), usersController.updateUser);
router.delete('/:id', checkRole([roles.ADMIN]), usersController.deleteUser);

export default router;