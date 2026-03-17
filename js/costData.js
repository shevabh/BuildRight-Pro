/**
 * Construction Cost Database — USA (All 50 States + Major Cities)
 * Based on 45 years of Midwest/SD contracting experience
 * Baseline: National average cost per sq ft (2025-2026 dollars)
 * 
 * Three builder types:
 *   GC   = Full General Contractor (markup 18-25%)
 *   NOGC = Owner hires subs directly (saves GC overhead, adds 5-8% owner management)
 *   OB   = Owner-Builder (sweat equity on some phases, subs for licensed work)
 */

// ─── CONSTRUCTION PHASES (National Baseline $/sqft) ──────────────────────────
// These are the average cost per square foot for each phase, used as the
// starting point before regional multipliers.
const BASE_PHASE_COSTS = {
  sitePrep: {
    name: "Site Preparation & Excavation",
    description: "Clearing, grading, excavation, erosion control, temporary utilities",
    baseCostPerSqft: 4.50,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.15, // can do some clearing themselves
    order: 1
  },
  foundation: {
    name: "Foundation",
    description: "Footings, foundation walls, basement/slab, waterproofing, backfill",
    baseCostPerSqft: 14.00,
    durationWeeks: 3,
    ownerBuilderDiscount: 0.0, // licensed work
    order: 2
  },
  framing: {
    name: "Framing & Structural",
    description: "Floor systems, wall framing, roof trusses/rafters, sheathing, stairs",
    baseCostPerSqft: 18.50,
    durationWeeks: 4,
    ownerBuilderDiscount: 0.10,
    order: 3
  },
  roofing: {
    name: "Roofing",
    description: "Underlayment, shingles/metal, flashing, gutters, ventilation",
    baseCostPerSqft: 5.50,
    durationWeeks: 1,
    ownerBuilderDiscount: 0.05,
    order: 4
  },
  exteriorEnvelope: {
    name: "Exterior Envelope",
    description: "Windows, doors, siding, house wrap, exterior trim, soffit/fascia",
    baseCostPerSqft: 12.00,
    durationWeeks: 3,
    ownerBuilderDiscount: 0.08,
    order: 5
  },
  plumbing: {
    name: "Plumbing (Rough & Finish)",
    description: "Supply lines, drain/waste/vent, fixtures, water heater, gas lines",
    baseCostPerSqft: 11.00,
    durationWeeks: 3,
    ownerBuilderDiscount: 0.0, // licensed work
    order: 6
  },
  electrical: {
    name: "Electrical (Rough & Finish)",
    description: "Panel, wiring, outlets, switches, fixtures, low voltage, smoke/CO",
    baseCostPerSqft: 9.00,
    durationWeeks: 3,
    ownerBuilderDiscount: 0.0, // licensed work
    order: 7
  },
  hvac: {
    name: "HVAC",
    description: "Furnace, AC, ductwork, venting, thermostats, ERV/HRV",
    baseCostPerSqft: 8.50,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.0, // licensed work
    order: 8
  },
  insulation: {
    name: "Insulation",
    description: "Wall insulation, attic insulation, air sealing, vapor barriers",
    baseCostPerSqft: 4.00,
    durationWeeks: 1,
    ownerBuilderDiscount: 0.30, // great sweat equity phase
    order: 9
  },
  drywall: {
    name: "Drywall",
    description: "Hanging, taping, mudding, sanding, texturing",
    baseCostPerSqft: 6.50,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.15,
    order: 10
  },
  interiorFinish: {
    name: "Interior Finish & Trim",
    description: "Doors, casing, baseboard, crown molding, closet systems, railings",
    baseCostPerSqft: 8.00,
    durationWeeks: 3,
    ownerBuilderDiscount: 0.20,
    order: 11
  },
  cabinetryCountertops: {
    name: "Cabinetry & Countertops",
    description: "Kitchen cabinets, bath vanities, countertops, hardware",
    baseCostPerSqft: 8.50,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.05,
    order: 12
  },
  flooring: {
    name: "Flooring",
    description: "Hardwood, tile, LVP, carpet, underlayment, transitions",
    baseCostPerSqft: 7.00,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.20,
    order: 13
  },
  painting: {
    name: "Painting & Finishes",
    description: "Interior paint, exterior paint, staining, specialty finishes",
    baseCostPerSqft: 4.50,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.40, // best sweat equity phase
    order: 14
  },
  landscaping: {
    name: "Landscaping & Exterior",
    description: "Grading, seeding/sod, driveway, sidewalks, deck/patio, fencing",
    baseCostPerSqft: 6.00,
    durationWeeks: 2,
    ownerBuilderDiscount: 0.25,
    order: 15
  },
  permits: {
    name: "Permits, Plans & Fees",
    description: "Building permits, impact fees, architectural plans, surveys, inspections",
    baseCostPerSqft: 3.50,
    durationWeeks: 0,
    ownerBuilderDiscount: 0.0,
    order: 16
  },
  cleanup: {
    name: "Final Cleanup & Punch List",
    description: "Construction cleanup, final inspections, punch list items, CO",
    baseCostPerSqft: 1.50,
    durationWeeks: 1,
    ownerBuilderDiscount: 0.50,
    order: 17
  }
};

