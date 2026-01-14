
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  Play, 
  ChevronLeft, 
  Lightbulb, 
  Coins, 
  X, 
  Info, 
  Volume2, 
  VolumeX, 
  Globe, 
  RotateCcw,
  CheckCircle2,
  Calendar,
  LayoutGrid,
  LogOut,
  LogOut as ExitIcon,
  Loader2,
  Brain,
  Zap,
  TrendingUp,
  ShieldCheck,
  FileText,
  Send
} from 'lucide-react';
import { GameState, View, Question } from './types';
import { QUESTIONS } from './constants/questions';
import { UI_STRINGS } from './constants/translations';

const STORAGE_KEY = 'brain_test_lite_state';

const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  bonus: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};

const INITIAL_STATE: GameState = {
  user: null,
  coins: 50,
  currentLevel: 1,
  completedLevels: [],
  language: 'en',
  soundEnabled: true,
  lastDailyBonus: null,
  brainScore: 0
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [view, setView] = useState<View>('SPLASH');
  const [isLoaded, setIsLoaded] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; show: boolean; points?: number }>({ type: 'correct', show: false });
  const [showHint, setShowHint] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [showLegal, setShowLegal] = useState<'NONE' | 'PRIVACY' | 'TERMS'>('NONE');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');

  // Matching game state
  const [matchingSelection, setMatchingSelection] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [shuffledMatchingLeft, setShuffledMatchingLeft] = useState<{id: number, text: string}[]>([]);
  const [shuffledMatchingRight, setShuffledMatchingRight] = useState<{id: number, text: string}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : INITIAL_STATE;
    setGameState(parsed);
    setShuffledQuestions(shuffleArray(QUESTIONS));

    const timer = setTimeout(() => {
      setView(parsed.user ? 'HOME' : 'LOGIN');
      setIsLoaded(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState, isLoaded]);

  const strings = UI_STRINGS[gameState.language];

  const currentQ = useMemo(() => {
    const questionIndex = (gameState.currentLevel - 1) % (shuffledQuestions.length || 1);
    return shuffledQuestions[questionIndex] || QUESTIONS[0];
  }, [gameState.currentLevel, shuffledQuestions]);

  // Initialize matching puzzles
  useEffect(() => {
    if (currentQ?.type === 'MATCHING' && currentQ.pairs) {
      const pairs = currentQ.pairs[gameState.language];
      const left = pairs.map((p, i) => ({ id: i, text: p[0] }));
      const right = pairs.map((p, i) => ({ id: i, text: p[1] }));
      setShuffledMatchingLeft(shuffleArray(left));
      setShuffledMatchingRight(shuffleArray(right));
      setMatchedPairs([]);
      setMatchingSelection(null);
    }
  }, [currentQ, gameState.language]);

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (!gameState.soundEnabled) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, [gameState.soundEnabled]);

  const handleGoogleLogin = () => {
    if (isLoggingIn) return;
    playSound('click');
    setIsLoggingIn(true);
    setTimeout(() => {
      setGameState(prev => ({ ...prev, user: { name: "Brain Master", email: "player@gmail.com", photo: null } }));
      setView('HOME');
      setIsLoggingIn(false);
      playSound('bonus');
    }, 1500);
  };

  const handleLogout = () => {
    playSound('click');
    if (confirm(strings.logout + "?")) {
      setGameState(prev => ({ ...prev, user: null }));
      setView('LOGIN');
    }
  };

  const handleLevelSelect = (levelId: number) => {
    playSound('click');
    setShuffledQuestions(shuffleArray(QUESTIONS));
    setGameState(prev => ({ ...prev, currentLevel: levelId }));
    setView('PLAY');
    setSelectedIdx(null);
    setShowHint(false);
    setInputText('');
  };

  const triggerVictory = (pointsGained: number, isFirstTime: boolean, questionId: number) => {
    playSound('correct');
    setTimeout(() => {
      setFeedback({ type: 'correct', show: true, points: pointsGained });
      setGameState(prev => ({
        ...prev,
        coins: isFirstTime ? prev.coins + 10 : prev.coins,
        brainScore: prev.brainScore + pointsGained,
        completedLevels: isFirstTime ? [...prev.completedLevels, questionId] : prev.completedLevels
      }));
    }, 700);
  };

  const triggerFailure = () => {
    playSound('wrong');
    const pointsLost = 10;
    setTimeout(() => {
      setFeedback({ type: 'wrong', show: true, points: -pointsLost });
      setGameState(prev => ({ ...prev, brainScore: Math.max(0, prev.brainScore - pointsLost) }));
    }, 700);
    
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, show: false }));
      setSelectedIdx(null);
      setMatchingSelection(null);
    }, 2200);
  };

  const handleMatchingLeft = (id: number) => {
    if (matchedPairs.includes(id)) return;
    playSound('click');
    setMatchingSelection(id);
  };

  const handleMatchingRight = (id: number) => {
    if (matchingSelection === null || matchedPairs.includes(id)) return;

    if (matchingSelection === id) {
      // It's a match!
      playSound('click');
      const newMatched = [...matchedPairs, id];
      setMatchedPairs(newMatched);
      setMatchingSelection(null);

      // Check if all matched
      if (newMatched.length === currentQ.pairs![gameState.language].length) {
        const isFirstTime = !gameState.completedLevels.includes(currentQ.id);
        const pointsGained = isFirstTime ? 120 : 30;
        triggerVictory(pointsGained, isFirstTime, currentQ.id);
      }
    } else {
      triggerFailure();
    }
  };

  const checkAnswer = (userInput: number | string) => {
    if (!currentQ || feedback.show || selectedIdx !== null) return;

    let isCorrect = false;

    if (currentQ.type === 'FILL_BLANKS') {
      isCorrect = userInput.toString().toLowerCase().trim() === currentQ.answer.toString().toLowerCase().trim();
    } else {
      isCorrect = userInput === currentQ.answer;
      setSelectedIdx(userInput as number);
    }

    if (isCorrect) {
      const isFirstTime = !gameState.completedLevels.includes(currentQ.id);
      const pointsGained = isFirstTime ? 100 : 25;
      triggerVictory(pointsGained, isFirstTime, currentQ.id);
    } else {
      triggerFailure();
    }
  };

  const handleNextLevel = () => {
    playSound('click');
    setFeedback({ ...feedback, show: false });
    setShowHint(false);
    setSelectedIdx(null);
    setInputText('');
    setMatchingSelection(null);
    setMatchedPairs([]);
    
    setGameState(prev => ({ ...prev, currentLevel: prev.currentLevel + 1 }));
    
    if (gameState.currentLevel % (shuffledQuestions.length || 1) === 0) {
      setShuffledQuestions(shuffleArray(QUESTIONS));
    }
  };

  const useHint = () => {
    playSound('click');
    if (gameState.coins >= 5) {
      setGameState(prev => ({ 
        ...prev, 
        coins: prev.coins - 5,
        brainScore: Math.max(0, prev.brainScore - 20)
      }));
      setShowHint(true);
      playSound('bonus');
    } else {
      alert(strings.notEnoughCoins);
    }
  };

  const toggleLanguage = () => {
    playSound('click');
    setGameState(prev => ({ ...prev, language: prev.language === 'en' ? 'hi' : 'en' }));
  };

  const toggleSound = () => {
    const newState = !gameState.soundEnabled;
    setGameState(prev => ({ ...prev, soundEnabled: newState }));
    if (newState) {
      new Audio(SOUNDS.click).play().catch(() => {});
    }
  };

  const claimDailyBonus = () => {
    const now = new Date().toDateString();
    if (gameState.lastDailyBonus?.toString() !== now) {
      playSound('bonus');
      setGameState(prev => ({
        ...prev,
        coins: prev.coins + 50,
        brainScore: prev.brainScore + 500,
        lastDailyBonus: now as any
      }));
    } else {
      playSound('click');
    }
  };

  const resetProgress = () => {
    playSound('click');
    if (confirm(strings.reset + "?")) {
      setGameState(prev => ({
        ...INITIAL_STATE,
        user: prev.user,
        language: prev.language,
        soundEnabled: prev.soundEnabled
      }));
      setShuffledQuestions(shuffleArray(QUESTIONS));
      setView('HOME');
    }
  };

  const navigateTo = (newView: View) => {
    playSound('click');
    if (newView === 'PLAY') {
      setShuffledQuestions(shuffleArray(QUESTIONS));
      setSelectedIdx(null);
      setShowHint(false);
      setInputText('');
      setMatchingSelection(null);
      setMatchedPairs([]);
    }
    setView(newView);
  };

  const HUD = ({ title, showExit, showHome }: { title: string, showExit?: boolean, showHome?: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2">
        {(showExit || showHome) ? (
          <button 
            onClick={() => navigateTo('HOME')} 
            className={`flex items-center gap-2 px-4 py-2 ${showExit ? 'bg-red-50 text-red-600 border-red-100 active:scale-95' : 'bg-gray-50 text-gray-600 border-gray-100 active:scale-95'} rounded-2xl font-bold text-sm transition-all border`}
          >
            {showExit ? <ExitIcon className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {showExit ? strings.exit : strings.back}
          </button>
        ) : (
          <h2 className="text-lg font-black text-gray-800 ml-1">{title}</h2>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-2xl border border-blue-100">
           <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
           <span className="text-xs font-black text-blue-700 tabular-nums">{gameState.brainScore}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-2xl border border-yellow-100">
          <Coins className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-black text-yellow-700 tabular-nums">{gameState.coins}</span>
        </div>
      </div>
    </div>
  );

  const LegalOverlay = () => {
    if (showLegal === 'NONE') return null;
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <h3 className="text-xl font-black text-gray-800">
            {showLegal === 'PRIVACY' ? strings.privacyPolicy : strings.termsOfService}
          </h3>
          <button onClick={() => setShowLegal('NONE')} className="p-2 bg-gray-100 rounded-full active:scale-90 transition-all"><X className="w-6 h-6 text-gray-600" /></button>
        </div>
        <div className="flex-1 p-8 overflow-y-auto whitespace-pre-wrap text-gray-600 font-medium leading-relaxed">
          {showLegal === 'PRIVACY' ? strings.privacyContent : strings.termsContent}
        </div>
        <div className="p-6 bg-white border-t border-gray-50">
          <button onClick={() => setShowLegal('NONE')} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-lg active:scale-95 transition-all">{strings.back}</button>
        </div>
      </div>
    );
  };

  const SplashScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 text-white overflow-hidden">
      <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 animate-bounce">
        <Brain className="w-16 h-16 text-blue-600" />
      </div>
      <h1 className="text-4xl font-black tracking-tight mb-2">Brain Test</h1>
      <p className="text-blue-100 font-medium opacity-90 tracking-widest uppercase text-xs">Play Store Ready • Endless</p>
    </div>
  );

  const LoginScreen = () => (
    <div className="flex flex-col min-h-screen bg-white p-8 items-center justify-center">
      <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-8">
        <Brain className="w-12 h-12 text-blue-600" />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">{strings.loginTitle}</h2>
      <p className="text-gray-500 text-center mb-10 font-medium">{strings.loginSubtitle}</p>
      <button 
        onClick={handleGoogleLogin}
        disabled={isLoggingIn}
        className={`w-full max-w-xs flex items-center justify-center gap-4 py-5 rounded-[2rem] font-bold transition-all shadow-sm border-2 ${
          isLoggingIn ? 'bg-gray-50 border-gray-200 text-gray-400 opacity-70' : 'bg-white border-gray-100 text-gray-700 hover:border-blue-100 active:scale-95'
        }`}
      >
        {isLoggingIn ? <><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Signing in...</span></> : <><img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />{strings.loginBtn}</>}
      </button>
      <div className="mt-8 flex gap-4 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
        <button onClick={() => setShowLegal('PRIVACY')}>{strings.privacyPolicy}</button>
        <span className="text-gray-200">|</span>
        <button onClick={() => setShowLegal('TERMS')}>{strings.termsOfService}</button>
      </div>
      <p className="mt-4 text-[9px] text-gray-300 text-center px-12">{strings.disclaimer}</p>
      <LegalOverlay />
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col min-h-screen bg-[#FDFDFF]">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">{gameState.user?.name.charAt(0)}</div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">{strings.welcome}</p>
            <p className="text-xs font-bold text-gray-700">{gameState.user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={toggleLanguage} className="p-2 bg-white text-gray-400 rounded-2xl border border-gray-100 active:scale-95 shadow-sm transition-all"><Globe className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 overflow-y-auto">
        <div className="w-full bg-white border border-gray-100 rounded-[3rem] p-8 mb-8 shadow-lg text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Brain className="w-32 h-32 text-blue-600" /></div>
           <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{strings.iqLabel}</p>
           <h3 className="text-6xl font-black text-blue-600 tracking-tighter mb-4">{Math.floor(80 + (gameState.brainScore / 100))}</h3>
           <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl inline-flex mx-auto border border-blue-100">
              <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
              <span className="font-black text-blue-700 text-sm">{strings.brainScore}: {gameState.brainScore}</span>
           </div>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={() => navigateTo('PLAY')}
            className="group w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 shadow-xl shadow-blue-200 active:scale-[0.97] transition-all"
          >
            <Play fill="white" className="w-6 h-6 ml-0.5" />
            {strings.play}
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigateTo('LEVELS')} className="bg-white border-2 border-gray-100 py-6 rounded-[2rem] font-bold text-gray-700 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm hover:border-blue-100">
              <LayoutGrid className="w-6 h-6 text-orange-500" />
              <span className="text-sm">{strings.levels}</span>
            </button>
            <button onClick={() => navigateTo('SETTINGS')} className="bg-white border-2 border-gray-100 py-6 rounded-[2rem] font-bold text-gray-700 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm hover:border-blue-100">
              <SettingsIcon className="w-6 h-6 text-gray-400" />
              <span className="text-sm">{strings.settings}</span>
            </button>
          </div>

          <button 
            onClick={claimDailyBonus}
            disabled={gameState.lastDailyBonus?.toString() === new Date().toDateString()}
            className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all ${
              gameState.lastDailyBonus?.toString() === new Date().toDateString() ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 border' : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-100 active:scale-95'
            }`}
          >
            <Calendar className="w-5 h-5" />
            {gameState.lastDailyBonus?.toString() === new Date().toDateString() ? strings.alreadyClaimed : strings.dailyBonus}
          </button>
        </div>
      </div>

      <div className="px-8 pb-8 mt-auto flex flex-col items-center gap-4">
        <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tight bg-gray-50/50 px-4 py-2 rounded-full border border-gray-100">
          <button onClick={() => setShowLegal('PRIVACY')} className="hover:text-blue-500">{strings.privacyPolicy}</button>
          <span className="text-gray-200">•</span>
          <button onClick={() => setShowLegal('TERMS')} className="hover:text-blue-500">{strings.termsOfService}</button>
          <span className="text-gray-200">•</span>
          <button onClick={() => navigateTo('ABOUT')} className="hover:text-blue-500">{strings.about}</button>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">v2.1 • {strings.unlimited}</span>
      </div>
      <LegalOverlay />
    </div>
  );

  const PlayScreen = () => {
    const isCompleted = gameState.completedLevels.includes(currentQ?.id);

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <HUD title={`${strings.level} ${gameState.currentLevel}`} showExit />
        
        <div className="px-6 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl shadow-md border border-blue-500">
                <Brain className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">{strings.brainScore}: {gameState.brainScore}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-xl border border-gray-200 text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-tighter">IQ {Math.floor(80 + (gameState.brainScore / 100))}</span>
            </div>
        </div>

        <div className="p-6 flex-1 flex flex-col max-w-lg mx-auto w-full">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 mb-8 flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden">
            {currentQ.imageUrl && (
              <div className="mb-6 w-full max-h-48 overflow-hidden rounded-2xl shadow-inner border border-gray-100">
                <img src={currentQ.imageUrl} alt="puzzle" className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
              </div>
            )}
            <h3 className="text-2xl font-black text-gray-800 leading-tight z-10">{currentQ.prompt[gameState.language]}</h3>
            {showHint && <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-100 rounded-3xl text-yellow-900 font-bold animate-in zoom-in z-10 text-sm shadow-inner">{currentQ.hint[gameState.language]}</div>}
          </div>
          
          {currentQ.type === 'FILL_BLANKS' && (
            <div className="mb-8 animate-in slide-in-from-bottom duration-500">
              <div className="relative group">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type answer here..."
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer(inputText)}
                  className="w-full p-6 rounded-[2rem] bg-white border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-bold text-xl transition-all shadow-sm"
                />
                <button 
                  onClick={() => checkAnswer(inputText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all hover:bg-blue-700"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {currentQ.type === 'MATCHING' && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col gap-3">
                {shuffledMatchingLeft.map((item) => {
                  const isSelected = matchingSelection === item.id;
                  const isMatched = matchedPairs.includes(item.id);
                  return (
                    <button
                      key={`left-${item.id}`}
                      disabled={isMatched || feedback.show}
                      onClick={() => handleMatchingLeft(item.id)}
                      className={`p-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                        isMatched ? 'bg-green-50 border-green-200 text-green-700 opacity-60' :
                        isSelected ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-105' :
                        'bg-white border-gray-100 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3">
                {shuffledMatchingRight.map((item) => {
                  const isMatched = matchedPairs.includes(item.id);
                  return (
                    <button
                      key={`right-${item.id}`}
                      disabled={isMatched || feedback.show}
                      onClick={() => handleMatchingRight(item.id)}
                      className={`p-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                        isMatched ? 'bg-green-50 border-green-200 text-green-700 opacity-60' :
                        'bg-white border-gray-100 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(currentQ.type === 'MCQ' || currentQ.type === 'IMAGE_MCQ' || currentQ.type === 'TRUE_FALSE' || currentQ.type === 'LOGIC') && (
            <div className="grid grid-cols-1 gap-4 mb-8">
              {currentQ.options?.[gameState.language].map((option, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === currentQ.answer;
                
                let buttonStyle = 'bg-white border-gray-100 hover:border-blue-300 text-gray-700 shadow-sm';
                
                if (isSelected) {
                  buttonStyle = isCorrect 
                    ? 'bg-green-500 border-green-600 text-white scale-[1.08] shadow-2xl z-20 ring-8 ring-green-100' 
                    : 'bg-red-500 border-red-600 text-white scale-[0.94] shadow-md animate-shake z-10 ring-8 ring-red-100';
                } else if (isCompleted && isCorrect) {
                  buttonStyle = 'bg-green-50 border-green-500 text-green-700';
                }

                return (
                  <button 
                    key={idx} 
                    onClick={() => checkAnswer(idx)} 
                    disabled={selectedIdx !== null}
                    className={`p-6 rounded-[2rem] font-black text-lg border-2 transition-all duration-300 active:scale-95 text-left flex items-center justify-between ${buttonStyle}`}
                  >
                    <span className="pr-4">{option}</span>
                    {isSelected && isCorrect && <CheckCircle2 className="w-7 h-7 text-white shrink-0 animate-in zoom-in duration-300" />}
                    {isSelected && !isCorrect && <X className="w-7 h-7 text-white shrink-0 animate-in zoom-in duration-300" />}
                    {isCompleted && isCorrect && !isSelected && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-4 items-center pb-8">
            <button onClick={useHint} disabled={showHint || selectedIdx !== null || matchedPairs.length > 0} className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-lg transition-all active:scale-95 ${showHint ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-100 hover:bg-yellow-500'}`}><Lightbulb className="w-6 h-6" />{strings.hint} (-5)</button>
            {feedback.type === 'correct' && feedback.show && (
              <button onClick={handleNextLevel} className="flex-1 flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 animate-in slide-in-from-right hover:bg-blue-700">
                {strings.next} <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {feedback.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-[2rem] flex flex-col items-center justify-center ${feedback.type === 'correct' ? 'bg-green-500 animate-bounce' : 'bg-red-500 animate-shake'} shadow-lg ring-8 ${feedback.type === 'correct' ? 'ring-green-50' : 'ring-red-50'}`}>
                {feedback.type === 'correct' ? <CheckCircle2 className="w-12 h-12 text-white" /> : <X className="w-12 h-12 text-white" />}
                <span className="text-white font-black text-xs mt-1 tabular-nums">{feedback.points && feedback.points > 0 ? `+${feedback.points}` : feedback.points}</span>
              </div>
              <h2 className="text-4xl font-black text-gray-800 mb-2">{feedback.type === 'correct' ? strings.correct : strings.wrong}</h2>
              <p className="text-gray-400 font-bold mb-8 text-sm uppercase tracking-widest">{strings.brainScore}: {gameState.brainScore}</p>
              
              {feedback.type === 'correct' ? (
                 <button onClick={handleNextLevel} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2rem] font-black text-xl shadow-lg active:scale-95 transition-all">{strings.next}</button>
              ) : (
                 <button onClick={() => { setFeedback({ ...feedback, show: false }); setSelectedIdx(null); setMatchingSelection(null); }} className="w-full bg-gray-100 text-gray-700 py-5 rounded-[2rem] font-black text-lg active:scale-95 transition-all">{strings.back}</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const LevelsScreen = () => (
    <div className="flex flex-col min-h-screen bg-white">
      <HUD title={strings.levels} showHome />
      <div className="p-6 grid grid-cols-4 gap-4 max-w-lg mx-auto w-full overflow-y-auto max-h-[calc(100vh-80px)] pb-24">
        {Array.from({ length: Math.max(24, gameState.currentLevel + 12) }).map((_, idx) => {
          const levelNum = idx + 1;
          const isCurrent = levelNum === gameState.currentLevel;
          const isPlayed = levelNum < gameState.currentLevel;
          return (
            <button key={levelNum} onClick={() => handleLevelSelect(levelNum)} className={`h-20 rounded-[1.8rem] font-black text-2xl flex items-center justify-center transition-all border-2 active:scale-90 ${
              isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : isPlayed ? 'bg-green-500 border-green-500 text-white opacity-60' : 'bg-white border-gray-100 text-gray-300 hover:border-blue-100'
            }`}>
              {levelNum}
            </button>
          );
        })}
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="flex flex-col min-h-screen bg-white">
      <HUD title={strings.settings} showHome />
      <div className="p-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <div className="bg-gray-50/50 p-8 rounded-[3rem] space-y-6 border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">{gameState.user?.name.charAt(0)}</div>
             <div>
                <p className="font-black text-gray-800 text-lg">{gameState.user?.name}</p>
                <p className="text-gray-400 text-sm font-medium">{gameState.user?.email}</p>
             </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4"><Globe className="w-6 h-6 text-blue-600" /><span className="font-black text-gray-800">{strings.language}</span></div>
            <button onClick={toggleLanguage} className="bg-white border-2 border-gray-100 px-6 py-3 rounded-[1.5rem] font-black text-blue-600 shadow-sm text-sm active:scale-95 transition-all">{gameState.language === 'en' ? 'हिन्दी' : 'English'}</button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">{gameState.soundEnabled ? <Volume2 className="w-6 h-6 text-green-600" /> : <VolumeX className="w-6 h-6 text-red-600" />}<span className="font-black text-gray-800">{strings.sound}</span></div>
            <button onClick={toggleSound} className={`w-24 py-3 rounded-[1.5rem] font-black text-sm transition-all active:scale-95 ${gameState.soundEnabled ? 'bg-green-500 text-white shadow-green-100' : 'bg-gray-200 text-gray-600'}`}>{gameState.soundEnabled ? 'ON' : 'OFF'}</button>
          </div>
        </div>
        <button onClick={resetProgress} className="flex items-center justify-center gap-3 w-full bg-white border-2 border-red-50 text-red-500 p-6 rounded-[2.5rem] font-black text-lg active:scale-95 shadow-sm hover:bg-red-50 transition-all"><RotateCcw className="w-6 h-6" /> {strings.reset}</button>
        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full bg-red-50 text-red-600 p-6 rounded-[2.5rem] font-black text-lg active:scale-95 shadow-sm mt-4 hover:bg-red-100 transition-all"><LogOut className="w-6 h-6" /> {strings.logout}</button>
      </div>
    </div>
  );

  const AboutScreen = () => (
    <div className="flex flex-col min-h-screen bg-white">
      <HUD title={strings.about} showHome />
      <div className="p-8 flex-1 overflow-y-auto pb-24">
        <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl"><Brain className="w-12 h-12 text-white" /></div>
        <h2 className="text-3xl font-black text-gray-900 text-center mb-4">{strings.appName}</h2>
        <p className="text-gray-500 font-medium leading-relaxed text-center mb-8">{strings.aboutText}</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => setShowLegal('PRIVACY')}
            className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-blue-100 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="font-black text-gray-800">{strings.privacyPolicy}</span>
            </div>
            <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
          </button>

          <button 
            onClick={() => setShowLegal('TERMS')}
            className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-blue-100 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-blue-500" />
              <span className="font-black text-gray-800">{strings.termsOfService}</span>
            </div>
            <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
          </button>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-[2rem] text-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Developer</p>
          <p className="text-gray-800 font-black text-lg">Lite Games Studio</p>
          <p className="text-[10px] text-gray-400 mt-4 px-4">{strings.disclaimer}</p>
        </div>
      </div>
      <LegalOverlay />
    </div>
  );

  if (view === 'SPLASH') return <SplashScreen />;
  if (view === 'LOGIN') return <LoginScreen />;

  return (
    <div className="max-w-md mx-auto shadow-2xl min-h-screen relative overflow-x-hidden bg-white selection:bg-blue-100">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          20% { transform: translateX(-4px) rotate(-1deg); }
          40% { transform: translateX(4px) rotate(1deg); }
          60% { transform: translateX(-4px) rotate(-1deg); }
          80% { transform: translateX(4px) rotate(1deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out infinite;
        }
      `}</style>
      {view === 'HOME' && <HomeScreen />}
      {view === 'PLAY' && <PlayScreen />}
      {view === 'LEVELS' && <LevelsScreen />}
      {view === 'SETTINGS' && <SettingsScreen />}
      {view === 'ABOUT' && <AboutScreen />}
    </div>
  );
}
