
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Loader2,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldCheck,
  Info,
  ChevronRight,
  MessageCircle,
  Trash2,
  LogOut,
  Trophy,
  Medal,
  Activity,
  Fingerprint,
  Cpu,
  User as UserIcon,
  ShieldAlert,
  FileText,
  Shield
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, View, Question, ChatMessage, LeaderboardEntry, Level } from './types';
import { LEVELS } from './constants/questions';
import { UI_STRINGS } from './constants/translations';

const STORAGE_KEY = 'brain_test_lite_v14_levels';

const AVATARS = ["🧠", "🦁", "🚀", "💎", "🔥", "🌈", "👾", "🦊", "🐶", "🐱", "🐲", "🤖"];
const GLOBAL_NAMES = ["Amit_99", "Sara_Brainy", "Deepak_Pro", "IQ_Master", "Riddler", "LogicGoddess", "ZeroSum", "MindReader", "QuantumPuzzler", "SkyWalker", "Rohan_Z", "Priya_Mind"];

const INITIAL_STATE: GameState = {
  user: null,
  coins: 550,
  currentLevel: 1,
  currentQuestionIndex: 0,
  completedLevels: [],
  language: 'en',
  soundEnabled: true,
  brainScore: 100,
  calculatedIQ: 95,
  lastDailyBonus: null,
  isLoggedIn: false,
  leaderboard: [],
  chatHistory: []
};

