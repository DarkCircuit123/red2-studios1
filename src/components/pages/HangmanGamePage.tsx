import { useEffect, useRef } from 'react';
import Header from '../Header';
import Footer from '../Footer';

export default function HangmanGamePage() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically load Phaser if not already loaded
    if (!(window as any).Phaser) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js';
      script.async = true;
      script.onload = () => {
        initializeGame();
      };
      document.body.appendChild(script);
    } else {
      initializeGame();
    }

    return () => {
      // Cleanup game instance on unmount
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
      }
    };
  }, []);

  const initializeGame = () => {
    const Phaser = (window as any).Phaser;

    /* Word Categories */
    const categories = {
      SPACE: ['GALAXY', 'ASTEROID', 'ORBIT', 'ROCKET', 'COMET'],
      TECH: ['PHASER', 'ALGORITHM', 'SOFTWARE', 'SYSTEM', 'NETWORK'],
      PHOTOGRAPHY: ['APERTURE', 'SHUTTER', 'EXPOSURE', 'FOCUS', 'LENS'],
      PORTFOLIO: ['DESIGN', 'CREATIVE', 'PROJECT', 'VISUAL', 'ARTWORK'],
    };

    let word: string;
    let displayWord: string[];
    let guessed: string[] = [];
    let wrongGuesses = 0;
    const maxWrong = 6;

    let wordText: any;
    let hangmanParts: any[] = [];
    let gameOverText: any;
    let categoryText: any;
    let wrongCountText: any;

    const config = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#000000',
      scene: {
        preload,
        create,
      },
    };

    gameInstanceRef.current = new Phaser.Game(config);

    /* PRELOAD */
    function preload(this: any) {
      this.load.audio('win', 'https://labs.phaser.io/assets/audio/SoundEffects/ping.wav');
      this.load.audio('wrong', 'https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3');
    }

    /* CREATE */
    function create(this: any) {
      let categoryKeys = Object.keys(categories);
      let selectedCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      let categoryWords = (categories as any)[selectedCategory];

      word = categoryWords[Math.floor(Math.random() * categoryWords.length)].toUpperCase();
      displayWord = Array(word.length).fill('_');
      guessed = [];
      wrongGuesses = 0;

      // Category display
      categoryText = this.add.text(50, 20, `Category: ${selectedCategory}`, {
        font: '18px monospace',
        fill: '#4a0e0e',
      });

      // Wrong count display
      wrongCountText = this.add.text(50, 50, `Wrong: ${wrongGuesses}/${maxWrong}`, {
        font: '18px monospace',
        fill: '#ff6b6b',
      });

      // Gallow structure with improved styling
      const gallowColor = 0xd4a574; // wood color
      this.add.rectangle(150, 250, 20, 250, gallowColor); // vertical pole
      this.add.rectangle(150, 100, 150, 20, gallowColor); // horizontal beam
      this.add.line(300, 100, 0, 0, 0, 80, gallowColor).setLineWidth(3); // rope

      // Word UI
      wordText = this.add.text(400, 150, displayWord.join(' '), {
        font: '56px monospace',
        fill: '#ffffff',
        align: 'center',
      });

      // Hangman drawing stages - sprite-based approach with graphics
      // Head
      hangmanParts.push(
        this.add.graphics().setVisible(false).fillStyle(0xfdbcb4, 1).fillCircle(300, 180, 35)
      );
      
      // Body
      hangmanParts.push(
        this.add.graphics().setVisible(false).fillStyle(0xff6b6b, 1).fillRect(290, 220, 20, 100)
      );
      
      // Left arm
      hangmanParts.push(
        this.add.graphics().setVisible(false).fillStyle(0xfdbcb4, 1).fillRect(240, 245, 50, 15)
      );
      
      // Right arm
      hangmanParts.push(
        this.add.graphics().setVisible(false).fillStyle(0xfdbcb4, 1).fillRect(310, 245, 50, 15)
      );
      
      // Left leg
      hangmanParts.push(
        this.add.graphics().setVisible(false).fillStyle(0x4a4a4a, 1).fillRect(285, 320, 12, 70)
      );
      
      // Right leg
      hangmanParts.push(
        this.add.graphics().setVisible(false).fillStyle(0x4a4a4a, 1).fillRect(303, 320, 12, 70)
      );

      // Game over text - smaller size
      gameOverText = this.add.text(400, 480, '', {
        font: '28px monospace',
        fill: '#ffffff',
        align: 'center',
      });

      // Instructions
      this.add.text(50, 550, 'Press any letter key to guess', {
        font: '14px monospace',
        fill: '#999999',
      });

      let gameOver = false;

      /* Input */
      this.input.keyboard.on('keydown', (e: any) => {
        if (gameOver) return;

        let letter = e.key.toUpperCase();
        if (letter.length !== 1 || !/[A-Z]/.test(letter)) return;

        if (guessed.includes(letter)) return;

        guessed.push(letter);

        if (word.includes(letter)) {
          for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
              displayWord[i] = letter;
            }
          }

          this.sound.play('win');
        } else {
          wrongGuesses++;
          this.sound.play('wrong');

          /* Show next hangman part */
          if (wrongGuesses <= hangmanParts.length) {
            hangmanParts[wrongGuesses - 1].setVisible(true);
          }
        }

        wordText.setText(displayWord.join(' '));
        wrongCountText.setText(`Wrong: ${wrongGuesses}/${maxWrong}`);

        // Check win condition
        if (!displayWord.includes('_')) {
          gameOverText.setText('YOU WIN!');
          gameOverText.setFill('#00ff00');
          this.sound.play('win');
          gameOver = true;
        }

        // Check lose condition
        if (wrongGuesses >= maxWrong) {
          gameOverText.setText(`GAME OVER!\nThe word was: ${word}`);
          gameOverText.setFill('#ff6b6b');
          this.sound.play('wrong');
          gameOver = true;
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-4xl px-4">
          <div
            ref={gameContainerRef}
            className="w-full bg-black rounded-lg border border-primary overflow-hidden"
            style={{ minHeight: '650px' }}
          />
          <div className="mt-8 text-center">
            <p className="font-paragraph text-gray-400 mb-4">
              Guess the word by pressing letter keys. You have 6 wrong guesses before game over!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white rounded hover:bg-opacity-80 transition-all"
            >
              New Game
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
