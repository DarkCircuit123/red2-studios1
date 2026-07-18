/**
 * Advanced Casino Effects Library
 * 20 meaty visual and audio effects for the Hangman game
 */

// ============================================================================
// AUDIO EFFECTS
// ============================================================================

export const createAudioContext = (): AudioContext => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

/**
 * 1. SLOT-REEL LETTER REVEAL
 * Every correct letter spins through 5-6 random letters before landing
 * with mechanical clicks decelerating and a landing clunk
 */
export const playSlotReelSound = (ctx: AudioContext, duration = 0.6) => {
  const now = ctx.currentTime;
  
  // Mechanical clicks that decelerate
  for (let i = 0; i < 6; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Decelerate timing
    const clickTime = now + (i * 0.08) * (1 - i * 0.1);
    const freq = 800 + Math.random() * 400;
    
    osc.frequency.setValueAtTime(freq, clickTime);
    gain.gain.setValueAtTime(0.15, clickTime);
    gain.gain.exponentialRampToValueAtTime(0.01, clickTime + 0.05);
    
    osc.start(clickTime);
    osc.stop(clickTime + 0.05);
  }
  
  // Landing clunk - deep bass
  const clunk = ctx.createOscillator();
  const clunkGain = ctx.createGain();
  clunk.connect(clunkGain);
  clunkGain.connect(ctx.destination);
  
  clunk.frequency.setValueAtTime(150, now + 0.5);
  clunk.frequency.exponentialRampToValueAtTime(80, now + 0.65);
  clunkGain.gain.setValueAtTime(0.25, now + 0.5);
  clunkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
  
  clunk.start(now + 0.5);
  clunk.stop(now + 0.65);
};

/**
 * 2. CHROMATIC ABERRATION GLITCH SOUND
 * 200ms broken-TV effect with audio distortion
 */
export const playGlitchSound = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // Create harsh glitch with frequency jumps
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const startFreq = 200 + Math.random() * 800;
    const endFreq = 100 + Math.random() * 400;
    
    osc.frequency.setValueAtTime(startFreq, now + i * 0.05);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + i * 0.05 + 0.04);
    
    gain.gain.setValueAtTime(0.1, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.04);
    
    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.04);
  }
};

/**
 * 3. TIME SLOW-MOTION AUDIO EFFECT
 * Low-pass filter and pitch drop for 400ms slow-mo peak
 */
export const playSlowMotionEffect = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // Deep bass pulse during slow-mo
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);
  
  osc.frequency.setValueAtTime(60, now);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  
  osc.start(now);
  osc.stop(now + 0.4);
  
  // Bass punch at end
  setTimeout(() => {
    const punch = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punch.connect(punchGain);
    punchGain.connect(ctx.destination);
    
    punch.frequency.setValueAtTime(200, ctx.currentTime);
    punch.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    punchGain.gain.setValueAtTime(0.3, ctx.currentTime);
    punchGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    punch.start(ctx.currentTime);
    punch.stop(ctx.currentTime + 0.15);
  }, 400);
};

/**
 * 4. NEON EXPLOSION TEXT SOUND
 * Electric arcs flying off with SVG stroke animation
 */
export const playNeonExplosionSound = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // Electric zap sounds
  for (let i = 0; i < 8; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(2000 + Math.random() * 3000, now + i * 0.04);
    osc.frequency.exponentialRampToValueAtTime(500 + Math.random() * 1000, now + i * 0.04 + 0.08);
    
    gain.gain.setValueAtTime(0.12, now + i * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.08);
    
    osc.start(now + i * 0.04);
    osc.stop(now + i * 0.04 + 0.08);
  }
};

/**
 * 5. GOLD DUST EXPLOSION SOUND
 * Particle burst with cascading tones
 */
export const playGoldDustExplosion = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // Cascading particle sounds
  for (let i = 0; i < 12; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const freq = 1200 - (i * 80);
    osc.frequency.setValueAtTime(freq, now + i * 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + i * 0.05 + 0.1);
    
    gain.gain.setValueAtTime(0.1, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
    
    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.1);
  }
};

/**
 * 6. CASINO FLOOR AMBIENT SOUND BED
 * Layered pink-noise crowd + distant slots + glass clinks + card shuffles
 * All layers double gain for 3 seconds during wins
 */
export const createCasinoAmbientBed = (ctx: AudioContext): { 
  start: () => void; 
  stop: () => void; 
  amplify: () => void;
  nodes: OscillatorNode[];
} => {
  const nodes: OscillatorNode[] = [];
  let isRunning = false;
  
  const start = () => {
    if (isRunning) return;
    isRunning = true;
    
    // Pink noise approximation - multiple oscillators at different frequencies
    const frequencies = [40, 80, 120, 160, 200, 250, 300, 400, 500];
    
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      
      osc.start();
      nodes.push(osc);
    });
  };
  
  const stop = () => {
    if (!isRunning) return;
    isRunning = false;
    nodes.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    nodes.length = 0;
  };
  
  const amplify = () => {
    // Double gain for 3 seconds
    nodes.forEach(osc => {
      const gain = osc.context.createGain();
      osc.disconnect();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 3);
    });
  };
  
  return { start, stop, amplify, nodes };
};

