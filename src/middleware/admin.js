const adminOnly = (req, res, next) => {
  const adminPw = req.headers["x-admin-password"];
  if (adminPw !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, message: "Accès admin refusé" });
  }
  next();
};

module.exports = { adminOnly };
