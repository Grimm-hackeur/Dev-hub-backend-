const router = require("express").Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const { sendVerificationEmail } = require("../utils/sendEmail");
const { generateReferralCode } = require("../utils/generateKey");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { pseudo, email, password, referralCode } = req.body;
    if (!pseudo || !email || !password)
      return res.status(400).json({ success: false, message: "Champs manquants" });

    const exists = await User.findOne({ $or: [{ email }, { pseudo }] });
    if (exists) return res.status(400).json({ success: false, message: "Email ou pseudo déjà utilisé" });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const refCode = generateReferralCode(pseudo);

    const user = await User.create({
      pseudo, email, password,
      verifyToken,
      referralCode: refCode,
      coins: parseInt(process.env.COINS_ON_REGISTER) || 100,
    });

    // Gérer le parrainage
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer._id;
        await user.save();
        referrer.referrals.push(user._id);
        referrer.coins += 50;
        await referrer.save();

        const { addPoints, POINTS_CONFIG } = require("../utils/points");
        await addPoints(referrer._id, POINTS_CONFIG.referral, "Parrainage");

        await Transaction.create({
          user: referrer._id, type: "referral",
          amount: 50, label: `Parrainage — ${pseudo}`,
          relatedUser: user._id,
        });

        await Notification.create({
          user: referrer._id,
          title: `${pseudo} a rejoint via ton lien !`,
          body: "Tu as reçu 50 coins et 100 points de parrainage.",
          type: "referral",
        });
      }
    }

    // Envoyer email de vérification
    try { await sendVerificationEmail(email, pseudo, verifyToken); } catch (e) { /* silencieux */ }

    // Notif de bienvenue
    await Notification.create({
      user: user._id,
      title: "Bienvenue sur DevHub !",
      body: `Ton compte a été créé. Tu as reçu ${process.env.COINS_ON_REGISTER || 100} coins de bienvenue.`,
      type: "system",
    });

    await Transaction.create({
      user: user._id, type: "bonus",
      amount: parseInt(process.env.COINS_ON_REGISTER) || 100,
      label: "Coins de bienvenue",
    });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, pseudo, email, coins: user.coins, isVerified: false } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email et mot de passe requis" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Identifiants incorrects" });

    if (user.isSuspended)
      return res.status(403).json({ success: false, message: `Compte suspendu : ${user.suspendReason}` });

    // Streak login quotidien
    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    const isNewDay = !last || (now - last) > 86400000;
    if (isNewDay) {
      const isConsecutive = last && (now - last) < 172800000;
      user.streak = isConsecutive ? user.streak + 1 : 1;
      user.lastLogin = now;
      await user.save();

      const { addPoints, POINTS_CONFIG } = require("../utils/points");
      await addPoints(user._id, POINTS_CONFIG.daily_login, "Connexion quotidienne");

      await Transaction.create({
        user: user._id, type: "daily",
        amount: POINTS_CONFIG.daily_login, label: "Bonus connexion quotidienne",
      });
    }

    const token = signToken(user._id);
    res.json({
      success: true, token,
      user: { id: user._id, pseudo: user.pseudo, email, coins: user.coins, points: user.points, level: user.level, isVerified: user.isVerified, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/verify-email?token=xxx
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verifyToken: token });
    if (!user) return res.status(400).json({ success: false, message: "Token invalide" });
    user.isVerified = true;
    user.verifyToken = null;
    await user.save();
    res.json({ success: true, message: "Email vérifié !" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -verifyToken");
  res.json({ success: true, user });
});

module.exports = router;
