var mongoose = require( 'mongoose' );

// tell mongoose which Promise library we want to use.
mongoose.Promise = global.Promise;

mongoose.connect( DBCONNECTION , function(err){
  var admin = new mongoose.mongo.Admin(mongoose.connection.db);
  admin.buildInfo(function (err, info) {
    //console.log(info.version);
    MONGOVERSION = info.version;
  });
});

module.exports = {mongoose};
