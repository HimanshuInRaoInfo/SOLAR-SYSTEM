import * as THREE from 'three';

/**
 * Photorealistic Sagittarius A* Supermassive Black Hole
 * Features:
 * - Pitch-black Event Horizon shadow
 * - Relativistic Accretion Disk with gravitational lensing bend
 * - Doppler beaming asymmetry (approaching side is brighter & blueshifted)
 * - Thin glowing photon ring
 */
export function createAccretionDiskMaterial() {
  const uniforms = {
    uTime: { value: 0 },
    uInnerRadius: { value: 6.0 },
    uOuterRadius: { value: 24.0 },
    uColorCore: { value: new THREE.Color('#ffaa33') },
    uColorHot: { value: new THREE.Color('#ffffff') },
    uColorCold: { value: new THREE.Color('#ff3300') }
  };

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform vec3 uColorCore;
    uniform vec3 uColorHot;
    uniform vec3 uColorCold;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // UV center is at (0.5, 0.5)
      vec2 center = vUv - vec2(0.5);
      float dist = length(center) * 2.0; // 0.0 at center, 1.0 at outer edge
      
      // Radius normalization: 0 at inner edge, 1 at outer edge
      if (dist < 0.25 || dist > 1.0) discard;

      float radial = (dist - 0.25) / 0.75;
      float angle = atan(center.y, center.x);

      // Orbital rotation velocity: Keplerian differential rotation v ~ 1/sqrt(r)
      float speed = 2.5 / sqrt(radial + 0.1);
      float rotAngle = angle - uTime * speed * 0.4;

      // Swirling plasma turbulence striations
      float spiral = sin(rotAngle * 6.0 + radial * 14.0);
      float noise = hash(vec2(rotAngle * 3.0, radial * 12.0)) * 0.25;
      float turbulence = smoothstep(-0.8, 0.8, spiral) + noise;

      // Relativistic Doppler Beaming asymmetry: material rotating towards viewer is brighter
      // In disk plane, cos(angle) indicates direction of motion
      float doppler = 1.0 + 0.65 * sin(angle);

      // Temperature gradient: ultra-hot white-blue near inner ISCO, transitioning to orange-red at outer edge
      vec3 tempColor = mix(uColorHot, uColorCore, smoothstep(0.0, 0.35, radial));
      tempColor = mix(tempColor, uColorCold, smoothstep(0.35, 1.0, radial));

      // Density falloff
      float density = smoothstep(0.0, 0.08, radial) * (1.0 - smoothstep(0.7, 1.0, radial));
      density *= (0.85 + 0.3 * turbulence) * doppler;

      // Photon ring peak near the innermost stable circular orbit (ISCO)
      float photonRing = exp(-pow((radial - 0.02) * 35.0, 2.0)) * 2.8;

      vec3 finalColor = tempColor * (density + photonRing) * 1.8;
      float alpha = clamp(density * 1.2 + photonRing * 0.8, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

/**
 * Gravitational Lensing Aura around the Black Hole Shadow
 */
export function createPhotonRingMaterial() {
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      float rim = 1.0 - max(0.0, dot(vNormal, vViewDir));
      // Sharp glowing ring just skimming the shadow
      float ring = pow(rim, 6.0) * 3.5;
      vec3 col = mix(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.9, 0.7), rim);
      gl_FragColor = vec4(col * ring, ring * 0.9);
    }
  `;

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide
  });
}

