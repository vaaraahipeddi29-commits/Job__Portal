const router = require('express').Router();
const { getJobs, getJobById } = require('../controllers/jobController');
const { applyToJob } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const { mongoIdParam, applyRules } = require('../validators');

// Public
router.get('/', getJobs);
router.get('/:id', mongoIdParam(), validate, getJobById);

// Job Seeker only
router.post('/:id/apply', protect, authorize('jobseeker'), mongoIdParam(), applyRules, validate, applyToJob);

module.exports = router;
