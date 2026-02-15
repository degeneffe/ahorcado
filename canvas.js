class HangmanCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const container = this.canvas.parentElement;
    const size = Math.min(container.clientWidth, 350);
    this.canvas.width = size;
    this.canvas.height = size;
    this.scale = size / 350;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawStep(step) {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--fg-color').trim() || '#222';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';

    switch (step) {
      case 0: this._drawGallows(); break;
      case 1: this._drawHead(); break;
      case 2: this._drawBody(); break;
      case 3: this._drawLeftArm(); break;
      case 4: this._drawRightArm(); break;
      case 5: this._drawLeftLeg(); break;
      case 6: this._drawRightLeg(); break;
    }
  }

  reset() {
    this.resize();
    this.clear();
    this.drawStep(0);
  }

  _drawGallows() {
    const ctx = this.ctx;
    const s = this.scale;
    // Base
    ctx.beginPath();
    ctx.moveTo(30 * s, 320 * s);
    ctx.lineTo(180 * s, 320 * s);
    ctx.stroke();
    // Poste vertical
    ctx.beginPath();
    ctx.moveTo(80 * s, 320 * s);
    ctx.lineTo(80 * s, 40 * s);
    ctx.stroke();
    // Poste horizontal
    ctx.beginPath();
    ctx.moveTo(80 * s, 40 * s);
    ctx.lineTo(220 * s, 40 * s);
    ctx.stroke();
    // Cuerda
    ctx.beginPath();
    ctx.moveTo(220 * s, 40 * s);
    ctx.lineTo(220 * s, 80 * s);
    ctx.stroke();
  }

  _drawHead() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.beginPath();
    ctx.arc(220 * s, 110 * s, 30 * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawBody() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.beginPath();
    ctx.moveTo(220 * s, 140 * s);
    ctx.lineTo(220 * s, 230 * s);
    ctx.stroke();
  }

  _drawLeftArm() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.beginPath();
    ctx.moveTo(220 * s, 165 * s);
    ctx.lineTo(170 * s, 200 * s);
    ctx.stroke();
  }

  _drawRightArm() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.beginPath();
    ctx.moveTo(220 * s, 165 * s);
    ctx.lineTo(270 * s, 200 * s);
    ctx.stroke();
  }

  _drawLeftLeg() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.beginPath();
    ctx.moveTo(220 * s, 230 * s);
    ctx.lineTo(175 * s, 290 * s);
    ctx.stroke();
  }

  _drawRightLeg() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.beginPath();
    ctx.moveTo(220 * s, 230 * s);
    ctx.lineTo(265 * s, 290 * s);
    ctx.stroke();
  }
}
