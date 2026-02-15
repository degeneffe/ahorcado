import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HangmanCanvas } from '../../canvas.js';

function createMockCanvas() {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
  };
  const canvas = {
    getContext: vi.fn().mockReturnValue(ctx),
    width: 350,
    height: 350,
    parentElement: { clientWidth: 350 },
  };
  return { canvas, ctx };
}

describe('HangmanCanvas', () => {
  let hangmanCanvas, mockCanvas, mockCtx;

  beforeEach(() => {
    const mock = createMockCanvas();
    mockCanvas = mock.canvas;
    mockCtx = mock.ctx;

    vi.stubGlobal('getComputedStyle', vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('#222'),
    }));

    hangmanCanvas = new HangmanCanvas(mockCanvas);
  });

  describe('constructor', () => {
    it('obtiene el contexto 2d del canvas', () => {
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('inicializa la escala', () => {
      expect(hangmanCanvas.scale).toBe(1);
    });
  });

  describe('resize', () => {
    it('ajusta al ancho del contenedor si es menor a 350', () => {
      mockCanvas.parentElement.clientWidth = 200;
      hangmanCanvas.resize();
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(200);
      expect(hangmanCanvas.scale).toBeCloseTo(200 / 350);
    });

    it('no supera 350px', () => {
      mockCanvas.parentElement.clientWidth = 500;
      hangmanCanvas.resize();
      expect(mockCanvas.width).toBe(350);
      expect(hangmanCanvas.scale).toBe(1);
    });
  });

  describe('clear', () => {
    it('limpia todo el canvas', () => {
      hangmanCanvas.clear();
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
    });
  });

  describe('drawStep', () => {
    it('dibuja la horca en el paso 0', () => {
      mockCtx.stroke.mockClear();
      hangmanCanvas.drawStep(0);
      expect(mockCtx.stroke).toHaveBeenCalledTimes(4);
    });

    it('dibuja la cabeza en el paso 1', () => {
      mockCtx.arc.mockClear();
      hangmanCanvas.drawStep(1);
      expect(mockCtx.arc).toHaveBeenCalledTimes(1);
    });

    it('dibuja el cuerpo en el paso 2', () => {
      mockCtx.moveTo.mockClear();
      mockCtx.lineTo.mockClear();
      hangmanCanvas.drawStep(2);
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('dibuja cada paso del 3 al 6 (extremidades)', () => {
      for (let step = 3; step <= 6; step++) {
        mockCtx.stroke.mockClear();
        hangmanCanvas.drawStep(step);
        expect(mockCtx.stroke).toHaveBeenCalledTimes(1);
      }
    });

    it('configura el estilo del trazo', () => {
      hangmanCanvas.drawStep(1);
      expect(mockCtx.lineWidth).toBe(3);
      expect(mockCtx.lineCap).toBe('round');
    });
  });

  describe('reset', () => {
    it('limpia y redibuja la horca', () => {
      const clearSpy = vi.spyOn(hangmanCanvas, 'clear');
      const drawStepSpy = vi.spyOn(hangmanCanvas, 'drawStep');
      hangmanCanvas.reset();
      expect(clearSpy).toHaveBeenCalled();
      expect(drawStepSpy).toHaveBeenCalledWith(0);
    });
  });
});
