require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { GoogleGenAI } = require("@google/genai");

const app = express();

console.log("SUPABASE_URL =", JSON.stringify(process.env.SUPABASE_URL));

const supabase = createClient(
    process.env.SUPABASE_URL.trim(),
    process.env.SUPABASE_ANON_KEY.trim()
);

const PORT = process.env.PORT || 3000;


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    credentials: true
}));

app.use(cookieParser());

app.use(express.json({
    limit: "15mb"
}));

app.get("/", (req, res) => {
    res.send("Zenvyra AI backend is working!");
});

// ===============================
// ENV CHECK
// ===============================

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing.");
    process.exit(1);
}


// ===============================
// GEMINI
// ===============================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.8-flash";


// ===============================
// AUTH HELPERS
// ===============================


function setAuthCookie(res, token) {
    res.cookie("zenvyra_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

async function authenticate(req, res, next) {
    try {
        const token = req.cookies.zenvyra_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please log in first."
            });
        }

        const {
            data: { user },
            error
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Your login session has expired. Please log in again."
            });
        }

        req.user = user;
        next();

    } catch (err) {
        console.error("Authentication error:", err);

        return res.status(401).json({
            success: false,
            message: "Authentication failed. Please log in again."
        });
    }
}

    
// ===============================
// REGISTER
// ===============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            school,
            role
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    name: name.trim(),
                    phone: phone ? phone.trim() : "",
                    school: school ? school.trim() : "",
                    role
                }
            }
        });

        if (error) {
            console.error("Supabase register error:", error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (!data.user) {
            return res.status(400).json({
                success: false,
                message: "Account could not be created."
            });
        }

        if (data.session) {
            setAuthCookie(res, data.session.access_token);
        }

        res.status(201).json({
            success: true,
            message: data.session
                ? "Account created successfully."
                : "Account created. Please verify your email.",
            user: {
                id: data.user.id,
                email: data.user.email,
                name: name.trim(),
                phone: phone ? phone.trim() : "",
                school: school ? school.trim() : "",
                role
            }
        });

    } catch (err) {
        console.error("Register error:", err);

        res.status(500).json({
            success: false,
            message: "Could not create account."
        });
    }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
        });

        if (error || !data.user || !data.session) {
            return res.status(401).json({
                success: false,
                message: error?.message || "Incorrect email or password."
            });
        }

        setAuthCookie(res, data.session.access_token);

        const meta = data.user.user_metadata || {};

        res.json({
            success: true,
            message: "Login successful.",
            user: {
                id: data.user.id,
                name: meta.name || "",
                email: data.user.email,
                phone: meta.phone || "",
                school: meta.school || "",
                role: meta.role || ""
            }
        });

    } catch (err) {
        console.error("Login error:", err);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// ===============================
// CURRENT USER
// ===============================

app.get("/api/auth/me", authenticate, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// ===============================
// LOGOUT
// ===============================

app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("zenvyra_token");

    res.json({
        success: true,
        message: "Logged out successfully."
    });
});

// ===============================
// DAILY LIMITS
// ===============================

const CHAT_LIMIT = 50;
const PHOTO_LIMIT = 4;
const FILE_LIMIT = 2;

const userUsage = new Map();

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function getUserUsage(userId) {
    const today = getToday();

    const existing = userUsage.get(userId);

    if (!existing || existing.date !== today) {
        const freshUsage = {
            date: today,
            chat: 0,
            photo: 0,
            file: 0
        };

        userUsage.set(userId, freshUsage);

        return freshUsage;
    }

    return existing;
}

// ===============================
// CHAT
// ===============================

app.post("/api/chat", authenticate, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Missing message."
            });
        }

        const userId = req.user.id.toString();

        const usage = getUserUsage(userId);

        if (usage.chat >= CHAT_LIMIT) {
            return res.status(429).json({
                success: false,
                limitReached: true,
                message:
                    "Zenvyra AI has reached your daily chat limit of 50 messages. Please try again tomorrow."
            });
        }

        usage.chat++;

        const zenvyraMessage = `
You are Zenvyra AI.

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
${message}
`;

        let response;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: MODEL,
                    contents: zenvyraMessage
                });

                break;

            } catch (retryErr) {
                console.error(
                    `Gemini attempt ${attempt} failed:`,
                    retryErr.message
                );

                if (attempt === 3) {
                    throw retryErr;
                }

                await new Promise(resolve =>
                    setTimeout(resolve, 1000)
                );
            }
        }

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
                message:
                    "You have reached the AI message limit. Please try again later."
            });
        }

        res.status(500).json({
            success: false,
            message: "AI request failed."
        });
    }
});

// ===============================
// CHAT JSON
// ===============================

app.post("/api/chat-json", authenticate, async (req, res) => {
    try {
        const { system, message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Missing message."
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
        console.error(
            "Gemini /api/chat-json error:",
            err
        );

        res.status(500).json({
            success: false,
            message: "AI request failed."
        });
    }
});

// ===============================
// VISION
// ===============================

app.post("/api/vision", authenticate, async (req, res) => {
    try {
        const {
            base64Data,
            mediaType,
            prompt
        } = req.body;

        if (!base64Data) {
            return res.status(400).json({
                success: false,
                message: "Missing image data."
            });
        }

        const userId = req.user.id.toString();

        const usage = getUserUsage(userId);

        if (usage.photo >= PHOTO_LIMIT) {
            return res.status(429).json({
                success: false,
                limitReached: true,
                message:
                    "Zenvyra Photo Solver limit reached: 4 photos per day."
            });
        }

        usage.photo++;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                prompt ||
                                "Describe this image."
                        },
                        {
                            inlineData: {
                                mimeType:
                                    mediaType ||
                                    "image/jpeg",
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
        console.error(
            "Gemini /api/vision error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                err.message ||
                "AI request failed."
        });
    }
});

// ===============================
// FILE
// ===============================

app.post("/api/file", authenticate, async (req, res) => {
    try {
        const {
            base64Data,
            mediaType,
            prompt
        } = req.body;

        if (!base64Data) {
            return res.status(400).json({
                success: false,
                message: "Missing file data."
            });
        }

        const userId = req.user.id.toString();

        const usage = getUserUsage(userId);

        if (usage.file >= FILE_LIMIT) {
            return res.status(429).json({
                success: false,
                limitReached: true,
                message:
                    "Zenvyra File Solver limit reached: 2 files per day."
            });
        }

        usage.file++;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                prompt ||
                                "Read this file and explain its contents clearly."
                        },
                        {
                            inlineData: {
                                mimeType:
                                    mediaType ||
                                    "application/pdf",
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
        console.error(
            "Gemini /api/file error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                err.message ||
                "File analysis failed."
        });
    }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `✅ Zenvyra AI backend running on port ${PORT}`
    );
});