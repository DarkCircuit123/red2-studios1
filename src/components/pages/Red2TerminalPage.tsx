import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Red2TerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'initial' | 'typing' | 'glitch' | 'countdown' | 'meltdown' | 'welcome' | 'redirect'>('initial');
  const [typedText, setTypedText] = useState('');
  const [countdownNum, setCountdownNum] = useState(10);
  const [meltdownActive, setMeltdownActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const terminalLines = [
    '> NODE CONNECTION DETECTED',
    '> AUTHENTICATION TOKEN ACCEPTED',
    '> CLASSIFIED ACCESS LEVEL CONFIRMED',
    '> INITIALIZING RED2 PROTOCOL',
    '> PREPARING SYSTEM DEPLOYMENT'
  ];

  const meltdownCommands = [
    '> EXECUTE RED2.PROTOCOL',
    '> SYNC NETWORK GRID',
    '> DEPLOY VISUAL MATRIX',
    '> MOUNT ARCHIVE NODE',
    '> RUN SYSTEM OVERRIDE',
    '> LOAD INTERFACE CORE',
    '> INITIALIZING CONTROL CHANNEL',
    '> OVERRIDE DISPLAY DRIVER',
    '> RENDER SEQUENCE ACTIVE',
    '> SYSTEM_CRITICAL_ERROR',
    '> MEMORY_OVERFLOW_DETECTED',
    '> BUFFER_OVERFLOW_ALERT',
    '> KERNEL_PANIC_INITIATED',
    '> FIREWALL_BREACH_DETECTED',
    '> SECURITY_PROTOCOL_FAILED',
    '> ENCRYPTION_KEY_COMPROMISED',
    '> DATABASE_CORRUPTION_WARNING',
    '> NETWORK_INTERFACE_FAILURE',
    '> DISK_READ_ERROR',
    '> CACHE_INVALIDATION_FAILED',
    '> PROCESS_TERMINATION_SEQUENCE',
    '> SYSTEM_REBOOT_REQUIRED',
    '> FATAL_EXCEPTION_HANDLER',
    '> STACK_OVERFLOW_DETECTED',
    '> SEGMENTATION_FAULT',
    '> ACCESS_VIOLATION_ERROR',
    '> MEMORY_LEAK_DETECTED',
    '> RESOURCE_EXHAUSTION_WARNING',
    '> THREAD_DEADLOCK_DETECTED',
    '> RACE_CONDITION_ALERT',
    '> MUTEX_LOCK_TIMEOUT',
    '> SEMAPHORE_WAIT_FAILED',
    '> INTERRUPT_HANDLER_FAILED',
    '> EXCEPTION_UNHANDLED',
    '> CRITICAL_SYSTEM_FAILURE',
  ];

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

    const fullText = terminalLines.join('\n');
    let currentIndex = 0;
    const typingSpeed = 50;

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setStage('glitch');
        }, 500);
      }
    }, typingSpeed);

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
      setTimeout(() => {
        setStage('meltdown');
        setMeltdownActive(true);
      }, 500);
    }
  }, [stage, countdownNum]);

  // Stage 5: Meltdown
  useEffect(() => {
    if (stage !== 'meltdown') return;

    setScreenShake(true);
    const meltdownDuration = 3000;

    const timer = setTimeout(() => {
      setMeltdownActive(false);
      setScreenShake(false);
      setStage('welcome');
    }, meltdownDuration);

    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 6: Welcome fade in
  useEffect(() => {
    if (stage !== 'welcome') return;

    setTimeout(() => {
      setShowWelcome(true);
    }, 300);

    const redirectTimer = setTimeout(() => {
      setStage('redirect');
      navigate('/');
    }, 2000);

    return () => clearTimeout(redirectTimer);
  }, [stage, navigate]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {/* CRT Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-repeat" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.03) 2px, rgba(255,255,255,.03) 4px)',
        zIndex: 50
      }} />

      {/* Main content container */}
      <div className={`w-full h-full flex items-center justify-center ${screenShake ? 'animate-pulse' : ''}`}
        style={screenShake ? {
          animation: 'shake 0.1s infinite',
        } : {}}>

        {/* Typing stage */}
        {(stage === 'typing' || stage === 'glitch') && (
          <div className="text-center">
            <div className="font-mono text-lg md:text-2xl whitespace-pre-wrap" style={{
              color: '#00FF66',
              textShadow: '0 0 10px rgba(0, 255, 102, 0.5)',
              fontFamily: '"Courier New", monospace',
              letterSpacing: '0.05em',
              lineHeight: '1.8',
              minHeight: '200px',
            }}>
              {typedText}
              {stage === 'typing' && <span className="animate-pulse">▌</span>}
            </div>
          </div>
        )}

        {/* Glitch effect overlay */}
        {glitchActive && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-1 bg-red-600 opacity-30"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `glitch-flicker 0.1s infinite`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
            <style>{`
              @keyframes glitch-flicker {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
              }
            `}</style>
          </div>
        )}

        {/* Countdown stage */}
        {stage === 'countdown' && (
          <div className="text-center">
            <div className="text-9xl md:text-9xl font-bold" style={{
              color: '#FF0000',
              textShadow: '0 0 20px rgba(255, 0, 0, 0.8)',
              fontFamily: '"Courier New", monospace',
              animation: 'pulse 0.5s ease-in-out',
            }}>
              {countdownNum}
            </div>
          </div>
        )}

        {/* Meltdown stage */}
        {meltdownActive && (
          <MeltdownEffect commands={meltdownCommands} />
        )}

        {/* Welcome stage */}
        {stage === 'welcome' && (
          <div className={`text-center transition-opacity duration-1000 ${showWelcome ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-6xl md:text-8xl font-bold" style={{
              color: '#00FF66',
              textShadow: '0 0 30px rgba(0, 255, 102, 0.8)',
              fontFamily: '"Courier New", monospace',
              letterSpacing: '0.1em',
            }}>
              WELCOME TO RED2
            </div>
          </div>
        )}
      </div>

      {/* Keyboard lights simulation */}
      {meltdownActive && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#00FF66', '#FF0000', '#00FFFF', '#FFFF00', '#FF00FF'][i],
                animation: `blink ${0.2 + i * 0.1}s infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes blink {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) translateY(0); }
          10% { transform: translateX(-2px) translateY(-2px); }
          20% { transform: translateX(2px) translateY(2px); }
          30% { transform: translateX(-2px) translateY(2px); }
          40% { transform: translateX(2px) translateY(-2px); }
          50% { transform: translateX(-1px) translateY(-1px); }
          60% { transform: translateX(1px) translateY(1px); }
          70% { transform: translateX(-2px) translateY(1px); }
          80% { transform: translateX(2px) translateY(-2px); }
          90% { transform: translateX(-1px) translateY(2px); }
        }
      `}</style>
    </div>
  );
};

// Meltdown effect component with scrolling commands
const MeltdownEffect: React.FC<{ commands: string[] }> = ({ commands }) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);

  useEffect(() => {
    const lines: string[] = [];
    const interval = setInterval(() => {
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const randomLog = `[${new Date().toLocaleTimeString()}] SYSTEM_LOG_${randomNumber}`;
      
      lines.push(randomCommand);
      lines.push(randomLog);
      
      if (lines.length > 50) {
        lines.shift();
      }
      
      setDisplayedLines([...lines]);
    }, 30);

    return () => clearInterval(interval);
  }, [commands]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Glitch and flicker effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        animation: 'glitch-intense 0.15s infinite',
        backgroundColor: '#FF0000',
      }} />

      {/* Scrolling terminal content */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="font-mono text-xs md:text-sm" style={{
          color: '#00FF66',
          textShadow: '0 0 5px rgba(0, 255, 102, 0.5)',
          fontFamily: '"Courier New", monospace',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          padding: '20px',
          animation: 'scroll-up 0.5s linear infinite',
          lineHeight: '1.4',
        }}>
          {displayedLines.map((line, idx) => (
            <div key={idx} style={{
              opacity: 1 - (idx / displayedLines.length) * 0.5,
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Hard drive and processing symbols */}
      <div className="fixed top-1/4 left-1/4 pointer-events-none">
        <div style={{
          fontSize: '48px',
          animation: 'spin 1s linear infinite',
          color: '#00FF66',
          opacity: 0.6,
        }}>
          ⟳
        </div>
      </div>

      <div className="fixed top-1/3 right-1/4 pointer-events-none">
        <div style={{
          fontSize: '48px',
          animation: 'pulse 0.5s ease-in-out infinite',
          color: '#FF0000',
          opacity: 0.6,
        }}>
          ◆
        </div>
      </div>

      <div className="fixed bottom-1/4 left-1/3 pointer-events-none">
        <div style={{
          fontSize: '48px',
          animation: 'spin 1.5s linear infinite reverse',
          color: '#00FFFF',
          opacity: 0.6,
        }}>
          ⟲
        </div>
      </div>

      <style>{`
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }

        @keyframes glitch-intense {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Red2TerminalPage;
