// Comprehensive astronomical data for the Milky Way Galaxy, Sagittarius A*, Spiral Arms, Nebulae, and Scale Landmarks
export const MILKY_WAY_DATA = {
  galaxy: {
    id: 'milky_way',
    name: 'The Milky Way Galaxy',
    type: 'Barred Spiral Galaxy (SB(rs)bc)',
    diameterLightYears: '100,000 – 120,000 light-years',
    diameterKm: '9.5 × 10¹⁷ km',
    thickness: '~1,000 light-years (disc), ~10,000 light-years (bulge)',
    estimatedStars: '100 to 400 Billion Stars',
    estimatedMass: '1.5 Trillion Solar Masses (including Dark Matter)',
    age: '~13.61 Billion Years (nearly as old as the Universe)',
    cosmicYear: '230 Million Earth Years per Galactic Rotation',
    description: 'Our galactic home island in the cosmos. A magnificent barred spiral galaxy with a central stellar bar, two major spiral arms, several minor arms and spurs, and a supermassive black hole at its core.',
    facts: [
      'The Milky Way is moving through space toward the Andromeda Galaxy at roughly 110 km/s; they will merge in about 4.5 billion years to form "Milkomeda".',
      'About 90% of the Milky Way\'s total mass consists of mysterious Dark Matter that forms a vast invisible halo around the visible disk.',
      'One galactic rotation (Cosmic Year) takes ~230 million years. The last time our Solar System was in this part of the galaxy, the earliest dinosaurs were just beginning to walk the Earth!',
      'The galaxy is part of the Local Group of over 54 galaxies, which in turn belongs to the Laniakea Supercluster spanning 520 million light-years.'
    ]
  },
  sagittariusA: {
    id: 'sagittarius_a',
    name: 'Sagittarius A* (Sgr A*)',
    type: 'Supermassive Black Hole',
    mass: '4.3 Million Solar Masses (8.6 × 10³⁶ kg)',
    schwarzschildRadius: '~12.7 Million km (0.085 AU - roughly 18 times Sun\'s radius)',
    eventHorizonDiameter: '~25.4 Million km',
    distanceFromEarth: '26,673 light-years (8,178 parsecs)',
    constellation: 'Sagittarius',
    description: 'The supermassive gravitational monster at the exact dynamical center of the Milky Way. First directly imaged by the Event Horizon Telescope (EHT) in May 2022.',
    facts: [
      'Stars near Sgr A* (called S-stars, like S2) orbit at mind-boggling velocities exceeding 7,000 km/s (nearly 3% the speed of light)!',
      'The accretion disk around Sgr A* swirls with superheated, magnetized plasma that radiates intense radio, infrared, and X-ray emission.',
      'Black holes warp spacetime so intensely that light paths bend around them, creating a glowing "photon ring" and a dark central shadow.',
      'Despite containing over 4 million solar masses, its event horizon would fit comfortably inside the orbit of Mercury!'
    ],
    // Visualization coords in galactic units
    position: [0, 0, 0],
    color: '#ffaa33',
    glowColor: '#ff5500'
  },
  spiralArms: [
    {
      id: 'arm_perseus',
      name: 'Perseus Arm',
      type: 'Major Spiral Arm',
      description: 'One of the two primary spiral arms originating from the far end of the central bar, rich in massive OB star associations and glowing H II star-forming regions.',
      color: '#4fc3f7',
      pitchAngle: 12.0,
      startAngle: 0,
      radiusRange: [180, 520]
    },
    {
      id: 'arm_scutum_centaurus',
      name: 'Scutum-Centaurus Arm',
      type: 'Major Spiral Arm',
      description: 'The second major spiral arm originating from the near end of the galactic bar, densely packed with star clusters and giant molecular dust clouds.',
      color: '#81c784',
      pitchAngle: 12.5,
      startAngle: Math.PI,
      radiusRange: [170, 500]
    },
    {
      id: 'arm_sagittarius',
      name: 'Sagittarius Arm (Carina-Sagittarius)',
      type: 'Minor Spiral Arm',
      description: 'An inner spiral arm located between the Scutum-Centaurus Arm and our Orion Spur, home to spectacular nebulae like the Carina and Eagle nebulae.',
      color: '#ffb74d',
      pitchAngle: 11.5,
      startAngle: Math.PI * 0.5,
      radiusRange: [140, 420]
    },
    {
      id: 'arm_orion_spur',
      name: 'Orion-Cygnus Arm (The Orion Spur)',
      type: 'Local Galactic Spur (Our Home)',
      description: 'A minor spiral arm/bridge located between the Sagittarius and Perseus arms. Our Solar System, along with the Orion Nebula and nearby bright stars, resides right here!',
      color: '#ffd54f',
      pitchAngle: 10.0,
      startAngle: Math.PI * 0.72,
      radiusRange: [230, 310],
      isHome: true,
      facts: [
        'Our Sun is located roughly 26,000 light-years from the galactic core on the inner rim of this spur.',
        'The Orion Spur is about 3,500 light-years across and roughly 10,000 light-years in length.',
        'Famous nearby stellar objects like Betelgeuse, Rigel, the Pleiades cluster, and Sirius all reside in this spur.'
      ]
    },
    {
      id: 'arm_norma_outer',
      name: 'Norma & Outer Arm',
      type: 'Outermost Spiral Structure',
      description: 'The outermost observable spiral feature of the galactic disk, transitioning into the tenuous stellar halo.',
      color: '#ba68c8',
      pitchAngle: 11.0,
      startAngle: Math.PI * 1.5,
      radiusRange: [380, 600]
    }
  ],
  nebulae: [
    {
      id: 'nebula_orion',
      name: 'Orion Nebula (Messier 42)',
      type: 'Diffuse Stellar Nursery (Emission/Reflection)',
      distanceLightYears: '1,344 light-years',
      sizeLightYears: '24 light-years across',
      constellation: 'Orion',
      description: 'The closest massive star-forming factory to Earth. Visible to the naked eye as the middle "star" in Orion\'s sword, illuminating newborn stars and protoplanetary discs.',
      position: [-160, 12, 190],
      color: '#ff4081'
    },
    {
      id: 'nebula_eagle',
      name: 'Eagle Nebula (Pillars of Creation - M16)',
      type: 'H II Star-Forming Emission Nebula',
      distanceLightYears: '7,000 light-years',
      sizeLightYears: '70 × 55 light-years across',
      constellation: 'Serpens',
      description: 'Famous worldwide for the iconic "Pillars of Creation" imaged by Hubble and JWST, where colossal fingers of interstellar gas and dust are sculpting newborn stars.',
      position: [-80, -8, 120],
      color: '#e040fb'
    },
    {
      id: 'nebula_carina',
      name: 'Carina Nebula (NGC 3372)',
      type: 'Giant Starburst Emission Nebula',
      distanceLightYears: '8,500 light-years',
      sizeLightYears: '460 light-years across',
      constellation: 'Carina',
      description: 'One of the largest and most luminous diffuse nebulae in our skies, home to the hypergiant unstable star Eta Carinae, which shines over 4 million times brighter than the Sun.',
      position: [110, -15, 140],
      color: '#00e5ff'
    },
    {
      id: 'cluster_omega_centauri',
      name: 'Omega Centauri (NGC 5139)',
      type: 'Ancient Globular Cluster',
      distanceLightYears: '17,090 light-years',
      estimatedStars: 'Over 10 Million Stars',
      constellation: 'Centaurus',
      description: 'The most massive globular cluster in the Milky Way halo, thought to be the stripped nucleus of an ancient dwarf galaxy devoured by the Milky Way billions of years ago.',
      position: [140, 75, -80],
      color: '#ffea00'
    }
  ],
  solarSystemLocation: {
    name: 'Solar System (Sun & Earth)',
    distanceFromCoreLightYears: '26,670 light-years (8.18 kpc)',
    galacticCoordinates: 'R = 8.2 kpc, z = +20 pc above galactic midplane',
    galacticSpeed: '230 km/s (828,000 km/h)',
    orbitPeriodMyr: '230 Million Years',
    // Position vector mapped to our 3D galaxy visualization coordinates
    position: [-175, 4, 185],
    color: '#ffeb3b'
  }
};

