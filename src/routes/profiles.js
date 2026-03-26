const express = require("express");
const { supabaseAdmin } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");
const { validateRole, validateRequiredText } = require("../utils/validators");

const router = express.Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, role, name, phone, city, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/me", async (req, res) => {
  try {
    const { role, name, city } = req.body;

    const updates = {};
    if (role !== undefined) {
      const roleCheck = validateRole(role);
      if (!roleCheck.ok) return res.status(400).json({ error: roleCheck.message });
      updates.role = roleCheck.value;
    }
    if (name !== undefined) {
      const nameCheck = validateRequiredText(name, "name");
      if (!nameCheck.ok) return res.status(400).json({ error: nameCheck.message });
      updates.name = nameCheck.value;
    }
    if (city !== undefined) {
      const cityCheck = validateRequiredText(city, "city");
      if (!cityCheck.ok) return res.status(400).json({ error: cityCheck.message });
      updates.city = cityCheck.value;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update (role, name, city)" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select("id, role, name, phone, city, created_at")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Profile updated", profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { role, city, limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(Number(limit) || 20, 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const from = (parsedPage - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, role, name, phone, city, created_at", { count: "exact" })
      .range(from, to)
      .order("created_at", { ascending: false });

    if (role) query = query.eq("role", role);
    if (city) query = query.eq("city", city);

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      page: parsedPage,
      limit: parsedLimit,
      total: count || 0,
      items: data || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/unlock-contact", async (req, res) => {
  try {
    const helperIdCheck = validateRequiredText(req.body?.helper_id, "helper_id", 80);
    if (!helperIdCheck.ok) return res.status(400).json({ error: helperIdCheck.message });

    const { data: requesterProfile, error: requesterError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", req.user.id)
      .single();

    if (requesterError || !requesterProfile) {
      return res.status(404).json({ error: "Requester profile not found" });
    }

    if (requesterProfile.role !== "owner") {
      return res.status(403).json({ error: "Only owners can unlock contact" });
    }

    const { data: helperProfile, error: helperError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, name, phone, city")
      .eq("id", helperIdCheck.value)
      .single();

    if (helperError || !helperProfile) {
      return res.status(404).json({ error: "Helper profile not found" });
    }

    if (helperProfile.role !== "helper") {
      return res.status(400).json({ error: "helper_id must belong to a helper profile" });
    }

    return res.status(200).json({
      message: "Contact unlocked",
      contact: {
        id: helperProfile.id,
        name: helperProfile.name,
        phone: helperProfile.phone,
        city: helperProfile.city,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
