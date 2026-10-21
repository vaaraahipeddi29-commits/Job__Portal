const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');
const { str, paginate, pageMeta } = require('../utils/query');

const JOB_FIELDS = [
  'title', 'companyName', 'description', 'location', 'employmentType',
  'salary', 'requiredSkills', 'experienceRequired', 'applicationDeadline', 'status',
];

// Ownership check: 404 if it does not exist, 403 if it belongs to someone else.
const getOwnedJob = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new AppError('Job not found', 404);
  if (!job.employer.equals(userId)) throw new AppError('You can only manage your own jobs', 403);
  return job;
};

// POST /api/employer/jobs
exports.createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...pick(req.body, JOB_FIELDS), employer: req.user._id });
  res.status(201).json({ success: true, message: 'Job created', data: { job } });
});

// GET /api/employer/jobs
exports.getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: jobs.length, data: { jobs } });
});

// GET /api/employer/jobs/:id
exports.getMyJob = asyncHandler(async (req, res) => {
  const job = await getOwnedJob(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: { job } });
});

// PUT /api/employer/jobs/:id
exports.updateJob = asyncHandler(async (req, res) => {
  const job = await getOwnedJob(req.params.id, req.user._id);
  job.set(pick(req.body, JOB_FIELDS));
  await job.save(); // runs schema validators
  res.status(200).json({ success: true, message: 'Job updated', data: { job } });
});

// DELETE /api/employer/jobs/:id  (also removes the applications for that job)
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await getOwnedJob(req.params.id, req.user._id);
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();
  res.status(200).json({ success: true, message: 'Job and its applications deleted' });
});

// GET /api/employer/jobs/:id/applications
exports.getJobApplications = asyncHandler(async (req, res) => {
  const job = await getOwnedJob(req.params.id, req.user._id);
  const applications = await Application.find({ job: job._id })
    .populate('applicant', 'name email skills experience education')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: applications.length, data: { applications } });
});

// GET /api/employer/applications  - every application across all of my jobs
exports.getAllMyApplications = asyncHandler(async (req, res) => {
  const myJobIds = await Job.find({ employer: req.user._id }).distinct('_id');
  const filter = { job: { $in: myJobIds } };
  const status = str(req.query.status);
  if (status) filter.status = status;

  const { page, limit, skip } = paginate(req.query);
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('job', 'title companyName')
      .populate('applicant', 'name email skills')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, pagination: pageMeta(total, page, limit), data: { applications } });
});

// PATCH /api/employer/applications/:id/status
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('job', 'employer title');
  if (!application) throw new AppError('Application not found', 404);
  if (!application.job.employer.equals(req.user._id)) {
    throw new AppError('You can only update applications for your own jobs', 403);
  }

  application.status = req.body.status;
  application.statusHistory.push({ status: req.body.status, changedBy: req.user._id });
  await application.save();

  res.status(200).json({ success: true, message: 'Application status updated', data: { application } });
});
