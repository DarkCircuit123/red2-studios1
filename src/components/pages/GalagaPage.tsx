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
      initializeGame();
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGame = () => {
    if (!(window as any).Phaser) return;

    const Phaser = (window as any).Phaser;

    let player: any;
    let cursors: any;
    let bullets: any;
    let enemies: any;
    let lastShot = 0;

    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 720,
      height: 960,
      backgroundColor: '#000000',
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: { preload, create, update },
    };

    function preload(this: any) {
      this.load.image('player', 'https://labs.phaser.io/assets/sprites/player.png');
      this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/ufo.png');
      this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullets/bullet11.png');
    }

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();

      player = this.physics.add.sprite(360, 880, 'player');
      player.setScale(0.7);
      player.setCollideWorldBounds(true);

      bullets = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Image,
        maxSize: 30,
      });

      enemies = this.physics.add.group();

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const e = enemies.create(120 + c * 90, 100 + r * 70, 'enemy');
          e.setScale(0.6);
          e.setVelocityX(60);
        }
      }
    }

    function update(this: any, time: number) {
      if (!player) return;

      if (cursors.left.isDown) {
        player.setVelocityX(-300);
      } else if (cursors.right.isDown) {
        player.setVelocityX(300);
      } else {
        player.setVelocityX(0);
      }

      if (cursors.space.isDown && time > lastShot) {
        const b = bullets.create(player.x, player.y - 40, 'bullet');

        if (b) {
          b.setVelocityY(-500);
        }

        lastShot = time + 250;
      }

      bullets.children.each(function (b: any) {
        if (b && b.y < -20) {
          b.destroy();
        }
      });

      enemies.children.each(function (e: any) {
        if (!e) return;

        if (e.x > 680) {
          e.setVelocityX(-60);
          e.y += 20;
        }

        if (e.x < 40) {
          e.setVelocityX(60);
          e.y += 20;
        }
      });
    }

    new Phaser.Game(config);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="pt-20 w-full flex flex-col items-center justify-center bg-black">
        <div id="game-container" className="flex items-center justify-center" />
      </div>
      <Footer />
    </div>
  );
}
