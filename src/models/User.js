const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  pseudo: {
    type: String, required: true, unique: true,
    trim: true, minlength: 3, maxlength: 20
  },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true
  },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: null },

  // Vérification email
  isVerified: { type: Boolean, default: false },
  verifyToken: { type: String, default: null },

  // Coins & Points
  coins: { type: Number, default: 100 },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  // Badges
  badges: [{ type: String }],

  // Projets obtenus
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],

  // Favoris
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],

  // Parrainage
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Streak
  lastLogin: { type: Date, default: null },
  streak: { type: Number, default: 0 },

  // Statut
  isAdmin: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendReason: { type: String, default: null },
  suspendUntil: { type: Date, default: null },

}, { timestamps: true });

// Hash password avant save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparer password
UserSchema.methods.comparePassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// Calculer le niveau selon les points
UserSchema.methods.updateLevel = function () {
  const thresholds = [0, 200, 500, 1000, 2000, 5000, 10000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (this.points >= thresholds[i]) { this.level = i + 1; break; }
  }
};

module.exports = mongoose.model("User", UserSchema);
