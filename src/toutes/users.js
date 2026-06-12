const router = require("express").Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const { addPoints, POINTS_CONFIG } = require("../utils/points");

// GET /api/users/dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -verifyToken")
      .populate("projects", "name type icon")
      .populate("favorites", "name type icon status");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/profile — modifier profil
router.put("/profile", protect, async (req, res) => {
  try {
    const { pseudo, avatar } = req.body;
    const updates = {};
    if (pseudo) {
      const exists = await User.findOne({ pseudo, _id: { $ne: req.user._id } });
      if (exists) return res.status(400).json({ success: false, message: "Pseudo déjà pris" });
      updates.pseudo = pseudo;
    }
    if (avatar) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/transactions — historique coins
router.get("/transactions", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort("-createdAt").limit(50)
      .populate("relatedProject", "name")
      .populate("relatedUser", "pseudo");
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/transfer — transférer des coins
router.post("/transfer", protect, async (req, res) => {
  try {
    const { pseudo, amount } = req.body;
    if (!pseudo || !amount || amount <= 0)
      return res.status(400).json({ success: false, message: "Données invalides" });

    const sender = await User.findById(req.user._id);
    const receiver = await User.findOne({ pseudo });
    if (!receiver) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    if (sender.coins < amount) return res.status(400).json({ success: false, message: "Coins insuffisants" });

    sender.coins -= amount;
    receiver.coins += amount;
    await sender.save();
    await receiver.save();

    await Transaction.create({ user: sender._id, type: "transfer_out", amount: -amount, label: `Transfert vers ${pseudo}`, relatedUser: receiver._id });
    await Transaction.create({ user: receiver._id, type: "transfer_in", amount, label: `Reçu de ${sender.pseudo}`, relatedUser: sender._id });

    await Notification.create({ user: receiver._id, title: `Tu as reçu ${amount} coins !`, body: `${sender.pseudo} t'a envoyé ${amount} coins.`, type: "coins" });

    res.json({ success: true, message: `${amount} coins envoyés à ${pseudo}`, coins: sender.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/promo — utiliser un code promo
router.post("/promo", protect, async (req, res) => {
  try {
    const { code } = req.body;
    const PromoCode = require("../models/PromoCode");
    const License = require("../models/License");
    const { generateLicenseKey } = require("../utils/generateKey");

    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ success: false, message: "Code invalide ou expiré" });
    if (promo.usedCount >= promo.maxUses) return res.status(400).json({ success: false, message: "Code épuisé" });
    if (promo.usedBy.includes(req.user._id)) return res.status(400).json({ success: false, message: "Code déjà utilisé" });
    if (promo.expiresAt && new Date() > promo.expiresAt) return res.status(400).json({ success: false, message: "Code expiré" });

    const user = await User.findById(req.user._id);
    promo.usedCount++;
    promo.usedBy.push(user._id);
    await promo.save();

    let message = "";
    if (promo.type === "coins_bonus") {
      user.coins += promo.coinsAmount;
      await user.save();
      await Transaction.create({ user: user._id, type: "promo", amount: promo.coinsAmount, label: `Code promo ${code}` });
      message = `+${promo.coinsAmount} coins ajoutés !`;
    } else if (promo.type === "free_access" && promo.project) {
      if (!user.projects.includes(promo.project)) {
        user.projects.push(promo.project);
        await user.save();
        const proj = await require("../models/Project").findById(promo.project);
        const key = generateLicenseKey(proj?.name || "PROJ");
        await License.create({ user: user._id, project: promo.project, key });
        message = "Accès gratuit accordé !";
      } else {
        message = "Tu as déjà accès à ce projet.";
      }
    }

    await Notification.create({ user: user._id, title: "Code promo utilisé !", body: message, type: "coins" });
    res.json({ success: true, message, coins: user.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/public/:pseudo — profil public
router.get("/public/:pseudo", async (req, res) => {
  try {
    const user = await User.findOne({ pseudo: req.params.pseudo })
      .select("pseudo avatar badges points level projects createdAt")
      .populate("projects", "name type");
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
