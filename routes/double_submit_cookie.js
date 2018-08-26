const express = require('express');
const crypto = require('crypto');
const constants = require('./constants');

const router = express.Router();

function generateNewValue() {

    return crypto.randomBytes(constants.doubleSubmitCookieBytesLength).toString('hex');
}

router.get('/', function (req, res, next) {

    const cookieName = constants.doubleSubmitCookieName;
    let value;

    if (req.cookies && req.cookies[cookieName] && req.cookies[cookieName].length) {

        value = req.cookies[cookieName];
    }
    else {
        value = generateNewValue();
    }

    res.cookieIfConsented(cookieName, value, {httpOnly: true});
    res.sendJson({double_submit: value});
});

module.exports = router;
