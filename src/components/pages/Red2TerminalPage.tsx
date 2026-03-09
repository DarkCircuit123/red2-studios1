import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Red2TerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'initial' | 'typing' | 'glitch' | 'countdown' | 'meltdown' | 'fadeout' | 'welcome'>('initial');
  const [displayText, setDisplayText] = useState('');
  const [countdownNum, setCountdownNum] = useState(10);
  const [meltdownLines, setMeltdownLines] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hardDrivesSpinning, setHardDrivesSpinning] = useState(false);
  const [keyboardLightsActive, setKeyboardLightsActive] = useState(false);

  const fullText = `> NODE CONNECTION DETECTED
> AUTHENTICATION TOKEN ACCEPTED
> CLASSIFIED ACCESS LEVEL CONFIRMED
> INITIALIZING RED2 PROTOCOL
> PREPARING SYSTEM DEPLOYMENT`;

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

  // Audio synthesis functions
  const playStaticNoise = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
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
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
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
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
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
    const timer = setTimeout(() => {
      setStage('typing');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
        setTimeout(() => {
          setStage('glitch');
        }, 500);
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

    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 4: Countdown
  useEffect(() => {
    if (stage !== 'countdown') return;

    if (countdownNum > 0) {
      const timer = setTimeout(() => {
        setCountdownNum(countdownNum - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setStage('meltdown');
    }
  }, [stage, countdownNum]);

  // Stage 5: Meltdown
  useEffect(() => {
    if (stage !== 'meltdown') return;

    setScreenShake(true);
    setHardDrivesSpinning(true);
    setKeyboardLightsActive(true);

    // Play initial screeches and static
    playScreech();
    setTimeout(() => playStaticNoise(), 100);
    setTimeout(() => playScreech(), 200);

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
      for (let i = 0; i < 150; i++) {
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

    const meltdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < meltdownDuration) {
        setMeltdownLines(generateLines());
      } else {
        clearInterval(meltdownInterval);
        clearInterval(soundInterval);
        setScreenShake(false);
        setHardDrivesSpinning(false);
        setKeyboardLightsActive(false);
        setMeltdownLines([]);
        setStage('fadeout');
      }
    }, 50);

    return () => {
      clearInterval(meltdownInterval);
      clearInterval(soundInterval);
      setScreenShake(false);
      setHardDrivesSpinning(false);
      setKeyboardLightsActive(false);
    };
  }, [stage]);

  // Stage 6: Fadeout and welcome
  useEffect(() => {
    if (stage !== 'fadeout') return;

    const timer = setTimeout(() => {
      setStage('welcome');
      setShowWelcome(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 7: Redirect
  useEffect(() => {
    if (stage !== 'welcome') return;

    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [stage, navigate]);

  return (
    <div
      className={`fixed inset-0 bg-black overflow-hidden ${screenShake ? 'animate-pulse' : ''}`}
      style={{
        transform: screenShake ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)` : 'none',
      }}
    >
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
              {stage === 'typing' && <span className="animate-pulse">_</span>}
            </div>
          </div>
        )}

        {/* Glitch effect */}
        {glitchActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-red-600 opacity-20"
              style={{
                animation: 'glitch-flicker 0.1s infinite',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 0, 0, 0.3) 2px, rgba(255, 0, 0, 0.3) 4px)',
                animation: 'glitch-shift 0.15s infinite',
              }}
            />
          </div>
        )}

        {/* Countdown stage */}
        {stage === 'countdown' && (
          <div className="text-center">
            <div className="text-9xl font-mono font-bold text-green-400 animate-pulse">
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
                animation: 'meltdown-scroll 3s linear forwards',
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
                animation: 'glitch-intense 0.1s infinite',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
              }}
            />

            {/* Hard drive and processing indicators */}
            <div className="absolute bottom-8 left-8 flex gap-4">
              {/* Spinning hard drives */}
              {hardDrivesSpinning && (
                <>
                  <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-spin" />
                  <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                  <div className="w-8 h-8 border-2 border-red-600 rounded-full animate-spin" style={{ animationDuration: '0.6s' }} />
                </>
              )}
              <div className="w-6 h-6 bg-green-400 animate-pulse" />
              <div className="w-6 h-6 bg-red-600 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            {/* Keyboard lights simulation - more intense */}
            <div className="absolute bottom-8 right-8 flex gap-2">
              {keyboardLightsActive && (
                <>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full animate-pulse shadow-lg"
                      style={{
                        backgroundColor: ['#00FF66', '#FF0000', '#00FF66', '#FF0000', '#00FF66', '#FF0000'][i],
                        animationDuration: `${0.2 + Math.random() * 0.3}s`,
                        animationDelay: `${i * 0.05}s`,
                        boxShadow: `0 0 10px ${['#00FF66', '#FF0000', '#00FF66', '#FF0000', '#00FF66', '#FF0000'][i]}`,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Welcome stage */}
        {showWelcome && (
          <div className="text-center">
            <div
              className="text-6xl md:text-8xl font-mono font-bold text-green-400"
              style={{
                animation: 'fade-in 1s ease-in forwards',
              }}
            >
              WELCOME TO RED2
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes glitch-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes glitch-shift {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        @keyframes glitch-intense {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }

        @keyframes meltdown-scroll {
          0% { transform: translateY(100vh); }
          100% { transform: translateY(-100vh); }
        }

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Red2TerminalPage;
