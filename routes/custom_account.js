const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');

const constants = require('../services/constants');
const database = require('../services/database');
const throttling = require('../services/throttling');
const passwordService = require('../services/password');
const emailService = require('../services/email');

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

    return email.replace(/[^a-zA-Z0-9@]/gi, '');
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

    return 'auth_' + crypto.randomBytes(constants.registrationAuthSize).toString('hex');
}

const emailTemplate = fs.readFileSync(__dirname + '/../register_confirmation_template.html', 'utf8');

function emailRegistrationConfirmation(email, confirmationId) {

    const confirmationLink = constants.registrationConfirmationUrl + '/' + encodeURIComponent(confirmationId);
    const messageBody = emailTemplate.replace(/{{confirmation_link}}/g, confirmationLink);
    emailService.sendEmail(email, constants.registrationConfirmationTitle, messageBody, messageBody);
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
}

module.exports = router;
