const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');

const constants = require('../services/constants');
const database = require('../services/database');
const throttling = require('../services/throttling');
const passwordService = require('../services/password');
const emailService = require('../services/email');
const authService = require('../services/auth');

function validateEmail(email) {

    const match = email.match(/^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+\.[a-zA-Z]{2,}$/i);
    return match && (match.length > 0);
}

function validatePassword(password) {

    return password.length >= constants.passwordMinLength;
}

function validateMinAge(minAge) {

    return minAge >= constants.minAgeForRegistration;
}

function emailAlphaNumeric(email) {

    return email.replace(/[^a-zA-Z0-9@]/gi, '').toLowerCase();
}

async function emailInUse(email) {

    const toSearch = emailAlphaNumeric(email);

    const dbResult = await database.executeQuery('SELECT COUNT(*) AS count FROM logins WHERE email_alphanumeric = $1',
        [toSearch]);
    return parseInt(dbResult.rows[0]['count']) > 0;
}

async function emailNotAllowed(email) {

    const domain = email.match(/.*@(.*)/i)[1].toLowerCase();

    const dbResult = await database.executeQuery('SELECT COUNT(*) AS count FROM domain_blacklist WHERE domain = $1',
        [domain]);
    return parseInt(dbResult.rows[0]['count']) > 0;
}

function randomConfirmationId() {

    return crypto.randomBytes(constants.registrationConfirmationCookieSize).toString('hex');
}

function randomAuth() {

    return 'custom_' + crypto.randomBytes(constants.registrationAuthSize).toString('hex');
}

function randomPassword() {

    return crypto.randomBytes(constants.resetPasswordNewPasswordSize).toString('hex');
}

const emailRegisterTemplate = fs.readFileSync(__dirname + '/../register_confirmation_template.html', 'utf8');
const emailForgotPasswordTemplate = fs.readFileSync(__dirname + '/../reset_password_confirmation_template.html', 'utf8');
const emailPasswordChangeTemplate = fs.readFileSync(__dirname + '/../change_password_notification.html', 'utf8');

function emailRegistrationConfirmation(email, confirmationId) {

    const confirmationLink = constants.registrationConfirmationUrl + '/' + encodeURIComponent(confirmationId);
    const messageBody = emailRegisterTemplate.replace(/{{confirmation_link}}/g, confirmationLink);
    emailService.sendEmail(email, constants.registrationConfirmationTitle, messageBody, messageBody);
}

function emailResetPasswordLink(email, resetId) {

    const confirmationLink = constants.resetPasswordConfirmationUrl + '/' + encodeURIComponent(resetId);
    const messageBody = emailForgotPasswordTemplate.replace(/{{reset_link}}/g, confirmationLink);
    emailService.sendEmail(email, constants.resetPasswordConfirmationTitle, messageBody, messageBody);
}

function emailPasswordChangeNotificationLink(email) {

    const messageBody = emailPasswordChangeTemplate;
    emailService.sendEmail(email, constants.passwordChangeNotificationTitle, messageBody, messageBody);
}

async function validateNotARobot(response) {

    if ( ! response) return false;

    try {

        const result = await axios({

            url: 'https://www.google.com/recaptcha/api/siteverify',
            method: 'post',
            params: {

                secret: constants.reCAPTCHASecretKey,
                response: response
            }
        });
        return (200 == result.status) && result.data.success;
    }
    catch {

        return false;
    }
}

async function registerUserAndGetConfirmationId(email, password, minAge) {

    const transformedPassword = await passwordService.transformPasswordInitial(password);

    const dbResults = await database.executeQuery(
        'INSERT INTO logins (email, email_alphanumeric, password, password_details, auth, min_age_at_registration, enabled) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [
            email,
            emailAlphaNumeric(email),
            transformedPassword.derived,
            JSON.stringify(transformedPassword.options),
            randomAuth(),
            minAge,
            false
        ]);
    const loginId = parseInt(dbResults.rows[0].id);
    const confirmationId = randomConfirmationId();
    const expiration = "interval '" + constants.registrationConfirmationTimeoutSeconds + " seconds'";

    await database.executeQuery(
        'INSERT INTO login_confirmations (id, login_id, expires) VALUES ($1, $2, now() + ' + expiration + ')',
        [confirmationId, loginId]
    );

    return confirmationId;
}

