const User = require("../models/User");
const Notification = require("../models/Notification");

const POINTS_CONFIG = {
  review: 50,
  bug_report: 30,
  referral: 100,
  purchase: 20,
  daily_login: 5,
};

const BADGES_CONFIG = [
  { id: "first_access",   name: "Premier Accès",    condition: (u) => u.projects.length >= 1 },
  { id: "beta_tester",    name: "Beta Testeur",      condition: (u) => u.projects.length >= 1 },
  { id: "top_contributor",name: "Top Contributeur",  condition: (u) => u.points >= 500 },
  { id: "referral_elite", name: "Parrain Elite",     condition: (u) => u.referrals.length >= 5 },
  { id: "faithful",       name: "Fidèle",            condition: (u) => u.streak >= 30 },
  { id: "legend",         name: "Légende",           condition: (u) => u.points >= 5000 },
];

const addPoints = async (userId, amount, reason) => {
  const user = await User.findById(userId);
  if (!user) return;
  const prevLevel = user.level;
  user.points += amount;
  user.updateLevel();
  await user.save();

  // Vérifier les nouveaux badges
  for (const badge of BADGES_CONFIG) {
    if (!user.badges.includes(badge.id) && badge.condition(user)) {
      user.badges.push(badge.id);
      await user.save();
      await Notification.create({
        user: userId,
        title: `Badge débloqué — ${badge.name} !`,
        body: `Félicitations, tu viens de débloquer le badge "${badge.name}".`,
        type: "badge",
      });
    }
  }

  // Notif si passage de niveau
  if (user.level > prevLevel) {
    await Notification.create({
      user: userId,
      title: `Niveau ${user.level} atteint !`,
      body: `Tu es passé au niveau ${user.level}. Continue comme ça !`,
      type: "badge",
    });
  }
};

module.exports = { addPoints, POINTS_CONFIG };
