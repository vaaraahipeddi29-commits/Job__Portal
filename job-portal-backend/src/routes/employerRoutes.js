const router = require('express').Router();
const c = require('../controllers/employerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const { mongoIdParam, jobCreateRules, jobUpdateRules, applicationStatusRules } = require('../validators');

router.use(protect, authorize('employer'));

router.post('/jobs', jobCreateRules, validate, c.createJob);
router.get('/jobs', c.getMyJobs);
router.get('/jobs/:id', mongoIdParam(), validate, c.getMyJob);
router.put('/jobs/:id', mongoIdParam(), jobUpdateRules, validate, c.updateJob);
router.delete('/jobs/:id', mongoIdParam(), validate, c.deleteJob);
router.get('/jobs/:id/applications', mongoIdParam(), validate, c.getJobApplications);

router.get('/applications', c.getAllMyApplications);
router.patch('/applications/:id/status', mongoIdParam(), applicationStatusRules, validate, c.updateApplicationStatus);

module.exports = router;