// --- SOUND ENGINE ---
const playEffect = (type: 'correct' | 'wrong' | 'click' | 'hint' | 'win' | 'scan' | 'access', enabled: boolean) => {
  if (!enabled) return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  switch (type) {
    case 'correct':
      osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3); break;
    case 'wrong':
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3); break;
    case 'click':
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05); break;
    case 'hint':
      osc.type = 'square'; [440, 554, 659, 880].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.05));
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3); break;
    case 'win':
      osc.type = 'triangle'; [523, 659, 783, 1046].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.1));
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6); break;
    case 'scan':
      osc.type = 'sine'; osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(120, now + 2);
      gain.gain.setValueAtTime(0.05, now); osc.start(now); osc.stop(now + 2); break;
    case 'access':
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4); break;
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [view, setView] = useState<View>('SPLASH');
  const [isReady, setIsReady] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; show: boolean }>({ type: 'correct', show: false });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<Question | null>(null);
  
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingAge, setOnboardingAge] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const scanTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = UI_STRINGS[gameState.language];

  // Current Level Data
  const currentLevelData = useMemo(() => {
    return LEVELS.find(l => l.id === gameState.currentLevel) || LEVELS[0];
  }, [gameState.currentLevel]);

  // Current Question Data
  const currentQ = useMemo(() => {
    if (view === 'AI_LAB' && aiQuestion) return aiQuestion;
    return currentLevelData.questions[gameState.currentQuestionIndex] || currentLevelData.questions[0];
  }, [view, aiQuestion, currentLevelData, gameState.currentQuestionIndex]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessage: ChatMessage = { role: 'user', text: userMsg, timestamp: Date.now() };
    setGameState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newMessage] }));
    setIsChatLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { systemInstruction: 'You are Brain Bot, a clever neural assistant.' }
      });
      setGameState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'model', text: response.text || "...", timestamp: Date.now() }] }));
    } catch (e) {
      setGameState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { role: 'model', text: "Error syncing.", timestamp: Date.now() }] }));
    } finally { setIsChatLoading(false); }
  };

  useEffect(() => { if (view === 'CHAT') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState.chatHistory, view]);

  const playClick = () => playEffect('click', gameState.soundEnabled);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (!parsed.leaderboard) parsed.leaderboard = [];
        setGameState(parsed);
      } catch (e) { console.error(e); }
    }
    setIsReady(true);
  }, []);

  useEffect(() => { if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)); }, [gameState, isReady]);

  const startScan = () => {
    setScanning(true); setScanProgress(0); playEffect('scan', gameState.soundEnabled);
    let start = Date.now(); const duration = 2000;
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start; const progress = Math.min((elapsed / duration) * 100, 100);
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval); playEffect('access', gameState.soundEnabled);
        setTimeout(() => setView('ONBOARDING_NAME'), 500);
      }
    }, 50);
    scanTimerRef.current = interval;
  };

  const cancelScan = () => {
    if (scanProgress < 100) { setScanning(false); setScanProgress(0); if (scanTimerRef.current) clearInterval(scanTimerRef.current); }
  };

  const finishOnboarding = () => {
    if (!onboardingName.trim() || !onboardingAge.trim()) return;
    playClick();
    setGameState(prev => ({
      ...prev, user: { name: onboardingName, avatar: AVATARS[0], age: parseInt(onboardingAge) },
      isLoggedIn: true, leaderboard: []
    }));
    setView('HOME');
  };

  const handleAnswer = (val: number | string) => {
    if (selectedIdx !== null || feedback.show) return;
    const isCorrect = currentQ.type === 'FILL_BLANKS' 
      ? val.toString().toLowerCase().trim() === currentQ.answer.toString().toLowerCase().trim()
      : val === currentQ.answer;
    if (currentQ.type !== 'FILL_BLANKS') setSelectedIdx(val as number);
    if (isCorrect) {
      playEffect('correct', gameState.soundEnabled);
      setFeedback({ type: 'correct', show: true });
      setGameState(p => ({
        ...p, coins: p.coins + 10, brainScore: p.brainScore + 25,
        calculatedIQ: Math.min(160, p.calculatedIQ + 0.2),
      }));
    } else {
      playEffect('wrong', gameState.soundEnabled);
      setFeedback({ type: 'wrong', show: true });
      setTimeout(() => { setFeedback({ ...feedback, show: false }); setSelectedIdx(null); }, 1200);
    }
  };

  const handleNext = () => {
    playEffect('win', gameState.soundEnabled);
    setFeedback({ ...feedback, show: false });
    setSelectedIdx(null); setInputText(''); setShowHint(false);

    if (view === 'AI_LAB') {
      generateAIQuestion();
    } else {
      const isLastInLevel = gameState.currentQuestionIndex === currentLevelData.questions.length - 1;
      if (isLastInLevel) {
        // Level Finished!
        setGameState(prev => ({
          ...prev,
          completedLevels: Array.from(new Set([...prev.completedLevels, prev.currentLevel])),
          currentLevel: prev.currentLevel + 1,
          currentQuestionIndex: 0,
          coins: prev.coins + 50
        }));
        setView('HOME'); // Back to home after finishing all 10
      } else {
        setGameState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
      }
    }
  };

  const generateAIQuestion = async () => {
    playClick(); const apiKey = process.env.API_KEY; if (!apiKey) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', contents: "Generate a logic puzzle.",
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, prompt: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } }, options: { type: Type.OBJECT, properties: { en: { type: Type.ARRAY, items: { type: Type.STRING } }, hi: { type: Type.ARRAY, items: { type: Type.STRING } } } }, answer: { type: Type.NUMBER }, hint: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, hi: { type: Type.STRING } } } } } }
      });
      setAiQuestion({ ...JSON.parse(response.text || '{}'), id: `ai_${Date.now()}`, isAI: true });
      setView('AI_LAB');
    } catch (e) { alert("AI Busy!"); } finally { setIsAiLoading(false); }
  };

  const HUD = ({ title, extra }: { title: string, extra?: React.ReactNode }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-50">
      <button onClick={() => { playClick(); setView('HOME'); }} className="p-2 bg-gray-50 rounded-xl active:scale-90 transition-transform"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
      <div className="text-center">
        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-center gap-1 justify-center"><Activity className="w-3 h-3 text-red-500" /><span className="font-black text-gray-900 text-[10px]">LIVE SYNC</span></div>
      </div>
      <div className="flex items-center gap-2">{extra}<div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 rounded-xl border border-yellow-100"><Coins className="w-3.5 h-3.5 text-yellow-500 fill-current" /><span className="text-[11px] font-black text-yellow-800">{gameState.coins}</span></div></div>
    </div>
  );

  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] shadow-[0_0_50px_rgba(79,70,229,0.5)] flex items-center justify-center mb-8 relative z-10 animate-pulse"><Cpu className="w-12 h-12 text-white" /></div>
        <h1 className="text-4xl font-black tracking-tighter mb-1 italic z-10">BRAIN_TEST.exe</h1>
        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-12 z-10">Version Alpha_Lite</p>
        <button onClick={() => { playClick(); setView(gameState.isLoggedIn ? 'HOME' : 'SCANNER'); }} className="w-full max-w-xs py-5 bg-white text-black rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-all z-10">INITIALIZE SYSTEM</button>
      </div>
    );
  }

  if (view === 'SCANNER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="text-center mb-16 space-y-2"><div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-500 rounded-full border border-red-500/50 text-[10px] font-black uppercase tracking-widest mb-4"><ShieldAlert className="w-3 h-3" /> Identity Unknown</div><h2 className="text-2xl font-black">Biometric Access</h2><p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Hold to verify core identity</p></div>
        <div className="relative group"><div className={`absolute -inset-8 rounded-full blur-2xl transition-all duration-700 ${scanning ? 'bg-blue-500/40 opacity-100 scale-110' : 'bg-blue-900/10 opacity-50'}`} /><button onMouseDown={startScan} onMouseUp={cancelScan} onMouseLeave={cancelScan} onTouchStart={startScan} onTouchEnd={cancelScan} className={`w-32 h-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 border-4 ${scanning ? 'bg-blue-600 border-white scale-90' : 'bg-zinc-900 border-zinc-800 hover:border-blue-500'}`}><Fingerprint className={`w-16 h-16 ${scanning ? 'text-white' : 'text-blue-500'}`} />{scanning && <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90"><circle cx="50%" cy="50%" r="48%" fill="none" stroke="white" strokeWidth="4" strokeDasharray={`${scanProgress * 3}, 1000`} className="transition-all duration-75" /></svg>}</button>{scanning && <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] z-20 animate-[scan-line_1.5s_infinite]" style={{ transform: `translateY(${(scanProgress - 50) * 1.2}px)` }} />}</div>
        <div className="mt-16 text-center"><p className={`text-[10px] font-black tracking-[0.3em] transition-all ${scanning ? 'text-blue-400 animate-pulse' : 'text-zinc-600'}`}>{scanning ? 'SCANNING ENCRYPTED DATA...' : 'PLACE THUMB ON SCANNER'}</p></div>
        <style>{`@keyframes scan-line { 0% { opacity: 0; transform: translateY(-60px); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(60px); } }`}</style>
      </div>
    );
  }

  if (view === 'ONBOARDING_NAME') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="w-full max-w-xs space-y-8 animate-in fade-in slide-in-from-bottom duration-500"><div className="space-y-2"><p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Protocol Step 01</p><h2 className="text-3xl font-black">Identify yourself.</h2><p className="text-zinc-500 text-sm">How should the system recognize you?</p></div><input autoFocus value={onboardingName} onChange={e => setOnboardingName(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 p-5 rounded-2xl font-black text-xl outline-none focus:border-indigo-500 transition-all" placeholder="Subject Name..." /><button disabled={!onboardingName.trim()} onClick={() => { playClick(); setView('ONBOARDING_AGE'); }} className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2">Continue <ChevronRight className="w-5 h-5" /></button></div>
      </div>
    );
  }

  if (view === 'ONBOARDING_AGE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="w-full max-w-xs space-y-8 animate-in fade-in slide-in-from-bottom duration-500"><div className="space-y-2"><p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Protocol Step 02</p><h2 className="text-3xl font-black">Biological Age.</h2><p className="text-zinc-500 text-sm">Input your age for complexity mapping.</p></div><input type="number" autoFocus value={onboardingAge} onChange={e => setOnboardingAge(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 p-5 rounded-2xl font-black text-xl outline-none focus:border-indigo-500 transition-all" placeholder="Age (Numbers)..." /><button disabled={!onboardingAge.trim()} onClick={finishOnboarding} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg disabled:opacity-30 active:scale-95 transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)]">Initialize Profile</button></div>
      </div>
    );
  }

  if (view === 'ABOUT') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HUD title={t.about.toUpperCase()} />
        <div className="p-6 flex-1 overflow-y-auto space-y-8 pb-20"><div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-indigo-50 text-center"><div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg"><Brain className="w-10 h-10" /></div><h2 className="text-2xl font-black text-gray-800 mb-2">{t.appName}</h2><p className="text-gray-500 text-sm leading-relaxed">{t.aboutText}</p></div><div className="space-y-4"><div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100"><div className="flex items-center gap-3 mb-4 text-indigo-600 font-black uppercase text-xs tracking-widest"><ShieldCheck className="w-5 h-5" /> {t.privacyPolicy}</div><p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{t.privacyContent}</p></div><div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100"><div className="flex items-center gap-3 mb-4 text-indigo-600 font-black uppercase text-xs tracking-widest"><FileText className="w-5 h-5" /> {t.termsOfService}</div><p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{t.termsContent}</p></div></div></div>
      </div>
    );
  }

  if (view === 'HOME') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 animate-in fade-in duration-500">
        <div className="p-6 flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-14 h-14 bg-white rounded-[1.2rem] shadow-xl flex items-center justify-center text-3xl border-2 border-indigo-100">{gameState.user?.avatar}</div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.welcome}</p><h3 className="text-xl font-black text-gray-800 leading-none mt-1">{gameState.user?.name}</h3></div></div><button onClick={() => { playClick(); setView('SETTINGS'); }} className="p-3 bg-white rounded-xl shadow-md active:scale-90 transition-transform border border-gray-100"><Settings className="w-6 h-6 text-gray-400" /></button></div>
        <div className="flex-1 px-6 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border-4 border-indigo-50 relative overflow-hidden group"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.brainScore}</p><h1 className="text-7xl font-black text-indigo-700 mb-2 tabular-nums tracking-tighter">{gameState.brainScore}</h1><div className="flex items-center justify-center gap-4 mt-2"><div className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase border border-indigo-100 flex items-center gap-1"><Activity className="w-3 h-3" /> IQ {Math.round(gameState.calculatedIQ)}</div><div className="px-3 py-1 bg-yellow-50 rounded-full text-[10px] font-black text-yellow-600 uppercase border border-yellow-100 flex items-center gap-1"><Medal className="w-3 h-3" /> LVL {gameState.currentLevel}</div></div></div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { playClick(); setView('PLAY'); }} className="col-span-2 py-6 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Play className="w-6 h-6 fill-current" /> {t.play}</button>
            <button onClick={() => { playClick(); setView('CHAT'); }} className="py-6 bg-white border-2 border-gray-100 rounded-3xl font-black text-gray-800 shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-all"><MessageCircle className="w-7 h-7 text-blue-500" /><span className="text-xs uppercase tracking-tighter">{t.aiAssistant}</span></button>
            <button onClick={generateAIQuestion} disabled={isAiLoading} className="py-6 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-2xl flex flex-col items-center gap-2 active:scale-95 transition-all relative overflow-hidden">{isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-7 h-7 text-yellow-400 fill-current" />}<span className="text-xs uppercase tracking-tighter">AI LAB</span></button>
          </div>
        </div>
        <div className="p-6 flex justify-between items-center opacity-60"><div className="flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-500" /><span className="font-black text-gray-800">{gameState.coins}</span></div><button onClick={() => { playClick(); setView('LEVELS'); }} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1"><LayoutGrid className="w-4 h-4" /> {t.levels}</button></div>
      </div>
    );
  }

  if (view === 'LEVELS') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HUD title={t.levels} />
        <div className="p-4 grid grid-cols-4 gap-3">
          {LEVELS.map((lvl) => {
            const isComp = gameState.completedLevels.includes(lvl.id);
            const isCurr = gameState.currentLevel === lvl.id;
            return <button key={lvl.id} onClick={() => { playClick(); setGameState(p => ({...p, currentLevel: lvl.id, currentQuestionIndex: 0})); setView('PLAY'); }} className={`aspect-square rounded-2xl flex items-center justify-center font-black text-lg border-2 transition-all active:scale-90 ${isComp ? 'bg-green-500 border-green-600 text-white' : isCurr ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110' : 'bg-white border-gray-100 text-gray-300'}`}>{lvl.id}</button>;
          })}
        </div>
      </div>
    );
  }

  if (view === 'SETTINGS') {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HUD title={t.settings} />
            <div className="p-6 space-y-4">
                <div className="bg-white rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Globe className="w-6 h-6 text-indigo-500" /><span className="font-bold text-gray-800">{t.language}</span></div><div className="flex bg-gray-100 p-1 rounded-xl"><button onClick={() => { playClick(); setGameState(p => ({...p, language: 'en'})); }} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${gameState.language === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>EN</button><button onClick={() => { playClick(); setGameState(p => ({...p, language: 'hi'})); }} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${gameState.language === 'hi' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>हिन्दी</button></div></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3">{gameState.soundEnabled ? <Volume2 className="w-6 h-6 text-indigo-600" /> : <VolumeX className="w-6 h-6 text-gray-400" />}<span className="font-bold text-gray-800">{t.sound}</span></div><button onClick={() => { setGameState(p => ({...p, soundEnabled: !p.soundEnabled})); if(!gameState.soundEnabled) playEffect('click', true); }} className={`w-14 h-8 rounded-full transition-all relative ${gameState.soundEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${gameState.soundEnabled ? 'right-1' : 'left-1'}`} /></button></div>
                </div>
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100"><button onClick={() => { playClick(); setView('ABOUT'); }} className="w-full p-6 flex justify-between items-center hover:bg-gray-50 border-b"><div className="flex items-center gap-3 text-gray-700 font-bold"><Info className="w-6 h-6 text-blue-500" /> {t.about}</div><ChevronRight className="w-5 h-5 text-gray-400" /></button><button onClick={() => { playClick(); if(confirm("Logout?")) { setGameState(prev => ({ ...prev, isLoggedIn: false })); setView('SPLASH'); } }} className="w-full p-6 flex justify-between items-center hover:bg-red-50 text-red-600 font-bold active:bg-red-100 transition-all"><div className="flex items-center gap-3"><LogOut className="w-6 h-6" /> {t.logout}</div></button></div>
            </div>
        </div>
    );
  }

  if (view === 'CHAT') {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <HUD title={t.aiAssistant} extra={<button onClick={() => { playClick(); setGameState(prev => ({ ...prev, chatHistory: [] })); }}><Trash2 className="w-4 h-4 text-gray-400" /></button>} />
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-sm font-medium">{t.chatIntro}</div>
          {gameState.chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-4 rounded-2xl shadow-sm max-w-[85%] text-sm ${m.role === 'user' ? 'bg-white text-gray-800 border' : 'bg-blue-600 text-white'}`}>{m.text}</div></div>
          ))}
          {isChatLoading && <div className="flex justify-start"><div className="p-4 rounded-2xl bg-blue-100 text-blue-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs font-bold uppercase">{t.typing}</span></div></div>}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-white border-t flex items-center gap-2 pb-[calc(1rem+var(--safe-area-inset-bottom))]"><input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-gray-100 p-4 rounded-2xl text-sm font-bold border-none outline-none" placeholder={t.chatPlaceholder} /><button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="p-4 bg-blue-600 text-white rounded-xl active:scale-95 transition-transform disabled:opacity-50"><Send className="w-5 h-5" /></button></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      <HUD title={view === 'AI_LAB' ? "AI CHALLENGE" : `LVL ${gameState.currentLevel} - Q${gameState.currentQuestionIndex + 1}/10`} />
      <div className="p-6 flex-1 flex flex-col items-center max-w-md mx-auto w-full">
        <div className="w-full bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-indigo-50 text-center relative animate-in zoom-in duration-300 mb-8">{currentQ.imageUrl && <img src={currentQ.imageUrl} className="w-full h-48 object-cover rounded-2xl mb-6 shadow-xl" /><h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{currentQ.prompt[gameState.language]}</h3></div>
        <div className="w-full space-y-3">
          {currentQ.type === 'FILL_BLANKS' ? (
             <div className="relative"><input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnswer(inputText)} className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-indigo-500 font-black text-lg shadow-xl" placeholder="Answer..." /><button onClick={() => handleAnswer(inputText)} className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-indigo-600 text-white rounded-2xl active:scale-90"><Send className="w-5 h-5" /></button></div>
          ) : (
            currentQ.options?.[gameState.language]?.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i)} className={`w-full p-5 rounded-3xl font-black text-left shadow-lg border-2 transition-all ${selectedIdx === i ? (i === currentQ.answer ? 'bg-green-500 border-green-600 text-white scale-105' : 'bg-red-500 border-red-600 text-white animate-shake') : 'bg-white border-gray-50 text-gray-700 hover:border-indigo-200 active:scale-95'}`}>{opt}</button>
            ))
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-white/90 backdrop-blur-xl border-t flex gap-4 z-40"><button onClick={() => { if(gameState.coins >= 5) { playEffect('hint', gameState.soundEnabled); setShowHint(!showHint); if(!showHint) setGameState(p => ({...p, coins: p.coins - 5})); } else alert(t.notEnoughCoins); }} className="w-20 h-20 bg-yellow-400 text-yellow-900 rounded-3xl flex items-center justify-center shadow-xl active:scale-90 border-b-8 border-yellow-600 transition-all active:translate-y-2 active:border-b-0"><Lightbulb className="w-8 h-8" /></button>
        {feedback.show && feedback.type === 'correct' ? (
          <button onClick={handleNext} className="flex-1 h-20 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-2xl animate-bounce border-b-8 border-indigo-800 flex items-center justify-center gap-2 active:translate-y-2 active:border-b-0"><Sparkles className="w-6 h-6" /> {t.next}</button>
        ) : (
          <button onClick={() => { playClick(); setView('HOME'); }} className="flex-1 h-20 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-2xl border-b-8 border-gray-700 active:translate-y-2 active:border-b-0">{t.home}</button>
        )}
      </div>
      {showHint && <div className="fixed inset-x-6 bottom-36 bg-yellow-50 border-2 border-yellow-200 p-6 rounded-[2rem] text-yellow-900 font-bold text-center animate-in slide-in-from-bottom duration-300 shadow-2xl z-50"><p className="text-[10px] uppercase tracking-[0.2em] text-yellow-600 mb-2 font-black">💡 Intelligence Clue</p>{currentQ.hint[gameState.language]}</div>}
    </div>
  );
}
