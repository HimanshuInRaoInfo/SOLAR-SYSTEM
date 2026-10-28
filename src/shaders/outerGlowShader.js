import * as THREE from 'three';

/**
 * Photorealistic Outer Atmospheric Flare & Corona Shader
 * Generates the soft volumetric golden halo radiating into space beyond the planet's limb,
 * matching the user's reference NASA orbital photographs.
 */
export function createOuterGlowMaterial({
  color = '#ff9933',
  dayColor = '#4ca3ff',
  glowPower = 1.6,
  intensity = 1.8
} = {}) {
  const uniforms = {
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uGlowColor: { value: new THREE.Color(color) },
    uDayColor: { value: new THREE.Color(dayColor) },
    uGlowPower: { value: glowPower },
    uIntensity: { value: intensity },
    uSunLightingEnabled: { value: 1.0 }
  };

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uSunPosition;
    uniform vec3 uGlowColor;
    uniform vec3 uDayColor;
    uniform float uGlowPower;
    uniform float uIntensity;
    uniform float uSunLightingEnabled;

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewDir);

      // On the back hemisphere, normal points away from camera, so -dot(normal, viewDir) > 0.
      // At the planet limb: ~0.49. At outer boundary in space: 0.0.
      float inwardCos = max(0.0, -dot(normal, viewDir));
      float radialFalloff = clamp(inwardCos / 0.50, 0.0, 1.0);
      float halo = pow(radialFalloff, uGlowPower);

      if (uSunLightingEnabled < 0.5) {
        // Uniform Classroom Mode: omnidirectional vibrant halo
        float alpha = halo * uIntensity * 0.85;
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(uDayColor, min(alpha, 1.0));
        return;
      }

      // Light direction from Sun
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);

      // Sun alignment: strongest flare on the sun-facing limb
      float sunFacing = dot(worldNormal, sunDir);
      float sunFlare = smoothstep(-0.25, 0.70, sunFacing);

      // Golden flare near sunward limb, blending into cyan atmospheric halo
      vec3 flareColor = mix(uDayColor, uGlowColor, clamp(sunFlare * 1.5, 0.0, 1.0));

      // All-angle subtle halo + intense sunward golden flare radiating into space
      float alpha = halo * (0.35 + sunFlare * 1.8) * uIntensity;

      if (alpha < 0.005) discard;

      gl_FragColor = vec4(flareColor, min(alpha, 1.0));
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
