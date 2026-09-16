// backend/middleware/usageLimit.js
//
// Enforces per-account daily limits SERVER-SIDE. The frontend may also show
// its own counters for UX, but those are cosmetic only — this middleware is
// the real enforcement point, so a user editing localStorage can't bypass it.
//
// Expected Supabase table: public.usage_daily
//   user_id      uuid       (FK -> auth.users.id)
//   usage_date   date       (server-local date, e.g. '2026-09-13')
//   messages     int        default 0
//   files        int        default 0
//   photos       int        default 0
//   PRIMARY KEY (user_id, usage_date)
//
// One row per user per day. We upsert-and-increment via a Postgres RPC
// (see sql/001_usage_daily.sql for the function) so concurrent requests
// can't race past the limit.

const { supabaseAdmin } = require("../services/supabase.service");
const { config } = require("../config/env");
const { fail } = require("../utils/apiResponse");

const LIMIT_BY_KIND = {
  messages: config.limits.messagesPerDay,
  files: config.limits.filesPerDay,
  photos: config.limits.photosPerDay,
};

const FRIENDLY_KIND = {
  messages: "message",
  files: "file",
  photos: "photo",
};

/**
 * Returns Express middleware that checks + increments today's usage for `kind`
 * ("messages" | "files" | "photos") before letting the request continue.
 */
function usageLimit(kind) {
  const limit = LIMIT_BY_KIND[kind];

  return async function (req, res, next) {
    if (!req.user) {
      // requireAuth must run before usageLimit
      return fail(res, "You must be signed in to do that.", 401);
    }

    try {
      // increment_usage is a Postgres function — see sql/001_usage_daily.sql.
      // It atomically does: insert-or-update the row, +1 to the given column,
      // and returns the new count. This avoids a read-then-write race.
      const { data, error } = await supabaseAdmin.rpc("increment_usage", {
        p_user_id: req.user.id,
        p_kind: kind,
      });

      if (error) throw error;

      const newCount = data; // function returns the new integer count

      if (newCount > limit) {
        return fail(
          res,
          `Your daily Zenvyra limit has been reached. You can continue when your limit resets.`,
          429,
          { limitReached: true, kind, limit }
        );
      }

      req.usage = { kind, count: newCount, limit };
      next();
    } catch (err) {
      console.error(`usageLimit(${kind}) error:`, err.message);
      // Fail OPEN on infra errors so a Supabase hiccup doesn't take down chat —
      // but log it loudly so it gets noticed. This is a deliberate tradeoff;
      // flip to fail-closed if abuse becomes a concern.
      next();
    }
  };
}

module.exports = { usageLimit, FRIENDLY_KIND };
