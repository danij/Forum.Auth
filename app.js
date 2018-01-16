var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');

var double_submit_cookie = require('./routes/double_submit_cookie');
var auth = require('./routes/auth');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/double_submit_cookie', double_submit_cookie);
app.use('/', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // only provide error in development
    res.status(err.status || 500);
    res.send(req.app.get('env') === 'development' ? err : 'error');
});

app.disable('x-powered-by');

module.exports = app;
