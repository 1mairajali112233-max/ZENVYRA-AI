/* ===============================
   🤖 AI PLACEHOLDER LAYER — NO AI API CONNECTED YET
   -------------------------------------------------
   Every AI-dependent feature in Zenvyra calls one of the three
   functions below (askZenvyraAI / askZenvyraAIJson / askZenvyraAIVision).
   Right now they only return clearly-labeled demo/placeholder content
   so the rest of the app can be built and tested.

   🔌 TO CONNECT THE REAL AI API LATER: replace the body of these
   three functions with real calls (e.g. to /v1/messages) and keep
   the same function names + return shape. Nothing else in the app
   needs to change.
   =============================== */

// Small delay helper — also used to simulate "thinking" time for demo responses.
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function askZenvyraAI(system, userMessage) {
    try {
        const res = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `${system}\n\nUser: ${userMessage}`
            })
        });

        const data = await res.json();

        if (!data.success) {
    if (data.limitReached) {
        return "🚫 You have reached your Zenvyra AI message limit. Please try again later.";
    }

    throw new Error(data.message || "AI request failed.");
}

        return data.reply;

    } catch (error) {
        console.error("Zenvyra AI Error:", error);
        return "⚠️ Sorry, I couldn't connect to Zenvyra AI right now.";
    }
}

// Calls the backend for a JSON-shaped AI response (e.g. quiz generation).
// `demoBuilder`, if provided, is only used as a fallback if the real call fails,
// so the UI still has something to show instead of breaking.
async function askZenvyraAIJson(system, userMessage, demoBuilder) {
    try {
        const res = await fetch("http://localhost:3000/api/chat-json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ system, message: userMessage })
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "AI request failed.");
        }

        return data.data;

    } catch (error) {
        console.error("Zenvyra AI JSON Error:", error);
        return typeof demoBuilder === "function" ? demoBuilder() : null;
    }
}

// Turns **bold**, ## headings and - bullet lines into simple HTML matching this app's styling.
function renderLiteMarkdown(text) {
    if (!text) return "";
    const lines = text.split("\n");
    let html = "";
    let inList = false;

    const closeList = () => {
        if (inList) {
            html += "</ul>";
            inList = false;
        }
    };

    const inline = (str) =>
        str.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (/^#{1,4}\s/.test(trimmed)) {
            closeList();
            html += `<h5>${inline(trimmed.replace(/^#+\s*/, ""))}</h5>`;
        } else if (/^[-*]\s/.test(trimmed)) {
            if (!inList) {
                html += "<ul>";
                inList = true;
            }
            html += `<li>${inline(trimmed.replace(/^[-*]\s/, ""))}</li>`;
        } else if (trimmed === "") {
            closeList();
        } else {
            closeList();
            html += `<p>${inline(trimmed)}</p>`;
        }
    });
    closeList();
    return html;
}

function loadingHTML(label) {
    return `<p>✨ ${label || "Thinking"}…</p>`;
}

