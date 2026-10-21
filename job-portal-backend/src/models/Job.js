const mongoose = require('mongoose');

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const JOB_STATUSES = ['open', 'closed'];

// EMBEDDED: salary range is part of the job and always read/updated with it.
const salarySchema = new mongoose.Schema(
  {
    min: { type: Number, min: 0, required: true },
    max: {
      type: Number,
      min: 0,
      required: true,
      validate: {
        validator: function (value) {
          return this.min == null || value >= this.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary',
      },
    },
    currency: { type: String, default: 'INR', uppercase: true, trim: true, maxlength: 5 },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Job title is required'], trim: true, minlength: 3, maxlength: 100 },
    companyName: { type: String, required: [true, 'Company name is required'], trim: true, maxlength: 100 },
    description: { type: String, required: [true, 'Description is required'], trim: true, minlength: 20, maxlength: 5000 },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 100 },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, required: true },
    salary: { type: salarySchema, required: true },
    requiredSkills: { type: [String], default: [] }, // EMBEDDED list
    experienceRequired: { type: Number, min: 0, max: 50, default: 0 }, // years
    postedDate: { type: Date, default: Date.now },
    applicationDeadline: { type: Date, required: [true, 'Application deadline is required'] },
    status: { type: String, enum: JOB_STATUSES, default: 'open' },

    // REFERENCE: an employer is a User with its own identity and lifecycle.
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, applicationDeadline: 1 });

jobSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Job', jobSchema);
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.JOB_STATUSES = JOB_STATUSES;
