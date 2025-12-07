# 🧪 AOU Coding Arena - Testing Guide

## 1. Manual Testing Checklist

Before any competition, run through this list:

### Authentication
- [ ] **Admin Login**: Log in with `the given creds`. Verify "Admin Panel" access.
- [ ] **Student Register**: Create a new account. Verify auto-login.
- [ ] **Student Login**: Log out and log back in with new credentials.
- [ ] **Validation**: Try empty fields, invalid emails.

### Challenge Flow
- [ ] **List View**: Ensure all challenges load. Check difficulty badges.
- [ ] **Editor**: Open a challenge. Verify Monaco Editor loads (Python default).
- [ ] **Language Switch**: Switch to C++. Ensure starter code updates.
- [ ] **Run Code**: Click "Run". Verify mock output appears in console.
- [ ] **Submit Code**: Click "Submit". Verify status updates (Accepted/Wrong Answer).

### Real-Time Features
- [ ] **Leaderboard**: Open two browser windows (Admin & Student). Submit correct code as Student. Verify Admin sees score update within 5 seconds without refresh.

### AI Mentor
- [ ] **Chat**: Open chat. Ask "How do I solve this?". Verify response is a **hint**, not code.
- [ ] **Context**: Verify the bot knows which challenge you are looking at.

---

## 2. Load Testing (Competition Prep)

For a competition with 100+ students, use **Artillery** to simulate load.

1. **Install Artillery**: `npm install -g artillery`
2. **Create Test Config** (`loadtest.yaml`):
   ```yaml
   config:
     target: "https://your-backend-url.com"
     phases:
       - duration: 60
         arrivalRate: 5
         name: "Warm up"
       - duration: 120
         arrivalRate: 20
         name: "Sustained load"
   scenarios:
     - flow:
         - get:
             url: "/api/challenges"
   ```
3. **Run**: `artillery run loadtest.yaml`

**Pass Criteria:**
- P95 Latency < 500ms
- Error rate < 1%

---

## 3. Security Checklist

- [ ] **Sandbox**: Ensure `docker.js` is active in backend (not the mock `child_process`).
- [ ] **Network**: Verify containers have NO internet access (`--network none`).
- [ ] **Timeouts**: Verify infinite loops (e.g., `while(true)`) get killed after 5s.
- [ ] **Resources**: Check memory limits (128MB per container).
- [ ] **Secrets**: Ensure `API_KEY` and `JWT_SECRET` are not in client-side JS bundles.

## 4. How to Reset Competition
1. in the admin panel you can reset everything
