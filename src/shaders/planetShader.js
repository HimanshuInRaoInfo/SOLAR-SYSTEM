import * as THREE from 'three';

/**
 * Photorealistic Planet Surface Shader
 * Used for Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
 * Features:
 * - Dynamic Day/Night lighting with soft, natural twilight terminator
 * - All-angle starlight & cosmic ambient illumination (prevents muddy black shadow sides)
 * - Built-in atmospheric Fresnel limb glow visible from EVERY viewing angle
 * - High-contrast surface color reproduction
 * - Instant toggle support for uSunLightingEnabled
 */
export function createPlanetMaterial({
  map,
  bumpMap = null,
  bumpScale = 0.05,
  glowColor = '#90caf9',
  ambientIntensity = 0.32,
  fresnelPower = 3.2,
  fresnelIntensity = 0.55
} = {}) {
  const uniforms = {
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uDayMap: { value: map },
    uBumpMap: { value: bumpMap },
    uHasBumpMap: { value: bumpMap ? 1.0 : 0.0 },
    uBumpScale: { value: bumpScale },
    uGlowColor: { value: new THREE.Color(glowColor) },
    uAmbientIntensity: { value: ambientIntensity },
    uFresnelPower: { value: fresnelPower },
    uFresnelIntensity: { value: fresnelIntensity },
    uSunLightingEnabled: { value: 1.0 }
  };

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    void main() {
      vUv = uv;
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
    uniform sampler2D uDayMap;
    uniform sampler2D uBumpMap;
    uniform float uHasBumpMap;
    uniform float uBumpScale;
    uniform vec3 uGlowColor;
    uniform float uAmbientIntensity;
    uniform float uFresnelPower;
    uniform float uFresnelIntensity;
    uniform float uSunLightingEnabled;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewDir;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 worldNormal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewDir);
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);

      // Texture color
      vec4 texColor = texture2D(uDayMap, vUv);

      // Bump mapping perturbation if provided
      if (uHasBumpMap > 0.5) {
        float bumpVal = texture2D(uBumpMap, vUv).r;
        texColor.rgb *= (0.85 + bumpVal * 0.35);
      }

      if (uSunLightingEnabled < 0.5) {
        // Uniform Classroom Mode: vibrant, fully-lit globe from all angles
        float rim = pow(1.0 - max(0.0, dot(normal, viewDir)), uFresnelPower);
        vec3 rimColor = uGlowColor * rim * uFresnelIntensity * 0.6;
        gl_FragColor = vec4(texColor.rgb * 1.25 + rimColor, 1.0);
        return;
      }

      // Day / Night transition
      float NdotL = dot(worldNormal, sunDir);

      // Broad, realistic daylight spread (keeps ~70% illuminated with soft roll-off)
      float dayFactor = smoothstep(-0.35, 0.35, NdotL);

      // All-angle atmospheric Fresnel edge glow (makes the edge luminous from EVERY angle)
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), uFresnelPower);
      float sunLimbBoost = smoothstep(-0.2, 0.6, NdotL) * 1.5;
      vec3 rimGlow = uGlowColor * fresnel * (0.45 + sunLimbBoost) * uFresnelIntensity;

      // Surface lighting:
      // Day side: full sunlight brilliance
      // Night side: soft starlight/ambient fill (32-35%), so features remain clearly visible
      float lightIntensity = max(dayFactor, uAmbientIntensity) * 1.25;
      vec3 illuminatedSurface = texColor.rgb * lightIntensity;

      // Combine surface radiance with atmospheric rim glow
      vec3 finalColor = illuminatedSurface + rimGlow;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  });
}