// Classroom Lessons Curriculum for Students
export const CLASSROOM_LESSONS = [
  {
    step: 1,
    title: '1. The Architecture of the Milky Way',
    subtitle: 'Our 100,000 Light-Year Galactic Metropolis',
    target: 'milky_way',
    summary: 'The Milky Way is a Barred Spiral Galaxy containing 100 to 400 billion stars. The disk spans over 100,000 light-years across, with vast spiral arms rotating around a central stellar bar and a supermassive core.',
    keyPoints: [
      'Classification: SB(rs)bc barred spiral.',
      'Contains 100 to 400 billion suns and billions of planetary systems.',
      'Takes 230 million years for one full rotation (Cosmic Year).',
      'The disk is surrounded by an ancient spherical halo of globular clusters and mysterious dark matter.'
    ],
    cameraTarget: [0, 950, 650]
  },
  {
    step: 2,
    title: '2. The Core Monster: Sagittarius A*',
    subtitle: 'The Supermassive Black Hole at Galactic Center',
    target: 'sagittarius_a',
    summary: 'At the exact gravitational center of the Milky Way lies Sagittarius A* (Sgr A*), a supermassive black hole packed with 4.3 million times the mass of our Sun.',
    keyPoints: [
      'Mass: 4.3 million solar masses packed into a region smaller than Mercury\'s orbit.',
      'First imaged in 2022 by the global Event Horizon Telescope (EHT).',
      'Its immense gravity bends light into a glowing photon ring around a pitch-black shadow.',
      'Nearby stars orbit Sgr A* at up to 7,000 km/s!'
    ],
    cameraTarget: [0, 45, 120]
  },
  {
    step: 3,
    title: '3. Our Cosmic Address: The Orion Spur',
    subtitle: 'Where Our Solar System Resides',
    target: 'arm_orion_spur',
    summary: 'Our Solar System is not at the center of the galaxy, nor on the very edge. We reside about 26,000 light-years from the center on a gentle spiral bridge called the Orion Spur.',
    keyPoints: [
      'Distance from center: ~26,000 light-years.',
      'Located in the "Galactic Habitable Zone" — safe from intense core radiation and star mergers.',
      'Our Sun travels around the galaxy at 828,000 km/h.',
      'Neighbored by the Orion Nebula, the Pleiades, and the bright star Sirius.'
    ],
    cameraTarget: [-175, 45, 230]
  },
  {
    step: 4,
    title: '4. The Solar System: Sun & The 8 Planets',
    subtitle: 'From Scorched Mercury to Distant Neptune',
    target: 'sun',
    summary: 'Zooming into our home star system: The Sun holds 99.86% of the mass, governing four rocky terrestrial inner worlds (Mercury, Venus, Earth, Mars) and four outer giants (Jupiter, Saturn, Uranus, Neptune).',
    keyPoints: [
      'Inner Terrestrial Planets: Rocky, dense, few or no moons.',
      'Asteroid Belt: Thousands of ancient planetary building blocks.',
      'Gas & Ice Giants: Immense atmospheres, rings, and dozens of moons.',
      'Kuiper Belt & Oort Cloud: Icy comets extending out toward interstellar space.'
    ],
    cameraTarget: [0, 180, 320]
  },
  {
    step: 5,
    title: '5. Earth & Humanity\'s Satellites',
    subtitle: 'From Low Earth Orbit to Interstellar Probes',
    target: 'earth',
    summary: 'Zooming into our blue home planet Earth to discover human ingenuity: the International Space Station (ISS), Hubble, GPS constellation, James Webb Space Telescope (JWST) at L2, and the deep-space Voyager probes!',
    keyPoints: [
      'Low Earth Orbit (LEO): ISS orbits at 420 km altitude in 92 minutes.',
      'Lagrange Point L2: JWST observes the infrared universe 1.5 million km away from Earth.',
      'Interstellar Space: Voyager 1 is the farthest human artifact, over 24 billion km from Earth carrying the Golden Record!'
    ],
    cameraTarget: [-98, 8, 18]
  }
];

