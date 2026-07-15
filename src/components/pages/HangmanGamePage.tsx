import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface LeaderboardEntry {
  initials: string;
  score: number;
  vipTier: number;
}

interface VIPTier {
  level: number;
  name: string;
  minScore: number;
  color: string;
  multiplier: number;
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
  const [vipTier, setVipTier] = useState(0);
  const [showCoinDrop, setShowCoinDrop] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [livePlayersCount, setLivePlayersCount] = useState(Math.floor(Math.random() * 500) + 100);
  const [progressiveJackpot, setProgressiveJackpot] = useState(50000);
  const audioContextRef = useRef<AudioContext | null>(null);
  const coinDropCountRef = useRef(0);
  const ambientOscRef = useRef<OscillatorNode | null>(null);

  const VIP_TIERS: VIPTier[] = [
    { level: 0, name: 'PLAYER', minScore: 0, color: '#888888', multiplier: 1 },
    { level: 1, name: 'SILVER', minScore: 250, color: '#c0c0c0', multiplier: 1.2 },
    { level: 2, name: 'GOLD', minScore: 500, color: '#ffd700', multiplier: 1.5 },
    { level: 3, name: 'PLATINUM', minScore: 750, color: '#e5e4e2', multiplier: 2 },
    { level: 4, name: 'DIAMOND', minScore: 1000, color: '#b9f2ff', multiplier: 2.5 },
  ];

