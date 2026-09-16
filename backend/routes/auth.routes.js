// backend/routes/auth.routes.js
//
// Thin wrapper around Supabase Auth. Passwords are never touched by our own
// code — Supabase hashes/stores them. We just relay the calls and normalize
// the response shape, then attach/create our own `profiles` row.

const express = require("express");
const router = express.Router();

const { supabaseAnon, getOrCreateProfile } = require("../services/supabase.service");
const { requireAuth } = require("../middleware/requireAuth");
const { success, fail } = require("../utils/apiResponse");

// POST /api/auth/signup
// body: { email, password, name, role }  role: 'student' | 'teacher' | 'general'
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};

    if (!email || !password) {
      return fail(res, "Email and password are required.", 400);
    }
    if (password.length < 8) {
      return fail(res, "Password must be at least 8 characters.", 400);
    }
    if (role && !["student", "teacher", "general"].includes(role)) {
      return fail(res, "Role must be student, teacher, or general.", 400);
    }

    const { data, error } = await supabaseAnon.auth.signUp({ email, password });

    if (error) {
      return fail(res, error.message || "Could not create your account.", 400);
    }

    // If email confirmation is required, data.session will be null here —
    // that's expected, not an error.
    if (data.user) {
      await getOrCreateProfile(data.user.id, { name, role: role || "student" });
    }

    return success(res, {
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session, // null until email is confirmed, if that's enabled
      confirmationRequired: !data.session,
    });
  } catch (err) {
    console.error("signup error:", err.message);
    return fail(res, "Something went wrong creating your account.", 500);
  }
});

// POST /api/auth/login
// body: { email, password }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return fail(res, "Email and password are required.", 400);
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return fail(res, "Incorrect email or password.", 401);
    }

    const profile = await getOrCreateProfile(data.user.id, {});

    return success(res, {
      session: data.session, // { access_token, refresh_token, expires_at, ... }
      user: { id: data.user.id, email: data.user.email },
      profile,
    });
  } catch (err) {
    console.error("login error:", err.message);
    return fail(res, "Something went wrong signing you in.", 500);
  }
});

// POST /api/auth/logout
// Supabase logout of a specific session is really a client-side token discard;
// this endpoint exists mainly so the frontend has one consistent call to make,
// and so we can invalidate the refresh token server-side.
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.slice(7);
    await supabaseAnon.auth.signOut(token);
    return success(res, { loggedOut: true });
  } catch (err) {
    console.error("logout error:", err.message);
    // Logging out should basically never fail the user's flow client-side —
    // the frontend discards its local token regardless.
    return success(res, { loggedOut: true });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user.id, {});
    return success(res, {
      user: { id: req.user.id, email: req.user.email },
      profile,
    });
  } catch (err) {
    console.error("me error:", err.message);
    return fail(res, "Could not load your profile.", 500);
  }
});

module.exports = router;
