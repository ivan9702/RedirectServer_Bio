const mongoose = require('mongoose');

const StatisticsSchema = new mongoose.Schema({
  index: Number,
  browserInfo : Object,
  updateTime: {
    type: Date,
    default: Date.toUTCString
  }
});
  
const Statistics = mongoose.model( 'statistics', StatisticsSchema );
module.exports = {Statistics};
