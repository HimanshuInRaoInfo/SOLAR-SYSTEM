import * as THREE from 'three';
import { MILKY_WAY_DATA } from '../milkyWayData.js';
import { createAccretionDiskMaterial, createPhotonRingMaterial } from '../shaders/blackHoleShader.js';

/**
 * Milky Way Galaxy — Rendered as a SEPARATE isolated scene layer.
 *
 * Key design decision: The galaxy operates in its OWN coordinate space
 * (galactic units ≈ light-years scaled to ~1000 scene units = full galaxy diameter).
 * The solar system is rendered in a completely SEPARATE scale (where Earth orbit ≈ 100 units).
 *
 * Visibility is toggled by the view mode manager based on camera distance.
 * When in Solar System mode, the Milky Way group is hidden entirely.
 */
export class MilkyWay {
  constructor(scene) {
    this.scene = scene;

    // Root group - hidden by default, only shown in Galaxy Mode
    this.group = new THREE.Group();
    this.group.name = 'milky_way';
    this.group.visible = false; // Hidden until Galaxy Mode is activated
    this.scene.add(this.group);

    this.clickableObjects = [];
    this.armGuides = [];

    this.accretionMat = null;
    this.beaconRing = null;

    this._build();
  }

  _build() {
    this._buildStarDisk();
    this._buildDustLanes();
    this._buildSagittariusA();
    this._buildSpiralArmGuides();
    this._buildNebulaeMarkers();
    this._buildSolarBeacon();
  }

  // ---------- Star Particle Disk ----------

  _buildStarDisk() {
    const count = 120000;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    // Spectral star colors
    const C = {
      coreGold:  new THREE.Color('#ffe8b0'),
      corePale:  new THREE.Color('#fff4e0'),
      armBlue:   new THREE.Color('#90caf9'),
      armCyan:   new THREE.Color('#4fc3f7'),
      armPink:   new THREE.Color('#f48fb1'),  // H II regions
      haloFaint: new THREE.Color('#ffd8a0'),
    };

    // 5 logarithmic spiral arms
    const arms = [
      { start: 0,              pitch: 0.22, label: 'Perseus',           minR: 90,  maxR: 480 },
      { start: Math.PI,        pitch: 0.22, label: 'Scutum-Centaurus',  minR: 85,  maxR: 470 },
      { start: Math.PI * 0.5,  pitch: 0.20, label: 'Sagittarius',       minR: 80,  maxR: 400 },
      { start: Math.PI * 1.5,  pitch: 0.20, label: 'Norma',             minR: 80,  maxR: 390 },
      { start: Math.PI * 0.72, pitch: 0.18, label: 'Orion Spur',        minR: 185, maxR: 290, isSpur: true },
    ];

    let idx = 0;

    for (let i = 0; i < count; i++) {
      const dice = Math.random();
      let x, y, z, col, sz;

      if (dice < 0.25) {
        // --- Central Bar / Bulge ---
        const r  = Math.pow(Math.random(), 2.0) * 90;
        const th = Math.random() * Math.PI * 2;
        // Elliptical bar stretch on X
        x = Math.cos(th) * r * 1.55;
        z = Math.sin(th) * r;
        const hMax = (1.0 - r / 95) * 26 + 5;
        y = (Math.random() - 0.5) * hMax;
        col = Math.random() < 0.6 ? C.coreGold : C.corePale;
        sz = 1.0 + Math.random() * 1.2;

      } else if (dice < 0.93) {
        // --- Spiral Arm Stars ---
        const arm = arms[Math.floor(Math.random() * arms.length)];
        const r   = arm.minR + Math.pow(Math.random(), 1.1) * (arm.maxR - arm.minR);
        const th  = arm.start + Math.log(r / 70) / arm.pitch;
        // Scatter around arm centerline — tighter for the Orion spur
        const spread = arm.isSpur ? 14 : (16 + (r / arm.maxR) * 32);
        x = Math.cos(th) * r + (Math.random() - 0.5) * spread;
        z = Math.sin(th) * r + (Math.random() - 0.5) * spread;
        y = (Math.random() - 0.5) * (10 * Math.exp(-r / 380));
        const sub = Math.random();
        if (sub < 0.50) { col = C.armBlue;  sz = 0.9 + Math.random() * 1.0; }
        else if (sub < 0.78) { col = C.armCyan;  sz = 1.0 + Math.random() * 1.2; }
        else if (sub < 0.92) { col = C.armPink;  sz = 1.4 + Math.random() * 1.4; }
        else                  { col = C.corePale; sz = 1.8 + Math.random() * 1.6; }

      } else {
        // --- Spherical Halo ---
        const r  = 130 + Math.random() * 550;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos((Math.random() * 2) - 1);
        x = r * Math.sin(ph) * Math.cos(th);
        y = r * Math.cos(ph) * 0.40;
        z = r * Math.sin(ph) * Math.sin(th);
        col = C.haloFaint;
        sz  = 0.6 + Math.random() * 0.8;
      }

      positions[idx]     = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      colors[idx]     = col.r;
      colors[idx + 1] = col.g;
      colors[idx + 2] = col.b;
      sizes[i] = sz;
      idx += 3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          // Fixed world-space point size: each star is ~0.4 scene-units regardless of zoom
          gl_PointSize = size * uPixelRatio * (280.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 5.0);   // Hard cap → never giant blobs
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          a += pow(smoothstep(0.18, 0.0, d), 2.5) * 0.5;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });

