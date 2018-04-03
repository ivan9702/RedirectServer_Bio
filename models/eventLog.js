const mongoose = require('mongoose');

const EventLogSchema = new mongoose.Schema({
  reqPath: {
    type: String
  },
  userInfo: {
    type: Object
  },
  resBody: {
    type: Object
  },
  bsIP: {
    type: String
  },
  eventTime: {
    type: Date, 
    default: Date.toUTCString
  }
});

const EventLog = mongoose.model('EventLog', EventLogSchema);

module.exports = {EventLog};
