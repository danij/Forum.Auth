const nodemailer = require('nodemailer');
const constants = require('./constants');

module.exports = {

    sendEmail: (address, subject, textBody, htmlBody) => {

        const transportOptions = {

            host: constants.emailHost,
            port: constants.emailPort,
            secure: constants.emailSecure,

        };
        if (constants.emailUser && constants.emailUser.length && constants.emailPassword && constants.emailPassword.length) {

            transportOptions.auth = {

                user: constants.emailUser,
                pass: constants.emailPassword
            }
        }

        const transporter = nodemailer.createTransport(transportOptions);

        const mailOptions = {

            from: '"' + constants.emailFromName + '" ' + constants.emailFromName,
            to: address,
            subject: subject,
            text: textBody,
            html: htmlBody
        };

        return new Promise((resolve, reject) => {

            transporter.sendMail(mailOptions, (error, info) => {

                if (error) {

                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
};