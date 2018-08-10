exports.check = (req, res, next) => {
  if (!req.body.clientUserId) {
    return res.json({ code: 40603, message: 'Required Columns Not Fulfilled.' });
  }
  next();
};
