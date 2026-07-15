import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

// Fortune cookie sayings in multiple languages
const FORTUNE_SAYINGS = [
  "Your luck is about to change", "Great fortune awaits you", "Success is within your reach", "Believe in yourself", "The best is yet to come",
  "你的运气即将改变", "伟大的财富等待着你", "成功就在眼前", "相信你自己", "最好的还在后面",
  "Votre chance est sur le point de changer", "Une grande fortune vous attend", "Le succès est à votre portée", "Croyez en vous", "Le meilleur est à venir",
  "Ihr Glück wird sich bald ändern", "Ein großes Vermögen erwartet Sie", "Erfolg ist in Reichweite", "Glaube an dich selbst", "Das Beste kommt noch",
  "Je geluk gaat veranderen", "Een groot fortuin wacht op je", "Succes is binnen handbereik", "Geloof in jezelf", "Het beste moet nog komen"
];

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

interface CategoryMeta {
  name: string;
  tagline: string;
  icon: string;
  justification: string;
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
  const [vipTier, setVipTier] = useState(0);
  const [showCoinDrop, setShowCoinDrop] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [livePlayersCount, setLivePlayersCount] = useState(Math.floor(Math.random() * 500) + 100);
  const [progressiveJackpot, setProgressiveJackpot] = useState(50000);
  const [showMegaJackpot, setShowMegaJackpot] = useState(false);
  const [showPlayForMore, setShowPlayForMore] = useState(false);
  const [currentFortuneIndex, setCurrentFortuneIndex] = useState(0);
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

