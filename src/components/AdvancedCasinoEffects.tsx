import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  generateRandomLetters,
  generateCoinParticles,
  simulateCoinPhysics,
  generateSparkle,
  generateGoldDustParticles,
  generateParticleField,
  calculateParticleRepulsion,
  generatePortalMask,
  generateKeyFlipData,
  generateCrumpleDistortion,
  generateParallaxOffsets,
  generateHolographicAngle,
  generateTextScrambleSequence,
  generateDepthOfFieldBlur,
  generateNeonStrokeDashArray,
  type CoinParticle,
  type SparkleParticle,
  type DustParticle,
} from '@/lib/advanced-casino-effects';

interface AdvancedCasinoEffectsProps {
  triggerSlotReel?: boolean;
  triggerChromatic?: boolean;
  triggerSlowMo?: boolean;
  triggerPortal?: boolean;
  triggerCoinCascade?: boolean;
  triggerNeonExplosion?: boolean;
  triggerGoldDust?: boolean;
  triggerScreenCrumple?: boolean;
  triggerRibbon?: boolean;
  onEffectComplete?: () => void;
}

export default function AdvancedCasinoEffects({
  triggerSlotReel,
  triggerChromatic,
  triggerSlowMo,
  triggerPortal,
  triggerCoinCascade,
  triggerNeonExplosion,
  triggerGoldDust,
  triggerScreenCrumple,
  triggerRibbon,
  onEffectComplete,
}: AdvancedCasinoEffectsProps) {
  // ============================================================================
  // 1. SLOT-REEL LETTER REVEAL
  // ============================================================================
  const [slotReelLetters, setSlotReelLetters] = useState<string[]>([]);
  const [slotReelActive, setSlotReelActive] = useState(false);

  useEffect(() => {
    if (triggerSlotReel) {
      setSlotReelActive(true);
      setSlotReelLetters(generateRandomLetters(6));
      setTimeout(() => {
        setSlotReelActive(false);
      }, 600);
    }
  }, [triggerSlotReel]);

  // ============================================================================
  // 2. CHROMATIC ABERRATION GLITCH
  // ============================================================================
  const [chromaticActive, setChromaticActive] = useState(false);

  useEffect(() => {
    if (triggerChromatic) {
      setChromaticActive(true);
      setTimeout(() => setChromaticActive(false), 200);
    }
  }, [triggerChromatic]);

  // ============================================================================
  // 3. TIME SLOW-MOTION
  // ============================================================================
  const [slowMoActive, setSlowMoActive] = useState(false);

  useEffect(() => {
    if (triggerSlowMo) {
      setSlowMoActive(true);
      setTimeout(() => setSlowMoActive(false), 400);
    }
  }, [triggerSlowMo]);

  // ============================================================================
  // 4. PORTAL TRANSITION
  // ============================================================================
  const [portalActive, setPortalActive] = useState(false);
  const [portalProgress, setPortalProgress] = useState(0);
  const [portalClick, setPortalClick] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (triggerPortal) {
      setPortalActive(true);
      setPortalClick({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
        setPortalProgress(progress);
        
        if (progress >= 1) {
          clearInterval(interval);
          setPortalActive(false);
        }
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [triggerPortal]);

  // ============================================================================
  // 5. PHYSICS-DRIVEN COIN CASCADE
  // ============================================================================
  const [coinParticles, setCoinParticles] = useState<CoinParticle[]>([]);
  const [coinCascadeActive, setCoinCascadeActive] = useState(false);
  const coinAnimationRef = useRef<number>();

  useEffect(() => {
    if (triggerCoinCascade) {
      setCoinCascadeActive(true);
      const particles = generateCoinParticles(20, window.innerWidth / 2, 100);
      setCoinParticles(particles);
      
      let lastTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;
        
        setCoinParticles(prev => {
          const updated = simulateCoinPhysics(prev, deltaTime);
          
          // Check if all coins have settled
          const allSettled = updated.every(p => p.vy === 0 && p.vx === 0);
          if (allSettled) {
            setCoinCascadeActive(false);
            return updated;
          }
          
          return updated;
        });
        
        coinAnimationRef.current = requestAnimationFrame(animate);
      };
      
      coinAnimationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (coinAnimationRef.current) {
          cancelAnimationFrame(coinAnimationRef.current);
        }
      };
    }
  }, [triggerCoinCascade]);

  // ============================================================================
  // 6. NEON EXPLOSION TEXT
  // ============================================================================
  const [neonActive, setNeonActive] = useState(false);

  useEffect(() => {
    if (triggerNeonExplosion) {
      setNeonActive(true);
      setTimeout(() => setNeonActive(false), 1000);
    }
  }, [triggerNeonExplosion]);

  // ============================================================================
  // 7. GOLD DUST EXPLOSION
  // ============================================================================
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const [goldDustActive, setGoldDustActive] = useState(false);

  useEffect(() => {
    if (triggerGoldDust) {
      setGoldDustActive(true);
      const particles = generateGoldDustParticles(50, window.innerWidth / 2, window.innerHeight / 2);
      setDustParticles(particles);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
        setDustParticles(prev =>
          prev.map(p => ({
            ...p,
            life: Math.max(0, p.life - 0.05),
            y: p.y + p.vy * 0.1,
            x: p.x + p.vx * 0.1,
          }))
        );
        
        if (progress >= 1) {
          clearInterval(interval);
          setGoldDustActive(false);
        }
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [triggerGoldDust]);

  // ============================================================================
  // 8. SCREEN CRUMPLE
  // ============================================================================
  const [crumpleActive, setCrumpleActive] = useState(false);
  const [crumpleProgress, setCrumpleProgress] = useState(0);

  useEffect(() => {
    if (triggerScreenCrumple) {
      setCrumpleActive(true);
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += 0.1;
        setCrumpleProgress(progress);
        
        if (progress >= 1) {
          clearInterval(interval);
          setCrumpleActive(false);
        }
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [triggerScreenCrumple]);

  // ============================================================================
  // 9. RIBBON BANNER
  // ============================================================================
  const [ribbonActive, setRibbonActive] = useState(false);

  useEffect(() => {
    if (triggerRibbon) {
      setRibbonActive(true);
      setTimeout(() => setRibbonActive(false), 1200);
    }
  }, [triggerRibbon]);

  // ============================================================================
  // 10. INTERACTIVE PARTICLE FIELD
  // ============================================================================
  const [particleField, setParticleField] = useState(
    generateParticleField(40, window.innerWidth, window.innerHeight)
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      setParticleField(prev =>
        prev.map(p => {
          const newPos = calculateParticleRepulsion(p, e.clientX, e.clientY);
          return { ...p, x: newPos.x, y: newPos.y };
        })
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ============================================================================
  // 11. CURSOR SPARKLE TRAIL
  // ============================================================================
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const lastSparkleRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const lastPos = lastSparkleRef.current;
      
      if (now - lastPos.time > 30) {
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        
        const sparkle = generateSparkle(e.clientX, e.clientY, velocity);
        setSparkles(prev => [...prev, sparkle].slice(-50));
        
        lastSparkleRef.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Remove old sparkles
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(prev =>
        prev
          .map(s => ({ ...s, life: s.life - 0.05 }))
          .filter(s => s.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // 12. PARALLAX MOUSE DEPTH
  // ============================================================================
  const [parallaxOffset, setParallaxOffset] = useState({ offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const offset = generateParallaxOffsets(
        e.clientX,
        e.clientY,
        window.innerWidth,
        window.innerHeight,
        2
      );
      setParallaxOffset(offset);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ============================================================================
  // 13. HOLOGRAPHIC PRISM REFLECTION
  // ============================================================================
  const [holographicAngle, setHolographicAngle] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const angle = generateHolographicAngle(
        e.clientX,
        e.clientY,
        window.innerWidth / 2 - 200,
        window.innerHeight / 2 - 200,
        400,
        400
      );
      setHolographicAngle(angle);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* 1. SLOT-REEL LETTER REVEAL */}
      {slotReelActive && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <motion.div
            className="text-8xl font-mono font-black text-yellow-300"
            animate={{ rotateX: 360 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ perspective: '1000px' }}
          >
            {slotReelLetters[Math.floor(Math.random() * slotReelLetters.length)]}
          </motion.div>
        </div>
      )}

      {/* 2. CHROMATIC ABERRATION GLITCH */}
      {chromaticActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          animate={{
            x: [0, -2, 2, -1, 1, 0],
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <div className="absolute inset-0 bg-red-500/20 blur-sm" style={{ transform: 'translateX(-2px)' }} />
          <div className="absolute inset-0 bg-blue-500/20 blur-sm" style={{ transform: 'translateX(2px)' }} />
        </motion.div>
      )}

      {/* 3. TIME SLOW-MOTION */}
      {slowMoActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40 bg-black/10"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* 4. PORTAL TRANSITION */}
      {portalActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            background: generatePortalMask(portalClick.x, portalClick.y, portalProgress),
          }}
        />
      )}

      {/* 5. PHYSICS-DRIVEN COIN CASCADE */}
      {coinCascadeActive && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {coinParticles.map(coin => (
            <motion.div
              key={coin.id}
              className="absolute w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-lg"
              style={{
                left: coin.x,
                top: coin.y,
                transform: `rotate(${coin.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 6. NEON EXPLOSION TEXT */}
      {neonActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="text-9xl font-black text-yellow-300"
            animate={{
              scale: [1, 1.5, 1],
              filter: [
                'drop-shadow(0 0 10px rgba(255,215,0,0.8))',
                'drop-shadow(0 0 30px rgba(255,215,0,1))',
                'drop-shadow(0 0 10px rgba(255,215,0,0.8))',
              ],
            }}
            transition={{ duration: 1 }}
          >
            ⚡
          </motion.div>
        </motion.div>
      )}

      {/* 7. GOLD DUST EXPLOSION */}
      {goldDustActive && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {dustParticles.map(dust => (
            <motion.div
              key={dust.id}
              className="absolute bg-yellow-300 rounded-full"
              style={{
                left: dust.x,
                top: dust.y,
                width: dust.size,
                height: dust.size,
                opacity: dust.life,
              }}
            />
          ))}
        </div>
      )}

      {/* 8. SCREEN CRUMPLE */}
      {crumpleActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40 bg-white/5"
          style={{
            transform: generateCrumpleDistortion(crumpleProgress),
          }}
          animate={{
            opacity: [0, 0.5, 0],
          }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* 9. RIBBON BANNER */}
      {ribbonActive && (
        <motion.div
          className="fixed top-1/2 left-1/2 pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 8, stiffness: 100 }}
        >
          <div className="px-16 py-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-heading font-black text-4xl rounded-lg shadow-2xl border-4 border-yellow-300"
            style={{
              boxShadow: '0 0 30px rgba(255,215,0,0.8), inset 0 0 20px rgba(255,255,255,0.2)',
            }}
          >
            🎉 WINNER 🎉
          </div>
        </motion.div>
      )}

      {/* 10. INTERACTIVE PARTICLE FIELD */}
      <div className="fixed inset-0 pointer-events-none z-5">
        {particleField.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-cyan-300 rounded-full shadow-lg"
            style={{
              left: particle.x,
              top: particle.y,
              boxShadow: `0 0 8px rgba(0,255,255,0.6)`,
            }}
          />
        ))}
      </div>

      {/* 11. CURSOR SPARKLE TRAIL */}
      <div className="fixed inset-0 pointer-events-none z-5">
        {sparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              backgroundColor: sparkle.color,
              opacity: sparkle.life,
            }}
          />
        ))}
      </div>

      {/* 12. PARALLAX MOUSE DEPTH - Applied to content via transform */}
      {/* This is applied via CSS transform on main content */}

      {/* 13. HOLOGRAPHIC PRISM REFLECTION */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-5 opacity-20"
        animate={{
          background: [
            'linear-gradient(45deg, transparent, rgba(0,255,255,0.2), transparent)',
            'linear-gradient(45deg, transparent, rgba(255,215,0,0.2), transparent)',
            'linear-gradient(45deg, transparent, rgba(0,255,255,0.2), transparent)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          transform: `rotate(${holographicAngle}deg)`,
        }}
      />

      {/* Depth-of-field blur effect container */}
      <style>{`
        .dof-blur-bg {
          filter: blur(6px);
          transition: filter 0.3s ease;
        }
        .dof-blur-bg.active {
          filter: blur(12px);
        }
      `}</style>
    </>
  );
}
