import { useEffect, useRef, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';

interface HighScore {
  initials: string;
  score: number;
}

// SPRITE SHEET SPECIFICATIONS
// File: galaga_sprites.png (512 × 512)
// Grid: 32 × 32 cells
// Scale factor: 2.5 (renders at 80px)
// Rendering: nearest-neighbor, no smoothing, hard pixel edges

const SPRITE_CONFIG = {
  sheetWidth: 512,
  sheetHeight: 512,
  gridSize: 32,
  scaleFactor: 2.5,
  sprites: {
    playerShip: { atlasX: 0, atlasY: 0, width: 32, height: 32 },
    enemyTypeA: { atlasX: 32, atlasY: 0, width: 32, height: 32 },
    enemyTypeB: { atlasX: 64, atlasY: 0, width: 32, height: 32 },
    enemyTypeC: { atlasX: 96, atlasY: 0, width: 32, height: 32 },
    laser: { atlasX: 128, atlasY: 0, width: 8, height: 16 },
    explosion: [
      { atlasX: 0, atlasY: 64, width: 32, height: 32 },
      { atlasX: 32, atlasY: 64, width: 32, height: 32 },
      { atlasX: 64, atlasY: 64, width: 32, height: 32 },
      { atlasX: 96, atlasY: 64, width: 32, height: 32 },
    ],
  },
  explosionFrameDuration: 75,
};

// GAME FIELD SPECIFICATIONS
const GAME_FIELD = {
  width: 720,
  leftBoundary: 0,
  rightBoundary: 720,
  playerMinX: 40,
  playerMaxX: 680,
  playerY: 880,
  enemyTopBoundary: 40,
  enemyInvasionBoundary: 820,
};

// FORMATION SPECIFICATIONS
const FORMATION = {
  columns: 6,
  rows: 5,
  horizontalSpacing: 90,
  verticalSpacing: 70,
  startX: 100,
  startY: 80,
  driftSpeed: 1.8,
  shiftDown: 20,
};

// DIVE ATTACK SPECIFICATIONS
const DIVE_ATTACK = {
  selectionInterval: 180,
  controlPointOffsetX: 120,
  controlPointOffsetY: 200,
  endPointOffsetY: 40,
  speed: 5,
};

// SHOOTING SPECIFICATIONS
const SHOOTING = {
  playerFireRate: 200,
  maxPlayerBullets: 3,
  playerBulletSpeed: 14,
  enemyBulletSpeed: 8,
};

// COLLISION HITBOXES
const HITBOXES = {
  player: { width: 60, height: 50 },
  enemy: { width: 40, height: 40 },
  bullet: { width: 8, height: 16 },
};

// STARFIELD SPECIFICATIONS
const STARFIELD = {
  starCount: 150,
  layer1Speed: 0.3,
  layer2Speed: 0.8,
  minBrightness: 0.6,
  maxBrightness: 1.0,
};

export default function GalagaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showInitialsInput, setShowInitialsInput] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [initials, setInitials] = useState('');
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  // Load high scores from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('galagaHighScores');
    if (saved) {
      setHighScores(JSON.parse(saved));
    }
  }, []);

  // Save high scores to localStorage
  const saveHighScore = (newScore: HighScore) => {
    const updated = [...highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 10);
    setHighScores(updated);
    localStorage.setItem('galagaHighScores', JSON.stringify(updated));
    setShowInitialsInput(false);
  };

  // Create audio context for sound effects
  const createSound = (frequency: number, duration: number, type: 'sine' | 'square' = 'square') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      // Audio context not available
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size to match game field
    canvas.width = GAME_FIELD.width;
    canvas.height = 1000;

    // Enable nearest-neighbor rendering
    (ctx as any).imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    // Create sprite sheet canvas (placeholder - in production, load actual sprite sheet)
    const spriteSheet = document.createElement('canvas');
    spriteSheet.width = SPRITE_CONFIG.sheetWidth;
    spriteSheet.height = SPRITE_CONFIG.sheetHeight;
    const spriteCtx = spriteSheet.getContext('2d');
    if (!spriteCtx) return;

    // Draw placeholder sprites (in production, load actual sprite sheet image)
    spriteCtx.fillStyle = '#00FFFF';
    spriteCtx.fillRect(0, 0, 32, 32); // Player ship
    spriteCtx.fillStyle = '#FF0000';
    spriteCtx.fillRect(32, 0, 32, 32); // Enemy A
    spriteCtx.fillStyle = '#FF00FF';
    spriteCtx.fillRect(64, 0, 32, 32); // Enemy B
    spriteCtx.fillStyle = '#00FF00';
    spriteCtx.fillRect(96, 0, 32, 32); // Enemy C
    spriteCtx.fillStyle = '#FFFF00';
    spriteCtx.fillRect(128, 0, 8, 16); // Laser
    for (let i = 0; i < 4; i++) {
      spriteCtx.fillStyle = `rgba(255, 165, 0, ${1 - i * 0.2})`;
      spriteCtx.fillRect(i * 32, 64, 32, 32); // Explosion frames
    }

    // Game variables
    let gameRunning = true;
    let gameOver = false;
    let score = 0;
    let level = 1;
    let lives = 3;
    let lastShotTime = 0;
    let diveSelectionCounter = 0;
    let frameCount = 0;
    let currentEnemySpeed = 1.8;

    // Player
    const player = {
      x: GAME_FIELD.width / 2,
      y: GAME_FIELD.playerY,
      width: 60,
      height: 50,
    };

    // Bullets
    const playerBullets: Array<{ x: number; y: number; age: number }> = [];
    const enemyBullets: Array<{ x: number; y: number }> = [];

    // Enemies with formation
    interface Enemy {
      x: number;
      y: number;
      formationX: number;
      formationY: number;
      type: number;
      isDiving: boolean;
      diveProgress: number;
      diveStartX: number;
      diveStartY: number;
      diveControlX: number;
      diveControlY: number;
      diveEndX: number;
      diveEndY: number;
      explosionFrame: number;
      isExploding: boolean;
    }
    const enemies: Enemy[] = [];
    let formationX = FORMATION.startX;
    let formationY = FORMATION.startY;
    let formationDirection = 1;

    // Starfield
    const stars: Array<{ x: number; y: number; layer: number; brightness: number }> = [];
    for (let i = 0; i < STARFIELD.starCount; i++) {
      stars.push({
        x: Math.random() * GAME_FIELD.width,
        y: Math.random() * canvas.height,
        layer: Math.random() > 0.5 ? 1 : 2,
        brightness: STARFIELD.minBrightness + Math.random() * (STARFIELD.maxBrightness - STARFIELD.minBrightness),
      });
    }

    // Draw sprite from atlas
    const drawSprite = (sprite: any, x: number, y: number, scale: number = 1) => {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        spriteSheet,
        sprite.atlasX,
        sprite.atlasY,
        sprite.width,
        sprite.height,
        x,
        y,
        sprite.width * scale,
        sprite.height * scale
      );
      ctx.restore();
    };

    // Initialize enemies in formation
    const initializeEnemies = () => {
      enemies.length = 0;
      const rows = Math.min(FORMATION.rows, 3 + Math.floor(level / 2));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < FORMATION.columns; col++) {
          const formX = FORMATION.startX + col * FORMATION.horizontalSpacing;
          const formY = FORMATION.startY + row * FORMATION.verticalSpacing;
          enemies.push({
            x: formX,
            y: formY,
            formationX: formX,
            formationY: formY,
            type: (row * FORMATION.columns + col) % 3,
            isDiving: false,
            diveProgress: 0,
            diveStartX: 0,
            diveStartY: 0,
            diveControlX: 0,
            diveControlY: 0,
            diveEndX: 0,
            diveEndY: 0,
            explosionFrame: 0,
            isExploding: false,
          });
        }
      }
      currentEnemySpeed = 1.8 + (level - 1) * 0.3;
      currentEnemySpeed = Math.min(currentEnemySpeed, 5);
    };

    initializeEnemies();

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        if (gameRunning && playerBullets.length < SHOOTING.maxPlayerBullets) {
          const now = Date.now();
          if (now - lastShotTime > SHOOTING.playerFireRate) {
            playerBullets.push({
              x: player.x + player.width / 2,
              y: player.y,
              age: 0,
            });
            createSound(800, 0.1, 'square');
            lastShotTime = now;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    canvas.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Bezier curve calculation for dive attacks
    const bezierPoint = (t: number, p0: number, p1: number, p2: number): number => {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    };

    // Game loop
    let lastTime = Date.now();
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starfield with parallax
      ctx.fillStyle = '#FFFFFF';
      for (const star of stars) {
        const speed = star.layer === 1 ? STARFIELD.layer1Speed : STARFIELD.layer2Speed;
        const offsetY = (frameCount * speed) % canvas.height;
        ctx.globalAlpha = star.brightness;
        ctx.fillRect(star.x, (star.y + offsetY) % canvas.height, 1, 1);
      }
      ctx.globalAlpha = 1;

      if (gameRunning && !gameOver) {
        // Update player position
        if (keys['arrowleft'] || keys['a']) {
          player.x = Math.max(GAME_FIELD.playerMinX, player.x - 6);
        }
        if (keys['arrowright'] || keys['d']) {
          player.x = Math.min(GAME_FIELD.playerMaxX, player.x + 6);
        }

        // Draw player
        drawSprite(SPRITE_CONFIG.sprites.playerShip, player.x - player.width / 2, player.y - player.height / 2, 1);

        // Update and draw player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
          playerBullets[i].y -= SHOOTING.playerBulletSpeed;
          playerBullets[i].age++;
          if (playerBullets[i].y < GAME_FIELD.enemyTopBoundary) {
            playerBullets.splice(i, 1);
            continue;
          }
          drawSprite(SPRITE_CONFIG.sprites.laser, playerBullets[i].x - 4, playerBullets[i].y, 1);
        }

        // Update and draw enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          enemyBullets[i].y += SHOOTING.enemyBulletSpeed;
          if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
          }
        }

        // Update formation
        frameCount++;
        diveSelectionCounter++;
        formationX += formationDirection * currentEnemySpeed;

        let hitEdge = false;
        for (const enemy of enemies) {
          if (!enemy.isDiving && !enemy.isExploding) {
            enemy.formationX = formationX + (enemy.formationX - FORMATION.startX);
            enemy.x = enemy.formationX;
            enemy.y = formationY + (enemy.formationY - FORMATION.startY);

            if (enemy.x < GAME_FIELD.leftBoundary || enemy.x + HITBOXES.enemy.width > GAME_FIELD.rightBoundary) {
              hitEdge = true;
            }
          }
        }

        if (hitEdge) {
          formationDirection *= -1;
          formationY += FORMATION.shiftDown;
        }

        // Dive attack logic
        if (diveSelectionCounter >= DIVE_ATTACK.selectionInterval && enemies.length > 0) {
          const topRowEnemies = enemies.filter((e) => !e.isDiving && !e.isExploding && e.formationY <= FORMATION.startY + FORMATION.verticalSpacing);
          if (topRowEnemies.length > 0) {
            const diveEnemy = topRowEnemies[Math.floor(Math.random() * topRowEnemies.length)];
            diveEnemy.isDiving = true;
            diveEnemy.diveProgress = 0;
            diveEnemy.diveStartX = diveEnemy.x;
            diveEnemy.diveStartY = diveEnemy.y;
            diveEnemy.diveControlX = player.x + (Math.random() > 0.5 ? 1 : -1) * DIVE_ATTACK.controlPointOffsetX;
            diveEnemy.diveControlY = player.y - DIVE_ATTACK.controlPointOffsetY;
            diveEnemy.diveEndX = player.x;
            diveEnemy.diveEndY = player.y - DIVE_ATTACK.endPointOffsetY;
          }
          diveSelectionCounter = 0;
        }

        // Update diving enemies
        for (const enemy of enemies) {
          if (enemy.isDiving) {
            enemy.diveProgress += DIVE_ATTACK.speed / 100;
            if (enemy.diveProgress >= 1) {
              enemy.isDiving = false;
              enemy.diveProgress = 0;
            } else {
              enemy.x = bezierPoint(enemy.diveProgress, enemy.diveStartX, enemy.diveControlX, enemy.diveEndX);
              enemy.y = bezierPoint(enemy.diveProgress, enemy.diveStartY, enemy.diveControlY, enemy.diveEndY);

              // Random enemy fire during dive
              if (Math.random() < 0.02) {
                enemyBullets.push({ x: enemy.x + HITBOXES.enemy.width / 2, y: enemy.y + HITBOXES.enemy.height });
              }
            }

            // Check invasion boundary
            if (enemy.y > GAME_FIELD.enemyInvasionBoundary) {
              lives--;
              createSound(200, 0.3, 'sine');
              if (lives <= 0) {
                gameOver = true;
                gameRunning = false;
                setFinalScore(score);
                setShowInitialsInput(true);
              }
              enemy.isDiving = false;
            }
          }
        }

        // Draw enemies
        for (const enemy of enemies) {
          if (!enemy.isExploding) {
            const spriteTypes = [SPRITE_CONFIG.sprites.enemyTypeA, SPRITE_CONFIG.sprites.enemyTypeB, SPRITE_CONFIG.sprites.enemyTypeC];
            drawSprite(spriteTypes[enemy.type], enemy.x - HITBOXES.enemy.width / 2, enemy.y - HITBOXES.enemy.height / 2, 1);
          } else {
            if (enemy.explosionFrame < SPRITE_CONFIG.sprites.explosion.length) {
              drawSprite(SPRITE_CONFIG.sprites.explosion[enemy.explosionFrame], enemy.x - 16, enemy.y - 16, 1);
              enemy.explosionFrame++;
            } else {
              enemy.isExploding = false;
            }
          }
        }

        // Collision detection - player bullets and enemies
        for (let i = playerBullets.length - 1; i >= 0; i--) {
          for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = playerBullets[i];
            const enemy = enemies[j];
            if (
              !enemy.isExploding &&
              bullet.x > enemy.x - HITBOXES.enemy.width / 2 &&
              bullet.x < enemy.x + HITBOXES.enemy.width / 2 &&
              bullet.y > enemy.y - HITBOXES.enemy.height / 2 &&
              bullet.y < enemy.y + HITBOXES.enemy.height / 2
            ) {
              playerBullets.splice(i, 1);
              enemy.isExploding = true;
              enemy.explosionFrame = 0;
              enemy.isDiving = false;
              score += 50 + level * 10;
              createSound(1200, 0.15, 'sine');
              break;
            }
          }
        }

        // Collision detection - enemy bullets and player
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
          const bullet = enemyBullets[i];
          if (
            bullet.x > player.x - player.width / 2 &&
            bullet.x < player.x + player.width / 2 &&
            bullet.y > player.y - player.height / 2 &&
            bullet.y < player.y + player.height / 2
          ) {
            enemyBullets.splice(i, 1);
            lives--;
            createSound(200, 0.3, 'sine');
            if (lives <= 0) {
              gameOver = true;
              gameRunning = false;
              setFinalScore(score);
              setShowInitialsInput(true);
            }
            break;
          }
        }

        // Remove finished explosions
        for (let i = enemies.length - 1; i >= 0; i--) {
          if (enemies[i].isExploding && enemies[i].explosionFrame >= SPRITE_CONFIG.sprites.explosion.length) {
            enemies.splice(i, 1);
          }
        }

        // Check if all enemies defeated
        if (enemies.filter((e) => !e.isExploding).length === 0 && enemies.length === 0) {
          level++;
          initializeEnemies();
          formationX = FORMATION.startX;
          formationY = FORMATION.startY;
          formationDirection = 1;
          createSound(400, 0.2, 'sine');
          createSound(600, 0.2, 'sine');
        }
      }

      // Draw HUD
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, canvas.width / 2, 30);

      ctx.textAlign = 'left';
      ctx.fillText(`LEVEL: ${level}`, 20, 30);

      ctx.textAlign = 'right';
      ctx.fillText(`LIVES: ${lives}`, canvas.width - 20, 30);

      // Draw high scores
      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = '#00FF00';
      ctx.textAlign = 'right';
      ctx.fillText('HIGH SCORES:', canvas.width - 20, 50);
      for (let i = 0; i < Math.min(3, highScores.length); i++) {
        ctx.fillText(`${i + 1}. ${highScores[i].initials} ${highScores[i].score}`, canvas.width - 20, 70 + i * 16);
      }

      // Game over screen
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

        ctx.font = '32px "Courier New", monospace';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2);

        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#00FF00';
        ctx.fillText('ENTER YOUR INITIALS', canvas.width / 2, canvas.height / 2 + 60);
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      canvas.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [highScores]);

  const handleInitialsSubmit = () => {
    if (initials.length === 3) {
      saveHighScore({
        initials: initials.toUpperCase(),
        score: finalScore,
      });
      setInitials('');
      window.location.reload();
    }
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="pt-20 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-black relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="bg-black"
            style={{ imageRendering: 'pixelated', imageRendering: 'crisp-edges' } as any}
          />
        </div>

        {showInitialsInput && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="bg-black border-4 border-cyan-400 p-8 text-center">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4 font-mono">NEW HIGH SCORE!</h2>
              <p className="text-yellow-400 mb-6 font-mono text-lg">Score: {finalScore}</p>
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                placeholder="ABC"
                className="bg-black border-2 border-yellow-400 text-yellow-400 text-center text-2xl font-mono px-4 py-2 mb-4 w-24"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleInitialsSubmit()}
              />
              <button
                onClick={handleInitialsSubmit}
                disabled={initials.length !== 3}
                className="block w-full mt-4 bg-cyan-400 text-black font-bold py-2 px-4 font-mono disabled:opacity-50"
              >
                SUBMIT
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 text-cyan-400 text-sm font-mono">
          <p>Arrow Keys or A/D to Move</p>
          <p>SPACE to Shoot</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
