const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
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
  bioServerId: {
    type: number,
    required: true,
    unique: true
  },
  updated_at: {
    type: Date, 
    default: Date.toUTCString
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};
