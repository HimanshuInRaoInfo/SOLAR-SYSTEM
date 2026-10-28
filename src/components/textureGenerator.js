import * as THREE from 'three';

/**
 * Procedural Texture Generator and Safe Texture Loader
 * Provides procedural fallbacks so that planets and rings always look magnificent
 * even if offline or if an image file is pending.
 */
export class TextureManager {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.cache = new Map();
  }

  load(url, fallbackType = 'rocky', fallbackColor = '#888888') {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const texture = this.loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
      },
      undefined,
      (err) => {
        console.warn(`Texture load failed for ${url}, switching to procedural generator.`, err);
        const proceduralCanvas = this.generateProceduralTexture(fallbackType, fallbackColor);
        texture.image = proceduralCanvas;
        texture.needsUpdate = true;
      }
    );

    this.cache.set(url, texture);
    return texture;
  }

  generateProceduralTexture(type, baseColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color(baseColorHex);

    if (type === 'gas_giant') {
      // Swirling atmospheric bands
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0.0, baseColor.clone().offsetHSL(0.02, 0.1, -0.1).getStyle());
      grad.addColorStop(0.2, baseColor.clone().offsetHSL(-0.02, 0.2, 0.1).getStyle());
      grad.addColorStop(0.4, baseColor.clone().offsetHSL(0.05, -0.1, -0.2).getStyle());
      grad.addColorStop(0.5, baseColor.getStyle());
      grad.addColorStop(0.6, baseColor.clone().offsetHSL(-0.04, 0.15, 0.15).getStyle());
      grad.addColorStop(0.8, baseColor.clone().offsetHSL(0.03, -0.1, -0.15).getStyle());
      grad.addColorStop(1.0, baseColor.clone().offsetHSL(0.01, 0.05, -0.25).getStyle());
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Micro bands and storms
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08})`;
        ctx.fillRect(0, y, canvas.width, 2 + Math.random() * 4);
      }
    } else if (type === 'ring') {
      // Saturn-like concentric ring pattern
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0.0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.1, 'rgba(210,180,140,0.4)');
      grad.addColorStop(0.3, 'rgba(230,205,160,0.8)');
      grad.addColorStop(0.55, 'rgba(240,215,170,0.9)');
      grad.addColorStop(0.62, 'rgba(20,15,10,0.05)'); // Cassini Division
      grad.addColorStop(0.70, 'rgba(225,195,150,0.7)');
      grad.addColorStop(0.95, 'rgba(180,150,110,0.3)');
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add fine striations
      for (let x = 0; x < canvas.width; x += 3) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
          ctx.fillRect(x, 0, 1, canvas.height);
        }
      }
    } else {
      // Rocky / cratered terrestrial surface
      ctx.fillStyle = baseColor.getStyle();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random craters and texture noise
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 2 + Math.random() * 18;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(30, 30, 30, 0.45)');
        grad.addColorStop(0.7, 'rgba(60, 60, 60, 0.2)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return canvas;
  }
}

export const textureManager = new TextureManager();