// Calls the backend for a vision (image) AI response.
async function askZenvyraAIVision(base64Data, mediaType, prompt) {
    try {
        const res = await fetch("http://localhost:3000/api/vision", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ base64Data, mediaType, prompt })
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || "AI request failed.");
        }

        return data.reply;

    } catch (error) {
        console.error("Zenvyra AI Vision Error:", error);
        return "⚠️ Sorry, I couldn't read that photo right now.";
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ===============================
   👤 LOGIN / ACCOUNT (prototype storage — see note below)
   -------------------------------------------------
   This is a FRONTEND PROTOTYPE only. The user's profile fields
   (name/email/phone/school/role) are saved to localStorage so the
   base app is usable and survives a refresh. The password field is
   intentionally NEVER saved anywhere (not even in localStorage) —
   it exists only as a UI placeholder for a future real backend with
   proper hashed authentication. Do not wire the password field to
   any storage when connecting a real auth system later.
   =============================== */

const USER_PROFILE_KEY = "zenvyra_user_profile";
const LOGGED_IN_KEY = "zenvyra_logged_in";
const WELCOME_SEEN_KEY = "zenvyra_welcome_seen";

function getUserProfile() {
    try {
        const raw = localStorage.getItem(USER_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error("Could not read user profile:", e);
        return null;
    }
}

function saveUserProfile(profile) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

function selectRole(role) {
    selectedRole = role;

    const roleText = document.getElementById("selected-role");

    if (roleText) {
        roleText.textContent = "Selected: " + role + " ✅";
    }

    document.querySelectorAll(".role-buttons button").forEach((btn) => {
        btn.classList.toggle("active", btn.textContent.includes(role));
    });
}

function roleLabel(role) {
    return role === "Student"
        ? "🎓 Student Mode"
        : role === "Teacher"
        ? "👨‍🏫 Teacher Mode"
        : "🌍 General Mode";
}

function openWelcome() {
    const nameInput = document.getElementById("loginName");
    const emailInput = document.getElementById("loginEmail");
    const phoneInput = document.getElementById("loginPhone");
    const schoolInput = document.getElementById("loginSchool");

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";

    if (!name) {
        alert("Please enter your name first!");
        return;
    }

    if (!email) {
        alert("Please enter your email address!");
        return;
    }

    if (!selectedRole) {
        alert("Please select who you are (Student / Teacher / General)!");
        return;
    }

    const profile = {
        name: name,
        email: email,
        phone: phoneInput ? phoneInput.value.trim() : "",
        school: schoolInput ? schoolInput.value.trim() : "",
        role: selectedRole
    };

    saveUserProfile(profile);
    localStorage.setItem(LOGGED_IN_KEY, "true");
    localStorage.setItem(WELCOME_SEEN_KEY, "false");

    showWelcomeScreen(profile);
}

function showWelcomeScreen(profile) {
    const welcomeName = document.getElementById("welcome-name");
    const welcomeRole = document.getElementById("welcome-role");

    if (welcomeName) welcomeName.textContent = "Hello, " + profile.name + "! 👋";
    if (welcomeRole) welcomeRole.textContent = roleLabel(profile.role);

    document.querySelector(".login-section").style.display = "none";
    document.querySelector(".app").style.display = "none";
    document.getElementById("welcome-screen").style.display = "flex";
}

function openDashboard() {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    showDashboard();
}

function showDashboard() {
    document.getElementById("welcome-screen").style.display = "none";
    document.querySelector(".login-section").style.display = "none";
    document.querySelector(".app").style.display = "flex";

    const profile = getUserProfile();
    const greeting = document.getElementById("topbarGreeting");

    if (profile) {
        selectedRole = profile.role || "General";
        if (greeting) {
            greeting.textContent = "Welcome back, " + profile.name + "! 👋";
        }
    }

    // A teacher lands straight in the Teacher Workspace; everyone else starts on Student Tools.
    if (selectedRole === "Teacher") {
        showTeacherTools();
    } else {
        showStudentTools();
    }
}

// Restores the correct screen (login / welcome / dashboard) on page load or refresh,
// based on what was actually saved — never guessed from stale DOM state.
function restoreSessionOnLoad() {
    const loggedIn = localStorage.getItem(LOGGED_IN_KEY) === "true";
    const welcomeSeen = localStorage.getItem(WELCOME_SEEN_KEY) === "true";
    const profile = getUserProfile();

    const app = document.querySelector(".app");
    const login = document.querySelector(".login-section");
    const welcome = document.getElementById("welcome-screen");

    if (app) app.style.display = "none";
    if (welcome) welcome.style.display = "none";
    if (login) login.style.display = "none";

    if (loggedIn && profile && welcomeSeen) {
        showDashboard();
    } else if (loggedIn && profile) {
        showWelcomeScreen(profile);
    } else {
        if (login) login.style.display = "flex";
    }
}

async function sendAIQuestion() {
    const input = document.getElementById("ai-question");
    const response = document.getElementById("ai-response");

    if (!input || !response) {
        console.error("AI elements not found.");
        return;
    }

    const question = input.value.trim();

    if (question === "") {
        response.textContent = "Please type a question first! 😊";
        response.classList.add("show");
        return;
    }

    input.value = "";
    response.innerHTML = "<strong>👤 You:</strong> " + question + "<br><br><strong>✨ Zenvyra:</strong> ✨ Thinking…";
    response.classList.add("show");

    const answer = await askZenvyraAI(
        "You are Zenvyra AI, a friendly and encouraging study assistant. Keep answers clear, helpful, and appropriately concise.",
        question
    );

    if (!activeSession) {
        startSessionInMemory();
    }

    activeSession.messages.push({ question, answer });

    if (activeSession.messages.length === 1) {
        activeSession.title = makeTitleFromQuestion(question);
    }

    renderMessagesInMain(activeSession.messages);
    saveActiveSession();
    renderLeftSidebarHistory();
}

/* ---------- Session-based Chat History (left sidebar, localStorage) ---------- */

const CHAT_SESSIONS_KEY = "zenvyra_chat_sessions";
let activeSession = null;

function getSessions() {
    try {
        const raw = localStorage.getItem(CHAT_SESSIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Could not read chat sessions:", e);
        return [];
    }
}

function saveSessions(sessions) {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
}

function makeTitleFromQuestion(question) {
    const words = question.split(/\s+/).slice(0, 5).join(" ");
    return words.length < question.length ? words + "..." : words;
}

function startSessionInMemory() {
    activeSession = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: []
    };
}

function saveActiveSession() {
    if (!activeSession) return;

    const sessions = getSessions();
    const idx = sessions.findIndex((s) => s.id === activeSession.id);

    if (idx === -1) {
        sessions.unshift(activeSession);
    } else {
        sessions[idx] = activeSession;
    }

    saveSessions(sessions);
}

function renderMessagesInMain(messages) {
    const response = document.getElementById("ai-response");
    const history = document.getElementById("chat-history");

    if (history) history.innerHTML = "";

    if (!messages.length) {
        if (response) {
            response.innerHTML = "";
            response.classList.remove("show");
        }
        return;
    }

    const last = messages[messages.length - 1];
    if (response) {
        response.innerHTML =
            "<strong>👤 You:</strong> " + last.question +
            "<br><br>" +
            "<strong>✨ Zenvyra:</strong>" +
            renderLiteMarkdown(last.answer);
        response.classList.add("show");
    }

    if (history) {
        messages.slice(0, -1).reverse().forEach((m) => {
            const item = document.createElement("div");
            item.className = "history-item";
            item.innerHTML =
                "<strong>💬 " + m.question + "</strong>" +
                renderLiteMarkdown(m.answer);
            history.appendChild(item);
        });
    }
}

function renderLeftSidebarHistory() {
    const list = document.getElementById("leftSidebarHistory");
    const titleLabel = document.getElementById("sidebarHistoryTitle");
    if (!list) return;

    const sessions = getSessions();
    list.innerHTML = "";

    if (titleLabel) {
        titleLabel.style.display = sessions.length ? "block" : "none";
    }

    sessions.forEach((session) => {
        const item = document.createElement("button");
        item.className = "sidebar-history-item";
        if (activeSession && session.id === activeSession.id) {
            item.classList.add("active");
        }
        item.textContent = "🕘 " + (session.title || "New Chat");
        item.title = session.title || "New Chat";

        item.addEventListener("click", () => {
            activeSession = session;
            renderMessagesInMain(session.messages);
            renderLeftSidebarHistory();
        });

        list.appendChild(item);
    });
}

function startNewChat() {
    activeSession = null;

    const response = document.getElementById("ai-response");
    const history = document.getElementById("chat-history");
    const input = document.getElementById("ai-question");

    if (response) {
        response.innerHTML = "";
        response.classList.remove("show");
    }

    if (history) history.innerHTML = "";

    if (input) {
        input.value = "";
        input.focus();
    }

    renderLeftSidebarHistory();
}

const newChatBtn = document.getElementById("newChatBtn");
if (newChatBtn) {
    newChatBtn.addEventListener("click", startNewChat);
}

renderLeftSidebarHistory();

/* ---------- Mobile sidebar (hamburger menu) ---------- */

const sidebarEl = document.getElementById("sidebar");
const sidebarOverlayEl = document.getElementById("sidebarOverlay");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

function openMobileSidebar() {
    if (sidebarEl) sidebarEl.classList.add("open");
    if (sidebarOverlayEl) sidebarOverlayEl.classList.add("show");
}

function closeMobileSidebar() {
    if (sidebarEl) sidebarEl.classList.remove("open");
    if (sidebarOverlayEl) sidebarOverlayEl.classList.remove("show");
}

if (hamburgerBtn) hamburgerBtn.addEventListener("click", openMobileSidebar);
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
if (sidebarOverlayEl) sidebarOverlayEl.addEventListener("click", closeMobileSidebar);

// On mobile, tapping any sidebar button should also close the slide-in menu
// so the person can immediately see the tool they picked.
if (sidebarEl) {
    sidebarEl.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON" && window.innerWidth <= 800) {
            closeMobileSidebar();
        }
    });
}

