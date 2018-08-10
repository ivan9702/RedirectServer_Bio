exports.check = (req, res, next) => {
  if (!req.body.eSkey || !req.body.iv || !req.body.encMinutiae) {
    return res.json({code: 40603, message: 'Required Columns Not Fulfilled.'});
  }
  next();
};
