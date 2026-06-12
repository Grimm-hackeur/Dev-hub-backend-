const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendVerificationEmail = async (email, pseudo, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"DevHub" <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: "Vérifie ton email — DevHub",
    html: `
      <div style="background:#08090d;padding:32px;font-family:Inter,sans-serif;color:#f1f5f9">
        <h2 style="color:#a78bfa;margin-bottom:8px">Bienvenue sur DevHub, ${pseudo} !</h2>
        <p style="color:#94a3b8;margin-bottom:24px">Clique sur le bouton ci-dessous pour vérifier ton email.</p>
        <a href="${url}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Vérifier mon email</a>
        <p style="color:#64748b;margin-top:24px;font-size:12px">Lien valide 24h. Si tu n'es pas à l'origine de cette inscription, ignore ce mail.</p>
      </div>
    `,
  });
};

const sendNotificationEmail = async (email, pseudo, title, body) => {
  await transporter.sendMail({
    from: `"DevHub" <${process.env.NODEMAILER_USER}>`,
    to: email,
    subject: `${title} — DevHub`,
    html: `
      <div style="background:#08090d;padding:32px;font-family:Inter,sans-serif;color:#f1f5f9">
        <h2 style="color:#a78bfa;margin-bottom:8px">${title}</h2>
        <p style="color:#94a3b8">${body}</p>
        <a href="${process.env.CLIENT_URL}" style="display:inline-block;margin-top:20px;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Voir sur DevHub</a>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendNotificationEmail };
