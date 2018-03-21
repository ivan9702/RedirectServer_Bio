var express = require('express');
const axios = require('axios');

const {BioserverId} = require('./../models/bioserverId');
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
    var addFPURL = RedirectData.AddFPServer + '/api/addFP';
    // console.log('addFPURL: ' + addFPURL);
    axios.post(addFPURL, {
      userId: RedirectData.lastUserId,
      fpIndex: req.body.fpIndex,
      eSkey: req.body.eSkey,
      iv: req.body.iv,
      encMinutiae: req.body.encMinutiae
    }).then((response) => {
      // console.log(response);
      res.json({code: response.data.code, message: response.data.message});
    }).catch((error) => {
      res.json({code: 501, message: 'May be Some Error on Input or Server.'});
    });
  } else {
    res.json({code: 406, message: 'Required Columns Not Fullfilled.'});
  }
});

module.exports = redirect;
