const mongoose = require("mongoose");

const BugReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
}, { timestamps: true });

module.exports = mongoose.model("BugReport", BugReportSchema);