/* ---------- Left Sidebar "History" tool button ---------- */

const historyToolBtn = document.getElementById("historyToolBtn");
if (historyToolBtn) {
    historyToolBtn.addEventListener("click", () => {
        const list = document.getElementById("leftSidebarHistory");
        renderLeftSidebarHistory();

        if (list) {
            list.scrollIntoView({ behavior: "smooth", block: "center" });
            list.classList.add("highlight-panel");
            setTimeout(() => {
                list.classList.remove("highlight-panel");
            }, 1200);
        }
    });
}

/* ---------- Voice Recognition (ek hi shared helper, crash-safe) ---------- */

// One shared, crash-safe voice helper. Reports status/errors inline via #voiceStatus
// when it exists, falling back to alert() only if that element isn't on the page.
// Does NOT call any AI API — it only produces text for the caller to use.
function startVoiceRecognition(onResult) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const statusEl = document.getElementById("voiceStatus");

    const reportError = (msg) => {
        if (statusEl) statusEl.textContent = msg;
        else alert(msg);
    };

    if (!SpeechRecognition) {
        reportError("❌ Voice recognition is not supported in this browser.");
        return;
    }

    let recognition;
    try {
        recognition = new SpeechRecognition();
    } catch (e) {
        reportError("❌ Could not start voice recognition.");
        return;
    }

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        if (statusEl) statusEl.textContent = "🎤 Listening…";
    };

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (statusEl) statusEl.textContent = "";
        onResult(text);
    };

    recognition.onerror = (event) => {
        reportError("❌ Microphone error: " + event.error);
    };

    recognition.onend = () => {
        if (statusEl && statusEl.textContent === "🎤 Listening…") statusEl.textContent = "";
    };

    try {
        recognition.start();
    } catch (e) {
        reportError("❌ Microphone permission is unavailable.");
    }
}

// Fills the recognized speech straight into the AI chat input — used by both the
// sidebar mic and the chat mic so there's one behavior, not two.
function useVoiceForChatInput() {
    startVoiceRecognition((text) => {
        const aiInput = document.getElementById("ai-question");
        if (aiInput) aiInput.value = text;
    });
}

const voiceBtn = document.getElementById("voiceBtn");
if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
        const chat = document.querySelector(".ai-chat");
        if (chat) chat.scrollIntoView({ behavior: "smooth", block: "center" });
        useVoiceForChatInput();
    });
}

const searchVoiceBtn = document.getElementById("searchVoiceBtn");
if (searchVoiceBtn) {
    searchVoiceBtn.addEventListener("click", useVoiceForChatInput);
}

/* ---------- Photo Solver ---------- */

const photoInput = document.getElementById("photoInput");

if (photoInput) {
    photoInput.addEventListener("change", () => {
        const file = photoInput.files[0];

        if (!file) return;

        const imageURL = URL.createObjectURL(file);

        let preview = document.getElementById("photoPreview");

        if (!preview) {
            preview = document.createElement("img");
            preview.id = "photoPreview";
            preview.style.maxWidth = "100%";
            preview.style.marginTop = "15px";
            preview.style.borderRadius = "15px";

            photoInput.parentElement.appendChild(preview);
        }

        preview.src = imageURL;
    });
}

const solvePhotoBtn = document.getElementById("solvePhotoBtn");

