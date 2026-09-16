// backend/routes/file.routes.js
//
// POST /api/file  { base64Data, mediaType, prompt }
// -> { success, data: { reply } }
//
// Field names match the EXISTING frontend (fileToolInput handler in
// script.js) exactly — it already sends base64Data/mediaType/prompt as
// JSON, not multipart. The backend adapts to that contract rather than
// forcing a frontend rewrite.
//
// Supported right now: PDF, TXT, DOCX (text extraction), and images
// (routed straight to vision). Anything else is rejected with a clear
// message — no silently-fake "we read your file" for formats we can't
// actually parse yet (e.g. legacy .doc).

const express = require("express");
const router = express.Router();

const ai = require("../services/ai.service");
const { requireAuth } = require("../middleware/requireAuth");
const { usageLimit } = require("../middleware/usageLimit");
const { success, aiFailure, fail } = require("../utils/apiResponse");
const { config } = require("../config/env");

const TEXT_MIME = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"];

async function extractText(buffer, kind) {
  if (kind === "txt") {
    return buffer.toString("utf-8");
  }

  if (kind === "pdf") {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (kind === "docx") {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("UNSUPPORTED_TYPE");
}

router.post("/file", requireAuth, usageLimit("files"), async (req, res) => {
  try {
    const { base64Data, mediaType, prompt } = req.body || {};

    if (!base64Data || !mediaType) {
      return fail(res, "A file is required.", 400);
    }

    const approxBytes = base64Data.length * 0.75;
    if (approxBytes > config.limits.maxUploadSizeMb * 1024 * 1024) {
      return fail(res, `Please upload a file under ${config.limits.maxUploadSizeMb}MB.`, 400);
    }

    const question =
      prompt ||
      "Read this file carefully and explain its contents clearly. If it contains questions, solve them.";

    // Images go straight through vision instead of text extraction.
    if (IMAGE_MIME.includes(mediaType)) {
      const reply = await ai.chatVision({
        system: "You are Zenvyra AI, an education assistant helping analyze an uploaded file.",
        message: question,
        imageBase64: base64Data,
        mimeType: mediaType,
      });
      return success(res, { reply });
    }

    const kind = TEXT_MIME[mediaType];
    if (!kind) {
      return fail(
        res,
        mediaType === "application/msword"
          ? "Legacy .doc files aren't supported yet — please save as .docx or .pdf and try again."
          : "Please upload a PDF, DOCX, TXT, or image file.",
        400
      );
    }

    const buffer = Buffer.from(base64Data, "base64");
    const text = await extractText(buffer, kind);
    const trimmed = text.slice(0, 20000); // keep prompt size sane

    if (!trimmed.trim()) {
      return fail(res, "That file doesn't seem to contain any readable text.", 400);
    }

    const reply = await ai.chat({
      system: "You are Zenvyra AI, an education assistant helping analyze an uploaded document.",
      message: `Document content:\n\n${trimmed}\n\nUser question: ${question}`,
    });

    return success(res, { reply });
  } catch (err) {
    console.error("file route error:", err.message);
    if (err.message === "UNSUPPORTED_TYPE") {
      return fail(res, "Please upload a PDF, DOCX, TXT, or image file.", 400);
    }
    return aiFailure(res, err);
  }
});

module.exports = router;