// ─── GC / BUILDER TYPE MULTIPLIERS ───────────────────────────────────────────
const BUILDER_TYPE_MULTIPLIERS = {
  gc: {
    name: "General Contractor (GC)",
    description: "Full-service GC manages everything. You pay GC overhead + profit markup.",
    markup: 1.22,        // 22% GC markup average
    managementFee: 0,
    icon: "👷"
  },
  noGc: {
    name: "Without GC (Hire Subs Directly)",
    description: "You act as project manager, hiring licensed subcontractors directly. Saves GC markup but requires your time and knowledge.",
    markup: 1.0,
    managementFee: 0.06, // 6% owner management/coordination overhead
    icon: "📋"
  },
  ownerBuilder: {
    name: "Owner-Builder",
    description: "You do some work yourself (painting, insulation, landscaping, cleanup) and hire subs for licensed/skilled trades. Maximum savings but most time and effort.",
    markup: 1.0,
    managementFee: 0.04,
    icon: "🔨"
  }
};

// ─── QUALITY TIER MULTIPLIERS ────────────────────────────────────────────────
const QUALITY_TIERS = {
  budget: { name: "Budget / Economy", multiplier: 0.80, description: "Builder-grade materials, basic finishes" },
  standard: { name: "Standard", multiplier: 1.00, description: "Mid-range materials, typical new construction" },
  premium: { name: "Premium / Custom", multiplier: 1.35, description: "Upgraded materials, custom features" },
  luxury: { name: "Luxury", multiplier: 1.75, description: "High-end everything, architect-designed" }
};

// ─── HOME TYPE MULTIPLIERS ───────────────────────────────────────────────────
const HOME_TYPES = {
  ranch: { name: "Ranch / Single Story", multiplier: 1.0, description: "Slab or basement, simple roof" },
  twoStory: { name: "Two Story", multiplier: 0.95, description: "Smaller footprint, shared roof/foundation" },
  splitLevel: { name: "Split Level / Bi-Level", multiplier: 1.02, description: "Multiple levels, more framing complexity" },
  cape: { name: "Cape Cod / 1.5 Story", multiplier: 0.97, description: "Finished upper, dormers" },
  barndominium: { name: "Barndominium / Pole Barn", multiplier: 0.72, description: "Steel frame, open plan, economical" },
  modular: { name: "Modular / Prefab", multiplier: 0.82, description: "Factory-built sections, assembled on-site" },
  duplex: { name: "Duplex (2 Units)", multiplier: 1.08, description: "Two attached living units, shared wall, great rental income" },
  triplex: { name: "Triplex (3 Units)", multiplier: 1.12, description: "Three attached units, shared walls, strong investment property" },
  quadplex: { name: "Quadplex (4 Units)", multiplier: 1.15, description: "Four units, max residential financing, best cash flow" }
};

// ─── BASEMENT / FOUNDATION OPTIONS ───────────────────────────────────────────
const FOUNDATION_TYPES = {
  slab: { name: "Slab on Grade", adder: 0, description: "Concrete slab, no below-grade space" },
  crawlspace: { name: "Crawl Space", adder: 3.50, description: "Short foundation walls, access space" },
  basement: { name: "Full Basement (Unfinished)", adder: 12.00, description: "Full-height below grade, unfinished" },
  basementFinished: { name: "Full Basement (Finished)", adder: 25.00, description: "Full-height below grade, finished living space" }
};

