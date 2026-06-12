const router = require("express").Router();
const Changelog = require("../models/Changelog");

// GET /api/changelog
router.get("/", async (req, res) => {
  try {
    const { project } = req.query;
    const filter = project ? { project } : {};
    const logs = await Changelog.find(filter)
      .populate("project", "name type")
      .sort("-createdAt");
    res.json({ success: true, changelog: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
