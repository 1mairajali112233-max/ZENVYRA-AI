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
      return fail(res, "You must be signed in to do that.", 401);
    }

    try {
      const { data, error } = await supabaseAdmin.rpc("increment_usage", {
        p_user_id: req.user.id,
        p_kind: kind,
      });

      if (error) throw error;

      const newCount = Number(data);

      if (newCount > limit) {
       // Daily reset = next midnight Pakistan Time (PKT)
const now = new Date();

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).formatToParts(now);

const year = parts.find(p => p.type === "year").value;
const month = parts.find(p => p.type === "month").value;
const day = parts.find(p => p.type === "day").value;

// Pakistan midnight (+05:00), then next day
const resetAt = new Date(`${year}-${month}-${day}T00:00:00+05:00`);
resetAt.setUTCDate(resetAt.getUTCDate() + 1);

const resetTime = resetAt.toLocaleString("en-PK", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}) + " (Pakistan Time)";

        return fail(
          res,
          `Your daily ${FRIENDLY_KIND[kind] || kind} limit has been reached. Your limit will reset at ${resetTime}.`,
          429,
          {
            limitReached: true,
            kind,
            limit,
            used: limit,
            remaining: 0,
           resetAt: "TEST-PAKISTAN-TIME"
          }
        );
      }

      req.usage = {
        kind,
        count: newCount,
        limit,
        remaining: Math.max(0, limit - newCount)
      };

      next();
    } catch (err) {
      console.error(`usageLimit(${kind}) error:`, err.message);

      // Keep fail-open for infrastructure errors.
      next();
    }
  };
}
module.exports = { usageLimit };