require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connexion DB
connectDB();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/projects",      require("./routes/projects"));
app.use("/api/community",     require("./routes/community"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/leaderboard",   require("./routes/leaderboard"));
app.use("/api/events",        require("./routes/events"));
app.use("/api/changelog",     require("./routes/changelog"));
app.use("/api/admin",         require("./routes/admin"));

// Route santé
app.get("/", (req, res) => {
  res.json({ success: true, message: "DevHub API v1.0 — Online ✅", timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable" });
});

// Erreur globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Erreur serveur" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 DevHub API lancé sur le port ${PORT}`);
});
