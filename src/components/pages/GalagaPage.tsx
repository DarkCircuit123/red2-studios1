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

    const TILE_SIZE = 30;
    const COLS = 19;
    const ROWS = 21;
    const CANVAS_WIDTH = COLS * TILE_SIZE;
    const CANVAS_HEIGHT = ROWS * TILE_SIZE;

    let pacman: any;
    let ghosts: any[] = [];
    let pellets: any;
    let powerPellets: any;
    let cursors: any;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('pacmanHS') || '0');
    let scoreText: any;
    let gameOver = false;
    let gameOverText: any;
    let nextDirection = 'NONE';
    let currentDirection = 'NONE';
    let pelletsEaten = 0;
    let totalPellets = 0;
    let powerMode = false;
    let powerModeTimer = 0;

    // Maze layout (0 = path, 1 = wall)
    const maze = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
      [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
      [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
      [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
      [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
      [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
      [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
      [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const config = {
      type: Phaser.AUTO,
      parent: 'game',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: { create, update },
    };

    function create(this: any) {
      cursors = this.input.keyboard.createCursorKeys();

      // Create graphics for maze
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0x0000ff, 1);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (maze[r][c] === 1) {
            graphics.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      graphics.generateTexture('maze', CANVAS_WIDTH, CANVAS_HEIGHT);
      graphics.destroy();

      this.add.image(0, 0, 'maze').setOrigin(0, 0);

      // Create pellets
      pellets = this.physics.add.staticGroup();
      powerPellets = this.physics.add.staticGroup();

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (maze[r][c] === 0) {
            const x = c * TILE_SIZE + TILE_SIZE / 2;
            const y = r * TILE_SIZE + TILE_SIZE / 2;
            if ((r === 1 && c === 1) || (r === 1 && c === COLS - 2) || 
                (r === ROWS - 2 && c === 1) || (r === ROWS - 2 && c === COLS - 2)) {
              const pp = powerPellets.create(x, y);
              pp.setDisplaySize(8, 8);
              pp.setTint(0xffff00);
            } else {
              const p = pellets.create(x, y);
              p.setDisplaySize(3, 3);
              p.setTint(0xffffff);
            }
          }
        }
      }

      totalPellets = pellets.children.entries.length + powerPellets.children.entries.length;

      // Create Pac-Man (white)
      pacman = this.add.circle(9 * TILE_SIZE + TILE_SIZE / 2, 15 * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0xffffff);
      pacman.gridX = 9;
      pacman.gridY = 15;

      // Create ghosts (all red)
      const ghostStartPositions = [
        { x: 8, y: 9, color: 0xff0000 },
        { x: 9, y: 9, color: 0xff0000 },
        { x: 8, y: 10, color: 0xff0000 },
        { x: 9, y: 10, color: 0xff0000 },
      ];

      ghostStartPositions.forEach((pos) => {
        const ghost = this.add.circle(pos.x * TILE_SIZE + TILE_SIZE / 2, pos.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, pos.color);
        ghost.gridX = pos.x;
        ghost.gridY = pos.y;
        ghost.direction = Phaser.Math.RND.pick(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        ghosts.push(ghost);
      });

      // UI
      scoreText = this.add.text(10, CANVAS_HEIGHT + 10, 'SCORE: ' + score + ' HIGH: ' + highScore, {
        font: '16px monospace',
        fill: '#ffffff',
      });
    }

    function update(this: any) {
      if (gameOver) return;

      // Handle input
      if (cursors.left.isDown) nextDirection = 'LEFT';
      if (cursors.right.isDown) nextDirection = 'RIGHT';
      if (cursors.up.isDown) nextDirection = 'UP';
      if (cursors.down.isDown) nextDirection = 'DOWN';

      // Move Pac-Man
      let newX = pacman.gridX;
      let newY = pacman.gridY;

      if (nextDirection !== 'NONE') {
        if (nextDirection === 'LEFT') newX--;
        if (nextDirection === 'RIGHT') newX++;
        if (nextDirection === 'UP') newY--;
        if (nextDirection === 'DOWN') newY++;

        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS && maze[newY][newX] === 0) {
          currentDirection = nextDirection;
        }
      }

      if (currentDirection !== 'NONE') {
        if (currentDirection === 'LEFT') newX = pacman.gridX - 1;
        if (currentDirection === 'RIGHT') newX = pacman.gridX + 1;
        if (currentDirection === 'UP') newY = pacman.gridY - 1;
        if (currentDirection === 'DOWN') newY = pacman.gridY + 1;

        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS && maze[newY][newX] === 0) {
          pacman.gridX = newX;
          pacman.gridY = newY;
          pacman.x = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
          pacman.y = pacman.gridY * TILE_SIZE + TILE_SIZE / 2;
        }
      }

      // Check pellet collision
      pellets.children.entries.forEach((p: any) => {
        if (p && p.gridX === pacman.gridX && p.gridY === pacman.gridY) {
          p.destroy();
          score += 10;
          pelletsEaten++;
          scoreText.setText('SCORE: ' + score + ' HIGH: ' + highScore);
        }
      });

      powerPellets.children.entries.forEach((p: any) => {
        if (p && p.gridX === pacman.gridX && p.gridY === pacman.gridY) {
          p.destroy();
          score += 50;
          powerMode = true;
          powerModeTimer = 300;
          ghosts.forEach((g: any) => g.setTint(0x0000ff));
          scoreText.setText('SCORE: ' + score + ' HIGH: ' + highScore);
        }
      });

      // Update power mode
      if (powerMode) {
        powerModeTimer--;
        if (powerModeTimer <= 0) {
          powerMode = false;
          ghosts.forEach((g: any) => g.clearTint());
        }
      }

      // Move ghosts
      ghosts.forEach((ghost: any) => {
        if (Math.random() < 0.02) {
          ghost.direction = Phaser.Math.RND.pick(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        }

        let gNewX = ghost.gridX;
        let gNewY = ghost.gridY;

        if (ghost.direction === 'LEFT') gNewX--;
        if (ghost.direction === 'RIGHT') gNewX++;
        if (ghost.direction === 'UP') gNewY--;
        if (ghost.direction === 'DOWN') gNewY++;

        if (gNewX >= 0 && gNewX < COLS && gNewY >= 0 && gNewY < ROWS && maze[gNewY][gNewX] === 0) {
          ghost.gridX = gNewX;
          ghost.gridY = gNewY;
          ghost.x = ghost.gridX * TILE_SIZE + TILE_SIZE / 2;
          ghost.y = ghost.gridY * TILE_SIZE + TILE_SIZE / 2;
        } else {
          ghost.direction = Phaser.Math.RND.pick(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        }

        // Check collision with Pac-Man
        if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
          if (powerMode) {
            ghost.destroy();
            score += 200;
            scoreText.setText('SCORE: ' + score + ' HIGH: ' + highScore);
          } else {
            endGame(this);
          }
        }
      });

      // Win condition
      if (pelletsEaten === totalPellets) {
        gameOverText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'YOU WIN!\\nPRESS R TO RESTART', {
          font: 'bold 24px monospace',
          fill: '#00ff00',
          align: 'center',
        }).setOrigin(0.5);
        gameOver = true;
        this.input.keyboard.once('keydown-R', () => {
          this.scene.restart();
        });
      }
    }

    function endGame(scene: any) {
      gameOver = true;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacmanHS', highScore.toString());
      }
      gameOverText = scene.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'GAME OVER\\nSCORE: ' + score + '\\nPRESS R TO RESTART', {
        font: 'bold 24px monospace',
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
            border: 6px solid yellow;
            box-sizing: border-box;
          }
          @media (max-width: 900px) {
            #game {
              width: 90vw;
              height: auto;
              max-width: 570px;
              max-height: 630px;
            }
          }
        `}</style>
        <div id="game" />
      </div>
      <Footer />
    </div>
  );
}
