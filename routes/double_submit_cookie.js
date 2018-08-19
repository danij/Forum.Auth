const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const COOKIE_BYTES_LENGTH = 16;
const COOKIE_NAME = 'DoubleSubmit';

function generateNewValue() {

    return crypto.randomBytes(COOKIE_BYTES_LENGTH).toString('hex');
}

router.get('/', (req, res, next) => {

    const value = generateNewValue();

    res.cookie(COOKIE_NAME, value, {'httpOnly': true});
    res.send({doubleSubmit: value});
});

module.exports = router;
