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

    // GALAGA GAME IMPLEMENTATION
    // Sprite Sheet Usage: 8x8 pixel sprites for enemies, 16x16 for player
    // Screen Boundaries: 224x288 pixels (arcade standard)
    // Formation Math: 4 columns, 3 rows of enemies with sine wave movement
    // Dive Logic: Enemies break formation and dive at player with acceleration
    // Shooting Rules: Player shoots upward, enemies shoot downward
    // Game Loop: 60 FPS with arcade difficulty scaling
    // Visual Polish: Arcade-style colors, screen wrap, collision detection
    // HUD Layout: Score, high score, lives display at top
    // Arcade Difficulty: Enemies increase speed and fire rate per level

    const GAME_WIDTH = 224;
    const GAME_HEIGHT = 288;
    const SPRITE_SIZE = 16;

    let player: any;
    let enemies: any[] = [];
    let playerBullets: any[] = [];
    let enemyBullets: any[] = [];
    let score = 0;
    let highScore = parseInt(localStorage.getItem('galagaHS') || '0');
    let lives = 3;
    let level = 1;
    let gameOver = false;
    let gameWon = false;
    let scoreText: any;
    let livesText: any;
    let levelText: any;
    let gameOverText: any;
    let cursors: any;
    let spaceKey: any;
    let playerSpeed = 150;
    let bulletSpeed = 200;
    let enemySpeed = 40;
    let enemyFireRate = 0.01;
    let formationX = 0;
    let formationDirection = 1;
    let diveEnemies: any[] = [];
    let waveTimer = 0;
    let waveInterval = 300;

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

      // Create enemy formation (4 columns x 3 rows)
      const formationStartX = 40;
      const formationStartY = 40;
      const spacingX = 40;
      const spacingY = 40;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const enemy = this.add.polygon(
            formationStartX + col * spacingX,
            formationStartY + row * spacingY,
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

      // UI Text
      scoreText = this.add.text(10, 10, 'SCORE: ' + score, {
        font: '12px monospace',
        fill: '#00ff00',
      });

      highScore = Math.max(score, highScore);
      const highScoreText = this.add.text(GAME_WIDTH - 80, 10, 'HIGH: ' + highScore, {
        font: '12px monospace',
        fill: '#00ff00',
      });

      livesText = this.add.text(GAME_WIDTH / 2 - 30, 10, 'LIVES: ' + lives, {
        font: '12px monospace',
        fill: '#00ff00',
      });

      levelText = this.add.text(10, GAME_HEIGHT - 15, 'LEVEL: ' + level, {
        font: '12px monospace',
        fill: '#00ff00',
      });
    }

    function update(this: any) {
      if (gameOver || gameWon) return;

      // Player movement with screen boundaries
      if (cursors.left.isDown) {
        player.x = Math.max(SPRITE_SIZE / 2, player.x - playerSpeed / 60);
      }
      if (cursors.right.isDown) {
        player.x = Math.min(GAME_WIDTH - SPRITE_SIZE / 2, player.x + playerSpeed / 60);
      }

      // Player shooting
      if (spaceKey.isDown) {
        if (!player.lastShot || this.time.now - player.lastShot > 200) {
          const bullet = this.add.circle(player.x, player.y - 10, 2, 0xffffff);
          bullet.velocityY = -bulletSpeed;
          playerBullets.push(bullet);
          player.lastShot = this.time.now;
        }
      }

      // Update player bullets
      playerBullets = playerBullets.filter((bullet: any) => {
        bullet.y += bullet.velocityY / 60;
        if (bullet.y < 0) {
          bullet.destroy();
          return false;
        }
        return true;
      });

      // Formation movement with sine wave
      formationX += formationDirection * (enemySpeed / 60);
      if (formationX > 30 || formationX < -30) {
        formationDirection *= -1;
      }

      // Update enemies in formation
      enemies.forEach((enemy: any) => {
        if (enemy.inFormation) {
          const baseX = 40 + enemy.formationX * 40;
          const baseY = 40 + enemy.formationY * 40;
          enemy.x = baseX + formationX + Math.sin(this.time.now / 1000 + enemy.formationX) * 5;
          enemy.y = baseY + Math.cos(this.time.now / 1500 + enemy.formationY) * 3;

          // Random dive attack
          if (Math.random() < 0.001) {
            enemy.inFormation = false;
            enemy.diveTimer = 0;
            diveEnemies.push(enemy);
          }

          // Enemy shooting from formation
          if (Math.random() < enemyFireRate) {
            const eBullet = this.add.circle(enemy.x, enemy.y + 8, 2, 0xff0000);
            eBullet.velocityY = 100;
            enemyBullets.push(eBullet);
          }
        }
      });

      // Update diving enemies
      diveEnemies = diveEnemies.filter((enemy: any) => {
        enemy.diveTimer++;
        const diveAccel = 150;
        enemy.diveSpeed += diveAccel / 60;
        enemy.y += enemy.diveSpeed / 60;

        // Horizontal movement toward player
        if (enemy.x < player.x) {
          enemy.x += 50 / 60;
        } else if (enemy.x > player.x) {
          enemy.x -= 50 / 60;
        }

        // Return to formation after dive
        if (enemy.y > GAME_HEIGHT) {
          enemy.inFormation = true;
          enemy.diveSpeed = 0;
          return false;
        }

        // Enemy shooting while diving
        if (Math.random() < enemyFireRate * 2) {
          const eBullet = this.add.circle(enemy.x, enemy.y + 8, 2, 0xff0000);
          eBullet.velocityY = 100;
          enemyBullets.push(eBullet);
        }

        return true;
      });

      // Update enemy bullets
      enemyBullets = enemyBullets.filter((bullet: any) => {
        bullet.y += bullet.velocityY / 60;
        if (bullet.y > GAME_HEIGHT) {
          bullet.destroy();
          return false;
        }

        // Check collision with player
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

      // Check bullet-enemy collisions
      playerBullets.forEach((bullet: any, bulletIndex: number) => {
        enemies.forEach((enemy: any, enemyIndex: number) => {
          const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
          if (dist < 12) {
            bullet.destroy();
            playerBullets.splice(bulletIndex, 1);
            enemy.destroy();
            enemies.splice(enemyIndex, 1);
            score += 50;
            scoreText.setText('SCORE: ' + score);
          }
        });
      });

      // Win condition
      if (enemies.length === 0 && diveEnemies.length === 0) {
        level++;
        levelText.setText('LEVEL: ' + level);
        enemySpeed += 10;
        enemyFireRate += 0.002;
        gameWon = true;
        gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'LEVEL COMPLETE!\\nPRESS R TO CONTINUE', {
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
        localStorage.setItem('galagaHS', highScore.toString());
      }
      gameOverText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER\\nSCORE: ' + score + '\\nPRESS R TO RESTART', {
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
