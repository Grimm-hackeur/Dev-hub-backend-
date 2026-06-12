const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["purchase", "gift", "referral", "bonus", "promo", "transfer_in", "transfer_out", "daily"],
    required: true
  },
  amount: { type: Number, required: true }, // positif = crédit, négatif = débit
  label: { type: String, required: true },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", TransactionSchema);