  const categories = {
    'COUTURE': [
      'BLAZER', 'CARDIGAN', 'DENIM', 'FLANNEL', 'HOODIE', 'JACKET', 'JEANS', 'JUMPER', 'KIMONO', 'LEATHER',
      'LINEN', 'OVERCOAT', 'PARKA', 'PONCHO', 'PULLOVER', 'RAINCOAT', 'SHAWL', 'SHIRT', 'SHORTS', 'SKIRT',
      'SLACKS', 'SWEATER', 'SWEATSHIRT', 'TAFFETA', 'TANK', 'TUXEDO', 'VEST', 'WAISTCOAT', 'WINDBREAKER', 'WOOL',
      'ACCESSORIES', 'ANKLET', 'ARMBAND', 'BADGE', 'BELT', 'BERET', 'BINDER', 'BLOUSE', 'BOWTIE', 'BRACELET',
      'BROOCH', 'BUCKLE', 'BUTTON', 'CAP', 'CHAIN', 'CHOKER', 'CLASP', 'CLIP', 'COLLAR', 'CUFFLINKS',
      'EARRINGS', 'EMBLEM', 'FABRIC', 'FASTENER', 'FEATHER', 'FIBULA', 'FILLET', 'FRINGE', 'GARLAND', 'GARTER',
      'GEMSTONE', 'GLOVES', 'GORGET', 'GOWN', 'HALO', 'HALTER', 'HANDBAG', 'HANDKERCHIEF', 'HATBAND', 'HEADBAND',
      'HEADPIECE', 'HEADDRESS', 'HEEL', 'HELMET', 'HEMLINE', 'HOSE', 'INSIGNIA', 'INSEAM', 'INSOLE', 'JEWEL',
      'JEWELRY', 'KILT', 'KNAPSACK', 'LACE', 'LAPEL', 'LARIAT', 'LASSO', 'LEGGING', 'LOCKET', 'LOAFER',
      'MOCCASIN', 'MONOCLE', 'NECKLACE', 'NECKTIE', 'NECKWEAR', 'NOSEGAY', 'ORNAMENT', 'OUTFIT', 'OXFORDS', 'PAISLEY',
      'PALETTE', 'PANT', 'PANTYHOSE', 'PATCH', 'PATTERN', 'PENDANT', 'PETTICOAT', 'PLEAT', 'PLUME', 'POCKET',
      'POUCH', 'PURSE', 'QUILT', 'RIBBON', 'RING', 'RIVET', 'ROBE', 'RUFFLE', 'SASH', 'SCARF',
      'SEQUIN', 'SHAWLETTE', 'SHEATH', 'SHELL', 'SHOE', 'SHOELACE', 'SHOULDER', 'SILHOUETTE', 'SLIPPER', 'SNAP',
      'SNEAKER', 'SOCK', 'SOLE', 'SOMBRERO', 'SPANGLE', 'SPUR', 'STITCH', 'STRAP', 'STRIPE', 'STUD',
      'STYLE', 'SUEDE', 'SUIT', 'SUNHAT', 'SUSPENDER', 'SWAG', 'TASSEL', 'TEXTILE', 'THONG', 'THREAD',
      'TIARA', 'TICK', 'TIE', 'TIGHTS', 'TOGGLE', 'TOPHAT', 'TORQUE', 'TRIM', 'TRUNK', 'TUNIC',
      'TURBAN', 'TURTLENECK', 'TUXEDO', 'TWEED', 'TWILL', 'UNIFORM', 'VEIL', 'VELCRO', 'VELVET', 'VISOR',
      'WAISTBAND', 'WALLET', 'WATCH', 'WATERMARK', 'WEAVE', 'WEBBING', 'WEDGE', 'WELT', 'WHIP', 'WHISKER',
      'WICKER', 'WIMPLE', 'WINKLE', 'WIRE', 'WRIST', 'WRISTBAND', 'WRISTLET', 'YARN', 'YOKE', 'ZIPPER'
    ],
    'LENS': [
      'APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'LENS', 'CAMERA', 'SENSOR', 'PIXEL', 'RESOLUTION', 'MEGAPIXEL',
      'DEPTH', 'FIELD', 'BOKEH', 'BLUR', 'SHARP', 'CLARITY', 'CONTRAST', 'SATURATION', 'VIBRANCE', 'HUESHIFT',
      'WHITEBALANCE', 'COLORTEMPERATURE', 'KELVIN', 'HISTOGRAM', 'EXPOSURE', 'METERING', 'SPOTMETER', 'MATRIX', 'CENTER', 'WEIGHTED',
      'SHUTTER', 'SPEED', 'FASTSHUTTER', 'SLOWSHUTTER', 'BULB', 'TIMELAPSE', 'LONGEXPOSURE', 'MOTION', 'BLUR', 'FREEZE',
      'ISO', 'SENSITIVITY', 'NOISE', 'GRAIN', 'DYNAMIC', 'RANGE', 'SHADOW', 'HIGHLIGHT', 'MIDTONE', 'TONE',
      'CURVE', 'LEVELS', 'BRIGHTNESS', 'DARKNESS', 'LUMINOSITY', 'VALUE', 'TINT', 'COLORCAST', 'CORRECTION', 'GRADING',
      'FILTER', 'POLARIZER', 'NEUTRAL', 'DENSITY', 'GRADUATED', 'SOFTFOCUS', 'DIFFUSER', 'REFLECTOR', 'DIFFUSION', 'SOFTBOX',
      'HARDLIGHT', 'KEYLIGHT', 'FILLLIGHT', 'BACKLIGHT', 'SIDELIGHT', 'TOPLIGHT', 'UNDERLIGHT', 'RIMLIGHT', 'CATCHLIGHT', 'SPECULAR',
      'DIFFUSE', 'REFLECTION', 'REFRACTION', 'TRANSMISSION', 'ABSORPTION', 'SCATTERING', 'GLARE', 'FLARE', 'GHOSTING', 'ABERRATION',
      'VIGNETTE', 'DISTORTION', 'CHROMATIC', 'SPHERICAL', 'COMA', 'ASTIGMATISM', 'CURVATURE', 'FIELD', 'PINCUSHION', 'BARREL',
      'COMPOSITION', 'FRAMING', 'RULE', 'THIRDS', 'LEADING', 'LINE', 'SYMMETRY', 'BALANCE', 'ASYMMETRY', 'DIAGONAL',
      'PERSPECTIVE', 'DEPTH', 'LAYERING', 'FOREGROUND', 'BACKGROUND', 'MIDGROUND', 'SUBJECT', 'BACKGROUND', 'NEGATIVE', 'SPACE',
      'PORTRAIT', 'HEADSHOT', 'PROFILE', 'THREEQUARTER', 'FULLBODY', 'LANDSCAPE', 'SEASCAPE', 'CITYSCAPE', 'MACRO', 'CLOSEUP',
      'WILDLIFE', 'NATURE', 'STILL', 'LIFE', 'PRODUCT', 'FOOD', 'FASHION', 'STREET', 'DOCUMENTARY', 'PHOTOJOURNALISM',
      'STUDIO', 'LOCATION', 'OUTDOOR', 'INDOOR', 'NATURAL', 'ARTIFICIAL', 'AMBIENT', 'AVAILABLE', 'CONTINUOUS', 'STROBE',
      'FLASH', 'SPEEDLIGHT', 'SOFTBOX', 'UMBRELLA', 'BEAUTY', 'DISH', 'OCTABOX', 'STRIPBOX', 'RINGLIGHT', 'LEDPANEL',
      'TRIPOD', 'MONOPOD', 'GIMBAL', 'STABILIZER', 'STEADICAM', 'DOLLY', 'SLIDER', 'CRANE', 'JIBARM', 'MOTORIZED',
      'REMOTE', 'TRIGGER', 'WIRELESS', 'CABLE', 'SYNC', 'HOTSHOE', 'BRACKET', 'CLAMP', 'MOUNT', 'ADAPTER',
      'LENS', 'PRIME', 'ZOOM', 'TELEPHOTO', 'WIDE', 'ULTRAWIDE', 'FISHEYE', 'MACRO', 'TILT', 'SHIFT',
      'CONVERTER', 'EXTENDER', 'TELECONVERTER', 'DIOPTER', 'CLOSEUPFILTER', 'EXTENSION', 'TUBE', 'BELLOWS', 'REVERSAL', 'RING'
    ],
    'RUNWAY': [
      'RUNWAY', 'CATWALK', 'STAGE', 'PLATFORM', 'STRUT', 'WALK', 'POSE', 'STANCE', 'POSTURE', 'ATTITUDE',
      'EXPRESSION', 'SMIZE', 'GAZE', 'STARE', 'LOOK', 'GLANCE', 'PROFILE', 'ANGLE', 'CHEEKBONE', 'JAWLINE',
      'BONE', 'STRUCTURE', 'SYMMETRY', 'PROPORTION', 'HEIGHT', 'WEIGHT', 'MEASUREMENTS', 'BUST', 'WAIST', 'HIP',
      'INSEAM', 'SHOE', 'SIZE', 'HAIR', 'COLOR', 'TEXTURE', 'STYLE', 'MAKEUP', 'FOUNDATION', 'CONTOUR',
      'HIGHLIGHT', 'BLUSH', 'EYESHADOW', 'EYELINER', 'MASCARA', 'LIPSTICK', 'NAIL', 'POLISH', 'SKINCARE', 'MOISTURIZER',
      'SUNSCREEN', 'EXFOLIATE', 'CLEANSER', 'TONER', 'SERUM', 'MASK', 'TREATMENT', 'FACIAL', 'PEEL', 'MICRODERMABRASION',
      'PORTFOLIO', 'HEADSHOT', 'COMPOSITE', 'TEARSHEET', 'EDITORIAL', 'COMMERCIAL', 'PRINT', 'DIGITAL', 'VIDEO', 'COMMERCIAL',
      'RUNWAY', 'SHOWROOM', 'FITTING', 'FITTING', 'ALTERATION', 'TAILORING', 'SEAMSTRESS', 'DESIGNER', 'STYLIST', 'WARDROBE',
      'AGENCY', 'AGENT', 'BOOKER', 'SCOUT', 'TALENT', 'MANAGER', 'COACH', 'TRAINER', 'CHOREOGRAPHER', 'DIRECTOR',
      'PHOTOGRAPHER', 'VIDEOGRAPHER', 'CINEMATOGRAPHER', 'PRODUCER', 'PRODUCTION', 'CREW', 'LIGHTING', 'SOUND', 'GRIP', 'GAFFER',
      'CASTING', 'AUDITION', 'CALLBACK', 'BOOKING', 'CONTRACT', 'RATE', 'PAYMENT', 'INVOICE', 'ROYALTY', 'RESIDUAL',
      'BRAND', 'AMBASSADOR', 'ENDORSEMENT', 'SPONSORSHIP', 'COLLABORATION', 'PARTNERSHIP', 'INFLUENCER', 'SOCIAL', 'MEDIA', 'FOLLOWERS',
      'ENGAGEMENT', 'REACH', 'IMPRESSION', 'CLICK', 'CONVERSION', 'CAMPAIGN', 'ADVERTISEMENT', 'COMMERCIAL', 'BILLBOARD', 'TRANSIT',
      'PRINT', 'MAGAZINE', 'NEWSPAPER', 'CATALOG', 'BROCHURE', 'FLYER', 'POSTER', 'BANNER', 'SIGNAGE', 'DISPLAY',
      'FASHION', 'WEEK', 'SHOW', 'COLLECTION', 'SEASON', 'TREND', 'STYLE', 'AESTHETIC', 'VIBE', 'ENERGY',
      'CONFIDENCE', 'PRESENCE', 'CHARISMA', 'PERSONALITY', 'PROFESSIONALISM', 'PUNCTUALITY', 'RELIABILITY', 'FLEXIBILITY', 'ADAPTABILITY', 'RESILIENCE',
      'NETWORKING', 'CONNECTION', 'RELATIONSHIP', 'MENTOR', 'ROLE', 'MODEL', 'INSPIRATION', 'MOTIVATION', 'GOAL', 'AMBITION',
      'DREAM', 'PASSION', 'DEDICATION', 'COMMITMENT', 'DISCIPLINE', 'WORK', 'ETHIC', 'HUSTLE', 'GRIND', 'PERSISTENCE',
      'REJECTION', 'CRITICISM', 'FEEDBACK', 'IMPROVEMENT', 'GROWTH', 'DEVELOPMENT', 'EVOLUTION', 'TRANSFORMATION', 'REINVENTION', 'BRAND',
      'IDENTITY', 'UNIQUE', 'SPECIAL', 'MEMORABLE', 'DISTINCTIVE', 'RECOGNIZABLE', 'ICONIC', 'LEGENDARY', 'SUPERMODEL', 'CELEBRITY'
    ],
  };

