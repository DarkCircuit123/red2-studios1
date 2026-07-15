import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseCrudService } from '@/integrations';
import Header from '../Header';
import Footer from '../Footer';

interface LeaderboardEntry {
  initials: string;
  score: number;
}

interface HangmanWord {
  _id: string;
  word: string;
  category: string;
  difficulty: number;
}

interface HangmanLeaderboardEntry {
  _id: string;
  initials: string;
  score: number;
  category: string;
  timestamp: string;
}

// Fallback word lists (4-12 letters, deduplicated)
const FALLBACK_WORDS: Record<string, string[]> = {
  FASHION: [
    'BLAZER', 'CARDIGAN', 'DENIM', 'FLANNEL', 'HOODIE', 'JACKET', 'JEANS', 'JUMPER', 'KIMONO', 'LEATHER',
    'LINEN', 'OVERCOAT', 'PARKA', 'PONCHO', 'PULLOVER', 'RAINCOAT', 'SHAWL', 'SHIRT', 'SHORTS', 'SKIRT',
    'SLACKS', 'SWEATER', 'TANK', 'TUXEDO', 'VEST', 'WINDBREAKER', 'WOOL', 'ANKLET', 'ARMBAND', 'BADGE',
    'BELT', 'BERET', 'BLOUSE', 'BOWTIE', 'BRACELET', 'BROOCH', 'BUCKLE', 'BUTTON', 'CHAIN', 'CHOKER',
    'COLLAR', 'EARRINGS', 'FABRIC', 'FEATHER', 'FRINGE', 'GARLAND', 'GARTER', 'GEMSTONE', 'GLOVES', 'GOWN',
    'HANDBAG', 'HATBAND', 'HEADBAND', 'HEADDRESS', 'HEEL', 'HELMET', 'HOSE', 'JEWEL', 'JEWELRY', 'KILT',
    'KNAPSACK', 'LACE', 'LAPEL', 'LEGGING', 'LOCKET', 'LOAFER', 'MOCCASIN', 'MONOCLE', 'NECKLACE', 'NECKTIE',
    'NECKWEAR', 'ORNAMENT', 'OUTFIT', 'OXFORDS', 'PAISLEY', 'PALETTE', 'PANT', 'PATCH', 'PATTERN', 'PENDANT',
    'PETTICOAT', 'PLEAT', 'PLUME', 'POCKET', 'POUCH', 'PURSE', 'QUILT', 'RIBBON', 'RING', 'RIVET',
    'ROBE', 'RUFFLE', 'SASH', 'SCARF', 'SEQUIN', 'SHEATH', 'SHELL', 'SHOE', 'SHOELACE', 'SHOULDER',
    'SILHOUETTE', 'SLIPPER', 'SNAP', 'SNEAKER', 'SOCK', 'SOLE', 'SOMBRERO', 'SPANGLE', 'SPUR', 'STITCH',
    'STRAP', 'STRIPE', 'STUD', 'STYLE', 'SUEDE', 'SUIT', 'SUNHAT', 'SUSPENDER', 'SWAG', 'TASSEL',
    'TEXTILE', 'THONG', 'THREAD', 'TIARA', 'TOGGLE', 'TOPHAT', 'TORQUE', 'TRIM', 'TRUNK', 'TUNIC',
    'TURBAN', 'TURTLENECK', 'TWEED', 'TWILL', 'UNIFORM', 'VEIL', 'VELCRO', 'VELVET', 'VISOR', 'WAISTBAND',
    'WALLET', 'WATCH', 'WATERMARK', 'WEAVE', 'WEBBING', 'WEDGE', 'WELT', 'WHIP', 'WHISKER', 'WICKER',
    'WIMPLE', 'WINKLE', 'WIRE', 'WRIST', 'WRISTBAND', 'WRISTLET', 'YARN', 'YOKE', 'ZIPPER'
  ],
  PHOTOGRAPHY: [
    'APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'LENS', 'CAMERA', 'SENSOR', 'PIXEL', 'RESOLUTION', 'MEGAPIXEL',
    'DEPTH', 'FIELD', 'BOKEH', 'BLUR', 'SHARP', 'CLARITY', 'CONTRAST', 'SATURATION', 'VIBRANCE', 'HUESHIFT',
    'WHITEBALANCE', 'KELVIN', 'HISTOGRAM', 'METERING', 'SPOTMETER', 'MATRIX', 'CENTER', 'WEIGHTED', 'SPEED', 'FASTSHUTTER',
    'SLOWSHUTTER', 'BULB', 'TIMELAPSE', 'LONGEXPOSURE', 'MOTION', 'FREEZE', 'ISO', 'SENSITIVITY', 'NOISE', 'GRAIN',
    'DYNAMIC', 'RANGE', 'SHADOW', 'HIGHLIGHT', 'MIDTONE', 'TONE', 'CURVE', 'LEVELS', 'BRIGHTNESS', 'DARKNESS',
    'LUMINOSITY', 'VALUE', 'TINT', 'COLORCAST', 'CORRECTION', 'GRADING', 'FILTER', 'POLARIZER', 'NEUTRAL', 'DENSITY',
    'GRADUATED', 'SOFTFOCUS', 'DIFFUSER', 'REFLECTOR', 'DIFFUSION', 'SOFTBOX', 'HARDLIGHT', 'KEYLIGHT', 'FILLLIGHT', 'BACKLIGHT',
    'SIDELIGHT', 'TOPLIGHT', 'UNDERLIGHT', 'RIMLIGHT', 'CATCHLIGHT', 'SPECULAR', 'DIFFUSE', 'REFLECTION', 'REFRACTION', 'TRANSMISSION',
    'ABSORPTION', 'SCATTERING', 'GLARE', 'FLARE', 'GHOSTING', 'ABERRATION', 'VIGNETTE', 'DISTORTION', 'CHROMATIC', 'SPHERICAL',
    'COMA', 'ASTIGMATISM', 'CURVATURE', 'PINCUSHION', 'BARREL', 'COMPOSITION', 'FRAMING', 'RULE', 'THIRDS', 'LEADING',
    'LINE', 'SYMMETRY', 'BALANCE', 'ASYMMETRY', 'DIAGONAL', 'PERSPECTIVE', 'LAYERING', 'FOREGROUND', 'BACKGROUND', 'MIDGROUND',
    'SUBJECT', 'NEGATIVE', 'SPACE', 'PORTRAIT', 'HEADSHOT', 'PROFILE', 'THREEQUARTER', 'FULLBODY', 'LANDSCAPE', 'SEASCAPE',
    'CITYSCAPE', 'MACRO', 'CLOSEUP', 'WILDLIFE', 'NATURE', 'STILL', 'LIFE', 'PRODUCT', 'FOOD', 'FASHION',
    'STREET', 'DOCUMENTARY', 'PHOTOJOURNALISM', 'STUDIO', 'LOCATION', 'OUTDOOR', 'INDOOR', 'NATURAL', 'ARTIFICIAL', 'AMBIENT',
    'AVAILABLE', 'CONTINUOUS', 'STROBE', 'FLASH', 'SPEEDLIGHT', 'UMBRELLA', 'BEAUTY', 'DISH', 'OCTABOX', 'STRIPBOX',
    'RINGLIGHT', 'LEDPANEL', 'TRIPOD', 'MONOPOD', 'GIMBAL', 'STABILIZER', 'STEADICAM', 'DOLLY', 'SLIDER', 'CRANE',
    'JIBARM', 'MOTORIZED', 'REMOTE', 'TRIGGER', 'WIRELESS', 'CABLE', 'SYNC', 'HOTSHOE', 'BRACKET', 'CLAMP',
    'MOUNT', 'ADAPTER', 'PRIME', 'ZOOM', 'TELEPHOTO', 'WIDE', 'ULTRAWIDE', 'FISHEYE', 'MACRO', 'TILT',
    'SHIFT', 'CONVERTER', 'EXTENDER', 'TELECONVERTER', 'DIOPTER', 'CLOSEUPFILTER', 'EXTENSION', 'TUBE', 'BELLOWS', 'REVERSAL', 'RING'
  ],
  MODELING: [
    'RUNWAY', 'CATWALK', 'STAGE', 'PLATFORM', 'STRUT', 'WALK', 'POSE', 'STANCE', 'POSTURE', 'ATTITUDE',
    'EXPRESSION', 'SMIZE', 'GAZE', 'STARE', 'LOOK', 'GLANCE', 'PROFILE', 'ANGLE', 'CHEEKBONE', 'JAWLINE',
    'BONE', 'STRUCTURE', 'SYMMETRY', 'PROPORTION', 'HEIGHT', 'WEIGHT', 'MEASUREMENTS', 'BUST', 'WAIST', 'HIP',
    'INSEAM', 'SHOE', 'SIZE', 'HAIR', 'COLOR', 'TEXTURE', 'STYLE', 'MAKEUP', 'FOUNDATION', 'CONTOUR',
    'HIGHLIGHT', 'BLUSH', 'EYESHADOW', 'EYELINER', 'MASCARA', 'LIPSTICK', 'NAIL', 'POLISH', 'SKINCARE', 'MOISTURIZER',
    'SUNSCREEN', 'EXFOLIATE', 'CLEANSER', 'TONER', 'SERUM', 'MASK', 'TREATMENT', 'FACIAL', 'PEEL', 'MICRODERMABRASION',
    'PORTFOLIO', 'HEADSHOT', 'COMPOSITE', 'TEARSHEET', 'EDITORIAL', 'COMMERCIAL', 'PRINT', 'DIGITAL', 'VIDEO', 'SHOWROOM',
    'FITTING', 'ALTERATION', 'TAILORING', 'SEAMSTRESS', 'DESIGNER', 'STYLIST', 'WARDROBE', 'AGENCY', 'AGENT', 'BOOKER',
    'SCOUT', 'TALENT', 'MANAGER', 'COACH', 'TRAINER', 'CHOREOGRAPHER', 'DIRECTOR', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'CINEMATOGRAPHER',
    'PRODUCER', 'PRODUCTION', 'CREW', 'LIGHTING', 'SOUND', 'GRIP', 'GAFFER', 'CASTING', 'AUDITION', 'CALLBACK',
    'BOOKING', 'CONTRACT', 'RATE', 'PAYMENT', 'INVOICE', 'ROYALTY', 'RESIDUAL', 'BRAND', 'AMBASSADOR', 'ENDORSEMENT',
    'SPONSORSHIP', 'COLLABORATION', 'PARTNERSHIP', 'INFLUENCER', 'SOCIAL', 'MEDIA', 'FOLLOWERS', 'ENGAGEMENT', 'REACH', 'IMPRESSION',
    'CLICK', 'CONVERSION', 'CAMPAIGN', 'ADVERTISEMENT', 'BILLBOARD', 'TRANSIT', 'MAGAZINE', 'NEWSPAPER', 'CATALOG', 'BROCHURE',
    'FLYER', 'POSTER', 'BANNER', 'SIGNAGE', 'DISPLAY', 'FASHION', 'WEEK', 'SHOW', 'COLLECTION', 'SEASON',
    'TREND', 'AESTHETIC', 'VIBE', 'ENERGY', 'CONFIDENCE', 'PRESENCE', 'CHARISMA', 'PERSONALITY', 'PROFESSIONALISM', 'PUNCTUALITY',
    'RELIABILITY', 'FLEXIBILITY', 'ADAPTABILITY', 'RESILIENCE', 'NETWORKING', 'CONNECTION', 'RELATIONSHIP', 'MENTOR', 'ROLE', 'MODEL',
    'INSPIRATION', 'MOTIVATION', 'GOAL', 'AMBITION', 'DREAM', 'PASSION', 'DEDICATION', 'COMMITMENT', 'DISCIPLINE', 'WORK',
    'ETHIC', 'HUSTLE', 'GRIND', 'PERSISTENCE', 'REJECTION', 'CRITICISM', 'FEEDBACK', 'IMPROVEMENT', 'GROWTH', 'DEVELOPMENT',
    'EVOLUTION', 'TRANSFORMATION', 'REINVENTION', 'IDENTITY', 'UNIQUE', 'SPECIAL', 'MEMORABLE', 'DISTINCTIVE', 'RECOGNIZABLE', 'ICONIC',
    'LEGENDARY', 'SUPERMODEL', 'CELEBRITY'
  ],
};

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
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [recentlySeenWords, setRecentlySeenWords] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const wordRef = useRef<string>('');
  const initialsInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const maxWrong = 6;

  // Deduplicated categories
  const categories = FALLBACK_WORDS;

  // Load leaderboard and recently seen words from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hangmanLeaderboard');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
    const recentSaved = localStorage.getItem('hangmanRecentlySeenWords');
    if (recentSaved) {
      setRecentlySeenWords(JSON.parse(recentSaved));
    }
  }, []);

  // Initialize audio context on first click
  const unlockAudio = useCallback(() => {
    if (!audioUnlocked && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioUnlocked(true);
      } catch (e) {
        console.warn('Audio context initialization failed:', e);
      }
    }
  }, [audioUnlocked]);

  // Play success sound
  const playSuccessSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
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
  }, [isMuted]);

  // Play wrong sound
  const playWrongSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
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
  }, [isMuted]);

  // Play funny losing sounds
  const playFunnyLosingSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Sad trombone effect
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }, [isMuted]);

  // Calculate score based on word length and wrong guesses (proportional scoring)
  const calculateScore = useCallback((wrongGuesses: number, wordLength: number): number => {
    const baseScore = wordLength * 10;
    const penaltyPerWrong = baseScore / maxWrong;
    return Math.max(0, Math.round(baseScore - wrongGuesses * penaltyPerWrong));
  }, []);

  // Save score to leaderboard
  const saveScore = useCallback((initials: string, score: number) => {
    const newEntry: LeaderboardEntry = { initials: initials.toUpperCase(), score };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    setLeaderboard(updated);
    localStorage.setItem('hangmanLeaderboard', JSON.stringify(updated));
    setShowInitialsPrompt(false);
    setPlayerInitials('');
  }, [leaderboard]);

  // Get word avoiding recently seen ones
  const getNextWord = useCallback((category: string): string => {
    const categoryWords = (categories as any)[category];
    let word = '';
    let attempts = 0;
    
    do {
      word = categoryWords[Math.floor(Math.random() * categoryWords.length)].toUpperCase();
      attempts++;
    } while (recentlySeenWords.includes(word) && attempts < 10);
    
    return word;
  }, [recentlySeenWords]);

  // Initialize game with selected category
  const startGame = useCallback((category: string) => {
    unlockAudio();
    const newWord = getNextWord(category);
    wordRef.current = newWord;

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
  }, [getNextWord, unlockAudio]);

  // Handle letter guess
  const handleGuess = useCallback((letter: string) => {
    setGameState(prevState => {
      if (prevState.gameOver || prevState.won) return prevState;
      if (prevState.guessed.includes(letter)) return prevState;

      const newGuessed = [...prevState.guessed, letter];
      let newDisplayWord = [...prevState.displayWord];
      let newWrongGuesses = prevState.wrongGuesses;

      if (prevState.word.includes(letter)) {
        // Correct guess
        for (let i = 0; i < prevState.word.length; i++) {
          if (prevState.word[i] === letter) {
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

      if (isLost) {
        playFunnyLosingSound();
      }

      if (isWon) {
        const score = calculateScore(newWrongGuesses, prevState.word.length);
        setCurrentScore(score);
        setShowInitialsPrompt(true);
        // Add to recently seen
        setRecentlySeenWords(prev => {
          const updated = [prevState.word, ...prev].slice(0, 20);
          localStorage.setItem('hangmanRecentlySeenWords', JSON.stringify(updated));
          return updated;
        });
      }

      return {
        ...prevState,
        guessed: newGuessed,
        displayWord: newDisplayWord,
        wrongGuesses: newWrongGuesses,
        gameOver: isLost,
        won: isWon,
      };
    });
  }, [playSuccessSound, playWrongSound, playFunnyLosingSound, calculateScore]);

  // Keyboard input - prevent bleed into modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process if modal is open
      if (showInitialsPrompt) {
        if (e.key === 'Escape') {
          setShowInitialsPrompt(false);
          setPlayerInitials('');
        }
        return;
      }

      const letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        e.preventDefault();
        handleGuess(letter);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, showInitialsPrompt]);

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

  const newGame = useCallback(() => {
    if (selectedCategory) {
      startGame(selectedCategory);
    }
  }, [selectedCategory, startGame]);

  // Focus trap for modal
  useEffect(() => {
    if (showInitialsPrompt && initialsInputRef.current) {
      initialsInputRef.current.focus();
    }
  }, [showInitialsPrompt]);

  return (
    <div className="min-h-screen bg-black flex flex-col pt-24">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-12 md:py-16" onClick={unlockAudio}>
        <div className="w-full max-w-6xl">
          {/* Category Selection */}
          {!selectedCategory ? (
            <div className="bg-gradient-to-br from-primary/15 via-black to-black rounded-2xl border border-primary/40 p-12 md:p-16 lg:p-20 space-y-12">
              <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight">Hangman Game</h1>
                <p className="text-base md:text-lg font-paragraph text-white/70 max-w-3xl mx-auto leading-relaxed">Choose your difficulty level and test your knowledge across fashion, photography, and modeling disciplines</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {Object.keys(categories).map((category) => (
                  <button
                    key={category}
                    onClick={() => startGame(category)}
                    className="group relative p-8 md:p-10 bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/50 rounded-xl hover:border-primary/80 hover:from-primary/35 hover:to-primary/15 transition-all duration-300 active:scale-95 overflow-hidden min-h-40 flex flex-col justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/0 transition-all duration-300" />
                    <div className="relative z-10 space-y-3 flex flex-col items-center text-center">
                      <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-heading font-bold text-primary group-hover:text-white transition-colors duration-300 uppercase tracking-wide line-clamp-1 w-full">{category}</p>
                      <p className="text-xs sm:text-sm md:text-base font-paragraph text-white/60 group-hover:text-white/80 transition-colors duration-300">
                        {(categories as any)[category].length} words
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Game Container - Main */}
              <div className="lg:col-span-2 bg-gradient-to-br from-primary/15 via-black to-black rounded-2xl border border-primary/40 p-10 md:p-14 space-y-10">
                {/* Category & Stats */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-primary/20">
                  <div>
                    <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">Category</p>
                    <p className="text-3xl md:text-4xl font-heading text-primary font-bold">{gameState.category}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">Wrong Guesses</p>
                    <p className={`text-4xl md:text-5xl font-heading font-bold ${gameState.wrongGuesses >= maxWrong ? 'text-red-500' : 'text-white'}`}>
                      {gameState.wrongGuesses}/{maxWrong}
                    </p>
                  </div>
                </div>

                {/* Hangman Drawing */}
                <div className="flex justify-center py-8">
                  <svg width="400" height="300" viewBox="0 0 400 300" className="w-full max-w-sm">
                    {/* Gallows */}
                    <line x1="150" y1="250" x2="150" y2="50" stroke="#d4a574" strokeWidth="4" />
                    <line x1="150" y1="50" x2="300" y2="50" stroke="#d4a574" strokeWidth="4" />
                    <line x1="300" y1="50" x2="300" y2="130" stroke="#d4a574" strokeWidth="3" />
                    {/* Hangman parts */}
                    {renderHangman()}
                  </svg>
                </div>

                {/* Word Display */}
                <div className="text-center py-8 bg-primary/10 rounded-xl border border-primary/20 p-8">
                  <p className="text-6xl md:text-7xl font-mono font-bold text-white tracking-widest break-words">
                    {gameState.displayWord.join(' ')}
                  </p>
                </div>

                {/* Game Status - YOU WIN */}
                {gameState.won && (
                  <div className="text-center p-8 bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-500/50 rounded-xl">
                    <p className="text-4xl md:text-5xl font-heading font-bold text-green-400 mb-3">YOU WIN!</p>
                    <p className="text-2xl font-paragraph text-green-300">Score: {currentScore}</p>
                  </div>
                )}

                {/* Game Status - YOU LOSE */}
                {gameState.gameOver && !gameState.won && (
                  <div className="text-center p-8 bg-gradient-to-br from-red-900/40 to-red-900/10 border border-red-500/50 rounded-xl">
                    <p className="text-4xl md:text-5xl font-heading font-bold text-red-400 mb-3">YOU LOSE!</p>
                    <p className="text-2xl font-paragraph text-red-300 mb-4">The word was: <span className="font-mono font-bold">{wordRef.current}</span></p>
                  </div>
                )}

                {/* Guessed Letters */}
                <div className="space-y-4">
                  <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Guessed Letters</p>
                  <div className="flex flex-wrap gap-3 p-6 bg-white/5 rounded-xl border border-white/10 min-h-16">
                    {gameState.guessed.length === 0 ? (
                      <p className="text-white/40 text-sm">No letters guessed yet</p>
                    ) : (
                      gameState.guessed.map((letter) => (
                        <span
                          key={letter}
                          className={`px-4 py-2 rounded-lg font-mono text-base font-bold transition-all ${
                            gameState.word.includes(letter)
                              ? 'bg-green-900/50 text-green-300 border border-green-500/50'
                              : 'bg-red-900/50 text-red-300 border border-red-500/50'
                          }`}
                        >
                          {letter}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Letter Buttons */}
                <div className="space-y-4">
                  <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Click Letters to Guess</p>
                  <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                      <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={gameState.guessed.includes(letter) || gameState.gameOver || gameState.won}
                        className={`py-3 px-2 md:px-3 text-sm md:text-base font-mono font-bold rounded-lg transition-all ${
                          gameState.guessed.includes(letter)
                            ? gameState.word.includes(letter)
                              ? 'bg-green-900/50 text-green-300 border border-green-500/50 cursor-not-allowed'
                              : 'bg-red-900/50 text-red-300 border border-red-500/50 cursor-not-allowed'
                            : 'bg-primary/30 text-white border border-primary/60 hover:bg-primary/50 hover:border-primary active:scale-95'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-sm font-paragraph text-white/50 p-6 bg-white/5 rounded-xl border border-white/10">
                  <p>Press letter keys on your keyboard or click buttons above. You have {maxWrong} wrong guesses allowed.</p>
                </div>

                {/* New Game Button */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                  <button
                    onClick={newGame}
                    disabled={!gameState.won && !gameState.gameOver}
                    className={`px-8 py-4 font-heading font-bold text-lg rounded-lg transition-all active:scale-95 ${
                      (gameState.won || gameState.gameOver)
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    New Game
                  </button>
                  <button
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
                      wordRef.current = '';
                    }}
                    className="px-8 py-4 bg-white/10 text-white font-heading font-bold text-lg rounded-lg hover:bg-white/20 transition-all active:scale-95"
                  >
                    Change Category
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="px-8 py-4 bg-white/10 text-white font-heading font-bold text-lg rounded-lg hover:bg-white/20 transition-all active:scale-95"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                  </button>
                </div>
              </div>
              
              {/* Leaderboard Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-primary/15 via-black to-black rounded-2xl border border-primary/40 p-10 sticky top-32">
                  <h2 className="text-3xl font-heading font-bold text-white mb-8">Top 3 Scores</h2>
                  
                  {leaderboard.length === 0 ? (
                    <p className="text-white/50 text-center py-12 font-paragraph">No scores yet. Play to get on the board!</p>
                  ) : (
                    <div className="space-y-4">
                      {leaderboard.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-primary/20 border border-primary/40 rounded-lg hover:border-primary/60 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-heading font-bold text-primary w-8">#{index + 1}</span>
                            <span className="text-xl font-mono font-bold text-white">{entry.initials}</span>
                          </div>
                          <span className="text-2xl font-heading font-bold text-green-400">{entry.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Initials Prompt Modal - with ARIA roles and focus trap */}
        {showInitialsPrompt && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div 
              ref={modalRef}
              className="bg-gradient-to-br from-primary/20 via-black to-black rounded-2xl border border-primary/50 p-12 max-w-md w-full shadow-2xl"
            >
              <h2 id="modal-title" className="text-4xl font-heading font-bold text-white mb-4 text-center">Great Job!</h2>
              <p className="text-lg font-paragraph text-white/70 text-center mb-8">Enter your initials to save your score</p>
              
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-5xl font-heading font-bold text-green-400 mb-2">{currentScore}</p>
                  <p className="text-sm font-mono text-white/50 uppercase tracking-widest">Points</p>
                </div>
                
                <input
                  ref={initialsInputRef}
                  type="text"
                  maxLength={3}
                  value={playerInitials}
                  onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())}
                  placeholder="ABC"
                  className="w-full px-6 py-4 bg-primary/20 border border-primary/60 rounded-lg text-white text-center text-3xl font-mono font-bold placeholder-white/30 focus:outline-none focus:border-primary focus:bg-primary/30 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playerInitials.length > 0) {
                      saveScore(playerInitials, currentScore);
                    } else if (e.key === 'Escape') {
                      setShowInitialsPrompt(false);
                      setPlayerInitials('');
                    }
                  }}
                  aria-label="Enter your initials"
                />
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => saveScore(playerInitials || 'AAA', currentScore)}
                    disabled={playerInitials.length === 0}
                    className={`flex-1 px-6 py-4 font-heading font-bold text-lg rounded-lg transition-all active:scale-95 ${
                      playerInitials.length > 0
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Save Score
                  </button>
                  <button
                    onClick={() => {
                      setShowInitialsPrompt(false);
                      setPlayerInitials('');
                    }}
                    className="flex-1 px-6 py-4 bg-white/10 text-white font-heading font-bold text-lg rounded-lg hover:bg-white/20 transition-all active:scale-95"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
