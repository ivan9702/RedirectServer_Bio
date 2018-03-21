var serverExists = (req, res, next) => {
  if (!RedirectData.AddFPServer) {
    return res.json({code: 503, message: 'No Bioserver connected'});
  } else {
    next();
  }
}

module.exports = serverExists;
