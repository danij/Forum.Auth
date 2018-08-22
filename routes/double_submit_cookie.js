const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const cookieBytesLength = 16;
const cookieName = 'double_submit';
const jsonPrefix = process.env.PREFIX;

function generateNewValue() {

    return crypto.randomBytes(cookieBytesLength).toString('hex');
}

router.get('/', function (req, res, next) {

    let value;

    if (req.cookies && req.cookies[cookieName] && req.cookies[cookieName].length) {

        value = req.cookies[cookieName];
    }
    else {
        value = generateNewValue();
    }

    res.cookieIfConsented(cookieName, value, {httpOnly: true});
    res.send(jsonPrefix + JSON.stringify({double_submit: value}));
});

module.exports = router;
