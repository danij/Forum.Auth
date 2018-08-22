function validateAddressStart(needle, haystack) {

    if (haystack.indexOf(needle) != 0) return false;

    return (needle.length == haystack.length) || ('/' == haystack[needle.length]);
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

        if (origin && ! validateAddressStart(expected, origin)) {

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
    }
};