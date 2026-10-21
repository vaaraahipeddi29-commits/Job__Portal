const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['jobseeker', 'employer', 'admin'];
const STATUSES = ['active', 'suspended'];

// EMBEDDED: education and experience belong to one user, are always read/updated
// together with the profile, and have no identity or lifecycle of their own.
const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true, maxlength: 100 },
    institution: { type: String, required: true, trim: true, maxlength: 120 },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    years: { type: Number, min: 0, max: 60, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by queries unless explicitly requested
    },
    role: { type: String, enum: ROLES, default: 'jobseeker' },
    status: { type: String, enum: STATUSES, default: 'active' },

    // Profile information (used by Job Seekers)
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Safety net: password / hash can never leak through res.json()
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
module.exports.STATUSES = STATUSES;
