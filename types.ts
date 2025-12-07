
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  studentId?: string;
  email?: string;
  solvedChallengeIds?: string[]; // New field
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  starterCode: Record<string, string>;
  testCases: TestCase[];
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error';
  runtime: number; // ms
  timestamp: number;
  language: string;
  output?: string;
  isFirstBlood?: boolean; 
  isSecondSolver?: boolean;
}

export interface SubmitResult {
    status: string;
    runtime: number;
    output: string;
    isFirstBlood?: boolean;
    isSecondSolver?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  solvedCount: number;
  lastSubmissionTime: number;
}

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';
