(function (root) {
  const MAP_HALF = 400;
  const COAST_RADIUS = 360;
  const CONE_RADIUS = 160;
  const CONE_HEIGHT = 70;
  const CRATER_RADIUS = 18;
  const WALL_THICKNESS = 0.6;
  const DOOR_WIDTH = 2.6;
  const GRID_CELL = 20;

  const MAP_IDS = ["island", "volcano", "hardVolcano"];

  const MAP_LABELS = {
    island: "Sinking Island",
    volcano: "Volcano",
    hardVolcano: "Hard Volcano"
  };

  const HAZARDS = {
    island: { kind: "water", graceMs: 60000, stepMs: 45000, stepAmount: 0.55 },
    volcano: { kind: "lava", graceMs: 45000, stepMs: 30000, stepAmount: 18, startRadius: 20 },
    hardVolcano: { kind: "lava", graceMs: 30000, stepMs: 25000, stepAmount: 22, startRadius: 22, rocks: true }
  };

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

  function hazardAt(mapId, elapsedMs) {
    const hazard = HAZARDS[mapId];
    const steps = elapsedMs < hazard.graceMs ? 0 : Math.floor((elapsedMs - hazard.graceMs) / hazard.stepMs) + 1;
    const nextStepMs = elapsedMs < hazard.graceMs
      ? hazard.graceMs - elapsedMs
      : hazard.stepMs - ((elapsedMs - hazard.graceMs) % hazard.stepMs);
    if (hazard.kind === "water") {
      return { kind: "water", waterLevel: steps * hazard.stepAmount, lavaRadius: 0, steps, nextStepMs };
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
        walls.push({ x: cx, z: cz, w, d, y: bottom, h: height });
        return;
      }
      const length = alongX ? w : d;
      const piece = (length - DOOR_WIDTH) / 2;
      const offset = DOOR_WIDTH / 2 + piece / 2;
      if (alongX) {
        walls.push({ x: cx - offset, z: cz, w: piece, d, y: bottom, h: height });
        walls.push({ x: cx + offset, z: cz, w: piece, d, y: bottom, h: height });
      } else {
        walls.push({ x: cx, z: cz - offset, w, d: piece, y: bottom, h: height });
        walls.push({ x: cx, z: cz + offset, w, d: piece, y: bottom, h: height });
      }
    };
    side(b.x, b.z - halfD + t / 2, b.w, t, b.door === 0, true);
    side(b.x, b.z + halfD - t / 2, b.w, t, b.door === 1, true);
    side(b.x - halfW + t / 2, b.z, t, b.d, b.door === 2, false);
    side(b.x + halfW - t / 2, b.z, t, b.d, b.door === 3, false);
  }

  const BUILDING_TYPES = [
    { type: "house", w: [14, 20], d: [14, 20], h: [5.5, 8], weight: 6 },
    { type: "warehouse", w: [26, 34], d: [20, 28], h: [8, 11], weight: 2 },
    { type: "tower", w: [11, 14], d: [11, 14], h: [18, 26], weight: 2 },
    { type: "shop", w: [18, 24], d: [14, 18], h: [5.5, 8], weight: 3 }
  ];

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
    const map = { id: mapId, seed: seed >>> 0, half: MAP_HALF, buildings: [], walls: [], trees: [], rocks: [], chests: [], doors: [], props: [], roads: [], stoplights: [] };
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
      const building = {
        id: map.buildings.length,
        type: kind.type,
        x,
        z,
        w,
        d,
        h: Math.round(between(rand, kind.h)),
        floor: terrainHeight(map, x, z),
        door: Math.floor(rand() * 4),
        color: BUILDING_COLORS[Math.floor(rand() * BUILDING_COLORS.length)],
        roof: ROOF_COLORS[Math.floor(rand() * ROOF_COLORS.length)]
      };
      map.buildings.push(building);
      occupied.push({ x, z, radius });
      addBuildingWalls(map.walls, building);
    }

    tries = 0;
    while (map.trees.length < 320 && tries < 8000) {
      tries += 1;
      const x = (rand() * 2 - 1) * COAST_RADIUS;
      const z = (rand() * 2 - 1) * COAST_RADIUS;
      const h = terrainHeight(map, x, z);
      if (h < 1.2) continue;
      if (map.id !== "island" && Math.hypot(x, z) < CONE_RADIUS * 0.75) continue;
      if (overlaps(occupied, x, z, 1.2)) continue;
      const tree = { x, z, radius: 0.7, height: 4 + rand() * 4, kind: rand() < 0.35 ? "pine" : "round" };
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
      map.rocks.push({ x, z, radius });
      occupied.push({ x, z, radius: radius + 0.6 });
    }

    const rareChestBudget = { count: 0, max: 8, min: 4 };
    const addChest = (x, z, chance) => {
      let rare = false;
      if (rareChestBudget.count < rareChestBudget.max && rand() < chance) {
        rare = true;
        rareChestBudget.count += 1;
      }
      map.chests.push({ id: map.chests.length, x, z, rare });
    };
    map.buildings.forEach((b) => {
      if (rand() < 0.7) addChest(b.x, b.z, 0.018);
    });
    tries = 0;
    while (map.chests.length < 160 && tries < 4000) {
      tries += 1;
      const x = (rand() * 2 - 1) * COAST_RADIUS;
      const z = (rand() * 2 - 1) * COAST_RADIUS;
      if (terrainHeight(map, x, z) < 1) continue;
      if (map.id !== "island" && Math.hypot(x, z) < CONE_RADIUS * 0.6) continue;
      if (overlaps(occupied, x, z, 1.2)) continue;
      addChest(x, z, 0.012);
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
      map.chests.push({ id: map.chests.length, x, z, rare: true });
      rareChestBudget.count += 1;
      occupied.push({ x, z, radius: 1.4 });
    }

    const city = typeof BBWorldCity !== "undefined" ? BBWorldCity : require("./world-city.js");
    map.roads = city.generateRoads(map, rand, terrainHeight, occupied);
    map.stoplights = city.stoplightsForRoads(map.roads, rand);
    map.buildings.forEach((b) => {
      map.doors.push(city.doorForBuilding(b));
      map.props.push(...city.interiorProps(b, rand));
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

  function resolveCollision(map, pos, radius, feetY, doors) {
    const extra = activeDoorWalls(doors);
    for (const wall of [...wallsNear(map, pos.x, pos.z), ...extra]) {
      if (feetY !== undefined && feetY > wall.y + wall.h) continue;
      const halfW = wall.w / 2;
      const halfD = wall.d / 2;
      const nearX = Math.max(wall.x - halfW, Math.min(pos.x, wall.x + halfW));
      const nearZ = Math.max(wall.z - halfD, Math.min(pos.z, wall.z + halfD));
      const dx = pos.x - nearX;
      const dz = pos.z - nearZ;
      const dist = Math.hypot(dx, dz);
      if (dist >= radius) continue;
      if (dist > 0.0001) {
        pos.x = nearX + (dx / dist) * radius;
        pos.z = nearZ + (dz / dist) * radius;
      } else {
        const pushLeft = pos.x - (wall.x - halfW);
        const pushRight = wall.x + halfW - pos.x;
        const pushUp = pos.z - (wall.z - halfD);
        const pushDown = wall.z + halfD - pos.z;
        const min = Math.min(pushLeft, pushRight, pushUp, pushDown);
        if (min === pushLeft) pos.x = wall.x - halfW - radius;
        else if (min === pushRight) pos.x = wall.x + halfW + radius;
        else if (min === pushUp) pos.z = wall.z - halfD - radius;
        else pos.z = wall.z + halfD + radius;
      }
    }
    const pushRound = (list, pad) => {
      for (const item of list) {
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
      for (const wall of [...wallsNear(map, x, z), ...extra]) {
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
    mulberry32,
    terrainHeight,
    hazardAt,
    generateMap,
    resolveCollision,
    segmentHitsWall,
    buildingAt,
    randomLandSpot
  };

  root.BBMapGen = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
