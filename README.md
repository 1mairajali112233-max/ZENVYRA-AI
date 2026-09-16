# Zenvyra AI

All-in-one AI study & teaching companion. Ask → Understand → Solve → Create → Practice → Improve.

Created by **Mairaj Ali** — Founder & CEO of Zenvyra AI.

## Status: Phase 1 + 2 (foundation + auth/chat/photo/file wiring)

**Phase 1 — backend foundation:**
- Clean backend structure (`config/`, `middleware/`, `routes/`, `services/`, `utils/`)
- Real Supabase authentication (signup, login, logout, session check)
- Provider-swappable AI service (Gemini / OpenAI / Anthropic behind one interface)
- `/api/chat`, `/api/chat-json`, `/api/vision`, `/api/file` — real, working
- Server-enforced daily usage limits (Supabase-backed, not localStorage)
- Friendly 429/503/500 handling — the server never crashes on an AI failure
- Production-safe CORS, Railway-ready (`process.env.PORT`)

**Phase 2 — frontend wired to that backend, existing UI preserved:**
- `frontend/script.js` now sends the real Supabase session token
  (`Authorization: Bearer <token>`) on every `/api/chat`, `/api/chat-json`,
  `/api/vision`, `/api/file` call, via a new `getAuthHeaders()` helper
- Added a real **Log In** flow (`signInWithPassword`) — previously only
  Sign Up existed, so a returning user with no cached session had no way in
- Fixed `/api/vision` and `/api/file` on the backend to accept the exact
  field names the frontend was already sending (`base64Data`/`mediaType`/
  `prompt`) instead of forcing a frontend rewrite
- `/api/file` now actually extracts text from PDF/DOCX/TXT (or routes images
  to vision) — previously the chat-attachment PDF/TXT path was a dead stub
  that just showed "will be added next"
