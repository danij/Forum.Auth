const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const COOKIE_BYTES_LENGTH = 16;
const COOKIE_NAME = 'doubleSubmit';

function generateNewValue() {

    return crypto.randomBytes(COOKIE_BYTES_LENGTH).toString('hex');
}

router.get('/', function (req, res, next) {

    let value;

    if (req.cookies && req.cookies[COOKIE_NAME] && req.cookies[COOKIE_NAME].length) {

        value = req.cookies[COOKIE_NAME];
    }
    else {
        value = generateNewValue();
    }

    res.cookie(COOKIE_NAME, value, {'httpOnly': true});
    res.send({doubleSubmit: value});
});

module.exports = router;
