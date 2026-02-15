import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeChar, getRandomWord, FALLBACK_WORDS } from '../../api.js';

describe('normalizeChar', () => {
  it('convierte vocales acentuadas a sin acento', () => {
    expect(normalizeChar('á')).toBe('a');
    expect(normalizeChar('é')).toBe('e');
    expect(normalizeChar('í')).toBe('i');
    expect(normalizeChar('ó')).toBe('o');
    expect(normalizeChar('ú')).toBe('u');
  });

  it('convierte ü a u', () => {
    expect(normalizeChar('ü')).toBe('u');
  });

  it('no modifica caracteres sin acento', () => {
    expect(normalizeChar('a')).toBe('a');
    expect(normalizeChar('z')).toBe('z');
    expect(normalizeChar('ñ')).toBe('ñ');
  });

  it('no modifica caracteres especiales', () => {
    expect(normalizeChar('1')).toBe('1');
    expect(normalizeChar(' ')).toBe(' ');
  });
});

describe('FALLBACK_WORDS', () => {
  it('contiene al menos 200 palabras válidas en español', () => {
    expect(FALLBACK_WORDS.length).toBeGreaterThanOrEqual(200);
    FALLBACK_WORDS.forEach(word => {
      expect(word).toMatch(/^[a-záéíóúüñ]+$/);
      expect(word.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('getRandomWord', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve una palabra del diccionario local cuando las APIs fallan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
  });

  it('devuelve una palabra de la primera API cuando responde correctamente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['prueba']),
    }));

    const word = await getRandomWord();
    expect(word).toBe('prueba');
  });

  it('usa la segunda API si la primera falla', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      callCount++;
      if (url.includes('greenborn')) {
        return Promise.reject(new Error('timeout'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['ejemplo']),
      });
    }));

    const word = await getRandomWord();
    expect(word).toBe('ejemplo');
    expect(callCount).toBe(2);
  });

  it('usa diccionario local si ambas APIs fallan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
  });

  it('rechaza palabras con caracteres inválidos de la API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['hello-world']),
      });
    }));

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
  });

  it('rechaza palabras demasiado cortas de la API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['abc']),
      });
    }));

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
  });

  it('maneja respuestas no-ok de la API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
    }));

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
  });

  it('usa diccionario local directamente cuando está offline (navigator.onLine = false)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { onLine: false });

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('intenta APIs cuando está online (navigator.onLine = true)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['prueba']),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { onLine: true });

    const word = await getRandomWord();
    expect(word).toBe('prueba');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('filtra FALLBACK_WORDS por longitud cuando se pasan minLen/maxLen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const word = await getRandomWord(4, 5);
    expect(word.length).toBeGreaterThanOrEqual(4);
    expect(word.length).toBeLessThanOrEqual(5);
  });

  it('filtra FALLBACK_WORDS por longitud larga', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const word = await getRandomWord(8, 12);
    expect(word.length).toBeGreaterThanOrEqual(8);
    expect(word.length).toBeLessThanOrEqual(12);
  });

  it('usa defaults (5, 10) cuando no se pasan parámetros', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const word = await getRandomWord();
    expect(FALLBACK_WORDS).toContain(word);
  });

  it('filtra por longitud también en modo offline', async () => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('navigator', { onLine: false });

    const word = await getRandomWord(4, 5);
    expect(word.length).toBeGreaterThanOrEqual(4);
    expect(word.length).toBeLessThanOrEqual(5);
  });
});
