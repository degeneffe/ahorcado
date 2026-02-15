import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getRandomWord para controlar la palabra
vi.stubGlobal('getRandomWord', vi.fn());

// Usar normalizeChar real
import { normalizeChar as realNormalizeChar } from '../../api.js';
vi.stubGlobal('normalizeChar', realNormalizeChar);

// Mock de HangmanCanvas con tracking de llamadas
const drawStepCalls = [];
vi.stubGlobal('HangmanCanvas', class {
  reset() { drawStepCalls.length = 0; }
  drawStep(step) { drawStepCalls.push(step); }
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

describe('Flujo completo del juego', () => {
  beforeEach(() => {
    setupDOM();
    drawStepCalls.length = 0;
  });

  it('juego completo: ganar adivinando todas las letras', async () => {
    getRandomWord.mockResolvedValue('gato');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('gato'));

    expect(document.getElementById('word-display').textContent).toBe('_ _ _ _');

    game.guessLetter('g');
    expect(document.getElementById('word-display').textContent).toBe('g _ _ _');

    game.guessLetter('a');
    expect(document.getElementById('word-display').textContent).toBe('g a _ _');

    game.guessLetter('t');
    expect(document.getElementById('word-display').textContent).toBe('g a t _');

    game.guessLetter('o');
    expect(document.getElementById('word-display').textContent).toBe('g a t o');

    expect(game.gameOver).toBe(true);
    expect(game.errors).toBe(0);
    expect(document.getElementById('message').textContent).toContain('Ganaste');
    expect(drawStepCalls.length).toBe(0);
  });

  it('juego completo: perder con 6 errores', async () => {
    getRandomWord.mockResolvedValue('sol');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('sol'));

    const wrongLetters = ['a', 'b', 'c', 'd', 'e', 'f'];
    wrongLetters.forEach((letter, i) => {
      game.guessLetter(letter);
      expect(game.errors).toBe(i + 1);
    });

    expect(game.gameOver).toBe(true);
    expect(document.getElementById('message').textContent).toContain('Perdiste');
    expect(document.getElementById('word-display').textContent).toBe('s o l');
    expect(drawStepCalls).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('palabra con acentos: se adivina con letras sin acento', async () => {
    getRandomWord.mockResolvedValue('música');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('música'));

    ['m', 'u', 's', 'i', 'c', 'a'].forEach(l => game.guessLetter(l));

    expect(game.gameOver).toBe(true);
    expect(document.getElementById('message').textContent).toContain('Ganaste');
    expect(document.getElementById('word-display').textContent).toBe('m ú s i c a');
  });

  it('reiniciar juego después de ganar', async () => {
    getRandomWord.mockResolvedValue('sol');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('sol'));

    ['s', 'o', 'l'].forEach(l => game.guessLetter(l));
    expect(game.gameOver).toBe(true);

    getRandomWord.mockResolvedValue('mar');
    await game.startGame();
    await vi.waitFor(() => expect(game.word).toBe('mar'));

    expect(game.gameOver).toBe(false);
    expect(game.errors).toBe(0);
    expect(game.guessedLetters.size).toBe(0);
    expect(document.getElementById('word-display').textContent).toBe('_ _ _');
    expect(document.getElementById('message').textContent).toBe('');
  });

  it('reiniciar juego después de perder', async () => {
    getRandomWord.mockResolvedValue('sol');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('sol'));

    ['a', 'b', 'c', 'd', 'e', 'f'].forEach(l => game.guessLetter(l));
    expect(game.gameOver).toBe(true);

    getRandomWord.mockResolvedValue('rio');
    await game.startGame();
    await vi.waitFor(() => expect(game.word).toBe('rio'));

    expect(game.gameOver).toBe(false);
    expect(game.errors).toBe(0);
    expect(document.getElementById('errors-count').textContent).toBe('0 / 6');
  });

  it('teclado físico funciona correctamente', async () => {
    getRandomWord.mockResolvedValue('sol');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('sol'));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(game.guessedLetters.has('s')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
    expect(game.guessedLetters.has('o')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    expect(game.gameOver).toBe(true);
  });

  it('ignora teclas con modificadores (ctrl, alt, meta)', async () => {
    getRandomWord.mockResolvedValue('sol');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('sol'));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    expect(game.guessedLetters.has('s')).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', altKey: true }));
    expect(game.guessedLetters.has('s')).toBe(false);
  });

  it('mezcla de aciertos y errores progresa correctamente', async () => {
    getRandomWord.mockResolvedValue('casa');
    const game = new HangmanGame();
    await vi.waitFor(() => expect(game.word).toBe('casa'));

    game.guessLetter('c');
    expect(game.errors).toBe(0);
    expect(document.getElementById('word-display').textContent).toBe('c _ _ _');

    game.guessLetter('z');
    expect(game.errors).toBe(1);

    game.guessLetter('a');
    expect(game.errors).toBe(1);
    expect(document.getElementById('word-display').textContent).toBe('c a _ a');

    game.guessLetter('x');
    expect(game.errors).toBe(2);

    game.guessLetter('s');
    expect(game.gameOver).toBe(true);
    expect(game.errors).toBe(2);
    expect(document.getElementById('word-display').textContent).toBe('c a s a');
  });
});
