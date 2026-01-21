
export type Language = 'en' | 'hi';

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'LOGIC' | 'IMAGE_MCQ' | 'FILL_BLANKS' | 'MATCHING';

export interface User {
  name: string;
  email: string;
  photo: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
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

export interface GameState {
  user: User | null;
  coins: number;
  currentLevel: number;
  completedLevels: (number | string)[];
  language: Language;
  soundEnabled: boolean;
  lastDailyBonus: number | null;
  brainScore: number;
}

export type View = 'SPLASH' | 'LOGIN' | 'HOME' | 'PLAY' | 'LEVELS' | 'SETTINGS' | 'ABOUT' | 'AI_LAB' | 'CHAT';
