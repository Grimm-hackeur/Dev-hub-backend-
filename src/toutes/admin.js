const router = require("express").Router();
const { adminOnly } = require("../middleware/admin");
const User = require("../models/User");
const Project = require("../models/Project");
const License = require("../models/License");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const Event = require("../models/Event");
const PromoCode = require("../models/PromoCode");
const Changelog = require("../models/Changelog");
const Banner = require("../models/Banner");
const BugReport = require("../models/BugReport");
const { generateLicenseKey } = require("../utils/generateKey");
const { addPoints } = require("../utils/points");

// Toutes les routes admin nécessitent le mot de passe
router.use(adminOnly);

// POST /api/admin/login — vérifier le mot de passe admin
router.post("/login", (req, res) => {
  res.json({ success: true, message: "Accès admin accordé" });
});

/* ───── DASHBOARD ───── */
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalLicenses, totalReviews] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments({ isActive: true }),
      License.countDocuments(),
      require("../models/Review").countDocuments(),
    ]);
    const onlineUsers = await User.find({ lastLogin: { $gte: new Date(Date.now() - 30 * 60000) } })
      .select("pseudo lastLogin").limit(20);
    res.json({ success: true, stats: { totalUsers, totalProjects, totalLicenses, totalReviews }, onlineUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── PROJETS ───── */
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort("-createdAt");
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ success: false, message: "Projet introuvable" });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Projet supprimé" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/projects/:id/toggle", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Projet introuvable" });
    project.isActive = !project.isActive;
    await project.save();
    res.json({ success: true, isActive: project.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/projects/:id/stats", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Projet introuvable" });
    const licenses = await License.find({ project: project._id }).populate("user", "pseudo email");
    res.json({ success: true, project, licenses, licenseCount: licenses.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── USERS ───── */
router.get("/users", async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? { $or: [{ pseudo: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
    const users = await User.find(filter).select("-password -verifyToken").sort("-createdAt");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Exporter users en CSV
router.get("/users/export", async (req, res) => {
  try {
    const users = await User.find().select("pseudo email coins points level badges isSuspended createdAt");
    const header = "Pseudo,Email,Coins,Points,Niveau,Badges,Suspendu,Date inscription\n";
    const rows = users.map(u =>
      `${u.pseudo},${u.email},${u.coins},${u.points},${u.level},"${u.badges.join(";")}",${u.isSuspended},${u.createdAt.toISOString().split("T")[0]}`
    ).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=devhub-users.csv");
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Donner des coins
router.post("/users/:id/gift-coins", async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    user.coins += amount;
    await user.save();
    await Transaction.create({ user: user._id, type: "gift", amount, label: reason || "Cadeau admin" });
    await Notification.create({ user: user._id, title: `Tu as reçu ${amount} coins !`, body: reason || "L'admin t'a envoyé des coins.", type: "coins" });
    res.json({ success: true, message: `+${amount} coins envoyés à ${user.pseudo}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Donner accès gratuit
router.post("/users/:id/give-access", async (req, res) => {
  try {
    const { projectId } = req.body;
    const user = await User.findById(req.params.id);
    const project = await Project.findById(projectId);
    if (!user || !project) return res.status(404).json({ success: false, message: "Introuvable" });
    if (!user.projects.includes(projectId)) {
      user.projects.push(projectId);
      await user.save();
      const key = generateLicenseKey(project.name);
      await License.create({ user: user._id, project: project._id, key });
      project.accessCount++;
      await project.save();
      await Notification.create({ user: user._id, title: `Accès gratuit — ${project.name}`, body: "L'admin t'a accordé l'accès gratuitement.", type: "access" });
    }
    res.json({ success: true, message: `Accès ${project.name} accordé à ${user.pseudo}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Attribuer un badge
router.post("/users/:id/give-badge", async (req, res) => {
  try {
    const { badge } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
      await Notification.create({ user: user._id, title: `Badge "${badge}" attribué !`, body: "L'admin t'a attribué un nouveau badge.", type: "badge" });
    }
    res.json({ success: true, message: `Badge "${badge}" attribué à ${user.pseudo}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Message privé
router.post("/users/:id/message", async (req, res) => {
  try {
    const { title, body } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    await Notification.create({ user: user._id, title, body, type: "admin" });
    res.json({ success: true, message: `Message envoyé à ${user.pseudo}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Suspendre
router.post("/users/:id/suspend", async (req, res) => {
  try {
    const { reason, duration } = req.body; // duration en heures
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    user.isSuspended = true;
    user.suspendReason = reason || "Violation des conditions";
    user.suspendUntil = duration ? new Date(Date.now() + duration * 3600000) : null;
    await user.save();
    res.json({ success: true, message: `${user.pseudo} suspendu` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Débloquer
router.post("/users/:id/unsuspend", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false, suspendReason: null, suspendUntil: null }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    await Notification.create({ user: user._id, title: "Compte débloqué", body: "Ton compte a été réactivé.", type: "admin" });
    res.json({ success: true, message: `${user.pseudo} débloqué` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── EVENTS ───── */
router.post("/events", async (req, res) => {
  try {
    const event = await Event.create(req.body);
    if (req.body.notifyUsers) {
      const users = await User.find({ isSuspended: false }).select("_id");
      const notifs = users.map(u => ({
        user: u._id, title: `Nouvel événement : ${req.body.title}`,
        body: "Un nouvel événement est disponible sur DevHub !", type: "event"
      }));
      await Notification.insertMany(notifs);
    }
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/events/:id/stop", async (req, res) => {
  try {
    await Event.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "Événement arrêté" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── PROMO CODES ───── */
router.get("/promos", async (req, res) => {
  try {
    const promos = await PromoCode.find().populate("project", "name").sort("-createdAt");
    res.json({ success: true, promos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/promos", async (req, res) => {
  try {
    const promo = await PromoCode.create({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json({ success: true, promo });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Code déjà existant" });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/promos/:id/toggle", async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: "Code introuvable" });
    promo.isActive = !promo.isActive;
    await promo.save();
    res.json({ success: true, isActive: promo.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── CHANGELOG ───── */
router.post("/changelog", async (req, res) => {
  try {
    const log = await Changelog.create(req.body);
    // Notifier les users qui ont ce projet
    const Project = require("../models/Project");
    const project = await Project.findById(req.body.project);
    if (project) {
      project.isUpdated = true;
      await project.save();
      const usersWithProject = await User.find({ projects: project._id }).select("_id");
      const notifs = usersWithProject.map(u => ({
        user: u._id,
        title: `${project.name} ${req.body.version} disponible`,
        body: "Une nouvelle version est disponible. Consulte le changelog.",
        type: "update"
      }));
      if (notifs.length) await Notification.insertMany(notifs);
    }
    res.status(201).json({ success: true, changelog: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── BANNIÈRE ───── */
router.get("/banner", async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).sort("-createdAt");
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/banner", async (req, res) => {
  try {
    await Banner.updateMany({}, { isActive: false });
    const banner = await Banner.create({ ...req.body, isActive: true });
    res.status(201).json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── NOTIF PUSH GLOBALE ───── */
router.post("/push", async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: "Titre et message requis" });
    const users = await User.find({ isSuspended: false }).select("_id");
    const notifs = users.map(u => ({ user: u._id, title, body, type: "admin" }));
    await Notification.insertMany(notifs);
    res.json({ success: true, message: `Notif envoyée à ${users.length} utilisateurs` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───── BUG REPORTS ───── */
router.get("/bugs", async (req, res) => {
  try {
    const bugs = await BugReport.find()
      .populate("user", "pseudo").populate("project", "name").sort("-createdAt");
    res.json({ success: true, bugs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/bugs/:id", async (req, res) => {
  try {
    const bug = await BugReport.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, bug });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