// Interactive Student Astronomy Quiz
export const STUDENT_QUIZ = [
  {
    id: 'q1',
    question: 'What type of galaxy is our Milky Way?',
    options: [
      'Barred Spiral Galaxy',
      'Elliptical Galaxy',
      'Irregular Galaxy',
      'Ring Galaxy'
    ],
    correctIndex: 0,
    explanation: 'Correct! The Milky Way is an SB(rs)bc barred spiral galaxy with a central bar of stars and sweeping spiral arms.',
    focusId: 'milky_way'
  },
  {
    id: 'q2',
    question: 'What is the name of the supermassive black hole at the center of the Milky Way?',
    options: [
      'Sagittarius A*',
      'Cygnus X-1',
      'Messier 87*',
      'Gargantua'
    ],
    correctIndex: 0,
    explanation: 'Correct! Sagittarius A* (Sgr A*) is the 4.3-million-solar-mass black hole at our galactic core.',
    focusId: 'sagittarius_a'
  },
  {
    id: 'q3',
    question: 'In which spiral feature of the Milky Way is our Solar System located?',
    options: [
      'Orion-Cygnus Spur',
      'Perseus Arm',
      'Norma Arm',
      'Galactic Center Bulge'
    ],
    correctIndex: 0,
    explanation: 'Correct! Our Solar System resides in the Orion Spur, about 26,000 light-years from the galactic core.',
    focusId: 'arm_orion_spur'
  },
  {
    id: 'q4',
    question: 'Where does the James Webb Space Telescope (JWST) orbit?',
    options: [
      'Sun-Earth Lagrange Point L2 (~1.5M km from Earth)',
      'Low Earth Orbit near the ISS (~400 km)',
      'In orbit around the Moon',
      'In orbit around Mars'
    ],
    correctIndex: 0,
    explanation: 'Correct! JWST orbits the Sun-Earth L2 Lagrange Point, where gravitational forces allow it to stay shielded from the Sun and Earth\'s heat.',
    focusId: 'satellite_jwst'
  },
  {
    id: 'q5',
    question: 'Which spacecraft is currently the farthest human-made object from Earth in interstellar space?',
    options: [
      'Voyager 1',
      'New Horizons',
      'Hubble Space Telescope',
      'Parker Solar Probe'
    ],
    correctIndex: 0,
    explanation: 'Correct! Launched in 1977, Voyager 1 crossed the heliopause into interstellar space and is over 163 AU (24+ billion km) away!',
    focusId: 'satellite_voyager1'
  }
];

