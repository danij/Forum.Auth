const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');

const validation = require('./routes/validation');

const provider = require('./routes/provider');
const consent = require('./routes/consent');
const custom_account = require('./routes/custom_account');
const double_submit_cookie = require('./routes/double_submit_cookie');
const logout = require('./routes/logout');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(passport.initialize());

app.use(validation.secureCookieHelper);
app.use(validation.setupSourceAddress);
app.use(validation.checkCookieConsent);
app.use(validation.sendJsonWithPrefix);

//check referer and origin headers
app.use(validation.originRefererValidation);

app.use('/consent', consent);
app.use('/double_submit_cookie', double_submit_cookie);
app.use('/provider', provider);

app.use(validation.doubleSubmitCookieValidation);

app.use('/custom', custom_account);
app.use('/logout', logout);

// catch 404 and forward to error handler
app.use((req, res, next) => {

    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {

    // only provide error in development
    res.status(err.status || 500);
    res.send(req.app.get('env') === 'development' ? err : 'error');
});

app.disable('x-powered-by');

module.exports = app;
