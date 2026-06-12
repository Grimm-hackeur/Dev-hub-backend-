const router = require("express").Router();
const User = require("../models/User");

// GET /api/leaderboard
router.get("/", async (req, res) => {
  try {
    const { by = "points", limit = 20 } = req.query;
    const sortField = by === "coins" ? "-coins" : "-points";
    const users = await User.find({ isSuspended: false })
      .select("pseudo avatar badges points coins level")
      .sort(sortField)
      .limit(parseInt(limit));
    res.json({ success: true, leaderboard: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
