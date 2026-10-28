import * as THREE from 'three';

/**
 * Animated Solar Plasma Photosphere Shader
 * Simulates convective solar granules, magnetic flare turbulence, and corona radiation.
 */
export function createSunMaterial(sunTexture) {
  const uniforms = {
    uTime: { value: 0 },
    uTexture: { value: sunTexture },
    uColorCore: { value: new THREE.Color('#fff0a6') },
    uColorEdge: { value: new THREE.Color('#ff4d00') }
  };

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform vec3 uColorCore;
    uniform vec3 uColorEdge;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // Simple pseudo-noise for plasma turbulence
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      // Swirling solar UV coordinates
      vec2 uvFlow1 = vUv + vec2(uTime * 0.005, uTime * 0.002);
      vec2 uvFlow2 = vUv * 1.5 - vec2(uTime * 0.008, uTime * 0.004);

      vec4 tex1 = texture2D(uTexture, uvFlow1);
      vec4 tex2 = texture2D(uTexture, uvFlow2);
      vec3 baseMap = mix(tex1.rgb, tex2.rgb, 0.5);

      // Convective granulation noise
      float gran = noise(vUv * 40.0 + uTime * 0.15) * 0.25;

      // Limb darkening / brightening
      float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
      rim = pow(rim, 1.8);

      vec3 plasmaColor = mix(uColorCore, uColorEdge, rim * 0.65 + gran);
      // Toned-down brightness — visually detailed but not eye-searing
      vec3 finalColor = (baseMap * 1.0 + plasmaColor * 0.6) * (0.9 + gran * 0.5);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  });
}

/**
 * Solar Corona Halo Material
 * Volumetric glow aura extending outside the Sun's physical sphere.
 */
export function createCoronaMaterial(color = '#ff9900') {
  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) }
  };

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Soft outer edge falloff — tighter falloff so corona stays close
      float intensity = pow(0.72 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
      // Subtle pulse
      float pulse = 0.88 + 0.08 * sin(uTime * 1.5 + vPosition.x * 0.5);
      
      vec3 glow = uColor * intensity * 1.1 * pulse;
      gl_FragColor = vec4(glow, intensity * 0.55);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
}

