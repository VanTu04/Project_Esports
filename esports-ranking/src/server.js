import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import routes from './routes/index.js';
import { sequelize } from './models/index.js';
import './config/passport.js'; // Import để kích hoạt cấu hình Passport

dotenv.config();

const app = express();

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session middleware ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'esports_ranking_secret',
    resave: false,
    saveUninitialized: true,
  })
);

// --- Passport middleware ---
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
app.use('/api', routes);

// --- Auth routes ---
app.get('/login', (req, res) => res.render('login'));

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
  res.send(`
    <h1>Xin chào ${req.user.full_name || req.user.username}</h1>
    <p>Email: ${req.user.email}</p>
    <a href="/logout">Đăng xuất</a>
  `);
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

app.get('/api/auth/fail', (req, res) => {
  res.status(401).json({ message: 'Đăng nhập Google thất bại' });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}/api`));
  })
  .catch(err => {
    console.error('Unable to connect to DB:', err);
  });
