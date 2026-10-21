const router = require('express').Router();
const { getMyApplications, getMyApplication } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const { mongoIdParam } = require('../validators');

router.use(protect, authorize('jobseeker'));
router.get('/my', getMyApplications);
router.get('/my/:id', mongoIdParam(), validate, getMyApplication);

module.exports = router;
