
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
  Gift,
  Image as ImageIcon
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

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (gameState.soundEnabled) {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [gameState.soundEnabled]);

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

  useEffect(() => {
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState, isReady]);

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

  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const idx = (gameState.currentLevel - 1) % (QUESTIONS.length || 1);
    return QUESTIONS[idx] || QUESTIONS[0];
  }, [gameState.currentLevel, view, aiQuestion]);

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
          "type": "MCQ",
          "prompt": { "en": "What month has to be broken before you can use it?", "hi": "इस्तेमाल करने से पहले क्या तोड़ना पड़ता है?" },
          "options": { "en": ["Egg", "Glass", "Mirror", "Promise"], "hi": ["अंडा", "ग्लास", "आईना", "वादा"] },
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

    let isCorrect = false;

    if (typeof val === 'number') {
      setSelectedIdx(val);
      // Logic for MCQ/LOGIC/IMAGE_MCQ
      if (typeof currentQ.answer === 'number') {
        isCorrect = val === currentQ.answer;
      } else {
        // Handle AI string answers in MCQ
        const optEn = currentQ.options?.en[val] || '';
        const optHi = currentQ.options?.hi[val] || '';
        const ans = currentQ.answer.toString().toLowerCase().trim();
        isCorrect = optEn.toLowerCase().trim() === ans || optHi.toLowerCase().trim() === ans;
      }
    } else {
      // Logic for FILL_BLANKS
      isCorrect = val.toString().toLowerCase().trim() === currentQ.answer.toString().toLowerCase().trim();
    }

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

  const Header = ({ title, showBack = true }: { title: string, showBack?: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={() => changeView('HOME')} className="p-2 bg-white border border-slate-100 rounded-xl active:scale-90">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          <h2 className="font-black text-slate-800 tracking-tight text-sm">{title}</h2>
          <div className="flex items-center gap-1 mt-0.5">
            <Trophy className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">{t.brainScore}: {gameState.brainScore}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
        <Coins className="w-3.5 h-3.5 text-yellow-500 fill-current" />
        <span className="text-xs font-black text-yellow-700 tabular-nums">{gameState.coins}</span>
      </div>
    </div>
  );

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-10 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl mb-10 animate-bounce-slow border border-white/20">
            <Brain className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter italic">{t.appName}</h1>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] mb-16 opacity-80">{t.unlimited}</p>
          
          <button 
            onClick={() => changeView('HOME')} 
            className="w-full max-w-xs py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all"
          >
            {t.play}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'SETTINGS') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title={t.settings} />
        <div className="p-6 space-y-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Globe className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{t.language}</h3>
                </div>
              </div>
              <button 
                onClick={() => { playSound('click'); setGameState(p => ({ ...p, language: p.language === 'en' ? 'hi' : 'en' })); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-xs"
              >
                {gameState.language === 'en' ? 'English' : 'हिंदी'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600">{gameState.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}</div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{t.sound}</h3>
                </div>
              </div>
              <button 
                onClick={() => { playSound('click'); setGameState(p => ({ ...p, soundEnabled: !p.soundEnabled })); }}
                className={`px-4 py-2 rounded-xl font-black text-xs ${gameState.soundEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {gameState.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <button 
              onClick={() => { if(confirm("Are you sure?")) { playSound('click'); setGameState(INITIAL_STATE); setView('SPLASH'); }}}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-black text-xs border border-rose-100"
            >
              {t.reset}
            </button>
          </div>
          <button onClick={() => changeView('ABOUT')} className="w-full py-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center gap-3 active:scale-95">
             <Info className="w-5 h-5 text-slate-400" />
             <span className="text-xs font-black text-slate-600 uppercase">{t.about}</span>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'ABOUT') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title={t.about} />
        <div className="p-6 flex-1 overflow-y-auto space-y-4 pb-20">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
             <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" /> Brain Test Lite
             </h3>
             <p className="text-xs text-slate-500 leading-relaxed">{t.aboutText}</p>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
             <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> {t.privacyPolicy}
             </h3>
             <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">{t.privacyContent}</p>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
             <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText className="w-5 h-5 text-amber-500" /> {t.termsOfService}
             </h3>
             <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">{t.termsContent}</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-500">
        <div className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg">BT</div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase">{t.welcome}</p>
              <p className="font-black text-slate-800 text-sm">Explorer</p>
            </div>
          </div>
          <button onClick={() => changeView('SETTINGS')} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-6 pb-6">
           {canClaimBonus && (
             <div className="w-full mb-4 bg-amber-50 border border-amber-200 rounded-[1.5rem] p-4 flex items-center justify-between animate-in zoom-in">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white shadow-md">
                      <Gift className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-amber-600 uppercase">{t.dailyBonus}</p>
                      <p className="font-bold text-amber-900 text-[10px]">Claim 50 coins!</p>
                   </div>
                </div>
                <button 
                  onClick={handleClaimBonus}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-[10px] shadow-sm active:scale-90"
                >
                  Claim
                </button>
             </div>
           )}

           <div className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200 mb-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{t.brainScore}</p>
              <h3 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black border border-blue-100 uppercase">
                <Sparkles className="w-3 h-3" /> {t.level} {gameState.currentLevel}
              </div>
           </div>

           <div className="w-full max-w-xs space-y-3">
              <button 
                onClick={() => changeView('PLAY')} 
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95"
              >
                <Play className="w-5 h-5 fill-blue-400 text-blue-400" /> {t.play}
              </button>

              <button 
                onClick={() => { changeView('AI_LAB'); generateAIChallenge(); }} 
                className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 active:scale-95"
              >
                <Zap className="w-5 h-5 fill-amber-400 text-amber-400" /> AI Challenge Lab
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <Coins className="w-4 h-4 text-yellow-500 mb-0.5" />
                  <span className="text-xs font-black text-slate-700">{gameState.coins}</span>
                </div>
                <button onClick={() => changeView('LEVELS')} className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <LayoutGrid className="w-4 h-4 text-blue-500 mb-0.5" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">{t.levels}</span>
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'LEVELS') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header title={t.levels} />
        <div className="p-4 grid grid-cols-5 gap-2 overflow-y-auto pb-20">
          {QUESTIONS.map((q, i) => {
            const isUnlocked = i + 1 <= gameState.currentLevel;
            const isDone = gameState.completedLevels.includes(q.id);
            return (
              <button 
                key={q.id}
                disabled={!isUnlocked}
                onClick={() => { playSound('click'); setGameState(p => ({ ...p, currentLevel: i + 1 })); setView('PLAY'); }}
                className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all active:scale-90 ${
                  isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 
                  isUnlocked ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-100 border-slate-100 text-slate-300'
                }`}
              >
                {isUnlocked ? i + 1 : <X className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden relative">
      <Header title={view === 'AI_LAB' ? "AI Lab" : `${t.level} ${gameState.currentLevel}`} />
      
      {isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight italic">AI Thinking...</h3>
        </div>
      ) : (
        <div className="p-4 flex-1 flex flex-col max-w-md mx-auto w-full overflow-y-auto pb-32">
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 mb-4 flex flex-col items-center text-center relative overflow-hidden">
              {currentQ.isAI ? (
                <div className="absolute top-3 right-3 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[7px] font-black border border-indigo-100 uppercase flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" /> AI
                </div>
              ) : currentQ.type === 'IMAGE_MCQ' && (
                <div className="absolute top-3 left-3 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[7px] font-black border border-blue-100 uppercase flex items-center gap-1">
                  <ImageIcon className="w-2.5 h-2.5" /> {t.visualQuest}
                </div>
              )}
              {currentQ.imageUrl && (
                <div className="mb-4 w-full h-40 rounded-[1.5rem] overflow-hidden bg-slate-50">
                  <img src={currentQ.imageUrl} className="w-full h-full object-cover" alt="Puzzle" />
                </div>
              )}
              <h3 className="text-lg font-black text-slate-800 leading-snug px-2">
                {currentQ.prompt[gameState.language] || currentQ.prompt.en}
              </h3>
          </div>

          <div className="space-y-3">
              {currentQ.type === 'FILL_BLANKS' ? (
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder={gameState.language === 'hi' ? "यहां लिखें..." : "Answer..."} 
                    className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-500 outline-none font-black text-lg shadow-md" 
                  />
                  <button 
                    onClick={() => handleAnswer(inputText)} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                (currentQ.options?.[gameState.language] || currentQ.options?.en || []).map((opt, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAnswer(idx)} 
                    className={`w-full p-4 rounded-2xl font-black text-sm text-left shadow-sm border-2 transition-all active:scale-98 flex items-center justify-between group ${selectedIdx === idx ? (idx === currentQ.answer || (currentQ.options?.en[idx] || '').toLowerCase() === currentQ.answer.toString().toLowerCase() || (currentQ.options?.hi[idx] || '').toLowerCase() === currentQ.answer.toString().toLowerCase() ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white animate-shake') : 'bg-white border-slate-100 text-slate-700'}`}
                  >
                    <span className="flex-1 pr-4">{opt}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] border ${selectedIdx === idx ? 'bg-white/20 border-white/40' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                  </button>
                ))
              )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-50/90 backdrop-blur-md flex gap-3 max-w-md mx-auto">
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
                className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl font-black shadow-lg transition-all ${showHint ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-500' : 'bg-white text-slate-300 border border-slate-100'}`}
              >
                <Lightbulb className={`w-5 h-5 ${showHint ? 'fill-current' : ''}`} />
                <span className="text-[7px] mt-0.5 uppercase tracking-widest">{t.hint}</span>
              </button>

              {feedback.show && feedback.type === 'correct' ? (
                <button 
                  onClick={handleNext} 
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> {t.next}
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-[9px] text-slate-300 font-black italic">
                  Level Goal: Think Outside the Box
                </div>
              )}
          </div>

          {showHint && (
            <div className="mt-4 p-4 bg-blue-50/50 border-2 border-blue-100 border-dashed rounded-2xl text-blue-900 text-xs font-bold animate-in zoom-in">
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 block mb-1">Hint</span>
              {currentQ.hint[gameState.language] || currentQ.hint.en}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
