var express = require('express');
const axios = require('axios');
const https = require('https');

const {BioserverId} = require('./../models/bioserverId');
const {UserFP} = require('./../models/userFP');
const serverExists = require('./middleware/serverExists');
const {EventLog} = require('./../models/eventLog');

const js_yyyy_mm_dd_hh_mm_ss = function(now) {
  let year = "" + now.getFullYear();
  let month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
  let day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
  let hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
  let minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
  let second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
};

const getDateFromString = function (stringDate) {
  const result = stringDate.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/);
  if (!result) {
    return null;
  }
  const targetYear = parseInt(result[1]);
  const targetMonth = parseInt(result[2]);
  const targetDay = parseInt(result[3]);
  const targetHour = parseInt(result[4]);
  const targetMinute = parseInt(result[5]);
  return new Date(targetYear, targetMonth - 1, targetDay, targetHour, targetMinute, 0, 0);
};

var redirect = express.Router();
const agent = new https.Agent({rejectUnauthorized: false});

/* GET users listing. */
redirect.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

redirect.get('/getLog/:page*?', (req, res) => {
  let pageNumber = 1;
  if (req.params.page)
    pageNumber = req.params.page;
  
  let skipNumber = 30 * (pageNumber - 1);
  let resultArray = [];
  let searchFilter = {};
  let dateFilter = {};

  if (req.query.code) {
    searchFilter["resBody.code"] = {$gt: parseInt(req.query.code) * 100, $lt: parseInt(req.query.code) * 100 + 50};
    // searchFilter["resBody.code"] = parseInt(req.query.code);
  }
  if(req.query.query) {
    searchFilter["$text"] = {$search: req.query.query};
  }
  if (req.query.startDate) {
    let targetDateBegin = getDateFromString(req.query.startDate);
    if (targetDateBegin) {
      dateFilter["$gte"] = targetDateBegin;
    }
  }
  if (req.query.endDate) {
    let targetDateEnd = getDateFromString(req.query.endDate);
    if (targetDateEnd) {
      dateFilter["$lte"] = targetDateEnd;
    }
  }
  if (dateFilter["$gte"] || dateFilter["$lte"]) {
    searchFilter["eventTime"] = dateFilter;
  }
  EventLog.find(searchFilter, null, {skip: skipNumber, limit: 30, sort: {eventTime: -1}}).then((eventLogs) => {
    if (0 !== eventLogs.length) {
      eventLogs.forEach((eventLog) => {
        let result = {
          reqPath: eventLog.reqPath,
          userId: eventLog.userInfo && eventLog.userInfo.userId ? eventLog.userInfo.userId : 0,
          fpIndex: eventLog.userInfo && eventLog.userInfo.fpIndex ? eventLog.userInfo.fpIndex : 0,
          clientUserId: eventLog.userInfo && eventLog.userInfo.clientUserId ? eventLog.userInfo.clientUserId : '',
          responseCode: eventLog.resBody && eventLog.resBody.code ? eventLog.resBody.code : 0,
          message: eventLog.resBody && eventLog.resBody.message ? eventLog.resBody.message : '',
          bsId: eventLog.bsId ? eventLog.bsId : '',
          eventTime: eventLog.eventTime ? js_yyyy_mm_dd_hh_mm_ss(eventLog.eventTime) : ''
        };
        if (eventLog.reqPath === '/identify') {
          result.clientUserId = eventLog.resBody && eventLog.resBody.data && eventLog.resBody.data.clientUserId ? eventLog.resBody.data.clientUserId : '';
          result.fpIndex = eventLog.resBody && eventLog.resBody.data && eventLog.resBody.data.fpIndex ? eventLog.resBody.data.fpIndex : 0;
        } else if (eventLog.reqPath === '/verify') {
          result.fpIndex = eventLog.resBody && eventLog.resBody.data && eventLog.resBody.data.fpIndex ? eventLog.resBody.data.fpIndex : 0;
        }
        resultArray.push(result);
      });
    }
    res.json(resultArray);
  }).catch((err) => {
    res.json({code: 501, message: 'May be Some Error on Input or Server (/getLog)'});
  });
});

