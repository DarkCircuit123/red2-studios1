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
    let wave = 1;
    let direction = 1;
    let highScore = localStorage.getItem('museumHS') || 0;
    let scoreText: any;
    let musicIntensity = 0;

    const config = {
      type: Phaser.AUTO,
      parent: 'game',
      width: 1100,
      height: 800,
      backgroundColor: '#000000',
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
    }

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();

      /* Stars */
      for (let i = 0; i < 260; i++) {
        this.add
          .image(Phaser.Math.Between(0, 1100), Phaser.Math.Between(0, 800), 'star')
          .setScale(0.12);
      }

      /* Player */
      player = this.physics.add.sprite(550, 700, 'ships', 0);
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

      /* Movement */
      if (cursors.left.isDown) {
        player.setVelocityX(-450);
      } else if (cursors.right.isDown) {
        player.setVelocityX(450);
      } else {
        player.setVelocityX(0);
      }

      /* Shooting */
      if (this.input.keyboard.checkDown(cursors.space, 140)) {
        let b = bullets.create(player.x, player.y - 50, 'laser');

        if (b) {
          b.setDisplaySize(10, 30);
          b.setVelocityY(-1200);
        }
      }

      /* Bullet cleanup */
      bullets.children.each((b: any) => {
        if (b && b.y < -100) b.destroy();
      });

      /* Predictive swarm AI */
      let playerBias = player.body.velocity.x;

      enemies.children.each((e: any) => {
        if (!e) return;

        /* Swarm organic motion */
        e.x += (3 + wave * 0.12) * direction;
        e.y += Math.sin(Date.now() * 0.001 + e.x * 0.01) * 0.5;

        /* Edge bounce */
        if (e.x > 1050 || e.x < 50) {
          direction *= -1;
          e.y += 45;
        }

        /* Predictive dive AI */
        if (Math.random() > 0.999) {
          e.state = 'dive';
          e.targetX = player.x + playerBias * 0.6;
        }

        if (e.state === 'dive') {
          e.y += 7 + wave * 0.4;
          e.x += Math.sign(e.targetX - e.x) * 3;
        }
      });

      /* Wave progression */
      if (enemies.countActive(true) === 0) {
        wave++;
        spawnWave(this);
        musicIntensity += 0.05;
      }
    }

    function spawnWave(scene: any) {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 9; c++) {
          let e = scene.enemies.create(120 + c * 110, 120 + r * 75, 'ships', 1);

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

        this.time.delayedCall(250, () => boom.destroy());
      }

      if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('museumHS', highScore);
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
          #museumCabinet {
            width: 1300px;
            height: 900px;
            background: radial-gradient(circle at center, #200000, #000000);
            border-radius: 50px;
            padding: 40px;
            box-shadow:
              0 0 180px rgba(255, 0, 0, 0.25),
              inset 0 0 200px rgba(0, 0, 0, 0.95);
            position: relative;
          }

          #crtGlow {
            position: absolute;
            pointer-events: none;
            width: 1100px;
            height: 800px;
            background: radial-gradient(circle at center,
              rgba(255, 0, 0, 0.12),
              rgba(0, 0, 0, 0.95));
            mix-blend-mode: screen;
            top: 40px;
            left: 40px;
            border-radius: 8px;
          }

          #game {
            position: relative;
            z-index: 1;
          }
        `}</style>
        <div id="museumCabinet">
          <div id="game" />
          <div id="crtGlow" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
