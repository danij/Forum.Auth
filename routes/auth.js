var express = require('express');
var router = express.Router();

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.AUTH_CALLBACK
    },
    function (accessToken, refreshToken, profile, done) {

        return done(null, {

            id: profile.id,
            provider: profile.provider
        });
    }
));

passport.serializeUser(function (user, done) {

    done(null, user);
});

passport.deserializeUser(function (user, done) {

    done(null, user);
});

function getToken(req, res) {

    res.send({
        id: req.user.id
    });
}

router.get('/',
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
        ],
        session: false
    }),
    getToken);

router.get('/callback', passport.authenticate('google'), getToken);

module.exports = router;
