// Zenvyra AI backend — connects the frontend to the real Gemini API.
// Run with: node backend/server.js   (from the project root)

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing. Add it to your .env file at the project root.");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.6-flash";

const MESSAGE_LIMIT = 20;
const userMessageCounts = new Map();

// Plain text chat
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Missing 'message' in request body."
            });
        }

        const userId = req.ip;
const currentCount = userMessageCounts.get(userId) || 0;

if (currentCount >= MESSAGE_LIMIT) {
    return res.status(429).json({
        success: false,
        limitReached: true,
        message: "You have reached your daily message limit. Please try again later."
    });
}

userMessageCounts.set(userId, currentCount + 1);
        const zenvyraMessage = `You are Zenvyra AI.

You were created by Mairaj Ali, Founder & CEO of Zenvyra AI.

If the user asks:
- Who created you?
- Who founded you?
- Who is your founder?
- Who is your CEO?

Answer clearly:
"I was created by Mairaj Ali, Founder & CEO of Zenvyra AI."

Do not say that Google created Zenvyra AI.
Google provides the AI model/API technology used by Zenvyra.

For all other questions, answer normally and helpfully.

User message:
${message}`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: zenvyraMessage
        });

        res.json({
            success: true,
            reply: response.text
        });

    } catch (err) {
    console.error("Gemini /api/chat error:", err);

    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            limitReached: true,
            message: "You have reached the AI message limit. Please try again later."
        });
    }

    res.status(500).json({
        success: false,
        message: "AI request failed."
    });
    }
});

// JSON-shaped responses — used by askZenvyraAIJson()
app.post("/api/chat-json", async (req, res) => {
    try {
        const { system, message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Missing 'message' in request body."
            });
        }

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: system
                ? `${system}\n\n${message}`
                : message,
            config: {
                responseMimeType: "application/json"
            }
        });

        let data;

        try {
            data = JSON.parse(response.text);
        } catch (parseErr) {
            console.error(
                "Gemini /api/chat-json — model did not return valid JSON:",
                response.text
            );

            return res.status(502).json({
                success: false,
                message: "AI returned an unexpected format."
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error("Gemini /api/chat-json error:", err);

        res.status(500).json({
            success: false,
            message: "AI request failed."
        });
    }
});


// Vision (photo) requests — used by askZenvyraAIVision()
app.post("/api/vision", async (req, res) => {
    try {
        const { base64Data, mediaType, prompt } = req.body;

        if (!base64Data) {
            return res.status(400).json({
                success: false,
                message: "Missing 'base64Data' in request body."
            });
        }

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: prompt || "Describe this image."
                        },
                        {
                            inlineData: {
                                mimeType: mediaType || "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        });

        res.json({
            success: true,
            reply: response.text
        });

    } catch (err) {
        console.error("Gemini /api/vision error:", err);

        res.status(500).json({
            success: false,
            message: "AI request failed."
        });
    }
});


const PORT = process.env.PORT || 3000;
 
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Zenvyra AI backend running on port ${PORT}`);
});