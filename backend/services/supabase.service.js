// backend/services/supabase.service.js
//
// Two Supabase clients, on purpose:
//
// 1. supabaseAnon  — used to verify a user's own access token (getUser).
//                     Safe to use with untrusted tokens from the frontend.
//
// 2. supabaseAdmin — uses the SERVICE ROLE key. NEVER exposed to the frontend.
//                     Used only for server-trusted work like writing usage-limit
//                     rows, reading another table's protected rows, etc.
//                     Every function here that uses supabaseAdmin takes an
//                     already-verified userId — it never trusts a client-supplied
//                     userId on its own.

const { createClient } = require("@supabase/supabase-js");
const { config } = require("../config/env");

const supabaseAnon = createClient(config.supabase.url, config.supabase.anonKey);

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verifies a Supabase access token (sent from the frontend after login)
 * and returns the authenticated user, or null if invalid/expired.
 */
async function getUserFromToken(accessToken) {
  if (!accessToken) return null;

  const { data, error } = await supabaseAnon.auth.getUser(accessToken);
  if (error || !data?.user) return null;

  return data.user;
}

/**
 * Fetches (or lazily creates) a profile row for a user.
 * Table expected: public.profiles (id uuid PK references auth.users.id,
 * name text, role text, school text, created_at timestamptz)
 */
async function getOrCreateProfile(userId, defaults = {}) {
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (existing) return existing;

  const { data: created, error: insertErr } = await supabaseAdmin
    .from("profiles")
    .insert({ id: userId, role: "student", ...defaults })
    .select("*")
    .single();

  if (insertErr) throw insertErr;
  return created;
}

module.exports = { supabaseAnon, supabaseAdmin, getUserFromToken, getOrCreateProfile };
