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

    let player: any;
    let enemies: any;
    let bullets: any;
    let cursors: any;
    let score = 0;
    let highScore = localStorage.getItem('simpleHS') || 0;
    let scoreText: any;
    let direction = 1;
    let lastShot = 0;

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
        arcade: { debug: false },
      },
      scene: { preload, create, update },
    };

    function preload(this: any) {
      this.load.spritesheet('ship', 'https://labs.phaser.io/assets/sprites/player.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.image('laser', 'https://labs.phaser.io/assets/sprites/laser.png');
      this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/ufo.png');
      this.load.audio('shootSound', 'https://labs.phaser.io/assets/audio/SoundEffects/pistol.wav');
    }

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();

      /* Player */
      player = this.physics.add.sprite(400, 520, 'ship');
      player.setDisplaySize(70, 70);
      player.setCollideWorldBounds(true);

      /* Groups */
      bullets = this.physics.add.group();
      enemies = this.physics.add.group();

      /* UI SCORE — FIXED TO SCREEN */
      scoreText = this.add.text(20, 20, 'SCORE 0 HIGH ' + highScore, {
        font: '22px monospace',
        fill: '#ffffff',
      }).setScrollFactor(0);

      /* Spawn enemies */
      spawnWave(this);

      /* Start sound on first input */
      this.input.keyboard.once('keydown-SPACE', () => {
        this.sound.play('shootSound');
      });
    }

    function update(this: any, time: number) {
      if (!player) return;

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
        const b = bullets.create(player.x, player.y - 35, 'laser');
        b.setDisplaySize(6, 20);
        b.setVelocityY(-900);
        this.sound.play('shootSound');
        lastShot = time + 250;
      }

      /* Bullet cleanup */
      bullets.children.each((b: any) => {
        if (b && b.y < -80) b.destroy();
      });

      /* Enemy movement (simple + stable) */
      enemies.children.each((e: any) => {
        if (!e) return;
        e.x += 2.5 * direction;
        if (e.x > 760 || e.x < 40) {
          direction *= -1;
          e.y += 35;
        }
      });

      /* Wave reset */
      if (enemies.countActive(true) === 0) {
        spawnWave(this);
      }
    }

    function spawnWave(scene: any) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 7; c++) {
          const e = scene.enemies.create(100 + c * 95, 80 + r * 70, 'enemy');
          e.setDisplaySize(55, 55);
          e.setVelocityX(60);
        }
      }
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
            border: 6px solid red;
            box-sizing: border-box;
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
