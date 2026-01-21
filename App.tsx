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
  Loader2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, View, Question } from './types';
import { QUESTIONS } from './constants/questions';

const STORAGE_KEY = 'brain_test_lite_v4_stable';

const INITIAL_STATE: GameState = {
  user: { name: "Explorer", email: "", photo: null },
  coins: 550,
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; show: boolean }>({ type: 'correct', show: false });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          setGameState(prev => ({ ...prev, ...parsed })); 
        } catch (e) {
          console.error("Failed to load save", e);
        }
      }
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState, isReady]);

  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const idx = (gameState.currentLevel - 1) % (QUESTIONS.length || 1);
    return QUESTIONS[idx] || QUESTIONS[0];
  }, [gameState.currentLevel, view, aiQuestion]);

  const generateAIQuestion = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("AI Connection Failed: API Key not found. Please set your Gemini API key.");
      return;
    }

    setIsAiLoading(true);
    setAiQuestion(null);
    setSelectedIdx(null);
    setInputText('');
    setShowHint(false);
    setFeedback({ type: 'correct', show: false });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Create a tricky lateral thinking brain teaser. Return it as a JSON object with properties: type (MCQ or FILL_BLANKS), prompt (object with en and hi keys), options (object with en and hi keys, if MCQ), answer (index if MCQ, string if FILL_BLANKS), hint (object with en and hi keys).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              prompt: {
                type: Type.OBJECT,
                properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } }
              },
              options: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hi: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              answer: { type: Type.NUMBER },
              hint: {
                type: Type.OBJECT,
                properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } }
              }
            },
            required: ["type", "prompt", "answer", "hint"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setAiQuestion({ ...data, id: `ai_${Date.now()}`, isAI: true });
      setView('AI_LAB');
    } catch (error) {
      console.error("AI Error:", error);
      alert("AI took too long. Check your internet or API key!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnswer = (idx: number | string) => {
    if (selectedIdx !== null || feedback.show) return;
    
    const isCorrect = idx === currentQ.answer || 
      (currentQ.type === 'FILL_BLANKS' && idx.toString().toLowerCase().trim() === currentQ.answer.toString().toLowerCase().trim());
    
    if (typeof idx === 'number') setSelectedIdx(idx);

    if (isCorrect) {
      setFeedback({ type: 'correct', show: true });
      setGameState(p => ({
        ...p,
        coins: p.coins + 20,
        brainScore: p.brainScore + 25,
        completedLevels: Array.from(new Set([...p.completedLevels, currentQ.id]))
      }));
    } else {
      setFeedback({ type: 'wrong', show: true });
      setTimeout(() => {
        setFeedback(f => ({ ...f, show: false }));
        setSelectedIdx(null);
      }, 1200);
    }
  };

  const handleNext = () => {
    setFeedback({ ...feedback, show: false });
    setSelectedIdx(null);
    setInputText('');
    setShowHint(false);
    
    if (view === 'AI_LAB') {
      generateAIQuestion();
    } else {
      setGameState(p => ({ ...p, currentLevel: p.currentLevel + 1 }));
    }
  };

  if (!isReady) return null;

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 text-white p-8 text-center overflow-hidden">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-bounce">
          <Brain className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-4xl font-black mb-1 tracking-tighter italic">Brain Test</h1>
        <p className="text-blue-200 text-[8px] font-black uppercase tracking-[0.4em] mb-12 opacity-80">MOBILE SMOOTH v4.0</p>
        <button onClick={() => setView('HOME')} className="w-full max-w-[240px] py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3">
          <Play className="w-5 h-5 fill-current" /> Start Game
        </button>
      </div>
    );
  }

  const HUD = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-50">
      <button onClick={() => setView('HOME')} className="p-2 bg-gray-50 rounded-xl active:scale-90 border border-gray-100"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
      <div className="text-center">
        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-center gap-1 justify-center">
          <Brain className="w-3 h-3 text-gray-800" />
          <span className="font-black text-gray-900 text-xs">IQ {gameState.brainScore}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-xl border border-yellow-100">
        <Coins className="w-3.5 h-3.5 text-yellow-500 fill-current" />
        <span className="text-[11px] font-black text-yellow-800">{gameState.coins}</span>
      </div>
    </div>
  );

  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 animate-in slide-in-from-bottom duration-500">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg text-sm">BT</div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase">Explorer</p>
              <p className="font-black text-gray-800 text-base leading-none">Ready?</p>
            </div>
          </div>
          <button onClick={() => setView('SETTINGS')} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm active:scale-90">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center px-6">
           <div className="w-full bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl mb-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5"><Brain className="w-24 h-24 text-blue-600" /></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Brain Score</p>
              <h3 className="text-7xl font-black text-blue-600 mb-4 tracking-tighter tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black border border-blue-100 uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Level {gameState.currentLevel}
              </div>
           </div>
           
           <div className="w-full max-w-xs space-y-3">
              <button onClick={() => setView('PLAY')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                Continue Quest
              </button>

              <button onClick={generateAIQuestion} disabled={isAiLoading} className="w-full py-5 bg-indigo-900 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />}
                AI Lab
              </button>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setView('LEVELS')} className="py-4 bg-white border border-gray-100 rounded-xl flex flex-col items-center gap-1 active:scale-95 shadow-sm">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-base font-black text-gray-800">{gameState.coins}</span>
                 </button>
                 <button onClick={() => setView('LEVELS')} className="py-4 bg-white border border-gray-100 rounded-xl flex flex-col items-center gap-1 active:scale-95 shadow-sm">
                  <LayoutGrid className="w-5 h-5 text-orange-400" />
                  <span className="text-[8px] font-black text-gray-400 uppercase">All Levels</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      <HUD title={view === 'AI_LAB' ? "AI Lab" : `Level ${gameState.currentLevel}`} />
      
      <div className="p-4 flex-1 flex flex-col max-w-md mx-auto w-full">
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-4 flex flex-col items-center text-center relative transition-all">
            {currentQ.isAI && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[7px] font-black">
                <Zap className="w-2.5 h-2.5 fill-current" /> AI
              </div>
            )}
            {currentQ.imageUrl && (
              <div className="mb-4 w-full h-48 rounded-2xl overflow-hidden bg-gray-50 ring-2 ring-blue-50">
                <img src={currentQ.imageUrl} className="w-full h-full object-cover" alt="Puzzle" />
              </div>
            )}
            <h3 className="text-lg md:text-xl font-black text-gray-800 tracking-tight leading-snug">
              {currentQ.prompt[gameState.language] || currentQ.prompt.en}
            </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 px-1">
            {currentQ.type === 'FILL_BLANKS' ? (
              <div className="relative">
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  placeholder="Answer here..." 
                  className="w-full p-5 rounded-2xl bg-white border-2 border-gray-100 focus:border-blue-500 outline-none font-black text-lg shadow-md" 
                />
                <button 
                  onClick={() => handleAnswer(inputText)} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3.5 bg-blue-600 text-white rounded-xl active:scale-90 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            ) : (
              (currentQ.options?.[gameState.language] || currentQ.options?.en || []).map((opt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleAnswer(idx)} 
                  className={`p-4 rounded-2xl font-black text-sm md:text-base text-left active:scale-98 shadow-sm border-2 transition-all duration-200 ${selectedIdx === idx ? (idx === currentQ.answer ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white animate-shake') : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200'}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${selectedIdx === idx ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</span>
                    {opt}
                  </span>
                </button>
              ))
            )}
        </div>

        {showHint && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 text-xs font-bold animate-in zoom-in duration-300">
            💡 {currentQ.hint[gameState.language] || currentQ.hint.en}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+var(--safe-area-inset-bottom))] bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 max-w-md mx-auto z-40">
          <button 
            onClick={() => setShowHint(!showHint)} 
            className="w-16 h-16 bg-yellow-400 text-yellow-900 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Lightbulb className="w-6 h-6" />
          </button>
          {feedback.show && feedback.type === 'correct' ? (
            <button 
              onClick={handleNext} 
              className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black text-base shadow-lg active:scale-95 flex items-center justify-center gap-2 animate-bounce"
            >
              <Sparkles className="w-5 h-5" /> Next Challenge
            </button>
          ) : (
            <button 
              onClick={() => setView('HOME')} 
              className="flex-1 h-16 bg-gray-900 text-white rounded-2xl font-black text-base shadow-lg active:scale-95"
            >
              Menu
            </button>
          )}
      </div>
    </div>
  );
}