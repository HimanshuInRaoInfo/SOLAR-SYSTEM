import * as THREE from 'three';

/**
 * Photorealistic Rayleigh Atmospheric Limb Scattering Shader
 * Generates an atmospheric limb glow visible from ALL viewing angles,
 * with forward-scattering golden sunrise/sunset flares on the sunward horizon,
 * matching NASA orbital imagery.
 */
export function createAtmosphereMaterial({
  atmosphereColor = '#4ca3ff',
  sunsetGlowColor = '#ff9933',
  glowPower = 2.6,
  intensity = 1.8,
  isOuterGlow = false
} = {}) {
  const uniforms = {
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uDayColor: { value: new THREE.Color(atmosphereColor) },
    uSunsetColor: { value: new THREE.Color(sunsetGlowColor) },
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
    uniform vec3 uDayColor;
    uniform vec3 uSunsetColor;
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

      // Rim factor: maximum along the tangential horizon limb
      float rim = 1.0 - max(0.0, dot(normal, viewDir));
      float rimGlow = pow(rim, uGlowPower);

      // 1. All-Angle Horizon Glow: ensures the planet glows around its entire silhouette from EVERY angle
      float allAngleGlow = rimGlow * 0.55;

      if (uSunLightingEnabled < 0.5) {
        // Uniform inspection mode: clean vibrant halo around the entire globe
        float alpha = rimGlow * uIntensity * 1.1;
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(uDayColor, min(alpha, 1.0));
        return;
      }

      // Light direction from Sun
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);
      float NdotL = dot(worldNormal, sunDir);

      // 2. Sunward forward scattering boost (strongest on sunlit horizon)
      float sunFactor = smoothstep(-0.25, 0.60, NdotL);
      float sunGlow = rimGlow * sunFactor * 1.4;

      // 3. Golden sunset/twilight flare right at the day-night horizon
      float sunsetFactor = smoothstep(-0.15, 0.05, NdotL) * (1.0 - smoothstep(0.05, 0.30, NdotL));
      sunsetFactor = pow(sunsetFactor, 1.5) * 1.8;

      // Color transition: electric cyan/blue sky to luminous champagne-gold sunset
      vec3 atmColor = mix(uDayColor, uSunsetColor, clamp(sunsetFactor * 0.85, 0.0, 1.0));

      // Final opacity combines all-angle visibility with sunward brilliance
      float alpha = (allAngleGlow + sunGlow + sunsetFactor * rimGlow * 0.6) * uIntensity;

      if (alpha < 0.005) discard;

      gl_FragColor = vec4(atmColor, min(alpha, 1.0));
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    side: isOuterGlow ? THREE.BackSide : THREE.FrontSide,
    transparent: true,
    depthWrite: false
  });
}
