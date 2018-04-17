var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let sum = [0,0,0,0,0,0,0];
  for (let i = 0; i < BrowserInfo.sevenDayEnroll.length; ++i) {
    sum[i] = BrowserInfo.sevenDayEnroll[i] + BrowserInfo.sevenDayDelete[i];
  }
  let FPCount = 0;
  RedirectData.bioservers.forEach((bioserver) => {
    FPCount += bioserver.count;
  });

  res.render('index', {
    title: 'serverStatus',
    current: 0,
    currentSub: 0,
    totalAPICallAmount: numberWithCommas(BrowserInfo.totalAPICallAmount),
    todayAPICallAmount: numberWithCommas(BrowserInfo.todayAPICallAmount),
    totalVerifyAmount: numberWithCommas(BrowserInfo.totalVerifyAmount),
    totalVerifyAmountChart: BrowserInfo.totalVerifyAmount,
    totalEnrollAmountChart: BrowserInfo.totalEnrollAmount,
    totalDeleteAmountChart: BrowserInfo.totalDeleteAmount,
    totalIdentifyAmount: numberWithCommas(BrowserInfo.totalIdentifyAmount),
    totalIdentifyAmountChart: BrowserInfo.totalIdentifyAmount,
    todayAPICallPercent: BrowserInfo.totalAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.todayAPICallAmount / BrowserInfo.totalAPICallAmount)*1000) / 10,
    totalFPAmount: FPCount,
    totalFPAmountPercent: Math.round(FPCount / 200) / 10,
    databaseLink: DBCONNECTION,
    totalErrCallAmount: numberWithCommas(BrowserInfo.totalErrCallAmount),
    todayErrCallAmount: numberWithCommas(BrowserInfo.todayErrCallAmount),
    todayErrCallPercent: BrowserInfo.totalErrCallAmount === 0 ? 0 : Math.round((BrowserInfo.todayErrCallAmount / BrowserInfo.totalErrCallAmount)*1000) / 10,
    today200Percent: BrowserInfo.todayAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.today200Amount / BrowserInfo.todayAPICallAmount)*10000) / 100,
    today403Percent: BrowserInfo.todayAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.today403Amount / BrowserInfo.todayAPICallAmount)*10000) / 100,
    today404Percent: BrowserInfo.todayAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.today404Amount / BrowserInfo.todayAPICallAmount)*10000) / 100,
    today406Percent: BrowserInfo.todayAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.today406Amount / BrowserInfo.todayAPICallAmount)*10000) / 100,
    today501Percent: BrowserInfo.todayAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.today501Amount / BrowserInfo.todayAPICallAmount)*10000) / 100,
    totalIdentifyPercent: BrowserInfo.totalAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.totalIdentifyAmount / BrowserInfo.totalAPICallAmount)*1000) / 10,
    totalVerifyPercent: BrowserInfo.totalAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.totalVerifyAmount / BrowserInfo.totalAPICallAmount)*1000) / 10,
    totalEnrollPercent: BrowserInfo.totalAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.totalEnrollAmount / BrowserInfo.totalAPICallAmount)*1000) / 10,
    totalDeletePercent: BrowserInfo.totalAPICallAmount === 0 ? 0 : Math.round((BrowserInfo.totalDeleteAmount / BrowserInfo.totalAPICallAmount)*1000) / 10,
    totalOthersPercentage: BrowserInfo.totalAPICallAmount === 0 ? 0 : Math.round(((BrowserInfo.totalAPICallAmount - BrowserInfo.totalIdentifyAmount - BrowserInfo.totalVerifyAmount - BrowserInfo.totalEnrollAmount - BrowserInfo.totalDeleteAmount) / BrowserInfo.totalAPICallAmount)*1000) / 10,
    totalOthersAmountChart: BrowserInfo.totalAPICallAmount - BrowserInfo.totalIdentifyAmount - BrowserInfo.totalVerifyAmount - BrowserInfo.totalEnrollAmount - BrowserInfo.totalDeleteAmount,
    sevenDays: BrowserInfo.sevenDays,
    sevenDayError: BrowserInfo.sevenDayError,
    sevenDayVerify: BrowserInfo.sevenDayVerify,
    sevenDayIdentify: BrowserInfo.sevenDayIdentify,
    sevenDayDelete: BrowserInfo.sevenDayDelete,
    sevenDayEnroll: BrowserInfo.sevenDayEnroll,
    sum: sum
  });
});

router.get('/log/restful-api', (req, res) => {
  res.render('logRESTfulAPI', { title: 'serverLogCheck', current: 5, currentSub: 0});
});

module.exports = router;