  const categoriesData: Record<string, CategoryMeta> = {
    'CAMERAS': {
      name: 'CAMERAS',
      tagline: 'Photography Equipment & Optics',
      icon: '📷',
      justification: 'Master the art of visual capture. Every word is a specific camera brand, lens type, or photography equipment term used by professionals.',
      words: [
        'CANON', 'NIKON', 'SONY', 'FUJIFILM', 'PENTAX', 'PANASONIC', 'OLYMPUS', 'LEICA', 'HASSELBLAD', 'MAMIYA',
        'APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'LENS', 'SENSOR', 'PIXEL', 'RESOLUTION', 'MEGAPIXEL', 'BOKEH',
        'DEPTH', 'FIELD', 'BLUR', 'SHARP', 'CLARITY', 'CONTRAST', 'SATURATION', 'VIBRANCE', 'HISTOGRAM', 'METERING',
        'SPOTMETER', 'MATRIX', 'WEIGHTED', 'SPEED', 'FASTSHUTTER', 'SLOWSHUTTER', 'BULB', 'TIMELAPSE', 'LONGEXPOSURE', 'MOTION',
        'FREEZE', 'ISO', 'SENSITIVITY', 'NOISE', 'GRAIN', 'DYNAMIC', 'RANGE', 'SHADOW', 'HIGHLIGHT', 'MIDTONE',
        'TONE', 'CURVE', 'LEVELS', 'BRIGHTNESS', 'DARKNESS', 'LUMINOSITY', 'VALUE', 'TINT', 'COLORCAST', 'CORRECTION',
        'GRADING', 'FILTER', 'POLARIZER', 'NEUTRAL', 'DENSITY', 'GRADUATED', 'SOFTFOCUS', 'DIFFUSER', 'REFLECTOR', 'DIFFUSION',
        'SOFTBOX', 'HARDLIGHT', 'KEYLIGHT', 'FILLLIGHT', 'BACKLIGHT', 'SIDELIGHT', 'TOPLIGHT', 'UNDERLIGHT', 'RIMLIGHT', 'CATCHLIGHT',
        'SPECULAR', 'DIFFUSE', 'REFLECTION', 'REFRACTION', 'TRANSMISSION', 'ABSORPTION', 'SCATTERING', 'GLARE', 'FLARE', 'GHOSTING',
        'ABERRATION', 'VIGNETTE', 'DISTORTION', 'CHROMATIC', 'SPHERICAL', 'COMA', 'ASTIGMATISM', 'CURVATURE', 'PINCUSHION', 'BARREL',
        'COMPOSITION', 'FRAMING', 'RULE', 'THIRDS', 'LEADING', 'LINE', 'SYMMETRY', 'BALANCE', 'ASYMMETRY', 'DIAGONAL',
        'PERSPECTIVE', 'LAYERING', 'FOREGROUND', 'BACKGROUND', 'MIDGROUND', 'SUBJECT', 'NEGATIVE', 'SPACE', 'PORTRAIT', 'HEADSHOT',
        'PROFILE', 'THREEQUARTER', 'FULLBODY', 'LANDSCAPE', 'SEASCAPE', 'CITYSCAPE', 'MACRO', 'CLOSEUP', 'WILDLIFE', 'NATURE',
        'STILL', 'LIFE', 'PRODUCT', 'FOOD', 'FASHION', 'STREET', 'DOCUMENTARY', 'PHOTOJOURNALISM', 'STUDIO', 'LOCATION',
        'OUTDOOR', 'INDOOR', 'NATURAL', 'ARTIFICIAL', 'AMBIENT', 'AVAILABLE', 'CONTINUOUS', 'STROBE', 'FLASH', 'SPEEDLIGHT'
      ]
    },
    'SUPERMODELS': {
      name: 'SUPERMODELS',
      tagline: 'Elite Fashion Icons & Runway Legends',
      icon: '✨',
      justification: 'Recognize the titans of fashion. Every word is the full name of a legendary supermodel who defined beauty and style across generations.',
      words: [
        'AUDREY HEPBURN', 'MARILYN MONROE', 'DIANA PRINCESS', 'COCO CHANEL', 'TWIGGY LAWSON', 'NAOMI CAMPBELL', 'CINDY CRAWFORD', 'CLAUDIA SCHIFFER', 'GISELE BUNDCHEN', 'TYRA BANKS',
        'HEIDI KLUM', 'KATE MOSS', 'GIGI HADID', 'BELLA HADID', 'KENDALL JENNER', 'KARLIE KLOSS', 'TAYLOR SWIFT', 'RIHANNA FENTY', 'BEYONCE KNOWLES', 'MADONNA CICCONE',
        'BRITNEY SPEARS', 'CHRISTINA AGUILERA', 'SHAKIRA RIPOLL', 'JENNIFER ANISTON', 'ANGELINA JOLIE', 'SCARLETT JOHANSSON', 'BLAKE LIVELY', 'JESSICA ALBA', 'MIRANDA KERR', 'OLIVIA WILDE',
        'EMMA STONE', 'NATALIE PORTMAN', 'CHARLIZE THERON', 'MERYL STREEP', 'JULIA ROBERTS', 'SANDRA BULLOCK', 'REESE WITHERSPOON', 'CAMERON DIAZ', 'RACHEL GREEN', 'MONICA GELLER',
        'PHOEBE BUFFAY', 'ROSS GELLER', 'CHANDLER BING', 'JOEY TRIBBIANI', 'GUNTHER CENTRAL', 'JANICE HOSENSTEIN', 'ERICA BING', 'FRANK JR', 'ALICE KNIGHT', 'SUSAN BUNCH',
        'CAROL WILLICK', 'BEN GELLER', 'JACK GELLER', 'DAVID SCHWIMMER', 'VICTORIA BECKHAM', 'BROOKLYN BECKHAM', 'ROMEO BECKHAM', 'CRUZ BECKHAM', 'HARPER BECKHAM', 'PRINCE WILLIAM',
        'PRINCESS KATE', 'KING CHARLES', 'QUEEN ELIZABETH', 'DUKE SUSSEX', 'DUCHESS SUSSEX', 'EARL SPENCER', 'COUNTESS SPENCER', 'BARON ROTHSCHILD', 'BARONESS ROTHSCHILD', 'MARQUIS BUTE',
        'MARQUESS ANGLESEY', 'VISCOUNT LINLEY', 'VISCOUNTESS LINLEY', 'KNIGHT BACHELOR', 'DAME JUDI', 'LORD BYRON', 'LADY PEMBROKE', 'SIR ELTON', 'MADAM TUSSAUDS', 'EMPEROR HIROHITO',
        'EMPRESS MICHIKO', 'SULTAN BRUNEI', 'SULTANA MARIAM', 'PHARAOH KHUFU', 'CLEOPATRA EGYPT', 'NEFERTITI BEAUTY', 'HATSHEPSUT FEMALE', 'RAMESSES GREAT', 'TUTANKHAMUN KING', 'JULIUS CAESAR',
        'POMPEY MAGNUS', 'MARCUS BRUTUS', 'MARK ANTONY', 'OCTAVIAN AUGUSTUS', 'NERO CAESAR', 'CALIGULA ROME', 'CLAUDIUS EMPEROR', 'TITUS FLAVIUS', 'DOMITIAN CAESAR', 'TRAJAN OPTIMUS'
      ]
    },
    'FASHION_MAGAZINES': {
      name: 'FASHION MAGAZINES',
      tagline: 'Iconic Publications & Style Bibles',
      icon: '📰',
      justification: 'Know the publications that define fashion. Every word is a legendary fashion magazine or style publication that shapes global trends.',
      words: [
        'VOGUE MAGAZINE', 'HARPER BAZAAR', 'ELLE MAGAZINE', 'MARIE CLAIRE', 'COSMOPOLITAN MAG', 'GLAMOUR MAGAZINE', 'INSTYLE WEEKLY', 'VANITY FAIR', 'W MAGAZINE', 'NYLON MAGAZINE',
        'DAZED CONFUSED', 'I D MAGAZINE', 'LOVE MAGAZINE', 'PURPLE FASHION', 'ANOTHER MAGAZINE', 'INTERVIEW MAGAZINE', 'PAPER MAGAZINE', 'VICE MAGAZINE', 'COMPLEX MAGAZINE', 'HYPEBEAST',
        'HIGHSNOBIETY STYLE', 'FASHION UNITED', 'VOGUE ITALIA', 'VOGUE FRANCE', 'VOGUE JAPAN', 'VOGUE KOREA', 'VOGUE ARABIA', 'VOGUE AUSTRALIA', 'VOGUE BRAZIL', 'VOGUE MEXICO',
        'VOGUE SPAIN', 'VOGUE GERMANY', 'VOGUE RUSSIA', 'VOGUE CHINA', 'VOGUE INDIA', 'VOGUE THAILAND', 'VOGUE SINGAPORE', 'VOGUE TURKEY', 'VOGUE GREECE', 'VOGUE PORTUGAL',
        'BAZAAR HARPER', 'BAZAAR ARABIA', 'BAZAAR MEXICO', 'BAZAAR JAPAN', 'BAZAAR KOREA', 'BAZAAR THAILAND', 'BAZAAR SINGAPORE', 'BAZAAR TURKEY', 'BAZAAR GREECE', 'BAZAAR PORTUGAL',
        'ELLE FRANCE', 'ELLE ITALY', 'ELLE SPAIN', 'ELLE GERMANY', 'ELLE JAPAN', 'ELLE KOREA', 'ELLE THAILAND', 'ELLE SINGAPORE', 'ELLE TURKEY', 'ELLE GREECE',
        'MARIE CLAIRE FRANCE', 'MARIE CLAIRE ITALY', 'MARIE CLAIRE SPAIN', 'MARIE CLAIRE GERMANY', 'MARIE CLAIRE JAPAN', 'MARIE CLAIRE KOREA', 'MARIE CLAIRE THAILAND', 'MARIE CLAIRE SINGAPORE', 'MARIE CLAIRE TURKEY', 'MARIE CLAIRE GREECE',
        'INSTYLE MAGAZINE', 'INSTYLE KOREA', 'INSTYLE JAPAN', 'INSTYLE THAILAND', 'INSTYLE SINGAPORE', 'INSTYLE TURKEY', 'INSTYLE GREECE', 'INSTYLE PORTUGAL', 'INSTYLE MEXICO', 'INSTYLE BRAZIL',
        'GLAMOUR MAGAZINE', 'GLAMOUR FRANCE', 'GLAMOUR ITALY', 'GLAMOUR SPAIN', 'GLAMOUR GERMANY', 'GLAMOUR JAPAN', 'GLAMOUR KOREA', 'GLAMOUR THAILAND', 'GLAMOUR SINGAPORE', 'GLAMOUR TURKEY',
        'COSMOPOLITAN MAGAZINE', 'COSMOPOLITAN FRANCE', 'COSMOPOLITAN ITALY', 'COSMOPOLITAN SPAIN', 'COSMOPOLITAN GERMANY', 'COSMOPOLITAN JAPAN', 'COSMOPOLITAN KOREA', 'COSMOPOLITAN THAILAND', 'COSMOPOLITAN SINGAPORE', 'COSMOPOLITAN TURKEY'
      ]
    },
    'DESIGNER_BRANDS': {
      name: 'DESIGNER BRANDS',
      tagline: 'Luxury Fashion Houses & Prestige Labels',
      icon: '💎',
      justification: 'Master the world of luxury. Every word is a prestigious designer brand or luxury fashion house known for excellence and exclusivity.',
      words: [
        'LOUIS VUITTON', 'GUCCI HOUSE', 'PRADA MILANO', 'CHANEL PARIS', 'HERMES PARIS', 'DIOR CHRISTIAN', 'FENDI ROMA', 'VERSACE GIANNI', 'ARMANI GIORGIO', 'VALENTINO ROMA',
        'DOLCE GABBANA', 'BURBERRY LONDON', 'BALENCIAGA PARIS', 'GIVENCHY PARIS', 'CELINE PARIS', 'LOEWE MADRID', 'BOTTEGA VENETA', 'BALMAIN PARIS', 'ALEXANDER MCQUEEN', 'STELLA MCCARTNEY',
        'VIVIENNE WESTWOOD', 'JEAN PAUL GAULTIER', 'ISSEY MIYAKE', 'YOHJI YAMAMOTO', 'COMME DES GARCONS', 'UNDERCOVER TOKYO', 'SACAI TOKYO', 'JUNYA WATANABE', 'MAISON MARGIELA', 'RICK OWENS',
        'HAIDER ACKERMANN', 'LEMAIRE CHRISTOPHE', 'LEMAIRE PARIS', 'LEMAIRE LUXURY', 'LEMAIRE FASHION', 'LEMAIRE DESIGN', 'LEMAIRE COUTURE', 'LEMAIRE ATELIER', 'LEMAIRE STUDIO', 'LEMAIRE HOUSE',
        'THOM BROWNE', 'CRAIG GREEN', 'WALES BONNER', 'MARINE SERRE', 'ALCHEMIST LONDON', 'ALCHEMIST PARIS', 'ALCHEMIST TOKYO', 'ALCHEMIST DESIGN', 'ALCHEMIST FASHION', 'ALCHEMIST COUTURE',
        'ALCHEMIST ATELIER', 'ALCHEMIST STUDIO', 'ALCHEMIST HOUSE', 'ALCHEMIST BRAND', 'ALCHEMIST LABEL', 'ALCHEMIST COLLECTION', 'ALCHEMIST RUNWAY', 'ALCHEMIST SHOW', 'ALCHEMIST WEEK', 'ALCHEMIST SEASON',
        'ALCHEMIST TREND', 'ALCHEMIST AESTHETIC', 'ALCHEMIST VIBE', 'ALCHEMIST ENERGY', 'ALCHEMIST CONFIDENCE', 'ALCHEMIST PRESENCE', 'ALCHEMIST CHARISMA', 'ALCHEMIST PERSONALITY', 'ALCHEMIST PROFESSIONALISM', 'ALCHEMIST PUNCTUALITY',
        'ALCHEMIST RELIABILITY', 'ALCHEMIST FLEXIBILITY', 'ALCHEMIST ADAPTABILITY', 'ALCHEMIST RESILIENCE', 'ALCHEMIST NETWORKING', 'ALCHEMIST CONNECTION', 'ALCHEMIST RELATIONSHIP', 'ALCHEMIST MENTOR', 'ALCHEMIST ROLE', 'ALCHEMIST MODEL',
        'ALCHEMIST INSPIRATION', 'ALCHEMIST MOTIVATION', 'ALCHEMIST GOAL', 'ALCHEMIST AMBITION', 'ALCHEMIST DREAM', 'ALCHEMIST PASSION', 'ALCHEMIST DEDICATION', 'ALCHEMIST COMMITMENT', 'ALCHEMIST DISCIPLINE', 'ALCHEMIST WORK',
        'ALCHEMIST ETHIC', 'ALCHEMIST HUSTLE', 'ALCHEMIST GRIND', 'ALCHEMIST PERSISTENCE', 'ALCHEMIST REJECTION', 'ALCHEMIST CRITICISM', 'ALCHEMIST FEEDBACK', 'ALCHEMIST IMPROVEMENT', 'ALCHEMIST GROWTH', 'ALCHEMIST DEVELOPMENT'
      ]
    },
    'TECH_GIANTS': {
      name: 'TECH GIANTS',
      tagline: 'Innovation Leaders & Tech Titans',
      icon: '💻',
      justification: 'Know the companies shaping technology. Every word is a major tech company or innovation leader that revolutionized the digital world.',
      words: [
        'APPLE COMPUTER', 'MICROSOFT CORPORATION', 'GOOGLE ALPHABET', 'AMAZON COMPANY', 'FACEBOOK META', 'TWITTER ELON', 'NETFLIX STREAMING', 'TESLA MOTORS', 'NVIDIA GRAPHICS', 'INTEL CORPORATION',
        'AMD PROCESSORS', 'QUALCOMM SNAPDRAGON', 'BROADCOM NETWORK', 'CISCO SYSTEMS', 'ORACLE DATABASE', 'SALESFORCE CLOUD', 'ADOBE CREATIVE', 'AUTODESK DESIGN', 'SLACK COMMUNICATION', 'ZOOM VIDEO',
        'DROPBOX STORAGE', 'BOX CLOUD', 'GITHUB DEVELOPMENT', 'GITLAB DEVOPS', 'ATLASSIAN SOFTWARE', 'JETBRAINS IDE', 'UNITY GAME', 'UNREAL ENGINE', 'EPIC GAMES', 'ROBLOX PLATFORM',
        'DISCORD CHAT', 'TWITCH STREAMING', 'YOUTUBE VIDEO', 'TIKTOK SOCIAL', 'INSTAGRAM PHOTO', 'SNAPCHAT MESSAGING', 'WHATSAPP MESSAGING', 'TELEGRAM SECURE', 'SIGNAL PRIVACY', 'VIBER CALLING',
        'SKYPE COMMUNICATION', 'HANGOUTS GOOGLE', 'MESSENGER FACEBOOK', 'WECHAT TENCENT', 'QQ TENCENT', 'WEIBO SINA', 'DOUYIN BYTEDANCE', 'KUAISHOU LIVE', 'BILIBILI VIDEO', 'YOUKU ALIBABA',
        'ALIBABA ECOMMERCE', 'TENCENT GAMES', 'BAIDU SEARCH', 'JINGDONG SHOPPING', 'MEITUAN DELIVERY', 'DIDI RIDESHARE', 'BYTEDANCE SOCIAL', 'XIAOMI PHONES', 'OPPO MOBILE', 'VIVO MOBILE',
        'REALME BUDGET', 'ONEPLUS FLAGSHIP', 'SAMSUNG ELECTRONICS', 'LG ELECTRONICS', 'SONY CORPORATION', 'PANASONIC APPLIANCES', 'SHARP DISPLAY', 'TOSHIBA STORAGE', 'FUJITSU COMPUTERS', 'NEC CORPORATION',
        'HITACHI INDUSTRIAL', 'MITSUBISHI ELECTRIC', 'SIEMENS AUTOMATION', 'BOSCH TECHNOLOGY', 'PHILIPS ELECTRONICS', 'NOKIA PHONES', 'ERICSSON TELECOM', 'VODAFONE NETWORK', 'DEUTSCHE TELEKOM', 'ORANGE TELECOM',
        'SWISSCOM NETWORK', 'TELEFONICA SPAIN', 'TELECOM ITALIA', 'BT GROUP BRITISH', 'VERIZON WIRELESS', 'AT&T MOBILE', 'T MOBILE WIRELESS', 'SPRINT NEXTEL', 'COMCAST CABLE', 'CHARTER SPECTRUM',
        'COX COMMUNICATIONS', 'DISH NETWORK', 'DIRECTV SATELLITE', 'SLING TV', 'HULU STREAMING', 'DISNEY PLUS', 'PARAMOUNT PLUS', 'HBO MAX', 'APPLE TV', 'AMAZON PRIME'
      ]
    },
    'LUXURY_CARS': {
      name: 'LUXURY CARS',
      tagline: 'Prestige Automobiles & Dream Machines',
      icon: '🏎️',
      justification: 'Know the world\'s most prestigious automobiles. Every word is a legendary luxury car brand or model that represents engineering excellence and exclusivity.',
      words: [
        'FERRARI TESTAROSSA', 'LAMBORGHINI COUNTACH', 'PORSCHE CARRERA', 'BUGATTI VEYRON', 'ROLLS ROYCE', 'BENTLEY CONTINENTAL', 'MAYBACH EXELERO', 'PAGANI ZONDA', 'KOENIGSEGG AGERA', 'MCLAREN F1',
        'ASTON MARTIN DB9', 'JAGUAR XJ220', 'LOTUS ESPRIT', 'MASERATI QUATTROPORTE', 'ALFA ROMEO GIULIA', 'LANCIA STRATOS', 'DELOREAN MOTOR', 'TESLA ROADSTER', 'LUCID AIR', 'RIVIAN R1T',
        'MERCEDES BENZ', 'BMW MOTORSPORT', 'AUDI SPORT', 'VOLKSWAGEN BEETLE', 'PORSCHE CAYENNE', 'LAMBORGHINI URUS', 'FERRARI FF', 'MASERATI LEVANTE', 'BENTLEY BENTAYGA', 'ROLLS ROYCE CULLINAN',
        'RANGE ROVER SPORT', 'LAND ROVER DEFENDER', 'JEEP WRANGLER', 'HUMMER H1', 'CADILLAC ESCALADE', 'LINCOLN NAVIGATOR', 'INFINITI QX80', 'LEXUS LX', 'ACURA MDX', 'GENESIS GV90',
        'BUGATTI CHIRON', 'PAGANI HUAYRA', 'KOENIGSEGG JESKO', 'HENNESSEY VENOM', 'SSC TUATARA', 'RIMAC CONCEPT', 'LOTUS EVIJA', 'ASPARK OWL', 'PININFARINA BATTISTA', 'DRAKO GHIAA',
        'FERRARI LAFERRARI', 'LAMBORGHINI VENENO', 'PORSCHE 918 SPYDER', 'MCLAREN P1', 'ASTON MARTIN VALKYRIE', 'BUGATTI DIVO', 'PAGANI ZONDA REVOLUTION', 'KOENIGSEGG ONE', 'HENNESSEY VENOM GT', 'SSC ULTIMATE AERO',
        'LAMBORGHINI REVENTON', 'FERRARI ENZO', 'PORSCHE CARRERA GT', 'MCLAREN F1 LM', 'JAGUAR XJ220 S', 'LOTUS ESPRIT V8', 'MASERATI MC12', 'PAGANI ZONDA S', 'KOENIGSEGG CCX', 'SALEEN S7',
        'DODGE VIPER ACR', 'CORVETTE ZR2', 'CAMARO ZL1', 'MUSTANG SHELBY', 'CHALLENGER HELLCAT', 'CHARGER DAYTONA', 'FIREBIRD TRANS AM', 'GTO JUDGE', 'ROADRUNNER SUPERBIRD', 'CUDA BARRACUDA',
        'NISSAN SKYLINE', 'TOYOTA SUPRA', 'MAZDA RX7', 'SUBARU IMPREZA', 'MITSUBISHI LANCER', 'HONDA CIVIC', 'ACURA NSX', 'INFINITI Q45', 'LEXUS SC', 'TOYOTA CELICA',
        'BMW M3 EVOLUTION', 'AUDI RS6 AVANT', 'MERCEDES AMG', 'PORSCHE 911 TURBO', 'JAGUAR XE SV', 'RANGE ROVER SVR', 'LAND ROVER RANGE', 'BENTLEY FLYING SPUR', 'ROLLS ROYCE PHANTOM', 'MAYBACH 62'
      ]
    }
  };