// ─── STATE & CITY COST MULTIPLIERS ───────────────────────────────────────────
// Multiplier of 1.00 = national average baseline
// Factors: labor rates, material transport, permit costs, code requirements, 
// cost of living, demand, weather impacts, union vs non-union
const REGIONS = {
  AL: {
    name: "Alabama", multiplier: 0.82, permitMultiplier: 0.75,
    cities: {
      birmingham: { name: "Birmingham", multiplier: 0.85 },
      huntsville: { name: "Huntsville", multiplier: 0.87 },
      mobile: { name: "Mobile", multiplier: 0.80 },
      montgomery: { name: "Montgomery", multiplier: 0.81 },
      tuscaloosa: { name: "Tuscaloosa", multiplier: 0.83 }
    }
  },
  AK: {
    name: "Alaska", multiplier: 1.35, permitMultiplier: 1.20,
    cities: {
      anchorage: { name: "Anchorage", multiplier: 1.32 },
      fairbanks: { name: "Fairbanks", multiplier: 1.42 },
      juneau: { name: "Juneau", multiplier: 1.48 }
    }
  },
  AZ: {
    name: "Arizona", multiplier: 0.95, permitMultiplier: 1.05,
    cities: {
      phoenix: { name: "Phoenix", multiplier: 0.98 },
      tucson: { name: "Tucson", multiplier: 0.90 },
      scottsdale: { name: "Scottsdale", multiplier: 1.08 },
      mesa: { name: "Mesa", multiplier: 0.95 },
      chandler: { name: "Chandler", multiplier: 0.97 },
      flagstaff: { name: "Flagstaff", multiplier: 1.02 }
    }
  },
  AR: {
    name: "Arkansas", multiplier: 0.78, permitMultiplier: 0.70,
    cities: {
      littleRock: { name: "Little Rock", multiplier: 0.82 },
      fayetteville: { name: "Fayetteville", multiplier: 0.85 },
      fortSmith: { name: "Fort Smith", multiplier: 0.76 },
      bentonville: { name: "Bentonville", multiplier: 0.88 }
    }
  },
  CA: {
    name: "California", multiplier: 1.38, permitMultiplier: 1.45,
    cities: {
      losAngeles: { name: "Los Angeles", multiplier: 1.42 },
      sanFrancisco: { name: "San Francisco", multiplier: 1.62 },
      sanDiego: { name: "San Diego", multiplier: 1.35 },
      sacramento: { name: "Sacramento", multiplier: 1.28 },
      sanJose: { name: "San Jose", multiplier: 1.55 },
      oakland: { name: "Oakland", multiplier: 1.48 },
      fresno: { name: "Fresno", multiplier: 1.12 },
      bakersfield: { name: "Bakersfield", multiplier: 1.08 },
      riverside: { name: "Riverside", multiplier: 1.22 },
      irvine: { name: "Irvine", multiplier: 1.40 }
    }
  },
  CO: {
    name: "Colorado", multiplier: 1.08, permitMultiplier: 1.10,
    cities: {
      denver: { name: "Denver", multiplier: 1.15 },
      coloradoSprings: { name: "Colorado Springs", multiplier: 1.02 },
      boulder: { name: "Boulder", multiplier: 1.25 },
      fortCollins: { name: "Fort Collins", multiplier: 1.08 },
      aurora: { name: "Aurora", multiplier: 1.10 },
      pueblo: { name: "Pueblo", multiplier: 0.92 }
    }
  },
  CT: {
    name: "Connecticut", multiplier: 1.25, permitMultiplier: 1.30,
    cities: {
      hartford: { name: "Hartford", multiplier: 1.22 },
      newHaven: { name: "New Haven", multiplier: 1.25 },
      stamford: { name: "Stamford", multiplier: 1.42 },
      bridgeport: { name: "Bridgeport", multiplier: 1.20 },
      greenwich: { name: "Greenwich", multiplier: 1.55 }
    }
  },
  DE: {
    name: "Delaware", multiplier: 1.05, permitMultiplier: 1.00,
    cities: {
      wilmington: { name: "Wilmington", multiplier: 1.08 },
      dover: { name: "Dover", multiplier: 1.00 },
      newark: { name: "Newark", multiplier: 1.05 }
    }
  },
  FL: {
    name: "Florida", multiplier: 1.02, permitMultiplier: 1.15,
    cities: {
      miami: { name: "Miami", multiplier: 1.18 },
      orlando: { name: "Orlando", multiplier: 1.00 },
      tampa: { name: "Tampa", multiplier: 1.02 },
      jacksonville: { name: "Jacksonville", multiplier: 0.95 },
      fortLauderdale: { name: "Fort Lauderdale", multiplier: 1.15 },
      naples: { name: "Naples", multiplier: 1.22 },
      stPetersburg: { name: "St. Petersburg", multiplier: 1.02 },
      sarasota: { name: "Sarasota", multiplier: 1.08 },
      tallahassee: { name: "Tallahassee", multiplier: 0.92 },
      pensacola: { name: "Pensacola", multiplier: 0.88 }
    }
  },
  GA: {
    name: "Georgia", multiplier: 0.88, permitMultiplier: 0.85,
    cities: {
      atlanta: { name: "Atlanta", multiplier: 0.98 },
      savannah: { name: "Savannah", multiplier: 0.90 },
      augusta: { name: "Augusta", multiplier: 0.82 },
      athens: { name: "Athens", multiplier: 0.88 },
      columbus: { name: "Columbus", multiplier: 0.80 }
    }
  },
  HI: {
    name: "Hawaii", multiplier: 1.55, permitMultiplier: 1.40,
    cities: {
      honolulu: { name: "Honolulu", multiplier: 1.58 },
      maui: { name: "Maui (Kahului)", multiplier: 1.62 },
      kona: { name: "Kona", multiplier: 1.55 },
      hilo: { name: "Hilo", multiplier: 1.48 }
    }
  },
  ID: {
    name: "Idaho", multiplier: 0.92, permitMultiplier: 0.85,
    cities: {
      boise: { name: "Boise", multiplier: 0.98 },
      meridian: { name: "Meridian", multiplier: 0.97 },
      nampa: { name: "Nampa", multiplier: 0.90 },
      idahoFalls: { name: "Idaho Falls", multiplier: 0.88 },
      coeurDAlene: { name: "Coeur d'Alene", multiplier: 1.02 }
    }
  },
  IL: {
    name: "Illinois", multiplier: 1.05, permitMultiplier: 1.10,
    cities: {
      chicago: { name: "Chicago", multiplier: 1.22 },
      naperville: { name: "Naperville", multiplier: 1.18 },
      springfield: { name: "Springfield", multiplier: 0.88 },
      rockford: { name: "Rockford", multiplier: 0.92 },
      peoria: { name: "Peoria", multiplier: 0.90 },
      champaign: { name: "Champaign", multiplier: 0.88 }
    }
  },
  IN: {
    name: "Indiana", multiplier: 0.88, permitMultiplier: 0.82,
    cities: {
      indianapolis: { name: "Indianapolis", multiplier: 0.92 },
      fortWayne: { name: "Fort Wayne", multiplier: 0.85 },
      evansville: { name: "Evansville", multiplier: 0.82 },
      southBend: { name: "South Bend", multiplier: 0.85 },
      carmel: { name: "Carmel", multiplier: 0.98 }
    }
  },
  IA: {
    name: "Iowa", multiplier: 0.87, permitMultiplier: 0.80,
    cities: {
      desMoines: { name: "Des Moines", multiplier: 0.90 },
      cedarRapids: { name: "Cedar Rapids", multiplier: 0.85 },
      davenport: { name: "Davenport", multiplier: 0.85 },
      iowaCity: { name: "Iowa City", multiplier: 0.92 },
      siouxCity: { name: "Sioux City", multiplier: 0.83 }
    }
  },
  KS: {
    name: "Kansas", multiplier: 0.85, permitMultiplier: 0.78,
    cities: {
      wichita: { name: "Wichita", multiplier: 0.85 },
      overlandPark: { name: "Overland Park", multiplier: 0.95 },
      kansasCity: { name: "Kansas City KS", multiplier: 0.90 },
      topeka: { name: "Topeka", multiplier: 0.82 },
      lawrence: { name: "Lawrence", multiplier: 0.88 }
    }
  },
  KY: {
    name: "Kentucky", multiplier: 0.83, permitMultiplier: 0.78,
    cities: {
      louisville: { name: "Louisville", multiplier: 0.88 },
      lexington: { name: "Lexington", multiplier: 0.86 },
      bowlingGreen: { name: "Bowling Green", multiplier: 0.80 },
      covington: { name: "Covington", multiplier: 0.90 }
    }
  },
  LA: {
    name: "Louisiana", multiplier: 0.85, permitMultiplier: 0.80,
    cities: {
      newOrleans: { name: "New Orleans", multiplier: 0.95 },
      batonRouge: { name: "Baton Rouge", multiplier: 0.85 },
      shreveport: { name: "Shreveport", multiplier: 0.80 },
      lafayette: { name: "Lafayette", multiplier: 0.82 }
    }
  },
  ME: {
    name: "Maine", multiplier: 1.05, permitMultiplier: 0.95,
    cities: {
      portland: { name: "Portland", multiplier: 1.12 },
      bangor: { name: "Bangor", multiplier: 0.98 },
      lewiston: { name: "Lewiston", multiplier: 1.00 }
    }
  },
  MD: {
    name: "Maryland", multiplier: 1.10, permitMultiplier: 1.15,
    cities: {
      baltimore: { name: "Baltimore", multiplier: 1.08 },
      bethesda: { name: "Bethesda", multiplier: 1.35 },
      annapolis: { name: "Annapolis", multiplier: 1.18 },
      rockville: { name: "Rockville", multiplier: 1.25 },
      frederick: { name: "Frederick", multiplier: 1.05 }
    }
  },
  MA: {
    name: "Massachusetts", multiplier: 1.30, permitMultiplier: 1.35,
    cities: {
      boston: { name: "Boston", multiplier: 1.42 },
      cambridge: { name: "Cambridge", multiplier: 1.45 },
      worcester: { name: "Worcester", multiplier: 1.18 },
      springfield: { name: "Springfield", multiplier: 1.08 },
      capeCod: { name: "Cape Cod", multiplier: 1.32 },
      nantucket: { name: "Nantucket", multiplier: 1.65 }
    }
  },
  MI: {
    name: "Michigan", multiplier: 0.92, permitMultiplier: 0.88,
    cities: {
      detroit: { name: "Detroit", multiplier: 0.95 },
      grandRapids: { name: "Grand Rapids", multiplier: 0.92 },
      annArbor: { name: "Ann Arbor", multiplier: 1.05 },
      traverse: { name: "Traverse City", multiplier: 1.02 },
      lansing: { name: "Lansing", multiplier: 0.88 },
      kalamazoo: { name: "Kalamazoo", multiplier: 0.88 }
    }
  },
  MN: {
    name: "Minnesota", multiplier: 1.02, permitMultiplier: 0.95,
    cities: {
      minneapolis: { name: "Minneapolis", multiplier: 1.10 },
      stPaul: { name: "St. Paul", multiplier: 1.08 },
      rochester: { name: "Rochester", multiplier: 1.00 },
      duluth: { name: "Duluth", multiplier: 0.95 },
      bloomington: { name: "Bloomington", multiplier: 1.08 }
    }
  },
  MS: {
    name: "Mississippi", multiplier: 0.75, permitMultiplier: 0.68,
    cities: {
      jackson: { name: "Jackson", multiplier: 0.78 },
      gulfport: { name: "Gulfport", multiplier: 0.77 },
      hattiesburg: { name: "Hattiesburg", multiplier: 0.73 },
      tupelo: { name: "Tupelo", multiplier: 0.72 }
    }
  },
  MO: {
    name: "Missouri", multiplier: 0.88, permitMultiplier: 0.82,
    cities: {
      kansasCity: { name: "Kansas City MO", multiplier: 0.92 },
      stLouis: { name: "St. Louis", multiplier: 0.95 },
      springfield: { name: "Springfield", multiplier: 0.82 },
      columbia: { name: "Columbia", multiplier: 0.85 },
      branson: { name: "Branson", multiplier: 0.80 }
    }
  },
  MT: {
    name: "Montana", multiplier: 0.98, permitMultiplier: 0.85,
    cities: {
      billings: { name: "Billings", multiplier: 0.95 },
      missoula: { name: "Missoula", multiplier: 1.02 },
      bozeman: { name: "Bozeman", multiplier: 1.15 },
      helena: { name: "Helena", multiplier: 0.95 },
      kalispell: { name: "Kalispell", multiplier: 1.05 }
    }
  },
  NE: {
    name: "Nebraska", multiplier: 0.86, permitMultiplier: 0.80,
    cities: {
      omaha: { name: "Omaha", multiplier: 0.90 },
      lincoln: { name: "Lincoln", multiplier: 0.87 },
      grandIsland: { name: "Grand Island", multiplier: 0.82 }
    }
  },
  NV: {
    name: "Nevada", multiplier: 1.05, permitMultiplier: 1.10,
    cities: {
      lasVegas: { name: "Las Vegas", multiplier: 1.08 },
      reno: { name: "Reno", multiplier: 1.05 },
      henderson: { name: "Henderson", multiplier: 1.08 },
      carson: { name: "Carson City", multiplier: 1.00 }
    }
  },
  NH: {
    name: "New Hampshire", multiplier: 1.12, permitMultiplier: 1.00,
    cities: {
      manchester: { name: "Manchester", multiplier: 1.10 },
      nashua: { name: "Nashua", multiplier: 1.15 },
      concord: { name: "Concord", multiplier: 1.08 },
      portsmouth: { name: "Portsmouth", multiplier: 1.22 }
    }
  },
  NJ: {
    name: "New Jersey", multiplier: 1.28, permitMultiplier: 1.35,
    cities: {
      newark: { name: "Newark", multiplier: 1.25 },
      jerseyCity: { name: "Jersey City", multiplier: 1.38 },
      princeton: { name: "Princeton", multiplier: 1.42 },
      trenton: { name: "Trenton", multiplier: 1.15 },
      morristown: { name: "Morristown", multiplier: 1.35 }
    }
  },
  NM: {
    name: "New Mexico", multiplier: 0.88, permitMultiplier: 0.85,
    cities: {
      albuquerque: { name: "Albuquerque", multiplier: 0.90 },
      santaFe: { name: "Santa Fe", multiplier: 1.08 },
      lasCruces: { name: "Las Cruces", multiplier: 0.82 }
    }
  },
  NY: {
    name: "New York", multiplier: 1.32, permitMultiplier: 1.40,
    cities: {
      nyc: { name: "New York City", multiplier: 1.72 },
      buffalo: { name: "Buffalo", multiplier: 1.05 },
      rochester: { name: "Rochester", multiplier: 1.02 },
      albany: { name: "Albany", multiplier: 1.08 },
      syracuse: { name: "Syracuse", multiplier: 1.00 },
      westchester: { name: "Westchester County", multiplier: 1.55 },
      longIsland: { name: "Long Island", multiplier: 1.48 },
      ithaca: { name: "Ithaca", multiplier: 1.08 }
    }
  },
  NC: {
    name: "North Carolina", multiplier: 0.87, permitMultiplier: 0.85,
    cities: {
      charlotte: { name: "Charlotte", multiplier: 0.92 },
      raleigh: { name: "Raleigh", multiplier: 0.93 },
      durham: { name: "Durham", multiplier: 0.90 },
      asheville: { name: "Asheville", multiplier: 0.95 },
      wilmington: { name: "Wilmington", multiplier: 0.88 },
      greensboro: { name: "Greensboro", multiplier: 0.85 }
    }
  },
  ND: {
    name: "North Dakota", multiplier: 0.90, permitMultiplier: 0.78,
    cities: {
      fargo: { name: "Fargo", multiplier: 0.92 },
      bismarck: { name: "Bismarck", multiplier: 0.88 },
      grandForks: { name: "Grand Forks", multiplier: 0.87 },
      minot: { name: "Minot", multiplier: 0.88 },
      williston: { name: "Williston", multiplier: 0.98 }
    }
  },
  OH: {
    name: "Ohio", multiplier: 0.90, permitMultiplier: 0.88,
    cities: {
      columbus: { name: "Columbus", multiplier: 0.95 },
      cleveland: { name: "Cleveland", multiplier: 0.92 },
      cincinnati: { name: "Cincinnati", multiplier: 0.92 },
      dayton: { name: "Dayton", multiplier: 0.85 },
      akron: { name: "Akron", multiplier: 0.88 },
      toledo: { name: "Toledo", multiplier: 0.85 }
    }
  },
  OK: {
    name: "Oklahoma", multiplier: 0.82, permitMultiplier: 0.75,
    cities: {
      oklahomaCity: { name: "Oklahoma City", multiplier: 0.85 },
      tulsa: { name: "Tulsa", multiplier: 0.83 },
      norman: { name: "Norman", multiplier: 0.84 },
      edmond: { name: "Edmond", multiplier: 0.88 }
    }
  },
  OR: {
    name: "Oregon", multiplier: 1.12, permitMultiplier: 1.15,
    cities: {
      portland: { name: "Portland", multiplier: 1.18 },
      eugene: { name: "Eugene", multiplier: 1.08 },
      bend: { name: "Bend", multiplier: 1.15 },
      salem: { name: "Salem", multiplier: 1.05 },
      medford: { name: "Medford", multiplier: 1.02 }
    }
  },
  PA: {
    name: "Pennsylvania", multiplier: 1.08, permitMultiplier: 1.05,
    cities: {
      philadelphia: { name: "Philadelphia", multiplier: 1.18 },
      pittsburgh: { name: "Pittsburgh", multiplier: 1.05 },
      allentown: { name: "Allentown", multiplier: 1.02 },
      harrisburg: { name: "Harrisburg", multiplier: 0.98 },
      erie: { name: "Erie", multiplier: 0.92 }
    }
  },
  RI: {
    name: "Rhode Island", multiplier: 1.18, permitMultiplier: 1.15,
    cities: {
      providence: { name: "Providence", multiplier: 1.20 },
      newport: { name: "Newport", multiplier: 1.32 },
      warwick: { name: "Warwick", multiplier: 1.15 }
    }
  },
  SC: {
    name: "South Carolina", multiplier: 0.83, permitMultiplier: 0.80,
    cities: {
      charleston: { name: "Charleston", multiplier: 0.95 },
      columbia: { name: "Columbia", multiplier: 0.82 },
      greenville: { name: "Greenville", multiplier: 0.85 },
      myrtleBeach: { name: "Myrtle Beach", multiplier: 0.88 },
      hiltonHead: { name: "Hilton Head", multiplier: 1.05 }
    }
  },
  SD: {
    name: "South Dakota", multiplier: 0.85, permitMultiplier: 0.72,
    cities: {
      siouxFalls: { name: "Sioux Falls", multiplier: 0.88 },
      rapidCity: { name: "Rapid City", multiplier: 0.85 },
      aberdeen: { name: "Aberdeen", multiplier: 0.80 },
      brookings: { name: "Brookings", multiplier: 0.82 },
      mitchell: { name: "Mitchell", multiplier: 0.78 },
      watertown: { name: "Watertown", multiplier: 0.79 },
      pierre: { name: "Pierre", multiplier: 0.82 },
      yankton: { name: "Yankton", multiplier: 0.80 }
    }
  },
  TN: {
    name: "Tennessee", multiplier: 0.85, permitMultiplier: 0.82,
    cities: {
      nashville: { name: "Nashville", multiplier: 0.95 },
      memphis: { name: "Memphis", multiplier: 0.85 },
      knoxville: { name: "Knoxville", multiplier: 0.83 },
      chattanooga: { name: "Chattanooga", multiplier: 0.82 },
      franklin: { name: "Franklin", multiplier: 1.02 }
    }
  },
  TX: {
    name: "Texas", multiplier: 0.90, permitMultiplier: 0.88,
    cities: {
      houston: { name: "Houston", multiplier: 0.92 },
      dallas: { name: "Dallas", multiplier: 0.95 },
      austin: { name: "Austin", multiplier: 1.02 },
      sanAntonio: { name: "San Antonio", multiplier: 0.85 },
      fortWorth: { name: "Fort Worth", multiplier: 0.92 },
      elPaso: { name: "El Paso", multiplier: 0.82 },
      plano: { name: "Plano", multiplier: 0.98 },
      frisco: { name: "Frisco", multiplier: 1.00 },
      mckinney: { name: "McKinney", multiplier: 0.97 }
    }
  },
  UT: {
    name: "Utah", multiplier: 0.95, permitMultiplier: 0.90,
    cities: {
      saltLakeCity: { name: "Salt Lake City", multiplier: 1.00 },
      provo: { name: "Provo", multiplier: 0.93 },
      ogden: { name: "Ogden", multiplier: 0.90 },
      stGeorge: { name: "St. George", multiplier: 0.95 },
      parkCity: { name: "Park City", multiplier: 1.30 }
    }
  },
  VT: {
    name: "Vermont", multiplier: 1.10, permitMultiplier: 1.00,
    cities: {
      burlington: { name: "Burlington", multiplier: 1.15 },
      montpelier: { name: "Montpelier", multiplier: 1.08 },
      stowe: { name: "Stowe", multiplier: 1.25 }
    }
  },
  VA: {
    name: "Virginia", multiplier: 1.02, permitMultiplier: 1.05,
    cities: {
      virginiaBeach: { name: "Virginia Beach", multiplier: 1.00 },
      richmond: { name: "Richmond", multiplier: 1.00 },
      arlington: { name: "Arlington", multiplier: 1.35 },
      alexandria: { name: "Alexandria", multiplier: 1.32 },
      norfolk: { name: "Norfolk", multiplier: 0.95 },
      roanoke: { name: "Roanoke", multiplier: 0.88 },
      charlottesville: { name: "Charlottesville", multiplier: 1.05 }
    }
  },
  WA: {
    name: "Washington", multiplier: 1.15, permitMultiplier: 1.20,
    cities: {
      seattle: { name: "Seattle", multiplier: 1.32 },
      tacoma: { name: "Tacoma", multiplier: 1.12 },
      spokane: { name: "Spokane", multiplier: 1.00 },
      bellevue: { name: "Bellevue", multiplier: 1.38 },
      olympia: { name: "Olympia", multiplier: 1.10 },
      vancouver: { name: "Vancouver WA", multiplier: 1.08 }
    }
  },
  WV: {
    name: "West Virginia", multiplier: 0.80, permitMultiplier: 0.72,
    cities: {
      charleston: { name: "Charleston", multiplier: 0.82 },
      morgantown: { name: "Morgantown", multiplier: 0.85 },
      huntington: { name: "Huntington", multiplier: 0.78 }
    }
  },
  WI: {
    name: "Wisconsin", multiplier: 0.95, permitMultiplier: 0.90,
    cities: {
      milwaukee: { name: "Milwaukee", multiplier: 1.00 },
      madison: { name: "Madison", multiplier: 1.02 },
      greenBay: { name: "Green Bay", multiplier: 0.92 },
      racine: { name: "Racine", multiplier: 0.95 },
      eauClaire: { name: "Eau Claire", multiplier: 0.88 }
    }
  },
  WY: {
    name: "Wyoming", multiplier: 0.92, permitMultiplier: 0.75,
    cities: {
      cheyenne: { name: "Cheyenne", multiplier: 0.90 },
      casper: { name: "Casper", multiplier: 0.90 },
      jackson: { name: "Jackson Hole", multiplier: 1.40 },
      laramie: { name: "Laramie", multiplier: 0.88 }
    }
  },
  DC: {
    name: "Washington D.C.", multiplier: 1.35, permitMultiplier: 1.45,
    cities: {
      dc: { name: "Washington D.C.", multiplier: 1.35 }
    }
  }
};

// ─── GARAGE OPTIONS ──────────────────────────────────────────────────────────
const GARAGE_OPTIONS = {
  none: { name: "No Garage", sqft: 0, cost: 0 },
  one: { name: "1-Car Attached", sqft: 280, cost: 18000 },
  two: { name: "2-Car Attached", sqft: 480, cost: 28000 },
  three: { name: "3-Car Attached", sqft: 720, cost: 42000 },
  detachedTwo: { name: "2-Car Detached", sqft: 576, cost: 35000 },
  detachedThree: { name: "3-Car Detached", sqft: 864, cost: 52000 }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CostData = {
    BASE_PHASE_COSTS,
    BUILDER_TYPE_MULTIPLIERS,
    QUALITY_TIERS,
    HOME_TYPES,
    FOUNDATION_TYPES,
    REGIONS,
    GARAGE_OPTIONS
  };
}
