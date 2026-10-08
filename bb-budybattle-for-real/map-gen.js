(function (root) {
  const MAP_HALF = 400;
  const COAST_RADIUS = 360;
  const CONE_RADIUS = 160;
  const CONE_HEIGHT = 70;
  const CRATER_RADIUS = 18;
  const WALL_THICKNESS = 0.6;
  const DOOR_WIDTH = 2.6;
  const DOOR_HEIGHT = 2.8;
  const GRID_CELL = 20;
  const STORY_H = 4.2;
  const SLAB_T = 0.3;
  const STAIR_LEN = 7;
  const LANE_W = 2;
  const STEP_UP = 0.6;
  const PLAYER_HEIGHT = 1.8;

  const MAP_IDS = ["island", "volcano", "hardVolcano"];

  const MAP_LABELS = {
    island: "Lava Island",
    volcano: "Volcano",
    hardVolcano: "Hard Volcano"
  };

  const ISLAND_LAVA_SPREAD = 280;
  const ISLAND_SAFE_RADIUS = 52;

  const HAZARDS = {
    island: { kind: "islandLava", graceMs: 60000, stepMs: 45000, fillPerStep: 0.11 },
    volcano: { kind: "lava", graceMs: 45000, stepMs: 30000, stepAmount: 18, startRadius: 20 },
    hardVolcano: { kind: "lava", graceMs: 30000, stepMs: 25000, stepAmount: 22, startRadius: 22, rocks: true }
  };

  function islandSafeZone(seed) {
    const angle = hash2(seed, 7, 19) * Math.PI * 2;
    const dist = 302 + hash2(seed, 11, 23) * 38;
    return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist, r: ISLAND_SAFE_RADIUS };
  }

  function pointInIslandSafe(x, z, hazard) {
    if (!hazard || hazard.kind !== "islandLava") return false;
    return Math.hypot(x - hazard.safeX, z - hazard.safeZ) <= hazard.safeR;
  }

  function pointInIslandLava(x, z, hazard) {
    if (!hazard || hazard.kind !== "islandLava" || !(hazard.fillT > 0)) return false;
    if (pointInIslandSafe(x, z, hazard)) return false;
    if (hazard.fillT >= 1) return true;
    const distSafe = Math.hypot(x - hazard.safeX, z - hazard.safeZ);
    return distSafe >= hazard.safeR + (1 - hazard.fillT) * ISLAND_LAVA_SPREAD;
  }

  const ROCK_WARNING_MS = 2000;
  const ROCK_RADIUS = 4;
  const ROCK_DAMAGE = 75;
  const ROCK_STUN_MS = 2000;
  const WATER_DPS = 5;
  const LAVA_DPS = 10;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2(seed, x, z) {
    let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function valueNoise(seed, x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);
    const a = hash2(seed, ix, iz);
    const b = hash2(seed, ix + 1, iz);
    const c = hash2(seed, ix, iz + 1);
    const d = hash2(seed, ix + 1, iz + 1);
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sz;
  }

  function fbm(seed, x, z) {
    return valueNoise(seed, x / 90, z / 90) * 0.6
      + valueNoise(seed + 17, x / 35, z / 35) * 0.3
      + valueNoise(seed + 41, x / 12, z / 12) * 0.1;
  }

  function coastRadius(seed, angle) {
    return COAST_RADIUS
      + (valueNoise(seed + 5, Math.cos(angle) * 3 + 10, Math.sin(angle) * 3 + 10) - 0.5) * 70;
  }

  function terrainHeight(map, x, z) {
    const r = Math.hypot(x, z);
    const coast = coastRadius(map.seed, Math.atan2(z, x));
    const inland = (coast - r) / coast;
    if (inland <= 0) return Math.max(-8, inland * 60);
    const hills = (fbm(map.seed, x, z) - 0.5) * 3;
    if (map.id === "island") {
      return 9 * Math.pow(inland, 0.75) + hills * Math.min(1, inland * 4);
    }
    let h = 3 * Math.pow(inland, 0.6) + hills * Math.min(1, inland * 4);
    if (r < CONE_RADIUS) {
      const t = 1 - r / CONE_RADIUS;
      h += CONE_HEIGHT * Math.pow(t, 1.6);
      if (r < CRATER_RADIUS) h -= (1 - r / CRATER_RADIUS) * 12;
    }
    return h;
  }

  function hazardAt(mapId, elapsedMs, seed = 0) {
    const hazard = HAZARDS[mapId];
    const steps = elapsedMs < hazard.graceMs ? 0 : Math.floor((elapsedMs - hazard.graceMs) / hazard.stepMs) + 1;
    const nextStepMs = elapsedMs < hazard.graceMs
      ? hazard.graceMs - elapsedMs
      : hazard.stepMs - ((elapsedMs - hazard.graceMs) % hazard.stepMs);
    if (hazard.kind === "islandLava") {
      const fillT = Math.min(1, steps * hazard.fillPerStep);
      const safe = islandSafeZone(seed);
      return {
        kind: "islandLava",
        waterLevel: 0,
        lavaRadius: 0,
        fillT,
        safeX: safe.x,
        safeZ: safe.z,
        safeR: safe.r,
        steps,
        nextStepMs
      };
    }
    return {
      kind: "lava",
      waterLevel: 0,
      lavaRadius: steps ? hazard.startRadius + (steps - 1) * hazard.stepAmount : 0,
      steps,
      nextStepMs
    };
  }

  function overlaps(list, x, z, radius) {
    return list.some((item) => Math.hypot(item.x - x, item.z - z) < item.radius + radius);
  }

  function addBuildingWalls(walls, b) {
    const t = WALL_THICKNESS;
    const halfW = b.w / 2;
    const halfD = b.d / 2;
    const bottom = b.floor - 3;
    const height = b.h + 3;
    const side = (cx, cz, w, d, hasDoor, alongX) => {
      if (!hasDoor) {
        walls.push({ x: cx, z: cz, w, d, y: bottom, h: height, b: b.id });
        return;
      }
      const length = alongX ? w : d;
      const piece = (length - DOOR_WIDTH) / 2;
      const offset = DOOR_WIDTH / 2 + piece / 2;
      const lintelY = b.floor + DOOR_HEIGHT;
      const lintelH = b.floor + b.h - lintelY;
      if (alongX) {
        walls.push({ x: cx - offset, z: cz, w: piece, d, y: bottom, h: height, b: b.id });
        walls.push({ x: cx + offset, z: cz, w: piece, d, y: bottom, h: height, b: b.id });
        walls.push({ x: cx, z: cz, w: DOOR_WIDTH, d, y: lintelY, h: lintelH, b: b.id });
      } else {
        walls.push({ x: cx, z: cz - offset, w, d: piece, y: bottom, h: height, b: b.id });
        walls.push({ x: cx, z: cz + offset, w, d: piece, y: bottom, h: height, b: b.id });
        walls.push({ x: cx, z: cz, w, d: DOOR_WIDTH, y: lintelY, h: lintelH, b: b.id });
      }
    };
    side(b.x, b.z - halfD + t / 2, b.w, t, b.door === 0, true);
    side(b.x, b.z + halfD - t / 2, b.w, t, b.door === 1, true);
    side(b.x - halfW + t / 2, b.z, t, b.d, b.door === 2, false);
    side(b.x + halfW - t / 2, b.z, t, b.d, b.door === 3, false);
  }

  const BUILDING_TYPES = [
    { type: "house", w: [14, 20], d: [14, 20], stories: [2, 3], weight: 6 },
    { type: "warehouse", w: [26, 34], d: [20, 28], stories: [2, 2], weight: 2 },
    { type: "tower", w: [14, 18], d: [14, 18], stories: [4, 6], weight: 2 },
    { type: "shop", w: [18, 24], d: [14, 18], stories: [2, 3], weight: 3 }
  ];

  function inRect(r, x, z, pad = 0) {
    return Math.abs(x - r.x) <= r.w / 2 + pad && Math.abs(z - r.z) <= r.d / 2 + pad;
  }

  function subtractRect(a, h) {
    const ax0 = a.x - a.w / 2;
    const ax1 = a.x + a.w / 2;
    const az0 = a.z - a.d / 2;
    const az1 = a.z + a.d / 2;
    const hx0 = Math.max(ax0, h.x - h.w / 2);
    const hx1 = Math.min(ax1, h.x + h.w / 2);
    const hz0 = Math.max(az0, h.z - h.d / 2);
    const hz1 = Math.min(az1, h.z + h.d / 2);
    const out = [];
    const push = (x0, x1, z0, z1) => {
      if (x1 - x0 > 0.01 && z1 - z0 > 0.01) out.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 });
    };
    push(ax0, ax1, az0, hz0);
    push(ax0, ax1, hz1, az1);
    push(ax0, hx0, hz0, hz1);
    push(hx1, ax1, hz0, hz1);
    return out;
  }

  function rampRect(r) {
    return r.axis === "x"
      ? { x: r.cx, z: r.cz, w: r.len, d: r.wid }
      : { x: r.cx, z: r.cz, w: r.wid, d: r.len };
  }

  function rampSurface(r, x, z) {
    const along = r.axis === "x" ? x - r.cx : z - r.cz;
    let u = Math.max(0, Math.min(1, (along + r.len / 2) / r.len));
    if (r.dir < 0) u = 1 - u;
    return r.y0 + u * (r.y1 - r.y0);
  }

  function levelY(b, level) {
    return b.floor + level * STORY_H;
  }

  function addStairsAndFloors(b, rand) {
    const t = WALL_THICKNESS;
    const alongX = b.w >= b.d;
    const halfAcross = (alongX ? b.d : b.w) / 2 - t;
    let side;
    if (alongX) side = b.door === 0 ? 1 : b.door === 1 ? -1 : (rand() < 0.5 ? -1 : 1);
    else side = b.door === 2 ? 1 : b.door === 3 ? -1 : (rand() < 0.5 ? -1 : 1);
    const lanes = [0, 1].map((i) => {
      const off = side * (halfAcross - LANE_W * (i + 0.5));
      return alongX ? { cx: b.x, cz: b.z + off } : { cx: b.x + off, cz: b.z };
    });
    const axis = alongX ? "x" : "z";
    b.ramps = [];
    for (let k = 0; k < b.stories - 1; k += 1) {
      const lane = lanes[k % 2];
      b.ramps.push({
        axis,
        cx: lane.cx,
        cz: lane.cz,
        len: STAIR_LEN,
        wid: LANE_W,
        y0: levelY(b, k),
        y1: levelY(b, k + 1),
        dir: k % 2 === 0 ? 1 : -1,
        level: k
      });
    }
    const offAcross = side * (halfAcross - LANE_W);
    b.stairBlock = alongX
      ? { x: b.x, z: b.z + offAcross, w: STAIR_LEN + 3, d: LANE_W * 2 + 1 }
      : { x: b.x + offAcross, z: b.z, w: LANE_W * 2 + 1, d: STAIR_LEN + 3 };
    const interior = { x: b.x, z: b.z, w: b.w - t * 2, d: b.d - t * 2 };
    b.slabs = [];
    for (let level = 1; level < b.stories; level += 1) {
      const hole = rampRect(b.ramps[level - 1]);
      subtractRect(interior, hole).forEach((rect) => b.slabs.push({ ...rect, y: levelY(b, level), level }));
    }
  }

  function rectsOverlap(a, c, pad = 0) {
    return Math.abs(a.x - c.x) < (a.w + c.w) / 2 + pad && Math.abs(a.z - c.z) < (a.d + c.d) / 2 + pad;
  }

  function doorClearRect(b) {
    if (b.door === 0) return { x: b.x, z: b.z - b.d / 2 + 1.6, w: 3.4, d: 3.2 };
    if (b.door === 1) return { x: b.x, z: b.z + b.d / 2 - 1.6, w: 3.4, d: 3.2 };
    if (b.door === 2) return { x: b.x - b.w / 2 + 1.6, z: b.z, w: 3.2, d: 3.4 };
    return { x: b.x + b.w / 2 - 1.6, z: b.z, w: 3.2, d: 3.4 };
  }

  function propSpot(map, b, rand, level, spec, placed) {
    const hw = b.w / 2 - WALL_THICKNESS;
    const hd = b.d / 2 - WALL_THICKNESS;
    for (let i = 0; i < 30; i += 1) {
      let x;
      let z;
      let yaw;
      let fw;
      let fd;
      if (spec.wall) {
        const side = Math.floor(rand() * 4);
        yaw = [0, Math.PI, Math.PI / 2, -Math.PI / 2][side];
        const alongX = side < 2;
        fw = alongX ? spec.w : spec.d;
        fd = alongX ? spec.d : spec.w;
        if (alongX) {
          x = b.x + (rand() - 0.5) * Math.max(0, hw * 2 - fw - 0.4);
          z = side === 0 ? b.z - hd + fd / 2 + 0.08 : b.z + hd - fd / 2 - 0.08;
        } else {
          z = b.z + (rand() - 0.5) * Math.max(0, hd * 2 - fd - 0.4);
          x = side === 2 ? b.x - hw + fw / 2 + 0.08 : b.x + hw - fw / 2 - 0.08;
        }
      } else {
        const quarter = Math.floor(rand() * 4);
        yaw = (quarter * Math.PI) / 2;
        fw = quarter % 2 ? spec.d : spec.w;
        fd = quarter % 2 ? spec.w : spec.d;
        x = b.x + (rand() - 0.5) * Math.max(0, hw * 2 - fw - 1.6);
        z = b.z + (rand() - 0.5) * Math.max(0, hd * 2 - fd - 1.6);
      }
      const rect = { x, z, w: fw, d: fd };
      if (rectsOverlap(rect, b.stairBlock, 0.3)) continue;
      if (level === 0 && rectsOverlap(rect, doorClearRect(b))) continue;
      if (placed.some((other) => rectsOverlap(rect, other, 0.35))) continue;
      placed.push(rect);
      const y = level === 0 ? Math.max(terrainHeight(map, x, z), b.floor) : levelY(b, level);
      return { x, z, y, level, yaw };
    }
    return null;
  }

  function interiorSpot(map, b, rand, level, pad = 1.6) {
    const innerW = b.w - pad * 2;
    const innerD = b.d - pad * 2;
    for (let i = 0; i < 24; i += 1) {
      const x = b.x + (rand() - 0.5) * innerW;
      const z = b.z + (rand() - 0.5) * innerD;
      if (inRect(b.stairBlock, x, z, 0.6)) continue;
      const y = level === 0 ? Math.max(terrainHeight(map, x, z), b.floor) : levelY(b, level);
      return { x, z, y, level };
    }
    return null;
  }

  const BUILDING_COLORS = ["#e2c799", "#c9a27e", "#a7b8c8", "#d8d2c4", "#b9c99a", "#d4a5a5", "#9fb3c8", "#e8dcc0"];
  const ROOF_COLORS = ["#7f1d1d", "#374151", "#1e3a5f", "#4b3621", "#3f6212", "#5b21b6"];

  function pickBuildingType(rand) {
    const total = BUILDING_TYPES.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rand() * total;
    for (const entry of BUILDING_TYPES) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return BUILDING_TYPES[0];
  }

  function between(rand, [min, max]) {
    return min + rand() * (max - min);
  }

  function isBuildableSpot(map, x, z) {
    const r = Math.hypot(x, z);
    if (map.id !== "island" && r < CONE_RADIUS + 12) return false;
    if (r < 25) return false;
    const coast = coastRadius(map.seed, Math.atan2(z, x));
    if (r > coast - 30) return false;
    const h = terrainHeight(map, x, z);
    const slope = Math.abs(terrainHeight(map, x + 6, z) - h) + Math.abs(terrainHeight(map, x, z + 6) - h);
    return slope < 2.6;
  }

  function generateMap(mapId, seed) {
    const map = {
      id: mapId,
      seed: seed >>> 0,
      half: MAP_HALF,
      buildings: [],
      walls: [],
      trees: [],
      rocks: [],
      chests: [],
      doors: [],
      props: [],
      roads: [],
      intersections: [],
      stoplights: [],
      lamps: [],
      cars: [],
      carBlocks: [],
      blocks: []
    };
    const rand = mulberry32(map.seed);
    const occupied = [];

    let tries = 0;
    while (map.buildings.length < 100 && tries < 6000) {
      tries += 1;
      const angle = rand() * Math.PI * 2;
      const r = 30 + Math.sqrt(rand()) * 320;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!isBuildableSpot(map, x, z)) continue;
      const kind = pickBuildingType(rand);
      let w = Math.round(between(rand, kind.w));
      let d = Math.round(between(rand, kind.d));
      if (rand() < 0.5) [w, d] = [d, w];
      const radius = Math.hypot(w, d) / 2 + 4;
      if (overlaps(occupied, x, z, radius)) continue;
      const stories = kind.stories[0] + Math.floor(rand() * (kind.stories[1] - kind.stories[0] + 1));
      const building = {
        id: map.buildings.length,
        type: kind.type,
        x,
        z,
        w,
        d,
        stories,
        h: stories * STORY_H,
        floor: terrainHeight(map, x, z),
        door: Math.floor(rand() * 4),
        color: BUILDING_COLORS[Math.floor(rand() * BUILDING_COLORS.length)],
        roof: ROOF_COLORS[Math.floor(rand() * ROOF_COLORS.length)]
      };
      map.buildings.push(building);
      occupied.push({ x, z, radius });
      addStairsAndFloors(building, rand);
      addBuildingWalls(map.walls, building);
    }

    const city = typeof BBWorldCity !== "undefined" ? BBWorldCity : require("./world-city.js");
    const roadBlocked = (x, z, margin) => {
      const r = Math.hypot(x, z);
      if (terrainHeight(map, x, z) < 1) return true;
      if (r > coastRadius(map.seed, Math.atan2(z, x)) - 18) return true;
      if (map.id !== "island" && r < CONE_RADIUS + 15) return true;
      return map.buildings.some((b) => Math.abs(x - b.x) < b.w / 2 + margin && Math.abs(z - b.z) < b.d / 2 + margin);
    };
    const network = city.generateRoads(map, rand, terrainHeight, roadBlocked);
    map.roads = network.roads;
    map.intersections = network.intersections;
    map.roads.forEach((road) => {
      road.points.forEach((p, i) => {
        if (i % 2 === 0) occupied.push({ x: p.x, z: p.z, radius: road.width / 2 + 2.6 });
      });
    });
    const street = city.streetFurniture(map, rand, terrainHeight, map.roads, map.intersections);
    map.stoplights = street.stoplights;
    map.lamps = street.lamps;
    map.cars = street.cars;
    map.carBlocks = street.carBlocks;

    tries = 0;
    while (map.trees.length < 320 && tries < 8000) {
      tries += 1;
      const x = (rand() * 2 - 1) * COAST_RADIUS;
      const z = (rand() * 2 - 1) * COAST_RADIUS;
      const h = terrainHeight(map, x, z);
      if (h < 1.2) continue;
      if (map.id !== "island" && Math.hypot(x, z) < CONE_RADIUS * 0.75) continue;
      if (overlaps(occupied, x, z, 1.2)) continue;
      const tree = { id: map.trees.length, x, z, radius: 0.7, height: 4 + rand() * 4, kind: rand() < 0.35 ? "pine" : "round" };
      map.trees.push(tree);
      occupied.push({ x, z, radius: 1.6 });
    }

    tries = 0;
    while (map.rocks.length < 90 && tries < 4000) {
      tries += 1;
      const x = (rand() * 2 - 1) * COAST_RADIUS;
      const z = (rand() * 2 - 1) * COAST_RADIUS;
      if (terrainHeight(map, x, z) < 0.6) continue;
      const radius = 0.8 + rand() * 1.4;
      if (overlaps(occupied, x, z, radius + 0.6)) continue;
      map.rocks.push({ id: map.rocks.length, x, z, radius });
      occupied.push({ x, z, radius: radius + 0.6 });
    }

    const rareChestBudget = { count: 0, max: 8, min: 4 };
    const addChest = (x, z, y, level, chance) => {
      let rare = false;
      if (rareChestBudget.count < rareChestBudget.max && rand() < chance) {
        rare = true;
        rareChestBudget.count += 1;
      }
      map.chests.push({ id: map.chests.length, x, z, y, level, rare });
    };
    map.buildings.forEach((b) => {
      for (let level = 0; level < b.stories; level += 1) {
        if (rand() >= 0.35) continue;
        const spot = interiorSpot(map, b, rand, level);
        if (spot) addChest(spot.x, spot.z, spot.y, level, 0.012 + level * 0.006);
      }
    });
    tries = 0;
    while (map.chests.length < 160 && tries < 4000) {
      tries += 1;
      const x = (rand() * 2 - 1) * COAST_RADIUS;
      const z = (rand() * 2 - 1) * COAST_RADIUS;
      if (terrainHeight(map, x, z) < 1) continue;
      if (map.id !== "island" && Math.hypot(x, z) < CONE_RADIUS * 0.6) continue;
      if (overlaps(occupied, x, z, 1.2)) continue;
      addChest(x, z, terrainHeight(map, x, z), 0, 0.012);
      occupied.push({ x, z, radius: 1.2 });
    }
    tries = 0;
    while (rareChestBudget.count < rareChestBudget.min && tries < 3000) {
      tries += 1;
      const angle = rand() * Math.PI * 2;
      const r = 80 + rand() * (COAST_RADIUS - 100);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (terrainHeight(map, x, z) < 1.2) continue;
      if (overlaps(occupied, x, z, 1.4)) continue;
      map.chests.push({ id: map.chests.length, x, z, y: terrainHeight(map, x, z), level: 0, rare: true });
      rareChestBudget.count += 1;
      occupied.push({ x, z, radius: 1.4 });
    }

    const chestsByBuilding = new Map();
    map.chests.forEach((chest) => {
      const b = buildingAt(map, chest.x, chest.z);
      if (!b) return;
      if (!chestsByBuilding.has(b.id)) chestsByBuilding.set(b.id, []);
      chestsByBuilding.get(b.id).push(chest);
    });
    map.buildings.forEach((b) => {
      map.doors.push(city.doorForBuilding(b));
      const placed = Array.from({ length: b.stories }, () => []);
      (chestsByBuilding.get(b.id) || []).forEach((chest) => placed[chest.level].push({ x: chest.x, z: chest.z, w: 1.4, d: 1.4 }));
      map.props.push(...city.interiorProps(b, rand, (level, spec) => propSpot(map, b, rand, level, spec, placed[level])));
    });

    map.grid = buildWallGrid(map.walls);
    return map;
  }

  function doorCollider(d) {
    if (!d || d.open || d.broken) return null;
    const depth = 0.22;
    const cx = d.x + Math.sin(d.yaw) * depth * 0.5;
    const cz = d.z + Math.cos(d.yaw) * depth * 0.5;
    const alongX = Math.abs(Math.sin(d.yaw)) < 0.5;
    return {
      x: cx,
      z: cz,
      w: alongX ? d.w : depth,
      d: alongX ? depth : d.w,
      y: d.y,
      h: d.h
    };
  }

  function activeDoorWalls(doors) {
    if (!doors || !doors.length) return [];
    return doors.map(doorCollider).filter(Boolean);
  }

  function buildWallGrid(walls) {
    const grid = new Map();
    walls.forEach((wall, index) => {
      const minX = Math.floor((wall.x - wall.w / 2) / GRID_CELL);
      const maxX = Math.floor((wall.x + wall.w / 2) / GRID_CELL);
      const minZ = Math.floor((wall.z - wall.d / 2) / GRID_CELL);
      const maxZ = Math.floor((wall.z + wall.d / 2) / GRID_CELL);
      for (let gx = minX; gx <= maxX; gx += 1) {
        for (let gz = minZ; gz <= maxZ; gz += 1) {
          const key = `${gx},${gz}`;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(index);
        }
      }
    });
    return grid;
  }

  function wallsNear(map, x, z) {
    const gx = Math.floor(x / GRID_CELL);
    const gz = Math.floor(z / GRID_CELL);
    const found = new Set();
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        const list = map.grid.get(`${gx + dx},${gz + dz}`);
        if (list) list.forEach((index) => found.add(index));
      }
    }
    return [...found].map((index) => map.walls[index]);
  }

  function pushOutOfRect(pos, rect, radius) {
    const halfW = rect.w / 2;
    const halfD = rect.d / 2;
    const nearX = Math.max(rect.x - halfW, Math.min(pos.x, rect.x + halfW));
    const nearZ = Math.max(rect.z - halfD, Math.min(pos.z, rect.z + halfD));
    const dx = pos.x - nearX;
    const dz = pos.z - nearZ;
    const dist = Math.hypot(dx, dz);
    if (dist >= radius) return;
    if (dist > 0.0001) {
      pos.x = nearX + (dx / dist) * radius;
      pos.z = nearZ + (dz / dist) * radius;
      return;
    }
    const pushLeft = pos.x - (rect.x - halfW);
    const pushRight = rect.x + halfW - pos.x;
    const pushUp = pos.z - (rect.z - halfD);
    const pushDown = rect.z + halfD - pos.z;
    const min = Math.min(pushLeft, pushRight, pushUp, pushDown);
    if (min === pushLeft) pos.x = rect.x - halfW - radius;
    else if (min === pushRight) pos.x = rect.x + halfW + radius;
    else if (min === pushUp) pos.z = rect.z - halfD - radius;
    else pos.z = rect.z + halfD + radius;
  }

  function blockGround(map, x, z, limit, best) {
    if (!map.blocks) return best;
    for (const block of map.blocks) {
      if (Math.abs(x - block.x) >= block.w / 2 || Math.abs(z - block.z) >= block.d / 2) continue;
      const top = block.y + block.h;
      if (top <= limit && top > best) best = top;
    }
    return best;
  }

  function groundHeight(map, x, z, feetY) {
    const terrain = terrainHeight(map, x, z);
    const b = buildingAt(map, x, z);
    if (!b) return blockGround(map, x, z, (feetY === undefined ? terrain : feetY) + STEP_UP, terrain);
    const limit = (feetY === undefined ? Math.max(terrain, b.floor) : feetY) + STEP_UP;
    let best = terrain;
    const consider = (y) => {
      if (y <= limit && y > best) best = y;
    };
    consider(b.floor);
    b.slabs.forEach((s) => { if (inRect(s, x, z)) consider(s.y); });
    b.ramps.forEach((r) => { if (inRect(rampRect(r), x, z)) consider(rampSurface(r, x, z)); });
    consider(b.floor + b.h + 0.5);
    return blockGround(map, x, z, limit, best);
  }

  function ceilingHeight(map, x, z, feetY) {
    const b = buildingAt(map, x, z);
    if (!b) return Infinity;
    let best = Infinity;
    const consider = (y) => {
      if (y > feetY + 0.4 && y < best) best = y;
    };
    b.slabs.forEach((s) => { if (inRect(s, x, z)) consider(s.y - SLAB_T); });
    b.ramps.forEach((r) => { if (inRect(rampRect(r), x, z)) consider(r.y0); });
    consider(b.floor + b.h);
    return best;
  }

  function levelAt(b, y) {
    return Math.max(0, Math.min(b.stories, Math.floor((y - b.floor + 0.8) / STORY_H)));
  }

  function resolveCollision(map, pos, radius, feetY, doors) {
    const extra = activeDoorWalls(doors);
    for (const wall of [...wallsNear(map, pos.x, pos.z), ...extra]) {
      if (feetY !== undefined && (feetY > wall.y + wall.h || feetY + PLAYER_HEIGHT < wall.y)) continue;
      pushOutOfRect(pos, wall, radius);
    }
    if (feetY !== undefined) {
      const b = buildingAt(map, pos.x, pos.z);
      if (b) {
        b.ramps.forEach((r) => {
          if (feetY < r.y0 - PLAYER_HEIGHT + 0.1) return;
          const rect = rampRect(r);
          const nearX = Math.max(rect.x - rect.w / 2, Math.min(pos.x, rect.x + rect.w / 2));
          const nearZ = Math.max(rect.z - rect.d / 2, Math.min(pos.z, rect.z + rect.d / 2));
          if (feetY + STEP_UP >= rampSurface(r, nearX, nearZ)) return;
          pushOutOfRect(pos, rect, radius);
        });
      }
    }
    for (const block of map.blocks || []) {
      if (Math.abs(pos.x - block.x) > 3 || Math.abs(pos.z - block.z) > 3) continue;
      if (feetY !== undefined && (feetY + STEP_UP >= block.y + block.h || feetY + PLAYER_HEIGHT < block.y)) continue;
      pushOutOfRect(pos, block, radius);
    }
    const pushRound = (list, pad) => {
      for (const item of list) {
        if (item.broken) continue;
        const dx = pos.x - item.x;
        const dz = pos.z - item.z;
        if (Math.abs(dx) > 4 || Math.abs(dz) > 4) continue;
        const dist = Math.hypot(dx, dz);
        const min = item.radius + radius + pad;
        if (dist < min && dist > 0.0001) {
          pos.x = item.x + (dx / dist) * min;
          pos.z = item.z + (dz / dist) * min;
        }
      }
    };
    pushRound(map.trees, 0);
    pushRound(map.rocks, 0);
    if (feetY === undefined || feetY < terrainHeight(map, pos.x, pos.z) + 1.4) pushRound(map.carBlocks, 0);
    pos.x = Math.max(-MAP_HALF, Math.min(MAP_HALF, pos.x));
    pos.z = Math.max(-MAP_HALF, Math.min(MAP_HALF, pos.z));
    return pos;
  }

  function segmentHitsWall(map, ax, az, bx, bz, y, doors) {
    const extra = activeDoorWalls(doors);
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5);
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      for (const wall of [...wallsNear(map, x, z), ...extra, ...(map.blocks || [])]) {
        if (y !== undefined && (y < wall.y || y > wall.y + wall.h)) continue;
        if (Math.abs(x - wall.x) <= wall.w / 2 && Math.abs(z - wall.z) <= wall.d / 2) return true;
      }
    }
    return false;
  }

  function buildingAt(map, x, z) {
    return map.buildings.find((b) => Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) || null;
  }

  function randomLandSpot(map, rand, hazard) {
    for (let i = 0; i < 400; i += 1) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * COAST_RADIUS;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const h = terrainHeight(map, x, z);
      if (h < 1.5) continue;
      if (hazard && hazard.waterLevel && h < hazard.waterLevel + 1) continue;
      if (hazard && hazard.lavaRadius && r < hazard.lavaRadius + 15) continue;
      if (hazard && pointInIslandLava(x, z, hazard)) continue;
      if (map.id !== "island" && r < CONE_RADIUS + 5) continue;
      if (buildingAt(map, x, z)) continue;
      return { x, z };
    }
    return { x: 0, z: COAST_RADIUS - 40 };
  }

  const api = {
    MAP_HALF,
    COAST_RADIUS,
    CONE_RADIUS,
    MAP_IDS,
    MAP_LABELS,
    HAZARDS,
    ROCK_WARNING_MS,
    ROCK_RADIUS,
    ROCK_DAMAGE,
    ROCK_STUN_MS,
    WATER_DPS,
    LAVA_DPS,
    STORY_H,
    SLAB_T,
    PLAYER_HEIGHT,
    mulberry32,
    terrainHeight,
    groundHeight,
    ceilingHeight,
    levelAt,
    rampRect,
    hazardAt,
    islandSafeZone,
    pointInIslandLava,
    pointInIslandSafe,
    ISLAND_LAVA_SPREAD,
    ISLAND_SAFE_RADIUS,
    generateMap,
    resolveCollision,
    segmentHitsWall,
    buildingAt,
    randomLandSpot
  };

  root.BBMapGen = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
