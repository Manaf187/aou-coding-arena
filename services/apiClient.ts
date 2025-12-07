
import type { User, Challenge, Submission, LeaderboardEntry, SubmitResult } from "../types";

// Dynamically calculate the backend URL
const getBackendUrl = () => {
    const { hostname, port } = window.location;
    
    // Development: Frontend on 3000, Backend on 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '3000') return 'http://localhost:3001';
    }
    // In production (served by backend), relative path uses the same origin
    return "";
};

const BASE_URL = getBackendUrl();
const API_URL = `${BASE_URL}/api`;

let currentUser: User | null = null;
let authToken: string | null = localStorage.getItem('auth_token');

const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...options.headers,
  } as HeadersInit;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown Error' }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const verifyToken = async (): Promise<User | null> => {
  if (!authToken) return null;
  try {
    const data = await authFetch('/auth/verify');
    currentUser = data.user;
    return currentUser;
  } catch (e) {
    logout();
    return null;
  }
};

export const login = async (identifier: string, password: string): Promise<User> => {
  const data = await authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, password }),
  });
  authToken = data.token;
  currentUser = data.user;
  localStorage.setItem('auth_token', data.token);
  return currentUser as User;
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  const data = await authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  authToken = data.token;
  currentUser = data.user;
  localStorage.setItem('auth_token', data.token);
  return currentUser as User;
};

export const logout = async () => {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('auth_token');
};

export const getCurrentUser = () => currentUser;

// --- SYSTEM ---

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/health`);
        return response.ok;
    } catch (e) {
        return false;
    }
};

export const getSystemStats = async (): Promise<any> => {
    return authFetch('/admin/stats');
};

export const generateReport = async (): Promise<{report: string, stats: any}> => {
    return authFetch('/admin/report', { method: 'POST' });
};

// --- CHALLENGE MANAGEMENT ---

export const getChallenges = async (): Promise<Challenge[]> => {
  return authFetch('/challenges');
};

export const createChallenge = async (challenge: Omit<Challenge, 'id'>): Promise<Challenge> => {
  return authFetch('/challenges', {
    method: 'POST',
    body: JSON.stringify(challenge),
  });
};

export const updateChallenge = async (id: string, challenge: Omit<Challenge, 'id'>): Promise<void> => {
    return authFetch(`/challenges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(challenge),
    });
};

export const deleteChallenge = async (id: string): Promise<void> => {
  await authFetch(`/challenges/${id}`, { method: 'DELETE' });
};

// --- USER & ADMIN MANAGEMENT ---

export const deleteUser = async (id: string): Promise<void> => {
    await authFetch(`/auth/users/${id}`, { method: 'DELETE' });
};

export const resetLeaderboard = async (): Promise<void> => {
    await authFetch(`/auth/reset-leaderboard`, { method: 'POST' });
};

// --- Execution & AI ---

export const runCodeSandbox = async (code: string, language: string, input?: string): Promise<{status: string, output: string}> => {
    return authFetch('/submit/run', {
        method: 'POST',
        body: JSON.stringify({ code, language, input })
    });
};

export const submitCode = async (challengeId: string, code: string, language: string): Promise<SubmitResult> => {
  if (!currentUser) throw new Error("Must be logged in");
  return authFetch('/submit', {
    method: 'POST',
    body: JSON.stringify({
      userId: currentUser.id,
      challengeId,
      code,
      language
    }),
  });
};

export const askAi = async (challengeTitle: string, challengeDesc: string, userCode: string, userQuestion: string): Promise<string> => {
    const data = await authFetch('/ai/hint', {
        method: 'POST',
        body: JSON.stringify({ challengeTitle, challengeDesc, userCode, userQuestion })
    });
    return data.hint;
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  return authFetch('/leaderboard');
};
