
const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all challenges (and their test cases)
router.get('/', (req, res) => {
  db.all("SELECT * FROM challenges", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const challenges = rows.map(r => {
        try {
            return {
                ...r,
                starterCode: JSON.parse(r.starter_code),
                testCases: []
            };
        } catch (e) {
            return { ...r, starterCode: {}, testCases: [] };
        }
    });

    db.all("SELECT * FROM test_cases", [], (err, testRows) => {
        if (err) return res.json(challenges); 

        testRows.forEach(tc => {
            const ch = challenges.find(c => c.id === tc.challenge_id);
            if (ch) {
                ch.testCases.push({
                    input: tc.input,
                    expectedOutput: tc.expected_output,
                    isHidden: tc.is_hidden === 1
                });
            }
        });

        res.json(challenges);
    });
  });
});

// POST create
router.post('/', (req, res) => {
  const { title, description, difficulty, points, starterCode, testCases } = req.body;
  const starterCodeStr = JSON.stringify(starterCode);

  db.serialize(() => {
    db.run(`INSERT INTO challenges (title, description, difficulty, points, starter_code) VALUES (?,?,?,?,?)`,
      [title, description, difficulty, points, starterCodeStr],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const challengeId = this.lastID;

        if (testCases && testCases.length > 0) {
            const stmt = db.prepare("INSERT INTO test_cases (challenge_id, input, expected_output, is_hidden) VALUES (?, ?, ?, ?)");
            testCases.forEach(tc => {
                stmt.run(challengeId, tc.input, tc.expectedOutput, tc.isHidden ? 1 : 0);
            });
            stmt.finalize();
        }

        res.json({ id: challengeId, message: "Challenge created successfully" });
      }
    );
  });
});

// PUT update
router.put('/:id', (req, res) => {
    const { title, description, difficulty, points, starterCode, testCases } = req.body;
    const starterCodeStr = JSON.stringify(starterCode);
    const challengeId = req.params.id;
  
    db.serialize(() => {
      // 1. Update Challenge Details
      db.run(`UPDATE challenges SET title=?, description=?, difficulty=?, points=?, starter_code=? WHERE id=?`,
        [title, description, difficulty, points, starterCodeStr, challengeId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
  
          // 2. Delete Old Test Cases
          db.run("DELETE FROM test_cases WHERE challenge_id = ?", [challengeId], (err) => {
              if (err) return res.status(500).json({ error: "Failed to clear old test cases" });

              // 3. Insert New Test Cases
              if (testCases && testCases.length > 0) {
                const stmt = db.prepare("INSERT INTO test_cases (challenge_id, input, expected_output, is_hidden) VALUES (?, ?, ?, ?)");
                testCases.forEach(tc => {
                    stmt.run(challengeId, tc.input, tc.expectedOutput, tc.isHidden ? 1 : 0);
                });
                stmt.finalize();
              }
              
              res.json({ message: "Challenge updated successfully" });
          });
        }
      );
    });
  });

// DELETE
router.delete('/:id', (req, res) => {
  db.serialize(() => {
      db.run("DELETE FROM test_cases WHERE challenge_id = ?", [req.params.id]);
      db.run("DELETE FROM challenges WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
      });
  });
});

module.exports = router;
