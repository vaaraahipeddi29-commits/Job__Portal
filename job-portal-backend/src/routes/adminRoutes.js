const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const validate = require('../middleware/validate');
const { mongoIdParam, userStatusRules } = require('../validators');

router.use(protect, authorize('admin'));

router.get('/stats', c.getStats);

router.get('/users', c.getUsers);
router.get('/users/:id', mongoIdParam(), validate, c.getUser);
router.patch('/users/:id/status', mongoIdParam(), userStatusRules, validate, c.updateUserStatus);
router.delete('/users/:id', mongoIdParam(), validate, c.deleteUser);

router.get('/jobs', c.getJobs);
router.get('/jobs/:id', mongoIdParam(), validate, c.getJob);
router.delete('/jobs/:id', mongoIdParam(), validate, c.deleteJob);

module.exports = router;
