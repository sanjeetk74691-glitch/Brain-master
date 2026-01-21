
import React, { useState, useEffect, useMemo } from 'react';
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
  Trophy
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, View, Question } from './types';
import { QUESTIONS } from './constants/questions';

const STORAGE_KEY = 'brain_test_lite_v2';

const INITIAL_STATE: GameState = {
  user: { name: "Player One", email: "", photo: null },
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

  // Init and Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setGameState(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) {}
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState, isReady]);

  // Current Logic
  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const idx = (gameState.currentLevel - 1) % (QUESTIONS.length || 1);
    return QUESTIONS[idx] || QUESTIONS[0];
  }, [gameState.currentLevel, view, aiQuestion]);

  // AI Generation
  const generateAIChallenge = async () => {
    if (gameState.coins < 50) {
      alert(gameState.language === 'hi' ? "सिक्के कम हैं!" : "Not enough coins!");
      return;
    }

    setIsGenerating(true);
    setAiQuestion(null);
    setFeedback({ type: null, show: false });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a tricky lateral thinking riddle for a brain puzzle game. 
        It must be clever and have a one-word answer.
        Return strictly valid JSON:
        {
          "type": "FILL_BLANKS",
          "prompt": { "en": "English question", "hi": "Hindi question" },
          "answer": "oneword",
          "hint": { "en": "Clue", "hi": "संकेत" }
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              prompt: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } },
              answer: { type: Type.STRING },
              hint: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } }
            },
            required: ["prompt", "answer", "hint"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setAiQuestion({ ...data, id: `ai_${Date.now()}`, isAI: true });
      setGameState(p => ({ ...p, coins: p.coins - 50 }));
    } catch (err) {
      console.error(err);
      alert("AI Lab unreachable. Try classic mode!");
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
      setFeedback({ type: 'correct', show: true });
      setGameState(p => ({
        ...p,
        coins: p.coins + 20,
        brainScore: p.brainScore + (currentQ.isAI ? 50 : 15),
        completedLevels: Array.from(new Set([...p.completedLevels, currentQ.id]))
      }));
    } else {
      setFeedback({ type: 'wrong', show: true });
      setTimeout(() => {
        setFeedback({ type: null, show: false });
        setSelectedIdx(null);
      }, 1000);
    }
  };

  const handleNext = () => {
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

  if (!isReady) return null;

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 text-center">
        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-[3rem] flex items-center justify-center shadow-2xl mb-12 animate-bounce-slow border border-white/30">
          <Brain className="w-16 h-16 text-white drop-shadow-lg" />
        </div>
        <h1 className="text-6xl font-black mb-4 tracking-tighter italic drop-shadow-md">Brain Test</h1>
        <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.6em] mb-16 opacity-80">PROD EDITION 1.5</p>
        <button 
          onClick={() => setView('HOME')} 
          className="w-full max-w-xs py-6 bg-white text-blue-700 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 hover:bg-blue-50"
        >
          <Play className="w-6 h-6 fill-current" /> Start Quest
        </button>
      </div>
    );
  }

  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
      <button onClick={() => setView('HOME')} className="p-3 bg-slate-50 rounded-2xl active:scale-90 border border-slate-100 shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
      <div className="text-center">
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-center gap-1.5 justify-center mt-0.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-black text-slate-800 text-sm tracking-tight">{gameState.brainScore} pts</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50/50 rounded-2xl border border-yellow-100/50">
        <Coins className="w-4 h-4 text-yellow-500 fill-current" />
        <span className="text-xs font-black text-yellow-800 tabular-nums">{gameState.coins}</span>
      </div>
    </div>
  );

  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-500">
        <div className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-xl ring-4 ring-white">AI</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Player Profile</p>
              <p className="font-black text-slate-800 text-lg">{gameState.user?.name}</p>
            </div>
          </div>
          <button 
            onClick={() => setGameState(p => ({...p, language: p.language === 'en' ? 'hi' : 'en'}))} 
            className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Globe className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-8">
           <div className="w-full bg-white border border-slate-100 rounded-[4rem] p-12 shadow-2xl shadow-indigo-200/20 mb-14 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-30"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Mastery IQ</p>
              <h3 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-700 mb-8 tracking-tighter tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black border border-blue-100 uppercase tracking-tighter">
                <Sparkles className="w-4 h-4" /> Level {gameState.currentLevel} Expert
              </div>
           </div>

           <div className="w-full max-w-xs space-y-4">
              <button 
                onClick={() => { setView('AI_LAB'); generateAIChallenge(); }} 
                className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-indigo-700"
              >
                <Zap className="w-7 h-7 fill-amber-400 text-amber-400" /> AI Challenge Lab
              </button>
              <button 
                onClick={() => setView('PLAY')} 
                className="w-full py-5 bg-white border-2 border-slate-100 text-slate-700 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 active:scale-95 shadow-sm hover:border-blue-100"
              >
                Classic Mode
              </button>
              <div className="grid grid-cols-2 gap-4">
                 <button className="py-5 bg-white border border-slate-200 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-sm opacity-60">
                  <LayoutGrid className="w-6 h-6 text-orange-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Levels</span>
                 </button>
                 <button className="py-5 bg-white border border-slate-200 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-sm" onClick={() => { if(confirm("Reset all progress?")) setGameState(INITIAL_STATE) }}>
                  <RotateCcw className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Reset</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden relative">
      <Header title={view === 'AI_LAB' ? "AI Lab Challenge" : `Puzzle Level ${gameState.currentLevel}`} />
      
      {isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-10 h-10 text-indigo-200 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 italic tracking-tight">AI Thinking...</h3>
          <p className="text-slate-400 text-sm mt-2 font-medium">Brewing a master riddle</p>
        </div>
      ) : (
        <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full overflow-y-auto">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-slate-200 border border-slate-100 mb-10 flex flex-col items-center text-center relative overflow-hidden">
              {currentQ.isAI && <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-500 rounded-full text-[9px] font-black border border-indigo-100 uppercase tracking-tighter"><Zap className="w-3 h-3 fill-current" /> AI Gen</div>}
              {currentQ.imageUrl && (
                <div className="mb-10 w-full h-56 rounded-[2.5rem] overflow-hidden bg-slate-50 ring-8 ring-slate-50 shadow-inner">
                  <img src={currentQ.imageUrl} className="w-full h-full object-cover" alt="Brain puzzle" />
                </div>
              )}
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-[1.2]">
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
                    placeholder={gameState.language === 'hi' ? "उत्तर टाइप करें..." : "Type answer..."} 
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
                    className={`w-full p-7 rounded-[2.5rem] font-black text-xl text-left shadow-xl border-2 transition-all active:scale-95 ${selectedIdx === idx ? (idx === currentQ.answer ? 'bg-emerald-500 border-emerald-600 text-white scale-[1.02]' : 'bg-rose-500 border-rose-600 text-white animate-shake') : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${selectedIdx === idx ? 'border-white/50 bg-white/20' : 'border-slate-100 bg-slate-50'}`}>{String.fromCharCode(65 + idx)}</span>
                      {opt}
                    </div>
                  </button>
                ))
              )}
          </div>

          <div className="mt-20 p-6 flex gap-4">
              <button 
                onClick={() => setShowHint(!showHint)} 
                className={`w-18 h-18 flex flex-col items-center justify-center rounded-[2rem] font-black shadow-xl active:scale-95 transition-all ${showHint ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' : 'bg-white text-slate-400 border border-slate-100'}`}
              >
                <Lightbulb className={`w-6 h-6 ${showHint ? 'fill-current' : ''}`} />
                <span className="text-[9px] mt-1 uppercase tracking-tighter">Hint</span>
              </button>

              {feedback.show && feedback.type === 'correct' ? (
                <button 
                  onClick={handleNext} 
                  className="flex-1 py-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-3 animate-in slide-in-from-bottom"
                >
                  <Sparkles className="w-6 h-6" /> Continue
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center px-6 text-slate-300 font-bold italic tracking-tighter opacity-50">
                  Select your answer...
                </div>
              )}
          </div>

          {showHint && (
            <div className="mt-8 p-8 bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] text-indigo-900 font-bold animate-in zoom-in duration-300 shadow-inner">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Clue</p>
              {currentQ.hint[gameState.language] || currentQ.hint.en}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
