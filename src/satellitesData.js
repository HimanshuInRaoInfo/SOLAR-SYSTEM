// Real Spacecraft & Satellites data with educational mission logs
export const SATELLITES_DATA = {
  iss: {
    id: 'satellite_iss',
    name: 'International Space Station (ISS)',
    agency: 'NASA / ESA / JAXA / Roscosmos / CSA',
    type: 'Modular Space Station (Microgravity Laboratory)',
    launchDate: 'November 20, 1998 (Zarya module)',
    orbitType: 'Low Earth Orbit (LEO)',
    altitude: '408 – 420 km',
    speedKmH: '27,600 km/h (7.66 km/s)',
    orbitalPeriod: '92.68 minutes (15.5 orbits per day)',
    inclination: '51.64°',
    dimensions: '109 m × 73 m (Football field size)',
    mass: '450,000 kg (990,000 lbs)',
    crewCapacity: '7 Astronauts & Cosmonauts',
    description: 'A global masterpiece of peaceful international scientific collaboration. The ISS has been continuously inhabited by humans since November 2000, serving as a cutting-edge microgravity physics, biology, and materials laboratory.',
    facts: [
      'Astronauts on the ISS witness 16 sunrises and 16 sunsets every single 24 hours!',
      'The station\'s solar array wingspan spans 73 meters, generating 120 kilowatts of usable power.',
      'Water on the ISS is recycled with 98% efficiency, including astronauts\' sweat and breath condensation.',
      'It orbits fast enough to travel from New York to London in under 15 minutes.'
    ],
    // Parent body and visual parameters
    parent: 'earth',
    orbitRadius: 7.6, // in Earth visual radius units (Earth radius = 6.2)
    speed: 0.18,
    inclinationDeg: 51.6,
    color: '#00d2ff',
    modelType: 'iss'
  },
  hubble: {
    id: 'satellite_hubble',
    name: 'Hubble Space Telescope (HST)',
    agency: 'NASA / ESA',
    type: 'Space Optical & Ultraviolet Telescope',
    launchDate: 'April 24, 1990 (Space Shuttle Discovery STS-31)',
    orbitType: 'Low Earth Orbit (LEO)',
    altitude: '540 km',
    speedKmH: '27,300 km/h (7.59 km/s)',
    orbitalPeriod: '95.4 minutes',
    inclination: '28.47°',
    mirrorDiameter: '2.4 meters (Primary Mirror)',
    description: 'One of humanity\'s greatest scientific observatories. Hubble revolutionized modern astrophysics by looking beyond Earth\'s atmospheric blur to capture deep universe fields and calculate the expansion rate of the universe.',
    facts: [
      'Hubble has completed over 1.5 million observations and over 18,000 scientific papers have been published using its data.',
      'It helped pinpoint the exact age of the Universe: 13.8 billion years old.',
      'Hubble was serviced and upgraded 5 times in orbit by astronauts flying on the Space Shuttle.',
      'The famous Hubble Ultra Deep Field revealed nearly 10,000 galaxies in a tiny patch of sky the size of a grain of sand held at arm\'s length!'
    ],
    parent: 'earth',
    orbitRadius: 8.3,
    speed: 0.15,
    inclinationDeg: 28.5,
    color: '#38ef7d',
    modelType: 'hubble'
  },
  jwst: {
    id: 'satellite_jwst',
    name: 'James Webb Space Telescope (JWST)',
    agency: 'NASA / ESA / CSA',
    type: 'Next-Generation Deep-Space Infrared Observatory',
    launchDate: 'December 25, 2021 (Ariane 5 VA256)',
    orbitType: 'Sun-Earth Lagrange Point L2 Halo Orbit',
    altitude: '~1,500,000 km from Earth (Anti-solar direction)',
    primaryMirror: '6.5 m (18 Beryllium Hexagons coated in pure Gold)',
    sunshieldSize: '21 m × 14 m (Size of a tennis court)',
    operatingTemp: '-233 °C (40 Kelvin) in deep cryogenic shadow',
    description: 'Humanity\'s flagship space science telescope. Designed to see the very first stars and galaxies that formed after the Big Bang (~13.5 billion years ago) and analyze the atmospheric chemistry of potentially habitable exoplanets.',
    facts: [
      'JWST orbits the second Sun-Earth Lagrange Point (L2), where Earth and the Sun\'s gravity balance the orbital centrifugal force.',
      'Its 5-layer tennis-court-sized sunshield blocks solar heat, reducing temperatures from +85 °C on the sun side to -233 °C on the mirror side.',
      'Its 18 mirror segments are coated with a microscopic layer of pure gold (just 100 nanometers thick) for maximum infrared reflectivity.',
      'Its infrared vision can peer straight through cosmic dust clouds that block visible light.'
    ],
    parent: 'earth_l2',
    orbitRadius: 24.0, // Placed at visual L2 distance along Earth's anti-sun axis
    speed: 0.01,
    color: '#ffb300',
    modelType: 'jwst'
  },
  gps: {
    id: 'satellite_gps',
    name: 'GPS Constellation (Navstar)',
    agency: 'United States Space Force / Civil Navigation',
    type: 'Global Positioning System Satellite',
    launchDate: 'Ongoing constellation (first in 1978)',
    orbitType: 'Medium Earth Orbit (MEO)',
    altitude: '20,180 km',
    speedKmH: '14,000 km/h (3.9 km/s)',
    orbitalPeriod: '11 hours 58 minutes (Semi-synchronous)',
    inclination: '55.0° (across 6 orbital planes)',
    constellationSize: '31+ active operational satellites',
    description: 'A global network of precision atomic-clock satellites orbiting in Medium Earth Orbit that enables real-time 3D location positioning, time synchronization, and navigation anywhere on the globe.',
    facts: [
      'Each GPS satellite carries ultra-precise Rubidium and Cesium atomic clocks accurate to within nanoseconds.',
      'To calculate your exact location on Earth, your phone needs signals from at least 4 GPS satellites simultaneously (trilateration).',
      'Engineers must adjust GPS clocks for Einstein\'s General and Special Relativity; otherwise, smartphone navigation would drift by over 10 km every single day!'
    ],
    parent: 'earth',
    orbitRadius: 11.5,
    speed: 0.06,
    inclinationDeg: 55.0,
    color: '#29b6f6',
    modelType: 'gps'
  },
  voyager1: {
    id: 'satellite_voyager1',
    name: 'Voyager 1',
    agency: 'NASA / JPL',
    type: 'Interstellar Deep Space Probe',
    launchDate: 'September 5, 1977',
    currentLocation: 'Interstellar Space (Beyond the Heliosphere)',
    distanceFromEarth: 'Over 163 AU (24.4 Billion km / 15.2 Billion miles)',
    speedKmH: '61,200 km/h (17.0 km/s relative to Sun)',
    signalRoundTripTime: 'Over 45 hours for radio signals at light speed',
    powerSource: 'Radioisotope Thermoelectric Generators (RTGs)',
    description: 'The farthest human-made object in history. Launched in 1977 to explore Jupiter and Saturn, Voyager 1 made history in August 2012 by becoming the first spacecraft to leave the Sun\'s magnetic bubble (heliosphere) and enter interstellar space.',
    facts: [
      'Voyager 1 carries the famous Golden Record: a 12-inch gold-plated copper phonograph disc containing greetings in 55 languages, Earth sounds, music by Bach and Chuck Berry, and 115 pictures of Earth.',
      'In 1990, at Carl Sagan\'s request, Voyager 1 turned its camera back toward Earth to capture the iconic "Pale Blue Dot" photograph from 6 billion km away.',
      'Even after nearly 50 years, Voyager 1 continues to transmit scientific data from the interstellar medium using a 22-watt transmitter (less power than a refrigerator light bulb)!'
    ],
    parent: 'sun',
    orbitRadius: 490, // Farthest solar system boundary marker
    speed: 0.0003,
    trajectoryAngle: -0.65, // Heading northward out of ecliptic plane
    color: '#e040fb',
    modelType: 'voyager'
  },
  voyager2: {
    id: 'satellite_voyager2',
    name: 'Voyager 2',
    agency: 'NASA / JPL',
    type: 'Interstellar Deep Space Probe',
    launchDate: 'August 20, 1977',
    currentLocation: 'Interstellar Space',
    distanceFromEarth: 'Over 136 AU (20.3 Billion km)',
    speedKmH: '55,300 km/h (15.4 km/s)',
    description: 'The only spacecraft in human history to have visited all four giant outer planets of our solar system: Jupiter (1979), Saturn (1981), Uranus (1986), and Neptune (1989).',
    facts: [
      'Voyager 2 discovered 16 new moons and active geysers on Neptune\'s moon Triton.',
      'Like Voyager 1, it also carries an identical Golden Record for any extraterrestrial civilization that might discover it.',
      'Crossed the heliopause into interstellar space in November 2018.'
    ],
    parent: 'sun',
    orbitRadius: 430,
    speed: 0.00035,
    trajectoryAngle: 0.82,
    color: '#ab47bc',
    modelType: 'voyager'
  },
  parker: {
    id: 'satellite_parker',
    name: 'Parker Solar Probe',
    agency: 'NASA / Johns Hopkins APL',
    type: 'Solar Corona Exploration Spacecraft',
    launchDate: 'August 12, 2018',
    orbitType: 'Extreme Elliptical Heliocentric Orbit',
    closestApproach: '6.16 Million km from Sun\'s photosphere (record-breaking)',
    topSpeed: '692,000 km/h (192 km/s / 0.064% speed of light)',
    heatShield: '11.4 cm (4.5 in) Carbon-Composite Shield enduring 1,370 °C',
    description: 'NASA\'s mission to "touch the Sun". The Parker Solar Probe swoops directly through the blistering solar corona to investigate solar wind acceleration and coronal heating mysteries.',
    facts: [
      'Parker Solar Probe is the fastest human-made object in history, traveling fast enough to fly from New York to Tokyo in under a minute!',
      'While its heat shield reaches 1,400 °C, the scientific instruments behind it stay at a comfortable room temperature of ~29 °C.',
      'It is named after astrophysicist Dr. Eugene Parker, who first predicted the existence of the solar wind in 1958.'
    ],
    parent: 'sun',
    orbitRadius: 28, // Extreme close approach to Sun
    speed: 0.08,
    isElliptical: true,
    color: '#ff7043',
    modelType: 'parker'
  }
};

