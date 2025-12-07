
const express = require('express');
const router = express.Router();
const db = require('../database');
const fs = require('fs');
const path = require('path');
const { getQueueStats } = require('../execute');
// IMPORTING FROM: backend/services/aiService.js
const { generateResponse } = require('../services/aiService');

const DB_PATH = path.join(__dirname, '../arena.db');

/**
 * GET SYSTEM VITALS
 */
router.get('/stats', (req, res) => {
    // 1. Queue Stats
    const queue = getQueueStats();
    
    // 2. Memory Usage (MB)
    const mem = process.memoryUsage();
    const memory = {
        rss: Math.round(mem.rss / 1024 / 1024), // Resident Set Size
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024)
    };

    // 3. Database Size
    let dbSize = 0;
    try {
        if (fs.existsSync(DB_PATH)) {
            const stats = fs.statSync(DB_PATH);
            dbSize = (stats.size / 1024 / 1024).toFixed(2); // MB
        }
    } catch (e) {
        dbSize = -1;
    }

    res.json({
        queue,
        memory,
        dbSize,
        uptime: process.uptime()
    });
});

/**
 * GENERATE COMPETITION REPORT
 */
router.post('/report', async (req, res) => {
    try {
        // 1. Gather Data
        const users = await new Promise((resolve, reject) => {
            db.all("SELECT name, score, role FROM users WHERE role = 'student' ORDER BY score DESC", (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const submissions = await new Promise((resolve, reject) => {
            db.all(`
                SELECT s.status, s.language, s.created_at, u.name as user_name, c.title as challenge_title, c.difficulty
                FROM submissions s
                JOIN users u ON s.user_id = u.id
                JOIN challenges c ON s.challenge_id = c.id
            `, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        const challenges = await new Promise((resolve, reject) => {
            db.all("SELECT title, difficulty, points FROM challenges", (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        // 2. Prepare Data for AI
        const summaryStats = {
            totalParticipants: users.length,
            top3: users.slice(0, 3),
            totalSubmissions: submissions.length,
            acceptedSubmissions: submissions.filter(s => s.status === 'Accepted').length,
            challengeStats: challenges.map(c => {
                const subs = submissions.filter(s => s.challenge_title === c.title);
                const solves = subs.filter(s => s.status === 'Accepted').length;
                return { 
                    title: c.title, 
                    difficulty: c.difficulty,
                    attempts: subs.length, 
                    solves: solves 
                };
            })
        };

        const systemPrompt = `
        You are a high-energy e-sports commentator and data analyst for a coding competition called "AOU Coding Arena".
        Generate a detailed "After Action Report" based on the provided statistics.
        
        Structure the report with these sections:
        1. 🏆 **Winner's Circle**: Celebrate the top 3 students. Mention their scores.
        2. ⚔️ **Battlefield Analysis**: Which challenge was the "Widowmaker" (hardest/least solved)? Which was the "Freebie" (easiest)?
        3. 📈 **Performance Metrics**: Comment on the overall pass rate (Accepted vs Total). Mention the most popular programming language used.
        4. 🎖️ **Honorable Mentions**: Invent 1-2 fun awards based on the data.
        5. 🔮 **Closing Thoughts**: A motivational wrap-up for the students.

        Format: Use Markdown. Use emojis.
        `;

        // 3. Call AI Service
        const result = await generateResponse({
            prompt: `Here is the competition data JSON: ${JSON.stringify(summaryStats)}`,
            systemInstruction: systemPrompt
        });

        res.json({ 
            report: result.text,
            stats: summaryStats
        });

    } catch (e) {
        console.error("Report Generation Error:", e);
        res.status(500).json({ error: "Failed to generate report" });
    }
});

module.exports = router;
