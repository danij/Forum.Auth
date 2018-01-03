var express = require('express');
var crypto = require('crypto');

var router = express.Router();

var COOKIE_BYTES_LENGTH = 16;
var COOKIE_NAME = 'DoubleSubmit';

function generateNewValue() {

    return crypto.randomBytes(COOKIE_BYTES_LENGTH).toString('hex');
}

router.get('/', function (req, res, next) {

    var value;

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
