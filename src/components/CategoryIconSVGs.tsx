// Art-Deco SVG Icons for RED2 HANGMAN v7
// Custom category icons with geometric, luxurious design

export const AtelierIcon = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="atelierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#00ffff', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#ff00ff', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Geometric dress form */}
    <circle cx="100" cy="50" r="18" fill="url(#atelierGrad)" opacity="0.8" />
    <path d="M 82 68 L 118 68 L 115 140 L 85 140 Z" fill="none" stroke="url(#atelierGrad)" strokeWidth="3" />
    <line x1="82" y1="85" x2="60" y2="110" stroke="url(#atelierGrad)" strokeWidth="2" />
    <line x1="118" y1="85" x2="140" y2="110" stroke="url(#atelierGrad)" strokeWidth="2" />
    {/* Art-deco triangles */}
    <polygon points="100,160 85,180 115,180" fill="url(#atelierGrad)" opacity="0.6" />
    <line x1="50" y1="30" x2="150" y2="30" stroke="url(#atelierGrad)" strokeWidth="2" opacity="0.5" />
  </svg>
);

export const DarkroomIcon = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <radialGradient id="darkroomGrad">
        <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#ff6b00', stopOpacity: 1 }} />
      </radialGradient>
    </defs>
    {/* Camera lens */}
    <circle cx="100" cy="100" r="50" fill="none" stroke="url(#darkroomGrad)" strokeWidth="3" />
    <circle cx="100" cy="100" r="35" fill="none" stroke="url(#darkroomGrad)" strokeWidth="2" opacity="0.7" />
    <circle cx="100" cy="100" r="20" fill="url(#darkroomGrad)" opacity="0.5" />
    {/* Aperture blades */}
    <line x1="100" y1="50" x2="100" y2="80" stroke="url(#darkroomGrad)" strokeWidth="2" />
    <line x1="100" y1="120" x2="100" y2="150" stroke="url(#darkroomGrad)" strokeWidth="2" />
    <line x1="50" y1="100" x2="80" y2="100" stroke="url(#darkroomGrad)" strokeWidth="2" />
    <line x1="120" y1="100" x2="150" y2="100" stroke="url(#darkroomGrad)" strokeWidth="2" />
    {/* Geometric frame */}
    <rect x="40" y="40" width="120" height="120" fill="none" stroke="url(#darkroomGrad)" strokeWidth="2" opacity="0.4" />
  </svg>
);

export const CatwalkIcon = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="catwalkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#ff1493', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#00ffff', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Runway perspective */}
    <polygon points="100,30 140,80 160,150 40,150 60,80" fill="none" stroke="url(#catwalkGrad)" strokeWidth="3" />
    {/* Spotlight beams */}
    <line x1="70" y1="20" x2="80" y2="100" stroke="url(#catwalkGrad)" strokeWidth="2" opacity="0.6" />
    <line x1="130" y1="20" x2="120" y2="100" stroke="url(#catwalkGrad)" strokeWidth="2" opacity="0.6" />
    {/* Stage lights */}
    <circle cx="50" cy="15" r="8" fill="url(#catwalkGrad)" opacity="0.7" />
    <circle cx="150" cy="15" r="8" fill="url(#catwalkGrad)" opacity="0.7" />
    {/* Runway floor */}
    <line x1="40" y1="150" x2="160" y2="150" stroke="url(#catwalkGrad)" strokeWidth="3" />
    <line x1="45" y1="160" x2="155" y2="160" stroke="url(#catwalkGrad)" strokeWidth="1" opacity="0.5" />
  </svg>
);

export const RedCarpetIcon = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="redcarpetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#ff0000', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8b0000', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Red carpet */}
    <rect x="60" y="20" width="80" height="160" fill="url(#redcarpetGrad)" opacity="0.8" />
    {/* Gold trim */}
    <rect x="55" y="15" width="90" height="170" fill="none" stroke="#ffd700" strokeWidth="3" />
    {/* Decorative stars */}
    <polygon points="100,40 105,50 115,50 107,56 110,66 100,60 90,66 93,56 85,50 95,50" fill="#ffd700" />
    <polygon points="80,100 83,107 91,107 85,112 88,120 80,115 72,120 75,112 69,107 77,107" fill="#ffd700" opacity="0.7" />
    <polygon points="120,100 123,107 131,107 125,112 128,120 120,115 112,120 115,112 109,107 117,107" fill="#ffd700" opacity="0.7" />
    {/* Spotlight effect */}
    <circle cx="100" cy="30" r="15" fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.6" />
  </svg>
);

export const SupermodelVaultIcon = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#c0c0c0', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#696969', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Vault door */}
    <rect x="40" y="40" width="120" height="120" fill="url(#vaultGrad)" opacity="0.7" />
    {/* Vault ring */}
    <circle cx="100" cy="100" r="40" fill="none" stroke="#ffd700" strokeWidth="3" />
    {/* Combination dial */}
    <circle cx="100" cy="100" r="25" fill="none" stroke="#ffd700" strokeWidth="2" />
    <line x1="100" y1="75" x2="100" y2="85" stroke="#ffd700" strokeWidth="2" />
    {/* Security bolts */}
    <circle cx="50" cy="50" r="5" fill="#ffd700" />
    <circle cx="150" cy="50" r="5" fill="#ffd700" />
    <circle cx="50" cy="150" r="5" fill="#ffd700" />
    <circle cx="150" cy="150" r="5" fill="#ffd700" />
    {/* Prestige indicator */}
    <polygon points="100,120 110,135 90,135" fill="#ffd700" opacity="0.8" />
  </svg>
);

export const VanityIcon = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <defs>
      <linearGradient id="vanityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#ff69b4', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#ff1493', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    {/* Mirror frame */}
    <circle cx="100" cy="80" r="45" fill="none" stroke="url(#vanityGrad)" strokeWidth="3" />
    {/* Mirror reflection */}
    <circle cx="100" cy="80" r="38" fill="url(#vanityGrad)" opacity="0.2" />
    {/* Vanity lights */}
    <circle cx="65" cy="50" r="6" fill="url(#vanityGrad)" opacity="0.8" />
    <circle cx="100" cy="40" r="6" fill="url(#vanityGrad)" opacity="0.8" />
    <circle cx="135" cy="50" r="6" fill="url(#vanityGrad)" opacity="0.8" />
    {/* Makeup table */}
    <rect x="50" y="140" width="100" height="30" fill="none" stroke="url(#vanityGrad)" strokeWidth="2" />
    <line x1="70" y1="140" x2="70" y2="170" stroke="url(#vanityGrad)" strokeWidth="1" opacity="0.5" />
    <line x1="130" y1="140" x2="130" y2="170" stroke="url(#vanityGrad)" strokeWidth="1" opacity="0.5" />
    {/* Cosmetic bottles */}
    <circle cx="60" cy="155" r="4" fill="url(#vanityGrad)" opacity="0.7" />
    <circle cx="140" cy="155" r="4" fill="url(#vanityGrad)" opacity="0.7" />
  </svg>
);
