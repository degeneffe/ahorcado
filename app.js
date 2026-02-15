const DIFFICULTY_CONFIG = {
  easy:   { maxErrors: 8, minLen: 4, maxLen: 6, label: 'Fácil' },
  normal: { maxErrors: 6, minLen: 5, maxLen: 8, label: 'Normal' },
  hard:   { maxErrors: 4, minLen: 7, maxLen: 12, label: 'Difícil' }
};

const DRAW_MAP = {
  easy:   [[1],[2],[3],[4],[5],[6],[],[]],
  normal: [[1],[2],[3],[4],[5],[6]],
  hard:   [[1],[2,3],[4,5],[6]]
};

class HangmanGame {
  constructor() {
    this.hangmanCanvas = new HangmanCanvas(document.getElementById('hangman-canvas'));
    this.wordDisplay = document.getElementById('word-display');
    this.messageEl = document.getElementById('message');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.keyboardEl = document.getElementById('keyboard');
    this.errorsEl = document.getElementById('errors-count');
    this.loadingEl = document.getElementById('loading');
    this.difficultyScreen = document.getElementById('difficulty-screen');
    this.gameContainer = document.getElementById('game-container');

    this.word = '';
    this.normalizedWord = '';
    this.guessedLetters = new Set();
    this.errors = 0;
    this.gameOver = false;
    this.difficulty = 'normal';
    this.maxErrors = 6;

    this._buildKeyboard();
    this.newGameBtn.addEventListener('click', () => this.showDifficultyScreen());
    document.addEventListener('keydown', (e) => this._handleKeyPress(e));

    this.difficultyScreen.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectDifficulty(btn.dataset.difficulty));
    });

    this.showDifficultyScreen();
  }

  showDifficultyScreen() {
    this.difficultyScreen.classList.remove('hidden');
    this.gameContainer.classList.add('hidden');
  }

  selectDifficulty(level) {
    this.difficulty = level;
    const config = DIFFICULTY_CONFIG[level];
    this.maxErrors = config.maxErrors;
    this.difficultyScreen.classList.add('hidden');
    this.gameContainer.classList.remove('hidden');
    this.startGame();
  }

  async startGame() {
    this.guessedLetters.clear();
    this.errors = 0;
    this.gameOver = false;
    this.messageEl.textContent = '';
    this.messageEl.className = 'message';
    this.errorsEl.textContent = `0 / ${this.maxErrors}`;
    this._resetKeyboard();
    this.hangmanCanvas.reset();
    this.wordDisplay.textContent = '';
    this.loadingEl.classList.remove('hidden');

    const config = DIFFICULTY_CONFIG[this.difficulty];
    try {
      this.word = await getRandomWord(config.minLen, config.maxLen);
    } catch (_) {
      this.word = 'ahorcado';
    }

    this.normalizedWord = this.word.split('').map(normalizeChar).join('');
    this.loadingEl.classList.add('hidden');
    this._updateWordDisplay();
  }

  guessLetter(letter) {
    if (this.gameOver || this.guessedLetters.has(letter) || !this.word) return;

    this.guessedLetters.add(letter);
    const btn = this.keyboardEl.querySelector(`[data-letter="${letter}"]`);

    if (this.normalizedWord.includes(letter)) {
      if (btn) btn.classList.add('correct');
    } else {
      if (btn) btn.classList.add('wrong');
      this.errors++;
      this.errorsEl.textContent = `${this.errors} / ${this.maxErrors}`;
      const drawMap = DRAW_MAP[this.difficulty];
      const steps = drawMap[this.errors - 1] || [];
      steps.forEach(step => this.hangmanCanvas.drawStep(step));
    }

    if (btn) btn.disabled = true;
    this._updateWordDisplay();
    this._checkGameEnd();
  }

  _updateWordDisplay() {
    const display = this.word.split('').map((ch, i) => {
      const norm = normalizeChar(ch);
      return this.guessedLetters.has(norm) ? ch : '_';
    }).join(' ');
    this.wordDisplay.textContent = display;
  }

  _checkGameEnd() {
    const allRevealed = this.normalizedWord.split('')
      .every(ch => this.guessedLetters.has(ch));

    if (allRevealed) {
      this.gameOver = true;
      this.messageEl.textContent = '🎉 ¡Ganaste!';
      this.messageEl.className = 'message win';
      this._disableAllKeys();
    } else if (this.errors >= this.maxErrors) {
      this.gameOver = true;
      this.messageEl.innerHTML = `💀 ¡Perdiste! La palabra era: <strong>${this.word}</strong>`;
      this.messageEl.className = 'message lose';
      this._disableAllKeys();
      this._revealWord();
    }
  }

  _revealWord() {
    this.wordDisplay.textContent = this.word.split('').join(' ');
  }

  _buildKeyboard() {
    const rows = [
      'qwertyuiop',
      'asdfghjklñ',
      'zxcvbnm'
    ];
    this.keyboardEl.innerHTML = '';
    rows.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';
      row.split('').forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.textContent = letter.toUpperCase();
        btn.dataset.letter = letter;
        btn.addEventListener('click', () => this.guessLetter(letter));
        rowDiv.appendChild(btn);
      });
      this.keyboardEl.appendChild(rowDiv);
    });
  }

  _resetKeyboard() {
    this.keyboardEl.querySelectorAll('.key').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('correct', 'wrong');
    });
  }

  _disableAllKeys() {
    this.keyboardEl.querySelectorAll('.key').forEach(btn => {
      btn.disabled = true;
    });
  }

  _handleKeyPress(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (/^[a-zñ]$/.test(key)) {
      this.guessLetter(key);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HangmanGame();
});

if (typeof module !== 'undefined') module.exports = { HangmanGame, DIFFICULTY_CONFIG, DRAW_MAP };
