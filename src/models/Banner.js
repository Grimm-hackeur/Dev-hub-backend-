const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  color: { type: String, enum: ["purple", "green", "yellow", "blue"], default: "purple" },
  isActive: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Banner", BannerSchema);
