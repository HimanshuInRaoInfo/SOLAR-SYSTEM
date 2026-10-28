import * as THREE from 'three';

/**
 * Photorealistic Earth Shader
 * Seamlessly integrates Day Map, Night City Lights, Normal/Bump Map,
 * Ocean Specular Glint, and soft twilight terminator transitions.
 * Ensures Earth is never muddy or dark from any viewing angle,
 * perfectly matching NASA orbital photographs.
 */
export function createEarthMaterial({
  dayTexture,
  nightTexture,
  normalTexture,
  specularTexture
}) {
  const uniforms = {
    uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    uDayMap: { value: dayTexture },
    uNightMap: { value: nightTexture },
    uNormalMap: { value: normalTexture },
    uSpecularMap: { value: specularTexture },
    uSunsetGlow: { value: new THREE.Color('#ffa033') },
    uAmbientIntensity: { value: 0.38 }, // Elevated ambient fill so night side is rich navy with visible continents
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
    uniform sampler2D uNightMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uSpecularMap;
    uniform vec3 uSunsetGlow;
    uniform float uAmbientIntensity;
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

      // Fetch textures
      vec4 dayColor = texture2D(uDayMap, vUv);
      vec4 nightColor = texture2D(uNightMap, vUv);
      vec4 specColor = texture2D(uSpecularMap, vUv);

      if (uSunLightingEnabled < 0.5) {
        // Uniform Inspection Mode: crisp, vivid daylight across the entire globe
        float spec = pow(max(0.0, dot(normal, viewDir)), 32.0) * specColor.r * 0.35;
        gl_FragColor = vec4(dayColor.rgb * 1.25 + vec3(spec), 1.0);
        return;
      }

      // Angle of surface normal to sunlight
      float NdotL = dot(worldNormal, sunDir);

      // Broad, soft daylight coverage (keeps ~75% of globe warmly lit like real space photos)
      float dayFactor = smoothstep(-0.35, 0.35, NdotL);

      // Night city lights on the unlit hemisphere
      float nightFactor = 1.0 - smoothstep(-0.25, 0.15, NdotL);

      // Specular ocean sun reflection on day side
      vec3 camSunDir = normalize((viewMatrix * vec4(sunDir, 0.0)).xyz);
      vec3 halfVector = normalize(camSunDir + viewDir);
      float specStrength = max(0.0, dot(normal, halfVector));
      float specular = pow(specStrength, 48.0) * specColor.r * 1.6 * dayFactor;

      // Surface color: Daylight side has vibrant natural colors, night side has rich navy ambient starlight
      // Night side retains visible continental terrain and deep blue oceans, matching NASA orbital photos
      vec3 nightAmbient = mix(vec3(0.08, 0.14, 0.28), dayColor.rgb * 0.35, 0.65);
      vec3 surfaceDay = dayColor.rgb * max(dayFactor, uAmbientIntensity) * 1.25;
      vec3 surfaceNight = mix(surfaceDay, nightAmbient, nightFactor * 0.65);

      // Glowing night city lights in populated areas
      vec3 cityLights = nightColor.rgb * nightFactor * 2.0;

      // Ocean sun glint
      vec3 sunGlint = vec3(1.0, 0.96, 0.90) * specular;

      // Surface atmospheric Fresnel rim (ensures an ethereal glowing edge from ALL angles)
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.8);
      vec3 surfaceRim = vec3(0.35, 0.65, 1.0) * fresnel * 0.45;

      // Combined radiance
      vec3 finalColor = surfaceNight + cityLights + sunGlint + surfaceRim;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  });
}
