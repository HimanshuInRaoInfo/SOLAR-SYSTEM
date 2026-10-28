import * as THREE from 'three';
import { MILKY_WAY_DATA } from '../milkyWayData.js';
import { SATELLITES_DATA } from '../satellitesData.js';

/**
 * ViewMode enum
 *  GALAXY       — camera is zoomed out to view the Milky Way. Solar system hidden.
 *  SOLAR_SYSTEM — camera is inside the solar system. Galaxy hidden.
 *  SATELLITES   — camera is very close to Earth watching satellite orbits.
 */
export const ViewMode = Object.freeze({
  GALAXY:       'GALAXY',
  SOLAR_SYSTEM: 'SOLAR_SYSTEM',
  SATELLITES:   'SATELLITES',
});

export class CameraController {
  constructor(camera, controls, solarSystem, milkyWay, satellitesSystem) {
    this.camera            = camera;
    this.controls          = controls;
    this.solarSystem       = solarSystem;
    this.milkyWay          = milkyWay;
    this.satellitesSystem  = satellitesSystem;

    this.mode = ViewMode.SOLAR_SYSTEM;

    // Transition state
    this.isTransitioning    = false;
    this.transitionProgress = 0;
    this.transitionDuration = 2.2;

    this.startCamPos = new THREE.Vector3();
    this.endCamPos   = new THREE.Vector3();
    this.startTarget = new THREE.Vector3();
    this.endTarget   = new THREE.Vector3();

    // For live tracking of a moving object
    this.trackingId   = null;
    this.trackingType = null; // 'planet' | 'satellite' | null
    this.targetOffset = new THREE.Vector3();
  }

  // ─────────────────────────────────────────────
  //  Main fly-to dispatcher
  // ─────────────────────────────────────────────
  flyToTarget(targetId, overrideCamPos = null, duration = 2.2) {
    this._beginTransition(duration);

    // ── GALAXY VIEW ──────────────────────────────
    if (targetId === 'milky_way') {
      this._setMode(ViewMode.GALAXY);
      this.trackingId   = null;
      this.trackingType = null;
      this.endTarget.set(0, 0, 0);
      this.endCamPos.set(0, 820, 680);
      return;
    }

    if (targetId === 'sagittarius_a') {
      this._setMode(ViewMode.GALAXY);
      this.trackingId   = 'sagittarius_a';
      this.trackingType = null;
      this.endTarget.set(0, 0, 0);
      this.endCamPos.set(0, 22, 58);
      return;
    }

    // Spiral arm or nebula
    const arm = MILKY_WAY_DATA.spiralArms.find(a => a.id === targetId);
    if (arm) {
      this._setMode(ViewMode.GALAXY);
      const [rMin, rMax] = arm.radiusRange;
      const midR = (rMin + rMax) * 0.5;
      const th   = arm.startAngle + Math.log(midR / 70) / (arm.pitchAngle * 0.01745);
      const tx   = Math.cos(th) * midR;
      const tz   = Math.sin(th) * midR;
      this.endTarget.set(tx, 0, tz);
      this.endCamPos.set(tx, 160, tz + 200);
      return;
    }

    const neb = MILKY_WAY_DATA.nebulae.find(n => n.id === targetId);
    if (neb) {
      this._setMode(ViewMode.GALAXY);
      this.endTarget.set(...neb.position);
      this.endCamPos.set(neb.position[0], neb.position[1] + 32, neb.position[2] + 50);
      return;
    }

    if (targetId === 'beacon_solar_system') {
      this._setMode(ViewMode.GALAXY);
      const loc = MILKY_WAY_DATA.solarSystemLocation.position;
      this.endTarget.set(...loc);
      this.endCamPos.set(loc[0], loc[1] + 55, loc[2] + 80);
      return;
    }

    // ── SATELLITE VIEW ───────────────────────────
    if (this.satellitesSystem && this.satellitesSystem.satellites.has(targetId)) {
      this._setMode(ViewMode.SATELLITES);
      this.trackingId   = targetId;
      this.trackingType = 'satellite';

      const sat = this.satellitesSystem.satellites.get(targetId);
      const wp  = new THREE.Vector3();
      if (sat.group) sat.group.getWorldPosition(wp);

      this.endTarget.copy(wp);

      let offset = 3.5;
      if (targetId === 'satellite_voyager1' || targetId === 'satellite_voyager2') offset = 14;
      if (targetId === 'satellite_parker') offset = 6;
      this.targetOffset.set(offset * 0.7, offset * 0.5, offset * 0.9);
      this.endCamPos.copy(wp).add(this.targetOffset);
      return;
    }

    // ── SOLAR SYSTEM VIEW ────────────────────────
    if (targetId === 'overview') {
      this._setMode(ViewMode.SOLAR_SYSTEM);
      this.trackingId   = null;
      this.trackingType = null;
      this.endTarget.set(0, 0, 0);
      this.endCamPos.set(0, 240, 380);
      return;
    }

    const planet = this.solarSystem.planets.get(targetId);
    if (planet) {
      this._setMode(ViewMode.SOLAR_SYSTEM);
      this.trackingId   = targetId;
      this.trackingType = 'planet';

      const worldPos = this.solarSystem.getPlanetWorldPosition(targetId);
      this.endTarget.copy(worldPos);

      let dist = planet.data.radius * 3.6;
      if (planet.data.hasRings)  dist = planet.data.ringOuterRadius * 1.8;
      if (targetId === 'sun')    dist = planet.data.radius * 4.0;
      if (targetId === 'earth')  dist = planet.data.radius * 3.2;
      if (targetId === 'moon')   dist = planet.data.radius * 3.4;

      this.targetOffset.set(dist * 0.7, dist * 0.45, dist * 0.9);
      this.endCamPos.copy(worldPos).add(this.targetOffset);
      return;
    }

    // Fallback: custom override
    if (overrideCamPos) {
      this.endCamPos.set(...overrideCamPos);
    }
  }

