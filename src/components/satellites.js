import * as THREE from 'three';
import { SATELLITES_DATA } from '../satellitesData.js';

/**
 * 3D Spacecraft & Satellite Constellation Builder
 * Accurately models real human-made satellites (ISS, Hubble, JWST, GPS, Voyager 1 & 2, Parker)
 * with authentic orbital dynamics and clickable hitboxes for educational inspection.
 */
export class SatellitesSystem {
  constructor(scene, solarSystem) {
    this.scene = scene;
    this.solarSystem = solarSystem;
    this.satellites = new Map();
    this.orbitLines = [];
    this.clickableObjects = [];

    this.visible = true;

    this.init();
  }

  init() {
    this.createISS();
    this.createHubble();
    this.createJWST();
    this.createGPSConstellation();
    this.createVoyager1();
    this.createVoyager2();
    this.createParkerSolarProbe();
  }

  createISS() {
    const data = SATELLITES_DATA.iss;
    const earth = this.solarSystem.planets.get('earth');
    if (!earth) return;

    // Orbital pivot group around Earth
    const orbitPivot = new THREE.Group();
    orbitPivot.rotation.z = THREE.MathUtils.degToRad(data.inclinationDeg);
    earth.bodyGroup.add(orbitPivot);

    // 3D Procedural Model of ISS
    const issGroup = new THREE.Group();
    issGroup.scale.set(0.12, 0.12, 0.12);

    // Pressurized module stack
    const moduleMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.85, roughness: 0.2 });
    const module1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 16), moduleMat);
    module1.rotation.z = Math.PI / 2;
    issGroup.add(module1);

    const module2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 3.2, 16), moduleMat);
    issGroup.add(module2);

    // Main Integrated Truss Structure (long horizontal backbone)
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.7, roughness: 0.4 });
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 10), trussMat);
    issGroup.add(truss);

    // 4 Solar Array Wings (golden silicon solar cells)
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x24426b,
      roughness: 0.15,
      metalness: 0.6,
      emissive: 0x091b38
    });
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 1.4), solarMat);
        panel.position.set(j * 2.2, 0, i * 4.2);
        issGroup.add(panel);
      }
    }

    // Raycast hit sphere
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData = { id: data.id, data };
    issGroup.add(hitSphere);
    this.clickableObjects.push(hitSphere);

    issGroup.position.x = data.orbitRadius;
    orbitPivot.add(issGroup);

    // Orbit path line
    const orbitLine = this.createOrbitRing(data.orbitRadius, data.color, data.inclinationDeg);
    earth.bodyGroup.add(orbitLine);
    this.orbitLines.push(orbitLine);

    this.satellites.set(data.id, {
      group: issGroup,
      pivot: orbitPivot,
      data,
      angle: 0
    });
  }

  createHubble() {
    const data = SATELLITES_DATA.hubble;
    const earth = this.solarSystem.planets.get('earth');
    if (!earth) return;

    const orbitPivot = new THREE.Group();
    orbitPivot.rotation.z = THREE.MathUtils.degToRad(data.inclinationDeg);
    orbitPivot.rotation.y = 1.2; // Offset phase
    earth.bodyGroup.add(orbitPivot);

    const hstGroup = new THREE.Group();
    hstGroup.scale.set(0.12, 0.12, 0.12);

    // Silver cylindrical telescope barrel
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xefefef, metalness: 0.9, roughness: 0.1 });
    const mainTube = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 3.8, 24), bodyMat);
    mainTube.rotation.z = Math.PI / 2;
    hstGroup.add(mainTube);

    // Open aperture door
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const door = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 24), doorMat);
    door.position.set(2.0, 0.4, 0);
    door.rotation.z = Math.PI / 3;
    hstGroup.add(door);

    // Twin solar arrays
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1a3861, metalness: 0.5, roughness: 0.2 });
    const wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 3.2), solarMat);
    wing1.position.set(0, 0, 2.2);
    const wing2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 3.2), solarMat);
    wing2.position.set(0, 0, -2.2);
    hstGroup.add(wing1);
    hstGroup.add(wing2);

    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData = { id: data.id, data };
    hstGroup.add(hitSphere);
    this.clickableObjects.push(hitSphere);

    hstGroup.position.x = data.orbitRadius;
    orbitPivot.add(hstGroup);

    const orbitLine = this.createOrbitRing(data.orbitRadius, data.color, data.inclinationDeg);
    orbitLine.rotation.y = 1.2;
    earth.bodyGroup.add(orbitLine);
    this.orbitLines.push(orbitLine);

    this.satellites.set(data.id, {
      group: hstGroup,
      pivot: orbitPivot,
      data,
      angle: 0.8
    });
  }

  createJWST() {
    const data = SATELLITES_DATA.jwst;
    const earth = this.solarSystem.planets.get('earth');
    if (!earth) return;

    // JWST at Sun-Earth L2 Lagrange Point (~1.5M km on anti-sun side)
    const l2Pivot = new THREE.Group();
    earth.bodyGroup.add(l2Pivot);

    const jwstGroup = new THREE.Group();
    jwstGroup.scale.set(0.18, 0.18, 0.18);

    // 5-Layer Kapton Sunshield (kite/diamond shape)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 4.2);
    shieldShape.lineTo(2.4, 0);
    shieldShape.lineTo(0, -4.2);
    shieldShape.lineTo(-2.4, 0);
    shieldShape.closePath();

    const shieldGeo = new THREE.ShapeGeometry(shieldShape);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xdfa0be, // Reflective pink/silver Kapton film
      metalness: 0.95,
      roughness: 0.15,
      side: THREE.DoubleSide
    });
    const sunshield = new THREE.Mesh(shieldGeo, shieldMat);
    sunshield.rotation.x = Math.PI / 2;
    jwstGroup.add(sunshield);

    // 18 Gold-Plated Hexagonal Primary Mirror Segments
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00, // Brilliant pure gold
      metalness: 0.98,
      roughness: 0.05
    });

    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(0, 0.8, 0);

    const hexGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 6);
    // Honeycomb lattice
    for (let q = -2; q <= 2; q++) {
      for (let r = -2; r <= 2; r++) {
        if (Math.abs(q + r) <= 2 && !(q === 0 && r === 0)) {
          const hex = new THREE.Mesh(hexGeo, mirrorMat);
          const x = 0.8 * (q + r / 2);
          const z = 0.8 * (r * Math.sqrt(3) / 2);
          hex.position.set(x, 0, z);
          mirrorGroup.add(hex);
        }
      }
    }
    jwstGroup.add(mirrorGroup);

    // Secondary Mirror Tripod
    const tripodMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const tripod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8), tripodMat);
    tripod1.position.set(0, 2.0, 0);
    tripod1.rotation.z = 0.25;
    jwstGroup.add(tripod1);

    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData = { id: data.id, data };
    jwstGroup.add(hitSphere);
    this.clickableObjects.push(hitSphere);

    // Position along the anti-sun vector from Earth
    jwstGroup.position.set(data.orbitRadius, 0, 0);
    l2Pivot.add(jwstGroup);

    // Halo orbit line around L2
    const haloPoints = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      haloPoints.push(new THREE.Vector3(data.orbitRadius + Math.cos(th) * 2.5, Math.sin(th) * 2.0, 0));
    }
    const haloLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(haloPoints),
      new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.35 })
    );
    l2Pivot.add(haloLine);
    this.orbitLines.push(haloLine);

    this.satellites.set(data.id, {
      group: jwstGroup,
      pivot: l2Pivot,
      data,
      angle: 0
    });
  }

  createGPSConstellation() {
    const data = SATELLITES_DATA.gps;
    const earth = this.solarSystem.planets.get('earth');
    if (!earth) return;

    const planes = 6;
    for (let p = 0; p < planes; p++) {
      const planeGroup = new THREE.Group();
      planeGroup.rotation.y = (p / planes) * Math.PI;
      planeGroup.rotation.z = THREE.MathUtils.degToRad(data.inclinationDeg);
      earth.bodyGroup.add(planeGroup);

      const orbitLine = this.createOrbitRing(data.orbitRadius, data.color, 0);
      planeGroup.add(orbitLine);
      this.orbitLines.push(orbitLine);

      // Add 2 GPS satellites per plane for demonstration
      for (let s = 0; s < 2; s++) {
        const satGroup = new THREE.Group();
        satGroup.scale.set(0.08, 0.08, 0.08);

        // Gold bus cube
        const bus = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xe0a938, metalness: 0.9, roughness: 0.2 })
        );
        satGroup.add(bus);

        // Blue solar arrays
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.4 });
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 3.0), panelMat);
        p1.position.z = 2.0;
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 3.0), panelMat);
        p2.position.z = -2.0;
        satGroup.add(p1);
        satGroup.add(p2);

        // Hit sphere
        const hitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 8, 8),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitSphere.userData = { id: data.id, data };
        satGroup.add(hitSphere);
        this.clickableObjects.push(hitSphere);

        const angle = (s / 2) * Math.PI * 2 + (p * 0.4);
        satGroup.position.set(Math.cos(angle) * data.orbitRadius, 0, Math.sin(angle) * data.orbitRadius);
        planeGroup.add(satGroup);
      }
    }
  }

  createVoyager1() {
    const data = SATELLITES_DATA.voyager1;
    const voyagerGroup = this.buildVoyagerMesh(data);
    
    // Positioned exiting the solar system northward at 35° inclination
    const dist = data.orbitRadius;
    voyagerGroup.position.set(-dist * 0.75, dist * 0.55, dist * 0.35);
    voyagerGroup.rotation.x = -0.55;
    voyagerGroup.rotation.y = 0.8;
    this.scene.add(voyagerGroup);

    // Trajectory dashed flight line from Sun
    const linePts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-98, 0, 0), // Earth launch
      new THREE.Vector3(-215, 8, 30), // Jupiter flyby
      new THREE.Vector3(-290, 24, 75), // Saturn gravity assist
      voyagerGroup.position.clone() // Current interstellar location
    ];
    const trajLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePts),
      new THREE.LineDashedMaterial({ color: 0xe040fb, dashSize: 8, gapSize: 4, transparent: true, opacity: 0.6 })
    );
    trajLine.computeLineDistances();
    this.scene.add(trajLine);
    this.orbitLines.push(trajLine);

    this.satellites.set(data.id, {
      group: voyagerGroup,
      data
    });
  }

  createVoyager2() {
    const data = SATELLITES_DATA.voyager2;
    const voyagerGroup = this.buildVoyagerMesh(data);

    // Positioned exiting southward toward interstellar space
    const dist = data.orbitRadius;
    voyagerGroup.position.set(dist * 0.6, -dist * 0.65, -dist * 0.45);
    voyagerGroup.rotation.x = 0.65;
    this.scene.add(voyagerGroup);

    const linePts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-98, 0, 0), // Earth launch
      new THREE.Vector3(-215, -4, -15), // Jupiter
      new THREE.Vector3(-290, -12, -45), // Saturn
      new THREE.Vector3(-370, -22, -90), // Uranus
      new THREE.Vector3(-440, -45, -135), // Neptune
      voyagerGroup.position.clone()
    ];
    const trajLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePts),
      new THREE.LineDashedMaterial({ color: 0xab47bc, dashSize: 8, gapSize: 4, transparent: true, opacity: 0.6 })
    );
    trajLine.computeLineDistances();
    this.scene.add(trajLine);
    this.orbitLines.push(trajLine);

    this.satellites.set(data.id, {
      group: voyagerGroup,
      data
    });
  }

  createParkerSolarProbe() {
    const data = SATELLITES_DATA.parker;
    const probeGroup = new THREE.Group();
    probeGroup.scale.set(0.18, 0.18, 0.18);

    // Thick Carbon-Composite Heat Shield (hexagonal white shield)
    const shieldGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 6);
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.x = Math.PI / 2;
    probeGroup.add(shield);

    // Spacecraft Bus behind shield
    const busMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.9, roughness: 0.2 });
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.8, 8), busMat);
    bus.position.set(0, 0, -1.2);
    bus.rotation.x = Math.PI / 2;
    probeGroup.add(bus);

    // Swept-back solar panels
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6 });
    const wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 1.6), solarMat);
    wing1.position.set(1.4, 0, -1.2);
    const wing2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 1.6), solarMat);
    wing2.position.set(-1.4, 0, -1.2);
    probeGroup.add(wing1);
    probeGroup.add(wing2);

    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData = { id: data.id, data };
    probeGroup.add(hitSphere);
    this.clickableObjects.push(hitSphere);

    // Highly elliptical orbit touching near Sun corona
    const ellipsePts = [];
    const a = 50; // Semi-major axis
    const e = 0.72; // Extreme eccentricity
    const b = a * Math.sqrt(1 - e * e);

    for (let i = 0; i <= 100; i++) {
      const th = (i / 100) * Math.PI * 2;
      // Focus shifted to Sun at (0,0,0)
      ellipsePts.push(new THREE.Vector3(Math.cos(th) * a - a * e, 0, Math.sin(th) * b));
    }
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ellipsePts),
      new THREE.LineBasicMaterial({ color: 0xff7043, transparent: true, opacity: 0.45 })
    );
    this.scene.add(orbitLine);
    this.orbitLines.push(orbitLine);

    this.scene.add(probeGroup);
    this.satellites.set(data.id, {
      group: probeGroup,
      data,
      orbitA: a,
      orbitB: b,
      orbitE: e,
      angle: 0
    });
  }

  buildVoyagerMesh(data) {
    const group = new THREE.Group();
    group.scale.set(0.35, 0.35, 0.35);

    // White High-Gain Parabolic Antenna Dish (3.7m diameter)
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.3 });
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 0.3, 0.6, 24), dishMat);
    dish.rotation.x = Math.PI / 2;
    group.add(dish);

    // 10-Sided Decagonal Bus
    const busMat = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.8 });
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.7, 10), busMat);
    bus.position.set(0, 0, -0.6);
    bus.rotation.x = Math.PI / 2;
    group.add(bus);

    // The Golden Record (Mounted on the bus side!)
    const recordMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 });
    const record = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16), recordMat);
    record.position.set(1.15, 0, -0.6);
    record.rotation.z = Math.PI / 2;
    group.add(record);

    // Magnetometer & RTG Booms
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.5), boomMat);
    magBoom.position.set(-2.8, 1.2, -0.6);
    magBoom.rotation.z = Math.PI / 4;
    group.add(magBoom);

    // Hit Sphere
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData = { id: data.id, data };
    group.add(hitSphere);
    this.clickableObjects.push(hitSphere);

    return group;
  }

  createOrbitRing(radius, colorHex, inclinationDeg = 0) {
    const points = [];
    const segments = 120;
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(th) * radius, 0, Math.sin(th) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.35
    });
    const line = new THREE.Line(geo, mat);
    line.rotation.z = THREE.MathUtils.degToRad(inclinationDeg);
    return line;
  }

  update(delta, effectiveDelta) {
    // Animate LEO satellites (ISS, Hubble)
    const iss = this.satellites.get('satellite_iss');
    if (iss && iss.group) {
      iss.angle += iss.data.speed * effectiveDelta;
      iss.group.position.x = Math.cos(iss.angle) * iss.data.orbitRadius;
      iss.group.position.y = Math.sin(iss.angle) * iss.data.orbitRadius;
      iss.group.rotation.z += 0.02 * effectiveDelta;
    }

    const hst = this.satellites.get('satellite_hubble');
    if (hst && hst.group) {
      hst.angle += hst.data.speed * effectiveDelta;
      hst.group.position.x = Math.cos(hst.angle) * hst.data.orbitRadius;
      hst.group.position.y = Math.sin(hst.angle) * hst.data.orbitRadius;
    }

    // Animate JWST Lissajous halo oscillation around L2
    const jwst = this.satellites.get('satellite_jwst');
    if (jwst && jwst.group) {
      jwst.angle += jwst.data.speed * effectiveDelta;
      jwst.group.position.y = Math.sin(jwst.angle * 2.0) * 1.8;
      jwst.group.position.z = Math.cos(jwst.angle * 2.0) * 2.2;
    }

    // Animate Parker Solar Probe along eccentric ellipse
    const parker = this.satellites.get('satellite_parker');
    if (parker && parker.group) {
      parker.angle += parker.data.speed * effectiveDelta;
      const th = parker.angle;
      parker.group.position.set(
        Math.cos(th) * parker.orbitA - parker.orbitA * parker.orbitE,
        0,
        Math.sin(th) * parker.orbitB
      );
      // Face heat shield toward the Sun at (0,0,0)
      parker.group.lookAt(0, 0, 0);
    }
  }

  setSatellitesVisible(visible) {
    this.visible = visible;
    for (const item of this.satellites.values()) {
      if (item.group) item.group.visible = visible;
    }
    for (const line of this.orbitLines) {
      line.visible = visible;
    }
  }
}

