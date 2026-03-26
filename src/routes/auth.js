const express = require("express");
const { supabaseAuth, supabaseAdmin } = require("../lib/supabase");
const { env } = require("../config/env");
const { requireAuth } = require("../middleware/auth");
const {
  validatePhone,
  validatePassword,
  validateRole,
  validateRequiredText,
} = require("../utils/validators");
const { phoneToInternalEmail } = require("../utils/phoneAuthIdentity");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { phone, password, role, name, city } = req.body;

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) return res.status(400).json({ error: phoneCheck.message });

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) return res.status(400).json({ error: passwordCheck.message });

    const roleCheck = validateRole(role);
    if (!roleCheck.ok) return res.status(400).json({ error: roleCheck.message });

    const nameCheck = validateRequiredText(name, "name");
    if (!nameCheck.ok) return res.status(400).json({ error: nameCheck.message });

    const cityCheck = validateRequiredText(city, "city");
    if (!cityCheck.ok) return res.status(400).json({ error: cityCheck.message });

    const internalEmail = phoneToInternalEmail(
      phoneCheck.value,
      env.phoneAuthEmailDomain,
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: passwordCheck.value,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data?.user;
    if (!user) {
      return res.status(500).json({ error: "User not created" });
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        role: roleCheck.value,
        name: nameCheck.value,
        phone: user.phone || phoneCheck.value,
        city: cityCheck.value,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return res.status(400).json({ error: profileError.message });
    }

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: user.id,
        phone: phoneCheck.value,
      },
      session: null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) return res.status(400).json({ error: phoneCheck.message });
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) return res.status(400).json({ error: passwordCheck.message });

    const internalEmail = phoneToInternalEmail(
      phoneCheck.value,
      env.phoneAuthEmailDomain,
    );

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: internalEmail,
      password: passwordCheck.value,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }
    if (!data?.session) {
      return res.status(401).json({
        error: "Login failed: no session returned. Check phone confirmation settings in Supabase.",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: data.user.id,
        phone: phoneCheck.value,
      },
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/logout", requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.signOut(req.accessToken);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, role, name, phone, city, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(200).json({
      authUser: {
        id: req.user.id,
      },
      profile: data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