- Bugs fixed in the existing code (not rewritten, fixed in place):
  - `showLoginScreen()` was called in 3 places but never defined as a
    function — its body existed as orphaned top-level code. Wrapped it
    properly.
  - `logoutBtn` had **two** separate `addEventListener` registrations
    (one called Supabase `signOut()`, the other didn't). Merged into one.
  - All API responses now read the `{ success, data }` envelope consistently
    (some call sites were reading `data.reply` for a shape that's actually
    `data.data.reply`).
- One pre-existing, harmless HTML issue noted (not caused by this pass): the
  original `index.html` has one unclosed `<div>` somewhere (browsers
  auto-recover from this silently) — flagging it, not chasing it down yet.

**Phase 3 — the remaining student/teacher tools, actually built:**
- Added 7 missing student tools with real UI + real AI wiring (not stubs):
  Writing/Grammar Coach, Revision Mode, English Speaking Practice,
  Homework & Exam Reminders, Progress Tracker, Report Card (Text Report),
  Report Card (Picture Report — routes through `/api/vision`)
- Added 9 missing teacher tools the same way: Question Paper Maker,
  Worksheet Maker, AI Answer Checker, Class Performance Analyzer,
  Weak Topic Finder, Student Progress, Homework Creator, Student Report
  Generator, Class Activity Generator
- Every one of these goes through the same `askZenvyraAI`/`askZenvyraAIVision`
  functions already fixed in Phase 2 — so they're auth-token-protected and
  usage-limited automatically, no separate wiring needed
- Added a shared `wireSimpleTool()` helper so all 16 new tools follow the
  exact same input→loading→AI→render pattern as the tools that already
  existed (Notes Maker, Mistake Analyzer, etc.) instead of each reinventing it
- Confirmed already-real (not stubs) before building anything new: Voice
  Question (genuine Web Speech API), Student SOS, Photo Solver, Files,
  Scratch Tutor, and the Computer/Sindhi subject buttons
- Student/Teacher mode toggle works at the section level, so all new cards
  show/hide correctly with zero extra wiring

**Known, not fixed yet (flagged, not hidden):**
- 4 pre-existing dead ID references in the original `script.js`
  (`checkQuizBtn`, `quizScore`, `retryFileAnalysisBtn`,
  `startFileAnalysisBtn`) — present before any of my changes, not yet
  tracked down
- The one pre-existing unclosed `<div>` from Phase 2's note, still there

**Still not done:** PDF/DOCX/PPTX *generation* (downloadable files — right
now every tool's output is on-screen text you can copy, not an exported
file), Settings/About/Profile *backend* wiring (the profile table exists in
Supabase but Settings/About are still frontend-only), and a full
responsive/accessibility pass.

**Important — I cannot run this against live services from here.** This
environment has no network access and no real Supabase project or AI keys,
so everything above is verified by reading the code carefully and syntax-
checking every file (`node --check` passes on all of it) — not by actually
calling Supabase or Gemini/OpenAI/Anthropic. Please run the testing
checklist below yourself once your real env vars are in place, and tell me
what breaks.

## 1. Local setup

```bash
npm install
cp backend/.env.example .env
```

Open `.env` and fill in real values (see table below). Then:

```bash
npm start
```

You should see:
```
Zenvyra backend running on port 8080 (development)
```

Test it's alive:
```bash
curl http://localhost:8080/api/health
```

## 2. Environment variables

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase project → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (⚠️ server-only, never in frontend) |
| `JWT_SECRET` | Any long random string, e.g. `openssl rand -base64 48` |
| `AI_PROVIDER` | `gemini`, `openai`, or `anthropic` |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Only the one matching `AI_PROVIDER` is required |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed to call this API |
| `LIMIT_MESSAGES_PER_DAY` / `LIMIT_FILES_PER_DAY` / `LIMIT_PHOTOS_PER_DAY` | Defaults: 40 / 2 / 3 |

## 3. Supabase setup (manual, one-time)

1. Create a project at supabase.com if you haven't.
2. Go to **SQL Editor** → paste the contents of `backend/sql/001_foundation.sql` → Run.
   This creates the `profiles` and `usage_daily` tables, RLS policies, and the
   `increment_usage()` function the backend relies on.
3. Go to **Settings → API** → copy the URL, anon key, and service role key into `.env`.
4. (Optional) In **Authentication → Providers**, confirm email/password is enabled.
   If you want email confirmation off during testing, toggle it in
   **Authentication → Settings**.

## 4. Railway deployment

1. Push this repo to GitHub (see below).
2. In Railway: New Project → Deploy from GitHub → select the repo.
3. Railway → Variables → add every variable from the table above (same names).
   Do **not** set `PORT` — Railway sets it automatically.
4. Railway will run `npm start` automatically (from `package.json`).
5. Once deployed, copy the Railway URL and add it to `ALLOWED_ORIGINS`, and
   update the frontend's API base URL to point at it.

## 5. GitHub

```bash
git init
git add .
git commit -m "Zenvyra AI — foundation layer"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`.env` is excluded by `.gitignore` — double check `git status` shows it's
NOT staged before your first push.

## 6. Testing checklist

**Backend (curl or Postman):**
- [ ] `npm start` runs without missing-env-var errors once `.env` is filled in
- [ ] `GET /api/health` returns `{ success: true }`
- [ ] `POST /api/auth/signup` creates a user + a `profiles` row
- [ ] `POST /api/auth/login` returns a session token
- [ ] `GET /api/auth/me` (with `Authorization: Bearer <token>`) returns the profile
- [ ] `POST /api/chat` returns a reply, and a `usage_daily` row appears/increments in Supabase
- [ ] Hitting `/api/chat` 41 times in a day returns the friendly limit message, not a crash
- [ ] `POST /api/vision` with `{base64Data, mediaType: "image/png", prompt}` returns a reply
- [ ] `POST /api/file` with a base64 `.pdf`/`.docx`/`.txt` returns a reply; an unsupported type is rejected cleanly
- [ ] Server stays up after a deliberately broken AI key (wrong `GEMINI_API_KEY`) — should return the friendly 502/503 message, not crash

**Frontend (serve `frontend/` with e.g. `npx serve frontend` and open in browser):**
- [ ] Signing up creates an account and lands on the welcome screen
- [ ] Refreshing the page keeps you logged in (session restore)
- [ ] Logging out, then clicking "Already have an account? Log in", then logging back in works
- [ ] Ask AI returns a real response (not the 🔒 login message) while logged in
- [ ] Photo Solver: upload an image, get a real answer
- [ ] File tool: upload a PDF, get a real answer
- [ ] Chat attachment: attach a PDF directly in chat — should analyze it, not alert "will be added next"
- [ ] Open browser DevTools console while clicking around — should be free of
      `ReferenceError`/`is not defined` errors
- [ ] Before testing against production, update `API_BASE` in `frontend/script.js`
      to wherever you've actually deployed the `backend/` folder above (the
      Railway URL currently in there is from the *old* backend, which this
      code replaces — redeploy `backend/` to that app, or change the URL)


## Phase 4 — Guided AI Studio

Phase 4 adds a guided, step-by-step workflow to the existing Zenvyra project. Student and teacher creation tools now collect tool-specific inputs one step at a time, retain answers while navigating Back/Continue, show progress, prevent duplicate AI submissions, and display generated previews.

New authenticated endpoints:
- `POST /api/tools/generate` — real AI generation for configured student/teacher tools.
- `POST /api/tools/export` — server-side PDF, DOCX, and PPTX generation from the generated content.

Server dependencies added:
- `pdfkit`
- `docx`
- `pptxgenjs`

Existing Supabase authentication, server-side usage limits, chat, Photo Solver, File Solver, and existing backend routes are retained.
