const data = require("./game-data.js");
const { BB_CATALOG, bbIsRideable, bbFootRadius, BB_CHARACTER_HEIGHT } = require("./bb-art.js");
const mapGen = require("./map-gen.js");

const TICK_MS = 50;
const QUEUE_WAIT_MS = 90000;
const PLAYER_RADIUS = 0.5;
const PLAYER_SPEED = 7;
const SPRINT_BOOST = 1.25;
const SPRINT_DURATION_MS = 15000;
const SPRINT_COOLDOWN_MS = 15000;
const GRAVITY = 25;
const JUMP_SPEED = 9;
const PICKUP_RANGE = 3.2;
const ROCK_INTERVAL_MS = 3000;
const SPAWN_PROTECT_MS = 15000;
const RECONNECT_GRACE_MS = 45000;
const BOT_TUNING = {
  island: { cooldownScale: 2, damageScale: 0.8, engageRange: 16 },
  volcano: { cooldownScale: 1.6, damageScale: 1, engageRange: 20 },
  hardVolcano: { cooldownScale: 1.6, damageScale: 1, engageRange: 20 }
};
const BB_SPEED_UNITS = { "Very slow": 3, Slow: 5, Fast: 10, "Super fast": 12 };
const BB_DEFAULT_SPEED = 7.5;
const RIDE_REACH = 3.5;
const RIDER_SEAT = 0.82;
const BB_MAX_COLLIDE = 1.2;
const MODES = ["ranked", "competitive", "fun"];
const FUN_BOT_TUNING = { cooldownScale: 3.2, damageScale: 0.4, engageRange: 9 };
const SQUAD_BOT_TUNING = { cooldownScale: 1, damageScale: 1.6, engageRange: 24 };
const FUN_HAZARD_TIME_SCALE = 0.35;
const SQUAD_SIZE = 4;
const ZOMBIE_FIRST_WAVE_MS = 12000;
const ZOMBIE_WAVE_MS = 40000;
const ZOMBIE_MAX_ALIVE = 40;
const ZOMBIE_ATTACK_RANGE = 1.5;
const ZOMBIE_ATTACK_MS = 1200;
const ZOMBIE_SPAWN_MIN = 35;
const ZOMBIE_SPAWN_MAX = 60;
const ZOMBIE_KILL_COINS = 3;
const ZOMBIE_REWARD_SECONDS_PER_COIN = 30;
const ZOMBIE_REWARD_CAP = 120;
const BOT_FOLLOW_RANGE = 18;

function zombieWaveStats(wave) {
  return {
    count: Math.min(2 + wave * 2, 24),
    hp: 25 + wave * 8,
    damage: 3 + wave,
    speed: Math.min(4.2 + wave * 0.25, 7.5)
  };
}

function zombieReward(survivedMs, wave) {
  return Math.min(ZOMBIE_REWARD_CAP, Math.floor(survivedMs / 1000 / ZOMBIE_REWARD_SECONDS_PER_COIN) + Math.max(0, wave - 1));
}

const BOT_NAMES = [
  "Pebble", "Rusty", "Noodle", "Biscuit", "Sprocket", "Mango", "Turbo", "Waffles", "Gizmo", "Pickles",
  "Zippy", "Crumbs", "Domino", "Fizz", "Jellybean", "Kazoo", "Marble", "Nugget", "Pogo", "Quill",
  "Rocket", "Sardine", "Tater", "Umber", "Vroom", "Wobble", "Yoyo", "Ziggy", "Blip", "Chomp",
  "Dusty", "Echo", "Fable", "Gumbo", "Hopper", "Inky", "Jolt", "Kipper", "Lumpy", "Moxie"
];

const AVATAR_IDS = ["boy-1", "boy-2", "boy-3", "girl-1", "girl-2", "girl-3"];

const LOOT_POOL = [
  ...data.WEAPON_SHOP_ITEMS.map((name) => ({ item: name, weight: 1 / Math.max(10, data.getWeaponShopPrice(name)) })),
  ...Object.keys(data.POTION_EFFECTS).map((name) => ({ item: name, weight: 1 / Math.max(10, data.POTION_IN_GAME_PRICE[name]) }))
];
const LOOT_TOTAL = LOOT_POOL.reduce((sum, entry) => sum + entry.weight, 0);
const RARE_LOOT_POOL = (() => {
  const seen = new Set();
  const entries = [];
  const add = (item, weight) => {
    if (seen.has(item)) return;
    seen.add(item);
    entries.push({ item, weight });
  };
  data.WEAPON_SHOP_ITEMS.forEach((name) => {
    const price = data.getWeaponShopPrice(name);
    const dmg = data.getWeaponDamage(name);
    const ranged = data.getWeaponRanged(name);
    if (price >= 1600 || dmg >= 28 || (ranged && price >= 1200)) {
      add(name, price / 400 + dmg / 8);
    }
  });
  Object.keys(data.POTION_EFFECTS).forEach((name) => {
    const price = data.POTION_IN_GAME_PRICE[name] || 0;
    if (price >= 80) add(name, price / 60);
  });
  add("Laser Sword", 12);
  add("Plasma Blade", 12);
  add("Energy Pistol", 10);
  add("Sniper Rifle", 9);
  add("Assault Rifle", 8);
  return entries;
})();
const RARE_LOOT_TOTAL = RARE_LOOT_POOL.reduce((sum, entry) => sum + entry.weight, 0);
const BOT_START_WEAPONS = data.WEAPON_SHOP_ITEMS.filter((name) => data.getWeaponShopPrice(name) <= 1500 && data.getWeaponDamage(name) > 0);
const COMMON_BBS = BB_CATALOG.filter((bb) => bb.rarity === "common" || bb.rarity === "uncommon");
const GUARD_BBS = BB_CATALOG.filter((bb) => bb.rarity === "rare");
const WILD_COUNT = 14;
const GUARD_AGGRO = 9;
const GUARD_LEASH = 18;
const GUARD_HP_SCALE = 1.25;
const GUARD_DAMAGE_SCALE = 0.4;
const WILD_ROAM = 10;
const WILD_LEASH = 35;
const BB_KIND_CODE = { pet: 0, guard: 1, wild: 2 };
const HARVEST_MIN_DAMAGE = 8;
const BUILD_REACH = 2.2;
const BUILD_COOLDOWN_MS = 200;
const VEHICLE_SEAT_Y = 0.55;
const VEHICLE_TURN_RATE = 7;
const VEHICLE_MIN_DAMAGE = 8;
const MAX_BLOCK_STACK = 14;
const RESOURCE_COLLECT_RANGE = 1.6;
const PROP_DROPS = {
  bed: { wood: 4 }, wardrobe: { wood: 4 }, sofa: { wood: 2 }, tv: { metal: 2 }, table: { wood: 3 },
  chair: { wood: 1 }, kitchen: { wood: 2, metal: 2 }, fridge: { metal: 4 }, bookshelf: { wood: 3 },
  plant: { wood: 1 }, lamp: { metal: 1 }, shelfGoods: { wood: 2, metal: 1 }, counter: { wood: 3 },
  crate: { wood: 3 }, barrel: { wood: 1, metal: 2 }, pallet: { wood: 3 }, rack: { metal: 4 },
  desk: { wood: 3 }, officeChair: { metal: 1 }, cooler: { metal: 2 }, cabinet: { metal: 2 }
};
const WORLD_DROPS = {
  door: { wood: 3 }, light: { metal: 3 }, tree: { wood: 5 }, rock: { metal: 2 }, car: { metal: 8 }, lamp: { metal: 2 }
};

function rollFromPool(rand, pool, total) {
  let roll = rand() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return pool[pool.length - 1].item;
}

function rollLoot(rand) {
  return rollFromPool(rand, LOOT_POOL, LOOT_TOTAL);
}

