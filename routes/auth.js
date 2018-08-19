const express = require('express');
const router = express.Router();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.AUTH_CALLBACK + '_google'
    },
    (accessToken, refreshToken, profile, done) => {

        return done(null, {

            id: profile.id,
            provider: profile.provider
        });
    }
));

passport.serializeUser((user, done) => {

    done(null, user);
});

passport.deserializeUser((user, done) => {

    done(null, user);
});

function getToken(req, res) {

    res.send({
        id: req.user.provider + '_' + req.user.id
    });
}

router.get('/', passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
        ],
        session: false
    }), getToken);

router.get('/callback_google', passport.authenticate('google'), getToken);

module.exports = router;
