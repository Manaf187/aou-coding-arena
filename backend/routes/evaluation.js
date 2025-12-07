
const express = require('express');
const { runCode } = require('../execute');
const db = require('../database');
// IMPORTING FROM: backend/services/aiService.js
const { generateResponse } = require('../services/aiService');
const { Type } = require("@google/genai"); 

const FIRST_BLOOD_BONUS = 50;
const SECOND_SOLVER_BONUS = 25;
const RATE_LIMIT_MAP = new Map();

const normalizeOutput = (str) => {
    if (!str) return "";
    return str
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n');
};

const smartJudge = async (challenge, input, expected, actual, code) => {
    if (!process.env.API_KEY) return { pass: false, reason: "No API Key" };
    
    try {
        const prompt = `
        You are an expert Computer Science professor grading a student's submission.
        The automated test case rejected the submission because the output did not match exactly.
        
        --- CHALLENGE ---
        Title: ${challenge.title}
        Description: ${challenge.description}

        --- STUDENT CODE ---
        ${code}

        --- AUTOMATED CHECK FAILURE ---
        Input: ${input}
        Expected: ${expected}
        Actual Output: ${actual}

        --- YOUR TASK ---
        Determine if the student's code is LOGICALLY CORRECT.
        - IGNORE output formatting mismatches.
        - IGNORE whitespace issues.
        - CHECK if the algorithm is correct.
        
        Return JSON with exactly these keys:
        {
          "pass": boolean, 
          "reason": string
        }
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                pass: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
            }
        };

        const result = await generateResponse({
            prompt: prompt,
            systemInstruction: "You are a strict code grader. Respond in JSON.",
            jsonSchema: schema
        });
        
        // Sanitize output just in case
        const cleanText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanText);
        return json;

    } catch (e) {
        console.error("[AI JUDGE] Error:", e.message);
        return { pass: false, reason: "AI verification failed" };
    }
};

module.exports = (io) => {
  const router = express.Router();

  router.post('/run', async (req, res) => {
    const { code, language, input } = req.body;
    try {
        const result = await runCode(language, code, input || '');
        res.json(result);
    } catch (e) {
        res.json({ status: 'Error', output: e.message });
    }
  });

  router.post('/', async (req, res) => {
    const { userId, challengeId, code, language } = req.body;

    // Rate Limiting
    const lastTime = RATE_LIMIT_MAP.get(userId) || 0;
    const now = Date.now();
    if (now - lastTime < 3000) {
        return res.json({ 
            status: 'Runtime Error', 
            output: '⚠️ Rate Limit: Please wait 3 seconds before submitting again.',
            isFirstBlood: false,
            isSecondSolver: false
        });
    }
    RATE_LIMIT_MAP.set(userId, now);

    db.get("SELECT name FROM users WHERE id = ?", [userId], (err, userRow) => {
        if (err || !userRow) return res.status(404).json({error: "User not found"});
        const userName = userRow.name;

        db.get("SELECT title, points, description FROM challenges WHERE id = ?", [challengeId], (err, challenge) => {
          if (err || !challenge) return res.status(404).json({ error: "Challenge not found" });

          db.get("SELECT id FROM submissions WHERE user_id = ? AND challenge_id = ? AND status = 'Accepted'", 
            [userId, challengeId], 
            (err, previousSolve) => {
              
              const alreadySolved = !!previousSolve;

              db.all("SELECT * FROM test_cases WHERE challenge_id = ?", [challengeId], async (err, testCases) => {
                if (err) return res.status(500).json({ error: 'DB Error' });

                if (!testCases || testCases.length === 0) {
                   return res.json({ status: 'Runtime Error', output: 'No test cases defined for this challenge.' });
                }

                let allPassed = true;
                let failureOutput = "";
                let aiAssisted = false;

                for (let i = 0; i < testCases.length; i++) {
                  const testCase = testCases[i];
                  const result = await runCode(language, code, testCase.input);
                  
                  const normalizedActual = normalizeOutput(result.output);
                  const normalizedExpected = normalizeOutput(testCase.expected_output);

                  if (result.status !== 'Success' || normalizedActual !== normalizedExpected) {
                    
                    let passedViaAI = false;
                    let aiReason = "";
                    
                    if (result.status === 'Success') {
                        const aiVerdict = await smartJudge(challenge, testCase.input, testCase.expected_output, result.output, code);
                        if (aiVerdict.pass) {
                            passedViaAI = true;
                            aiAssisted = true;
                            aiReason = aiVerdict.reason;
                        } else {
                            aiReason = aiVerdict.reason;
                        }
                    }

                    if (!passedViaAI) {
                        allPassed = false;
                        
                        let aiMsg = "";
                        if (result.status === 'Success' && process.env.API_KEY) {
                             aiMsg = `\n\n🤖 AI Judge Verdict: REJECTED\n"${aiReason || 'Output mismatch.'}"`;
                        }

                        failureOutput = result.status !== 'Success' 
                            ? result.output 
                            : `Test Case ${i + 1} Failed.\nInput: ${testCase.input}\nExpected: ${testCase.expected_output}\nGot: ${result.output}${aiMsg}`;
                        break; 
                    }
                  }
                }

                const status = allPassed ? 'Accepted' : 'Wrong Answer';
                let finalOutput = allPassed ? "All test cases passed successfully!" : failureOutput;
                
                if (allPassed && aiAssisted) {
                    finalOutput += "\n\n(✨ Verified by AI Judge: Logic is correct!)";
                }

                if (allPassed) {
                    db.get("SELECT COUNT(*) as count FROM submissions WHERE challenge_id = ? AND status = 'Accepted'", [challengeId], (err, row) => {
                        const solvedCount = row ? row.count : 0;
                        const isFirstBlood = (solvedCount === 0);
                        const isSecondSolver = (solvedCount === 1);
                        
                        let pointsToAdd = 0;
                        if (!alreadySolved) {
                            pointsToAdd = challenge.points;
                            if (isFirstBlood) pointsToAdd += FIRST_BLOOD_BONUS;
                            if (isSecondSolver) pointsToAdd += SECOND_SOLVER_BONUS;
                            
                            if (isFirstBlood) {
                                io.emit('first_blood', { userName, challengeTitle: challenge.title, points: pointsToAdd });
                            }
                            if (isSecondSolver) {
                                io.emit('second_solver', { userName, challengeTitle: challenge.title, points: pointsToAdd });
                            }
                            
                            io.emit('submission_feed', { 
                                userName, 
                                challengeTitle: challenge.title, 
                                status: 'Accepted', 
                                isFirstBlood,
                                isSecondSolver
                            });
                        }

                        finishSubmission(status, pointsToAdd, isFirstBlood, isSecondSolver);
                    });
                } else {
                     if (!alreadySolved) {
                        io.emit('submission_feed', { userName, challengeTitle: challenge.title, status: 'Wrong Answer', isFirstBlood: false, isSecondSolver: false });
                     }
                    finishSubmission(status, 0, false, false);
                }

                function finishSubmission(status, pointsToAdd, isFirstBlood, isSecondSolver) {
                    db.serialize(() => {
                      db.run("INSERT INTO submissions (user_id, challenge_id, code, language, status, runtime) VALUES (?,?,?,?,?,?)",
                        [userId, challengeId, code, language, status, 0]
                      );

                      if (pointsToAdd > 0) {
                         db.run("UPDATE users SET score = score + ? WHERE id = ?", [pointsToAdd, userId], (err) => {
                           if (!err) {
                             io.emit('leaderboard_update', { userId, scoreIncrement: pointsToAdd });
                           }
                         });
                      }

                      let responseMsg = finalOutput;
                      if (allPassed && alreadySolved) {
                          responseMsg += "\n\n(Note: You have already solved this challenge. No additional points awarded.)";
                      }
                      
                      const responsePayload = { 
                          status, 
                          runtime: 0, 
                          output: responseMsg, 
                          isFirstBlood: isFirstBlood && !alreadySolved,
                          isSecondSolver: isSecondSolver && !alreadySolved
                      };
                      
                      res.json(responsePayload);
                    });
                }
              });
            });
        });
    });
  });

  return router;
};
