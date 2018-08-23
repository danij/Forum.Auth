const express = require('express');
const router = express.Router();

const consentSeconds = 3600*24*30;
const jsonPrefix = process.env.PREFIX;

router.post('/consent_fp_cookies', (req, res) => {

    res.cookie('allow_cookies_fp', 'yes', {maxAge: consentSeconds * 1000});
    res.send(jsonPrefix + JSON.stringify('ok'));
});

function removeCookie(res, name) {

    res.cookie(name, '', {maxAge: 1, httpOnly: true});
}

router.delete('/consent_fp_cookies', (req, res) => {

    const cookieNames = [

        'allow_cookies_fp',
        'auth',
        'auth_provider',
        'double_submit',
        'login_redirect',
        'show_my_user_in_users_online'
    ];

    for (let cookieName of cookieNames) {

        removeCookie(res, cookieName);
    }
    res.send(jsonPrefix + JSON.stringify('ok'));
});

module.exports = router;