  resetToOverview() {
    this.flyToTarget('overview');
  }

  setTopDownView() {
    this._setMode(ViewMode.SOLAR_SYSTEM);
    this._beginTransition(2.0);
    this.trackingId   = null;
    this.trackingType = null;
    this.endTarget.set(0, 0, 0);
    this.endCamPos.set(0, 720, 1);
  }

  // ─────────────────────────────────────────────
  //  Per-frame update
  // ─────────────────────────────────────────────
  update(delta) {
    if (this.isTransitioning) {
      this.transitionProgress += delta / this.transitionDuration;
      const t    = Math.min(this.transitionProgress, 1.0);
      const ease = t * t * (3.0 - 2.0 * t); // Hermite S-curve

      // If tracking a moving celestial body or satellite during transition, keep destination synced
      if (this.trackingType === 'planet' && this.trackingId) {
        const cur = this.solarSystem.getPlanetWorldPosition(this.trackingId);
        this.endTarget.copy(cur);
        if (this.targetOffset) this.endCamPos.copy(cur).add(this.targetOffset);
      } else if (this.trackingType === 'satellite' && this.trackingId && this.satellitesSystem) {
        const sat = this.satellitesSystem.satellites.get(this.trackingId);
        if (sat && sat.group) {
          const cur = new THREE.Vector3();
          sat.group.getWorldPosition(cur);
          this.endTarget.copy(cur);
          if (this.targetOffset) this.endCamPos.copy(cur).add(this.targetOffset);
        }
      }

      this.camera.position.lerpVectors(this.startCamPos, this.endCamPos, ease);
      this.controls.target.lerpVectors(this.startTarget, this.endTarget,   ease);

      if (t >= 1.0) {
        this.isTransitioning = false;
        this.controls.target.copy(this.endTarget);
      }
    } else {
      // Live tracking after transition completes
      this._refreshLiveTarget();
    }

    this.controls.update();
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  _beginTransition(duration) {
    this.isTransitioning    = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.startCamPos.copy(this.camera.position);
    this.startTarget.copy(this.controls.target);
  }

  _refreshLiveTarget() {
    if (!this.trackingType || this.isTransitioning) return;

    if (this.trackingType === 'planet' && this.trackingId) {
      const cur   = this.solarSystem.getPlanetWorldPosition(this.trackingId);
      const delta = cur.clone().sub(this.controls.target);
      this.controls.target.copy(cur);
      this.camera.position.add(delta);
    }

    if (this.trackingType === 'satellite' && this.trackingId && this.satellitesSystem) {
      const sat = this.satellitesSystem.satellites.get(this.trackingId);
      if (!sat || !sat.group) return;
      const cur   = new THREE.Vector3();
      sat.group.getWorldPosition(cur);
      const delta = cur.clone().sub(this.controls.target);
      this.controls.target.copy(cur);
      this.camera.position.add(delta);
    }
  }

  /**
   * Toggle scene layer visibility based on the new mode.
   * - GALAXY mode       → show Milky Way, hide solar system objects
   * - SOLAR_SYSTEM mode → hide Milky Way, show solar system
   * - SATELLITES mode   → hide Milky Way, show solar system + satellites (very zoomed in)
   */
  _setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;

    const showGalaxy = (newMode === ViewMode.GALAXY);
    const showSolar  = (newMode !== ViewMode.GALAXY);

    // Milky Way galaxy layer
    if (this.milkyWay) {
      this.milkyWay.group.visible = showGalaxy;
    }

    // Solar system objects: sun, planets, asteroid belts, kuiper belt, orbit lines
    if (this.solarSystem) {
      this._setSolarSystemVisible(showSolar);
    }

    // Satellite models: always hidden in Galaxy mode, visible in Solar/Satellite modes
    if (this.satellitesSystem) {
      this.satellitesSystem.setSatellitesVisible(showSolar);
    }

    // Adjust OrbitControls zoom limits for each scale
    if (newMode === ViewMode.GALAXY) {
      this.controls.minDistance = 20;
      this.controls.maxDistance = 50000;
      this.controls.zoomSpeed   = 2.0;
    } else if (newMode === ViewMode.SATELLITES) {
      this.controls.minDistance = 1.5;
      this.controls.maxDistance = 80;
      this.controls.zoomSpeed   = 0.8;
    } else {
      this.controls.minDistance = 4;
      this.controls.maxDistance = 3000;
      this.controls.zoomSpeed   = 1.1;
    }
  }

  _setSolarSystemVisible(visible) {
    const ss = this.solarSystem;
    // Planets + sun
    for (const planet of ss.planets.values()) {
      if (planet.mesh)        planet.mesh.visible        = visible;
      if (planet.cloudsMesh)  planet.cloudsMesh.visible  = visible;
      if (planet.atmosphereMesh) planet.atmosphereMesh.visible = visible;
      if (planet.ringsMesh)   planet.ringsMesh.visible   = visible;
      if (planet.bodyGroup)   planet.bodyGroup.visible   = visible;
      if (planet.orbitPivot)  planet.orbitPivot.visible  = visible;
    }
    // Orbit lines
    for (const line of ss.orbitLines.values()) line.visible = visible;
    // Asteroid belts
    if (ss.asteroidMesh) ss.asteroidMesh.visible = visible;
    if (ss.kuiperMesh)   ss.kuiperMesh.visible   = visible;
    // Sun corona mesh stored on ss.sun
    if (ss.sun && ss.sun.corona) ss.sun.corona.visible = visible;
  }

  // Alias kept for backwards compatibility with UI code
  flyToPlanet(id) { this.flyToTarget(id); }
}
