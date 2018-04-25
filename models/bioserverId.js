const mongoose = require('mongoose');

var BioserverIdSchema = new mongoose.Schema({
  bsIP: {
    type: String,
    required: true,
    unique: true
  },
  bsId: {
    type: Number,
    required: true,
    unique: true
  },
  count: {
    type: Number
  },
  version: {
    type: String
  },
  updated_at: {
    type: Date, 
    default: Date.toUTCString
  }
});

var BioserverId = mongoose.model('BioserverId', BioserverIdSchema);

module.exports = {BioserverId};