function rollRareLoot(rand) {
  return rollFromPool(rand, RARE_LOOT_POOL, RARE_LOOT_TOTAL);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function send(ws, payload) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function normalizeDrop(mode, map) {
  if (mode === "fun") return { mode: "fun", map: "island" };
  if (!MODES.includes(mode) || !mapGen.MAP_IDS.includes(map)) return null;
  return { mode, map };
}

function sanitizeLoadout(loadout) {
  const weapons = Array.isArray(loadout?.weapons)
    ? loadout.weapons.filter((name) => data.WEAPON_SHOP_ITEMS.includes(name)).slice(0, 2)
    : [];
  const potion = data.isPotionName(loadout?.potion) ? loadout.potion : "";
  const bb = BB_CATALOG.find((entry) => entry.name === loadout?.bb) ? loadout.bb : "";
  const skin = data.SKIN_IDS.includes(loadout?.skin) ? loadout.skin : "";
  return { weapons, potion, bb, skin };
}

class Match {
  constructor(id, mode, mapId, humans, onFinish, awardStars, teamBots = 0) {
    this.id = id;
    this.mode = mode;
    this.zombies = mode === "zombies";
    this.mapId = mode === "fun" || this.zombies ? "island" : mapId;
    mapId = this.mapId;
    this.seed = Math.floor(Math.random() * 2 ** 31);
    this.rand = mapGen.mulberry32(this.seed ^ 0x9e3779b9);
    this.map = mapGen.generateMap(mapId, this.seed);
    this.doors = this.map.doors.map((d) => ({ ...d }));
    this.props = this.map.props.map((p) => ({ ...p }));
    this.stoplights = this.map.stoplights.map((s) => ({ ...s }));
    this.map.trees.forEach((tree) => {
      tree.y = mapGen.terrainHeight(this.map, tree.x, tree.z);
      tree.hp = tree.kind === "pine" ? 60 : 50;
    });
    this.map.rocks.forEach((rock) => {
      rock.y = mapGen.terrainHeight(this.map, rock.x, rock.z);
      rock.hp = Math.round(50 + rock.radius * 25);
    });
    this.map.cars.forEach((car) => { car.hp = 150; });
    this.map.lamps.forEach((lamp) => { lamp.hp = 40; });
    this.onFinish = onFinish;
    this.awardStars = awardStars;
    this.startAt = Date.now();
    this.players = [];
    this.bbs = [];
    this.projectiles = [];
    this.vehicles = [];
    this.loot = new Map();
    this.chestsOpen = new Set();
    this.rocks = [];
    this.events = [];
    this.nextId = 1;
    this.nextRockAt = ROCK_INTERVAL_MS;
    this.finished = false;
    this.placesTaken = 0;
    this.wave = 0;
    this.nextWaveAt = ZOMBIE_FIRST_WAVE_MS;

    const squadSpot = this.zombies ? mapGen.randomLandSpot(this.map, this.rand) : null;
    humans.forEach((conn) => this.addPlayer(conn.username, conn.avatar, conn.loadout, conn.ws));
    this.spawnWildlife();
    let botIndex = 0;
    const usedNames = new Set(this.players.map((p) => p.name));
    const targetCount = this.zombies ? Math.min(SQUAD_SIZE, this.players.length + teamBots) : data.MATCH_PLAYERS;
    while (this.players.length < targetCount) {
      let name = BOT_NAMES[botIndex % BOT_NAMES.length];
      if (botIndex >= BOT_NAMES.length) name += ` ${Math.floor(botIndex / BOT_NAMES.length) + 1}`;
      botIndex += 1;
      if (usedNames.has(name)) continue;
      usedNames.add(name);
      const weapons = this.zombies || this.rand() < 0.6 ? [BOT_START_WEAPONS[Math.floor(this.rand() * BOT_START_WEAPONS.length)]] : [];
      const bb = this.rand() < 0.3 ? COMMON_BBS[Math.floor(this.rand() * COMMON_BBS.length)].name : "";
      const skin = this.rand() < 0.35 ? data.SKIN_IDS[Math.floor(this.rand() * data.SKIN_IDS.length)] : "";
      this.addPlayer(name, AVATAR_IDS[Math.floor(this.rand() * AVATAR_IDS.length)], { weapons, potion: "", bb, skin }, null);
    }
    if (squadSpot) {
      this.players.forEach((p, index) => {
        const angle = (index / this.players.length) * Math.PI * 2;
        const pos = { x: squadSpot.x + Math.cos(angle) * 2.5, z: squadSpot.z + Math.sin(angle) * 2.5 };
        mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, undefined, this.doors);
        p.x = pos.x;
        p.z = pos.z;
        p.y = mapGen.terrainHeight(this.map, pos.x, pos.z);
      });
      this.bbs.forEach((bb) => {
        const owner = this.playerById(bb.owner);
        if (!owner) return;
        bb.x = owner.x + 1.5;
        bb.z = owner.z + 1.5;
        bb.y = mapGen.groundHeight(this.map, bb.x, bb.z, owner.y + 0.5);
      });
    }

    const roster = this.players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, skin: p.skin, bot: !p.ws }));
    this.players.forEach((p) => {
      if (!p.ws) return;
      send(p.ws, {
        t: "start",
        matchId: this.id,
        mode,
        map: mapId,
        seed: this.seed,
        you: p.id,
        roster,
        bbCatalog: BB_CATALOG.map((bb) => bb.name)
      });
    });

    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  elapsed() {
    return Date.now() - this.startAt;
  }

  botTuning() {
    if (this.zombies) return SQUAD_BOT_TUNING;
    if (this.mode === "fun") return FUN_BOT_TUNING;
    return BOT_TUNING[this.mapId];
  }

  hazardNow() {
    const elapsed = this.elapsed();
    const ms = this.zombies ? 0 : this.mode === "fun" ? elapsed * FUN_HAZARD_TIME_SCALE : elapsed;
    return mapGen.hazardAt(this.mapId, ms);
  }

  addPlayer(name, avatar, loadout, ws) {
    const spot = mapGen.randomLandSpot(this.map, this.rand);
    const clean = sanitizeLoadout(loadout);
    const inv = new Array(data.MATCH_INVENTORY_SLOTS).fill(null);
    [...clean.weapons, clean.potion].filter(Boolean).forEach((item, index) => { inv[index] = item; });
    const player = {
      id: this.nextId++,
      name,
      avatar: AVATAR_IDS.includes(avatar) ? avatar : "boy-1",
      skin: clean.skin,
      ws,
      x: spot.x,
      z: spot.z,
      y: mapGen.terrainHeight(this.map, spot.x, spot.z),
      vy: 0,
      yaw: this.rand() * Math.PI * 2,
      pitch: 0,
      hp: data.BASE_PLAYER_STATS.hp,
      maxHp: data.BASE_PLAYER_STATS.hp,
      inv,
      held: 0,
      coins: 0,
      wood: 0,
      metal: 0,
      lastBuildAt: -99999,
      sprintActiveUntil: 0,
      sprintCooldownUntil: 0,
      kills: 0,
      effect: null,
      stunUntil: 0,
      poison: null,
      lastAttackAt: -99999,
      swingUntil: 0,
      alive: true,
      touchingWall: false,
      input: { mx: 0, mz: 0, yaw: 0, pitch: 0, jump: false, attack: false, sprint: false },
      bot: ws ? null : { mode: "wander", goal: null, stuckAt: 0, lastPos: null, detourUntil: 0, detour: 0, thinkAt: 0, aimJitter: 0 },
      disconnectedAt: 0,
      riding: 0,
      vehicle: 0,
      seat: 0
    };
    this.players.push(player);
    if (clean.bb) this.spawnBb(player, clean.bb);
    return player;
  }

  spawnBb(owner, name) {
    const def = BB_CATALOG.find((bb) => bb.name === name);
    if (!def) return null;
    return this.createBb(def, "pet", owner.id, owner.x + (this.rand() - 0.5) * 3, owner.z + (this.rand() - 0.5) * 3, owner.y);
  }

  createBb(def, kind, ownerId, x, z, y) {
    const hpScale = kind === "guard" ? GUARD_HP_SCALE : 1;
    const bb = {
      id: this.nextId++,
      owner: ownerId,
      kind,
      catalogIndex: BB_CATALOG.indexOf(def),
      name: def.name,
      hp: def.hp * hpScale,
      maxHp: Math.round(def.hp * hpScale),
      damage: def.damage * (kind === "guard" ? GUARD_DAMAGE_SCALE : 1),
      attackMs: def.attackMs || 1000,
      defense: def.defense || 0,
      speed: BB_SPEED_UNITS[def.speed] || BB_DEFAULT_SPEED,
      x,
      z,
      y,
      home: { x, z, y },
      roamGoal: null,
      aggro: 0,
      yaw: this.rand() * Math.PI * 2,
      height: def.size * BB_CHARACTER_HEIGHT,
      radius: bbFootRadius(def),
      rideable: bbIsRideable(def),
      rider: 0,
      alive: true
    };
    this.bbs.push(bb);
    return bb;
  }

  spawnWildlife() {
    this.map.chests.forEach((chest) => {
      if (!chest.rare) return;
      const def = GUARD_BBS[Math.floor(this.rand() * GUARD_BBS.length)];
      const angle = this.rand() * Math.PI * 2;
      const pos = { x: chest.x + Math.cos(angle) * 2.2, z: chest.z + Math.sin(angle) * 2.2 };
      if (mapGen.segmentHitsWall(this.map, chest.x, chest.z, pos.x, pos.z, chest.y + 1, this.doors)) {
        pos.x = chest.x;
        pos.z = chest.z;
      }
      const bb = this.createBb(def, "guard", 0, pos.x, pos.z, mapGen.groundHeight(this.map, pos.x, pos.z, chest.y));
      bb.home = { x: chest.x, z: chest.z, y: chest.y };
    });
    for (let i = 0; i < WILD_COUNT; i += 1) {
      const def = COMMON_BBS[Math.floor(this.rand() * COMMON_BBS.length)];
      const spot = mapGen.randomLandSpot(this.map, this.rand);
      this.createBb(def, "wild", 0, spot.x, spot.z, mapGen.terrainHeight(this.map, spot.x, spot.z));
    }
  }

  squadAlive() {
    return this.players.filter((p) => p.alive && !p.zombie);
  }

  isEnemy(a, b) {
    if (!a || !b || a === b) return false;
    return this.zombies ? Boolean(a.zombie) !== Boolean(b.zombie) : true;
  }

  zombieSpawnSpot(anchor) {
    for (let i = 0; i < 30; i += 1) {
      const angle = this.rand() * Math.PI * 2;
      const dist = ZOMBIE_SPAWN_MIN + this.rand() * (ZOMBIE_SPAWN_MAX - ZOMBIE_SPAWN_MIN);
      const x = anchor.x + Math.cos(angle) * dist;
      const z = anchor.z + Math.sin(angle) * dist;
      if (Math.hypot(x, z) > mapGen.COAST_RADIUS - 5) continue;
      if (mapGen.terrainHeight(this.map, x, z) < 1.5 || mapGen.buildingAt(this.map, x, z)) continue;
      if (this.squadAlive().some((p) => Math.hypot(p.x - x, p.z - z) < ZOMBIE_SPAWN_MIN * 0.7)) continue;
      return { x, z };
    }
    return mapGen.randomLandSpot(this.map, this.rand);
  }

  spawnZombieWave(now) {
    const squad = this.squadAlive();
    if (!squad.length) return;
    this.wave += 1;
    this.nextWaveAt = now + ZOMBIE_WAVE_MS;
    const stats = zombieWaveStats(this.wave);
    const alive = this.players.filter((p) => p.alive && p.zombie).length;
    const count = Math.max(0, Math.min(stats.count, ZOMBIE_MAX_ALIVE - alive));
    for (let i = 0; i < count; i += 1) {
      const spot = this.zombieSpawnSpot(squad[Math.floor(this.rand() * squad.length)]);
      const zombie = this.addPlayer("Zombie", AVATAR_IDS[Math.floor(this.rand() * AVATAR_IDS.length)], {}, null);
      zombie.x = spot.x;
      zombie.z = spot.z;
      zombie.y = mapGen.terrainHeight(this.map, spot.x, spot.z);
      zombie.hp = stats.hp;
      zombie.maxHp = stats.hp;
      zombie.bot = null;
      zombie.zombie = { speed: stats.speed * (0.85 + this.rand() * 0.3), damage: stats.damage, nextAttackAt: 0, stuckAt: 0, lastPos: null, detourUntil: 0, detour: 0 };
      this.events.push({ k: "spawn", id: zombie.id, name: zombie.name, avatar: zombie.avatar, zombie: 1 });
    }
    this.players.forEach((p) => {
      if (p.ws && !p.zombie) send(p.ws, { t: "notice", text: `Wave ${this.wave}! ${count} zombies incoming` });
    });
  }

  zombieThink(p, now) {
    const z = p.zombie;
    p.input.attack = false;
    p.input.jump = false;
    let target = null;
    let best = Infinity;
    this.players.forEach((other) => {
      if (!other.alive || other.zombie) return;
      const d = Math.hypot(other.x - p.x, other.z - p.z);
      if (d < best) {
        best = d;
        target = other;
      }
    });
    if (!target) {
      p.input.mx = 0;
      p.input.mz = 0;
      return;
    }
    const vehicle = this.vehicleOf(target);
    const tx = vehicle ? vehicle.x : target.x;
    const tz = vehicle ? vehicle.z : target.z;
    const reach = ZOMBIE_ATTACK_RANGE + (vehicle ? data.VEHICLES[vehicle.kind].radius : 0);
    const dist = Math.hypot(tx - p.x, tz - p.z) || 1;
    p.input.yaw = Math.atan2(tx - p.x, tz - p.z);
    if (now > z.stuckAt) {
      if (z.lastPos && Math.hypot(p.x - z.lastPos.x, p.z - z.lastPos.z) < 0.8 && dist > reach) {
        const door = this.nearestDoor(p);
        if (door && !door.open && !door.broken) {
          door.broken = true;
          door.open = true;
          this.events.push({ k: "break", kind: "door", id: door.id });
        }
        z.detourUntil = now + 1000;
        z.detour = (this.rand() < 0.5 ? -1 : 1) * (1 + this.rand());
        p.input.jump = true;
      }
      z.lastPos = { x: p.x, z: p.z };
      z.stuckAt = now + 1200;
    }
    if (dist <= reach) {
      p.input.mx = 0;
      p.input.mz = 0;
      if (now >= z.nextAttackAt && Math.abs(target.y - p.y) < 2.5) {
        z.nextAttackAt = now + ZOMBIE_ATTACK_MS;
        p.swingUntil = now + 250;
        if (vehicle) this.damageVehicle(vehicle, z.damage, p);
        else this.damagePlayer(target, z.damage, p);
      }
      return;
    }
    let ax = (tx - p.x) / dist;
    let az = (tz - p.z) / dist;
    if (now < z.detourUntil) {
      const c = Math.cos(z.detour);
      const s = Math.sin(z.detour);
      [ax, az] = [ax * c - az * s, ax * s + az * c];
    }
    p.input.mx = ax;
    p.input.mz = az;
  }

  bbHostileTo(bb, playerId) {
    if (bb.kind === "pet") return bb.owner !== playerId;
    return bb.aggro === playerId;
  }

  playerById(id) {
    return this.players.find((p) => p.id === id) || null;
  }

  bbById(id) {
    return this.bbs.find((bb) => bb.id === id && bb.alive) || null;
  }

  seatHeight(p) {
    const mount = p.riding ? this.bbById(p.riding) : null;
    return mount ? mount.height * RIDER_SEAT : 0;
  }

  vehicleById(id) {
    return this.vehicles.find((v) => v.id === id) || null;
  }

  vehicleOf(p) {
    return p.vehicle ? this.vehicleById(p.vehicle) : null;
  }

  enterVehicle(p, v) {
    const seat = v.seats.indexOf(0);
    v.seats[seat] = p.id;
    p.vehicle = v.id;
    p.seat = seat;
    p.vy = 0;
    this.placeOccupant(p, v);
    const spec = data.VEHICLES[v.kind];
    if (p.ws) send(p.ws, { t: "notice", text: `${seat === 0 ? "Driving" : "Riding in"} the ${spec.label} — R to get out` });
  }

  exitVehicle(p, v) {
    p.vehicle = 0;
    if (!v) return;
    v.seats[p.seat] = 0;
    if (p.seat === 0) {
      const next = v.seats.findIndex((id) => id);
      if (next > 0) {
        const promoted = this.playerById(v.seats[next]);
        v.seats[0] = v.seats[next];
        v.seats[next] = 0;
        if (promoted) promoted.seat = 0;
      }
    }
    const radius = data.VEHICLES[v.kind].radius + 0.9;
    const pos = { x: v.x + Math.cos(v.yaw) * radius, z: v.z - Math.sin(v.yaw) * radius };
    mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, v.y, this.doors);
    p.x = pos.x;
    p.z = pos.z;
    p.y = mapGen.groundHeight(this.map, p.x, p.z, v.y + 0.5);
    p.vy = 0;
    p.seat = 0;
  }

  placeOccupant(p, v) {
    p.x = v.x;
    p.z = v.z;
    p.y = v.y + VEHICLE_SEAT_Y;
    p.vy = 0;
    p.touchingWall = false;
  }

  buildVehicle(p, kind) {
    const spec = data.VEHICLES[kind];
    const notice = (text) => send(p.ws, { t: "notice", text });
    const now = this.elapsed();
    if (now - p.lastBuildAt < BUILD_COOLDOWN_MS) return;
    if (p.metal < spec.cost) {
      notice(`Need ${spec.cost} metal to build a ${spec.label} (you have ${p.metal})`);
      return;
    }
    const dist = BUILD_REACH + spec.radius;
    const x = p.x + Math.sin(p.yaw) * dist;
    const z = p.z + Math.cos(p.yaw) * dist;
    if (Math.abs(x) > mapGen.MAP_HALF - spec.radius || Math.abs(z) > mapGen.MAP_HALF - spec.radius) return;
    const r = spec.radius;
    if ([[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([ox, oz]) => mapGen.buildingAt(this.map, x + ox, z + oz))
      || mapGen.segmentHitsWall(this.map, p.x, p.z, x, z, p.y + 1, this.doors)) {
      notice("Not enough room to build that here");
      return;
    }
    p.metal -= spec.cost;
    p.lastBuildAt = now;
    const vehicle = {
      id: this.nextId++,
      kind,
      owner: p.id,
      x,
      z,
      y: mapGen.groundHeight(this.map, x, z, p.y + 0.5),
      yaw: p.yaw,
      aim: p.yaw,
      hp: spec.hp,
      maxHp: spec.hp,
      seats: new Array(spec.seats).fill(0),
      gunReadyAt: 0
    };
    this.vehicles.push(vehicle);
    this.events.push({ k: "vehicle+", id: vehicle.id });
    notice(`Built a ${spec.label}! Walk up and press R to get in`);
  }

  driveVehicle(p, v, mx, mz, dt) {
    const spec = data.VEHICLES[v.kind];
    if (mx || mz) {
      const diff = angleDiff(Math.atan2(mx, mz), v.yaw);
      const step = VEHICLE_TURN_RATE * dt;
      v.yaw += Math.max(-step, Math.min(step, diff));
    }
    const speed = PLAYER_SPEED * spec.speed;
    const pos = { x: v.x + mx * speed * dt, z: v.z + mz * speed * dt };
    mapGen.resolveCollision(this.map, pos, Math.min(spec.radius, BB_MAX_COLLIDE), v.y, this.doors);
    v.x = pos.x;
    v.z = pos.z;
    v.y = mapGen.groundHeight(this.map, v.x, v.z, v.y);
  }

  fireVehicleGun(p, v, now) {
    const spec = data.VEHICLES[v.kind];
    if (!spec.gun || now < v.gunReadyAt) return;
    v.gunReadyAt = now + spec.gun.cooldownMs;
    const yaw = p.input.yaw;
    const pitch = p.input.pitch;
    v.aim = yaw;
    this.projectiles.push({
      id: this.nextId++,
      owner: p.id,
      vehicle: v.id,
      item: "Tank Gun",
      damage: spec.gun.damage,
      x: v.x + Math.sin(yaw) * (spec.radius + 0.6),
      y: v.y + 1.6,
      z: v.z + Math.cos(yaw) * (spec.radius + 0.6),
      vx: Math.sin(yaw) * Math.cos(pitch) * spec.gun.speed,
      vy: Math.sin(pitch) * spec.gun.speed,
      vz: Math.cos(yaw) * Math.cos(pitch) * spec.gun.speed,
      left: spec.gun.range
    });
    this.events.push({ k: "tankfire", id: v.id });
  }

  damageVehicle(v, amount, sourcePlayer) {
    if (v.hp <= 0 || amount <= 0) return;
    v.hp -= amount;
    this.events.push({ k: "vhit", id: v.id });
    if (v.hp > 0) return;
    v.seats.forEach((id) => {
      const occupant = id ? this.playerById(id) : null;
      if (occupant && occupant.vehicle === v.id) this.exitVehicle(occupant, null);
    });
    v.seats.forEach((id, index) => {
      const occupant = id ? this.playerById(id) : null;
      if (!occupant) return;
      const angle = (index / v.seats.length) * Math.PI * 2;
      const pos = { x: v.x + Math.cos(angle) * 1.6, z: v.z + Math.sin(angle) * 1.6 };
      mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, v.y, this.doors);
      occupant.x = pos.x;
      occupant.z = pos.z;
      occupant.y = mapGen.groundHeight(this.map, pos.x, pos.z, v.y + 0.5);
      occupant.seat = 0;
    });
    this.vehicles = this.vehicles.filter((entry) => entry !== v);
    this.events.push({ k: "vboom", id: v.id, x: round2(v.x), y: round2(v.y), z: round2(v.z) });
    this.dropResources(v.x, v.z, v.y, { metal: data.VEHICLES[v.kind].drop });
    if (sourcePlayer && sourcePlayer.ws) send(sourcePlayer.ws, { t: "notice", text: `Destroyed a ${data.VEHICLES[v.kind].label}!` });
  }

  toggleRide(p) {
    const notice = (text) => { if (p.ws) send(p.ws, { t: "notice", text }); };
    const inVehicle = this.vehicleOf(p);
    if (inVehicle) {
      this.exitVehicle(p, inVehicle);
      return;
    }
    const current = p.riding ? this.bbById(p.riding) : null;
    if (current) {
      this.dismount(p, current);
      return;
    }
    const nearVehicles = this.vehicles
      .filter((v) => Math.abs(v.y - p.y) < 2.5 && Math.hypot(v.x - p.x, v.z - p.z) <= data.VEHICLES[v.kind].radius + RIDE_REACH)
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    const open = nearVehicles.find((v) => v.seats.includes(0));
    if (open) {
      this.enterVehicle(p, open);
      return;
    }
    if (nearVehicles.length) {
      notice(`That ${data.VEHICLES[nearVehicles[0].kind].label} is full`);
      return;
    }
    const near = this.bbs
      .filter((bb) => bb.alive && bb.owner === p.id && !bb.rider && Math.hypot(bb.x - p.x, bb.z - p.z) <= bb.radius + RIDE_REACH)
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    const mount = near.find((bb) => bb.rideable);
    if (!mount) {
      notice(near.length ? `${near[0].name} is too small to ride` : "Walk up to one of your big B.B.s to ride it");
      return;
    }
    p.riding = mount.id;
    mount.rider = p.id;
    p.vy = 0;
    notice(`Riding ${mount.name}`);
  }

  dismount(p, mount) {
    p.riding = 0;
    if (!mount) return;
    mount.rider = 0;
    const pos = {
      x: mount.x - Math.cos(p.yaw) * (mount.radius + 0.8),
      z: mount.z + Math.sin(p.yaw) * (mount.radius + 0.8)
    };
    mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, p.y, this.doors);
    p.x = pos.x;
    p.z = pos.z;
    p.vy = 0;
  }

  nearestDoor(p, range = 3.4) {
    let best = null;
    let bestD = range;
    this.doors.forEach((door) => {
      if (door.broken || Math.abs(door.y - p.y) > 2.5) return;
      const d = Math.hypot(door.x - p.x, door.z - p.z);
      if (d < bestD) {
        bestD = d;
        best = door;
      }
    });
    return best;
  }

  toggleDoor(p) {
    const door = this.nearestDoor(p);
    if (!door) return false;
    door.open = !door.open;
    this.events.push({ k: "door", id: door.id, open: door.open });
    return true;
  }

  damageWorldProps(p, rawDamage, inFront) {
    const damage = Math.max(HARVEST_MIN_DAMAGE, rawDamage);
    const hit = (tx, tz, range) => Math.abs(tx - p.x) <= range && Math.abs(tz - p.z) <= range && inFront(tx, tz, range) && Math.hypot(tx - p.x, tz - p.z) <= range;
    const range = data.MELEE_RANGE + 0.8;
    const smash = (list, kind, reach, drops, heightOk = (entry) => Math.abs(entry.y - p.y) <= 3) => {
      list.forEach((entry) => {
        if (entry.broken || !heightOk(entry) || !hit(entry.x, entry.z, reach)) return;
        entry.hp -= damage;
        if (entry.hp > 0) return;
        entry.broken = true;
        this.events.push({ k: "break", kind, id: entry.id });
        this.dropResources(entry.x, entry.z, entry.y, drops(entry));
      });
    };
    smash(this.doors, "door", range, () => WORLD_DROPS.door, (door) => Math.abs(door.y - p.y) <= 2.5);
    this.doors.forEach((door) => { if (door.broken) door.open = true; });
    smash(this.props, "prop", range, (prop) => PROP_DROPS[prop.type] || { wood: 1 }, (prop) => Math.abs(prop.y - p.y) <= 2.5);
    smash(this.stoplights, "light", range + 0.5, () => WORLD_DROPS.light);
    smash(this.map.trees, "tree", range + 0.7, () => WORLD_DROPS.tree);
    smash(this.map.rocks, "rock", range + 1.2, () => WORLD_DROPS.rock);
    smash(this.map.lamps, "lamp", range + 0.3, () => WORLD_DROPS.lamp);
    smash(this.map.cars, "car", range + 1.8, () => WORLD_DROPS.car);
    this.map.carBlocks.forEach((block) => { if (this.map.cars[block.car].broken) block.broken = true; });
    const half = data.BLOCK_SIZE / 2;
    [...this.map.blocks].forEach((block) => {
      if (block.y > p.y + 2.4 || block.y + block.h < p.y - 0.6) return;
      const nx = Math.max(block.x - half, Math.min(p.x, block.x + half));
      const nz = Math.max(block.z - half, Math.min(p.z, block.z + half));
      if (Math.hypot(nx - p.x, nz - p.z) > data.MELEE_RANGE) return;
      if (!inFront(block.x, block.z, range + half)) return;
      this.damageBlock(block, damage);
    });
  }

  damageWorldCar(car, damage) {
    car.hp -= damage;
    if (car.hp > 0) return;
    car.broken = true;
    this.map.carBlocks.forEach((block) => { if (block.car === car.id) block.broken = true; });
    this.events.push({ k: "break", kind: "car", id: car.id });
    this.dropResources(car.x, car.z, car.y, WORLD_DROPS.car);
  }

  dropResources(x, z, y, drops) {
    if (drops.wood) this.dropLoot(x, z, "Wood", y, drops.wood);
    if (drops.metal) this.dropLoot(x, z, "Metal", y, drops.metal);
  }

  blockPayload(block) {
    return { id: block.id, mat: block.mat, x: block.x, z: block.z, y: block.y, hp: Math.ceil(block.hp), maxHp: block.maxHp };
  }

  damageBlock(block, damage) {
    block.hp -= damage;
    if (block.hp > 0) {
      this.events.push({ k: "blockhit", id: block.id, hp: Math.ceil(block.hp) });
      return;
    }
    const index = this.map.blocks.indexOf(block);
    if (index < 0) return;
    this.map.blocks.splice(index, 1);
    this.events.push({ k: "block-", id: block.id });
    this.dropResources(block.x, block.z, block.y, { [block.mat]: data.BUILD_BLOCKS[block.mat].cost });
  }

  blockOnSegment(ax, ay, az, bx, by, bz) {
    if (!this.map.blocks.length) return null;
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) / 0.8));
    const half = data.BLOCK_SIZE / 2;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      const z = az + (bz - az) * t;
      for (const block of this.map.blocks) {
        if (Math.abs(x - block.x) <= half && Math.abs(z - block.z) <= half && y >= block.y && y <= block.y + block.h) return block;
      }
    }
    return null;
  }

  build(p, mat) {
    if (p.riding || p.vehicle) return;
    if (data.VEHICLES[mat]) {
      this.buildVehicle(p, mat);
      return;
    }
    const spec = data.BUILD_BLOCKS[mat];
    if (!spec) return;
    const notice = (text) => send(p.ws, { t: "notice", text });
    const now = this.elapsed();
    if (now - p.lastBuildAt < BUILD_COOLDOWN_MS) return;
    if (p[mat] < spec.cost) {
      notice(`Need ${spec.cost} ${spec.item.toLowerCase()} to build (you have ${p[mat]})`);
      return;
    }
    const size = data.BLOCK_SIZE;
    const height = data.BLOCK_HEIGHT;
    const half = size / 2;
    const tx = p.x + Math.sin(p.yaw) * BUILD_REACH;
    const tz = p.z + Math.cos(p.yaw) * BUILD_REACH;
    const x = (Math.floor(tx / size) + 0.5) * size;
    const z = (Math.floor(tz / size) + 0.5) * size;
    if (Math.abs(x) > mapGen.MAP_HALF - size || Math.abs(z) > mapGen.MAP_HALF - size) return;
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]];
    if (corners.some(([cx, cz]) => mapGen.buildingAt(this.map, x + cx * (half - 0.05), z + cz * (half - 0.05)))) {
      notice("Can't build inside buildings");
      return;
    }
    const ground = mapGen.terrainHeight(this.map, x, z);
    let y = p.y - ground > height * 0.5 ? Math.max(ground, p.y - height) : ground;
    const sameCell = this.map.blocks.filter((block) => block.x === x && block.z === z);
    let moved = true;
    while (moved) {
      moved = false;
      for (const block of sameCell) {
        if (y < block.y + block.h - 0.01 && y + height > block.y + 0.01) {
          y = block.y + block.h;
          moved = true;
        }
      }
    }
    if (y > ground + MAX_BLOCK_STACK * height) {
      notice("Too high to build");
      return;
    }
    const blocked = (ex, ez, ey, eh, r) => Math.abs(ex - x) < half + r && Math.abs(ez - z) < half + r && ey < y + height && ey + eh > y;
    if (this.players.some((other) => other.alive && blocked(other.x, other.z, other.y, mapGen.PLAYER_HEIGHT, PLAYER_RADIUS - 0.05))
      || this.bbs.some((bb) => bb.alive && blocked(bb.x, bb.z, bb.y, bb.height, Math.min(bb.radius, BB_MAX_COLLIDE) - 0.05))
      || this.vehicles.some((v) => blocked(v.x, v.z, v.y, 2, data.VEHICLES[v.kind].radius - 0.05))) {
      notice("Something is in the way");
      return;
    }
    p[mat] -= spec.cost;
    p.lastBuildAt = now;
    const block = { id: this.nextId++, mat, owner: p.id, x, z, y: round2(y), w: size, d: size, h: height, hp: spec.hp, maxHp: spec.hp };
    this.map.blocks.push(block);
    this.events.push({ k: "block+", ...this.blockPayload(block) });
  }

  collectResource(p, entry) {
    if (entry.item === "Wood") p.wood += entry.amount || 1;
    else p.metal += entry.amount || 1;
    this.loot.delete(entry.id);
    this.events.push({ k: "loot-", id: entry.id });
  }

  autoCollectResources() {
    if (!this.loot.size) return;
    const piles = [...this.loot.values()].filter((entry) => data.isResourceName(entry.item));
    if (!piles.length) return;
    this.players.forEach((p) => {
      if (!p.alive || p.riding || p.zombie) return;
      piles.forEach((entry) => {
        if (!this.loot.has(entry.id) || Math.abs(entry.y - p.y) > 2) return;
        if (Math.hypot(entry.x - p.x, entry.z - p.z) <= RESOURCE_COLLECT_RANGE) this.collectResource(p, entry);
      });
    });
  }

  aliveCount() {
    return this.players.filter((p) => p.alive).length;
  }

  playerDefense(p) {
    let defense = p.inv.reduce((sum, item) => sum + (item ? data.getWeaponDefense(item) : 0), 0);
    if (p.effect && p.effect.defense) defense += p.effect.defense;
    return defense;
  }

  heldItem(p) {
    return p.inv[p.held] || null;
  }

  attackDamage(p) {
    const item = this.heldItem(p);
    const base = item && !data.isPotionName(item) ? data.getWeaponDamage(item) : 0;
    return base + (p.effect && p.effect.damage ? p.effect.damage : 0);
  }

  hasFireResist(p) {
    return Boolean(p.effect && p.effect.fireResist);
  }

  damagePlayer(target, amount, sourcePlayer, opts = {}) {
    if (!target.alive || amount <= 0 || target.vehicle) return;
    if (sourcePlayer && !this.isEnemy(sourcePlayer, target)) return;
    if (sourcePlayer && this.elapsed() < SPAWN_PROTECT_MS) return;
    const defense = opts.ignoreDefense ? 0 : this.playerDefense(target);
    const dealt = Math.max(amount * 0.15, amount - defense);
    target.hp -= dealt;
    this.events.push({ k: "hit", id: target.id });
    if (opts.stunMs) target.stunUntil = Math.max(target.stunUntil, this.elapsed() + opts.stunMs);
    if (opts.poison) target.poison = { until: this.elapsed() + 5000, dps: 2, source: sourcePlayer ? sourcePlayer.id : 0 };
    if (target.hp <= 0) this.eliminate(target, sourcePlayer, opts.cause || "");
  }

  damageBb(bb, amount, sourcePlayer, opts = {}) {
    if (!bb.alive || amount <= 0) return;
    const dealt = Math.max(amount * 0.15, amount - (opts.ignoreDefense ? 0 : bb.defense));
    bb.hp -= dealt;
    this.events.push({ k: "hit", id: bb.id });
    if (sourcePlayer && bb.kind !== "pet") bb.aggro = sourcePlayer.id;
    if (bb.hp <= 0) {
      if (bb.kind === "wild" && sourcePlayer && sourcePlayer.alive && this.tame(bb, sourcePlayer)) return;
      bb.alive = false;
      this.events.push({ k: "bbdown", id: bb.id });
      const rider = bb.rider ? this.playerById(bb.rider) : null;
      if (rider) this.dismount(rider, bb);
    }
  }

  tame(bb, player) {
    const mine = this.bbs.filter((other) => other.alive && other.owner === player.id).length;
    if (mine >= data.MATCH_MAX_BBS) {
      if (player.ws) send(player.ws, { t: "notice", text: `Squad full (${data.MATCH_MAX_BBS} B.B.s) — ${bb.name} ran off` });
      return false;
    }
    bb.kind = "pet";
    bb.owner = player.id;
    bb.aggro = 0;
    bb.hp = bb.maxHp;
    this.events.push({ k: "tamed", id: bb.id, by: player.id });
    if (player.ws) send(player.ws, { t: "notice", text: `You tamed ${bb.name}! It fights for you this game.` });
    return true;
  }

  dropHeld(p) {
    const item = p.inv[p.held];
    if (!item) return;
    p.inv[p.held] = null;
    const id = this.nextId++;
    let lx = p.x + Math.sin(p.yaw) * 1.4;
    let lz = p.z + Math.cos(p.yaw) * 1.4;
    if (mapGen.segmentHitsWall(this.map, p.x, p.z, lx, lz, p.y + 1, this.doors)) {
      lx = p.x;
      lz = p.z;
    }
    const entry = { id, x: round2(lx), z: round2(lz), y: round2(mapGen.groundHeight(this.map, lx, lz, p.y + 0.5)), item };
    this.loot.set(id, entry);
    this.events.push({ k: "loot+", ...entry });
  }

  dropLoot(x, z, item, y, amount = 0) {
    const id = this.nextId++;
    const angle = this.rand() * Math.PI * 2;
    const dist = 0.6 + this.rand() * 1.8;
    let lx = x + Math.cos(angle) * dist;
    let lz = z + Math.sin(angle) * dist;
    if (mapGen.segmentHitsWall(this.map, x, z, lx, lz, y === undefined ? undefined : y + 1, this.doors)) {
      lx = x;
      lz = z;
    }
    const entry = { id, x: round2(lx), z: round2(lz), y: round2(mapGen.groundHeight(this.map, lx, lz, y)), item };
    if (amount) entry.amount = amount;
    this.loot.set(id, entry);
    this.events.push({ k: "loot+", ...entry });
  }

  eliminateZombie(p, killer) {
    p.alive = false;
    if (killer && !killer.zombie && killer.alive) {
      killer.coins += ZOMBIE_KILL_COINS;
      killer.kills += 1;
    }
    this.events.push({ k: "kill", a: killer && !killer.zombie ? killer.id : 0, b: p.id, cause: "Zombie down" });
    const roll = this.rand();
    if (roll < 0.12) this.dropLoot(p.x, p.z, rollLoot(this.rand), p.y);
    else if (roll < 0.4) this.dropResources(p.x, p.z, p.y, this.rand() < 0.5 ? { wood: 2 } : { metal: 2 });
  }

  eliminate(p, killer, cause) {
    if (!p.alive) return;
    if (p.zombie) {
      this.eliminateZombie(p, killer);
      return;
    }
    const place = this.aliveCount();
    if (p.vehicle) this.exitVehicle(p, this.vehicleOf(p));
    p.alive = false;
    p.place = place;
    p.inv.forEach((item) => { if (item) this.dropLoot(p.x, p.z, item, p.y); });
    p.inv = p.inv.map(() => null);
    this.dropResources(p.x, p.z, p.y, { wood: p.wood, metal: p.metal });
    p.wood = 0;
    p.metal = 0;
    this.bbs.forEach((bb) => {
      if (bb.owner === p.id && bb.alive) {
        bb.alive = false;
        this.events.push({ k: "bbdown", id: bb.id });
      }
    });
    if (killer && killer !== p && killer.alive) {
      killer.coins += data.MATCH_KILL_COINS;
      killer.kills += 1;
    }
    this.events.push({ k: "kill", a: killer && killer !== p ? killer.id : 0, b: p.id, cause });
    this.finishPlayer(p, killer && killer !== p ? killer.name : cause);
    if (this.zombies) {
      if (!this.squadAlive().some((entry) => !entry.bot)) this.end();
      return;
    }
    const remaining = this.players.filter((entry) => entry.alive);
    if (remaining.length === 1) {
      const winner = remaining[0];
      winner.place = 1;
      this.finishPlayer(winner, "");
      this.end();
    } else if (remaining.length === 0) {
      this.end();
    }
  }

  finishPlayer(p, killedBy) {
    if (!p.ws) return;
    if (this.zombies) {
      const survivedMs = this.elapsed();
      send(p.ws, {
        t: "end",
        mode: this.mode,
        map: this.mapId,
        kills: p.kills,
        killedBy,
        survivedMs,
        wave: this.wave,
        reward: zombieReward(survivedMs, this.wave),
        diamonds: 0
      });
      p.ws.matchPlayer = null;
      return;
    }
    const reward = this.mode === "fun"
      ? 0
      : this.mode === "competitive"
        ? data.getPlacementReward(data.COMPETITIVE_PAYOUTS, this.mapId, p.place)
        : data.getPlacementReward(data.RANKED_STARS, this.mapId, p.place);
    if (this.mode === "ranked" && reward > 0) {
      Promise.resolve(this.awardStars(p.name, reward)).catch(() => {});
    }
    send(p.ws, {
      t: "end",
      place: p.place,
      total: this.players.length,
      kills: p.kills,
      killedBy,
      mode: this.mode,
      map: this.mapId,
      reward,
      diamonds: this.mode === "fun" ? 0 : data.getPlacementReward(data.MATCH_DIAMOND_REWARDS, this.mapId, p.place)
    });
    p.ws.matchPlayer = null;
  }

  end() {
    if (this.finished) return;
    this.finished = true;
    setTimeout(() => {
      clearInterval(this.timer);
      this.onFinish(this);
    }, 4000);
  }

  disconnect(ws) {
    if (ws.replaced) return;
    const p = this.players.find((entry) => entry.ws === ws);
    if (!p || !p.alive) return;
    p.ws = null;
    p.disconnectedAt = Date.now();
    p.input = { mx: 0, mz: 0, yaw: p.yaw, pitch: p.pitch, jump: false, attack: false, sprint: false };
  }

  resumePlayer(conn) {
    const p = this.players.find((entry) => entry.name.toLowerCase() === conn.username.toLowerCase() && entry.alive);
    if (!p) return false;
    if (p.ws && p.ws !== conn.ws) {
      p.ws.replaced = true;
      p.ws.matchPlayer = null;
    }
    p.ws = conn.ws;
    p.disconnectedAt = 0;
    conn.match = this;
    conn.ws.matchPlayer = p;
    const roster = this.players.map((entry) => ({ id: entry.id, name: entry.name, avatar: entry.avatar, skin: entry.skin, bot: Boolean(entry.bot), zombie: entry.zombie ? 1 : 0 }));
    send(conn.ws, {
      t: "start",
      matchId: this.id,
      mode: this.mode,
      map: this.mapId,
      seed: this.seed,
      you: p.id,
      roster,
      bbCatalog: BB_CATALOG.map((bb) => bb.name),
      resumed: true
    });
    send(conn.ws, { t: "state", ...this.snapshotState() });
    send(conn.ws, { t: "notice", text: "Reconnected to your match." });
    return true;
  }

  handleMessage(ws, msg) {
    const p = this.players.find((entry) => entry.ws === ws);
    if (!p || !p.alive) return;
    if (msg.t === "input") {
      p.input = {
        mx: Math.max(-1, Math.min(1, Number(msg.mx) || 0)),
        mz: Math.max(-1, Math.min(1, Number(msg.mz) || 0)),
        yaw: Number(msg.yaw) || 0,
        pitch: Math.max(-1.2, Math.min(1.2, Number(msg.pitch) || 0)),
        jump: Boolean(msg.jump),
        attack: Boolean(msg.attack),
        sprint: Boolean(msg.sprint)
      };
    } else if (msg.t === "select") {
      const slot = Math.floor(Number(msg.slot));
      if (slot >= 0 && slot < data.MATCH_INVENTORY_SLOTS) p.held = slot;
    } else if (msg.t === "door") {
      this.toggleDoor(p);
    } else if (msg.t === "pickup") {
      this.pickup(p, msg.id ? Number(msg.id) : 0);
    } else if (msg.t === "buy") {
      this.buy(p, String(msg.kind || ""), String(msg.name || ""));
    } else if (msg.t === "ride") {
      this.toggleRide(p);
    } else if (msg.t === "drop") {
      this.dropHeld(p);
    } else if (msg.t === "build") {
      this.build(p, String(msg.mat || ""));
    }
  }

  freeSlot(p) {
    if (!p.inv[p.held]) return p.held;
    return p.inv.findIndex((item) => !item);
  }

  pickup(p, lootId) {
    let target = null;
    if (lootId) {
      const entry = this.loot.get(lootId);
      if (entry && Math.hypot(entry.x - p.x, entry.z - p.z) <= PICKUP_RANGE && Math.abs(entry.y - p.y) < 2.5) target = entry;
    } else {
      let best = PICKUP_RANGE;
      this.loot.forEach((entry) => {
        if (Math.abs(entry.y - p.y) >= 2.5) return;
        const d = Math.hypot(entry.x - p.x, entry.z - p.z);
        if (d <= best) {
          best = d;
          target = entry;
        }
      });
    }
    if (!target) return false;
    if (data.isResourceName(target.item)) {
      this.collectResource(p, target);
      return true;
    }
    const slot = this.freeSlot(p);
    if (slot < 0) {
      if (p.ws) send(p.ws, { t: "notice", text: "Inventory full (8/8)" });
      return false;
    }
    p.inv[slot] = target.item;
    this.loot.delete(target.id);
    this.events.push({ k: "loot-", id: target.id });
    return true;
  }

  buy(p, kind, name) {
    let price = 0;
    if (kind === "weapon" && data.WEAPON_SHOP_ITEMS.includes(name)) price = data.getWeaponInGameShopPrice(name);
    else if (kind === "potion" && data.isPotionName(name)) price = data.POTION_IN_GAME_PRICE[name];
    else if (kind === "bb") {
      const def = BB_CATALOG.find((bb) => bb.name === name);
      if (!def) return;
      price = data.getBbInGamePrice(def);
    } else return;
    const notice = (text) => send(p.ws, { t: "notice", text });
    if (p.coins < price) return notice("Not enough in-game coins");
    if (kind === "bb") {
      const mine = this.bbs.filter((bb) => bb.owner === p.id && bb.alive).length;
      if (mine >= data.MATCH_MAX_BBS) return notice(`You can only have ${data.MATCH_MAX_BBS} B.B.s`);
      p.coins -= price;
      this.spawnBb(p, name);
      return notice(`${name} joined your squad`);
    }
    const slot = this.freeSlot(p);
    if (slot < 0) return notice("Inventory full (8/8)");
    p.coins -= price;
    p.inv[slot] = name;
    notice(`Bought ${name}`);
  }

  drinkPotion(p) {
    const item = this.heldItem(p);
    const effect = data.POTION_EFFECTS[item];
    if (!effect) return;
    p.inv[p.held] = null;
    if (effect.bonusHp) {
      p.maxHp += effect.bonusHp;
      p.hp += effect.bonusHp;
    } else if (effect.heal) {
      p.hp = Math.min(p.maxHp, p.hp + effect.heal);
    } else {
      p.effect = { name: item, ...effect, until: this.elapsed() + effect.durationMs };
    }
    this.events.push({ k: "drink", id: p.id, item });
  }

  attack(p, now) {
    const vehicle = this.vehicleOf(p);
    if (vehicle) {
      this.fireVehicleGun(p, vehicle, now);
      return;
    }
    const item = this.heldItem(p);
    if (item && data.isPotionName(item)) {
      if (now - p.lastAttackAt < 600) return;
      p.lastAttackAt = now;
      this.drinkPotion(p);
      return;
    }
    const ranged = item ? data.getWeaponRanged(item) : null;
    const tuning = this.botTuning();
    const cooldown = (ranged ? ranged.cooldownMs : data.MELEE_COOLDOWN_MS) * (p.bot ? tuning.cooldownScale : 1);
    if (now - p.lastAttackAt < cooldown) return;
    p.lastAttackAt = now;
    p.swingUntil = now + 250;
    const damage = this.attackDamage(p) * (p.bot ? tuning.damageScale : 1);
    const yaw = p.input.yaw;
    if (ranged) {
      const speed = ranged.speed;
      const pitch = p.input.pitch;
      this.projectiles.push({
        id: this.nextId++,
        owner: p.id,
        item,
        damage,
        x: p.x + Math.sin(yaw) * 0.8,
        y: p.y + 1.3,
        z: p.z + Math.cos(yaw) * 0.8,
        vx: Math.sin(yaw) * Math.cos(pitch) * speed,
        vy: Math.sin(pitch) * speed,
        vz: Math.cos(yaw) * Math.cos(pitch) * speed,
        left: ranged.range
      });
      if (data.isWeaponSingleUse(item)) p.inv[p.held] = null;
      return;
    }
    const inFront = (tx, tz, range) => {
      const dx = tx - p.x;
      const dz = tz - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range) return false;
      if (dist < 0.8) return true;
      return Math.abs(angleDiff(Math.atan2(dx, dz), yaw)) < 0.9;
    };
    this.map.chests.forEach((chest) => {
      if (this.chestsOpen.has(chest.id) || Math.abs(chest.y - p.y) > 2.5) return;
      if (inFront(chest.x, chest.z, data.MELEE_RANGE + 0.6)) this.openChest(chest);
    });
    const mySeat = this.seatHeight(p);
    this.players.forEach((target) => {
      if (target === p || !target.alive || target.vehicle) return;
      if (Math.abs(target.y - p.y) > 2.5 + Math.max(mySeat, this.seatHeight(target))) return;
      if (inFront(target.x, target.z, data.MELEE_RANGE)) this.applyWeaponHit(p, item, damage, target, null);
    });
    this.vehicles.forEach((v) => {
      if (Math.abs(v.y - p.y) > 3) return;
      if (inFront(v.x, v.z, data.MELEE_RANGE + data.VEHICLES[v.kind].radius)) this.damageVehicle(v, Math.max(VEHICLE_MIN_DAMAGE, damage), p);
    });
    this.bbs.forEach((bb) => {
      if (!bb.alive || bb.owner === p.id) return;
      if (inFront(bb.x, bb.z, data.MELEE_RANGE + bb.radius)) this.applyWeaponHit(p, item, damage, null, bb);
    });
    this.damageWorldProps(p, damage * 0.9, inFront);
  }

  applyWeaponHit(p, item, damage, targetPlayer, targetBb) {
    if (targetBb) {
      this.damageBb(targetBb, damage * (item ? data.getWeaponBbDamageMultiplier(item) : 1), p);
      return;
    }
    this.damagePlayer(targetPlayer, damage, p, {
      stunMs: item === "Stun Baton" ? 2000 : 0,
      poison: item === "Blowdart"
    });
  }

  openChest(chest) {
    this.chestsOpen.add(chest.id);
    const rare = Boolean(chest.rare);
    this.events.push({ k: "chest", id: chest.id, rare: rare ? 1 : 0 });
    if (rare) {
      const count = 3 + Math.floor(this.rand() * 3);
      for (let i = 0; i < count; i += 1) this.dropLoot(chest.x, chest.z, rollRareLoot(this.rand), chest.y);
      if (this.rand() < 0.4) this.dropLoot(chest.x, chest.z, rollRareLoot(this.rand), chest.y);
    } else {
      const count = 1 + Math.floor(this.rand() * 3);
      for (let i = 0; i < count; i += 1) this.dropLoot(chest.x, chest.z, rollLoot(this.rand), chest.y);
    }
  }

  movePlayer(p, dt, now) {
    const stunned = now < p.stunUntil;
    const input = p.input;
    p.yaw = input.yaw;
    p.pitch = input.pitch;
    let mx = stunned ? 0 : input.mx;
    let mz = stunned ? 0 : input.mz;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const vehicle = this.vehicleOf(p);
    if (vehicle) {
      if (p.seat === 0) this.driveVehicle(p, vehicle, mx, mz, dt);
      else vehicle.aim = p.input.yaw;
      this.placeOccupant(p, vehicle);
      return;
    }
    if (p.vehicle) p.vehicle = 0;
    const mount = p.riding ? this.bbById(p.riding) : null;
    if (mount) {
      this.moveMount(p, mount, mx, mz, dt);
      return;
    }
    if (p.riding) p.riding = 0;
    const before = { x: p.x, z: p.z };
    const sprintHeld = !stunned && input.sprint && len > 0;
    if (sprintHeld && now >= p.sprintCooldownUntil && !p.sprintActiveUntil) p.sprintActiveUntil = now + SPRINT_DURATION_MS;
    if (!sprintHeld && p.sprintActiveUntil && now < p.sprintActiveUntil) {
      p.sprintActiveUntil = 0;
      p.sprintCooldownUntil = now + SPRINT_COOLDOWN_MS;
    }
    let speed = p.zombie ? p.zombie.speed : PLAYER_SPEED;
    if (p.sprintActiveUntil) {
      if (sprintHeld && now < p.sprintActiveUntil) speed *= SPRINT_BOOST;
      else if (now >= p.sprintActiveUntil) {
        p.sprintActiveUntil = 0;
        p.sprintCooldownUntil = now + SPRINT_COOLDOWN_MS;
      }
    }
    const pos = { x: p.x + mx * speed * dt, z: p.z + mz * speed * dt };
    const wanted = { x: pos.x, z: pos.z };
    mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, p.y, this.doors);
    p.touchingWall = Math.hypot(pos.x - wanted.x, pos.z - wanted.z) > 0.001;
    p.x = pos.x;
    p.z = pos.z;
    const ground = mapGen.groundHeight(this.map, p.x, p.z, p.y);
    const ceiling = mapGen.ceilingHeight(this.map, p.x, p.z, p.y);
    const hasJetpack = p.inv.includes("Jetpack");
    const hasHook = p.inv.includes("Grappling Hook");
    const onGround = p.y <= ground + 0.05;
    const wasGrounded = p.grounded;
    if (!stunned && input.jump) {
      if (hasJetpack && p.y < ground + 30) p.vy = Math.min(p.vy + 45 * dt, 7);
      else if (onGround) p.vy = JUMP_SPEED;
      else if (hasHook && p.touchingWall) p.vy = 12;
    }
    p.vy -= GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.vy > 0 && p.y + mapGen.PLAYER_HEIGHT > ceiling) {
      p.y = Math.max(ground, ceiling - mapGen.PLAYER_HEIGHT);
      p.vy = 0;
    }
    if (p.y <= ground || (wasGrounded && p.vy <= 0 && p.y - ground < 0.55)) {
      p.y = ground;
      p.vy = 0;
    }
    p.grounded = p.y <= ground + 0.01;
    p.moved = Math.hypot(p.x - before.x, p.z - before.z);
  }

  moveMount(p, mount, mx, mz, dt) {
    const speed = Math.max(mount.speed * 1.25, PLAYER_SPEED);
    const pos = { x: mount.x + mx * speed * dt, z: mount.z + mz * speed * dt };
    mapGen.resolveCollision(this.map, pos, Math.min(mount.radius, BB_MAX_COLLIDE), mount.y, this.doors);
    p.moved = Math.hypot(pos.x - mount.x, pos.z - mount.z);
    mount.x = pos.x;
    mount.z = pos.z;
    mount.y = mapGen.groundHeight(this.map, mount.x, mount.z, mount.y);
    if (mx || mz) mount.yaw = Math.atan2(mx, mz);
    p.x = mount.x;
    p.z = mount.z;
    p.y = mount.y + mount.height * RIDER_SEAT;
    p.vy = 0;
    p.touchingWall = false;
  }

  stepBbToward(bb, gx, gz, stopAt, speed, dt) {
    const dx = gx - bb.x;
    const dz = gz - bb.z;
    const dist = Math.hypot(dx, dz);
    if (dist > stopAt) {
      const step = Math.min(dist - stopAt, speed * dt);
      const pos = { x: bb.x + (dx / dist) * step, z: bb.z + (dz / dist) * step };
      mapGen.resolveCollision(this.map, pos, Math.min(bb.radius, BB_MAX_COLLIDE), bb.y, this.doors);
      bb.x = pos.x;
      bb.z = pos.z;
      bb.yaw = Math.atan2(dx, dz);
    }
    bb.y = mapGen.groundHeight(this.map, bb.x, bb.z, bb.y);
    return dist;
  }

  moveWildBb(bb, dt) {
    const now = this.elapsed();
    const home = bb.home;
    let target = bb.aggro ? this.playerById(bb.aggro) : null;
    const leash = bb.kind === "guard" ? GUARD_LEASH : WILD_LEASH;
    if (target && (!target.alive || Math.hypot(target.x - home.x, target.z - home.z) > leash)) target = null;
    if (!target && bb.kind === "guard" && now >= SPAWN_PROTECT_MS) {
      let best = GUARD_AGGRO;
      this.players.forEach((p) => {
        if (!p.alive || Math.abs(p.y - home.y) > 3) return;
        const d = Math.hypot(p.x - home.x, p.z - home.z);
        if (d < best) {
          best = d;
          target = p;
        }
      });
    }
    bb.aggro = target ? target.id : 0;
    if (target) {
      const stopAt = 1 + bb.radius;
      const dist = this.stepBbToward(bb, target.x, target.z, stopAt, bb.speed, dt);
      bb.yaw = Math.atan2(target.x - bb.x, target.z - bb.z);
      if (dist <= stopAt + 0.6 && Math.abs(target.y - bb.y) < 2.5) {
        this.damagePlayer(target, bb.damage * (dt * 1000 / bb.attackMs), null, { cause: bb.name });
      }
      return;
    }
    if (bb.kind === "guard") {
      this.stepBbToward(bb, home.x, home.z, 1.5 + bb.radius, bb.speed, dt);
      if (bb.hp < bb.maxHp) bb.hp = Math.min(bb.maxHp, bb.hp + bb.maxHp * 0.05 * dt);
      return;
    }
    if (!bb.roamGoal || this.rand() < 0.004) {
      const a = this.rand() * Math.PI * 2;
      const r = this.rand() * WILD_ROAM;
      bb.roamGoal = { x: home.x + Math.cos(a) * r, z: home.z + Math.sin(a) * r, waitUntil: now + 1500 + this.rand() * 3000 };
    }
    if (now < bb.roamGoal.waitUntil) return;
    if (this.stepBbToward(bb, bb.roamGoal.x, bb.roamGoal.z, 0.5, bb.speed * 0.4, dt) <= 0.6) bb.roamGoal = null;
  }

  moveBb(bb, dt) {
    if (bb.kind !== "pet") {
      this.moveWildBb(bb, dt);
      return;
    }
    const owner = this.playerById(bb.owner);
    if (!owner || !owner.alive) return;
    let target = null;
    let best = 22;
    this.players.forEach((other) => {
      if (!other.alive || other.id === bb.owner || !this.isEnemy(owner, other)) return;
      const d = Math.hypot(other.x - bb.x, other.z - bb.z);
      if (d < best && Math.hypot(other.x - owner.x, other.z - owner.z) < 30) {
        best = d;
        target = { kind: "player", ref: other };
      }
    });
    this.bbs.forEach((other) => {
      if (!other.alive || other.owner === bb.owner || !this.bbHostileTo(other, bb.owner)) return;
      const d = Math.hypot(other.x - bb.x, other.z - bb.z);
      if (d < best) {
        best = d;
        target = { kind: "bb", ref: other };
      }
    });
    let gx = owner.x;
    let gz = owner.z;
    let stopAt = 3 + bb.radius;
    if (target) {
      gx = target.ref.x;
      gz = target.ref.z;
      stopAt = 1 + bb.radius + (target.kind === "bb" ? target.ref.radius : 0);
    }
    const dx = gx - bb.x;
    const dz = gz - bb.z;
    const dist = Math.hypot(dx, dz);
    if (!bb.rider) {
      if (dist > stopAt) {
        const step = Math.min(dist - stopAt, bb.speed * dt);
        const pos = { x: bb.x + (dx / dist) * step, z: bb.z + (dz / dist) * step };
        mapGen.resolveCollision(this.map, pos, Math.min(bb.radius, BB_MAX_COLLIDE), bb.y, this.doors);
        bb.x = pos.x;
        bb.z = pos.z;
      }
      if (dist > 60) {
        bb.x = owner.x + 1.5 + bb.radius;
        bb.z = owner.z + 1.5 + bb.radius;
        bb.y = owner.y;
      }
      bb.y = mapGen.groundHeight(this.map, bb.x, bb.z, bb.y);
      bb.yaw = Math.atan2(dx, dz);
    }
    if (target && dist <= stopAt + 0.6) {
      const amount = bb.damage * (dt * 1000 / bb.attackMs);
      if (target.kind === "player") this.damagePlayer(target.ref, amount, owner, { cause: bb.name });
      else this.damageBb(target.ref, amount, owner);
    }
  }

  hazardTick(hazard, dt, now) {
    const waterSurface = Math.max(hazard.waterLevel || 0, 0);
    const inHazard = (x, z, y, fireResist) => {
      const ground = mapGen.terrainHeight(this.map, x, z);
      if (mapGen.oceanEntryBlocked(this.mapId) && mapGen.inOcean(this.map, x, z)) {
        return { dps: mapGen.LAVA_DPS, cause: "Ocean" };
      }
      if (waterSurface > 0) {
        const standing = mapGen.groundHeight(this.map, x, z, y);
        const submerged = y < waterSurface + 0.55 || standing < waterSurface + 0.35;
        if (submerged) return { dps: mapGen.WATER_DPS, cause: "Drowned" };
      }
      if (hazard.lavaRadius && Math.hypot(x, z) < hazard.lavaRadius && !fireResist && y < ground + 1.5) {
        return { dps: mapGen.LAVA_DPS, cause: "Lava" };
      }
      return null;
    };
    this.players.forEach((p) => {
      if (!p.alive) return;
      const hit = inHazard(p.x, p.z, p.y, this.hasFireResist(p));
      if (hit) this.damagePlayer(p, hit.dps * dt, null, { ignoreDefense: true, cause: hit.cause });
      if (p.alive && p.poison) {
        if (now > p.poison.until) p.poison = null;
        else this.damagePlayer(p, p.poison.dps * dt, this.playerById(p.poison.source), { ignoreDefense: true, cause: "Poison" });
      }
      if (p.effect && now > p.effect.until) p.effect = null;
    });
    this.bbs.forEach((bb) => {
      if (!bb.alive) return;
      const hit = inHazard(bb.x, bb.z, bb.y, false);
      if (hit) this.damageBb(bb, hit.dps * dt, null, { ignoreDefense: true });
    });
    [...this.vehicles].forEach((v) => {
      const hit = inHazard(v.x, v.z, v.y, false);
      if (hit) this.damageVehicle(v, hit.dps * dt, null);
    });

    if (!mapGen.HAZARDS[this.mapId].rocks || now < mapGen.HAZARDS[this.mapId].graceMs) return;
    if (now >= this.nextRockAt) {
      this.nextRockAt = now + ROCK_INTERVAL_MS;
      const alive = this.players.filter((p) => p.alive);
      const count = Math.min(alive.length, 2 + Math.floor(this.rand() * 4));
      for (let i = 0; i < count; i += 1) {
        const near = alive[Math.floor(this.rand() * alive.length)];
        const angle = this.rand() * Math.PI * 2;
        const dist = this.rand() * 9;
        this.rocks.push({
          id: this.nextId++,
          x: round2(near.x + Math.cos(angle) * dist),
          z: round2(near.z + Math.sin(angle) * dist),
          hitAt: now + mapGen.ROCK_WARNING_MS
        });
      }
    }
    this.rocks = this.rocks.filter((rock) => {
      if (now < rock.hitAt) return true;
      this.events.push({ k: "impact", x: rock.x, z: rock.z });
      this.players.forEach((p) => {
        if (p.alive && Math.hypot(p.x - rock.x, p.z - rock.z) <= mapGen.ROCK_RADIUS) {
          this.damagePlayer(p, mapGen.ROCK_DAMAGE, null, { ignoreDefense: true, stunMs: mapGen.ROCK_STUN_MS, cause: "Falling rock" });
        }
      });
      this.bbs.forEach((bb) => {
        if (bb.alive && Math.hypot(bb.x - rock.x, bb.z - rock.z) <= mapGen.ROCK_RADIUS) {
          this.damageBb(bb, mapGen.ROCK_DAMAGE, null, { ignoreDefense: true });
        }
      });
      [...this.vehicles].forEach((v) => {
        if (Math.hypot(v.x - rock.x, v.z - rock.z) <= mapGen.ROCK_RADIUS + data.VEHICLES[v.kind].radius) this.damageVehicle(v, mapGen.ROCK_DAMAGE, null);
      });
      return false;
    });
  }

  moveProjectiles(dt) {
    this.projectiles = this.projectiles.filter((proj) => {
      const owner = this.playerById(proj.owner);
      const stepX = proj.vx * dt;
      const stepY = proj.vy * dt;
      const stepZ = proj.vz * dt;
      const nx = proj.x + stepX;
      const ny = proj.y + stepY;
      const nz = proj.z + stepZ;
      const block = this.blockOnSegment(proj.x, proj.y, proj.z, nx, ny, nz);
      if (block) {
        this.damageBlock(block, proj.damage);
        return false;
      }
      if (mapGen.segmentHitsWall(this.map, proj.x, proj.z, nx, nz, ny, this.doors)) return false;
      if (ny < mapGen.groundHeight(this.map, nx, nz, proj.y)) return false;
      if (ny > mapGen.ceilingHeight(this.map, nx, nz, proj.y - 0.5)) return false;
      const stepLenSq = stepX * stepX + stepZ * stepZ;
      const closest = (px, pz) => {
        const t = stepLenSq > 0 ? Math.max(0, Math.min(1, ((px - proj.x) * stepX + (pz - proj.z) * stepZ) / stepLenSq)) : 1;
        return { d: Math.hypot(px - (proj.x + stepX * t), pz - (proj.z + stepZ * t)), y: proj.y + stepY * t };
      };
      const carDamage = proj.damage * data.getWeaponVehicleDamageMultiplier(proj.item);
      for (const v of this.vehicles) {
        if (v.id === proj.vehicle) continue;
        const hit = closest(v.x, v.z);
        if (hit.d < data.VEHICLES[v.kind].radius + 0.3 && hit.y > v.y - 0.2 && hit.y < v.y + 2.2) {
          this.damageVehicle(v, carDamage, owner);
          return false;
        }
      }
      for (const block of this.map.carBlocks) {
        const car = this.map.cars[block.car];
        if (!car || car.broken) continue;
        const hit = closest(block.x, block.z);
        if (hit.d < block.radius + 0.2 && hit.y > car.y - 0.2 && hit.y < car.y + 1.5) {
          this.damageWorldCar(car, carDamage);
          return false;
        }
      }
      for (const target of this.players) {
        if (!target.alive || target.id === proj.owner || target.vehicle || (owner && !this.isEnemy(owner, target))) continue;
        const hit = closest(target.x, target.z);
        if (hit.d < 0.9 && hit.y > target.y - 0.2 && hit.y < target.y + 2.2) {
          if (owner) this.applyWeaponHit(owner, proj.item, proj.damage, target, null);
          return false;
        }
      }
      for (const bb of this.bbs) {
        if (!bb.alive || bb.owner === proj.owner) continue;
        const hit = closest(bb.x, bb.z);
        if (hit.d < 0.5 + bb.radius && hit.y > bb.y - 0.2 && hit.y < bb.y + bb.height) {
          if (owner) this.applyWeaponHit(owner, proj.item, proj.damage, null, bb);
          return false;
        }
      }
      for (const chest of this.map.chests) {
        if (this.chestsOpen.has(chest.id)) continue;
        if (Math.hypot(chest.x - nx, chest.z - nz) < 1 && Math.abs(ny - chest.y - 0.4) < 1.2) {
          this.openChest(chest);
          return false;
        }
      }
      proj.x = nx;
      proj.y = ny;
      proj.z = nz;
      proj.left -= Math.hypot(stepX, stepY, stepZ);
      return proj.left > 0;
    });
  }

  botThink(p, hazard, now) {
    const bot = p.bot;
    const goTo = (x, z) => {
      const dx = x - p.x;
      const dz = z - p.z;
      const dist = Math.hypot(dx, dz) || 1;
      let ax = dx / dist;
      let az = dz / dist;
      if (now < bot.detourUntil) {
        const c = Math.cos(bot.detour);
        const s = Math.sin(bot.detour);
        [ax, az] = [ax * c - az * s, ax * s + az * c];
      }
      p.input.mx = ax;
      p.input.mz = az;
      return dist;
    };
    p.input.attack = false;
    p.input.jump = false;

    if (now > bot.stuckAt) {
      if (bot.lastPos && Math.hypot(p.x - bot.lastPos.x, p.z - bot.lastPos.z) < 1 && (p.input.mx || p.input.mz)) {
        bot.detourUntil = now + 1200;
        bot.detour = (this.rand() < 0.5 ? -1 : 1) * (1.2 + this.rand());
        p.input.jump = true;
      }
      bot.lastPos = { x: p.x, z: p.z };
      bot.stuckAt = now + 1500;
    }

    const ground = mapGen.terrainHeight(this.map, p.x, p.z);
    const r = Math.hypot(p.x, p.z);
    if (hazard.waterLevel && ground < hazard.waterLevel + 1.5) {
      goTo(p.x * 0.2, p.z * 0.2);
      return;
    }
    if (mapGen.oceanEntryBlocked(this.mapId) && mapGen.inOcean(this.map, p.x, p.z)) {
      const angle = Math.atan2(p.z, p.x);
      const inland = Math.max(8, mapGen.coastRadius(this.map.seed, angle) - 28);
      goTo(Math.cos(angle) * inland, Math.sin(angle) * inland);
      return;
    }
    if (hazard.lavaRadius && r < hazard.lavaRadius + 18) {
      goTo((p.x / (r || 1)) * (hazard.lavaRadius + 60), (p.z / (r || 1)) * (hazard.lavaRadius + 60));
      return;
    }
    const rock = this.rocks.find((entry) => Math.hypot(entry.x - p.x, entry.z - p.z) < mapGen.ROCK_RADIUS + 1.5);
    if (rock) {
      goTo(p.x + (p.x - rock.x) * 4, p.z + (p.z - rock.z) * 4);
      return;
    }

    if (p.hp < 55) {
      const healSlot = p.inv.findIndex((item) => {
        const potion = item && data.POTION_EFFECTS[item];
        return potion && (potion.heal || potion.bonusHp);
      });
      if (healSlot >= 0) {
        p.held = healSlot;
        p.input.attack = true;
        return;
      }
    }

    let bestSlot = -1;
    let bestDamage = -1;
    p.inv.forEach((item, index) => {
      if (!item || data.isPotionName(item)) return;
      const dmg = data.getWeaponDamage(item);
      if (dmg > bestDamage) {
        bestDamage = dmg;
        bestSlot = index;
      }
    });
    const effectSlot = p.inv.findIndex((item) => {
      const potion = item && data.POTION_EFFECTS[item];
      return potion && !potion.heal && !potion.bonusHp;
    });
    if (effectSlot >= 0 && !p.effect) {
      p.held = effectSlot;
      p.input.attack = true;
      return;
    }
    if (bestSlot >= 0) p.held = bestSlot;
    else {
      const empty = p.inv.findIndex((item) => !item);
      if (empty >= 0) p.held = empty;
    }

    let enemy = null;
    let enemyDist = now < SPAWN_PROTECT_MS ? 0 : this.botTuning().engageRange;
    this.players.forEach((other) => {
      if (!other.alive || !this.isEnemy(p, other)) return;
      const d = Math.hypot(other.x - p.x, other.z - p.z);
      if (d < enemyDist) {
        enemyDist = d;
        enemy = other;
      }
    });
    if (!enemy && !this.zombies) {
      this.bbs.forEach((bb) => {
        if (!bb.alive || bb.owner === p.id) return;
        const d = Math.hypot(bb.x - p.x, bb.z - p.z);
        if (d < Math.min(enemyDist, 10)) {
          enemyDist = d;
          enemy = bb;
        }
      });
    }
    if (enemy) {
      const held = this.heldItem(p);
      const ranged = held ? data.getWeaponRanged(held) : null;
      const want = ranged ? Math.min(ranged.range * 0.6, 18) : data.MELEE_RANGE * 0.7;
      if (now > bot.thinkAt) {
        bot.aimJitter = (this.rand() - 0.5) * 0.25;
        bot.thinkAt = now + 400;
      }
      p.input.yaw = Math.atan2(enemy.x - p.x, enemy.z - p.z) + bot.aimJitter;
      p.input.pitch = ranged ? Math.atan2((enemy.y || 0) + 1 - (p.y + 1.3), enemyDist) : 0;
      if (enemyDist > want) goTo(enemy.x, enemy.z);
      else {
        p.input.mx = 0;
        p.input.mz = 0;
      }
      if (enemyDist <= (ranged ? ranged.range : data.MELEE_RANGE)) p.input.attack = true;
      return;
    }

    if (this.zombies) {
      const leader = this.players.find((other) => other.alive && !other.zombie && !other.bot);
      if (leader && Math.hypot(leader.x - p.x, leader.z - p.z) > BOT_FOLLOW_RANGE) {
        p.input.yaw = Math.atan2(leader.x - p.x, leader.z - p.z);
        goTo(leader.x, leader.z);
        return;
      }
    }

    if (p.inv.some((item) => !item)) {
      let near = null;
      let nearDist = 40;
      this.loot.forEach((entry) => {
        if (Math.abs(entry.y - p.y) >= 2.5) return;
        const d = Math.hypot(entry.x - p.x, entry.z - p.z);
        if (d < nearDist) {
          nearDist = d;
          near = entry;
        }
      });
      if (near) {
        p.input.yaw = Math.atan2(near.x - p.x, near.z - p.z);
        if (goTo(near.x, near.z) < 1.5) this.pickup(p, near.id);
        return;
      }
    }

    let chest = null;
    let chestDist = 140;
    this.map.chests.forEach((entry) => {
      if (this.chestsOpen.has(entry.id) || Math.abs(entry.y - p.y) > 2.5) return;
      if (hazard.lavaRadius && Math.hypot(entry.x, entry.z) < hazard.lavaRadius + 25) return;
      if (hazard.waterLevel && mapGen.terrainHeight(this.map, entry.x, entry.z) < hazard.waterLevel + 1.5) return;
      const d = Math.hypot(entry.x - p.x, entry.z - p.z);
      if (d < chestDist) {
        chestDist = d;
        chest = entry;
      }
    });
    if (chest) {
      p.input.yaw = Math.atan2(chest.x - p.x, chest.z - p.z);
      if (goTo(chest.x, chest.z) < data.MELEE_RANGE) {
        p.input.mx = 0;
        p.input.mz = 0;
        p.input.attack = true;
      }
      return;
    }

    if (!bot.goal || Math.hypot(bot.goal.x - p.x, bot.goal.z - p.z) < 3) {
      bot.goal = mapGen.randomLandSpot(this.map, this.rand, hazard);
    }
    p.input.yaw = Math.atan2(bot.goal.x - p.x, bot.goal.z - p.z);
    goTo(bot.goal.x, bot.goal.z);
  }

  tick() {
    if (this.finished && this.players.every((p) => !p.alive || p.place === 1)) {
      this.broadcast();
      return;
    }
    const now = this.elapsed();
    const dt = TICK_MS / 1000;
    const hazard = this.hazardNow();
    this.players.forEach((p) => {
      if (!p.alive) return;
      if (p.disconnectedAt && !p.ws) {
        if (Date.now() - p.disconnectedAt > RECONNECT_GRACE_MS) this.eliminate(p, null, "Disconnected");
        return;
      }
      if (p.disconnectedAt) p.disconnectedAt = 0;
      if (p.zombie) {
        this.zombieThink(p, now);
        this.movePlayer(p, dt, now);
        return;
      }
      if (p.bot) this.botThink(p, hazard, now);
      this.movePlayer(p, dt, now);
      if (p.input.attack && now >= p.stunUntil) this.attack(p, now);
    });
    if (this.zombies && !this.finished) {
      const zombiesLeft = this.players.some((p) => p.alive && p.zombie);
      if (now >= this.nextWaveAt || (this.wave > 0 && !zombiesLeft && now < this.nextWaveAt - 8000)) {
        if (now >= this.nextWaveAt) this.spawnZombieWave(now);
        else this.nextWaveAt = now + 8000;
      }
    }
    this.vehicles.forEach((v) => {
      v.seats.forEach((id) => {
        const occupant = id ? this.playerById(id) : null;
        if (occupant && occupant.vehicle === v.id) this.placeOccupant(occupant, v);
      });
    });
    this.bbs.forEach((bb) => { if (bb.alive) this.moveBb(bb, dt); });
    this.moveProjectiles(dt);
    this.hazardTick(hazard, dt, now);
    this.autoCollectResources();
    this.bbs = this.bbs.filter((bb) => bb.alive);
    if (this.zombies) this.players = this.players.filter((p) => p.alive || !p.zombie);
    this.broadcast();
  }

  broadcast() {
    const now = this.elapsed();
    const players = this.players.filter((p) => p.alive).map((p) => [
      p.id, round2(p.x), round2(p.y), round2(p.z), round2(p.yaw), Math.ceil(p.hp), p.maxHp,
      this.heldItem(p) || "", now < p.stunUntil ? 1 : 0, now < p.swingUntil ? 1 : 0, p.riding || 0, p.vehicle || 0, p.seat || 0
    ]);
    const vehicles = this.vehicles.map((v) => [
      v.id, data.VEHICLE_KINDS.indexOf(v.kind), round2(v.x), round2(v.y), round2(v.z), round2(v.yaw), Math.ceil(v.hp), v.maxHp, round2(v.aim),
      v.seats.filter(Boolean).length
    ]);
    const bbs = this.bbs.map((bb) => [bb.id, bb.owner, bb.catalogIndex, round2(bb.x), round2(bb.y), round2(bb.z), Math.ceil(bb.hp), bb.maxHp, bb.rider || 0, round2(bb.yaw), BB_KIND_CODE[bb.kind]]);
    const proj = this.projectiles.map((pr) => [pr.id, round2(pr.x), round2(pr.y), round2(pr.z), pr.item === "Bazooka" || pr.item === "Tank Gun" ? 1 : 0]);
    const rocks = this.rocks.map((rock) => [rock.id, rock.x, rock.z, rock.hitAt - now]);
    const events = this.events;
    this.events = [];
    const alive = this.zombies ? this.squadAlive().length : players.length;
    const zw = this.zombies
      ? [this.wave, this.players.filter((p) => p.alive && p.zombie).length, Math.max(0, this.nextWaveAt - now)]
      : null;
    this.players.forEach((p) => {
      if (!p.ws || p.ws.matchPlayer !== p) return;
      const myBbs = this.bbs.filter((bb) => bb.owner === p.id).map((bb) => [bb.name, Math.ceil(bb.hp), bb.maxHp]);
      send(p.ws, {
        t: "snap",
        e: now,
        alive,
        zw,
        players,
        bbs,
        vehicles,
        proj,
        rocks,
        ev: events,
        me: {
          inv: p.inv,
          held: p.held,
          coins: p.coins,
          wood: p.wood,
          metal: p.metal,
          hp: Math.ceil(p.hp),
          maxHp: p.maxHp,
          def: round2(this.playerDefense(p)),
          dmg: this.attackDamage(p),
          effect: p.effect ? p.effect.name : "",
          effectMs: p.effect && Number.isFinite(p.effect.until) ? Math.max(0, p.effect.until - now) : -1,
          stunMs: Math.max(0, p.stunUntil - now),
          protectMs: Math.max(0, SPAWN_PROTECT_MS - now),
          kills: p.kills,
          bbs: myBbs,
          veh: (() => {
            const v = this.vehicleOf(p);
            return v ? [v.kind, Math.ceil(v.hp), v.maxHp, p.seat, data.VEHICLES[v.kind].gun ? Math.max(0, v.gunReadyAt - now) : -1] : null;
          })()
        }
      });
    });
  }

  snapshotState() {
    return {
      loot: [...this.loot.values()],
      chestsOpen: [...this.chestsOpen],
      doors: this.doors.map((d) => [d.id, d.open ? 1 : 0, d.broken ? 1 : 0]),
      propsBroken: this.props.filter((p) => p.broken).map((p) => p.id),
      lightsBroken: this.stoplights.filter((s) => s.broken).map((s) => s.id),
      treesBroken: this.map.trees.filter((t) => t.broken).map((t) => t.id),
      rocksBroken: this.map.rocks.filter((r) => r.broken).map((r) => r.id),
      carsBroken: this.map.cars.filter((c) => c.broken).map((c) => c.id),
      lampsBroken: this.map.lamps.filter((l) => l.broken).map((l) => l.id),
      blocks: this.map.blocks.map((block) => this.blockPayload(block))
    };
  }
}