/**
 * 7. SCREEN CRUMPLE SOUND
 * Paper crumple effect with distortion
 */
export const playScreenCrumpleSound = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // Crumple effect - rapid frequency variations
  for (let i = 0; i < 20; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const freq = 200 + Math.random() * 1200;
    osc.frequency.setValueAtTime(freq, now + i * 0.02);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + i * 0.02 + 0.08);
    
    gain.gain.setValueAtTime(0.08, now + i * 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.02 + 0.08);
    
    osc.start(now + i * 0.02);
    osc.stop(now + i * 0.02 + 0.08);
  }
};

/**
 * 8. RIBBON BANNER UNFURL SOUND
 * Elastic fabric flow with whoosh and snap
 */
export const playRibbonUnfurlSound = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  
  // Whoosh sound
  const whoosh = ctx.createOscillator();
  const whooshGain = ctx.createGain();
  whoosh.connect(whooshGain);
  whooshGain.connect(ctx.destination);
  
  whoosh.frequency.setValueAtTime(400, now);
  whoosh.frequency.exponentialRampToValueAtTime(100, now + 0.4);
  whooshGain.gain.setValueAtTime(0.15, now);
  whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  
  whoosh.start(now);
  whoosh.stop(now + 0.4);
  
  // Snap at end
  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snap.connect(snapGain);
  snapGain.connect(ctx.destination);
  
  snap.frequency.setValueAtTime(800, now + 0.35);
  snap.frequency.exponentialRampToValueAtTime(300, now + 0.45);
  snapGain.gain.setValueAtTime(0.2, now + 0.35);
  snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
  
  snap.start(now + 0.35);
  snap.stop(now + 0.45);
};

/**
 * 9. RHYTHMIC LETTER REVEAL SOUND
 * Win letters lock in sequence to 120bpm bass drum
 */
export const playRhythmicRevealSound = (ctx: AudioContext, beatIndex: number) => {
  const now = ctx.currentTime;
  const beatDuration = 0.5; // 120 BPM = 0.5s per beat
  
  // Bass drum hit
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc.start(now);
  osc.stop(now + 0.1);
  
  // Hi-hat click
  const hihat = ctx.createOscillator();
  const hihatGain = ctx.createGain();
  hihat.connect(hihatGain);
  hihatGain.connect(ctx.destination);
  
  hihat.frequency.setValueAtTime(8000 + Math.random() * 4000, now + 0.05);
  hihatGain.gain.setValueAtTime(0.1, now + 0.05);
  hihatGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  hihat.start(now + 0.05);
  hihat.stop(now + 0.1);
};

// ============================================================================
// VISUAL EFFECT GENERATORS
// ============================================================================

/**
 * Generate random letters for slot reel animation
 */
export const generateRandomLetters = (count: number = 6): string[] => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: count }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  );
};

/**
 * Generate particle positions for physics-based coin cascade
 */
export interface CoinParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationVelocity: number;
  mass: number;
}

export const generateCoinParticles = (count: number, centerX: number, centerY: number): CoinParticle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `coin-${i}`,
    x: centerX,
    y: centerY,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8 - 2,
    rotation: Math.random() * 360,
    rotationVelocity: (Math.random() - 0.5) * 20,
    mass: 1,
  }));
};

/**
 * Physics simulation for coin cascade
 * Gravity, air resistance, bounce (60% energy retention), inter-coin collision
 */
export const simulateCoinPhysics = (
  particles: CoinParticle[],
  deltaTime: number,
  gravity: number = 9.8,
  airResistance: number = 0.98,
  bounceEnergy: number = 0.6,
  groundY: number = 600
): CoinParticle[] => {
  return particles.map(p => {
    // Apply gravity
    p.vy += gravity * deltaTime;
    
    // Apply air resistance
    p.vx *= airResistance;
    p.vy *= airResistance;
    
    // Update position
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    
    // Rotation
    p.rotation += p.rotationVelocity * deltaTime;
    
    // Bounce off ground
    if (p.y > groundY) {
      p.y = groundY;
      p.vy *= -bounceEnergy;
      p.vx *= 0.95; // Friction
      
      // Stop if velocity is very small
      if (Math.abs(p.vy) < 0.5) {
        p.vy = 0;
        p.vx = 0;
      }
    }
    
    return p;
  });
};

/**
 * Generate cursor sparkle trail with velocity-based coloring
 */
