
export type Language = 'en' | 'hi';

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'LOGIC' | 'IMAGE_MCQ' | 'FILL_BLANKS' | 'MATCHING';

export interface User {
  name: string;
  avatar: string;
  age: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LeaderboardEntry {
  name: string;
  avatar: string;
  score: number;
  iq: number;
  isUser?: boolean;
}

export interface Question {
  id: number | string;
  type: QuestionType;
  imageUrl?: string;
  isAI?: boolean;
  prompt: {
    en: string;
    hi: string;
  };
  options?: {
    en: string[];
    hi: string[];
  };
  pairs?: {
    en: [string, string][];
    hi: [string, string][];
  };
  answer: number | boolean | string;
  hint: {
    en: string;
    hi: string;
  };
}

export interface Level {
  id: number;
  questions: Question[];
}

export interface GameState {
  user: User | null;
  coins: number;
  currentLevel: number;
  currentQuestionIndex: number; // Progress within the 10-question level
  completedLevels: number[];
  language: Language;
  soundEnabled: boolean;
  lastDailyBonus: number | null;
  brainScore: number;
  isLoggedIn: boolean;
  leaderboard: LeaderboardEntry[];
  calculatedIQ: number;
  chatHistory: ChatMessage[];
}

export type View = 'SPLASH' | 'LOGIN' | 'SCANNER' | 'ONBOARDING_NAME' | 'ONBOARDING_AGE' | 'HOME' | 'PLAY' | 'LEVELS' | 'SETTINGS' | 'ABOUT' | 'AI_LAB' | 'CHAT' | 'LEADERBOARD' | 'TEST_RESULT';
