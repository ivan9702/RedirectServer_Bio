var express = require('express');
var router = express.Router();

const {EventLog} = require('./../models/eventLog');

Date.prototype.yyyymmdd = function() {
  const yyyy = this.getFullYear().toString();
  const mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  const dd  = this.getDate().toString();

  return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};

Array.prototype.sum = function () {
  return this.reduce((acc, cur) => acc + cur, 0);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function get7days(today) {
  const sevenDays = [];
  for(let i = 0; i < 7; i++){
    let dateToPush = new Date(today);
    dateToPush.setDate(today.getDate() - i);
    dateToPush = dateToPush.yyyymmdd();
    sevenDays.push(dateToPush);
  }
  return sevenDays;
};

/* GET home page. */
router.get('/', async function(req, res, next) {
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  let currentDate = todayDate.yyyymmdd();
  let currentLogDateObj = new Date(todayDate);
  const sevenDays = get7days(todayDate);
  const beginDate = new Date(todayDate);
  beginDate.setDate(todayDate.getDate() - 6);

  const todayInfo = {
    todayAPICallAmount: 0,
    todayErrCallAmount: 0,
    today200Amount: 0,
    today403Amount: 0,
    today404Amount: 0,
    today406Amount: 0,
    today501Amount: 0,
  };
  const weeklyInfo = {
    sevenDayEnroll: [0,0,0,0,0,0,0],
    sevenDayDelete: [0,0,0,0,0,0,0],
    sevenDayVerify: [0,0,0,0,0,0,0],
    sevenDayIdentify: [0,0,0,0,0,0,0],
    sevenDayError: [0,0,0,0,0,0,0]
  };
  let skipNumber = 0;
  const chunkSize = 10;
  let totalLogsAmount = 0;
  let index = 0;
  try {
    while (true) {
      const logs = await EventLog.find(
        { eventTime: { $gte: beginDate }, },
        null,
        { skip: skipNumber * chunkSize, sort: { eventTime: -1 }, limit: chunkSize }
      );
      logs.forEach((log) => {
        if (log.eventTime > todayDate) {
          // today's log
          todayInfo.todayAPICallAmount++;
          if (log.resBody.code > 40000) {
            todayInfo.todayErrCallAmount++;
          }
          switch (log.resBody.code) {
            case 20001:
            case 20002:
            case 20003:
            case 20004:
            case 20005:
            case 20006:
              todayInfo.today200Amount++;
              break;
            case 40301:
            case 40302:
              todayInfo.today403Amount++;
              break;
            case 40401:
            case 40402:
            case 40403:
            case 40404:
            case 40405:
              todayInfo.today404Amount++;
              break;
            case 40601:
            case 40602:
            case 40603:
            case 40604:
            case 40605:
            case 40606:
            case 40607:
              todayInfo.today406Amount++;
              break;
            case 50101:
            case 50102:
            case 50103:
              todayInfo.today501Amount++;
              break;
          }
        } else {
          if (log.eventTime.yyyymmdd() !== currentDate) {
            // Date in the log changed
            const basedDate = new Date(log.eventTime);
            basedDate.setHours(0, 0, 0, 0);
            // find the difference between 2 dates
            index += dateDiffInDays(basedDate, currentLogDateObj);
            currentDate = log.eventTime.yyyymmdd();
            currentLogDateObj = new Date(log.eventTime);
          }
        }
        if (log.resBody.code > 40000) {
          weeklyInfo.sevenDayError[index]++;
        }
        switch (log.reqPath) {
          case "/enroll":
            weeklyInfo.sevenDayEnroll[index]++;
            break;
          case "/delete":
            weeklyInfo.sevenDayDelete[index]++;
            break;
          case "/verify":
            weeklyInfo.sevenDayVerify[index]++;
            break;
          case "/identify":
            weeklyInfo.sevenDayIdentify[index]++;
            break;
        }
      });
      totalLogsAmount += logs.length;
      if (logs.length < chunkSize) {
        break;
      }
      skipNumber++;
    }
  } catch (e) {
    console.log(e);
  }
  const sum = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 7; ++i) {
    // enroll & delete
    sum[i] = weeklyInfo.sevenDayEnroll[i] + weeklyInfo.sevenDayDelete[i];
  }
  let FPCount = 0;
  RedirectData.bioservers.forEach((bioserver) => {
    FPCount += bioserver.count;
  });

  const totalError = weeklyInfo.sevenDayError.sum();
  const totalEnroll = weeklyInfo.sevenDayEnroll.sum();
  const totalVerify = weeklyInfo.sevenDayVerify.sum();
  const totalIdentify = weeklyInfo.sevenDayIdentify.sum();
  const totalDelete = weeklyInfo.sevenDayDelete.sum();
  const others = totalLogsAmount - totalEnroll - totalVerify - totalIdentify - totalDelete;

  res.render('index', {
    title: 'serverStatus',
    current: 0,
    currentSub: 0,
    totalAPICallAmount: numberWithCommas(totalLogsAmount),
    todayAPICallAmount: numberWithCommas(todayInfo.todayAPICallAmount),
    todayAPICallPercent: totalLogsAmount === 0 ? 0 : Math.round((todayInfo.todayAPICallAmount / totalLogsAmount) * 1000) / 10,
    totalFPAmount: FPCount,
    totalFPAmountPercent: Math.round(FPCount / 200) / 10,
    databaseLink: DBCONNECTION,
    todayErrCallAmount: numberWithCommas(todayInfo.todayErrCallAmount),
    totalErrCallAmount: numberWithCommas(totalError),
    todayErrCallPercent: totalError === 0 ? 0 : Math.round((todayInfo.todayErrCallAmount / totalError) * 1000) / 10,
    today200Percent: todayInfo.todayAPICallAmount === 0 ? 0 : Math.round((todayInfo.today200Amount / todayInfo.todayAPICallAmount) * 10000) / 100,
    today403Percent: todayInfo.todayAPICallAmount === 0 ? 0 : Math.round((todayInfo.today403Amount / todayInfo.todayAPICallAmount) * 10000) / 100,
    today404Percent: todayInfo.todayAPICallAmount === 0 ? 0 : Math.round((todayInfo.today404Amount / todayInfo.todayAPICallAmount) * 10000) / 100,
    today406Percent: todayInfo.todayAPICallAmount === 0 ? 0 : Math.round((todayInfo.today406Amount / todayInfo.todayAPICallAmount) * 10000) / 100,
    today501Percent: todayInfo.todayAPICallAmount === 0 ? 0 : Math.round((todayInfo.today501Amount / todayInfo.todayAPICallAmount) * 10000) / 100,
    sevenDays: sevenDays,
    sum: sum,
    sevenDayVerify: weeklyInfo.sevenDayVerify,
    sevenDayIdentify: weeklyInfo.sevenDayIdentify,
    sevenDayError: weeklyInfo.sevenDayError,
    totalEnrollAmountChart: totalEnroll,
    totalIdentifyAmountChart: totalIdentify,
    totalVerifyAmountChart: totalVerify,
    totalDeleteAmountChart: totalDelete,
    totalOthersAmountChart: others,
    totalIdentifyPercent: totalLogsAmount === 0 ? 0 : Math.round((totalIdentify / totalLogsAmount) * 1000) / 10,
    totalVerifyPercent: totalLogsAmount === 0 ? 0 : Math.round((totalVerify / totalLogsAmount) * 1000) / 10,
    totalEnrollPercent: totalLogsAmount === 0 ? 0 : Math.round((totalEnroll / totalLogsAmount) * 1000) / 10,
    totalDeletePercent: totalLogsAmount === 0 ? 0 : Math.round((totalDelete / totalLogsAmount) * 1000) / 10,
    totalOthersPercentage: totalLogsAmount === 0 ? 0 : Math.round((others / totalLogsAmount) * 1000) / 10,
  });
});

router.get('/log/restful-api/:code', (req, res) => {
  res.render('logRESTfulAPI', {
    title: 'serverLogCheck',
    current: 4,
    currentSub: parseInt(req.params.code)
  });
});

router.get('/log/bioServerInfo', (req, res) => {
  res.render('bioserverInfo', {
    title: 'bioserverInfo',
    current: 6,
    currentSub: 0,
    rsVersion: BrowserInfo.version
  });
});

module.exports = router;
