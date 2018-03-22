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
    var newBioserver = new BioserverId({
      bsIP: req.body.bsIP,
      bsId: RedirectData.lastBSId,
      count: 0,
      updated_at: new Date().toUTCString()
    });

    newBioserver.save().then(() => {
      RedirectData.lastBSId++;
      res.json({code: 200, message: 'New bioserver has been saved.'});
    }, (err) => {
      if (err.code === 11000) {
        res.json({code: 406, message: 'This bioserver had already existed.'});
      } else {
        res.json({code: 501, message: 'May be Some Error on Input or Server.'});
      }
    });
  } else {
    res.json({code: 406, message: 'Required Columns Not Fullfilled.'});
  }
});

redirect.use(serverExists);

redirect.post('/enrollFP', (req, res) => {
  if (req.body.eSkey && req.body.iv && req.body.encMinutiae && req.body.ClientUserId && req.body.fpIndex) {
    var errorFlag = 1;
    // new user
    var userId = RedirectData.lastUserId;
    UserFP.find({
      clientUserId: req.body.ClientUserId
    }).then((userFPs) => {
      // console.log(userFPs);
      if (0 !== userFPs.length) {
        // user exists
        if (userFPs.find((userFP) => userFP.fpIndex === req.body.fpIndex)) {
          // fpIndex exists
          console.log('fpIndex exists');
          throw new Error('FP exists');
        }
        userId = userFPs[0].userId;
      }
      // save userFP
      errorFlag = 2;
      var newUserFP = new UserFP({
        clientUserId: req.body.ClientUserId,
        userId: userId,
        fpIndex: req.body.fpIndex,
        bioServerId: RedirectData.AddFPServerId,
        updated_at: new Date().toUTCString()
      });
      return newUserFP.save();
    }).then(() => {
      errorFlag = 3;
      var addFPURL = RedirectData.AddFPServerIP + '/api/addFP';
      console.log('addFPURL: ' + addFPURL);
      return axios.post(addFPURL, {
        userId: userId,
        fpIndex: req.body.fpIndex,
        eSkey: req.body.eSkey,
        iv: req.body.iv,
        encMinutiae: req.body.encMinutiae
      });
    }).then((response) => {
      errorFlag = 4;
      console.log('response from bioserver.');
      if (200 === response.data.code) {
        if (userId === RedirectData.lastUserId) {
          RedirectData.lastUserId++;
          console.log('RedirectData.lastUserId: ' + RedirectData.lastUserId);
        }
        console.log('code:' + response.data.code + '; ' + 'message: ' + response.data.message);
        res.json({code: response.data.code, message: response.data.message});
      } else {
        throw new Error('bioserver error');
      }
    }).catch((err) => {
      // 1. error for UserFP.find
      // 2. 'FP exists'
      // 3. error for newUserFP.save()
      // 4. axios error -> UserFP.findOneAndRemove
      // 5. 'bioserver error' -> UserFP.findOneAndRemove
      console.log('errorFlag: ' + errorFlag);
      if ('FP exists' === err.message) {
        res.json({code: 406, message: 'User fpIndex already exists.'});
      } else if ('bioserver error' === err.message || 3 === errorFlag) {
        console.log('findOneAndRemove');
        UserFP.findOneAndRemove({
          clientUserId: req.body.ClientUserId,
          userId: userId,
          fpIndex: req.body.fpIndex,
          bioServerId: RedirectData.AddFPServerId
        }).then(() => {
          throw new Error('501');
        }).catch((err) => {
          res.json({code: 501, message: 'May be Some Error on Input or Server.'});
        });
      } else {
        res.json({code: 501, message: 'May be Some Error on Input or Server.'});
      }
    });
  } else {
    res.json({code: 406, message: 'Required Columns Not Fullfilled.'});
  }
});

module.exports = redirect;
