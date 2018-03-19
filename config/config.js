const {config} = require('./../readConfig');

/*DB Connection Link*/
DBCONNECTION = config.MONGODB_URI;
/*Setting Port*/
if (config.PORT) {
  process.env.PORT = config.PORT;
}

if (config.HTTPSPORT) {
  process.env.MYHTTPSPORT = config.HTTPSPORT;
}
