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
    let enemies: any;
    let bullets: any;
    let cursors: any;
    let score = 0;
    let wave = 1;
    let highScore = localStorage.getItem('viralHighScore') || 0;
    let scoreText: any;
    let titleText: any;

    const config = {
      type: Phaser.AUTO,
      parent: 'game',
      width: 1200,
      height: 800,
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: { preload, create, update },
    };

    function preload(this: any) {
      this.load.spritesheet('ships', 'https://labs.phaser.io/assets/sprites/invaders.png', {
        frameWidth: 32,
        frameHeight: 32,
      });
      this.load.image('laser', 'https://labs.phaser.io/assets/sprites/laser.png');
      this.load.image('boom', 'https://labs.phaser.io/assets/particles/red.png');
      this.load.image('star', 'https://labs.phaser.io/assets/demoscene/star2.png');
      this.load.audio('music', 'https://labs.phaser.io/assets/audio/techno.ogg');
    }

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();

      /* Title Intro Sequence */
      titleText = this.add.text(350, 350, 'GALACTIC DEFENDER', {
        font: '64px monospace',
        fill: '#ff0000',
      });

      this.tweens.add({
        targets: titleText,
        alpha: 0,
        duration: 5000,
        ease: 'Quad.easeOut',
      });

      /* Stars */
      for (let i = 0; i < 260; i++) {
        this.add
          .image(Phaser.Math.Between(0, 1200), Phaser.Math.Between(0, 800), 'star')
          .setScale(0.12);
      }

      /* Player */
      player = this.physics.add.sprite(600, 700, 'ships', 0);
      player.setDisplaySize(90, 90);
      player.setCollideWorldBounds(true);

      /* Groups */
      bullets = this.physics.add.group();
      enemies = this.physics.add.group();

      /* UI */
      scoreText = this.add.text(20, 20, 'SCORE 0 HIGH ' + highScore, {
        font: '30px monospace',
        fill: '#ffffff',
      });

      /* Collision */
      this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

      spawnWave(this);
    }

    function update(this: any) {
      if (!player) return;

      /* Player */
      if (cursors.left.isDown) player.setVelocityX(-420);
      else if (cursors.right.isDown) player.setVelocityX(420);
      else player.setVelocityX(0);

      /* Shooting */
      if (this.input.keyboard.checkDown(cursors.space, 140)) {
        let b = bullets.create(player.x, player.y - 50, 'laser');

        if (b) {
          b.setDisplaySize(10, 30);
          b.setVelocityY(-1100);
        }
      }

      /* Bullet cleanup */
      bullets.children.each(function (b: any) {
        if (b && b.y < -100) b.destroy();
      });

      /* Swarm Intelligence */
      let swarmCenter = 0;

      enemies.children.each(function (e: any) {
        if (!e) return;

        swarmCenter += e.x;

        /* Dynamic swarm pattern */
        e.x += Math.sin(Date.now() * 0.001 + e.y * 0.01) * (2 + wave * 0.08);
        e.y += Math.cos(Date.now() * 0.0008 + e.x * 0.01) * 1.5;

        /* Dive attack */
        if (Math.random() > 0.999) {
          e.state = 'dive';
          e.targetX = player.x;
        }

        if (e.state === 'dive') {
          e.y += 7 + wave * 0.4;
          e.x += Math.sign(e.targetX - e.x) * 3;
        }
      }, this);

      /* Wave progression */
      if (enemies.countActive(true) === 0) {
        wave++;
        spawnWave(this);
      }
    }

    function spawnWave(scene: any) {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 8; c++) {
          let e = scene.enemies.create(180 + c * 110, 100 + r * 80, 'ships', 1);

          e.setDisplaySize(70, 70);
          e.health = 2 + wave;
        }
      }
    }

    function hitEnemy(this: any, bullet: any, enemy: any) {
      bullet.destroy();

      enemy.health--;

      if (enemy.health <= 0) {
        enemy.destroy();

        score += 100 * (1 + wave * 0.05);

        let boom = this.add.image(enemy.x, enemy.y, 'boom');
        boom.setScale(1.2);

        this.time.delayedCall(200, () => boom.destroy());
      }

      if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('viralHighScore', highScore);
      }

      scoreText.setText('SCORE ' + Math.floor(score) + ' HIGH ' + highScore);
    }

    new Phaser.Game(config);
  };

  return (
    <div className="w-full min-h-screen bg-black">
      <Header />
      <div className="pt-20 w-full flex flex-col items-center justify-center bg-black min-h-screen">
        <style>{`
          #cabinet {
            width: 1400px;
            height: 900px;
            background: radial-gradient(circle at center, #300000, #000000);
            border-radius: 50px;
            padding: 40px;
            box-shadow:
              0 0 150px rgba(255, 0, 0, 0.3),
              inset 0 0 200px rgba(0, 0, 0, 0.95);
            position: relative;
          }

          #scan {
            position: absolute;
            pointer-events: none;
            width: 1200px;
            height: 800px;
            background: repeating-linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.12),
              rgba(0, 0, 0, 0.12) 2px,
              rgba(255, 255, 255, 0.02) 3px
            );
            mix-blend-mode: overlay;
            top: 40px;
            left: 40px;
            border-radius: 8px;
          }

          #game {
            position: relative;
            z-index: 1;
          }
        `}</style>
        <div id="cabinet">
          <div id="game" />
          <div id="scan" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
