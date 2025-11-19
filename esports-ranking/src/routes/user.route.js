import express from 'express';
import * as usersController from '../controllers/UserController.js';
import roles from '../constant/roles.js';
import { checkAccessToken, checkRefreshToken, checkRole } from '../middlewares/jwt_token.js';
import { uploadAvatar } from '../middlewares/multer.config.js';

const router = express.Router();

router.post("/register", usersController.register);
router.post("/login", usersController.login);
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

//ADMIN - Các route với param động (:id) phải đặt CUỐI
router.post('/new-account', checkRole([roles.ADMIN]), usersController.createNewAccountByAdmin);
router.get('/', checkRole([roles.ADMIN]), usersController.getAllUsers);
router.put('/:id', checkRole([roles.ADMIN]), usersController.updateUser);
router.delete('/:id', checkRole([roles.ADMIN]), usersController.deleteUser);

export default router;