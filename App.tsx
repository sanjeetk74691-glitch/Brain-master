
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

const STORAGE_KEY = 'brain_test_v9_stable';

const INITIAL_STATE: GameState = {
  user: { name: "Explorer", email: "", photo: null },
  coins: 500, // Starting bonus
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

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setGameState(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) {}
      }

      setShuffledQuestions([...QUESTIONS].sort(() => Math.random() - 0.5));

      // Key check: Vercel env var or AI Studio Bridge
      let keyAvailable = !!process.env.API_KEY;
      if (window.aistudio) {
        try {
          const bridgeKey = await window.aistudio.hasSelectedApiKey();
          keyAvailable = keyAvailable || bridgeKey;
        } catch (e) {}
      }
      setHasApiKey(keyAvailable);
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState, isReady]);

  // --- AI LOGIC ---
  const handleKeyActivation = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      if (view === 'SPLASH') setView('HOME');
    } else {
      alert("Missing API_KEY! Please set it in your Vercel project environment variables.");
    }
  };

  const generateRandomAITest = async () => {
    if (gameState.coins < 25) {
      alert("AI Neural Synthesis costs 25 coins. Earn coins in Classic Quest!");
      return;
    }

    setIsGenerating(true);
    setAiQuestion(null);
    setSelectedIdx(null);
    setInputText('');
    setFeedback({ ...feedback, show: false });
    setShowHint(false);

    try {
      // Create fresh instance for latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const puzzleTypes = ['MCQ', 'LOGIC', 'IMAGE_MCQ', 'FILL_BLANKS'];
      const chosenType = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];

      // 1. Generate Logic with Gemini 3 Pro
      const logicResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a funny and tricky brain teaser.
        Type: ${chosenType}.
        Must be a lateral thinking puzzle.
        JSON format:
        {
          "type": "${chosenType}",
          "prompt": { "en": "Eng Question", "hi": "हिंदी सवाल" },
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

      const data = JSON.parse(logicResponse.text || '{}');
      let newQ: Question = {
        ...data,
        id: `ai_${Date.now()}`,
        isAI: true,
        answer: data.answer || 0
      };

      // 2. Add Visual modality for IMAGE_MCQ with Gemini 2.5 Flash
      if (chosenType === 'IMAGE_MCQ') {
        const visualResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `A clean, minimalist 2D cartoon style vector illustration of this riddle: ${data.prompt.en}` }] },
        });
        const imgPart = visualResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imgPart?.inlineData) {
          newQ.imageUrl = `data:image/png;base64,${imgPart.inlineData.data}`;
        }
      }

      setAiQuestion(newQ);
      setGameState(p => ({ ...p, coins: p.coins - 25 }));
    } catch (err: any) {
      console.error("Neural Error:", err);
      if (err.message?.includes("entity was not found")) {
        setHasApiKey(false);
        alert("API Link Broken. Please reconnect in settings.");
      } else {
        alert("Neural synthesis failed. AI brain is currently busy!");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResponse = (val: number | string) => {
    if (!currentQ || feedback.show || selectedIdx !== null) return;
    
    let isCorrect = false;
    if (currentQ.type === 'FILL_BLANKS') {
      isCorrect = val.toString().toLowerCase().trim() === currentQ.answer.toString().toLowerCase().trim();
    } else {
      isCorrect = val === currentQ.answer;
      setSelectedIdx(val as number);
    }

    if (isCorrect) {
      setFeedback({ type: 'correct', show: true });
      const pts = currentQ.isAI ? 50 : 20;
      setGameState(p => ({
        ...p,
        coins: p.coins + 30,
        brainScore: p.brainScore + pts,
        completedLevels: [...p.completedLevels, currentQ.id]
      }));
    } else {
      setFeedback({ type: 'wrong', show: true });
      setTimeout(() => {
        setFeedback(f => ({ ...f, show: false }));
        setSelectedIdx(null);
      }, 1500);
    }
  };

  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    const qIndex = (gameState.currentLevel - 1) % (shuffledQuestions.length || 1);
    return shuffledQuestions[qIndex] || QUESTIONS[0];
  }, [gameState.currentLevel, shuffledQuestions, view, aiQuestion]);

  // --- RENDERING ---

  if (!isReady) return null;

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 text-white p-10 text-center animate-in fade-in duration-500">
        <div className="w-28 h-28 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl mb-12 animate-bounce">
          <Brain className="w-14 h-14 text-blue-600" />
        </div>
        <h1 className="text-5xl font-black mb-2 tracking-tighter">Brain Test AI</h1>
        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.5em] mb-16 opacity-80">Universal Neural Engine</p>
        
        <div className="w-full max-w-xs space-y-4">
          {!hasApiKey ? (
            <button 
              onClick={handleKeyActivation} 
              className="w-full py-6 bg-white text-blue-600 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Key className="w-6 h-6" /> Activate AI Core
            </button>
          ) : (
            <button 
              onClick={() => setView('HOME')} 
              className="w-full py-6 bg-white text-blue-600 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> Start Quest
            </button>
          )}
          <div className="pt-6 flex flex-col items-center gap-2 opacity-60">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                {hasApiKey ? "Neural Link Active" : "Neural Link Offline"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const HUD = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <button onClick={() => setView('HOME')} className="p-3 bg-gray-50 rounded-2xl active:scale-90 transition-all border border-gray-100">
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>
      <div className="text-center">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">{title}</p>
        <div className="flex items-center gap-2 justify-center">
           <Brain className="w-4 h-4 text-gray-800" />
           <span className="font-black text-gray-900 text-sm tracking-tighter">IQ {gameState.brainScore}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-2xl border border-yellow-100">
        <Coins className="w-4 h-4 text-yellow-500 fill-current" />
        <span className="text-xs font-black text-yellow-800">{gameState.coins}</span>
      </div>
    </div>
  );

  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFDFF] animate-in slide-in-from-bottom duration-500">
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center text-white font-black shadow-2xl ring-4 ring-blue-50">AI</div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Intelligence Engine</p>
              <p className="text-base font-black text-gray-800">{gameState.user?.name}</p>
            </div>
          </div>
          <button 
            onClick={() => setGameState(p => ({...p, language: p.language === 'en' ? 'hi' : 'en'}))} 
            className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-90"
          >
            <Globe className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-10">
           <div className="w-full bg-white border border-gray-100 rounded-[4rem] p-12 shadow-2xl shadow-blue-100/20 mb-14 text-center relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 rotate-12">
                <Brain className="w-64 h-64 text-blue-600" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Neural Maturity</p>
              <h3 className="text-8xl font-black text-blue-600 mb-8 tracking-tighter tabular-nums">{gameState.brainScore}</h3>
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 ring-4 ring-white">
                 <Sparkles className="w-4 h-4" /> GEMINI 3 PRO ONLINE
              </div>
           </div>

           {!hasApiKey && (
             <button onClick={handleKeyActivation} className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-3 animate-pulse">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="text-xs font-black text-red-600 uppercase">Neural Link Broken - Reconnect</span>
             </button>
           )}

           <div className="w-full max-w-xs space-y-4">
              <button 
                onClick={() => { setView('AI_LAB'); generateRandomAITest(); }}
                disabled={!hasApiKey}
                className={`w-full py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 transition-all transform ${hasApiKey ? 'bg-blue-600 text-white shadow-blue-200 active:scale-95 hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <Zap className={`w-7 h-7 fill-current ${hasApiKey ? 'text-yellow-300' : ''}`} />
                Random AI Test
              </button>
              
              <button 
                onClick={() => setView('PLAY')}
                className="w-full py-5 bg-white border-2 border-gray-100 text-gray-700 rounded-[2.2rem] font-black text-lg flex items-center justify-center gap-4 active:scale-95 transition-all shadow-sm"
              >
                <Play fill="currentColor" className="w-5 h-5" />
                Classic Quest
              </button>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setView('LEVELS')} className="py-5 bg-white border border-gray-100 rounded-[2.2rem] flex flex-col items-center gap-2 active:scale-95 shadow-sm">
                    <LayoutGrid className="w-6 h-6 text-orange-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Levels</span>
                 </button>
                 <button onClick={() => setView('SETTINGS')} className="py-5 bg-white border border-gray-100 rounded-[2.2rem] flex flex-col items-center gap-2 active:scale-95 shadow-sm">
                    <Settings className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setup</span>
                 </button>
              </div>
           </div>
        </div>
        
        <div className="p-12 text-center opacity-40">
           <p className="text-[10px] text-gray-800 font-black uppercase tracking-[0.5em]">Vercel Optimized Engine v1.1</p>
        </div>
      </div>
    );
  }

  if (view === 'AI_LAB') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F9FBFF]">
        <HUD title="Neural Synthesis Lab" />
        
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-14">
               <div className="w-44 h-44 border-[10px] border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
               <div className="absolute inset-0 m-auto w-24 h-24 flex items-center justify-center">
                  <Brain className="w-14 h-14 text-blue-600 animate-pulse" />
               </div>
            </div>
            <h3 className="text-3xl font-black text-gray-800 tracking-tighter">AI Designing...</h3>
            <p className="text-gray-400 font-bold mt-4 uppercase text-[10px] tracking-[0.4em] animate-pulse">Computing Logic Matrix</p>
          </div>
        ) : aiQuestion ? (
          <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full animate-in zoom-in-95 duration-500 pb-32 overflow-y-auto">
             <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-blue-50 mb-10 relative flex flex-col items-center text-center overflow-hidden min-h-[380px] justify-center">
                <div className="absolute top-8 left-8 px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-tighter">Neural Challenge</div>
                
                <div className="w-full mt-12">
                   {aiQuestion.imageUrl && (
                     <div className="w-full aspect-square mb-10 rounded-[3.5rem] overflow-hidden shadow-inner border border-gray-100 bg-gray-50 ring-8 ring-blue-50/50">
                        <img src={aiQuestion.imageUrl} className="w-full h-full object-cover" alt="AI Logic Clue" />
                     </div>
                   )}
                   <h3 className="text-3xl font-black text-gray-800 leading-tight mb-4 px-2 tracking-tighter">
                     {aiQuestion.prompt[gameState.language] || aiQuestion.prompt.en}
                   </h3>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {aiQuestion.type === 'FILL_BLANKS' ? (
                  <div className="relative">
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Answer here..."
                      className="w-full p-8 rounded-[3rem] bg-white border-2 border-gray-100 focus:border-blue-500 outline-none font-black text-2xl shadow-xl transition-all"
                    />
                    <button onClick={() => handleResponse(inputText)} className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-blue-600 text-white rounded-[2rem] active:scale-90 shadow-2xl">
                       <Send className="w-7 h-7" />
                    </button>
                  </div>
                ) : (
                  (aiQuestion.options?.[gameState.language] || aiQuestion.options?.en || []).map((opt, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleResponse(idx)}
                      disabled={selectedIdx !== null}
                      className={`p-7 rounded-[3rem] font-black text-xl border-2 transition-all active:scale-95 text-left flex justify-between items-center group ${
                        selectedIdx === idx 
                          ? (idx === aiQuestion!.answer ? 'bg-green-500 border-green-600 text-white shadow-2xl' : 'bg-red-500 border-red-600 text-white animate-shake')
                          : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200 shadow-lg'
                      }`}
                    >
                      <span className="flex-1">{opt}</span>
                      {selectedIdx === idx && idx === aiQuestion!.answer && <CheckCircle2 className="w-8 h-8 shrink-0" />}
                    </button>
                  ))
                )}
             </div>

             <div className="fixed bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-[#F9FBFF] to-transparent flex gap-4 max-w-md mx-auto z-40">
                <button onClick={() => setShowHint(true)} className="flex-1 py-6 bg-white border-2 border-yellow-400 text-yellow-600 rounded-[2.5rem] font-black active:scale-95 shadow-xl flex items-center justify-center gap-3">
                   <Lightbulb className="w-6 h-6" /> Clue
                </button>
                <button onClick={generateRandomAITest} className="flex-1 py-6 bg-gray-900 text-white rounded-[2.5rem] font-black active:scale-95 shadow-xl flex items-center justify-center gap-3">
                   <RotateCcw className="w-6 h-6" /> New Test
                </button>
             </div>
          </div>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <AlertCircle className="w-20 h-20 text-red-300 mb-8" />
             <h3 className="text-2xl font-black text-gray-800 tracking-tighter">AI Node Error</h3>
             <button onClick={generateRandomAITest} className="mt-8 px-12 py-6 bg-blue-600 text-white rounded-[2.5rem] font-black shadow-2xl">Try Reconnecting</button>
           </div>
        )}

        {showHint && aiQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md" onClick={() => setShowHint(false)}>
             <div className="w-full max-w-sm bg-white rounded-[4.5rem] p-14 text-center shadow-2xl animate-in zoom-in" onClick={e => e.stopPropagation()}>
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-10 ring-8 ring-yellow-50/50">
                   <Lightbulb className="w-12 h-12 text-yellow-500" />
                </div>
                <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-5">AI Hint</h4>
                <p className="text-3xl font-black text-gray-800 leading-tight mb-12 tracking-tighter">
                   {aiQuestion.hint[gameState.language] || aiQuestion.hint.en}
                </p>
                <button onClick={() => setShowHint(false)} className="w-full py-7 bg-gray-900 text-white rounded-[2.5rem] font-black active:scale-95 shadow-2xl text-xl">Continue</button>
             </div>
          </div>
        )}

        {feedback.show && feedback.type === 'correct' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-green-500/30 backdrop-blur-2xl">
             <div className="bg-white rounded-[5rem] p-16 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                <div className="w-36 h-36 mx-auto mb-10 bg-green-500 rounded-[4rem] flex items-center justify-center text-white shadow-2xl animate-bounce">
                   <Trophy className="w-20 h-20" />
                </div>
                <h2 className="text-6xl font-black text-gray-900 mb-3 tracking-tighter">Master!</h2>
                <p className="text-gray-400 font-bold mb-12 text-[10px] uppercase tracking-[0.4em]">+50 NEURAL PTS</p>
                <button 
                  onClick={() => { setFeedback(f => ({...f, show: false})); generateRandomAITest(); }} 
                  className="w-full py-7 bg-blue-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl active:scale-95"
                >
                  Generate Next
                </button>
             </div>
          </div>
        )}
      </div>
    );
  }

  // Classic Quest UI
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-in fade-in overflow-y-auto">
      <HUD title={`Quest Level ${gameState.currentLevel}`} />
      <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full pb-36">
         <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl border border-gray-100 mb-10 flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[400px] border-b-8 border-b-blue-50">
            {currentQ.imageUrl && (
              <div className="mb-12 w-full h-72 overflow-hidden rounded-[3.5rem] shadow-inner border border-gray-100 bg-gray-50">
                <img src={currentQ.imageUrl} alt="Puzzle" className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="text-3xl font-black text-gray-800 leading-tight mb-6 tracking-tighter">{currentQ.prompt[gameState.language] || currentQ.prompt.en}</h3>
            {showHint && <div className="mt-10 p-8 bg-yellow-50 border-2 border-yellow-100 rounded-[3rem] text-yellow-900 font-bold text-base animate-in zoom-in shadow-inner">{currentQ.hint[gameState.language] || currentQ.hint.en}</div>}
         </div>
         
         <div className="grid grid-cols-1 gap-5">
            {(currentQ.options?.[gameState.language] || currentQ.options?.en || []).map((opt, idx) => (
              <button 
                key={idx} 
                onClick={() => handleResponse(idx)}
                className={`p-7 rounded-[3rem] font-black text-xl border-2 transition-all active:scale-95 text-left flex justify-between items-center ${selectedIdx === idx ? (idx === currentQ.answer ? 'bg-green-500 border-green-600 text-white shadow-2xl' : 'bg-red-500 border-red-600 text-white animate-shake') : 'bg-white border-gray-100 text-gray-700 hover:border-blue-100 shadow-lg'}`}
              >
                <span className="flex-1">{opt}</span>
                {selectedIdx === idx && (idx === currentQ.answer ? <CheckCircle2 className="w-8 h-8" /> : <X className="w-8 h-8" />)}
              </button>
            ))}
         </div>
         
         <div className="fixed bottom-0 left-0 right-0 p-10 flex gap-5 max-w-md mx-auto z-40 bg-gradient-to-t from-gray-50 to-transparent">
           <button onClick={() => setShowHint(true)} className="flex-1 py-6 bg-white border-2 border-yellow-400 text-yellow-600 rounded-[3rem] font-black shadow-2xl active:scale-95">
             <Lightbulb className="w-7 h-7 mx-auto" />
           </button>
           {feedback.show && feedback.type === 'correct' && (
             <button onClick={() => { setFeedback(f => ({...f, show: false})); setSelectedIdx(null); setGameState(p => ({...p, currentLevel: p.currentLevel + 1})); }} className="flex-[4] py-6 bg-blue-600 text-white rounded-[3rem] font-black text-xl shadow-2xl active:scale-95">
               Level Up!
             </button>
           )}
         </div>
      </div>
    </div>
  );
}
