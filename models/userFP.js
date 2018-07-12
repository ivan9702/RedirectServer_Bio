const mongoose = require('mongoose');

const UserFPSchema = new mongoose.Schema({
  clientUserId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Number,
    required: true,
    unique: true
  },
  fpIndex: {
    type: [Number],
    required: true,
    default: new Array(10).fill(0)
  },
  privilege: {
    type: Number,
    required: true,
    default: 0
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

const UserFP = mongoose.model('UserFP', UserFPSchema);

module.exports = {UserFP};
