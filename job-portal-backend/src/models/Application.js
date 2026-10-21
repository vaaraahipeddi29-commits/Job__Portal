const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'];

// EMBEDDED: a small audit trail that only makes sense inside its application.
const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    // REFERENCES: Application -> Job and Application -> Job Seeker (User)
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    coverLetter: { type: String, trim: true, maxlength: 3000, default: '' },
    resumeLink: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'pending' },
    statusHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true } // createdAt = date applied
);

// A Job Seeker can apply to the same job only once (enforced by the database itself).
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

applicationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
