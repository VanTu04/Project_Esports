const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const full_name = profile.displayName;
        const google_id = profile.id;
        const avatar = profile.photos[0]?.value || null;

        // Tìm hoặc tạo user mới
        let user = await User.findOne({ where: { email } });
        if (!user) {
          user = await User.create({
            username: full_name.replace(/\s+/g, '').toLowerCase(),
            full_name,
            email,
            google_id,
            avatar,
            password: null,
            role: 1,
            status: 1,
            deleted: 0,
            created_date: new Date(),
            updated_date: new Date(),
          });
        }

        return done(null, user);
      } catch (err) {
        console.error('Google login error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
