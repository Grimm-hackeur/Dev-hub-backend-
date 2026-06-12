const mongoose = require("mongoose");

const LicenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  key: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null }, // null = illimité
}, { timestamps: true });

module.exports = mongoose.model("License", LicenseSchema);
