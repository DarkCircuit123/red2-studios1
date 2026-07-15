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
  const [showMegaJackpot, setShowMegaJackpot] = useState(false);
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
      'WICKER', 'WIMPLE', 'WINKLE', 'WIRE', 'WRIST', 'WRISTBAND', 'WRISTLET', 'YARN', 'YOKE', 'ZIPPER',
      'ASCOT', 'BANGLE', 'BASQUE', 'BATIK', 'BEAD', 'BIAS', 'BODICE', 'BONING', 'BOUTIQUE', 'BROCADE',
      'BUCKRAM', 'BUSTLE', 'CAFTAN', 'CAMBRIC', 'CAMEL', 'CANVAS', 'CAPELET', 'CAPRI', 'CARAT', 'CASING',
      'CASHMERE', 'CASUAL', 'CATSUIT', 'CELLULOID', 'CHIFFON', 'CHINTZ', 'CHINO', 'CHIT', 'CHOKE', 'CHOLI',
      'CHOPINE', 'CHUKKA', 'CHULLO', 'CIRE', 'CITRINE', 'CLAMP', 'CLEAT', 'CLOCHE', 'CLOISTER', 'CLOQUE',
      'CLOSURE', 'CLOTH', 'CLOTHING', 'CLOUD', 'CLOUT', 'CLOVE', 'CLOVER', 'CLOWN', 'CLUB', 'CLUCK',
      'CLUMP', 'CLUNG', 'CLUSTER', 'CLUTCH', 'COACH', 'COARSE', 'COAST', 'COAT', 'COATING', 'COAX',
      'COBALT', 'COBBLE', 'COBBLER', 'COBWEB', 'COCA', 'COCHINEAL', 'COCK', 'COCKATOO', 'COCKER', 'COCKLE',
      'COCKPIT', 'COCKY', 'COCOA', 'COCONUT', 'COCOON', 'COCOTTE', 'CODDLE', 'CODE', 'CODER', 'CODEX',
      'CODFISH', 'CODGER', 'CODIFY', 'CODING', 'CODLING', 'CODPIECE', 'CODON', 'CODSWALLOP', 'COED', 'COEDUCATION',
      'COEFFICIENT', 'COELENTERATE', 'COEQUAL', 'COERCE', 'COERCION', 'COERCIVE', 'COEVAL', 'COEXIST', 'COEXISTENCE', 'COEXTENSIVE'
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
      'CONVERTER', 'EXTENDER', 'TELECONVERTER', 'DIOPTER', 'CLOSEUPFILTER', 'EXTENSION', 'TUBE', 'BELLOWS', 'REVERSAL', 'RING',
      'AUTOFOCUS', 'MANUAL', 'FOCUS', 'PEAKING', 'MAGNIFY', 'MAGNIFICATION', 'ZOOM', 'CROP', 'FRAME', 'ASPECT',
      'RATIO', 'SQUARE', 'PANORAMA', 'PORTRAIT', 'LANDSCAPE', 'CINEMATIC', 'ANAMORPHIC', 'LETTERBOX', 'PILLARBOX', 'FULLSCREEN',
      'RESOLUTION', 'DEFINITION', 'SHARPNESS', 'ACUITY', 'CLARITY', 'FOCUS', 'BLUR', 'SOFTNESS', 'HARDNESS', 'EDGE',
      'DETAIL', 'TEXTURE', 'SURFACE', 'GRAIN', 'NOISE', 'ARTIFACT', 'COMPRESSION', 'QUALITY', 'BITRATE', 'CODEC',
      'FORMAT', 'JPEG', 'RAW', 'TIFF', 'PNG', 'GIF', 'WEBP', 'HEIF', 'AVIF', 'LOSSLESS',
      'LOSSY', 'COMPRESSION', 'QUALITY', 'SIZE', 'STORAGE', 'MEMORY', 'CARD', 'BUFFER', 'CACHE', 'TRANSFER'
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
      'IDENTITY', 'UNIQUE', 'SPECIAL', 'MEMORABLE', 'DISTINCTIVE', 'RECOGNIZABLE', 'ICONIC', 'LEGENDARY', 'SUPERMODEL', 'CELEBRITY',
      'STRUT', 'SASHAY', 'GLIDE', 'PIVOT', 'TURN', 'TWIRL', 'SPIN', 'WALK', 'MARCH', 'STRIDE',
      'PACE', 'TEMPO', 'RHYTHM', 'BEAT', 'MUSIC', 'SONG', 'TRACK', 'SOUND', 'AUDIO', 'VOLUME',
      'ENERGY', 'POWER', 'STRENGTH', 'GRACE', 'ELEGANCE', 'POISE', 'BALANCE', 'CONTROL', 'PRECISION', 'TIMING',
      'COORDINATION', 'MOVEMENT', 'MOTION', 'GESTURE', 'HAND', 'ARM', 'LEG', 'FOOT', 'STEP', 'STRIDE',
      'HEEL', 'TOE', 'BALL', 'SOLE', 'ARCH', 'ANKLE', 'CALF', 'KNEE', 'THIGH', 'GLUTE'
    ],
    'ICONS': [
      'AUDREY', 'MARILYN', 'DIANA', 'COCO', 'TWIGGY', 'NAOMI', 'CINDY', 'CLAUDIA', 'GISELE', 'TYRA',
      'HEIDI', 'KATE', 'GIGI', 'BELLA', 'KENDALL', 'KARLIE', 'TAYLOR', 'RIHANNA', 'BEYONCE', 'MADONNA',
      'BRITNEY', 'CHRISTINA', 'SHAKIRA', 'JENNIFER', 'ANGELINA', 'SCARLETT', 'BLAKE', 'JESSICA', 'MIRANDA', 'OLIVIA',
      'EMMA', 'NATALIE', 'CHARLIZE', 'MERYL', 'JULIA', 'SANDRA', 'REESE', 'CAMERON', 'RACHEL', 'MONICA',
      'PHOEBE', 'ROSS', 'CHANDLER', 'JOEY', 'GUNTHER', 'JANICE', 'ERICA', 'FRANK', 'ALICE', 'SUSAN',
      'CAROL', 'BEN', 'EMMA', 'JACK', 'RACHEL', 'ROSS', 'CHANDLER', 'MONICA', 'PHOEBE', 'JOEY',
      'DAVID', 'VICTORIA', 'BROOKLYN', 'ROMEO', 'CRUZ', 'HARPER', 'ROMEO', 'CRUZ', 'HARPER', 'BROOKLYN',
      'PRINCE', 'PRINCESS', 'KING', 'QUEEN', 'DUKE', 'DUCHESS', 'EARL', 'COUNTESS', 'BARON', 'BARONESS',
      'MARQUIS', 'MARQUESS', 'VISCOUNT', 'VISCOUNTESS', 'KNIGHT', 'DAME', 'LORD', 'LADY', 'SIR', 'MADAM',
      'EMPEROR', 'EMPRESS', 'SULTAN', 'SULTANA', 'PHARAOH', 'CLEOPATRA', 'NEFERTITI', 'HATSHEPSUT', 'RAMESSES', 'TUTANKHAMUN',
      'CAESAR', 'POMPEY', 'BRUTUS', 'ANTONY', 'OCTAVIAN', 'NERO', 'CALIGULA', 'CLAUDIUS', 'TITUS', 'DOMITIAN',
      'TRAJAN', 'HADRIAN', 'ANTONINUS', 'MARCUS', 'AURELIUS', 'COMMODUS', 'SEPTIMIUS', 'SEVERUS', 'CARACALLA', 'ELAGABALUS',
      'ALEXANDER', 'PHILIP', 'ARISTOTLE', 'SOCRATES', 'PLATO', 'HOMER', 'VIRGIL', 'DANTE', 'SHAKESPEARE', 'CERVANTES',
      'MOLIERE', 'GOETHE', 'SCHILLER', 'BYRON', 'SHELLEY', 'KEATS', 'WORDSWORTH', 'COLERIDGE', 'BLAKE', 'BURNS',
      'AUSTEN', 'BRONTE', 'DICKENS', 'THACKERAY', 'ELIOT', 'HARDY', 'JAMES', 'LAWRENCE', 'JOYCE', 'WOOLF',
      'FITZGERALD', 'HEMINGWAY', 'FAULKNER', 'STEINBECK', 'SALINGER', 'KEROUAC', 'GINSBERG', 'MORRISON', 'WALKER', 'ANGELOU',
      'BALDWIN', 'HUGHES', 'HURSTON', 'ELLISON', 'WRIGHT', 'BALDWIN', 'GIOVANNI', 'SANCHEZ', 'REED', 'BARAKA',
      'AMIRI', 'NIKKI', 'SONIA', 'AUDRE', 'JUNE', 'ALICE', 'TONI', 'GLORIA', 'BELL', 'HOOKS',
      'SIMONE', 'NINA', 'ARETHA', 'ELLA', 'BILLIE', 'BESSIE', 'ETHEL', 'JOSEPHINE', 'LENA', 'DOROTHY',
      'PEARL', 'RUBY', 'SAPPHIRE', 'EMERALD', 'DIAMOND', 'CRYSTAL', 'AMBER', 'JADE', 'OPAL', 'IRIS'
    ],
    'MUSES': [
      'INSPIRATION', 'MUSE', 'CREATIVITY', 'VISION', 'DREAM', 'FANTASY', 'IMAGINATION', 'WONDER', 'MAGIC', 'MYSTERY',
      'ENCHANTMENT', 'SPELL', 'CHARM', 'ALLURE', 'MYSTIQUE', 'ELEGANCE', 'GRACE', 'BEAUTY', 'PERFECTION', 'SUBLIME',
      'ETHEREAL', 'CELESTIAL', 'DIVINE', 'HEAVENLY', 'ANGELIC', 'SERAPHIC', 'CHERUBIC', 'GODLIKE', 'IMMORTAL', 'ETERNAL',
      'TIMELESS', 'AGELESS', 'INFINITE', 'BOUNDLESS', 'LIMITLESS', 'ENDLESS', 'PERPETUAL', 'EVERLASTING', 'UNDYING', 'DEATHLESS',
      'IMMORTALITY', 'ETERNITY', 'INFINITY', 'VASTNESS', 'IMMENSITY', 'GRANDEUR', 'MAJESTY', 'SPLENDOR', 'GLORY', 'TRIUMPH',
      'VICTORY', 'CONQUEST', 'DOMINION', 'SUPREMACY', 'SOVEREIGNTY', 'POWER', 'STRENGTH', 'MIGHT', 'FORCE', 'VIGOR',
      'VITALITY', 'ENERGY', 'PASSION', 'FERVOR', 'ZEAL', 'ARDOR', 'ENTHUSIASM', 'EXUBERANCE', 'EBULLIENCE', 'EFFERVESCENCE',
      'EFFULGENCE', 'RADIANCE', 'LUMINOSITY', 'BRILLIANCE', 'SPARKLE', 'GLITTER', 'GLIMMER', 'SHIMMER', 'SHEEN', 'LUSTER',
      'SHINE', 'GLOW', 'GLEAM', 'GLOSS', 'POLISH', 'BURNISH', 'REFULGENCE', 'RESPLENDENCE', 'MAGNIFICENCE', 'GRANDEUR',
      'OPULENCE', 'LUXURY', 'RICHNESS', 'ABUNDANCE', 'PROFUSION', 'PLENITUDE', 'CORNUCOPIA', 'TREASURE', 'RICHES', 'WEALTH',
      'FORTUNE', 'PROSPERITY', 'SUCCESS', 'ACHIEVEMENT', 'ACCOMPLISHMENT', 'ATTAINMENT', 'FULFILLMENT', 'SATISFACTION', 'CONTENTMENT', 'BLISS',
      'HAPPINESS', 'JOY', 'DELIGHT', 'PLEASURE', 'ENJOYMENT', 'GRATIFICATION', 'ELATION', 'EXULTATION', 'RAPTURE', 'ECSTASY',
      'EUPHORIA', 'INTOXICATION', 'EXHILARATION', 'THRILL', 'EXCITEMENT', 'ANTICIPATION', 'EXPECTATION', 'HOPE', 'ASPIRATION', 'LONGING',
      'YEARNING', 'DESIRE', 'CRAVING', 'HUNGER', 'THIRST', 'APPETITE', 'LUST', 'PASSION', 'LOVE', 'ADORATION',
      'DEVOTION', 'REVERENCE', 'VENERATION', 'WORSHIP', 'IDOLATRY', 'ADULATION', 'FLATTERY', 'PRAISE', 'COMMENDATION', 'ACCLAIM',
      'APPLAUSE', 'OVATION', 'CHEERS', 'HURRAH', 'HUZZAH', 'BRAVO', 'ENCORE', 'CURTAIN', 'CALL', 'STANDING',
      'OVATION', 'BRAVISSIMO', 'MAGNIFICO', 'STUPENDO', 'FANTASTICO', 'BELLISSIMO', 'DOLCISSIMO', 'FORTISSIMO', 'PIANISSIMO', 'ALLEGRO',
      'PRESTO', 'VIVACE', 'ADAGIO', 'ANDANTE', 'LARGO', 'LENTO', 'MODERATO', 'ALLEGRETTO', 'VIVACISSIMO', 'PRESTISSIMO',
      'CRESCENDO', 'DIMINUENDO', 'SFORZANDO', 'STACCATO', 'LEGATO', 'VIBRATO', 'TREMOLO', 'GLISSANDO', 'PORTAMENTO', 'ARPEGGIO',
      'PIZZICATO', 'ARCO', 'TREMOLO', 'VIBRATO', 'GLISSANDO', 'PORTAMENTO', 'ARPEGGIO', 'PIZZICATO', 'ARCO', 'TREMOLO'
    ],
    'GLAM': [
      'GLAMOUR', 'GLITTER', 'SPARKLE', 'SHINE', 'DAZZLE', 'GLITZ', 'PIZZAZZ', 'RAZZMATAZZ', 'FLASH', 'FLAIR',
      'STYLE', 'PANACHE', 'ÉLAN', 'VERVE', 'VIVACITY', 'VIBRANCY', 'RADIANCE', 'LUMINESCENCE', 'PHOSPHORESCENCE', 'FLUORESCENCE',
      'IRIDESCENCE', 'OPALESCENCE', 'NACRE', 'PEARL', 'DIAMOND', 'RUBY', 'SAPPHIRE', 'EMERALD', 'TOPAZ', 'AMETHYST',
      'GARNET', 'OPAL', 'JADE', 'TURQUOISE', 'AQUAMARINE', 'BERYL', 'TOURMALINE', 'ZIRCON', 'PERIDOT', 'TANZANITE',
      'MOONSTONE', 'SUNSTONE', 'LABRADORITE', 'FELDSPAR', 'MICA', 'QUARTZ', 'CRYSTAL', 'GLASS', 'MIRROR', 'CHROME',
      'SILVER', 'GOLD', 'PLATINUM', 'PALLADIUM', 'RHODIUM', 'IRIDIUM', 'RUTHENIUM', 'OSMIUM', 'RHENIUM', 'TUNGSTEN',
      'MOLYBDENUM', 'TANTALUM', 'NIOBIUM', 'VANADIUM', 'CHROMIUM', 'MANGANESE', 'IRON', 'COBALT', 'NICKEL', 'COPPER',
      'ZINC', 'CADMIUM', 'MERCURY', 'GALLIUM', 'INDIUM', 'TIN', 'LEAD', 'BISMUTH', 'POLONIUM', 'ASTATINE',
      'FRANCIUM', 'RADIUM', 'ACTINIUM', 'THORIUM', 'PROTACTINIUM', 'URANIUM', 'NEPTUNIUM', 'PLUTONIUM', 'AMERICIUM', 'CURIUM',
      'BERKELIUM', 'CALIFORNIUM', 'EINSTEINIUM', 'FERMIUM', 'MENDELEVIUM', 'NOBELIUM', 'LAWRENCIUM', 'RUTHERFORDIUM', 'DUBNIUM', 'SEABORGIUM',
      'BOHRIUM', 'HASSIUM', 'MEITNERIUM', 'DARMSTADTIUM', 'ROENTGENIUM', 'COPERNICIUM', 'NIHONIUM', 'FLEROVIUM', 'MOSCOVIUM', 'LIVERMORIUM',
      'UNUNENNIUM', 'UNUNBIUM', 'UNUNTRIUM', 'UNUNQUADIUM', 'UNUNPENTIUM', 'UNUNHEXIUM', 'UNUNSEPTIUM', 'UNUNOCTIUM', 'UNUNENNIUM', 'UNBINILIUM',
      'UNBIUNIUM', 'UNBIBIUM', 'UNBITTRIUM', 'UNBIQUADIUM', 'UNBIPENTIUM', 'UNBIHEXIUM', 'UNBISEPTIUM', 'UNBIOCTIUM', 'UNBIENNIUM', 'UNTRINILIUM',
      'UNTRINUNIUM', 'UNTRIBIUM', 'UNTRITRIUM', 'UNTRIQUADIUM', 'UNTRIPENTIUM', 'UNTRIHEXIUM', 'UNTRISEPTIUM', 'UNTRIOCTIUM', 'UNTRIENNIUM', 'UNQUADNILIUM',
      'UNQUADUNIUM', 'UNQUADBIUM', 'UNQUADTRIUM', 'UNQUADQUADIUM', 'UNQUADPENTIUM', 'UNQUADHEXIUM', 'UNQUADSEPTIUM', 'UNQUADOCTIUM', 'UNQUADENNIUM', 'UNQUINILIUM',
      'UNQUINUNIUM', 'UNQUINBIUM', 'UNQUIN TRIUM', 'UNQUINQUADIUM', 'UNQUINPENTIUM', 'UNQUINHEXIUM', 'UNQUINSEPTIUM', 'UNQUINOCTIUM', 'UNQUINNIUM', 'UNSEXNILIUM',
      'UNSEXUNIUM', 'UNSEXBIUM', 'UNSEXTRIUM', 'UNSEXQUADIUM', 'UNSEXPENTIUM', 'UNSEXHEXIUM', 'UNSEXSEPTIUM', 'UNSEXOCTIUM', 'UNSEXENNIUM', 'UNSEPNILIUM',
      'UNSEPUNIUM', 'UNSEPBIUM', 'UNSEPTRIUM', 'UNSEPQUADIUM', 'UNSEPPENTIUM', 'UNSEPHEXIUM', 'UNSEPSEPTIUM', 'UNSEPOCTIUM', 'UNSEPENNIUM', 'UNOTNILIUM'
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
      playFunnyLosingSound();
    }

    if (isWon) {
      const score = calculateScore(newWrongGuesses);
      setCurrentScore(score);
      playMegaJackpotSound();
      setShowMegaJackpot(true);
      setTimeout(() => setShowMegaJackpot(false), 6000);
      setTimeout(() => setShowInitialsPrompt(true), 1000);
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

  // Progressive hangman face (smirk to frown to dead)
  const renderHangman = () => {
    const parts = [];
    const stage = gameState.wrongGuesses;

    // Stage 1: Head with expression
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

    // Stage 2: Tuxedo jacket body
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

    // Stage 3: Left arm
    if (stage >= 3) {
      parts.push(
        <g key="leftArm">
          <rect x="230" y="215" width="50" height="12" fill="#1a1a1a" stroke="#d4a574" strokeWidth="1" rx="6" />
          <circle cx="235" cy="221" r="8" fill="#f4c4a0" />
        </g>
      );
    }

    // Stage 4: Right arm
    if (stage >= 4) {
      parts.push(
        <g key="rightArm">
          <rect x="320" y="215" width="50" height="12" fill="#1a1a1a" stroke="#d4a574" strokeWidth="1" rx="6" />
          <circle cx="365" cy="221" r="8" fill="#f4c4a0" />
        </g>
      );
    }

    // Stage 5: Left leg
    if (stage >= 5) {
      parts.push(
        <g key="leftLeg">
          <rect x="285" y="280" width="10" height="60" fill="#2a2a2a" stroke="#d4a574" strokeWidth="1" />
          <rect x="282" y="340" width="16" height="12" fill="#1a1a1a" rx="2" />
        </g>
      );
    }

    // Stage 6: Right leg
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
      {/* 10 Ambient Motion Layers */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Layer 1: Spotlight sweep */}
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
        />

        {/* Layer 2: Falling coins */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`coin-${i}`}
            className="absolute w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-40"
            style={{
              left: `${(i / 8) * 100}%`,
              top: '-50px',
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: 360 * 3,
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {/* Layer 3: Fluttering cards */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`card-${i}`}
            className="absolute w-12 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg opacity-30"
            style={{
              left: `${(i / 6) * 100}%`,
              top: '20%',
            }}
            animate={{
              y: [0, 100, 0],
              rotate: [0, 45, 0],
              x: [0, 50, 0],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Layer 4: Roulette wheel */}
        <motion.div
          className="absolute top-1/4 right-10 w-32 h-32 border-4 border-yellow-400 rounded-full opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${(i / 8) * 360}deg) translateY(-64px)`,
              }}
            />
          ))}
        </motion.div>

        {/* Layer 5: Pulsing aura */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.3) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.3) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.3) 0%, transparent 70%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Layer 6: Velvet noise texture */}
        <div className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/%3E%3C/filter%3E%3Crect width="400" height="400" fill="white" filter="url(%23noise)"/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }}
        />

        {/* Layer 7: Radial gradient - spotlight effect */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black opacity-60" 
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255,215,0,0.15) 0%, transparent 50%)'
          }}
        />

        {/* Layer 8: Animated marquee light chases - Top border */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '200% 100%',
            boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
          }}
        />

        {/* Layer 9: Animated marquee light chases - Bottom border */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-yellow-300 to-red-500 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['100% 0%', '0% 0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '200% 100%',
            boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
          }}
        />

        {/* Layer 10: Side borders */}
        <motion.div
          className="fixed left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-300 via-red-500 to-yellow-300 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '100% 200%',
            boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
          }}
        />
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 via-yellow-300 to-red-500 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 100%', '0% 0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '100% 200%',
            boxShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,0,0,0.6)'
          }}
        />
      </div>

      {/* Mega Jackpot Win Sequence (6 seconds full-screen) */}
      <AnimatePresence>
        {showMegaJackpot && (
          <motion.div
            key="mega-jackpot"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Explosion effect */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-yellow-300 rounded-full"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 20) * Math.PI * 2) * 400,
                  y: Math.sin((i / 20) * Math.PI * 2) * 400,
                  opacity: 0,
                }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
            ))}

            {/* Center text */}
            <motion.div
              className="text-center z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <motion.p
                className="text-8xl font-heading font-black text-yellow-300 mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 5 }}
              >
                🎰 MEGA JACKPOT! 🎰
              </motion.p>
              <motion.p
                className="text-6xl font-heading font-black text-green-400"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 0.5, repeat: 5 }}
              >
                +${currentScore.toLocaleString()}
              </motion.p>
            </motion.div>

            {/* Confetti */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-300 to-red-500 rounded-full"
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
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.05,
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
          className="w-full max-w-6xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="text-center md:text-left">
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,0,0,0.6)',
                  '0 0 20px rgba(255,215,0,1), 0 0 40px rgba(255,0,0,0.8)',
                  '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,0,0,0.6)',
                ]
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="text-4xl md:text-6xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 mb-1 tracking-tighter"
            >
              RED2 HANGMAN
            </motion.h1>
            <p className="text-lg md:text-xl font-mono text-yellow-300 tracking-widest animate-pulse">$50M CASINO MACHINE</p>
          </div>
          
          <div className="flex flex-col gap-3 items-center md:items-end">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-4 border-yellow-200 flex items-center justify-center shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,255,255,0.3)'
              }}
            >
              <div className="text-center">
                <p className="text-xs font-mono text-yellow-900 uppercase tracking-widest mb-1">VIP</p>
                <p className="text-lg font-heading font-black text-yellow-900" style={{ color: VIP_TIERS[vipTier].color }}>
                  {VIP_TIERS[vipTier].name}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="px-6 py-3 bg-black border-4 border-yellow-300 rounded-lg"
              style={{
                boxShadow: '0 0 20px rgba(255,215,0,0.8), inset 0 0 10px rgba(255,215,0,0.2)',
                fontFamily: '\"Courier New\", monospace',
              }}
            >
              <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">WINNINGS</p>
              <motion.p
                key={totalWinnings}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl md:text-4xl font-mono font-black text-yellow-300"
              >
                ${totalWinnings.toLocaleString()}
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

        {/* Social Proof Elements - Compressed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-3 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Live</p>
            <motion.p
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl font-heading font-black text-white"
            >
              {livePlayersCount.toLocaleString()}
            </motion.p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-3 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Jackpot</p>
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xl font-heading font-black text-yellow-300"
            >
              ${progressiveJackpot.toLocaleString()}
            </motion.p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-3 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Tier</p>
            <p className="text-xl font-heading font-black" style={{ color: VIP_TIERS[vipTier].color }}>
              {VIP_TIERS[vipTier].name}
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-3 text-center">
            <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">Multi</p>
            <p className="text-xl font-heading font-black text-green-400">
              {VIP_TIERS[vipTier].multiplier}x
            </p>
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
                <p className="text-xl md:text-2xl font-mono text-yellow-300 tracking-widest animate-pulse">
                  ★ SELECT YOUR GAME ★
                </p>
                <p className="text-base md:text-lg font-paragraph text-white/70 max-w-3xl mx-auto">
                  Choose your category and spin the wheel. Every correct guess earns you cash. VIP members earn multipliers!
                </p>
              </div>

              <motion.div
                className="bg-gradient-to-br from-gray-900 via-black to-gray-950 border-4 border-yellow-300 rounded-2xl p-8 md:p-10 shadow-2xl"
                style={{
                  boxShadow: '0 0 40px rgba(255,215,0,0.6), inset 0 0 30px rgba(255,215,0,0.1)'
                }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  {Object.keys(categories).map((category, idx) => (
                    <motion.button
                      key={category}
                      onClick={() => startGame(category)}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative p-6 md:p-8 bg-gradient-to-br from-primary/30 to-primary/5 border-2 border-primary rounded-xl hover:border-yellow-400 hover:from-primary/50 hover:to-primary/20 transition-all duration-300 overflow-hidden min-h-40 flex flex-col justify-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/10 group-hover:to-yellow-400/5 transition-all duration-300" />
                      <div className="relative z-10 space-y-3 flex flex-col items-center text-center">
                        <div className="text-4xl md:text-5xl font-heading font-black text-yellow-300 group-hover:text-yellow-200 transition-colors">
                          ◆
                        </div>
                        <p className="text-xl md:text-2xl font-heading font-black text-primary group-hover:text-yellow-300 transition-colors uppercase tracking-wider">
                          {category}
                        </p>
                        <p className="text-sm font-mono text-white/60 group-hover:text-white/80 transition-colors">
                          {(categories as any)[category].length} words
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-primary/20 via-black to-black rounded-xl border-2 border-primary p-8 md:p-10 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-primary/30">
                    <div>
                      <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">★ Category ★</p>
                      <p className="text-3xl md:text-4xl font-heading font-black text-primary">{gameState.category}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-mono text-yellow-300 uppercase tracking-widest mb-1">★ Wrong ★</p>
                      <motion.p
                        key={gameState.wrongGuesses}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-4xl md:text-5xl font-heading font-black ${
                          gameState.wrongGuesses >= maxWrong ? 'text-red-500' : 'text-yellow-300'
                        }`}
                      >
                        {gameState.wrongGuesses}/{maxWrong}
                      </motion.p>
                    </div>
                  </div>

                  <div className="flex justify-center py-6 bg-black/50 rounded-lg border border-primary/20">
                    <svg width="400" height="300" viewBox="0 0 400 300" className="w-full max-w-sm">
                      <line x1="150" y1="250" x2="150" y2="50" stroke="#d4a574" strokeWidth="4" />
                      <line x1="150" y1="50" x2="300" y2="50" stroke="#d4a574" strokeWidth="4" />
                      <line x1="300" y1="50" x2="300" y2="130" stroke="#d4a574" strokeWidth="3" />
                      {renderHangman()}
                    </svg>
                  </div>

                  <motion.div
                    key={gameState.displayWord.join('')}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-center py-8 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border-2 border-primary/50 p-6"
                  >
                    <p className="text-5xl md:text-6xl font-mono font-black text-yellow-300 tracking-widest break-words">
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