redirect.get('/getBio', (req, res) => {
  let resultArray = [];
  RedirectData.bioservers.forEach((bioserver) => {
    resultArray.push({
      bsIP: bioserver.bsIP,
      bsId: bioserver.bsId,
      count: bioserver.count,
      version: bioserver.version
    });
  });

  res.json(resultArray);
});

redirect.post('/addBioserver', (req, res) => {
  req.logInfo = {};
  if (req.body.bsIP) {
    let errorFlag = 0;
    let bioserverURL = req.body.bsIP + '/api/getServerInfo';
    axios.get(bioserverURL, {httpsAgent: agent}).then((response) => {
      errorFlag = 1;
      if (20005 === response.data.code) {
        if (0 === response.data.count) {
          errorFlag = 2;
          let newBioserver = new BioserverId({
            bsIP: req.body.bsIP,
            bsId: RedirectData.lastBSId,
            count: 0,
            version: response.data.version,
            updated_at: new Date().toUTCString()
          });
          return newBioserver.save();
        } else {
          throw new Error('Not clean');
        }
      } else {
        throw new Error('bioserver error');
      }
    }).then((newBS) => {
      RedirectData.bioservers.push({
        bsIP: req.body.bsIP,
        bsId: RedirectData.lastBSId,
        count: 0,
        version: newBS.version
      });
      console.log('RedirectData.bioservers: ' + JSON.stringify(RedirectData.bioservers, null, 2));
      RedirectData.lastBSId++;
      res.json({
        code: 20005,
        message: 'New bioserver has been saved.',
        data: {
          bsId: RedirectData.lastBSId - 1,
          version: newBS.version
        }
      });
    }).catch((err) => {
      if (11000 === err.code) {
        res.json({code: 40606, message: 'This bioserver has already existed.'});
      } else if ('Not clean' === err.message || 'bioserver error' === err.message || 0 === errorFlag) {
        res.json({code: 40405, message: 'Could not connect to the new Bioserver or Bioserver not clean.'});
      } else if (2 === errorFlag) {
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      } else {
        res.json({code: 50101, message: 'May be Some Error on Input or Server.'});
      }
    });
  } else {
    res.json({code: 40603, message: 'Required Columns Not Fullfilled.'});
  }
});

redirect.use(serverExists);

