const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendToken, clearToken } = require('../utils/sendToken');

// POST /api/auth/register  (public)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body; // whitelist: nobody can set status etc.

  if (await User.findOne({ email })) throw new AppError('Email is already registered', 409);

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, message: 'Registration successful. Please log in.', data: { user } });
});

// POST /api/auth/login  (public)
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  // Same message for "no such user" and "wrong password" so emails cannot be probed.
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (user.status !== 'active') throw new AppError('Your account has been suspended.', 403);

  sendToken(user, 200, res, 'Login successful');
});

// POST /api/auth/logout
exports.logout = (req, res) => {
  clearToken(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};
