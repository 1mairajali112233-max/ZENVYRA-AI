// backend/middleware/requireAuth.js
//
// Protects a route: requires a valid Supabase access token in the
// Authorization header ("Bearer <token>"). On success, attaches the
// verified user to req.user. Never trusts a userId sent in the request body.

const { getUserFromToken } = require("../services/supabase.service");
const { fail } = require("../utils/apiResponse");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return fail(res, "You must be signed in to do that.", 401);
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return fail(res, "Your session has expired. Please sign in again.", 401);
    }

    req.user = user; // { id, email, ... }
    next();
  } catch (err) {
    console.error("requireAuth error:", err.message);
    return fail(res, "Something went wrong verifying your session.", 500);
  }
}

module.exports = { requireAuth };
