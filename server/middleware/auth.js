const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20')
const userModel = require('../model/userModel')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })



// const client_secret =process.env.client_secret

// const client_ID = process.env.client_ID



passport.use(new GoogleStrategy({
  clientID: process.env.client_ID,
  clientSecret:process.env.client_secret,
  callbackURL: 'http://localhost:3006/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await userModel.findOne({ email: profile.emails[0].value });

    if (!user) {
      user = new userModel({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'defaultPassword'
      });
      await user.save();
    }
    const userToken = jwt.sign({ userId: user.email }, 'your_secret_key', { expiresIn: '1h' });

    done(null, { user, userToken });
  } catch (error) {
    done(error, null);
  }
}));


passport.serializeUser((user, done) => {
  const sessionUser = {
    id: user._id,
    name: user.name,
    email: user.email
  };
  done(null, sessionUser);
});

passport.deserializeUser(async (sessionUser, done) => {
  try {
    const user = await userModel.findById(sessionUser.id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});