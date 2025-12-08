import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import routes from './routes/index.js';
import { sequelize } from './models/index.js';
import './config/passport.js';
import { initAdminAccount } from './init/initAdmin.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fail } from 'assert';
import { sanitizeInput } from './middlewares/sanitize.js';

dotenv.config();

const app = express();

// =========================
// SECURITY MIDDLEWARE
// =========================

// 1. Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://challenges.cloudflare.com"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS Configuration - MUST be before rate limiting
app.use(cors({
  // origin: true, // Allow all origins (or specify: ['https://vawndev.online', 'http://localhost:5173'])
  origin: ['https://vawndev.online', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));



// 3. Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip OPTIONS requests (CORS preflight)
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 attempts per minute (increased for development)
  message: {
    code: 429,
    status: 429,
    message: 'Too many login attempts, please try again after 1 minute.',
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip OPTIONS requests (CORS preflight)
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      status: 429,
      message: 'Too many login attempts, please try again after 1 minute.',
    });
  },
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// 4. Prevent HTTP Parameter Pollution
app.use(hpp());

app.use(cookieParser());

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// --- Middleware ---
// Limit body size to prevent large payload attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. XSS Protection - Sanitize all user inputs
app.use(sanitizeInput);

// Serve uploads (static). CORP is handled by Helmet's crossOriginResourcePolicy above.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
    <h1>Xin chÃ o ${req.user.full_name || req.user.username}</h1>
    <p>Email: ${req.user.email}</p>
    <a href="/logout">ÄÄƒng xuáº¥t</a>
  `);
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

app.get('/api/auth/fail', (req, res) => {
  res.status(401).json({ message: 'ÄÄƒng nháº­p Google tháº¥t báº¡i' });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ alter: false })
  .then(async () => {
    console.log('Database synced');

    await initAdminAccount();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to DB:', err);
  });
