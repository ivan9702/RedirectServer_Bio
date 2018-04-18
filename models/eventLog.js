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
  bsId: {
    type: Number
  },
  eventTime: {
    type: Date, 
    default: Date.toUTCString
  }
});
EventLogSchema.index({'$**': 'text'});

const EventLog = mongoose.model('EventLog', EventLogSchema);

module.exports = {EventLog};
