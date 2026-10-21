const { validationResult } = require('express-validator');

// Turns express-validator results into a clean 400 response.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors });
};
