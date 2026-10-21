const { body, param } = require('express-validator');
const { EMPLOYMENT_TYPES, JOB_STATUSES } = require('../models/Job');
const { APPLICATION_STATUSES } = require('../models/Application');

const mongoIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} must be a valid MongoDB ObjectId`);

// ---------- Auth ----------
const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').isString().trim().toLowerCase().isEmail().withMessage('A valid email is required'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8-72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('role')
    .isIn(['jobseeker', 'employer'])
    .withMessage('Role must be "jobseeker" or "employer" (admins cannot self-register)'),
];

const loginRules = [
  body('email').isString().trim().toLowerCase().isEmail().withMessage('A valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

// ---------- Profile ----------
const profileRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('skills').optional().isArray({ max: 50 }).withMessage('skills must be an array'),
  body('skills.*').optional().isString().trim().notEmpty().isLength({ max: 40 }).withMessage('Each skill must be a non-empty string'),
  body('experience').optional().isArray({ max: 30 }).withMessage('experience must be an array'),
  body('experience.*.title').optional().isString().trim().notEmpty().withMessage('Experience title is required'),
  body('experience.*.company').optional().isString().trim().notEmpty().withMessage('Experience company is required'),
  body('experience.*.years').optional().isFloat({ min: 0, max: 60 }).withMessage('Experience years must be 0-60'),
  body('education').optional().isArray({ max: 20 }).withMessage('education must be an array'),
  body('education.*.degree').optional().isString().trim().notEmpty().withMessage('Education degree is required'),
  body('education.*.institution').optional().isString().trim().notEmpty().withMessage('Education institution is required'),
  body('education.*.startYear').optional().isInt({ min: 1950, max: 2100 }).withMessage('startYear is invalid'),
  body('education.*.endYear').optional().isInt({ min: 1950, max: 2100 }).withMessage('endYear is invalid'),
];

// ---------- Jobs ----------
const jobRules = (isUpdate) => {
  const f = (name) => (isUpdate ? body(name).optional() : body(name));
  return [
    f('title').isString().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    f('companyName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be 2-100 characters'),
    f('description').isString().trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
    f('location').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Location must be 2-100 characters'),
    f('employmentType').isIn(EMPLOYMENT_TYPES).withMessage(`employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`),
    f('salary').isObject().withMessage('salary must be an object like { "min": 300000, "max": 600000 }'),
    body('salary.min').if(body('salary').exists()).isFloat({ min: 0 }).withMessage('salary.min must be a number >= 0'),
    body('salary.max')
      .if(body('salary').exists())
      .isFloat({ min: 0 })
      .withMessage('salary.max must be a number >= 0')
      .custom((value, { req }) => Number(value) >= Number(req.body.salary && req.body.salary.min))
      .withMessage('salary.max must be >= salary.min'),
    body('salary.currency').optional().isString().trim().isLength({ min: 1, max: 5 }),
    f('requiredSkills').isArray({ min: 1, max: 30 }).withMessage('requiredSkills must be a non-empty array'),
    body('requiredSkills.*').optional().isString().trim().notEmpty().withMessage('Each skill must be a non-empty string'),
    body('experienceRequired').optional().isInt({ min: 0, max: 50 }).withMessage('experienceRequired must be 0-50 (years)'),
    f('applicationDeadline')
      .isISO8601()
      .withMessage('applicationDeadline must be an ISO date (e.g. 2030-12-31)')
      .custom((value) => new Date(value) > new Date())
      .withMessage('applicationDeadline must be in the future'),
    body('status').optional().isIn(JOB_STATUSES).withMessage(`status must be one of: ${JOB_STATUSES.join(', ')}`),
  ];
};

// ---------- Applications ----------
const applyRules = [
  body('coverLetter').optional().isString().trim().isLength({ max: 3000 }).withMessage('coverLetter max 3000 characters'),
  body('resumeLink').optional().isURL().withMessage('resumeLink must be a valid URL'),
];

const applicationStatusRules = [
  body('status').isIn(APPLICATION_STATUSES).withMessage(`status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
];

// ---------- Admin ----------
const userStatusRules = [
  body('status').isIn(['active', 'suspended']).withMessage('status must be "active" or "suspended"'),
];

module.exports = {
  mongoIdParam,
  registerRules,
  loginRules,
  profileRules,
  jobCreateRules: jobRules(false),
  jobUpdateRules: jobRules(true),
  applyRules,
  applicationStatusRules,
  userStatusRules,
};
