import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Red2TerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'unlock' | 'initial' | 'typing' | 'glitch' | 'countdown' | 'meltdown' | 'fadeout' | 'welcome'>('unlock');
  const [displayText, setDisplayText] = useState('');
  const [countdownNum, setCountdownNum] = useState(10);
  const [meltdownLines, setMeltdownLines] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRefsRef = useRef<NodeJS.Timeout[]>([]);

  const fullText = `> NODE CONNECTION DETECTED
> AUTHENTICATION TOKEN ACCEPTED
> CLASSIFIED ACCESS LEVEL CONFIRMED
> INITIALIZING RED2 PROTOCOL
> PREPARING SYSTEM DEPLOYMENT`;

  // Check for prefers-reduced-motion on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Check for skip flag in sessionStorage
  useEffect(() => {
    const shouldSkip = sessionStorage.getItem('red2-skip') === 'true';
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
    
    if (shouldSkip || prefersReducedMotion) {
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    }
  }, [prefersReducedMotion, navigate]);

  // Handle visibility changes to pause/resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        timerRefsRef.current.forEach(clearTimeout);
        timerRefsRef.current = [];
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timerRefsRef.current.forEach(clearTimeout);
    };
  }, []);

  const commandExamples = [
    '> EXECUTE RED2.PROTOCOL',
    '> SYNC NETWORK GRID',
    '> DEPLOY VISUAL MATRIX',
    '> MOUNT ARCHIVE NODE',
    '> RUN SYSTEM OVERRIDE',
    '> LOAD INTERFACE CORE',
    '> INITIALIZING CONTROL CHANNEL',
    '> OVERRIDE DISPLAY DRIVER',
    '> RENDER SEQUENCE ACTIVE',
    '> ACCESS GRANTED',
    '> SYSTEM ONLINE',
    '> BUFFER OVERFLOW',
    '> MEMORY DUMP',
    '> CACHE CLEARED',
    '> KERNEL PANIC',
    '> FATAL ERROR',
    '> REBOOTING CORE',
    '> SIGNAL LOST',
    '> RECONNECTING...',
    '> FIREWALL DISABLED',
    '> ENCRYPTION BROKEN',
    '> ADMIN MODE ACTIVE',
    '> ROOT ACCESS GRANTED',
    '> EXECUTING PAYLOAD',
    '> SYSTEM COMPROMISED',
  ];

  // Initialize AudioContext on user gesture
  const unlockAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setAudioUnlocked(true);
    setStage('initial');
  };

  // Audio synthesis functions
  const playStaticNoise = () => {
    if (!audioUnlocked || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const duration = 0.3;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(now);
  };

  const playScreech = () => {
    if (!audioUnlocked || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const duration = 0.2;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + duration);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  };

  const playBeep = (frequency: number = 1000, duration: number = 0.1) => {
    if (!audioUnlocked || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  };

  // Stage 1: Initial black screen (1 second)
  useEffect(() => {
    if (stage !== 'initial') return;
    const timer = setTimeout(() => {
      setStage('typing');
    }, 1000);
    timerRefsRef.current.push(timer);
    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 2: Typing effect
  useEffect(() => {
    if (stage !== 'typing') return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        const timer = setTimeout(() => {
          setStage('glitch');
        }, 500);
        timerRefsRef.current.push(timer);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [stage]);

  // Stage 3: Glitch effect
  useEffect(() => {
    if (stage !== 'glitch') return;

    setGlitchActive(true);
    const glitchDuration = 600;
    const timer = setTimeout(() => {
      setGlitchActive(false);
      setStage('countdown');
    }, glitchDuration);
    timerRefsRef.current.push(timer);

    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 4: Countdown
  useEffect(() => {
    if (stage !== 'countdown') return;

    if (countdownNum > 0) {
      const timer = setTimeout(() => {
        setCountdownNum(countdownNum - 1);
      }, 1000);
      timerRefsRef.current.push(timer);
      return () => clearTimeout(timer);
    } else {
      setStage('meltdown');
    }
  }, [stage, countdownNum]);

  // Stage 5: Meltdown
  useEffect(() => {
    if (stage !== 'meltdown') return;

    // Play initial screeches and static
    playScreech();
    const timer1 = setTimeout(() => playStaticNoise(), 100);
    const timer2 = setTimeout(() => playScreech(), 200);
    timerRefsRef.current.push(timer1, timer2);

    const lines: string[] = [];
    const meltdownDuration = 3000;
    const startTime = Date.now();

    // Play periodic sound effects during meltdown
    const soundInterval = setInterval(() => {
      const random = Math.random();
      if (random < 0.3) playStaticNoise();
      else if (random < 0.6) playScreech();
      else playBeep(Math.random() * 1000 + 200, 0.05);
    }, 200);

    const generateLines = () => {
      const newLines = [];
      // Reduced from 150 to 80 lines for better performance
      for (let i = 0; i < 80; i++) {
        const randomCommand = commandExamples[Math.floor(Math.random() * commandExamples.length)];
        const randomNum = Math.floor(Math.random() * 1000000);
        const randomHex = Math.random().toString(16).substring(2, 10);
        
        const options = [
          randomCommand,
          `[${new Date().toISOString()}] PROCESS_${randomNum}`,
          `0x${randomHex}`,
          `ERROR: ${randomNum}`,
          `WARN: BUFFER_${randomNum}`,
          `> ${Math.random().toString(36).substring(2)}`,
        ];
        
        newLines.push(options[Math.floor(Math.random() * options.length)]);
      }
      return newLines;
    };

    // Reduced frequency from 50ms to 100ms
    const meltdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < meltdownDuration) {
        setMeltdownLines(generateLines());
      } else {
        clearInterval(meltdownInterval);
        clearInterval(soundInterval);
        setMeltdownLines([]);
        setStage('fadeout');
      }
    }, 100);

    return () => {
      clearInterval(meltdownInterval);
      clearInterval(soundInterval);
    };
  }, [stage]);

  // Stage 6: Fadeout and welcome
  useEffect(() => {
    if (stage !== 'fadeout') return;

    const timer = setTimeout(() => {
      setStage('welcome');
      setShowWelcome(true);
      sessionStorage.setItem('red2-skip', 'true');
    }, 800);
    timerRefsRef.current.push(timer);

    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 7: Redirect
  useEffect(() => {
    if (stage !== 'welcome') return;

    const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
    const timer = setTimeout(() => {
      navigate(redirectUrl || '/');
    }, 2000);
    timerRefsRef.current.push(timer);

    return () => clearTimeout(timer);
  }, [stage, navigate]);

  // Handle ESC key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage === 'unlock') {
        unlockAudio();
      } else if (e.key === 'Escape') {
        sessionStorage.setItem('red2-skip', 'true');
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
        navigate(redirectUrl || '/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, navigate]);

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{
        animation: prefersReducedMotion ? 'none' : 'red2-terminal-shake 0.1s infinite',
      }}
      role="main"
      aria-live="polite"
      aria-label="RED2 Terminal initialization sequence"
    >
      {/* SEO noindex meta tag */}
      <meta name="robots" content="noindex" />

      {/* Unlock overlay */}
      {stage === 'unlock' && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-2xl md:text-4xl font-mono text-green-400 mb-8">
              PRESS ANY KEY TO UNLOCK AUDIO
            </div>
            <div className="text-sm md:text-base font-mono text-green-400 opacity-70">
              (or click anywhere to continue)
            </div>
          </div>
        </div>
      )}

      {/* CRT Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)',
          zIndex: 50,
        }}
      />

      {/* Main content */}
      <div className="w-full h-full flex items-center justify-center relative">
        {/* Typing stage */}
        {(stage === 'typing' || stage === 'glitch') && (
          <div className="text-center">
            <div className="font-mono text-green-400 text-xl md:text-2xl whitespace-pre-wrap max-w-2xl">
              {displayText}
              {stage === 'typing' && <span className="animate-red2-cursor">_</span>}
            </div>
          </div>
        )}

        {/* Glitch effect */}
        {glitchActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-red-600 opacity-20"
              style={{
                animation: prefersReducedMotion ? 'none' : 'red2-glitch-flicker 0.1s infinite',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 0, 0, 0.3) 2px, rgba(255, 0, 0, 0.3) 4px)',
                animation: prefersReducedMotion ? 'none' : 'red2-glitch-shift 0.15s infinite',
              }}
            />
          </div>
        )}

        {/* Countdown stage */}
        {stage === 'countdown' && (
          <div className="text-center">
            <div className="text-9xl font-mono font-bold text-green-400 animate-red2-pulse">
              {countdownNum}
            </div>
          </div>
        )}

        {/* Meltdown stage */}
        {stage === 'meltdown' && (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="w-full h-full font-mono text-xs md:text-sm text-green-400 p-4 overflow-hidden"
              style={{
                animation: prefersReducedMotion ? 'none' : 'red2-meltdown-scroll 3s linear forwards',
              }}
            >
              {meltdownLines.map((line, idx) => (
                <div key={idx} className="whitespace-nowrap">
                  {line}
                </div>
              ))}
            </div>

            {/* Glitch effects during meltdown */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                animation: prefersReducedMotion ? 'none' : 'red2-glitch-intense 0.1s infinite',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              }}
            />

            {/* Hard drive and processing indicators */}
            <div className="absolute bottom-8 left-8 flex gap-4">
              <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-red2-spin" />
              <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-red2-spin-reverse" />
              <div className="w-8 h-8 border-2 border-red-600 rounded-full animate-red2-spin-fast" />
              <div className="w-6 h-6 bg-green-400 animate-red2-pulse" />
              <div className="w-6 h-6 bg-red-600 animate-red2-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            {/* Keyboard lights simulation */}
            <div className="absolute bottom-8 right-8 flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full animate-red2-pulse"
                  style={{
                    backgroundColor: ['#00FF66', '#FF0000', '#00FF66', '#FF0000', '#00FF66', '#FF0000'][i],
                    animationDuration: `${0.2 + Math.random() * 0.3}s`,
                    animationDelay: `${i * 0.05}s`,
                    boxShadow: `0 0 10px ${['#00FF66', '#FF0000', '#00FF66', '#FF0000', '#00FF66', '#FF0000'][i]}`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Welcome stage */}
        {showWelcome && (
          <div className="text-center">
            <div
              className="text-6xl md:text-8xl font-mono font-bold text-green-400"
              style={{
                animation: prefersReducedMotion ? 'none' : 'red2-fade-in 1s ease-in forwards',
              }}
            >
              WELCOME TO RED2
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes red2-terminal-shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(1px, 1px); }
          50% { transform: translate(-1px, -1px); }
          75% { transform: translate(1px, -1px); }
        }

        @keyframes red2-glitch-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes red2-glitch-shift {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        @keyframes red2-glitch-intense {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }

        @keyframes red2-meltdown-scroll {
          0% { transform: translateY(100vh); }
          100% { transform: translateY(-100vh); }
        }

        @keyframes red2-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes red2-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes red2-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes red2-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes red2-spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-red2-cursor {
          animation: red2-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-red2-pulse {
          animation: red2-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-red2-spin {
          animation: red2-spin 1s linear infinite;
        }

        .animate-red2-spin-reverse {
          animation: red2-spin-reverse 0.8s linear infinite;
        }

        .animate-red2-spin-fast {
          animation: red2-spin-fast 0.6s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default React.memo(Red2TerminalPage);