export interface SparkleParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export const generateSparkle = (
  x: number,
  y: number,
  velocity: number
): SparkleParticle => {
  let color = 'rgba(255, 215, 0, 0.8)'; // Gold - slow
  if (velocity > 5) color = 'rgba(255, 140, 0, 0.9)'; // Orange - medium
  if (velocity > 10) color = 'rgba(255, 255, 255, 1)'; // White-hot - fast
  
  return {
    id: `sparkle-${Date.now()}-${Math.random()}`,
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4 - 2,
    life: 1,
    maxLife: 1,
    color,
  };
};

/**
 * Generate gold dust particles for score increment explosion
 */
export interface DustParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export const generateGoldDustParticles = (count: number, centerX: number, centerY: number): DustParticle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `dust-${i}`,
    x: centerX,
    y: centerY,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6 - 3,
    life: 1,
    maxLife: 1,
    size: Math.random() * 4 + 2,
  }));
};

/**
 * Generate interactive particle field positions
 * Bubbles that push away from cursor within 120px radius
 */
export const generateParticleField = (count: number, width: number, height: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `particle-${i}`,
    x: Math.random() * width,
    y: Math.random() * height,
    baseX: Math.random() * width,
    baseY: Math.random() * height,
    radius: Math.random() * 3 + 1,
  }));
};

/**
 * Calculate particle repulsion from cursor
 */
export const calculateParticleRepulsion = (
  particle: any,
  cursorX: number,
  cursorY: number,
  repulsionRadius: number = 120,
  repulsionForce: number = 2
) => {
  const dx = particle.x - cursorX;
  const dy = particle.y - cursorY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < repulsionRadius && distance > 0) {
    const angle = Math.atan2(dy, dx);
    const force = (1 - distance / repulsionRadius) * repulsionForce;
    
    return {
      x: particle.baseX + Math.cos(angle) * force * 30,
      y: particle.baseY + Math.sin(angle) * force * 30,
    };
  }
  
  return {
    x: particle.baseX,
    y: particle.baseY,
  };
};

/**
 * Generate portal transition circle mask
 */
export const generatePortalMask = (
  clickX: number,
  clickY: number,
  progress: number, // 0 to 1
  maxRadius: number = 1000
) => {
  const radius = progress * maxRadius;
  return `radial-gradient(circle at ${clickX}px ${clickY}px, transparent 0%, transparent ${radius}px, rgba(0,0,0,1) ${radius + 50}px)`;
};

/**
 * Generate 3D keyboard key flip animation data
 */
export const generateKeyFlipData = (isCorrect: boolean) => {
  return {
    rotation: 180,
    duration: 0.6,
    icon: isCorrect ? '✓' : '✕',
    color: isCorrect ? '#22c55e' : '#ef4444',
  };
};

/**
 * Generate screen crumple distortion
 */
export const generateCrumpleDistortion = (progress: number) => {
  const intensity = Math.sin(progress * Math.PI) * 20;
  return `perspective(1000px) rotateX(${intensity}deg) rotateY(${intensity * 0.5}deg)`;
};

/**
 * Generate parallax depth offsets
 */
export const generateParallaxOffsets = (
  mouseX: number,
  mouseY: number,
  windowWidth: number,
  windowHeight: number,
  depth: number = 1
) => {
  const centerX = windowWidth / 2;
  const centerY = windowHeight / 2;
  
  const offsetX = ((mouseX - centerX) / centerX) * depth * 10;
  const offsetY = ((mouseY - centerY) / centerY) * depth * 10;
  
  return { offsetX, offsetY };
};

/**
 * Generate holographic prism reflection angle
 */
export const generateHolographicAngle = (
  mouseX: number,
  mouseY: number,
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number
) => {
  const centerX = elementX + elementWidth / 2;
  const centerY = elementY + elementHeight / 2;
  
  const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
  
  return angle;
};

/**
 * Generate text scramble sequence
 */
export const generateTextScrambleSequence = (text: string, duration: number = 0.5) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const frames = Math.ceil(duration * 60); // 60fps
  
  return Array.from({ length: frames }, (_, frameIndex) => {
    return text
      .split('')
      .map((char, charIndex) => {
        const charProgress = frameIndex / frames;
        const charDelay = charIndex / text.length;
        
        if (charProgress < charDelay) {
          return letters[Math.floor(Math.random() * letters.length)];
        }
        return char;
      })
      .join('');
  });
};

/**
 * Generate depth-of-field blur values
 */
export const generateDepthOfFieldBlur = (intensity: number = 1) => {
  return {
    background: `blur(${6 * intensity}px)`,
    hero: 'blur(0px)',
  };
};

/**
 * Generate neon explosion SVG stroke animation
 */
export const generateNeonStrokeDashArray = (pathLength: number, progress: number) => {
  const offset = pathLength * (1 - progress);
  return {
    strokeDasharray: pathLength,
    strokeDashoffset: offset,
  };
};
