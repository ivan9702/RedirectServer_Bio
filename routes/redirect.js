var express = require('express');
const axios = require('axios');

const {BioserverId} = require('./../models/bioserverId');
const {UserFP} = require('./../models/userFP');
const serverExists = require('./middleware/serverExists');

var redirect = express.Router();

/* GET users listing. */
redirect.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

redirect.post('/addBioserver', (req, res) => {
  if (req.body.bsIP) {
    let newBioserver = new BioserverId({
      bsIP: req.body.bsIP,
      bsId: RedirectData.lastBSId,
      count: 0,
      updated_at: new Date().toUTCString()
    });

    let errorFlag = 0;
    newBioserver.save().then(() => {
      errorFlag = 1;
      let bioserverURL = req.body.bsIP + '/api/getServerInfo';
      return axios.get(bioserverURL);
    }).then((response) => {
      if (200 === response.data.code) {
        if (0 === response.data.count) {
          RedirectData.bioservers.push({
            bsIP: req.body.bsIP,
            bsId: RedirectData.lastBSId,
            count: 0
          });
          console.log('RedirectData.bioservers: ' + JSON.stringify(RedirectData.bioservers, null, 2));
          RedirectData.lastBSId++;
          res.json({code: 200, message: 'New bioserver has been saved.'});
        } else {
          throw new Error('Not clean');
        }
      } else {
        throw new Error('bioserver error');
      }
    }).catch((err) => {
      if (11000 === err.code) {
        res.json({code: 406, message: 'This bioserver has already existed.'});
      } else if ('Not clean' === err.message || 'bioserver error' === err.message || 1 === errorFlag) {
        BioserverId.findOneAndRemove({
          bsIP: req.body.bsIP,
          bsId: RedirectData.lastBSId
        }).then(() => {
          throw new Error('Could not connect the new Bioserver or Bioserver not clean.');
        }).catch((err) => {
          if ('Could not connect the new Bioserver or Bioserver not clean.' === err.message) {
            res.json({code: 404, message: err.message});
          } else {
            res.json({code: 501, message: 'May be Some Error on Input or Server.'});
          }
        });
      }
    });
  } else {
    res.json({code: 406, message: 'Required Columns Not Fullfilled.'});
  }
});

redirect.use(serverExists);

redirect.post('/enrollFP', (req, res) => {
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae && req.body.ClientUserId && req.body.fpIndex) {
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
      clientUserId: req.body.ClientUserId
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
        clientUserId: req.body.ClientUserId,
        userId: userId,
        fpIndex: req.body.fpIndex,
        bioServerId: bioServerId,
        updated_at: new Date().toUTCString()
      }).save();

      return Promise.all([newUserFP, updatedBsId]);
    }).then((results) => {
      errorFlag = 3;
      return axios.post(addFPIP + '/api/addFP', {
        userId: userId,
        fpIndex: req.body.fpIndex,
        eSkey: req.body.eSkey,
        iv: req.body.iv,
        encMinutiae: req.body.encMinutiae
      });
    }).then((response) => {
      errorFlag = 4;
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
          clientUserId: req.body.ClientUserId,
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

redirect.post('/identifyFP', (req, res) => {
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae) {
    let errorFlag = 0;
    BioserverId.find({}).then((bioservers) => {
      errorFlag = 1;
      let axiosArray = bioservers.map((bioserver) => {
        return axios.post(bioserver.bsIP + '/api/identifyFP', {
          eSkey: req.body.eSkey,
          iv: req.body.iv,
          encMinutiae: req.body.encMinutiae
        });
      });
      return axios.all(axiosArray);
    }).then((responses) => {    
      let candidates = [];
      let scores = [];
      responses.forEach((response) => {
        console.log(response.data);
        if (200 === response.data.code) {
          candidates.push(response.data.data);
          scores.push(response.data.data.score);
        }
      });
      if (0 !== scores.length) {
        let result = candidates[scores.indexOf(Math.max(...scores))];
        console.log(result);
        UserFP.findOne({
          userId: result.userId,
          fpIndex: result.fpIndex
        }).then((userFP) => {
          res.json({code: 200, message: `Minutiae Identified: ${userFP.clientUserId}`});
        }).catch((err) => {
          res.json({code: 501, message: 'Error happens when try to map userId and clientUserId.'});
        });
      } else {
        res.json({code: 404, message: 'No User Identified with The Give Minutiae.'});
      }   
    }).catch((err) => {
      console.log('errorFlag: ' + errorFlag);
      res.json({code: 501, message: 'May be Some Error on Input or Server.'});
    });
  } else {
    res.json({code: 406, message: 'Required Columns Not Fullfilled.'});
  }
});

module.exports = redirect;
