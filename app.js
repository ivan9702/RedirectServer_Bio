require('./config/config');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const mung = require('express-mung');

var {mongoose} = require('./db/mongoose');
const {EventLog} = require('./models/eventLog');
var index = require('./routes/index');
var redirect = require('./routes/redirect');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(mung.json(
  function transform(body, req, res) {
    res.on('finish', () => {
      if (req.baseUrl === '/redirect') {
        const reqPath = req.path;
        const clientUserId = (req.body.clientUserId) ? req.body.clientUserId : null;
        const fpIndex = (req.body.fpIndex) ? req.body.fpIndex : null;
        const userId = (req.logInfo.userId) ? req.logInfo.userId : null;
        const userInfo = {clientUserId, fpIndex, userId};
        const resBody = body;
        const bsIP = (req.logInfo.bsIP) ? req.logInfo.bsIP : null;
        let eventTime = new Date();

        let newEventLog = new EventLog({reqPath, userInfo, resBody, bsIP, eventTime: eventTime.toUTCString()});
        newEventLog.save().then(() => {
          // console.log('eventlog saved.');
        }).catch((err) => {
          console.log('ERROR: ', err);
        });
      } else {
        return;
      }
    });
  }
));

app.use('/', index);
app.use('/redirect', redirect);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
