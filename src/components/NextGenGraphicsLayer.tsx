import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface NextGenGraphicsLayerProps {
  triggerEffects?: boolean;
}

export default function NextGenGraphicsLayer({ triggerEffects = false }: NextGenGraphicsLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // WebGL Ripple Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let ripples: Array<{ x: number; y: number; radius: number; maxRadius: number }> = [];

    const addRipple = (x: number, y: number) => {
      ripples.push({ x, y, radius: 0, maxRadius: 150 });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripples = ripples.filter(ripple => ripple.radius < ripple.maxRadius);

      ripples.forEach(ripple => {
        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - ripple.radius / ripple.maxRadius})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        ripple.radius += 3;
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.95) {
        addRipple(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* WebGL Ripple Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-20 opacity-40"
      />

      {/* SVG Plasma Background */}
      <svg className="fixed inset-0 pointer-events-none z-5 opacity-30" viewBox="0 0 1200 800">
        <defs>
          <filter id="plasma">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" />
          </filter>
          <linearGradient id="plasmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ff00ff', stopOpacity: 0.6 }} />
            <stop offset="50%" style={{ stopColor: '#00ffff', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#ffff00', stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#plasmaGrad)" filter="url(#plasma)" />
      </svg>

      {/* Aurora Ribbons */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`aurora-${i}`}
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(${45 + i * 15}deg, 
              rgba(0,255,255,0) 0%, 
              rgba(0,255,255,0.3) 25%, 
              rgba(255,0,255,0.3) 50%, 
              rgba(0,255,255,0.3) 75%, 
              rgba(0,255,255,0) 100%)`,
            height: '200px',
            top: `${20 + i * 15}%`,
          }}
          animate={{
            x: [-1200, 1200],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Iridescent Chip Rims */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`iridescent-${i}`}
          className="fixed pointer-events-none z-15"
          style={{
            width: '120px',
            height: '120px',
            left: `${15 + i * 10}%`,
            top: `${10 + Math.sin(i) * 20}%`,
            border: '3px solid',
            borderImage: `linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff) 1`,
            borderRadius: '50%',
            boxShadow: `0 0 30px rgba(0,255,255,0.6), inset 0 0 20px rgba(255,0,255,0.3)`,
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 12 + i * 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Volumetric God Rays */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`godray-${i}`}
          className="fixed pointer-events-none z-12"
          style={{
            width: '2px',
            height: '600px',
            left: `${10 + i * 15}%`,
            top: '0',
            background: `linear-gradient(180deg, 
              rgba(255,255,0,0.8) 0%, 
              rgba(255,215,0,0.4) 50%, 
              rgba(255,255,0,0) 100%)`,
            filter: 'blur(8px)',
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleY: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Cyberpunk Grid Floor */}
      <svg className="fixed bottom-0 left-0 right-0 pointer-events-none z-8 h-1/3" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00ffff', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#00ffff', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {[...Array(20)].map((_, i) => (
          <line
            key={`grid-h-${i}`}
            x1="0"
            y1={`${(i / 20) * 100}%`}
            x2="1200"
            y2={`${(i / 20) * 100}%`}
            stroke="url(#gridGrad)"
            strokeWidth="1"
          />
        ))}
        {[...Array(30)].map((_, i) => (
          <line
            key={`grid-v-${i}`}
            x1={`${(i / 30) * 100}%`}
            y1="0"
            x2={`${(i / 30) * 100}%`}
            y2="400"
            stroke="url(#gridGrad)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Holographic Dispersion */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`holographic-${i}`}
          className="fixed pointer-events-none z-11"
          style={{
            width: '300px',
            height: '300px',
            left: `${20 + i * 20}%`,
            top: `${15 + i * 15}%`,
            background: `conic-gradient(from ${i * 90}deg, 
              rgba(0,255,255,0.2), 
              rgba(255,0,255,0.2), 
              rgba(0,255,255,0.2))`,
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Gooey Morphing Blobs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`gooey-${i}`}
          className="fixed pointer-events-none z-9"
          style={{
            width: '150px',
            height: '150px',
            left: `${30 + i * 25}%`,
            top: `${40 + i * 10}%`,
            background: `radial-gradient(circle, 
              rgba(${i === 0 ? '0,255,255' : i === 1 ? '255,0,255' : '255,215,0'},0.4), 
              transparent)`,
            borderRadius: '50%',
            filter: 'blur(30px)',
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1,
          }}
        />
      ))}

      {/* Glass Refraction Effect */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-14"
        style={{
          background: `linear-gradient(45deg, 
            rgba(255,255,255,0.05) 0%, 
            transparent 50%, 
            rgba(255,255,255,0.05) 100%)`,
          backdropFilter: 'blur(0.5px)',
        }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Sonar Pulses */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`sonar-${i}`}
          className="fixed pointer-events-none z-13"
          style={{
            width: '100px',
            height: '100px',
            left: '50%',
            top: '50%',
            marginLeft: '-50px',
            marginTop: '-50px',
            border: '2px solid #00ffff',
            borderRadius: '50%',
            opacity: 0.6,
          }}
          animate={{
            scale: [0, 3],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.5,
          }}
        />
      ))}

      {/* CRT Scanlines - Enhanced */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)',
          animation: 'scanlines-v7 6s linear infinite',
        }}
      />

      {/* Film Grain */}
      <div
        className="fixed inset-0 pointer-events-none z-39"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise'/%3E%3CfeColorMatrix in='noise' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' fill='rgba(0,0,0,0.03)' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* Digital Rain */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          className="fixed pointer-events-none z-16 font-mono text-cyan-400 text-sm opacity-40"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
          }}
          animate={{
            y: window.innerHeight + 100,
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.4,
          }}
        >
          {['◆', '★', '●', '■', '▲', '◉', '◎', '◈', '✦', '✧'][i % 10]}
        </motion.div>
      ))}

      {/* Datamosh Transitions */}
      {triggerEffects && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.8 }}
          style={{
            background: `repeating-linear-gradient(
              90deg,
              rgba(255,0,255,0.1) 0px,
              rgba(255,0,255,0.1) 2px,
              transparent 2px,
              transparent 4px
            )`,
          }}
        />
      )}

      {/* HDR Bloom */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`bloom-${i}`}
          className="fixed pointer-events-none z-17"
          style={{
            width: '400px',
            height: '400px',
            left: `${20 + i * 30}%`,
            top: `${20 + i * 20}%`,
            background: `radial-gradient(circle, 
              rgba(255,215,0,0.4) 0%, 
              rgba(255,215,0,0.2) 30%, 
              transparent 70%)`,
            filter: 'blur(60px)',
            mixBlendMode: 'screen',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5 + i * 1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Interactive Lens Flares */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={`flare-${i}`}
          className="fixed pointer-events-none z-18"
          style={{
            width: '80px',
            height: '80px',
            left: `${25 + i * 50}%`,
            top: `${25 + i * 30}%`,
            background: `radial-gradient(circle, 
              rgba(255,255,255,0.8) 0%, 
              rgba(255,215,0,0.4) 40%, 
              transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(15px)',
            boxShadow: '0 0 40px rgba(255,215,0,0.6)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Liquid Metal Transformations */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`liquid-${i}`}
          className="fixed pointer-events-none z-19"
          style={{
            width: '100px',
            height: '100px',
            left: `${15 + i * 20}%`,
            top: `${60 + i * 10}%`,
            background: `linear-gradient(45deg, 
              rgba(192,192,192,0.6), 
              rgba(128,128,128,0.4), 
              rgba(192,192,192,0.6))`,
            borderRadius: '50%',
            filter: 'blur(20px)',
          }}
          animate={{
            borderRadius: ['50%', '30% 70% 70% 30%', '50%'],
            scale: [1, 1.2, 1],
            rotate: 360,
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}

      {/* 5-Layer Parallax Depth */}
      {[...Array(5)].map((_, layer) => (
        <motion.div
          key={`parallax-${layer}`}
          className="fixed inset-0 pointer-events-none z-6"
          style={{
            opacity: 0.1 + layer * 0.08,
            background: `linear-gradient(${45 + layer * 10}deg, 
              rgba(0,255,255,${0.1 + layer * 0.05}), 
              rgba(255,0,255,${0.1 + layer * 0.05}))`,
          }}
          animate={{
            x: [0, 50 * (layer + 1), 0],
            y: [0, 30 * (layer + 1), 0],
          }}
          transition={{
            duration: 20 + layer * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: layer * 0.5,
          }}
        />
      ))}

      <style>{`
        @keyframes scanlines-v7 {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }
      `}</style>
    </>
  );
}