if (solvePhotoBtn) {
    solvePhotoBtn.addEventListener("click", async () => {
        const solution = document.getElementById("photoSolution");

        if (!photoInput || !photoInput.files.length) {
            solution.innerHTML = "📸 Please select a question photo first!";
            solution.classList.add("show");
            return;
        }

        const file = photoInput.files[0];
        solution.innerHTML = "🔍 Reading your photo…";
        solution.classList.add("show");

        try {
            const base64 = await fileToBase64(file);
            const answer = await askZenvyraAIVision(base64, file.type || "image/jpeg", "Solve the question in this photo, step by step.");
            solution.innerHTML = `<strong>🔍 Zenvyra Photo Solver</strong>${renderLiteMarkdown(answer)}`;
        } catch (e) {
            solution.innerHTML = "⚠️ Couldn't read that photo. Please try again.";
        }
    });
}

const sidebarPhotoSolverBtn = document.getElementById("sidebarPhotoSolverBtn");

if (sidebarPhotoSolverBtn) {
    sidebarPhotoSolverBtn.addEventListener("click", () => {
        if (photoInput) {
            photoInput.click();
        }
    });
}
// ===============================
// 📚 LESSON EXPLAINER
// ===============================

const explainLessonBtn = document.getElementById("explainLessonBtn");
const lessonTopic = document.getElementById("lessonTopic");
const lessonLevel = document.getElementById("lessonLevel");
const lessonClass = document.getElementById("lessonClass");
const lessonResult = document.getElementById("lessonResult");

if (explainLessonBtn) {
    explainLessonBtn.addEventListener("click", async function () {

        const subject = document.getElementById("lessonSubject").value;
        const topic = lessonTopic.value.trim();
        const level = lessonLevel.value || "Normal";
        const className = lessonClass.value;

        if (topic === "") {
            lessonResult.innerHTML = `
                <p>⚠️ Please enter a lesson topic first.</p>
            `;
            return;
        }

        if (className === "") {
            lessonResult.innerHTML = `
                <p>⚠️ Please select a class first.</p>
            `;
            return;
        }

        lessonResult.innerHTML = loadingHTML("Explaining");

        const prompt = `Explain a lesson topic for a student.
Subject: ${subject || "not specified"}
Topic: ${topic}
Class/Grade: ${className}
Explanation level: ${level}

Format with headings: Easy Explanation, Key Points (bullets), Example, Quick Check (one question), Homework (short task).`;

        const answer = await askZenvyraAI(
            "You are Zenvyra AI, an expert, patient teacher explaining lessons to students at their exact class level. Use simple language, short headings, and bullet points.",
            prompt
        );

        lessonResult.innerHTML = `<div class="lesson-answer">
            <h3>📚 ${topic}</h3>
            <p><strong>🏫 Class:</strong> ${className} &nbsp; <strong>🎓 Level:</strong> ${level}</p>
            ${renderLiteMarkdown(answer)}
        </div>`;
    });
}
// ===============================
// 🧠 QUIZ GENERATOR
// ===============================

const generateQuizBtn = document.getElementById("generateQuizBtn");

if (generateQuizBtn) {
    generateQuizBtn.addEventListener("click", () => {
        const topic = document.getElementById("quizTopic").value.trim();
        const count = parseInt(document.getElementById("quizCount").value, 10);
        const difficulty = document.getElementById("quizDifficulty").value;
        const result = document.getElementById("quizResult");

        if (topic === "") {
            result.innerHTML = "<p>⚠️ Please enter a topic first.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Building your quiz");

            const prompt = `Create a ${count}-question multiple choice quiz on "${topic}" at ${difficulty} difficulty.
Return JSON in exactly this shape:
{"questions":[{"question":"...", "options":{"a":"...","b":"...","c":"...","d":"..."}, "correct":"a"}]}`;

            // 🔧 Demo placeholder builder — replace askZenvyraAIJson's real implementation
            // later and this demoBuilder argument can simply be dropped.
            const buildDemoQuiz = () => {
                const questions = [];
                for (let i = 0; i < count; i++) {
                    questions.push({
                        question: `Demo placeholder question ${i + 1} on "${topic}" (${difficulty}) — real AI-generated questions will appear here once the AI API is connected.`,
                        options: { a: "Demo option A", b: "Demo option B", c: "Demo option C", d: "Demo option D" },
                        correct: "a"
                    });
                }
                return { questions };
            };

            const data = await askZenvyraAIJson(
                "You are a quiz-writing assistant for a study app. Write clear, accurate multiple-choice questions.",
                prompt,
                buildDemoQuiz
            );

            if (!data || !Array.isArray(data.questions) || !data.questions.length) {
                result.innerHTML = "<p>⚠️ Couldn't generate the quiz. Please try again.</p>";
                return;
            }

            let html = `<div class="quiz-answer">
                <h4>🧠 ${topic} Quiz (${difficulty})</h4>
                <p class="demo-tag">🔧 Demo placeholder quiz — connect the AI API for real questions.</p>
                <form id="quizForm">`;

            data.questions.forEach((q, i) => {
                html += `
                    <div class="quiz-question" data-correct="${q.correct}">
                        <p><strong>Q${i + 1}.</strong> ${q.question}</p>
                        ${Object.entries(q.options).map(([key, val]) => `
                            <label><input type="radio" name="q${i}" value="${key}"> ${key.toUpperCase()}) ${val}</label>
                        `).join("")}
                    </div>`;
            });

            html += `
                    <button type="button" id="checkQuizBtn">✅ Check Answers</button>
                    <p id="quizScore"></p>
                </form>
            </div>`;

            result.innerHTML = html;

            const checkBtn = document.getElementById("checkQuizBtn");
            if (checkBtn) {
                checkBtn.addEventListener("click", () => {
                    const scoreEl = document.getElementById("quizScore");
                    const questionEls = document.querySelectorAll("#quizForm .quiz-question");
                    let correctCount = 0;

                    questionEls.forEach((qEl, i) => {
                        const correct = qEl.getAttribute("data-correct");
                        const chosen = document.querySelector(`input[name="q${i}"]:checked`);
                        qEl.querySelectorAll("label").forEach((label) => label.style.color = "");
                        if (chosen && chosen.value === correct) {
                            correctCount++;
                        }
                        const correctLabel = qEl.querySelector(`input[value="${correct}"]`)?.closest("label");
                        if (correctLabel) correctLabel.style.color = "#1a9c6e";
                        if (chosen && chosen.value !== correct) {
                            chosen.closest("label").style.color = "#d1435b";
                        }
                    });

                    scoreEl.innerHTML = `📊 You scored <strong>${correctCount} / ${data.questions.length}</strong>. Correct answers are highlighted in green.`;
                });
            }
        })();
    });
}

