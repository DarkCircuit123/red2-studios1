import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  initials: string;
  score: number;
}

interface CategoryMeta {
  name: string;
  words: string[];
}

export default function HangmanGamePage() {
  const [gameState, setGameState] = useState({
    word: '',
    displayWord: [] as string[],
    guessed: [] as string[],
    wrongGuesses: 0,
    category: '',
    gameOver: false,
    won: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showInitialsPrompt, setShowInitialsPrompt] = useState(false);
  const [playerInitials, setPlayerInitials] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);

  const categoriesData: Record<string, CategoryMeta> = {
    'SUPER_MODELS': {
      name: 'SUPER MODELS',
      words: ['NAOMI', 'CINDY', 'CLAUDIA', 'GISELE', 'TYRA', 'HEIDI', 'KATE', 'GIGI', 'BELLA', 'KENDALL']
    },
    'CAMERAS': {
      name: 'CAMERAS',
      words: ['CAMERA', 'LENS', 'APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'SENSOR', 'PIXEL', 'RESOLUTION', 'MEGAPIXEL']
    },
    'HOLLYWOOD_STARS': {
      name: 'HOLLYWOOD STARS',
      words: ['TOMHANKS', 'MERYLSTREEP', 'DENZEL', 'KATE', 'LEONARDO', 'OPRAH', 'CRUISE', 'ANGELINA', 'BRAD', 'JOHNNY']
    },
  };

  const categories = Object.fromEntries(
    Object.entries(categoriesData).map(([key, meta]) => [key, meta.words])
  );

  const maxWrong = 6;

  useEffect(() => {
    const saved = localStorage.getItem('hangmanLeaderboard');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
    const winnings = localStorage.getItem('hangmanWinnings');
    if (winnings) {
      setTotalWinnings(parseInt(winnings));
    }
  }, []);

  const calculateScore = (wrongGuesses: number): number => {
    return Math.max(0, 100 - wrongGuesses * 10);
  };

  const saveScore = (initials: string, score: number) => {
    const newEntry: LeaderboardEntry = { 
      initials: initials.toUpperCase(), 
      score
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    setLeaderboard(updated);
    localStorage.setItem('hangmanLeaderboard', JSON.stringify(updated));
    
    const newWinnings = totalWinnings + score;
    setTotalWinnings(newWinnings);
    localStorage.setItem('hangmanWinnings', newWinnings.toString());
    
    setShowInitialsPrompt(false);
    setPlayerInitials('');
  };

  const startGame = (category: string) => {
    const categoryWords = (categories as any)[category];
    const newWord = categoryWords[Math.floor(Math.random() * categoryWords.length)].toUpperCase();

    setGameState({
      word: newWord,
      displayWord: Array(newWord.length).fill('_'),
      guessed: [],
      wrongGuesses: 0,
      category: category,
      gameOver: false,
      won: false,
    });
    setSelectedCategory(category);
  };

  const handleGuess = (letter: string) => {
    if (gameState.gameOver || gameState.won || !selectedCategory) return;
    if (gameState.guessed.includes(letter)) return;

    const newGuessed = [...gameState.guessed, letter];
    let newDisplayWord = [...gameState.displayWord];
    let newWrongGuesses = gameState.wrongGuesses;

    if (gameState.word.includes(letter)) {
      for (let i = 0; i < gameState.word.length; i++) {
        if (gameState.word[i] === letter) {
          newDisplayWord[i] = letter;
        }
      }
    } else {
      newWrongGuesses++;
    }

    const isWon = !newDisplayWord.includes('_');
    const isLost = newWrongGuesses >= maxWrong;

    if (isWon) {
      const score = calculateScore(newWrongGuesses);
      setCurrentScore(score);
      setTimeout(() => setShowInitialsPrompt(true), 500);
    }

    setGameState({
      ...gameState,
      guessed: newGuessed,
      displayWord: newDisplayWord,
      wrongGuesses: newWrongGuesses,
      gameOver: isLost,
      won: isWon,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        handleGuess(letter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const renderHangman = () => {
    const parts = [];
    const stage = gameState.wrongGuesses;

    if (stage >= 1) {
      parts.push(
        <circle key="head" cx="300" cy="160" r="32" fill="#f4c4a0" />
      );
    }
    if (stage >= 2) {
      parts.push(
        <rect key="body" x="290" y="195" width="20" height="85" fill="#1a1a1a" />
      );
    }
    if (stage >= 3) {
      parts.push(
        <rect key="leftArm" x="230" y="215" width="60" height="12" fill="#1a1a1a" rx="6" />
      );
    }
    if (stage >= 4) {
      parts.push(
        <rect key="rightArm" x="310" y="215" width="60" height="12" fill="#1a1a1a" rx="6" />
      );
    }
    if (stage >= 5) {
      parts.push(
        <rect key="leftLeg" x="285" y="280" width="10" height="60" fill="#2a2a2a" />
      );
    }
    if (stage >= 6) {
      parts.push(
        <rect key="rightLeg" x="305" y="280" width="10" height="60" fill="#2a2a2a" />
      );
    }

    return parts;
  };

  const newGame = () => {
    if (selectedCategory) {
      startGame(selectedCategory);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-black to-slate-900 overflow-hidden relative p-4">
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
          {!selectedCategory ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h1 className="text-5xl md:text-7xl font-heading font-black text-cyan-300 mb-2">
                  HANGMAN
                </h1>
                <p className="text-lg md:text-xl font-paragraph text-white/80">
                  Choose a category and start playing
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(categoriesData).map(([key, meta]) => (
                  <motion.button
                    key={key}
                    onClick={() => startGame(key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-6 bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-cyan-400 rounded-lg hover:border-cyan-300 transition-all"
                  >
                    <p className="text-xl font-heading font-black text-cyan-300">
                      {meta.name}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-primary/20 via-black to-black rounded-lg border-2 border-cyan-400 p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-mono text-cyan-300 uppercase">Category</p>
                    <p className="text-2xl font-heading font-black text-cyan-300">{gameState.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-cyan-300 uppercase">Strikes</p>
                    <p className={`text-2xl font-heading font-black ${gameState.wrongGuesses >= maxWrong ? 'text-red-500' : 'text-cyan-300'}`}>
                      {gameState.wrongGuesses}/{maxWrong}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center py-6">
                  <svg width="300" height="250" viewBox="0 0 400 300" className="w-full max-w-xs">
                    <line x1="150" y1="250" x2="150" y2="50" stroke="#06b6d4" strokeWidth="4" />
                    <line x1="150" y1="50" x2="300" y2="50" stroke="#06b6d4" strokeWidth="4" />
                    <line x1="300" y1="50" x2="300" y2="130" stroke="#06b6d4" strokeWidth="3" />
                    {renderHangman()}
                  </svg>
                </div>

                <div className="text-center py-6 bg-black/50 rounded-lg">
                  <p className="text-4xl md:text-5xl font-mono font-black text-yellow-300 tracking-widest">
                    {gameState.displayWord.join(' ')}
                  </p>
                </div>

                <AnimatePresence>
                  {gameState.won && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center p-4 bg-green-900/50 border-2 border-green-400 rounded-lg"
                    >
                      <p className="text-3xl font-heading font-black text-green-300">JACKPOT!</p>
                      <p className="text-xl font-heading font-black text-green-400">+${currentScore}</p>
                    </motion.div>
                  )}
                  {gameState.gameOver && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center p-4 bg-red-900/50 border-2 border-red-400 rounded-lg"
                    >
                      <p className="text-3xl font-heading font-black text-red-300">BUST!</p>
                      <p className="text-lg font-paragraph text-red-300">Word: {gameState.word}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <p className="text-xs font-mono text-yellow-300 uppercase">Guessed Letters</p>
                  <div className="flex flex-wrap gap-2 p-4 bg-black/50 rounded-lg min-h-12">
                    {gameState.guessed.length === 0 ? (
                      <p className="text-white/40 text-sm w-full text-center">No letters guessed yet</p>
                    ) : (
                      gameState.guessed.map((letter) => (
                        <span
                          key={letter}
                          className={`px-3 py-1 rounded font-mono text-sm font-bold border-2 ${
                            gameState.word.includes(letter)
                              ? 'bg-green-900/50 text-green-300 border-green-500'
                              : 'bg-red-900/50 text-red-300 border-red-500'
                          }`}
                        >
                          {letter}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                    <motion.button
                      key={letter}
                      onClick={() => handleGuess(letter)}
                      disabled={gameState.guessed.includes(letter) || gameState.gameOver || gameState.won}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`py-2 px-1 text-xs font-mono font-bold rounded border-2 transition-all ${
                        gameState.guessed.includes(letter)
                          ? gameState.word.includes(letter)
                            ? 'bg-green-900/50 text-green-300 border-green-500 cursor-not-allowed'
                            : 'bg-red-900/50 text-red-300 border-red-500 cursor-not-allowed'
                          : 'bg-primary/40 text-white border-primary/60 hover:bg-primary/60'
                      }`}
                    >
                      {letter}
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={newGame}
                    disabled={!gameState.won && !gameState.gameOver}
                    whileHover={{ scale: 1.05 }}
                    className={`flex-1 px-6 py-3 font-heading font-black rounded border-2 ${
                      gameState.won || gameState.gameOver
                        ? 'bg-primary text-white border-primary hover:border-yellow-400'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-600'
                    }`}
                  >
                    {gameState.gameOver ? 'TRY AGAIN' : 'NEW GAME'}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setSelectedCategory(null);
                      setGameState({
                        word: '',
                        displayWord: [],
                        guessed: [],
                        wrongGuesses: 0,
                        category: '',
                        gameOver: false,
                        won: false,
                      });
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-1 px-6 py-3 bg-white/10 text-white font-heading font-black rounded hover:bg-white/20 border-2 border-white/30"
                  >
                    CHANGE GAME
                  </motion.button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/20 via-black to-black rounded-lg border-2 border-primary p-6 space-y-4">
                <div className="text-center">
                  <p className="text-xs font-mono text-yellow-300 uppercase mb-1">Hall of Fame</p>
                  <h3 className="text-2xl font-heading font-black text-white">TOP 5</h3>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-white/50 text-center py-4">Be the first to hit the leaderboard!</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-primary/30 border-2 border-primary/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-heading font-black text-yellow-300">#{index + 1}</span>
                          <span className="text-sm font-mono font-black text-white">{entry.initials}</span>
                        </div>
                        <span className="text-lg font-heading font-black text-yellow-300">
                          ${entry.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showInitialsPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/30 via-black to-black rounded-lg border-2 border-primary p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <p className="text-5xl mb-4">💰</p>
                <h2 className="text-3xl font-heading font-black text-yellow-300 mb-2">WINNER!</h2>
                <p className="text-lg font-paragraph text-white/70">Enter your initials</p>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-heading font-black text-green-400">${currentScore}</p>
                </div>

                <input
                  type="text"
                  maxLength={3}
                  value={playerInitials}
                  onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())}
                  placeholder="ABC"
                  className="w-full px-4 py-3 bg-primary/20 border-2 border-primary rounded text-white text-center text-2xl font-mono font-black placeholder-white/30 focus:outline-none focus:border-yellow-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playerInitials.length > 0) {
                      saveScore(playerInitials, currentScore);
                    }
                  }}
                />

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => saveScore(playerInitials || 'AAA', currentScore)}
                    disabled={playerInitials.length === 0}
                    whileHover={{ scale: 1.05 }}
                    className={`flex-1 px-4 py-3 font-heading font-black rounded border-2 ${
                      playerInitials.length > 0
                        ? 'bg-primary text-white border-primary hover:border-yellow-400'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-600'
                    }`}
                  >
                    CLAIM PRIZE
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowInitialsPrompt(false);
                      setPlayerInitials('');
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-1 px-4 py-3 bg-white/10 text-white font-heading font-black rounded hover:bg-white/20 border-2 border-white/30"
                  >
                    SKIP
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
