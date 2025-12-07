
const express = require('express');
const db = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

module.exports = (io) => {
    const router = express.Router();

    // Helper to get solved challenges
    const getSolvedIds = (userId) => {
        return new Promise((resolve, reject) => {
            db.all("SELECT DISTINCT challenge_id FROM submissions WHERE user_id = ? AND status = 'Accepted'", [userId], (err, rows) => {
                if (err) resolve([]);
                else resolve(rows.map(r => r.challenge_id.toString()));
            });
        });
    };

    // Middleware to verify token
    const verifyToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) return res.status(401).json({ error: 'Null token' });

      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalid' });
        req.user = user;
        next();
      });
    };

    router.get('/verify', verifyToken, (req, res) => {
      db.get("SELECT id, name, email, role, score FROM users WHERE id = ?", [req.user.id], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });
        
        const solvedIds = await getSolvedIds(user.id);
        
        res.json({
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            score: user.score,
            solvedChallengeIds: solvedIds
          }
        });
      });
    });

    router.post('/login', (req, res) => {
      const { email, password } = req.body;

      db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], async (err, user) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const solvedIds = await getSolvedIds(user.id);

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            solvedChallengeIds: solvedIds
          }
        });
      });
    });

    router.post('/register', (req, res) => {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (row) return res.status(409).json({ error: 'User already exists' });

        db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
          [name, email, password, 'student'], 
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const newUserId = this.lastID;
            const token = jwt.sign(
              { id: newUserId, email, role: 'student' },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.json({
              token,
              user: {
                id: newUserId,
                name,
                role: 'student',
                email,
                solvedChallengeIds: []
              }
            });
          }
        );
      });
    });

    // --- ADMIN ROUTES ---

    // Delete User
    router.delete('/users/:id', verifyToken, (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        
        db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            // Also delete submissions
            db.run("DELETE FROM submissions WHERE user_id = ?", [req.params.id]);
            res.json({ message: "User deleted" });
        });
    });

    // Reset Leaderboard (Scores)
    router.post('/reset-leaderboard', verifyToken, (req, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        db.serialize(() => {
            // Reset scores
            db.run("UPDATE users SET score = 0 WHERE role = 'student'");
            // Clear submissions history so they can solve again
            db.run("DELETE FROM submissions");
            
            // Broadcast event to all clients (Admins and Students)
            io.emit('system_reset');

            res.json({ message: "Competition reset successfully" });
        });
    });

    return router;
};
