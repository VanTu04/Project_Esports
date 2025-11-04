require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const app = express();
const routes = require('./routes');
const { sequelize } = require('./models');

// --- Google Passport Config ---
require('./config/passport'); // Google OAuth config

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

// --- Session middleware ---
app.use(
  session({
    secret: 'esports_ranking_secret', // có thể đưa vào .env
    resave: false,
    saveUninitialized: true,
  })
);

// --- Passport middleware ---
app.use(passport.initialize());
app.use(passport.session());

// route hiển thị form login
app.get('/login', (req, res) => res.render('login'));

// route google login
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

app.get('/profile', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.send(`<h1>Xin chào ${req.user.full_name || req.user.username}</h1>
  <p>Email: ${req.user.email}</p>
  <a href="/logout">Đăng xuất</a>`);
});

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/login'));
});

app.get('/api/auth/fail', (req, res) => {
  res.status(401).json({ message: 'Đăng nhập Google thất bại' });
});

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/api`));
}).catch((err) => {
  console.error('Unable to connect to DB:', err);
});
