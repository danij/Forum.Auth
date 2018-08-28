module.exports = {

    authCookieSize: 16,
    authCookieName: 'auth',
    authDurationSeconds: parseInt(process.env.AUTH_SECONDS),
    authProviderName: 'auth_provider',
    authRegisterUrl: process.env.AUTH_REGISTER_URL,
    doubleSubmitCookieBytesLength: 16,
    doubleSubmitCookieName: 'double_submit',
    doubleSubmitHeaderName: 'x-double-submit',
    jsonPrefix: process.env.PREFIX,
    redirectCookieName: 'login_redirect',
    trustForwardedIP: process.env.TRUST_FORWARDED_IP === 'true',
    useSecureCookies: process.env.SECURE_COOKIES === 'true'
};
