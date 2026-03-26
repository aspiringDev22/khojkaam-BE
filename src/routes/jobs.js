const express = require("express");
const { supabaseAdmin } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");
const { validateRequiredText } = require("../utils/validators");

const router = express.Router();

function parseBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    return { ok: false, message: `${fieldName} must be a boolean` };
  }
  return { ok: true, value };
}

async function getProfileById(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  return { data, error };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, shop_type, city, salary_range, is_active, is_featured } =
      req.body;

    const profileResult = await getProfileById(req.user.id);
    if (profileResult.error || !profileResult.data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (profileResult.data.role !== "owner") {
      return res.status(403).json({ error: "Only owners can create jobs" });
    }

    const titleCheck = validateRequiredText(title, "title");
    if (!titleCheck.ok) return res.status(400).json({ error: titleCheck.message });

    const descriptionCheck = validateRequiredText(description, "description", 1000);
    if (!descriptionCheck.ok) {
      return res.status(400).json({ error: descriptionCheck.message });
    }

    const shopTypeCheck = validateRequiredText(shop_type, "shop_type");
    if (!shopTypeCheck.ok) return res.status(400).json({ error: shopTypeCheck.message });

    const cityCheck = validateRequiredText(city, "city");
    if (!cityCheck.ok) return res.status(400).json({ error: cityCheck.message });

    const salaryRangeCheck = validateRequiredText(salary_range, "salary_range");
    if (!salaryRangeCheck.ok) {
      return res.status(400).json({ error: salaryRangeCheck.message });
    }

    const insertPayload = {
      owner_id: req.user.id,
      title: titleCheck.value,
      description: descriptionCheck.value,
      shop_type: shopTypeCheck.value,
      city: cityCheck.value,
      salary_range: salaryRangeCheck.value,
    };

    if (is_active !== undefined) {
      const isActiveCheck = parseBoolean(is_active, "is_active");
      if (!isActiveCheck.ok) return res.status(400).json({ error: isActiveCheck.message });
      insertPayload.is_active = isActiveCheck.value;
    }

    if (is_featured !== undefined) {
      const isFeaturedCheck = parseBoolean(is_featured, "is_featured");
      if (!isFeaturedCheck.ok) {
        return res.status(400).json({ error: isFeaturedCheck.message });
      }
      insertPayload.is_featured = isFeaturedCheck.value;
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert(insertPayload)
      .select(
        "id, owner_id, title, description, shop_type, city, salary_range, is_active, is_featured, created_at",
      )
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: "Job created", job: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { city, shop_type, owner_id, is_active = "true", limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(Number(limit) || 20, 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const from = (parsedPage - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    let query = supabaseAdmin
      .from("jobs")
      .select(
        "id, owner_id, title, description, shop_type, city, salary_range, is_active, is_featured, created_at",
        { count: "exact" },
      )
      .range(from, to)
      .order("created_at", { ascending: false });

    if (city) query = query.eq("city", city);
    if (shop_type) query = query.eq("shop_type", shop_type);
    if (owner_id) query = query.eq("owner_id", owner_id);
    if (is_active === "true") query = query.eq("is_active", true);
    if (is_active === "false") query = query.eq("is_active", false);

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

router.get("/my", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select(
        "id, owner_id, title, description, shop_type, city, salary_range, is_active, is_featured, created_at",
      )
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ items: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select(
        "id, owner_id, title, description, shop_type, city, salary_range, is_active, is_featured, created_at",
      )
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
