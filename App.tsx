
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Settings, 
  Play, 
  ChevronLeft, 
  Lightbulb, 
  Coins, 
  Globe, 
  Brain,
  Sparkles,
  LayoutGrid,
  Send,
  Zap,
  RotateCcw,
  Trophy,
  Info,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  Gift
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, View, Question } from './types';
import { QUESTIONS } from './constants/questions';
import { UI_STRINGS } from './constants/translations';

const STORAGE_KEY = 'brain_test_lite_v3';

const SOUNDS = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_783ef5a7ee.mp3',
  correct: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bbd1349f44.mp3',
  wrong: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35278d32b.mp3',
  bonus: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c1913f99a5.mp3'
};

const INITIAL_STATE: GameState = {
  user: { name: "Explorer", email: "", photo: null },
  coins: 500,
  currentLevel: 1,
  completedLevels: [],
  language: 'en',
  soundEnabled: true,
  brainScore: 100,
  lastDailyBonus: null
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [view, setView] = useState<View>('SPLASH');
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | null, show: boolean }>({ type: null, show: false });

  const t = UI_STRINGS[gameState.language];

  // Sound Utility
  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (gameState.soundEnabled) {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Catch silent play failures
    }
  }, [gameState.soundEnabled]);

  // Initialize and load saved state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load game state", e);
      }
    }
    setIsReady(true);
  }, []);

  // Sync state to local storage
  useEffect(() => {
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState, isReady]);

  // Daily Bonus logic
  const canClaimBonus = useMemo(() => {
    if (!gameState.lastDailyBonus) return true;
    const last = new Date(gameState.lastDailyBonus);
    const now = new Date();
    return now.toDateString() !== last.toDateString();
  }, [gameState.lastDailyBonus]);

  const handleClaimBonus = () => {
    if (!canClaimBonus) return;
    playSound('bonus');
    setGameState(p => ({
      ...p,
      coins: p.coins + 50,
      lastDailyBonus: Date.now()
    }));
  };

  // Current question logic (Local or AI)
  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const idx = (gameState.currentLevel - 1) % (QUESTIONS.length || 1);
    return QUESTIONS[idx] || QUESTIONS[0];
  }, [gameState.currentLevel, view, aiQuestion]);

  // AI Lab Generation
  const generateAIChallenge = async () => {
    if (gameState.coins < 50) {
      alert(t.notEnoughCoins);
      return;
    }

    setIsGenerating(true);
    setAiQuestion(null);
    setFeedback({ type: null, show: false });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a unique, clever brain-teaser puzzle for a game. 
        It can be a riddle or a logic question.
        Language requirement: Provide BOTH English and Hindi translations.
        Response MUST be strictly valid JSON.
        Type can be 'FILL_BLANKS' or 'MCQ'. 
        If MCQ, provide 4 options.
        Example JSON:
        {
          "type": "FILL_BLANKS",
          "prompt": { "en": "What has to be broken before you can use it?", "hi": "इस्तेमाल करने से पहले क्या तोड़ना पड़ता है?" },
          "answer": "Egg",
          "hint": { "en": "Common breakfast item", "hi": "नाश्ते की चीज़" }
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              prompt: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } },
              options: { 
                type: Type.OBJECT, 
                properties: { 
                  en: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hi: { type: Type.ARRAY, items: { type: Type.STRING } }
                } 
              },
              answer: { type: Type.STRING },
              hint: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } }
            },
            required: ["type", "prompt", "answer", "hint"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setAiQuestion({ ...data, id: `ai_${Date.now()}`, isAI: true });
      setGameState(p => ({ ...p, coins: p.coins - 50 }));
    } catch (err) {
      console.error("AI Generation Error:", err);
      alert("AI Lab encountered an error. Please try Classic Mode.");
      setView('HOME');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (val: number | string) => {
    if (feedback.show) return;

    const isCorrect = typeof val === 'number' 
      ? val === currentQ.answer 
      : val.toString().toLowerCase().trim() === currentQ.answer.toString().toLowerCase().trim();

    if (typeof val === 'number') setSelectedIdx(val);

    if (isCorrect) {
      playSound('correct');
      setFeedback({ type: 'correct', show: true });
      setGameState(p => ({
        ...p,
        coins: p.coins + 25,
        brainScore: p.brainScore + (currentQ.isAI ? 40 : 10),
        completedLevels: Array.from(new Set([...p.completedLevels, currentQ.id]))
      }));
    } else {
      playSound('wrong');
      setFeedback({ type: 'wrong', show: true });
      setTimeout(() => {
        setFeedback({ type: null, show: false });
        setSelectedIdx(null);
      }, 1000);
    }
  };

  const handleNext = () => {
    playSound('click');
    setFeedback({ type: null, show: false });
    setSelectedIdx(null);
    setInputText('');
    setShowHint(false);
    if (view === 'AI_LAB') {
      setView('HOME');
      setAiQuestion(null);
    } else {
      setGameState(p => ({ ...p, currentLevel: p.currentLevel + 1 }));
    }
  };

  const changeView = (v: View) => {
    playSound('click');
    setView(v);
  };

  if (!isReady) return null;

  // Generic View Header
  const Header = ({ title, showBack = true }: { title: string, showBack?: boolean }) => (
    <div className="flex items-center justify-between p-6 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => changeView('HOME')} className="p-3 bg-white border border-slate-100 rounded-2xl active:scale-90 shadow-sm">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          <h2 className="font-black text-slate-800 tracking-tight leading-none">{title}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.brainScore}: {gameState.brainScore}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
        <Coins className="w-4 h-4 text-yellow-500 fill-current" />
        <span className="text-sm font-black text-yellow-700 tabular-nums">{gameState.coins}</span>
      </div>
    </div>
  );

  // Splash Screen
  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-10 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-2xl rounded-[3rem] flex items-center justify-center shadow-2xl mb-10 animate-bounce-slow border border-white/20">
            <Brain className="w-16 h-16 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          </div>
          <h1 className="text-6xl font-black mb-2 tracking-tighter italic bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">{t.appName}</h1>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] mb-16 opacity-80">{t.unlimited}</p>
          
          <button 
            onClick={() => changeView('HOME')} 
            className="w-full max-w-xs py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 hover:bg-blue-500 ring-4 ring-blue-600/20"
          >
            <Play className="w-6 h-6 fill-current" /> {t.play}
          </button>
        </div>
      </div>
    );
  }

  // Settings View
  if (view === 'SETTINGS') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title={t.settings} />
        <div className="p-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Globe className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-black text-slate-800">{t.language}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">{gameState.language === 'en' ? 'English' : 'हिंदी'}</p>
                </div>
              </div>
              <button 
                onClick={() => { playSound('click'); setGameState(p => ({ ...p, language: p.language === 'en' ? 'hi' : 'en' })); }}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-90"
              >
                Toggle
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">{gameState.soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}</div>
                <div>
                  <h3 className="font-black text-slate-800">{t.sound}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">{gameState.soundEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <button 
                onClick={() => { playSound('click'); setGameState(p => ({ ...p, soundEnabled: !p.soundEnabled })); }}
                className={`px-6 py-3 rounded-2xl font-black text-sm active:scale-90 ${gameState.soundEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {gameState.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => { if(confirm("Are you sure? This will wipe all coins and levels.")) { playSound('click'); setGameState(INITIAL_STATE); setView('SPLASH'); }}}
                className="w-full py-5 bg-rose-50 text-rose-600 rounded-2xl font-black flex items-center justify-center gap-3 border border-rose-100 hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-5 h-5" /> {t.reset}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => changeView('ABOUT')} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95">
              <Info className="w-6 h-6 text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase">{t.about}</span>
            </button>
            <button onClick={() => changeView('LEVELS')} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95">
              <LayoutGrid className="w-6 h-6 text-blue-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase">{t.levels}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // About & Privacy View
  if (view === 'ABOUT') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
        <Header title={t.about} />
        <div className="p-8 space-y-6 pb-20">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-800">{t.privacyPolicy}</h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line font-medium">
              {t.privacyContent}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <FileText className="w-8 h-8 text-blue-500" />
              <h3 className="text-xl font-black text-slate-800">{t.termsOfService}</h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line font-medium">
              {t.termsContent}
            </p>
          </div>

          <div className="p-8 text-center text-[10px] text-slate-300 font-black uppercase tracking-widest">
            {t.appName} &copy; 2024 Stable Release
          </div>
        </div>
      </div>
    );
  }

  // Home Screen
  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-500">
        <div className="p-8 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white font-black shadow-xl ring-4 ring-white">BT</div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.welcome}</p>
              <p className="font-black text-slate-800">{gameState.user?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => changeView('SETTINGS')} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
              <Settings className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-8 pb-10">
           {/* Daily Bonus Card */}
           {canClaimBonus && (
             <div className="w-full mb-6 bg-amber-50 border border-amber-200 rounded-[2.5rem] p-6 flex items-center justify-between animate-in zoom-in">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Gift className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t.dailyBonus}</p>
                      <p className="font-bold text-amber-900 text-xs">Claim your daily 50 coins!</p>
                   </div>
                </div>
                <button 
                  onClick={handleClaimBonus}
                  className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-md active:scale-90"
                >
                  {t.getBonus.split(' ')[0]}
                </button>
             </div>
           )}

           <div className="w-full bg-white border border-slate-100 rounded-[4rem] p-10 shadow-2xl shadow-slate-200 mb-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.brainScore}</p>
              <h3 className="text-8xl font-black text-slate-900 mb-6 tracking-tighter tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-tighter">
                <Sparkles className="w-4 h-4" /> {t.level} {gameState.currentLevel}
              </div>
           </div>

           <div className="w-full max-w-xs space-y-4">
              <button 
                onClick={() => changeView('PLAY')} 
                className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-black ring-4 ring-slate-900/10"
              >
                <Play className="w-6 h-6 fill-blue-400 text-blue-400" /> {t.play}
              </button>

              <button 
                onClick={() => { changeView('AI_LAB'); generateAIChallenge(); }} 
                className="w-full py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 active:scale-95 shadow-xl hover:bg-indigo-700 ring-4 ring-indigo-600/10"
              >
                <Zap className="w-6 h-6 fill-amber-400 text-amber-400" /> AI Challenge Lab
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <Coins className="w-5 h-5 text-yellow-500 mb-1" />
                  <span className="text-sm font-black text-slate-700">{gameState.coins}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase">{t.coins}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
                  <span className="text-sm font-black text-slate-700">{gameState.completedLevels.length}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase">{t.completed}</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Level Selection
  if (view === 'LEVELS') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title={t.levels} />
        <div className="p-8 grid grid-cols-4 gap-4 overflow-y-auto pb-20">
          {QUESTIONS.map((q, i) => {
            const isUnlocked = i + 1 <= gameState.currentLevel;
            const isDone = gameState.completedLevels.includes(q.id);
            return (
              <button 
                key={q.id}
                disabled={!isUnlocked}
                onClick={() => { playSound('click'); setGameState(p => ({ ...p, currentLevel: i + 1 })); setView('PLAY'); }}
                className={`aspect-square rounded-2xl flex items-center justify-center font-black text-lg border-2 transition-all active:scale-90 shadow-sm ${
                  isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 
                  isUnlocked ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-100 border-slate-100 text-slate-300'
                }`}
              >
                {isUnlocked ? i + 1 : <X className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Game Logic Rendering (Play & AI Lab)
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden relative">
      <Header title={view === 'AI_LAB' ? "AI Lab" : `${t.level} ${gameState.currentLevel}`} />
      
      {isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="relative w-28 h-28 mb-10">
            <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-12 h-12 text-slate-200 animate-pulse" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight italic">AI Thinking...</h3>
          <p className="text-slate-400 text-sm mt-3 font-bold uppercase tracking-widest opacity-60">Consulting Digital Neurons</p>
        </div>
      ) : (
        <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full overflow-y-auto pb-40">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 mb-8 flex flex-col items-center text-center relative overflow-hidden ring-4 ring-white">
              {currentQ.isAI && (
                <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black border border-indigo-100 uppercase tracking-tighter flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> Generative
                </div>
              )}
              {currentQ.imageUrl && (
                <div className="mb-8 w-full h-56 rounded-[2.5rem] overflow-hidden bg-slate-50 shadow-inner group ring-4 ring-slate-50">
                  <img src={currentQ.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Puzzle task" />
                </div>
              )}
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight px-2">
                {currentQ.prompt[gameState.language] || currentQ.prompt.en}
              </h3>
          </div>

          <div className="space-y-4">
              {currentQ.type === 'FILL_BLANKS' ? (
                <div className="relative group">
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder={gameState.language === 'hi' ? "यहां लिखें..." : "Enter text..."} 
                    className="w-full p-7 rounded-[2.5rem] bg-white border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-2xl shadow-xl transition-all placeholder:text-slate-200" 
                  />
                  <button 
                    onClick={() => handleAnswer(inputText)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 text-white rounded-full active:scale-90 shadow-lg flex items-center justify-center transition-all hover:bg-indigo-700"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                (currentQ.options?.[gameState.language] || currentQ.options?.en || []).map((opt, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAnswer(idx)} 
                    className={`w-full p-7 rounded-[2.5rem] font-black text-xl text-left shadow-lg border-2 transition-all active:scale-95 flex items-center justify-between group ${selectedIdx === idx ? (idx === currentQ.answer ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white animate-shake') : 'bg-white border-slate-100 text-slate-700 hover:border-blue-100'}`}
                  >
                    <span className="flex-1 pr-4">{opt}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] border transition-colors ${selectedIdx === idx ? 'bg-white/20 border-white/40' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:border-blue-200'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                  </button>
                ))
              )}
          </div>

          <div className="mt-20 p-6 flex gap-4 max-w-md w-full mx-auto fixed bottom-0 left-0 right-0 z-20 bg-slate-50/80 backdrop-blur-md">
              <button 
                onClick={() => {
                  playSound('click');
                  if(!showHint && gameState.coins >= 5) {
                    setShowHint(true);
                    setGameState(p => ({ ...p, coins: p.coins - 5 }));
                  } else if(!showHint) {
                    alert(t.notEnoughCoins);
                  } else {
                    setShowHint(false);
                  }
                }} 
                className={`w-20 h-20 flex flex-col items-center justify-center rounded-[2.2rem] font-black shadow-xl active:scale-95 transition-all ${showHint ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-500' : 'bg-white text-slate-300 border border-slate-100'}`}
              >
                <Lightbulb className={`w-7 h-7 ${showHint ? 'fill-current' : ''}`} />
                <span className="text-[9px] mt-1 uppercase tracking-widest">{t.hint}</span>
              </button>

              {feedback.show && feedback.type === 'correct' ? (
                <button 
                  onClick={handleNext} 
                  className="flex-1 py-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-3 animate-in slide-in-from-bottom"
                >
                  <Sparkles className="w-6 h-6" /> {t.next}
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white border border-slate-100 rounded-[2.5rem] text-slate-300 font-black italic tracking-tighter shadow-sm">
                  {t.disclaimer.split(':')[0]}
                </div>
              )}
          </div>

          {showHint && (
            <div className="mt-8 p-8 bg-blue-50/50 border-2 border-blue-100 border-dashed rounded-[2.5rem] text-blue-900 font-bold animate-in zoom-in duration-300 shadow-inner relative">
              <div className="absolute top-[-10px] left-8 px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm">{t.hint}</div>
              {currentQ.hint[gameState.language] || currentQ.hint.en}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
