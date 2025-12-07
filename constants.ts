
import { Challenge, Difficulty, LeaderboardEntry } from './types';

export const APP_NAME = "AOU CODING ARENA";

export const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python 3' },
  { id: 'javascript', name: 'JavaScript (Node)' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
];

export const SYSTEM_INSTRUCTION = `
You are an expert Computer Science mentor for the Arab Open University (AOU) Coding Arena.
Your goal is to help students learn without cheating.
RULES:
1. NEVER provide the full solution code.
2. NEVER write code snippets that directly solve the problem.
3. Provide hints, logical steps, algorithm names, or debugging tips.
4. If a user pastes their code, identify the logic error but let them fix the syntax.
5. Be encouraging and concise.
`;

// MOCK DATA for Phase 1 Demo
export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    difficulty: Difficulty.EASY,
    points: 100,
    starterCode: {
      python: "def two_sum(nums, target):\n    # Write your code here\n    pass",
      javascript: "function twoSum(nums, target) {\n    // Write your code here\n};",
      java: "public class Main {\n    public static void main(String[] args) {\n        // Read input and print output\n    }\n}",
      cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}"
    },
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: true }
    ]
  },
  {
    id: '2',
    title: 'Valid Palindrome',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.`,
    difficulty: Difficulty.EASY,
    points: 100,
    starterCode: {
      python: "def is_palindrome(s):\n    pass",
      javascript: "function isPalindrome(s) {\n};",
      java: "public class Main {\n    public static void main(String[] args) {\n    }\n}",
      cpp: "int main() {\n}"
    },
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false }
    ]
  },
  {
    id: '3',
    title: 'LRU Cache',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.`,
    difficulty: Difficulty.HARD,
    points: 300,
    starterCode: {
      python: "class LRUCache:\n    def __init__(self, capacity: int):\n        pass",
      javascript: "class LRUCache {\n    constructor(capacity) {}\n}",
      java: "public class Main {\n}",
      cpp: "class LRUCache {\npublic:\n    LRUCache(int capacity) {\n    }\n};"
    },
    testCases: []
  }
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '101', name: 'Ahmed Ali', score: 1250, solvedCount: 12, lastSubmissionTime: Date.now() - 10000 },
  { rank: 2, userId: '102', name: 'Sara Omer', score: 1100, solvedCount: 10, lastSubmissionTime: Date.now() - 500000 },
  { rank: 3, userId: '103', name: 'Khalid M.', score: 950, solvedCount: 9, lastSubmissionTime: Date.now() - 3600000 },
];
