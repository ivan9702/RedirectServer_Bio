require('./config/config');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const mung = require('express-mung');
// multi-language
const i18n = require('i18next');
const i18nFsBackend = require('i18next-node-fs-backend');
const i18nMiddleware = require('i18next-express-middleware');

var {mongoose} = require('./db/mongoose');
const {EventLog} = require('./models/eventLog');
const {Statistics} = require('./models/statistics');
var index = require('./routes/index');
var redirect = require('./routes/redirect');
const pubKey = require('./routes/pubKey');

var app = express();

// multi-language setup
i18n.use(i18nMiddleware.LanguageDetector)
    .use(i18nFsBackend)
    .init({
      fallbackLng: 'en',
      backend: {
        loadPath: __dirname + '/locales/{{lng}}/translation.json'
      }
    });

app.use(i18nMiddleware.handle(i18n, {}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(mung.json(
  function transform(body, req, res) {
    res.on('finish', async function() {
      if (req.baseUrl === '/redirect' && (req.path !== '/' && req.path.substring(0,7) !== '/getLog' && req.path.substring(0,7) !== '/getBio')) {
        const reqPath = req.path;
        const clientUserId = (req.body.clientUserId) ? req.body.clientUserId : null;
        const fpIndex = (req.body.fpIndex) ? parseInt(req.body.fpIndex, 10) : null;
        const userId = (req.logInfo && req.logInfo.userId) ? req.logInfo.userId : null;
        const userInfo = {clientUserId, fpIndex, userId};
        const resBody = body;
        const bsId = (req.logInfo && req.logInfo.bsId) ? req.logInfo.bsId : null;
        const eventTime = new Date();

        const newEventLog = new EventLog({
          reqPath,
          userInfo,
          resBody,
          bsId,
          eventTime: eventTime.toUTCString()
        });
        try {
          await newEventLog.save();
          // update totalXXXAmount
          BrowserInfo.totalAPICallAmount++;
          if (resBody.code > 40000) {
            BrowserInfo.totalErrCallAmount++;
          }
          switch (reqPath) {
            case "/enroll":
              BrowserInfo.totalEnrollAmount++;
              break;
            case "/delete":
              BrowserInfo.totalDeleteAmount++;
              break;
            case "/verify":
              BrowserInfo.totalVerifyAmount++;
              break;
            case "/identify":
              BrowserInfo.totalIdentifyAmount++;
              break;
          }
          if (eventTime.yyyymmdd() != BrowserInfo.todayDate.yyyymmdd()) {
            updateStatistics({
              reqPath: reqPath,
              resCode: resBody.code,
              eventTime: eventTime
            });
            console.log('not the same');
          } else {
            updateTodaysStatistics(reqPath, resBody.code);
            const copyObj = Object.assign({}, BrowserInfo);
            await Statistics.findOneAndUpdate({index: 1}, {
              $set: {
                browserInfo: copyObj,
                updateTime: eventTime.toUTCString()
              }
            });
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        return;
      }
    });
  }
));

app.use('/', index);
app.use('/redirect', redirect);
app.get('/publicKey', pubKey.getKey);

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
