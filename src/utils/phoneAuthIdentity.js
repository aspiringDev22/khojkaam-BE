const crypto = require("crypto");

function normalizePhoneForIdentity(phone) {
  if (typeof phone !== "string") return "";
  return phone.trim().replace(/\s+/g, "");
}

function normalizeDomain(domain) {
  const input = String(domain || "").trim().toLowerCase();
  const isValid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(input);
  return isValid ? input : "example.com";
}

function phoneToInternalEmail(phone, domain = "example.com") {
  const normalized = normalizePhoneForIdentity(phone);
  const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 40);
  return `p${hash}@${normalizeDomain(domain)}`;
}

module.exports = {
  normalizePhoneForIdentity,
  phoneToInternalEmail,
};
