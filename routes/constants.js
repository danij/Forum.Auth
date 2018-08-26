module.exports = {

    authCookieSize: 16,
    authCookieName: 'auth',
    authDurationSeconds: parseInt(process.env.AUTH_SECONDS),
    authProviderName: 'auth_provider',
    authRegisterUrl: process.env.AUTH_REGISTER_URL,
    redirectCookieName: 'login_redirect'
};
