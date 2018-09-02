const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const constants = require('../services/constants');

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (clientId && clientSecret) {

    passport.use(new GoogleStrategy({
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL: process.env.AUTH_CALLBACK + '_google'
        },
        (accessToken, refreshToken, profile, done) => {

            return done(null, {

                id: profile.id,
                provider: 'google'
            });
        }
    ));

    passport.serializeUser((user, done) => {

        done(null, user);
    });

    passport.deserializeUser((user, done) => {

        done(null, user);
    });
}

function hashId(input) {

    const sha = crypto.createHash('sha1');

    sha.update(input, 'utf8');
    return sha.digest('hex');
}

function generateRandomToken() {

    return crypto.randomBytes(constants.authCookieSize).toString('hex');
}

function beforeFilter(req, res, next) {

    if ( ! req.hasConsentedToFpCookies) {

        res.status(400);
        res.send('Cookie consent required before logging in.');
        return;
    }
    if (req.query['accepted-privacy-policy-and-tos'] !== 'true') {

        res.status(400);
        res.send('The privacy policy and terms of service must be accepted before logging in.');
        return;
    }

    const referer = req.headers.referer;

    res.cookieIfConsented(constants.redirectCookieName, referer, {maxAge: 600000, httpOnly: true});

    if (req.query['show-in-users-online'] === 'true') {

        res.cookieIfConsented('show_my_user_in_users_online', 'true', {httpOnly: true});
    }

    next();
}

async function getToken(req, res, next) {

    const redirectTo = req.cookies[constants.redirectCookieName];

    res.cookieIfConsented(constants.redirectCookieName, '', {maxAge: 0});

    const authToken = generateRandomToken();
    const authId = req.user.provider + '_' + hashId(req.user.id);

    try {
        const response = await axios.post(constants.authRegisterUrl +
            ['login', authToken, authId, constants.authDurationSeconds.toString()].map(encodeURIComponent).join('/'));

        if (response.status >= 200 && response.status < 300) {

            res.cookieIfConsented(constants.authCookieName, authToken, {maxAge: constants.authDurationSeconds * 1000, httpOnly: true});
            res.cookieIfConsented(constants.authProviderName, 'external', {maxAge: constants.authDurationSeconds * 1000});
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

if (clientId && clientSecret) {

    router.get('/google/', beforeFilter, passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
        ],
        session: false
    }), getToken);

    router.get('/callback_google', passport.authenticate('google'), getToken);
}

module.exports = router;
