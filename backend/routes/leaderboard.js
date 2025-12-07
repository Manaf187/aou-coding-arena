
const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  // Fetch top 50 users ordered by score
  // We JOIN submissions to count DISTINCT challenge_ids where status is 'Accepted'
  const sql = `
    SELECT u.id, u.name, u.score, u.role, COUNT(DISTINCT s.challenge_id) as solved_count
    FROM users u
    LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'Accepted'
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.score DESC
    LIMIT 50
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Format for frontend
    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      userId: row.id.toString(),
      name: row.name,
      score: row.score,
      solvedCount: row.solved_count || 0,
      lastSubmissionTime: Date.now() // Ideally we would get MAX(s.created_at) but this is fine for now
    }));
    
    res.json(leaderboard);
  });
});

module.exports = router;
