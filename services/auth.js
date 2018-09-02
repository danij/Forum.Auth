const axios = require('axios');
const crypto = require('crypto');

const constants = require('../services/constants');

function generateRandomToken() {

    return crypto.randomBytes(constants.authCookieSize).toString('hex');
}

module.exports = {

    forwardAuth: async (res, authId, providerName) => {

        const authToken = generateRandomToken();

        const response = await axios.post(constants.authRegisterUrl +
            ['login', authToken, authId, constants.authDurationSeconds.toString()].map(encodeURIComponent).join('/'));

        if (response.status >= 200 && response.status < 300) {

            res.cookieIfConsented(constants.authCookieName, authToken, {maxAge: constants.authDurationSeconds * 1000, httpOnly: true});
            res.cookieIfConsented(constants.authProviderName, providerName, {maxAge: constants.authDurationSeconds * 1000});

            return true;
        }
        else {

            return res.statusText;
        }
    },

    showInOnlineUsers: (res, value) => {

        if (true === value) {

            res.cookieIfConsented('show_my_user_in_users_online', 'true', {httpOnly: true});
        }
    }
};