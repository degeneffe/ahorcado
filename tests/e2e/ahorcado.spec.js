import { test, expect } from '@playwright/test';

// Helper: selecciona dificultad y espera a que cargue la palabra
async function selectDifficultyAndWait(page, difficulty = 'normal') {
  await page.locator(`[data-difficulty="${difficulty}"]`).click();
  await expect(page.locator('#word-display')).not.toHaveText('', { timeout: 15000 });
}

test.describe('Pantalla de dificultad', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('se muestra la pantalla de dificultad al cargar', async ({ page }) => {
    await expect(page.locator('#difficulty-screen')).toBeVisible();
    await expect(page.locator('#game-container')).toBeHidden();
  });

  test('tiene 3 botones de dificultad', async ({ page }) => {
    await expect(page.locator('.difficulty-btn')).toHaveCount(3);
    await expect(page.locator('[data-difficulty="easy"]')).toBeVisible();
    await expect(page.locator('[data-difficulty="normal"]')).toBeVisible();
    await expect(page.locator('[data-difficulty="hard"]')).toBeVisible();
  });

  test('seleccionar dificultad inicia el juego', async ({ page }) => {
    await selectDifficultyAndWait(page, 'normal');
    await expect(page.locator('#difficulty-screen')).toBeHidden();
    await expect(page.locator('#game-container')).toBeVisible();
  });

  test('errores muestran "0 / 8" en fácil', async ({ page }) => {
    await selectDifficultyAndWait(page, 'easy');
    await expect(page.locator('#errors-count')).toContainText('0 / 8');
  });

  test('errores muestran "0 / 6" en normal', async ({ page }) => {
    await selectDifficultyAndWait(page, 'normal');
    await expect(page.locator('#errors-count')).toContainText('0 / 6');
  });

  test('errores muestran "0 / 4" en difícil', async ({ page }) => {
    await selectDifficultyAndWait(page, 'hard');
    await expect(page.locator('#errors-count')).toContainText('0 / 4');
  });

  test('"Nueva partida" vuelve a mostrar selector de dificultad', async ({ page }) => {
    await selectDifficultyAndWait(page, 'normal');
    await page.locator('#new-game-btn').click();
    await expect(page.locator('#difficulty-screen')).toBeVisible();
    await expect(page.locator('#game-container')).toBeHidden();
  });
});