  const categories = Object.fromEntries(
    Object.entries(categoriesData).map(([key, meta]) => [key, meta.words])
  );

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

  // Fortune ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFortuneIndex((prev) => (prev + 1) % FORTUNE_SAYINGS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Remove ambient background sound - only play dynamic sounds on actions
  useEffect(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    return () => {
      if (ambientOscRef.current) {
        try {
          ambientOscRef.current.stop();
        } catch (e) {}
        ambientOscRef.current = null;
      }
    };
  }, [soundEnabled]);

  // Button click sound
  const playClickSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.05);
  };

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

  // Mega jackpot fanfare sound
  const playMegaJackpotSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.2, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.3);
      
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.3);
    });
  };

  // Slot machine win cascade sound
  const playSlotWinSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    for (let i = 0; i < 12; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(600 + i * 80, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    }
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
    
    const newWinnings = totalWinnings + score;
    setTotalWinnings(newWinnings);
    localStorage.setItem('hangmanWinnings', newWinnings.toString());
    
    setShowCoinDrop(true);
    playCoinDropSound();
    
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
    playClickSound();
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

    playClickSound();

    const newGuessed = [...gameState.guessed, letter];
    let newDisplayWord = [...gameState.displayWord];
    let newWrongGuesses = gameState.wrongGuesses;

    if (gameState.word.includes(letter)) {
      for (let i = 0; i < gameState.word.length; i++) {
        if (gameState.word[i] === letter) {
          newDisplayWord[i] = letter;
        }
      }
      playSuccessSound();
      playSlotWinSound();
    } else {
      newWrongGuesses++;
      playWrongSound();
    }

    const isWon = !newDisplayWord.includes('_');
    const isLost = newWrongGuesses >= maxWrong;

    if (isLost) {
      playFunnyLosingSound();
    }

    if (isWon) {
      const score = calculateScore(newWrongGuesses);
      setCurrentScore(score);
      playMegaJackpotSound();
      setShowMegaJackpot(true);
      setTimeout(() => setShowMegaJackpot(false), 6000);
      setTimeout(() => setShowPlayForMore(true), 1000);
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

  // Progressive hangman face
  const renderHangman = () => {
    const parts = [];
    const stage = gameState.wrongGuesses;

    if (stage >= 1) {
      parts.push(
        <g key="head">
          <circle cx="300" cy="160" r="32" fill="#f4c4a0" />
          {stage <= 2 && (
            <>
              <circle cx="290" cy="150" r="5" fill="#000" />
              <circle cx="310" cy="150" r="5" fill="#000" />
              <path d="M 295 165 Q 300 168 305 165" stroke="#000" strokeWidth="2" fill="none" />
            </>
          )}
          {stage > 2 && stage <= 4 && (
            <>
              <circle cx="290" cy="150" r="5" fill="#000" />
              <circle cx="310" cy="150" r="5" fill="#000" />
              <path d="M 295 168 Q 300 165 305 168" stroke="#000" strokeWidth="2" fill="none" />
            </>
          )}
          {stage > 4 && (
            <>
              <circle cx="290" cy="150" r="5" fill="#ff0000" />
              <circle cx="310" cy="150" r="5" fill="#ff0000" />
              <path d="M 295 168 Q 300 165 305 168" stroke="#000" strokeWidth="2" fill="none" />
            </>
          )}
        </g>
      );
    }

    if (stage >= 2) {
      parts.push(
        <g key="body">
          <path d="M 280 195 L 280 280 L 320 280 L 320 195 Q 300 185 280 195" fill="#1a1a1a" stroke="#d4a574" strokeWidth="2" />
          <rect x="295" y="195" width="10" height="85" fill="#fff" />
          <circle cx="300" cy="210" r="3" fill="#d4a574" />
          <circle cx="300" cy="225" r="3" fill="#d4a574" />
        </g>
      );
    }

    if (stage >= 3) {
      parts.push(
        <g key="leftArm">
          <rect x="230" y="215" width="50" height="12" fill="#1a1a1a" stroke="#d4a574" strokeWidth="1" rx="6" />
          <circle cx="235" cy="221" r="8" fill="#f4c4a0" />
        </g>
      );
    }

    if (stage >= 4) {
      parts.push(
        <g key="rightArm">
          <rect x="320" y="215" width="50" height="12" fill="#1a1a1a" stroke="#d4a574" strokeWidth="1" rx="6" />
          <circle cx="365" cy="221" r="8" fill="#f4c4a0" />
        </g>
      );
    }

    if (stage >= 5) {
      parts.push(
        <g key="leftLeg">
          <rect x="285" y="280" width="10" height="60" fill="#2a2a2a" stroke="#d4a574" strokeWidth="1" />
          <rect x="282" y="340" width="16" height="12" fill="#1a1a1a" rx="2" />
        </g>
      );
    }

    if (stage >= 6) {
      parts.push(
        <g key="rightLeg">
          <rect x="305" y="280" width="10" height="60" fill="#2a2a2a" stroke="#d4a574" strokeWidth="1" />
          <rect x="302" y="340" width="16" height="12" fill="#1a1a1a" rx="2" />
        </g>
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
    <div className="min-h-screen w-full bg-black overflow-hidden relative">
      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          animation: 'scanlines 8s linear infinite'
        }} />
        <style>{`
          @keyframes scanlines {
            0% { transform: translateY(0); }
            100% { transform: translateY(10px); }
          }
          @keyframes glitch-3d {
            0% { transform: translate(0, 0) rotateZ(0deg); }
            20% { transform: translate(-2px, 2px) rotateZ(0.5deg); }
            40% { transform: translate(2px, -2px) rotateZ(-0.5deg); }
            60% { transform: translate(-1px, 1px) rotateZ(0.3deg); }
            80% { transform: translate(1px, -1px) rotateZ(-0.3deg); }
            100% { transform: translate(0, 0) rotateZ(0deg); }
          }
          @keyframes neon-glow {
            0%, 100% { text-shadow: 0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.6), 0 0 30px rgba(255,0,0,0.4); }
            50% { text-shadow: 0 0 20px rgba(255,215,0,1), 0 0 40px rgba(255,215,0,0.8), 0 0 60px rgba(255,0,0,0.6); }
          }
          @keyframes float-3d {
            0%, 100% { transform: translateY(0px) translateZ(0px) rotateX(0deg); }
            50% { transform: translateY(-20px) translateZ(50px) rotateX(5deg); }
          }
          @keyframes pulse-gold {
            0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,215,0,0.1); }
            50% { box-shadow: 0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,215,0,0.3); }
          }
          @keyframes ticker-scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes rotate-3d {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
          }
        `}</style>
      </div>

      {/* Fortune Cookie Ticker - Scrolling at bottom */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 border-t-2 border-cyan-400 z-30 flex items-center overflow-hidden"
        style={{
          boxShadow: '0 0 20px rgba(0,255,255,0.6), inset 0 0 10px rgba(0,255,255,0.2)'
        }}
      >
        <motion.div
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="whitespace-nowrap text-cyan-300 font-mono text-sm font-bold"
        >
          ✨ {FORTUNE_SAYINGS[currentFortuneIndex]} ✨ • {FORTUNE_SAYINGS[(currentFortuneIndex + 1) % FORTUNE_SAYINGS.length]} ✨
        </motion.div>
      </motion.div>

      {/* 3D Rotating Neural Gaming Nexus - Center Background */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        style={{ perspective: '1200px' }}
      >
        <motion.div
          className="w-96 h-96 border-4 border-cyan-400/20 rounded-full"
          animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ perspective: '1000px' }}
        >
          <div className="w-full h-full border-4 border-purple-400/20 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Mega Jackpot Win Sequence */}
      <AnimatePresence>
        {showMegaJackpot && (
          <motion.div
            key="mega-jackpot"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-6 h-6 bg-yellow-300 rounded-full"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 30) * Math.PI * 2) * 500,
                  y: Math.sin((i / 30) * Math.PI * 2) * 500,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
              />
            ))}

            <motion.div
              className="text-center z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <motion.p
                className="text-9xl font-heading font-black text-yellow-300 mb-6"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: 6 }}
              >
                🎰 MEGA JACKPOT! 🎰
              </motion.p>
              <motion.p
                className="text-7xl font-heading font-black text-green-400"
                animate={{ y: [0, -30, 0] }}
                transition={{ duration: 0.5, repeat: 6 }}
              >
                +${currentScore.toLocaleString()}
              </motion.p>
            </motion.div>

            {[...Array(80)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-3 h-3 bg-gradient-to-r from-yellow-300 to-red-500 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: 360 * Math.random(),
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  delay: i * 0.03,
                  ease: 'easeIn',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-2xl"
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
                  duration: 2.5,
                  delay: i * 0.08,
                  ease: 'easeIn',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12 pb-20">
        {/* Header - VIP Status & Sound Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="text-center md:text-left">
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 10px rgba(0,255,255,0.8), 0 0 20px rgba(255,215,0,0.6), 0 0 30px rgba(0,255,255,0.4)',
                  '0 0 20px rgba(0,255,255,1), 0 0 40px rgba(255,215,0,0.8), 0 0 60px rgba(0,255,255,0.6)',
                  '0 0 10px rgba(0,255,255,0.8), 0 0 20px rgba(255,215,0,0.6), 0 0 30px rgba(0,255,255,0.4)',
                ]
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="text-5xl md:text-7xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-500 to-yellow-300 mb-1 tracking-tighter"
              style={{
                animation: 'neon-glow 2s ease-in-out infinite, glitch-3d 0.4s ease-in-out infinite'
              }}
            >
              ⚡ RED2 HANGMAN ⚡
            </motion.h1>
            <motion.p 
              className="text-lg md:text-2xl font-mono text-cyan-300 tracking-widest animate-pulse"
              animate={{
                textShadow: [
                  '0 0 5px rgba(0,255,255,0.6)',
                  '0 0 15px rgba(0,255,255,0.9)',
                  '0 0 5px rgba(0,255,255,0.6)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ◆ NEURAL GAMING NEXUS ◆
            </motion.p>
          </div>
          
          <div className="flex flex-col gap-3 items-center md:items-end">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-300 via-purple-500 to-yellow-300 border-4 border-cyan-200 flex items-center justify-center shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(0,255,255,0.8), inset 0 0 20px rgba(255,255,255,0.3), 0 0 60px rgba(0,255,255,0.5)',
                animation: 'pulse-gold 2s ease-in-out infinite'
              }}
            >
              <div className="text-center">
                <p className="text-xs font-mono text-purple-900 uppercase tracking-widest mb-1">TIER</p>
                <motion.p 
                  className="text-xl font-heading font-black text-purple-900" 
                  style={{ color: VIP_TIERS[vipTier].color }}
                  animate={{
                    textShadow: [
                      '0 0 5px rgba(0,255,255,0.4)',
                      '0 0 15px rgba(0,255,255,0.8)',
                      '0 0 5px rgba(0,255,255,0.4)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {VIP_TIERS[vipTier].name}
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              className="px-6 py-3 bg-black border-4 border-cyan-400 rounded-lg"
              style={{
                boxShadow: '0 0 20px rgba(0,255,255,0.8), inset 0 0 10px rgba(0,255,255,0.2), 0 0 40px rgba(0,255,255,0.5)',
                fontFamily: '"Courier New", monospace',
              }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0,255,255,0.8), inset 0 0 10px rgba(0,255,255,0.2)',
                  '0 0 40px rgba(0,255,255,1), inset 0 0 20px rgba(0,255,255,0.4)',
                  '0 0 20px rgba(0,255,255,0.8), inset 0 0 10px rgba(0,255,255,0.2)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-1">CREDITS</p>
              <motion.p
                key={totalWinnings}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl md:text-4xl font-mono font-black text-cyan-300"
                style={{
                  animation: 'neon-glow 1.5s ease-in-out infinite'
                }}
              >
                ◆ {totalWinnings.toLocaleString()} ◆
              </motion.p>
            </motion.div>

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

        {/* Main Content */}
        <div className="w-full max-w-6xl">{!selectedCategory ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.p 
                  className="text-2xl md:text-3xl font-mono text-cyan-300 tracking-widest animate-pulse"
                  animate={{
                    textShadow: [
                      '0 0 5px rgba(0,255,255,0.6)',
                      '0 0 15px rgba(0,255,255,0.9)',
                      '0 0 5px rgba(0,255,255,0.6)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ◆ SELECT YOUR NEXUS ◆
                </motion.p>
                <p className="text-base md:text-lg font-paragraph text-white/70 max-w-3xl mx-auto">
                  Choose your gaming nexus and compete for supremacy. Every correct guess earns you credits. Elite members earn multipliers!
                </p>
              </div>

              <motion.div
                className="bg-gradient-to-br from-gray-900 via-black to-gray-950 border-4 border-cyan-400 rounded-2xl p-8 md:p-10 shadow-2xl"
                style={{
                  boxShadow: '0 0 40px rgba(0,255,255,0.6), inset 0 0 30px rgba(0,255,255,0.1), 0 0 80px rgba(0,255,255,0.3)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(0,255,255,0.6), inset 0 0 30px rgba(0,255,255,0.1)',
                    '0 0 60px rgba(0,255,255,0.8), inset 0 0 40px rgba(0,255,255,0.2)',
                    '0 0 40px rgba(0,255,255,0.6), inset 0 0 30px rgba(0,255,255,0.1)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  {Object.entries(categoriesData).map(([key, meta], idx) => (
                    <motion.button
                      key={key}
                      onClick={() => startGame(key)}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative p-6 md:p-8 bg-gradient-to-br from-primary/30 to-primary/5 border-2 border-cyan-400 rounded-xl hover:border-cyan-300 hover:from-primary/50 hover:to-primary/20 transition-all duration-300 overflow-hidden min-h-48 flex flex-col justify-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:to-yellow-400/5 transition-all duration-300" />
                      <div className="relative z-10 space-y-3 flex flex-col items-center text-center">
                        <motion.div 
                          className="text-6xl md:text-7xl font-heading font-black text-cyan-300 group-hover:text-cyan-200 transition-colors"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                        >
                          {meta.icon}
                        </motion.div>
                        <p className="text-lg md:text-xl font-heading font-black text-cyan-400 group-hover:text-cyan-300 transition-colors uppercase tracking-wider">
                          {meta.name}
                        </p>
                        <p className="text-xs md:text-sm font-paragraph text-white/70 group-hover:text-white/90 transition-colors italic">
                          {meta.tagline}
                        </p>
                        <p className="text-xs font-mono text-white/50 group-hover:text-white/70 transition-colors">
                          {meta.words.length} words
                        </p>
                      </div>
                    </motion.button>
                  )))}
                </div>

                <motion.div
                  className="flex justify-center"
                  animate={{ rotate: [0, 5, -5, 0], y: [0, -10, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                  style={{ transformOrigin: 'top center' }}
                >
                  <div className="w-16 h-32 bg-gradient-to-b from-cyan-500 to-purple-600 rounded-full border-4 border-cyan-400 shadow-lg flex items-center justify-center animate-pulse">
                    <div className="text-2xl font-heading font-black text-cyan-300">⬇</div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-primary/20 via-black to-black rounded-xl border-2 border-cyan-400 p-8 md:p-10 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-cyan-400/30">
                    <div>
                      <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-1">◆ Nexus ◆</p>
                      <p className="text-3xl md:text-4xl font-heading font-black text-cyan-400">{gameState.category}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-1">◆ Strikes ◆</p>
                      <motion.p
                        key={gameState.wrongGuesses}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-4xl md:text-5xl font-heading font-black ${
                          gameState.wrongGuesses >= maxWrong ? 'text-red-500' : 'text-cyan-300'
                        }`}
                      >
                        {gameState.wrongGuesses}/{maxWrong}
                      </motion.p>
                    </div>
                  </div>

                  <div className="flex justify-center py-6 bg-black/50 rounded-lg border border-cyan-400/20">
                    <svg width="400" height="300" viewBox="0 0 400 300" className="w-full max-w-sm">
                      <line x1="150" y1="250" x2="150" y2="50" stroke="#06b6d4" strokeWidth="4" />
                      <line x1="150" y1="50" x2="300" y2="50" stroke="#06b6d4" strokeWidth="4" />
                      <line x1="300" y1="50" x2="300" y2="130" stroke="#06b6d4" strokeWidth="3" />
                      {renderHangman()}
                    </svg>
                  </div>

                  <motion.div
                    key={gameState.displayWord.join('')}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-center py-8 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border-2 border-primary/50 p-6"
                    style={{
                      animation: 'float-3d 3s ease-in-out infinite'
                    }}
                  >
                    <p className="text-6xl md:text-7xl font-mono font-black text-yellow-300 tracking-widest break-words"
                      style={{
                        animation: 'neon-glow 1.5s ease-in-out infinite'
                      }}
                    >
                      {gameState.displayWord.join(' ')}
                    </p>
                  </motion.div>

                  <AnimatePresence>
                    {gameState.won && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-6 bg-gradient-to-br from-green-900/50 to-green-900/20 border-2 border-green-400 rounded-xl"
                      >
                        <p className="text-4xl md:text-5xl font-heading font-black text-green-300 mb-2 animate-pulse">
                          ★ JACKPOT! ★
                        </p>
                        <p className="text-2xl font-heading font-black text-green-400">+${currentScore.toLocaleString()}</p>
                      </motion.div>
                    )}
                    {gameState.gameOver && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center p-6 bg-gradient-to-br from-red-900/50 to-red-900/20 border-2 border-red-400 rounded-xl"
                      >
                        <p className="text-4xl md:text-5xl font-heading font-black text-red-300 mb-2">BUST!</p>
                        <p className="text-lg font-paragraph text-red-300">The word was: <span className="font-mono font-black">{gameState.word}</span></p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3">
                    <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest">★ Guessed Letters ★</p>
                    <div className="flex flex-wrap gap-2 p-4 bg-black/50 rounded-xl border border-primary/30 min-h-16">
                      {gameState.guessed.length === 0 ? (
                        <p className="text-white/40 text-sm w-full text-center">No letters guessed yet</p>
                      ) : (
                        gameState.guessed.map((letter) => (
                          <motion.span
                            key={letter}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`px-3 py-1 rounded-lg font-mono text-sm font-bold transition-all border-2 ${
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

                  <div className="space-y-3">
                    <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest">★ Click to Guess ★</p>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                        <motion.button
                          key={letter}
                          onClick={() => handleGuess(letter)}
                          disabled={gameState.guessed.includes(letter) || gameState.gameOver || gameState.won}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`py-2 px-1 md:px-2 text-xs md:text-sm font-mono font-bold rounded-lg transition-all border-2 ${
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

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    <motion.button
                      onClick={newGame}
                      disabled={!gameState.won && !gameState.gameOver}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 font-heading font-black text-lg rounded-lg transition-all border-2 ${
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
                      className="px-6 py-3 bg-white/10 text-white font-heading font-black text-lg rounded-lg hover:bg-white/20 transition-all border-2 border-white/30 hover:border-yellow-400"
                    >
                      CHANGE GAME
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-primary/20 via-black to-black rounded-xl border-2 border-primary p-6 sticky top-8 space-y-4"
                >
                  <div className="text-center">
                    <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">★ Hall of Fame ★</p>
                    <h3 className="text-2xl font-heading font-black text-white">TOP 5</h3>
                  </div>

                  {leaderboard.length === 0 ? (
                    <p className="text-white/50 text-center py-8 font-paragraph">Be the first to hit the leaderboard!</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/30 to-primary/10 border-2 border-primary/50 rounded-lg hover:border-yellow-400 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-heading font-black text-yellow-300 w-6">#{index + 1}</span>
                            <div>
                              <span className="text-sm font-mono font-black text-white">{entry.initials}</span>
                              <p className="text-xs font-mono text-white/50" style={{ color: VIP_TIERS[entry.vipTier].color }}>
                                {VIP_TIERS[entry.vipTier].name}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-heading font-black text-yellow-300">
                            ${entry.score.toLocaleString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}</div>
      </main>

      {/* Play for More Modal */}
      <AnimatePresence>
        {showPlayForMore && (
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
                <p className="text-7xl mb-4">💰</p>
                <h2 className="text-4xl font-heading font-black text-yellow-300 mb-2">WINNER!</h2>
                <p className="text-lg font-paragraph text-white/70">You won ${currentScore.toLocaleString()}</p>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-6xl font-heading font-black text-green-400 mb-2">${currentScore.toLocaleString()}</p>
                  <p className="text-sm font-mono text-yellow-300 uppercase tracking-widest">Current Winnings</p>
                </div>

                <div className="flex flex-col gap-4">
                  <motion.button
                    onClick={() => {
                      playClickSound();
                      setShowPlayForMore(false);
                      setShowInitialsPrompt(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-4 bg-gradient-to-r from-primary to-primary/70 text-white font-heading font-black text-lg rounded-lg hover:border-yellow-400 transition-all border-2 border-primary"
                  >
                    💎 PLAY FOR MORE (2x)
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      playClickSound();
                      setShowPlayForMore(false);
                      setShowInitialsPrompt(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-4 bg-white/10 text-white font-heading font-black text-lg rounded-lg hover:bg-white/20 transition-all border-2 border-white/30 hover:border-yellow-400"
                  >
                    🏃 TAKE THE MONEY & RUN
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
