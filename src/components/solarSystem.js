import * as THREE from 'three';
import { SOLAR_SYSTEM_DATA, ASTEROID_BELT_CONFIG, KUIPER_BELT_CONFIG } from '../planetsData.js';
import { createEarthMaterial } from '../shaders/earthShader.js';
import { createPlanetMaterial } from '../shaders/planetShader.js';
import { createAtmosphereMaterial } from '../shaders/atmosphereShader.js';
import { createOuterGlowMaterial } from '../shaders/outerGlowShader.js';
import { createSunMaterial, createCoronaMaterial } from '../shaders/sunShader.js';
import { textureManager } from './textureGenerator.js';

export class SolarSystem {
  constructor(scene) {
    this.scene = scene;
    this.planets = new Map();
    this.orbitLines = new Map();
    this.moons = [];
    this.animatedMaterials = [];
    this.outerGlowMeshes = [];
    this.sunPosition = new THREE.Vector3(0, 0, 0);

    // Settings
    this.timeScale = 1.0;
    this.showOrbits = true;
    this.showAsteroids = true;
    this.showAtmospheres = true;
    this.showClouds = true;
    this.sunLightingEnabled = true;
    this.showSolarBeams = false;

    this.init();
  }

  init() {
    this.setupLighting();
    this.createSun();
    this.createPlanets();
    this.createAsteroidBelt();
    this.createKuiperBelt();
    this.createSolarBeams();
  }

  setupLighting() {
    // 1. Primary solar point light (warm, radiant sunlight reaching all planets)
    this.sunLight = new THREE.PointLight(0xfff8ee, 2.8, 4500, 0.3);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // 2. Cosmic ambient starlight fill (ensures planets are never muddy or pitch-black)
    this.ambientLight = new THREE.AmbientLight(0x50658a, 0.75);
    this.scene.add(this.ambientLight);

    // 3. Camera-linked omnidirectional fill light (ensures planets are illuminated from ALL viewing angles)
    this.cameraFillLight = new THREE.PointLight(0xdde8ff, 0.65, 5000, 0.0);
    this.cameraFillLight.position.set(0, 140, 260);
    this.scene.add(this.cameraFillLight);
  }

  createSun() {
    const data = SOLAR_SYSTEM_DATA.sun;
    const geometry = new THREE.SphereGeometry(data.radius, 64, 64);
    const texture = textureManager.load(data.texture, 'gas_giant', data.color);

    const sunMaterial = createSunMaterial(texture);
    this.animatedMaterials.push(sunMaterial);

    const sunMesh = new THREE.Mesh(geometry, sunMaterial);
    sunMesh.userData = { id: 'sun', data };
    this.scene.add(sunMesh);

    // Corona aura
    const coronaGeo = new THREE.SphereGeometry(data.radius * 1.15, 32, 32);
    const coronaMat = createCoronaMaterial('#ff9911');
    this.animatedMaterials.push(coronaMat);
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    this.scene.add(coronaMesh);

    this.sun = {
      mesh: sunMesh,
      corona: coronaMesh,
      data
    };
    this.planets.set('sun', this.sun);
  }

