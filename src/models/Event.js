const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  type: { type: String, enum: ["flash", "limited"], required: true },
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  isActive: { type: Boolean, default: true },

  // Flash deal
  promoPrice: { type: Number, default: null }, // prix promo en coins
  originalPrice: { type: Number, default: null },
  endsAt: { type: Date, default: null },

  // Limité
  maxSlots: { type: Number, default: null },
  usedSlots: { type: Number, default: 0 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  notifyUsers: { type: Boolean, default: true },
  featuredOnHome: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Event", EventSchema);
