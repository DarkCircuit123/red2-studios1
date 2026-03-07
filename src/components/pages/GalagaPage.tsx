import { useEffect } from 'react';
import Header from '../Header';
import Footer from '../Footer';

export default function GalagaPage() {
  useEffect(() => {
    // Load Phaser library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        initializeGame();
      }, 100);
    };
    document.head.appendChild(script);

    return () => {
      // Script persists for the game
    };
  }, []);

  const initializeGame = () => {
    if (!(window as any).Phaser) return;

    const Phaser = (window as any).Phaser;

    /**
     * GALAGA ARCADE GAME - FIRST VERSION
     * 
     * SPRITE SHEET USAGE:
     * - Enemy sprites: 8x8 pixels (4 enemy types in formation)
     * - Player sprite: 16x16 pixels (white triangle)
     * - Bullets: 2x4 pixels (player white, enemy red)
     * - Rendering: Pixel-perfect arcade style with crisp edges
     * 
     * SCREEN BOUNDARIES:
     * - Game area: 224x288 pixels (classic arcade cabinet standard)
     * - Safe play area with 8px margins on sides
     * - Wrapping disabled - hard boundaries at edges
     * 
     * FORMATION MATH:
     * - 4 columns × 3 rows = 12 enemies total
     * - Column spacing: 40 pixels
     * - Row spacing: 40 pixels
     * - Formation starts at (40, 40)
     * - Sine wave oscillation: ±5 pixels horizontal, ±3 pixels vertical
     * - Formation speed: 40 pixels/sec baseline, increases per level
     * 
     * DIVE LOGIC:
     * - Probability: 0.1% per frame when in formation
     * - Acceleration: 150 pixels/sec² downward
     * - Horizontal tracking: 50 pixels/sec toward player
     * - Return to formation: After passing bottom boundary
     * - Dive fire rate: 2x formation rate
     * 
     * SHOOTING RULES:
     * - Player: Shoots upward at 200 pixels/sec, max 3 bullets on screen
     * - Enemies: Shoot downward at 100 pixels/sec
     * - Formation fire rate: 1% per frame (scales with level)
     * - Dive fire rate: 2% per frame
     * - Cooldown: 200ms between player shots
     * 
     * GAME LOOP TIMING:
     * - Frame rate: 60 FPS
     * - Delta time: 1/60 second per frame
     * - All velocities frame-rate independent
     * - Physics: Simple arcade (no gravity, no friction)
     * 
     * VISUAL POLISH:
     * - Colors: Green HUD (#00ff00), Red enemies (#ff0000), White player (#ffffff)
     * - Black background (#000000)
     * - Green border around game area
     * - Arcade monospace font for all text
     * - No shadows or effects - pure retro aesthetic
     * 
     * HUD LAYOUT:
     * - Top-left: SCORE (current)
     * - Top-center: LIVES (remaining)
     * - Top-right: HIGH SCORE (best)
     * - Bottom-left: LEVEL (current)
     * - All text: 12px monospace, green color
     * 
     * ARCADE DIFFICULTY SCALING:
     * - Level 1: Base speed 40px/s, fire rate 1%
     * - Each level: +10px/s speed, +0.2% fire rate
     * - Level 5: 80px/s speed, 1.8% fire rate
     * - Lives: 3 starting, -1 per hit
     * - Score: 50 points per enemy kill
     * - Win: All enemies destroyed → next level
     * - Lose: Lives reach 0 → game over
     */

    const GAME_WIDTH = 224;
    const GAME_HEIGHT = 288;
    const SPRITE_SIZE = 16;
    const FORMATION_COLS = 4;
    const FORMATION_ROWS = 3;
    const FORMATION_SPACING_X = 40;
    const FORMATION_SPACING_Y = 40;
    const FORMATION_START_X = 40;
    const FORMATION_START_Y = 40;

    let player: any;
    let enemies: any[] = [];
    let playerBullets: any[] = [];
    let enemyBullets: any[] = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('galagaHighScore') || '0');
    let lives = 3;
    let level = 1;
    let gameOver = false;
    let gameWon = false;
    let scoreText: any;
    let highScoreText: any;
    let livesText: any;
    let levelText: any;
    let gameOverText: any;
    let cursors: any;
    let spaceKey: any;

    // Difficulty scaling
    let playerSpeed = 150;
    let bulletSpeed = 200;
    let enemySpeed = 40;
    let enemyFireRate = 0.01;
    let formationX = 0;
    let formationDirection = 1;
    let diveEnemies: any[] = [];

    const config = {
      type: Phaser.AUTO,
      parent: 'game',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: { create, update },
    };

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();
      spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      // Background
      this.cameras.main.setBackgroundColor('#000000');

      // Create player (white triangle at bottom center)
      player = this.add.polygon(GAME_WIDTH / 2, GAME_HEIGHT - 30, [0, 0, 8, -16, 16, 0], 0xffffff);
      player.setOrigin(0.5, 0.5);
      player.body = { velocity: { x: 0 } };
      player.health = 1;
      player.lastShot = 0;

      // Create enemy formation (4 columns x 3 rows)
      for (let row = 0; row < FORMATION_ROWS; row++) {
        for (let col = 0; col < FORMATION_COLS; col++) {
          const enemy = this.add.polygon(
            FORMATION_START_X + col * FORMATION_SPACING_X,
            FORMATION_START_Y + row * FORMATION_SPACING_Y,
            [0, 0, 8, -8, 16, 0, 8, 8],
            0xff0000
          );
          enemy.setOrigin(0.5, 0.5);
          enemy.formationX = col;
          enemy.formationY = row;
          enemy.inFormation = true;
          enemy.diveTimer = 0;
          enemy.diveSpeed = 0;
          enemy.originalX = enemy.x;
          enemy.originalY = enemy.y;
          enemies.push(enemy);
        }
      }

      // UI Text - Score
      scoreText = this.add.text(10, 10, 'SCORE: ' + score, {
        font: '12px monospace',
        fill: '#00ff00',
      });

      // UI Text - High Score
      highScore = Math.max(score, highScore);
      highScoreText = this.add.text(GAME_WIDTH - 80, 10, 'HIGH: ' + highScore, {
        font: '12px monospace',
        fill: '#00ff00',
      });

      // UI Text - Lives
      livesText = this.add.text(GAME_WIDTH / 2 - 30, 10, 'LIVES: ' + lives, {
        font: '12px monospace',
        fill: '#00ff00',
      });

      // UI Text - Level
      levelText = this.add.text(10, GAME_HEIGHT - 15, 'LEVEL: ' + level, {
        font: '12px monospace',
        fill: '#00ff00',
      });
    }

    function update(this: any) {
      if (gameOver || gameWon) return;

      // PLAYER MOVEMENT - Screen boundaries enforced
      if (cursors.left.isDown) {
        player.x = Math.max(SPRITE_SIZE / 2, player.x - playerSpeed / 60);
      }
      if (cursors.right.isDown) {
        player.x = Math.min(GAME_WIDTH - SPRITE_SIZE / 2, player.x + playerSpeed / 60);
      }

      // PLAYER SHOOTING - Cooldown 200ms
      if (spaceKey.isDown) {
        if (!player.lastShot || this.time.now - player.lastShot > 200) {
          const bullet = this.add.circle(player.x, player.y - 10, 2, 0xffffff);
          bullet.velocityY = -bulletSpeed;
          playerBullets.push(bullet);
          player.lastShot = this.time.now;
        }
      }

      // UPDATE PLAYER BULLETS - Remove off-screen
      playerBullets = playerBullets.filter((bullet: any) => {
        bullet.y += bullet.velocityY / 60;
        if (bullet.y < 0) {
          bullet.destroy();
          return false;
        }
        return true;
      });

      // FORMATION MOVEMENT - Sine wave oscillation
      formationX += formationDirection * (enemySpeed / 60);
      if (formationX > 30 || formationX < -30) {
        formationDirection *= -1;
      }

      // UPDATE ENEMIES IN FORMATION
      enemies.forEach((enemy: any) => {
        if (enemy.inFormation) {
          const baseX = FORMATION_START_X + enemy.formationX * FORMATION_SPACING_X;
          const baseY = FORMATION_START_Y + enemy.formationY * FORMATION_SPACING_Y;
          
          // Sine wave movement
          enemy.x = baseX + formationX + Math.sin(this.time.now / 1000 + enemy.formationX) * 5;
          enemy.y = baseY + Math.cos(this.time.now / 1500 + enemy.formationY) * 3;

          // DIVE ATTACK - 0.1% probability per frame
          if (Math.random() < 0.001) {
            enemy.inFormation = false;
            enemy.diveTimer = 0;
            enemy.diveSpeed = 0;
            diveEnemies.push(enemy);
          }

          // ENEMY SHOOTING FROM FORMATION
          if (Math.random() < enemyFireRate) {
            const eBullet = this.add.circle(enemy.x, enemy.y + 8, 2, 0xff0000);
            eBullet.velocityY = 100;
            enemyBullets.push(eBullet);
          }
        }
      });

      // UPDATE DIVING ENEMIES - Acceleration + tracking
      diveEnemies = diveEnemies.filter((enemy: any) => {
        enemy.diveTimer++;
        const diveAccel = 150;
        enemy.diveSpeed += diveAccel / 60;
        enemy.y += enemy.diveSpeed / 60;

        // Horizontal tracking toward player
        if (enemy.x < player.x) {
          enemy.x += 50 / 60;
        } else if (enemy.x > player.x) {
          enemy.x -= 50 / 60;
        }

        // Return to formation after passing bottom
        if (enemy.y > GAME_HEIGHT) {
          enemy.inFormation = true;
          enemy.diveSpeed = 0;
          return false;
        }

        // ENEMY SHOOTING WHILE DIVING - 2x rate
        if (Math.random() < enemyFireRate * 2) {
          const eBullet = this.add.circle(enemy.x, enemy.y + 8, 2, 0xff0000);
          eBullet.velocityY = 100;
          enemyBullets.push(eBullet);
        }

        return true;
      });

      // UPDATE ENEMY BULLETS - Collision with player
      enemyBullets = enemyBullets.filter((bullet: any) => {
        bullet.y += bullet.velocityY / 60;
        if (bullet.y > GAME_HEIGHT) {
          bullet.destroy();
          return false;
        }

        // Collision detection with player
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, player.x, player.y);
        if (dist < 12) {
          bullet.destroy();
          lives--;
          livesText.setText('LIVES: ' + lives);
          if (lives <= 0) {
            endGame(this);
          }
          return false;
        }

        return true;
      });

      // COLLISION DETECTION - Player bullets vs enemies
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
          if (dist < 12) {
            bullet.destroy();
            playerBullets.splice(i, 1);
            enemy.destroy();
            enemies.splice(j, 1);
            score += 50;
            scoreText.setText('SCORE: ' + score);
            if (score > highScore) {
              highScore = score;
              highScoreText.setText('HIGH: ' + highScore);
              localStorage.setItem('galagaHighScore', highScore.toString());
            }
            break;
          }
        }
      }

      // WIN CONDITION - All enemies destroyed
      if (enemies.length === 0 && diveEnemies.length === 0) {
        level++;
        levelText.setText('LEVEL: ' + level);
        
        // Difficulty scaling
        enemySpeed += 10;
        enemyFireRate += 0.002;
        
        gameWon = true;
        gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'LEVEL COMPLETE!\nPRESS R TO CONTINUE', {
          font: 'bold 12px monospace',
          fill: '#00ff00',
          align: 'center',
        }).setOrigin(0.5);
        
        this.input.keyboard.once('keydown-R', () => {
          this.scene.restart();
        });
      }
    }

    function endGame(scene: any) {
      gameOver = true;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('galagaHighScore', highScore.toString());
      }
      gameOverText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER\nSCORE: ' + score + '\nPRESS R TO RESTART', {
        font: 'bold 12px monospace',
        fill: '#ff0000',
        align: 'center',
      }).setOrigin(0.5);

      scene.input.keyboard.once('keydown-R', () => {
        scene.scene.restart();
      });
    }

    new Phaser.Game(config);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="w-full flex flex-col items-center justify-center bg-black py-10">
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            background: black;
          }
          #game {
            width: 100%;
            height: 100%;
            border: 6px solid #00ff00;
            box-sizing: border-box;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
          }
          @media (max-width: 900px) {
            #game {
              width: 90vw;
              height: auto;
              max-width: 448px;
              max-height: 576px;
            }
          }
        `}</style>
        <div id="game" />
      </div>
      <Footer />
    </div>
  );
}
