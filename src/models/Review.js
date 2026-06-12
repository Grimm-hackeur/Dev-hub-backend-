const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isVerified: { type: Boolean, default: false }, // user a acheté le projet
}, { timestamps: true });

// Un seul avis par user par projet
ReviewSchema.index({ user: 1, project: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
