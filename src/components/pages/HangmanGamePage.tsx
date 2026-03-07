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
        font: '20px monospace',
        fill: '#4a0e0e',
      });

      // Wrong count display
      wrongCountText = this.add.text(50, 50, `Wrong: ${wrongGuesses}/${maxWrong}`, {
        font: '20px monospace',
        fill: '#ff6b6b',
      });

      // Gallow structure
      this.add.rectangle(150, 250, 20, 250, 0xffffff); // vertical pole
      this.add.rectangle(150, 100, 150, 20, 0xffffff); // horizontal beam
      this.add.line(300, 100, 0, 0, 0, 80, 0xffffff); // rope

      // Word UI
      wordText = this.add.text(400, 150, displayWord.join(' '), {
        font: '60px monospace',
        fill: '#ffffff',
        align: 'center',
      });

      // Hangman drawing stages
      hangmanParts.push(this.add.circle(300, 180, 40, 0xffffff).setVisible(false)); // head
      hangmanParts.push(this.add.rectangle(300, 260, 20, 120, 0xffffff).setVisible(false)); // body
      hangmanParts.push(this.add.rectangle(240, 290, 60, 20, 0xffffff).setVisible(false)); // left arm
      hangmanParts.push(this.add.rectangle(360, 290, 60, 20, 0xffffff).setVisible(false)); // right arm
      hangmanParts.push(this.add.rectangle(280, 380, 20, 80, 0xffffff).setVisible(false)); // left leg
      hangmanParts.push(this.add.rectangle(320, 380, 20, 80, 0xffffff).setVisible(false)); // right leg

      // Game over text
      gameOverText = this.add.text(400, 500, '', {
        font: '40px monospace',
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
          <h1 className="font-heading text-4xl text-center mb-8 text-primary">Hangman Game</h1>
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
