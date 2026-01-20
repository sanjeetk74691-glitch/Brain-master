
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Play, 
  ChevronLeft, 
  Lightbulb, 
  Coins, 
  X, 
  Globe, 
  RotateCcw,
  CheckCircle2,
  Brain,
  Zap,
  Sparkles,
  Key,
  Trophy,
  Send,
  LayoutGrid,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, View, Question } from './types';
import { QUESTIONS } from './constants/questions';

const STORAGE_KEY = 'brain_test_v10_prod';

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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; show: boolean }>({ type: 'correct', show: false });
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const startup = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setGameState(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) {}
      }
      setShuffledQuestions([...QUESTIONS].sort(() => Math.random() - 0.5));

      // Check key availability
      let keyOk = !!process.env.API_KEY;
      if (window.aistudio) {
        try {
          const bridge = await window.aistudio.hasSelectedApiKey();
          keyOk = keyOk || bridge;
        } catch (e) {}
      }
      setHasApiKey(keyOk);
      setIsReady(true);
    };
    startup();
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState, isReady]);

  const handleKeyAuth = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      if (view === 'SPLASH') setView('HOME');
    } else {
      alert("Please configure your API_KEY in Vercel Environment Variables.");
    }
  };

  const generateAIQuest = async () => {
    if (gameState.coins < 25) {
      alert("Synthesis needs 25 coins!");
      return;
    }

    setIsGenerating(true);
    setAiQuestion(null);
    setSelectedIdx(null);
    setInputText('');
    setFeedback({ ...feedback, show: false });
    setShowHint(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const types = ['MCQ', 'LOGIC', 'IMAGE_MCQ', 'FILL_BLANKS'];
      const qType = types[Math.floor(Math.random() * types.length)];

      const logicRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a tricky brain teaser.
        Type: ${qType}. Lateral thinking only.
        Return JSON:
        {
          "type": "${qType}",
          "prompt": { "en": "Question?", "hi": "सवाल?" },
          "options": { "en": ["A", "B", "C", "D"], "hi": ["क", "ख", "ग", "घ"] },
          "answer": 0,
          "hint": { "en": "Clue", "hi": "संकेत" }
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

      const data = JSON.parse(logicRes.text || '{}');
      let newQ: Question = { ...data, id: `ai_${Date.now()}`, isAI: true, answer: data.answer || 0 };

      if (qType === 'IMAGE_MCQ') {
        const imgRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `A clean minimalist 2D art representing: ${data.prompt.en}` }] },
        });
        const part = imgRes.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) newQ.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }

      setAiQuestion(newQ);
      setGameState(p => ({ ...p, coins: p.coins - 25 }));
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("entity was not found")) {
        setHasApiKey(false);
        alert("API Link Failed. Please re-authorize.");
      } else {
        alert("Neural lab offline. Try again soon!");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const idx = (gameState.currentLevel - 1) % (shuffledQuestions.length || 1);
    return shuffledQuestions[idx] || QUESTIONS[0];
  }, [gameState.currentLevel, shuffledQuestions, view, aiQuestion]);

  if (!isReady) return null;

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 text-white p-10 text-center animate-in fade-in">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-12 animate-bounce">
          <Brain className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black mb-2 tracking-tighter italic">Brain Test AI</h1>
        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.5em] mb-16 opacity-80">Neural Infrastructure Active</p>
        <div className="w-full max-w-xs space-y-4">
          {!hasApiKey ? (
            <button onClick={handleKeyAuth} className="w-full py-6 bg-white text-blue-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3">
              <Key className="w-6 h-6" /> Activate AI
            </button>
          ) : (
            <button onClick={() => setView('HOME')} className="w-full py-6 bg-white text-blue-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3">
              <Play className="w-6 h-6 fill-current" /> Start Quest
            </button>
          )}
        </div>
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
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">AI</div>
            <p className="font-black text-gray-800">{gameState.user?.name}</p>
          </div>
          <button onClick={() => setGameState(p => ({...p, language: p.language === 'en' ? 'hi' : 'en'}))} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm"><Globe className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center px-10">
           <div className="w-full bg-white border border-gray-100 rounded-[4rem] p-12 shadow-2xl shadow-blue-100/10 mb-14 text-center relative overflow-hidden group">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Neural Score</p>
              <h3 className="text-8xl font-black text-blue-600 mb-8 tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100"><Sparkles className="w-4 h-4" /> GEMINI 3 PRO READY</div>
           </div>
           <div className="w-full max-w-xs space-y-4">
              <button onClick={() => { setView('AI_LAB'); generateAIQuest(); }} disabled={!hasApiKey} className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 transition-all ${hasApiKey ? 'bg-blue-600 text-white active:scale-95' : 'bg-gray-100 text-gray-400'}`}><Zap className="w-7 h-7 fill-current" />Random AI Test</button>
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

  // Classic Quest UI (Shared logic placeholder)
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto pb-32">
      <HUD title={`Level ${gameState.currentLevel}`} />
      <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full">
         <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 mb-8 flex flex-col items-center text-center">
            {currentQ.imageUrl && <div className="mb-8 w-full h-64 rounded-3xl overflow-hidden bg-gray-50"><img src={currentQ.imageUrl} className="w-full h-full object-cover" /></div>}
            <h3 className="text-3xl font-black text-gray-800 tracking-tighter leading-tight">{currentQ.prompt[gameState.language] || currentQ.prompt.en}</h3>
         </div>
         <div className="grid grid-cols-1 gap-4">
            {(currentQ.options?.[gameState.language] || currentQ.options?.en || []).map((opt, idx) => (
              <button key={idx} onClick={() => {
                if (idx === currentQ.answer) {
                  setGameState(p => ({ ...p, currentLevel: p.currentLevel + 1, brainScore: p.brainScore + 20, coins: p.coins + 10 }));
                  alert("Correct!");
                } else {
                  alert("Try again!");
                }
              }} className="p-6 bg-white border-2 border-gray-100 rounded-[2rem] font-black text-xl text-left active:scale-95 shadow-lg">{opt}</button>
            ))}
         </div>
         <div className="fixed bottom-10 left-0 right-0 p-10 flex gap-4 max-w-md mx-auto">
            <button onClick={() => setShowHint(!showHint)} className="flex-1 py-5 bg-yellow-400 text-yellow-900 rounded-[2rem] font-black shadow-xl"><Lightbulb className="w-6 h-6 mx-auto" /></button>
            <button onClick={() => setView('HOME')} className="flex-[3] py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl">Back to Menu</button>
         </div>
         {showHint && <div className="mt-4 p-6 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 font-bold animate-in zoom-in">{currentQ.hint[gameState.language] || currentQ.hint.en}</div>}
      </div>
    </div>
  );
}