redirect.post('/enroll', async (req, res) => {
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae && req.body.clientUserId && req.body.fpIndex) {
    req.body.fpIndex = parseInt(req.body.fpIndex, 10);
    let targetIndex = 0;
    let count;

    /* Find the Bioserver with the min count */
    RedirectData.bioservers.forEach((bioserver, index) => {
      if (0 === index) {
        count = bioserver.count;
      } else {
        if (bioserver.count < count) {
          targetIndex = index;
          count = bioserver.count;
        }
      }
    });

    /* Setup for new user */
    let errorFlag = 1;
    let userId = RedirectData.lastUserId;
    let bioServerId = RedirectData.bioservers[targetIndex].bsId;
    let addFPIP = RedirectData.bioservers[targetIndex].bsIP;
    let isNewUser = 1;
    const arrIndex = req.body.fpIndex - 1;
    try {
      const user = await UserFP.findOne({ clientUserId: req.body.clientUserId });
      errorFlag = 2;
      if (user) {
        if (user.fpIndex[arrIndex]) {
          /* fpIndex exists */
          throw new Error('FP exists');
        }
        userId = user.userId;
        bioServerId = user.bioServerId;
        const targetServer = RedirectData.bioservers.find((bioserver) => bioserver.bsId === bioServerId);
        addFPIP = targetServer.bsIP;
        isNewUser = 0;
      }
      req.logInfo.bsId = bioServerId;

      const response = await axios.post(addFPIP + '/api/addFP', {
        userId: userId,
        fpIndex: req.body.fpIndex,
        eSkey: req.body.eSkey,
        iv: req.body.iv,
        encMinutiae: req.body.encMinutiae
      }, { httpsAgent: agent });
      errorFlag = 3;
      req.logInfo.userId = userId;

      if (20001 === response.data.code) {
        /* Update RedirectData */
        if (userId === RedirectData.lastUserId) {
          RedirectData.lastUserId++;
        }
        const addedServer = RedirectData.bioservers.find((bioserver) => bioserver.bsId === bioServerId);
        addedServer.count++;
        /* Update BioserverId */
        await BioserverId.findOneAndUpdate({
          bsId: bioServerId
        }, {
          $inc: {count: 1}
        });
        errorFlag = 4;
        /* Update UserFP */
        if (0 === isNewUser) {
          const update = {};
          update['fpIndex.' + arrIndex] = 1;
          await UserFP.findOneAndUpdate({
            clientUserId: req.body.clientUserId
          }, {
            $set: update
          });
        } else {
          const indexArr = new Array(10).fill(0);
          indexArr[arrIndex] = 1;
          const newUserFP = new UserFP({
            clientUserId: req.body.clientUserId,
            userId: userId,
            fpIndex: indexArr,
            privilege: req.body.privilege ? req.body.privilege : 0,
            bioServerId: bioServerId,
            updated_at: new Date().toUTCString()
          });
          await newUserFP.save();
        }
      }
      res.json({ code: response.data.code, message: response.data.message });
    } catch (err) {
      if ('FP exists' === err.message) {
        res.json({code: 40605, message: 'User\'s Finger Data Already Exists.'});
      } else if (2 === errorFlag) {
        res.json({code: 50103, message: 'An Error Happens When Linking Bioserver.'});
      } else {
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      }
    }
  } else {
    res.json({code: 40603, message: 'Required Columns Not Fulfilled.'});
  }
});

redirect.post('/identify', (req, res) => {
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae) {
    let errorFlag = 0;
    BioserverId.find({}).then((bioservers) => {
      errorFlag = 1;
      let axiosArray = bioservers.map((bioserver) => {
        return axios.post(bioserver.bsIP + '/api/identifyFP', {
          eSkey: req.body.eSkey,
          iv: req.body.iv,
          encMinutiae: req.body.encMinutiae
        }, {httpsAgent: agent});
      });
      return axios.all(axiosArray);
    }).then((responses) => {
      errorFlag = 2;
      let candidates = [];
      let scores = [];
      responses.forEach((response) => {
        if (20004 === response.data.code) {
          candidates.push(response.data.data);
          scores.push(response.data.data.score);
        }
      });
      if (0 !== scores.length) {
        let result = candidates[scores.indexOf(Math.max(...scores))];
        UserFP.findOne({
          userId: result.userId,
          fpIndex: result.fpIndex
        }).then((userFP) => {
          // let targetServer = RedirectData.bioservers.find((bioserver) => bioserver.bsId === userFP.bioServerId);
          req.logInfo.bsId = userFP.bioServerId;
          req.logInfo.userId = userFP.userId;
          res.json({
            code: 20004,
            message: 'User is Identified.',
            data: {
              clientUserId: userFP.clientUserId,
              fpIndex: result.fpIndex,
              score: result.score
            }
          });
        }).catch((err) => {
          res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
        });
      } else {
        res.json({code: responses[0].data.code, message: responses[0].data.message});
      }   
    }).catch((err) => {
      if (1 === errorFlag) {
        res.json({code: 50103, message: 'An Error happens when Linking Bioserver.'});
      } else {
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      }
    });
  } else {
    res.json({code: 40603, message: 'Required Columns Not Fulfilled.'});
  }
});

