const data = require("./game-data.js");
const { BB_CATALOG, bbIsRideable, bbFootRadius, BB_CHARACTER_HEIGHT } = require("./bb-art.js");
const mapGen = require("./map-gen.js");

const TICK_MS = 50;
const QUEUE_WAIT_MS = 90000;
const PLAYER_RADIUS = 0.5;
const PLAYER_SPEED = 7;
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
const MODES = ["ranked", "competitive"];

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
const BOT_START_WEAPONS = data.WEAPON_SHOP_ITEMS.filter((name) => data.getWeaponShopPrice(name) <= 1500 && data.getWeaponDamage(name) > 0);
const COMMON_BBS = BB_CATALOG.filter((bb) => bb.rarity === "common" || bb.rarity === "uncommon");

function rollLoot(rand) {
  let roll = rand() * LOOT_TOTAL;
  for (const entry of LOOT_POOL) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return LOOT_POOL[0].item;
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
  constructor(id, mode, mapId, humans, onFinish, awardStars) {
    this.id = id;
    this.mode = mode;
    this.mapId = mapId;
    this.seed = Math.floor(Math.random() * 2 ** 31);
    this.rand = mapGen.mulberry32(this.seed ^ 0x9e3779b9);
    this.map = mapGen.generateMap(mapId, this.seed);
    this.onFinish = onFinish;
    this.awardStars = awardStars;
    this.startAt = Date.now();
    this.players = [];
    this.bbs = [];
    this.projectiles = [];
    this.loot = new Map();
    this.chestsOpen = new Set();
    this.rocks = [];
    this.events = [];
    this.nextId = 1;
    this.nextRockAt = ROCK_INTERVAL_MS;
    this.finished = false;
    this.placesTaken = 0;

    humans.forEach((conn) => this.addPlayer(conn.username, conn.avatar, conn.loadout, conn.ws));
    let botIndex = 0;
    const usedNames = new Set(this.players.map((p) => p.name));
    while (this.players.length < data.MATCH_PLAYERS) {
      let name = BOT_NAMES[botIndex % BOT_NAMES.length];
      if (botIndex >= BOT_NAMES.length) name += ` ${Math.floor(botIndex / BOT_NAMES.length) + 1}`;
      botIndex += 1;
      if (usedNames.has(name)) continue;
      usedNames.add(name);
      const weapons = this.rand() < 0.6 ? [BOT_START_WEAPONS[Math.floor(this.rand() * BOT_START_WEAPONS.length)]] : [];
      const bb = this.rand() < 0.3 ? COMMON_BBS[Math.floor(this.rand() * COMMON_BBS.length)].name : "";
      const skin = this.rand() < 0.35 ? data.SKIN_IDS[Math.floor(this.rand() * data.SKIN_IDS.length)] : "";
      this.addPlayer(name, AVATAR_IDS[Math.floor(this.rand() * AVATAR_IDS.length)], { weapons, potion: "", bb, skin }, null);
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
      kills: 0,
      effect: null,
      stunUntil: 0,
      poison: null,
      lastAttackAt: -99999,
      swingUntil: 0,
      alive: true,
      touchingWall: false,
      input: { mx: 0, mz: 0, yaw: 0, pitch: 0, jump: false, attack: false },
      bot: ws ? null : { mode: "wander", goal: null, stuckAt: 0, lastPos: null, detourUntil: 0, detour: 0, thinkAt: 0, aimJitter: 0 },
      disconnectedAt: 0,
      riding: 0
    };
    this.players.push(player);
    if (clean.bb) this.spawnBb(player, clean.bb);
    return player;
  }

  spawnBb(owner, name) {
    const def = BB_CATALOG.find((bb) => bb.name === name);
    if (!def) return null;
    const height = def.size * BB_CHARACTER_HEIGHT;
    const bb = {
      id: this.nextId++,
      owner: owner.id,
      catalogIndex: BB_CATALOG.indexOf(def),
      name: def.name,
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      attackMs: def.attackMs || 1000,
      defense: def.defense || 0,
      speed: BB_SPEED_UNITS[def.speed] || BB_DEFAULT_SPEED,
      x: owner.x + (this.rand() - 0.5) * 3,
      z: owner.z + (this.rand() - 0.5) * 3,
      y: owner.y,
      yaw: 0,
      height,
      radius: bbFootRadius(def),
      rideable: bbIsRideable(def),
      rider: 0,
      alive: true
    };
    this.bbs.push(bb);
    return bb;
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

  toggleRide(p) {
    const notice = (text) => { if (p.ws) send(p.ws, { t: "notice", text }); };
    const current = p.riding ? this.bbById(p.riding) : null;
    if (current) {
      this.dismount(p, current);
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
    mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, p.y);
    p.x = pos.x;
    p.z = pos.z;
    p.vy = 0;
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
    if (!target.alive || amount <= 0) return;
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
    if (bb.hp <= 0) {
      bb.alive = false;
      this.events.push({ k: "bbdown", id: bb.id });
      const rider = bb.rider ? this.playerById(bb.rider) : null;
      if (rider) this.dismount(rider, bb);
    }
  }

  dropLoot(x, z, item) {
    const id = this.nextId++;
    const angle = this.rand() * Math.PI * 2;
    const dist = 0.6 + this.rand() * 1.8;
    const lx = x + Math.cos(angle) * dist;
    const lz = z + Math.sin(angle) * dist;
    const entry = { id, x: round2(lx), z: round2(lz), y: round2(mapGen.terrainHeight(this.map, lx, lz)), item };
    this.loot.set(id, entry);
    this.events.push({ k: "loot+", ...entry });
  }

  eliminate(p, killer, cause) {
    if (!p.alive) return;
    const place = this.aliveCount();
    p.alive = false;
    p.place = place;
    p.inv.forEach((item) => { if (item) this.dropLoot(p.x, p.z, item); });
    p.inv = p.inv.map(() => null);
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
    const reward = this.mode === "competitive"
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
      diamonds: data.getPlacementReward(data.MATCH_DIAMOND_REWARDS, this.mapId, p.place)
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
    const p = this.players.find((entry) => entry.ws === ws);
    if (!p || !p.alive) return;
    p.ws = null;
    p.disconnectedAt = Date.now();
    p.input = { mx: 0, mz: 0, yaw: p.yaw, pitch: p.pitch, jump: false, attack: false };
  }

  resumePlayer(conn) {
    const p = this.players.find((entry) => entry.name.toLowerCase() === conn.username.toLowerCase() && entry.alive);
    if (!p || p.ws || !p.disconnectedAt) return false;
    p.ws = conn.ws;
    p.disconnectedAt = 0;
    conn.match = this;
    conn.ws.matchPlayer = p;
    const roster = this.players.map((entry) => ({ id: entry.id, name: entry.name, avatar: entry.avatar, skin: entry.skin, bot: Boolean(entry.bot) }));
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
        attack: Boolean(msg.attack)
      };
    } else if (msg.t === "select") {
      const slot = Math.floor(Number(msg.slot));
      if (slot >= 0 && slot < data.MATCH_INVENTORY_SLOTS) p.held = slot;
    } else if (msg.t === "pickup") {
      this.pickup(p, msg.id ? Number(msg.id) : 0);
    } else if (msg.t === "buy") {
      this.buy(p, String(msg.kind || ""), String(msg.name || ""));
    } else if (msg.t === "ride") {
      this.toggleRide(p);
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
      if (entry && Math.hypot(entry.x - p.x, entry.z - p.z) <= PICKUP_RANGE) target = entry;
    } else {
      let best = PICKUP_RANGE;
      this.loot.forEach((entry) => {
        const d = Math.hypot(entry.x - p.x, entry.z - p.z);
        if (d <= best) {
          best = d;
          target = entry;
        }
      });
    }
    if (!target) return false;
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
    const item = this.heldItem(p);
    if (item && data.isPotionName(item)) {
      if (now - p.lastAttackAt < 600) return;
      p.lastAttackAt = now;
      this.drinkPotion(p);
      return;
    }
    const ranged = item ? data.getWeaponRanged(item) : null;
    const tuning = BOT_TUNING[this.mapId];
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
      if (!this.chestsOpen.has(chest.id) && inFront(chest.x, chest.z, data.MELEE_RANGE + 0.6)) this.openChest(chest);
    });
    const mySeat = this.seatHeight(p);
    this.players.forEach((target) => {
      if (target === p || !target.alive) return;
      if (Math.abs(target.y - p.y) > 2.5 + Math.max(mySeat, this.seatHeight(target))) return;
      if (inFront(target.x, target.z, data.MELEE_RANGE)) this.applyWeaponHit(p, item, damage, target, null);
    });
    this.bbs.forEach((bb) => {
      if (!bb.alive || bb.owner === p.id) return;
      if (inFront(bb.x, bb.z, data.MELEE_RANGE + bb.radius)) this.applyWeaponHit(p, item, damage, null, bb);
    });
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
    this.events.push({ k: "chest", id: chest.id });
    const count = 1 + Math.floor(this.rand() * 3);
    for (let i = 0; i < count; i += 1) this.dropLoot(chest.x, chest.z, rollLoot(this.rand));
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
    const mount = p.riding ? this.bbById(p.riding) : null;
    if (mount) {
      this.moveMount(p, mount, mx, mz, dt);
      return;
    }
    if (p.riding) p.riding = 0;
    const before = { x: p.x, z: p.z };
    const pos = { x: p.x + mx * PLAYER_SPEED * dt, z: p.z + mz * PLAYER_SPEED * dt };
    const wanted = { x: pos.x, z: pos.z };
    mapGen.resolveCollision(this.map, pos, PLAYER_RADIUS, p.y);
    p.touchingWall = Math.hypot(pos.x - wanted.x, pos.z - wanted.z) > 0.001;
    p.x = pos.x;
    p.z = pos.z;
    const ground = mapGen.terrainHeight(this.map, p.x, p.z);
    const hasJetpack = p.inv.includes("Jetpack");
    const hasHook = p.inv.includes("Grappling Hook");
    const onGround = p.y <= ground + 0.05;
    if (!stunned && input.jump) {
      if (hasJetpack && p.y < ground + 30) p.vy = Math.min(p.vy + 45 * dt, 7);
      else if (onGround) p.vy = JUMP_SPEED;
      else if (hasHook && p.touchingWall) p.vy = 12;
    }
    p.vy -= GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y <= ground) {
      p.y = ground;
      p.vy = 0;
    }
    p.moved = Math.hypot(p.x - before.x, p.z - before.z);
  }

  moveMount(p, mount, mx, mz, dt) {
    const speed = Math.max(mount.speed * 1.25, PLAYER_SPEED);
    const pos = { x: mount.x + mx * speed * dt, z: mount.z + mz * speed * dt };
    mapGen.resolveCollision(this.map, pos, Math.min(mount.radius, BB_MAX_COLLIDE), mount.y);
    p.moved = Math.hypot(pos.x - mount.x, pos.z - mount.z);
    mount.x = pos.x;
    mount.z = pos.z;
    mount.y = mapGen.terrainHeight(this.map, mount.x, mount.z);
    if (mx || mz) mount.yaw = Math.atan2(mx, mz);
    p.x = mount.x;
    p.z = mount.z;
    p.y = mount.y + mount.height * RIDER_SEAT;
    p.vy = 0;
    p.touchingWall = false;
  }

  moveBb(bb, dt) {
    const owner = this.playerById(bb.owner);
    if (!owner || !owner.alive) return;
    let target = null;
    let best = 22;
    this.players.forEach((other) => {
      if (!other.alive || other.id === bb.owner) return;
      const d = Math.hypot(other.x - bb.x, other.z - bb.z);
      if (d < best && Math.hypot(other.x - owner.x, other.z - owner.z) < 30) {
        best = d;
        target = { kind: "player", ref: other };
      }
    });
    this.bbs.forEach((other) => {
      if (!other.alive || other.owner === bb.owner) return;
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
        mapGen.resolveCollision(this.map, pos, Math.min(bb.radius, BB_MAX_COLLIDE));
        bb.x = pos.x;
        bb.z = pos.z;
      }
      if (dist > 60) {
        bb.x = owner.x + 1.5 + bb.radius;
        bb.z = owner.z + 1.5 + bb.radius;
      }
      bb.y = mapGen.terrainHeight(this.map, bb.x, bb.z);
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
      const flooded = ground < hazard.waterLevel - 0.3 || ground < -0.3;
      if (flooded && y < waterSurface + 0.8) return { dps: mapGen.WATER_DPS, cause: "Drowned" };
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
      if (mapGen.segmentHitsWall(this.map, proj.x, proj.z, nx, nz, ny)) return false;
      if (ny < mapGen.terrainHeight(this.map, nx, nz)) return false;
      for (const target of this.players) {
        if (!target.alive || target.id === proj.owner) continue;
        if (Math.hypot(target.x - nx, target.z - nz) < 0.9 && ny > target.y - 0.2 && ny < target.y + 2.2) {
          if (owner) this.applyWeaponHit(owner, proj.item, proj.damage, target, null);
          return false;
        }
      }
      for (const bb of this.bbs) {
        if (!bb.alive || bb.owner === proj.owner) continue;
        if (Math.hypot(bb.x - nx, bb.z - nz) < 0.5 + bb.radius && ny > bb.y - 0.2 && ny < bb.y + bb.height) {
          if (owner) this.applyWeaponHit(owner, proj.item, proj.damage, null, bb);
          return false;
        }
      }
      for (const chest of this.map.chests) {
        if (this.chestsOpen.has(chest.id)) continue;
        if (Math.hypot(chest.x - nx, chest.z - nz) < 1) {
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
    let enemyDist = now < SPAWN_PROTECT_MS ? 0 : BOT_TUNING[this.mapId].engageRange;
    this.players.forEach((other) => {
      if (other === p || !other.alive) return;
      const d = Math.hypot(other.x - p.x, other.z - p.z);
      if (d < enemyDist) {
        enemyDist = d;
        enemy = other;
      }
    });
    if (!enemy) {
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

    if (p.inv.some((item) => !item)) {
      let near = null;
      let nearDist = 40;
      this.loot.forEach((entry) => {
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
      if (this.chestsOpen.has(entry.id)) return;
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
    const hazard = mapGen.hazardAt(this.mapId, now);
    this.players.forEach((p) => {
      if (!p.alive) return;
      if (p.disconnectedAt) {
        if (Date.now() - p.disconnectedAt > RECONNECT_GRACE_MS) this.eliminate(p, null, "Disconnected");
        return;
      }
      if (p.bot) this.botThink(p, hazard, now);
      this.movePlayer(p, dt, now);
      if (p.input.attack && now >= p.stunUntil) this.attack(p, now);
    });
    this.bbs.forEach((bb) => { if (bb.alive) this.moveBb(bb, dt); });
    this.moveProjectiles(dt);
    this.hazardTick(hazard, dt, now);
    this.bbs = this.bbs.filter((bb) => bb.alive);
    this.broadcast();
  }

  broadcast() {
    const now = this.elapsed();
    const players = this.players.filter((p) => p.alive).map((p) => [
      p.id, round2(p.x), round2(p.y), round2(p.z), round2(p.yaw), Math.ceil(p.hp), p.maxHp,
      this.heldItem(p) || "", now < p.stunUntil ? 1 : 0, now < p.swingUntil ? 1 : 0, p.riding || 0
    ]);
    const bbs = this.bbs.map((bb) => [bb.id, bb.owner, bb.catalogIndex, round2(bb.x), round2(bb.y), round2(bb.z), Math.ceil(bb.hp), bb.maxHp, bb.rider || 0, round2(bb.yaw)]);
    const proj = this.projectiles.map((pr) => [pr.id, round2(pr.x), round2(pr.y), round2(pr.z)]);
    const rocks = this.rocks.map((rock) => [rock.id, rock.x, rock.z, rock.hitAt - now]);
    const events = this.events;
    this.events = [];
    const alive = players.length;
    this.players.forEach((p) => {
      if (!p.ws || p.ws.matchPlayer !== p) return;
      const myBbs = this.bbs.filter((bb) => bb.owner === p.id).map((bb) => [bb.name, Math.ceil(bb.hp), bb.maxHp]);
      send(p.ws, {
        t: "snap",
        e: now,
        alive,
        players,
        bbs,
        proj,
        rocks,
        ev: events,
        me: {
          inv: p.inv,
          held: p.held,
          coins: p.coins,
          hp: Math.ceil(p.hp),
          maxHp: p.maxHp,
          def: round2(this.playerDefense(p)),
          dmg: this.attackDamage(p),
          effect: p.effect ? p.effect.name : "",
          effectMs: p.effect && Number.isFinite(p.effect.until) ? Math.max(0, p.effect.until - now) : -1,
          stunMs: Math.max(0, p.stunUntil - now),
          protectMs: Math.max(0, SPAWN_PROTECT_MS - now),
          kills: p.kills,
          bbs: myBbs
        }
      });
    });
  }

  snapshotState() {
    return {
      loot: [...this.loot.values()],
      chestsOpen: [...this.chestsOpen]
    };
  }
}

function createMatchServer({ wss, verifyAccount, awardStars }) {
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
      const player = match.players.find((entry) => entry.alive && entry.disconnectedAt && !entry.ws && entry.name.toLowerCase() === key);
      if (player) return match;
    }
    return null;
  }

  function startMatch(mode, map, members) {
    members.forEach((conn) => { conn.queueKey = ""; });
    const match = new Match(matchCounter++, mode, map, members, (done) => matches.delete(done), awardStars);
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
      if (msg.t === "playBots") {
        if (!conn.username) {
          send(ws, { t: "error", text: "Still signing in. Wait a moment, then tap Play Bots again." });
          return;
        }
        const mode = MODES.includes(msg.mode) ? msg.mode : conn.mode;
        const map = mapGen.MAP_IDS.includes(msg.map) ? msg.map : conn.map;
        if (!mode || !map) {
          send(ws, { t: "error", text: "Could not start bots. Leave the queue and pick a map again." });
          return;
        }
        leaveQueue(conn);
        try {
          startMatch(mode, map, [conn]);
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
        if (!MODES.includes(msg.mode) || !mapGen.MAP_IDS.includes(msg.map)) return;
        if (!conn.username) {
          conn.pendingQueue = { mode: msg.mode, map: msg.map };
          return;
        }
        joinQueue(conn, msg.mode, msg.map);
      } else if (msg.t === "leave") {
        leaveQueue(conn);
      }
    });
    ws.on("close", () => {
      leaveQueue(conn);
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