// ===============================
// 📝 NOTES MAKER
// ===============================

const generateNotesBtn = document.getElementById("generateNotesBtn");

if (generateNotesBtn) {
    generateNotesBtn.addEventListener("click", () => {
        const topic = document.getElementById("notesTopic").value.trim();
        const format = document.getElementById("notesFormat").value;
        const result = document.getElementById("notesResult");

        if (topic === "") {
            result.innerHTML = "<p>⚠️ Please enter a topic first.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Writing your notes");

            const prompt = `Make study notes on "${topic}" in ${format} format. Include a key definition, main points, and a one-line quick recap for revision.`;

            const answer = await askZenvyraAI(
                "You are a study-notes assistant. Write clear, exam-ready notes with short headings.",
                prompt
            );

            result.innerHTML = `
                <div class="notes-answer">
                    <h4>📝 Notes: ${topic}</h4>
                    <p><strong>Format:</strong> ${format}</p>
                    ${renderLiteMarkdown(answer)}
                </div>
            `;
        })();
    });
}

// ===============================
// ❌ MISTAKE ANALYZER
// ===============================

const analyzeMistakeBtn = document.getElementById("analyzeMistakeBtn");

if (analyzeMistakeBtn) {
    analyzeMistakeBtn.addEventListener("click", () => {
        const subject = document.getElementById("mistakeSubject").value;
        const yourAnswer = document.getElementById("mistakeAnswer").value.trim();
        const correct = document.getElementById("mistakeCorrect").value.trim();
        const result = document.getElementById("mistakeResult");

        if (subject === "" || yourAnswer === "" || correct === "") {
            result.innerHTML = "<p>⚠️ Please fill subject, your answer, and the correct answer.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Analyzing your mistake");

            const prompt = `Subject: ${subject}
Student's answer: ${yourAnswer}
Correct answer/topic: ${correct}

Explain what likely went wrong in the student's answer, then give 3 short, concrete tips to improve.`;

            const answer = await askZenvyraAI(
                "You are a supportive tutor helping a student understand a mistake they made. Be specific and encouraging, not just generic.",
                prompt
            );

            result.innerHTML = `
                <div class="mistake-answer">
                    <h4>🔍 Mistake Analysis — ${subject}</h4>

                    <h5>👤 Your Answer</h5>
                    <p>${yourAnswer}</p>

                    <h5>✅ Correct Answer</h5>
                    <p>${correct}</p>

                    ${renderLiteMarkdown(answer)}
                </div>
            `;
        })();
    });
}

// ===============================
// 📅 STUDY PLANNER
// ===============================

const generatePlanBtn = document.getElementById("generatePlanBtn");

if (generatePlanBtn) {
    generatePlanBtn.addEventListener("click", () => {
        const subjectsRaw = document.getElementById("plannerSubjects").value.trim();
        const days = parseInt(document.getElementById("plannerDays").value, 10);
        const hours = parseInt(document.getElementById("plannerHours").value, 10);
        const result = document.getElementById("plannerResult");

        const subjects = subjectsRaw
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");

        if (subjects.length === 0 || !days || !hours) {
            result.innerHTML = "<p>⚠️ Please enter subjects, days, and hours per day.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Building your plan");

            const prompt = `Build a ${days}-day study plan, ${hours} hour(s) per day, covering these subjects: ${subjects.join(", ")}.
For each day give a short line: which subject/topic to focus on and what to actually do in that time.`;

            const answer = await askZenvyraAI(
                "You are a study-planning assistant. Distribute subjects sensibly across the days and keep each day's line short and actionable.",
                prompt
            );

            result.innerHTML = `<div class="planner-answer">
                <h4>📅 ${days}-Day Study Plan (${hours} hrs/day)</h4>
                ${renderLiteMarkdown(answer)}
            </div>`;
        })();
    });
}

// ===============================
// 🌐 TRANSLATE & SIMPLIFY
// ===============================

const translateBtn = document.getElementById("translateBtn");

if (translateBtn) {
    translateBtn.addEventListener("click", () => {
        const text = document.getElementById("translateText").value.trim();
        const lang = document.getElementById("translateLang").value;
        const mode = document.getElementById("translateMode").value;
        const result = document.getElementById("translateResult");

        if (text === "") {
            result.innerHTML = "<p>⚠️ Please paste some text first.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Converting");

            const prompt = mode === "Translate"
                ? `Translate this text into ${lang}:\n\n${text}`
                : `Rewrite this text in simpler, easier ${lang} that's still accurate:\n\n${text}`;

            const answer = await askZenvyraAI(
                "You are a translation and simplification assistant for students. Keep meaning accurate.",
                prompt
            );

            result.innerHTML = `
                <div class="translate-answer">
                    <h4>🌐 ${mode} → ${lang}</h4>

                    <h5>📄 Original Text</h5>
                    <p>${text}</p>

                    <h5>✨ ${mode}d Result</h5>
                    <p>${answer}</p>
                </div>
            `;
        })();
    });
}

