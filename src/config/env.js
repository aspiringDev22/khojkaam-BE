function read(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : value;
}

function required(name) {
  const value = read(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function isLikelyPublishableKey(value) {
  return value.startsWith("sb_publishable_");
}

function isLikelyJwt(value) {
  return value.split(".").length === 3;
}

function parseJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function validateServiceRoleKey(value) {
  if (isLikelyPublishableKey(value)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Use the Secret/service_role key from Supabase project settings.",
    );
  }

  if (isLikelyJwt(value)) {
    const payload = parseJwtPayload(value);
    if (payload?.role && payload.role !== "service_role") {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY has JWT role "${payload.role}". Expected "service_role".`,
      );
    }
  }

  return value;
}

const env = {
  port: Number(read("PORT")) || 3000,
  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: validateServiceRoleKey(required("SUPABASE_SERVICE_ROLE_KEY")),
  phoneAuthEmailDomain: read("PHONE_AUTH_EMAIL_DOMAIN") || "example.com",
};

module.exports = { env };