  createPlanets() {
    for (const [key, data] of Object.entries(SOLAR_SYSTEM_DATA)) {
      if (key === 'sun' || key === 'moon') continue;

      // Pivot group at solar origin
      const orbitPivot = new THREE.Group();
      this.scene.add(orbitPivot);

      // Body group positioned along orbit
      const bodyGroup = new THREE.Group();
      bodyGroup.position.x = data.distance;
      orbitPivot.add(bodyGroup);

      // Apply axial tilt to the body group
      const tiltRad = THREE.MathUtils.degToRad(data.axialTilt || 0);
      bodyGroup.rotation.z = tiltRad;

      // Handle orbital inclination (e.g., Pluto)
      if (data.orbitalInclination) {
        orbitPivot.rotation.x = THREE.MathUtils.degToRad(data.orbitalInclination);
      }

      // Planet surface mesh
      const sphereGeo = new THREE.SphereGeometry(data.radius, 64, 64);
      let planetMesh;
      let cloudsMesh = null;
      let atmosphereMesh = null;
      let outerGlowMesh = null;

      if (key === 'earth') {
        // High fidelity multi-pass Earth with day/night/normal/specular maps
        const dayTex = textureManager.load(data.texture, 'rocky', data.color);
        const nightTex = textureManager.load(data.lightsTexture, 'rocky', '#000000');
        const normalTex = textureManager.load(data.normalTexture, 'rocky', '#8080ff');
        const specTex = textureManager.load(data.specularTexture, 'rocky', '#ffffff');

        const earthMat = createEarthMaterial({
          dayTexture: dayTex,
          nightTexture: nightTex,
          normalTexture: normalTex,
          specularTexture: specTex
        });
        planetMesh = new THREE.Mesh(sphereGeo, earthMat);
        this.animatedMaterials.push(earthMat);

        // Dynamic cloud layer (bright white swirls floating over the oceans/land)
        if (data.hasClouds) {
          const cloudsTex = textureManager.load(data.cloudsTexture, 'gas_giant', '#ffffff');
          const cloudsGeo = new THREE.SphereGeometry(data.radius * (data.cloudsScale || 1.014), 64, 64);
          const cloudsMat = new THREE.MeshStandardMaterial({
            map: cloudsTex,
            transparent: true,
            opacity: 0.92,
            blending: THREE.NormalBlending,
            depthWrite: false,
            roughness: 0.35,
            emissive: new THREE.Color(0x334455),
            emissiveIntensity: 0.35
          });
          cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
          bodyGroup.add(cloudsMesh);
        }

        // Earth Rayleigh Atmospheric Scattering Rim (all-angle cyan limb + golden sunset)
        if (data.hasAtmosphere) {
          const atmoGeo = new THREE.SphereGeometry(data.radius * (data.atmosphereScale || 1.025), 64, 64);
          const atmoMat = createAtmosphereMaterial({
            atmosphereColor: data.atmosphereColor,
            sunsetGlowColor: data.sunsetGlowColor,
            glowPower: 3.2,
            intensity: 1.6
          });
          atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
          this.animatedMaterials.push(atmoMat);
          bodyGroup.add(atmosphereMesh);

          // Outer golden atmospheric flare radiating into space (matching user's reference NASA photo!)
          const outerGlowGeo = new THREE.SphereGeometry(data.radius * 1.15, 64, 64);
          const outerGlowMat = createOuterGlowMaterial({
            color: '#ffa033',
            dayColor: '#4ca3ff',
            glowPower: 2.2,
            intensity: 1.5
          });
          outerGlowMesh = new THREE.Mesh(outerGlowGeo, outerGlowMat);
          this.animatedMaterials.push(outerGlowMat);
          this.outerGlowMeshes.push(outerGlowMesh);
          bodyGroup.add(outerGlowMesh);
        }

        // Create the photorealistic Moon orbiting Earth
        this.createPhotorealisticMoon(bodyGroup, SOLAR_SYSTEM_DATA.moon);

      } else {
        // Photorealistic Planet Surface Shader:
        // Craters, cloud belts, and surface terrain illuminated realistically with all-angle glowing rim!
        const tex = textureManager.load(
          data.texture,
          data.type.includes('Gas') || data.type.includes('Ice') ? 'gas_giant' : 'rocky',
          data.color
        );

        const planetMat = createPlanetMaterial({
          map: tex,
          glowColor: data.atmosphereColor || data.glowColor || data.color || '#90caf9',
          ambientIntensity: 0.35, // Ensures planets are never dark or muddy from any angle!
          fresnelPower: 2.8,
          fresnelIntensity: 0.65
        });
        planetMesh = new THREE.Mesh(sphereGeo, planetMat);
        this.animatedMaterials.push(planetMat);

        // Every planet gets an ethereal glowing atmosphere / limb halo shell visible from ALL angles
        const atmoGeo = new THREE.SphereGeometry(data.radius * (data.atmosphereScale || 1.025), 48, 48);
        const atmoMat = createAtmosphereMaterial({
          atmosphereColor: data.atmosphereColor || data.glowColor || '#90caf9',
          sunsetGlowColor: data.glowColor || '#ffaa33',
          glowPower: 2.6,
          intensity: data.hasAtmosphere ? 1.6 : 1.0
        });
        atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        this.animatedMaterials.push(atmoMat);
        bodyGroup.add(atmosphereMesh);

        // Outer volumetric atmospheric flare radiating into space (matching user's reference NASA photo!)
        const outerGlowGeo = new THREE.SphereGeometry(data.radius * 1.14, 32, 32);
        const outerGlowMat = createOuterGlowMaterial({
          color: data.glowColor || '#ffaa33',
          dayColor: data.atmosphereColor || '#90caf9',
          glowPower: 2.0,
          intensity: data.hasAtmosphere ? 1.4 : 0.85
        });
        outerGlowMesh = new THREE.Mesh(outerGlowGeo, outerGlowMat);
        this.animatedMaterials.push(outerGlowMat);
        this.outerGlowMeshes.push(outerGlowMesh);
        bodyGroup.add(outerGlowMesh);
      }

      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      planetMesh.userData = { id: key, data };
      bodyGroup.add(planetMesh);

      // Saturn & Uranus Rings
      let ringsMesh = null;
      if (data.hasRings) {
        ringsMesh = this.createPlanetRings(data);
        bodyGroup.add(ringsMesh);
      }

      // Other planetary Moons
      if (data.moons && Array.isArray(data.moons)) {
        for (const moonData of data.moons) {
          this.createGenericMoon(bodyGroup, moonData, data);
        }
      }

      // Orbital Trajectory Line
      const orbitLine = this.createOrbitLine(data.distance, data.color);
      if (data.orbitalInclination) {
        orbitLine.rotation.x = THREE.MathUtils.degToRad(data.orbitalInclination);
      }
      this.scene.add(orbitLine);
      this.orbitLines.set(key, orbitLine);

      // Store planet entry
      this.planets.set(key, {
        id: key,
        orbitPivot,
        bodyGroup,
        mesh: planetMesh,
        cloudsMesh,
        atmosphereMesh,
        outerGlowMesh,
        ringsMesh,
        data,
        orbitAngle: Math.random() * Math.PI * 2
      });

      // Position initially at random or zero angle
      orbitPivot.rotation.y = this.planets.get(key).orbitAngle;
    }
  }

