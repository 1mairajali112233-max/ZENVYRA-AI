// backend/services/ai.service.js
//
// Single abstraction over whichever AI provider is configured. Routes never
// import Gemini/OpenAI/Anthropic SDKs directly — they call the functions
// below. Swapping providers means changing AI_PROVIDER in env, not code.
//
// Every function here can throw — callers should catch and route the error
// through utils/apiResponse.js's aiFailure(), which turns provider errors
// into the friendly 429/503/500 messages required by the spec.

const { config } = require("../config/env");

let _client = null;
let _clientType = null;

function getClient() {
  if (_client) return _client;

  const provider = config.ai.provider;

  if (provider === "gemini") {
    const { GoogleGenAI } = require("@google/genai");
    _client = new GoogleGenAI({ apiKey: config.ai.geminiKey });
    _clientType = "gemini";
  } else if (provider === "openai") {
    const OpenAI = require("openai");
    _client = new OpenAI({ apiKey: config.ai.openaiKey });
    _clientType = "openai";
  } else if (provider === "anthropic") {
    const Anthropic = require("@anthropic-ai/sdk");
    _client = new Anthropic({ apiKey: config.ai.anthropicKey });
    _clientType = "anthropic";
  } else {
    throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }

  return _client;
}

/**
 * Plain text chat. Returns a string.
 */
async function chat({ system, message, history = [] }) {
  const client = getClient();

  if (_clientType === "gemini") {
    const contents = [
      ...history.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const config = system
      ? { systemInstruction: system }
      : undefined;

    // Retry temporary Gemini 503/UNAVAILABLE errors
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents,
          config,
        });

        return response.text;
      } catch (err) {
        lastError = err;

        const errorText = String(
          err?.message || err || ""
        ).toLowerCase();

        const isTemporary =
          errorText.includes("503") ||
          errorText.includes("unavailable") ||
          errorText.includes("high demand");

        if (!isTemporary || attempt === 3) {
          throw err;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 2000)
        );
      }
    }

    throw lastError;
  }

  if (_clientType === "openai") {
    const messages = [
      ...(system ? [{ role: "system", content: system }] : []),
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages,
    });

    return response.choices[0].message.content;
  }

  if (_clientType === "anthropic") {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: system || undefined,
      messages: [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ],
    });

    return response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
  }

  throw new Error("No AI client configured");
}

/**
 * Chat that expects a JSON-shaped answer back (quizzes, notes, etc).
 * Instructs the model to return ONLY JSON, then parses it. Throws if the
 * model didn't return valid JSON — callers should treat that as a 502.
 */
async function chatJson({ system, message }) {
  const jsonSystem =
    (system ? system + "\n\n" : "") +
    "Respond with ONLY valid JSON. No markdown code fences, no preamble, no explanation outside the JSON object.";

  const raw = await chat({ system: jsonSystem, message });
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const err = new Error("AI did not return valid JSON");
    err.raw = cleaned;
    throw err;
  }
}

/**
 * Vision: image + optional question. `imageBase64` has no data-URL prefix.
 */
async function chatVision({ system, message, imageBase64, mimeType }) {
  const client = getClient();
if (system) {
  system += `

IMPORTANT IDENTITY:
You are Zenvyra AI, not Gemini.

If the user asks who created you, who made you, who your creator is, or who your founder is, answer:
"I’m Zenvyra AI, created by Mairaj Ali — Founder & CEO of Zenvyra AI.
I was built with one simple vision: to make learning smarter, simpler, and more enjoyable for everyone."

Do not identify yourself as Gemini.
Do not say Google created you.
Do not say OpenAI created you.
`;
}
  if (_clientType === "gemini") {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: message || "Explain what's in this image and solve/answer it." },
          ],
        },
      ],
      config: system ? { systemInstruction: system } : undefined,
    });
    return response.text;
  }

  if (_clientType === "openai") {
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        {
          role: "user",
          content: [
            { type: "text", text: message || "Explain what's in this image and solve/answer it." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
    });
    return response.choices[0].message.content;
  }

  if (_clientType === "anthropic") {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: system || undefined,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
            { type: "text", text: message || "Explain what's in this image and solve/answer it." },
          ],
        },
      ],
    });
    return response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  }

  throw new Error("No AI client configured");
}

module.exports = { chat, chatJson, chatVision };
