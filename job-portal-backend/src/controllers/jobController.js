const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, str, paginate, pageMeta } = require('../utils/query');

// GET /api/jobs  (public) - only open jobs whose deadline has not passed
// Optional query: search, location, employmentType, skill, page, limit
exports.getJobs = asyncHandler(async (req, res) => {
  const filter = { status: 'open', applicationDeadline: { $gte: new Date() } };

  const search = str(req.query.search);
  const location = str(req.query.location);
  const employmentType = str(req.query.employmentType);
  const skill = str(req.query.skill);

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { companyName: rx }];
  }
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (employmentType) filter.employmentType = employmentType;
  if (skill) filter.requiredSkills = new RegExp(`^${escapeRegex(skill)}$`, 'i');

  const { page, limit, skip } = paginate(req.query);
  const [jobs, total] = await Promise.all([
    Job.find(filter).populate('employer', 'name').sort({ postedDate: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, pagination: pageMeta(total, page, limit), data: { jobs } });
});

// GET /api/jobs/:id  (public)
exports.getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employer', 'name');
  if (!job) throw new AppError('Job not found', 404);
  res.status(200).json({ success: true, data: { job } });
});