// ===============================
// 🗂️ TEACHER: LESSON PLAN GENERATOR
// ===============================

const generateLessonPlanBtn = document.getElementById("generateLessonPlanBtn");

if (generateLessonPlanBtn) {
    generateLessonPlanBtn.addEventListener("click", () => {
        const subject = document.getElementById("lpSubject").value.trim();
        const topic = document.getElementById("lpTopic").value.trim();
        const className = document.getElementById("lpClass").value;
        const duration = document.getElementById("lpDuration").value;
        const result = document.getElementById("lessonPlanResult");

        if (subject === "" || topic === "" || className === "" || !duration) {
            result.innerHTML = "<p>⚠️ Please fill all fields.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Building the lesson plan");

            const prompt = `Create a classroom lesson plan.
Subject: ${subject}
Topic: ${topic}
Class/Grade: ${className}
Duration: ${duration} minutes

Format with headings: Objective, Lesson Steps (bullets with rough timing), and Homework.`;

            const answer = await askZenvyraAI(
                "You are an expert curriculum designer helping a teacher build a practical, ready-to-teach lesson plan. Keep it concise and classroom-ready.",
                prompt
            );

            result.innerHTML = `
                <div class="lessonplan-answer">
                    <h4>🗂️ ${subject}: ${topic} (${className})</h4>
                    <p><strong>⏱ Duration:</strong> ${duration} minutes</p>
                    ${renderLiteMarkdown(answer)}
                </div>
            `;
        })();
    });
}

// ===============================
// 💬 TEACHER: REPORT CARD COMMENTS
// ===============================

const generateCommentBtn = document.getElementById("generateCommentBtn");

if (generateCommentBtn) {
    generateCommentBtn.addEventListener("click", () => {
        const studentName = document.getElementById("rcStudentName").value.trim();
        const subject = document.getElementById("rcSubject").value.trim();
        const performance = document.getElementById("rcPerformance").value;
        const strengths = document.getElementById("rcStrengths").value.trim();
        const improvements = document.getElementById("rcImprovements").value.trim();
        const result = document.getElementById("reportCommentResult");

        if (subject === "") {
            result.innerHTML = "<p>⚠️ Please enter a subject.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Writing the comment");

            const prompt = `Write a report card comment.
Student: ${studentName || "the student"}
Subject: ${subject}
Overall performance: ${performance}
Strengths: ${strengths || "not specified"}
Areas to improve: ${improvements || "not specified"}

Write 3-4 sentences in a warm, professional teacher's voice, specific and encouraging, ready to print on a report card. No headings, just flowing sentences.`;

            const answer = await askZenvyraAI(
                "You are an experienced, warm teacher writing report card comments. Be specific and professional.",
                prompt
            );

            result.innerHTML = `
                <div class="report-comment-answer">
                    <h4>💬 Report Card Comment</h4>
                    <p>${answer}</p>
                </div>
            `;
        })();
    });
}

// ===============================
// 🆘 STUDENT SOS
// ===============================

const sosHelpBtn = document.getElementById("sosHelpBtn");

if (sosHelpBtn) {
    sosHelpBtn.addEventListener("click", () => {
        const problem = document.getElementById("sosProblem").value.trim();
        const result = document.getElementById("sosResult");

        if (problem === "") {
            result.innerHTML = "<p>⚠️ Please describe what you're stuck on first.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Working out a solution path");

            const answer = await askZenvyraAI(
                "You are Zenvyra AI's Student SOS helper — calm and reassuring. A student is stuck on something. Give them a short, clear solution path: what's likely going wrong and 3 concrete next steps.",
                problem
            );

            result.innerHTML = `<div class="mistake-answer">${renderLiteMarkdown(answer)}</div>`;
        })();
    });
}

// ===============================
// 🐱 SCRATCH TUTOR
// ===============================

const scratchHelpBtn = document.getElementById("scratchHelpBtn");

if (scratchHelpBtn) {
    scratchHelpBtn.addEventListener("click", () => {
        const question = document.getElementById("scratchQuestion").value.trim();
        const result = document.getElementById("scratchResult");

        if (question === "") {
            result.innerHTML = "<p>⚠️ Please type your Scratch question first.</p>";
            return;
        }

        (async () => {
            result.innerHTML = loadingHTML("Thinking it through");

            const answer = await askZenvyraAI(
                "You are a patient Scratch (MIT block-based visual programming) tutor for beginners. Use exact Scratch block names (e.g. 'move 10 steps', 'if/then', 'repeat', 'when green flag clicked'). Keep it simple and encouraging.",
                question
            );

            result.innerHTML = `<div class="mistake-answer">${renderLiteMarkdown(answer)}</div>`;
        })();
    });
}

// ===============================
// 🎓 / 👨‍🏫 STUDENT vs TEACHER TOOLS TOGGLE
// ===============================

const studentToolsBtn = document.getElementById("studentToolsBtn");
const teacherToolsBtn = document.getElementById("teacherToolsBtn");
const studentCardsSection = document.querySelector(".cards:not(.teacher-cards)");
const teacherCardsSection = document.getElementById("teacherCardsSection");

function showStudentTools() {
    if (studentCardsSection) studentCardsSection.style.display = "grid";
    if (teacherCardsSection) teacherCardsSection.style.display = "none";
    if (studentToolsBtn) studentToolsBtn.classList.add("active");
    if (teacherToolsBtn) teacherToolsBtn.classList.remove("active");
}

