import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { SolarSystem }       from './components/solarSystem.js';
import { MilkyWay }          from './components/milkyWay.js';
import { SatellitesSystem }  from './components/satellites.js';
import { createStarfield }   from './components/starfield.js';
import { CameraController, ViewMode } from './components/cameraController.js';
import { SpaceAudio }        from './audio/spaceAudio.js';
import { SolarSystemUI }     from './components/ui.js';
import { EducationalSystem } from './components/educationalSystem.js';

class UniverseApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.useBloom  = true;

    this._initScene();
    this._initPostProcessing();
    this._initComponents();
    this._initRaycasting();
    this._initEvents();

    this.clock   = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    window.__app = this;
  }

  // ──────────────────────────────────────────────────────────────────
  //  Scene, Camera, Renderer, Controls
  // ──────────────────────────────────────────────────────────────────

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#010206');

    // Wide FOV range; logarithmicDepthBuffer avoids z-fighting across scales
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.05,
      200000
    );
    this.camera.position.set(0, 140, 260);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed   = 0.8;
    this.controls.zoomSpeed     = 1.1;
    this.controls.minDistance   = 4;
    this.controls.maxDistance   = 3000;
    this.controls.target.set(0, 0, 0);
  }

  _initPostProcessing() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Bloom: soft luminous atmospheric glow on the limb and Sun corona
    this.bloomPass = new UnrealBloomPass(size, 0.55, 0.35, 0.88);
    this.composer.addPass(this.bloomPass);

    this.composer.addPass(new OutputPass());
  }

  // ──────────────────────────────────────────────────────────────────
  //  Component setup
  // ──────────────────────────────────────────────────────────────────

  _initComponents() {
    // 1. Fixed deep-space starfield background (always visible, very far away)
    this.starfield = createStarfield();
    this.scene.add(this.starfield.group);

    // 2. Milky Way Galaxy System (starts HIDDEN — shown only in Galaxy Mode)
    this.milkyWay = new MilkyWay(this.scene);

    // 3. Solar System (planets, moons, belts — starts VISIBLE)
    this.solarSystem = new SolarSystem(this.scene);

    // 4. Satellites & Spacecraft
    this.satellitesSystem = new SatellitesSystem(this.scene, this.solarSystem);

    // 5. Multi-scale camera controller
    this.cameraController = new CameraController(
      this.camera,
      this.controls,
      this.solarSystem,
      this.milkyWay,
      this.satellitesSystem
    );

    // 6. Procedural Space Audio
    this.spaceAudio = new SpaceAudio();

    // 7. UI / HUD
    this.ui = new SolarSystemUI(
      this.solarSystem,
      this.milkyWay,
      this.satellitesSystem,
      this.cameraController,
      this.spaceAudio,
      (enabled) => { this.useBloom = enabled; }
    );

    // 8. Classroom Educational Tools
    this.eduSystem = new EducationalSystem(this.cameraController, this.ui);
    this.ui.setEducationalSystem(this.eduSystem);

    // Start with a nice view of Earth
    setTimeout(() => this.ui.selectTarget('earth'), 600);
  }

  // ──────────────────────────────────────────────────────────────────
  //  Raycasting — click/hover any 3D object
  // ──────────────────────────────────────────────────────────────────

  _initRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.mouse     = new THREE.Vector2();

    this._getClickable = () => {
      const objs = [];
      // Planets & sun
      for (const p of this.solarSystem.planets.values()) {
        if (p.mesh && p.mesh.visible) objs.push(p.mesh);
      }
      // Satellites
      if (this.satellitesSystem) {
        objs.push(...this.satellitesSystem.clickableObjects.filter(o => o.visible || (o.parent && o.parent.visible)));
      }
      // Galaxy landmarks (only in Galaxy Mode)
      if (this.milkyWay && this.milkyWay.group.visible) {
        objs.push(...this.milkyWay.clickableObjects);
      }
      return objs;
    };

    window.addEventListener('pointermove', (e) => {
      this.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this._getClickable(), false);

      if (hits.length > 0) {
        const d = hits[0].object.userData.data;
        if (d) {
          document.body.style.cursor = 'pointer';
          this.ui.showTooltip(e.clientX, e.clientY, d.name, d.type || d.distanceAU || '');
          return;
        }
      }
      document.body.style.cursor = 'default';
      this.ui.hideTooltip();
    });

    window.addEventListener('pointerdown', (e) => {
      const UI_SELECTORS = [
        '.nav-dock', '.info-panel', '.control-deck', '.telemetry-hud',
        '.scale-selector-bar', '.classroom-tools-bar', '.edu-panel',
        '.edu-modal', '.cosmic-scale-bar', '.lessons-drawer', '.quiz-modal',
      ];
      if (UI_SELECTORS.some(sel => e.target.closest(sel))) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this._getClickable(), false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.id;
        if (id) this.ui.selectTarget(id);
      }
    });
  }

  _initEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.composer.setSize(w, h);
    });
  }

  // ──────────────────────────────────────────────────────────────────
  //  Main Render Loop
  // ──────────────────────────────────────────────────────────────────

  animate() {
    requestAnimationFrame(this.animate);

    const delta   = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();
    const ts      = this.solarSystem.timeScale || 1.0;

    this.starfield.update(elapsed);
    this.milkyWay.update(delta, elapsed);
    this.solarSystem.update(delta, elapsed, this.camera);
    this.satellitesSystem.update(delta, delta * ts);
    this.cameraController.update(delta);

    if (this.useBloom) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new UniverseApp());
