import React from 'react';
import { useEffect, useRef, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';

function HangmanGamePage() {
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
  const audioContextRef = useRef<AudioContext | null>(null);

  const categories = {
    FASHION: [
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
    PHOTOGRAPHY: [
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
    MODELING: [
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

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
  }, []);

  // Play correct guess sound - uplifting ding
  const playSuccessSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Create a pleasant bell-like sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const gainOsc2 = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gainOsc2);
    gain.connect(ctx.destination);
    gainOsc2.connect(ctx.destination);

    // Main tone
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.05); // E5
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    // Harmonic overtone
    osc2.frequency.setValueAtTime(1046.5, now); // C6
    gainOsc2.gain.setValueAtTime(0.1, now);
    gainOsc2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now);
    osc2.stop(now + 0.25);
  };

  // Play incorrect guess sound - buzzer
  const playWrongSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Create a buzzer effect with noise
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Buzzer tone
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(120, now + 0.08);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(200, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  };

  // Play winning sound - celebratory fanfare
  const playWinSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Create a fanfare with multiple notes
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },      // C5
      { freq: 659.25, time: 0.15, duration: 0.15 },   // E5
      { freq: 783.99, time: 0.3, duration: 0.15 },    // G5
      { freq: 1046.5, time: 0.45, duration: 0.3 },    // C6
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(note.freq, now + note.time);
      gain.gain.setValueAtTime(0.2, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  };

  // Play losing sound - sad trombone with extra effect
  const playFunnyLosingSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    // Sad trombone effect with wobble
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfoGain = ctx.createGain();
    
    osc.connect(gain);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.connect(ctx.destination);
    
    // Main frequency sweep
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
    
    // LFO wobble effect
    lfo.frequency.setValueAtTime(4, now);
    lfoGain.gain.setValueAtTime(30, now);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    osc.start(now);
    osc.stop(now + 0.6);
    lfo.start(now);
    lfo.stop(now + 0.6);
  };

  // Initialize game with selected category
  const startGame = (category: string) => {
    const categoryWords = categories[category as keyof typeof categories];
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

    if (isWon) {
      // Play winning sound
      playWinSound();
    } else if (isLost) {
      // Play funny losing sound and redirect
      playFunnyLosingSound();
      setTimeout(() => {
        window.location.href = 'https://www.looser.com';
      }, 700);
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
    <div className="min-h-screen bg-black flex flex-col pt-24">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Category Selection */}
          {!selectedCategory ? (
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg border border-primary p-8 space-y-8">
              <div className="text-center">
                <h2 className="text-4xl font-heading font-bold text-primary mb-4">Select a Category</h2>
                <p className="text-white/60 font-paragraph">Choose your difficulty level</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(categories).map((category) => (
                  <button
                    key={category}
                    onClick={() => startGame(category)}
                    className="p-6 bg-primary/20 border border-primary rounded-lg hover:bg-primary/40 transition-all active:scale-95"
                  >
                    <p className="text-xl font-heading font-bold text-primary">{category}</p>
                    <p className="text-sm text-white/60 mt-2">
                      {(categories as any)[category].length} words
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
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
                <div className="flex justify-center gap-4">
                  <button
                    onClick={newGame}
                    disabled={!gameState.won}
                    className={`px-8 py-3 font-heading font-bold rounded transition-all active:scale-95 ${
                      gameState.won
                        ? 'bg-primary text-white hover:bg-opacity-80'
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
                    }}
                    className="px-8 py-3 bg-white/10 text-white font-heading font-bold rounded hover:bg-white/20 transition-all active:scale-95"
                  >
                    Change Category
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default React.memo(HangmanGamePage);
