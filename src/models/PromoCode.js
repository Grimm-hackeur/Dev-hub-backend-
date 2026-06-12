const mongoose = require("mongoose");

const PromoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ["free_access", "coins_discount", "coins_bonus"], required: true },
  value: { type: String, required: true }, // nom du projet ou montant coins
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  coinsAmount: { type: Number, default: 0 },
  maxUses: { type: Number, required: true },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("PromoCode", PromoCodeSchema);