async function confirmRegistration(confirmationId) {

    const dbResult = await database.executeQuery(
        'SELECT logins.id FROM login_confirmations INNER JOIN logins ON login_confirmations.login_id = logins.id ' +
        'WHERE (logins.enabled = false) AND (login_confirmations.id = $1) AND (login_confirmations.expires > now())',
        [confirmationId]
    );
    if (dbResult.rowCount < 1) return false;

    const loginId = dbResult.rows[0].id;

    await database.executeQuery(
        'UPDATE logins SET enabled = true WHERE id = $1',
        [loginId]
    );

    await database.executeQuery(
        'DELETE FROM login_confirmations WHERE id = $1',
        [confirmationId]
    );

    return true;
}

async function login(email, password) {

    const dbResult = await database.executeQuery(
        'SELECT auth, password, password_details FROM logins WHERE (email = $1) AND (enabled = true)',
        [email]
    );
    if (dbResult.rowCount < 1) return '';

    const dbRow = dbResult.rows[0];

    if (dbRow.password !== await passwordService.transformPassword(password, JSON.parse(dbRow.password_details))) {

        return '';
    }
    return dbRow.auth;
}

async function changePassword(email, oldPassword, newPassword) {

    const dbResult = await database.executeQuery(
        'SELECT id, password, password_details FROM logins WHERE (email = $1) AND (enabled = true)',
        [email]
    );
    if (dbResult.rowCount < 1) return false;

    const dbRow = dbResult.rows[0];

    if (dbRow.password !== await passwordService.transformPassword(oldPassword, JSON.parse(dbRow.password_details))) {

        return false;
    }

    const transformedPassword = await passwordService.transformPasswordInitial(newPassword);

    await database.executeQuery(
        'UPDATE logins SET password = $1, password_details = $2, last_password_change = now() WHERE id = $3',
        [transformedPassword.derived, JSON.stringify(transformedPassword.options), dbRow.id]
    );

    return true;
}

async function getIdForResettingPassword(email) {

    const dbResult = await database.executeQuery(
        'SELECT id FROM logins WHERE (email = $1) AND (enabled = true)',
        [email]
    );
    if (dbResult.rowCount < 1) return false;

    const loginId = parseInt(dbResult.rows[0].id);
    const resetId = randomConfirmationId();
    const expiration = "interval '" + constants.resetPasswordConfirmationTimeoutSeconds + " seconds'";

    await database.executeQuery(
        'DELETE FROM reset_password_confirmations WHERE login_id = $1',
        [loginId]
    );

    await database.executeQuery(
        'INSERT INTO reset_password_confirmations (id, login_id, expires) VALUES ($1, $2, now() + ' + expiration + ')',
        [resetId, loginId]
    );

    return resetId;
}

async function confirmResetPassword(resetId) {

    const dbResult = await database.executeQuery(
        'SELECT logins.id FROM reset_password_confirmations INNER JOIN logins ON reset_password_confirmations.login_id = logins.id ' +
        'WHERE (logins.enabled = true) AND (reset_password_confirmations.id = $1) AND (reset_password_confirmations.expires > now())',
        [resetId]
    );
    if (dbResult.rowCount < 1) return false;

    const loginId = dbResult.rows[0].id;

    const newPassword = randomPassword();
    const transformedPassword = await passwordService.transformPasswordInitial(newPassword);

    await database.executeQuery(
        'UPDATE logins SET password = $1, password_details = $2, last_password_change = now() WHERE id = $3',
        [transformedPassword.derived, JSON.stringify(transformedPassword.options), loginId]
    );

    await database.executeQuery(
        'DELETE FROM reset_password_confirmations WHERE id = $1',
        [resetId]
    );

    return newPassword;
}

