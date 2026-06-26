import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, default: '' },
  location: { type: String, default: '' },
  experience: { type: String, default: '' },
  applyLink: { type: String, default: '' },
  source: { type: String, required: true },
  postedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: auto-delete job documents 7 days (604800s) after creation
jobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
