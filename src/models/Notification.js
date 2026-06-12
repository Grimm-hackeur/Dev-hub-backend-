const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ["badge", "update", "coins", "access", "referral", "review", "event", "admin", "system"],
    default: "system"
  },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
