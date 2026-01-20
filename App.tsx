
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Play, 
  ChevronLeft, 
  Lightbulb, 
  Coins, 
  Globe, 
  Brain,
  Zap,
  Sparkles,
  Key,
  LayoutGrid,
  Send
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, View, Question } from './types';
import { QUESTIONS } from './constants/questions';

const STORAGE_KEY = 'brain_test_prod_v12';

const INITIAL_STATE: GameState = {
  user: { name: "Player", email: "", photo: null },
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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; show: boolean }>({ type: 'correct', show: false });
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setGameState(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) {}
      }
      setShuffledQuestions([...QUESTIONS].sort(() => Math.random() - 0.5));

      const keyAvailable = !!process.env.API_KEY;
      setHasApiKey(keyAvailable);
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState, isReady]);

  const generateAIQuest = async () => {
    if (gameState.coins < 25) {
      alert("Need 25 coins for AI Lab!");
      return;
    }

    setIsGenerating(true);
    setAiQuestion(null);
    setSelectedIdx(null);
    setInputText('');
    setFeedback({ ...feedback, show: false });
    setShowHint(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const types = ['MCQ', 'FILL_BLANKS'];
      const qType = types[Math.floor(Math.random() * types.length)];

      const res = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a funny and tricky lateral thinking brain teaser. 
        Type: ${qType}. 
        Return strictly valid JSON:
        {
          "type": "${qType}",
          "prompt": { "en": "Question text", "hi": "हिंदी सवाल" },
          "options": { "en": ["A", "B", "C", "D"], "hi": ["क", "ख", "ग", "घ"] },
          "answer": 0,
          "hint": { "en": "Clue text", "hi": "संकेत" }
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              prompt: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } },
              options: { type: Type.OBJECT, properties: { en: { type: Type.ARRAY, items: { type: Type.STRING } }, hi: { type: Type.ARRAY, items: { type: Type.STRING } } } },
              answer: { type: Type.NUMBER },
              hint: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } }
            }
          }
        }
      });

      const data = JSON.parse(res.text || '{}');
      setAiQuestion({ ...data, id: `ai_${Date.now()}`, isAI: true });
      setGameState(p => ({ ...p, coins: p.coins - 25 }));
    } catch (err) {
      console.error(err);
      alert("AI Laboratory is busy. Playing local levels.");
      setView('PLAY');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const idx = (gameState.currentLevel - 1) % (shuffledQuestions.length || 1);
    return shuffledQuestions[idx] || QUESTIONS[0];
  }, [gameState.currentLevel, shuffledQuestions, view, aiQuestion]);

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
        completedLevels: [...p.completedLevels, currentQ.id]
      }));
    } else {
      setFeedback({ type: 'wrong', show: true });
      setTimeout(() => {
        setFeedback(f => ({ ...f, show: false }));
        setSelectedIdx(null);
      }, 1000);
    }
  };

  if (!isReady) return null;

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 text-white p-10 text-center">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-12 animate-bounce">
          <Brain className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black mb-2 tracking-tighter italic">Brain Test AI</h1>
        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.5em] mb-16 opacity-80">Stability Version 1.2</p>
        <button onClick={() => setView('HOME')} className="w-full max-w-xs py-6 bg-white text-blue-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3">
          <Play className="w-6 h-6 fill-current" /> Play Now
        </button>
      </div>
    );
  }

  const HUD = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100 sticky top-0 z-50">
      <button onClick={() => setView('HOME')} className="p-3 bg-gray-50 rounded-2xl active:scale-90 border border-gray-100"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
      <div className="text-center">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-center gap-2 justify-center"><Brain className="w-4 h-4 text-gray-800" /><span className="font-black text-gray-900 text-sm">IQ {gameState.brainScore}</span></div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-2xl border border-yellow-100">
        <Coins className="w-4 h-4 text-yellow-500 fill-current" /><span className="text-xs font-black text-yellow-800">{gameState.coins}</span>
      </div>
    </div>
  );

  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFDFF] animate-in slide-in-from-bottom duration-500">
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">BT</div>
            <p className="font-black text-gray-800">Hello, {gameState.user?.name}</p>
          </div>
          <button onClick={() => setGameState(p => ({...p, language: p.language === 'en' ? 'hi' : 'en'}))} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><Globe className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center px-10">
           <div className="w-full bg-white border border-gray-100 rounded-[3rem] p-12 shadow-2xl shadow-blue-100/10 mb-14 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Neural Maturity</p>
              <h3 className="text-8xl font-black text-blue-600 mb-6 tracking-tighter tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100"><Sparkles className="w-4 h-4" /> AI READY</div>
           </div>
           <div className="w-full max-w-xs space-y-4">
              <button onClick={() => { setView('AI_LAB'); generateAIQuest(); }} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"><Zap className="w-7 h-7 fill-current" /> AI Lab Mode</button>
              <button onClick={() => setView('PLAY')} className="w-full py-5 bg-white border-2 border-gray-100 text-gray-700 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 active:scale-95 shadow-sm">Classic Quest</button>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setView('LEVELS')} className="py-5 bg-white border border-gray-100 rounded-2xl flex flex-col items-center gap-2 active:scale-95 shadow-sm"><LayoutGrid className="w-6 h-6 text-orange-400" /><span className="text-[10px] font-black text-gray-400 uppercase">Levels</span></button>
                 <button onClick={() => setView('SETTINGS')} className="py-5 bg-white border border-gray-100 rounded-2xl flex flex-col items-center gap-2 active:scale-95 shadow-sm"><Settings className="w-6 h-6 text-gray-400" /><span className="text-[10px] font-black text-gray-400 uppercase">Settings</span></button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto pb-40">
      <HUD title={view === 'AI_LAB' ? "AI Lab" : `Level ${gameState.currentLevel}`} />
      
      {isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 border-[5px] border-blue-100 border-t-blue-600 rounded-full animate-spin mb-8"></div>
          <h3 className="text-xl font-black text-gray-800 italic">Thinking...</h3>
        </div>
      ) : (
        <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 mb-8 flex flex-col items-center text-center">
              {currentQ.imageUrl && <div className="mb-8 w-full h-64 rounded-3xl overflow-hidden bg-gray-50 ring-4 ring-blue-50"><img src={currentQ.imageUrl} className="w-full h-full object-cover" alt="Task" /></div>}
              <h3 className="text-2xl font-black text-gray-800 tracking-tighter leading-tight">{currentQ.prompt[gameState.language] || currentQ.prompt.en}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
              {currentQ.type === 'FILL_BLANKS' ? (
                <div className="relative">
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Answer..." className="w-full p-6 rounded-[2rem] bg-white border-2 border-gray-100 focus:border-blue-500 outline-none font-black text-xl shadow-lg" />
                  <button onClick={() => handleAnswer(inputText)} className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-blue-600 text-white rounded-full active:scale-90 shadow-lg"><Send className="w-5 h-5" /></button>
                </div>
              ) : (
                (currentQ.options?.[gameState.language] || currentQ.options?.en || []).map((opt, idx) => (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={`p-6 rounded-[2rem] font-black text-xl text-left active:scale-95 shadow-lg border-2 transition-all ${selectedIdx === idx ? (idx === currentQ.answer ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white animate-shake') : 'bg-white border-gray-100 text-gray-700 hover:border-blue-100'}`}>{opt}</button>
                ))
              )}
          </div>

          <div className="fixed bottom-10 left-0 right-0 p-10 flex gap-4 max-w-md mx-auto">
              <button onClick={() => setShowHint(!showHint)} className="flex-1 py-5 bg-yellow-400 text-yellow-900 rounded-[2rem] font-black shadow-xl active:scale-95"><Lightbulb className="w-6 h-6 mx-auto" /></button>
              {feedback.show && feedback.type === 'correct' ? (
                <button onClick={() => { setFeedback(f => ({ ...f, show: false })); setSelectedIdx(null); if (view === 'AI_LAB') { generateAIQuest(); } else { setGameState(p => ({ ...p, currentLevel: p.currentLevel + 1 })); } }} className="flex-[3] py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl active:scale-95 flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" /> Next Level</button>
              ) : (
                <button onClick={() => setView('HOME')} className="flex-[3] py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl active:scale-95">Main Menu</button>
              )}
          </div>
          {showHint && <div className="mt-4 p-6 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 font-bold animate-in zoom-in">{currentQ.hint[gameState.language] || currentQ.hint.en}</div>}
        </div>
      )}
    </div>
  );
}
