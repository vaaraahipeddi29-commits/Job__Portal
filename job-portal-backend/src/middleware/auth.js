const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// 1) Authentication: verifies the JWT stored in the httpOnly cookie.
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies.token;
  if (!token) throw new AppError('Not authenticated. Please log in.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('The user for this token no longer exists.', 401);
  if (user.status !== 'active') throw new AppError('Your account has been suspended.', 403);

  req.user = user;
  next();
});

module.exports = { protect };