function showTeacherTools() {
    if (studentCardsSection) studentCardsSection.style.display = "none";
    if (teacherCardsSection) teacherCardsSection.style.display = "grid";
    if (teacherToolsBtn) teacherToolsBtn.classList.add("active");
    if (studentToolsBtn) studentToolsBtn.classList.remove("active");
}

if (studentToolsBtn) {
    studentToolsBtn.addEventListener("click", showStudentTools);
}

if (teacherToolsBtn) {
    teacherToolsBtn.addEventListener("click", showTeacherTools);
}

// ===============================
// ⚙️ SETTINGS (name, accent theme, clear history)
// ===============================

const THEME_KEY = "zenvyra_theme";

function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement.style;
    root.setProperty("--accent", theme.accent);
    root.setProperty("--accent-dark", theme.accentDark);
    root.setProperty("--accent-light", theme.accentLight);
    root.setProperty("--accent-pale", theme.accentPale);

    document.querySelectorAll(".theme-swatch").forEach((sw) => {
        sw.classList.toggle("active", sw.getAttribute("data-accent") === theme.accent);
    });
}

function loadSavedTheme() {
    try {
        const raw = localStorage.getItem(THEME_KEY);
        if (raw) applyTheme(JSON.parse(raw));
        else {
            const first = document.querySelector(".theme-swatch");
            if (first) first.classList.add("active");
        }
    } catch (e) {
        console.error("Could not load theme:", e);
    }
}

// Reflects the saved profile's name into every place it shows up in the UI
// (settings field, topbar greeting, welcome screen) — called on load and after
// Settings saves a name change.
function applyStoredName() {
    const profile = getUserProfile();
    if (!profile || !profile.name) return;

    const settingsName = document.getElementById("settingsName");
    if (settingsName && !settingsName.value) settingsName.value = profile.name;

    const topbarGreeting = document.getElementById("topbarGreeting");
    const app = document.querySelector(".app");
    if (topbarGreeting && app && app.style.display !== "none") {
        topbarGreeting.textContent = "Welcome back, " + profile.name + "! 👋";
    }

    const welcomeName = document.getElementById("welcome-name");
    if (welcomeName) welcomeName.textContent = "Hello, " + profile.name + "! 👋";
}

let selectedThemeChoice = null;

document.querySelectorAll(".theme-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
        selectedThemeChoice = {
            accent: sw.getAttribute("data-accent"),
            accentDark: sw.getAttribute("data-accent-dark"),
            accentLight: sw.getAttribute("data-accent-light"),
            accentPale: sw.getAttribute("data-accent-pale")
        };
        applyTheme(selectedThemeChoice);
    });
});

function openSettingsModal() {
    const modal = document.getElementById("settingsModal");
    if (modal) modal.classList.add("show");
    const savedMsg = document.getElementById("settingsSavedMsg");
    if (savedMsg) savedMsg.style.display = "none";

    const settingsName = document.getElementById("settingsName");
    const profile = getUserProfile();
    if (settingsName && profile && profile.name) settingsName.value = profile.name;
}

const settingsBtn = document.getElementById("settingsBtn");
if (settingsBtn) {
    settingsBtn.addEventListener("click", openSettingsModal);
}

const profileBadge = document.getElementById("profileBadge");
if (profileBadge) {
    profileBadge.addEventListener("click", openSettingsModal);
}

const closeSettingsModalBtn = document.getElementById("closeSettingsModal");
if (closeSettingsModalBtn) {
    closeSettingsModalBtn.addEventListener("click", () => {
        document.getElementById("settingsModal").classList.remove("show");
    });
}

const settingsModalEl = document.getElementById("settingsModal");
if (settingsModalEl) {
    settingsModalEl.addEventListener("click", (e) => {
        if (e.target === settingsModalEl) settingsModalEl.classList.remove("show");
    });
}

const saveSettingsBtn = document.getElementById("saveSettingsBtn");
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("settingsName");
        if (nameInput && nameInput.value.trim()) {
            const profile = getUserProfile() || {};
            profile.name = nameInput.value.trim();
            saveUserProfile(profile);
            applyStoredName();
        }
        if (selectedThemeChoice) {
            localStorage.setItem(THEME_KEY, JSON.stringify(selectedThemeChoice));
        }
        const savedMsg = document.getElementById("settingsSavedMsg");
        if (savedMsg) {
            savedMsg.style.display = "block";
            setTimeout(() => (savedMsg.style.display = "none"), 1800);
        }
    });
}

const clearHistoryBtn = document.getElementById("clearHistoryBtn");
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
        if (!confirm("Clear all saved chats? This can't be undone.")) return;
        localStorage.removeItem(CHAT_SESSIONS_KEY);
        activeSession = null;
        renderLeftSidebarHistory();
        const response = document.getElementById("ai-response");
        const history = document.getElementById("chat-history");
        if (response) {
            response.innerHTML = "";
            response.classList.remove("show");
        }
        if (history) history.innerHTML = "";
    });
}

/* ---------- Log out ---------- */

function logOut() {
    // Close the settings modal
    const modal = document.getElementById("settingsModal");
    if (modal) modal.classList.remove("show");

    // Clear the session — profile, login flag, and welcome flag — so a refresh
    // after logout correctly lands back on the login screen.
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem(WELCOME_SEEN_KEY);

    // Back to the login screen
    document.querySelector(".app").style.display = "none";
    document.getElementById("welcome-screen").style.display = "none";
    document.querySelector(".login-section").style.display = "flex";

    // Reset the login form so the next sign-in starts fresh
    document.querySelectorAll(".login-card input").forEach((input) => (input.value = ""));
    selectedRole = "";
    const roleText = document.getElementById("selected-role");
    if (roleText) roleText.textContent = "Please select your role";
    document.querySelectorAll(".role-buttons button").forEach((btn) => btn.classList.remove("active"));

    // Close any in-progress chat view
    startNewChat();
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        if (confirm("Log out of Zenvyra AI?")) logOut();
    });
}

