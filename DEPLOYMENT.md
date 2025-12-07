
# 🚀 Free Deployment Guide for AOU Coding Arena

Because this application uses **Docker** to execute student code and **SQLite** for the database, standard free hosting (Vercel, Netlify) will **NOT** work (they don't allow Docker-in-Docker).

You have two excellent free options:

---

## 🟢 Option 1: The "Ngrok" Method (Best for Demos/Hackathons)
**Host it on your own computer but give everyone a public URL.**
This is the easiest way because you already have Docker and the database set up locally.

### 1. Prepare the Production Build
Run these commands in your project root:

```bash
# 1. Build the Frontend
npm run build

# 2. Move the build to the backend
# (Windows)
move dist backend\public
# (Mac/Linux)
mv dist backend/public
```

### 2. Run the Server
```bash
cd backend
npm start
```
*Your app is now running locally on port 3001 and serving the frontend.*

### 3. Expose to the Internet
1. Download [Ngrok](https://ngrok.com/download) (it's free).
2. Open a new terminal and run:
   ```bash
   ngrok http 3001
   ```
3. Ngrok will give you a URL like `https://a1b2-c3d4.ngrok-free.app`.
4. **Send this URL to students.** They can access the full app, and it will run the code on your machine's Docker.

---

## 🟠 Option 2: Oracle Cloud "Always Free" (Best for 24/7 Hosting)
Oracle offers a powerful "Always Free" VPS (Virtual Private Server) that supports Docker.

1. **Sign up** for [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. **Create an Instance**:
   - Image: **Ubuntu 22.04**
   - Shape: **VM.Standard.A1.Flex** (Select 2-4 OCPUs and 12GB+ RAM). *This is free!*
3. **SSH into the VM** and install dependencies:
   ```bash
   # Update & Install Docker + Node.js
   sudo apt update
   sudo apt install -y docker.io nodejs npm git
   sudo usermod -aG docker $USER
   ```
4. **Clone & Run**:
   ```bash
   git clone <your-repo-url>
   cd aou-coding-arena/backend
   npm install
   docker build -t aou-runner .
   npm start
   ```
5. **Open Ports**: In Oracle Cloud Dashboard -> Networking, add an Ingress Rule to allow traffic on port 3001.

---

## 🔴 Why not Render / Vercel?
- **Render (Free)**: Does not support `docker` command inside their free web services. The code runner will fail.
- **Vercel**: Serverless functions cannot maintain the persistent WebSocket connection required for the live leaderboard.
