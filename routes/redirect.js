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
      if (200 === response.data.code) {
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
      res.json({code: 200, message: 'New bioserver has been saved.'});
    }).catch((err) => {
      if (11000 === err.code) {
        res.json({code: 406, message: 'This bioserver has already existed.'});
      } else if ('Not clean' === err.message || 'bioserver error' === err.message || 0 === errorFlag) {
        res.json({code: 404, message: 'Could not connect the new Bioserver or Bioserver not clean.'});
      } else if (2 === errorFlag) {
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      } else {
        res.json({code: 501, message: 'May be Some Error on Input or Server.'});
      }
    });
  } else {
    res.json({code: 406, message: 'Required Columns Not Fullfilled.'});
  }
});

redirect.use(serverExists);

redirect.post('/enroll', (req, res) => {
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae && req.body.clientUserId && req.body.fpIndex) {
    req.body.fpIndex = parseInt(req.body.fpIndex, 10);
    // sort bioservers by count
    RedirectData.bioservers.sort((a, b) => {
      return a.count - b.count;
    });
    // new user
    let errorFlag = 1;
    let userId = RedirectData.lastUserId;
    let bioServerId = RedirectData.bioservers[0].bsId;
    let addFPIP = RedirectData.bioservers[0].bsIP;
    UserFP.find({
      clientUserId: req.body.clientUserId
    }).then((userFPs) => {
      if (0 !== userFPs.length) {
        // user exists
        if (userFPs.find((userFP) => userFP.fpIndex === req.body.fpIndex)) {
          // fpIndex exists
          throw new Error('FP exists');
        }
        userId = userFPs[0].userId;
        bioServerId = userFPs[0].bioServerId;
        let targetServer = RedirectData.bioservers.find((bioserver) => bioserver.bsId === bioServerId);
        addFPIP = targetServer.bsIP;
      }
      // save userFP & update bioserverId
      errorFlag = 2;
      let updatedBsId = BioserverId.findOneAndUpdate({
        bsId: bioServerId
      }, {
        $inc: {count: 1}
      }, {
        new: true
      });

      let newUserFP = new UserFP({
        clientUserId: req.body.clientUserId,
        userId: userId,
        fpIndex: req.body.fpIndex,
        bioServerId: bioServerId,
        updated_at: new Date().toUTCString()
      }).save();

      return Promise.all([newUserFP, updatedBsId]);
    }).then((results) => {
      errorFlag = 3;
      req.logInfo.bsId = bioServerId;
      return axios.post(addFPIP + '/api/addFP', {
        userId: userId,
        fpIndex: req.body.fpIndex,
        eSkey: req.body.eSkey,
        iv: req.body.iv,
        encMinutiae: req.body.encMinutiae
      }, {httpsAgent: agent});
    }).then((response) => {
      errorFlag = 4;
      req.logInfo.userId = userId;
      if (20001 === response.data.code) {
        if (userId === RedirectData.lastUserId) {
          RedirectData.lastUserId++;
        }
        // update RedirectData.bioservers
        RedirectData.bioservers.forEach((bioserver) => {
          if (bioserver.bsId === bioServerId) {
            bioserver.count++;
          }
        });
        res.json({code: response.data.code, message: response.data.message});
      } else {
        throw new Error(JSON.stringify({code: response.data.code, message: response.data.message}));
      }
    }).catch((err) => {
      // 1. error for UserFP.find
      // 2. 'FP exists'
      // 3. error for newUserFP.save() & update bioserverId
      // 4. axios error -> UserFP.findOneAndRemove
      // 5. 'bioserver error' -> UserFP.findOneAndRemove
      if ('FP exists' === err.message) {
        res.json({code: 40605, message: 'User\'s Finger Data Already Exists.'});
      } else if (3 === errorFlag || 4 === errorFlag) {
        let recoverBioserId = BioserverId.findOneAndUpdate({bsId: bioServerId}, {$inc: {count: -1}}, {new: true});
        let recoverUserFP = UserFP.findOneAndRemove({
          clientUserId: req.body.clientUserId,
          userId: userId,
          fpIndex: req.body.fpIndex,
          bioServerId: bioServerId
        });
        Promise.all([recoverBioserId, recoverUserFP]).then(() => {
          throw new Error('501');
        }).catch((error) => {
          if (3 === errorFlag) {
            res.json({code: 50103, message: 'An Error happens when Linking Bioserver.'});
          } else if (4 === errorFlag) {
            let errObj = JSON.parse(err.message);
            res.json({code: errObj.code, message: errObj.message});
          } else {
            res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
          }
        });
      } else {
        console.log(err);
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      }
    });
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

redirect.post('/delete', (req, res) => {
  if (req.body.clientUserId && req.body.fpIndex) {
    req.body.fpIndex = parseInt(req.body.fpIndex, 10);
    let errorFlag = 0;
    let backupUserFP;
    UserFP.findOneAndRemove({
      clientUserId: req.body.clientUserId,
      fpIndex: req.body.fpIndex
    }).then((userFP) => {
      errorFlag = 1;
      if (userFP) {
        // user's FP exists
        backupUserFP = {
          clientUserId: userFP.clientUserId,
          userId: userFP.userId,
          fpIndex: userFP.fpIndex,
          bioServerId: userFP.bioServerId,
          updated_at: userFP.updated_at
        };
        // update BioserverId
        return BioserverId.findOneAndUpdate({bsId: userFP.bioServerId}, {$inc: {count: -1}}, {new: true});
      } else {
        // the user's FP does not exist
        throw new Error('not exists');
      }
    }).then((bioserver) => {
      errorFlag = 2;
      req.logInfo.bsId = bioserver.bsId;
      return axios.post(bioserver.bsIP + '/api/deleteFP', {
        userId: backupUserFP.userId,
        fpIndex: req.body.fpIndex
      }, {httpsAgent: agent});
    }).then((response) => {
      req.logInfo.userId = backupUserFP.userId;
      errorFlag = 3;
      let result = {code: 0, message: ''};
      if (20002 === response.data.code || 40401 === response.data.code || 40402 === response.data.code) {
        // update RedirectData.bioservers
        RedirectData.bioservers.forEach((bioserver) => {
          if (bioserver.bsId === backupUserFP.bioServerId) {
            bioserver.count--;
          }
        });
        result.code = response.data.code;
        result.message = response.data.message;
        res.json(result);
      } else {
        throw new Error(JSON.stringify({code: response.data.code, message: response.data.message}));
      }
    }).catch((err) => {
      // 1. error for UserFP.findOneAndRemove
      // 2. 'no exists'
      // 3. errorFlag === 1: error for update bioserverId -> new UserFP.save()
      // 4. errorFlag === 2: axios error -> new UserFP.save() & update bioserverId
      // 5. errorFlag === 3 -> new UserFP.save() & update bioserverId
      if ('not exists' === err.message) {
        res.json({code: 40404, message: 'The Specified User Id and FP Index Number Does Not Exist.'});
      } else if (1 === errorFlag || 2 === errorFlag || 3 === errorFlag) {
        let recoverUserFP = new UserFP(backupUserFP).save();
        let recoverise = [];
        recoverise.push(recoverUserFP);
        if (2 === errorFlag || 3 === errorFlag) {
          let recoverBioserId = BioserverId.findOneAndUpdate({bsId: backupUserFP.bioServerId}, {$inc: {count: 1}}, {new: true});
          recoverise.push(recoverBioserId);
        }
        Promise.all(recoverise).then(() => {
          throw new Error('501');
        }).catch((error) => {
          if (2 === errorFlag) {
            res.json({code: 50103, message: 'An Error happens when Linking Bioserver.'});
          } else if (3 === errorFlag) {
            let errObj = JSON.parse(err.message);
            res.json({code: errObj.code, message: errObj.message});
          } else {
            res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
          }
        });
      } else {
        console.log(err);
        res.json({code: 50102, message: 'May be Some Error on MongoDB.'});
      }
    });
  } else {
    res.json({code: 40603, message: 'Required Columns Not Fulfilled.'});
  }
});

module.exports = redirect;
