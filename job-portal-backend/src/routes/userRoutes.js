const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { profileRules } = require('../validators');

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', profileRules, validate, updateProfile);

module.exports = router;
