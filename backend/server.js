
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./database');
const fs = require('fs');
const path = require('path');
const startBackupService = require('./services/backup');

// Routes
const challengeRoutes = require('./routes/challenges');
const aiRoutes = require('./routes/ai');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/health', (req, res) => {
  res.status(200).json({ status: 'online', uptime: process.uptime() });
});
app.use('/api/auth', require('./routes/auth')(io));
app.use('/api/challenges', challengeRoutes);
app.use('/api/submit', require('./routes/evaluation')(io));
app.use('/api/ai', aiRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// --- PRODUCTION: Serve Frontend ---
// This assumes you build the frontend and move the 'dist' folder to 'backend/public'
const distPath = path.join(__dirname, 'public');
if (fs.existsSync(distPath)) {
  console.log('Serving static files from:', distPath);
  app.use(express.static(distPath));
  
  // Handle SPA routing (redirect all non-API requests to index.html)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}
// ----------------------------------

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Create temp directory
if (!fs.existsSync('./temp')){
    fs.mkdirSync('./temp');
}

// Start Auto-Backup Service
startBackupService();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
