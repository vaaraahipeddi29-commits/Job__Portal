const AppError = require('../utils/AppError');

// 2) Authorization: only the listed roles may continue. Use AFTER protect.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new AppError(`Access denied. Requires role: ${roles.join(' or ')}.`, 403)
    );
  }
  next();
};

module.exports = { authorize };
