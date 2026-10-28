import * as THREE from 'three';

/**
 * Deep Space Starfield & Milky Way background stripe.
 *
 * This starfield is always visible as a fixed background (no depth intersection
 * with the solar system) and represents the distant stellar backdrop.
 * Stars are placed at radius 2000–5000 units — far beyond any solar system object.
 */
export function createStarfield(count = 12000) {
  const group = new THREE.Group();

  // Spectral palette (O, B, A, F, G, K, M classes)
  const spectral = [
    new THREE.Color('#9bb0ff'), // O/B blue
    new THREE.Color('#bbccff'), // B
    new THREE.Color('#f8f9ff'), // A white
    new THREE.Color('#ffffff'),
    new THREE.Color('#fff4e8'), // G solar yellow
    new THREE.Color('#ffd2a1'), // K orange
    new THREE.Color('#ffaa6e'), // M red dwarf
  ];

  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  const phases    = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const radius = 2000 + Math.random() * 3000;
    const theta  = Math.random() * Math.PI * 2;
    // Slight Milky Way band concentration
    let phi = Math.acos((Math.random() * 2) - 1);
    if (Math.random() < 0.4) {
      phi = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    }

    positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const col = spectral[Math.floor(Math.random() * spectral.length)];
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    const m = Math.random();
    sizes[i] = m > 0.985 ? 3.5 : m > 0.90 ? 2.0 : 1.0 + Math.random() * 0.8;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));
  geo.setAttribute('phase',    new THREE.BufferAttribute(phases,    1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uTime;

      void main() {
        vColor   = color;
        vTwinkle = 0.82 + 0.22 * sin(uTime * 1.8 + phase);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * vTwinkle * (900.0 / -mvPos.z);
        gl_PointSize = clamp(gl_PointSize, 0.4, 3.5);
        gl_Position  = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2  c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        a += pow(smoothstep(0.22, 0.0, d), 2.0) * 0.4;
        gl_FragColor = vec4(vColor * vTwinkle, a);
      }
    `,
    blending:   THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  return {
    group,
    update: (t) => { mat.uniforms.uTime.value = t; },
  };
}