if (constants.enableCustomAuth) {

    router.post('/register', throttling.intercept('registerCustomAuth', constants.throttleRegisterCustomAuthSeconds),
        async (req, res) => {

            const input = req.body;
            input.minAge = input.minAge || 0;

            const valid = validateEmail(input.email)
                && validatePassword(input.password)
                && input.acceptPrivacy
                && input.acceptTos
                && validateMinAge(input.minAge);

            if (! valid) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters
                });
                return;
            }

            if (constants.reCAPTCHASecretKey && ( ! await validateNotARobot(input.notARobotResponse))) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters,
                    statusText: 'Failed to verify that the user is not a robot'
                });
                return;
            }

            if (await emailInUse(input.email)) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters,
                    statusText: 'An account is already registered with that email address'
                });
                return;
            }

            if (await emailNotAllowed(input.email)) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters,
                    statusText: 'The provided email address cannot be used to register an account'
                });
                return;
            }

            const confirmationId = await registerUserAndGetConfirmationId(input.email, input.password, input.minAge);

            emailRegistrationConfirmation(input.email, confirmationId);

            res.sendJson({
                status: constants.statusCodes.ok
            });
        });

    //GET is needed as the user normally opens a link with the confirmation id
    router.get('/confirm/:id', throttling.intercept('registerCustomAuth', constants.throttleRegisterCustomAuthSeconds),
        async (req, res) => {

        if (await confirmRegistration(req.params.id)) {

            res.redirect(constants.registrationConfirmationRedirectUrl);
            return;
        }
        res.send('Could not confirm registration.');
    });

    router.post('/login', throttling.intercept('loginCustomAuth', constants.throttleRegisterCustomAuthSeconds),
        async (req, res) => {

            const input = req.body;

            const valid = validateEmail(input.email)
                && (input.password && input.password.length)
                && input.acceptPrivacy
                && input.acceptTos;

            if (! valid) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters
                });
                return;
            }

            const authId = await login(input.email, input.password);

            if (authId.length < 1) {

                res.sendJson({

                    status: constants.statusCodes.invalidParameters,
                });
                return;
            }

            authService.showInOnlineUsers(res, input.showInOnlineUsers);

            const authResult = await authService.forwardAuth(res, authId, 'custom');

            if (true === authResult) {

                res.sendJson({

                    status: constants.statusCodes.ok
                });
            }
            else {

                throw new Error(authResult);
            }
        });

    router.post('/change_password', throttling.intercept('changePasswordCustomAuth', constants.throttleRegisterCustomAuthSeconds),
        async (req, res) => {

            const input = req.body;

            const valid = validateEmail(input.email)
                && (input.oldPassword && input.oldPassword.length)
                && validatePassword(input.newPassword);

            if (! valid) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters
                });
                return;
            }

            if (constants.reCAPTCHASecretKey && ( ! await validateNotARobot(input.notARobotResponse))) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters,
                    statusText: 'Failed to verify that the user is not a robot'
                });
                return;
            }

            if (await changePassword(input.email, input.oldPassword, input.newPassword)) {

                emailPasswordChangeNotificationLink(input.email);

                res.sendJson({
                    status: constants.statusCodes.ok
                });
            }
            else {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters
                });
            }
        });

    router.post('/reset_password', throttling.intercept('resetPasswordCustomAuth', constants.throttleRegisterCustomAuthSeconds),
        async (req, res) => {

            const input = req.body;

            const valid = validateEmail(input.email)
                && input.acceptPrivacy
                && input.acceptTos;

            if (! valid) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters
                });
                return;
            }

            if (constants.reCAPTCHASecretKey && ( ! await validateNotARobot(input.notARobotResponse))) {

                res.sendJson({
                    status: constants.statusCodes.invalidParameters,
                    statusText: 'Failed to verify that the user is not a robot'
                });
                return;
            }

            const resetId = await getIdForResettingPassword(input.email);

            if (resetId) {

                emailResetPasswordLink(input.email, resetId);
            }

            //send ok even if the email does not exist, so as not to alert the user to whether the email is used or not
            res.sendJson({
                status: constants.statusCodes.ok
            });
        });

    //GET is needed as the user normally opens a link with the confirmation id
    router.get('/confirm_reset_password/:id', throttling.intercept('resetPasswordCustomAuth', constants.throttleResetPasswordCustomAuthSeconds),
        async (req, res) => {

            const newPassword = await confirmResetPassword(req.params.id);
            if (newPassword && newPassword.length) {

                res.send('Your new password: ' + newPassword);
                return;
            }
            res.send('Could not reset the password.');
        });
}

module.exports = router;