    this.starsMesh = new THREE.Points(geo, mat);
    this.group.add(this.starsMesh);
  }

  // ---------- Dark Dust Lanes ----------

  _buildDustLanes() {
    const count = 5000;
    const pos   = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const armIdx = i % 4;
      const r  = 90 + Math.pow(Math.random(), 1.1) * 380;
      const th = (armIdx * Math.PI * 0.5) + Math.log(r / 70) / 0.21 - 0.18;
      pos[i * 3]     = Math.cos(th) * r + (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = Math.sin(th) * r + (Math.random() - 0.5) * 14;
      sizes[i] = 14 + Math.random() * 22;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,   3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(size * (200.0 / -mvPos.z), 1.0, 12.0);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          if (length(c) > 0.5) discard;
          float a = pow(1.0 - length(c) * 2.0, 2.2) * 0.35;
          gl_FragColor = vec4(0.015, 0.010, 0.022, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.group.add(new THREE.Points(geo, mat));
  }

  // ---------- Sagittarius A* ----------

  _buildSagittariusA() {
    const sgrGroup = new THREE.Group();

    // Black event horizon
    const horizonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.0, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    horizonMesh.userData = { id: 'sagittarius_a', data: MILKY_WAY_DATA.sagittariusA };
    sgrGroup.add(horizonMesh);
    this.clickableObjects.push(horizonMesh);

    // Relativistic accretion disk
    this.accretionMat = createAccretionDiskMaterial();
    const diskMesh = new THREE.Mesh(new THREE.PlaneGeometry(48, 48, 48, 48), this.accretionMat);
    diskMesh.rotation.x = -Math.PI / 2;
    sgrGroup.add(diskMesh);

    // Gravitational photon ring
    const warpMesh = new THREE.Mesh(
      new THREE.RingGeometry(4.8, 16, 64),
      createPhotonRingMaterial()
    );
    sgrGroup.add(warpMesh);

    this.group.add(sgrGroup);
  }

  // ---------- Spiral Arm Guides ----------

  _buildSpiralArmGuides() {
    for (const arm of MILKY_WAY_DATA.spiralArms) {
      const pts = [];
      const [rMin, rMax] = arm.radiusRange;
      for (let i = 0; i <= 60; i++) {
        const t  = i / 60;
        const r  = rMin + t * (rMax - rMin);
        const th = arm.startAngle + Math.log(r / 70) / (arm.pitchAngle * 0.01745);
        pts.push(new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r));
      }
      const curve   = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 60, arm.isHome ? 1.2 : 0.7, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(arm.color),
        transparent: true,
        opacity: arm.isHome ? 0.70 : 0.28,
      });
      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      mesh.userData = { id: arm.id, data: arm };
      this.group.add(mesh);
      this.clickableObjects.push(mesh);
      this.armGuides.push(mesh);
    }
  }

  // ---------- Nebulae Markers ----------

  _buildNebulaeMarkers() {
    for (const neb of MILKY_WAY_DATA.nebulae) {
      const g = new THREE.Group();
      g.position.set(...neb.position);

      // Glow sprite — kept very small
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        color: new THREE.Color(neb.color),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.75,
      }));
      sprite.scale.set(14, 14, 1);
      g.add(sprite);

      // Invisible hit sphere for raycaster
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(9, 12, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.userData = { id: neb.id, data: neb };
      g.add(hit);
      this.clickableObjects.push(hit);

      this.group.add(g);
    }
  }

  // ---------- Solar System "You Are Here" Beacon ----------

  _buildSolarBeacon() {
    const loc = MILKY_WAY_DATA.solarSystemLocation;
    const g   = new THREE.Group();
    g.position.set(...loc.position);

    // Pulsing ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.0, 4.5, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffeb3b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);
    this.beaconRing = ring;

    // Bright center dot
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
    }));
    dot.scale.set(8, 8, 1);
    g.add(dot);

    // Hit sphere
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(7, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.userData = { id: 'beacon_solar_system', data: loc };
    g.add(hit);
    this.clickableObjects.push(hit);

    this.group.add(g);
  }

  // ---------- Update Loop ----------

  update(delta, elapsed) {
    if (!this.group.visible) return;

    // Slow majestic differential rotation of the star disk
    if (this.starsMesh) {
      this.starsMesh.rotation.y = elapsed * 0.0018;
    }

    // Animate accretion disk
    if (this.accretionMat) {
      this.accretionMat.uniforms.uTime.value = elapsed;
    }

    // Pulse "You Are Here" beacon
    if (this.beaconRing) {
      const s = 1.0 + 0.28 * Math.sin(elapsed * 3.8);
      this.beaconRing.scale.set(s, s, 1);
    }
  }

  setArmGuidesVisible(visible) {
    for (const g of this.armGuides) g.visible = visible;
  }
}
