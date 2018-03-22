const mongoose = require('mongoose');

var UserFPSchema = new mongoose.Schema({
  clientUserId: {
    type: String,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  fpIndex: {
    type: Number,
    required: true
  },
  bioServerId: {
    type: Number,
    required: true
  },
  updated_at: {
    type: Date, 
    default: Date.toUTCString
  }
});

var UserFP = mongoose.model('UserFP', UserFPSchema);

module.exports = {UserFP};
