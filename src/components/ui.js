import { SOLAR_SYSTEM_DATA } from '../planetsData.js';
import { MILKY_WAY_DATA } from '../milkyWayData.js';
import { SATELLITES_DATA } from '../satellitesData.js';

export class SolarSystemUI {
  constructor(solarSystem, milkyWay, satellitesSystem, cameraController, spaceAudio, toggleBloom) {
    this.solarSystem = solarSystem;
    this.milkyWay = milkyWay;
    this.satellitesSystem = satellitesSystem;
    this.cameraController = cameraController;
    this.spaceAudio = spaceAudio;
    this.toggleBloom = toggleBloom;

    this.activeTargetId = null;
    this.currentScaleMode = 'solar_system'; // 'milky_way' | 'solar_system' | 'satellites'
    this.tourInterval = null;
    this.isTouring = false;

    this.createDom();
    this.attachEvents();
    this.startTelemetryClock();
  }

  setEducationalSystem(eduSystem) {
    this.eduSystem = eduSystem;
  }

  createDom() {
    // 1. Mission Telemetry HUD
    const telemetry = document.createElement('div');
    telemetry.className = 'telemetry-hud';
    telemetry.innerHTML = `
      <div class="telemetry-badge">
        <span class="pulse-dot"></span>
        <span class="telemetry-tag">COSMIC EXPLORER // ASTRONOMY EDUCATION SUITE</span>
      </div>
      <div class="telemetry-counter" id="telemetryCounter">T-00.00:00</div>
      <div class="telemetry-details">
        <div class="telem-row">DOMAIN: <span id="telemDomain" class="telem-val">SOLAR SYSTEM</span></div>
        <div class="telem-row">TARGET: <span id="telemTarget" class="telem-val">EARTH // HABITABLE ZONE</span></div>
        <div class="telem-row">VELOCITY: <span id="telemSpeed" class="telem-val">1.0x REAL-TIME</span></div>
      </div>
    `;
    document.body.appendChild(telemetry);

    // 2. Cosmic Scale Selector (Top Left / Center)
    const scaleSelector = document.createElement('div');
    scaleSelector.className = 'scale-selector-bar';
    scaleSelector.innerHTML = `
      <button class="scale-btn" data-scale="milky_way">
        <span class="scale-icon">🌌</span> Milky Way Galaxy
      </button>
      <button class="scale-btn" data-scale="orion_spur">
        <span class="scale-icon">📍</span> Orion Arm
      </button>
      <button class="scale-btn active" data-scale="solar_system">
        <span class="scale-icon">☀️</span> Solar System
      </button>
      <button class="scale-btn" data-scale="satellites">
        <span class="scale-icon">🛰️</span> Satellites & Probes
      </button>
    `;
    document.body.appendChild(scaleSelector);
    this.scaleSelector = scaleSelector;

    // 3. Classroom Teaching Tools Bar (Top-Center Right)
    const classroomBar = document.createElement('div');
    classroomBar.className = 'classroom-tools-bar';
    classroomBar.innerHTML = `
      <button class="edu-tool-btn" id="btnOpenLessons">
        <span class="tool-icon">🎓</span> Lessons
      </button>
      <button class="edu-tool-btn" id="btnOpenQuiz">
        <span class="tool-icon">📝</span> Student Quiz
      </button>
      <button class="edu-tool-btn" id="btnOpenScale">
        <span class="tool-icon">📏</span> Powers of 10
      </button>
    `;
    document.body.appendChild(classroomBar);
    this.classroomBar = classroomBar;

    // 4. Planet & Satellites Navigation Dock (Bottom bar)
    const navDock = document.createElement('div');
    navDock.className = 'nav-dock';
    this.navDock = navDock;
    document.body.appendChild(navDock);
    this.renderNavDock('solar_system');

    // 5. Information Panel (Right Drawer)
    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel hidden';
    infoPanel.id = 'infoPanel';
    infoPanel.innerHTML = `
      <button class="close-info-btn" id="closeInfoBtn">&times;</button>
      <div class="info-header">
        <div class="info-type" id="infoType">TERRESTRIAL PLANET</div>
        <h2 class="info-title" id="infoTitle">Earth</h2>
      </div>
      <p class="info-desc" id="infoDesc"></p>
      
      <div class="info-stats-grid" id="infoStats"></div>

      <div class="info-facts-section">
        <h3>ASTRONOMICAL & EDUCATIONAL INSIGHTS</h3>
        <ul class="info-facts-list" id="infoFacts"></ul>
      </div>

      <div class="info-actions">
        <button class="action-btn" id="focusTargetBtn">Focus Camera</button>
      </div>
    `;
    document.body.appendChild(infoPanel);
    this.infoPanel = infoPanel;

    // 6. Quick Controls Deck (Top Right)
    const controlDeck = document.createElement('div');
    controlDeck.className = 'control-deck';
    controlDeck.innerHTML = `
      <div class="control-group">
        <label>TIME WARP: <span id="speedVal">1.0x</span></label>
        <div class="speed-control-row">
          <button id="pauseBtn" class="deck-btn" title="Pause / Play (Space)">⏸</button>
          <input type="range" id="timeSpeedSlider" min="0" max="30" step="0.5" value="1.0" />
        </div>
      </div>
      <div class="control-row-buttons">
        <button id="btnTour" class="deck-btn">Cinematic Tour</button>
        <button id="btnAudio" class="deck-btn">Sound: OFF</button>
      </div>
      <div class="toggle-checkboxes">
        <label class="toggle-item"><input type="checkbox" id="toggleSunRays" checked /> Sun Rays on Planets</label>
        <label class="toggle-item"><input type="checkbox" id="toggleSolarBeams" /> Solar Ray Beams</label>
        <label class="toggle-item"><input type="checkbox" id="toggleOrbits" checked /> Orbits</label>
        <label class="toggle-item"><input type="checkbox" id="toggleSatellites" checked /> Satellites</label>
        <label class="toggle-item"><input type="checkbox" id="toggleGalaxyArms" checked /> Spiral Guides</label>
        <label class="toggle-item"><input type="checkbox" id="toggleAsteroids" checked /> Asteroids</label>
        <label class="toggle-item"><input type="checkbox" id="toggleBloom" checked /> Glow / Bloom</label>
      </div>
    `;
    document.body.appendChild(controlDeck);
    this.controlDeck = controlDeck;

    // 7. 3D Hover Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'planet-tooltip';
    tooltip.id = 'planetTooltip';
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }

