const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const pick = require('../utils/pick');

// POST /api/jobs/:id/apply  (job seeker)
exports.applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  if (job.status !== 'open') throw new AppError('This job is closed for applications', 400);
  if (job.applicationDeadline < new Date()) throw new AppError('The application deadline has passed', 400);

  const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
  if (existing) throw new AppError('You have already applied for this job', 409);

  const application = await Application.create({
    ...pick(req.body, ['coverLetter', 'resumeLink']),
    job: job._id,
    applicant: req.user._id,
    statusHistory: [{ status: 'pending', changedBy: req.user._id }],
  });

  res.status(201).json({ success: true, message: 'Application submitted', data: { application } });
});

// GET /api/applications/my  (job seeker) - includes the status of each application
exports.getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate('job', 'title companyName location employmentType status applicationDeadline')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: applications.length, data: { applications } });
});

// GET /api/applications/my/:id  (job seeker) - only their own application
exports.getMyApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, applicant: req.user._id }).populate(
    'job',
    'title companyName location employmentType status applicationDeadline'
  );
  // 404 (not 403) so other users' application IDs are not revealed.
  if (!application) throw new AppError('Application not found', 404);

  res.status(200).json({ success: true, data: { application } });
});
