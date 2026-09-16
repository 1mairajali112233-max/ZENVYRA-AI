// backend/config/env.js
// Central place that reads process.env and fails LOUDLY (but safely) if something
// required is missing. Nothing in this file ever logs a secret value — only names.

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
];

// At least one AI provider key must exist. AI_PROVIDER picks which one is active.
const AI_PROVIDER_KEYS = {
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const providerKeyName = AI_PROVIDER_KEYS[provider];

  if (!providerKeyName) {
    missing.push(
      `AI_PROVIDER (set to one of: ${Object.keys(AI_PROVIDER_KEYS).join(", ")})`
    );
  } else if (!process.env[providerKeyName]) {
    missing.push(providerKeyName);
  }

  if (missing.length > 0) {
    // Print variable NAMES only. Never values.
    console.error(
      "\n❌ Zenvyra backend cannot start — missing required environment variables:\n" +
        missing.map((v) => `   - ${v}`).join("\n") +
        "\n\nAdd these in your .env file locally, or in Railway → Variables in production.\n"
    );
    process.exit(1);
  }
}

const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  jwtSecret: process.env.JWT_SECRET,

  ai: {
    provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
    geminiKey: process.env.GEMINI_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  },

  cors: {
    // Comma-separated list in env, e.g. "http://localhost:5500,https://zenvyra.app"
    allowedOrigins: (
      process.env.ALLOWED_ORIGINS ||
      "http://localhost:5500,http://127.0.0.1:5500"
    )
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  },

  limits: {
    messagesPerDay: parseInt(process.env.LIMIT_MESSAGES_PER_DAY || "40", 10),
    filesPerDay: parseInt(process.env.LIMIT_FILES_PER_DAY || "2", 10),
    photosPerDay: parseInt(process.env.LIMIT_PHOTOS_PER_DAY || "3", 10),
    maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || "10", 10),
  },
};

module.exports = { config, validateEnv };
