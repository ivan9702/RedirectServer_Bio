const mongoose = require('mongoose');

var BioserverIdSchema = new mongoose.Schema({
  bsIP: {
    type: String,
    required: true,
    unique: true
  },
  bsID: {
    type: Number,
    required: true,
    unique: true
  },
  count: {
    type: number
  },
  updated_at: {
    type: Date, 
    default: Date.toUTCString
  }
});

var BioserverId = mongoose.model('BioserverId', BioserverIdSchema);

module.exports = {BioserverId};