  createPhotorealisticMoon(earthBodyGroup, moonData) {
    const moonPivot = new THREE.Group();
    earthBodyGroup.add(moonPivot);

    const moonGeo = new THREE.SphereGeometry(moonData.radius, 64, 64);

    // High resolution lunar map + bump relief
    const moonTex = textureManager.load(moonData.texture, 'rocky', '#d6dadf');
    const moonBump = textureManager.load(moonData.bumpTexture, 'rocky', '#808080');

    // Realistic lunar regolith shader with Earthshine ambient illumination
    // Night-side craters remain clearly visible thanks to Earthshine fill
    const moonMat = createPlanetMaterial({
      map: moonTex,
      bumpMap: moonBump,
      bumpScale: 0.22,
      glowColor: '#a8c2e6', // Soft silver-blue Earthshine / lunar limb glow
      ambientIntensity: 0.38, // Earthshine keeps the night craters clearly visible
      fresnelPower: 3.0,
      fresnelIntensity: 0.55
    });
    this.animatedMaterials.push(moonMat);

    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.x = moonData.distance;
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    moonMesh.userData = { id: 'moon', data: moonData };
    moonPivot.add(moonMesh);

    // Subtle lunar exospheric rim glow
    const moonGlowGeo = new THREE.SphereGeometry(moonData.radius * 1.025, 32, 32);
    const moonGlowMat = createAtmosphereMaterial({
      atmosphereColor: '#adc8e6',
      sunsetGlowColor: '#ffd8aa',
      glowPower: 2.8,
      intensity: 1.1
    });
    const moonGlowMesh = new THREE.Mesh(moonGlowGeo, moonGlowMat);
    this.animatedMaterials.push(moonGlowMat);
    moonMesh.add(moonGlowMesh);

    // Visible lunar orbit ring around Earth
    const orbitPts = [];
    const segs = 128;
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(theta) * moonData.distance, 0, Math.sin(theta) * moonData.distance));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.25
    });
    const moonOrbitLine = new THREE.Line(orbitGeo, orbitMat);
    moonPivot.add(moonOrbitLine);

    const moonEntry = {
      id: 'moon',
      pivot: moonPivot,
      bodyGroup: moonPivot,
      mesh: moonMesh,
      orbitLine: moonOrbitLine,
      atmosphereMesh: moonGlowMesh,
      data: moonData,
      angle: Math.PI * 0.45 // Initial pleasing angle where lunar face is illuminated
    };

    moonPivot.rotation.y = moonEntry.angle;
    this.moons.push(moonEntry);
    this.planets.set('moon', moonEntry);
    this.moon = moonEntry;
  }

  createGenericMoon(parentBodyGroup, moonData) {
    const moonPivot = new THREE.Group();
    parentBodyGroup.add(moonPivot);

    const moonGeo = new THREE.SphereGeometry(moonData.radius, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: moonData.color || '#cccccc',
      roughness: 0.80,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.15
    });

    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.x = moonData.distance;
    moonMesh.userData = { id: moonData.name.toLowerCase(), data: moonData };
    moonPivot.add(moonMesh);

    const orbitPts = [];
    const segs = 64;
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(Math.cos(theta) * moonData.distance, 0, Math.sin(theta) * moonData.distance));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12
    });
    const moonOrbitLine = new THREE.Line(orbitGeo, orbitMat);
    moonPivot.add(moonOrbitLine);

    this.moons.push({
      pivot: moonPivot,
      mesh: moonMesh,
      orbitLine: moonOrbitLine,
      data: moonData,
      angle: Math.random() * Math.PI * 2
    });
  }

  createPlanetRings(data) {
    const ringGeo = new THREE.RingGeometry(data.ringInnerRadius, data.ringOuterRadius, 128);
    
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const inner = data.ringInnerRadius;
    const outer = data.ringOuterRadius;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u = (dist - inner) / (outer - inner);
      uv.setXY(i, u, 0.5);
    }

    const ringTex = textureManager.load(data.ringTexture, 'ring', data.color);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      roughness: 0.65,
      emissive: new THREE.Color(0x33281a),
      emissiveIntensity: 0.20
    });

    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    return ringMesh;
  }

  createOrbitLine(radius, colorHex) {
    const segments = 180;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.28,
      linewidth: 1
    });

    return new THREE.Line(geometry, material);
  }

  createAsteroidBelt() {
    const config = ASTEROID_BELT_CONFIG;
    const geometry = new THREE.DodecahedronGeometry(1, 1);
    
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.multiplyScalar(0.85 + Math.random() * 0.35);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x8a7f76,
      roughness: 0.85,
      metalness: 0.1,
      emissive: new THREE.Color(0x1a1816),
      emissiveIntensity: 0.15
    });

    this.asteroidMesh = new THREE.InstancedMesh(geometry, material, config.count);
    const dummy = new THREE.Object3D();
    const asteroidData = [];

    const color1 = new THREE.Color('#4d4540');
    const color2 = new THREE.Color('#786f68');
    const color3 = new THREE.Color('#9c8f85');

    for (let i = 0; i < config.count; i++) {
      const radius = config.innerRadius + Math.random() * (config.outerRadius - config.innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * config.thickness;

      const scale = config.minSize + Math.random() * (config.maxSize - config.minSize);
      
      dummy.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.scale.set(scale, scale * (0.7 + Math.random() * 0.6), scale);
      dummy.updateMatrix();

      this.asteroidMesh.setMatrixAt(i, dummy.matrix);

      const col = Math.random() < 0.4 ? color1 : (Math.random() < 0.5 ? color2 : color3);
      this.asteroidMesh.setColorAt(i, col);

      asteroidData.push({
        radius,
        angle,
        speed: (0.002 + Math.random() * 0.003) * (150 / radius),
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        height,
        scale
      });
    }

    this.asteroidData = asteroidData;
    this.asteroidDummy = dummy;
    this.scene.add(this.asteroidMesh);
  }

  createKuiperBelt() {
    const config = KUIPER_BELT_CONFIG;
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x9fb4c7,
      roughness: 0.85,
      metalness: 0.15,
      emissive: new THREE.Color(0x1b2836),
      emissiveIntensity: 0.20
    });

    this.kuiperMesh = new THREE.InstancedMesh(geometry, material, config.count);
    const dummy = new THREE.Object3D();
    const kuiperData = [];

    const iceCol1 = new THREE.Color('#7a8d9e');
    const iceCol2 = new THREE.Color('#94a8b8');
    const iceCol3 = new THREE.Color('#b3c8d8');

    for (let i = 0; i < config.count; i++) {
      const radius = config.innerRadius + Math.random() * (config.outerRadius - config.innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * config.thickness;
      const scale = config.minSize + Math.random() * (config.maxSize - config.minSize);

      dummy.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      this.kuiperMesh.setMatrixAt(i, dummy.matrix);

      const c = Math.random() < 0.33 ? iceCol1 : (Math.random() < 0.5 ? iceCol2 : iceCol3);
      this.kuiperMesh.setColorAt(i, c);

      kuiperData.push({
        radius,
        angle,
        speed: 0.0006 * (400 / radius),
        height,
        scale
      });
    }

    this.kuiperData = kuiperData;
    this.kuiperDummy = dummy;
    this.scene.add(this.kuiperMesh);
  }

  createSolarBeams() {
    // Dynamic golden volumetric light rays extending from the Sun to each planet
    this.solarBeamsGroup = new THREE.Group();
    this.solarBeamsGroup.visible = false;
    this.scene.add(this.solarBeamsGroup);

    this.beamLines = [];

    const beamMaterial = new THREE.LineBasicMaterial({
      color: 0xffd54f,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    const planetKeys = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    for (const key of planetKeys) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(100, 0, 0)
      ]);
      const line = new THREE.Line(geo, beamMaterial);
      this.solarBeamsGroup.add(line);
      this.beamLines.push({ key, line });
    }
  }

  update(delta, elapsed, camera) {
    const effectiveDelta = delta * this.timeScale;

    // Keep camera fill light following camera position so planets are always properly lit
    if (this.cameraFillLight && camera) {
      this.cameraFillLight.position.copy(camera.position);
    }

    // 1. Update Sun plasma & corona materials
    for (const mat of this.animatedMaterials) {
      if (mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = elapsed;
      }
    }

    // Spin the Sun
    if (this.sun && this.sun.mesh) {
      this.sun.mesh.rotation.y += SOLAR_SYSTEM_DATA.sun.rotationSpeed * effectiveDelta;
    }

    // 2. Update Planets (Orbits and Rotations)
    for (const [key, planet] of this.planets.entries()) {
      if (key === 'sun' || key === 'moon') continue;

      const { data, orbitPivot, mesh, cloudsMesh, atmosphereMesh, outerGlowMesh } = planet;

      // Orbit around the Sun
      planet.orbitAngle += data.orbitSpeed * 0.15 * effectiveDelta;
      orbitPivot.rotation.y = planet.orbitAngle;

      // Axial self-rotation
      if (mesh) {
        mesh.rotation.y += data.rotationSpeed * effectiveDelta * 2.0;
      }

      // Independent dynamic cloud rotation
      if (cloudsMesh) {
        cloudsMesh.rotation.y += data.rotationSpeed * effectiveDelta * 2.15;
      }

      // Update sun direction in world coordinates for Earth shader
      if (mesh && mesh.material && mesh.material.uniforms && mesh.material.uniforms.uSunPosition) {
        mesh.material.uniforms.uSunPosition.value.copy(this.sunPosition);
      }
      if (atmosphereMesh && atmosphereMesh.material && atmosphereMesh.material.uniforms && atmosphereMesh.material.uniforms.uSunPosition) {
        atmosphereMesh.material.uniforms.uSunPosition.value.copy(this.sunPosition);
      }
      if (outerGlowMesh && outerGlowMesh.material && outerGlowMesh.material.uniforms && outerGlowMesh.material.uniforms.uSunPosition) {
        outerGlowMesh.material.uniforms.uSunPosition.value.copy(this.sunPosition);
      }
    }

    // 3. Update Moons (including the Moon / Luna)
    for (const moon of this.moons) {
      moon.angle += moon.data.orbitSpeed * 0.3 * effectiveDelta;
      moon.pivot.rotation.y = moon.angle;
      // Synchronous rotation (tidally locked)
      if (moon.mesh) {
        moon.mesh.rotation.y += (moon.data.rotationSpeed || 0.02) * effectiveDelta;
        if (moon.mesh.material && moon.mesh.material.uniforms && moon.mesh.material.uniforms.uSunPosition) {
          moon.mesh.material.uniforms.uSunPosition.value.copy(this.sunPosition);
        }
      }
      if (moon.atmosphereMesh && moon.atmosphereMesh.material && moon.atmosphereMesh.material.uniforms && moon.atmosphereMesh.material.uniforms.uSunPosition) {
        moon.atmosphereMesh.material.uniforms.uSunPosition.value.copy(this.sunPosition);
      }
    }

    // 4. Update Solar Beams
    if (this.showSolarBeams && this.beamLines) {
      const sunOrigin = new THREE.Vector3(0, 0, 0);
      for (const item of this.beamLines) {
        const planetPos = this.getPlanetWorldPosition(item.key);
        const posAttr = item.line.geometry.attributes.position;
        posAttr.setXYZ(0, sunOrigin.x, sunOrigin.y, sunOrigin.z);
        posAttr.setXYZ(1, planetPos.x, planetPos.y, planetPos.z);
        posAttr.needsUpdate = true;
      }
    }

    // 5. Update Asteroids
    if (this.showAsteroids && this.asteroidMesh && this.asteroidData) {
      const dummy = this.asteroidDummy;
      for (let i = 0; i < this.asteroidData.length; i++) {
        const item = this.asteroidData[i];
        item.angle += item.speed * effectiveDelta;
        item.rotX += item.rotSpeedX;
        item.rotY += item.rotSpeedY;

        dummy.position.set(
          Math.cos(item.angle) * item.radius,
          item.height,
          Math.sin(item.angle) * item.radius
        );
        dummy.rotation.set(item.rotX, item.rotY, 0);
        dummy.scale.set(item.scale, item.scale, item.scale);
        dummy.updateMatrix();
        this.asteroidMesh.setMatrixAt(i, dummy.matrix);
      }
      this.asteroidMesh.instanceMatrix.needsUpdate = true;
    }

    // 6. Update Kuiper Belt
    if (this.kuiperMesh && this.kuiperData) {
      const dummy = this.kuiperDummy;
      for (let i = 0; i < this.kuiperData.length; i++) {
        const item = this.kuiperData[i];
        item.angle += item.speed * effectiveDelta;
        dummy.position.set(
          Math.cos(item.angle) * item.radius,
          item.height,
          Math.sin(item.angle) * item.radius
        );
        dummy.scale.set(item.scale, item.scale, item.scale);
        dummy.updateMatrix();
        this.kuiperMesh.setMatrixAt(i, dummy.matrix);
      }
      this.kuiperMesh.instanceMatrix.needsUpdate = true;
    }
  }

  getPlanetWorldPosition(key) {
    const planet = this.planets.get(key);
    if (!planet) return new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3();
    if (key === 'sun' || key === 'moon') {
      planet.mesh.getWorldPosition(target);
    } else if (planet.bodyGroup) {
      planet.bodyGroup.getWorldPosition(target);
    } else if (planet.mesh) {
      planet.mesh.getWorldPosition(target);
    }
    return target;
  }

  setSunLightingEnabled(enabled) {
    this.sunLightingEnabled = enabled;
    if (enabled) {
      this.sunLight.intensity = 2.8;
      this.ambientLight.intensity = 0.65;
      if (this.cameraFillLight) this.cameraFillLight.intensity = 0.45;
      for (const mat of this.animatedMaterials) {
        if (mat.uniforms && mat.uniforms.uSunLightingEnabled) {
          mat.uniforms.uSunLightingEnabled.value = 1.0;
        }
      }
    } else {
      // Uniform Classroom Inspection Mode: every continent, crater, and moon is brightly visible
      this.sunLight.intensity = 0.8;
      this.ambientLight.intensity = 1.8;
      if (this.cameraFillLight) this.cameraFillLight.intensity = 1.0;
      for (const mat of this.animatedMaterials) {
        if (mat.uniforms && mat.uniforms.uSunLightingEnabled) {
          mat.uniforms.uSunLightingEnabled.value = 0.0;
        }
      }
    }
  }

  setSolarBeamsVisible(visible) {
    this.showSolarBeams = visible;
    if (this.solarBeamsGroup) {
      this.solarBeamsGroup.visible = visible;
    }
  }

  setOrbitsVisible(visible) {
    this.showOrbits = visible;
    for (const line of this.orbitLines.values()) {
      line.visible = visible;
    }
    for (const moon of this.moons) {
      if (moon.orbitLine) moon.orbitLine.visible = visible;
    }
  }

  setAsteroidsVisible(visible) {
    this.showAsteroids = visible;
    if (this.asteroidMesh) this.asteroidMesh.visible = visible;
    if (this.kuiperMesh) this.kuiperMesh.visible = visible;
  }

  setAtmospheresVisible(visible) {
    this.showAtmospheres = visible;
    for (const planet of this.planets.values()) {
      if (planet.atmosphereMesh) {
        planet.atmosphereMesh.visible = visible;
      }
      if (planet.outerGlowMesh) {
        planet.outerGlowMesh.visible = visible;
      }
    }
  }

  setCloudsVisible(visible) {
    this.showClouds = visible;
    const earth = this.planets.get('earth');
    if (earth && earth.cloudsMesh) {
      earth.cloudsMesh.visible = visible;
    }
  }
}
