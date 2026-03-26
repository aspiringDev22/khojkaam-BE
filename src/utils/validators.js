const ALLOWED_ROLES = new Set(["owner", "helper"]);
const PHONE_STRING_REGEX = /^[0-9+][0-9+\-() ]{5,24}$/;

function normalizePhone(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ");
}

function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  if (!PHONE_STRING_REGEX.test(normalized)) {
    return {
      ok: false,
      message: "phone must be a valid string (example: +91 98765 43210)",
    };
  }
  return { ok: true, value: normalized };
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return {
      ok: false,
      message: "password must be at least 8 characters",
    };
  }
  return { ok: true, value: password };
}

function validateRole(role) {
  if (!ALLOWED_ROLES.has(role)) {
    return { ok: false, message: "role must be one of: owner, helper" };
  }
  return { ok: true, value: role };
}

function validateRequiredText(value, fieldName, maxLength = 120) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, message: `${fieldName} is required` };
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return { ok: false, message: `${fieldName} must be <= ${maxLength} chars` };
  }
  return { ok: true, value: trimmed };
}

module.exports = {
  ALLOWED_ROLES,
  validatePhone,
  validatePassword,
  validateRole,
  validateRequiredText,
};
