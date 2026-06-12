const router = require("express").Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// GET /api/notifications
router.get("/", protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort("-createdAt").limit(30);
    const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, notifications: notifs, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "Tout marqué comme lu" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
