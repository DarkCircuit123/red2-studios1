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
      // Ensure DOM is ready before initializing game
      setTimeout(() => {
        initializeGame();
      }, 100);
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove the script - let it persist for the game
    };
  }, []);

  const initializeGame = () => {
    if (!(window as any).Phaser) return;

    const Phaser = (window as any).Phaser;

    let player: any;
    let enemies: any;
    let bullets: any;
    let cursors: any;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('wixHS') || '0');
    let scoreText: any;
    let direction = 1;
    let lastShot = 0;
    let gameInstance: any = null;

    const config = {
      type: Phaser.AUTO,
      parent: 'game',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false, gravity: { y: 0 } },
      },
      scene: { preload, create, update },
      backgroundColor: '#000000',
    };

    function preload(this: any) {
      this.load.spritesheet('ship', 'https://labs.phaser.io/assets/sprites/player.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.image('laser', 'https://labs.phaser.io/assets/sprites/laser.png');
      this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/ufo.png');
    }

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on('keydown-SPACE', () => {
        // Space key handler for better responsiveness
      });

      /* Player */
      player = this.physics.add.sprite(400, 520, 'ship');
      player.setDisplaySize(70, 70);
      player.setCollideWorldBounds(true);
      player.setBounce(0.2);

      /* Groups */
      bullets = this.physics.add.group();
      enemies = this.physics.add.group();

      /* UI */
      scoreText = this.add.text(20, 20, 'SCORE 0 HIGH ' + highScore, {
        font: '24px monospace',
        fill: '#ffffff',
      });
      scoreText.setDepth(100);

      /* Collision */
      this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

      spawnWave(this);
    }

    function update(this: any, time: number) {
      if (!player || !player.active) return;

      /* Movement */
      if (cursors.left.isDown) {
        player.setVelocityX(-400);
      } else if (cursors.right.isDown) {
        player.setVelocityX(400);
      } else {
        player.setVelocityX(0);
      }

      /* Shooting */
      if (cursors.space.isDown && time > lastShot) {
        const b = bullets.create(player.x, player.y - 30, 'laser');
        if (b) {
          b.setDisplaySize(6, 20);
          b.setVelocityY(-900);
          lastShot = time + 250;
        }
      }

      /* Cleanup bullets */
      bullets.children.entries.forEach((b: any) => {
        if (b && b.y < -60) {
          b.destroy();
        }
      });

      /* Enemy movement */
      let hitBound = false;
      enemies.children.entries.forEach((e: any) => {
        if (!e || !e.active) return;

        e.x += 3 * direction;

        if (e.x > 760 || e.x < 40) {
          hitBound = true;
          e.y += 35;
        }
      });

      if (hitBound) {
        direction *= -1;
      }

      if (enemies.countActive(true) === 0) {
        spawnWave(this);
      }
    }

    function spawnWave(scene: any) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 7; c++) {
          const e = scene.physics.add.sprite(100 + c * 95, 80 + r * 70, 'enemy');
          e.setDisplaySize(55, 55);
          enemies.add(e);
        }
      }
    }

    function hitEnemy(this: any, bullet: any, enemy: any) {
      if (bullet) bullet.destroy();
      if (enemy) enemy.destroy();

      score += 100;

      if (score > highScore) {
        highScore = score;
        localStorage.setItem('wixHS', String(highScore));
      }

      if (scoreText) {
        scoreText.setText('SCORE ' + score + ' HIGH ' + highScore);
      }
    }

    gameInstance = new Phaser.Game(config);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="w-full flex flex-col items-center justify-center bg-black py-10">
        <style>{`
          #game {
            width: 800px;
            height: 600px;
            border: 6px solid red;
            box-sizing: border-box;
            display: block;
          }
          @media (max-width: 900px) {
            #game {
              width: 90vw;
              height: 67.5vw;
              max-width: 800px;
              max-height: 600px;
            }
          }
        `}</style>
        <div id="game" />
      </div>
      <Footer />
    </div>
  );
}
