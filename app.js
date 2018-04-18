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
var index = require('./routes/index');
var redirect = require('./routes/redirect');

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
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(mung.json(
  function transform(body, req, res) {
    res.on('finish', () => {
      if (req.baseUrl === '/redirect' && (req.path !== '/' && req.path.substring(0,7) !== '/getLog' && req.path.substring(0,7) !== '/getBio')) {
        const reqPath = req.path;
        const clientUserId = (req.body.clientUserId) ? req.body.clientUserId : null;
        const fpIndex = (req.body.fpIndex) ? req.body.fpIndex : null;
        const userId = (req.logInfo && req.logInfo.userId) ? req.logInfo.userId : null;
        const userInfo = {clientUserId, fpIndex, userId};
        const resBody = body;
        const bsId = (req.logInfo && req.logInfo.bsId) ? req.logInfo.bsId : null;
        let eventTime = new Date();

        let newEventLog = new EventLog({reqPath, userInfo, resBody, bsId, eventTime: eventTime.toUTCString()});
        newEventLog.save().then(() => {
          if (eventTime.yyyymmdd() != BrowserInfo.today){
            updateStatistics();
            console.log('not the same');
          } else {
            BrowserInfo.totalAPICallAmount++;
            BrowserInfo.todayAPICallAmount++;

            if (resBody.code > 40000) {
              BrowserInfo.totalErrCallAmount++;
              BrowserInfo.todayErrCallAmount++;
              BrowserInfo.sevenDayError[0]++;
            }

            switch(resBody.code){
              case 20001:
              case 20002:
              case 20003:
              case 20004:
                BrowserInfo.today200Amount++;
                break;
              case 40301:
                BrowserInfo.today403Amount++;
                break;
              case 40401:
              case 40402:
              case 40403:
                BrowserInfo.today404Amount++;
                break;
              case 40601:
              case 40602:
              case 40603:
              case 40604:
                BrowserInfo.today406Amount++;
                break;
              case 50101:
              case 50102:
                BrowserInfo.today501Amount++;
                break;
            }
            switch(reqPath){
              case "/enroll":
                BrowserInfo.sevenDayEnroll[0]++;
                BrowserInfo.totalEnrollAmount++;
                break;
              case "/delete":
                BrowserInfo.sevenDayDelete[0]++;
                BrowserInfo.totalDeleteAmount++;
                break;
              case "/verify":
                BrowserInfo.sevenDayVerify[0]++;
                BrowserInfo.totalVerifyAmount++;
                break;
              case "/identify":
                BrowserInfo.sevenDayIdentify[0]++;
                BrowserInfo.totalIdentifyAmount++;
                break;
            }
          }
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
