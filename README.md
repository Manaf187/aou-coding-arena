# AOU Coding Arena - Deployment Manual

**Institution:** Arab Open University - Bahrain (Faculty of Computer Studies)  
**System:** Competitive Coding Platform (HackerRank/LeetCode Clone)

This guide provides step-by-step instructions to download, install, and deploy the platform on a server or local machine.

## 📋 Prerequisites

Before starting, ensure the target machine has the following installed:

1.  **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2.  **Docker Desktop** - Required for secure code execution.
3.  **Git** - To clone the repository.

---

## 🛠️ Step 1: Installation & Setup

### 1. Download/Clone the Project
Open your terminal and run:
```bash
git clone https://github.com/your-username/aou-coding-arena.git
cd aou-coding-arena
```

### 2. Install Dependencies
```bash
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../
npm install
```

### 3. ⚠️ CRITICAL: Build the Sandbox Image
This project uses Docker to safely run student code. You **must** build the runner image before the app will work.

```bash
cd backend
docker build -t aou-runner .
```

---

## ⚙️ Step 2: Configuration

### 1. Backend Environment
Create a `.env` file in the `backend/` folder:
```bash
cd backend
touch .env
```
Open `.env` and add:
```env
PORT=3001
JWT_SECRET=super_secret_key_change_this_for_production
API_KEY=your_google_gemini_api_key_here
NODE_ENV=development
```
*(Note: Get your API Key from [Google AI Studio](https://aistudio.google.com/))*

---

## 🚀 Step 3: Running the Platform

To start the system, you need to run both the Backend (API) and the Frontend (UI).

### Local Development
Open two terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```
*You should see: "Server running on port 3001" and "Connected to the SQLite database."*

**Terminal 2 (Frontend):**
```bash
npm run dev
```
*Open your browser to the URL shown (usually http://localhost:5173).*

---

## 🛡️ Admin Setup

1.  **Log in as Admin:**
    *   **Email:** `manafmajid992@gmail.com`
    *   **Password:** `960604499@6230442`

2.  **Create Challenges:**
    *   Go to **"Admin Panel"**.
    *   Click **"New Challenge"**.
    *   **CRITICAL: Test Cases:** You must add test cases for the auto-grader to work.

---

## ⚠️ Troubleshooting

**"Runtime Error: Failed to launch Docker"**
1. Ensure Docker Desktop is running.
2. Ensure you ran `docker build -t aou-runner .` inside the `backend` folder.
