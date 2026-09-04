import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PremiumCasinoIconProps {
  type: 'crown' | 'diamond' | 'cherry' | 'bell' | 'seven';
  size?: number;
  animate?: boolean;
  className?: string;
}

const PremiumCasinoIcon: React.FC<PremiumCasinoIconProps> = ({
  type,
  size = 80,
  animate = true,
  className = '',
}) => {
  const iconId = useMemo(() => `icon-${type}-${Math.random()}`, [type]);

  const renderIcon = () => {
    switch (type) {
      case 'crown':
        return (
          <svg viewBox="0 0 200 200" width={size} height={size} className={className}>
            <defs>
              <linearGradient id={`${iconId}-gold-main`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE55C" />
                <stop offset="20%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFA500" />
                <stop offset="80%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#DAA520" />
              </linearGradient>
              <linearGradient id={`${iconId}-gold-light`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
              </linearGradient>
              <radialGradient id={`${iconId}-jewel`} cx="40%" cy="40%">
                <stop offset="0%" stopColor="#FF1493" />
                <stop offset="50%" stopColor="#C71585" />
                <stop offset="100%" stopColor="#8B0A50" />
              </radialGradient>
              <filter id={`${iconId}-shadow`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                <feOffset dx="2" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${iconId}-glow`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base band */}
            <ellipse cx="100" cy="140" rx="70" ry="20" fill={`url(#${iconId}-gold-main)`} filter={`url(#${iconId}-shadow)`} />
            <ellipse cx="100" cy="138" rx="70" ry="18" fill={`url(#${iconId}-gold-light)`} opacity="0.7" />

            {/* Left point */}
            <path
              d="M 50 120 L 35 60 L 55 100 Z"
              fill={`url(#${iconId}-gold-main)`}
              filter={`url(#${iconId}-shadow)`}
            />
            <path d="M 50 120 L 35 60 L 55 100 Z" fill={`url(#${iconId}-gold-light)`} opacity="0.5" />

            {/* Center point (tallest) */}
            <path
              d="M 100 120 L 100 30 L 110 100 Z"
              fill={`url(#${iconId}-gold-main)`}
              filter={`url(#${iconId}-shadow)`}
            />
            <path d="M 100 120 L 100 30 L 110 100 Z" fill={`url(#${iconId}-gold-light)`} opacity="0.6" />

            {/* Right point */}
            <path
              d="M 150 120 L 165 60 L 145 100 Z"
              fill={`url(#${iconId}-gold-main)`}
              filter={`url(#${iconId}-shadow)`}
            />
            <path d="M 150 120 L 165 60 L 145 100 Z" fill={`url(#${iconId}-gold-light)`} opacity="0.5" />

            {/* Center jewel */}
            <circle cx="100" cy="50" r="12" fill={`url(#${iconId}-jewel)`} filter={`url(#${iconId}-glow)`} />
            <circle cx="100" cy="50" r="10" fill="none" stroke="#FF69B4" strokeWidth="1" opacity="0.8" />

            {/* Left jewel */}
            <circle cx="45" cy="75" r="10" fill={`url(#${iconId}-jewel)`} filter={`url(#${iconId}-glow)`} />
            <circle cx="45" cy="75" r="8" fill="none" stroke="#FF69B4" strokeWidth="0.8" opacity="0.8" />

            {/* Right jewel */}
            <circle cx="155" cy="75" r="10" fill={`url(#${iconId}-jewel)`} filter={`url(#${iconId}-glow)`} />
            <circle cx="155" cy="75" r="8" fill="none" stroke="#FF69B4" strokeWidth="0.8" opacity="0.8" />

            {/* Bevel/3D effect on base */}
            <ellipse cx="100" cy="142" rx="68" ry="16" fill="none" stroke="#8B7500" strokeWidth="2" opacity="0.6" />
          </svg>
        );

      case 'diamond':
        return (
          <svg viewBox="0 0 200 200" width={size} height={size} className={className}>
            <defs>
              <linearGradient id={`${iconId}-diamond-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FFFF" />
                <stop offset="25%" stopColor="#00E5FF" />
                <stop offset="50%" stopColor="#00B8D4" />
                <stop offset="75%" stopColor="#0097A7" />
                <stop offset="100%" stopColor="#006064" />
              </linearGradient>
              <linearGradient id={`${iconId}-diamond-light`} x1="20%" y1="20%" x2="80%" y2="80%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
              </linearGradient>
              <filter id={`${iconId}-diamond-shadow`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                <feOffset dx="3" dy="5" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.6" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer diamond shape */}
            <path
              d="M 100 30 L 160 100 L 100 170 L 40 100 Z"
              fill={`url(#${iconId}-diamond-main)`}
              filter={`url(#${iconId}-diamond-shadow)`}
            />

            {/* Light reflection on top-left */}
            <path
              d="M 100 30 L 130 65 L 100 80 L 70 65 Z"
              fill={`url(#${iconId}-diamond-light)`}
              opacity="0.7"
            />

            {/* Inner facet lines for depth */}
            <line x1="100" y1="30" x2="100" y2="170" stroke="#004D73" strokeWidth="2" opacity="0.4" />
            <line x1="40" y1="100" x2="160" y2="100" stroke="#004D73" strokeWidth="2" opacity="0.4" />

            {/* Corner highlights */}
            <circle cx="100" cy="35" r="4" fill="#FFFFFF" opacity="0.9" />
            <circle cx="155" cy="100" r="3" fill="#FFFFFF" opacity="0.7" />
            <circle cx="100" cy="165" r="3" fill="#FFFFFF" opacity="0.5" />
            <circle cx="45" cy="100" r="3" fill="#FFFFFF" opacity="0.6" />

            {/* Bevel edges */}
            <path
              d="M 100 30 L 160 100 L 100 170 L 40 100 Z"
              fill="none"
              stroke="#00BCD4"
              strokeWidth="3"
              opacity="0.5"
            />
          </svg>
        );

      case 'cherry':
        return (
          <svg viewBox="0 0 200 200" width={size} height={size} className={className}>
            <defs>
              <radialGradient id={`${iconId}-cherry-main`} cx="35%" cy="35%">
                <stop offset="0%" stopColor="#FF4444" />
                <stop offset="50%" stopColor="#DD0000" />
                <stop offset="100%" stopColor="#990000" />
              </radialGradient>
              <linearGradient id={`${iconId}-cherry-light`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id={`${iconId}-stem`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#228B22" />
                <stop offset="50%" stopColor="#1a6b1a" />
                <stop offset="100%" stopColor="#0d3d0d" />
              </linearGradient>
              <filter id={`${iconId}-cherry-shadow`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                <feOffset dx="2" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Left cherry */}
            <circle cx="65" cy="100" r="35" fill={`url(#${iconId}-cherry-main)`} filter={`url(#${iconId}-cherry-shadow)`} />
            <circle cx="65" cy="100" r="33" fill={`url(#${iconId}-cherry-light)`} opacity="0.6" />
            <circle cx="55" cy="85" r="8" fill="#FFFFFF" opacity="0.8" />

            {/* Right cherry */}
            <circle cx="135" cy="100" r="35" fill={`url(#${iconId}-cherry-main)`} filter={`url(#${iconId}-cherry-shadow)`} />
            <circle cx="135" cy="100" r="33" fill={`url(#${iconId}-cherry-light)`} opacity="0.6" />
            <circle cx="125" cy="85" r="8" fill="#FFFFFF" opacity="0.8" />

            {/* Connecting stem */}
            <path
              d="M 65 65 Q 100 50 135 65"
              stroke={`url(#${iconId}-stem)`}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              filter={`url(#${iconId}-cherry-shadow)`}
            />

            {/* Stem highlight */}
            <path
              d="M 65 65 Q 100 50 135 65"
              stroke="#32CD32"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Leaf */}
            <ellipse cx="110" cy="40" rx="15" ry="20" fill="#228B22" transform="rotate(-30 110 40)" filter={`url(#${iconId}-cherry-shadow)`} />
            <ellipse cx="110" cy="40" rx="13" ry="18" fill="#32CD32" transform="rotate(-30 110 40)" opacity="0.5" />
          </svg>
        );

      case 'bell':
        return (
          <svg viewBox="0 0 200 200" width={size} height={size} className={className}>
            <defs>
              <linearGradient id={`${iconId}-bell-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="25%" stopColor="#FFC700" />
                <stop offset="50%" stopColor="#FFB700" />
                <stop offset="75%" stopColor="#FFA700" />
                <stop offset="100%" stopColor="#FF9700" />
              </linearGradient>
              <linearGradient id={`${iconId}-bell-light`} x1="20%" y1="20%" x2="80%" y2="80%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
              </linearGradient>
              <filter id={`${iconId}-bell-shadow`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                <feOffset dx="2" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Bell body */}
            <path
              d="M 60 80 Q 50 100 50 120 Q 50 150 100 160 Q 150 150 150 120 Q 150 100 140 80 Z"
              fill={`url(#${iconId}-bell-main)`}
              filter={`url(#${iconId}-bell-shadow)`}
            />

            {/* Bell highlight */}
            <path
              d="M 65 85 Q 60 100 60 115 Q 60 140 100 148 Q 130 142 135 115 Q 135 100 130 85 Z"
              fill={`url(#${iconId}-bell-light)`}
              opacity="0.7"
            />

            {/* Bell rim */}
            <ellipse cx="100" cy="80" rx="42" ry="15" fill={`url(#${iconId}-bell-main)`} />
            <ellipse cx="100" cy="78" rx="40" ry="12" fill={`url(#${iconId}-bell-light)`} opacity="0.6" />

            {/* Clapper */}
            <circle cx="100" cy="135" r="12" fill="#8B4513" filter={`url(#${iconId}-bell-shadow)`} />
            <circle cx="100" cy="135" r="10" fill="#A0522D" opacity="0.7" />
            <circle cx="98" cy="132" r="3" fill="#FFFFFF" opacity="0.8" />

            {/* Top loop */}
            <rect x="90" y="50" width="20" height="30" rx="10" fill={`url(#${iconId}-bell-main)`} filter={`url(#${iconId}-bell-shadow)`} />
            <rect x="92" y="52" width="16" height="26" rx="8" fill={`url(#${iconId}-bell-light)`} opacity="0.6" />

            {/* Decorative lines */}
            <line x1="75" y1="95" x2="75" y2="130" stroke="#CC8800" strokeWidth="2" opacity="0.5" />
            <line x1="100" y1="95" x2="100" y2="135" stroke="#CC8800" strokeWidth="2" opacity="0.5" />
            <line x1="125" y1="95" x2="125" y2="130" stroke="#CC8800" strokeWidth="2" opacity="0.5" />
          </svg>
        );

      case 'seven':
        return (
          <svg viewBox="0 0 200 200" width={size} height={size} className={className}>
            <defs>
              <linearGradient id={`${iconId}-seven-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="25%" stopColor="#FF5252" />
                <stop offset="50%" stopColor="#FF3838" />
                <stop offset="75%" stopColor="#FF2020" />
                <stop offset="100%" stopColor="#DD0000" />
              </linearGradient>
              <linearGradient id={`${iconId}-seven-light`} x1="20%" y1="20%" x2="80%" y2="80%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
              </linearGradient>
              <filter id={`${iconId}-seven-shadow`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                <feOffset dx="3" dy="5" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.6" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Main "7" shape - top horizontal bar */}
            <rect x="45" y="45" width="110" height="25" rx="8" fill={`url(#${iconId}-seven-main)`} filter={`url(#${iconId}-seven-shadow)`} />
            <rect x="48" y="48" width="104" height="19" fill={`url(#${iconId}-seven-light)`} opacity="0.7" rx="6" />

            {/* Main "7" shape - diagonal stroke */}
            <path
              d="M 140 70 L 70 160"
              stroke={`url(#${iconId}-seven-main)`}
              strokeWidth="28"
              strokeLinecap="round"
              filter={`url(#${iconId}-seven-shadow)`}
            />
            <path
              d="M 140 70 L 70 160"
              stroke={`url(#${iconId}-seven-light)`}
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Bevel/edge highlight on top bar */}
            <rect x="45" y="45" width="110" height="4" rx="2" fill="#FFFFFF" opacity="0.5" />

            {/* Corner highlights */}
            <circle cx="55" cy="55" r="5" fill="#FFFFFF" opacity="0.8" />
            <circle cx="75" cy="155" r="4" fill="#FFFFFF" opacity="0.6" />

            {/* Decorative shine effect */}
            <ellipse cx="100" cy="60" rx="30" ry="8" fill="#FFFFFF" opacity="0.3" />
          </svg>
        );

      default:
        return null;
    }
  };

  const animationVariants = {
    idle: {
      scale: [1, 1.02, 1],
      opacity: [1, 0.95, 1],
    },
    spin: {
      rotateZ: [0, 360],
    },
  };

  const animationConfig = animate
    ? {
        variants: animationVariants,
        animate: 'idle',
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <motion.div {...animationConfig} className="inline-flex items-center justify-center">
      {renderIcon()}
    </motion.div>
  );
};

export default PremiumCasinoIcon;
