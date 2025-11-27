import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to verify Cloudflare Turnstile CAPTCHA token
 */
export const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  // Skip CAPTCHA verification in development if not configured
  if (!process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY === '0x4AAAAAAAzW_your-secret-key-here') {
    console.warn('⚠️ CAPTCHA verification skipped - TURNSTILE_SECRET_KEY not configured');
    return next();
  }

  if (!captchaToken) {
    return res.status(400).json({
      code: 400,
      status: 400,
      message: 'CAPTCHA token is required'
    });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken,
        remoteip: req.ip || req.connection.remoteAddress
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error('CAPTCHA verification failed:', data['error-codes']);
      return res.status(400).json({
        code: 400,
        status: 400,
        message: 'CAPTCHA verification failed. Please try again.',
        errors: data['error-codes']
      });
    }

    // CAPTCHA verified successfully
    console.log('✅ CAPTCHA verified successfully');
    next();
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return res.status(500).json({
      code: 500,
      status: 500,
      message: 'CAPTCHA verification error. Please try again later.'
    });
  }
};