/* ===============================
   👑 ABOUT ZENVYRA MODAL
   =============================== */

const aboutZenvyraBtn = document.getElementById("aboutZenvyraBtn");
if (aboutZenvyraBtn) {
    aboutZenvyraBtn.addEventListener("click", () => {
        const modal = document.getElementById("aboutModal");
        if (modal) modal.classList.add("show");
    });
}

const closeAboutModalBtn = document.getElementById("closeAboutModal");
if (closeAboutModalBtn) {
    closeAboutModalBtn.addEventListener("click", () => {
        document.getElementById("aboutModal").classList.remove("show");
    });
}

const aboutModalEl = document.getElementById("aboutModal");
if (aboutModalEl) {
    aboutModalEl.addEventListener("click", (e) => {
        if (e.target === aboutModalEl) aboutModalEl.classList.remove("show");
    });
}

/* ===============================
   🧭 SIDEBAR QUICK NAVIGATION
   =============================== */

// Scrolls to a card/section and gives it a brief highlight so the click feels responsive.
function jumpToCard(selector, focusSelector) {
    showStudentTools();
    const target = document.querySelector(selector);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("highlight-panel");
    setTimeout(() => target.classList.remove("highlight-panel"), 1200);

    const focusEl = focusSelector ? target.querySelector(focusSelector) : null;
    if (focusEl) setTimeout(() => focusEl.focus(), 400);
}

const navAskAiBtn = document.getElementById("navAskAiBtn");
if (navAskAiBtn) {
    navAskAiBtn.addEventListener("click", () => {
        const chat = document.querySelector(".ai-chat");
        if (chat) chat.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = document.getElementById("ai-question");
        if (input) setTimeout(() => input.focus(), 400);
    });
}

const navStudyHelpBtn = document.getElementById("navStudyHelpBtn");
if (navStudyHelpBtn) {
    navStudyHelpBtn.addEventListener("click", () => {
        jumpToCard(".lesson-explainer-card", "#lessonTopic");
    });
}

const navQuizBtn = document.getElementById("navQuizBtn");
if (navQuizBtn) {
    navQuizBtn.addEventListener("click", () => {
        jumpToCard(".quiz-card", "#quizTopic");
    });
}

const navScratchBtn = document.getElementById("navScratchBtn");
if (navScratchBtn) {
    navScratchBtn.addEventListener("click", () => {
        jumpToCard(".scratch-card", "#scratchQuestion");
    });
}

const navFilesBtn = document.getElementById("navFilesBtn");
if (navFilesBtn) {
    navFilesBtn.addEventListener("click", () => {
        jumpToCard(".files-card", "#fileToolInput");
    });
}

// Math / Science / Sindhi / Computer — jump to Lesson Explainer with the subject pre-selected.
document.querySelectorAll(".subject-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        jumpToCard(".lesson-explainer-card", "#lessonTopic");
        const subjectSelect = document.getElementById("lessonSubject");
        if (subjectSelect) subjectSelect.value = btn.getAttribute("data-subject");
    });
});

/* ===============================
   📄 FILES TOOL (base — no AI file analysis yet)
   =============================== */

const ALLOWED_FILE_TYPES = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE_MB = 10;

const fileToolInput = document.getElementById("fileToolInput");
const fileToolChip = document.getElementById("fileToolChip");
const fileToolName = document.getElementById("fileToolName");
const fileToolClearBtn = document.getElementById("fileToolClearBtn");
const fileToolResult = document.getElementById("fileToolResult");

function resetFileTool() {
    if (fileToolInput) fileToolInput.value = "";
    if (fileToolChip) fileToolChip.style.display = "none";
    if (fileToolResult) fileToolResult.innerHTML = "";
}

if (fileToolInput) {
    fileToolInput.addEventListener("change", () => {
        const file = fileToolInput.files[0];
        if (!file) return;

        const dotIndex = file.name.lastIndexOf(".");
        const ext = dotIndex !== -1 ? file.name.slice(dotIndex).toLowerCase() : "";

        if (!ALLOWED_FILE_TYPES.includes(ext)) {
            if (fileToolResult) {
                fileToolResult.innerHTML = `<p>⚠️ Unsupported file type "${ext || "unknown"}". Allowed: ${ALLOWED_FILE_TYPES.join(", ")}</p>`;
            }
            resetFileTool();
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            if (fileToolResult) {
                fileToolResult.innerHTML = `<p>⚠️ "${file.name}" is too large. Max size is ${MAX_FILE_SIZE_MB}MB.</p>`;
            }
            resetFileTool();
            return;
        }

        if (fileToolName) fileToolName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        if (fileToolChip) fileToolChip.style.display = "flex";
        if (fileToolResult) {
            fileToolResult.innerHTML = `<p>✅ File ready. 🔧 AI-based file analysis is not connected yet — this only confirms the file was selected and validated correctly.</p>`;
        }
    });
}

if (fileToolClearBtn) {
    fileToolClearBtn.addEventListener("click", resetFileTool);
}

/* ===============================
   🚀 APP INIT — restore login/welcome/dashboard state
   =============================== */

restoreSessionOnLoad();

loadSavedTheme();
applyStoredName();
