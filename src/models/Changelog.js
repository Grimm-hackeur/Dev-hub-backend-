const mongoose = require("mongoose");

const ChangelogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  version: { type: String, required: true },
  type: { type: String, enum: ["major", "minor", "patch"], required: true },
  changes: [{
    type: { type: String, enum: ["add", "fix", "imp", "break"], required: true },
    text: { type: String, required: true }
  }],
}, { timestamps: true });

module.exports = mongoose.model("Changelog", ChangelogSchema);
