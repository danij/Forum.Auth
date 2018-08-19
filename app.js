const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');

const double_submit_cookie = require('./routes/double_submit_cookie');
const auth = require('./routes/auth');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/double_submit_cookie', double_submit_cookie);
app.use('/', auth);

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