  renderNavDock(mode) {
    this.currentScaleMode = mode;
    let buttonsHtml = '';

    if (mode === 'milky_way') {
      buttonsHtml = `
        <button class="nav-btn active" data-id="milky_way">
          <span class="nav-icon" style="background: #90caf9;"></span>
          <span>Full Galaxy</span>
        </button>
        <button class="nav-btn" data-id="sagittarius_a">
          <span class="nav-icon" style="background: #ff9800;"></span>
          <span>Sagittarius A*</span>
        </button>
        <button class="nav-btn" data-id="arm_orion_spur">
          <span class="nav-icon" style="background: #ffd54f;"></span>
          <span>Orion Spur (Our Home)</span>
        </button>
        <button class="nav-btn" data-id="arm_perseus">
          <span class="nav-icon" style="background: #4fc3f7;"></span>
          <span>Perseus Arm</span>
        </button>
        <button class="nav-btn" data-id="nebula_orion">
          <span class="nav-icon" style="background: #ff4081;"></span>
          <span>Orion Nebula</span>
        </button>
        <button class="nav-btn" data-id="nebula_eagle">
          <span class="nav-icon" style="background: #e040fb;"></span>
          <span>Pillars of Creation</span>
        </button>
      `;
    } else if (mode === 'satellites') {
      buttonsHtml = `
        <button class="nav-btn active" data-id="satellite_iss">
          <span class="nav-icon" style="background: #00d2ff;"></span>
          <span>ISS (Space Station)</span>
        </button>
        <button class="nav-btn" data-id="satellite_hubble">
          <span class="nav-icon" style="background: #38ef7d;"></span>
          <span>Hubble Telescope</span>
        </button>
        <button class="nav-btn" data-id="satellite_jwst">
          <span class="nav-icon" style="background: #ffb300;"></span>
          <span>James Webb (JWST @ L2)</span>
        </button>
        <button class="nav-btn" data-id="satellite_gps">
          <span class="nav-icon" style="background: #29b6f6;"></span>
          <span>GPS Constellation</span>
        </button>
        <button class="nav-btn" data-id="satellite_voyager1">
          <span class="nav-icon" style="background: #e040fb;"></span>
          <span>Voyager 1 (Interstellar)</span>
        </button>
        <button class="nav-btn" data-id="satellite_voyager2">
          <span class="nav-icon" style="background: #ab47bc;"></span>
          <span>Voyager 2</span>
        </button>
        <button class="nav-btn" data-id="satellite_parker">
          <span class="nav-icon" style="background: #ff7043;"></span>
          <span>Parker Solar Probe</span>
        </button>
      `;
    } else {
      // Solar system mode
      buttonsHtml = `
        <button class="nav-btn" data-id="overview">
          <span class="nav-icon" style="background: #4488ff;"></span>
          <span>Overview</span>
        </button>
      `;
      for (const [key, data] of Object.entries(SOLAR_SYSTEM_DATA)) {
        buttonsHtml += `
          <button class="nav-btn ${key === 'earth' ? 'active' : ''}" data-id="${key}">
            <span class="nav-icon" style="background: ${data.color};"></span>
            <span>${data.name}</span>
          </button>
        `;
      }
    }

    this.navDock.innerHTML = buttonsHtml;
  }

