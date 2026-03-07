import { useEffect, useRef } from 'react';
import Header from '../Header';
import Footer from '../Footer';

export default function GalagaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80; // Account for header

    // Game variables
    let gameRunning = true;
    let score = 0;
    let level = 1;

    // Player
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 50,
      width: 30,
      height: 30,
      speed: 5,
      dx: 0,
    };

    // Bullets
    const bullets: Array<{ x: number; y: number; width: number; height: number }> = [];

    // Enemies
    const enemies: Array<{ x: number; y: number; width: number; height: number; dx: number; dy: number }> = [];
    let enemyDirection = 1;

    // Initialize enemies
    const initializeEnemies = () => {
      enemies.length = 0;
      const rows = 3 + level;
      const cols = 8;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          enemies.push({
            x: col * 50 + 30,
            y: row * 50 + 30,
            width: 30,
            height: 30,
            dx: 1,
            dy: 0,
          });
        }
      }
    };

    initializeEnemies();

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        bullets.push({
          x: player.x + player.width / 2 - 2,
          y: player.y,
          width: 4,
          height: 15,
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    const gameLoop = () => {
      if (!gameRunning) return;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update player
      if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
      else if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
      else player.dx = 0;

      player.x += player.dx;
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

      // Draw player
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Update and draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 7;
        if (bullets[i].y < 0) {
          bullets.splice(i, 1);
          continue;
        }
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
      }

      // Update and draw enemies
      let hitEdge = false;
      for (let enemy of enemies) {
        enemy.x += enemy.dx * 2;
        if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
          hitEdge = true;
        }
      }

      if (hitEdge) {
        enemyDirection *= -1;
        for (let enemy of enemies) {
          enemy.dx = enemyDirection;
          enemy.y += 30;
        }
      }

      // Draw enemies
      ctx.fillStyle = '#FF0000';
      for (let enemy of enemies) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
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
            score += 10;
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
          gameRunning = false;
        }
      }

      // Check if all enemies defeated
      if (enemies.length === 0) {
        level++;
        initializeEnemies();
      }

      // Draw score and level
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText(`Level: ${level}`, canvas.width - 150, 30);

      // Game over screen
      if (!gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '32px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 70);
        ctx.textAlign = 'left';
      }

      requestAnimationFrame(gameLoop);
    };

    // Handle restart
    const handleRestart = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        gameRunning = true;
        score = 0;
        level = 1;
        player.x = canvas.width / 2;
        bullets.length = 0;
        initializeEnemies();
      }
    };

    window.addEventListener('keydown', handleRestart);

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80;
    };

    window.addEventListener('resize', handleResize);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleRestart);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="pt-20 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-black"
        />
        <div className="absolute bottom-4 left-4 text-white text-sm font-mono">
          <p>Arrow Keys or A/D to Move</p>
          <p>Space to Shoot</p>
          <p>R to Restart</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
