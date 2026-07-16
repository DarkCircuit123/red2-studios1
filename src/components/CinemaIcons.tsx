// Custom SVG Icons for Cinema Hangman

export const CameraIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <defs>
      <linearGradient id="cameraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Camera body */}
    <rect x="15" y="25" width="70" height="50" rx="8" fill="url(#cameraGrad)" opacity="0.9" />
    {/* Lens */}
    <circle cx="50" cy="50" r="18" fill="none" stroke="#000" strokeWidth="3" />
    <circle cx="50" cy="50" r="14" fill="#1a1a1a" />
    <circle cx="50" cy="50" r="10" fill="#333" />
    {/* Flash */}
    <rect x="70" y="28" width="8" height="8" rx="1" fill="#ffd700" />
    {/* Viewfinder */}
    <rect x="20" y="30" width="12" height="10" rx="2" fill="#06b6d4" opacity="0.6" />
  </svg>
);

export const ScissorsIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <defs>
      <linearGradient id="scissorsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Left blade */}
    <path d="M 25 20 Q 20 30 25 40 L 50 50 L 25 60 Q 20 70 25 80" 
          fill="none" stroke="url(#scissorsGrad)" strokeWidth="4" strokeLinecap="round" />
    {/* Right blade */}
    <path d="M 75 20 Q 80 30 75 40 L 50 50 L 75 60 Q 80 70 75 80" 
          fill="none" stroke="url(#scissorsGrad)" strokeWidth="4" strokeLinecap="round" />
    {/* Left handle circle */}
    <circle cx="25" cy="25" r="5" fill="url(#scissorsGrad)" />
    {/* Right handle circle */}
    <circle cx="75" cy="25" r="5" fill="url(#scissorsGrad)" />
  </svg>
);

export const PolaroidIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <defs>
      <linearGradient id="polaroidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Polaroid frame */}
    <rect x="15" y="10" width="70" height="80" rx="4" fill="white" />
    {/* Image area */}
    <rect x="20" y="15" width="60" height="50" fill="url(#polaroidGrad)" opacity="0.8" />
    {/* Label area */}
    <rect x="20" y="68" width="60" height="15" fill="#f5f5f5" />
    {/* Decorative line */}
    <line x1="25" y1="75" x2="75" y2="75" stroke="#999" strokeWidth="1" />
  </svg>
);
