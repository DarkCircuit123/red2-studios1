import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const WORDS = [
  'PHOTOGRAPHY',
  'PORTFOLIO',
  'CREATIVE',
  'DESIGN',
  'CINEMA',
  'VISUAL',
  'PRODUCTION',
  'STORYTELLING',
  'AESTHETIC',
  'MASTERPIECE',
];

export default function HangmanGamePage() {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const maxWrong = 6;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Initialize game
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || gameOver || won) return;

    playSound();
    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);

      if (newWrong >= maxWrong) {
        setGameOver(true);
      }
    }

    // Check win condition
    const wordLetters = word.split('');
    const allGuessed = wordLetters.every(l => newGuessed.includes(l));
    if (allGuessed) {
      setWon(true);
    }
  };

  const displayWord = word
    .split('')
    .map(letter => (guessedLetters.includes(letter) ? letter : '_'))
    .join(' ');

  const hangmanStages = [
    '  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
            Hangman Game
          </h1>
          <p className="text-gray-300 text-lg">Guess the word before it's too late!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Hangman Drawing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg p-8 border border-amber-500/30"
          >
            <pre className="font-mono text-sm text-amber-400 whitespace-pre-wrap break-words">
              {hangmanStages[wrongGuesses]}
            </pre>
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Wrong Guesses</p>
              <p className="text-3xl font-bold text-red-500">
                {wrongGuesses} / {maxWrong}
              </p>
            </div>
          </motion.div>

          {/* Word Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg p-8 border border-amber-500/30 flex flex-col justify-center"
          >
            <p className="text-gray-400 text-sm mb-4 text-center">Word to Guess</p>
            <p className="text-5xl font-mono font-bold text-amber-400 text-center mb-8 tracking-widest">
              {displayWord}
            </p>

            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-red-500 mb-2">Game Over!</p>
                <p className="text-gray-300">The word was: <span className="text-amber-400 font-bold">{word}</span></p>
              </motion.div>
            )}

            {won && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-green-500 mb-2">You Won!</p>
                <p className="text-gray-300">Congratulations!</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Alphabet Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-lg p-8 border border-amber-500/30 mb-8"
        >
          <p className="text-gray-400 text-sm mb-4">Select Letters</p>
          <div className="grid grid-cols-6 md:grid-cols-13 gap-2">
            {alphabet.map(letter => (
              <motion.button
                key={letter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGuess(letter)}
                disabled={guessedLetters.includes(letter) || gameOver || won}
                className={`py-2 px-3 rounded font-bold text-sm transition-all ${
                  guessedLetters.includes(letter)
                    ? word.includes(letter)
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {letter}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all"
          >
            <RotateCcw size={20} />
            New Game
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </motion.div>
      </main>

      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
      />

      <Footer />
    </div>
  );
}