  attachEvents() {
    // Navigation buttons in bottom dock
    this.navDock.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      this.selectTarget(id);
    });

    // Scale selector buttons
    this.scaleSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.scale-btn');
      if (!btn) return;
      this.scaleSelector.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const scale = btn.dataset.scale;
      if (scale === 'milky_way') {
        this.renderNavDock('milky_way');
        this.selectTarget('milky_way');
      } else if (scale === 'orion_spur') {
        this.renderNavDock('milky_way');
        this.selectTarget('arm_orion_spur');
      } else if (scale === 'satellites') {
        this.renderNavDock('satellites');
        this.selectTarget('satellite_iss');
      } else {
        this.renderNavDock('solar_system');
        this.selectTarget('overview');
      }
    });

    // Classroom Teaching Tools buttons
    document.getElementById('btnOpenLessons').addEventListener('click', () => {
      if (this.eduSystem) this.eduSystem.openLessons();
    });

    document.getElementById('btnOpenQuiz').addEventListener('click', () => {
      if (this.eduSystem) this.eduSystem.openQuiz();
    });

    document.getElementById('btnOpenScale').addEventListener('click', () => {
      if (this.eduSystem) this.eduSystem.openScaleBar();
    });

    // Close info panel
    document.getElementById('closeInfoBtn').addEventListener('click', () => {
      this.infoPanel.classList.add('hidden');
    });

    // Focus target
    document.getElementById('focusTargetBtn').addEventListener('click', () => {
      if (this.activeTargetId) {
        this.cameraController.flyToTarget(this.activeTargetId);
      }
    });

    // Time speed slider
    const speedSlider = document.getElementById('timeSpeedSlider');
    const speedVal = document.getElementById('speedVal');
    const pauseBtn = document.getElementById('pauseBtn');
    let isPaused = false;
    let lastSpeed = 1.0;

    speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.solarSystem.timeScale = val;
      speedVal.textContent = `${val.toFixed(1)}x`;
      document.getElementById('telemSpeed').textContent = `${val.toFixed(1)}x ORBIT WARP`;
      if (val > 0) {
        isPaused = false;
        pauseBtn.textContent = '⏸';
      }
    });

    pauseBtn.addEventListener('click', () => {
      if (isPaused) {
        this.solarSystem.timeScale = lastSpeed;
        speedSlider.value = lastSpeed;
        speedVal.textContent = `${lastSpeed.toFixed(1)}x`;
        pauseBtn.textContent = '⏸';
        isPaused = false;
      } else {
        lastSpeed = this.solarSystem.timeScale || 1.0;
        this.solarSystem.timeScale = 0;
        speedSlider.value = 0;
        speedVal.textContent = '0.0x';
        pauseBtn.textContent = '▶';
        isPaused = true;
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        pauseBtn.click();
      } else if (e.code === 'KeyM') {
        this.selectTarget('milky_way');
      } else if (e.code === 'KeyR') {
        this.selectTarget('overview');
      } else if (e.code === 'KeyE') {
        this.selectTarget('earth');
      } else if (e.code === 'KeyL') {
        this.selectTarget('moon');
      } else if (e.code === 'KeyI') {
        this.selectTarget('satellite_iss');
      }
    });

    // Tour button
    document.getElementById('btnTour').addEventListener('click', () => {
      this.toggleCinematicTour();
    });

    // Audio toggle
    const audioBtn = document.getElementById('btnAudio');
    audioBtn.addEventListener('click', () => {
      const playing = this.spaceAudio.toggle();
      audioBtn.textContent = playing ? 'Sound: ON ♫' : 'Sound: OFF';
      audioBtn.classList.toggle('active', playing);
    });

    // Toggles
    document.getElementById('toggleSunRays').addEventListener('change', (e) => {
      this.solarSystem.setSunLightingEnabled(e.target.checked);
    });

    document.getElementById('toggleSolarBeams').addEventListener('change', (e) => {
      this.solarSystem.setSolarBeamsVisible(e.target.checked);
    });

    document.getElementById('toggleOrbits').addEventListener('change', (e) => {
      this.solarSystem.setOrbitsVisible(e.target.checked);
    });

    document.getElementById('toggleSatellites').addEventListener('change', (e) => {
      if (this.satellitesSystem) {
        this.satellitesSystem.setSatellitesVisible(e.target.checked);
      }
    });

    document.getElementById('toggleGalaxyArms').addEventListener('change', (e) => {
      if (this.milkyWay) {
        this.milkyWay.setArmGuidesVisible(e.target.checked);
      }
    });

    document.getElementById('toggleAsteroids').addEventListener('change', (e) => {
      this.solarSystem.setAsteroidsVisible(e.target.checked);
    });

    document.getElementById('toggleBloom').addEventListener('change', (e) => {
      if (this.toggleBloom) this.toggleBloom(e.target.checked);
    });
  }

  selectTarget(id) {
    if (this.isTouring && id !== 'tour') {
      this.stopCinematicTour();
    }

    this.activeTargetId = id;
    this.updateActiveButton(id);

    // 1. Overview
    if (id === 'overview') {
      this.cameraController.resetToOverview();
      this.infoPanel.classList.add('hidden');
      document.getElementById('telemDomain').textContent = 'SOLAR SYSTEM';
      document.getElementById('telemTarget').textContent = 'SYSTEM OVERVIEW';
      return;
    }

    // 2. Full Milky Way
    if (id === 'milky_way') {
      this.cameraController.flyToTarget('milky_way');
      this.populateMilkyWayPanel(MILKY_WAY_DATA.galaxy);
      this.infoPanel.classList.remove('hidden');
      document.getElementById('telemDomain').textContent = 'LOCAL GROUP';
      document.getElementById('telemTarget').textContent = 'MILKY WAY GALAXY';
      return;
    }

    // 3. Sagittarius A*
    if (id === 'sagittarius_a') {
      this.cameraController.flyToTarget('sagittarius_a');
      this.populateBlackHolePanel(MILKY_WAY_DATA.sagittariusA);
      this.infoPanel.classList.remove('hidden');
      document.getElementById('telemDomain').textContent = 'GALACTIC CENTER';
      document.getElementById('telemTarget').textContent = 'SAGITTARIUS A* (CORE)';
      return;
    }

    // 4. Spiral Arm or Nebula
    const arm = MILKY_WAY_DATA.spiralArms.find(a => a.id === id);
    if (arm) {
      this.cameraController.flyToTarget(id);
      this.populateArmPanel(arm);
      this.infoPanel.classList.remove('hidden');
      document.getElementById('telemDomain').textContent = 'SPIRAL STRUCTURE';
      document.getElementById('telemTarget').textContent = arm.name.toUpperCase();
      return;
    }

    const neb = MILKY_WAY_DATA.nebulae.find(n => n.id === id);
    if (neb) {
      this.cameraController.flyToTarget(id);
      this.populateNebulaPanel(neb);
      this.infoPanel.classList.remove('hidden');
      document.getElementById('telemDomain').textContent = 'STELLAR NURSERY';
      document.getElementById('telemTarget').textContent = neb.name.toUpperCase();
      return;
    }

    // 5. Satellites
    const sat = Object.values(SATELLITES_DATA).find(s => s.id === id);
    if (sat) {
      this.cameraController.flyToTarget(id);
      this.populateSatellitePanel(sat);
      this.infoPanel.classList.remove('hidden');
      document.getElementById('telemDomain').textContent = 'HUMAN SPACECRAFT';
      document.getElementById('telemTarget').textContent = sat.name.toUpperCase();
      return;
    }

    // 6. Planets
    const planetData = SOLAR_SYSTEM_DATA[id];
    if (planetData) {
      this.cameraController.flyToTarget(id);
      this.populatePlanetPanel(planetData);
      this.infoPanel.classList.remove('hidden');
      document.getElementById('telemDomain').textContent = 'SOLAR SYSTEM';
      document.getElementById('telemTarget').textContent = planetData.name.toUpperCase();
    }
  }

  updateActiveButton(id) {
    const buttons = this.navDock.querySelectorAll('.nav-btn');
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.id === id);
    });
  }

  populatePlanetPanel(data) {
    document.getElementById('infoType').textContent = data.type.toUpperCase();
    document.getElementById('infoTitle').textContent = data.name;
    document.getElementById('infoDesc').textContent = data.description;

    const statsGrid = document.getElementById('infoStats');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-lbl">DIAMETER</span>
        <span class="stat-val">${data.diameterKm}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">DISTANCE (SUN)</span>
        <span class="stat-val">${data.distanceAU}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">ORBITAL PERIOD</span>
        <span class="stat-val">${data.orbitalPeriod}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">DAY LENGTH</span>
        <span class="stat-val">${data.rotationPeriod}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">MEAN TEMP</span>
        <span class="stat-val">${data.surfaceTemp}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">MOONS COUNT</span>
        <span class="stat-val">${data.moonsCount || 0}</span>
      </div>
    `;

    const factsList = document.getElementById('infoFacts');
    factsList.innerHTML = (data.facts || [])
      .map((fact) => `<li>${fact}</li>`)
      .join('');
  }

  populateSatellitePanel(data) {
    document.getElementById('infoType').textContent = `${data.agency} // ${data.type}`.toUpperCase();
    document.getElementById('infoTitle').textContent = data.name;
    document.getElementById('infoDesc').textContent = data.description;

    const statsGrid = document.getElementById('infoStats');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-lbl">ORBIT TYPE</span>
        <span class="stat-val">${data.orbitType || 'Deep Space'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">ALTITUDE / DIST</span>
        <span class="stat-val">${data.altitude || data.distanceFromEarth || 'Variable'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">SPEED</span>
        <span class="stat-val">${data.speedKmH || data.topSpeed || 'N/A'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">LAUNCH DATE</span>
        <span class="stat-val">${data.launchDate}</span>
      </div>
    `;

    const factsList = document.getElementById('infoFacts');
    factsList.innerHTML = (data.facts || [])
      .map((fact) => `<li>${fact}</li>`)
      .join('');
  }

  populateBlackHolePanel(data) {
    document.getElementById('infoType').textContent = 'SUPERMASSIVE BLACK HOLE // GALACTIC CORE';
    document.getElementById('infoTitle').textContent = data.name;
    document.getElementById('infoDesc').textContent = data.description;

    const statsGrid = document.getElementById('infoStats');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-lbl">MASS</span>
        <span class="stat-val">${data.mass}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">SHADOW RADIUS</span>
        <span class="stat-val">${data.schwarzschildRadius}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">DISTANCE FROM EARTH</span>
        <span class="stat-val">${data.distanceFromEarth}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">LOCATION</span>
        <span class="stat-val">Galactic Center</span>
      </div>
    `;

    const factsList = document.getElementById('infoFacts');
    factsList.innerHTML = (data.facts || [])
      .map((fact) => `<li>${fact}</li>`)
      .join('');
  }

  populateMilkyWayPanel(data) {
    document.getElementById('infoType').textContent = data.type.toUpperCase();
    document.getElementById('infoTitle').textContent = data.name;
    document.getElementById('infoDesc').textContent = data.description;

    const statsGrid = document.getElementById('infoStats');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-lbl">DIAMETER</span>
        <span class="stat-val">${data.diameterLightYears}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">ESTIMATED STARS</span>
        <span class="stat-val">${data.estimatedStars}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">TOTAL MASS</span>
        <span class="stat-val">${data.estimatedMass}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">GALACTIC YEAR</span>
        <span class="stat-val">${data.cosmicYear}</span>
      </div>
    `;

    const factsList = document.getElementById('infoFacts');
    factsList.innerHTML = (data.facts || [])
      .map((fact) => `<li>${fact}</li>`)
      .join('');
  }

  populateArmPanel(data) {
    document.getElementById('infoType').textContent = data.type.toUpperCase();
    document.getElementById('infoTitle').textContent = data.name;
    document.getElementById('infoDesc').textContent = data.description;

    const statsGrid = document.getElementById('infoStats');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-lbl">STRUCTURE</span>
        <span class="stat-val">${data.isHome ? 'Our Galactic Home' : 'Spiral Arm Feature'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">PITCH ANGLE</span>
        <span class="stat-val">${data.pitchAngle}° Log Spiral</span>
      </div>
    `;

    const factsList = document.getElementById('infoFacts');
    factsList.innerHTML = (data.facts || [
      'Contains dense lanes of hydrogen gas, cosmic dust, and bright star clusters.',
      'Rotates at differential velocities around the central supermassive core.'
    ]).map((f) => `<li>${f}</li>`).join('');
  }

  populateNebulaPanel(data) {
    document.getElementById('infoType').textContent = data.type.toUpperCase();
    document.getElementById('infoTitle').textContent = data.name;
    document.getElementById('infoDesc').textContent = data.description;

    const statsGrid = document.getElementById('infoStats');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-lbl">DISTANCE FROM EARTH</span>
        <span class="stat-val">${data.distanceLightYears}</span>
      </div>
      <div class="stat-card">
        <span class="stat-lbl">CONSTELLATION</span>
        <span class="stat-val">${data.constellation}</span>
      </div>
    `;

    const factsList = document.getElementById('infoFacts');
    factsList.innerHTML = `
      <li>A cosmic stellar nursery where clouds of hydrogen gas collapse under gravity to form new baby stars.</li>
      <li>Illuminated by intense ultraviolet radiation from hot young stellar clusters.</li>
    `;
  }

  toggleCinematicTour() {
    if (this.isTouring) {
      this.stopCinematicTour();
    } else {
      this.startCinematicTour();
    }
  }

  startCinematicTour() {
    this.isTouring = true;
    const tourBtn = document.getElementById('btnTour');
    tourBtn.textContent = 'Stop Tour';
    tourBtn.classList.add('active');

    const sequence = ['milky_way', 'sagittarius_a', 'arm_orion_spur', 'sun', 'earth', 'satellite_iss', 'satellite_jwst', 'satellite_voyager1', 'saturn'];
    let idx = 0;

    this.selectTarget(sequence[idx]);

    this.tourInterval = setInterval(() => {
      idx = (idx + 1) % sequence.length;
      this.selectTarget(sequence[idx]);
    }, 7500);
  }

  stopCinematicTour() {
    this.isTouring = false;
    clearInterval(this.tourInterval);
    const tourBtn = document.getElementById('btnTour');
    tourBtn.textContent = 'Cinematic Tour';
    tourBtn.classList.remove('active');
  }

  startTelemetryClock() {
    const counterEl = document.getElementById('telemetryCounter');
    const startSec = 6.1;
    let totalSec = startSec;

    setInterval(() => {
      totalSec += 0.1;
      const sign = totalSec >= 0 ? 'T+' : 'T-';
      const absVal = Math.abs(totalSec);
      const min = Math.floor(absVal / 60).toString().padStart(2, '0');
      const sec = (absVal % 60).toFixed(1).padStart(4, '0');
      counterEl.textContent = `${sign}${min}:${sec}`;
    }, 100);
  }

  showTooltip(x, y, name, sub) {
    this.tooltip.style.left = `${x + 15}px`;
    this.tooltip.style.top = `${y + 15}px`;
    this.tooltip.innerHTML = `<strong>${name}</strong>${sub ? `<br><span style="opacity:0.75; font-size:11px;">${sub}</span>` : ''}`;
    this.tooltip.classList.add('visible');
  }

  hideTooltip() {
    this.tooltip.classList.remove('visible');
  }
}
