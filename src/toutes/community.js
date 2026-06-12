const router = require("express").Router();
const Review = require("../models/Review");
const BugReport = require("../models/BugReport");
const { protect } = require("../middleware/auth");
const { addPoints, POINTS_CONFIG } = require("../utils/points");

// GET /api/community/reviews — tous les avis
router.get("/reviews", async (req, res) => {
  try {
    const { project } = req.query;
    const filter = project ? { project } : {};
    const reviews = await Review.find(filter)
      .populate("user", "pseudo avatar badges")
      .populate("project", "name")
      .sort("-createdAt");
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/community/reviews — publier un avis
router.post("/reviews", protect, async (req, res) => {
  try {
    const { project, rating, text } = req.body;
    if (!project || !rating || !text)
      return res.status(400).json({ success: false, message: "Champs manquants" });

    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const isVerified = user.projects.includes(project);

    const review = await Review.create({ user: req.user._id, project, rating, text, isVerified });
    await addPoints(req.user._id, POINTS_CONFIG.review, "Avis publié");

    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Tu as déjà laissé un avis" });
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/community/reviews/:id/like — liker un avis
router.post("/reviews/:id/like", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Avis introuvable" });
    const idx = review.likes.indexOf(req.user._id);
    idx === -1 ? review.likes.push(req.user._id) : review.likes.splice(idx, 1);
    await review.save();
    res.json({ success: true, likes: review.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/community/bugs — signalements
router.get("/bugs", async (req, res) => {
  try {
    const bugs = await BugReport.find()
      .populate("user", "pseudo")
      .populate("project", "name")
      .sort("-createdAt");
    res.json({ success: true, bugs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/community/bugs — signaler un bug
router.post("/bugs", protect, async (req, res) => {
  try {
    const { project, title, description, severity } = req.body;
    if (!project || !title || !description)
      return res.status(400).json({ success: false, message: "Champs manquants" });
    const bug = await BugReport.create({ user: req.user._id, project, title, description, severity });
    await addPoints(req.user._id, POINTS_CONFIG.bug_report, "Signalement bug");
    res.status(201).json({ success: true, bug });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
