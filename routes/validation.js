const constants = require('./constants.js');

function validateAddressStart(needle, haystack) {

    if (haystack.indexOf(needle) !== 0) return false;

    return (needle.length === haystack.length) || ('/' === haystack[needle.length]);
}

module.exports = {

    checkCookieConsent: (req, res, next) => {

        req.hasConsentedToFpCookies = 'yes' === req.cookies['allow_cookies_fp'];

        res.cookieIfConsented = (name, value, properties) => {

            if (req.hasConsentedToFpCookies) {

                res.cookie(name, value, properties);
            }
        };

        next();
    },

    originRefererValidation: (req, res, next) => {

        const origin = req.headers.origin;
        const referer = req.headers.referer;
        const expected = process.env.EXPECTED_ORIGIN;

        if (( ! origin) && ( ! referer)) {

            res.status(400);
            res.send('Origin and Referer missing.');
        }
        else if (origin && ! validateAddressStart(expected, origin)) {

            res.status(400);
            res.send('Invalid Origin.');
        }
        else if (referer && ! validateAddressStart(expected, referer)) {

            res.status(400);
            res.send('Invalid Referer.');
        }
        else {

            next();
        }
    },

    sendJsonWithPrefix: (req, res, next) => {

        res.sendJson = (obj) => {

            res.send(constants.jsonPrefix + JSON.stringify(obj));
        };

        next();
    },

    doubleSubmitCookieValidation: (req, res, next) => {

        const cookieValue = req.cookies[constants.doubleSubmitCookieName];
        const headerValue = req.headers[constants.doubleSubmitHeaderName];

        if (( ! cookieValue) && ( ! headerValue)) {

            res.status(400);
            res.send('Double submit values not present.');
        }
        else if (cookieValue !== headerValue) {

            res.status(400);
            res.send('Double submit values mismatch.');
        }
        else {

            next();
        }
    },

    setupSourceAddress: (req, res, next) => {

        req.sourceAddress = constants.trustForwardedIP
            ? req.headers['x-forwarded-for']
            : req.connection.remoteAddress;

        next();
    }
};