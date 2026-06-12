const { v4: uuidv4 } = require("uuid");

const generateLicenseKey = (projectName) => {
  const prefix = projectName.replace(/[^A-Z]/gi, "").substring(0, 3).toUpperCase();
  const id = uuidv4().split("-")[0].toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}-${id}-${year}`;
};

const generateReferralCode = (pseudo) => {
  const code = pseudo.toUpperCase().substring(0, 6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${code}-${rand}`;
};

module.exports = { generateLicenseKey, generateReferralCode };
