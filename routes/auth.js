const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

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

function hashId(input) {

    const sha = crypto.createHash('sha1');

    sha.update(input, 'utf8');
    return sha.digest('hex');
}

const redirectCookieName = 'login_redirect';
const expectedReferer = process.env.EXPECTED_REFERER;
const authCookieSize = 16;
const authCookieName = 'auth';
const authDurationSeconds = parseInt(process.env.AUTH_SECONDS);
const authRegisterUrl = process.env.AUTH_REGISTER_URL;

function generateRandomToken() {

    return crypto.randomBytes(authCookieSize).toString('hex');
}

function beforeFilter(req, res, next) {

    const referer = req.headers.referer;

    if (! referer.startsWith(expectedReferer)) {

        res.send('Invalid Referer.');
        return;
    }

    res.cookie(redirectCookieName, referer, {maxAge: 600000, httpOnly: true});

    if (req.query['show-in-users-online'] === 'true') {

        res.cookie('show_my_user_in_users_online', 'true', {httpOnly: true})
    }

    next();
}

async function getToken(req, res, next) {

    const redirectTo = req.cookies[redirectCookieName];

    res.cookie(redirectCookieName, '', {maxAge: 0});

    const authToken = generateRandomToken();
    const authId = req.user.provider + '_' + hashId(req.user.id);

    try {
        const response = await axios.post(authRegisterUrl +
            ['login', authToken, authId, authDurationSeconds.toString()].map(encodeURIComponent).join('/'));

        if (response.status >= 200 && response.status < 300) {

            res.cookie(authCookieName, authToken, {maxAge: authDurationSeconds * 1000, httpOnly: true});
            res.redirect(redirectTo);
        }
        else {
            next(new Error(res.statusText));
        }
    }
    catch (e) {

        next(e);
    }
}

router.get('/google/', beforeFilter, passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/plus.login',
    ],
    session: false
}), getToken);

router.get('/callback_google', passport.authenticate('google'), getToken);

router.get('/logout', (req, res) => {

    const referer = req.headers.referer;

    if (! referer.startsWith(expectedReferer)) {

        res.send('Invalid Referer.');

    } else {

        res.cookie(authCookieName, '', {maxAge: 0, httpOnly: true});
        res.redirect(referer);
    }
});

module.exports = router;
