import { useEffect, useRef, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';

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

  const audioContextRef = useRef<AudioContext | null>(null);

  const categories = {
    SPACE: ['GALAXY', 'ASTEROID', 'ORBIT', 'ROCKET', 'COMET'],
    TECH: ['PHASER', 'ALGORITHM', 'SOFTWARE', 'SYSTEM', 'NETWORK'],
    PHOTOGRAPHY: ['APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'LENS'],
    PORTFOLIO: ['DESIGN', 'CREATIVE', 'PROJECT', 'VISUAL', 'ARTWORK'],
  };

  const maxWrong = 6;

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Play success sound
  const playSuccessSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1000, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  };

  // Play wrong sound
  const playWrongSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  };

  // Initialize game
  useEffect(() => {
    const categoryKeys = Object.keys(categories);
    const selectedCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    const categoryWords = (categories as any)[selectedCategory];
    const newWord = categoryWords[Math.floor(Math.random() * categoryWords.length)].toUpperCase();

    setGameState({
      word: newWord,
      displayWord: Array(newWord.length).fill('_'),
      guessed: [],
      wrongGuesses: 0,
      category: selectedCategory,
      gameOver: false,
      won: false,
    });
  }, []);

  // Handle letter guess
  const handleGuess = (letter: string) => {
    if (gameState.gameOver || gameState.won) return;
    if (gameState.guessed.includes(letter)) return;

    const newGuessed = [...gameState.guessed, letter];
    let newDisplayWord = [...gameState.displayWord];
    let newWrongGuesses = gameState.wrongGuesses;

    if (gameState.word.includes(letter)) {
      // Correct guess
      for (let i = 0; i < gameState.word.length; i++) {
        if (gameState.word[i] === letter) {
          newDisplayWord[i] = letter;
        }
      }
      playSuccessSound();
    } else {
      // Wrong guess
      newWrongGuesses++;
      playWrongSound();
    }

    const isWon = !newDisplayWord.includes('_');
    const isLost = newWrongGuesses >= maxWrong;

    setGameState({
      ...gameState,
      guessed: newGuessed,
      displayWord: newDisplayWord,
      wrongGuesses: newWrongGuesses,
      gameOver: isLost,
      won: isWon,
    });
  };

  // Keyboard input
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

  // Render hangman stages
  const renderHangman = () => {
    const parts = [];
    const stage = gameState.wrongGuesses;

    if (stage >= 1) parts.push(<circle key="head" cx="300" cy="180" r="35" fill="#fdbcb4" />);
    if (stage >= 2) parts.push(<rect key="body" x="290" y="220" width="20" height="100" fill="#ff6b6b" />);
    if (stage >= 3) parts.push(<rect key="leftArm" x="240" y="245" width="50" height="15" fill="#fdbcb4" />);
    if (stage >= 4) parts.push(<rect key="rightArm" x="310" y="245" width="50" height="15" fill="#fdbcb4" />);
    if (stage >= 5) parts.push(<rect key="leftLeg" x="285" y="320" width="12" height="70" fill="#4a4a4a" />);
    if (stage >= 6) parts.push(<rect key="rightLeg" x="303" y="320" width="12" height="70" fill="#4a4a4a" />);

    return parts;
  };

  const newGame = () => {
    const categoryKeys = Object.keys(categories);
    const selectedCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    const categoryWords = (categories as any)[selectedCategory];
    const newWord = categoryWords[Math.floor(Math.random() * categoryWords.length)].toUpperCase();

    setGameState({
      word: newWord,
      displayWord: Array(newWord.length).fill('_'),
      guessed: [],
      wrongGuesses: 0,
      category: selectedCategory,
      gameOver: false,
      won: false,
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col pt-24">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Game Container */}
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg border border-primary p-8 space-y-8">
            {/* Category & Stats */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-mono text-white/60 uppercase tracking-widest">Category</p>
                <p className="text-xl font-heading text-primary font-bold">{gameState.category}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white/60 uppercase tracking-widest">Wrong Guesses</p>
                <p className={`text-2xl font-heading font-bold ${gameState.wrongGuesses >= maxWrong ? 'text-red-500' : 'text-white'}`}>
                  {gameState.wrongGuesses}/{maxWrong}
                </p>
              </div>
            </div>

            {/* Hangman Drawing */}
            <div className="flex justify-center">
              <svg width="400" height="300" viewBox="0 0 400 300" className="w-full max-w-xs">
                {/* Gallows */}
                <line x1="150" y1="250" x2="150" y2="50" stroke="#d4a574" strokeWidth="4" />
                <line x1="150" y1="50" x2="300" y2="50" stroke="#d4a574" strokeWidth="4" />
                <line x1="300" y1="50" x2="300" y2="130" stroke="#d4a574" strokeWidth="3" />
                {/* Hangman parts */}
                {renderHangman()}
              </svg>
            </div>

            {/* Word Display */}
            <div className="text-center">
              <p className="text-5xl font-mono font-bold text-white tracking-widest">
                {gameState.displayWord.join(' ')}
              </p>
            </div>

            {/* Game Status */}
            {gameState.won && (
              <div className="text-center p-4 bg-green-900/30 border border-green-500 rounded">
                <p className="text-2xl font-heading font-bold text-green-400">YOU WIN!</p>
              </div>
            )}
            {gameState.gameOver && !gameState.won && (
              <div className="text-center p-4 bg-red-900/30 border border-red-500 rounded">
                <p className="text-2xl font-heading font-bold text-red-400">GAME OVER!</p>
                <p className="text-sm font-mono text-red-300 mt-2">The word was: {gameState.word}</p>
              </div>
            )}

            {/* Guessed Letters */}
            <div className="space-y-2">
              <p className="text-xs font-mono text-white/60 uppercase tracking-widest">Guessed Letters</p>
              <div className="flex flex-wrap gap-2">
                {gameState.guessed.map((letter) => (
                  <span
                    key={letter}
                    className={`px-3 py-1 rounded font-mono text-sm font-bold ${
                      gameState.word.includes(letter)
                        ? 'bg-green-900/50 text-green-400 border border-green-500'
                        : 'bg-red-900/50 text-red-400 border border-red-500'
                    }`}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>

            {/* Letter Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-mono text-white/60 uppercase tracking-widest">Or Click Letters</p>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={gameState.guessed.includes(letter) || gameState.gameOver || gameState.won}
                    className={`py-2 px-1 sm:px-2 text-xs sm:text-sm font-mono font-bold rounded transition-all ${
                      gameState.guessed.includes(letter)
                        ? gameState.word.includes(letter)
                          ? 'bg-green-900/50 text-green-400 border border-green-500 cursor-not-allowed'
                          : 'bg-red-900/50 text-red-400 border border-red-500 cursor-not-allowed'
                        : 'bg-primary/20 text-white border border-primary hover:bg-primary/40 active:scale-95'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-xs font-mono text-white/40">
              <p>Press letter keys or click buttons to guess. You have {maxWrong} wrong guesses.</p>
            </div>

            {/* New Game Button */}
            <div className="flex justify-center">
              <button
                onClick={newGame}
                className="px-8 py-3 bg-primary text-white font-heading font-bold rounded hover:bg-opacity-80 transition-all active:scale-95"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
