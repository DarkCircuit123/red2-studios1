import { useEffect, useRef, useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';

interface HighScore {
  initials: string;
  score: number;
}

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;

    // Game variables
    let gameRunning = true;
    let gameOver = false;
    let score = 0;
    let level = 1;
    let lives = 3;
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height - 50;
    let canShoot = true;
    let shootCooldown = 0;

    // Player (Galaga-style ship)
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 50,
      width: 20,
      height: 24,
      speed: 6,
    };

    // Bullets
    const bullets: Array<{ x: number; y: number; width: number; height: number; age: number }> = [];

    // Enemies (Galaga-style)
    const enemies: Array<{ x: number; y: number; width: number; height: number; dx: number; dy: number; wave: number; wobble: number }> = [];
    let enemyDirection = 1;
    let waveCounter = 0;

    // Draw Galaga-style player ship
    const drawPlayer = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x + player.width / 2, y + player.height / 2);

      // Main body - cyan/blue like original
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(-8, 8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-4, 12);
      ctx.lineTo(4, 12);
      ctx.lineTo(4, 8);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(-2, -6, 4, 4);

      ctx.restore();
    };

    // Draw Galaga-style enemy
    const drawEnemy = (x: number, y: number, type: number = 0) => {
      ctx.save();
      ctx.translate(x + 12, y + 12);

      if (type === 0) {
        // Red enemy
        ctx.fillStyle = '#FF0000';
      } else if (type === 1) {
        // Purple enemy
        ctx.fillStyle = '#FF00FF';
      } else {
        // Green enemy
        ctx.fillStyle = '#00FF00';
      }

      // Enemy body - classic Galaga bug shape
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, -4);
      ctx.lineTo(8, 0);
      ctx.lineTo(8, 6);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-4, -4, 2, 2);
      ctx.fillRect(2, -4, 2, 2);

      ctx.restore();
    };

    // Draw bullet
    const drawBullet = (x: number, y: number) => {
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(x - 1, y, 2, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x - 1, y, 2, 2);
    };

    // Initialize enemies
    const initializeEnemies = () => {
      enemies.length = 0;
      const rows = Math.min(3 + Math.floor(level / 2), 5);
      const cols = 8;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          enemies.push({
            x: col * 60 + 40,
            y: row * 50 + 40,
            width: 24,
            height: 24,
            dx: 1,
            dy: 0,
            wave: 0,
            wobble: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initializeEnemies();

    // Mouse controls
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      // Clamp to canvas
      mouseX = Math.max(0, Math.min(mouseX, canvas.width));
      mouseY = Math.max(0, Math.min(mouseY, canvas.height));
    };

    const handleMouseClick = () => {
      if (gameRunning && canShoot && shootCooldown <= 0) {
        bullets.push({
          x: player.x + player.width / 2,
          y: player.y,
          width: 2,
          height: 8,
          age: 0,
        });
        createSound(800, 0.1, 'square');
        shootCooldown = 8;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);

    // Game loop
    const gameLoop = () => {
      // Clear canvas with starfield effect
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 100; i++) {
        const x = (i * 73 + waveCounter * 0.5) % canvas.width;
        const y = (i * 137) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;

      if (gameRunning && !gameOver) {
        // Update player position to follow mouse
        player.x = mouseX - player.width / 2;
        player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
        player.y = mouseY - player.height / 2;
        player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));

        // Draw player
        drawPlayer(player.x, player.y);

        // Update and draw bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          bullets[i].y -= 8;
          bullets[i].age++;
          if (bullets[i].y < 0 || bullets[i].age > 100) {
            bullets.splice(i, 1);
            continue;
          }
          drawBullet(bullets[i].x, bullets[i].y);
        }

        // Update and draw enemies
        waveCounter++;
        let hitEdge = false;

        for (let enemy of enemies) {
          enemy.wobble += 0.05;
          enemy.x += enemy.dx * 1.5;
          enemy.y += Math.sin(enemy.wobble) * 0.3;

          if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
            hitEdge = true;
          }
        }

        if (hitEdge) {
          enemyDirection *= -1;
          for (let enemy of enemies) {
            enemy.dx = enemyDirection;
            enemy.y += 40;
          }
        }

        // Draw enemies
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          drawEnemy(enemy.x, enemy.y, i % 3);
        }

        // Collision detection - bullets and enemies
        for (let i = bullets.length - 1; i >= 0; i--) {
          for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];
            if (
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y
            ) {
              bullets.splice(i, 1);
              enemies.splice(j, 1);
              score += 50 + level * 10;
              createSound(1200, 0.15, 'sine');
              break;
            }
          }
        }

        // Collision detection - enemies and player
        for (let enemy of enemies) {
          if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
          ) {
            lives--;
            createSound(200, 0.3, 'sine');
            if (lives <= 0) {
              gameOver = true;
              gameRunning = false;
              setFinalScore(score);
              setShowInitialsInput(true);
            } else {
              // Reset player position
              player.x = canvas.width / 2;
              player.y = canvas.height - 50;
            }
          }
        }

        // Check if all enemies defeated
        if (enemies.length === 0) {
          level++;
          initializeEnemies();
          createSound(400, 0.2, 'sine');
          createSound(600, 0.2, 'sine');
        }

        shootCooldown--;
      }

      // Draw UI
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, 20, 30);
      ctx.fillText(`LEVEL: ${level}`, 20, 50);
      ctx.fillText(`LIVES: ${lives}`, canvas.width - 150, 30);

      // Draw high scores in corner
      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = '#00FF00';
      ctx.fillText('HIGH SCORES:', canvas.width - 150, 60);
      for (let i = 0; i < Math.min(3, highScores.length); i++) {
        ctx.fillText(`${i + 1}. ${highScores[i].initials} ${highScores[i].score}`, canvas.width - 150, 80 + i * 16);
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

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80;
    };

    window.addEventListener('resize', handleResize);

    gameLoop();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleMouseClick);
      window.removeEventListener('resize', handleResize);
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
      <div className="pt-20 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-black relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-black cursor-crosshair"
        />

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
          <p>Move Mouse to Control Ship</p>
          <p>Click to Shoot</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
