// backend/routes/chat.routes.js
//
// Matches the endpoint shapes the CURRENT frontend (script.js) already calls:
//   POST /api/chat        { message }              -> { success, data: { reply } }
//   POST /api/chat-json   { system, message }       -> { success, data: <parsed JSON> }
//   POST /api/vision      { message, imageBase64, mimeType } -> { success, data: { reply } }
//
// All three require auth and are usage-limited server-side (not localStorage).

const express = require("express");
const router = express.Router();

const ai = require("../services/ai.service");
const { requireAuth } = require("../middleware/requireAuth");
const { usageLimit } = require("../middleware/usageLimit");
const { success, aiFailure, fail } = require("../utils/apiResponse");

router.post("/chat", requireAuth, usageLimit("messages"), async (req, res) => {
  try {
    const { message, system, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return fail(res, "A message is required.", 400);
    }

    const reply = await ai.chat({ system, message, history });
    return success(res, { reply });
  } catch (err) {
    console.error("chat error:", err.message);
    return aiFailure(res, err);
  }
});

router.post("/chat-json", requireAuth, usageLimit("messages"), async (req, res) => {
  try {
    const { message, system } = req.body || {};
    if (!message || typeof message !== "string") {
      return fail(res, "A message is required.", 400);
    }

    const parsed = await ai.chatJson({ system, message });
    return success(res, parsed);
  } catch (err) {
    console.error("chat-json error:", err.message);
    if (err.message === "AI did not return valid JSON") {
      return fail(res, "Zenvyra couldn't format that response properly. Please try again.", 502);
    }
    return aiFailure(res, err);
  }
});

const MAX_IMAGE_MB = 8;

// Field names here match what the EXISTING frontend (askZenvyraAIVision in
// script.js) already sends: base64Data / mediaType / prompt. Kept as-is on
// purpose rather than forcing a frontend rewrite — the backend adapts to the
// contract that already exists.
router.post("/vision", requireAuth, usageLimit("photos"), async (req, res) => {
  try {
    const { prompt, base64Data, mediaType, system } = req.body || {};

    if (!base64Data || !mediaType) {
      return fail(res, "An image is required.", 400);
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(mediaType)) {
      return fail(res, "Please upload a PNG, JPEG, or WEBP image.", 400);
    }

    const approxBytes = base64Data.length * 0.75;
    if (approxBytes > MAX_IMAGE_MB * 1024 * 1024) {
      return fail(res, `Please upload an image under ${MAX_IMAGE_MB}MB.`, 400);
    }

    const reply = await ai.chatVision({
      system,
      message: prompt,
      imageBase64: base64Data,
      mimeType: mediaType,
    });
    return success(res, { reply });
  } catch (err) {
    console.error("vision error:", err.message);
    return aiFailure(res, err);
  }
});

module.exports = router;
