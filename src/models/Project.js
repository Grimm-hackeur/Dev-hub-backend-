const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["Bot", "Tool", "Template", "Script"], required: true },
  description: { type: String, required: true },
  icon: { type: String, default: "Terminal" },
  tags: [{ type: String }],
  stack: [{ type: String }],
  price: { type: Number, default: 0 }, // en coins
  status: { type: String, enum: ["active", "beta", "soon"], default: "active" },
  isActive: { type: Boolean, default: true },
  isUpdated: { type: Boolean, default: false },
  deployTarget: { type: String, default: "" },
  demoUrl: { type: String, default: null },
  hasDemo: { type: Boolean, default: false },

  // Stats
  views: { type: Number, default: 0 },
  accessCount: { type: Number, default: 0 },
  demandCount: { type: Number, default: 0 },

  // Uptime
  uptime: { type: Number, default: 100 },
  uptimeStatus: { type: String, enum: ["online", "degraded", "offline"], default: "online" },

}, { timestamps: true });

module.exports = mongoose.model("Project", ProjectSchema);
