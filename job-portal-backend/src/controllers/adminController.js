const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, str, paginate, pageMeta } = require('../utils/query');

// ---------- Users ----------
// GET /api/admin/users?role=&status=&search=&page=&limit=
exports.getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  const role = str(req.query.role);
  const status = str(req.query.status);
  const search = str(req.query.search);

  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const { page, limit, skip } = paginate(req.query);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, pagination: pageMeta(total, page, limit), data: { users } });
});

// GET /api/admin/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({ success: true, data: { user } });
});

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be suspended', 403);

  user.status = req.body.status;
  await user.save();
  res.status(200).json({ success: true, message: `User is now ${user.status}`, data: { user } });
});

// DELETE /api/admin/users/:id  (cascades to the user's jobs / applications)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted', 403);

  if (user.role === 'employer') {
    const jobIds = await Job.find({ employer: user._id }).distinct('_id');
    await Application.deleteMany({ job: { $in: jobIds } });
    await Job.deleteMany({ employer: user._id });
  } else {
    await Application.deleteMany({ applicant: user._id });
  }
  await user.deleteOne();

  res.status(200).json({ success: true, message: 'User and related data deleted' });
});

// ---------- Jobs ----------
// GET /api/admin/jobs?status=&page=&limit=
exports.getJobs = asyncHandler(async (req, res) => {
  const filter = {};
  const status = str(req.query.status);
  if (status) filter.status = status;

  const { page, limit, skip } = paginate(req.query);
  const [jobs, total] = await Promise.all([
    Job.find(filter).populate('employer', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, pagination: pageMeta(total, page, limit), data: { jobs } });
});

// GET /api/admin/jobs/:id
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employer', 'name email');
  if (!job) throw new AppError('Job not found', 404);
  res.status(200).json({ success: true, data: { job } });
});

// DELETE /api/admin/jobs/:id
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();
  res.status(200).json({ success: true, message: 'Job removed by admin' });
});

// ---------- Platform data ----------
// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [users, jobSeekers, employers, admins, suspended, jobs, openJobs, applications] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'employer' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ status: 'suspended' }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'open' }),
    Application.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: { users: { total: users, jobSeekers, employers, admins, suspended }, jobs: { total: jobs, open: openJobs }, applications },
  });
});
