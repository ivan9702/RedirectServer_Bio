const fs = require('fs');
const path = require('path');

let publicKey;
(() => {
  try {
    publicKey = fs.readFileSync(path.join(__dirname, '..', 'ssl', 'keyfile-pub.key')).toString();
  } catch (e) {
    publicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsUrFLJkFZf0wSE3oScUsgWSmDbx9mwdIEM7PjyzQNhamUQD4e8IrKWJmwHIsvM1SUbpIQjd9IAf+EV3v5nMW0MM1u16U5au50AxoqT6yFrlhVHYG6jw9nhoQJSaU+UbcB6P/8iADqFSXh08RWlPieNHjbGXxpgDBg1T68xEVZEBV3b72ZN6C0gHM2M4O2BHrsMDZi/fagiR9AYasb3NQDsYvrOxwiCUr70fHoKEmb7AoieLAexrDnx6eAUGBZlczdW4rt7WYlPQtHRfIzteNEPBcjTfqQNsl6S9idmfvEy0M43BSH0dOx9TixlgrSPam3mowKcNkkFmASuwYVQetWwIDAQAB\n-----END PUBLIC KEY-----';
  }
})();

exports.getKey = (req, res, next) => {
  res.json({ publicKey });
}
