const express = require('express');
const router = express.Router();

const consentSeconds = 3600*24*30;

function removeCookie(res, name) {

    res.cookie(name, '', {maxAge: 1, httpOnly: true});
}

router.post('/consent_fp_cookies', (req, res) => {

    res.cookieSecureAuto('allow_cookies_fp', 'yes', {maxAge: consentSeconds * 1000});
    res.sendJson('ok');
});

router.delete('/consent_fp_cookies', (req, res) => {

    const cookieNames = [

        'allow_cookies_fp',
        'allow_external_images',
        'auth',
        'auth_provider',
        'double_submit',
        'login_redirect',
        'show_my_user_in_users_online'
    ];

    for (let cookieName of cookieNames) {

        removeCookie(res, cookieName);
    }
    res.sendJson('ok');
});

router.post('/consent_external_images', (req, res) => {

    res.cookieIfConsented('allow_external_images', 'yes', {maxAge: consentSeconds * 1000});
    res.sendJson('ok');
});

router.delete('/consent_external_images', (req, res) => {

    removeCookie(res, 'allow_external_images');
    res.sendJson('ok');
});

module.exports = router;
