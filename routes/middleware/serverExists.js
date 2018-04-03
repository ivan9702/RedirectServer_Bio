var serverExists = (req, res, next) => {
  req.logInfo = {};
  if (0 === RedirectData.bioservers.length) {
    return res.json({code: 50301, message: 'No Bioserver Connected'});
  } else {
    next();
  }
}

module.exports = serverExists;
