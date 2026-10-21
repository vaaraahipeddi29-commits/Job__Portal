const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');

// GET /api/users/profile
exports.getProfile = (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

// PUT /api/users/profile  - email, password, role and status can NOT be changed here.
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = req.user.role === 'jobseeker' ? ['name', 'skills', 'experience', 'education'] : ['name'];
  req.user.set(pick(req.body, allowed));
  await req.user.save();
  res.status(200).json({ success: true, message: 'Profile updated', data: { user: req.user } });
});
