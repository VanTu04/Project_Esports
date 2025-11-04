const express = require('express');
const router = express.Router();
const passport = require('passport');

// Bắt đầu quá trình đăng nhập Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/auth/success',
  })
);

// Khi đăng nhập thành công
router.get('/success', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.json({
    message: 'Đăng nhập Google thành công!',
    user: req.user,
  });
});

// Đăng xuất
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;
