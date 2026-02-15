import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de las dependencias globales que app.js espera
vi.stubGlobal('getRandomWord', vi.fn().mockResolvedValue('prueba'));
vi.stubGlobal('normalizeChar', (ch) => {
  const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };
  return map[ch] || ch;
});

vi.stubGlobal('HangmanCanvas', class {
  reset() {}
  drawStep() {}
  resize() {}
  clear() {}
});

const { HangmanGame } = await import('../../app.js');

function setupDOM() {
  document.body.innerHTML = `
    <canvas id="hangman-canvas" width="350" height="350"></canvas>
    <div id="loading" class="hidden"></div>
    <div id="word-display"></div>
    <div id="errors-count"></div>
    <div id="message" class="message"></div>
    <div id="keyboard"></div>
    <button id="new-game-btn">Nueva partida</button>
  `;
  const canvas = document.getElementById('hangman-canvas');
  canvas.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), arc: vi.fn(), stroke: vi.fn(),
    strokeStyle: '', lineWidth: 0, lineCap: '',
  });
}

describe('HangmanGame', () => {
  let game;

  beforeEach(async () => {
    setupDOM();
    game = new HangmanGame();
    await vi.waitFor(() => {
      expect(game.word).toBe('prueba');
    });
  });

  describe('inicialización', () => {
    it('configura el estado inicial', () => {
      expect(game.maxErrors).toBe(6);
      expect(game.errors).toBe(0);
      expect(game.gameOver).toBe(false);
      expect(game.guessedLetters.size).toBe(0);
    });

    it('construye el teclado con 3 filas', () => {
      const rows = document.querySelectorAll('.keyboard-row');
      expect(rows.length).toBe(3);
    });

    it('incluye la ñ en el teclado', () => {
      const btn = document.querySelector('[data-letter="ñ"]');
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe('Ñ');
    });

    it('muestra la palabra como guiones bajos', () => {
      const display = document.getElementById('word-display').textContent;
      expect(display).toBe('_ _ _ _ _ _');
    });
  });

  describe('guessLetter', () => {
    it('revela letras correctas', () => {
      game.guessLetter('p');
      const display = document.getElementById('word-display').textContent;
      expect(display).toContain('p');
      expect(game.errors).toBe(0);
    });

    it('incrementa errores con letras incorrectas', () => {
      game.guessLetter('z');
      expect(game.errors).toBe(1);
      expect(document.getElementById('errors-count').textContent).toBe('1 / 6');
    });

    it('ignora letras repetidas', () => {
      game.guessLetter('z');
      game.guessLetter('z');
      expect(game.errors).toBe(1);
    });

    it('ignora letras si el juego terminó', () => {
      game.gameOver = true;
      game.guessLetter('p');
      expect(game.guessedLetters.has('p')).toBe(false);
    });

    it('marca botón como correcto', () => {
      game.guessLetter('p');
      const btn = document.querySelector('[data-letter="p"]');
      expect(btn.classList.contains('correct')).toBe(true);
      expect(btn.disabled).toBe(true);
    });

    it('marca botón como incorrecto', () => {
      game.guessLetter('z');
      const btn = document.querySelector('[data-letter="z"]');
      expect(btn.classList.contains('wrong')).toBe(true);
      expect(btn.disabled).toBe(true);
    });
  });

  describe('condiciones de fin de juego', () => {
    it('gana al adivinar todas las letras', () => {
      ['p', 'r', 'u', 'e', 'b', 'a'].forEach(l => game.guessLetter(l));
      expect(game.gameOver).toBe(true);
      const msg = document.getElementById('message');
      expect(msg.textContent).toContain('Ganaste');
      expect(msg.classList.contains('win')).toBe(true);
    });

    it('pierde tras 6 errores', () => {
      ['z', 'x', 'w', 'k', 'j', 'f'].forEach(l => game.guessLetter(l));
      expect(game.gameOver).toBe(true);
      expect(game.errors).toBe(6);
      const msg = document.getElementById('message');
      expect(msg.textContent).toContain('Perdiste');
      expect(msg.classList.contains('lose')).toBe(true);
    });

    it('revela la palabra al perder', () => {
      ['z', 'x', 'w', 'k', 'j', 'f'].forEach(l => game.guessLetter(l));
      const display = document.getElementById('word-display').textContent;
      expect(display).toBe('p r u e b a');
    });

    it('deshabilita todas las teclas al terminar', () => {
      ['p', 'r', 'u', 'e', 'b', 'a'].forEach(l => game.guessLetter(l));
      const buttons = document.querySelectorAll('.key');
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(true);
      });
    });
  });

  describe('startGame (reinicio)', () => {
    it('resetea el estado al iniciar nueva partida', async () => {
      game.guessLetter('z');
      game.guessLetter('x');
      expect(game.errors).toBe(2);

      await game.startGame();
      expect(game.errors).toBe(0);
      expect(game.guessedLetters.size).toBe(0);
      expect(game.gameOver).toBe(false);
    });

    it('rehabilita todas las teclas', async () => {
      game.guessLetter('z');
      await game.startGame();
      const buttons = document.querySelectorAll('.key');
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(false);
        expect(btn.classList.contains('correct')).toBe(false);
        expect(btn.classList.contains('wrong')).toBe(false);
      });
    });
  });
});
