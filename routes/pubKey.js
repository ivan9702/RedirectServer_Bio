const fs = require('fs');
const path = require('path');

let publicKey;
(() => {
  try {
    publicKey = fs.readFileSync(path.join(__dirname, '..', 'ssl', 'keyfile-pub.key')).toString();
  } catch (e) {
    publicKey = '-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsUrFLJkFZf0wSE3oScUs\r\ngWSmDbx9mwdIEM7PjyzQNhamUQD4e8IrKWJmwHIsvM1SUbpIQjd9IAf+EV3v5nMW\r\n0MM1u16U5au50AxoqT6yFrlhVHYG6jw9nhoQJSaU+UbcB6P/8iADqFSXh08RWlPi\r\neNHjbGXxpgDBg1T68xEVZEBV3b72ZN6C0gHM2M4O2BHrsMDZi/fagiR9AYasb3NQ\r\nDsYvrOxwiCUr70fHoKEmb7AoieLAexrDnx6eAUGBZlczdW4rt7WYlPQtHRfIzteN\r\nEPBcjTfqQNsl6S9idmfvEy0M43BSH0dOx9TixlgrSPam3mowKcNkkFmASuwYVQet\r\nWwIDAQAB\r\n-----END PUBLIC KEY-----\r\n';
  }
})();

exports.getKey = (req, res, next) => {
  res.json({ publicKey });
}