function createMatchServer({ wss, verifyAccount, awardStars, coopStore }) {
  const queues = new Map();
  const matches = new Set();
  let matchCounter = 1;

  function queueKey(mode, map) {
    return `${mode}:${map}`;
  }

  function leaveQueue(conn) {
    if (!conn.queueKey) return;
    const queue = queues.get(conn.queueKey);
    if (queue) {
      queue.members = queue.members.filter((entry) => entry !== conn);
      if (!queue.members.length) queues.delete(conn.queueKey);
    }
    conn.queueKey = "";
  }

  const onlineByKey = new Map();
  let coopChain = Promise.resolve();

  function coopUserKey(name) {
    return String(name || "").trim().toLowerCase();
  }

  function coopTask(conn, task) {
    coopChain = coopChain.then(task).catch((error) => {
      console.error("co-op update failed:", error);
      if (conn) send(conn.ws, { t: "coop-notice", text: "Co-op is having trouble right now. Try again." });
    });
    return coopChain;
  }

  function hasName(list, name) {
    const key = coopUserKey(name);
    return list.some((entry) => coopUserKey(entry) === key);
  }

  function withoutName(list, name) {
    const key = coopUserKey(name);
    return list.filter((entry) => coopUserKey(entry) !== key);
  }

  async function coopSnapshot(conn) {
    const key = coopUserKey(conn.username);
    const me = await coopStore.find(key);
    if (!me) return { friends: [], incoming: [], outgoing: [] };
    const friends = me.coopFriends.map((name) => ({ name, online: onlineByKey.has(coopUserKey(name)) }));
    const incoming = me.coopIncoming.map((from) => ({ from, online: onlineByKey.has(coopUserKey(from)) }));
    const outgoing = (await coopStore.list())
      .filter((account) => hasName(account.coopIncoming, me.username))
      .map((account) => ({ to: account.username, online: onlineByKey.has(coopUserKey(account.username)) }));
    return { friends, incoming, outgoing };
  }

  async function pushCoop(conn) {
    if (!conn || !conn.username) return;
    send(conn.ws, { t: "coop", ...(await coopSnapshot(conn)) });
  }

  async function pushCoopKeys(keys) {
    for (const key of new Set(keys)) await pushCoop(onlineByKey.get(key));
  }

  async function pushToFriendsOf(username) {
    const me = await coopStore.find(coopUserKey(username));
    if (!me) return;
    const related = [...me.coopFriends, ...me.coopIncoming].map(coopUserKey);
    const outgoing = (await coopStore.list()).filter((account) => hasName(account.coopIncoming, me.username)).map((account) => coopUserKey(account.username));
    await pushCoopKeys([...related, ...outgoing]);
  }

  function registerOnline(conn) {
    const key = coopUserKey(conn.username);
    const previous = onlineByKey.get(key);
    if (previous && previous !== conn && previous.ws.readyState === 1) previous.ws.close();
    onlineByKey.set(key, conn);
    pushParty(conn);
    coopTask(conn, async () => {
      await pushCoop(conn);
      const me = await coopStore.find(key);
      if (me && me.coopIncoming.length) {
        const names = me.coopIncoming.join(", ");
        send(conn.ws, { t: "coop-notice", text: `Friend request${me.coopIncoming.length > 1 ? "s" : ""} waiting from ${names}. Check the Hub.` });
      }
      await pushToFriendsOf(conn.username);
    });
  }

  function unregisterOnline(conn) {
    if (!conn.username) return;
    const key = coopUserKey(conn.username);
    if (onlineByKey.get(key) !== conn) return;
    onlineByKey.delete(key);
    coopTask(null, () => pushToFriendsOf(conn.username));
  }

  async function makeFriends(me, other) {
    await coopStore.saveCoop(coopUserKey(me.username), [...withoutName(me.coopFriends, other.username), other.username], withoutName(me.coopIncoming, other.username));
    await coopStore.saveCoop(coopUserKey(other.username), [...withoutName(other.coopFriends, me.username), me.username], withoutName(other.coopIncoming, me.username));
    await pushCoopKeys([coopUserKey(me.username), coopUserKey(other.username)]);
    await pushSocial(coopUserKey(me.username));
    await pushSocial(coopUserKey(other.username));
    const otherConn = onlineByKey.get(coopUserKey(other.username));
    if (otherConn) send(otherConn.ws, { t: "coop-notice", text: `${me.username} joined your co-op squad!` });
    send(onlineByKey.get(coopUserKey(me.username))?.ws, { t: "coop-notice", text: `${other.username} is on your squad.` });
  }

  function handleFriendRequest(conn, toName) {
    const to = String(toName || "").trim();
    const fromKey = coopUserKey(conn.username);
    const toKey = coopUserKey(to);
    if (!to || to.length > 20) {
      send(conn.ws, { t: "coop-notice", text: "Enter a valid callsign (max 20 characters)." });
      return;
    }
    if (toKey === fromKey) {
      send(conn.ws, { t: "coop-notice", text: "You can't send a request to yourself." });
      return;
    }
    coopTask(conn, async () => {
      const [me, target] = await Promise.all([coopStore.find(fromKey), coopStore.find(toKey)]);
      if (!me) return;
      if (!target) {
        send(conn.ws, { t: "coop-notice", text: `No account named ${to}.` });
        return;
      }
      if (hasName(me.coopFriends, target.username)) {
        send(conn.ws, { t: "coop-notice", text: `${target.username} is already on your co-op squad.` });
        return;
      }
      if (hasName(me.coopIncoming, target.username)) {
        await makeFriends(me, target);
        return;
      }
      if (hasName(target.coopIncoming, me.username)) {
        send(conn.ws, { t: "coop-notice", text: `Request to ${target.username} is already waiting.` });
        return;
      }
      await coopStore.saveCoop(toKey, target.coopFriends, [...target.coopIncoming, me.username]);
      const targetConn = onlineByKey.get(toKey);
      await pushCoopKeys([fromKey, toKey]);
      if (targetConn) {
        send(conn.ws, { t: "coop-notice", text: `Friend request sent to ${target.username}.` });
        send(targetConn.ws, { t: "coop-notice", text: `${me.username} sent you a friend request. Accept on the Hub.` });
      } else {
        send(conn.ws, { t: "coop-notice", text: `${target.username} is offline. They'll get your request next time they sign in.` });
      }
    });
  }

  function handleFriendAccept(conn, fromName) {
    const fromKey = coopUserKey(fromName);
    const toKey = coopUserKey(conn.username);
    coopTask(conn, async () => {
      const [me, from] = await Promise.all([coopStore.find(toKey), coopStore.find(fromKey)]);
      if (!me || !from || !hasName(me.coopIncoming, from.username)) {
        send(conn.ws, { t: "coop-notice", text: "That request is no longer pending." });
        if (me && !from) await coopStore.saveCoop(toKey, me.coopFriends, withoutName(me.coopIncoming, fromName));
        await pushCoop(conn);
        return;
      }
      await makeFriends(me, from);
    });
  }

  function handleFriendDecline(conn, fromName) {
    const fromKey = coopUserKey(fromName);
    const toKey = coopUserKey(conn.username);
    coopTask(conn, async () => {
      const me = await coopStore.find(toKey);
      if (!me || !hasName(me.coopIncoming, fromName)) {
        await pushCoop(conn);
        return;
      }
      await coopStore.saveCoop(toKey, me.coopFriends, withoutName(me.coopIncoming, fromName));
      await pushCoopKeys([toKey, fromKey]);
      send(conn.ws, { t: "coop-notice", text: `Declined ${fromName}'s friend request.` });
    });
  }

  const parties = new Map();

  function partyFor(conn) {
    return conn.party && parties.get(conn.party.hostKey) === conn.party ? conn.party : null;
  }

  function partyState(conn) {
    const key = coopUserKey(conn.username);
    const party = partyFor(conn);
    const invites = [];
    parties.forEach((entry) => {
      if (entry.invited.has(key) && entry !== party) invites.push({ from: entry.members[0].username });
    });
    return {
      t: "party",
      party: party
        ? {
            host: party.members[0].username,
            isHost: party.members[0] === conn,
            members: party.members.map((member) => member.username),
            invited: [...party.invited].map((invitedKey) => onlineByKey.get(invitedKey)?.username || invitedKey)
          }
        : null,
      invites
    };
  }

  function pushParty(conn) {
    if (conn && conn.username) send(conn.ws, partyState(conn));
  }

  function pushPartyAll(party) {
    party.members.forEach(pushParty);
    party.invited.forEach((key) => pushParty(onlineByKey.get(key)));
  }

  function leaveParty(conn, disbandText) {
    const party = partyFor(conn);
    conn.party = null;
    if (!party) return;
    if (party.members[0] === conn) {
      parties.delete(party.hostKey);
      party.members.slice(1).forEach((member) => {
        member.party = null;
        send(member.ws, { t: "coop-notice", text: disbandText || `${conn.username} closed the squad.` });
        pushParty(member);
      });
      party.invited.forEach((key) => pushParty(onlineByKey.get(key)));
      return;
    }
    party.members = party.members.filter((member) => member !== conn);
    party.members.forEach((member) => send(member.ws, { t: "coop-notice", text: `${conn.username} left the squad.` }));
    pushPartyAll(party);
  }

  function ensureParty(conn) {
    const existing = partyFor(conn);
    if (existing) return existing;
    const party = { hostKey: coopUserKey(conn.username), members: [conn], invited: new Set() };
    parties.set(party.hostKey, party);
    conn.party = party;
    return party;
  }

  function handleBattleInvite(conn, toName) {
    const toKey = coopUserKey(toName);
    coopTask(conn, async () => {
      const me = await coopStore.find(coopUserKey(conn.username));
      if (!me || !hasName(me.coopFriends, toName)) {
        send(conn.ws, { t: "coop-notice", text: "You can only send battle requests to friends." });
        return;
      }
      const target = onlineByKey.get(toKey);
      if (!target) {
        send(conn.ws, { t: "coop-notice", text: `${toName} is offline. Battle requests only work when they're online.` });
        return;
      }
      const current = partyFor(conn);
      if (current && current.members[0] !== conn) {
        send(conn.ws, { t: "coop-notice", text: "Only the squad leader can send battle requests." });
        return;
      }
      const party = ensureParty(conn);
      if (party.members.some((member) => member === target)) {
        send(conn.ws, { t: "coop-notice", text: `${target.username} is already on your squad.` });
        return;
      }
      if (party.members.length + party.invited.size >= SQUAD_SIZE) {
        send(conn.ws, { t: "coop-notice", text: `Squads hold ${SQUAD_SIZE} players.` });
        return;
      }
      party.invited.add(toKey);
      send(conn.ws, { t: "coop-notice", text: `Battle request sent to ${target.username}.` });
      send(target.ws, { t: "coop-notice", text: `${conn.username} sent you a battle request! Open Co-op → Play to join.` });
      pushPartyAll(party);
    });
  }

  function handleBattleAccept(conn, hostName) {
    const party = parties.get(coopUserKey(hostName));
    const key = coopUserKey(conn.username);
    if (!party || !party.invited.has(key)) {
      send(conn.ws, { t: "coop-notice", text: "That battle request expired." });
      pushParty(conn);
      return;
    }
    if (party.members.length >= SQUAD_SIZE) {
      send(conn.ws, { t: "coop-notice", text: "That squad is full." });
      return;
    }
    leaveParty(conn);
    party.invited.delete(key);
    party.members.push(conn);
    conn.party = party;
    party.members.forEach((member) => {
      if (member !== conn) send(member.ws, { t: "coop-notice", text: `${conn.username} joined the squad!` });
    });
    send(conn.ws, { t: "coop-notice", text: `You joined ${party.members[0].username}'s squad. Waiting for them to start.` });
    pushPartyAll(party);
  }

  function handleBattleDecline(conn, hostName) {
    const party = parties.get(coopUserKey(hostName));
    if (party && party.invited.delete(coopUserKey(conn.username))) {
      send(party.members[0].ws, { t: "coop-notice", text: `${conn.username} declined the battle request.` });
      pushPartyAll(party);
    }
    pushParty(conn);
  }

  function handleSquadStart(conn, withBots) {
    const party = partyFor(conn);
    if (party && party.members[0] !== conn) {
      send(conn.ws, { t: "coop-notice", text: "Only the squad leader can start." });
      return;
    }
    const members = party ? party.members.filter((member) => member.ws.readyState === 1 && !member.match) : [conn];
    if (party) {
      parties.delete(party.hostKey);
      party.invited.forEach((key) => {
        const invitee = onlineByKey.get(key);
        if (invitee) pushParty(invitee);
      });
    }
    members.forEach((member) => {
      member.party = null;
      leaveQueue(member);
    });
    try {
      startMatch("zombies", "island", members, withBots ? SQUAD_SIZE - members.length : 0);
    } catch (error) {
      console.error("startMatch failed:", error);
      members.forEach((member) => send(member.ws, { t: "coop-notice", text: "Could not start the zombie match. Try again." }));
    }
  }

  const socialByKey = new Map();
  const CHAT_MAX_LENGTH = 300;
  const CHAT_HISTORY = 80;
  const CHAT_MIN_GAP_MS = 250;
  const VOICE_KINDS = new Set(["request", "cancel", "accept", "decline", "end", "offer", "answer", "ice"]);

  function chatPairKey(a, b) {
    return [coopUserKey(a), coopUserKey(b)].sort().join("|");
  }

  async function pushSocial(key) {
    const conn = socialByKey.get(key);
    if (!conn) return;
    const me = await coopStore.find(key);
    conn.friendKeys = new Set((me ? me.coopFriends : []).map(coopUserKey));
    const friends = (me ? me.coopFriends : []).map((name) => {
      const friend = socialByKey.get(coopUserKey(name));
      return { name, online: Boolean(friend), inCall: Boolean(friend && friend.callWith) };
    });
    send(conn.ws, { t: "social", friends });
  }

  async function pushSocialToFriendsOf(username) {
    const me = await coopStore.find(coopUserKey(username));
    if (!me) return;
    for (const name of me.coopFriends) await pushSocial(coopUserKey(name));
  }

  function socialTask(conn, task) {
    coopChain = coopChain.then(task).catch((error) => {
      console.error("social update failed:", error);
      send(conn.ws, { t: "social-notice", text: "Friends chat is having trouble right now." });
    });
  }

  function registerSocial(conn) {
    const key = coopUserKey(conn.username);
    const previous = socialByKey.get(key);
    if (previous && previous !== conn) {
      endCall(previous);
      socialByKey.delete(key);
      if (previous.ws.readyState === 1) previous.ws.close();
    }
    socialByKey.set(key, conn);
    socialTask(conn, async () => {
      await pushSocial(key);
      await pushSocialToFriendsOf(conn.username);
    });
  }

  function unregisterSocial(conn) {
    const key = coopUserKey(conn.username);
    if (socialByKey.get(key) !== conn) return;
    endCall(conn);
    socialByKey.delete(key);
    socialTask(conn, () => pushSocialToFriendsOf(conn.username));
  }

  function endCall(conn) {
    const partnerKey = conn.callWith;
    conn.callWith = "";
    if (!partnerKey) return;
    const partner = socialByKey.get(partnerKey);
    if (partner && partner.callWith === coopUserKey(conn.username)) {
      partner.callWith = "";
      send(partner.ws, { t: "voice", from: conn.username, kind: "end" });
    }
  }

  function handleVoice(conn, msg) {
    const kind = String(msg.kind || "");
    const toKey = coopUserKey(msg.to);
    if (!VOICE_KINDS.has(kind) || !conn.friendKeys || !conn.friendKeys.has(toKey)) return;
    const target = socialByKey.get(toKey);
    const myKey = coopUserKey(conn.username);
    if (!target) {
      if (kind === "request") send(conn.ws, { t: "voice", from: msg.to, kind: "offline" });
      return;
    }
    if (kind === "request" && ((target.callWith && target.callWith !== myKey) || conn.callWith)) {
      send(conn.ws, { t: "voice", from: target.username, kind: "busy" });
      return;
    }
    if (kind === "accept") {
      endCall(conn);
      conn.callWith = toKey;
      target.callWith = myKey;
    } else if ((kind === "end" || kind === "decline" || kind === "cancel") && conn.callWith === toKey) {
      conn.callWith = "";
      target.callWith = "";
    } else if ((kind === "offer" || kind === "answer" || kind === "ice") && conn.callWith !== toKey) {
      return;
    }
    send(target.ws, { t: "voice", from: conn.username, kind, data: msg.data });
    if (kind === "accept" || kind === "end" || kind === "decline") {
      socialTask(conn, async () => {
        await pushSocialToFriendsOf(conn.username);
        await pushSocialToFriendsOf(target.username);
      });
    }
  }

  function handleChat(conn, msg) {
    const text = String(msg.text || "").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_LENGTH);
    const toKey = coopUserKey(msg.to);
    if (!text || !conn.friendKeys || !conn.friendKeys.has(toKey)) return;
    const now = Date.now();
    if (now - (conn.lastChatAt || 0) < CHAT_MIN_GAP_MS) return;
    conn.lastChatAt = now;
    socialTask(conn, async () => {
      const friend = await coopStore.find(toKey);
      if (!friend) return;
      const entry = { from: conn.username, text, at: now };
      await coopStore.addChat(chatPairKey(conn.username, friend.username), entry.from, entry.text, entry.at);
      send(conn.ws, { t: "chat", with: friend.username, msg: entry });
      const target = socialByKey.get(toKey);
      if (target) send(target.ws, { t: "chat", with: conn.username, msg: entry });
    });
  }

  function handleChatHistory(conn, msg) {
    const withKey = coopUserKey(msg.with);
    if (!conn.friendKeys || !conn.friendKeys.has(withKey)) return;
    socialTask(conn, async () => {
      const friend = await coopStore.find(withKey);
      if (!friend) return;
      const messages = await coopStore.listChat(chatPairKey(conn.username, friend.username), CHAT_HISTORY);
      send(conn.ws, { t: "chatHistory", with: friend.username, messages });
    });
  }

  function handleSocialMessage(conn, msg) {
    if (msg.t === "voice") handleVoice(conn, msg);
    else if (msg.t === "chat") handleChat(conn, msg);
    else if (msg.t === "chatHistory") handleChatHistory(conn, msg);
    else if (msg.t === "socialState") socialTask(conn, () => pushSocial(coopUserKey(conn.username)));
  }

  function joinQueue(conn, mode, map) {
    leaveQueue(conn);
    const key = queueKey(mode, map);
    if (!queues.has(key)) queues.set(key, { members: [], since: Date.now() });
    const queue = queues.get(key);
    queue.members.push(conn);
    conn.queueKey = key;
    conn.mode = mode;
    conn.map = map;
    send(conn.ws, {
      t: "queue",
      count: queue.members.length,
      needed: data.MATCH_PLAYERS,
      waitMs: Math.max(0, QUEUE_WAIT_MS - (Date.now() - queue.since))
    });
  }

  function findResumeMatch(username) {
    const key = username.toLowerCase();
    for (const match of matches) {
      if (match.finished) continue;
      const player = match.players.find((entry) => entry.alive && entry.name.toLowerCase() === key);
      if (player) return match;
    }
    return null;
  }

  function startMatch(mode, map, members, teamBots = 0) {
    members.forEach((conn) => { conn.queueKey = ""; });
    const match = new Match(matchCounter++, mode, map, members, (done) => matches.delete(done), awardStars, teamBots);
    matches.add(match);
    members.forEach((conn) => {
      conn.match = match;
      conn.ws.matchPlayer = match.players.find((p) => p.ws === conn.ws);
      send(conn.ws, { t: "state", ...match.snapshotState() });
    });
  }

  setInterval(() => {
    const now = Date.now();
    queues.forEach((queue, key) => {
      const [mode, map] = key.split(":");
      if (queue.members.length >= data.MATCH_PLAYERS || now - queue.since >= QUEUE_WAIT_MS) {
        queues.delete(key);
        startMatch(mode, map, queue.members.slice(0, data.MATCH_PLAYERS));
        return;
      }
      queue.members.forEach((conn) => send(conn.ws, {
        t: "queue",
        count: queue.members.length,
        needed: data.MATCH_PLAYERS,
        waitMs: Math.max(0, QUEUE_WAIT_MS - (now - queue.since))
      }));
    });
  }, 1000);

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });
    const conn = { ws, username: "", avatar: "boy-1", loadout: null, queueKey: "", match: null, pendingQueue: null };
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;
      if (msg.t === "social-hello") {
        if (conn.username) return;
        Promise.resolve(verifyAccount(String(msg.username || ""), String(msg.password || "")))
          .then((account) => {
            if (!account || ws.readyState !== 1) return;
            conn.username = account.username;
            conn.social = true;
            registerSocial(conn);
          })
          .catch(() => {});
        return;
      }
      if (conn.social) {
        handleSocialMessage(conn, msg);
        return;
      }
      if (msg.t === "playBots") {
        if (!conn.username) {
          send(ws, { t: "error", text: "Still signing in. Wait a moment, then tap Play Bots again." });
          return;
        }
        const drop = normalizeDrop(
          MODES.includes(msg.mode) ? msg.mode : conn.mode,
          mapGen.MAP_IDS.includes(msg.map) ? msg.map : conn.map
        );
        if (!drop) {
          send(ws, { t: "error", text: "Could not start bots. Leave the queue and pick a map again." });
          return;
        }
        leaveQueue(conn);
        try {
          startMatch(drop.mode, drop.map, [conn]);
        } catch (error) {
          console.error("startMatch failed:", error);
          send(ws, { t: "error", text: "Could not start the match. Try again." });
        }
        return;
      }
      if (msg.t === "hello") {
        Promise.resolve(verifyAccount(String(msg.username || ""), String(msg.password || "")))
          .then((account) => {
            if (!account) {
              send(ws, { t: "error", text: "Sign in again to drop in." });
              return;
            }
            conn.username = account.username;
            conn.avatar = String(msg.avatar || "boy-1");
            conn.loadout = sanitizeLoadout(msg.loadout);
            const resumeMatch = findResumeMatch(account.username);
            if (resumeMatch && resumeMatch.resumePlayer(conn)) return;
            registerOnline(conn);
            send(ws, { t: "hello-ok" });
            if (conn.pendingQueue) {
              const pending = conn.pendingQueue;
              conn.pendingQueue = null;
              joinQueue(conn, pending.mode, pending.map);
            }
          })
          .catch(() => send(ws, { t: "error", text: "Sign in again to drop in." }));
        return;
      }
      if (!conn.username) return;
      if (conn.match && ws.matchPlayer) {
        conn.match.handleMessage(ws, msg);
        return;
      }
      if (msg.t === "queue") {
        const drop = normalizeDrop(msg.mode, msg.map);
        if (!drop) return;
        if (!conn.username) {
          conn.pendingQueue = drop;
          return;
        }
        joinQueue(conn, drop.mode, drop.map);
      } else if (msg.t === "leave") {
        leaveQueue(conn);
      } else if (msg.t === "friendRequest") {
        handleFriendRequest(conn, msg.to);
      } else if (msg.t === "friendAccept") {
        handleFriendAccept(conn, msg.from);
      } else if (msg.t === "friendDecline") {
        handleFriendDecline(conn, String(msg.from || "").trim());
      } else if (msg.t === "battleInvite") {
        handleBattleInvite(conn, String(msg.to || "").trim());
      } else if (msg.t === "battleAccept") {
        handleBattleAccept(conn, String(msg.from || ""));
      } else if (msg.t === "battleDecline") {
        handleBattleDecline(conn, String(msg.from || ""));
      } else if (msg.t === "squadLeave") {
        leaveParty(conn);
        pushParty(conn);
      } else if (msg.t === "squadStart") {
        handleSquadStart(conn, Boolean(msg.bots));
      } else if (msg.t === "partyState") {
        pushParty(conn);
      }
    });
    ws.on("close", () => {
      if (conn.social) {
        unregisterSocial(conn);
        return;
      }
      leaveQueue(conn);
      if (conn.username) {
        const key = coopUserKey(conn.username);
        leaveParty(conn, `${conn.username} disconnected, so the squad closed.`);
        if (onlineByKey.get(key) === conn) {
          parties.forEach((party) => {
            if (party.invited.delete(key)) pushPartyAll(party);
          });
        }
      }
      unregisterOnline(conn);
      if (conn.match) conn.match.disconnect(ws);
    });
  });

  const heartbeatMs = 25000;
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, heartbeatMs);
  wss.on("close", () => clearInterval(heartbeat));
}

module.exports = { createMatchServer };
