module.exports = {

    authCookieSize: parseInt(process.env.AUTH_COOKIE_SIZE),
    authCookieName: 'auth',
    authDurationSeconds: parseInt(process.env.AUTH_SECONDS),
    authProviderName: 'auth_provider',
    authRegisterUrl: process.env.AUTH_REGISTER_URL,
    doubleSubmitCookieBytesLength: parseInt(process.env.DOUBLE_SUBMIT_COOKIE_SIZE),
    doubleSubmitCookieName: 'double_submit',
    doubleSubmitHeaderName: 'x-double-submit',
    enableCustomAuth: process.env.ENABLE_CUSTOM_AUTH === 'true',
    jsonPrefix: process.env.PREFIX,
    minAgeForRegistration: parseInt(process.env.REGISTER_MIN_AGE),
    passwordMinLength: process.env.PASSWORD_MIN_LENGTH === 'true',
    redirectCookieName: 'login_redirect',
    registrationAuthSize: parseInt(process.env.REGISTER_AUTH_SIZE),
    registrationConfirmationCookieSize: parseInt(process.env.REGISTER_CONFIRMATION_SIZE),
    registrationConfirmationTimeoutSeconds: parseInt(process.env.REGISTER_TIMEOUT_SECONDS),
    statusCodes: {
        ok: 0,
        invalidParameters: 1,
        throttled: 11
    },
    trustForwardedIP: process.env.TRUST_FORWARDED_IP === 'true',
    throttleRegisterCustomAuthSeconds: parseInt(process.env.REGISTER_CUSTOM_AUTH_THROTTLING),
    useSecureCookies: process.env.SECURE_COOKIES === 'true'
};
