# Phase 1: AOU Coding Arena - Architecture & Deployment Plan

## 1. Full Architecture Plan

The system follows a classic Client-Server architecture designed for low overhead and easy containerization.

- **Client (Frontend):** A Single Page Application (SPA) built with React. It handles the UI, Monaco Editor state, and communicates with the backend via REST APIs and WebSockets.
- **Server (Backend):** A Node.js Express server. It handles authentication, database operations, real-time events (Socket.io), and code execution orchestration.
- **Database:** SQLite (file-based) for zero-configuration persistence. Perfect for "lightweight" and "easy-to-deploy" requirements.
- **Execution Engine:** A constrained environment for running user code.
- **AI Layer:** Google Gemini API integration for the "Hint Bot".

## 2. Complete Folder Structure

```
/
├── frontend/ (This React App)
│   ├── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── index.tsx
├── backend/
│   ├── server.js          # Main entry point
│   ├── database.sqlite    # SQLite DB file
│   ├── services/
│   │   ├── db.js          # SQLite wrapper
│   │   ├── socket.js      # Socket.io logic
│   │   ├── docker.js      # Code execution logic
│   │   └── ai.js          # Gemini API handler
│   └── routes/
│       ├── auth.js
│       ├── challenges.js
│       └── submit.js
├── Dockerfile             # Multi-stage build for easy deploy
└── package.json
```

## 3. Technology Justification

- **React + Tailwind:** Rapid UI development, excellent performance, and easy theming (Dark/Hacker mode).
- **SQLite:** No separate database server process required. Data is stored in a single file, making backups and deployment to services like Railway/Render trivial (using a mounted volume).
- **Socket.io:** The standard for real-time leaderboards. Easier to implement than raw WebSockets.
- **Docker (Execution):** While `vm2` is simpler, it is insecure for C++/Java. Using a Docker-in-Docker approach or simply spawning containers for execution is the industry standard for safety. For a *very* lightweight version, `child_process` with strict timeouts and `ulimit` (on Linux) is the alternative.

## 4. Database Schema (SQLite)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  student_id TEXT UNIQUE,
  role TEXT DEFAULT 'student', -- 'student' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  difficulty TEXT, -- 'Easy', 'Medium', 'Hard'
  starter_code TEXT, -- JSON string mapping lang -> code
  points INTEGER
);

CREATE TABLE test_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER,
  input TEXT,
  expected_output TEXT,
  is_hidden BOOLEAN DEFAULT 0,
  FOREIGN KEY(challenge_id) REFERENCES challenges(id)
);

CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  challenge_id INTEGER,
  code TEXT,
  language TEXT,
  status TEXT, -- 'Accepted', 'Wrong Answer', 'Error'
  runtime_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Code Evaluation Strategy

**Strategy: Isolated Process Execution**

1.  **Python/JS:** Run directly via Node `child_process` or Python interpreter with strict memory/time limits.
2.  **C++/Java:** Must be compiled first.
    *   Step 1: Save code to `temp/Main.java` or `temp/main.cpp`.
    *   Step 2: Compile (`javac`, `g++`). Capture stderr for compilation errors.
    *   Step 3: Run executable against test case inputs injected via `stdin`.
    *   Step 4: Compare `stdout` with expected output.

**Security:** Use `docker run --network none --memory 128m --cpus 0.5 ...` to prevent infinite loops or malicious networking.

## 6. API Design

- `POST /api/login` - Student/Admin login
- `GET /api/challenges` - List all challenges
- `GET /api/challenges/:id` - Get details + starter code
- `POST /api/submit` - Run code against test cases (Returns Pass/Fail)
- `POST /api/run` - Run code against custom input (Sandbox)
- `POST /api/chat` - Send context + prompt to Gemini
- `GET /api/leaderboard` - Get current standings

## 7. Admin Authentication Flow

- **Hardcoded Super Admin:** Check credentials against env vars `ADMIN_EMAIL` and `ADMIN_PASS` during `/api/login`.
- **Token:** Issue a JWT signed with `JWT_SECRET`.
- **Middleware:** `verifyAdmin` middleware checks JWT role claim.

## 8. AI Chatbot Design + Guardrails

- **Model:** Gemini 2.5 Flash (Fast, low latency).
- **System Instruction:**
  > "You are a mentor for a university coding competition. You MUST NOT provide code solutions. You MUST NOT fix their code directly. Only provide conceptual hints, algorithm names, or logic corrections. Be concise. If they ask for the answer, refuse politely."
- **Context:** Pass the current Challenge Description and the User's current Code snippet (truncated) to the model so it understands the context.

## 9. WebSocket Flow

1.  **Connect:** Client connects to `/`.
2.  **Submission:** When a user submits and passes, Server emits `leaderboard_update` event.
3.  **Client:** Leaderboard component listens for `leaderboard_update` and refetches/updates the table without page reload.

## 10. Deployment Plan

**Option A: Railway.app / Render.com (Recommended)**
1.  Repo contains `package.json` with `scripts: { "start": "node backend/server.js", "build": "vite build" }`.
2.  Backend serves the static frontend files from `dist/`.
3.  **Env Vars:** `API_KEY` (Gemini), `ADMIN_PASS`.
4.  **Volume:** Mount a volume at `/backend/data` to persist `database.sqlite` across restarts.