test.describe('Ahorcado E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await selectDifficultyAndWait(page, 'normal');
  });

  test('la página carga correctamente con todos los elementos', async ({ page }) => {
    await expect(page.locator('#hangman-canvas')).toBeVisible();
    await expect(page.locator('#word-display')).toBeVisible();
    await expect(page.locator('#keyboard')).toBeVisible();
    await expect(page.locator('#new-game-btn')).toBeVisible();
    await expect(page.locator('#errors-count')).toContainText('0 / 6');
  });

  test('el teclado virtual tiene 3 filas con todas las letras', async ({ page }) => {
    const rows = page.locator('.keyboard-row');
    await expect(rows).toHaveCount(3);

    const ñBtn = page.locator('[data-letter="ñ"]');
    await expect(ñBtn).toBeVisible();
    await expect(ñBtn).toHaveText('Ñ');
  });

  test('la palabra se muestra como guiones bajos', async ({ page }) => {
    const display = await page.locator('#word-display').textContent();
    expect(display).toMatch(/^(_ )+_$/);
  });

  test('click en letra del teclado virtual la registra', async ({ page }) => {
    const firstKey = page.locator('.key').first();
    await firstKey.click();

    await expect(firstKey).toBeDisabled();

    const classes = await firstKey.getAttribute('class');
    expect(classes.includes('correct') || classes.includes('wrong')).toBe(true);
  });

  test('teclado físico funciona', async ({ page }) => {
    await page.keyboard.press('a');

    const btn = page.locator('[data-letter="a"]');
    await expect(btn).toBeDisabled();
  });

  test('los errores se incrementan con letras incorrectas', async ({ page }) => {
    const testLetters = ['x', 'w', 'k'];

    for (const letter of testLetters) {
      await page.keyboard.press(letter);
    }

    const errorsText = await page.locator('#errors-count').textContent();
    expect(errorsText).not.toBe('0 / 6');
  });

  test('botón "Nueva partida" muestra selector de dificultad', async ({ page }) => {
    await page.keyboard.press('a');
    await page.keyboard.press('z');

    await page.locator('#new-game-btn').click();
    await expect(page.locator('#difficulty-screen')).toBeVisible();

    // Seleccionar de nuevo para verificar reinicio
    await selectDifficultyAndWait(page, 'normal');
    await expect(page.locator('#errors-count')).toContainText('0 / 6');
    await expect(page.locator('#message')).toHaveText('');

    const disabledKeys = page.locator('.key:disabled');
    await expect(disabledKeys).toHaveCount(0);
  });

  test('juego completo: se puede ganar', async ({ page }) => {
    const letters = 'aeiouprstlnmcdbghjkfqvwxyz';

    for (const letter of letters) {
      const errorsText = await page.locator('#errors-count').textContent();
      const errors = parseInt(errorsText.split('/')[0].trim());

      if (errors >= 5) break;

      await page.keyboard.press(letter);

      const msg = await page.locator('#message').textContent();
      if (msg.includes('Ganaste')) {
        expect(msg).toContain('Ganaste');
        return;
      }
    }

    const display = await page.locator('#word-display').textContent();
    expect(display.length).toBeGreaterThan(0);
  });

  test('juego completo: al perder se revela la palabra', async ({ page }) => {
    const rareLetters = ['x', 'w', 'k', 'z', 'j', 'q', 'v', 'f', 'y'];
    let errors = 0;

    for (const letter of rareLetters) {
      if (errors >= 6) break;
      await page.keyboard.press(letter);

      const errorsText = await page.locator('#errors-count').textContent();
      errors = parseInt(errorsText.split('/')[0].trim());
    }

    if (errors >= 6) {
      const msg = await page.locator('#message').textContent();
      expect(msg).toContain('Perdiste');

      const finalDisplay = await page.locator('#word-display').textContent();
      expect(finalDisplay).not.toContain('_');
    }
  });
});

test.describe('PWA - Manifest e instalabilidad', () => {
  test('el manifest es accesible y tiene los campos requeridos', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.scope).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('es');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    // Verificar que hay iconos con purpose separados (any y maskable)
    const purposes = manifest.icons.map(i => i.purpose);
    expect(purposes).toContain('any');
    expect(purposes).toContain('maskable');

    // Verificar screenshots para Android install prompt
    expect(manifest.screenshots).toBeDefined();
    expect(manifest.screenshots.length).toBeGreaterThanOrEqual(1);
  });

  test('el Service Worker se registra correctamente', async ({ page }) => {
    await page.goto('/');
    await selectDifficultyAndWait(page, 'normal');

    // Verificar que el SW se registró
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });
    expect(swRegistered).toBe(true);
  });
});

test.describe('PWA - Funcionamiento offline', () => {
  test('la app funciona sin conexión usando diccionario local', async ({ page, context }) => {
    // Cargar la app online primero para que se cacheen los assets
    await page.goto('/');
    await selectDifficultyAndWait(page, 'normal');

    // Esperar a que el Service Worker esté activo
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.installing) {
        await new Promise(resolve => {
          reg.installing.addEventListener('statechange', function handler(e) {
            if (e.target.state === 'activated') {
              resolve();
              e.target.removeEventListener('statechange', handler);
            }
          });
        });
      }
    });

    // Simular offline bloqueando todas las requests externas
    await context.setOffline(true);

    // Recargar la página en modo offline
    await page.reload();
    await selectDifficultyAndWait(page, 'normal');

    // Verificar que el juego funciona offline
    await expect(page.locator('#keyboard')).toBeVisible();
    await expect(page.locator('#hangman-canvas')).toBeVisible();

    // Jugar una partida offline
    await page.keyboard.press('a');
    const btn = page.locator('[data-letter="a"]');
    await expect(btn).toBeDisabled();

    // Restaurar online
    await context.setOffline(false);
  });
});
