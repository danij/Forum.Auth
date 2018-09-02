const express = require('express');
const router = express.Router();
const constants = require('../services/constants');

router.post('/', (req, res) => {

    const referer = req.headers.referer;

    res.cookieIfConsented(constants.authCookieName, '', {maxAge: 0, httpOnly: true});
    res.cookieIfConsented(constants.authProviderName, '', {maxAge: 0});
    res.redirect(referer);
});

module.exports = router;
