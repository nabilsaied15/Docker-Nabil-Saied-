const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  endpoint: String,
  method: String,
  statusCode: Number,
  userAgent: String,
  ip: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);