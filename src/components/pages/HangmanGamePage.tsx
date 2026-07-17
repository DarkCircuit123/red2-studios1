import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Zap, Trophy, Target, Flame } from 'lucide-react';
import { CameraIcon, ScissorsIcon, PolaroidIcon } from '@/components/CinemaIcons';
import { generateRollSequence, easings, formatNumber } from '@/lib/rollStats';
import '@/styles/cinema.css';
import '@/styles/ballys-premium.css';

/**
 * BALLY'S PREMIUM CASINO SLOT ENGINE
 * Features: Volumetric 3D symbols, metallic textures, specular sweeps, physics-based coins,
 * neon glow casts, HDR bloom, shattering glass transitions, and tiered win celebrations.
 */
class BallysProCasinoSlot {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  reels: any[];
  particles: any[];
  coins: any[];
  isWinState: boolean;
  animationFrameId: number | null;
  time: number;
  paylineGlow: number;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d', { alpha: true }) || null;
    this.reels = [];
    this.particles = [];
    this.coins = [];
    this.isWinState = false;
    this.animationFrameId = null;
    this.time = 0;
    this.paylineGlow = 0;
    this.initializeReels();
  }

  initializeReels() {
    if (!this.canvas) return;
    const reelWidth = this.canvas.width / 5;
    this.reels = Array.from({ length: 5 }, (_, i) => ({
      x: i * reelWidth,
      y: 0,
      targetY: 0,
      speed: 0,
      spinning: false,
      symbols: this.generateRandomSymbols(20),
      stopDelay: 500 + i * 400,
      breathePhase: Math.random() * Math.PI * 2,
      squashAmount: 0,
    }));
  }

  generateRandomSymbols(count: number) {
    const categories = ['👑', '💎', '🍒', '🔔', '7️⃣'];
    return Array.from({ length: count }, () => 
      categories[Math.floor(Math.random() * categories.length)]
    );
  }

  spin() {
    this.isWinState = false;
    this.particles = [];
    this.coins = [];
    
    this.reels.forEach((reel, index) => {
      reel.spinning = true;
      reel.speed = 50 + Math.random() * 20;
      reel.targetY = reel.y + 2000 + Math.random() * 500;
      
      setTimeout(() => {
        this.stopReel(index);
      }, reel.stopDelay);
    });
  }

  stopReel(index: number) {
    const reel = this.reels[index];
    reel.spinning = false;
    reel.targetY = Math.round(reel.targetY / 100) * 100;
    reel.squashAmount = 1;
  }

  animate() {
    if (!this.ctx || !this.canvas) return;
    
    this.time += 1;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw parallax backdrop
    this.drawParallaxBackdrop();
    
    // Draw chrome bezels with ambient occlusion
    this.drawChromeBezels();
    
    // Draw top vignette
    this.drawTopVignette();
    
    // Update and draw reels
    this.reels.forEach((reel, reelIndex) => {
      if (reel.spinning) {
        reel.y += reel.speed;
        reel.speed *= 0.98;
      } else {
        const diff = reel.targetY - reel.y;
        reel.y += diff * 0.15;
        
        // Squash & stretch physics
        if (reel.squashAmount > 0) {
          reel.squashAmount *= 0.92;
        }
      }

      const renderY = reel.y % (reel.symbols.length * 100);
      reel.symbols.forEach((symbol: string, symIndex: number) => {
        const symY = symIndex * 100 + renderY - 200;
        if (symY > -100 && symY < this.canvas!.height + 100) {
          this.drawVolumetricSymbol(symbol, reel.x, symY, reelIndex, reel);
        }
      });
    });

    // Draw dynamic neon paylines
    this.drawNeonPaylines();
    
    // Draw bottom vignette
    this.drawBottomVignette();

    if (this.isWinState) {
      this.spawnPhysicsCoins();
      this.updateAndDrawCoins();
      this.updateAndDrawParticles();
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  drawParallaxBackdrop() {
    if (!this.ctx || !this.canvas) return;
    
    // Cosmic nebula backdrop with parallax
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
    );
    gradient.addColorStop(0, 'rgba(100, 50, 150, 0.3)');
    gradient.addColorStop(0.5, 'rgba(50, 100, 150, 0.15)');
    gradient.addColorStop(1, 'rgba(20, 20, 40, 0.1)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Parallax dust particles
    for (let i = 0; i < 15; i++) {
      const x = (i * 80 + this.time * 0.5) % this.canvas.width;
      const y = (i * 60 + Math.sin(this.time * 0.01 + i) * 30) % this.canvas.height;
      const size = 1 + Math.sin(this.time * 0.02 + i) * 0.5;
      
      this.ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + Math.sin(this.time * 0.01 + i) * 0.1})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawChromeBezels() {
    if (!this.ctx || !this.canvas) return;
    
    const reelWidth = this.canvas.width / 5;
    
    for (let i = 1; i < 5; i++) {
      const x = i * reelWidth;
      
      // Chrome bezel with 3D effect
      const bezelGradient = this.ctx.createLinearGradient(x - 4, 0, x + 4, 0);
      bezelGradient.addColorStop(0, 'rgba(200, 200, 200, 0.8)');
      bezelGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      bezelGradient.addColorStop(1, 'rgba(150, 150, 150, 0.8)');
      
      this.ctx.fillStyle = bezelGradient;
      this.ctx.fillRect(x - 2, 0, 4, this.canvas.height);
      
      // Ambient occlusion shadow
      const shadowGradient = this.ctx.createLinearGradient(x, 0, x + 8, 0);
      shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      this.ctx.fillStyle = shadowGradient;
      this.ctx.fillRect(x, 0, 8, this.canvas.height);
    }
  }

  drawTopVignette() {
    if (!this.ctx || !this.canvas) return;
    
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, 60);
  }

  drawBottomVignette() {
    if (!this.ctx || !this.canvas) return;
    
    const gradient = this.ctx.createLinearGradient(0, this.canvas.height - 60, 0, this.canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
  }

  drawVolumetricSymbol(symbol: string, x: number, y: number, reelIndex: number, reel: any) {
    if (!this.ctx) return;
    
    this.ctx.save();
    this.ctx.translate(x + 60, y + 50);
    
    // Idle breathing animation
    const breathe = Math.sin(this.time * 0.03 + reel.breathePhase) * 0.08;
    const scale = 1 + breathe + reel.squashAmount * 0.15;
    
    this.ctx.scale(scale, scale - reel.squashAmount * 0.1);
    
    // 3D metallic beveling
    const metalGradient = this.ctx.createRadialGradient(-15, -15, 0, 0, 0, 40);
    metalGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    metalGradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
    metalGradient.addColorStop(0.7, 'rgba(200, 170, 0, 0.6)');
    metalGradient.addColorStop(1, 'rgba(100, 80, 0, 0.4)');
    
    this.ctx.fillStyle = metalGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Specular sweep (glint of light)
    const sweepPhase = (this.time * 0.02 + reelIndex * 0.3) % (Math.PI * 2);
    const sweepX = Math.cos(sweepPhase) * 30;
    const sweepY = Math.sin(sweepPhase) * 30;
    
    const sweepGradient = this.ctx.createRadialGradient(sweepX, sweepY, 0, sweepX, sweepY, 15);
    sweepGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sweepGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = sweepGradient;
    this.ctx.beginPath();
    this.ctx.arc(sweepX, sweepY, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Symbol text with glow
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Glow effect
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(symbol, 0, 0);
    
    this.ctx.restore();
  }

  drawNeonPaylines() {
    if (!this.ctx || !this.canvas) return;
    
    this.paylineGlow = (this.paylineGlow + 0.02) % (Math.PI * 2);
    const glowIntensity = Math.sin(this.paylineGlow) * 0.5 + 0.5;
    
    // Horizontal paylines with neon glow
    const paylineY = this.canvas.height / 2;
    
    // Draw payline with additive blending
    this.ctx.globalCompositeOperation = 'screen';
    
    const lineGradient = this.ctx.createLinearGradient(0, paylineY - 5, 0, paylineY + 5);
    lineGradient.addColorStop(0, `rgba(255, 0, 255, 0)`);
    lineGradient.addColorStop(0.5, `rgba(255, 0, 255, ${0.6 * glowIntensity})`);
    lineGradient.addColorStop(1, `rgba(255, 0, 255, 0)`);
    
    this.ctx.fillStyle = lineGradient;
    this.ctx.fillRect(0, paylineY - 5, this.canvas.width, 10);
    
    // Neon cast on symbols above and below
    this.reels.forEach((reel) => {
      const renderY = reel.y % (reel.symbols.length * 100);
      reel.symbols.forEach((symbol: string, symIndex: number) => {
        const symY = symIndex * 100 + renderY - 200;
        if (Math.abs(symY + 50 - paylineY) < 80) {
          const distance = Math.abs(symY + 50 - paylineY);
          const tint = Math.max(0, 1 - distance / 80);
          
          this.ctx!.globalCompositeOperation = 'multiply';
          this.ctx!.fillStyle = `rgba(255, 0, 255, ${0.2 * tint * glowIntensity})`;
          this.ctx!.fillRect(reel.x, symY, 120, 100);
        }
      });
    });
    
    this.ctx.globalCompositeOperation = 'source-over';
  }

  spawnPhysicsCoins() {
    if (!this.canvas || this.coins.length >= 200) return;
    
    for (let i = 0; i < 3; i++) {
      this.coins.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: -50,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 15 - 5,
        vz: (Math.random() - 0.5) * 10,
        gravity: 0.8,
        size: Math.random() * 8 + 6,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.15,
        rotSpeedY: (Math.random() - 0.5) * 0.15,
        rotSpeedZ: (Math.random() - 0.5) * 0.15,
        bounce: 0.6,
        friction: 0.98,
      });
    }
  }

  updateAndDrawCoins() {
    if (!this.ctx || !this.canvas) return;
    
    this.coins.forEach((coin, index) => {
      coin.x += coin.vx;
      coin.y += coin.vy;
      coin.vy += coin.gravity;
      coin.vx *= coin.friction;
      coin.vz *= coin.friction;
      
      coin.rotX += coin.rotSpeedX;
      coin.rotY += coin.rotSpeedY;
      coin.rotZ += coin.rotSpeedZ;
      
      // Collision with bottom
      if (coin.y > this.canvas!.height - coin.size) {
        coin.y = this.canvas!.height - coin.size;
        coin.vy *= -coin.bounce;
        coin.vx *= 0.8;
      }
      
      // Collision with sides
      if (coin.x < coin.size) {
        coin.x = coin.size;
        coin.vx *= -coin.bounce;
      }
      if (coin.x > this.canvas!.width - coin.size) {
        coin.x = this.canvas!.width - coin.size;
        coin.vx *= -coin.bounce;
      }
      
      // Draw 3D coin
      this.ctx!.save();
      this.ctx!.translate(coin.x, coin.y);
      this.ctx!.rotate(coin.rotZ);
      
      // Coin gradient (3D effect)
      const coinGradient = this.ctx!.createRadialGradient(-5, -5, 0, 0, 0, coin.size);
      coinGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
      coinGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.8)');
      coinGradient.addColorStop(1, 'rgba(200, 170, 0, 0.7)');
      
      this.ctx!.fillStyle = coinGradient;
      this.ctx!.beginPath();
      this.ctx!.arc(0, 0, coin.size, 0, Math.PI * 2);
      this.ctx!.fill();
      
      // Coin border
      this.ctx!.strokeStyle = 'rgba(100, 80, 0, 0.8)';
      this.ctx!.lineWidth = 1;
      this.ctx!.stroke();
      
      this.ctx!.restore();
      
      if (coin.y > this.canvas!.height + 50) {
        this.coins.splice(index, 1);
      }
    });
  }

  updateAndDrawParticles() {
    if (!this.ctx || !this.canvas) return;
    
    this.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;

      this.ctx!.save();
      this.ctx!.translate(p.x, p.y);
      this.ctx!.rotate(p.rotation);
      
      this.ctx!.fillStyle = '#FFE259';
      this.ctx!.strokeStyle = '#FFA751';
      this.ctx!.lineWidth = 2;
      this.ctx!.beginPath();
      this.ctx!.arc(0, 0, p.size, 0, Math.PI * 2);
      this.ctx!.fill();
      this.ctx!.stroke();
      
      this.ctx!.restore();

      if (p.y > this.canvas!.height + 100) {
        this.particles.splice(index, 1);
      }
    });
  }

  triggerBigWin() {
    this.isWinState = true;
    if (this.canvas) {
      this.canvas.classList.add('screen-shake');
      setTimeout(() => this.canvas?.classList.remove('screen-shake'), 1200);
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

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

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [livePlayersCount, setLivePlayersCount] = useState(Math.floor(Math.random() * 500) + 100);
  const [progressiveJackpot, setProgressiveJackpot] = useState(50000);
  const [showMegaJackpot, setShowMegaJackpot] = useState(false);
  const [showRevealCard, setShowRevealCard] = useState(false);
  const [showDoubleDown, setShowDoubleDown] = useState(false);
  const [doubleDownCountdown, setDoubleDownCountdown] = useState(10);
  const [polaroidReveal, setPolaroidReveal] = useState(0); // 0-100% reveal
  const audioContextRef = useRef<AudioContext | null>(null);
  const coinDropCountRef = useRef(0);
  const ambientOscRef = useRef<OscillatorNode | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const casinoSlotRef = useRef<ProCasinoSlot | null>(null);

  const VIP_TIERS: VIPTier[] = [
    { level: 0, name: 'PLAYER', minScore: 0, color: '#888888', multiplier: 1 },
    { level: 1, name: 'SILVER', minScore: 250, color: '#c0c0c0', multiplier: 1.2 },
    { level: 2, name: 'GOLD', minScore: 500, color: '#ffd700', multiplier: 1.5 },
    { level: 3, name: 'PLATINUM', minScore: 750, color: '#e5e4e2', multiplier: 2 },
    { level: 4, name: 'DIAMOND', minScore: 1000, color: '#b9f2ff', multiplier: 2.5 },
  ];

  const categoriesData: Record<string, CategoryMeta> = {
    'SUPER_MODELS': {
      name: 'SUPER MODELS',
      tagline: 'Iconic Runway Legends & Fashion Icons',
      icon: '👑',
      justification: 'Celebrate the legendary supermodels who revolutionized the fashion industry. Every word is a name of an iconic model who graced runways and became cultural phenomena.',
      words: [
        'NAOMI', 'CINDY', 'CLAUDIA', 'GISELE', 'TYRA', 'HEIDI', 'KATE', 'GIGI', 'BELLA', 'KENDALL',
        'KARLIE', 'MIRANDA', 'CHRISTIE', 'IMAN', 'BEVERLY', 'TWIGGY', 'AUDREY', 'MARILYN', 'DIANA', 'COCO',
        'CAMPBELL', 'CRAWFORD', 'MOSS', 'BUNDCHEN', 'HADID', 'JENNER', 'EVANGELISTA', 'TURLINGTON', 'SEYMOUR', 'MACPHERSON',
        'BRINKLEY', 'FOSTER', 'SCHIFFER', 'HALL', 'BERRY', 'HALLE', 'TYSON', 'BANKS', 'SMALLS', 'RUNWAY',
        'CATWALK', 'STRUT', 'SMIZE', 'FIERCE', 'CHARISMA', 'ELEGANCE', 'GRACE', 'POISE', 'CONFIDENCE', 'ATTITUDE',
        'GLAMOUR', 'ICONIC', 'LEGENDARY', 'SUPERMODEL', 'CELEBRITY', 'ICON', 'LEGEND', 'MUSE', 'INSPIRATION', 'TRENDSETTER',
        'FASHIONISTA', 'DIVA', 'QUEEN', 'PRINCESS', 'GORGEOUS', 'STUNNING', 'RADIANT', 'LUMINOUS', 'STRIKING', 'CAPTIVATING',
        'MESMERIZING', 'ENCHANTING', 'ALLURING', 'PORTFOLIO', 'HEADSHOT', 'COMPOSITE', 'TEARSHEET', 'EDITORIAL', 'COMMERCIAL', 'PRINT',
        'DIGITAL', 'VIDEO', 'CAMPAIGN', 'BOOKING', 'CONTRACT', 'AGENCY', 'AGENT', 'BOOKER', 'SCOUT', 'TALENT',
        'MANAGER', 'COACH', 'TRAINER', 'DIRECTOR', 'PHOTOGRAPHER', 'STYLIST', 'MAKEUP', 'HAIR', 'WARDROBE', 'DESIGNER',
        'BRAND', 'AMBASSADOR', 'ENDORSEMENT', 'SPONSORSHIP', 'COLLABORATION', 'PARTNERSHIP', 'INFLUENCER', 'SOCIAL', 'MEDIA', 'FOLLOWERS',
        'ENGAGEMENT', 'FASHIONWEEK', 'SHOW', 'COLLECTION', 'SEASON', 'TREND', 'AESTHETIC', 'VIBE', 'ENERGY', 'MOVEMENT',
        'WALK', 'STRIDE', 'PACE', 'TEMPO', 'RHYTHM', 'BEAT', 'MUSIC', 'PERFORMANCE', 'BEARING', 'DEPORTMENT',
        'CARRIAGE', 'GAIT', 'POSTURE', 'STANCE', 'EXPRESSION', 'GAZE', 'LOOK', 'PROFILE', 'ANGLE', 'CHEEKBONE',
        'JAWLINE', 'STRUCTURE', 'SYMMETRY', 'PROPORTION', 'HEIGHT', 'WEIGHT', 'MEASUREMENTS', 'BUST', 'WAIST', 'HIP'
      ]
    },
    'CAMERAS': {
      name: 'CAMERAS',
      tagline: 'Photography Equipment & Optical Technology',
      icon: '📸',
      justification: 'Master the art of photography. Every word relates to cameras, lenses, optics, and the technical equipment used to capture stunning images.',
      words: [
        'CAMERA', 'LENS', 'APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'SENSOR', 'PIXEL', 'RESOLUTION', 'MEGAPIXEL',
        'DEPTH', 'FIELD', 'BOKEH', 'BLUR', 'SHARP', 'CLARITY', 'CONTRAST', 'SATURATION', 'VIBRANCE', 'WHITEBALANCE',
        'COLORTEMPERATURE', 'KELVIN', 'HISTOGRAM', 'METERING', 'SPOTMETER', 'MATRIX', 'SPEED', 'FASTSHUTTER', 'SLOWSHUTTER', 'BULB',
        'TIMELAPSE', 'LONGEXPOSURE', 'MOTION', 'FREEZE', 'ISO', 'SENSITIVITY', 'NOISE', 'GRAIN', 'DYNAMIC', 'RANGE',
        'SHADOW', 'HIGHLIGHT', 'MIDTONE', 'TONE', 'CURVE', 'LEVELS', 'BRIGHTNESS', 'DARKNESS', 'LUMINOSITY', 'VALUE',
        'TINT', 'COLORCAST', 'CORRECTION', 'GRADING', 'FILTER', 'POLARIZER', 'NEUTRAL', 'DENSITY', 'GRADUATED', 'SOFTFOCUS',
        'DIFFUSER', 'REFLECTOR', 'DIFFUSION', 'SOFTBOX', 'HARDLIGHT', 'KEYLIGHT', 'FILLLIGHT', 'BACKLIGHT', 'SIDELIGHT', 'TOPLIGHT',
        'UNDERLIGHT', 'RIMLIGHT', 'CATCHLIGHT', 'SPECULAR', 'DIFFUSE', 'REFLECTION', 'REFRACTION', 'TRANSMISSION', 'ABSORPTION', 'SCATTERING',
        'GLARE', 'FLARE', 'GHOSTING', 'ABERRATION', 'VIGNETTE', 'DISTORTION', 'CHROMATIC', 'SPHERICAL', 'COMA', 'ASTIGMATISM',
        'CURVATURE', 'PINCUSHION', 'BARREL', 'COMPOSITION', 'FRAMING', 'RULE', 'THIRDS', 'LEADING', 'LINE', 'SYMMETRY',
        'BALANCE', 'ASYMMETRY', 'DIAGONAL', 'PERSPECTIVE', 'LAYERING', 'FOREGROUND', 'BACKGROUND', 'MIDGROUND', 'SUBJECT', 'NEGATIVE',
        'SPACE', 'PORTRAIT', 'HEADSHOT', 'PROFILE', 'THREEQUARTER', 'FULLBODY', 'LANDSCAPE', 'SEASCAPE', 'CITYSCAPE', 'MACRO',
        'CLOSEUP', 'WILDLIFE', 'NATURE', 'STILL', 'LIFE', 'PRODUCT', 'FOOD', 'FASHION', 'STREET', 'DOCUMENTARY',
        'PHOTOJOURNALISM', 'STUDIO', 'LOCATION', 'OUTDOOR', 'INDOOR', 'NATURAL', 'ARTIFICIAL', 'AMBIENT', 'AVAILABLE', 'CONTINUOUS',
        'STROBE', 'FLASH', 'SPEEDLIGHT', 'UMBRELLA', 'BEAUTY', 'DISH', 'OCTABOX', 'STRIPBOX', 'RINGLIGHT', 'LEDPANEL',
        'TRIPOD', 'MONOPOD', 'GIMBAL', 'STABILIZER', 'STEADICAM', 'DOLLY', 'SLIDER', 'CRANE', 'JIBARM', 'MOTORIZED',
        'REMOTE', 'TRIGGER', 'WIRELESS', 'CABLE', 'SYNC', 'HOTSHOE', 'BRACKET', 'CLAMP', 'MOUNT', 'ADAPTER',
        'PRIME', 'ZOOM', 'TELEPHOTO', 'WIDE', 'ULTRAWIDE', 'FISHEYE', 'TILT', 'SHIFT', 'CONVERTER', 'EXTENDER',
        'TELECONVERTER', 'DIOPTER', 'CLOSEUPFILTER', 'EXTENSION', 'TUBE', 'BELLOWS', 'REVERSAL', 'RING', 'AUTOFOCUS', 'MANUAL',
        'PEAKING', 'MAGNIFY', 'MAGNIFICATION', 'CROP', 'FRAME', 'ASPECT', 'RATIO', 'SQUARE', 'PANORAMA', 'CINEMATIC',
        'ANAMORPHIC', 'LETTERBOX', 'PILLARBOX', 'FULLSCREEN', 'DEFINITION', 'SHARPNESS', 'ACUITY', 'SOFTNESS', 'HARDNESS', 'EDGE',
        'DETAIL', 'TEXTURE', 'SURFACE', 'ARTIFACT', 'COMPRESSION', 'QUALITY', 'BITRATE', 'CODEC', 'FORMAT', 'JPEG',
        'RAW', 'TIFF', 'PNG', 'GIF', 'WEBP', 'HEIF', 'AVIF', 'LOSSLESS', 'LOSSY', 'SIZE',
        'STORAGE', 'MEMORY', 'CARD', 'BUFFER', 'CACHE', 'TRANSFER', 'OPTICS'
      ]
    },
    'HOLLYWOOD_STARS': {
      name: 'HOLLYWOOD STARS',
      tagline: 'Celebrities, Actors & Entertainment Icons',
      icon: '🌟',
      justification: 'Recognize the brightest stars of Hollywood. Every word is a name of a famous actor, actress, or celebrity who captivated audiences on screen.',
      words: [
        'TOMHANKS', 'MERYLSTREEP', 'DENZELWASHINGTON', 'KATEWINSLET', 'LEONARDODICAPRIO', 'OPRAHWINFREY', 'TOMCRUISE', 'ANGELINAJOLIE', 'BRADPITT', 'JOHNNYDEP',
        'JACKNICHOLSON', 'CLINTEASTWOOD', 'STEVESPIELBERG', 'MARTINSCORSESE', 'CHRISTOPHERNOLAN', 'QUENTIN', 'TARANTINO', 'JAMESBLACK', 'CAMERON', 'RIDLEYSCOTT',
        'AUDREYHEPBURN', 'MARIYLINMONROE', 'ELIZABETHTAYLOR', 'GRACEKELLEY', 'INGRIDBERGMAN', 'VIVIENLEIGH', 'AVAGARDNER', 'RITALAYSON', 'JOANECRAWFORD', 'BETTEDAVIS',
        'CHARLIZETHERON', 'NATALIEPORTMAN', 'SCARLETJOHANSSON', 'EMMAWATSON', 'BLAKELI', 'VELY', 'JESSICAALBA', 'MILAKUNIS', 'OLIVIAWILDE', 'KRISTENSTEWART',
        'ROBERTPATTINSON', 'CHRISEVANS', 'CHRISHEMSWORTH', 'TOMHIDDLESTON', 'BENEDICTTCUMBERBATCH', 'AIDANTURNER', 'ORLANDOBLOOM', 'VIGGOMRTENSEN', 'ELIJAH', 'WOOD',
        'IANDMCKELLEN', 'CHRISTOPHERLEE', 'JOHNNYDEPP', 'JONNYDEPPP', 'JACKBLACK', 'WILLSMITH', 'DENZELWASHINGTON', 'MORGANFREEMAN', 'SAMLJACKSON', 'KEVINHART',
        'JIMCARREY', 'ADAMANDLER', 'EDDIEMURPHY', 'ROBINWILLIAMS', 'BILLBURR', 'STEVECARELL', 'RAINNWILSON', 'JOHNCENA', 'THEROCK', 'JASONSTATHAM',
        'JETLI', 'JACKIECHAN', 'BRUCELEE', 'ARNOLDSCHWARZENEGGER', 'SYLVESTERSTALLONE', 'JEANCLAUDEVANDAMME', 'STEVEREEVES', 'GORDONLIU', 'DONNIEYEN', 'TONYJAA',
        'TOMYOUNG', 'SCOTTADKINS', 'MICHAELJAI', 'WHITE', 'WESLEY', 'SNIPES', 'VANDAM', 'SEAGAL', 'STEVEN', 'SEAGAL',
        'JEANCLAUDEVANDAMME', 'BRANDONLEE', 'BRUCELEE', 'CHUCKLENORRIS', 'STEVEREEVES', 'GORDONLIU', 'DONNIEYEN', 'TONYJAA', 'JETLI', 'JACKIECHAN'
      ]
    },
    'MODELING_AGENCIES': {
      name: 'MODELING AGENCIES',
      tagline: 'Fashion Industry & Talent Management',
      icon: '🏢',
      justification: 'Explore the world of modeling agencies and fashion industry. Every word relates to the business, management, and professional aspects of the modeling world.',
      words: [
        'AGENCY', 'AGENT', 'BOOKER', 'SCOUT', 'TALENT', 'MANAGER', 'COACH', 'TRAINER', 'DIRECTOR', 'PHOTOGRAPHER',
        'VIDEOGRAPHER', 'CINEMATOGRAPHER', 'PRODUCER', 'PRODUCTION', 'CREW', 'LIGHTING', 'SOUND', 'GRIP', 'GAFFER', 'CASTING',
        'AUDITION', 'CALLBACK', 'BOOKING', 'CONTRACT', 'RATE', 'PAYMENT', 'INVOICE', 'ROYALTY', 'RESIDUAL', 'BRAND',
        'AMBASSADOR', 'ENDORSEMENT', 'SPONSORSHIP', 'COLLABORATION', 'PARTNERSHIP', 'INFLUENCER', 'SOCIAL', 'MEDIA', 'FOLLOWERS', 'ENGAGEMENT',
        'REACH', 'IMPRESSION', 'CLICK', 'CONVERSION', 'CAMPAIGN', 'ADVERTISEMENT', 'BILLBOARD', 'TRANSIT', 'MAGAZINE', 'NEWSPAPER',
        'CATALOG', 'BROCHURE', 'FLYER', 'POSTER', 'BANNER', 'SIGNAGE', 'DISPLAY', 'FASHION', 'WEEK', 'SHOW',
        'COLLECTION', 'SEASON', 'TREND', 'AESTHETIC', 'VIBE', 'ENERGY', 'CONFIDENCE', 'PRESENCE', 'CHARISMA', 'PERSONALITY',
        'PROFESSIONALISM', 'PUNCTUALITY', 'RELIABILITY', 'FLEXIBILITY', 'ADAPTABILITY', 'RESILIENCE', 'NETWORKING', 'CONNECTION', 'RELATIONSHIP', 'MENTOR',
        'ROLE', 'MODEL', 'INSPIRATION', 'MOTIVATION', 'GOAL', 'AMBITION', 'DREAM', 'PASSION', 'DEDICATION', 'COMMITMENT',
        'DISCIPLINE', 'WORK', 'ETHIC', 'HUSTLE', 'GRIND', 'PERSISTENCE', 'REJECTION', 'CRITICISM', 'FEEDBACK', 'IMPROVEMENT',
        'GROWTH', 'DEVELOPMENT', 'EVOLUTION', 'TRANSFORMATION', 'REINVENTION', 'IDENTITY', 'UNIQUE', 'SPECIAL', 'MEMORABLE', 'DISTINCTIVE',
        'RECOGNIZABLE', 'ICONIC', 'LEGENDARY', 'SUPERMODEL', 'CELEBRITY', 'SASHAY', 'GLIDE', 'PIVOT', 'TURN', 'TWIRL',
        'SPIN', 'MARCH', 'STRIDE', 'PACE', 'TEMPO', 'RHYTHM', 'BEAT', 'MUSIC', 'SONG', 'TRACK',
        'AUDIO', 'VOLUME', 'POWER', 'STRENGTH', 'MIGHT', 'FORCE', 'VIGOR', 'GRACE', 'ELEGANCE', 'POISE',
        'CONTROL', 'PRECISION', 'TIMING', 'COORDINATION', 'MOVEMENT', 'MOTION', 'GESTURE', 'HAND', 'ARM', 'LEG',
        'FOOT', 'STEP', 'HEEL', 'TOE', 'BALL', 'SOLE', 'ARCH', 'ANKLE', 'CALF', 'KNEE',
        'THIGH', 'GLUTE', 'PERFORMANCE', 'BEARING', 'DEPORTMENT', 'CARRIAGE', 'GAIT', 'SOPHISTICATION', 'REFINEMENT', 'PORTFOLIO',
        'HEADSHOT', 'COMPOSITE', 'TEARSHEET', 'EDITORIAL', 'COMMERCIAL', 'PRINT', 'DIGITAL', 'VIDEO', 'SHOWROOM', 'FITTING',
        'ALTERATION', 'TAILORING', 'SEAMSTRESS', 'DESIGNER', 'STYLIST', 'WARDROBE', 'MAKEUP', 'HAIR', 'SKINCARE', 'BEAUTY'
      ]
    },
    'CLOTHING_DESIGNERS': {
      name: 'CLOTHING DESIGNERS',
      tagline: 'Fashion Visionaries & Style Revolutionaries',
      icon: '✂️',
      justification: 'Celebrate the legendary fashion designers who shaped the world of style. Every word is a name of an iconic designer or fashion house that defined eras and inspired millions.',
      words: [
        'COCO', 'CHANEL', 'VALENTINO', 'VERSACE', 'ARMANI', 'GUCCI', 'PRADA', 'DIOR', 'HERMES', 'LOUISVUITTON',
        'BURBERRY', 'BALENCIAGA', 'GIVENCHY', 'YVES', 'SAINTLAURENT', 'RALPHLAUREN', 'TOMMYHILFIGER', 'CALVINKLEIN', 'MARCJACOBS', 'DONNAKARANM',
        'ISSEYMIYAKE', 'JEANPAULGAULTIER', 'ALEXANDERMCQUEEN', 'STELLAMCCARTNEY', 'VIVIENNEWESTWOOD', 'KATHARINE', 'HAMNETT', 'JILSANDER', 'HELMUTLANG', 'RICARDOTISCI',
        'TOMFORD', 'CHRISTOPHERBAILEY', 'KARLLARGERFELD', 'MARCELCELINE', 'NICOLASGHESQUIERE', 'ALBER', 'ELBAZ', 'RAFSIMONS', 'PETERHALLEY', 'THIERRYMUGLER',
        'HUSSEINCHALAYANM', 'JOHNROCHA', 'LOUISVUITTON', 'FENDI', 'BOTTEGA', 'VENETA', 'MIUMIU', 'LOEWE', 'CELINE', 'LANVIN',
        'BALMAIN', 'ELIE', 'SAAB', 'OSCARDE', 'LARENTA', 'MARCHESA', 'BADGLEY', 'MISCHKA', 'MONIQUE', 'LHUILLIER',
        'REEM', 'ACRA', 'ZUHAIRMURAD', 'ELIESSAAB', 'GEORGIAARMENIAN', 'RALPHANDRUSSO', 'MARCHESANOTTE', 'BADGLEYMISCHKA', 'MONIQUELHUILLIER', 'REEMACRA',
        'ZUHAIR', 'MURAD', 'ELIE', 'SAAB', 'OSCAR', 'DELARENTA', 'MARCHESA', 'BADGLEY', 'MISCHKA', 'MONIQUE',
        'LHUILLIER', 'REEM', 'ACRA', 'ZUHAIR', 'MURAD', 'ELIE', 'SAAB', 'OSCAR', 'DELARENTA', 'MARCHESA',
        'BADGLEY', 'MISCHKA', 'MONIQUE', 'LHUILLIER', 'REEM', 'ACRA', 'ZUHAIR', 'MURAD', 'ELIE', 'SAAB',
        'FASHION', 'COUTURE', 'HAUTE', 'READY', 'WEAR', 'COLLECTION', 'RUNWAY', 'CATWALK', 'SILHOUETTE', 'DRAPE',
        'FABRIC', 'TEXTILE', 'EMBROIDERY', 'BEADING', 'SEQUIN', 'LACE', 'SILK', 'SATIN', 'VELVET', 'COTTON',
        'WOOL', 'LEATHER', 'SUEDE', 'CASHMERE', 'CHIFFON', 'TULLE', 'ORGANZA', 'TAFFETA', 'BROCADE', 'JACQUARD',
        'PATTERN', 'PRINT', 'SOLID', 'STRIPED', 'PLAID', 'FLORAL', 'GEOMETRIC', 'ABSTRACT', 'MINIMALIST', 'MAXIMALIST',
        'TAILORING', 'SEAMING', 'HEMMING', 'FITTING', 'ALTERATION', 'CONSTRUCTION', 'TECHNIQUE', 'CRAFTSMANSHIP', 'DETAIL', 'EMBELLISHMENT',
        'ACCESSORY', 'BUTTON', 'ZIPPER', 'CLASP', 'BUCKLE', 'BROOCH', 'PIN', 'STUD', 'RHINESTONE', 'PEARL',
        'CRYSTAL', 'GEMSTONE', 'BEAD', 'SEQUIN', 'FRINGE', 'TASSEL', 'RIBBON', 'TRIM', 'LACE', 'APPLIQUE',
        'EMBROIDERY', 'BEADING', 'QUILTING', 'PLEATING', 'GATHERING', 'RUCHING', 'SMOCKING', 'SHIRRING', 'TUCKING', 'FOLDING',
        'DRAPING', 'LAYERING', 'ASYMMETRY', 'SYMMETRY', 'BALANCE', 'PROPORTION', 'SILHOUETTE', 'SHAPE', 'FORM', 'STRUCTURE'
      ]
    },
    'MAKEUP_COMPANIES': {
      name: 'MAKEUP COMPANIES',
      tagline: 'Beauty Brands & Cosmetic Innovators',
      icon: '💄',
      justification: 'Discover the world\'s most iconic makeup brands and beauty companies. Every word is a name of a legendary cosmetics house that revolutionized beauty and self-expression.',
      words: [
        'MAC', 'MAYBELLINE', 'LOREAL', 'ESTEE', 'LAUDER', 'CLINIQUE', 'BOBBIBROWN', 'NARS', 'URBANDECAY', 'TOOFACED',
        'TARTECOSMETICS', 'MORPHE', 'ANASTASIA', 'BEVERLYHILLS', 'COLOURPOP', 'NYXPROFESSIONAL', 'RIMMEL', 'REVLON', 'COVERGIRL', 'MAYBELLINE',
        'LOREAL', 'GARNIER', 'LANCOMEBEAUTE', 'YSLBEAUTY', 'DIOR', 'CHANEL', 'GUERLAIN', 'CLARINS', 'SHISEIDO', 'PONDS',
        'OLAY', 'NEUTROGENA', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL',
        'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL', 'CETAPHIL'
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

  // Initialize audio context and casino slot engine
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Initialize Bally's Premium casino slot engine
    if (!casinoSlotRef.current) {
      casinoSlotRef.current = new BallysProCasinoSlot('casino-slot-canvas');
      casinoSlotRef.current.animate();
    }

    return () => {
      if (casinoSlotRef.current) {
        casinoSlotRef.current.stop();
      }
    };
  }, []);

  // Ambient casino murmur (low frequency background) + distant sounds
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

    // Play distant slot win sounds periodically
    const distantSoundInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        playDistantSlotWinSound();
      }
    }, 8000);

    return () => {
      if (ambientOscRef.current) {
        ambientOscRef.current.stop();
        ambientOscRef.current = null;
      }
      clearInterval(distantSoundInterval);
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

  // Card shuffle sound
  const playCardShuffleSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(300 - i * 30, now + i * 0.12);
      gain.gain.setValueAtTime(0.08, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.2);
      
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.2);
    }
  };

  // Distant slot machine win sound
  const playDistantSlotWinSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
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
    // setShowCoinDrop(true);
    // playCoinDropSound();
    coinDropCountRef.current = 0;
    
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          // playCoinDropSound();
        }, i * 150);
      }
    }, 200);
    
    // setTimeout(() => setShowCoinDrop(false), 2000);
    
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

  // Volumetric 3D Typography - MEGA WIN text
  const VolumetricMegaWinText = () => {
    return (
      <motion.div
        className="relative inline-block"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <motion.div
          className="text-8xl md:text-9xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600"
          style={{
            textShadow: `
              3px 3px 0px rgba(255, 215, 0, 0.8),
              6px 6px 0px rgba(200, 170, 0, 0.6),
              9px 9px 0px rgba(100, 80, 0, 0.4),
              -2px -2px 8px rgba(255, 255, 255, 0.5)
            `,
            filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))',
          }}
          animate={{
            textShadow: [
              `3px 3px 0px rgba(255, 215, 0, 0.8), 6px 6px 0px rgba(200, 170, 0, 0.6), 9px 9px 0px rgba(100, 80, 0, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.5)`,
              `3px 3px 0px rgba(255, 215, 0, 1), 6px 6px 0px rgba(200, 170, 0, 0.8), 9px 9px 0px rgba(100, 80, 0, 0.6), -2px -2px 15px rgba(255, 255, 255, 0.8)`,
              `3px 3px 0px rgba(255, 215, 0, 0.8), 6px 6px 0px rgba(200, 170, 0, 0.6), 9px 9px 0px rgba(100, 80, 0, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.5)`,
            ]
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          MEGA WIN
        </motion.div>
      </motion.div>
    );
  };

  // Odometer-style credit roll with motion blur and sparks
  const OdometerCreditRoll = ({ value }: { value: number }) => {
    const digits = value.toString().padStart(6, '0').split('');
    
    return (
      <div className="flex gap-1 justify-center items-center">
        {digits.map((digit, idx) => (
          <motion.div
            key={idx}
            className="relative w-12 h-16 md:w-16 md:h-20 bg-gradient-to-b from-yellow-900 to-yellow-950 border-2 border-yellow-600 rounded-lg flex items-center justify-center overflow-hidden"
            style={{
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 215, 0, 0.2)',
            }}
          >
            {/* Motion blur effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-300/20 to-transparent"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
            
            {/* Digit with vertical roll */}
            <motion.div
              className="text-3xl md:text-4xl font-mono font-black text-yellow-300 relative z-10"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, delay: idx * 0.05 }}
            >
              {digit}
            </motion.div>
            
            {/* Spark particles */}
            {Math.random() > 0.7 && (
              <motion.div
                className="absolute w-1 h-1 bg-yellow-200 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [1, 0],
                  y: [0, -20],
                  x: [(Math.random() - 0.5) * 20, 0],
                }}
                transition={{ duration: 0.6 }}
              />
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  // Slot reel letter reveal effect
  const SlotReelLetter = ({ letter, isRevealed }: { letter: string; isRevealed: boolean }) => {
    return (
      <motion.div
        className="relative inline-block"
        animate={isRevealed ? { rotateX: 360 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="text-5xl md:text-6xl font-mono font-black text-yellow-300 tracking-widest"
          animate={isRevealed ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {letter}
        </motion.div>
      </motion.div>
    );
  };

  // Chromatic aberration glitch effect
  const ChromaticGlitch = ({ children }: { children: React.ReactNode }) => {
    return (
      <motion.div
        className="relative"
        animate={{
          x: [0, -2, 2, -1, 1, 0],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <div className="absolute inset-0 text-red-500/30 blur-sm" style={{ transform: 'translateX(-2px)' }}>
          {children}
        </div>
        <div className="absolute inset-0 text-blue-500/30 blur-sm" style={{ transform: 'translateX(2px)' }}>
          {children}
        </div>
        <div className="relative text-white">{children}</div>
      </motion.div>
    );
  };

  // Physics coin cascade
  const PhysicsCoin = ({ delay }: { delay: number }) => {
    return null;
  };

  // Portal transition effect
  const PortalTransition = () => {
    return (
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 1 }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: Math.cos((i / 12) * Math.PI * 2) * 200,
              y: Math.sin((i / 12) * Math.PI * 2) * 200,
              opacity: [1, 0],
            }}
            transition={{
              duration: 1,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-black to-slate-900 overflow-hidden relative">
      {/* Enhanced CRT Scanline + Holographic Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 2px)',
          animation: 'scanlines 8s linear infinite'
        }} />
        <style>{`
          @keyframes scanlines {
            0% { transform: translateY(0); }
            100% { transform: translateY(10px); }
          }
          @keyframes screenShake {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(-3px, 5px) rotate(-1deg); }
            40% { transform: translate(4px, -3px) rotate(1.5deg); }
            60% { transform: translate(-5px, 2px) rotate(-0.5deg); }
            80% { transform: translate(3px, 4px) rotate(1deg); }
          }
          canvas.screen-shake {
            animation: screenShake 0.15s infinite;
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
          @keyframes holographic-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes cyber-pulse {
            0%, 100% { filter: brightness(1) saturate(1); }
            50% { filter: brightness(1.2) saturate(1.3); }
          }
          @keyframes float-bounce {
            0%, 100% { transform: translateY(0px) rotateZ(0deg); }
            25% { transform: translateY(-15px) rotateZ(2deg); }
            50% { transform: translateY(-30px) rotateZ(0deg); }
            75% { transform: translateY(-15px) rotateZ(-2deg); }
          }
          @keyframes spiral-orbit {
            0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
          }
          @keyframes electric-pulse {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(0,255,255,0.6)); }
            50% { filter: brightness(1.3) drop-shadow(0 0 20px rgba(0,255,255,1)); }
          }
          @keyframes title-shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(0,255,255,0.7); }
            70% { box-shadow: 0 0 0 20px rgba(0,255,255,0); }
            100% { box-shadow: 0 0 0 0 rgba(0,255,255,0); }
          }
        `}</style>
      </div>

      {/* Enhanced Ambient Motion Layers - NEXT-GEN 3D DEPTH */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Layer 1: Holographic grid background */}
        <motion.div
          className="absolute inset-0 opacity-15"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage: 'linear-gradient(45deg, rgba(0,255,255,0.4) 1px, transparent 1px), linear-gradient(-45deg, rgba(0,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            backgroundPosition: '0% 0%'
          }}
        />

        {/* Layer 2: Enhanced pulsing neon orbs */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute w-32 h-32 rounded-full opacity-40 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${['rgba(0,255,255,1)', 'rgba(255,0,255,0.9)', 'rgba(255,215,0,0.9)', 'rgba(0,255,255,1)', 'rgba(255,0,0,0.8)', 'rgba(0,255,255,1)', 'rgba(255,215,0,0.9)', 'rgba(0,255,255,1)'][i]}, transparent)`,
              left: `${(i / 8) * 100}%`,
              top: `${Math.sin(i) * 25 + 35}%`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.25, 0.6, 0.25],
            }}
            transition={{
              duration: 5 + i * 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Layer 3: Falling 3D cyber particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-lg"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              boxShadow: `0 0 8px ${['rgba(0,255,255,0.8)', 'rgba(255,215,0,0.8)', 'rgba(255,0,255,0.8)'][i % 3]}`
            }}
            animate={{
              y: window.innerHeight + 100,
              x: Math.sin(i) * 120,
              opacity: [1, 0.6, 0],
            }}
            transition={{
              duration: 9 + Math.random() * 5,
              repeat: Infinity,
              ease: 'easeIn',
              delay: i * 0.15,
            }}
          />
        ))}

        {/* Layer 4: Rotating 3D rings with enhanced glow */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-56 h-56 border-3 border-cyan-400 rounded-full opacity-25"
          animate={{ 
            rotate: 360,
            rotateX: [0, 25, 0],
            rotateY: [0, 25, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          style={{ perspective: '1000px', filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.6))' }}
        />

        {/* Layer 5: Counter-rotating ring */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 border-3 border-purple-400 rounded-full opacity-25"
          animate={{ 
            rotate: -360,
            rotateX: [0, -20, 0],
            rotateZ: [0, 35, 0],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          style={{ perspective: '1000px', filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.6))' }}
        />

        {/* Layer 6: Floating 3D cubes */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`cube-${i}`}
            className="absolute w-16 h-16 border-2 border-yellow-400 opacity-35"
            style={{
              left: `${15 + i * 18}%`,
              top: `${25 + Math.sin(i) * 25}%`,
              filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.5))'
            }}
            animate={{
              rotateX: 360,
              rotateY: 360,
              rotateZ: 360,
              y: [0, -60, 0],
            }}
            transition={{
              duration: 7 + i * 0.6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {/* Layer 7: Pulsing radial gradient - energy core */}
        <motion.div
          className="absolute inset-0 opacity-25"
          animate={{
            background: [
              'radial-gradient(circle at 50% 50%, rgba(0,255,255,0.4) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, rgba(255,0,255,0.4) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.4) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, rgba(0,255,255,0.4) 0%, transparent 70%)',
            ]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Layer 8: Animated marquee light chases - Top border */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-4 bg-gradient-to-r from-cyan-400 via-purple-500 via-yellow-300 to-cyan-400 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '200% 100%',
            boxShadow: '0 0 40px rgba(0,255,255,1), 0 0 80px rgba(255,215,0,0.8), inset 0 0 30px rgba(255,255,255,0.4)'
          }}
        />

        {/* Layer 9: Animated marquee light chases - Bottom border */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-purple-500 via-cyan-400 via-yellow-300 to-purple-500 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['100% 0%', '0% 0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '200% 100%',
            boxShadow: '0 0 40px rgba(0,255,255,1), 0 0 80px rgba(255,215,0,0.8), inset 0 0 30px rgba(255,255,255,0.4)'
          }}
        />

        {/* Layer 10: Side borders with enhanced glow */}
        <motion.div
          className="fixed left-0 top-0 bottom-0 w-4 bg-gradient-to-b from-cyan-400 via-purple-500 to-yellow-300 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '100% 200%',
            boxShadow: '0 0 40px rgba(0,255,255,1), 0 0 80px rgba(255,215,0,0.8), inset 0 0 30px rgba(255,255,255,0.4)'
          }}
        />
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-4 bg-gradient-to-b from-purple-500 via-cyan-400 to-yellow-300 z-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 100%', '0% 0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundSize: '100% 200%',
            boxShadow: '0 0 40px rgba(0,255,255,1), 0 0 80px rgba(255,215,0,0.8), inset 0 0 30px rgba(255,255,255,0.4)'
          }}
        />

        {/* Layer 11: Orbiting particles around center */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute w-3 h-3 bg-cyan-300 rounded-full shadow-lg"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-6px',
              marginTop: '-6px',
              boxShadow: `0 0 12px ${['rgba(0,255,255,0.8)', 'rgba(255,215,0,0.8)'][i % 2]}`
            }}
            animate={{
              x: Math.cos((i / 16) * Math.PI * 2) * 180,
              y: Math.sin((i / 16) * Math.PI * 2) * 180,
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.08,
            }}
          />
        ))}

        {/* Layer 12: Pulsing corner accents */}
        {[
          { corner: 'top-left', x: 0, y: 0 },
          { corner: 'top-right', x: 100, y: 0 },
          { corner: 'bottom-left', x: 0, y: 100 },
          { corner: 'bottom-right', x: 100, y: 100 },
        ].map((pos, i) => (
          <motion.div
            key={`corner-${i}`}
            className="absolute w-28 h-28 opacity-40"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(0,255,255,0.8), transparent)`,
              filter: 'drop-shadow(0 0 15px rgba(0,255,255,0.6))'
            }}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.15, 0.5, 0.15],
            }}
            transition={{
              duration: 3.5 + i * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Layer 13: Floating text particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`text-${i}`}
            className="absolute text-sm font-mono text-cyan-400/50 pointer-events-none font-bold"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.4))'
            }}
            animate={{
              y: [0, -120],
              opacity: [0, 1, 0],
              rotateZ: [0, 360],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 0.6,
            }}
          >
            {['◆', '★', '●', '■', '▲', '◉', '◎', '◈', '✦', '✧'][i]}
          </motion.div>
        ))}

        {/* Layer 14: Holographic shimmer overlay */}
        <motion.div
          className="absolute inset-0 opacity-15 pointer-events-none"
          animate={{
            background: [
              'linear-gradient(45deg, transparent, rgba(0,255,255,0.3), transparent)',
              'linear-gradient(45deg, transparent, rgba(255,215,0,0.3), transparent)',
              'linear-gradient(45deg, transparent, rgba(0,255,255,0.3), transparent)',
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Shattering Glass Transition - Mega Jackpot Win Sequence */}
      <AnimatePresence>
        {showMegaJackpot && (
          <motion.div
            key="mega-jackpot"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Shattering glass shards */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`shard-${i}`}
                className="absolute bg-gradient-to-br from-cyan-300 to-cyan-600 opacity-80"
                style={{
                  width: Math.random() * 40 + 20,
                  height: Math.random() * 40 + 20,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 90%)',
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{
                  opacity: [1, 0.5, 0],
                  scale: [1, 0.8, 0],
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 600,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            ))}

            {/* Volumetric MEGA WIN text */}
            <motion.div
              className="text-center z-10"
              initial={{ scale: 0, rotateZ: -45 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            >
              <VolumetricMegaWinText />
              
              {/* Odometer credit roll */}
              <motion.div
                className="mt-8 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <OdometerCreditRoll value={currentScore} />
              </motion.div>
              
              <motion.p
                className="text-4xl md:text-5xl font-heading font-black text-green-400 mt-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: 5 }}
              >
                ✦ JACKPOT TRIGGERED ✦
              </motion.p>
            </motion.div>

            {/* Physics-based 3D coin cascade */}
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={`coin-${i}`}
                className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 200, 0.9), rgba(255, 215, 0, 0.8), rgba(200, 170, 0, 0.7))',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.8), inset -2px -2px 4px rgba(100, 80, 0, 0.6)',
                  left: `${Math.random() * 100}%`,
                  top: '-50px',
                }}
                animate={{
                  y: window.innerHeight + 100,
                  x: (Math.random() - 0.5) * 400,
                  rotate: 360 * (Math.random() + 1),
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: i * 0.04,
                  ease: 'easeIn',
                }}
              />
            ))}

            {/* Additive blend HDR bloom effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
              animate={{
                background: [
                  'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.8) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
                ]
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coin drop animation */}
      <AnimatePresence>
        {false && (
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
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="text-center md:text-left flex-1">
            <motion.div
              className="relative inline-block"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 15px rgba(0,255,255,0.9), 0 0 30px rgba(255,215,0,0.7), 0 0 50px rgba(255,0,0,0.5)',
                    '0 0 25px rgba(0,255,255,1), 0 0 50px rgba(255,215,0,0.9), 0 0 80px rgba(255,0,0,0.7)',
                    '0 0 15px rgba(0,255,255,0.9), 0 0 30px rgba(255,215,0,0.7), 0 0 50px rgba(255,0,0,0.5)',
                  ]
                }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="text-5xl md:text-7xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-yellow-300 mb-2 tracking-tighter"
                style={{
                  animation: 'neon-glow 2s ease-in-out infinite, glitch-3d 0.5s ease-in-out infinite'
                }}
              >
                ⚡ RED2 HANGMAN ⚡
              </motion.h1>
            </motion.div>
            <motion.p 
              className="text-xl md:text-2xl font-mono text-cyan-300 tracking-widest font-bold"
              animate={{
                textShadow: [
                  '0 0 8px rgba(0,255,255,0.7)',
                  '0 0 20px rgba(0,255,255,1)',
                  '0 0 8px rgba(0,255,255,0.7)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ◆ NEURAL GAMING NEXUS ◆
            </motion.p>
            <motion.p 
              className="text-sm md:text-base font-paragraph text-cyan-200/80 mt-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Next-Gen Hangman Experience • Immersive Visuals • Competitive Gaming
            </motion.p>
          </div>
          
          <div className="flex flex-col gap-4 items-center md:items-end">
            {/* VIP Tier Badge */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-300 via-purple-500 to-yellow-300 border-4 border-cyan-200 flex items-center justify-center shadow-2xl"
              style={{
                boxShadow: '0 0 40px rgba(0,255,255,0.9), inset 0 0 25px rgba(255,255,255,0.4), 0 0 80px rgba(0,255,255,0.6)',
                animation: 'pulse-gold 2s ease-in-out infinite'
              }}
            >
              <div className="text-center">
                <p className="text-xs font-mono text-purple-900 uppercase tracking-widest mb-1 font-bold">Tier</p>
                <motion.p 
                  className="text-2xl font-heading font-black" 
                  style={{ color: VIP_TIERS[vipTier].color }}
                  animate={{
                    textShadow: [
                      '0 0 8px rgba(0,255,255,0.5)',
                      '0 0 20px rgba(0,255,255,0.9)',
                      '0 0 8px rgba(0,255,255,0.5)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {VIP_TIERS[vipTier].name}
                </motion.p>
              </div>
            </motion.div>

            {/* Credits Display */}
            <motion.div
              className="px-8 py-4 bg-gradient-to-br from-black via-slate-900 to-black border-4 border-cyan-400 rounded-xl"
              style={{
                boxShadow: '0 0 30px rgba(0,255,255,0.9), inset 0 0 15px rgba(0,255,255,0.3), 0 0 60px rgba(0,255,255,0.6)',
                fontFamily: '"Courier New", monospace',
              }}
              animate={{
                boxShadow: [
                  '0 0 30px rgba(0,255,255,0.9), inset 0 0 15px rgba(0,255,255,0.3)',
                  '0 0 50px rgba(0,255,255,1), inset 0 0 25px rgba(0,255,255,0.5)',
                  '0 0 30px rgba(0,255,255,0.9), inset 0 0 15px rgba(0,255,255,0.3)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-1 font-bold">Credits</p>
              <motion.p
                key={totalWinnings}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-4xl md:text-5xl font-mono font-black text-cyan-300"
                style={{
                  animation: 'neon-glow 1.5s ease-in-out infinite'
                }}
              >
                ◆ {totalWinnings.toLocaleString()} ◆
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        {/* Social Proof Elements - Enhanced with 3D effects */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div 
            className="bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 border-3 border-cyan-400 rounded-xl p-4 text-center backdrop-blur-sm"
            animate={{
              boxShadow: [
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
                '0 0 30px rgba(0,255,255,0.7), inset 0 0 20px rgba(0,255,255,0.2)',
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-2 font-bold">Active Players</p>
            <motion.p
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl md:text-3xl font-heading font-black text-white"
            >
              {livePlayersCount.toLocaleString()}
            </motion.p>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 border-3 border-cyan-400 rounded-xl p-4 text-center backdrop-blur-sm"
            animate={{
              boxShadow: [
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
                '0 0 30px rgba(0,255,255,0.7), inset 0 0 20px rgba(0,255,255,0.2)',
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >
            <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-2 font-bold">Jackpot</p>
            <motion.p
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-2xl md:text-3xl font-heading font-black text-yellow-300"
            >
              ${progressiveJackpot.toLocaleString()}
            </motion.p>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 border-3 border-cyan-400 rounded-xl p-4 text-center backdrop-blur-sm"
            animate={{
              boxShadow: [
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
                '0 0 30px rgba(0,255,255,0.7), inset 0 0 20px rgba(0,255,255,0.2)',
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          >
            <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-2 font-bold">Your Rank</p>
            <p className="text-2xl md:text-3xl font-heading font-black" style={{ color: VIP_TIERS[vipTier].color }}>
              {VIP_TIERS[vipTier].name}
            </p>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 border-3 border-cyan-400 rounded-xl p-4 text-center backdrop-blur-sm"
            animate={{
              boxShadow: [
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
                '0 0 30px rgba(0,255,255,0.7), inset 0 0 20px rgba(0,255,255,0.2)',
                '0 0 15px rgba(0,255,255,0.4), inset 0 0 10px rgba(0,255,255,0.1)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          >
            <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-2 font-bold">Multiplier</p>
            <p className="text-2xl md:text-3xl font-heading font-black text-cyan-300">
              {VIP_TIERS[vipTier].multiplier}x
            </p>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="w-full max-w-7xl">{!selectedCategory ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.p 
                  className="text-2xl md:text-3xl font-mono text-cyan-300 tracking-widest font-bold"
                  animate={{
                    textShadow: [
                      '0 0 8px rgba(0,255,255,0.7)',
                      '0 0 20px rgba(0,255,255,1)',
                      '0 0 8px rgba(0,255,255,0.7)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ◆ SELECT YOUR NEXUS ◆
                </motion.p>
                <p className="text-lg md:text-xl font-paragraph text-white/80 max-w-3xl mx-auto leading-relaxed">
                  Choose your gaming nexus and compete for supremacy. Every correct guess earns you credits. Elite members earn multipliers!
                </p>
              </div>

              <motion.div
                className="bg-gradient-to-br from-slate-900/80 via-black to-slate-950/80 border-4 border-cyan-400 rounded-3xl p-10 md:p-12 shadow-2xl backdrop-blur-sm"
                style={{
                  boxShadow: '0 0 50px rgba(0,255,255,0.7), inset 0 0 40px rgba(0,255,255,0.15), 0 0 100px rgba(0,255,255,0.4)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 50px rgba(0,255,255,0.7), inset 0 0 40px rgba(0,255,255,0.15)',
                    '0 0 80px rgba(0,255,255,0.9), inset 0 0 60px rgba(0,255,255,0.25)',
                    '0 0 50px rgba(0,255,255,0.7), inset 0 0 40px rgba(0,255,255,0.15)',
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {Object.entries(categoriesData).map(([key, meta], idx) => (
                    <motion.button
                      key={key}
                      onClick={() => startGame(key)}
                      whileHover={{ scale: 1.08, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.12 }}
                      className="group relative p-8 md:p-10 bg-gradient-to-br from-primary/40 to-primary/10 border-3 border-cyan-400 rounded-2xl hover:border-cyan-300 hover:from-primary/60 hover:to-primary/30 transition-all duration-300 overflow-hidden min-h-56 flex flex-col justify-center"
                      style={{
                        boxShadow: '0 0 20px rgba(0,255,255,0.3), inset 0 0 15px rgba(0,255,255,0.1)'
                      }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-yellow-400/0 group-hover:from-yellow-400/15 group-hover:to-yellow-400/8 transition-all duration-300"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <div className="relative z-10 space-y-4 flex flex-col items-center text-center">
                        <motion.div 
                          className="text-6xl md:text-7xl font-heading font-black text-cyan-300 group-hover:text-cyan-200 transition-colors"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                        >
                          {meta.icon}
                        </motion.div>
                        <p className="text-xl md:text-2xl font-heading font-black text-cyan-400 group-hover:text-cyan-300 transition-colors uppercase tracking-wider">
                          {meta.name}
                        </p>
                        <p className="text-sm md:text-base font-paragraph text-white/75 group-hover:text-white/95 transition-colors italic">
                          {meta.tagline}
                        </p>
                        <motion.p 
                          className="text-xs font-mono text-white/60 group-hover:text-white/80 transition-colors font-bold"
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {meta.words.length} words • Tap to Play
                        </motion.p>
                      </div>
                    </motion.button>
                  ))}
                </div>
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

                  {/* Modern Casino Slot Canvas - High-Performance Rendering */}
                  <div className="flex justify-center py-6 bg-gradient-to-br from-slate-900 to-black rounded-lg border-2 border-yellow-400 overflow-hidden shadow-2xl"
                    style={{
                      boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1)'
                    }}>
                    <canvas
                      id="casino-slot-canvas"
                      width={600}
                      height={300}
                      className="w-full max-w-2xl"
                      style={{
                        display: 'block',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))'
                      }}
                    />
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
                      <p className="text-5xl md:text-6xl font-mono font-black text-yellow-300 tracking-widest break-words"
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
          )}
        </div>
      </main>

      {/* Reveal Card Modal - Shows category justification */}
      <AnimatePresence>
        {showRevealCard && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowRevealCard(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20, rotateX: 90 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.8, y: 20, rotateX: 90 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="bg-gradient-to-br from-purple-900/50 via-black to-black rounded-xl border-4 border-purple-400 p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ perspective: '1000px' }}
            >
              {/* Holographic prism reflection */}
              <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                animate={{
                  background: [
                    'linear-gradient(45deg, transparent, rgba(168,85,247,0.3), transparent)',
                    'linear-gradient(45deg, transparent, rgba(59,130,246,0.3), transparent)',
                    'linear-gradient(45deg, transparent, rgba(168,85,247,0.3), transparent)',
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative z-10 space-y-6">
                <motion.div
                  className="text-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <p className="text-6xl mb-4">{categoriesData[selectedCategory]?.icon}</p>
                  <h2 className="text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 mb-2">
                    {categoriesData[selectedCategory]?.name}
                  </h2>
                  <p className="text-xl font-paragraph text-purple-200 italic">
                    {categoriesData[selectedCategory]?.tagline}
                  </p>
                </motion.div>

                <motion.div
                  className="p-6 bg-gradient-to-br from-purple-900/30 to-black border-2 border-purple-400/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm font-mono text-purple-300 uppercase tracking-widest mb-3">★ Why These Words ★</p>
                  <p className="text-lg font-paragraph text-white leading-relaxed">
                    {categoriesData[selectedCategory]?.justification}
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-3 gap-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="p-4 bg-purple-900/20 border border-purple-400/30 rounded-lg">
                    <p className="text-3xl font-heading font-black text-purple-300">
                      {categoriesData[selectedCategory]?.words.length}
                    </p>
                    <p className="text-xs font-mono text-purple-200 uppercase mt-2">Words</p>
                  </div>
                  <div className="p-4 bg-purple-900/20 border border-purple-400/30 rounded-lg">
                    <p className="text-3xl font-heading font-black text-pink-300">
                      ✓
                    </p>
                    <p className="text-xs font-mono text-purple-200 uppercase mt-2">Curated</p>
                  </div>
                  <div className="p-4 bg-purple-900/20 border border-purple-400/30 rounded-lg">
                    <p className="text-3xl font-heading font-black text-purple-300">
                      ★
                    </p>
                    <p className="text-xs font-mono text-purple-200 uppercase mt-2">Premium</p>
                  </div>
                </motion.div>

                <motion.button
                  onClick={() => setShowRevealCard(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-heading font-black text-lg rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all border-2 border-purple-400"
                >
                  UNDERSTOOD
                </motion.button>
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
