const router = require("express").Router();
const Project = require("../models/Project");
const License = require("../models/License");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");
const { generateLicenseKey } = require("../utils/generateKey");
const { addPoints, POINTS_CONFIG } = require("../utils/points");

// GET /api/projects — tous les projets actifs
router.get("/", async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const projects = await Project.find(filter).sort("-createdAt");
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Projet introuvable" });
    project.views++;
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/:id/purchase — acheter avec des coins
router.post("/:id/purchase", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.isActive)
      return res.status(404).json({ success: false, message: "Projet introuvable" });

    const user = await User.findById(req.user._id);

    // Vérifier si déjà acheté
    if (user.projects.includes(project._id))
      return res.status(400).json({ success: false, message: "Projet déjà obtenu" });

    // Vérifier les coins
    if (user.coins < project.price)
      return res.status(400).json({ success: false, message: "Coins insuffisants" });

    // Déduire les coins
    user.coins -= project.price;
    user.projects.push(project._id);
    await user.save();

    // Générer licence
    const key = generateLicenseKey(project.name);
    const license = await License.create({ user: user._id, project: project._id, key });

    // Transaction
    await Transaction.create({
      user: user._id, type: "purchase",
      amount: -project.price, label: `Achat — ${project.name}`,
      relatedProject: project._id,
    });

    // Points
    await addPoints(user._id, POINTS_CONFIG.purchase, "Achat projet");

    // Stats projet
    project.accessCount++;
    await project.save();

    // Notification
    await Notification.create({
      user: user._id,
      title: `Accès accordé — ${project.name}`,
      body: "Ta licence est disponible dans ton dashboard.",
      type: "access",
    });

    res.json({ success: true, message: "Achat réussi", license, coins: user.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/:id/request — demander accès (projet gratuit)
router.post("/:id/request", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Projet introuvable" });
    project.demandCount++;
    await project.save();
    res.json({ success: true, message: "Demande envoyée. Tu seras notifié sous 24h." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/:id/favorite — toggle favori
router.post("/:id/favorite", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.favorites.indexOf(req.params.id);
    let added;
    if (idx === -1) { user.favorites.push(req.params.id); added = true; }
    else { user.favorites.splice(idx, 1); added = false; }
    await user.save();
    res.json({ success: true, added });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/user/licenses — mes licences
router.get("/user/licenses", protect, async (req, res) => {
  try {
    const licenses = await License.find({ user: req.user._id }).populate("project", "name type icon");
    res.json({ success: true, licenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