redirect.post('/verify', (req, res) => {
  let userIdForLog;
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae && req.body.clientUserId) {
    let errorFlag = 0;
    UserFP.find({
      clientUserId: req.body.clientUserId
    }).then((user) => {
      errorFlag = 1;
      if (0 !== user.length) {
        const verifyServer = RedirectData.bioservers.find((bioserver) => bioserver.bsId === user[0].bioServerId);
        req.logInfo.bsId = verifyServer.bsId;
        userIdForLog = user[0].userId;
        return axios.post(verifyServer.bsIP + '/api/verifyFP', {
          userId: user[0].userId,
          eSkey: req.body.eSkey,
          iv: req.body.iv,
          encMinutiae: req.body.encMinutiae
        }, {httpsAgent: agent});
      } else {
        // no user matches the clientUserId
        throw new Error('no match');
      }
    }).then((response) => {
      req.logInfo.userId = userIdForLog;
      errorFlag = 2;
      let result = {
        code: response.data.code,
        message: response.data.message
      };
      if (20003 === response.data.code) {
        result.data = {fpIndex: response.data.data.fpIndex, score: response.data.data.score};
      }
      res.json(result);
    }).catch((err) => {
      if ('no match' === err.message) {
        res.json({code: 40302, message: 'The User Has Not Enrolled Yet.'});
      } else if (1 === errorFlag) {
        res.json({code: 50103, message: 'An Error happens when Linking Bioserver.'});
      } else {
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      }
    });
  } else {
    res.json({code: 40603, message: 'Required Columns Not Fulfilled.'});
  }
});

redirect.post('/delete', async (req, res) => {
  if (req.body.clientUserId && 'fpIndex' in req.body) {
    let errorFlag = 0;
    req.body.fpIndex = parseInt(req.body.fpIndex, 10);
    const conditions = {clientUserId: req.body.clientUserId};
    const arrIndex = req.body.fpIndex - 1;
    try {
      const userFP = await UserFP.findOne(conditions);
      errorFlag = 1;
      if (userFP) {
        if (arrIndex >= 0 && userFP.fpIndex[arrIndex] === 0) {
          throw new Error('FP not exist');
        }
        /* Find the target Bioserver's IP */
        const targetServer = RedirectData.bioservers.find((bioserver) => bioserver.bsId === userFP.bioServerId);
        req.logInfo.bsId = userFP.bioServerId;
        const response = await axios.post(
          targetServer.bsIP + '/api/deleteFP',
          {userId: userFP.userId, fpIndex: req.body.fpIndex},
          {httpsAgent: agent}
        );
        errorFlag = 2;
        req.logInfo.userId = userFP.userId;
        const resObj = {};
        if (20002 === response.data.code || 20006 === response.data.code || 40401 === response.data.code || 40402 === response.data.code) {
          const fpNum = userFP.fpIndex.reduce((pre, cur) => pre + cur, 0);
          if (1 === fpNum || -1 === arrIndex) {
            /* No FP left after deletion */
            await UserFP.findOneAndRemove(conditions);
          } else {
            const update = {};
            update['fpIndex.' + arrIndex] = 0;
            await UserFP.findOneAndUpdate(conditions, {$set: update});
          }
          errorFlag = 3;
          /* Update BioserverId */
          const deletedFPNum = (-1 === arrIndex) ? fpNum : 1;
          await BioserverId.findOneAndUpdate(
            {bsId: userFP.bioServerId},
            { $inc: {count: -deletedFPNum} }
          );
          errorFlag = 4;
          targetServer.count -= deletedFPNum;
          resObj.data = {leftFPNum: 0};
          if (0 !== req.body.fpIndex) {
            resObj.data.leftFPNum = fpNum - 1;
          }
        }
        resObj.code = response.data.code;
        resObj.message = response.data.message;
        res.json(resObj);
      } else {
        throw new Error('FP not exist');
      }
    } catch (e) {
      if ('FP not exist' === e.message) {
        res.json({code: 40404, message: 'The Specified User Id and FP Index Number Does Not Exist.'});
      } else if (1 === errorFlag) {
        res.json({code: 50103, message: 'An Error happens when Linking Bioserver.'});
      } else {
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      }
    }
  } else {
    res.json({code: 40603, message: 'Required Columns Not Fulfilled.'});
  }
});

module.exports = redirect;
