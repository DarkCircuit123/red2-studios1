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
    let highScore = localStorage.getItem('wixHS') || 0;
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

      /* UI */
      scoreText = this.add.text(20, 20, 'SCORE 0 HIGH ' + highScore, {
        font: '24px monospace',
        fill: '#ffffff',
      });

      /* Collision */
      this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

      spawnWave(this);
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
        let b = bullets.create(player.x, player.y - 30, 'laser');

        b.setDisplaySize(6, 20);
        b.setVelocityY(-900);

        lastShot = time + 250;
      }

      /* Cleanup */
      bullets.children.each((b: any) => {
        if (b && b.y < -60) b.destroy();
      });

      /* Enemy movement */
      enemies.children.each((e: any) => {
        if (!e) return;

        e.x += 3 * direction;

        if (e.x > 760 || e.x < 40) {
          direction *= -1;
          e.y += 35;
        }
      });

      if (enemies.countActive(true) === 0) {
        spawnWave(this);
      }
    }

    function spawnWave(scene: any) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 7; c++) {
          let e = scene.enemies.create(100 + c * 95, 80 + r * 70, 'enemy');

          e.setDisplaySize(55, 55);
          e.setVelocityX(60);
        }
      }
    }

    function hitEnemy(this: any, bullet: any, enemy: any) {
      bullet.destroy();
      enemy.destroy();

      score += 100;

      if (score > highScore) {
        highScore = score;
        localStorage.setItem('wixHS', highScore);
      }

      scoreText.setText('SCORE ' + score + ' HIGH ' + highScore);
    }

    new Phaser.Game(config);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="pt-20 w-full flex flex-col items-center justify-center bg-black min-h-screen">
        <style>{`
          #game {
            width: 100%;
            height: 100%;
            border: 6px solid red;
            box-sizing: border-box;
          }
        `}</style>
        <div id="game" />
      </div>
      <Footer />
    </div>
  );
}