  const maxWrong = 6;

  // Load leaderboard and winnings from localStorage
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

  // Calculate VIP tier based on total winnings
  useEffect(() => {
    let tier = 0;
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (totalWinnings >= VIP_TIERS[i].minScore) {
        tier = i;
        break;
      }
    }
    setVipTier(tier);
  }, [totalWinnings]);

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Ambient casino murmur (low frequency background)
  useEffect(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create ambient murmur
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    osc.start();
    ambientOscRef.current = osc;

    return () => {
      if (ambientOscRef.current) {
        ambientOscRef.current.stop();
        ambientOscRef.current = null;
      }
    };
  }, [soundEnabled]);

  // Slot machine spin sound
  const playSlotMachineSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(200 + i * 100, now + i * 0.05);
      gain.gain.setValueAtTime(0.1, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
      
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.1);
    }
  };

  // Play success sound - casino bell
  const playSuccessSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Bell chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
    
    // Second harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.frequency.setValueAtTime(1600, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.35);
    gain2.gain.setValueAtTime(0.2, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc2.start(now + 0.05);
    osc2.stop(now + 0.35);
  };

  // Play wrong sound - buzzer
  const playWrongSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
  };

  // Play losing sound - sad trombone
  const playFunnyLosingSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    osc.start(now);
    osc.stop(now + 0.6);
  };

  // Play coin drop sound
  const playCoinDropSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.start(now);
    osc.stop(now + 0.2);
  };

  // Calculate score based on wrong guesses with VIP multiplier
  const calculateScore = (wrongGuesses: number): number => {
    const baseScore = Math.max(0, 100 - wrongGuesses * 10);
    return Math.floor(baseScore * VIP_TIERS[vipTier].multiplier);
  };

  // Save score to leaderboard
  const saveScore = (initials: string, score: number) => {
    const newEntry: LeaderboardEntry = { 
      initials: initials.toUpperCase(), 
      score,
      vipTier: vipTier
    };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    setLeaderboard(updated);
    localStorage.setItem('hangmanLeaderboard', JSON.stringify(updated));
    
    // Update total winnings
    const newWinnings = totalWinnings + score;
    setTotalWinnings(newWinnings);
    localStorage.setItem('hangmanWinnings', newWinnings.toString());
    
    // Trigger coin drop animation
    setShowCoinDrop(true);
    playCoinDropSound();
    coinDropCountRef.current = 0;
    
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          playCoinDropSound();
        }, i * 150);
      }
    }, 200);
    
    setTimeout(() => setShowCoinDrop(false), 2000);
    
    setShowInitialsPrompt(false);
    setPlayerInitials('');
  };

  // Initialize game with selected category
  const startGame = (category: string) => {
    playSlotMachineSound();
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

  // Handle letter guess
  const handleGuess = (letter: string) => {
    if (gameState.gameOver || gameState.won || !selectedCategory) return;
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

    if (isLost) {
      // Play funny losing sound
      playFunnyLosingSound();
      // Game over - user can try again
    }

    if (isWon) {
      const score = calculateScore(newWrongGuesses);
      setCurrentScore(score);
      setShowInitialsPrompt(true);
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
    if (selectedCategory) {
      startGame(selectedCategory);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black overflow-hidden relative">
      {/* Multi-layered Vegas background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Radial gradient - spotlight effect */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black opacity-60" 
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255,215,0,0.15) 0%, transparent 50%)'
          }}
        />
        
        {/* Velvet noise texture */}
        <div className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/%3E%3C/filter%3E%3Crect width="400" height="400" fill="white" filter="url(%23noise)"/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }}
        />
        
        {/* Animated spotlight sweep */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.3) 45deg, transparent 90deg)',
              'conic-gradient(from 90deg, transparent 0deg, rgba(255,215,0,0.3) 45deg, transparent 90deg)',
              'conic-gradient(from 180deg, transparent 0deg, rgba(255,215,0,0.3) 45deg, transparent 90deg)',
              'conic-gradient(from 270deg, transparent 0deg, rgba(255,215,0,0.3) 45deg, transparent 90deg)',
              'conic-gradient(from 360deg, transparent 0deg, rgba(255,215,0,0.3) 45deg, transparent 90deg)',
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundPosition: 'center' }}
        />
      </div>

      {/* Swaying chandelier SVG */}
      <motion.div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        animate={{ rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: 'top center' }}
      >
        <svg width="120" height="200" viewBox="0 0 120 200" className="drop-shadow-2xl">
          {/* Chain */}
          <line x1="60" y1="0" x2="60" y2="40" stroke="#d4a574" strokeWidth="3" />
          {/* Chandelier body */}
          <circle cx="60" cy="50" r="20" fill="#ffd700" opacity="0.8" />
          {/* Crystals */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = 60 + Math.cos(angle) * 25;
            const y = 50 + Math.sin(angle) * 25;
            return (
              <circle key={i} cx={x} cy={y} r="4" fill="#ffed4e" opacity="0.9" />
            );
          })}
          {/* Light glow */}
          <circle cx="60" cy="50" r="30" fill="#ffd700" opacity="0.2" />
        </svg>
      </motion.div>

      {/* Animated marquee light chases - Top border */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 z-30 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundSize: '200% 100%',
          boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
        }}
      />

      {/* Animated marquee light chases - Bottom border */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-yellow-300 to-red-500 z-30 pointer-events-none"
        animate={{ backgroundPosition: ['100% 0%', '0% 0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundSize: '200% 100%',
          boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
        }}
      />

      {/* Animated marquee light chases - Left border */}
      <motion.div
        className="fixed left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-300 via-red-500 to-yellow-300 z-30 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundSize: '100% 200%',
          boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
        }}
      />

      {/* Animated marquee light chases - Right border */}
      <motion.div
        className="fixed right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 via-yellow-300 to-red-500 z-30 pointer-events-none"
        animate={{ backgroundPosition: ['0% 100%', '0% 0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundSize: '100% 200%',
          boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
        }}
      />

      {/* Coin drop animation */}
      <AnimatePresence>
        {showCoinDrop && (
          <motion.div
            key="coin-drop"
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-50px',
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: 360 * Math.random(),
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: 'easeIn',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
        {/* Header - VIP Status & Sound Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="text-center md:text-left">
            {/* Neon-flicker title */}
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,0,0,0.6)',
                  '0 0 20px rgba(255,215,0,1), 0 0 40px rgba(255,0,0,0.8)',
                  '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,0,0,0.6)',
                ]
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="text-5xl md:text-7xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 mb-2 tracking-tighter"
            >
              RED2 HANGMAN
            </motion.h1>
            <p className="text-lg md:text-xl font-mono text-yellow-300 tracking-widest animate-pulse">HIGH ROLLER</p>
          </div>
          
          <div className="flex flex-col gap-4 items-center md:items-end">
            {/* VIP Medallion */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-4 border-yellow-200 flex items-center justify-center shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,255,255,0.3)'
              }}
            >
              <div className="text-center">
                <p className="text-xs font-mono text-yellow-900 uppercase tracking-widest mb-1">VIP</p>
                <p className="text-2xl font-heading font-black text-yellow-900" style={{ color: VIP_TIERS[vipTier].color }}>
                  {VIP_TIERS[vipTier].name}
                </p>
              </div>
            </motion.div>

            {/* LED Winnings Scoreboard */}
            <motion.div
              className="px-8 py-4 bg-black border-4 border-yellow-300 rounded-lg"
              style={{
                boxShadow: '0 0 20px rgba(255,215,0,0.8), inset 0 0 10px rgba(255,215,0,0.2)',
                fontFamily: '"Courier New", monospace',
              }}
            >
              <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">TOTAL WINNINGS</p>
              <motion.p
                key={totalWinnings}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-4xl md:text-5xl font-mono font-black text-yellow-300"
              >
                ${totalWinnings.toLocaleString()}
              </motion.p>
            </motion.div>

            {/* Sound Toggle */}
            <motion.button
              onClick={() => setSoundEnabled(!soundEnabled)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-gradient-to-r from-primary to-primary/70 text-white rounded-lg border-2 border-primary hover:border-yellow-400 transition-all"
            >
              {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </motion.button>
          </div>
        </motion.div>

        {/* Social Proof Elements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-4 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Live Players</p>
            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-heading font-black text-white"
            >
              {livePlayersCount.toLocaleString()}
            </motion.p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-4 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Progressive Jackpot</p>
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-2xl font-heading font-black text-yellow-300"
            >
              ${progressiveJackpot.toLocaleString()}
            </motion.p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-4 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Your VIP Tier</p>
            <p className="text-2xl font-heading font-black" style={{ color: VIP_TIERS[vipTier].color }}>
              {VIP_TIERS[vipTier].name}
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-4 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Multiplier</p>
            <p className="text-2xl font-heading font-black text-green-400">
              {VIP_TIERS[vipTier].multiplier}x
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="w-full max-w-7xl">{!selectedCategory ? (
            // Category Selection - Slot Machine Style
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <p className="text-xl md:text-2xl font-mono text-yellow-300 tracking-widest animate-pulse">
                  ★ SELECT YOUR GAME ★
                </p>
                <p className="text-base md:text-lg font-paragraph text-white/70 max-w-3xl mx-auto">
                  Choose your category and spin the wheel. Every correct guess earns you cash. VIP members earn multipliers!
                </p>
              </div>

              {/* Unified Slot Machine Housing */}
              <motion.div
                className="bg-gradient-to-br from-gray-900 via-black to-gray-950 border-4 border-yellow-300 rounded-2xl p-8 md:p-12 shadow-2xl"
                style={{
                  boxShadow: '0 0 40px rgba(255,215,0,0.6), inset 0 0 30px rgba(255,215,0,0.1)'
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  {Object.keys(categories).map((category, idx) => (
                    <motion.button
                      key={category}
                      onClick={() => startGame(category)}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative p-8 md:p-10 bg-gradient-to-br from-primary/30 to-primary/5 border-2 border-primary rounded-xl hover:border-yellow-400 hover:from-primary/50 hover:to-primary/20 transition-all duration-300 overflow-hidden min-h-48 flex flex-col justify-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:to-yellow-400/5 transition-all duration-300" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,215,0,.1)_25%,rgba(255,215,0,.1)_50%,transparent_50%,transparent_75%,rgba(255,215,0,.1)_75%,rgba(255,215,0,.1))] bg-[length:40px_40px] animate-pulse" />
                      </div>
                      <div className="relative z-10 space-y-4 flex flex-col items-center text-center">
                        <div className="text-5xl md:text-6xl font-heading font-black text-yellow-300 group-hover:text-yellow-200 transition-colors">
                          ◆
                        </div>
                        <p className="text-2xl md:text-3xl font-heading font-black text-primary group-hover:text-yellow-300 transition-colors uppercase tracking-wider">
                          {category}
                        </p>
                        <p className="text-sm md:text-base font-mono text-white/60 group-hover:text-white/80 transition-colors">
                          {(categories as any)[category].length} words
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Pull Lever */}
                <motion.div
                  className="flex justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  style={{ transformOrigin: 'top center' }}
                >
                  <div className="w-16 h-32 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-full border-4 border-yellow-400 shadow-lg flex items-center justify-center">
                    <div className="text-2xl font-heading font-black text-yellow-300">⬇</div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            // Game Screen
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Game Area */}
              <div className="lg:col-span-2 space-y-8">
                {/* Category & Stats */}
                <div className="bg-gradient-to-br from-primary/20 via-black to-black rounded-xl border-2 border-primary p-8 md:p-10 space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-primary/30">
                    <div>
                      <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-2">★ Category ★</p>
                      <p className="text-4xl md:text-5xl font-heading font-black text-primary">{gameState.category}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-2">★ Wrong Guesses ★</p>
                      <motion.p
                        key={gameState.wrongGuesses}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-5xl md:text-6xl font-heading font-black ${
                          gameState.wrongGuesses >= maxWrong ? 'text-red-500' : 'text-yellow-300'
                        }`}
                      >
                        {gameState.wrongGuesses}/{maxWrong}
                      </motion.p>
                    </div>
                  </div>

                  {/* Hangman Drawing */}
                  <div className="flex justify-center py-8 bg-black/50 rounded-lg border border-primary/20">
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
                  <motion.div
                    key={gameState.displayWord.join('')}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-center py-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border-2 border-primary/50 p-8"
                  >
                    <p className="text-6xl md:text-7xl font-mono font-black text-yellow-300 tracking-widest break-words">
                      {gameState.displayWord.join(' ')}
                    </p>
                  </motion.div>

                  {/* Game Status */}
                  <AnimatePresence>
                    {gameState.won && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-8 bg-gradient-to-br from-green-900/50 to-green-900/20 border-2 border-green-400 rounded-xl"
                      >
                        <p className="text-5xl md:text-6xl font-heading font-black text-green-300 mb-3 animate-pulse">
                          ★ JACKPOT! ★
                        </p>
                        <p className="text-3xl font-heading font-black text-green-400">+${currentScore.toLocaleString()}</p>
                      </motion.div>
                    )}
                    {gameState.gameOver && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-8 bg-gradient-to-br from-red-900/50 to-red-900/20 border-2 border-red-400 rounded-xl"
                      >
                        <p className="text-5xl md:text-6xl font-heading font-black text-red-300 mb-3">BUST!</p>
                        <p className="text-xl font-paragraph text-red-300">The word was: <span className="font-mono font-black">{gameState.word}</span></p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Guessed Letters */}
                  <div className="space-y-4">
                    <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest">★ Guessed Letters ★</p>
                    <div className="flex flex-wrap gap-3 p-6 bg-black/50 rounded-xl border border-primary/30 min-h-20">
                      {gameState.guessed.length === 0 ? (
                        <p className="text-white/40 text-sm w-full text-center">No letters guessed yet</p>
                      ) : (
                        gameState.guessed.map((letter) => (
                          <motion.span
                            key={letter}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`px-4 py-2 rounded-lg font-mono text-base font-bold transition-all border-2 ${
                              gameState.word.includes(letter)
                                ? 'bg-green-900/50 text-green-300 border-green-500'
                                : 'bg-red-900/50 text-red-300 border-red-500'
                            }`}
                          >
                            {letter}
                          </motion.span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Letter Buttons */}
                  <div className="space-y-4">
                    <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest">★ Click to Guess ★</p>
                    <div className="grid grid-cols-7 gap-2 md:gap-3">
                      {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                        <motion.button
                          key={letter}
                          onClick={() => handleGuess(letter)}
                          disabled={gameState.guessed.includes(letter) || gameState.gameOver || gameState.won}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`py-3 px-2 md:px-3 text-sm md:text-base font-mono font-bold rounded-lg transition-all border-2 ${
                            gameState.guessed.includes(letter)
                              ? gameState.word.includes(letter)
                                ? 'bg-green-900/50 text-green-300 border-green-500 cursor-not-allowed'
                                : 'bg-red-900/50 text-red-300 border-red-500 cursor-not-allowed'
                              : 'bg-primary/40 text-white border-primary/60 hover:bg-primary/60 hover:border-yellow-400'
                          }`}
                        >
                          {letter}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                    <motion.button
                      onClick={newGame}
                      disabled={!gameState.won && !gameState.gameOver}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-8 py-4 font-heading font-black text-lg rounded-lg transition-all border-2 ${
                        gameState.won || gameState.gameOver
                          ? 'bg-gradient-to-r from-primary to-primary/70 text-white border-primary hover:border-yellow-400'
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
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white/10 text-white font-heading font-black text-lg rounded-lg hover:bg-white/20 transition-all border-2 border-white/30 hover:border-yellow-400"
                    >
                      CHANGE GAME
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Leaderboard Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-primary/20 via-black to-black rounded-xl border-2 border-primary p-8 sticky top-8 space-y-6"
                >
                  <div className="text-center">
                    <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-2">★ Hall of Fame ★</p>
                    <h3 className="text-3xl font-heading font-black text-white">TOP 5</h3>
                  </div>

                  {leaderboard.length === 0 ? (
                    <p className="text-white/50 text-center py-12 font-paragraph">Be the first to hit the leaderboard!</p>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/30 to-primary/10 border-2 border-primary/50 rounded-lg hover:border-yellow-400 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-heading font-black text-yellow-300 w-8">#{index + 1}</span>
                            <div>
                              <span className="text-lg font-mono font-black text-white">{entry.initials}</span>
                              <p className="text-xs font-mono text-white/50" style={{ color: VIP_TIERS[entry.vipTier].color }}>
                                {VIP_TIERS[entry.vipTier].name}
                              </p>
                            </div>
                          </div>
                          <span className="text-2xl font-heading font-black text-yellow-300">
                            ${entry.score.toLocaleString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Initials Prompt Modal */}
      <AnimatePresence>
        {showInitialsPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-br from-primary/30 via-black to-black rounded-xl border-2 border-primary p-12 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-8">
                <p className="text-6xl mb-4">💰</p>
                <h2 className="text-4xl font-heading font-black text-yellow-300 mb-2">WINNER!</h2>
                <p className="text-lg font-paragraph text-white/70">Enter your initials to claim your prize</p>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-6xl font-heading font-black text-green-400 mb-2">${currentScore.toLocaleString()}</p>
                  <p className="text-sm font-mono text-yellow-300 uppercase tracking-widest">Winnings</p>
                </div>

                <input
                  type="text"
                  maxLength={3}
                  value={playerInitials}
                  onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())}
                  placeholder="ABC"
                  className="w-full px-6 py-4 bg-primary/20 border-2 border-primary rounded-lg text-white text-center text-3xl font-mono font-black placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:bg-primary/30 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playerInitials.length > 0) {
                      saveScore(playerInitials, currentScore);
                    }
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={() => saveScore(playerInitials || 'AAA', currentScore)}
                    disabled={playerInitials.length === 0}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 px-6 py-4 font-heading font-black text-lg rounded-lg transition-all border-2 ${
                      playerInitials.length > 0
                        ? 'bg-gradient-to-r from-primary to-primary/70 text-white border-primary hover:border-yellow-400'
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
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-6 py-4 bg-white/10 text-white font-heading font-black text-lg rounded-lg hover:bg-white/20 transition-all border-2 border-white/30 hover:border-yellow-400"
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
