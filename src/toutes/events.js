const router = require("express").Router();
const Event = require("../models/Event");
const User = require("../models/User");
const License = require("../models/License");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const { generateLicenseKey } = require("../utils/generateKey");

// GET /api/events — événements actifs
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      isActive: true,
      $or: [{ endsAt: null }, { endsAt: { $gt: now } }],
    }).populate("project", "name type icon price");
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/join — participer à un événement
router.post("/:id/join", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("project");
    if (!event || !event.isActive)
      return res.status(404).json({ success: false, message: "Événement introuvable ou expiré" });

    const user = await User.findById(req.user._id);
    if (event.participants.includes(user._id))
      return res.status(400).json({ success: false, message: "Déjà participé" });

    if (event.type === "flash") {
      const price = event.promoPrice ?? event.project.price;
      if (user.coins < price)
        return res.status(400).json({ success: false, message: "Coins insuffisants" });
      user.coins -= price;
      await Transaction.create({ user: user._id, type: "purchase", amount: -price, label: `Flash Deal — ${event.project.name}`, relatedProject: event.project._id });
    }

    if (event.type === "limited") {
      if (event.usedSlots >= event.maxSlots)
        return res.status(400).json({ success: false, message: "Plus de places disponibles" });
      event.usedSlots++;
    }

    // Donner accès
    if (!user.projects.includes(event.project._id)) {
      user.projects.push(event.project._id);
      const key = generateLicenseKey(event.project.name);
      await License.create({ user: user._id, project: event.project._id, key });
    }

    event.participants.push(user._id);
    await event.save();
    await user.save();

    await Notification.create({ user: user._id, title: `Accès obtenu — ${event.project.name}`, body: "Ta licence est dans ton dashboard.", type: "access" });

    res.json({ success: true, message: "Participation confirmée !", coins: user.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
