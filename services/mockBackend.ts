import { User, UserRole, Submission, Challenge, Difficulty } from "../types";
import { MOCK_CHALLENGES } from "../constants";

// Mock Database State
let currentUser: User | null = null;
let challenges: Challenge[] = [...MOCK_CHALLENGES];

export const login = async (identifier: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (identifier === "manafmajid992@gmail.com" && password === "960604499@6230442") {
    currentUser = {
      id: "admin-001",
      name: "Admin Manaf",
      role: UserRole.ADMIN,
      email: identifier
    };
    return currentUser;
  }

  // Simulate finding a user
  if (identifier.length > 0) {
    currentUser = {
      id: "student-" + Math.floor(Math.random() * 1000),
      name: identifier.split('@')[0] || identifier,
      role: UserRole.STUDENT,
      studentId: "AOU-" + Math.floor(Math.random() * 10000),
      email: identifier.includes('@') ? identifier : undefined
    };
    return currentUser;
  }

  throw new Error("Invalid credentials");
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }

  currentUser = {
    id: "student-" + Date.now(),
    name: name,
    role: UserRole.STUDENT,
    studentId: "AOU-" + Math.floor(Math.random() * 10000),
    email: email
  };
  
  return currentUser;
};

export const logout = async () => {
  currentUser = null;
};

export const getCurrentUser = () => currentUser;

// Challenge CRUD (Mock)
export const getChallenges = async (): Promise<Challenge[]> => {
  return challenges;
};

export const createChallenge = async (challenge: Omit<Challenge, 'id'>): Promise<Challenge> => {
  const newChallenge = { ...challenge, id: Date.now().toString() };
  challenges.push(newChallenge);
  return newChallenge;
};

export const deleteChallenge = async (id: string): Promise<void> => {
  challenges = challenges.filter(c => c.id !== id);
};

export const submitCode = async (challengeId: string, code: string, language: string): Promise<Submission> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); 

  // Simple Mock Evaluation
  const isCorrect = code.length > 20 && !code.includes("pass") && !code.includes("return new"); 
  
  return {
    id: Date.now().toString(),
    challengeId,
    userId: currentUser?.id || 'unknown',
    status: isCorrect ? 'Accepted' : 'Wrong Answer',
    runtime: Math.floor(Math.random() * 100) + 10,
    timestamp: Date.now(),
    language,
    output: isCorrect ? "All test cases passed!" : "Output mismatch in test case 1: Expected [0,1], got undefined"
  };
};