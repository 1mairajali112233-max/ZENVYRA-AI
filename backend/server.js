// backend/server.js
// Entry point. Run with: npm start  (-> node backend/server.js)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { config, validateEnv } = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const fileRoutes = require("./routes/file.routes");
const toolsRoutes = require("./routes/tools.routes");

// Fail fast with a clear message if required env vars are missing —
// better than crashing later, confusingly, on the first real request.
validateEnv();

const app = express();

// Railway sits behind a proxy — needed for correct client IPs / secure cookies.
app.set("trust proxy", 1);



app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

const allowedOrigin = "http://127.0.0.1:5500";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", env: config.nodeEnv } });
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes); // /api/chat, /api/chat-json, /api/vision
app.use("/api", fileRoutes);
 // /api/file


// /api/tools/generate, /api/tools/export

app.use(notFoundHandler);
app.use(errorHandler);

// Belt-and-suspenders: catch anything that slips past Express entirely so
// the Node process itself never dies from an unhandled rejection.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

app.listen(config.port, () => {
  console.log(`Zenvyra backend running on port ${config.port} (${config.nodeEnv})`);
});
