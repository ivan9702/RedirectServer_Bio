var express = require('express');

const {BioserverId} = require('./../models/bioserverId');

var redirect = express.Router();

/* GET users listing. */
redirect.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

redirect.post('/addBioserver', (req, res) => {
  if (req.body.bsIP) {
    var newBioserver = new BioserverId({
      bsIP: req.body.bsIP,
      count: 0,
      updated_at: new Date().toUTCString()
    });

    newBioserver.save().then(() => {
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

module.exports = redirect;
