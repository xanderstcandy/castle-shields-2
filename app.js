const app = document.querySelector("#app");
const AUTO_SAVE_INTERVAL_MS = 10000;
const LOCAL_BACKUP_KEY = "castleShields2Backup";

const TENT_LEVELS = [
  { label: "Canvas Tent", kicker: "Main Tent", maxHealth: 3, defense: 0, population: 1, retaliation: 0, upgradeCost: 60 },
  { label: "Log Cabin", kicker: "Log Cabin", maxHealth: 5, defense: 0.5, population: 2, retaliation: 0, upgradeCost: 75 },
  { label: "House", kicker: "House", maxHealth: 10, defense: 1, population: 4, retaliation: 0, upgradeCost: 100 },
  { label: "Castle Tower", kicker: "Castle Tower", maxHealth: 15, defense: 1, population: 5, retaliation: 1, upgradeCost: 175 },
  { label: "Walled Tower", kicker: "Walled Tower", maxHealth: 35, defense: 3, population: 7, retaliation: 3, upgradeCost: 200 },
  { label: "Twin Tower Keep", kicker: "Twin Tower Keep", maxHealth: 35, defense: 5, population: 10, retaliation: 5, upgradeCost: 250 },
  { label: "Four Tower Keep", kicker: "Four Tower Keep", maxHealth: 50, defense: 10, population: 14, retaliation: 5, upgradeCost: 300 },
  { label: "Four Tower Keep", kicker: "Four Tower Keep", maxHealth: 75, defense: 25, population: 16, retaliation: 8, upgradeCost: 300 },
  { label: "Ancient Stone Keep", kicker: "Ancient Stone Keep", maxHealth: 100, defense: 50, population: 16, retaliation: 10, upgradeCost: 500 },
  { label: "Grand Citadel", kicker: "Grand Citadel", maxHealth: 300, defense: 150, population: 20, retaliation: 50, upgradeCost: 0 }
];
const TENT_MAX_LEVEL = TENT_LEVELS.length;

const TENT_TARGET = { x: 800, y: 856 };
const TENT_ATTACK_RANGE = 36;
const STARTING_COINS = 35;
const EXCHANGE_OFFERS = [
  { id: "gems-5", spend: "gems", spendAmount: 5, earn: "coins", earnAmount: 55 },
  { id: "gems-10", spend: "gems", spendAmount: 10, earn: "coins", earnAmount: 145 },
  { id: "coins-100", spend: "coins", spendAmount: 100, earn: "gems", earnAmount: 5 }
];
const WALL_POSITION = { x: 800, y: 668 };
const WALL_LEVELS = [
  { label: "Timber Wall", maxHealth: 12, defense: 0, retaliation: 0, upgradeCost: 45 },
  { label: "Stone Wall", maxHealth: 25, defense: 1, retaliation: 0, upgradeCost: 65 },
  { label: "Spiked Palisade", maxHealth: 50, defense: 3, retaliation: 1, upgradeCost: 0 }
];
const WALL_MAX_LEVEL = WALL_LEVELS.length;
const WALL_COST = 25;
const WALL_TENT_REQUIREMENT = 2;
const HEALING_FIRE_POSITION = { x: 834, y: 938 };
const HEALING_FIRE_COST = 15;
const HEALING_FIRE_HEAL_PER_SECOND = 0.25;
const HEALING_FIRE_RANGE = 34;
const MINE_POSITION = { x: 1084, y: 552 };
const MINE_COST = 20;
const MINE_MINT_MULTIPLIER = 1.5;
const WINDMILL_POSITION = { x: 770, y: 214 };
const WINDMILL_COST = 15;
const WINDMILL_FARM_POP_BONUS = 2;
const PADDOCK_CENTER = { x: 550, y: 536 };
const PADDOCK_COST = 18;
const PADDOCK_EXTRA_STABLE_POP = 1;
const MIN_STRUCTURE_DAMAGE = 0.5;
const WALL_BLOCK_RANGE = 48;
const BUILD_SLOTS = [
  { x: 646, y: 890, tentLevel: 5 },
  { x: 1096, y: 884, tentLevel: 6 },
  { x: 496, y: 916, tentLevel: 6 },
  { x: 952, y: 912, tentLevel: 7 },
  { x: 718, y: 924, tentLevel: 8 },
  { x: 1246, y: 762, tentLevel: 9 },
  { x: 400, y: 742, tentLevel: 10 },
  { x: 620, y: 700, tentLevel: 10 },
  { x: 1010, y: 758, tentLevel: 10 }
];
const BUILDINGS = [
  { id: "barracks", label: "Barracks", cost: 60, blurb: "Drill yard" },
  { id: "archery-range", label: "Archery Range", cost: 70, blurb: "Butts and bows" },
  { id: "stable", label: "Stable", cost: 90, blurb: "Horse and hay" },
  { id: "theater", label: "Theater", cost: 50, blurb: "Stage and masks" },
  { id: "farm", label: "Farm", cost: 50, blurb: "Crop rows" },
  { id: "mint", label: "Mint", cost: 75, blurb: "Coin press" }
];
const BUILDING_CONFIG = {
  barracks: { maxLevel: 4, upgradeBase: 60, upgradeStep: 6, summary: "Trains foot soldiers" },
  "archery-range": { maxLevel: 4, upgradeBase: 70, upgradeStep: 7, summary: "Trains long range units" },
  stable: { maxLevel: 4, upgradeBase: 90, upgradeStep: 9, summary: "Trains cavalry" },
  theater: { maxLevel: 13, upgradeBase: 50, upgradeStep: 5, summary: "Keeps your troops entertained" },
  farm: { maxLevel: 10, upgradeBase: 55, upgradeStep: 0, summary: "Feeds a bigger population" },
  mint: { maxLevel: 10, upgradeBase: 100, upgradeStep: 0, summary: "Presses coin on a timer" }
};
const BUILDING_DEMOLISH_REFUND = 100;
const UNIT_DEF = {
  unarmed_warrior: { label: "Unarmed Warrior", building: "barracks", unlockLevel: 1, speed: 3, damage: 3, health: 20, defense: 0, cost: 8 },
  warrior: { label: "Warrior", building: "barracks", unlockLevel: 2, speed: 3, damage: 8, health: 25, defense: 0.5, cost: 15 },
  swordsman: { label: "Swordsman", building: "barracks", unlockLevel: 3, speed: 2, damage: 15, health: 30, defense: 2, cost: 25 },
  man_at_arms: { label: "Man-at-Arms", building: "barracks", unlockLevel: 4, speed: 1, damage: 20, health: 35, defense: 5, cost: 45 },
  musketman: { label: "Musketman", building: "barracks", unlockLevel: 4, speed: 3, damage: 50, health: 20, defense: 1, cost: 50, range: 120 },
  lancer: { label: "Lancer", building: "stable", unlockLevel: 1, speed: 10, damage: 6, health: 28, defense: 0.5, cost: 13, mounted: true },
  horseman: { label: "Horseman", building: "stable", unlockLevel: 2, speed: 10, damage: 13, health: 35, defense: 1, cost: 20, mounted: true },
  knight: { label: "Knight", building: "stable", unlockLevel: 3, speed: 9, damage: 20, health: 40, defense: 5, cost: 33, mounted: true },
  gun_cavalry: { label: "Gun Cavalry", building: "stable", unlockLevel: 4, speed: 9, damage: 45, health: 50, defense: 5, cost: 48, mounted: true, range: 120 },
  slinger: { label: "Slinger", building: "archery-range", unlockLevel: 1, speed: 3, damage: 2, health: 20, defense: 0, cost: 10, range: 170 },
  archer: { label: "Archer", building: "archery-range", unlockLevel: 2, speed: 3, damage: 5, health: 25, defense: 0.5, cost: 18, range: 220 },
  crossbowman: { label: "Crossbowman", building: "archery-range", unlockLevel: 3, speed: 2, damage: 17, health: 30, defense: 4, cost: 29, range: 260 },
  sniper: { label: "Sniper", building: "archery-range", unlockLevel: 4, speed: 0, damage: 23, health: 35, defense: 5, cost: 58, range: 520 }
};
const UNIT_SPEED_SCALE = 14;
const UNIT_MELEE_RANGE = 26;
const UNIT_ATTACK_COOLDOWN_MS = 1200;
const UNIT_PROJECTILE_SPEED = 520;
const ENEMY_ENGAGE_UNIT_RANGE = 38;
const UNIT_GUARD_WAYPOINT_FROM_END = 3;
const MINT_PAYOUT_MS = 15000;
const MINT_PAYOUT_PER_LEVEL = 3;
const FARM_POP_PER_LEVEL = 3;
const ENTERTAINMENT_TROOPS_PER_LEVEL = 4;
const GEMS_PER_ENTERTAINMENT = 5;
const CROSSBOW_POSITION = { x: 918, y: 858 };
const CROSSBOW_RANGE = 460;
const CROSSBOW_MAX_LEVEL = 10;
const WEAPON_TIERS = [
  {
    id: "crossbow",
    label: "Field Crossbow",
    baseDamage: 1,
    damagePerLevel: 1,
    baseCooldownMs: 2800,
    cooldownStepMs: 140,
    minCooldownMs: 1400,
    projectileSpeed: 540,
    blastRadius: 0,
    evolveCost: 500
  },
  {
    id: "catapult",
    label: "Catapult",
    baseDamage: 12,
    damagePerLevel: 3,
    baseCooldownMs: 3200,
    cooldownStepMs: 150,
    minCooldownMs: 1750,
    projectileSpeed: 430,
    blastRadius: 0,
    evolveCost: 1000
  },
  {
    id: "cannon",
    label: "Cannon",
    baseDamage: 45,
    damagePerLevel: 10,
    baseCooldownMs: 2800,
    cooldownStepMs: 130,
    minCooldownMs: 1550,
    projectileSpeed: 720,
    blastRadius: 0,
    evolveCost: 3000
  },
  {
    id: "missile",
    label: "Missile Launcher",
    baseDamage: 150,
    damagePerLevel: 25,
    baseCooldownMs: 3000,
    cooldownStepMs: 120,
    minCooldownMs: 1700,
    projectileSpeed: 480,
    blastRadius: 90,
    evolveCost: 0
  }
];
const WEAPON_UPGRADE_BASE_COST = 12;
const WEAPON_UPGRADE_LEVEL_COST = 10;
const BLAST_FLASH_MS = 420;
const CROSSBOW_AIM_TURN_SPEED = 140;
const CROSSBOW_LEAD_FACTOR = 0.35;
const CROSSBOW_IDLE_AIM = -118;
const WAVE_PEACE_MS = 8000;
const WAVE_ATTACK_MS = 60000;
const SPAWN_INTERVAL_MS = 4500;
const FIRST_SPAWN_DELAY_MS = 1200;
const ENEMY_ROSTER_WAVE_BONUS = 1;
const ENEMY_ATTACK_COOLDOWN_MS = 1500;

const LOOT_FLOAT_MS = 1150;
const BOSS_WAVE_INTERVAL = 15;
const BOSS_WAVE_ATTACK_MS = 120000;
const BOSS_ORDER = ["warlord", "bone_tyrant", "elder_wyrm"];
const LATE_GAME_WAVE = 30;
const EARLY_GAME_EASE_MAX_WAVE = 14;

const ENEMY_DEF = {
  plague_rat: {
    label: "Plague Rat",
    health: 1,
    damage: 1,
    speed: 142,
    height: 26,
    barWidth: 20,
    minWave: 1,
    weight: 5,
    retireWave: 6,
    coins: 2,
    gems: 0
  },
  goblin: {
    label: "Goblin Skirmisher",
    health: 1,
    damage: 1,
    speed: 108,
    height: 38,
    barWidth: 22,
    minWave: 1,
    weight: 6,
    retireWave: 8,
    coins: 3,
    gems: 0
  },
  kobold: {
    label: "Kobold Slinger",
    health: 1,
    damage: 1,
    speed: 122,
    height: 36,
    barWidth: 20,
    minWave: 2,
    weight: 4,
    retireWave: 8,
    coins: 3,
    gems: 0
  },
  skeleton: {
    label: "Skeleton Warrior",
    health: 2,
    damage: 1,
    speed: 94,
    height: 42,
    barWidth: 24,
    minWave: 2,
    weight: 4,
    retireWave: 10,
    coins: 4,
    gems: 0
  },
  wraith: {
    label: "Grave Wraith",
    health: 2,
    damage: 1,
    speed: 126,
    height: 46,
    barWidth: 24,
    minWave: 2,
    weight: 3,
    coins: 5,
    gems: 0
  },
  dire_bat: {
    label: "Dire Bat",
    health: 1,
    damage: 1,
    speed: 170,
    height: 36,
    barWidth: 22,
    minWave: 3,
    weight: 3,
    retireWave: 10,
    coins: 3,
    gems: 0
  },
  bog_slime: {
    label: "Bog Slime",
    health: 4,
    damage: 1,
    speed: 46,
    height: 30,
    barWidth: 26,
    minWave: 3,
    weight: 3,
    coins: 6,
    gems: 0
  },
  orc: {
    label: "Orc Brute",
    health: 3,
    damage: 1,
    speed: 80,
    height: 48,
    barWidth: 28,
    minWave: 3,
    weight: 4,
    coins: 6,
    gems: 0
  },
  giant_spider: {
    label: "Giant Spider",
    health: 2,
    damage: 1,
    speed: 118,
    height: 32,
    barWidth: 26,
    minWave: 4,
    weight: 3,
    coins: 5,
    gems: 0
  },
  rotting_husk: {
    label: "Rotting Husk",
    health: 4,
    damage: 1,
    speed: 52,
    height: 46,
    barWidth: 26,
    minWave: 4,
    weight: 3,
    coins: 7,
    gems: 0
  },
  harpy: {
    label: "Screeching Harpy",
    health: 2,
    damage: 1,
    speed: 152,
    height: 48,
    barWidth: 26,
    minWave: 5,
    weight: 3,
    coins: 6,
    gems: 0
  },
  ogre: {
    label: "Bog Ogre",
    health: 5,
    damage: 1,
    speed: 56,
    height: 54,
    barWidth: 34,
    minWave: 5,
    weight: 2,
    coins: 9,
    gems: 1
  },
  gnoll: {
    label: "Gnoll Raider",
    health: 3,
    damage: 1,
    speed: 106,
    height: 48,
    barWidth: 28,
    minWave: 6,
    weight: 3,
    coins: 7,
    gems: 0
  },
  fire_imp: {
    label: "Fire Imp",
    health: 2,
    damage: 1,
    speed: 134,
    height: 34,
    barWidth: 22,
    minWave: 6,
    weight: 3,
    coins: 6,
    gems: 0
  },
  cave_troll: {
    label: "Cave Troll",
    health: 7,
    damage: 1,
    speed: 62,
    height: 68,
    barWidth: 34,
    minWave: 7,
    weight: 2,
    coins: 12,
    gems: 1
  },
  stone_golem: {
    label: "Stone Golem",
    health: 10,
    damage: 1,
    speed: 38,
    height: 76,
    barWidth: 36,
    minWave: 8,
    weight: 2,
    coins: 16,
    gems: 2
  },
  minotaur: {
    label: "Minotaur",
    health: 8,
    damage: 1,
    speed: 90,
    height: 72,
    barWidth: 34,
    minWave: 9,
    weight: 2,
    coins: 14,
    gems: 2
  },
  necromancer: {
    label: "Necromancer",
    health: 6,
    damage: 1,
    speed: 72,
    height: 50,
    barWidth: 28,
    minWave: 10,
    weight: 2,
    coins: 12,
    gems: 2
  },
  dragon_whelp: {
    label: "Dragon Whelp",
    health: 9,
    damage: 1,
    speed: 100,
    height: 46,
    barWidth: 32,
    minWave: 12,
    weight: 2,
    coins: 18,
    gems: 3
  },
  ironhide_juggernaut: {
    label: "Ironhide Juggernaut",
    health: 26,
    damage: 2,
    speed: 44,
    height: 78,
    barWidth: 42,
    weight: 1.4,
    debutWave: 25,
    maxPerWave: 1,
    isElite: true,
    coins: 30,
    gems: 4
  },
  obsidian_colossus: {
    label: "Obsidian Colossus",
    health: 50,
    damage: 3,
    speed: 40,
    height: 86,
    barWidth: 46,
    weight: 1.4,
    debutWave: 45,
    maxPerWave: 1,
    isElite: true,
    coins: 55,
    gems: 7
  },
  abyssal_behemoth: {
    label: "Abyssal Behemoth",
    health: 82,
    damage: 3,
    speed: 50,
    height: 92,
    barWidth: 50,
    weight: 1.4,
    debutWave: 65,
    maxPerWave: 2,
    isElite: true,
    coins: 90,
    gems: 11
  },
  voidplate_titan: {
    label: "Voidplate Titan",
    health: 120,
    damage: 4,
    speed: 54,
    height: 98,
    barWidth: 54,
    weight: 1.4,
    debutWave: 85,
    maxPerWave: 2,
    isElite: true,
    coins: 140,
    gems: 16
  },
  doomhorn_leviathan: {
    label: "Doomhorn Leviathan",
    health: 180,
    damage: 5,
    speed: 58,
    height: 106,
    barWidth: 60,
    weight: 1.4,
    debutWave: 110,
    maxPerWave: 3,
    isElite: true,
    coins: 220,
    gems: 26
  },
  warlord: {
    label: "Warlord Gorrak",
    health: 60,
    damage: 2,
    speed: 46,
    height: 98,
    barWidth: 64,
    minWave: Infinity,
    weight: 0,
    coins: 120,
    gems: 15,
    isBoss: true
  },
  bone_tyrant: {
    label: "The Bone Tyrant",
    health: 78,
    damage: 2,
    speed: 54,
    height: 102,
    barWidth: 64,
    minWave: Infinity,
    weight: 0,
    coins: 150,
    gems: 20,
    isBoss: true
  },
  elder_wyrm: {
    label: "Elder Wyrm",
    health: 96,
    damage: 2,
    speed: 62,
    height: 96,
    barWidth: 68,
    minWave: Infinity,
    weight: 0,
    coins: 190,
    gems: 25,
    isBoss: true
  }
};

const SPAWN_LANES = [
  [
    { x: -40, y: 176 }, { x: 100, y: 212 }, { x: 180, y: 244 }, { x: 240, y: 266 },
    { x: 282, y: 296 }, { x: 300, y: 340 }, { x: 300, y: 400 }, { x: 372, y: 500 },
    { x: 528, y: 604 }, { x: 646, y: 634 }, { x: 748, y: 644 }, { x: 790, y: 700 },
    { x: 800, y: 760 }, { x: 800, y: 856 }
  ],
  [
    { x: 568, y: -30 }, { x: 596, y: 150 }, { x: 630, y: 250 }, { x: 640, y: 352 },
    { x: 676, y: 420 }, { x: 736, y: 520 }, { x: 778, y: 622 }, { x: 800, y: 700 },
    { x: 800, y: 760 }, { x: 800, y: 856 }
  ],
  [
    { x: 1120, y: -30 }, { x: 1064, y: 200 }, { x: 1000, y: 344 }, { x: 968, y: 450 },
    { x: 892, y: 540 }, { x: 824, y: 624 }, { x: 800, y: 700 }, { x: 800, y: 760 },
    { x: 800, y: 856 }
  ],
  [
    { x: 1660, y: 240 }, { x: 1460, y: 244 }, { x: 1340, y: 296 }, { x: 1262, y: 530 },
    { x: 1080, y: 640 }, { x: 852, y: 654 }, { x: 800, y: 700 }, { x: 800, y: 760 },
    { x: 800, y: 856 }
  ]
];

function createDefaultCrossbow() {
  return { level: 1, tier: 0 };
}

const state = {
  screen: "loading",
  username: "",
  password: "",
  coins: STARTING_COINS,
  gems: 0,
  tentLevel: 1,
  tentHealth: TENT_LEVELS[0].maxHealth,
  tentUpgradeOpen: false,
  crossbowPanelOpen: false,
  crossbow: createDefaultCrossbow(),
  wall: null,
  wallPanelOpen: false,
  shopOpen: false,
  shopTab: "exchange",
  healingFire: false,
  healingFirePanelOpen: false,
  mine: false,
  windmill: false,
  paddock: false,
  buildings: [],
  buildPanelSlot: null,
  gameOver: false,
  paused: false,
  error: "",
  success: ""
};

const combat = {
  enemies: [],
  bolts: [],
  loot: [],
  units: [],
  blasts: [],
  phase: "peace",
  waveNumber: 1,
  phaseEndsAt: 0,
  lastSpawnAt: 0,
  eliteWaveCounts: {},
  mintAccumMs: 0,
  nextEnemyId: 1,
  nextBoltId: 1,
  nextLootId: 1,
  nextUnitId: 1,
  crossbowLastFireAt: 0,
  crossbowAimAngle: CROSSBOW_IDLE_AIM,
  loopRunning: false,
  loopFrame: 0,
  lastFrameTime: 0,
  pauseStartedAt: 0
};

let combatLayer = null;
let combatLoopId = 0;
let autoSaveTimer = 0;
let shopPausedGame = false;

function template(content, className = "center") {
  app.innerHTML = `<section class="screen ${className}">${content}</section>`;
}

async function postAccountRequest(endpoint, payload) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error("Could not reach the castle server. Check your connection and try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "The castle server could not handle that. Try again.");
  }

  return data;
}

function createAccountRequest(username, password) {
  return postAccountRequest("/api/create-account", { username, password });
}

function signInRequest(username, password) {
  return postAccountRequest("/api/sign-in", { username, password });
}

function uploadSaveRequest(username, password, save) {
  return postAccountRequest("/api/save", { username, password, save });
}

function readLocalBackup() {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.username === "string" && typeof parsed.password === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalBackup(username, password, save) {
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({ username, password, save }));
  } catch {}
}

function backupMatches(backup, username, password) {
  return Boolean(backup)
    && backup.username.toLowerCase() === username.toLowerCase()
    && backup.password === password;
}

async function restoreBackupToServer(backup) {
  const account = await createAccountRequest(backup.username, backup.password);
  if (!backup.save) return account;

  await uploadSaveRequest(backup.username, backup.password, backup.save);
  return { username: account.username, save: backup.save };
}

function restoreLocalBackup() {
  const backup = readLocalBackup();
  if (!backup || !backup.save) return;

  createAccount(backup.username, backup.password).catch(() => {});
}

async function signInAccount(username, password) {
  try {
    return await signInRequest(username, password);
  } catch (error) {
    const backup = readLocalBackup();
    if (!backupMatches(backup, username, password)) throw error;
    return restoreBackupToServer(backup);
  }
}

async function createAccount(username, password) {
  const account = await createAccountRequest(username, password);
  if (account.save) return account;

  const backup = readLocalBackup();
  if (!backupMatches(backup, username, password) || !backup.save) return account;

  await uploadSaveRequest(username, password, backup.save);
  return { username: account.username, save: backup.save };
}

function getCombatClock(now = performance.now()) {
  if (state.paused && combat.pauseStartedAt) {
    return combat.pauseStartedAt;
  }
  return now;
}

function serializeGameSave() {
  const now = getCombatClock();

  return {
    coins: state.coins,
    gems: state.gems,
    tentLevel: state.tentLevel,
    tentHealth: state.tentHealth,
    crossbow: { level: state.crossbow.level, tier: state.crossbow.tier },
    wall: state.wall ? { level: state.wall.level, health: state.wall.health } : null,
    buildings: state.buildings.map((entry) => (entry ? { id: entry.id, level: entry.level } : null)),
    healingFire: state.healingFire,
    mine: state.mine,
    windmill: state.windmill,
    paddock: state.paddock,
    gameOver: state.gameOver,
    paused: state.paused,
    combat: {
      enemies: combat.enemies.map((enemy) => ({ ...enemy })),
      bolts: combat.bolts.map((bolt) => ({ ...bolt })),
      loot: combat.loot.map((entry) => ({ ...entry })),
      units: combat.units.map((unit) => ({ ...unit })),
      phase: combat.phase,
      waveNumber: combat.waveNumber,
      phaseRemainingMs: Math.max(0, combat.phaseEndsAt - now),
      mintAccumMs: combat.mintAccumMs,
      nextEnemyId: combat.nextEnemyId,
      nextBoltId: combat.nextBoltId,
      nextLootId: combat.nextLootId,
      nextUnitId: combat.nextUnitId,
      crossbowAimAngle: combat.crossbowAimAngle
    }
  };
}

function applyGameSave(save) {
  if (!save) return false;

  const now = performance.now();

  state.coins = Number(save.coins) || 0;
  state.gems = Number(save.gems) || 0;
  state.tentLevel = Math.max(1, Number(save.tentLevel) || 1);
  state.tentHealth = Number(save.tentHealth) || getTentMaxHp();
  state.crossbow = save.crossbow
    ? {
        level: Math.min(CROSSBOW_MAX_LEVEL, Math.max(1, Number(save.crossbow.level) || 1)),
        tier: Math.min(WEAPON_TIERS.length - 1, Math.max(0, Number(save.crossbow.tier) || 0))
      }
    : createDefaultCrossbow();
  state.wall = save.wall
    ? { level: Math.max(1, Number(save.wall.level) || 1), health: Number(save.wall.health) || 0 }
    : null;
  if (state.wall && state.wall.health <= 0) {
    state.wall = null;
  }
  state.buildings = Array.isArray(save.buildings)
    ? save.buildings.map((entry) =>
        entry && typeof entry === "object" && getBuildingDef(entry.id)
          ? { id: entry.id, level: Math.min(getBuildingMaxLevel(entry.id), Math.max(1, Number(entry.level) || 1)) }
          : null
      )
    : [];
  state.healingFire = Boolean(save.healingFire);
  state.mine = Boolean(save.mine);
  state.windmill = Boolean(save.windmill);
  state.paddock = Boolean(save.paddock);
  state.gameOver = Boolean(save.gameOver);
  state.paused = Boolean(save.paused);
  combat.pauseStartedAt = state.paused ? performance.now() : 0;
  state.tentUpgradeOpen = false;
  state.crossbowPanelOpen = false;
  state.wallPanelOpen = false;
  state.healingFirePanelOpen = false;
  state.shopOpen = false;
  shopPausedGame = false;
  state.buildPanelSlot = null;

  resetCombatState();

  const savedCombat = save.combat;
  if (savedCombat) {
    combat.enemies = Array.isArray(savedCombat.enemies)
      ? savedCombat.enemies.map((enemy) => ({ ...enemy, lastAttackAt: 0 }))
      : [];
    combat.bolts = Array.isArray(savedCombat.bolts) ? savedCombat.bolts.map((bolt) => ({ ...bolt })) : [];
    combat.loot = Array.isArray(savedCombat.loot)
      ? savedCombat.loot.map((entry) => ({ ...entry, bornAt: now }))
      : [];
    combat.units = Array.isArray(savedCombat.units)
      ? savedCombat.units
          .filter((unit) => unit && UNIT_DEF[unit.type])
          .map((unit) => ({ ...unit, lastAttackAt: 0 }))
      : [];
    combat.phase = savedCombat.phase === "attack" ? "attack" : "peace";
    combat.waveNumber = Math.max(1, Number(savedCombat.waveNumber) || 1);
    combat.phaseEndsAt = now + Math.max(0, Number(savedCombat.phaseRemainingMs) || 0);
    combat.lastSpawnAt = combat.phase === "attack" ? now : 0;
    combat.mintAccumMs = Math.max(0, Number(savedCombat.mintAccumMs) || 0);
    combat.nextEnemyId = Math.max(1, Number(savedCombat.nextEnemyId) || 1);
    combat.nextBoltId = Math.max(1, Number(savedCombat.nextBoltId) || 1);
    combat.nextLootId = Math.max(1, Number(savedCombat.nextLootId) || 1);
    combat.nextUnitId = Math.max(1, Number(savedCombat.nextUnitId) || 1);
    combat.crossbowLastFireAt = 0;
    combat.crossbowAimAngle = Number(savedCombat.crossbowAimAngle) || CROSSBOW_IDLE_AIM;
  } else {
    startWaveCycle(now);
  }

  return true;
}

function saveAccountProgress() {
  if (!state.username || !state.password || state.screen !== "camp") return Promise.resolve();

  const save = serializeGameSave();
  writeLocalBackup(state.username, state.password, save);

  return uploadSaveRequest(state.username, state.password, save).catch(() => {});
}

function flushAccountProgress() {
  if (!state.username || !state.password || state.screen !== "camp") return;

  const save = serializeGameSave();
  writeLocalBackup(state.username, state.password, save);

  const payload = JSON.stringify({
    username: state.username,
    password: state.password,
    save
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/save", new Blob([payload], { type: "application/json" }));
    return;
  }

  saveAccountProgress();
}

function startAutoSave() {
  stopAutoSave();
  autoSaveTimer = setInterval(saveAccountProgress, AUTO_SAVE_INTERVAL_MS);
}

function stopAutoSave() {
  if (!autoSaveTimer) return;
  clearInterval(autoSaveTimer);
  autoSaveTimer = 0;
}

function statusLine() {
  if (state.error) return `<p class="message error">${state.error}</p>`;
  if (state.success) return `<p class="message success">${state.success}</p>`;
  return `<p class="message"></p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pixelSnakeLetter(headSide = "right") {
  return Array.from({ length: 35 }, (_, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const isTop = row === 0;
    const isMiddle = row === 3;
    const isBottom = row === 6;
    const isLeftCurve = col === 0 && row > 0 && row < 3;
    const isRightCurve = col === 4 && row > 3 && row < 6;
    const isHead = row === 0 && ((headSide === "right" && col === 4) || (headSide === "left" && col === 0));
    const isMetal = isTop || isMiddle || isBottom || isLeftCurve || isRightCurve;
    return `<span class="snake-letter-pixel ${isMetal ? "metal" : ""} ${isHead ? `head head-${headSide}` : ""}"></span>`;
  }).join("");
}

function renderStudioIntro() {
  template(`
    <div class="studio-intro">
      <div class="snake-mark" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p class="studio-kicker">Loading game by</p>
      <h1 class="studio-name" aria-label="CyberSnakeStudios">
        <span>Cyber</span><span class="snake-letter">${pixelSnakeLetter("right")}</span><span>nake</span><span class="snake-letter">${pixelSnakeLetter("right")}</span><span>tudios</span>
      </h1>
      <div class="pixel-metal-snake" aria-hidden="true">
        <span class="snake-pixel tail"></span>
        <span class="snake-pixel body low"></span>
        <span class="snake-pixel body"></span>
        <span class="snake-pixel body high"></span>
        <span class="snake-pixel body"></span>
        <span class="snake-pixel body low"></span>
        <span class="snake-pixel body"></span>
        <span class="snake-pixel body high"></span>
        <span class="snake-pixel body"></span>
        <span class="snake-pixel body low"></span>
        <span class="snake-pixel body"></span>
        <span class="snake-pixel head"></span>
      </div>
      <p class="studio-status">Raising the drawbridge, arming the guards, and preparing the castle for battle...</p>
    </div>
  `, "center studio-screen");
}

function starField() {
  return Array.from({ length: 54 }, (_, index) => {
    const left = (index * 37) % 100;
    const top = (index * 53) % 64;
    const size = index % 5 === 0 ? 3 : 2;
    const delay = ((index * 17) % 45) / 10;
    return `<span class="auth-star" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-delay:${delay}s"></span>`;
  }).join("");
}

function emberField() {
  return Array.from({ length: 14 }, (_, index) => {
    const left = 4 + index * 6.8;
    const delay = (index * 0.63).toFixed(2);
    const duration = 6 + (index % 5);
    return `<span class="auth-ember" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s"></span>`;
  }).join("");
}

function merlonRow(startX, endX, topY, merlonWidth, gap, merlonHeight) {
  const rects = [];
  for (let x = startX; x + merlonWidth <= endX; x += merlonWidth + gap) {
    rects.push(`<rect x="${x}" y="${topY - merlonHeight}" width="${merlonWidth}" height="${merlonHeight + 4}"/>`);
  }
  return rects.join("");
}

function skylineTower(x, width, topY, hasRoof) {
  const roof = hasRoof
    ? `<polygon class="auth-tower-roof" points="${x - 8},${topY - 20} ${x + width / 2},${topY - 62} ${x + width + 8},${topY - 20}"/>`
    : "";
  const windows = `
    <rect class="auth-window" x="${x + width / 2 - 13}" y="${topY + 28}" width="9" height="14" rx="4"/>
    <rect class="auth-window" x="${x + width / 2 + 4}" y="${topY + 28}" width="9" height="14" rx="4"/>
    <rect class="auth-window" x="${x + width / 2 - 5}" y="${topY + 66}" width="10" height="15" rx="5"/>
  `;

  return `
    <g>
      <rect x="${x}" y="${topY}" width="${width}" height="${300 - topY}"/>
      ${merlonRow(x + 5, x + width - 5, topY, 14, 12, 16)}
      ${roof}
      ${windows}
    </g>
  `;
}

function castleSkylineSvg() {
  return `
    <svg class="auth-castle" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
      <g class="auth-castle-body">
        <rect x="0" y="196" width="1200" height="104"/>
        ${merlonRow(14, 1186, 196, 20, 20, 18)}
        ${skylineTower(96, 104, 128, true)}
        ${skylineTower(478, 244, 74, false)}
        ${skylineTower(1000, 104, 138, true)}
        <rect x="566" y="222" width="68" height="78" rx="34"/>
      </g>
      <g class="auth-castle-gate">
        <rect x="572" y="228" width="56" height="72" rx="28"/>
      </g>
    </svg>
  `;
}

function userIcon() {
  return `
    <svg class="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.75"/>
      <path d="M4.5 20.5c0-4.15 3.35-6.75 7.5-6.75s7.5 2.6 7.5 6.75"/>
    </svg>
  `;
}

function lockIcon() {
  return `
    <svg class="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.25" y="10.25" width="15.5" height="10.5" rx="3"/>
      <path d="M8.25 10.25V7.5a3.75 3.75 0 0 1 7.5 0v2.75"/>
    </svg>
  `;
}

function passwordToggle() {
  return `
    <button class="auth-toggle" type="button" data-action="toggle-password" aria-label="Show password">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z"/>
        <circle cx="12" cy="12" r="3.25"/>
        <line class="auth-toggle-slash" x1="4" y1="20" x2="20" y2="4"/>
      </svg>
    </button>
  `;
}

function crestSvg() {
  return `
    <svg class="auth-crest-mark" viewBox="0 0 64 72" aria-hidden="true">
      <path class="crest-shield" d="M32 2 60 12.5V38c0 17.5-11.5 27.8-28 32C15.5 65.8 4 55.5 4 38V12.5L32 2Z"/>
      <path class="crest-shield-inner" d="M32 8.5 54.5 17v20.6c0 14.3-9.4 23-22.5 26.6C18.9 60.6 9.5 51.9 9.5 37.6V17L32 8.5Z"/>
      <g class="crest-tower">
        <rect x="21" y="28.5" width="22" height="5"/>
        <rect x="21" y="23" width="5.5" height="5.5"/>
        <rect x="29.25" y="23" width="5.5" height="5.5"/>
        <rect x="37.5" y="23" width="5.5" height="5.5"/>
        <rect x="24.5" y="33.5" width="15" height="20"/>
      </g>
      <g class="crest-lights">
        <rect x="27.5" y="37" width="3" height="4.5" rx="1.5"/>
        <rect x="33.5" y="37" width="3" height="4.5" rx="1.5"/>
        <rect x="30" y="46" width="4" height="7.5" rx="2"/>
      </g>
      <path class="crest-flag" d="M32 23V13l11 3.75L32 20.5Z"/>
    </svg>
  `;
}

function renderAuthScene(content) {
  template(`
    <div class="auth-sky" aria-hidden="true">
      <span class="auth-moon"></span>
      <div class="auth-stars">${starField()}</div>
    </div>
    <div class="auth-horizon" aria-hidden="true">
      <span class="auth-torch auth-torch-left"></span>
      <span class="auth-torch auth-torch-right"></span>
      ${castleSkylineSvg()}
      <div class="auth-embers">${emberField()}</div>
    </div>
    ${content}
  `, "center auth-screen");
}

function renderSignIn() {
  renderAuthScene(`
    <div class="auth-card">
      <div class="auth-crest">${crestSvg()}</div>
      <p class="auth-kicker">Castle Shields 2</p>
      <h1 class="auth-title">Sign In to Account</h1>
      <p class="auth-subtitle">Return to your keep with the username and password you created together.</p>
      <form class="auth-form" data-form="sign-in">
        <label class="auth-field">
          <span class="auth-field-label">Username</span>
          <span class="auth-input-wrap">
            ${userIcon()}
            <input name="username" type="text" autocomplete="username" placeholder="Your knight name" required>
          </span>
        </label>
        <label class="auth-field">
          <span class="auth-field-label">Password</span>
          <span class="auth-input-wrap">
            ${lockIcon()}
            <input name="password" type="password" autocomplete="current-password" placeholder="Castle passphrase" required>
            ${passwordToggle()}
          </span>
        </label>
        ${statusLine()}
        <button class="auth-button" type="submit">
          <span>Enter the Castle</span>
        </button>
        <div class="auth-divider"><span>New to the realm?</span></div>
        <button class="auth-button ghost" type="button" data-action="show-create-account">Create Account</button>
        <p class="auth-save-hint">Your castle saves on the server and keeps a copy in this browser, so it comes back even if the server restarts.</p>
      </form>
    </div>
  `);
}

function renderCreateAccount() {
  renderAuthScene(`
    <div class="auth-card">
      <div class="auth-crest">${crestSvg()}</div>
      <p class="auth-kicker">Castle Shields 2</p>
      <h1 class="auth-title">Create Account</h1>
      <p class="auth-subtitle">Choose the username and password you want for your castle. You will need both together to sign back in.</p>
      <form class="auth-form" data-form="create-account">
        <label class="auth-field">
          <span class="auth-field-label">Username</span>
          <span class="auth-input-wrap">
            ${userIcon()}
            <input name="username" type="text" autocomplete="username" placeholder="Pick a knight name" required>
          </span>
        </label>
        <label class="auth-field">
          <span class="auth-field-label">Password</span>
          <span class="auth-input-wrap">
            ${lockIcon()}
            <input name="password" type="password" autocomplete="new-password" placeholder="Pick a castle passphrase" required>
            ${passwordToggle()}
          </span>
        </label>
        ${statusLine()}
        <button class="auth-button" type="submit">
          <span>Claim Your Keep</span>
        </button>
        <div class="auth-divider"><span>Already have a castle?</span></div>
        <button class="auth-button ghost" type="button" data-action="show-sign-in">Back to Sign In</button>
      </form>
    </div>
  `);
}

const RIVER_PATH = "M -40 330 C 100 330 180 370 300 370 C 420 370 520 320 640 320 C 760 320 880 372 1000 372 C 1120 372 1220 318 1340 318 C 1440 318 1560 344 1660 344";

const ROADS = [
  "M 800 830 L 800 694",
  "M 748 644 C 646 634 528 604 434 542 C 372 500 318 444 300 400 L 300 340 C 282 296 240 266 180 244 C 100 212 40 186 -40 176",
  "M 778 622 C 762 578 736 520 706 470 C 676 420 650 380 640 352 L 640 292 C 630 250 610 200 596 150 C 584 104 574 40 568 -30",
  "M 824 624 C 852 588 892 540 930 494 C 968 450 992 410 1000 398 L 1000 344 C 1010 300 1040 250 1064 200 C 1090 140 1112 60 1120 -30",
  "M 852 654 C 950 662 1080 640 1180 580 C 1262 530 1316 440 1336 380 L 1340 296 C 1354 268 1400 250 1460 244 C 1530 238 1590 238 1660 240"
];

const CAMP_TREES = [
  { x: 340, y: 72, scale: 0.5, type: "pine" },
  { x: 420, y: 60, scale: 0.46, type: "oak" },
  { x: 478, y: 84, scale: 0.52, type: "pine" },
  { x: 900, y: 66, scale: 0.5, type: "oak" },
  { x: 966, y: 84, scale: 0.46, type: "pine" },
  { x: 1180, y: 70, scale: 0.5, type: "oak" },
  { x: 1240, y: 88, scale: 0.48, type: "pine" },
  { x: 1490, y: 64, scale: 0.5, type: "oak" },
  { x: 1556, y: 88, scale: 0.46, type: "pine" },
  { x: 250, y: 196, scale: 0.5, type: "oak" },
  { x: 40, y: 264, scale: 0.55, type: "pine" },
  { x: 350, y: 180, scale: 0.56, type: "oak" },
  { x: 430, y: 240, scale: 0.6, type: "pine" },
  { x: 500, y: 150, scale: 0.5, type: "oak" },
  { x: 330, y: 270, scale: 0.54, type: "pine" },
  { x: 520, y: 252, scale: 0.52, type: "oak" },
  { x: 700, y: 252, scale: 0.56, type: "pine" },
  { x: 790, y: 264, scale: 0.54, type: "oak" },
  { x: 880, y: 240, scale: 0.5, type: "pine" },
  { x: 950, y: 272, scale: 0.52, type: "oak" },
  { x: 1180, y: 236, scale: 0.56, type: "pine" },
  { x: 1258, y: 200, scale: 0.52, type: "oak" },
  { x: 1290, y: 272, scale: 0.5, type: "pine" },
  { x: 1460, y: 170, scale: 0.5, type: "oak" },
  { x: 1540, y: 202, scale: 0.54, type: "pine" },
  { x: 60, y: 430, scale: 0.6, type: "pine" },
  { x: 150, y: 452, scale: 0.56, type: "oak" },
  { x: 240, y: 430, scale: 0.5, type: "pine" },
  { x: 70, y: 660, scale: 0.6, type: "oak" },
  { x: 180, y: 682, scale: 0.58, type: "pine" },
  { x: 300, y: 700, scale: 0.54, type: "oak" },
  { x: 40, y: 762, scale: 0.5, type: "pine" },
  { x: 334, y: 606, scale: 0.5, type: "pine" },
  { x: 352, y: 642, scale: 0.56, type: "oak" },
  { x: 420, y: 700, scale: 0.6, type: "pine" },
  { x: 470, y: 642, scale: 0.54, type: "oak" },
  { x: 600, y: 742, scale: 0.5, type: "pine" },
  { x: 880, y: 722, scale: 0.56, type: "oak" },
  { x: 980, y: 742, scale: 0.6, type: "pine" },
  { x: 1080, y: 700, scale: 0.52, type: "oak" },
  { x: 1140, y: 762, scale: 0.56, type: "pine" },
  { x: 1420, y: 432, scale: 0.6, type: "pine" },
  { x: 1500, y: 502, scale: 0.58, type: "oak" },
  { x: 1300, y: 562, scale: 0.56, type: "pine" },
  { x: 1400, y: 642, scale: 0.6, type: "oak" },
  { x: 1520, y: 702, scale: 0.54, type: "pine" },
  { x: 1240, y: 622, scale: 0.5, type: "oak" },
  { x: 1562, y: 602, scale: 0.5, type: "pine" },
  { x: 480, y: 942, scale: 0.6, type: "pine" },
  { x: 556, y: 962, scale: 0.5, type: "oak" },
  { x: 1080, y: 946, scale: 0.58, type: "oak" },
  { x: 1520, y: 934, scale: 0.56, type: "pine" },
  { x: 1100, y: 880, scale: 0.52, type: "oak" },
  { x: 60, y: 952, scale: 0.55, type: "pine" },
  { x: 300, y: 962, scale: 0.5, type: "oak" }
];

const CAMP_BUSHES = [
  { x: 128, y: 388, scale: 0.6 },
  { x: 268, y: 486, scale: 0.55 },
  { x: 402, y: 268, scale: 0.5 },
  { x: 620, y: 236, scale: 0.55 },
  { x: 866, y: 292, scale: 0.6 },
  { x: 1148, y: 296, scale: 0.5 },
  { x: 1436, y: 268, scale: 0.55 },
  { x: 96, y: 592, scale: 0.6 },
  { x: 244, y: 646, scale: 0.5 },
  { x: 396, y: 758, scale: 0.55 },
  { x: 532, y: 636, scale: 0.5 },
  { x: 680, y: 782, scale: 0.55 },
  { x: 928, y: 782, scale: 0.5 },
  { x: 1046, y: 756, scale: 0.6 },
  { x: 1222, y: 552, scale: 0.55 },
  { x: 1356, y: 486, scale: 0.5 },
  { x: 1466, y: 610, scale: 0.6 },
  { x: 1552, y: 782, scale: 0.55 },
  { x: 176, y: 950, scale: 0.5 },
  { x: 420, y: 916, scale: 0.55 },
  { x: 1160, y: 966, scale: 0.6 },
  { x: 1330, y: 966, scale: 0.5 }
];

const CAMP_ROCKS = [
  { x: 96, y: 336, scale: 0.55 },
  { x: 380, y: 308, scale: 0.5 },
  { x: 700, y: 300, scale: 0.55 },
  { x: 900, y: 330, scale: 0.5 },
  { x: 1230, y: 336, scale: 0.55 },
  { x: 1520, y: 300, scale: 0.5 },
  { x: 132, y: 496, scale: 0.6 },
  { x: 286, y: 556, scale: 0.5 },
  { x: 452, y: 618, scale: 0.55 },
  { x: 620, y: 700, scale: 0.5 },
  { x: 1006, y: 690, scale: 0.55 },
  { x: 1176, y: 690, scale: 0.6 },
  { x: 1290, y: 470, scale: 0.5 },
  { x: 1476, y: 402, scale: 0.55 },
  { x: 1560, y: 500, scale: 0.5 },
  { x: 120, y: 880, scale: 0.55 },
  { x: 520, y: 848, scale: 0.5 },
  { x: 700, y: 976, scale: 0.55 },
  { x: 1046, y: 866, scale: 0.5 },
  { x: 1442, y: 726, scale: 0.6 }
];

function sceneDefs() {
  return `
    <defs>
      <radialGradient id="grassFill" cx="30%" cy="14%" r="88%">
        <stop offset="0%" stop-color="#67b144"/>
        <stop offset="50%" stop-color="#45913b"/>
        <stop offset="100%" stop-color="#276627"/>
      </radialGradient>
      <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6fd3ec"/>
        <stop offset="44%" stop-color="#31a2d4"/>
        <stop offset="100%" stop-color="#1a6ba6"/>
      </linearGradient>
      <linearGradient id="dirtFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c69f68"/>
        <stop offset="100%" stop-color="#a07a49"/>
      </linearGradient>
      <linearGradient id="canvasLit" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f6ecd6"/>
        <stop offset="100%" stop-color="#dcc9a4"/>
      </linearGradient>
      <linearGradient id="canvasShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#c7b189"/>
        <stop offset="100%" stop-color="#a08c68"/>
      </linearGradient>
      <linearGradient id="woodFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a9763f"/>
        <stop offset="100%" stop-color="#7b5228"/>
      </linearGradient>
      <linearGradient id="cabinLog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d0a367"/>
        <stop offset="52%" stop-color="#ac7a41"/>
        <stop offset="100%" stop-color="#8a5c2c"/>
      </linearGradient>
      <linearGradient id="stoneFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#cfd8e3"/>
        <stop offset="100%" stop-color="#8c9aad"/>
      </linearGradient>
      <linearGradient id="mountainFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6d84a6"/>
        <stop offset="100%" stop-color="#3d5372"/>
      </linearGradient>
      <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(251, 146, 60, 0.62)"/>
        <stop offset="60%" stop-color="rgba(251, 146, 60, 0.16)"/>
        <stop offset="100%" stop-color="rgba(251, 146, 60, 0)"/>
      </radialGradient>
      <radialGradient id="sunWash" cx="26%" cy="8%" r="80%">
        <stop offset="0%" stop-color="rgba(255, 246, 199, 0.3)"/>
        <stop offset="100%" stop-color="rgba(255, 246, 199, 0)"/>
      </radialGradient>
      <linearGradient id="goblinSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#93c948"/>
        <stop offset="100%" stop-color="#4c7a1d"/>
      </linearGradient>
      <linearGradient id="orcSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6b9a3c"/>
        <stop offset="100%" stop-color="#2f5418"/>
      </linearGradient>
      <linearGradient id="ogreSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b3b884"/>
        <stop offset="100%" stop-color="#6c7442"/>
      </linearGradient>
      <linearGradient id="wraithCloak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#58497f"/>
        <stop offset="100%" stop-color="#1b1533"/>
      </linearGradient>
      <linearGradient id="monsterIron" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#eef2f8"/>
        <stop offset="52%" stop-color="#a7b2c2"/>
        <stop offset="100%" stop-color="#6b7889"/>
      </linearGradient>
      <linearGradient id="monsterLeather" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9d7043"/>
        <stop offset="100%" stop-color="#5b3c20"/>
      </linearGradient>
      <radialGradient id="wraithGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(125, 231, 255, 0.42)"/>
        <stop offset="62%" stop-color="rgba(125, 231, 255, 0.12)"/>
        <stop offset="100%" stop-color="rgba(125, 231, 255, 0)"/>
      </radialGradient>
      <linearGradient id="ratFur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9aa6b6"/>
        <stop offset="100%" stop-color="#475569"/>
      </linearGradient>
      <linearGradient id="boneWhite" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#b8c2cf"/>
      </linearGradient>
      <linearGradient id="koboldHide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f0a63c"/>
        <stop offset="100%" stop-color="#92400e"/>
      </linearGradient>
      <linearGradient id="batWing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7c5bd0"/>
        <stop offset="100%" stop-color="#2e1065"/>
      </linearGradient>
      <linearGradient id="slimeGoo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9df7b4"/>
        <stop offset="100%" stop-color="#15803d"/>
      </linearGradient>
      <linearGradient id="chitin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6d43c8"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
      <linearGradient id="rotFlesh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9fb277"/>
        <stop offset="100%" stop-color="#4b5d38"/>
      </linearGradient>
      <linearGradient id="harpyFeather" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d8b4fe"/>
        <stop offset="100%" stop-color="#6d28d9"/>
      </linearGradient>
      <linearGradient id="gnollFur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e0ad63"/>
        <stop offset="100%" stop-color="#7c4a21"/>
      </linearGradient>
      <linearGradient id="impSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fb8a8a"/>
        <stop offset="100%" stop-color="#991b1b"/>
      </linearGradient>
      <linearGradient id="trollHide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#94ab74"/>
        <stop offset="100%" stop-color="#3f5233"/>
      </linearGradient>
      <linearGradient id="golemStone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d5dde8"/>
        <stop offset="100%" stop-color="#5b6879"/>
      </linearGradient>
      <linearGradient id="minotaurFur" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ad7136"/>
        <stop offset="100%" stop-color="#3f2410"/>
      </linearGradient>
      <linearGradient id="necroRobe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4f46c8"/>
        <stop offset="100%" stop-color="#0b1030"/>
      </linearGradient>
      <linearGradient id="dragonScale" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4ade80"/>
        <stop offset="100%" stop-color="#065f46"/>
      </linearGradient>
      <linearGradient id="wyrmScale" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f0abfc"/>
        <stop offset="100%" stop-color="#581c87"/>
      </linearGradient>
      <linearGradient id="juggerIron" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#cbd5e1"/>
        <stop offset="55%" stop-color="#64748b"/>
        <stop offset="100%" stop-color="#293548"/>
      </linearGradient>
      <linearGradient id="juggerHide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a8703c"/>
        <stop offset="100%" stop-color="#432a12"/>
      </linearGradient>
      <linearGradient id="obsidianRock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#55627a"/>
        <stop offset="45%" stop-color="#1f2937"/>
        <stop offset="100%" stop-color="#090f1c"/>
      </linearGradient>
      <linearGradient id="obsidianMagma" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fde68a"/>
        <stop offset="50%" stop-color="#f97316"/>
        <stop offset="100%" stop-color="#b91c1c"/>
      </linearGradient>
      <linearGradient id="abyssHide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5eead4"/>
        <stop offset="45%" stop-color="#0f766e"/>
        <stop offset="100%" stop-color="#042f2e"/>
      </linearGradient>
      <linearGradient id="abyssShell" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a5f3fc"/>
        <stop offset="100%" stop-color="#155e75"/>
      </linearGradient>
      <linearGradient id="voidPlate" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c4b5fd"/>
        <stop offset="45%" stop-color="#6d28d9"/>
        <stop offset="100%" stop-color="#1b1745"/>
      </linearGradient>
      <linearGradient id="voidFlesh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4c1d95"/>
        <stop offset="100%" stop-color="#0b0820"/>
      </linearGradient>
      <linearGradient id="doomHide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f87171"/>
        <stop offset="45%" stop-color="#b91c1c"/>
        <stop offset="100%" stop-color="#430a0a"/>
      </linearGradient>
      <linearGradient id="doomHorn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fef3c7"/>
        <stop offset="100%" stop-color="#a16207"/>
      </linearGradient>
      <radialGradient id="eliteAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(56, 189, 248, 0.3)"/>
        <stop offset="60%" stop-color="rgba(129, 140, 248, 0.12)"/>
        <stop offset="100%" stop-color="rgba(129, 140, 248, 0)"/>
      </radialGradient>
      <linearGradient id="bossPlate" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fde68a"/>
        <stop offset="48%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#4a2409"/>
      </linearGradient>
      <radialGradient id="bossAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(248, 113, 113, 0.34)"/>
        <stop offset="60%" stop-color="rgba(248, 113, 113, 0.12)"/>
        <stop offset="100%" stop-color="rgba(248, 113, 113, 0)"/>
      </radialGradient>
    </defs>
  `;
}

function distantHills() {
  return `
    <g class="distant">
      <path class="mountain-far" d="M -20 96 L 120 18 L 210 74 L 320 6 L 430 78 L 540 26 L 660 86 L 760 30 L 880 84 L 1000 22 L 1120 80 L 1240 18 L 1360 76 L 1470 24 L 1620 90 L 1620 120 L -20 120 Z"/>
      <path class="mountain-snow" d="M 320 6 L 288 26 L 306 30 L 320 22 L 336 32 L 352 26 Z M 1000 22 L 972 40 L 990 44 L 1002 36 L 1018 46 L 1032 40 Z M 1470 24 L 1444 42 L 1462 46 L 1474 38 L 1490 48 L 1504 42 Z"/>
      <path class="far-forest" d="M -20 118 q 44 -30 88 -12 q 36 -26 76 -6 q 44 -28 90 -8 q 40 -24 82 -4 q 46 -26 94 -6 q 40 -22 84 -4 q 48 -24 96 -6 q 44 -20 88 -2 q 42 -20 86 -4 q 46 -22 92 -2 q 40 -18 82 -2 q 36 -14 74 2 L 1620 150 L -20 150 Z"/>
    </g>
  `;
}

function grassDetail() {
  const patches = [
    [220, 470, 210, 82],
    [640, 780, 240, 88],
    [1220, 700, 220, 84],
    [420, 200, 190, 70],
    [1040, 240, 200, 74],
    [1480, 460, 180, 70],
    [860, 520, 210, 78],
    [140, 800, 190, 72],
    [1300, 960, 200, 72],
    [560, 960, 190, 70]
  ]
    .map(([cx, cy, rx, ry]) => `<ellipse class="grass-patch" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)
    .join("");

  const tufts = Array.from({ length: 300 }, (_, index) => {
    const x = (index * 239) % 1600;
    const y = 130 + ((index * 431) % 860);
    const flip = index % 2 === 0 ? 1 : -1;
    return `<path class="grass-tuft" d="M ${x} ${y} q ${2 * flip} -5 ${flip} -8 M ${x + 3} ${y} q ${3 * flip} -4 ${4 * flip} -7 M ${x - 3} ${y} q ${-2 * flip} -4 ${-3 * flip} -7"/>`;
  }).join("");

  const flowers = Array.from({ length: 70 }, (_, index) => {
    const x = (index * 331) % 1590;
    const y = 140 + ((index * 277) % 840);
    const color = index % 3 === 0 ? "#fde68a" : index % 3 === 1 ? "#fbcfe8" : "#e0f2fe";
    return `
      <g class="grass-flower">
        <circle cx="${x}" cy="${y}" r="1.8" fill="${color}"/>
        <circle cx="${x + 4}" cy="${y + 2}" r="1.5" fill="${color}"/>
        <circle cx="${x - 4}" cy="${y + 3}" r="1.3" fill="${color}"/>
      </g>
    `;
  }).join("");

  return `<g class="grass-detail">${patches}${tufts}${flowers}</g>`;
}

function riverCenterY(x) {
  const anchors = [[-40, 330], [300, 370], [640, 320], [1000, 372], [1340, 318], [1660, 344]];
  for (let index = 0; index < anchors.length - 1; index += 1) {
    const [x0, y0] = anchors[index];
    const [x1, y1] = anchors[index + 1];
    if (x >= x0 && x <= x1) {
      const ease = 0.5 - Math.cos((Math.PI * (x - x0)) / (x1 - x0)) / 2;
      return y0 + (y1 - y0) * ease;
    }
  }
  return 330;
}

function riverGroup() {
  const ripples = Array.from({ length: 5 }, (_, index) => {
    const offset = (index - 2) * 8;
    return `<path class="river-ripple" style="animation-delay:${(index * 0.8).toFixed(1)}s" d="${RIVER_PATH}" transform="translate(0 ${offset})"/>`;
  }).join("");

  const rocks = [
    [170, 348, 11, 8],
    [470, 340, 9, 7],
    [830, 348, 12, 8],
    [1160, 350, 10, 7],
    [1470, 330, 11, 8]
  ]
    .map(([cx, cy, rx, ry]) => `
      <g>
        <ellipse class="river-foam" cx="${cx}" cy="${cy + 3}" rx="${rx + 6}" ry="${ry + 3}"/>
        <ellipse class="river-rock" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
        <ellipse class="river-rock-top" cx="${cx - 2}" cy="${cy - 2}" rx="${rx * 0.55}" ry="${ry * 0.45}"/>
      </g>
    `)
    .join("");

  const lilies = [
    [420, 356],
    [440, 344],
    [740, 330],
    [1080, 380],
    [1100, 366],
    [1420, 330],
    [230, 384]
  ]
    .map(([cx, cy]) => `
      <g class="river-lily">
        <circle cx="${cx}" cy="${cy}" r="8"/>
        <path class="river-lily-cut" d="M ${cx} ${cy} l 7 -4 a 8 8 0 0 0 -7 -4 Z"/>
      </g>
    `)
    .join("");

  const reeds = Array.from({ length: 52 }, (_, index) => {
    const x = 12 + index * 31;
    const northBank = index % 2 === 0;
    const centerY = riverCenterY(x);
    const y = northBank ? centerY - 25 - ((index * 7) % 8) : centerY + 25 + ((index * 9) % 9);
    const lean = index % 3 === 0 ? 4 : index % 3 === 1 ? -4 : 2;
    return `
      <g class="river-reed" style="animation-delay:${((index % 7) * 0.4).toFixed(1)}s">
        <path d="M ${x} ${y.toFixed(1)} q ${lean} -9 ${lean * 1.6} -18"/>
        <path d="M ${x + 5} ${y.toFixed(1)} q ${lean * 0.7} -7 ${lean * 1.2} -14"/>
        <path d="M ${x - 4} ${y.toFixed(1)} q ${lean * 0.5} -6 ${lean} -12"/>
      </g>
    `;
  }).join("");

  return `
    <g class="river">
      <path class="river-bank" d="${RIVER_PATH}"/>
      <path class="river-sand" d="${RIVER_PATH}"/>
      <path class="river-water" d="${RIVER_PATH}"/>
      <path class="river-shallow" d="${RIVER_PATH}"/>
      ${ripples}
      ${rocks}
      ${lilies}
      ${reeds}
    </g>
  `;
}

function pondGroup() {
  const ripples = Array.from({ length: 3 }, (_, index) => `
    <ellipse class="pond-ripple" cx="1330" cy="856" rx="34" ry="17" style="animation-delay:${(index * 1.4).toFixed(1)}s"/>
  `).join("");

  const cattails = [
    [1196, 828],
    [1210, 900],
    [1462, 838],
    [1444, 906],
    [1284, 942],
    [1382, 786]
  ]
    .map(([x, y], index) => `
      <g class="river-reed" style="animation-delay:${(index * 0.5).toFixed(1)}s">
        <path d="M ${x} ${y} q 4 -14 6 -26"/>
        <path d="M ${x + 6} ${y} q 3 -11 4 -20"/>
        <rect class="cattail-head" x="${x + 4}" y="${y - 36}" width="4.6" height="12" rx="2.3"/>
      </g>
    `)
    .join("");

  const ducks = [
    { x: 1288, y: 848, delay: 0 },
    { x: 1368, y: 872, delay: 2.2 }
  ]
    .map((duck) => `
      <g transform="translate(${duck.x} ${duck.y})">
        <g class="duck" style="animation-delay:${duck.delay}s">
          <ellipse class="duck-body" cx="0" cy="0" rx="13" ry="7.5"/>
          <path class="duck-tail" d="M -12 -2 l -7 -5 l 2 7 Z"/>
          <circle class="duck-head" cx="9" cy="-9" r="5.2"/>
          <path class="duck-beak" d="M 13 -9 l 7 2 l -7 2 Z"/>
          <ellipse class="pond-wake" cx="-2" cy="6" rx="17" ry="4"/>
        </g>
      </g>
    `)
    .join("");

  return `
    <g class="pond">
      <ellipse class="pond-bank" cx="1330" cy="862" rx="156" ry="88"/>
      <ellipse class="pond-sand" cx="1330" cy="862" rx="144" ry="78"/>
      <ellipse class="pond-water" cx="1330" cy="862" rx="132" ry="68"/>
      <ellipse class="pond-shallow" cx="1330" cy="854" rx="104" ry="46"/>
      ${ripples}
      <g class="river-lily">
        <circle cx="1250" cy="892" r="8"/>
        <path class="river-lily-cut" d="M 1250 892 l 7 -4 a 8 8 0 0 0 -7 -4 Z"/>
      </g>
      <g class="river-lily">
        <circle cx="1408" cy="836" r="7"/>
        <path class="river-lily-cut" d="M 1408 836 l 6 -3 a 7 7 0 0 0 -6 -4 Z"/>
      </g>
      ${cattails}
      ${ducks}
    </g>
  `;
}

function roadNetwork() {
  const footpaths = [
    "M 800 838 C 764 852 716 862 664 872",
    "M 800 838 C 842 852 892 860 944 868"
  ];

  const pebbles = [
    [786, 760], [812, 726], [792, 700],
    [700, 632], [600, 608], [500, 570], [412, 512], [340, 440], [300, 366], [268, 300], [190, 254], [96, 208],
    [768, 590], [740, 520], [700, 448], [660, 380], [640, 312], [620, 240], [598, 160], [580, 72],
    [836, 596], [880, 536], [930, 470], [980, 410], [1000, 318], [1026, 256], [1070, 170], [1100, 80],
    [886, 656], [980, 656], [1090, 620], [1190, 566], [1280, 482], [1336, 348], [1380, 266], [1470, 246], [1560, 242]
  ]
    .map(([cx, cy], index) => `<ellipse class="road-pebble" cx="${cx}" cy="${cy}" rx="${2.2 + (index % 3) * 0.7}" ry="${1.6 + (index % 2) * 0.6}"/>`)
    .join("");

  return `
    <g class="roads">
      ${footpaths.map((d) => `<path class="trail-edge" d="${d}"/>`).join("")}
      ${footpaths.map((d) => `<path class="trail-dirt" d="${d}"/>`).join("")}
      ${ROADS.map((d) => `<path class="road-edge" d="${d}"/>`).join("")}
      <ellipse class="road-edge-fill" cx="800" cy="650" rx="74" ry="44"/>
      <ellipse class="road-edge-fill" cx="800" cy="884" rx="214" ry="98"/>
      ${ROADS.map((d) => `<path class="road-dirt" d="${d}"/>`).join("")}
      <ellipse class="road-dirt-fill" cx="800" cy="650" rx="66" ry="38"/>
      <ellipse class="road-dirt-fill" cx="800" cy="884" rx="206" ry="91"/>
      ${ROADS.map((d) => `<path class="road-worn" d="${d}"/>`).join("")}
      ${pebbles}
    </g>
  `;
}

function signpost() {
  const arm = (y, direction, lineWidth) => {
    const x = direction === "left" ? -54 : 4;
    const arrow = direction === "left"
      ? `${x},${y} ${x - 8},${y + 6} ${x},${y + 12}`
      : `${x + 50},${y} ${x + 58},${y + 6} ${x + 50},${y + 12}`;
    return `
      <g>
        <rect class="sign-board" x="${x}" y="${y}" width="50" height="12" rx="2.5"/>
        <polygon class="sign-board" points="${arrow}"/>
        <rect class="sign-board-line" x="${x + 7}" y="${y + 4}" width="${lineWidth}" height="2" rx="1"/>
        <rect class="sign-board-line" x="${x + 7}" y="${y + 8}" width="${lineWidth * 0.6}" height="2" rx="1"/>
        <rect class="sign-board-edge" x="${x}" y="${y}" width="50" height="12" rx="2.5"/>
      </g>
    `;
  };

  return `
    <g class="signpost" transform="translate(800 646)">
      <ellipse class="prop-shadow" cx="7" cy="3" rx="22" ry="7"/>
      <rect class="sign-post" x="-3.5" y="-70" width="7" height="72" rx="2"/>
      <rect class="sign-post-light" x="-3.5" y="-70" width="3" height="72" rx="1.5"/>
      ${arm(-66, "left", 30)}
      ${arm(-66, "right", 24)}
      ${arm(-46, "left", 22)}
      ${arm(-46, "right", 32)}
      <polygon class="sign-cap" points="0,-82 -7,-70 7,-70"/>
      <circle class="sign-cap-knob" cx="0" cy="-83" r="2.6"/>
    </g>
  `;
}

function mainTent() {
  return `
    <g class="tent">
      <ellipse class="prop-shadow" cx="26" cy="8" rx="128" ry="26"/>
      <polygon class="tent-side" points="0,-132 96,0 150,-30 54,-160"/>
      <polygon class="tent-side-dark" points="96,0 150,-30 150,-22 96,8"/>
      <polygon class="tent-front" points="0,-132 -96,0 96,0"/>
      <polygon class="tent-stripe" points="-34,-84 -22,-84 -70,0 -88,0"/>
      <polygon class="tent-stripe" points="34,-84 22,-84 70,0 88,0"/>
      <polygon class="tent-door" points="0,-98 -44,0 44,0"/>
      <polygon class="tent-door-inner" points="0,-88 -34,0 34,0"/>
      <polygon class="tent-flap" points="0,-98 -44,0 -62,0 -14,-104"/>
      <polygon class="tent-flap-shade" points="0,-98 -14,-104 -34,-42 -24,-40"/>
      <polygon class="tent-flap" points="0,-98 44,0 62,0 14,-104"/>
      <rect class="tent-trim" x="-96" y="-7" width="192" height="9" rx="4"/>
      <path class="tent-stitch" d="M 0 -132 L -96 0 M 0 -132 L 96 0 M 0 -132 L 54 -160"/>
      <path class="tent-rope" d="M 54 -160 C 84 -130 108 -80 118 -16"/>
      <path class="tent-rope" d="M 0 -132 C -40 -108 -76 -62 -92 -14"/>
      <path class="tent-rope" d="M 0 -132 C 34 -112 58 -74 70 -18"/>
      <rect class="tent-peg" x="115" y="-18" width="5" height="14" rx="2" transform="rotate(16 117 -11)"/>
      <rect class="tent-peg" x="-95" y="-16" width="5" height="14" rx="2" transform="rotate(-16 -92 -9)"/>
      <rect class="tent-pole" x="52" y="-214" width="6" height="58" rx="3"/>
      <g class="tent-flag">
        <path class="tent-flag-cloth" d="M 58 -212 q 26 6 44 -2 q -14 14 0 26 q -24 6 -44 0 Z"/>
      </g>
      <g class="tent-bed">
        <rect class="tent-bed-roll" x="-26" y="-22" width="42" height="13" rx="6"/>
        <rect class="tent-bed-tie" x="-12" y="-22" width="4" height="13"/>
      </g>
      <g class="tent-shield" transform="translate(108 -74) rotate(8)">
        <path class="shield-face" d="M 0 -22 L 19 -14 V 4 c 0 11 -8 18 -19 22 -11 -4 -19 -11 -19 -22 v -18 Z"/>
        <path class="shield-band" d="M -19 -4 H 19 V 3 H -19 Z"/>
        <circle class="shield-boss" cx="0" cy="-1" r="4.5"/>
      </g>
      <g class="tent-spears" transform="translate(-124 -6)">
        <rect class="spear-shaft" x="0" y="-92" width="4" height="92" rx="2" transform="rotate(-11 2 0)"/>
        <rect class="spear-shaft" x="10" y="-98" width="4" height="98" rx="2" transform="rotate(-5 12 0)"/>
        <rect class="spear-shaft" x="20" y="-88" width="4" height="88" rx="2" transform="rotate(4 22 0)"/>
        <polygon class="spear-tip" points="-16,-100 -11,-112 -6,-98"/>
        <polygon class="spear-tip" points="2,-104 7,-118 12,-102"/>
        <polygon class="spear-tip" points="21,-92 27,-104 31,-90"/>
      </g>
    </g>
  `;
}

function logCabin() {
  const wallLogs = Array.from(
    { length: 6 },
    (_, index) => `<rect class="cabin-log" x="-96" y="${-104 + index * 17.34}" width="192" height="16.2" rx="8"/>`
  ).join("");

  const logEnds = Array.from(
    { length: 6 },
    (_, index) => `<ellipse class="cabin-log-end" cx="-99" cy="${-95.9 + index * 17.34}" rx="9" ry="8.1"/>`
  ).join("");

  const sideLogs = Array.from(
    { length: 6 },
    (_, index) => `<path class="cabin-log-line" d="M 96 ${-87.8 + index * 17.34} L 150 ${-117.8 + index * 17.34}"/>`
  ).join("");

  const shingles = Array.from({ length: 5 }, (_, index) => {
    const fraction = (index + 1) / 6;
    const x = 114 * fraction;
    const y = -168 + 76 * fraction;
    return `<path class="cabin-shingle" d="M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 54).toFixed(1)} ${(y - 30).toFixed(1)}"/>`;
  }).join("");

  const gableBoards = Array.from({ length: 5 }, (_, index) => {
    const x = -64 + index * 32;
    const peak = -104 - (54 - Math.abs(x) * 0.5625);
    return `<path class="cabin-gable-board" d="M ${x} -104 L ${x} ${peak.toFixed(1)}"/>`;
  }).join("");

  const cabinWindow = (x) => `
    <g class="cabin-window" transform="translate(${x} -62)">
      <rect class="cabin-window-sill" x="-23" y="15" width="46" height="6" rx="3"/>
      <rect class="cabin-window-frame" x="-20" y="-18" width="40" height="36" rx="4"/>
      <rect class="cabin-window-glass" x="-15" y="-13" width="30" height="26" rx="2"/>
      <path class="cabin-window-mullion" d="M 0 -13 v 26 M -15 0 h 30"/>
      <path class="cabin-shutter" d="M -34 -19 h 12 v 38 h -12 Z"/>
      <path class="cabin-shutter" d="M 22 -19 h 12 v 38 h -12 Z"/>
      <path class="cabin-shutter-line" d="M -28 -15 v 30 M 28 -15 v 30"/>
    </g>
  `;

  return `
    <g class="log-cabin">
      <ellipse class="prop-shadow" cx="26" cy="8" rx="132" ry="27"/>

      <polygon class="cabin-wall-side" points="96,0 150,-30 150,-134 96,-104"/>
      ${sideLogs}

      <polygon class="cabin-wall-front" points="-96,0 96,0 96,-104 -96,-104"/>
      ${wallLogs}
      ${logEnds}

      <polygon class="cabin-gable" points="-96,-104 0,-158 96,-104"/>
      ${gableBoards}
      <circle class="cabin-gable-vent" cx="0" cy="-126" r="13"/>
      <path class="cabin-gable-vent-bar" d="M -13 -126 h 26 M 0 -139 v 26"/>

      <polygon class="cabin-roof-side" points="0,-168 114,-92 168,-122 54,-198"/>
      ${shingles}
      <polygon class="cabin-roof-face" points="-120,-88 0,-174 120,-88 114,-78 0,-160 -114,-78"/>
      <path class="cabin-ridge" d="M 0 -171 L 54 -201"/>

      <g class="cabin-chimney-group">
        <polygon class="cabin-chimney-side" points="140,-200 154,-208 154,-124 140,-110"/>
        <rect class="cabin-chimney" x="112" y="-200" width="28" height="92" rx="3"/>
        <path class="cabin-chimney-line" d="M 112 -184 h 28 M 112 -168 h 28 M 112 -152 h 28 M 112 -136 h 28 M 112 -120 h 28"/>
        <polygon class="cabin-chimney-cap-side" points="146,-208 160,-216 160,-206 146,-198"/>
        <rect class="cabin-chimney-cap" x="106" y="-208" width="40" height="10" rx="4"/>
        <circle class="cabin-smoke" cx="122" cy="-226" r="9"/>
        <circle class="cabin-smoke" cx="136" cy="-248" r="12"/>
        <circle class="cabin-smoke" cx="122" cy="-272" r="15"/>
      </g>

      ${cabinWindow(-58)}
      ${cabinWindow(58)}

      <path class="cabin-door-frame" d="M -36 0 v -60 a 36 36 0 0 1 72 0 V 0 Z"/>
      <path class="cabin-door" d="M -29 0 v -57 a 29 29 0 0 1 58 0 V 0 Z"/>
      <path class="cabin-door-plank" d="M -14 0 v -72 M 0 0 v -76 M 14 0 v -72"/>
      <path class="cabin-door-band" d="M -28 -18 h 56 M -28 -46 h 56"/>
      <circle class="cabin-door-handle" cx="20" cy="-32" r="4"/>
      <path class="cabin-step" d="M -44 0 h 88 l 8 10 h -104 Z"/>

      <rect class="tent-pole" x="51" y="-256" width="6" height="58" rx="3"/>
      <g class="tent-flag">
        <path class="tent-flag-cloth" d="M 57 -254 q 26 6 44 -2 q -14 14 0 26 q -24 6 -44 0 Z"/>
      </g>

      <g class="tent-shield" transform="translate(124 -72) rotate(7)">
        <path class="shield-face" d="M 0 -22 L 19 -14 V 4 c 0 11 -8 18 -19 22 -11 -4 -19 -11 -19 -22 v -18 Z"/>
        <path class="shield-band" d="M -19 -4 H 19 V 3 H -19 Z"/>
        <circle class="shield-boss" cx="0" cy="-1" r="4.5"/>
      </g>

      <g class="cabin-woodpile" transform="translate(-134 -4)">
        <ellipse class="prop-shadow" cx="6" cy="6" rx="34" ry="10"/>
        <rect class="cabin-firewood" x="-24" y="-16" width="52" height="15" rx="7"/>
        <rect class="cabin-firewood" x="-20" y="-30" width="44" height="15" rx="7"/>
        <ellipse class="cabin-log-end" cx="-24" cy="-8.5" rx="6" ry="7.5"/>
        <ellipse class="cabin-log-end" cx="-20" cy="-22.5" rx="6" ry="7.5"/>
      </g>

      <g class="tent-spears" transform="translate(-126 -6)">
        <rect class="spear-shaft" x="0" y="-92" width="4" height="92" rx="2" transform="rotate(-11 2 0)"/>
        <rect class="spear-shaft" x="10" y="-98" width="4" height="98" rx="2" transform="rotate(-5 12 0)"/>
        <polygon class="spear-tip" points="-16,-100 -11,-112 -6,-98"/>
        <polygon class="spear-tip" points="2,-104 7,-118 12,-102"/>
      </g>
    </g>
  `;
}

function house() {
  const stoneCourses = [];
  for (let row = 0; row < 3; row += 1) {
    const y = -66 + row * 22;
    const startX = -100 + (row % 2 === 0 ? 0 : -16);
    for (let bx = startX; bx < 100; bx += 32) {
      const left = Math.max(bx, -100);
      const right = Math.min(bx + 30, 100);
      if (right - left < 6) continue;
      stoneCourses.push(`<rect class="house-stone" x="${left}" y="${y}" width="${right - left}" height="20" rx="3"/>`);
    }
  }

  const shingles = Array.from({ length: 6 }, (_, index) => {
    const fraction = (index + 1) / 7;
    const x = 126 * fraction;
    const y = -216 + 78 * fraction;
    return `<path class="house-shingle" d="M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 56).toFixed(1)} ${(y - 32).toFixed(1)}"/>`;
  }).join("");

  const upperWindow = (x) => `
    <g transform="translate(${x} -112)">
      <rect class="cabin-window-frame" x="-19" y="-17" width="38" height="34" rx="3"/>
      <rect class="cabin-window-glass" x="-14" y="-12" width="28" height="24" rx="2"/>
      <path class="cabin-window-mullion" d="M 0 -12 v 24 M -14 0 h 28"/>
    </g>
  `;

  const lowerWindow = (x) => `
    <g transform="translate(${x} -36)">
      <rect class="cabin-window-frame" x="-21" y="-19" width="42" height="38" rx="3"/>
      <rect class="cabin-window-glass" x="-16" y="-14" width="32" height="28" rx="2"/>
      <path class="cabin-window-mullion" d="M 0 -14 v 28 M -16 0 h 32"/>
      <rect class="house-flowerbox" x="-23" y="17" width="46" height="9" rx="3"/>
      <circle class="house-flower" cx="-13" cy="16" r="4"/>
      <circle class="house-flower-alt" cx="0" cy="15" r="4"/>
      <circle class="house-flower" cx="13" cy="16" r="4"/>
    </g>
  `;

  return `
    <g class="house">
      <ellipse class="prop-shadow" cx="30" cy="9" rx="150" ry="30"/>

      <polygon class="house-wall-side" points="100,0 156,-32 156,-182 100,-150"/>
      <path class="house-side-line" d="M 100 -70 L 156 -102 M 100 -150 L 156 -182"/>

      <polygon class="house-wall-front" points="-100,-150 100,-150 100,0 -100,0"/>
      ${stoneCourses.join("")}
      <rect class="house-band" x="-106" y="-76" width="212" height="12" rx="5"/>
      <polygon class="house-band-side" points="106,-76 162,-108 162,-96 106,-64"/>

      <rect class="house-upper" x="-104" y="-150" width="208" height="76" rx="3"/>
      <path class="house-beam" d="M -104 -150 h 208 M -104 -78 h 208 M -70 -150 v 72 M 0 -150 v 72 M 70 -150 v 72"/>
      <path class="house-beam-thin" d="M -104 -150 L -70 -78 M -70 -150 L -104 -78 M 70 -150 L 104 -78 M 104 -150 L 70 -78"/>

      <polygon class="house-gable" points="-100,-150 0,-212 100,-150"/>
      <path class="house-beam" d="M -100 -150 L 0 -212 L 100 -150 M -50 -150 L 0 -181 M 50 -150 L 0 -181 M 0 -181 v 31"/>
      <circle class="cabin-gable-vent" cx="0" cy="-168" r="12"/>
      <path class="cabin-gable-vent-bar" d="M -12 -168 h 24 M 0 -180 v 24"/>

      <polygon class="house-roof-side" points="0,-216 126,-138 182,-170 56,-248"/>
      ${shingles}
      <polygon class="house-roof-face" points="-126,-134 0,-228 126,-134 120,-123 0,-214 -120,-123"/>
      <path class="house-ridge" d="M 0 -220 L 56 -252"/>

      <g class="house-chimney">
        <polygon class="cabin-chimney-side" points="150,-252 166,-261 166,-176 150,-166"/>
        <rect class="cabin-chimney" x="118" y="-252" width="32" height="92" rx="3"/>
        <path class="cabin-chimney-line" d="M 118 -234 h 32 M 118 -216 h 32 M 118 -198 h 32 M 118 -180 h 32"/>
        <polygon class="cabin-chimney-cap-side" points="156,-261 172,-270 172,-259 156,-250"/>
        <rect class="cabin-chimney-cap" x="110" y="-261" width="46" height="11" rx="4"/>
        <circle class="cabin-smoke" cx="130" cy="-282" r="10"/>
        <circle class="cabin-smoke" cx="146" cy="-306" r="13"/>
        <circle class="cabin-smoke" cx="132" cy="-332" r="16"/>
      </g>

      ${upperWindow(-62)}
      ${upperWindow(0)}
      ${upperWindow(62)}
      ${lowerWindow(-64)}
      ${lowerWindow(64)}

      <path class="cabin-door-frame" d="M -32 0 v -54 a 32 32 0 0 1 64 0 V 0 Z"/>
      <path class="cabin-door" d="M -26 0 v -51 a 26 26 0 0 1 52 0 V 0 Z"/>
      <path class="cabin-door-plank" d="M -13 0 v -64 M 0 0 v -68 M 13 0 v -64"/>
      <path class="cabin-door-band" d="M -25 -16 h 50 M -25 -40 h 50"/>
      <circle class="cabin-door-handle" cx="18" cy="-28" r="4"/>

      <polygon class="house-porch" points="-44,-86 44,-86 58,-70 -58,-70"/>
      <path class="house-porch-post" d="M -38 -70 v 70 M 38 -70 v 70"/>
      <path class="cabin-step" d="M -42 0 h 84 l 9 10 h -102 Z"/>

      <rect class="tent-pole" x="53" y="-310" width="6" height="60" rx="3"/>
      <g class="tent-flag">
        <path class="tent-flag-cloth" d="M 59 -308 q 26 6 44 -2 q -14 14 0 26 q -24 6 -44 0 Z"/>
      </g>

      <g class="tent-shield" transform="translate(130 -108) rotate(7)">
        <path class="shield-face" d="M 0 -22 L 19 -14 V 4 c 0 11 -8 18 -19 22 -11 -4 -19 -11 -19 -22 v -18 Z"/>
        <path class="shield-band" d="M -19 -4 H 19 V 3 H -19 Z"/>
        <circle class="shield-boss" cx="0" cy="-1" r="4.5"/>
      </g>

      <g class="cabin-woodpile" transform="translate(-140 -4)">
        <ellipse class="prop-shadow" cx="6" cy="6" rx="36" ry="11"/>
        <rect class="cabin-firewood" x="-26" y="-17" width="56" height="16" rx="7"/>
        <rect class="cabin-firewood" x="-22" y="-32" width="48" height="16" rx="7"/>
        <ellipse class="cabin-log-end" cx="-26" cy="-9" rx="6" ry="8"/>
        <ellipse class="cabin-log-end" cx="-22" cy="-24" rx="6" ry="8"/>
      </g>

      <g class="tent-spears" transform="translate(-134 -6)">
        <rect class="spear-shaft" x="0" y="-100" width="4" height="100" rx="2" transform="rotate(-11 2 0)"/>
        <rect class="spear-shaft" x="10" y="-106" width="4" height="106" rx="2" transform="rotate(-5 12 0)"/>
        <polygon class="spear-tip" points="-17,-108 -12,-121 -7,-106"/>
        <polygon class="spear-tip" points="2,-112 7,-127 12,-110"/>
      </g>
    </g>
  `;
}

function baileyMerlons(startX, endX, baseY, cls, ruined) {
  const blocks = [];
  let index = 0;
  for (let x = startX; x + 20 <= endX + 1; x += 34) {
    index += 1;
    if (ruined && index % 3 === 0) continue;
    const height = ruined && index % 4 === 0 ? 7 : 13;
    blocks.push(`<rect class="${cls}" x="${x}" y="${baseY + 1 - height}" width="20" height="${height}" rx="2"/>`);
  }
  return blocks.join("");
}

function baileyRear(ruined) {
  return `
    <polygon class="bailey-wall-rear" points="-110,-74 190,-74 190,-32 -110,-32"/>
    ${baileyMerlons(-110, 190, -74, "bailey-merlon-rear", ruined)}
    <polygon class="bailey-wall-side" points="-150,-32 -110,-74 -110,-32 -150,10"/>
    <polygon class="bailey-wall-side" points="150,-32 190,-74 190,-32 150,10"/>
    <path class="bailey-walk" d="M -110 -32 h 300"/>
  `;
}

function baileyFront(ruined) {
  const courses = [];
  for (let row = 0; row < 2; row += 1) {
    const y = -30 + row * 20;
    const startX = -150 + (row % 2 === 0 ? 0 : -13);
    for (let bx = startX; bx < 150; bx += 26) {
      const left = Math.max(bx, -150);
      const right = Math.min(bx + 24, 150);
      if (right - left < 5 || (right > -36 && left < 36)) continue;
      courses.push(`<rect class="bailey-stone" x="${left}" y="${y}" width="${right - left}" height="18" rx="2"/>`);
    }
  }

  const spikes = [-132, -108, -84, 84, 108, 132]
    .map((x) => {
      const lean = x < 0 ? -8 : 8;
      return `<polygon class="tower-spike" points="${x - 5},14 ${x + lean},-16 ${x + 5},16"/>`;
    })
    .join("");

  const bars = [-24, -12, 0, 12, 24]
    .map((x) => `<rect class="bailey-portcullis" x="${x - 2}" y="-26" width="4" height="16" rx="2"/>`)
    .join("");

  const turret = (x) => `
    <g transform="translate(${x} 0)">
      <polygon class="bailey-turret-side" points="16,-64 30,-72 30,-2 16,10"/>
      <rect class="bailey-turret" x="-16" y="-64" width="32" height="74" rx="3"/>
      <rect class="bailey-turret-cap" x="-21" y="-78" width="42" height="15" rx="3"/>
      <rect class="bailey-merlon" x="-21" y="-90" width="13" height="14" rx="2"/>
      ${ruined ? "" : `<rect class="bailey-merlon" x="-6" y="-90" width="13" height="14" rx="2"/>`}
      <rect class="bailey-merlon" x="8" y="${ruined ? -84 : -90}" width="13" height="${ruined ? 8 : 14}" rx="2"/>
      <rect class="tower-slit" x="-3" y="-52" width="6" height="18" rx="3"/>
    </g>
  `;

  return `
    <polygon class="bailey-wall-front" points="-150,-32 -36,-32 -36,10 -150,10"/>
    <polygon class="bailey-wall-front" points="36,-32 150,-32 150,10 36,10"/>
    ${courses.join("")}
    <path class="bailey-arch" d="M -36 -18 v -14 h 72 v 14 a 36 36 0 0 0 -72 0 Z"/>
    ${bars}
    ${baileyMerlons(-150, -34, -32, "bailey-merlon", ruined)}
    ${baileyMerlons(34, 150, -32, "bailey-merlon", ruined)}
    ${turret(-150)}
    ${turret(150)}
    ${spikes}
    <path class="bailey-path" d="M -26 10 h 52 l 12 12 h -76 Z"/>
  `;
}

function castleTower(walled, ruined) {
  const courses = [];
  for (let row = 0; row < 7; row += 1) {
    const y = -196 + row * 24;
    const startX = -70 + (row % 2 === 0 ? 0 : -14);
    for (let bx = startX; bx < 70; bx += 28) {
      const left = Math.max(bx, -70);
      const right = Math.min(bx + 26, 70);
      if (right - left < 5) continue;
      courses.push(`<rect class="tower-stone" x="${left}" y="${y}" width="${right - left}" height="22" rx="3"/>`);
    }
  }

  const merlons = (ruined
    ? [[-80, 12], [-10, 17], [25, 8], [60, 14]]
    : [[-80, 17], [-45, 17], [-10, 17], [25, 17], [60, 17]]
  )
    .map(([x, height]) => `<rect class="tower-merlon" x="${x}" y="${-245 - height}" width="20" height="${height}" rx="2"/>`)
    .join("");

  const sideMerlons = (ruined ? [0, 0.76] : [0, 0.38, 0.76])
    .map((t) => {
      const end = t + 0.24;
      const ax = 80 + 44 * t;
      const ay = -246 - 25 * t;
      const bx = 80 + 44 * end;
      const by = -246 - 25 * end;
      return `<polygon class="tower-merlon-side" points="${ax.toFixed(1)},${ay.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} ${bx.toFixed(1)},${(by - 16).toFixed(1)} ${ax.toFixed(1)},${(ay - 16).toFixed(1)}"/>`;
    })
    .join("");

  const machicolations = (ruined ? [-72, -24, 0, 48] : [-72, -48, -24, 0, 24, 48])
    .map((x) => `<rect class="tower-machicolation" x="${x}" y="-206" width="13" height="11" rx="2"/>`)
    .join("");

  const slit = (x, y) => `
    <g transform="translate(${x} ${y})">
      <rect class="tower-slit-recess" x="-9" y="-19" width="18" height="38" rx="4"/>
      <rect class="tower-slit" x="-4" y="-15" width="8" height="30" rx="3"/>
      <rect class="tower-slit" x="-12" y="-4" width="24" height="8" rx="3"/>
    </g>
  `;

  const spikes = walled
    ? ""
    : [-92, -74, -56, 56, 74, 92]
        .map((x) => {
          const lean = x < 0 ? -9 : 9;
          return `<polygon class="tower-spike" points="${x - 5},4 ${x + lean},-30 ${x + 5},6"/>`;
        })
        .join("");

  return `
    <g class="castle-tower${ruined ? " is-ruined" : ""}">
      <ellipse class="prop-shadow" cx="22" cy="8" rx="${walled ? 182 : 128}" ry="${walled ? 34 : 26}"/>
      ${walled ? baileyRear(ruined) : ""}

      <polygon class="tower-wall-side" points="70,-196 114,-221 114,-25 70,0"/>
      <rect class="tower-wall-front" x="-70" y="-196" width="140" height="196"/>
      ${courses.join("")}
      <path class="tower-edge-line" d="M 70 -196 v 196"/>

      <polygon class="tower-base-side" points="82,-26 126,-51 126,-25 82,0"/>
      <rect class="tower-base" x="-82" y="-26" width="164" height="26" rx="3"/>

      <polygon class="tower-corbel-side" points="80,-212 124,-237 124,-219 80,-194"/>
      <rect class="tower-corbel" x="-80" y="-212" width="160" height="18" rx="3"/>
      ${machicolations}

      <polygon class="tower-walkway" points="-80,-246 80,-246 124,-271 -36,-271"/>
      <polygon class="tower-parapet-back" points="-36,-271 124,-271 124,-286 -36,-286"/>

      <rect class="tent-pole" x="28" y="-306" width="6" height="66" rx="3"/>
      <g class="tent-flag">
        <path class="tent-flag-cloth" d="M 34 -304 q 24 6 40 -2 q -12 13 0 24 q -22 6 -40 0 Z"/>
      </g>

      <polygon class="tower-parapet-side" points="80,-246 124,-271 124,-237 80,-212"/>
      ${sideMerlons}
      <rect class="tower-parapet" x="-80" y="-246" width="160" height="34" rx="2"/>
      ${merlons}

      ${slit(0, -166)}
      ${slit(-42, -118)}
      ${slit(42, -118)}
      ${slit(0, -82)}

      <path class="cabin-door-frame" d="M -32 0 v -40 a 32 32 0 0 1 64 0 V 0 Z"/>
      <path class="cabin-door" d="M -26 0 v -38 a 26 26 0 0 1 52 0 V 0 Z"/>
      <path class="cabin-door-plank" d="M -13 0 v -52 M 0 0 v -56 M 13 0 v -52"/>
      <path class="cabin-door-band" d="M -25 -12 h 50 M -24 -32 h 48"/>
      <circle class="cabin-door-handle" cx="18" cy="-22" r="4"/>
      <path class="cabin-step" d="M -40 0 h 80 l 9 10 h -98 Z"/>

      ${spikes}

      <g class="tent-shield" transform="translate(${walled ? "-58 -76" : "-52 -58"}) rotate(-8)">
        <path class="shield-face" d="M 0 -22 L 19 -14 V 4 c 0 11 -8 18 -19 22 -11 -4 -19 -11 -19 -22 v -18 Z"/>
        <path class="shield-band" d="M -19 -4 H 19 V 3 H -19 Z"/>
        <circle class="shield-boss" cx="0" cy="-1" r="4.5"/>
      </g>

      <g class="tent-spears" transform="translate(-124 -6)">
        <rect class="spear-shaft" x="0" y="-100" width="4" height="100" rx="2" transform="rotate(-11 2 0)"/>
        <rect class="spear-shaft" x="10" y="-106" width="4" height="106" rx="2" transform="rotate(-5 12 0)"/>
        <polygon class="spear-tip" points="-17,-108 -12,-121 -7,-106"/>
        <polygon class="spear-tip" points="2,-112 7,-127 12,-110"/>
      </g>

      ${walled ? baileyFront(ruined) : ""}
      ${ruined ? keepDecay() : ""}
    </g>
  `;
}

function keepDecay() {
  const rubble = [[-122, 6], [-98, 14], [-58, 16], [44, 18], [104, 8], [132, 15]]
    .map(([cx, cy], index) => `<ellipse class="keep-rubble" cx="${cx}" cy="${cy}" rx="${8 + (index % 3) * 3}" ry="${5 + (index % 2) * 2}"/>`)
    .join("");

  const moss = [[-56, -20, 24, 9], [16, -30, 28, 8], [62, -8, 16, 7], [-38, -244, 20, 6], [44, -244, 24, 5], [-146, 2, 20, 7], [148, 4, 18, 6]]
    .map(([cx, cy, rx, ry]) => `<ellipse class="keep-moss" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)
    .join("");

  const vine = (x, topY, flip) => {
    const leaves = Array.from({ length: 6 }, (_, index) => {
      const ly = topY + index * 24;
      const lx = x + (index % 2 === 0 ? 8 : -8) * flip;
      return `<circle class="keep-ivy-leaf" cx="${lx}" cy="${ly}" r="${5 - (index % 2)}"/>`;
    }).join("");
    return `<path class="keep-ivy" d="M ${x} ${topY} q ${10 * flip} 34 0 68 q ${-10 * flip} 34 0 66"/>${leaves}`;
  };

  return `
    <g class="keep-decay">
      <path class="keep-crack" d="M -48 -192 l 11 26 l -9 19 l 13 27 l -6 24 M 34 -164 l -12 23 l 10 21 l -14 27 M 60 -92 l -11 21 l 7 19"/>
      <path class="keep-crack keep-crack-thin" d="M -16 -138 l 9 17 l -7 16 M 12 -58 l -9 15 M -112 -18 l 8 14 M 118 -20 l -7 13"/>
      <path class="keep-chip" d="M -80 -256 l 14 -6 l 8 11 Z M 25 -251 l 20 -4 l -2 10 Z M 124 -286 l -16 4 l 6 10 Z"/>
      ${vine(-62, -186, 1)}
      ${vine(56, -150, -1)}
      ${moss}
      ${rubble}
    </g>
  `;
}

function campfire() {
  return `
    <g class="campfire">
      <ellipse class="fire-glow" cx="0" cy="-6" rx="108" ry="62"/>
      <ellipse class="prop-shadow" cx="6" cy="6" rx="46" ry="15"/>
      <g class="fire-logs">
        <rect class="log-body" x="-34" y="-10" width="66" height="13" rx="6" transform="rotate(-14 -1 -3)"/>
        <rect class="log-body" x="-32" y="-8" width="64" height="13" rx="6" transform="rotate(17 0 -1)"/>
        <ellipse class="log-end" cx="-33" cy="-6" rx="5" ry="6" transform="rotate(-14 -33 -6)"/>
        <ellipse class="log-end" cx="31" cy="4" rx="5" ry="6" transform="rotate(17 31 4)"/>
      </g>
      <g class="fire-flames">
        <path class="flame flame-outer" d="M 0 -8 c 16 -14 18 -30 8 -44 c 14 8 22 26 14 42 c -4 8 -14 12 -22 2 Z"/>
        <path class="flame flame-outer" d="M 0 -8 c -16 -14 -18 -30 -8 -44 c -14 8 -22 26 -14 42 c 4 8 14 12 22 2 Z"/>
        <path class="flame flame-mid" d="M 0 -6 c 11 -12 12 -26 2 -40 c 12 10 16 28 8 40 c -3 6 -8 6 -10 0 Z"/>
        <path class="flame flame-core" d="M 0 -6 c 6 -9 6 -20 0 -30 c -7 10 -7 21 0 30 Z"/>
      </g>
      <g class="fire-stones">
        ${Array.from({ length: 9 }, (_, index) => {
          const angle = (index / 9) * Math.PI * 2;
          const cx = Math.cos(angle) * 40;
          const cy = 4 + Math.sin(angle) * 15;
          return `<ellipse class="fire-stone" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="10" ry="7.5"/>`;
        }).join("")}
      </g>
      <g class="fire-spit">
        <rect class="spit-post" x="-52" y="-40" width="5" height="42" rx="2" transform="rotate(-12 -50 -19)"/>
        <rect class="spit-post" x="47" y="-40" width="5" height="42" rx="2" transform="rotate(12 49 -19)"/>
        <rect class="spit-bar" x="-54" y="-44" width="108" height="4" rx="2"/>
        <path class="spit-chain" d="M 0 -42 v 12"/>
        <path class="pot-body" d="M -15 -30 h 30 l -4 20 h -22 Z"/>
        <rect class="pot-rim" x="-17" y="-32" width="34" height="5" rx="2.5"/>
      </g>
    </g>
  `;
}

function bannerPole(accent) {
  return `
    <g>
      <ellipse class="prop-shadow" cx="4" cy="2" rx="12" ry="5"/>
      <rect class="banner-pole" x="-2.5" y="-96" width="5" height="98" rx="2.5"/>
      <circle class="sign-cap-knob" cx="0" cy="-99" r="4"/>
      <g class="banner-cloth-wrap">
        <path class="banner-cloth ${accent}" d="M 2 -92 h 30 v 54 l -15 -10 l -15 10 Z"/>
        <path class="banner-emblem" d="M 17 -78 l 9 4 v 9 c 0 5 -4 8 -9 10 c -5 -2 -9 -5 -9 -10 v -9 Z"/>
      </g>
    </g>
  `;
}

function palisade(count) {
  return `
    <g class="palisade">
      ${Array.from({ length: count }, (_, index) => {
        const x = index * 17;
        return `
          <rect class="palisade-log" x="${x}" y="-42" width="14" height="46" rx="4"/>
          <polygon class="palisade-tip" points="${x},-42 ${x + 7},-54 ${x + 14},-42"/>
          <rect class="palisade-band" x="${x - 1}" y="-22" width="16" height="4" rx="2"/>
        `;
      }).join("")}
    </g>
  `;
}

function trainingDummy() {
  return `
    <g>
      <ellipse class="prop-shadow" cx="5" cy="3" rx="22" ry="8"/>
      <rect class="dummy-post" x="-5" y="-68" width="10" height="70" rx="3"/>
      <rect class="dummy-arm" x="-36" y="-54" width="72" height="8" rx="4"/>
      <rect class="dummy-body" x="-17" y="-52" width="34" height="30" rx="8"/>
      <circle class="dummy-head" cx="0" cy="-62" r="11"/>
      <path class="dummy-straw" d="M -30 -46 l -10 8 M -34 -50 l -12 2 M 30 -46 l 10 8 M 34 -50 l 12 2 M 0 -73 l -4 -10 M 0 -73 l 5 -9"/>
      <path class="dummy-strap" d="M -17 -40 h 34 M -17 -30 h 34"/>
    </g>
  `;
}

function supplyWagon() {
  return `
    <g>
      <ellipse class="prop-shadow" cx="6" cy="6" rx="58" ry="16"/>
      <rect class="wagon-body" x="-48" y="-34" width="96" height="30" rx="5"/>
      <path class="crate-line" d="M -48 -20 h 96"/>
      <path class="wagon-cover" d="M -40 -34 q 40 -44 80 0 Z"/>
      <path class="wagon-cover-rib" d="M -24 -41 q 24 -20 48 -1 M -8 -46 q 8 -3 16 0"/>
      <rect class="wagon-tongue" x="44" y="-10" width="42" height="6" rx="3" transform="rotate(-8 44 -7)"/>
      <circle class="wagon-wheel" cx="-30" cy="-2" r="15"/>
      <circle class="wagon-hub" cx="-30" cy="-2" r="4.5"/>
      <circle class="wagon-wheel" cx="30" cy="-2" r="15"/>
      <circle class="wagon-hub" cx="30" cy="-2" r="4.5"/>
      <path class="wagon-spoke" d="M -30 -17 v 30 M -45 -2 h 30 M 30 -17 v 30 M 15 -2 h 30"/>
    </g>
  `;
}

function campProps() {
  return `
    <g class="camp-props">
      <g transform="translate(676 946)">
        <ellipse class="prop-shadow" cx="3" cy="3" rx="24" ry="8"/>
        <rect class="crate-body" x="-19" y="-24" width="38" height="26" rx="3"/>
        <path class="crate-line" d="M -19 -15 h 38 M 0 -24 v 26 M -19 -24 l 38 26 M 19 -24 l -38 26"/>
        <rect class="crate-body" x="-11" y="-40" width="27" height="18" rx="3"/>
        <path class="crate-line" d="M -11 -31 h 27 M 2 -40 v 18"/>
      </g>
      <g transform="translate(920 940)">
        <ellipse class="prop-shadow" cx="3" cy="2" rx="17" ry="6"/>
        <path class="barrel-body" d="M -13 -32 q 5 16 0 32 h 26 q -5 -16 0 -32 Z"/>
        <rect class="barrel-hoop" x="-14" y="-25" width="28" height="4" rx="2"/>
        <rect class="barrel-hoop" x="-14" y="-10" width="28" height="4" rx="2"/>
        <ellipse class="barrel-top" cx="0" cy="-32" rx="13" ry="5"/>
      </g>
      <g transform="translate(760 976)">
        <ellipse class="prop-shadow" cx="3" cy="2" rx="34" ry="9"/>
        <rect class="log-body" x="-32" y="-11" width="64" height="12" rx="6"/>
        <ellipse class="log-end" cx="-32" cy="-5" rx="4.5" ry="6"/>
        <ellipse class="log-end" cx="32" cy="-5" rx="4.5" ry="6"/>
      </g>
      <g transform="translate(866 984)">
        <ellipse class="prop-shadow" cx="3" cy="2" rx="30" ry="8"/>
        <rect class="log-body" x="-26" y="-10" width="52" height="11" rx="5" transform="rotate(-6 0 -4)"/>
        <ellipse class="log-end" cx="-26" cy="-2" rx="4" ry="5.5" transform="rotate(-6 -26 -2)"/>
      </g>
      <g class="camp-lantern" transform="translate(700 826)">
        <ellipse class="prop-shadow" cx="2" cy="2" rx="10" ry="4"/>
        <rect class="lantern-post" x="-2.5" y="-56" width="5" height="58" rx="2.5"/>
        <path class="lantern-arm" d="M 0 -54 q 12 0 14 11"/>
        <g class="lantern-swing">
          <rect class="lantern-cage" x="8" y="-44" width="13" height="16" rx="3"/>
          <rect class="lantern-light" x="10" y="-42" width="9" height="12" rx="2"/>
          <rect class="lantern-cap" x="6.5" y="-47" width="16" height="4" rx="2"/>
        </g>
      </g>
    </g>
  `;
}

function wheeledCrossbow() {
  return `
    <g class="wheeled-crossbow-art">
      <ellipse cx="0" cy="12" rx="36" ry="9" fill="rgba(5, 16, 8, 0.28)"/>
      <rect x="-30" y="4" width="60" height="9" rx="3" fill="url(#woodFill)" stroke="#3f2a14" stroke-width="1.2"/>
      <circle cx="-22" cy="12" r="11" fill="#5a3b1c" stroke="#2b1808" stroke-width="1.8"/>
      <circle cx="-22" cy="12" r="5.5" fill="#8a6a3f" stroke="#4a3018" stroke-width="1"/>
      <circle cx="22" cy="12" r="11" fill="#5a3b1c" stroke="#2b1808" stroke-width="1.8"/>
      <circle cx="22" cy="12" r="5.5" fill="#8a6a3f" stroke="#4a3018" stroke-width="1"/>
      <rect x="-8" y="-34" width="16" height="38" rx="3" fill="url(#woodFill)" stroke="#3f2a14" stroke-width="1.4"/>
      <path d="M -11 -18 L 11 -18 L 9 6 L 0 12 L -9 6 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="1"/>
      <path d="M -11 -18 L 11 -18 L 9 6 L 0 12 L -9 6 Z" fill="none" stroke="#94a3b8" stroke-width="0.8" opacity="0.55"/>
      <path d="M -34 -36 q 0 -10 8 -12 q 26 0 52 0 q 8 2 8 12" fill="none" stroke="#94a3b8" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M -28 -34 L 0 -44 L 28 -34" fill="none" stroke="#334155" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M -28 -34 L -8 -38 L 0 -44 L 8 -38 L 28 -34" fill="none" stroke="#475569" stroke-width="1"/>
      <path d="M 0 -44 L 0 -58" stroke="#64748b" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M -4 -54 L 0 -60 L 4 -54 Z" fill="#94a3b8" stroke="#475569" stroke-width="0.8"/>
      <rect x="-3" y="-8" width="6" height="5" rx="1" fill="#43301b"/>
      <path d="M -18 -36 L -8 -38 M 18 -36 L 8 -38" fill="none" stroke="#334155" stroke-width="1.2"/>
    </g>
  `;
}

function weaponWheelsBase() {
  return `
    <ellipse cx="0" cy="12" rx="36" ry="9" fill="rgba(5, 16, 8, 0.28)"/>
    <rect x="-30" y="4" width="60" height="9" rx="3" fill="url(#woodFill)" stroke="#3f2a14" stroke-width="1.2"/>
    <circle cx="-22" cy="12" r="11" fill="#5a3b1c" stroke="#2b1808" stroke-width="1.8"/>
    <circle cx="-22" cy="12" r="5.5" fill="#8a6a3f" stroke="#4a3018" stroke-width="1"/>
    <circle cx="22" cy="12" r="11" fill="#5a3b1c" stroke="#2b1808" stroke-width="1.8"/>
    <circle cx="22" cy="12" r="5.5" fill="#8a6a3f" stroke="#4a3018" stroke-width="1"/>
  `;
}

function catapultArt() {
  return `
    <g class="wheeled-crossbow-art">
      ${weaponWheelsBase()}
      <path d="M -26 6 L -12 -22 L 12 -22 L 26 6 Z" fill="url(#woodFill)" stroke="#3f2a14" stroke-width="1.6"/>
      <rect x="-20" y="-26" width="40" height="7" rx="2.5" fill="#6b4a26" stroke="#3f2a14" stroke-width="1.2"/>
      <rect x="-3.5" y="-52" width="7" height="34" rx="2.5" fill="#7c5a30" stroke="#43301b" stroke-width="1.3" transform="rotate(-14 0 -18)"/>
      <circle cx="-9" cy="-52" r="8" fill="none" stroke="#43301b" stroke-width="2.4"/>
      <circle cx="-9" cy="-54" r="6.4" fill="#78716c" stroke="#44403c" stroke-width="1.2"/>
      <path d="M -13 -57.5 q 3.4 -3.4 8 -1.4" fill="none" stroke="#a8a29e" stroke-width="1.2"/>
      <path d="M -14 -30 q 14 5 28 0" fill="none" stroke="#8a6a3f" stroke-width="2.2"/>
      <rect x="8" y="-16" width="10" height="16" rx="2" fill="#43301b"/>
    </g>
  `;
}

function cannonArt() {
  return `
    <g class="wheeled-crossbow-art">
      ${weaponWheelsBase()}
      <path d="M -20 6 L -8 -12 L 8 -12 L 20 6 Z" fill="url(#woodFill)" stroke="#3f2a14" stroke-width="1.5"/>
      <path d="M -8.5 -10 L -6 -52 Q 0 -56 6 -52 L 8.5 -10 Q 0 -5 -8.5 -10 Z" fill="#334155" stroke="#0f172a" stroke-width="1.6"/>
      <path d="M -6.6 -50 Q 0 -54 6.6 -50" fill="none" stroke="#64748b" stroke-width="1.6"/>
      <rect x="-9.5" y="-40" width="19" height="4.4" rx="2.2" fill="#1e293b" stroke="#0f172a" stroke-width="0.8"/>
      <rect x="-8.6" y="-24" width="17.2" height="4" rx="2" fill="#1e293b" stroke="#0f172a" stroke-width="0.8"/>
      <ellipse cx="0" cy="-53.4" rx="6" ry="2.6" fill="#0f172a"/>
      <circle cx="0" cy="-8" r="3.4" fill="#475569" stroke="#1e293b" stroke-width="1"/>
    </g>
  `;
}

function missileLauncherArt() {
  return `
    <g class="wheeled-crossbow-art">
      ${weaponWheelsBase()}
      <rect x="-24" y="-8" width="48" height="12" rx="3" fill="#374151" stroke="#111827" stroke-width="1.4"/>
      <g transform="rotate(-8 0 -8)">
        <rect x="-14" y="-52" width="10" height="44" rx="3" fill="#4b5563" stroke="#111827" stroke-width="1.2"/>
        <rect x="4" y="-52" width="10" height="44" rx="3" fill="#4b5563" stroke="#111827" stroke-width="1.2"/>
        <rect x="-12.5" y="-50" width="7" height="34" rx="3.5" fill="#e5e7eb" stroke="#6b7280" stroke-width="0.9"/>
        <rect x="5.5" y="-50" width="7" height="34" rx="3.5" fill="#e5e7eb" stroke="#6b7280" stroke-width="0.9"/>
        <path d="M -12.5 -50 L -9 -60 L -5.5 -50 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.9"/>
        <path d="M 5.5 -50 L 9 -60 L 12.5 -50 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.9"/>
        <path d="M -12.5 -18 l -3 5 h 3 Z M -5.5 -18 l 3 5 h -3 Z" fill="#9ca3af"/>
        <path d="M 5.5 -18 l -3 5 h 3 Z M 12.5 -18 l 3 5 h -3 Z" fill="#9ca3af"/>
      </g>
      <rect x="-4" y="-10" width="8" height="8" rx="1.6" fill="#111827"/>
      <circle cx="0" cy="-6" r="1.6" fill="#f59e0b"/>
    </g>
  `;
}

function weaponArt() {
  const tierId = getWeaponTier().id;
  if (tierId === "catapult") return catapultArt();
  if (tierId === "cannon") return cannonArt();
  if (tierId === "missile") return missileLauncherArt();
  return wheeledCrossbow();
}

function keepWatchtower(x, y, bannerClass, ruined) {
  const crown = ruined
    ? `
      <path class="tower-crown" d="M -34 -118 h 68 v -14 l -18 6 l -16 -10 l -20 8 l -14 -6 Z"/>
      <rect class="tower-merlon" x="-32" y="-146" width="12" height="16" rx="2"/>
      <rect class="tower-merlon" x="18" y="-140" width="12" height="10" rx="2"/>
    `
    : `
      <rect class="tower-crown" x="-34" y="-138" width="68" height="20" rx="4"/>
      ${merlonRow(-34, 34, -138, 11, 9, 13)}
    `;

  const decay = ruined
    ? `
      <path class="keep-crack" d="M -14 -112 l 8 20 l -6 17 l 9 22 M 16 -76 l -7 16 l 6 15"/>
      <ellipse class="keep-moss" cx="-18" cy="-8" rx="14" ry="6"/>
      <ellipse class="keep-moss" cx="20" cy="-4" rx="11" ry="5"/>
      <ellipse class="keep-rubble" cx="-40" cy="6" rx="10" ry="5"/>
      <ellipse class="keep-rubble" cx="38" cy="9" rx="8" ry="4"/>
    `
    : "";

  return `
    <g class="watchtower" transform="translate(${x} ${y})">
      <ellipse class="prop-shadow" cx="8" cy="5" rx="48" ry="15"/>
      <path class="tower-body" d="M -30 0 L -23 -118 H 23 L 30 0 Z"/>
      <path class="tower-band" d="M -26 -44 H 26 M -24 -82 H 24"/>
      <rect class="tower-door" x="-10" y="-32" width="20" height="32" rx="4"/>
      <rect class="tower-window" x="-6" y="-70" width="12" height="15" rx="6"/>
      <rect class="tower-window" x="-6" y="-104" width="12" height="13" rx="6"/>
      ${crown}
      <rect class="banner-pole" x="30" y="-142" width="4" height="50" rx="2"/>
      <g class="banner-cloth-wrap">
        <path class="banner-cloth ${bannerClass}" d="M 34 -138 h 24 v 34 l -12 -7 l -12 7 Z"/>
      </g>
      ${decay}
    </g>
  `;
}

function twinTowerKeep() {
  return `
    <g class="twin-tower-keep">
      ${keepWatchtower(-196, -56, "banner-blue")}
      ${keepWatchtower(232, -56, "banner-gold")}
      ${castleTower(true)}
    </g>
  `;
}

function fourTowerKeep() {
  return `
    <g class="four-tower-keep">
      ${keepWatchtower(-196, -56, "banner-blue")}
      ${keepWatchtower(232, -56, "banner-gold")}
      ${keepWatchtower(-196, 64, "banner-blue")}
      ${keepWatchtower(232, 64, "banner-gold")}
      ${castleTower(true)}
    </g>
  `;
}

function spiredWatchtower(x, y, bannerClass) {
  return `
    <g class="watchtower citadel-tower" transform="translate(${x} ${y})">
      <ellipse class="prop-shadow" cx="8" cy="5" rx="50" ry="16"/>
      <path class="tower-body" d="M -30 0 L -23 -126 H 23 L 30 0 Z"/>
      <path class="citadel-trim" d="M -27 -48 H 27 M -25 -88 H 25"/>
      <rect class="tower-door" x="-10" y="-32" width="20" height="32" rx="4"/>
      <path class="citadel-arch-trim" d="M -12 -32 a 12 12 0 0 1 24 0"/>
      <rect class="tower-window" x="-6" y="-74" width="12" height="16" rx="6"/>
      <rect class="tower-window" x="-6" y="-110" width="12" height="14" rx="6"/>
      <rect class="tower-crown" x="-36" y="-148" width="72" height="22" rx="4"/>
      <path class="citadel-trim" d="M -36 -142 H 36"/>
      ${merlonRow(-36, 36, -148, 11, 8, 14)}
      <polygon class="citadel-roof" points="-40,-162 0,-232 40,-162"/>
      <polygon class="citadel-roof-shade" points="0,-232 40,-162 16,-162"/>
      <path class="citadel-roof-trim" d="M -40 -162 H 40 M -28 -184 H 28 M -16 -206 H 16"/>
      <rect class="citadel-finial-pole" x="-2" y="-258" width="4" height="30" rx="2"/>
      <circle class="citadel-finial" cx="0" cy="-260" r="6"/>
      <rect class="banner-pole" x="32" y="-150" width="4" height="54" rx="2"/>
      <g class="banner-cloth-wrap">
        <path class="banner-cloth ${bannerClass}" d="M 36 -146 h 26 v 36 l -13 -8 l -13 8 Z"/>
      </g>
    </g>
  `;
}

function citadelOrnaments() {
  const cornerTurret = (x) => `
    <g transform="translate(${x} -246)">
      <rect class="citadel-turret" x="-17" y="-58" width="34" height="60" rx="4"/>
      <path class="citadel-trim" d="M -17 -22 h 34"/>
      <rect class="tower-window" x="-5" y="-44" width="10" height="14" rx="5"/>
      <polygon class="citadel-roof" points="-24,-58 0,-108 24,-58"/>
      <polygon class="citadel-roof-shade" points="0,-108 24,-58 9,-58"/>
      <rect class="citadel-finial-pole" x="-2" y="-130" width="4" height="26" rx="2"/>
      <circle class="citadel-finial" cx="0" cy="-132" r="5"/>
    </g>
  `;

  const brazier = (x) => `
    <g transform="translate(${x} -2)">
      <ellipse class="prop-shadow" cx="2" cy="3" rx="13" ry="5"/>
      <rect class="citadel-brazier-post" x="-4" y="-34" width="8" height="34" rx="3"/>
      <path class="citadel-brazier-bowl" d="M -13 -40 h 26 l -5 12 h -16 Z"/>
      <path class="flame flame-outer" d="M 0 -42 c 9 -7 10 -16 4 -25 c 9 5 13 15 8 24 c -3 5 -9 6 -12 1 Z"/>
      <path class="flame flame-core" d="M 0 -42 c 4 -6 4 -13 0 -20 c -5 7 -5 14 0 20 Z"/>
    </g>
  `;

  const wallBanner = (x, accent) => `
    <g transform="translate(${x} -30)">
      <rect class="citadel-trim-block" x="-13" y="-4" width="26" height="4" rx="2"/>
      <path class="banner-cloth ${accent}" d="M -11 0 h 22 v 30 l -11 -7 l -11 7 Z"/>
    </g>
  `;

  return `
    <g class="citadel-ornaments">
      ${cornerTurret(-80)}
      ${cornerTurret(80)}
      <path class="citadel-trim" d="M -80 -208 h 160 M -70 -186 h 140 M -82 -22 h 164 M -70 -60 h 140"/>
      <g transform="translate(0 -124)">
        <path class="citadel-window-frame" d="M -21 21 v -22 a 21 21 0 0 1 42 0 v 22 Z"/>
        <path class="citadel-glass" d="M -15 16 v -18 a 15 15 0 0 1 30 0 v 18 Z"/>
        <path class="citadel-glass-lead" d="M 0 16 v -34 M -15 -1 h 30"/>
      </g>
      <path class="citadel-arch-trim" d="M -39 -17 a 39 39 0 0 1 78 0"/>
      ${wallBanner(-112, "banner-blue")}
      ${wallBanner(-74, "banner-gold")}
      ${wallBanner(76, "banner-blue")}
      ${wallBanner(114, "banner-gold")}
      ${brazier(-50)}
      ${brazier(50)}
      <path class="citadel-carpet" d="M -22 10 h 44 l 10 12 h -64 Z"/>
    </g>
  `;
}

function grandCitadel() {
  return `
    <g class="grand-keep">
      ${spiredWatchtower(-196, -56, "banner-blue")}
      ${spiredWatchtower(232, -56, "banner-gold")}
      ${spiredWatchtower(-230, 76, "banner-blue")}
      ${spiredWatchtower(266, 76, "banner-gold")}
      ${castleTower(true, false)}
      ${citadelOrnaments()}
    </g>
  `;
}

function ancientStoneKeep() {
  return `
    <g class="ancient-keep">
      ${keepWatchtower(-196, -56, "banner-blue", true)}
      ${keepWatchtower(232, -56, "banner-gold", true)}
      ${keepWatchtower(-196, 64, "banner-blue", true)}
      ${keepWatchtower(232, 64, "banner-gold", true)}
      ${castleTower(true, true)}
    </g>
  `;
}

function renderHomeSvg() {
  if (state.tentLevel >= 10) return grandCitadel();
  if (state.tentLevel === 9) return ancientStoneKeep();
  if (state.tentLevel >= 7) return fourTowerKeep();
  if (state.tentLevel >= 6) return twinTowerKeep();
  if (state.tentLevel === 5) return castleTower(true);
  if (state.tentLevel === 4) return castleTower(false);
  if (state.tentLevel === 3) return house();
  if (state.tentLevel === 2) return logCabin();
  return mainTent();
}

function shutteredWindow(x, y) {
  return `
    <g transform="translate(${x} ${y})">
      <rect class="bld-window-frame" x="-11" y="-10" width="22" height="20" rx="2"/>
      <rect class="bld-window" x="-8" y="-7" width="16" height="14" rx="1.5"/>
      <path class="bld-window-bar" d="M 0 -7 v 14 M -8 0 h 16"/>
      <rect class="bld-shutter" x="-18" y="-11" width="7" height="22" rx="2"/>
      <rect class="bld-shutter" x="11" y="-11" width="7" height="22" rx="2"/>
    </g>
  `;
}

function barracksBuilding() {
  return `
    <g class="bld-barracks">
      <ellipse class="prop-shadow" cx="6" cy="3" rx="60" ry="16"/>

      <polygon class="bld-wall-side" points="42,0 58,-11 58,-57 42,-46"/>
      <rect class="bld-wall" x="-42" y="-46" width="84" height="46"/>
      <path class="bld-plank" d="M -42 -35 h 84 M -42 -24 h 84 M -42 -13 h 84"/>

      <polygon class="bld-gable" points="-42,-46 0,-74 42,-46"/>
      <path class="bld-beam" d="M -42 -46 L 0 -74 L 42 -46 M 0 -70 v 24 M -21 -46 L 0 -60 M 21 -46 L 0 -60"/>
      <polygon class="bld-roof-side" points="0,-77 52,-37 68,-48 16,-88"/>
      <polygon class="bld-roof" points="-52,-40 0,-80 52,-40 46,-34 0,-74 -46,-34"/>

      <rect class="bld-footing" x="-46" y="-13" width="92" height="15" rx="3"/>
      <polygon class="bld-footing-side" points="46,-13 62,-24 62,-9 46,2"/>
      <path class="bld-footing-line" d="M -30 -13 v 15 M -8 -13 v 15 M 14 -13 v 15 M 34 -13 v 15"/>

      ${shutteredWindow(-26, -30)}
      ${shutteredWindow(26, -30)}

      <path class="bld-door-frame" d="M -13 0 v -22 a 13 13 0 0 1 26 0 V 0 Z"/>
      <path class="bld-door" d="M -10 0 v -21 a 10 10 0 0 1 20 0 V 0 Z"/>
      <path class="bld-door-line" d="M 0 0 v -30"/>
      <path class="bld-iron" d="M -9 -8 h 18 M -9 -20 h 18"/>

      <g transform="translate(-52 0)">
        <rect class="bld-post" x="-4" y="-30" width="5" height="31" rx="2"/>
        <rect class="bld-post" x="12" y="-30" width="5" height="31" rx="2"/>
        <rect class="bld-post" x="-4" y="-28" width="21" height="4" rx="2"/>
        <rect class="spear-shaft" x="0" y="-52" width="3" height="53" rx="1.5" transform="rotate(-7 1.5 0)"/>
        <rect class="spear-shaft" x="8" y="-54" width="3" height="55" rx="1.5" transform="rotate(4 9.5 0)"/>
        <polygon class="spear-tip" points="-4,-53 -1.5,-62 1,-52"/>
        <polygon class="spear-tip" points="10,-55 12.5,-64 15,-54"/>
      </g>

      <g class="tent-shield" transform="translate(0 -58) scale(0.5)">
        <path class="shield-face" d="M 0 -22 L 19 -14 V 4 c 0 11 -8 18 -19 22 -11 -4 -19 -11 -19 -22 v -18 Z"/>
        <path class="shield-band" d="M -19 -4 H 19 V 3 H -19 Z"/>
        <circle class="shield-boss" cx="0" cy="-1" r="4.5"/>
      </g>

      <rect class="tent-pole" x="14" y="-104" width="3" height="26" rx="1.5"/>
      <path class="tent-flag-cloth" d="M 17 -103 q 13 3 22 -1 q -7 7 0 13 q -12 3 -22 0 Z"/>
    </g>
  `;
}

function archeryRangeBuilding() {
  const target = (x, y, scale) => `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path class="bld-target-leg" d="M -12 26 L -3 2 M 12 26 L 3 2 M 0 26 v -12"/>
      <circle class="bld-straw" cx="0" cy="0" r="18"/>
      <circle class="bld-straw-inner" cx="0" cy="0" r="14.5"/>
      <circle class="bld-target-ring" cx="0" cy="0" r="11"/>
      <circle class="bld-target-white" cx="0" cy="0" r="7.5"/>
      <circle class="bld-target-ring" cx="0" cy="0" r="4"/>
      <path class="bld-straw-line" d="M -16 -8 a 18 18 0 0 1 32 0 M -16 8 a 18 18 0 0 0 32 0"/>
    </g>
  `;

  const arrow = (x, y, angle) => `
    <g transform="translate(${x} ${y}) rotate(${angle})">
      <rect class="bld-arrow-shaft" x="0" y="-1" width="17" height="2" rx="1"/>
      <polygon class="bld-fletch" points="13,-1 18,-6 18,-1"/>
      <polygon class="bld-fletch" points="13,1 18,6 18,1"/>
    </g>
  `;

  return `
    <g class="bld-archery">
      <ellipse class="prop-shadow" cx="4" cy="3" rx="60" ry="16"/>
      <ellipse class="bld-lane" cx="6" cy="-3" rx="54" ry="15"/>
      <path class="bld-lane-mark" d="M -30 -2 h 26"/>

      ${target(30, -22, 1)}
      ${target(56, -14, 0.62)}
      ${arrow(22, -26, 8)}
      ${arrow(19, -18, -6)}
      ${arrow(48, -16, 5)}

      <rect class="bld-post" x="-56" y="-56" width="6" height="58" rx="2"/>
      <rect class="bld-post" x="-10" y="-56" width="6" height="58" rx="2"/>
      <polygon class="bld-awning-side" points="-4,-56 8,-64 8,-58 -4,-50"/>
      <path class="bld-awning" d="M -62 -56 L 2 -56 L 14 -66 L -50 -66 Z"/>
      <path class="bld-awning-stripe" d="M -50 -66 L -62 -56 M -34 -66 L -46 -56 M -18 -66 L -30 -56 M -2 -66 L -14 -56"/>
      <path class="bld-awning-edge" d="M -62 -56 L 2 -56"/>

      <rect class="bld-rack" x="-54" y="-32" width="44" height="5" rx="2"/>
      <rect class="bld-rack" x="-54" y="-12" width="44" height="5" rx="2"/>
      <path class="bld-bow" d="M -46 -40 q 11 12 0 24 M -34 -40 q 11 12 0 24 M -22 -40 q 11 12 0 24"/>
      <path class="bld-bow-string" d="M -46 -40 v 24 M -34 -40 v 24 M -22 -40 v 24"/>

      <g transform="translate(-16 -8)">
        <path class="bld-quiver" d="M -8 0 h 16 l -2 -20 h -12 Z"/>
        <path class="bld-arrow-shaft" d="M -4 -20 v -10 M 0 -20 v -13 M 4 -20 v -9"/>
        <polygon class="bld-fletch" points="-6,-30 -4,-36 -2,-30"/>
        <polygon class="bld-fletch" points="-2,-33 0,-39 2,-33"/>
        <polygon class="bld-fletch" points="2,-29 4,-35 6,-29"/>
      </g>
    </g>
  `;
}

function stableBuilding() {
  return `
    <g class="bld-stable">
      <ellipse class="prop-shadow" cx="6" cy="3" rx="60" ry="16"/>

      <polygon class="bld-barn-side" points="42,0 58,-11 58,-57 42,-46"/>
      <rect class="bld-barn" x="-42" y="-46" width="84" height="46"/>
      <path class="bld-barn-trim" d="M -42 -46 h 84 M -42 -2 h 84 M -42 -46 v 46 M 42 -46 v 46"/>

      <polygon class="bld-barn-gable" points="-42,-46 0,-74 42,-46"/>
      <path class="bld-barn-trim" d="M -42 -46 L 0 -74 L 42 -46 M -22 -58 h 44"/>
      <polygon class="bld-roof-side" points="0,-77 52,-37 68,-48 16,-88"/>
      <polygon class="bld-roof" points="-52,-40 0,-80 52,-40 46,-34 0,-74 -46,-34"/>

      <g transform="translate(-2 0)">
        <rect class="bld-stall" x="-19" y="-36" width="38" height="36" rx="2"/>
        <rect class="bld-stall-door" x="-19" y="-17" width="38" height="17" rx="2"/>
        <path class="bld-stall-line" d="M -19 -17 h 38 M -7 -17 v 17 M 7 -17 v 17"/>
        <g class="bld-horse" transform="translate(2 -22)">
          <path class="bld-horse-neck" d="M -6 14 l -2 -14 a 9 9 0 0 1 16 -4 l 2 8 -6 12 Z"/>
          <path class="bld-horse-head" d="M 2 -6 a 8 8 0 0 1 14 3 l 1 9 -13 2 Z"/>
          <polygon class="bld-horse-mane" points="-8,0 -4,-9 2,-4 -1,6"/>
          <polygon class="bld-horse-ear" points="4,-7 5,-14 9,-8"/>
          <polygon class="bld-horse-ear" points="10,-7 12,-13 15,-6"/>
          <circle class="bld-horse-eye" cx="8" cy="-1" r="1.6"/>
          <path class="bld-horse-snout" d="M 12 4 h 5"/>
        </g>
      </g>

      <g transform="translate(-48 -6)">
        <rect class="bld-hay" x="-12" y="-16" width="26" height="16" rx="4"/>
        <path class="bld-hay-band" d="M -6 -16 v 16 M 6 -16 v 16"/>
        <rect class="bld-hay" x="-8" y="-29" width="20" height="14" rx="4"/>
        <path class="bld-hay-band" d="M -2 -29 v 14 M 6 -29 v 14"/>
        <path class="bld-straw-tuft" d="M -12 -30 l -4 -6 M -6 -31 l -2 -7 M 2 -31 l 2 -7"/>
      </g>

      <g transform="translate(44 -2)">
        <path class="bld-trough" d="M -12 -10 h 24 l -3 12 h -18 Z"/>
        <path class="bld-trough-water" d="M -9 -7 h 18 l -1 4 h -16 Z"/>
      </g>

      <rect class="bld-vane-post" x="14" y="-100" width="3" height="22" rx="1.5"/>
      <path class="bld-vane" d="M 17 -98 l 14 5 -14 5 Z"/>
      <path class="bld-vane-cross" d="M 9 -92 h 16"/>
    </g>
  `;
}

function theaterBuilding() {
  const mask = (x, y, cls, mouth) => `
    <g transform="translate(${x} ${y})">
      <ellipse class="${cls}" cx="0" cy="0" rx="9" ry="11"/>
      <ellipse class="bld-mask-eye" cx="-3.4" cy="-2.5" rx="1.9" ry="2.6"/>
      <ellipse class="bld-mask-eye" cx="3.4" cy="-2.5" rx="1.9" ry="2.6"/>
      <path class="bld-mask-mouth" d="${mouth}"/>
    </g>
  `;

  return `
    <g class="bld-theater">
      <ellipse class="prop-shadow" cx="6" cy="3" rx="58" ry="15"/>

      <polygon class="bld-stage-side" points="44,-14 58,-23 58,-9 44,0"/>
      <rect class="bld-stage" x="-44" y="-14" width="88" height="14" rx="2"/>
      <path class="bld-stage-line" d="M -44 -7 h 88"/>
      <path class="bld-steps" d="M -16 0 h 32 l 6 8 h -44 Z"/>

      <rect class="bld-post" x="-42" y="-68" width="6" height="54" rx="2"/>
      <rect class="bld-post" x="36" y="-68" width="6" height="54" rx="2"/>
      <rect class="bld-backdrop" x="-36" y="-64" width="72" height="50" rx="2"/>
      <path class="bld-backdrop-art" d="M -30 -14 l 14 -24 10 14 9 -18 13 28 Z"/>
      <circle class="bld-backdrop-moon" cx="18" cy="-50" r="6"/>

      <path class="bld-curtain" d="M -36 -64 h 20 q -6 26 2 50 h -22 Z"/>
      <path class="bld-curtain" d="M 36 -64 h -20 q 6 26 -2 50 h 22 Z"/>
      <path class="bld-curtain-fold" d="M -28 -60 q -4 26 0 46 M -21 -60 q -5 26 -1 46 M 28 -60 q 4 26 0 46 M 21 -60 q 5 26 1 46"/>
      <rect class="bld-curtain-tie" x="-33" y="-34" width="16" height="5" rx="2.5"/>
      <rect class="bld-curtain-tie" x="17" y="-34" width="16" height="5" rx="2.5"/>

      <path class="bld-valance" d="M -44 -72 h 88 v 12 q -22 8 -44 0 q -22 8 -44 0 Z"/>
      <path class="bld-valance-trim" d="M -44 -60 q 22 8 44 0 q 22 8 44 0"/>

      ${mask(-14, -80, "bld-mask-comedy", "M -5 3 q 5 5 10 0")}
      ${mask(14, -80, "bld-mask-tragedy", "M -5 5 q 5 -5 10 0")}

      <g transform="translate(-34 -16)">
        <rect class="bld-lantern-post" x="-2" y="-12" width="4" height="14" rx="2"/>
        <circle class="bld-lantern-glow" cx="0" cy="-16" r="6"/>
      </g>
      <g transform="translate(34 -16)">
        <rect class="bld-lantern-post" x="-2" y="-12" width="4" height="14" rx="2"/>
        <circle class="bld-lantern-glow" cx="0" cy="-16" r="6"/>
      </g>
    </g>
  `;
}

function farmBuilding() {
  const rows = Array.from({ length: 4 }, (_, index) => {
    const t = index / 3;
    const ax = -46 + t * 18;
    const ay = -6 - t * 15;
    const bx = 30 + t * 18;
    const by = -6 - t * 15;
    const sprouts = Array.from({ length: 5 }, (_, s) => {
      const sx = ax + ((bx - ax) * (s + 0.5)) / 5;
      return `<path class="bld-crop" d="M ${sx.toFixed(1)} ${ay} v -7 M ${(sx - 4).toFixed(1)} ${ay - 6} q 4 -1 4 -6 M ${(sx + 4).toFixed(1)} ${ay - 6} q -4 -1 -4 -6"/>`;
    }).join("");
    return `<path class="bld-furrow" d="M ${ax} ${ay} L ${bx} ${by}"/>${sprouts}`;
  }).join("");

  return `
    <g class="bld-farm">
      <ellipse class="prop-shadow" cx="4" cy="3" rx="58" ry="15"/>
      <polygon class="bld-soil" points="-50,0 34,0 52,-52 -32,-52"/>
      <polygon class="bld-soil-edge" points="-50,0 34,0 36,4 -48,4"/>
      ${rows}

      <g transform="translate(-20 -52)">
        <rect class="bld-scare-post" x="-2" y="-4" width="5" height="30" rx="2"/>
        <rect class="bld-scare-post" x="-13" y="-2" width="27" height="4" rx="2"/>
        <path class="bld-scare-coat" d="M -11 -2 h 23 l -3 20 h -17 Z"/>
        <path class="bld-scare-patch" d="M -6 4 h 7 v 6 h -7 Z"/>
        <circle class="bld-scare-head" cx="0.5" cy="-10" r="8"/>
        <path class="bld-scare-hat" d="M -10 -14 h 21 l -4 -8 h -13 Z"/>
        <circle class="bld-scare-eye" cx="-2.5" cy="-11" r="1.5"/>
        <circle class="bld-scare-eye" cx="3.5" cy="-11" r="1.5"/>
        <path class="bld-scare-mouth" d="M -3 -6 q 3.5 3 7 0"/>
        <path class="bld-straw-tuft" d="M -9 -3 l -5 4 M 11 -3 l 5 4 M -7 18 l -4 5 M 8 18 l 4 5"/>
      </g>

      <g transform="translate(40 -8)">
        <path class="bld-bucket" d="M -8 -10 h 16 l -2 12 h -12 Z"/>
        <path class="bld-bucket-band" d="M -7 -5 h 14"/>
        <path class="bld-bucket-handle" d="M -8 -10 q 8 -9 16 0"/>
      </g>

      <path class="bld-farm-fence" d="M -52 2 v -14 M -38 0 v -14 M -24 -2 v -14 M -52 -8 L -24 -12"/>
    </g>
  `;
}

function mintBuilding() {
  const coinStack = (x, y, count) =>
    Array.from({ length: count }, (_, index) => `<ellipse class="bld-coin" cx="${x}" cy="${y - index * 3.4}" rx="7" ry="3.4"/>`).join("");

  return `
    <g class="bld-mint">
      <ellipse class="prop-shadow" cx="6" cy="3" rx="60" ry="16"/>

      <polygon class="bld-stone-side" points="42,0 58,-11 58,-57 42,-46"/>
      <rect class="bld-stone-wall" x="-42" y="-46" width="84" height="46"/>
      <path class="bld-stone-line" d="M -42 -35 h 84 M -42 -23 h 84 M -42 -11 h 84 M -21 -46 v 11 M 10 -46 v 11 M -32 -35 v 12 M 0 -35 v 12 M 26 -35 v 12 M -21 -23 v 12 M 10 -23 v 12"/>

      <polygon class="bld-stone-gable" points="-42,-46 0,-74 42,-46"/>
      <path class="bld-stone-line" d="M -26 -55 h 52 M -13 -64 h 26"/>
      <polygon class="bld-mint-roof-side" points="0,-77 52,-37 68,-48 16,-88"/>
      <polygon class="bld-mint-roof" points="-52,-40 0,-80 52,-40 46,-34 0,-74 -46,-34"/>

      <g class="bld-chimney">
        <polygon class="bld-chimney-side" points="34,-92 44,-98 44,-62 34,-56"/>
        <rect class="bld-chimney-body" x="14" y="-92" width="20" height="36" rx="2"/>
        <rect class="bld-chimney-cap" x="10" y="-98" width="28" height="8" rx="3"/>
        <circle class="cabin-smoke" cx="20" cy="-110" r="6"/>
        <circle class="cabin-smoke" cx="28" cy="-124" r="8"/>
        <circle class="cabin-smoke" cx="19" cy="-140" r="10"/>
      </g>

      <rect class="bld-window-frame" x="-36" y="-38" width="22" height="20" rx="2"/>
      <rect class="bld-mint-glow" x="-33" y="-35" width="16" height="14" rx="1.5"/>
      <path class="bld-iron" d="M -30 -38 v 20 M -25 -38 v 20 M -20 -38 v 20"/>

      <path class="bld-door-frame" d="M -6 0 v -24 a 14 14 0 0 1 28 0 V 0 Z"/>
      <path class="bld-door" d="M -3 0 v -22 a 11 11 0 0 1 22 0 V 0 Z"/>
      <path class="bld-iron" d="M -2 -8 h 20 M -2 -20 h 20"/>

      <g transform="translate(8 -56)">
        <rect class="bld-sign-arm" x="-2" y="-4" width="18" height="3" rx="1.5"/>
        <path class="bld-sign-chain" d="M 12 -1 v 5"/>
        <circle class="bld-sign-coin" cx="12" cy="9" r="8"/>
        <path class="bld-sign-mark" d="M 12 3 v 12 M 9 6 h 6 M 9 12 h 6"/>
      </g>

      <g transform="translate(-52 -2)">
        ${coinStack(0, 0, 4)}
        ${coinStack(11, 0, 2)}
        <ellipse class="bld-coin" cx="17" cy="0" rx="7" ry="3.4"/>
      </g>

      <g transform="translate(48 -4)">
        <rect class="bld-chest" x="-12" y="-12" width="24" height="14" rx="2"/>
        <path class="bld-chest-lid" d="M -12 -12 q 12 -10 24 0 Z"/>
        <path class="bld-iron" d="M -12 -6 h 24"/>
        <rect class="bld-chest-lock" x="-2.5" y="-9" width="5" height="7" rx="1.5"/>
      </g>
    </g>
  `;
}

function emptyPlot() {
  const stake = (x, y) => `
    <rect class="plot-stake" x="${x - 3}" y="${y - 26}" width="6" height="30" rx="3"/>
    <polygon class="plot-stake-tip" points="${x - 3},${y - 26} ${x},${y - 34} ${x + 3},${y - 26}"/>
  `;

  return `
    <g class="build-plot">
      <ellipse class="plot-ground" cx="0" cy="0" rx="54" ry="24"/>
      <path class="plot-rope" d="M -46 -22 L 46 -22 L 46 -4 L -46 -4 Z"/>
      ${stake(-46, -4)}
      ${stake(46, -4)}
      ${stake(-46, -22)}
      ${stake(46, -22)}
      <g class="plot-badge" transform="translate(0 -46)">
        <circle class="plot-badge-disc" cx="0" cy="0" r="19"/>
        <path class="plot-badge-plus" d="M 0 -10 v 20 M -10 0 h 20"/>
      </g>
    </g>
  `;
}

function buildingArt(buildingId) {
  if (buildingId === "barracks") return barracksBuilding();
  if (buildingId === "archery-range") return archeryRangeBuilding();
  if (buildingId === "stable") return stableBuilding();
  if (buildingId === "theater") return theaterBuilding();
  if (buildingId === "farm") return farmBuilding();
  if (buildingId === "mint") return mintBuilding();
  return "";
}

function renderBuildSlots() {
  return BUILD_SLOTS.map((slot, index) => {
    if (!isBuildSlotOpen(index)) return "";
    const buildingId = getSlotBuildingId(index);
    const art = buildingId ? buildingArt(buildingId) : emptyPlot();
    const clickArea = buildingId
      ? `<rect class="build-slot-click-area" x="-66" y="-96" width="132" height="108" fill="transparent"/>`
      : `<rect class="build-slot-click-area" x="-58" y="-72" width="116" height="100" fill="transparent"/>`;
    return `<g class="build-slot build-slot-click" transform="translate(${slot.x} ${slot.y})" data-action="select-build-slot" data-slot-index="${index}">${art}${clickArea}</g>`;
  }).join("");
}

function campBase() {
  return `
    <g class="camp-base">
      <g class="tent-main" transform="translate(800 856) scale(0.62)">${renderHomeSvg()}</g>
      ${renderBuildSlots()}
      <g class="camp-crossbow" transform="translate(${CROSSBOW_POSITION.x} ${CROSSBOW_POSITION.y}) scale(0.58)">
        <g class="crossbow-aim">${weaponArt()}</g>
      </g>
      ${state.healingFire ? `<g class="healing-fire" transform="translate(${HEALING_FIRE_POSITION.x} ${HEALING_FIRE_POSITION.y}) scale(0.5)">${campfire()}</g>` : ""}
      <g transform="translate(706 800) scale(0.46)">${bannerPole("banner-blue")}</g>
      <g transform="translate(894 800) scale(0.46)">${bannerPole("banner-gold")}</g>
      <g transform="translate(982 978) scale(0.46)">${trainingDummy()}</g>
      <g transform="translate(566 802) scale(0.5)">${supplyWagon()}</g>
      <g transform="translate(596 946) scale(0.5)">${palisade(5)}</g>
      <g transform="translate(1000 936) scale(0.5)">${palisade(5)}</g>
      ${campProps()}
    </g>
  `;
}

function riverCrossings() {
  return `
    <g class="crossings">
      <g class="bridge">
        <ellipse class="water-shadow" cx="303" cy="388" rx="26" ry="10"/>
        <rect class="bridge-support" x="282" y="344" width="6" height="50" rx="2"/>
        <rect class="bridge-support" x="316" y="344" width="6" height="50" rx="2"/>
        <rect class="bridge-deck" x="283" y="336" width="38" height="62" rx="3"/>
        ${Array.from({ length: 8 }, (_, index) => `<rect class="bridge-plank" x="285" y="${339 + index * 7.4}" width="34" height="4.6" rx="2"/>`).join("")}
        <rect class="bridge-rail" x="277" y="332" width="5" height="70" rx="2"/>
        <rect class="bridge-rail" x="322" y="332" width="5" height="70" rx="2"/>
        ${Array.from({ length: 4 }, (_, index) => `
          <rect class="bridge-post" x="275" y="${334 + index * 21}" width="9" height="9" rx="2"/>
          <rect class="bridge-post" x="320" y="${334 + index * 21}" width="9" height="9" rx="2"/>
        `).join("")}
      </g>
      <g class="stone-bridge">
        <ellipse class="water-shadow" cx="643" cy="338" rx="30" ry="12"/>
        <path class="stone-bridge-deck" d="M 614 288 q 26 -12 52 0 v 66 q -26 12 -52 0 Z"/>
        <path class="stone-bridge-arch" d="M 626 314 q 14 8 28 0 v 16 q -14 -8 -28 0 Z"/>
        ${Array.from({ length: 6 }, (_, index) => `<rect class="stone-bridge-block" x="618" y="${292 + index * 10.6}" width="44" height="8" rx="2.5"/>`).join("")}
        <rect class="stone-bridge-rail" x="606" y="284" width="8" height="74" rx="3"/>
        <rect class="stone-bridge-rail" x="666" y="284" width="8" height="74" rx="3"/>
      </g>
      <g class="ford">
        ${[
          [996, 394, 11, 8],
          [1006, 378, 12, 9],
          [992, 362, 11, 8],
          [1004, 346, 10, 7],
          [996, 332, 9, 6]
        ]
          .map(([cx, cy, rx, ry]) => `
            <g>
              <ellipse class="river-foam" cx="${cx}" cy="${cy + 3}" rx="${rx + 5}" ry="${ry + 3}"/>
              <ellipse class="ford-stone" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
              <ellipse class="ford-stone-top" cx="${cx - 2}" cy="${cy - 2}" rx="${rx * 0.6}" ry="${ry * 0.5}"/>
            </g>
          `)
          .join("")}
      </g>
      <g class="bridge">
        <ellipse class="water-shadow" cx="1341" cy="338" rx="26" ry="10"/>
        <rect class="bridge-support" x="1320" y="296" width="6" height="48" rx="2"/>
        <rect class="bridge-support" x="1354" y="296" width="6" height="48" rx="2"/>
        <rect class="bridge-deck" x="1321" y="288" width="38" height="60" rx="3"/>
        ${Array.from({ length: 8 }, (_, index) => `<rect class="bridge-plank" x="1323" y="${291 + index * 7.1}" width="34" height="4.4" rx="2"/>`).join("")}
        <rect class="bridge-rail" x="1315" y="284" width="5" height="68" rx="2"/>
        <rect class="bridge-rail" x="1360" y="284" width="5" height="68" rx="2"/>
        ${Array.from({ length: 4 }, (_, index) => `
          <rect class="bridge-post" x="1313" y="${286 + index * 20}" width="9" height="9" rx="2"/>
          <rect class="bridge-post" x="1358" y="${286 + index * 20}" width="9" height="9" rx="2"/>
        `).join("")}
      </g>
      <g class="dock">
        <ellipse class="water-shadow" cx="878" cy="350" rx="20" ry="8"/>
        <rect class="dock-deck" x="862" y="320" width="24" height="34" rx="2"/>
        ${Array.from({ length: 4 }, (_, index) => `<rect class="dock-plank" x="863" y="${323 + index * 7.6}" width="22" height="4.4" rx="2"/>`).join("")}
        <rect class="dock-post" x="858" y="316" width="5" height="12" rx="2"/>
        <rect class="dock-post" x="885" y="316" width="5" height="12" rx="2"/>
        <g class="boat" transform="translate(924 352) rotate(-8) scale(0.7)">
          <ellipse class="water-shadow" cx="2" cy="12" rx="28" ry="9"/>
          <path class="boat-hull" d="M -30 -9 q 30 -9 60 0 q -8 20 -30 20 q -22 0 -30 -20 Z"/>
          <path class="boat-inner" d="M -22 -5 q 22 -6 44 0 q -6 13 -22 13 q -16 0 -22 -13 Z"/>
          <rect class="boat-bench" x="-12" y="-3" width="24" height="5" rx="2"/>
          <rect class="boat-oar" x="-4" y="-30" width="4" height="46" rx="2" transform="rotate(58 -2 -7)"/>
        </g>
      </g>
    </g>
  `;
}

function cottage(x, y, scale, flip) {
  return `
    <g transform="translate(${x} ${y})">
      <g transform="scale(${scale * (flip ? -1 : 1)} ${scale})">
        <ellipse class="prop-shadow" cx="8" cy="4" rx="54" ry="15"/>
        <rect class="cottage-wall" x="-40" y="-52" width="80" height="54" rx="3"/>
        <path class="cottage-beam" d="M -40 -30 h 80 M -14 -52 v 54 M 14 -52 v 54"/>
        <path class="cottage-roof" d="M -50 -50 L 0 -92 L 50 -50 Z"/>
        <path class="cottage-roof-line" d="M -38 -50 L 0 -82 M -26 -50 L 0 -72 M 38 -50 L 0 -82 M 26 -50 L 0 -72"/>
        <rect class="cottage-door" x="-11" y="-28" width="22" height="30" rx="3"/>
        <circle class="cottage-knob" cx="6" cy="-13" r="1.8"/>
        <rect class="cottage-window" x="-34" y="-44" width="16" height="14" rx="2"/>
        <rect class="cottage-window" x="18" y="-44" width="16" height="14" rx="2"/>
        <rect class="chimney" x="22" y="-84" width="13" height="26" rx="2"/>
        <rect class="chimney-cap" x="20" y="-88" width="17" height="5" rx="2"/>
        <g class="smoke" style="animation-delay:0s"><circle cx="29" cy="-92" r="5"/></g>
        <g class="smoke" style="animation-delay:1.3s"><circle cx="29" cy="-92" r="4"/></g>
        <g class="smoke" style="animation-delay:2.6s"><circle cx="29" cy="-92" r="6"/></g>
      </g>
    </g>
  `;
}

function villageGroup() {
  return `
    <g class="village">
      ${cottage(120, 150, 0.58, false)}
      ${cottage(238, 108, 0.5, true)}
      ${cottage(300, 186, 0.54, false)}
      <g transform="translate(196 196) scale(0.55)">
        <ellipse class="prop-shadow" cx="5" cy="4" rx="30" ry="10"/>
        <ellipse class="well-stone" cx="0" cy="-6" rx="26" ry="14"/>
        <path class="well-wall" d="M -26 -6 v -16 q 26 -10 52 0 v 16 Z"/>
        <ellipse class="well-water" cx="0" cy="-22" rx="22" ry="10"/>
        <rect class="well-post" x="-24" y="-64" width="6" height="44" rx="2"/>
        <rect class="well-post" x="18" y="-64" width="6" height="44" rx="2"/>
        <path class="well-roof" d="M -34 -62 L 0 -88 L 34 -62 Z"/>
        <rect class="well-bar" x="-24" y="-58" width="48" height="4" rx="2"/>
        <path class="well-rope" d="M 0 -56 v 22"/>
        <rect class="well-bucket" x="-7" y="-36" width="14" height="12" rx="3"/>
      </g>
      <g transform="translate(60 232) scale(0.5)">
        <ellipse class="prop-shadow" cx="4" cy="3" rx="26" ry="9"/>
        <rect class="crate-body" x="-20" y="-26" width="40" height="28" rx="3"/>
        <path class="crate-line" d="M -20 -16 h 40 M 0 -26 v 28"/>
      </g>
    </g>
  `;
}

function windmillGroup() {
  return `<g class="windmill" transform="translate(${WINDMILL_POSITION.x} ${WINDMILL_POSITION.y}) scale(0.72)">${windmillArt()}</g>`;
}

function windmillArt() {
  return `
      <ellipse class="prop-shadow" cx="10" cy="5" rx="56" ry="17"/>
      <path class="mill-tower" d="M -34 0 L -22 -96 H 22 L 34 0 Z"/>
      <path class="mill-band" d="M -29 -40 H 29 M -25 -68 H 25"/>
      <rect class="mill-door" x="-9" y="-30" width="18" height="30" rx="3"/>
      <rect class="mill-window" x="-7" y="-64" width="14" height="13" rx="2"/>
      <path class="mill-cap" d="M -26 -96 q 26 -30 52 0 Z"/>
      <g transform="translate(0 -104)">
        <g class="mill-blades">
          ${[0, 90, 180, 270].map((angle) => `
            <g transform="rotate(${angle})">
              <rect class="mill-blade" x="-5" y="-72" width="10" height="66" rx="2"/>
              <path class="mill-blade-lattice" d="M -5 -66 h 10 M -5 -54 h 10 M -5 -42 h 10 M -5 -30 h 10 M -5 -18 h 10 M 0 -72 v 66"/>
            </g>
          `).join("")}
        </g>
        <circle class="mill-hub" cx="0" cy="0" r="7"/>
      </g>
      <g transform="translate(-96 6)">
        <rect class="field-soil" x="-52" y="-30" width="104" height="32" rx="6"/>
        <path class="crop-row" d="M -46 -24 q 46 -6 92 0 M -46 -16 q 46 -6 92 0 M -46 -8 q 46 -6 92 0 M -46 0 q 46 -6 92 0"/>
      </g>
  `;
}

function watchtowerGroup() {
  return `
    <g class="watchtower" transform="translate(1372 172) scale(0.74)">
      <ellipse class="prop-shadow" cx="12" cy="6" rx="60" ry="18"/>
      <path class="tower-body" d="M -34 0 L -26 -126 H 26 L 34 0 Z"/>
      <path class="tower-band" d="M -30 -46 H 30 M -28 -86 H 28"/>
      <rect class="tower-door" x="-11" y="-34" width="22" height="34" rx="4"/>
      <rect class="tower-window" x="-7" y="-74" width="14" height="16" rx="6"/>
      <rect class="tower-window" x="-7" y="-112" width="14" height="14" rx="6"/>
      <rect class="tower-crown" x="-38" y="-146" width="76" height="22" rx="4"/>
      ${merlonRow(-38, 38, -146, 12, 10, 14)}
      <g transform="translate(0 -160) scale(0.42)">${campfire()}</g>
      <rect class="banner-pole" x="34" y="-150" width="5" height="60" rx="2.5"/>
      <g class="banner-cloth-wrap">
        <path class="banner-cloth banner-blue" d="M 38 -146 h 28 v 40 l -14 -8 l -14 8 Z"/>
      </g>
    </g>
  `;
}

function ruinsGroup() {
  return `
    <g class="ruins" transform="translate(176 572) scale(0.8)">
      <ellipse class="prop-shadow" cx="10" cy="6" rx="96" ry="26"/>
      <path class="ruin-stone" d="M -86 2 v -74 h 22 v 74 Z"/>
      <path class="ruin-stone-top" d="M -86 -72 h 22 l -3 -8 h -16 Z"/>
      <path class="ruin-stone" d="M -30 2 v -90 h 22 v 90 Z"/>
      <path class="ruin-stone-top" d="M -30 -88 h 22 l -4 -9 h -14 Z"/>
      <path class="ruin-stone" d="M 30 2 v -58 h 20 v 58 Z"/>
      <path class="ruin-arch" d="M -30 -88 q 42 -26 80 -2 l -6 14 q -34 -20 -68 2 Z"/>
      <path class="ruin-stone" d="M 66 2 v -34 h 18 v 34 Z"/>
      <path class="ruin-rubble" d="M -66 2 q 12 -14 26 0 Z M 0 2 q 14 -16 30 0 Z M 52 2 q 10 -12 22 0 Z"/>
      <path class="ruin-crack" d="M -78 -20 l 8 -16 M -22 -40 l 8 -14 M 38 -30 l 6 -12"/>
      <path class="ruin-moss" d="M -86 -30 q 10 6 22 0 v 10 q -12 6 -22 0 Z M -30 -54 q 10 6 22 0 v 10 q -12 6 -22 0 Z"/>
    </g>
  `;
}

function horse(x, y, scale, flip) {
  return `
    <g transform="translate(${x} ${y})">
      <g transform="scale(${scale * (flip ? -1 : 1)} ${scale})">
        <ellipse class="prop-shadow" cx="3" cy="3" rx="30" ry="9"/>
        <path class="horse-leg" d="M -18 -14 v 16 M -9 -14 v 16 M 11 -14 v 16 M 20 -14 v 16"/>
        <ellipse class="horse-body" cx="0" cy="-22" rx="26" ry="14"/>
        <path class="horse-neck" d="M 18 -30 q 14 -6 18 -22 l 10 3 q -4 20 -20 28 Z"/>
        <ellipse class="horse-head" cx="41" cy="-54" rx="9" ry="7" transform="rotate(-22 41 -54)"/>
        <path class="horse-mane" d="M 22 -34 q 10 -8 14 -22 l 6 2 q -6 16 -16 24 Z"/>
        <path class="horse-tail" d="M -26 -28 q -12 4 -14 22 l 6 2 q 4 -14 12 -18 Z"/>
      </g>
    </g>
  `;
}

function fenceRect(x, y, width, height, step) {
  const posts = [];
  for (let px = x; px <= x + width; px += step) {
    posts.push(`<rect class="fence-post" x="${px - 2}" y="${y - 12}" width="4" height="14" rx="1.5"/>`);
    posts.push(`<rect class="fence-post" x="${px - 2}" y="${y + height - 12}" width="4" height="14" rx="1.5"/>`);
  }
  for (let py = y + step; py < y + height; py += step) {
    posts.push(`<rect class="fence-post" x="${x - 2}" y="${py - 12}" width="4" height="14" rx="1.5"/>`);
    posts.push(`<rect class="fence-post" x="${x + width - 2}" y="${py - 12}" width="4" height="14" rx="1.5"/>`);
  }

  return `
    <g class="fence">
      ${posts.join("")}
      <path class="fence-rail" d="M ${x} ${y - 8} H ${x + width} M ${x} ${y - 3} H ${x + width} M ${x} ${y + height - 8} H ${x + width} M ${x} ${y + height - 3} H ${x + width} M ${x - 0} ${y - 8} V ${y + height - 3} M ${x + width} ${y - 8} V ${y + height - 3}"/>
    </g>
  `;
}

function paddockGroup() {
  return `<g class="paddock">${paddockArt()}</g>`;
}

function paddockArt() {
  return `
      <ellipse class="paddock-ground" cx="550" cy="536" rx="112" ry="66"/>
      ${fenceRect(444, 476, 212, 124, 34)}
      ${horse(510, 530, 0.62, false)}
      ${horse(596, 566, 0.56, true)}
      <g transform="translate(470 580) scale(0.42)">
        <ellipse class="prop-shadow" cx="3" cy="2" rx="22" ry="7"/>
        <path class="trough-body" d="M -22 -12 h 44 l -6 14 h -32 Z"/>
        <rect class="trough-water" x="-17" y="-10" width="34" height="5" rx="2"/>
      </g>
  `;
}

function quarryGroup() {
  return `<g class="quarry" transform="translate(${MINE_POSITION.x} ${MINE_POSITION.y})">${quarryArt()}</g>`;
}

function quarryArt() {
  return `
      <ellipse class="quarry-ground" cx="0" cy="20" rx="118" ry="62"/>
      <path class="quarry-mound" d="M -104 22 q 18 -76 66 -84 q 52 -10 74 42 q 12 26 4 42 Z"/>
      <path class="quarry-face" d="M -66 22 q 6 -44 34 -52 q 26 -6 40 20 q 8 16 4 32 Z"/>
      <path class="mine-frame" d="M -22 22 v -34 h 44 v 34"/>
      <path class="mine-mouth" d="M -16 22 v -26 q 16 -8 32 0 v 26 Z"/>
      <rect class="mine-beam" x="-26" y="-16" width="52" height="7" rx="2"/>
      <path class="rail" d="M -12 22 L -30 66 M 10 22 L 28 66"/>
      <path class="rail-tie" d="M -16 34 h 30 M -21 46 h 34 M -26 58 h 38"/>
      <g transform="translate(2 74) scale(0.56)">
        <ellipse class="prop-shadow" cx="4" cy="5" rx="34" ry="11"/>
        <path class="cart-body" d="M -26 -26 h 52 l -6 26 h -40 Z"/>
        <rect class="cart-band" x="-24" y="-18" width="48" height="5" rx="2"/>
        <circle class="wagon-wheel" cx="-15" cy="4" r="9"/>
        <circle class="wagon-wheel" cx="15" cy="4" r="9"/>
        <circle class="wagon-hub" cx="-15" cy="4" r="3"/>
        <circle class="wagon-hub" cx="15" cy="4" r="3"/>
        <circle class="ore" cx="-10" cy="-28" r="6"/>
        <circle class="ore" cx="2" cy="-31" r="7"/>
        <circle class="ore" cx="14" cy="-28" r="5.5"/>
      </g>
      <path class="rock-body" d="M -96 24 q -4 -16 10 -21 q 14 -6 22 2 q 10 9 4 19 Z"/>
      <path class="rock-body" d="M 74 26 q -4 -14 8 -18 q 12 -5 19 2 q 8 8 3 16 Z"/>
      <path class="quarry-crack" d="M -40 -36 l 10 -14 M 14 -30 l 8 -12"/>
  `;
}

function farmGroup() {
  const rows = Array.from({ length: 7 }, (_, index) => `<path class="crop-row" d="M 116 ${796 + index * 19} q 84 -8 168 0"/>`).join("");

  return `
    <g class="farm">
      <rect class="field-soil" x="104" y="780" width="192" height="140" rx="12"/>
      ${rows}
      ${fenceRect(96, 772, 208, 156, 34)}
      <g transform="translate(322 840) scale(0.6)">
        <ellipse class="prop-shadow" cx="5" cy="4" rx="26" ry="9"/>
        <rect class="dummy-post" x="-4" y="-74" width="8" height="76" rx="3"/>
        <rect class="dummy-arm" x="-34" y="-58" width="68" height="7" rx="3.5"/>
        <path class="scarecrow-shirt" d="M -20 -58 h 40 l -5 34 h -30 Z"/>
        <circle class="scarecrow-head" cx="0" cy="-70" r="12"/>
        <path class="scarecrow-hat" d="M -18 -78 h 36 l -8 -6 h -20 Z"/>
        <path class="dummy-straw" d="M -32 -50 l -10 8 M 32 -50 l 10 8 M -8 -24 l -4 12 M 8 -24 l 4 12"/>
      </g>
      <g transform="translate(346 916) scale(0.5)">
        <ellipse class="prop-shadow" cx="3" cy="3" rx="24" ry="8"/>
        <path class="hay-body" d="M -22 2 q 2 -26 22 -26 q 20 0 22 26 Z"/>
        <path class="hay-line" d="M -14 -12 q 14 -6 28 0 M -18 -2 q 18 -8 36 0"/>
      </g>
    </g>
  `;
}

function sheepFlock(x, y, scale) {
  const sheep = [
    [0, 0, 1],
    [38, 16, 0.86],
    [-32, 22, 0.92],
    [12, 40, 0.8]
  ]
    .map(([dx, dy, s], index) => `
      <g transform="translate(${dx} ${dy}) scale(${s * (index % 2 === 0 ? 1 : -1)} ${s})">
        <ellipse class="prop-shadow" cx="2" cy="2" rx="18" ry="6"/>
        <path class="sheep-leg" d="M -8 -6 v 8 M 6 -6 v 8"/>
        <ellipse class="sheep-body" cx="0" cy="-14" rx="17" ry="11"/>
        <circle class="sheep-wool" cx="-10" cy="-20" r="7"/>
        <circle class="sheep-wool" cx="2" cy="-24" r="7.5"/>
        <circle class="sheep-wool" cx="12" cy="-19" r="6.5"/>
        <ellipse class="sheep-head" cx="17" cy="-18" rx="6" ry="5"/>
        <path class="sheep-ear" d="M 15 -23 l -4 -4 l 5 1 Z"/>
      </g>
    `)
    .join("");

  return `<g transform="translate(${x} ${y}) scale(${scale})">${sheep}</g>`;
}

function treeSvg(tree, index) {
  const delay = ((index % 8) * 0.55).toFixed(2);
  const crown = tree.type === "pine"
    ? `
      <polygon class="pine-dark" points="0,-102 -32,-26 32,-26"/>
      <polygon class="pine-mid" points="0,-112 -27,-46 27,-46"/>
      <polygon class="pine-dark" points="0,-126 -22,-66 22,-66"/>
      <polygon class="pine-mid" points="0,-136 -17,-86 17,-86"/>
      <polygon class="pine-light" points="-3,-136 -14,-92 4,-96"/>
    `
    : `
      <circle class="leaf-dark" cx="-25" cy="-46" r="25"/>
      <circle class="leaf-dark" cx="25" cy="-44" r="24"/>
      <circle class="leaf-dark" cx="0" cy="-62" r="33"/>
      <circle class="leaf-mid" cx="-9" cy="-68" r="25"/>
      <circle class="leaf-mid" cx="16" cy="-54" r="20"/>
      <circle class="leaf-light" cx="-16" cy="-76" r="13"/>
      <circle class="leaf-light" cx="7" cy="-82" r="9"/>
    `;

  const trunk = tree.type === "pine"
    ? `<path class="tree-trunk" d="M -5 2 l 1 -30 h 8 l 1 30 Z"/>`
    : `<path class="tree-trunk" d="M -7 2 q 2 -18 -1 -32 h 16 q -3 14 -1 32 Z"/>`;

  return `
    <g transform="translate(${tree.x} ${tree.y})">
      <g transform="scale(${tree.scale})">
        <ellipse class="prop-shadow" cx="10" cy="4" rx="30" ry="10"/>
        ${trunk}
        <g class="tree-crown" style="animation-delay:${delay}s">${crown}</g>
      </g>
    </g>
  `;
}

function scatterSvg() {
  const trees = CAMP_TREES.map((tree, index) => treeSvg(tree, index)).join("");

  const bushes = CAMP_BUSHES.map((bush, index) => `
    <g transform="translate(${bush.x} ${bush.y})">
      <g transform="scale(${bush.scale})">
        <ellipse class="prop-shadow" cx="5" cy="2" rx="24" ry="8"/>
        <g class="tree-crown" style="animation-delay:${((index % 5) * 0.7).toFixed(2)}s">
          <circle class="leaf-dark" cx="-13" cy="-10" r="14"/>
          <circle class="leaf-dark" cx="13" cy="-9" r="13"/>
          <circle class="leaf-mid" cx="0" cy="-17" r="15"/>
          <circle class="leaf-light" cx="-6" cy="-22" r="7"/>
          <circle class="berry" cx="9" cy="-18" r="2.6"/>
          <circle class="berry" cx="-14" cy="-14" r="2.4"/>
        </g>
      </g>
    </g>
  `).join("");

  const rocks = CAMP_ROCKS.map((rock) => `
    <g transform="translate(${rock.x} ${rock.y})">
      <g transform="scale(${rock.scale})">
        <ellipse class="prop-shadow" cx="6" cy="3" rx="22" ry="8"/>
        <path class="rock-body" d="M -20 2 q -4 -14 8 -19 q 12 -7 20 1 q 10 8 4 17 Z"/>
        <path class="rock-top" d="M -10 -9 q 4 -7 12 -5 q 7 2 6 8 q -10 3 -18 -3 Z"/>
      </g>
    </g>
  `).join("");

  return `<g class="scatter">${bushes}${rocks}${trees}</g>`;
}

function wildlife() {
  const butterflies = [
    { x: 392, y: 742, delay: 0 },
    { x: 1188, y: 806, delay: 2.4 },
    { x: 612, y: 620, delay: 1.2 },
    { x: 470, y: 300, delay: 3.1 }
  ]
    .map((item) => `
      <g transform="translate(${item.x} ${item.y})">
        <g class="butterfly" style="animation-delay:${item.delay}s">
          <g class="butterfly-wings">
            <path class="wing" d="M 0 0 q -10 -10 -2 -15 q 6 -3 2 15 Z"/>
            <path class="wing" d="M 0 0 q 10 -10 2 -15 q -6 -3 -2 15 Z"/>
            <path class="wing" d="M 0 0 q -8 6 -2 10 q 5 2 2 -10 Z"/>
            <path class="wing" d="M 0 0 q 8 6 2 10 q -5 2 -2 -10 Z"/>
          </g>
          <rect class="butterfly-body" x="-0.8" y="-6" width="1.6" height="12" rx="0.8"/>
        </g>
      </g>
    `)
    .join("");

  const dragonflies = [
    { x: 520, y: 402, delay: 0.6 },
    { x: 1240, y: 398, delay: 2.1 },
    { x: 1290, y: 820, delay: 1.4 }
  ]
    .map((item) => `
      <g transform="translate(${item.x} ${item.y})">
        <g class="dragonfly" style="animation-delay:${item.delay}s">
          <g class="butterfly-wings">
            <ellipse class="wing thin" cx="-7" cy="-2" rx="9" ry="2.6"/>
            <ellipse class="wing thin" cx="7" cy="-2" rx="9" ry="2.6"/>
          </g>
          <rect class="dragonfly-body" x="-1" y="-3" width="2" height="14" rx="1"/>
        </g>
      </g>
    `)
    .join("");

  const birds = [
    { x: 240, y: 300, delay: 0, scale: 1 },
    { x: 300, y: 260, delay: 1.6, scale: 0.8 },
    { x: 1020, y: 180, delay: 3.4, scale: 0.9 }
  ]
    .map((item) => `
      <g transform="translate(${item.x} ${item.y}) scale(${item.scale})">
        <g class="bird" style="animation-delay:${item.delay}s">
          <path class="bird-wing" d="M -12 0 q 6 -7 12 0 q 6 -7 12 0"/>
        </g>
      </g>
    `)
    .join("");

  return `<g class="wildlife">${butterflies}${dragonflies}${birds}</g>`;
}

function getCrossbowDamage() {
  const tier = getWeaponTier();
  return tier.baseDamage + (state.crossbow.level - 1) * tier.damagePerLevel;
}

function getWeaponTier() {
  return WEAPON_TIERS[state.crossbow.tier] || WEAPON_TIERS[0];
}

function getNextWeaponTier() {
  return WEAPON_TIERS[state.crossbow.tier + 1] || null;
}

function getCrossbowCooldownMs() {
  const tier = getWeaponTier();
  return Math.max(tier.minCooldownMs, tier.baseCooldownMs - (state.crossbow.level - 1) * tier.cooldownStepMs);
}

function getCrossbowUpgradeCost() {
  return (WEAPON_UPGRADE_BASE_COST + state.crossbow.level * WEAPON_UPGRADE_LEVEL_COST) * 2 ** state.crossbow.tier;
}

function isCrossbowMaxed() {
  return state.crossbow.level >= CROSSBOW_MAX_LEVEL;
}

function evolveCrossbow() {
  const next = getNextWeaponTier();
  if (state.gameOver || !next) return false;

  const cost = getWeaponTier().evolveCost;
  if (state.coins < cost) return false;

  state.coins -= cost;
  state.crossbow.tier += 1;
  state.crossbow.level = 1;
  refreshCombatHud();
  return true;
}

function normalizeAimAngle(angle) {
  let normalized = angle;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function findCrossbowTarget() {
  let closest = null;
  let closestDistance = CROSSBOW_RANGE;

  for (const enemy of combat.enemies) {
    const dist = Math.hypot(enemy.x - CROSSBOW_POSITION.x, enemy.y - CROSSBOW_POSITION.y);
    if (dist <= closestDistance) {
      closest = enemy;
      closestDistance = dist;
    }
  }

  return closest;
}

function getEnemyVelocity(enemy) {
  const lane = SPAWN_LANES[enemy.laneIndex];
  const waypoint = lane[enemy.waypointIndex];
  if (!waypoint) return null;

  const blockedByWall =
    isWallStanding() &&
    enemy.y <= WALL_POSITION.y + 12 &&
    Math.hypot(WALL_POSITION.x - enemy.x, WALL_POSITION.y - enemy.y) <= WALL_BLOCK_RANGE;
  if (blockedByWall) return null;

  const dx = waypoint.x - enemy.x;
  const dy = waypoint.y - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;

  return { x: (dx / dist) * enemy.speed, y: (dy / dist) * enemy.speed };
}

function getCrossbowAimPoint(target) {
  const velocity = getEnemyVelocity(target);
  if (!velocity) return { x: target.x, y: target.y };

  const projectileSpeed = getWeaponTier().projectileSpeed;
  let lead = Math.hypot(target.x - CROSSBOW_POSITION.x, target.y - CROSSBOW_POSITION.y) / projectileSpeed;
  for (let pass = 0; pass < 3; pass += 1) {
    const x = target.x + velocity.x * lead;
    const y = target.y + velocity.y * lead;
    lead = Math.hypot(x - CROSSBOW_POSITION.x, y - CROSSBOW_POSITION.y) / projectileSpeed;
  }

  const aimLead = lead * CROSSBOW_LEAD_FACTOR;
  return { x: target.x + velocity.x * aimLead, y: target.y + velocity.y * aimLead };
}

function getCrossbowDesiredAimAngle() {
  const target = findCrossbowTarget();
  if (!target) return CROSSBOW_IDLE_AIM;

  const aim = getCrossbowAimPoint(target);
  const dx = aim.x - CROSSBOW_POSITION.x;
  const dy = aim.y - CROSSBOW_POSITION.y;
  return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
}

function createBolt(targetX, targetY) {
  const angle = Math.atan2(targetY - CROSSBOW_POSITION.y, targetX - CROSSBOW_POSITION.x);
  const launchDist = 26;
  const tier = getWeaponTier();

  combat.bolts.push({
    id: combat.nextBoltId++,
    kind: tier.id,
    x: CROSSBOW_POSITION.x + Math.cos(angle) * launchDist,
    y: CROSSBOW_POSITION.y + Math.sin(angle) * launchDist,
    vx: Math.cos(angle) * tier.projectileSpeed,
    vy: Math.sin(angle) * tier.projectileSpeed,
    damage: getCrossbowDamage(),
    blast: tier.blastRadius
  });
}

function updateCrossbowAim(deltaSeconds) {
  const desired = getCrossbowDesiredAimAngle();
  const current = combat.crossbowAimAngle;
  const diff = normalizeAimAngle(desired - current);
  const step = CROSSBOW_AIM_TURN_SPEED * deltaSeconds;

  if (Math.abs(diff) <= step) {
    combat.crossbowAimAngle = desired;
  } else {
    combat.crossbowAimAngle = current + Math.sign(diff) * step;
  }
}

function updateCrossbow(now) {
  if (combat.phase !== "attack") return;

  const target = findCrossbowTarget();
  if (!target) return;

  const cooldown = getCrossbowCooldownMs();
  if (now - combat.crossbowLastFireAt < cooldown) return;

  combat.crossbowLastFireAt = now;
  const aim = getCrossbowAimPoint(target);
  createBolt(aim.x, aim.y);
}

function spawnBlast(x, y, radius) {
  combat.blasts.push({ x, y, radius, bornAt: performance.now() });
}

function updateBlasts(now) {
  combat.blasts = combat.blasts.filter((blast) => now - blast.bornAt < BLAST_FLASH_MS);
}

function updateBolts(deltaSeconds) {
  const hits = [];

  for (const bolt of combat.bolts) {
    bolt.x += bolt.vx * deltaSeconds;
    bolt.y += bolt.vy * deltaSeconds;

    for (const enemy of combat.enemies) {
      if (Math.hypot(bolt.x - enemy.x, bolt.y - enemy.y) <= 16) {
        if (bolt.blast > 0) {
          spawnBlast(bolt.x, bolt.y, bolt.blast);
          const struck = combat.enemies
            .filter((entry) => Math.hypot(entry.x - bolt.x, entry.y - bolt.y) <= bolt.blast)
            .map((entry) => entry.id);
          for (const enemyId of struck) {
            damageEnemy(enemyId, bolt.damage);
          }
        } else {
          damageEnemy(enemy.id, bolt.damage);
        }
        hits.push(bolt.id);
        break;
      }
    }
  }

  combat.bolts = combat.bolts.filter((bolt) => {
    if (hits.includes(bolt.id)) return false;
    return bolt.x > -80 && bolt.x < 1680 && bolt.y > -80 && bolt.y < 1080;
  });
}

function applyCrossbowAim() {
  const aimNode = document.querySelector(".crossbow-aim");
  if (!aimNode) return;
  aimNode.setAttribute("transform", `rotate(${combat.crossbowAimAngle})`);
}

function upgradeCrossbow() {
  if (state.gameOver || isCrossbowMaxed()) return false;

  const cost = getCrossbowUpgradeCost();
  if (state.coins < cost) return false;

  state.coins -= cost;
  state.crossbow.level += 1;
  refreshCombatHud();
  return true;
}

function resetCombatState() {
  combat.enemies = [];
  combat.bolts = [];
  combat.loot = [];
  combat.units = [];
  combat.blasts = [];
  combat.phase = "peace";
  combat.waveNumber = 1;
  combat.phaseEndsAt = 0;
  combat.lastSpawnAt = 0;
  combat.eliteWaveCounts = {};
  combat.mintAccumMs = 0;
  combat.nextEnemyId = 1;
  combat.nextBoltId = 1;
  combat.nextLootId = 1;
  combat.nextUnitId = 1;
  combat.crossbowLastFireAt = 0;
  combat.crossbowAimAngle = CROSSBOW_IDLE_AIM;
  combat.lastFrameTime = 0;
}

function getLateGameSteps(waveNumber = combat.waveNumber) {
  return Math.max(0, waveNumber - LATE_GAME_WAVE);
}

function getEarlyGameEase(waveNumber = combat.waveNumber) {
  if (waveNumber < 1 || waveNumber > EARLY_GAME_EASE_MAX_WAVE) return 0;
  return (EARLY_GAME_EASE_MAX_WAVE - waveNumber) / (EARLY_GAME_EASE_MAX_WAVE - 1);
}

function getEarlyGameEnemyScale(waveNumber = combat.waveNumber) {
  const ease = getEarlyGameEase(waveNumber);
  return {
    health: 1 - ease * 0.22,
    damage: 1 - ease * 0.15,
    speed: 1 - ease * 0.1
  };
}

function getWavePeaceMs(waveNumber = combat.waveNumber) {
  const steps = getLateGameSteps(waveNumber);
  const ease = getEarlyGameEase(waveNumber);
  if (steps <= 0) {
    return WAVE_PEACE_MS + Math.round(ease * 3500);
  }
  return Math.max(2200, WAVE_PEACE_MS - steps * 140);
}

function getWaveAttackMs(waveNumber = combat.waveNumber) {
  const steps = getLateGameSteps(waveNumber);
  const ease = getEarlyGameEase(waveNumber);
  if (isBossWave(waveNumber)) {
    return BOSS_WAVE_ATTACK_MS + steps * 2500 - Math.round(ease * 15000);
  }
  if (steps <= 0) {
    return WAVE_ATTACK_MS - Math.round(ease * 14000);
  }
  return WAVE_ATTACK_MS + Math.min(steps * 650, 90000);
}

function getSpawnBurstCount(waveNumber = combat.waveNumber) {
  const steps = getLateGameSteps(waveNumber);
  if (steps <= 0) return 1;
  return 1 + Math.min(5, Math.floor(steps / 2));
}

function getWaveEnemyScale(waveNumber = combat.waveNumber) {
  const steps = getLateGameSteps(waveNumber);
  if (steps <= 0) {
    return { health: 1, damage: 1, speed: 1 };
  }
  return {
    health: 1 + steps * 0.12,
    damage: 1 + steps * 0.06,
    speed: 1 + Math.min(0.5, steps * 0.022)
  };
}

function startWaveCycle(now) {
  combat.phase = "peace";
  combat.phaseEndsAt = now + getWavePeaceMs();
  combat.lastSpawnAt = 0;
  combat.eliteWaveCounts = {};
}

function getSpawnIntervalMs() {
  let interval;
  if (combat.waveNumber === 1) interval = 7500;
  else if (combat.waveNumber === 2) interval = 5600;
  else {
    const steps = getLateGameSteps();
    interval = steps <= 0 ? SPAWN_INTERVAL_MS : Math.max(900, SPAWN_INTERVAL_MS - steps * 110);
  }

  const ease = getEarlyGameEase();
  if (ease > 0) {
    interval = Math.round(interval * (1 + ease * 0.38));
  }
  return interval;
}

function isBossWave(waveNumber = combat.waveNumber) {
  return waveNumber > 0 && waveNumber % BOSS_WAVE_INTERVAL === 0;
}

function getBossTier(waveNumber = combat.waveNumber) {
  return Math.max(1, Math.floor(waveNumber / BOSS_WAVE_INTERVAL));
}

function getBossType(waveNumber = combat.waveNumber) {
  return BOSS_ORDER[(getBossTier(waveNumber) - 1) % BOSS_ORDER.length];
}

function spawnBoss() {
  const type = getBossType();
  const def = ENEMY_DEF[type];
  const tier = getBossTier();
  const laneIndex = Math.floor(Math.random() * SPAWN_LANES.length);
  const lane = SPAWN_LANES[laneIndex];
  const start = lane[0];
  const lateScale = getWaveEnemyScale();
  const earlyScale = getEarlyGameEnemyScale();
  const health = Math.round(def.health * (1 + (tier - 1) * 0.85) * lateScale.health * earlyScale.health);

  combat.enemies.push({
    id: combat.nextEnemyId++,
    type,
    laneIndex,
    waypointIndex: 1,
    health,
    maxHealth: health,
    damage: Math.max(1, Math.round(def.damage * lateScale.damage * earlyScale.damage)),
    speed: def.speed * (1 + (tier - 1) * 0.05) * lateScale.speed * earlyScale.speed,
    facing: lane[1].x >= start.x ? 1 : -1,
    lastAttackAt: 0,
    isBoss: true,
    coinReward: Math.round(def.coins * (1 + (tier - 1) * 0.6)),
    gemReward: Math.round(def.gems * (1 + (tier - 1) * 0.6)),
    x: start.x,
    y: start.y
  });
}

function beginAttackPhase(now) {
  const bossWave = isBossWave();
  combat.phase = "attack";
  combat.phaseEndsAt = now + getWaveAttackMs();

  if (bossWave) {
    combat.lastSpawnAt = now;
    spawnBoss();
    return;
  }

  combat.lastSpawnAt = now - (getSpawnIntervalMs() - FIRST_SPAWN_DELAY_MS);
}

function endAttackPhase(now) {
  combat.enemies = [];
  combat.bolts = [];
  combat.waveNumber += 1;
  startWaveCycle(now);
}

function updateWaveTiming(now) {
  if (combat.phase === "peace" && now >= combat.phaseEndsAt) {
    beginAttackPhase(now);
    return;
  }

  if (combat.phase === "attack") {
    if (isBossWave()) {
      const spawnInterval = getSpawnIntervalMs();
      if (getLateGameSteps() > 0 && now - combat.lastSpawnAt >= spawnInterval) {
        const burst = getSpawnBurstCount();
        for (let i = 0; i < burst; i += 1) {
          spawnEnemy();
        }
        combat.lastSpawnAt = now;
      }

      if (combat.enemies.length === 0 || now >= combat.phaseEndsAt) {
        endAttackPhase(now);
      }
      return;
    }

    if (now >= combat.phaseEndsAt) {
      endAttackPhase(now);
      return;
    }

    const spawnInterval = getSpawnIntervalMs();
    if (now - combat.lastSpawnAt >= spawnInterval) {
      const burst = getSpawnBurstCount();
      for (let i = 0; i < burst; i += 1) {
        spawnEnemy();
      }
      combat.lastSpawnAt = now;
    }
  }
}

function getEnemyWeight(def, waveNumber) {
  if (def.retireWave && waveNumber > def.retireWave) return def.weight * 0.3;
  return def.weight;
}

function countEnemiesOfType(type) {
  return combat.enemies.reduce((count, enemy) => (enemy.type === type ? count + 1 : count), 0);
}

function isEliteAvailable(type, def, waveNumber) {
  if (waveNumber < def.debutWave) return false;
  if ((combat.eliteWaveCounts[type] || 0) >= def.maxPerWave) return false;
  return countEnemiesOfType(type) < def.maxPerWave;
}

function pickEnemyType(waveNumber) {
  if (waveNumber === 1) return "goblin";

  const ease = getEarlyGameEase(waveNumber);
  const rosterWave =
    waveNumber + ENEMY_ROSTER_WAVE_BONUS + Math.floor(getLateGameSteps(waveNumber) / 2) - Math.round(ease * 1.5);
  const available = Object.entries(ENEMY_DEF)
    .filter(([type, def]) => (def.isElite ? isEliteAvailable(type, def, waveNumber) : rosterWave >= def.minWave))
    .map(([type, def]) => [type, getEnemyWeight(def, rosterWave)]);

  const totalWeight = available.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * totalWeight;

  for (const [type, weight] of available) {
    roll -= weight;
    if (roll <= 0) return type;
  }

  return available[0][0];
}

function spawnEnemy() {
  const laneIndex = Math.floor(Math.random() * SPAWN_LANES.length);
  const lane = SPAWN_LANES[laneIndex];
  const start = lane[0];
  const type = pickEnemyType(combat.waveNumber);
  const def = ENEMY_DEF[type];
  const scale = getWaveEnemyScale();
  const early = getEarlyGameEnemyScale();

  const health = Math.max(1, Math.round(def.health * scale.health * early.health));

  if (def.isElite) {
    combat.eliteWaveCounts[type] = (combat.eliteWaveCounts[type] || 0) + 1;
  }

  combat.enemies.push({
    id: combat.nextEnemyId++,
    type,
    laneIndex,
    waypointIndex: 1,
    health,
    maxHealth: health,
    damage: Math.max(1, Math.round(def.damage * scale.damage * early.damage)),
    speed: def.speed * scale.speed * early.speed,
    facing: lane[1].x >= start.x ? 1 : -1,
    lastAttackAt: 0,
    isElite: Boolean(def.isElite),
    coinReward: def.coins,
    gemReward: def.gems,
    x: start.x,
    y: start.y
  });
}

function removeEnemy(enemyId) {
  combat.enemies = combat.enemies.filter((enemy) => enemy.id !== enemyId);
}

function spawnLoot(enemy, kind, amount, offsetY, now) {
  const def = ENEMY_DEF[enemy.type];

  combat.loot.push({
    id: combat.nextLootId++,
    kind,
    amount,
    x: enemy.x,
    y: enemy.y - def.height * 0.55 + offsetY,
    bornAt: now
  });
}

function dropLoot(enemy) {
  const now = performance.now();

  if (enemy.coinReward > 0) {
    state.coins += enemy.coinReward;
    spawnLoot(enemy, "coin", enemy.coinReward, 0, now);
  }

  if (enemy.gemReward > 0) {
    state.gems += enemy.gemReward;
    spawnLoot(enemy, "gem", enemy.gemReward, -34, now);
  }

  refreshCombatHud();
}

function updateLoot(now) {
  combat.loot = combat.loot.filter((loot) => now - loot.bornAt < LOOT_FLOAT_MS);
}

function damageEnemy(enemyId, amount) {
  const enemy = combat.enemies.find((entry) => entry.id === enemyId);
  if (!enemy) return;

  enemy.health -= amount;
  if (enemy.health <= 0) {
    dropLoot(enemy);
    removeEnemy(enemyId);
  }
  syncCombatLayer();
}

function getUnitLaneIndex(unit) {
  if (Number.isInteger(unit.laneIndex) && unit.laneIndex >= 0 && unit.laneIndex < SPAWN_LANES.length) {
    return unit.laneIndex;
  }
  return unit.id % SPAWN_LANES.length;
}

function getUnitGuardWaypointIndex(laneIndex) {
  const lane = SPAWN_LANES[laneIndex];
  return Math.max(0, lane.length - UNIT_GUARD_WAYPOINT_FROM_END);
}

function isWithinCrossbowRange(x, y) {
  return Math.hypot(x - CROSSBOW_POSITION.x, y - CROSSBOW_POSITION.y) <= CROSSBOW_RANGE;
}

function getUnitForwardLimitIndex(laneIndex) {
  const lane = SPAWN_LANES[laneIndex];
  const homeIndex = getUnitGuardWaypointIndex(laneIndex);
  let forwardLimit = homeIndex;

  for (let i = 0; i < lane.length; i++) {
    const point = lane[i];
    if (isWithinCrossbowRange(point.x, point.y)) {
      forwardLimit = Math.min(forwardLimit, i);
    }
  }

  return forwardLimit;
}

function clampUnitGoalWaypointIndex(laneIndex, goalIndex) {
  return Math.max(goalIndex, getUnitForwardLimitIndex(laneIndex));
}

function clampUnitWithinCrossbowRange(unit) {
  const lane = SPAWN_LANES[unit.laneIndex];
  const forwardLimit = getUnitForwardLimitIndex(unit.laneIndex);

  if (unit.waypointIndex < forwardLimit) {
    unit.waypointIndex = forwardLimit;
    unit.x = lane[forwardLimit].x;
    unit.y = lane[forwardLimit].y;
    return;
  }

  if (!isWithinCrossbowRange(unit.x, unit.y)) {
    for (let i = unit.waypointIndex + 1; i < lane.length; i++) {
      const point = lane[i];
      if (isWithinCrossbowRange(point.x, point.y)) {
        unit.waypointIndex = i;
        unit.x = point.x;
        unit.y = point.y;
        return;
      }
    }
    unit.waypointIndex = forwardLimit;
    unit.x = lane[forwardLimit].x;
    unit.y = lane[forwardLimit].y;
  }
}

function getUnitIdlePatrolGoalIndex(unit) {
  const homeIndex = getUnitGuardWaypointIndex(unit.laneIndex);
  const roadEndIndex = getUnitForwardLimitIndex(unit.laneIndex);

  if (unit.patrolHomeward) {
    if (unit.waypointIndex >= homeIndex) {
      unit.patrolHomeward = false;
      return roadEndIndex;
    }
    return homeIndex;
  }

  if (unit.waypointIndex <= roadEndIndex) {
    unit.patrolHomeward = true;
    return homeIndex;
  }

  return roadEndIndex;
}

function ensureUnitOnLane(unit) {
  const laneIndex = getUnitLaneIndex(unit);
  const lane = SPAWN_LANES[laneIndex];
  unit.laneIndex = laneIndex;

  if (!Number.isInteger(unit.waypointIndex) || unit.waypointIndex < 0 || unit.waypointIndex >= lane.length) {
    unit.waypointIndex = getUnitGuardWaypointIndex(laneIndex);
    const point = lane[unit.waypointIndex];
    unit.x = point.x;
    unit.y = point.y;
  }
}

function findNearestEnemyOnLane(unit) {
  let closest = null;
  let closestDist = Infinity;

  for (const enemy of combat.enemies) {
    if (enemy.laneIndex !== unit.laneIndex) continue;
    const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
    if (dist < closestDist) {
      closest = { enemy, dist };
      closestDist = dist;
    }
  }

  return closest;
}

function moveUnitOnLaneTowardIndex(unit, deltaSeconds, targetIndex, options = {}) {
  const def = UNIT_DEF[unit.type];
  const moveSpeed = options.patrol && def.speed <= 0 ? 1 : def.speed;
  const speed = moveSpeed * UNIT_SPEED_SCALE;
  if (speed <= 0) return;

  const lane = SPAWN_LANES[unit.laneIndex];
  const goal = Math.max(0, Math.min(lane.length - 1, clampUnitGoalWaypointIndex(unit.laneIndex, targetIndex)));

  if (unit.waypointIndex === goal) {
    const hold = lane[goal];
    const dx = hold.x - unit.x;
    const dy = hold.y - unit.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const step = Math.min(speed * deltaSeconds, dist);
      if (dx > 0.6) unit.facing = 1;
      else if (dx < -0.6) unit.facing = -1;
      unit.x += (dx / dist) * step;
      unit.y += (dy / dist) * step;
      clampUnitWithinCrossbowRange(unit);
    }
    return;
  }

  const nextIndex = unit.waypointIndex > goal ? unit.waypointIndex - 1 : unit.waypointIndex + 1;
  const target = lane[nextIndex];
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.hypot(dx, dy) || 1;
  const moveStep = speed * deltaSeconds;

  if (dist <= moveStep + 4) {
    unit.x = target.x;
    unit.y = target.y;
    unit.waypointIndex = nextIndex;
    clampUnitWithinCrossbowRange(unit);
    return;
  }

  if (dx > 0.6) unit.facing = 1;
  else if (dx < -0.6) unit.facing = -1;
  unit.x += (dx / dist) * moveStep;
  unit.y += (dy / dist) * moveStep;
  clampUnitWithinCrossbowRange(unit);
}

function moveUnitTowardPoint(unit, deltaSeconds, target) {
  const def = UNIT_DEF[unit.type];
  const speed = Math.max(def.speed, 1) * UNIT_SPEED_SCALE;
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.5) return;

  const step = Math.min(speed * deltaSeconds, dist);
  if (dx > 0.6) unit.facing = 1;
  else if (dx < -0.6) unit.facing = -1;
  unit.x += (dx / dist) * step;
  unit.y += (dy / dist) * step;
}

function isUnitHealing(unit) {
  return Boolean(unit.healing) && state.healingFire;
}

function sendUnitToHealingFire(unitId) {
  if (state.gameOver || !state.healingFire) return false;

  const unit = combat.units.find((entry) => entry.id === unitId);
  if (!unit) return false;

  unit.healing = !unit.healing;
  syncCampPanels();
  return true;
}

function updateHealingUnit(unit, deltaSeconds) {
  const dist = Math.hypot(HEALING_FIRE_POSITION.x - unit.x, HEALING_FIRE_POSITION.y - unit.y);

  if (dist > HEALING_FIRE_RANGE) {
    moveUnitTowardPoint(unit, deltaSeconds, HEALING_FIRE_POSITION);
    return;
  }

  unit.health = Math.min(unit.maxHealth, unit.health + HEALING_FIRE_HEAL_PER_SECOND * deltaSeconds);
  if (unit.health >= unit.maxHealth) {
    unit.health = unit.maxHealth;
    unit.healing = false;
  }
}

function trainUnit(slotIndex, unitType) {
  if (state.gameOver) return false;

  const def = UNIT_DEF[unitType];
  const building = getSlotBuilding(slotIndex);
  if (!def || !building || building.id !== def.building || building.level < def.unlockLevel) return false;
  if (!canTrainUnitType(unitType)) return false;
  if (state.coins < def.cost) return false;

  state.coins -= def.cost;
  const laneIndex = (combat.nextUnitId - 1) % SPAWN_LANES.length;
  const lane = SPAWN_LANES[laneIndex];
  const waypointIndex = getUnitGuardWaypointIndex(laneIndex);
  const spawn = lane[waypointIndex];

  const unit = {
    id: combat.nextUnitId++,
    type: unitType,
    health: def.health,
    maxHealth: def.health,
    facing: 1,
    lastAttackAt: 0,
    laneIndex,
    waypointIndex,
    patrolHomeward: false,
    x: spawn.x,
    y: spawn.y
  };
  combat.units.push(unit);
  refreshCombatHud();
  syncCombatLayer();
  return true;
}

function removeUnit(unitId) {
  combat.units = combat.units.filter((unit) => unit.id !== unitId);
}

function damageUnit(unitId, rawDamage) {
  const unit = combat.units.find((entry) => entry.id === unitId);
  if (!unit) return;

  const def = UNIT_DEF[unit.type];
  const damage = Math.max(MIN_STRUCTURE_DAMAGE, rawDamage - def.defense);
  unit.health -= damage;
  if (unit.health <= 0) {
    removeUnit(unitId);
    refreshCombatHud();
  }
}

function findNearestEnemy(x, y) {
  let closest = null;
  let closestDist = Infinity;
  for (const enemy of combat.enemies) {
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist < closestDist) {
      closest = enemy;
      closestDist = dist;
    }
  }
  return closest ? { enemy: closest, dist: closestDist } : null;
}

function findNearestUnit(x, y, maxDist) {
  let closest = null;
  let closestDist = maxDist;
  for (const unit of combat.units) {
    const dist = Math.hypot(unit.x - x, unit.y - y);
    if (dist <= closestDist) {
      closest = unit;
      closestDist = dist;
    }
  }
  return closest;
}

function createUnitShot(unit, target) {
  const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
  const def = UNIT_DEF[unit.type];

  combat.bolts.push({
    id: combat.nextBoltId++,
    x: unit.x + Math.cos(angle) * 14,
    y: unit.y - 12 + Math.sin(angle) * 14,
    vx: Math.cos(angle) * UNIT_PROJECTILE_SPEED,
    vy: Math.sin(angle) * UNIT_PROJECTILE_SPEED,
    damage: def.damage
  });
}

function updateUnits(deltaSeconds, now) {
  const rebellious = unitsAreRebellious();

  for (const unit of combat.units) {
    const def = UNIT_DEF[unit.type];
    unit.rebel = rebellious;
    ensureUnitOnLane(unit);

    const lane = SPAWN_LANES[unit.laneIndex];
    const tentWaypointIndex = lane.length - 1;
    const attackRange = def.range || UNIT_MELEE_RANGE;

    if (unit.patrolHomeward === undefined) {
      unit.patrolHomeward = false;
    }

    if (rebellious) {
      if (unit.waypointIndex < tentWaypointIndex || Math.hypot(TENT_TARGET.x - unit.x, TENT_TARGET.y - unit.y) > TENT_ATTACK_RANGE) {
        moveUnitOnLaneTowardIndex(unit, deltaSeconds, tentWaypointIndex);
      } else if (now - unit.lastAttackAt >= UNIT_ATTACK_COOLDOWN_MS) {
        unit.lastAttackAt = now;
        damageTent(def.damage);
      }
      continue;
    }

    if (unit.healing) {
      if (isUnitHealing(unit)) {
        updateHealingUnit(unit, deltaSeconds);
        continue;
      }
      unit.healing = false;
    }

    const laneThreat = findNearestEnemyOnLane(unit);
    const rangedTarget = def.range ? findNearestEnemy(unit.x, unit.y) : laneThreat;

    if (def.range) {
      const shooting = rangedTarget && rangedTarget.dist <= attackRange;
      if (shooting) {
        if (rangedTarget.enemy.x > unit.x + 0.6) unit.facing = 1;
        else if (rangedTarget.enemy.x < unit.x - 0.6) unit.facing = -1;

        if (now - unit.lastAttackAt >= UNIT_ATTACK_COOLDOWN_MS) {
          unit.lastAttackAt = now;
          createUnitShot(unit, rangedTarget.enemy);
        }
      }

      if (!shooting || def.speed > 0) {
        const patrolGoal = laneThreat
          ? laneThreat.enemy.waypointIndex
          : getUnitIdlePatrolGoalIndex(unit);
        moveUnitOnLaneTowardIndex(unit, deltaSeconds, patrolGoal, { patrol: !laneThreat });
      }
      continue;
    }

    if (!laneThreat) {
      moveUnitOnLaneTowardIndex(unit, deltaSeconds, getUnitIdlePatrolGoalIndex(unit), { patrol: true });
      continue;
    }

    if (laneThreat.dist <= attackRange) {
      if (laneThreat.enemy.x > unit.x + 0.6) unit.facing = 1;
      else if (laneThreat.enemy.x < unit.x - 0.6) unit.facing = -1;

      if (now - unit.lastAttackAt >= UNIT_ATTACK_COOLDOWN_MS) {
        unit.lastAttackAt = now;
        damageEnemy(laneThreat.enemy.id, def.damage);
      }
      continue;
    }

    const chaseIndex = clampUnitGoalWaypointIndex(unit.laneIndex, laneThreat.enemy.waypointIndex);
    moveUnitOnLaneTowardIndex(unit, deltaSeconds, chaseIndex, { patrol: false });
    clampUnitWithinCrossbowRange(unit);
  }
}

function getMintPayout(mintLevels) {
  const base = mintLevels * MINT_PAYOUT_PER_LEVEL;
  return state.mine ? Math.round(base * MINE_MINT_MULTIPLIER) : base;
}

function updateMint(deltaSeconds) {
  const mintLevels = getBuildingLevels("mint");
  if (mintLevels <= 0) {
    combat.mintAccumMs = 0;
    return;
  }

  combat.mintAccumMs += deltaSeconds * 1000;
  while (combat.mintAccumMs >= MINT_PAYOUT_MS) {
    combat.mintAccumMs -= MINT_PAYOUT_MS;
    state.coins += getMintPayout(mintLevels);
    refreshCombatHud();
  }
}

function isWallStanding() {
  return Boolean(state.wall && state.wall.health > 0);
}

function getWallLevel() {
  return state.wall ? state.wall.level : 1;
}

function getWallDef() {
  return WALL_LEVELS[Math.min(getWallLevel(), WALL_MAX_LEVEL) - 1];
}

function getWallMaxHp() {
  return getWallDef().maxHealth;
}

function getWallDefense() {
  return getWallDef().defense;
}

function getWallRetaliation() {
  return getWallDef().retaliation;
}

function isWallMaxed() {
  return getWallLevel() >= WALL_MAX_LEVEL;
}

function getWallUpgradeCost() {
  return getWallDef().upgradeCost;
}

function getNextWallDef() {
  return isWallMaxed() ? null : WALL_LEVELS[getWallLevel()];
}

function isWallUnlocked() {
  return state.tentLevel >= WALL_TENT_REQUIREMENT;
}

function getWallRequirementLabel() {
  return TENT_LEVELS[WALL_TENT_REQUIREMENT - 1].label;
}

function buildWall() {
  if (state.gameOver || isWallStanding() || !isWallUnlocked()) return false;
  if (state.coins < WALL_COST) return false;

  state.coins -= WALL_COST;
  state.wall = { level: 1, health: WALL_LEVELS[0].maxHealth };
  refreshCombatHud();
  return true;
}

function upgradeWall() {
  if (state.gameOver || !isWallStanding() || isWallMaxed()) return false;

  const cost = getWallUpgradeCost();
  if (state.coins < cost) return false;

  state.coins -= cost;
  state.wall.level += 1;
  state.wall.health = getWallMaxHp();
  refreshCombatHud();
  return true;
}

function damageWall(rawDamage) {
  if (!isWallStanding()) return;

  const damage = Math.max(MIN_STRUCTURE_DAMAGE, rawDamage - getWallDefense());
  state.wall.health = Math.max(0, state.wall.health - damage);

  if (state.wall.health <= 0) {
    state.wall = null;
    if (state.wallPanelOpen) syncCampPanels();
  }
}

function tryAttackWall(enemy, now) {
  if (!isWallStanding()) return false;
  if (enemy.y > WALL_POSITION.y + 12) return false;

  const dist = Math.hypot(WALL_POSITION.x - enemy.x, WALL_POSITION.y - enemy.y);
  if (dist > WALL_BLOCK_RANGE) return false;

  const lastAttackAt = enemy.lastAttackAt || 0;
  if (now - lastAttackAt >= ENEMY_ATTACK_COOLDOWN_MS) {
    enemy.lastAttackAt = now;
    const retaliation = getWallRetaliation();
    damageWall(enemy.damage);
    if (retaliation > 0) damageEnemy(enemy.id, retaliation);
  }

  return true;
}

function tryAttackTent(enemy, now) {
  const tentDist = Math.hypot(TENT_TARGET.x - enemy.x, TENT_TARGET.y - enemy.y);
  if (tentDist > TENT_ATTACK_RANGE) return;

  const lastAttackAt = enemy.lastAttackAt || 0;
  if (now - lastAttackAt < ENEMY_ATTACK_COOLDOWN_MS) return;

  enemy.lastAttackAt = now;
  damageTent(enemy.damage);

  const retaliation = getTentRetaliation();
  if (retaliation > 0) damageEnemy(enemy.id, retaliation);
}

function findBlockingUnitOnLane(enemy) {
  let closest = null;
  let closestDist = ENEMY_ENGAGE_UNIT_RANGE;

  for (const unit of combat.units) {
    if (unit.rebel) continue;
    if (unit.laneIndex !== enemy.laneIndex) continue;
    if (unit.waypointIndex < enemy.waypointIndex) continue;

    const dist = Math.hypot(unit.x - enemy.x, unit.y - enemy.y);
    if (dist <= closestDist) {
      closest = unit;
      closestDist = dist;
    }
  }

  return closest;
}

function tryAttackUnit(enemy, now) {
  if (unitsAreRebellious()) return false;

  const unit = findBlockingUnitOnLane(enemy) || findNearestUnit(enemy.x, enemy.y, ENEMY_ENGAGE_UNIT_RANGE);
  if (!unit) return false;

  if (enemy.x > unit.x + 0.6) enemy.facing = -1;
  else if (enemy.x < unit.x - 0.6) enemy.facing = 1;

  const lastAttackAt = enemy.lastAttackAt || 0;
  if (now - lastAttackAt >= ENEMY_ATTACK_COOLDOWN_MS) {
    enemy.lastAttackAt = now;
    damageUnit(unit.id, enemy.damage);
  }

  return true;
}

function updateEnemies(deltaSeconds, now) {
  for (const enemy of combat.enemies) {
    if (tryAttackUnit(enemy, now)) continue;
    if (tryAttackWall(enemy, now)) continue;

    const lane = SPAWN_LANES[enemy.laneIndex];
    const targetIndex = enemy.waypointIndex;

    if (targetIndex >= lane.length) {
      tryAttackTent(enemy, now);
      continue;
    }

    const target = lane[targetIndex];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = enemy.speed * deltaSeconds;

    if (dist <= step + 4) {
      enemy.x = target.x;
      enemy.y = target.y;
      enemy.waypointIndex += 1;

      if (enemy.waypointIndex >= lane.length) {
        tryAttackTent(enemy, now);
      }
      continue;
    }

    if (dx > 0.6) enemy.facing = 1;
    else if (dx < -0.6) enemy.facing = -1;

    enemy.x += (dx / dist) * step;
    enemy.y += (dy / dist) * step;
  }
}

function getTentDef() {
  return TENT_LEVELS[Math.min(state.tentLevel, TENT_MAX_LEVEL) - 1];
}

function getTentMaxHp() {
  return getTentDef().maxHealth;
}

function getTentDefense() {
  return getTentDef().defense;
}

function getFarmPopulation(farmLevels) {
  const perLevel = FARM_POP_PER_LEVEL + (state.windmill ? WINDMILL_FARM_POP_BONUS : 0);
  return farmLevels * perLevel;
}

function getTentPopulation() {
  return getTentDef().population + getFarmPopulation(getBuildingLevels("farm"));
}

function getUnitPopulationCap(unitType) {
  const def = UNIT_DEF[unitType];
  const extra = state.paddock && def && def.building === "stable" ? PADDOCK_EXTRA_STABLE_POP : 0;
  return getTentPopulation() + extra;
}

function canTrainUnitType(unitType) {
  return getUnitCount() < getUnitPopulationCap(unitType);
}

function getTentRetaliation() {
  return getTentDef().retaliation;
}

function isBuildSlotOpen(slotIndex) {
  const slot = BUILD_SLOTS[slotIndex];
  return Boolean(slot) && state.tentLevel >= slot.tentLevel;
}

function getSlotBuilding(slotIndex) {
  return state.buildings[slotIndex] || null;
}

function getSlotBuildingId(slotIndex) {
  return state.buildings[slotIndex]?.id || null;
}

function getBuildingDef(buildingId) {
  return BUILDINGS.find((entry) => entry.id === buildingId) || null;
}

function getBuildingLevels(buildingId) {
  return state.buildings.reduce(
    (sum, entry) => (entry && entry.id === buildingId ? sum + entry.level : sum),
    0
  );
}

function getBuildingConfig(buildingId) {
  return BUILDING_CONFIG[buildingId];
}

function getBuildingMaxLevel(buildingId) {
  return getBuildingConfig(buildingId)?.maxLevel ?? 1;
}

function getBuildingUpgradeCost(building) {
  const config = getBuildingConfig(building.id);
  return config.upgradeBase + config.upgradeStep * (building.level - 1);
}

function getTheaterEntertainment() {
  return getBuildingLevels("theater");
}

function getGemEntertainment() {
  if (getTheaterEntertainment() > 0) return 0;
  return Math.floor(state.gems / GEMS_PER_ENTERTAINMENT);
}

function getEntertainment() {
  return getTheaterEntertainment() + getGemEntertainment();
}

function getUnitCount() {
  return combat.units.length;
}

function getRequiredEntertainment() {
  return Math.floor(getUnitCount() / ENTERTAINMENT_TROOPS_PER_LEVEL);
}

function unitsAreRebellious() {
  return getUnitCount() > 0 && getEntertainment() < getRequiredEntertainment();
}

function buildStructure(slotIndex, buildingId) {
  if (state.gameOver || !isBuildSlotOpen(slotIndex)) return false;
  if (getSlotBuildingId(slotIndex)) return false;

  const def = getBuildingDef(buildingId);
  if (!def || state.coins < def.cost) return false;

  state.coins -= def.cost;
  state.buildings[slotIndex] = { id: buildingId, level: 1 };
  refreshCombatHud();
  return true;
}

function upgradeBuilding(slotIndex) {
  const building = getSlotBuilding(slotIndex);
  if (state.gameOver || !building || building.level >= getBuildingMaxLevel(building.id)) return false;

  const cost = getBuildingUpgradeCost(building);
  if (state.coins < cost) return false;

  state.coins -= cost;
  building.level += 1;
  refreshCombatHud();
  return true;
}

function demolishBuilding(slotIndex) {
  const building = getSlotBuilding(slotIndex);
  if (state.gameOver || !building || building.level < getBuildingMaxLevel(building.id)) return false;

  state.buildings[slotIndex] = null;
  state.coins += BUILDING_DEMOLISH_REFUND;
  refreshCombatHud();
  return true;
}

function isTentMaxed() {
  return state.tentLevel >= TENT_MAX_LEVEL;
}

function getTentUpgradeCost() {
  return getTentDef().upgradeCost;
}

function getNextTentDef() {
  return isTentMaxed() ? null : TENT_LEVELS[state.tentLevel];
}

function formatHp(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function upgradeTent() {
  if (state.gameOver || isTentMaxed()) return false;

  const cost = getTentUpgradeCost();
  if (state.coins < cost) return false;

  state.coins -= cost;
  state.tentLevel += 1;
  state.tentHealth = getTentMaxHp();
  refreshCombatHud();
  return true;
}

function damageTent(rawDamage) {
  if (state.gameOver || state.tentHealth <= 0) return;

  const damage = Math.max(MIN_STRUCTURE_DAMAGE, rawDamage - getTentDefense());
  state.tentHealth = Math.max(0, state.tentHealth - damage);
  refreshCombatHud();

  if (state.tentHealth <= 0) {
    handleGameOver();
  }
}

function handleGameOver() {
  if (state.gameOver) return;

  state.gameOver = true;
  state.paused = false;
  combat.pauseStartedAt = 0;
  state.coins = STARTING_COINS;
  state.gems = 0;
  state.tentLevel = 1;
  state.tentHealth = getTentMaxHp();
  state.tentUpgradeOpen = false;
  state.crossbowPanelOpen = false;
  state.wallPanelOpen = false;
  state.healingFirePanelOpen = false;
  state.shopOpen = false;
  shopPausedGame = false;
  state.buildPanelSlot = null;
  state.buildings = [];
  state.crossbow = createDefaultCrossbow();
  state.wall = null;
  state.healingFire = false;
  state.mine = false;
  state.windmill = false;
  state.paddock = false;
  resetCombatState();
  combat.phaseEndsAt = performance.now() + WAVE_PEACE_MS;
  refreshCombatHud();
  render();
}

function dismissGameOver() {
  state.gameOver = false;
  refreshCombatHud();
  render();
}

function shiftCombatTimestamps(delta) {
  if (delta <= 0) return;

  combat.phaseEndsAt += delta;
  combat.lastSpawnAt += delta;
  combat.crossbowLastFireAt += delta;

  for (const enemy of combat.enemies) {
    if (enemy.lastAttackAt) {
      enemy.lastAttackAt += delta;
    }
  }

  for (const unit of combat.units) {
    if (unit.lastAttackAt) {
      unit.lastAttackAt += delta;
    }
  }

  for (const loot of combat.loot) {
    loot.bornAt += delta;
  }
}

function setPaused(paused) {
  if (state.gameOver || state.screen !== "camp" || paused === state.paused) return;

  if (paused) {
    combat.pauseStartedAt = performance.now();
    state.paused = true;
  } else {
    const delta = performance.now() - combat.pauseStartedAt;
    shiftCombatTimestamps(delta);
    combat.pauseStartedAt = 0;
    state.paused = false;
    combat.lastFrameTime = 0;
  }

  refreshCombatHud();
}

function getWaveHudText() {
  const phaseLabel = combat.phase === "attack" ? "Attack" : "Peace";
  const remainingMs = Math.max(0, combat.phaseEndsAt - getCombatClock());
  const remainingSec = Math.ceil(remainingMs / 1000);
  const waveLabel = isBossWave() ? `Boss Wave ${combat.waveNumber}` : `Wave ${combat.waveNumber}`;
  const pauseLabel = state.paused ? " · Paused" : "";
  return `${phaseLabel} · ${waveLabel} · ${remainingSec}s${pauseLabel}`;
}

function refreshCombatHud() {
  const tentHpValue = document.querySelector(".tent-hp-value");
  if (tentHpValue) {
    tentHpValue.textContent = `${formatHp(state.tentHealth)}/${getTentMaxHp()}`;
  }

  const populationValue = document.querySelector(".population-value");
  if (populationValue) {
    populationValue.textContent = `${getUnitCount()}/${getTentPopulation()}`;
    populationValue.classList.toggle("is-rebelling", unitsAreRebellious());
  }

  const waveHudValue = document.querySelector(".wave-hud-value");
  if (waveHudValue) {
    waveHudValue.textContent = getWaveHudText();
  }

  const coinValue = document.querySelector(".camp-currency-value-coin");
  if (coinValue) {
    coinValue.textContent = String(state.coins);
  }

  const gemValue = document.querySelector(".camp-currency-value-gem");
  if (gemValue) {
    gemValue.textContent = String(state.gems);
  }

  const wallPanelTitle = document.querySelector(".wall-panel-title");
  if (wallPanelTitle) {
    wallPanelTitle.textContent = getWallPanelTitle();
  }

  const tentPanelTitle = document.querySelector(".tent-upgrade-title");
  if (tentPanelTitle) {
    tentPanelTitle.textContent = getTentPanelTitle();
  }

  const tentButton = document.querySelector(".tent-upgrade-button");
  if (tentButton) {
    tentButton.classList.toggle("is-broke", !isTentMaxed() && state.coins < getTentUpgradeCost());
  }

  const crossbowButton = document.querySelector(".crossbow-panel [data-action='upgrade-crossbow']");
  if (crossbowButton) {
    crossbowButton.classList.toggle(
      "is-broke",
      !isCrossbowMaxed() && state.coins < getCrossbowUpgradeCost()
    );
  }

  const evolveButton = document.querySelector(".crossbow-panel [data-action='evolve-crossbow']");
  if (evolveButton) {
    evolveButton.classList.toggle("is-broke", state.coins < getWeaponTier().evolveCost);
  }

  const wallButton = document.querySelector(".wall-build-button");
  if (wallButton) {
    const wallStanding = isWallStanding();
    const wallLocked = !wallStanding && !isWallUnlocked();
    const wallCost = wallStanding ? getWallUpgradeCost() : WALL_COST;
    wallButton.classList.toggle(
      "is-broke",
      !wallLocked && !(wallStanding && isWallMaxed()) && state.coins < wallCost
    );
  }

  const shopButton = document.querySelector(".shop-button");
  if (shopButton) {
    shopButton.classList.toggle("is-open", state.shopOpen);
    shopButton.setAttribute("aria-expanded", String(state.shopOpen));
  }

  const pauseButton = document.querySelector(".camp-pause-button");
  if (pauseButton) {
    pauseButton.textContent = state.paused ? "Resume" : "Pause";
    pauseButton.setAttribute("aria-pressed", String(state.paused));
    pauseButton.classList.toggle("is-paused", state.paused);
    pauseButton.disabled = state.gameOver;
  }

  const pauseOverlay = document.querySelector(".camp-pause-overlay");
  if (pauseOverlay) {
    pauseOverlay.hidden = !state.paused;
  }

  refreshHealingFirePanel();
}

function refreshHealingFirePanel() {
  const panel = document.querySelector(".fire-panel");
  if (!panel) return;

  const rows = Array.from(panel.querySelectorAll(".fire-unit-row"));
  const rowIds = rows.map((row) => Number(row.dataset.unitId)).join(",");
  const unitIds = combat.units.map((unit) => unit.id).join(",");

  if (rowIds !== unitIds) {
    syncCampPanels();
    return;
  }

  for (const row of rows) {
    const unit = combat.units.find((entry) => entry.id === Number(row.dataset.unitId));
    if (!unit) continue;

    const healing = Boolean(unit.healing);
    row.classList.toggle("is-healing", healing);
    row.querySelector(".fire-unit-health").textContent = `${formatHp(unit.health)}/${unit.maxHealth} hp`;
    row.querySelector(".fire-unit-state").textContent = healing
      ? "Resting"
      : unit.health >= unit.maxHealth
        ? "Full"
        : "Send";
  }
}

function setShopOpen(open) {
  if (open === state.shopOpen) return;

  state.shopOpen = open;

  if (open) {
    state.shopTab = "exchange";
    shopPausedGame = !state.paused;
    setPaused(true);
  } else if (shopPausedGame) {
    shopPausedGame = false;
    setPaused(false);
  }

  refreshCombatHud();
  render();
}

function runExchange(offerId) {
  const offer = EXCHANGE_OFFERS.find((entry) => entry.id === offerId);
  if (!offer || state.gameOver || state[offer.spend] < offer.spendAmount) return false;

  state[offer.spend] -= offer.spendAmount;
  state[offer.earn] += offer.earnAmount;
  refreshCombatHud();
  render();
  return true;
}

function currencyIcon(currency) {
  const src = currency === "gems" ? "gem.png" : "coin.png";
  return `
    <span class="shop-icon shop-icon-${currency}" aria-hidden="true">
      <img class="shop-icon-image" src="${src}" alt="" width="20" height="20">
    </span>
  `;
}

function currencyLabel(currency, amount) {
  return currency === "gems" ? `${amount} diamond` : `${amount} coin`;
}

function renderExchangeSection() {
  const offers = EXCHANGE_OFFERS.map((offer) => {
    const canTrade = state[offer.spend] >= offer.spendAmount;

    return `
      <div class="shop-offer">
        <span class="shop-offer-deal">
          <span class="shop-amount">${offer.spendAmount}${currencyIcon(offer.spend)}</span>
          <span class="shop-offer-arrow" aria-hidden="true">→</span>
          <span class="shop-amount">${offer.earnAmount}${currencyIcon(offer.earn)}</span>
        </span>
        <button
          class="shop-offer-button${canTrade ? "" : " is-broke"}"
          type="button"
          data-action="run-exchange"
          data-offer-id="${offer.id}"
          ${canTrade ? "" : "disabled"}
          aria-label="Trade ${currencyLabel(offer.spend, offer.spendAmount)} for ${currencyLabel(offer.earn, offer.earnAmount)}"
        >
          Trade
        </button>
      </div>
    `;
  }).join("");

  return `<div class="shop-offers">${offers}</div>`;
}

function buyHealingFire() {
  if (state.gameOver || state.healingFire || state.gems < HEALING_FIRE_COST) return false;

  state.gems -= HEALING_FIRE_COST;
  state.healingFire = true;
  refreshCombatHud();
  render();
  return true;
}

function buyMine() {
  if (state.gameOver || state.mine || state.gems < MINE_COST) return false;

  state.gems -= MINE_COST;
  state.mine = true;
  refreshCombatHud();
  render();
  return true;
}

function buyWindmill() {
  if (state.gameOver || state.windmill || state.gems < WINDMILL_COST) return false;

  state.gems -= WINDMILL_COST;
  state.windmill = true;
  refreshCombatHud();
  render();
  return true;
}

function buyPaddock() {
  if (state.gameOver || state.paddock || state.gems < PADDOCK_COST) return false;

  state.gems -= PADDOCK_COST;
  state.paddock = true;
  refreshCombatHud();
  render();
  return true;
}

function renderLandCard(card) {
  const disabled = card.owned || state.gems < card.cost;

  return `
    <div class="shop-land-card">
      <svg class="shop-land-art" viewBox="${card.viewBox}" aria-hidden="true">${card.art}</svg>
      <span class="shop-land-label">${card.label}</span>
      <span class="shop-land-blurb">${card.blurb}</span>
      <button
        class="shop-offer-button${disabled ? " is-broke" : ""}"
        type="button"
        data-action="${card.action}"
        ${disabled ? "disabled" : ""}
        aria-label="${card.owned ? `${card.label} already built` : `Buy the ${card.label.toLowerCase()} for ${card.cost} diamonds`}"
      >
        ${card.owned ? "Built" : `${card.cost}${currencyIcon("gems")}`}
      </button>
    </div>
  `;
}

function renderLandSection() {
  const cards = [
    {
      label: "Healing Campfire",
      blurb: "Send hurt troops here to rest and mend.",
      cost: HEALING_FIRE_COST,
      owned: state.healingFire,
      action: "buy-healing-fire",
      viewBox: "-80 -70 160 100",
      art: `<g transform="scale(0.72)">${campfire()}</g>`
    },
    {
      label: "Mine",
      blurb: `Ore for the mint · +${Math.round((MINE_MINT_MULTIPLIER - 1) * 100)}% coin from every mint payout.`,
      cost: MINE_COST,
      owned: state.mine,
      action: "buy-mine",
      viewBox: "-118 -100 236 200",
      art: `<g transform="scale(0.9)">${quarryArt()}</g>`
    },
    {
      label: "Windmill",
      blurb: `Grinds your harvest · +${WINDMILL_FARM_POP_BONUS} population per farm level.`,
      cost: WINDMILL_COST,
      owned: state.windmill,
      action: "buy-windmill",
      viewBox: "-160 -185 320 200",
      art: `<g transform="scale(0.92)">${windmillArt()}</g>`
    },
    {
      label: "Paddock",
      blurb: `Grazing ground · train ${PADDOCK_EXTRA_STABLE_POP} extra stable unit past max population.`,
      cost: PADDOCK_COST,
      owned: state.paddock,
      action: "buy-paddock",
      viewBox: "-125 -80 250 155",
      art: `<g transform="translate(${-PADDOCK_CENTER.x} ${-PADDOCK_CENTER.y})">${paddockArt()}</g>`
    }
  ];

  return `<div class="shop-land">${cards.map(renderLandCard).join("")}</div>`;
}

function renderShopPanel() {
  if (!state.shopOpen) return "";

  const onExchange = state.shopTab === "exchange";

  return `
    <div class="shop-panel" role="dialog" aria-label="Shop">
      <p class="shop-kicker">Shop</p>
      <div class="shop-tabs" role="tablist" aria-label="Shop sections">
        <button
          class="shop-tab${onExchange ? " is-active" : ""}"
          type="button"
          role="tab"
          data-action="show-shop-tab"
          data-shop-tab="exchange"
          aria-selected="${onExchange}"
        >
          Diamond Exchange
        </button>
        <button
          class="shop-tab${onExchange ? "" : " is-active"}"
          type="button"
          role="tab"
          data-action="show-shop-tab"
          data-shop-tab="land"
          aria-selected="${!onExchange}"
        >
          Buy Land
        </button>
      </div>
      <div class="shop-section" role="tabpanel">
        ${onExchange ? renderExchangeSection() : renderLandSection()}
      </div>
    </div>
  `;
}

function goblinSprite(swing, strike) {
  const legSwing = swing * 17;
  const armSwing = swing * 13;
  const strikeSwing = -strike * 66;

  return `
    <ellipse cx="0" cy="1" rx="9.5" ry="3" fill="rgba(5, 16, 8, 0.3)"/>
    <g transform="rotate(${legSwing} 3.2 -13)">
      <path d="M 0.8 -13.8 h 5 v 10.8 h -5 Z" fill="#3d6a1b"/>
      <path d="M -0.2 -4 h 7.4 a 1.5 1.5 0 0 1 1.5 1.5 v 1.2 a 1.3 1.3 0 0 1 -1.3 1.3 h -7.6 Z" fill="url(#monsterLeather)"/>
    </g>
    <g transform="rotate(${-legSwing} -3.2 -13)">
      <path d="M -5.8 -13.8 h 5 v 10.8 h -5 Z" fill="#4f8524"/>
      <path d="M -8.9 -4 h 7.6 a 1.3 1.3 0 0 1 1.3 1.3 v 1.4 a 1.3 1.3 0 0 1 -1.3 1.3 h -7.6 Z" fill="url(#monsterLeather)"/>
    </g>
    <g transform="rotate(${armSwing} -6.4 -23.6)">
      <path d="M -8.4 -24.2 h 3.8 v 12.6 a 1.9 1.9 0 0 1 -3.8 0 Z" fill="#4f8524"/>
      <circle cx="-6.5" cy="-11.2" r="2.2" fill="#6fa832"/>
      <path d="M -13.4 -11.8 a 5.2 5.2 0 0 1 10.4 0 a 5.2 5.2 0 0 1 -10.4 0 Z" fill="url(#monsterLeather)" stroke="#3b2713" stroke-width="0.7"/>
      <circle cx="-8.2" cy="-11.8" r="1.1" fill="#8c9aad"/>
    </g>
    <path d="M -7 -25.8 q 7 -3.2 14 0 l 1.8 12.6 q -8.8 2.6 -17.6 0 Z" fill="url(#goblinSkin)"/>
    <path d="M -7.4 -21.6 q 7.4 -2.8 14.8 0 l 1.2 8.8 q -8.6 2.6 -17.2 0 Z" fill="url(#monsterLeather)"/>
    <path d="M -7.6 -16.6 l 2.6 3.6 2.4 -3 2.4 3.2 2.4 -3.2 2.6 3 2.4 -3.6" fill="none" stroke="#4a3018" stroke-width="0.8"/>
    <rect x="-8.4" y="-15.4" width="17" height="2.9" rx="1" fill="#43301b"/>
    <rect x="-1.7" y="-15.8" width="3.5" height="3.6" rx="0.9" fill="#d9a53a"/>
    <path d="M -5.4 -31.6 q -6.8 -3.2 -8 -6 q 4.6 -0.8 8.6 2.4 Z" fill="#6fa832" stroke="#2f5714" stroke-width="0.6"/>
    <path d="M 5.4 -31.6 q 6.8 -3.2 8 -6 q -4.6 -0.8 -8.6 2.4 Z" fill="#578d24" stroke="#2f5714" stroke-width="0.6"/>
    <ellipse cx="0" cy="-29.6" rx="6.4" ry="5.8" fill="url(#goblinSkin)"/>
    <path d="M -4.6 -24.6 q 4.6 2.6 9.2 0 q -4.6 3.4 -9.2 0 Z" fill="#3f6a1c"/>
    <path d="M 0.4 -29.8 q 3.8 1.4 1.4 3.8 q -1.8 0.6 -2.8 -0.8 Z" fill="#5f9227"/>
    <ellipse cx="-2.9" cy="-31" rx="1.8" ry="1.5" fill="#fff8d2"/>
    <ellipse cx="2.7" cy="-31" rx="1.8" ry="1.5" fill="#fff8d2"/>
    <circle cx="-2.5" cy="-31" r="0.9" fill="#1b2e06"/>
    <circle cx="3" cy="-31" r="0.9" fill="#1b2e06"/>
    <path d="M -5.2 -33.2 q 2.6 -1.4 4.8 -0.2 M 0.8 -33.4 q 2.4 -1.2 4.6 0.2" fill="none" stroke="#2f5714" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M -3.6 -25.8 q 3.6 2.2 7.2 0" fill="none" stroke="#2a4711" stroke-width="0.9" stroke-linecap="round"/>
    <path d="M -2.4 -25.6 l 1 2.2 1 -2.2 Z M 1.4 -25.6 l 1 2.2 1 -2.2 Z" fill="#f8fafc"/>
    <path d="M -6.9 -33.6 q 6.9 -7.8 13.8 0 q -6.9 -3.2 -13.8 0 Z" fill="url(#monsterLeather)" stroke="#3f2a14" stroke-width="0.6"/>
    <path d="M 5.6 -35.4 q 5.2 -3.8 7.8 -1.4 q -3.6 2.8 -7.2 3 Z" fill="#b91c1c"/>
    <g transform="rotate(${strikeSwing - armSwing} 6.4 -23.6)">
      <path d="M 4.6 -24.2 h 3.8 v 12.6 a 1.9 1.9 0 0 1 -3.8 0 Z" fill="url(#goblinSkin)"/>
      <circle cx="6.5" cy="-11.2" r="2.3" fill="#7cb342"/>
      <rect x="8" y="-12.6" width="3.4" height="2.8" rx="0.8" fill="#5b3c20"/>
      <rect x="11.2" y="-13.4" width="1.6" height="4.4" rx="0.6" fill="#8a6a3f"/>
      <path d="M 12.6 -12.8 l 8.4 1.4 -8.4 1.6 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.4"/>
    </g>
  `;
}

function wraithSprite(swing, strike) {
  const hover = swing * 2.4;
  const armSwing = -strike * 44;
  const wisp = swing * 3;

  return `
    <ellipse cx="0" cy="0" rx="9" ry="2.6" fill="rgba(8, 12, 30, 0.26)"/>
    <g transform="translate(0 ${hover - 6})">
      <circle cx="0" cy="-22" r="19" fill="url(#wraithGlow)"/>
      <path d="M -9 -6 q ${3 + wisp} 6 -1 10 q -5 -3 -4 -10 Z" fill="#6d5aa8" opacity="0.34"/>
      <path d="M 0 -5 q ${-2 + wisp} 7 1 12 q 4 -5 2 -12 Z" fill="#6d5aa8" opacity="0.3"/>
      <path d="M 8 -6 q ${-3 + wisp} 6 1 10 q 5 -3 3 -10 Z" fill="#6d5aa8" opacity="0.34"/>
      <path d="M -11 -30 q 11 -9 22 0 l 2 22 q -4 -3 -6 1 q -3 -4 -6 0 q -3 -4 -6 0 q -3 -4 -6 -1 Z" fill="url(#wraithCloak)" opacity="0.92"/>
      <path d="M -11 -30 q 11 -9 22 0 l 0.8 5 q -11.8 -6 -23.6 0 Z" fill="#6b5ba5" opacity="0.55"/>
      <path d="M -8.4 -32 q 8.4 -12 16.8 0 q -8.4 -5 -16.8 0 Z" fill="#2a2148"/>
      <path d="M -6.6 -31.6 q 6.6 -8.4 13.2 0 q -6.6 3.4 -13.2 0 Z" fill="#0b0918"/>
      <circle cx="-3" cy="-31.6" r="2.6" fill="rgba(125, 231, 255, 0.28)"/>
      <circle cx="3" cy="-31.6" r="2.6" fill="rgba(125, 231, 255, 0.28)"/>
      <ellipse cx="-3" cy="-31.6" rx="1.5" ry="1.2" fill="#a5f3fc"/>
      <ellipse cx="3" cy="-31.6" rx="1.5" ry="1.2" fill="#a5f3fc"/>
      <g transform="rotate(${armSwing} -10 -26)">
        <path d="M -10.6 -26.6 q -5.4 3 -6.6 8.4 q 3 -1.4 4.4 -3.4 q 0.6 2.4 2.2 3.6 q 1.4 -4.6 2.4 -8 Z" fill="#cbd5e1" opacity="0.9"/>
      </g>
      <g transform="rotate(${-armSwing} 10 -26)">
        <path d="M 10.6 -26.6 q 5.4 3 6.6 8.4 q -3 -1.4 -4.4 -3.4 q -0.6 2.4 -2.2 3.6 q -1.4 -4.6 -2.4 -8 Z" fill="#cbd5e1" opacity="0.9"/>
        <path d="M 13.6 -19 l 1.6 -14.6 2 0.4 -1.8 14.6 Z" fill="#6b4a2f"/>
        <path d="M 15.2 -33.8 q 8.4 1.4 8 9.4 q -3.6 -5.6 -8.6 -6.6 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.4"/>
      </g>
    </g>
  `;
}

function orcSprite(swing, strike) {
  const legSwing = swing * 14;
  const armSwing = swing * 11;
  const strikeSwing = -strike * 72;

  return `
    <ellipse cx="0" cy="1.5" rx="13" ry="4" fill="rgba(5, 16, 8, 0.32)"/>
    <g transform="rotate(${legSwing} 5 -17)">
      <path d="M 1.4 -18 h 7 v 14 h -7 Z" fill="#2f5418"/>
      <path d="M 0.6 -5 h 2.6 v 3 h -2.6 Z M 4.6 -5 h 2.6 v 3 h -2.6 Z" fill="#6b4a2f"/>
      <path d="M -0.4 -5.2 h 10 a 2 2 0 0 1 2 2 v 1.4 a 1.6 1.6 0 0 1 -1.6 1.8 h -10.4 Z" fill="url(#monsterLeather)"/>
    </g>
    <g transform="rotate(${-legSwing} -5 -17)">
      <path d="M -8.4 -18 h 7 v 14 h -7 Z" fill="#487327"/>
      <path d="M -7.2 -5 h 2.6 v 3 h -2.6 Z M -3.2 -5 h 2.6 v 3 h -2.6 Z" fill="#6b4a2f"/>
      <path d="M -12 -5.2 h 10.4 a 1.8 1.8 0 0 1 1.8 1.8 v 1.6 a 1.6 1.6 0 0 1 -1.6 1.8 h -10.6 Z" fill="url(#monsterLeather)"/>
    </g>
    <g transform="rotate(${armSwing} -11 -33)">
      <path d="M -14.4 -34 h 5.6 v 17 a 2.8 2.8 0 0 1 -5.6 0 Z" fill="#487327"/>
      <path d="M -14.2 -26.6 q 2.8 -1.6 5.4 0 l -0.4 3.2 q -2.4 1.4 -4.8 0 Z" fill="#3a5f1f"/>
      <circle cx="-11.6" cy="-15.8" r="3.1" fill="#5c8a33"/>
    </g>
    <path d="M -11.6 -36.4 q 11.6 -4.6 23.2 0 l 2.8 18.8 q -14.4 3.4 -28.8 0 Z" fill="url(#orcSkin)"/>
    <path d="M -11.2 -35.6 q 11.2 -4.2 22.4 0 l 0.8 5.4 q -12 -3.6 -24 0 Z" fill="#7ba849" opacity="0.5"/>
    <path d="M -7.6 -32.4 q 3.6 3.4 0.6 7.2 M 7.6 -32.4 q -3.6 3.4 -0.6 7.2" fill="none" stroke="#24420f" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M -0.4 -29.6 v 10.6" fill="none" stroke="#24420f" stroke-width="1" stroke-linecap="round"/>
    <path d="M -12.4 -33.6 l 24.4 11.4 -1.6 3.4 -24 -11.2 Z" fill="url(#monsterLeather)"/>
    <rect x="-13.6" y="-20.4" width="27.6" height="4" rx="1.4" fill="#43301b"/>
    <path d="M -2.6 -19.8 a 3 3 0 0 1 5.6 0 q 0.6 3.4 -2.8 4.4 q -3.4 -1 -2.8 -4.4 Z" fill="#e8e3cf"/>
    <circle cx="-1.1" cy="-18.6" r="0.7" fill="#3f3a2a"/>
    <circle cx="1.4" cy="-18.6" r="0.7" fill="#3f3a2a"/>
    <path d="M -8.4 -40.6 q 8.4 -5.6 16.8 0 q 1.6 8.6 -8.4 11.2 q -10 -2.6 -8.4 -11.2 Z" fill="url(#orcSkin)"/>
    <path d="M -8.8 -41 q 8.8 -6 17.6 0 q -8.8 -2.6 -17.6 0 Z" fill="#2f5418"/>
    <path d="M 0 -47.6 q 3.2 2.6 1.2 6.6 q -2.4 -2 -1.2 -6.6 Z" fill="#1f3a0f"/>
    <path d="M -9.6 -37.6 q -3.6 0.6 -3.4 3.4 q 2.2 1 3.8 -0.6 Z M 9.6 -37.6 q 3.6 0.6 3.4 3.4 q -2.2 1 -3.8 -0.6 Z" fill="#4f7c22"/>
    <path d="M -8 -38.6 q 3.4 -1.8 6.4 -0.2 M 1.6 -38.8 q 3.2 -1.6 6.4 0.2" fill="none" stroke="#24420f" stroke-width="1.3" stroke-linecap="round"/>
    <ellipse cx="-3.6" cy="-36.4" rx="1.9" ry="1.6" fill="#fecaca"/>
    <ellipse cx="3.6" cy="-36.4" rx="1.9" ry="1.6" fill="#fecaca"/>
    <circle cx="-3.4" cy="-36.4" r="0.9" fill="#7f1d1d"/>
    <circle cx="3.8" cy="-36.4" r="0.9" fill="#7f1d1d"/>
    <path d="M -1.4 -34.6 q 1.4 1.4 2.8 0" fill="none" stroke="#24420f" stroke-width="0.9"/>
    <path d="M -5.2 -31.6 q 5.2 2.6 10.4 0 q -5.2 3.6 -10.4 0 Z" fill="#22400e"/>
    <path d="M -4.6 -31.4 q -1.6 -4 1.4 -5.4 q 1.2 2.8 0.4 5.6 Z" fill="#f8fafc"/>
    <path d="M 4.6 -31.4 q 1.6 -4 -1.4 -5.4 q -1.2 2.8 -0.4 5.6 Z" fill="#f8fafc"/>
    <g transform="translate(-11.4 -35.4)">
      <path d="M -4.6 -2.6 q 4.8 -4.2 9.6 0 q 0.8 5 -4.8 6.4 q -5.6 -1.4 -4.8 -6.4 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.6"/>
      <path d="M -3.6 -3.4 l -1.8 -3.6 3.4 2 Z M 3.6 -3.4 l 1.8 -3.6 -3.4 2 Z M 0 -5 l 0 -4.2 1.8 3.4 Z" fill="#cbd5e1" stroke="#5c6675" stroke-width="0.4"/>
    </g>
    <g transform="rotate(${strikeSwing - armSwing} 11 -33)">
      <path d="M 8.8 -34 h 5.8 v 17 a 2.9 2.9 0 0 1 -5.8 0 Z" fill="url(#orcSkin)"/>
      <path d="M 8.8 -26.6 q 2.9 -1.6 5.6 0 l -0.4 3.2 q -2.6 1.4 -5 0 Z" fill="#3a5f1f"/>
      <circle cx="11.7" cy="-15.8" r="3.2" fill="#67973c"/>
      <rect x="10.2" y="-18.2" width="3" height="8.6" rx="1.2" fill="#5b3c20" transform="rotate(-24 11.7 -14)"/>
      <path d="M 14 -22.4 q 12.4 -2.6 15.6 6.4 q -8.4 -1.6 -10.2 2.6 q -3.6 -3.8 -6.8 -4.6 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.6"/>
      <path d="M 19.4 -20.8 q 6 0.6 8.6 4.4" fill="none" stroke="#64748b" stroke-width="0.7"/>
    </g>
  `;
}

function ogreSprite(swing, strike) {
  const legSwing = swing * 10;
  const armSwing = swing * 8;
  const strikeSwing = -strike * 62;
  const warts = [
    [-9, -34, 1.7], [-4, -28, 1.3], [6, -31, 1.5], [10, -24, 1.2],
    [-11, -22, 1.4], [2, -20, 1.1], [13, -34, 1.3]
  ]
    .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#7f8a4c" opacity="0.75"/>`)
    .join("");

  return `
    <ellipse cx="0" cy="2" rx="17" ry="5" fill="rgba(5, 16, 8, 0.34)"/>
    <g transform="rotate(${legSwing} 7 -19)">
      <path d="M 1.6 -20 h 10.4 v 15.4 h -10.4 Z" fill="#5e6739"/>
      <path d="M 0.4 -6 h 13.6 a 2.4 2.4 0 0 1 2.4 2.4 v 1.8 a 1.8 1.8 0 0 1 -1.8 1.8 h -14.2 Z" fill="#a3a874"/>
      <path d="M 12.8 -2.6 l 3 -0.6 -0.4 2 -2.8 0.2 Z M 8.8 -2 h 2.6 v 2 h -2.6 Z" fill="#f1f5e8"/>
    </g>
    <g transform="rotate(${-legSwing} -7 -19)">
      <path d="M -12 -20 h 10.4 v 15.4 h -10.4 Z" fill="#78814b"/>
      <path d="M -16.4 -6 h 14.2 a 1.8 1.8 0 0 1 1.8 1.8 v 2 a 1.8 1.8 0 0 1 -1.8 1.8 h -14.2 a 2.2 2.2 0 0 1 -2.2 -2.2 v -1.2 a 2.2 2.2 0 0 1 2.2 -2.2 Z" fill="#b3b884"/>
      <path d="M -15.8 -2.6 l -3 -0.6 0.4 2 2.8 0.2 Z M -11.4 -2 h 2.6 v 2 h -2.6 Z" fill="#f1f5e8"/>
    </g>
    <g transform="rotate(${armSwing} -15 -42)">
      <path d="M -19.4 -43 h 7.4 v 22 a 3.7 3.7 0 0 1 -7.4 0 Z" fill="#8b9455"/>
      <circle cx="-15.7" cy="-19.4" r="4.2" fill="#9ea767"/>
      <path d="M -19.2 -18 q 3.4 -2.4 7 0" fill="none" stroke="#6b7443" stroke-width="0.9"/>
    </g>
    <path d="M -15.4 -44.6 q 15.4 -7 30.8 0 q 4.2 14.6 1.4 26 q -16.8 4.6 -33.6 0 q -2.8 -11.4 1.4 -26 Z" fill="url(#ogreSkin)"/>
    <path d="M -14.4 -43.8 q 14.4 -6 28.8 0 q 1.4 4.6 1.8 8 q -16 -6.4 -32.4 0 q 0.4 -3.4 1.8 -8 Z" fill="#c2c692" opacity="0.5"/>
    <path d="M -2.6 -26.6 q 3 1.4 1.2 4.6 q -2.6 -1 -1.2 -4.6 Z" fill="#6b7443"/>
    ${warts}
    <path d="M -16.6 -21.8 q 16.6 5 33.2 0 l -1.4 8.8 q -16.4 4 -30.4 0 Z" fill="url(#monsterLeather)"/>
    <path d="M -16.6 -21.8 q 16.6 5 33.2 0 l -0.4 2.6 q -16.4 4.8 -32.4 0 Z" fill="#43301b"/>
    <path d="M -12 -50.4 q 12 -8.4 24 0 q 2.6 11.6 -12 15 q -14.6 -3.4 -12 -15 Z" fill="url(#ogreSkin)"/>
    <path d="M -12.4 -50.6 q 12.4 -8 24.8 0 q -12.4 -3.4 -24.8 0 Z" fill="#5e6739"/>
    <path d="M -4.4 -52.6 q 4.4 -4.6 8.8 0 q -4.4 -1.6 -8.8 0 Z" fill="#4c5430"/>
    <circle cx="-8.6" cy="-44.6" r="1.8" fill="#93985f"/>
    <circle cx="9.4" cy="-42.6" r="1.6" fill="#93985f"/>
    <path d="M -13.4 -45.6 q -4.4 0.4 -4.4 4 q 2.8 1.6 5 -0.8 Z M 13.4 -45.6 q 4.4 0.4 4.4 4 q -2.8 1.6 -5 -0.8 Z" fill="#a3a874"/>
    <path d="M -8.4 -46.6 q 4.4 -2 8 -0.4 M 1.6 -46.8 q 3.6 -1.8 7.2 0.2" fill="none" stroke="#4c5430" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="-4.4" cy="-43.8" rx="2" ry="1.7" fill="#fde68a"/>
    <ellipse cx="4.4" cy="-43.8" rx="2" ry="1.7" fill="#fde68a"/>
    <circle cx="-4" cy="-43.8" r="0.9" fill="#3f2d06"/>
    <circle cx="4.8" cy="-43.8" r="0.9" fill="#3f2d06"/>
    <path d="M -3 -40.6 q 3 3 6 0 q -3 4 -6 0 Z" fill="#7a8449"/>
    <path d="M -9 -37.4 q 9 6 18 0 q -9 7.4 -18 0 Z" fill="#4a3f24"/>
    <path d="M -6.4 -35.8 q -1.4 4.6 1.8 6 q 1.6 -3 1 -6.2 Z" fill="#f8fafc"/>
    <path d="M 6.4 -35.8 q 1.4 4.6 -1.8 6 q -1.6 -3 -1 -6.2 Z" fill="#f8fafc"/>
    <g transform="rotate(${strikeSwing - armSwing} 15 -42)">
      <path d="M 12 -43 h 7.6 v 22 a 3.8 3.8 0 0 1 -7.6 0 Z" fill="url(#ogreSkin)"/>
      <circle cx="15.8" cy="-19.4" r="4.3" fill="#a9b170"/>
      <g transform="rotate(-28 15.8 -19.4)">
        <rect x="14" y="-20.6" width="3.6" height="16" rx="1.6" fill="url(#woodFill)"/>
        <path d="M 11.4 -34.4 q 4.4 -5.4 8.8 0 q 1.8 7 -4.4 9.4 q -6.2 -2.4 -4.4 -9.4 Z" fill="url(#woodFill)" stroke="#5a3b1c" stroke-width="0.8"/>
        <path d="M 11.6 -33 l -3.6 -2 3 4 Z M 19.6 -33 l 3.6 -2 -3 4 Z M 15.8 -37.4 l 0 -4.2 2 3.6 Z M 10.6 -27.6 l -3.8 1 3.6 2 Z M 21 -27.6 l 3.8 1 -3.6 2 Z" fill="#cbd5e1" stroke="#5c6675" stroke-width="0.4"/>
      </g>
    </g>
  `;
}

function plagueRatSprite(swing, strike) {
  const legSwing = swing * 14;
  const lunge = strike * 3;

  return `
    <ellipse cx="0" cy="1" rx="15" ry="3.4" fill="rgba(5, 16, 8, 0.28)"/>
    <path d="M -12 -9 q -12 2 -16 -6" fill="none" stroke="#9aa6b6" stroke-width="2.8" stroke-linecap="round"/>
    <g transform="rotate(${legSwing} -7 -4)">
      <rect x="-9.4" y="-6.4" width="3.8" height="6.8" rx="1.5" fill="#3f4a5a"/>
    </g>
    <g transform="rotate(${-legSwing} 7 -4)">
      <rect x="5" y="-6.4" width="3.8" height="6.8" rx="1.5" fill="#3f4a5a"/>
    </g>
    <g transform="translate(${lunge} 0)">
      <ellipse cx="-1" cy="-10.6" rx="13" ry="8" fill="url(#ratFur)"/>
      <ellipse cx="-4" cy="-13.4" rx="6.4" ry="3.2" fill="#b7c1ce" opacity="0.45"/>
      <circle cx="-6.4" cy="-8" r="2.3" fill="#7f9a6b" opacity="0.6"/>
      <circle cx="1.6" cy="-7" r="1.6" fill="#7f9a6b" opacity="0.5"/>
      <circle cx="11.4" cy="-17" r="3.4" fill="#6b7688" stroke="#334155" stroke-width="0.7"/>
      <circle cx="11.4" cy="-17" r="1.6" fill="#f9a8d4" opacity="0.7"/>
      <path d="M 7 -13.4 q 9 -3.4 15.6 3 q -6.4 4.2 -15.6 1.4 Z" fill="url(#ratFur)"/>
      <circle cx="22.4" cy="-10" r="1.4" fill="#f9a8d4"/>
      <ellipse cx="14.6" cy="-13" rx="1.7" ry="1.4" fill="#fca5a5"/>
      <circle cx="14.9" cy="-13" r="0.8" fill="#7f1d1d"/>
      <path d="M 18.6 -9.6 l 7 -3.4 M 18.6 -8.6 l 7 1.2" fill="none" stroke="#e2e8f0" stroke-width="0.6"/>
      <path d="M 19.4 -8.2 l 1.2 3.2 1.3 -3.2 Z" fill="#fef3c7"/>
    </g>
  `;
}

function koboldSprite(swing, strike) {
  const legSwing = swing * 15;
  const armSwing = swing * 12;
  const slingSpin = strike * -120;

  return `
    <ellipse cx="0" cy="1" rx="9" ry="3" fill="rgba(5, 16, 8, 0.28)"/>
    <path d="M -6 -16 q -12 -2 -15 8 q 5 3 8 -2 q 3 -4 7 -3 Z" fill="url(#koboldHide)" stroke="#7c3d0a" stroke-width="0.6"/>
    <g transform="rotate(${legSwing} 3 -12)">
      <path d="M 0.8 -13 h 4.6 l 1 9.6 h -4.6 Z" fill="#b8620e"/>
      <path d="M -0.4 -4 h 7.4 a 1.4 1.4 0 0 1 1.4 1.4 v 1.2 a 1.3 1.3 0 0 1 -1.3 1.3 h -7.5 Z" fill="#8a4a0c"/>
    </g>
    <g transform="rotate(${-legSwing} -3 -12)">
      <path d="M -5.4 -13 h 4.6 l -0.4 9.6 h -4.6 Z" fill="#d4801f"/>
      <path d="M -8.8 -4 h 7.4 a 1.3 1.3 0 0 1 1.3 1.3 v 1.4 a 1.3 1.3 0 0 1 -1.3 1.3 h -7.4 Z" fill="#8a4a0c"/>
    </g>
    <g transform="rotate(${armSwing} -6 -22)">
      <path d="M -8 -22.6 h 3.4 v 11.4 a 1.7 1.7 0 0 1 -3.4 0 Z" fill="#c06c12"/>
    </g>
    <path d="M -6.4 -24.4 q 6.4 -3 12.8 0 l 1.6 11.6 q -8 2.4 -16 0 Z" fill="url(#koboldHide)"/>
    <path d="M -6.8 -20.6 q 6.8 -2.4 13.6 0 l 0.8 6.4 q -7.6 2.2 -15.2 0 Z" fill="url(#monsterLeather)"/>
    <circle cx="-3.4" cy="-17.4" r="1.3" fill="#7c3d0a" opacity="0.7"/>
    <circle cx="2.6" cy="-15.6" r="1.1" fill="#7c3d0a" opacity="0.6"/>
    <ellipse cx="0.4" cy="-28.6" rx="6" ry="5.2" fill="url(#koboldHide)"/>
    <path d="M 3.4 -29.8 q 8 1.6 8.6 5 q -5 2.2 -9.4 -0.4 Z" fill="#d4801f"/>
    <path d="M 10.4 -26.4 l 1.2 2.6 1.4 -2.6 Z" fill="#fff7ed"/>
    <path d="M -2.6 -33.4 l 1.4 -4.4 2.2 3.6 Z M 2.8 -33.6 l 2.6 -3.8 0.8 4 Z" fill="#7c3d0a"/>
    <path d="M -5.6 -30.4 q -5.2 -1.6 -6.4 -4.6 q 4 -0.6 7 1.8 Z" fill="#b8620e" stroke="#7c3d0a" stroke-width="0.5"/>
    <ellipse cx="2" cy="-30" rx="1.8" ry="1.5" fill="#fef08a"/>
    <circle cx="2.4" cy="-30" r="0.9" fill="#422006"/>
    <path d="M -4 -32.6 q 2.6 -1.4 4.8 -0.4" fill="none" stroke="#7c3d0a" stroke-width="1" stroke-linecap="round"/>
    <g transform="rotate(${slingSpin} 6.4 -22)">
      <path d="M 5.6 -22.6 h 3.4 v 11 a 1.7 1.7 0 0 1 -3.4 0 Z" fill="url(#koboldHide)"/>
      <path d="M 7.3 -11.4 q 7 3.6 4.6 10.4" fill="none" stroke="#5b3c20" stroke-width="1.1"/>
      <circle cx="11.4" cy="0.6" r="2.6" fill="#8c9aad" stroke="#475569" stroke-width="0.7"/>
    </g>
  `;
}

function skeletonSprite(swing, strike) {
  const legSwing = swing * 15;
  const armSwing = swing * 11;
  const strikeSwing = -strike * 70;

  return `
    <ellipse cx="0" cy="1" rx="10" ry="3.2" fill="rgba(5, 16, 8, 0.28)"/>
    <g transform="rotate(${legSwing} 3.4 -15)">
      <rect x="1.4" y="-16" width="3.6" height="12.6" rx="1.4" fill="url(#boneWhite)"/>
      <path d="M 0.4 -4 h 6.6 a 1.4 1.4 0 0 1 1.4 1.4 v 1.2 a 1.2 1.2 0 0 1 -1.2 1.2 h -6.8 Z" fill="#e2e8f0"/>
    </g>
    <g transform="rotate(${-legSwing} -3.4 -15)">
      <rect x="-5" y="-16" width="3.6" height="12.6" rx="1.4" fill="#dbe2ea"/>
      <path d="M -7.8 -4 h 6.8 a 1.2 1.2 0 0 1 1.2 1.2 v 1.4 a 1.2 1.2 0 0 1 -1.2 1.2 h -6.8 Z" fill="#cbd5e1"/>
    </g>
    <g transform="rotate(${armSwing} -7 -27)">
      <rect x="-8.6" y="-27.6" width="3.2" height="13.4" rx="1.4" fill="#dbe2ea"/>
      <path d="M -13.8 -14.6 a 4.8 4.8 0 0 1 9.6 0 a 4.8 4.8 0 0 1 -9.6 0 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.7"/>
      <circle cx="-9" cy="-14.6" r="1.2" fill="#94a3b8"/>
    </g>
    <path d="M -6 -16.8 h 12 l -1 4.4 h -10 Z" fill="url(#boneWhite)"/>
    <rect x="-1.4" y="-28" width="2.8" height="12" rx="1.2" fill="url(#boneWhite)"/>
    <path d="M -6.4 -26.6 q 6.4 2.6 12.8 0 M -6.2 -23.4 q 6.2 2.6 12.4 0 M -5.6 -20.2 q 5.6 2.4 11.2 0" fill="none" stroke="#e8eef5" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="-8.6" y="-29.4" width="17.2" height="3" rx="1.5" fill="#cbd5e1"/>
    <ellipse cx="0" cy="-35.4" rx="6.2" ry="5.6" fill="url(#boneWhite)"/>
    <path d="M -4.6 -31.6 q 4.6 2.6 9.2 0 l -0.6 3.2 q -4 1.6 -8 0 Z" fill="#e2e8f0"/>
    <path d="M -4 -30.4 v 2.6 M -1.4 -30 v 2.8 M 1.4 -30 v 2.8 M 4 -30.4 v 2.6" fill="none" stroke="#94a3b8" stroke-width="0.7"/>
    <ellipse cx="-2.6" cy="-36.4" rx="2" ry="2.2" fill="#0b1220"/>
    <ellipse cx="2.6" cy="-36.4" rx="2" ry="2.2" fill="#0b1220"/>
    <circle cx="-2.4" cy="-36.2" r="0.8" fill="#7dd3fc"/>
    <circle cx="2.8" cy="-36.2" r="0.8" fill="#7dd3fc"/>
    <path d="M 0 -34 l -1.4 2.2 h 2.8 Z" fill="#334155"/>
    <path d="M -7 -38.6 q 7 -6.4 14 0 q -7 -2.6 -14 0 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.6"/>
    <g transform="rotate(${strikeSwing - armSwing} 7 -27)">
      <rect x="5.4" y="-27.6" width="3.2" height="13.4" rx="1.4" fill="url(#boneWhite)"/>
      <rect x="5.6" y="-16.6" width="2.8" height="4" rx="1" fill="#5b3c20"/>
      <rect x="3.4" y="-17.6" width="7.4" height="1.8" rx="0.8" fill="#8a6a3f"/>
      <path d="M 5.8 -19 h 2.6 l -0.4 -13.6 -0.9 -2.4 -0.9 2.4 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.5"/>
    </g>
  `;
}

function direBatSprite(swing, strike) {
  const hover = swing * 3;
  const flap = swing * 26;
  const bite = strike * 5;

  return `
    <ellipse cx="0" cy="0" rx="9" ry="2.6" fill="rgba(5, 16, 8, 0.22)"/>
    <g transform="translate(0 ${hover - 14})">
      <g transform="rotate(${-flap} -5 -8)">
        <path d="M -5 -10 q -14 -8 -22 -2 q 6 1 7 5 q -5 0 -8 3 q 9 4 15 1 q 5 -2 8 -3 Z" fill="url(#batWing)" stroke="#1e1b4b" stroke-width="0.8"/>
        <path d="M -5 -10 q -10 -3 -15 1 M -5 -9 q -8 1 -12 4" fill="none" stroke="#3b1d7a" stroke-width="0.7"/>
      </g>
      <g transform="rotate(${flap} 5 -8)">
        <path d="M 5 -10 q 14 -8 22 -2 q -6 1 -7 5 q 5 0 8 3 q -9 4 -15 1 q -5 -2 -8 -3 Z" fill="url(#batWing)" stroke="#1e1b4b" stroke-width="0.8"/>
        <path d="M 5 -10 q 10 -3 15 1 M 5 -9 q 8 1 12 4" fill="none" stroke="#3b1d7a" stroke-width="0.7"/>
      </g>
      <ellipse cx="0" cy="-8" rx="6" ry="8" fill="#4c3d7a"/>
      <ellipse cx="0" cy="-10" rx="4.4" ry="4.6" fill="#6b5aa8" opacity="0.6"/>
      <path d="M -3.4 -1 l -1 5 2.6 -2.6 Z M 3.4 -1 l 1 5 -2.6 -2.6 Z" fill="#a5b4fc"/>
      <g transform="translate(0 ${bite})">
        <path d="M -6.4 -17.4 l -2.6 -8.6 5.6 4.6 Z M 6.4 -17.4 l 2.6 -8.6 -5.6 4.6 Z" fill="#5b4a94" stroke="#2e1065" stroke-width="0.7"/>
        <ellipse cx="0" cy="-16.4" rx="5.6" ry="5" fill="#5b4a94"/>
        <ellipse cx="-2.2" cy="-17.4" rx="1.6" ry="1.4" fill="#fca5a5"/>
        <ellipse cx="2.2" cy="-17.4" rx="1.6" ry="1.4" fill="#fca5a5"/>
        <circle cx="-2" cy="-17.4" r="0.8" fill="#7f1d1d"/>
        <circle cx="2.4" cy="-17.4" r="0.8" fill="#7f1d1d"/>
        <path d="M 0 -15 q 2.6 1.4 0 2.6 q -2.6 -1.2 0 -2.6 Z" fill="#312e81"/>
        <path d="M -2 -13.4 l 0.8 2.6 1 -2.4 Z M 2 -13.4 l -0.8 2.6 -1 -2.4 Z" fill="#f8fafc"/>
      </g>
    </g>
  `;
}

function bogSlimeSprite(swing, strike) {
  const squash = 1 + swing * 0.07;
  const stretch = 1 - swing * 0.05;
  const jiggle = swing * 2;

  return `
    <ellipse cx="0" cy="1" rx="16" ry="4" fill="rgba(5, 16, 8, 0.26)"/>
    <g transform="scale(${squash.toFixed(3)} ${stretch.toFixed(3)})">
      <path d="M -16 0 q -2 -18 6 -23 q ${4 + jiggle} -4 ${10 - jiggle} 0 q 8 5 6 23 Z" fill="url(#slimeGoo)" opacity="0.9"/>
      <path d="M -13 -4 q -1 -14 5 -18 q 3 -3 8 0 q 6 4 5 18 Z" fill="#bbf7d0" opacity="0.34"/>
      <path d="M -8 -18 q 3 -4 7 -2" fill="none" stroke="#ecfdf5" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
      <circle cx="-6" cy="-8" r="2.4" fill="#166534" opacity="0.45"/>
      <circle cx="5" cy="-12" r="1.8" fill="#166534" opacity="0.4"/>
      <circle cx="2" cy="-5" r="1.4" fill="#166534" opacity="0.35"/>
      <ellipse cx="-4" cy="-14" rx="2.8" ry="3.2" fill="#f8fafc"/>
      <ellipse cx="5" cy="-14.6" rx="2.8" ry="3.2" fill="#f8fafc"/>
      <circle cx="-3.2" cy="-14" r="1.5" fill="#0f172a"/>
      <circle cx="5.8" cy="-14.6" r="1.5" fill="#0f172a"/>
      <path d="M -2.6 -7.4 q 4 3.4 8 0 q -4 5 -8 0 Z" fill="#14532d" opacity="0.75"/>
      <path d="M 12 -2 q 3 4 0 6 q -3 -2 0 -6 Z" fill="#4ade80" opacity="0.8"/>
      <path d="M -12 -3 q -3 5 0 7 q 3 -2 0 -7 Z" fill="#4ade80" opacity="0.7"/>
    </g>
    ${strike > 0.1 ? `<circle cx="10" cy="-10" r="${3 * strike}" fill="#bbf7d0" opacity="${0.6 * strike}"/>` : ""}
  `;
}

function giantSpiderSprite(swing, strike) {
  const legA = swing * 10;
  const legB = -swing * 10;
  const fangDrop = strike * 3;

  const legs = [
    [-3, -18, -16, -34, -26, legA],
    [-3, -17, -13, -30, -20, legB],
    [-2, -16, -9, -27, -13, legA],
    [-2, -15, -6, -24, -8, legB],
    [3, -18, 16, -34, 27, legB],
    [3, -17, 14, -31, 21, legA],
    [2, -16, 10, -28, 15, legB],
    [2, -15, 7, -25, 10, legA]
  ]
    .map(([ax, ay, kx, ky, fx, sway]) => `
      <path
        d="M ${ax} ${ay} Q ${kx + sway * 0.4} ${ky + sway} ${fx + sway} -0.5"
        fill="none"
        stroke="#2e1065"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <circle cx="${fx + sway}" cy="-0.5" r="1.2" fill="#1e1b4b"/>
    `)
    .join("");

  return `
    <ellipse cx="0" cy="1" rx="20" ry="4.4" fill="rgba(5, 16, 8, 0.3)"/>
    ${legs}
    <ellipse cx="-9" cy="-17" rx="12" ry="10" fill="url(#chitin)"/>
    <path d="M -15 -21 l 5 3 -5 3 M -6 -23 l 4 4 -4 3" fill="none" stroke="#c4b5fd" stroke-width="1.4" opacity="0.7"/>
    <ellipse cx="6" cy="-14" rx="8" ry="7" fill="#4c1d95"/>
    <ellipse cx="6" cy="-16" rx="6" ry="4" fill="#6d43c8" opacity="0.6"/>
    <g transform="translate(0 ${fangDrop})">
      <path d="M 10 -10 q 3 5 1 8 q -3 -3 -3 -8 Z" fill="#e9d5ff"/>
      <path d="M 14 -11 q 3 5 1 8 q -3 -3 -3 -8 Z" fill="#e9d5ff"/>
    </g>
    <circle cx="9" cy="-18.6" r="1.6" fill="#fca5a5"/>
    <circle cx="13" cy="-17.6" r="1.4" fill="#fca5a5"/>
    <circle cx="11" cy="-15" r="1.2" fill="#f87171"/>
    <circle cx="14.4" cy="-14" r="1" fill="#f87171"/>
    <circle cx="7.4" cy="-15.4" r="1" fill="#f87171"/>
    <circle cx="9.4" cy="-18.6" r="0.6" fill="#450a0a"/>
    <circle cx="13.4" cy="-17.6" r="0.6" fill="#450a0a"/>
  `;
}

function rottingHuskSprite(swing, strike) {
  const legSwing = swing * 9;
  const lurch = swing * 1.6;
  const reach = -strike * 40;

  return `
    <ellipse cx="0" cy="1" rx="11" ry="3.4" fill="rgba(5, 16, 8, 0.28)"/>
    <g transform="rotate(${legSwing} 4 -15)">
      <path d="M 1.4 -16 h 5.6 v 12.8 h -5.6 Z" fill="#3f5233"/>
      <path d="M 0.4 -4 h 8 a 1.6 1.6 0 0 1 1.6 1.6 v 1.2 a 1.3 1.3 0 0 1 -1.3 1.3 h -8.3 Z" fill="#4a3f24"/>
    </g>
    <g transform="rotate(${-legSwing * 0.5} -4 -15)">
      <path d="M -7 -16 h 5.6 v 12.8 h -5.6 Z" fill="#5c7043"/>
      <path d="M -10.4 -4 h 8.2 a 1.3 1.3 0 0 1 1.3 1.3 v 1.4 a 1.3 1.3 0 0 1 -1.3 1.3 h -8.2 Z" fill="#4a3f24"/>
      <path d="M -6.4 -9.6 h 5 v 2.6 h -5 Z" fill="#cbd5e1" opacity="0.7"/>
    </g>
    <g transform="rotate(${lurch})">
      <g transform="rotate(${14 + swing * 6} -8 -28)">
        <path d="M -10.4 -28.6 h 4.4 v 16 a 2.2 2.2 0 0 1 -4.4 0 Z" fill="url(#rotFlesh)"/>
        <circle cx="-8.2" cy="-12" r="2.6" fill="#8aa06b"/>
      </g>
      <path d="M -8 -30.4 q 8 -3.6 16 0 l 2 16.4 q -10 3 -20 0 Z" fill="url(#rotFlesh)"/>
      <path d="M -8.4 -30 q 8.4 -3.2 16.8 0 l 0.8 6 q -9 -2.6 -18 0 Z" fill="#5b6b4a" opacity="0.7"/>
      <path d="M -5.6 -24.6 q 5.6 2.2 11.2 0 M -5.2 -21.6 q 5.2 2.2 10.4 0 M -4.6 -18.6 q 4.6 2 9.2 0" fill="none" stroke="#e2e8f0" stroke-width="1.6" opacity="0.75" stroke-linecap="round"/>
      <path d="M 1 -27 q 5 2 4 7 q -4 -1 -5 -4 Z" fill="#7f1d1d" opacity="0.65"/>
      <ellipse cx="1.6" cy="-38.4" rx="6.6" ry="6" fill="url(#rotFlesh)"/>
      <path d="M -4.4 -42.6 q 5 -3.6 9.4 -1 q -4.6 -0.4 -9.4 1 Z" fill="#3f4a2a"/>
      <path d="M -3.6 -44 l 1.6 -3.4 0.6 3 M 2 -44.6 l 0.4 -3.4 1.6 3" fill="none" stroke="#3f4a2a" stroke-width="1"/>
      <ellipse cx="-0.6" cy="-39.4" rx="1.9" ry="1.7" fill="#f1f5f9"/>
      <ellipse cx="4.6" cy="-39" rx="1.6" ry="1.4" fill="#0f172a" opacity="0.8"/>
      <circle cx="-0.4" cy="-39.4" r="0.8" fill="#94a3b8"/>
      <path d="M -2.4 -34.6 q 4.4 3 8 0 q -3.6 5.4 -8 0 Z" fill="#2b1a12"/>
      <path d="M -1.4 -34.2 l 0.8 2.6 1 -2.4 Z M 3 -34.4 l -0.8 2.6 -1.2 -2.4 Z" fill="#e2e8f0"/>
      <g transform="rotate(${-62 + reach} 8 -28)">
        <path d="M 6 -30 h 4.6 v 17 a 2.3 2.3 0 0 1 -4.6 0 Z" fill="url(#rotFlesh)"/>
        <path d="M 6.4 -13.6 q 2.3 -1.6 4.4 0 l 0.6 3.4 q -2.8 2 -5.6 0 Z" fill="#8aa06b"/>
        <path d="M 7 -10.6 l -1 4 M 9.4 -10.4 l 0.4 4.2 M 11.4 -11 l 1.8 3.6" fill="none" stroke="#8aa06b" stroke-width="1.4" stroke-linecap="round"/>
      </g>
    </g>
    <circle cx="${-13 + swing * 3}" cy="${-42 - swing * 2}" r="0.9" fill="#1f2937"/>
    <circle cx="${13 - swing * 2}" cy="${-35 + swing * 3}" r="0.8" fill="#1f2937"/>
  `;
}

function harpySprite(swing, strike) {
  const hover = swing * 3.4;
  const flap = swing * 22;
  const clawStrike = -strike * 44;

  return `
    <ellipse cx="0" cy="0" rx="11" ry="3" fill="rgba(5, 16, 8, 0.24)"/>
    <g transform="translate(0 ${hover - 10})">
      <g transform="rotate(${-flap} -6 -30)">
        <path d="M -6 -32 q -16 -12 -26 -6 q 4 3 3 6 q 6 -2 9 1 q -5 2 -6 6 q 9 1 14 -2 Z" fill="url(#harpyFeather)" stroke="#4c1d95" stroke-width="0.8"/>
        <path d="M -10 -30 q -8 -2 -13 1 M -11 -27 q -7 0 -11 3" fill="none" stroke="#a78bfa" stroke-width="0.8"/>
      </g>
      <g transform="rotate(${flap} 6 -30)">
        <path d="M 6 -32 q 16 -12 26 -6 q -4 3 -3 6 q -6 -2 -9 1 q 5 2 6 6 q -9 1 -14 -2 Z" fill="url(#harpyFeather)" stroke="#4c1d95" stroke-width="0.8"/>
        <path d="M 10 -30 q 8 -2 13 1 M 11 -27 q 7 0 11 3" fill="none" stroke="#a78bfa" stroke-width="0.8"/>
      </g>
      <path d="M -6.4 -34 q 6.4 -3.4 12.8 0 l 2.4 16 q -7.6 3.4 -17.6 0 Z" fill="#c4b5fd"/>
      <path d="M -7.6 -25 q 7.6 3 15.2 0 M -8.4 -21 q 8.4 3 16.4 0" fill="none" stroke="#8b5cf6" stroke-width="1.6" opacity="0.7"/>
      <g transform="rotate(${clawStrike} -3 -18)">
        <path d="M -5 -18 h 3.6 v 9 h -3.6 Z" fill="#fbbf24"/>
        <path d="M -5.4 -9.4 l -2.6 6 2.4 -1.6 M -3.2 -9.4 l 0.4 6.4 1.2 -2 M -1.4 -9.6 l 2.8 5.4 0.2 -2.6" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g transform="rotate(${-clawStrike} 4 -18)">
        <path d="M 2 -18 h 3.6 v 9 h -3.6 Z" fill="#f59e0b"/>
        <path d="M 1.8 -9.4 l -2.4 6 2.2 -1.6 M 3.8 -9.4 l 0.4 6.4 1.2 -2 M 5.6 -9.6 l 2.6 5.4 0.4 -2.6" fill="none" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <ellipse cx="0" cy="-40" rx="6" ry="5.6" fill="#ddd6fe"/>
      <path d="M -6.4 -42.6 q -4 -5 -2 -9 q 4 2.6 5 6 M 0 -45.4 q 0 -6 3 -8.4 q 1.6 5 0.4 8.6 M 5.6 -43 q 4.4 -4.2 8 -3.6 q -2.6 4 -6.6 5.6" fill="#a78bfa" stroke="#6d28d9" stroke-width="0.7"/>
      <path d="M 4.4 -40.6 q 7 1 8 3.4 q -5 2 -8.4 0.4 Z" fill="#fbbf24"/>
      <ellipse cx="-1.8" cy="-41.4" rx="2" ry="1.7" fill="#fef9c3"/>
      <ellipse cx="3" cy="-41.2" rx="1.8" ry="1.6" fill="#fef9c3"/>
      <circle cx="-1.6" cy="-41.4" r="0.9" fill="#450a0a"/>
      <circle cx="3.2" cy="-41.2" r="0.9" fill="#450a0a"/>
      <path d="M -4.6 -44 q 2.6 -1.6 4.6 -0.6 M 1.4 -44 q 2.4 -1.2 4.4 0.4" fill="none" stroke="#6d28d9" stroke-width="1" stroke-linecap="round"/>
    </g>
  `;
}

function gnollSprite(swing, strike) {
  const legSwing = swing * 14;
  const armSwing = swing * 11;
  const jab = strike * 12;

  return `
    <ellipse cx="0" cy="1" rx="11" ry="3.4" fill="rgba(5, 16, 8, 0.3)"/>
    <path d="M -8 -22 q -12 2 -13 -10 q 4 4 7 3 q 3 -1 5 4 Z" fill="url(#gnollFur)" stroke="#6b3f1a" stroke-width="0.6"/>
    <g transform="rotate(${legSwing} 4 -16)">
      <path d="M 1.4 -18 h 5.6 l 1.4 8 -3 6.6 h -4.6 Z" fill="#8a5626"/>
      <path d="M 0.4 -4 h 8.4 a 1.5 1.5 0 0 1 1.5 1.5 v 1.2 a 1.3 1.3 0 0 1 -1.3 1.3 h -8.6 Z" fill="#5c3a18"/>
    </g>
    <g transform="rotate(${-legSwing} -4 -16)">
      <path d="M -7 -18 h 5.6 l -1.4 8 1.4 6.6 h -4.6 Z" fill="#b07636"/>
      <path d="M -10.4 -4 h 8.4 a 1.3 1.3 0 0 1 1.3 1.3 v 1.4 a 1.3 1.3 0 0 1 -1.3 1.3 h -8.4 Z" fill="#5c3a18"/>
    </g>
    <g transform="rotate(${armSwing} -8 -30)">
      <path d="M -10.6 -30.6 h 4.4 v 14.4 a 2.2 2.2 0 0 1 -4.4 0 Z" fill="#a06c30"/>
      <circle cx="-8.4" cy="-15.6" r="2.6" fill="#c0854a"/>
    </g>
    <path d="M -8.6 -32.4 q 8.6 -4 17.2 0 l 2 14.8 q -10.6 3 -21.2 0 Z" fill="url(#gnollFur)"/>
    <path d="M -8.8 -31.6 q 8.8 -3.6 17.6 0 l 0.8 4.6 q -9.6 -3 -19.2 0 Z" fill="#e8bd79" opacity="0.55"/>
    <circle cx="-4.6" cy="-25.4" r="1.6" fill="#6b3f1a" opacity="0.6"/>
    <circle cx="3.4" cy="-22.4" r="1.3" fill="#6b3f1a" opacity="0.55"/>
    <circle cx="-1.4" cy="-20" r="1.1" fill="#6b3f1a" opacity="0.5"/>
    <path d="M -9.4 -19 h 19.4 v 3.2 h -19.4 Z" fill="#43301b"/>
    <path d="M -7 -39.4 q 7 -6.6 14 0 q 2 8.4 -7 11 q -9 -2.6 -7 -11 Z" fill="url(#gnollFur)"/>
    <path d="M -7.4 -39.8 q 7.4 -6.4 14.8 0 q -7.4 -2.6 -14.8 0 Z" fill="#6b3f1a"/>
    <path d="M -8.6 -42.6 q -2.6 -5.6 0.4 -7.6 q 3 2.6 3.6 6.6 Z M 8.6 -42.6 q 2.6 -5.6 -0.4 -7.6 q -3 2.6 -3.6 6.6 Z" fill="#b07636" stroke="#6b3f1a" stroke-width="0.6"/>
    <path d="M 4 -36 q 9 1.6 10 5 q -6 3 -11 0.6 Z" fill="#c0854a"/>
    <path d="M 12.6 -32.6 l 1.4 2.6 1.4 -2.4 Z" fill="#f8fafc"/>
    <path d="M 5.4 -31.6 q 4 1.4 7.6 0.4" fill="none" stroke="#5c3a18" stroke-width="0.9"/>
    <ellipse cx="1.6" cy="-37.4" rx="1.9" ry="1.6" fill="#fde68a"/>
    <circle cx="2" cy="-37.4" r="0.9" fill="#422006"/>
    <path d="M -2.6 -40 q 3 -1.6 5.4 -0.4" fill="none" stroke="#6b3f1a" stroke-width="1.1" stroke-linecap="round"/>
    <g transform="translate(${jab} 0) rotate(${-armSwing} 8 -30)">
      <path d="M 6.2 -30.6 h 4.4 v 14.4 a 2.2 2.2 0 0 1 -4.4 0 Z" fill="url(#gnollFur)"/>
      <circle cx="8.4" cy="-15.6" r="2.7" fill="#c0854a"/>
      <rect x="7.2" y="-44" width="2.6" height="34" rx="1.2" fill="url(#woodFill)"/>
      <path d="M 8.5 -52 l 4 8 -8 0 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.6"/>
      <path d="M 5 -42.4 q 3.5 -2 7 0" fill="none" stroke="#5b3c20" stroke-width="1.2"/>
    </g>
  `;
}

function fireImpSprite(swing, strike) {
  const hover = swing * 2;
  const legSwing = swing * 12;
  const flameFlick = swing * 2.4;
  const hurl = -strike * 54;

  return `
    <ellipse cx="0" cy="1" rx="8" ry="2.8" fill="rgba(40, 8, 8, 0.3)"/>
    <circle cx="0" cy="-16" r="19" fill="url(#fireGlow)" opacity="0.5"/>
    <g transform="translate(0 ${hover})">
      <path d="M -6 -14 q -12 4 -12 12 q 4 2 6 -2 q 2 -5 7 -6 Z" fill="#b91c1c"/>
      <path d="M -17 -1 q -5 -2 -6 -6 q 5 -1 8 2 Z" fill="#f87171"/>
      <g transform="rotate(${legSwing} 3 -11)">
        <path d="M 0.8 -12 h 4.2 v 9.4 h -4.2 Z" fill="#b91c1c"/>
        <path d="M 0 -3.4 h 6.4 l 1.6 3.4 h -8 Z" fill="#7f1d1d"/>
      </g>
      <g transform="rotate(${-legSwing} -3 -11)">
        <path d="M -5 -12 h 4.2 v 9.4 h -4.2 Z" fill="#dc2626"/>
        <path d="M -7.8 -3.4 h 6.6 l 1.4 3.4 h -8 Z" fill="#7f1d1d"/>
      </g>
      <g transform="rotate(${20 + swing * 8} -6 -20)">
        <path d="M -8 -20.6 h 3.4 v 10 a 1.7 1.7 0 0 1 -3.4 0 Z" fill="#dc2626"/>
      </g>
      <path d="M -6 -22.6 q 6 -3 12 0 l 1.6 11 q -7.6 2.6 -15.2 0 Z" fill="url(#impSkin)"/>
      <path d="M -5.4 -20.4 q 5.4 -2 10.8 0 l 0.6 3.4 q -6 -2 -12 0 Z" fill="#fca5a5" opacity="0.5"/>
      <path d="M -9 -26.4 q -9 -7 -13 -3 q 3 1 3 4 q 5 -1 9 2 Z" fill="#7f1d1d" opacity="0.9"/>
      <path d="M 9 -26.4 q 9 -7 13 -3 q -3 1 -3 4 q -5 -1 -9 2 Z" fill="#991b1b" opacity="0.9"/>
      <ellipse cx="0" cy="-28.4" rx="5.6" ry="5" fill="url(#impSkin)"/>
      <path d="M -4.6 -31.6 l -2.6 -6 5.4 3.6 Z M 4.6 -31.6 l 2.6 -6 -5.4 3.6 Z" fill="#7f1d1d"/>
      <ellipse cx="-2.2" cy="-29.4" rx="1.8" ry="1.5" fill="#fde68a"/>
      <ellipse cx="2.4" cy="-29.4" rx="1.8" ry="1.5" fill="#fde68a"/>
      <circle cx="-2" cy="-29.4" r="0.8" fill="#7c2d12"/>
      <circle cx="2.6" cy="-29.4" r="0.8" fill="#7c2d12"/>
      <path d="M -2.6 -25.6 q 2.6 2.4 5.2 0 q -2.6 3.4 -5.2 0 Z" fill="#450a0a"/>
      <path d="M -1.6 -25.4 l 0.8 2 0.8 -1.8 Z M 2 -25.4 l -0.8 2 -1 -1.8 Z" fill="#fff7ed"/>
      <g transform="rotate(${hurl} 6 -20)">
        <path d="M 4.6 -20.6 h 3.4 v 10 a 1.7 1.7 0 0 1 -3.4 0 Z" fill="url(#impSkin)"/>
        <circle cx="6.3" cy="-10.4" r="2.2" fill="#ef4444"/>
        <path d="M 6.3 ${-13 - flameFlick} q 5 -3 3.4 -8 q 3.6 2 3 6.6 q 2 -1.6 1.6 -4.6 q 3.4 4 0.4 8.4 q -3 4.4 -8.4 2.2 Z" fill="#fb923c"/>
        <path d="M 7.4 ${-12.6 - flameFlick} q 3 -2.4 2.2 -5.4 q 3 3 0.6 6.6 q -1.6 1.8 -2.8 -1.2 Z" fill="#fef08a"/>
      </g>
    </g>
  `;
}

function caveTrollSprite(swing, strike) {
  const legSwing = swing * 9;
  const armSwing = swing * 8;
  const smash = -strike * 66;

  return `
    <ellipse cx="0" cy="2" rx="18" ry="5" fill="rgba(5, 16, 8, 0.34)"/>
    <g transform="rotate(${legSwing} 7 -18)">
      <path d="M 2 -19 h 10 v 15 h -10 Z" fill="#3f5233"/>
      <path d="M 0.6 -5.4 h 13.4 a 2.2 2.2 0 0 1 2.2 2.2 v 1.6 a 1.8 1.8 0 0 1 -1.8 1.6 h -13.8 Z" fill="#6b7f52"/>
      <path d="M 12.4 -2.2 l 3 -0.6 -0.4 2 -2.8 0.2 Z" fill="#f1f5e8"/>
    </g>
    <g transform="rotate(${-legSwing} -7 -18)">
      <path d="M -12 -19 h 10 v 15 h -10 Z" fill="#5c7043"/>
      <path d="M -16 -5.4 h 13.8 a 1.8 1.8 0 0 1 1.8 1.8 v 1.6 a 1.8 1.8 0 0 1 -1.8 1.6 h -13.8 a 2 2 0 0 1 -2 -2 v -1 a 2 2 0 0 1 2 -2 Z" fill="#7f9a6b"/>
      <path d="M -15.4 -2.2 l -3 -0.6 0.4 2 2.8 0.2 Z" fill="#f1f5e8"/>
    </g>
    <g transform="rotate(${armSwing} -15 -40)">
      <path d="M -19.4 -41 h 7.4 v 24 a 3.7 3.7 0 0 1 -7.4 0 Z" fill="#5c7043"/>
      <circle cx="-15.7" cy="-15.4" r="4.4" fill="#7f9a6b"/>
    </g>
    <path d="M -15 -44 q 15 -8 30 0 q 4 14 1 24 q -16 5 -32 0 q -3 -10 1 -24 Z" fill="url(#trollHide)"/>
    <path d="M -14 -43.4 q 14 -6.6 28 0 q 1.2 4 1.6 7 q -15.6 -6 -31.2 0 q 0.4 -3 1.6 -7 Z" fill="#a8bd88" opacity="0.45"/>
    <circle cx="-9" cy="-32" r="2" fill="#6b7f52"/>
    <circle cx="5" cy="-28" r="1.7" fill="#6b7f52"/>
    <circle cx="11" cy="-36" r="1.5" fill="#6b7f52"/>
    <path d="M -16 -22 q 16 5 32 0 l -1.4 7.4 q -15 4 -29.2 0 Z" fill="url(#monsterLeather)"/>
    <path d="M -7 -52 h 14 v 8 h -14 Z" fill="#4d6339"/>
    <path d="M -11 -58 q 11 -9 22 0 q 2.6 11 -11 14 q -13.6 -3 -11 -14 Z" fill="url(#trollHide)"/>
    <path d="M -11.4 -58.2 q 11.4 -7.6 22.8 0 q -11.4 -3.2 -22.8 0 Z" fill="#3f5233"/>
    <path d="M -12.6 -54 q -4.4 0.6 -4.2 4 q 2.8 1.6 4.8 -0.8 Z M 12.6 -54 q 4.4 0.6 4.2 4 q -2.8 1.6 -4.8 -0.8 Z" fill="#94ab74"/>
    <path d="M -8 -55 q 4.4 -2 8 -0.4 M 1.6 -55.2 q 3.6 -1.8 7.2 0.2" fill="none" stroke="#33421f" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="-4.2" cy="-52" rx="2.2" ry="1.8" fill="#fef08a"/>
    <ellipse cx="4.4" cy="-52" rx="2.2" ry="1.8" fill="#fef08a"/>
    <circle cx="-3.8" cy="-52" r="1" fill="#3f2d06"/>
    <circle cx="4.8" cy="-52" r="1" fill="#3f2d06"/>
    <path d="M -9 -45.4 q 9 6.4 18 0 q -9 8 -18 0 Z" fill="#2f3d22"/>
    <path d="M -6.4 -44 q -1.6 -5.4 1.8 -7 q 1.8 3.6 1.2 7.2 Z M 6.4 -44 q 1.6 -5.4 -1.8 -7 q -1.8 3.6 -1.2 7.2 Z" fill="#f8fafc"/>
    <g transform="rotate(${smash - armSwing} 15 -40)">
      <path d="M 12 -41 h 7.6 v 24 a 3.8 3.8 0 0 1 -7.6 0 Z" fill="url(#trollHide)"/>
      <circle cx="15.8" cy="-15.4" r="4.5" fill="#94ab74"/>
      <g transform="rotate(-26 15.8 -15.4)">
        <rect x="13.6" y="-18" width="4.4" height="14" rx="1.8" fill="url(#woodFill)"/>
        <path d="M 7 -30 l 3 -8 7 -4 8 5 1 9 -6 7 -9 -1 Z" fill="#7b8a99" stroke="#3f4a5a" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M 10 -38 l 7 4 -7 4 -3 -4 Z" fill="#9fadbf"/>
        <path d="M 25 -28 l -6 3 4 6 Z" fill="#5b6879"/>
        <circle cx="12.4" cy="-24.4" r="1.8" fill="#5b6879"/>
        <circle cx="20" cy="-32" r="1.4" fill="#5b6879"/>
        <path d="M 17 -22 l 4 5 M 9 -26 l -3 3" fill="none" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round"/>
      </g>
    </g>
  `;
}

function stoneGolemSprite(swing, strike) {
  const legSwing = swing * 7;
  const armSwing = swing * 7;
  const slam = -strike * 58;
  const runeGlow = (0.55 + swing * 0.2).toFixed(2);

  return `
    <ellipse cx="0" cy="2" rx="19" ry="5.2" fill="rgba(5, 16, 8, 0.34)"/>
    <g transform="rotate(${legSwing} 8 -20)">
      <path d="M 2.4 -21 h 11 v 17 h -11 Z" fill="#5b6879"/>
      <path d="M 0.8 -5 h 14.4 a 2 2 0 0 1 2 2 v 2 a 1.6 1.6 0 0 1 -1.6 1.4 h -14.8 Z" fill="#8c9aad"/>
    </g>
    <g transform="rotate(${-legSwing} -8 -20)">
      <path d="M -13.4 -21 h 11 v 17 h -11 Z" fill="#74829a"/>
      <path d="M -17.2 -5 h 14.8 a 1.6 1.6 0 0 1 1.6 1.6 v 1.8 a 1.6 1.6 0 0 1 -1.6 1.6 h -14.8 a 2 2 0 0 1 -2 -2 v -1 a 2 2 0 0 1 2 -2 Z" fill="#9fadbf"/>
    </g>
    <g transform="rotate(${armSwing} -17 -42)">
      <path d="M -22 -44 h 8.4 v 22 h -8.4 Z" fill="#74829a"/>
      <path d="M -23.6 -23 h 11.6 v 10 a 3 3 0 0 1 -3 3 h -5.6 a 3 3 0 0 1 -3 -3 Z" fill="#9fadbf" stroke="#4b5563" stroke-width="0.8"/>
    </g>
    <path d="M -16 -48 q 16 -6 32 0 l 3 24 q -19 5 -38 0 Z" fill="url(#golemStone)"/>
    <path d="M -15.4 -47.4 q 15.4 -5 30.8 0 l 0.8 6.4 q -16.4 -4.6 -32.4 0 Z" fill="#e2e8f0" opacity="0.45"/>
    <path d="M -12 -44 h 9 v 8 h -9 Z M 1 -45 h 11 v 9 h -11 Z M -14 -34 h 12 v 9 h -12 Z M 2 -34 h 10 v 8 h -10 Z" fill="none" stroke="#4b5563" stroke-width="0.9" opacity="0.55"/>
    <circle cx="0" cy="-35" r="6" fill="#f59e0b" opacity="${runeGlow}"/>
    <circle cx="0" cy="-35" r="3.2" fill="#fde68a"/>
    <path d="M -9 -29 l 3 4 -3 3 M 9 -41 l -3 3 3 4" fill="none" stroke="#fb923c" stroke-width="1.4" opacity="${runeGlow}"/>
    <path d="M -16 -49 q 6 -4 12 -1 q -7 1 -12 4 Z M 6 -50 q 7 -3 11 2 q -6 -2 -11 1 Z" fill="#7f9a6b" opacity="0.75"/>
    <path d="M -6 -54 h 12 v 8 h -12 Z" fill="#5b6879"/>
    <path d="M -12 -70 h 24 v 16 q 0 5 -12 6 q -12 -1 -12 -6 Z" fill="url(#golemStone)"/>
    <path d="M -12 -70 h 24 v 4 h -24 Z" fill="#e2e8f0" opacity="0.4"/>
    <path d="M -12 -64 h 24" fill="none" stroke="#4b5563" stroke-width="0.9" opacity="0.5"/>
    <path d="M -8 -62 h 6 v 4 h -6 Z M 2 -62 h 6 v 4 h -6 Z" fill="#fb923c" opacity="${runeGlow}"/>
    <path d="M -8 -62 h 6 v 4 h -6 Z M 2 -62 h 6 v 4 h -6 Z" fill="none" stroke="#7c3f08" stroke-width="0.7"/>
    <path d="M -7 -53.4 q 7 4.4 14 0 l -1 3 q -6 3 -12 0 Z" fill="#3f4a5a"/>
    <path d="M -3.6 -52.4 v 2.8 M 0 -51.8 v 3 M 3.6 -52.4 v 2.8" fill="none" stroke="#94a3b8" stroke-width="0.9"/>
    <path d="M -12 -71 q 6 -4 11 -1 q -7 1 -11 4 Z M 3 -71 q 6 -3 10 1 q -6 -2 -10 1 Z" fill="#7f9a6b" opacity="0.6"/>
    <g transform="rotate(${slam - armSwing} 17 -42)">
      <path d="M 13.6 -44 h 8.4 v 22 h -8.4 Z" fill="url(#golemStone)"/>
      <path d="M 12 -23 h 11.6 v 10 a 3 3 0 0 1 -3 3 h -5.6 a 3 3 0 0 1 -3 -3 Z" fill="#c3ccd9" stroke="#4b5563" stroke-width="0.8"/>
      <path d="M 14 -20 h 8 M 14 -17 h 8" fill="none" stroke="#64748b" stroke-width="0.8"/>
    </g>
  `;
}

function minotaurSprite(swing, strike) {
  const legSwing = swing * 12;
  const armSwing = swing * 10;
  const chop = strike * 56;
  const snort = strike > 0.4 ? 1 : 0;

  return `
    <ellipse cx="0" cy="2" rx="17" ry="4.8" fill="rgba(5, 16, 8, 0.32)"/>
    <path d="M -11 -26 q -13 4 -12 -8 q 4 5 7 4 q 3 -1 5 4 Z" fill="#5c3a18"/>
    <g transform="rotate(${legSwing} 6 -19)">
      <path d="M 1.6 -20 h 9 l 1 10 -2 9 h -8 Z" fill="#5a3416"/>
      <path d="M 1 -2 h 9.6 l 1.4 3.4 h -11 Z" fill="#2b1a0c"/>
    </g>
    <g transform="rotate(${-legSwing} -6 -19)">
      <path d="M -10.6 -20 h 9 l -1 10 2 9 h -8 Z" fill="#7c4a21"/>
      <path d="M -11.6 -2 h 9.6 l 1.4 3.4 h -11 Z" fill="#2b1a0c"/>
    </g>
    <g transform="rotate(${armSwing} -13 -38)">
      <path d="M -17 -39 h 6.4 v 20 a 3.2 3.2 0 0 1 -6.4 0 Z" fill="#8a5626"/>
      <circle cx="-13.8" cy="-17.6" r="3.8" fill="#a3682f"/>
    </g>
    <path d="M -13 -42 q 13 -6 26 0 l 3 21 q -16 4 -32 0 Z" fill="url(#minotaurFur)"/>
    <path d="M -12.4 -41.4 q 12.4 -5 24.8 0 l 0.8 5.4 q -13 -4 -26.4 0 Z" fill="#c08a4a" opacity="0.4"/>
    <path d="M -8.6 -35 q 3.6 3.4 0.6 7 M 8.6 -35 q -3.6 3.4 -0.6 7" fill="none" stroke="#3f2410" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M 0 -33 v 10" fill="none" stroke="#3f2410" stroke-width="1.1"/>
    <path d="M -13.6 -24 h 27.6 v 4 h -27.6 Z" fill="#43301b"/>
    <rect x="-3" y="-25" width="6" height="6" rx="1.4" fill="#d9a53a"/>
    <path d="M -4 -46 h 8 v 6 h -8 Z" fill="#6b451f"/>
    <path d="M -9.4 -58 q 9.4 -7 18.8 0 q 2 9.4 -9.4 12.4 q -11.4 -3 -9.4 -12.4 Z" fill="url(#minotaurFur)"/>
    <path d="M -8.4 -57.4 q 8.4 -5.4 16.8 0 q -8.4 -2.6 -16.8 0 Z" fill="#c08a4a" opacity="0.4"/>
    <path d="M 3 -53.4 q 10.6 1.4 11.6 5.4 q -6.4 3.6 -12.6 1 Z" fill="#a3682f"/>
    <path d="M 2.6 -53 q 8 1.6 10.4 4.6 q -6 -1.6 -10.8 -0.6 Z" fill="#c08a4a" opacity="0.5"/>
    <ellipse cx="12.6" cy="-49.6" rx="1.8" ry="1.4" fill="#3f2410"/>
    <path d="M 6 -46.4 q 4.4 1.6 8 0.2" fill="none" stroke="#3f2410" stroke-width="1"/>
    <path d="M 4.4 -47.6 a 3.2 3.2 0 0 1 4.6 3.2 a 3.2 3.2 0 0 1 -4.6 -3.2 Z" fill="#d9a53a"/>
    <path d="M -9 -58.6 q -7.6 -1.6 -9.4 -8 q 6.4 0.6 10 5.4 Z" fill="#f1f5f9" stroke="#a3b1c2" stroke-width="0.8"/>
    <path d="M 9 -58.6 q 7.6 -1.6 9.4 -8 q -6.4 0.6 -10 5.4 Z" fill="#e2e8f0" stroke="#a3b1c2" stroke-width="0.8"/>
    <path d="M -18.4 -66.6 q -1.6 -3 1 -4.6 q 1.6 2.6 0.8 5 Z M 18.4 -66.6 q 1.6 -3 -1 -4.6 q -1.6 2.6 -0.8 5 Z" fill="#f8fafc"/>
    <path d="M -8.6 -62.4 q 8.6 -4.6 17.2 0 q -8.6 -1.6 -17.2 0 Z" fill="#5c3a18"/>
    <ellipse cx="-3.4" cy="-54.6" rx="2.1" ry="1.8" fill="#fca5a5"/>
    <ellipse cx="4.2" cy="-54.4" rx="2.1" ry="1.8" fill="#fca5a5"/>
    <circle cx="-3" cy="-54.6" r="1" fill="#7f1d1d"/>
    <circle cx="4.6" cy="-54.4" r="1" fill="#7f1d1d"/>
    <path d="M -7.6 -57.4 q 4 -2.4 7 -0.6 M 1.8 -57.4 q 3.4 -2 6.8 0.4" fill="none" stroke="#3f2410" stroke-width="1.4" stroke-linecap="round"/>
    ${snort ? `<path d="M 16 -50 q 7 -2 10 1 M 16 -46.6 q 7 0 10 3" fill="none" stroke="#e2e8f0" stroke-width="1.6" opacity="0.6" stroke-linecap="round"/>` : ""}
    <g transform="rotate(${chop - armSwing} 13 -38)">
      <path d="M 10.6 -39 h 6.6 v 20 a 3.3 3.3 0 0 1 -6.6 0 Z" fill="url(#minotaurFur)"/>
      <circle cx="13.9" cy="-17.6" r="3.9" fill="#b0743a"/>
      <rect x="12.4" y="-44" width="3.4" height="28" rx="1.4" fill="url(#woodFill)" transform="rotate(-18 14 -30)"/>
      <path d="M 12 -46 q 16 -8 22 4 q -11 -2 -14 4 q -4 -6 -9 -4 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="0.8" transform="rotate(-18 14 -30)"/>
    </g>
  `;
}

function necromancerSprite(swing, strike) {
  const hover = swing * 1.8;
  const sway = swing * 3;
  const cast = -strike * 40;
  const wispGlow = (0.5 + swing * 0.25).toFixed(2);

  return `
    <ellipse cx="0" cy="1" rx="12" ry="3.6" fill="rgba(8, 20, 12, 0.3)"/>
    <circle cx="0" cy="-26" r="24" fill="url(#wraithGlow)" opacity="0.35"/>
    <g transform="translate(0 ${hover})">
      <path d="M -12 0 q -3 -22 3 -32 q 9 -6 18 0 q 6 10 3 32 q -12 3 -24 0 Z" fill="url(#necroRobe)"/>
      <path d="M -11 -2 q 4 -3 7 0 q 4 -3 8 0 q 4 -3 7 0 l 0 2 q -11 3 -22 0 Z" fill="#0b1030"/>
      <path d="M -9 -30 q 9 -5 18 0 l -1.6 8 q -7.4 -3 -15 0 Z" fill="#6366f1" opacity="0.45"/>
      <path d="M 0 -32 v 30" fill="none" stroke="#312e81" stroke-width="1.2" opacity="0.8"/>
      <g transform="rotate(${sway} -8 -30)">
        <path d="M -11.6 -31 q -3.4 7 -2.6 12 q -4.4 1 -5.4 -3 q -1 -6 3.4 -10 Z" fill="#312e81"/>
        <path d="M -17.4 -20 q 3.2 -2.4 6 0 l -0.4 3 q -2.8 2 -5.2 0 Z" fill="#cbd5e1"/>
        <path d="M -17.6 -17.6 l -1.6 3 M -15.4 -17.2 l -0.6 3.4 M -13.2 -17.6 l 1 3" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-linecap="round"/>
      </g>
      <path d="M -9.4 -34.4 q 9.4 -12 18.8 0 q -9.4 -4.6 -18.8 0 Z" fill="#312e81"/>
      <path d="M -7.4 -34 q 7.4 -9 14.8 0 q -7.4 3.6 -14.8 0 Z" fill="#05030f"/>
      <circle cx="-3.2" cy="-34.2" r="2.8" fill="rgba(134, 239, 172, 0.3)"/>
      <circle cx="3.2" cy="-34.2" r="2.8" fill="rgba(134, 239, 172, 0.3)"/>
      <ellipse cx="-3.2" cy="-34.2" rx="1.6" ry="1.3" fill="#86efac"/>
      <ellipse cx="3.2" cy="-34.2" rx="1.6" ry="1.3" fill="#86efac"/>
      <path d="M -6 -22 q 6 3 12 0" fill="none" stroke="#4338ca" stroke-width="1.2" opacity="0.7"/>
      <circle cx="${-15 + sway}" cy="-16" r="2" fill="#86efac" opacity="${wispGlow}"/>
      <circle cx="${16 - sway}" cy="-22" r="1.6" fill="#86efac" opacity="${wispGlow}"/>
      <circle cx="${13 + sway}" cy="-8" r="1.3" fill="#4ade80" opacity="${wispGlow}"/>
      <g transform="rotate(${cast} 9 -30)">
        <path d="M 8.6 -31 q 3.4 7 2.6 12 q 4.4 1 5.4 -3 q 1 -6 -3.4 -10 Z" fill="#3730a3"/>
        <path d="M 11.4 -20 q 3.2 -2.4 6 0 l -0.4 3 q -2.8 2 -5.2 0 Z" fill="#e2e8f0"/>
        <rect x="10.6" y="-48" width="2.8" height="42" rx="1.2" fill="#4a3018"/>
        <path d="M 5.6 -54 q 6.4 -7 12.8 0 q 1.4 7 -6.4 9 q -7.8 -2 -6.4 -9 Z" fill="url(#boneWhite)"/>
        <circle cx="9" cy="-53" r="1.6" fill="#0b1220"/>
        <circle cx="15" cy="-53" r="1.6" fill="#0b1220"/>
        <circle cx="9.2" cy="-53" r="0.7" fill="#86efac"/>
        <circle cx="15.2" cy="-53" r="0.7" fill="#86efac"/>
        <path d="M 8.4 -47.6 q 3.6 2 7.2 0 l -0.6 2.4 q -3 1.4 -6 0 Z" fill="#cbd5e1"/>
        <circle cx="12" cy="-58" r="4.4" fill="#86efac" opacity="${wispGlow}"/>
      </g>
    </g>
  `;
}

function dragonWhelpSprite(swing, strike) {
  const hover = swing * 2.6;
  const flap = swing * 20;
  const breathe = strike;

  return `
    <ellipse cx="0" cy="1" rx="14" ry="3.8" fill="rgba(5, 16, 8, 0.3)"/>
    <g transform="translate(0 ${hover - 4})">
      <path d="M -10 -14 q -16 2 -20 -10 q 7 6 12 4 q 5 -2 8 2 Z" fill="url(#dragonScale)" stroke="#065f46" stroke-width="0.7"/>
      <path d="M -24 -25 l 4 2 -3 4 Z" fill="#34d399"/>
      <g transform="rotate(${-flap} -4 -26)">
        <path d="M -4 -28 q -14 -14 -24 -10 q 5 3 5 7 q -6 0 -8 4 q 11 5 18 0 q 5 -3 9 -1 Z" fill="#059669" stroke="#064e3b" stroke-width="0.8"/>
        <path d="M -8 -28 q -8 -3 -13 0 M -9 -24 q -7 0 -11 4" fill="none" stroke="#6ee7b7" stroke-width="0.8"/>
      </g>
      <g transform="rotate(${flap} 4 -26)">
        <path d="M 4 -28 q 14 -14 24 -10 q -5 3 -5 7 q 6 0 8 4 q -11 5 -18 0 q -5 -3 -9 -1 Z" fill="#10b981" stroke="#064e3b" stroke-width="0.8"/>
        <path d="M 8 -28 q 8 -3 13 0 M 9 -24 q 7 0 11 4" fill="none" stroke="#6ee7b7" stroke-width="0.8"/>
      </g>
      <g transform="rotate(${-swing * 10} -5 -12)">
        <path d="M -7.6 -13 h 5.6 v 10 h -5.6 Z" fill="#047857"/>
        <path d="M -9.4 -3.4 h 8.4 l 1 3.4 h -9.4 Z" fill="#065f46"/>
        <path d="M -9 -1 l -2.4 2.6 M -6 -1 l -1.4 3 M -3.2 -1 l 0.6 2.8" fill="none" stroke="#d1fae5" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      <g transform="rotate(${swing * 10} 5 -12)">
        <path d="M 2 -13 h 5.6 v 10 h -5.6 Z" fill="#059669"/>
        <path d="M 0.8 -3.4 h 8.6 l 1 3.4 h -9.6 Z" fill="#065f46"/>
        <path d="M 1.4 -1 l -2.2 2.6 M 4.4 -1 l -1.2 3 M 7.2 -1 l 0.8 2.8" fill="none" stroke="#d1fae5" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      <path d="M -10 -30 q 10 -6 20 0 l 2 18 q -12 4 -24 0 Z" fill="url(#dragonScale)"/>
      <path d="M -7.6 -24 q 7.6 3 15.2 0 M -8 -19 q 8 3 16 0 M -8 -14 q 8 3 16 0" fill="none" stroke="#a7f3d0" stroke-width="1.4" opacity="0.55"/>
      <path d="M -2 -33 q 2 -6 6 -2 q 10 -4 14 6 q 2 7 -6 9 q -10 1 -14 -5 Z" fill="#10b981"/>
      <path d="M 10 -30 q 10 1 11 7 q -6 4 -12 1 Z" fill="#34d399"/>
      <path d="M -1 -34.6 l 5 -6 1 5 Z M 4 -35.6 l 6 -5 0 5 Z" fill="#065f46"/>
      <ellipse cx="7" cy="-29.4" rx="2" ry="1.7" fill="#fde68a"/>
      <circle cx="7.4" cy="-29.4" r="0.9" fill="#7c2d12"/>
      <path d="M 18 -25.6 q 3 0.6 4 2" fill="none" stroke="#065f46" stroke-width="0.9"/>
      <path d="M 14 -22.6 l 1.4 2.6 1.4 -2.4 Z M 18 -23 l 1 2.4 1.4 -2.2 Z" fill="#f8fafc"/>
      ${breathe > 0.1 ? `
        <path d="M 21 -24 q 12 -5 22 0 q -12 6 -22 0 Z" fill="#fb923c" opacity="${(0.8 * breathe).toFixed(2)}"/>
        <path d="M 22 -24 q 9 -3 16 0 q -9 3.6 -16 0 Z" fill="#fde68a" opacity="${(0.9 * breathe).toFixed(2)}"/>
      ` : ""}
    </g>
  `;
}

function warlordSprite(swing, strike) {
  const legSwing = swing * 9;
  const armSwing = swing * 8;
  const cleave = -strike * 74;

  return `
    <ellipse cx="0" cy="3" rx="34" ry="9" fill="rgba(5, 16, 8, 0.38)"/>
    <path d="M -22 -74 q 22 -8 44 0 q 10 34 4 62 q -12 -8 -24 -2 q -12 -6 -24 2 q -6 -28 0 -62 Z" fill="#7f1d1d" opacity="0.9"/>
    <g transform="rotate(${legSwing} 13 -34)">
      <path d="M 5 -36 h 17 v 26 h -17 Z" fill="#2f5418"/>
      <path d="M 4 -22 h 19 v 7 h -19 Z" fill="url(#bossPlate)"/>
      <path d="M 2.6 -11 h 22 a 3 3 0 0 1 3 3 v 3 a 2.6 2.6 0 0 1 -2.6 2.6 h -22.4 Z" fill="url(#monsterLeather)"/>
    </g>
    <g transform="rotate(${-legSwing} -13 -34)">
      <path d="M -22 -36 h 17 v 26 h -17 Z" fill="#487327"/>
      <path d="M -23 -22 h 19 v 7 h -19 Z" fill="url(#bossPlate)"/>
      <path d="M -27.4 -11 h 22.4 a 2.6 2.6 0 0 1 2.6 2.6 v 3.4 a 2.6 2.6 0 0 1 -2.6 2.6 h -22.4 Z" fill="url(#monsterLeather)"/>
    </g>
    <g transform="rotate(${armSwing} -26 -66)">
      <path d="M -33 -68 h 12 v 34 a 6 6 0 0 1 -12 0 Z" fill="#487327"/>
      <path d="M -33.4 -54 q 6 -3 12 0 l -0.8 7 q -5.2 3 -10.4 0 Z" fill="url(#bossPlate)"/>
      <circle cx="-27" cy="-32" r="6.6" fill="#5c8a33"/>
    </g>
    <path d="M -25 -72 q 25 -10 50 0 l 6 38 q -31 8 -62 0 Z" fill="url(#orcSkin)"/>
    <path d="M -24 -71 q 24 -9 48 0 l 2 10 q -26 -8 -52 0 Z" fill="#7ba849" opacity="0.4"/>
    <path d="M -20 -68 q 20 -7 40 0 l 3 22 q -23 7 -46 0 Z" fill="url(#bossPlate)" opacity="0.92"/>
    <path d="M -20 -68 q 20 -7 40 0 l 0.6 4 q -20.6 -6 -41.2 0 Z" fill="#fde68a" opacity="0.55"/>
    <path d="M 0 -66 v 24 M -11 -64 v 21 M 11 -64 v 21" fill="none" stroke="#7c3f08" stroke-width="1.4" opacity="0.7"/>
    <circle cx="0" cy="-56" r="6" fill="#7f1d1d" stroke="#fbbf24" stroke-width="1.6"/>
    <path d="M -3.4 -58.4 q 3.4 4 6.8 0 q -3.4 6 -6.8 0 Z" fill="#fde68a"/>
    <path d="M -27 -42 h 54 v 8 h -54 Z" fill="#43301b"/>
    <path d="M -6 -41 a 6 6 0 0 1 12 0 q 1 7 -6 9 q -7 -2 -6 -9 Z" fill="#e8e3cf"/>
    <circle cx="-2.6" cy="-39" r="1.4" fill="#3f3a2a"/>
    <circle cx="2.6" cy="-39" r="1.4" fill="#3f3a2a"/>
    <path d="M -16 -82 q 16 -12 32 0 q 3 16 -16 21 q -19 -5 -16 -21 Z" fill="url(#orcSkin)"/>
    <path d="M -18 -80 q 18 -16 36 0 q 2 6 1 10 q -19 -10 -38 0 q -1 -4 1 -10 Z" fill="url(#bossPlate)"/>
    <path d="M -18 -78 q -10 -10 -6 -20 q 8 6 10 14 Z M 18 -78 q 10 -10 6 -20 q -8 6 -10 14 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
    <path d="M -4.4 -86 l 4.4 -14 4.4 14 Z" fill="#b91c1c" stroke="#7c3f08" stroke-width="0.8"/>
    <path d="M -13 -73 q 6 -3 11 -0.6 M 2 -73.4 q 5 -2.4 11 0.4" fill="none" stroke="#7c3f08" stroke-width="1.6"/>
    <ellipse cx="-6.6" cy="-69.6" rx="3" ry="2.4" fill="#fecaca"/>
    <ellipse cx="6.6" cy="-69.6" rx="3" ry="2.4" fill="#fecaca"/>
    <circle cx="-6.2" cy="-69.6" r="1.4" fill="#7f1d1d"/>
    <circle cx="7" cy="-69.6" r="1.4" fill="#7f1d1d"/>
    <path d="M -10 -62 q 10 5 20 0 q -10 8 -20 0 Z" fill="#22400e"/>
    <path d="M -8.6 -61.6 q -3 -7.4 2.6 -10 q 2.2 5.2 0.8 10.4 Z M 8.6 -61.6 q 3 -7.4 -2.6 -10 q -2.2 5.2 -0.8 10.4 Z" fill="#f8fafc"/>
    <g transform="rotate(${cleave - armSwing} 26 -66)">
      <path d="M 21 -68 h 12 v 34 a 6 6 0 0 1 -12 0 Z" fill="url(#orcSkin)"/>
      <path d="M 21 -54 q 6 -3 12 0 l -0.8 7 q -5.2 3 -10.4 0 Z" fill="url(#bossPlate)"/>
      <circle cx="27" cy="-32" r="6.8" fill="#67973c"/>
      <rect x="24.6" y="-40" width="5" height="46" rx="2" fill="#4a3018" transform="rotate(-28 27 -32)"/>
      <g transform="rotate(-28 27 -32)">
        <path d="M 27 -74 q 26 -6 32 14 q -18 -4 -22 6 q -7 -10 -14 -10 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="1.1"/>
        <path d="M 27 -74 q -22 -6 -28 14 q 16 -4 20 6 q 6 -10 12 -10 Z" fill="#b7c1ce" stroke="#5c6675" stroke-width="1.1"/>
        <path d="M 34 -70 q 12 2 16 10 M 20 -70 q -10 2 -13 10" fill="none" stroke="#64748b" stroke-width="1"/>
      </g>
    </g>
  `;
}

function boneTyrantSprite(swing, strike) {
  const legSwing = swing * 10;
  const armSwing = swing * 8;
  const reap = strike * 62;
  const soulGlow = (0.5 + swing * 0.25).toFixed(2);

  return `
    <ellipse cx="0" cy="3" rx="32" ry="8.6" fill="rgba(5, 16, 8, 0.36)"/>
    <circle cx="0" cy="-56" r="44" fill="url(#wraithGlow)" opacity="0.3"/>
    <path d="M -24 -76 q 24 -10 48 0 q 8 38 2 66 q -14 -10 -26 -2 q -12 -8 -26 2 q -6 -28 2 -66 Z" fill="#1e1b4b" opacity="0.88"/>
    <g transform="rotate(${legSwing} 12 -34)">
      <rect x="6" y="-38" width="7" height="30" rx="3" fill="url(#boneWhite)"/>
      <rect x="15" y="-38" width="5" height="30" rx="2.4" fill="#dbe2ea"/>
      <path d="M 3.6 -9 h 18 a 2.6 2.6 0 0 1 2.6 2.6 v 2.6 a 2.2 2.2 0 0 1 -2.2 2.2 h -18.4 Z" fill="#e2e8f0"/>
    </g>
    <g transform="rotate(${-legSwing} -12 -34)">
      <rect x="-13" y="-38" width="7" height="30" rx="3" fill="#dbe2ea"/>
      <rect x="-20" y="-38" width="5" height="30" rx="2.4" fill="#cbd5e1"/>
      <path d="M -22.4 -9 h 18.4 a 2.2 2.2 0 0 1 2.2 2.2 v 2.6 a 2.2 2.2 0 0 1 -2.2 2.2 h -18.4 Z" fill="#cbd5e1"/>
    </g>
    <g transform="rotate(${armSwing} -24 -66)">
      <rect x="-28" y="-68" width="7" height="32" rx="3" fill="#dbe2ea"/>
      <path d="M -30 -37 q 5.5 -3 11 0 l -1 7 q -4.5 2.6 -9 0 Z" fill="#e2e8f0"/>
      <path d="M -30 -30 l -3 7 3 -2 M -26 -30 l 0 7.6 2 -2.4 M -22.4 -30.4 l 3 6.4 0.6 -3" fill="none" stroke="#f1f5f9" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <path d="M -14 -40 h 28 l -3 10 h -22 Z" fill="url(#boneWhite)"/>
    <rect x="-3.4" y="-70" width="6.8" height="30" rx="2.6" fill="url(#boneWhite)"/>
    <path d="M -15 -68 q 15 6 30 0 M -15.4 -61 q 15.4 6 30.8 0 M -14.6 -54 q 14.6 6 29.2 0 M -13 -47 q 13 5 26 0" fill="none" stroke="#eef2f7" stroke-width="4.4" stroke-linecap="round"/>
    <rect x="-24" y="-74" width="48" height="7" rx="3.4" fill="#cbd5e1"/>
    <circle cx="0" cy="-58" r="7" fill="#86efac" opacity="${soulGlow}"/>
    <circle cx="0" cy="-58" r="3.4" fill="#dcfce7"/>
    <ellipse cx="0" cy="-88" rx="14" ry="13" fill="url(#boneWhite)"/>
    <path d="M -10 -80 q 10 6 20 0 l -1.4 7 q -8.6 4 -17.2 0 Z" fill="#e2e8f0"/>
    <path d="M -8.6 -78 v 6 M -4 -77 v 6.4 M 1 -77 v 6.4 M 5.6 -78 v 6" fill="none" stroke="#94a3b8" stroke-width="1.2"/>
    <ellipse cx="-5.4" cy="-90" rx="4.2" ry="4.6" fill="#05030f"/>
    <ellipse cx="5.4" cy="-90" rx="4.2" ry="4.6" fill="#05030f"/>
    <circle cx="-5" cy="-89.6" r="2" fill="#86efac" opacity="${soulGlow}"/>
    <circle cx="5.8" cy="-89.6" r="2" fill="#86efac" opacity="${soulGlow}"/>
    <path d="M 0 -85 l -2.6 4.4 h 5.2 Z" fill="#334155"/>
    <path d="M -15 -96 q 15 -10 30 0 l 2 -12 -7 5 -5 -9 -5 9 -5 -9 -5 9 -7 -5 Z" fill="url(#bossPlate)" stroke="#7c3f08" stroke-width="1"/>
    <circle cx="0" cy="-104" r="2.6" fill="#86efac"/>
    <circle cx="-11" cy="-100" r="2" fill="#fca5a5"/>
    <circle cx="11" cy="-100" r="2" fill="#fca5a5"/>
    <g transform="rotate(${reap - armSwing} 24 -66)">
      <rect x="21" y="-68" width="7" height="32" rx="3" fill="url(#boneWhite)"/>
      <path d="M 20 -37 q 5.5 -3 11 0 l -1 7 q -4.5 2.6 -9 0 Z" fill="#f1f5f9"/>
      <rect x="23" y="-100" width="4" height="70" rx="2" fill="#4a3018"/>
      <path d="M 25 -100 q 26 4 30 26 q -10 -16 -28 -14 q -6 -4 -2 -12 Z" fill="url(#monsterIron)" stroke="#5c6675" stroke-width="1.1"/>
      <path d="M 27 -96 q 18 6 23 20" fill="none" stroke="#94a3b8" stroke-width="1"/>
    </g>
  `;
}

function elderWyrmSprite(swing, strike) {
  const flap = swing * 16;
  const neckSway = swing * 3;
  const breathe = strike;

  return `
    <ellipse cx="0" cy="3" rx="40" ry="10" fill="rgba(5, 16, 8, 0.38)"/>
    <path d="M -26 -30 q -30 6 -40 -18 q 14 12 24 7 q 10 -5 16 5 Z" fill="url(#wyrmScale)" stroke="#3b0764" stroke-width="1"/>
    <path d="M -62 -50 l 8 4 -6 8 Z" fill="#f0abfc"/>
    <path d="M -46 -42 l 5 -7 2 7 Z M -34 -36 l 4 -7 3 7 Z" fill="#c026d3"/>
    <g transform="rotate(${-flap} -14 -62)">
      <path d="M -14 -66 q -34 -30 -54 -20 q 12 6 12 15 q -14 0 -18 9 q 24 12 40 0 q 11 -8 20 -4 Z" fill="#7e22ce" stroke="#3b0764" stroke-width="1.2"/>
      <path d="M -22 -64 q -18 -8 -30 0 M -22 -56 q -16 0 -24 9" fill="none" stroke="#d8b4fe" stroke-width="1.2"/>
    </g>
    <g transform="rotate(${flap} 14 -62)">
      <path d="M 14 -66 q 34 -30 54 -20 q -12 6 -12 15 q 14 0 18 9 q -24 12 -40 0 q -11 -8 -20 -4 Z" fill="#9333ea" stroke="#3b0764" stroke-width="1.2"/>
      <path d="M 22 -64 q 18 -8 30 0 M 22 -56 q 16 0 24 9" fill="none" stroke="#d8b4fe" stroke-width="1.2"/>
    </g>
    <g transform="rotate(${-swing * 6} -14 -26)">
      <path d="M -20 -28 h 13 v 22 h -13 Z" fill="#6b21a8"/>
      <path d="M -24 -7 h 19 l 2 7 h -21 Z" fill="#581c87"/>
      <path d="M -23 -2 l -5 5 M -18 -1.6 l -3 6 M -12 -1.6 l 1 6" fill="none" stroke="#f5d0fe" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g transform="rotate(${swing * 6} 14 -26)">
      <path d="M 7 -28 h 13 v 22 h -13 Z" fill="#7e22ce"/>
      <path d="M 5 -7 h 19 l 2 7 h -21 Z" fill="#581c87"/>
      <path d="M 6 -2 l -5 5 M 11 -1.6 l -3 6 M 17 -1.6 l 1 6" fill="none" stroke="#f5d0fe" stroke-width="2" stroke-linecap="round"/>
    </g>
    <path d="M -24 -66 q 24 -14 48 0 l 5 40 q -29 9 -58 0 Z" fill="url(#wyrmScale)"/>
    <path d="M -18 -54 q 18 7 36 0 M -19 -44 q 19 7 38 0 M -18 -34 q 18 6 36 0" fill="none" stroke="#f5d0fe" stroke-width="2.2" opacity="0.5"/>
    <path d="M -14 -62 q 14 -8 28 0 l 3 26 q -17 6 -34 0 Z" fill="#fbcfe8" opacity="0.45"/>
    <g transform="translate(${neckSway} 0)">
      <path d="M -10 -68 q -2 -22 14 -30 q 16 -6 22 6 q -14 -2 -20 8 q -6 10 -4 18 Z" fill="url(#wyrmScale)"/>
      <path d="M 2 -96 l 2 -9 4 8 Z M 12 -98 l 3 -8 3 8 Z" fill="#c026d3"/>
      <path d="M 10 -100 q 18 -6 26 6 q 6 10 -4 15 q -14 4 -22 -4 q -6 -8 0 -17 Z" fill="url(#wyrmScale)"/>
      <path d="M 30 -96 q 16 2 18 10 q -10 6 -20 2 Z" fill="#e879f9"/>
      <path d="M 14 -102 q -6 -12 -1 -18 q 6 6 7 16 Z M 24 -104 q 2 -14 9 -16 q 0 9 -4 16 Z" fill="#f0abfc" stroke="#86198f" stroke-width="0.9"/>
      <ellipse cx="26" cy="-93" rx="3.4" ry="2.8" fill="#fde68a"/>
      <circle cx="26.8" cy="-93" r="1.5" fill="#7c2d12"/>
      <path d="M 15 -100 q 6 -3 11 -0.6" fill="none" stroke="#86198f" stroke-width="1.4"/>
      <path d="M 34 -88 l 2 4 2.6 -3.4 Z M 40 -87 l 1.6 3.4 2.4 -2.8 Z" fill="#f8fafc"/>
      ${breathe > 0.1 ? `
        <path d="M 44 -88 q 24 -10 44 2 q -24 12 -44 -2 Z" fill="#fb923c" opacity="${(0.85 * breathe).toFixed(2)}"/>
        <path d="M 46 -88 q 18 -6 32 1 q -18 8 -32 -1 Z" fill="#fde68a" opacity="${(0.9 * breathe).toFixed(2)}"/>
      ` : ""}
    </g>
  `;
}

function ironhideJuggernautSprite(swing, strike) {
  const legSwing = swing * 6;
  const armSwing = swing * 5;
  const slam = strike * 40;
  const furnace = (0.55 + Math.abs(swing) * 0.35).toFixed(2);

  return `
    <ellipse cx="0" cy="2" rx="25" ry="6.2" fill="rgba(5, 16, 8, 0.36)"/>
    <g transform="rotate(${legSwing} 11 -26)">
      <path d="M 4 -30 h 15 l 2 18 -2 12 h -15 Z" fill="url(#juggerHide)"/>
      <path d="M 4 -23 h 15 v 7 h -15 Z" fill="url(#juggerIron)"/>
      <path d="M 2 -3 h 20 a 2.4 2.4 0 0 1 2.4 2.4 v 3 h -24.8 Z" fill="#1c2534"/>
    </g>
    <g transform="rotate(${-legSwing} -11 -26)">
      <path d="M -19 -30 h 15 l -2 18 2 12 h -15 Z" fill="#8a5b30"/>
      <path d="M -19 -23 h 15 v 7 h -15 Z" fill="#54637a"/>
      <path d="M -22.4 -3 h 20 v 5.4 h -22.4 a 2.4 2.4 0 0 1 2.4 -5.4 Z" fill="#141c29"/>
    </g>
    <g transform="rotate(${armSwing} -22 -52)">
      <path d="M -28 -54 h 11 v 26 a 5.5 5.5 0 0 1 -11 0 Z" fill="#8a5b30"/>
      <path d="M -29 -30 a 6 6 0 0 0 13 0 v -4 h -13 Z" fill="url(#juggerIron)"/>
      <path d="M -27 -44 h 9 v 5 h -9 Z" fill="#54637a"/>
    </g>
    <path d="M -21 -60 q 21 -10 42 0 l 5 34 q -26 8 -52 0 Z" fill="url(#juggerHide)"/>
    <path d="M -18 -58 q 18 -8 36 0 l 3 20 q -21 7 -42 0 Z" fill="url(#juggerIron)"/>
    <path d="M -17.4 -57.4 q 17.4 -7 34.8 0 l 0.8 6 q -18 -5.4 -36.4 0 Z" fill="#e2e8f0" opacity="0.4"/>
    <path d="M -12 -46 h 7 v 9 h -7 Z M 5 -46 h 7 v 9 h -7 Z" fill="#f97316" opacity="${furnace}"/>
    <path d="M -12 -46 h 7 v 9 h -7 Z M 5 -46 h 7 v 9 h -7 Z" fill="none" stroke="#3b2a14" stroke-width="1"/>
    <path d="M -14 -33 q 14 6 28 0 l -2 6 q -12 5 -24 0 Z" fill="#3a2a16"/>
    <path d="M -22 -62 q 12 -9 24 -3 q -12 1 -22 6 Z" fill="#9aa8bc"/>
    <path d="M -26 -60 a 13 9 0 0 1 20 -5 l 2 8 q -12 3 -22 1 Z" fill="url(#juggerIron)" stroke="#3f4a5c" stroke-width="1"/>
    <path d="M 26 -60 a 13 9 0 0 0 -20 -5 l -2 8 q 12 3 22 1 Z" fill="url(#juggerIron)" stroke="#3f4a5c" stroke-width="1"/>
    <path d="M -24 -63 l -5 -6 6 1 Z M 24 -63 l 5 -6 -6 1 Z" fill="#cbd5e1"/>
    <path d="M -7 -66 h 14 v 8 h -14 Z" fill="#7a5028"/>
    <path d="M -11 -78 q 11 -6 22 0 l 1 12 q -12 5 -24 0 Z" fill="url(#juggerIron)"/>
    <path d="M -10.4 -77.4 q 10.4 -5 20.8 0 l 0.4 3.6 q -11 -4 -21.6 0 Z" fill="#e2e8f0" opacity="0.45"/>
    <path d="M -8 -70 h 16 v 3.4 h -16 Z" fill="#111827"/>
    <path d="M -6 -69.4 h 3 v 2.2 h -3 Z M 3 -69.4 h 3 v 2.2 h -3 Z" fill="#fb923c" opacity="0.95"/>
    <path d="M -11 -74 l -6 2 6 3 Z M 11 -74 l 6 2 -6 3 Z" fill="#94a3b8"/>
    <path d="M 0 -80 v -5" fill="none" stroke="#64748b" stroke-width="2.4"/>
    <path d="M 0 -85 l 5 3 -5 3 -5 -3 Z" fill="#f97316" opacity="${furnace}"/>
    <g transform="rotate(${slam - armSwing} 22 -52)">
      <path d="M 17 -54 h 11 v 26 a 5.5 5.5 0 0 1 -11 0 Z" fill="url(#juggerHide)"/>
      <path d="M 16 -30 a 6 6 0 0 0 13 0 v -4 h -13 Z" fill="url(#juggerIron)"/>
      <path d="M 18 -44 h 9 v 5 h -9 Z" fill="#7c8a9e"/>
      <g transform="rotate(-16 30 -32)">
        <rect x="28" y="-44" width="4.6" height="44" rx="2.2" fill="url(#woodFill)"/>
        <path d="M 26 -50 h 17 a 3.6 3.6 0 0 1 3.6 3.6 v 10.4 a 3.6 3.6 0 0 1 -3.6 3.6 h -17 a 3.6 3.6 0 0 1 -3.6 -3.6 v -10.4 a 3.6 3.6 0 0 1 3.6 -3.6 Z" fill="url(#juggerIron)" stroke="#3f4a5c" stroke-width="1.1"/>
        <path d="M 26 -48 h 17 v 3.6 h -17 Z" fill="#e2e8f0" opacity="0.35"/>
        <path d="M 28.6 -40 h 4.6 v 4.6 h -4.6 Z M 36.4 -40 h 4.6 v 4.6 h -4.6 Z" fill="#f97316" opacity="${furnace}"/>
      </g>
    </g>
  `;
}

function obsidianColossusSprite(swing, strike) {
  const legSwing = swing * 5;
  const armSwing = swing * 6;
  const smash = strike * 38;
  const magma = (0.6 + Math.abs(swing) * 0.3).toFixed(2);
  const vent = strike > 0.35 ? 1 : 0;

  return `
    <ellipse cx="0" cy="2" rx="27" ry="6.6" fill="rgba(5, 16, 8, 0.38)"/>
    <g transform="rotate(${legSwing} 12 -28)">
      <path d="M 4 -32 h 17 l 3 20 -3 14 h -17 Z" fill="url(#obsidianRock)"/>
      <path d="M 7 -26 l 9 8 -6 6" fill="none" stroke="url(#obsidianMagma)" stroke-width="2.2" opacity="${magma}"/>
      <path d="M 1 -3 h 23 a 3 3 0 0 1 3 3 v 3.4 h -26 Z" fill="#070d18"/>
    </g>
    <g transform="rotate(${-legSwing} -12 -28)">
      <path d="M -21 -32 h 17 l -3 20 3 14 h -17 Z" fill="#161f2e"/>
      <path d="M -17 -26 l -8 9 6 6" fill="none" stroke="url(#obsidianMagma)" stroke-width="2" opacity="${magma}"/>
      <path d="M -27 -3 h 23 v 6.4 h -26 a 3 3 0 0 1 3 -6.4 Z" fill="#050a13"/>
    </g>
    <g transform="rotate(${armSwing} -24 -56)">
      <path d="M -31 -58 h 12 v 28 a 6 6 0 0 1 -12 0 Z" fill="#161f2e"/>
      <path d="M -32 -32 a 7 7 0 0 0 14 0 v -5 h -14 Z" fill="url(#obsidianRock)"/>
      <path d="M -28 -50 l 4 8 -4 7" fill="none" stroke="url(#obsidianMagma)" stroke-width="2" opacity="${magma}"/>
    </g>
    <path d="M -23 -66 q 23 -11 46 0 l 5 38 q -28 9 -56 0 Z" fill="url(#obsidianRock)"/>
    <path d="M -22 -65 q 22 -9 44 0 l 1 7 q -23 -7 -46 0 Z" fill="#6b7a94" opacity="0.4"/>
    <path d="M -14 -60 l 6 14 -8 10 6 12" fill="none" stroke="url(#obsidianMagma)" stroke-width="3" opacity="${magma}" stroke-linecap="round"/>
    <path d="M 13 -60 l -5 16 8 9 -5 11" fill="none" stroke="url(#obsidianMagma)" stroke-width="2.6" opacity="${magma}" stroke-linecap="round"/>
    <path d="M -4 -52 q 10 8 2 18" fill="none" stroke="#fbbf24" stroke-width="2" opacity="${magma}"/>
    <path d="M -28 -66 l -8 -14 14 4 Z M 28 -66 l 8 -14 -14 4 Z" fill="#1f2937"/>
    <path d="M -27 -68 a 14 10 0 0 1 22 -5 l 2 9 q -13 3 -24 1 Z" fill="url(#obsidianRock)" stroke="#0b1120" stroke-width="1.2"/>
    <path d="M 27 -68 a 14 10 0 0 0 -22 -5 l -2 9 q 13 3 24 1 Z" fill="url(#obsidianRock)" stroke="#0b1120" stroke-width="1.2"/>
    <path d="M -24 -72 l -4 -9 8 4 Z M -14 -74 l -2 -10 7 6 Z M 24 -72 l 4 -9 -8 4 Z M 14 -74 l 2 -10 -7 6 Z" fill="#334155"/>
    <path d="M -8 -72 h 16 v 8 h -16 Z" fill="#131c2b"/>
    <path d="M -13 -86 q 13 -8 26 0 l 1 14 q -14 6 -28 0 Z" fill="url(#obsidianRock)"/>
    <path d="M -12 -85 q 12 -6 24 0 l 0.6 4 q -12.6 -5 -25.2 0 Z" fill="#6b7a94" opacity="0.4"/>
    <path d="M -13 -84 l -9 -8 10 0 Z M 13 -84 l 9 -8 -10 0 Z" fill="#475569"/>
    <path d="M -7 -79 h 5.6 v 4 h -5.6 Z M 1.4 -79 h 5.6 v 4 h -5.6 Z" fill="url(#obsidianMagma)" opacity="0.95"/>
    <path d="M -8 -71 q 8 5 16 0 l -2 4 q -6 3 -12 0 Z" fill="#050a13"/>
    <path d="M -5 -71.4 v 3.4 M 0 -70.6 v 3.6 M 5 -71.4 v 3.4" fill="none" stroke="url(#obsidianMagma)" stroke-width="1.2" opacity="${magma}"/>
    ${vent ? `<path d="M -15 -90 q -4 -6 1 -9 M 15 -90 q 4 -6 -1 -9" fill="none" stroke="#fb923c" stroke-width="2" opacity="0.32" stroke-linecap="round"/>` : ""}
    <g transform="rotate(${smash - armSwing} 24 -56)">
      <path d="M 19 -58 h 12 v 28 a 6 6 0 0 1 -12 0 Z" fill="url(#obsidianRock)"/>
      <path d="M 18 -32 a 7 7 0 0 0 14 0 v -5 h -14 Z" fill="#46536b"/>
      <path d="M 24 -50 l 5 9 -5 7" fill="none" stroke="url(#obsidianMagma)" stroke-width="2" opacity="${magma}"/>
      <g transform="rotate(-18 25 -36)">
        <path d="M 16 -44 l 18 -6 10 12 -8 14 -18 2 -6 -12 Z" fill="url(#obsidianRock)" stroke="#070d18" stroke-width="1.4"/>
        <path d="M 22 -40 l 10 -2 4 7 -6 8 -9 1 Z" fill="url(#obsidianMagma)" opacity="${magma}"/>
      </g>
    </g>
  `;
}

function abyssalBehemothSprite(swing, strike) {
  const legSwing = swing * 6;
  const armSwing = swing * 7;
  const lunge = strike * 36;
  const glow = (0.55 + Math.abs(swing) * 0.35).toFixed(2);
  const tentacle = swing * 9;
  const roar = strike > 0.4 ? 1 : 0;

  return `
    <ellipse cx="0" cy="2" rx="28" ry="6.8" fill="rgba(5, 16, 8, 0.38)"/>
    <g transform="rotate(${tentacle} -22 -30)">
      <path d="M -24 -34 q -16 8 -14 22 q 6 -10 16 -12 Z" fill="#0f766e" opacity="0.9"/>
      <circle cx="-32" cy="-16" r="2.2" fill="#5eead4" opacity="${glow}"/>
    </g>
    <g transform="rotate(${-tentacle} 22 -30)">
      <path d="M 24 -34 q 16 8 14 22 q -6 -10 -16 -12 Z" fill="#0f766e" opacity="0.9"/>
      <circle cx="32" cy="-16" r="2.2" fill="#5eead4" opacity="${glow}"/>
    </g>
    <g transform="rotate(${legSwing} 12 -28)">
      <path d="M 4 -32 h 16 l 3 20 -2 14 h -17 Z" fill="url(#abyssHide)"/>
      <path d="M 0 -1 q 12 -6 24 0 l 2 4 h -28 Z" fill="#022c26"/>
      <path d="M 2 0 l 3 -5 M 9 0 l 2 -5 M 16 0 l 2 -5" fill="none" stroke="#99f6e4" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g transform="rotate(${-legSwing} -12 -28)">
      <path d="M -20 -32 h 16 l -2 20 3 14 h -17 Z" fill="#0b5f58"/>
      <path d="M -26 -1 q 12 -6 24 0 l 2 4 h -28 Z" fill="#021f1b"/>
      <path d="M -24 0 l 3 -5 M -17 0 l 2 -5 M -10 0 l 2 -5" fill="none" stroke="#99f6e4" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g transform="rotate(${armSwing} -25 -58)">
      <path d="M -32 -60 h 12 v 30 a 6 6 0 0 1 -12 0 Z" fill="#0b5f58"/>
      <path d="M -34 -32 q 7 -6 15 0 l -2 10 q -5 4 -11 0 Z" fill="url(#abyssHide)"/>
      <path d="M -33 -24 l -4 8 M -27 -22 l -2 9 M -21 -24 l 2 8" fill="none" stroke="#99f6e4" stroke-width="2" stroke-linecap="round"/>
    </g>
    <path d="M -24 -70 q 24 -12 48 0 l 5 40 q -29 10 -58 0 Z" fill="url(#abyssHide)"/>
    <path d="M -22 -68 q 22 -9 44 0 l 1 8 q -23 -8 -46 0 Z" fill="#7dd3c8" opacity="0.35"/>
    <path d="M -16 -60 q 16 7 32 0 M -18 -50 q 18 7 36 0 M -16 -40 q 16 6 32 0" fill="none" stroke="#042f2e" stroke-width="2" opacity="0.45"/>
    <circle cx="-9" cy="-54" r="3.4" fill="#5eead4" opacity="${glow}"/>
    <circle cx="8" cy="-49" r="3" fill="#5eead4" opacity="${glow}"/>
    <circle cx="-4" cy="-38" r="2.6" fill="#5eead4" opacity="${glow}"/>
    <path d="M -26 -70 q -10 -12 0 -20 q 6 10 6 18 Z M 26 -70 q 10 -12 0 -20 q -6 10 -6 18 Z" fill="url(#abyssShell)" stroke="#0e5c6b" stroke-width="1"/>
    <path d="M -28 -68 a 14 10 0 0 1 22 -6 l 2 10 q -13 3 -24 1 Z" fill="url(#abyssShell)" stroke="#0e5c6b" stroke-width="1.2"/>
    <path d="M 28 -68 a 14 10 0 0 0 -22 -6 l -2 10 q 13 3 24 1 Z" fill="url(#abyssShell)" stroke="#0e5c6b" stroke-width="1.2"/>
    <path d="M -8 -76 h 16 v 8 h -16 Z" fill="#0b5f58"/>
    <path d="M -14 -92 q 14 -9 28 0 l 2 14 q -16 7 -32 0 Z" fill="url(#abyssHide)"/>
    <path d="M -13 -91 q 13 -7 26 0 l 0.6 4 q -13.6 -6 -27.2 0 Z" fill="#7dd3c8" opacity="0.4"/>
    <path d="M -14 -90 q -12 -6 -14 -16 q 12 2 17 10 Z M 14 -90 q 12 -6 14 -16 q -12 2 -17 10 Z" fill="url(#abyssShell)" stroke="#0e5c6b" stroke-width="0.9"/>
    <ellipse cx="-6.4" cy="-84" rx="3.4" ry="2.8" fill="#ecfeff"/>
    <ellipse cx="6.4" cy="-84" rx="3.4" ry="2.8" fill="#ecfeff"/>
    <circle cx="-6" cy="-84" r="1.5" fill="#042f2e"/>
    <circle cx="6.8" cy="-84" r="1.5" fill="#042f2e"/>
    <circle cx="0" cy="-90" r="2.2" fill="#5eead4" opacity="${glow}"/>
    <path d="M -10 -77 q 10 6 20 0 l -2 5 q -8 4 -16 0 Z" fill="#021f1b"/>
    <path d="M -7 -77.6 l 1.6 5 M -2.4 -76.6 l 1 5.4 M 2.4 -76.6 l -1 5.4 M 7 -77.6 l -1.6 5" fill="none" stroke="#ecfeff" stroke-width="1.5"/>
    ${roar ? `<path d="M 16 -82 q 14 -6 24 2 q -14 8 -24 -2 Z" fill="#5eead4" opacity="0.4"/>` : ""}
    <g transform="rotate(${lunge - armSwing} 25 -58)">
      <path d="M 20 -60 h 12 v 30 a 6 6 0 0 1 -12 0 Z" fill="url(#abyssHide)"/>
      <path d="M 19 -32 q 7 -6 15 0 l -2 10 q -5 4 -11 0 Z" fill="#0b5f58"/>
      <path d="M 20 -24 l -4 10 M 26 -22 l -1 11 M 32 -24 l 3 10" fill="none" stroke="#99f6e4" stroke-width="2.2" stroke-linecap="round"/>
    </g>
  `;
}

function voidplateTitanSprite(swing, strike) {
  const legSwing = swing * 5;
  const armSwing = swing * 6;
  const cleave = strike * 40;
  const rift = (0.55 + Math.abs(swing) * 0.4).toFixed(2);
  const float = (swing * 1.6).toFixed(2);

  return `
    <ellipse cx="0" cy="2" rx="29" ry="7" fill="rgba(5, 16, 8, 0.4)"/>
    <g transform="rotate(${legSwing} 13 -30)">
      <path d="M 4 -34 h 18 l 3 22 -3 14 h -18 Z" fill="url(#voidFlesh)"/>
      <path d="M 5 -28 h 16 v 9 h -16 Z" fill="url(#voidPlate)"/>
      <path d="M 1 -3 h 24 a 3 3 0 0 1 3 3 v 3.6 h -27 Z" fill="#0b0820"/>
    </g>
    <g transform="rotate(${-legSwing} -13 -30)">
      <path d="M -22 -34 h 18 l -3 22 3 14 h -18 Z" fill="#170f38"/>
      <path d="M -21 -28 h 16 v 9 h -16 Z" fill="#4c2fa8"/>
      <path d="M -28 -3 h 24 v 6.6 h -27 a 3 3 0 0 1 3 -6.6 Z" fill="#070518"/>
    </g>
    <g transform="rotate(${armSwing} -26 -60)">
      <path d="M -33 -62 h 12 v 30 a 6 6 0 0 1 -12 0 Z" fill="#170f38"/>
      <path d="M -34 -34 a 7 7 0 0 0 14 0 v -5 h -14 Z" fill="url(#voidPlate)"/>
      <path d="M -31 -54 h 9 v 6 h -9 Z" fill="#6d28d9"/>
    </g>
    <path d="M -25 -74 q 25 -12 50 0 l 5 42 q -30 10 -60 0 Z" fill="url(#voidFlesh)"/>
    <path d="M -21 -72 q 21 -10 42 0 l 4 26 q -25 8 -50 0 Z" fill="url(#voidPlate)"/>
    <path d="M -20 -71 q 20 -8 40 0 l 1 7 q -21 -7 -42 0 Z" fill="#ddd6fe" opacity="0.4"/>
    <circle cx="-8" cy="-58" r="1.5" fill="#ede9fe"/>
    <circle cx="6" cy="-62" r="1.2" fill="#ede9fe"/>
    <circle cx="10" cy="-52" r="1.4" fill="#ede9fe"/>
    <circle cx="-12" cy="-48" r="1.2" fill="#ede9fe"/>
    <circle cx="2" cy="-46" r="1.6" fill="#ede9fe"/>
    <path d="M 0 -68 q 9 12 0 24 q -9 -12 0 -24 Z" fill="#a78bfa" opacity="${rift}"/>
    <path d="M 0 -64 q 4 8 0 16 q -4 -8 0 -16 Z" fill="#f5f3ff" opacity="${rift}"/>
    <path d="M -17 -36 q 17 7 34 0 l -3 7 q -14 5 -28 0 Z" fill="#0b0820"/>
    <path d="M -30 -74 a 15 11 0 0 1 24 -6 l 2 11 q -14 3 -26 1 Z" fill="url(#voidPlate)" stroke="#1b1745" stroke-width="1.2"/>
    <path d="M 30 -74 a 15 11 0 0 0 -24 -6 l -2 11 q 14 3 26 1 Z" fill="url(#voidPlate)" stroke="#1b1745" stroke-width="1.2"/>
    <path d="M -27 -78 l -3 -10 8 5 Z M 27 -78 l 3 -10 -8 5 Z" fill="#8b5cf6"/>
    <g transform="translate(0 ${float})">
      <path d="M -38 -66 l 7 -5 5 7 -6 6 Z" fill="url(#voidPlate)" opacity="0.85"/>
      <path d="M 38 -66 l -7 -5 -5 7 6 6 Z" fill="url(#voidPlate)" opacity="0.85"/>
      <path d="M -34 -46 l 5 -4 4 6 -5 4 Z" fill="#6d28d9" opacity="0.7"/>
      <path d="M 34 -46 l -5 -4 -4 6 5 4 Z" fill="#6d28d9" opacity="0.7"/>
    </g>
    <path d="M -8 -80 h 16 v 8 h -16 Z" fill="#170f38"/>
    <path d="M -14 -98 q 14 -9 28 0 l 2 16 q -16 7 -32 0 Z" fill="url(#voidPlate)"/>
    <path d="M -13 -97 q 13 -7 26 0 l 0.6 4.4 q -13.6 -6 -27.2 0 Z" fill="#ddd6fe" opacity="0.45"/>
    <path d="M -14 -96 l -10 -14 13 5 Z M 14 -96 l 10 -14 -13 5 Z" fill="url(#voidPlate)" stroke="#1b1745" stroke-width="1"/>
    <path d="M -11 -88 h 22 v 4.4 h -22 Z" fill="#070518"/>
    <path d="M -7.6 -87.4 h 4.4 v 3.2 h -4.4 Z M 3.2 -87.4 h 4.4 v 3.2 h -4.4 Z" fill="#c4b5fd" opacity="${rift}"/>
    <path d="M 0 -100 v -7" fill="none" stroke="#6d28d9" stroke-width="2.6"/>
    <path d="M 0 -107 l 6 4 -6 5 -6 -5 Z" fill="#c4b5fd" opacity="${rift}"/>
    <g transform="rotate(${cleave - armSwing} 26 -60)">
      <path d="M 21 -62 h 12 v 30 a 6 6 0 0 1 -12 0 Z" fill="url(#voidFlesh)"/>
      <path d="M 20 -34 a 7 7 0 0 0 14 0 v -5 h -14 Z" fill="url(#voidPlate)"/>
      <path d="M 22 -54 h 9 v 6 h -9 Z" fill="#8b5cf6"/>
      <g transform="rotate(-20 27 -38)">
        <rect x="25" y="-46" width="4.4" height="34" rx="2" fill="#1b1745"/>
        <path d="M 27 -50 l 16 -22 4 8 -12 20 Z" fill="url(#voidPlate)" stroke="#1b1745" stroke-width="1.2"/>
        <path d="M 28 -50 l 14 -19 1.6 3.4 -11 17 Z" fill="#ede9fe" opacity="0.45"/>
        <path d="M 20 -48 h 16 v 5 h -16 Z" fill="#4c2fa8"/>
      </g>
    </g>
  `;
}

function doomhornLeviathanSprite(swing, strike) {
  const legSwing = swing * 6;
  const armSwing = swing * 7;
  const cleave = strike * 38;
  const ember = (0.6 + Math.abs(swing) * 0.35).toFixed(2);
  const wing = swing * 5;
  const breathe = strike > 0.35 ? 1 : 0;

  return `
    <ellipse cx="0" cy="2" rx="31" ry="7.4" fill="rgba(5, 16, 8, 0.42)"/>
    <g transform="rotate(${wing} -26 -76)">
      <path d="M -26 -78 q -30 -18 -44 -4 q 12 4 14 12 q 10 -6 18 2 q 4 -8 12 -10 Z" fill="#7f1d1d" stroke="#450a0a" stroke-width="1.2"/>
      <path d="M -34 -78 q -14 -4 -22 4 M -30 -72 q -12 0 -18 8" fill="none" stroke="#450a0a" stroke-width="1.4" opacity="0.7"/>
    </g>
    <g transform="rotate(${-wing} 26 -76)">
      <path d="M 26 -78 q 30 -18 44 -4 q -12 4 -14 12 q -10 -6 -18 2 q -4 -8 -12 -10 Z" fill="#991b1b" stroke="#450a0a" stroke-width="1.2"/>
      <path d="M 34 -78 q 14 -4 22 4 M 30 -72 q 12 0 18 8" fill="none" stroke="#450a0a" stroke-width="1.4" opacity="0.7"/>
    </g>
    <path d="M -30 -34 q -24 10 -22 30 q 10 -14 24 -16 Z" fill="url(#doomHide)" stroke="#450a0a" stroke-width="1"/>
    <path d="M -48 -8 l -8 4 6 5 Z" fill="url(#doomHorn)"/>
    <g transform="rotate(${legSwing} 14 -32)">
      <path d="M 4 -36 h 19 l 3 24 -3 15 h -19 Z" fill="url(#doomHide)"/>
      <path d="M 6 -30 h 16 v 9 h -16 Z" fill="#7f1d1d"/>
      <path d="M 0 -1 q 13 -6 26 0 l 2 4.4 h -30 Z" fill="#2c0707"/>
      <path d="M 4 0.6 l 2 -4 M 12 0.6 l 1.4 -4 M 20 0.6 l 2 -4" fill="none" stroke="url(#doomHorn)" stroke-width="1.7" stroke-linecap="round"/>
    </g>
    <g transform="rotate(${-legSwing} -14 -32)">
      <path d="M -23 -36 h 19 l -3 24 3 15 h -19 Z" fill="#8f1616"/>
      <path d="M -22 -30 h 16 v 9 h -16 Z" fill="#611010"/>
      <path d="M -28 -1 q 13 -6 26 0 l 2 4.4 h -30 Z" fill="#1f0505"/>
      <path d="M -24 0.6 l 2 -4 M -16 0.6 l 1.4 -4 M -8 0.6 l 2 -4" fill="none" stroke="#d9a53a" stroke-width="1.7" stroke-linecap="round"/>
    </g>
    <g transform="rotate(${armSwing} -28 -64)">
      <path d="M -35 -66 h 13 v 32 a 6.5 6.5 0 0 1 -13 0 Z" fill="#8f1616"/>
      <path d="M -37 -36 q 8 -6 17 0 l -2 11 q -6 4 -13 0 Z" fill="url(#doomHide)"/>
      <path d="M -35 -26 l -3 7 M -29 -24 l -1 7.6 M -23 -26 l 2 7" fill="none" stroke="url(#doomHorn)" stroke-width="2" stroke-linecap="round"/>
    </g>
    <path d="M -26 -80 q 26 -13 52 0 l 6 46 q -32 11 -64 0 Z" fill="url(#doomHide)"/>
    <path d="M -22 -78 q 22 -10 44 0 l 4 12 q -26 -9 -52 0 Z" fill="#fca5a5" opacity="0.35"/>
    <path d="M -19 -62 q 19 8 38 0 M -21 -52 q 21 8 42 0 M -19 -42 q 19 7 38 0" fill="none" stroke="#450a0a" stroke-width="2.2" opacity="0.5"/>
    <path d="M -13 -66 h 26 l -3 20 -10 6 -10 -6 Z" fill="#2c0707"/>
    <path d="M -9 -62 h 18 l -2 14 -7 4 -7 -4 Z" fill="url(#obsidianMagma)" opacity="${ember}"/>
    <path d="M 0 -60 v 14" fill="none" stroke="#fde68a" stroke-width="1.6" opacity="${ember}"/>
    <path d="M -18 -38 q 18 8 36 0 l -3 8 q -15 6 -30 0 Z" fill="#2c0707"/>
    <path d="M -31 -80 a 16 12 0 0 1 25 -7 l 2 12 q -15 3 -27 1 Z" fill="#7f1d1d" stroke="#450a0a" stroke-width="1.2"/>
    <path d="M 31 -80 a 16 12 0 0 0 -25 -7 l -2 12 q 15 3 27 1 Z" fill="#991b1b" stroke="#450a0a" stroke-width="1.2"/>
    <path d="M -30 -84 l -5 -12 11 5 Z M -18 -88 l -2 -12 8 7 Z M 30 -84 l 5 -12 -11 5 Z M 18 -88 l 2 -12 -8 7 Z" fill="url(#doomHorn)"/>
    <path d="M -9 -86 h 18 v 9 h -18 Z" fill="#8f1616"/>
    <path d="M -15 -104 q 15 -10 30 0 l 2 17 q -17 8 -34 0 Z" fill="url(#doomHide)"/>
    <path d="M -14 -103 q 14 -8 28 0 l 0.8 5 q -14.8 -7 -29.6 0 Z" fill="#fca5a5" opacity="0.4"/>
    <path d="M -15 -102 q -14 -6 -17 -20 q 15 3 21 13 Z M 15 -102 q 14 -6 17 -20 q -15 3 -21 13 Z" fill="url(#doomHorn)" stroke="#78350f" stroke-width="1"/>
    <path d="M -30 -120 l 4 -9 3 9 Z M 30 -120 l -4 -9 -3 9 Z" fill="#fef3c7"/>
    <ellipse cx="-6.8" cy="-95" rx="3.6" ry="3" fill="#fde68a"/>
    <ellipse cx="6.8" cy="-95" rx="3.6" ry="3" fill="#fde68a"/>
    <circle cx="-6.4" cy="-95" r="1.6" fill="#7c2d12"/>
    <circle cx="7.2" cy="-95" r="1.6" fill="#7c2d12"/>
    <path d="M -11 -99 q 5 -3 9 -0.6 M 2 -99 q 4 -2.4 9 0.6" fill="none" stroke="#450a0a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M -11 -87 q 11 7 22 0 l -3 6 q -8 4 -16 0 Z" fill="#1f0505"/>
    <path d="M -7.6 -87.6 l 1.8 5.6 M -2.6 -86.6 l 1 6 M 2.6 -86.6 l -1 6 M 7.6 -87.6 l -1.8 5.6" fill="none" stroke="#fef3c7" stroke-width="1.6"/>
    ${breathe ? `
      <path d="M 18 -92 q 26 -10 46 2 q -26 12 -46 -2 Z" fill="#fb923c" opacity="0.8"/>
      <path d="M 20 -92 q 18 -6 32 1 q -18 8 -32 -1 Z" fill="#fde68a" opacity="0.85"/>
    ` : ""}
    <g transform="rotate(${cleave - armSwing} 28 -64)">
      <path d="M 22 -66 h 13 v 32 a 6.5 6.5 0 0 1 -13 0 Z" fill="url(#doomHide)"/>
      <path d="M 20 -36 q 8 -6 17 0 l -2 11 q -6 4 -13 0 Z" fill="#8f1616"/>
      <path d="M 22 -26 l -3 7 M 28 -24 l -1 7.6 M 34 -26 l 2 7" fill="none" stroke="url(#doomHorn)" stroke-width="2" stroke-linecap="round"/>
      <g transform="rotate(-14 30 -40)">
        <rect x="27.4" y="-54" width="5" height="44" rx="2.4" fill="#2c0707"/>
        <path d="M 32 -58 q 19 5 19 21 q -11 -8 -19 -6 Z" fill="url(#doomHorn)" stroke="#78350f" stroke-width="1.2"/>
        <path d="M 33 -55 q 14 5 15 15 q -8 -5 -15 -4 Z" fill="#fef3c7" opacity="0.45"/>
        <path d="M 24 -56 h 12 v 5.4 h -12 Z" fill="#611010"/>
      </g>
    </g>
  `;
}

const MONSTER_SPRITES = {
  plague_rat: plagueRatSprite,
  goblin: goblinSprite,
  kobold: koboldSprite,
  skeleton: skeletonSprite,
  wraith: wraithSprite,
  dire_bat: direBatSprite,
  bog_slime: bogSlimeSprite,
  orc: orcSprite,
  giant_spider: giantSpiderSprite,
  rotting_husk: rottingHuskSprite,
  harpy: harpySprite,
  ogre: ogreSprite,
  gnoll: gnollSprite,
  fire_imp: fireImpSprite,
  cave_troll: caveTrollSprite,
  stone_golem: stoneGolemSprite,
  minotaur: minotaurSprite,
  necromancer: necromancerSprite,
  dragon_whelp: dragonWhelpSprite,
  ironhide_juggernaut: ironhideJuggernautSprite,
  obsidian_colossus: obsidianColossusSprite,
  abyssal_behemoth: abyssalBehemothSprite,
  voidplate_titan: voidplateTitanSprite,
  doomhorn_leviathan: doomhornLeviathanSprite,
  warlord: warlordSprite,
  bone_tyrant: boneTyrantSprite,
  elder_wyrm: elderWyrmSprite
};

function enemyHealthColor(hpRatio) {
  if (hpRatio > 0.6) return "#86efac";
  if (hpRatio > 0.3) return "#fde047";
  return "#fca5a5";
}

function lootIconSvg(kind) {
  if (kind === "gem") {
    return `
      <path d="M 0 -9.5 l 8 5.5 -8 11 -8 -11 Z" fill="#22d3ee" stroke="#0e7490" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M 0 -9.5 l -8 5.5 8 3 8 -3 Z" fill="#a5f3fc"/>
      <path d="M 0 -1 l -8 -3 8 10 Z" fill="#67e8f9"/>
      <path d="M -4 -6.4 l 3 -1.6" fill="none" stroke="#ecfeff" stroke-width="1.4" stroke-linecap="round"/>
    `;
  }

  return `
    <circle cx="0" cy="0" r="9" fill="#b45309"/>
    <circle cx="0" cy="-1" r="8" fill="#f59e0b" stroke="#fbbf24" stroke-width="1.2"/>
    <circle cx="0" cy="-1" r="4.6" fill="#fcd34d"/>
    <path d="M -3.4 -4.6 q 3 -2.4 6 -0.8" fill="none" stroke="#fffbeb" stroke-width="1.4" stroke-linecap="round"/>
  `;
}

function renderLootSvg(loot, now) {
  const t = Math.min(1, Math.max(0, (now - loot.bornAt) / LOOT_FLOAT_MS));
  const rise = 40 * (1 - (1 - t) * (1 - t));
  const fade = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
  const pop = t < 0.18 ? 0.55 + (t / 0.18) * 0.6 : 1.15 - Math.min(1, (t - 0.18) / 0.25) * 0.15;

  return `
    <g
      class="combat-loot combat-loot-${loot.kind}"
      transform="translate(${loot.x} ${loot.y - rise}) scale(${(pop * 1.5).toFixed(3)})"
      opacity="${fade.toFixed(3)}"
    >
      <g transform="translate(-15 0)">
        ${lootIconSvg(loot.kind)}
        <text class="combat-loot-amount" x="13" y="5">+${loot.amount}</text>
      </g>
    </g>
  `;
}

const UNIT_STYLE = {
  unarmed_warrior: { tunic: "#a16207", trim: "#854d0e", helmet: "#78716c", weapon: "none" },
  warrior: { tunic: "#64748b", trim: "#475569", helmet: "#94a3b8", weapon: "sword" },
  swordsman: { tunic: "#2563eb", trim: "#1e40af", helmet: "#cbd5e1", weapon: "sword-shield" },
  man_at_arms: { tunic: "#334155", trim: "#1e293b", helmet: "#e2e8f0", weapon: "halberd" },
  musketman: { tunic: "#1e3a8a", trim: "#172554", helmet: "#0f172a", weapon: "musket" },
  lancer: { tunic: "#b45309", trim: "#92400e", helmet: "#a8a29e", weapon: "lance", horse: "#8b5e3c" },
  horseman: { tunic: "#b91c1c", trim: "#7f1d1d", helmet: "#d6d3d1", weapon: "sword", horse: "#6b4226" },
  knight: { tunic: "#cbd5e1", trim: "#94a3b8", helmet: "#f1f5f9", weapon: "lance", horse: "#e7e5e4" },
  gun_cavalry: { tunic: "#14532d", trim: "#052e16", helmet: "#1c1917", weapon: "musket", horse: "#292524" },
  slinger: { tunic: "#ca8a04", trim: "#a16207", helmet: "none", weapon: "sling" },
  archer: { tunic: "#15803d", trim: "#14532d", helmet: "none", weapon: "bow" },
  crossbowman: { tunic: "#166534", trim: "#052e16", helmet: "#57534e", weapon: "crossbow" },
  sniper: { tunic: "#44403c", trim: "#292524", helmet: "#1c1917", weapon: "rifle" }
};

function unitWeaponSvg(weapon, swing, strike) {
  const lunge = (strike * 4).toFixed(1);
  if (weapon === "sword") {
    return `<g transform="translate(${lunge} 0) rotate(${(swing * 8).toFixed(1)} 6 -14)"><line x1="6" y1="-14" x2="15" y2="-21" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/><line x1="7.6" y1="-15.4" x2="9.4" y2="-13" stroke="#a16207" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  if (weapon === "sword-shield") {
    return `
      <g transform="translate(${lunge} 0) rotate(${(swing * 8).toFixed(1)} 6 -14)"><line x1="6" y1="-14" x2="16" y2="-22" stroke="#e2e8f0" stroke-width="2.2" stroke-linecap="round"/><line x1="7.8" y1="-15.6" x2="9.6" y2="-13" stroke="#a16207" stroke-width="2" stroke-linecap="round"/></g>
      <ellipse cx="-7" cy="-12" rx="4.4" ry="5.6" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1.2"/>
    `;
  }
  if (weapon === "halberd") {
    return `<g transform="translate(${lunge} 0)"><line x1="7" y1="-2" x2="10" y2="-26" stroke="#78350f" stroke-width="2"/><path d="M 10 -26 l 5 3 -4.4 4 Z" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8"/></g>`;
  }
  if (weapon === "musket" || weapon === "rifle") {
    const len = weapon === "rifle" ? 20 : 15;
    return `<g transform="translate(${lunge} 0)"><line x1="2" y1="-12" x2="${2 + len}" y2="-14.5" stroke="#292524" stroke-width="2.6" stroke-linecap="round"/><line x1="2" y1="-12" x2="-2" y2="-9" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>${strike > 0.5 ? `<circle cx="${3 + len}" cy="-14.8" r="2.6" fill="#fde047" opacity="0.9"/>` : ""}</g>`;
  }
  if (weapon === "lance") {
    return `<g transform="translate(${lunge} 0)"><line x1="4" y1="-10" x2="22" y2="-15" stroke="#a16207" stroke-width="2" stroke-linecap="round"/><path d="M 22 -15 l 5 1.4 -4.4 2.4 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.7"/></g>`;
  }
  if (weapon === "bow") {
    return `<g transform="translate(${lunge} 0)"><path d="M 8 -22 q 7 8 0 16" fill="none" stroke="#78350f" stroke-width="1.8"/><line x1="8" y1="-22" x2="8" y2="-6" stroke="#e7e5e4" stroke-width="0.9"/></g>`;
  }
  if (weapon === "crossbow") {
    return `<g transform="translate(${lunge} 0)"><line x1="3" y1="-13" x2="14" y2="-13" stroke="#57534e" stroke-width="2.2"/><path d="M 11 -18 q 5 5 0 10" fill="none" stroke="#78350f" stroke-width="1.6"/></g>`;
  }
  if (weapon === "sling") {
    return `<g transform="rotate(${(swing * 24).toFixed(1)} 6 -14)"><path d="M 6 -14 q 6 -4 8 -9" fill="none" stroke="#a16207" stroke-width="1.4"/><circle cx="14" cy="-23" r="2" fill="#78716c"/></g>`;
  }
  return "";
}

function unitFigureSvg(unit, swing, strike) {
  const style = UNIT_STYLE[unit.type];
  const step = (swing * 2.4).toFixed(1);
  const eyes = unit.rebel
    ? `<circle cx="1" cy="-21.4" r="1.3" fill="#ef4444"/><circle cx="4.4" cy="-21.4" r="1.3" fill="#ef4444"/>`
    : `<circle cx="1.4" cy="-21.2" r="0.8" fill="#1c1917"/><circle cx="4.2" cy="-21.2" r="0.8" fill="#1c1917"/>`;
  const helmet =
    style.helmet === "none"
      ? `<path d="M -1.6 -24.6 q 4.4 -3 8 0" fill="none" stroke="${style.trim}" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M -2.4 -23.4 a 5.2 5.2 0 0 1 10 0 Z" fill="${style.helmet}" stroke="${style.trim}" stroke-width="0.8"/>`;

  return `
    <line x1="-2" y1="0" x2="0" y2="-8" stroke="#44403c" stroke-width="2.6" stroke-linecap="round" transform="rotate(${step} 0 -8)"/>
    <line x1="4" y1="0" x2="1.6" y2="-8" stroke="#292524" stroke-width="2.6" stroke-linecap="round" transform="rotate(${-step} 1.6 -8)"/>
    <path d="M -3.4 -8 L -2.6 -17.4 Q 1 -19.4 4.8 -17.4 L 5.6 -8 Q 1 -6.4 -3.4 -8 Z" fill="${style.tunic}" stroke="${style.trim}" stroke-width="1"/>
    <circle cx="2.6" cy="-21" r="4" fill="#eab676"/>
    ${eyes}
    ${helmet}
    ${unitWeaponSvg(style.weapon, swing, strike)}
  `;
}

function unitHorseSvg(style, swing) {
  const gallop = (swing * 3).toFixed(1);
  return `
    <g transform="translate(0 0)">
      <line x1="-9" y1="0" x2="-8" y2="-9" stroke="${style.horse}" stroke-width="2.6" stroke-linecap="round" transform="rotate(${gallop} -8 -9)"/>
      <line x1="8" y1="0" x2="7" y2="-9" stroke="${style.horse}" stroke-width="2.6" stroke-linecap="round" transform="rotate(${-gallop} 7 -9)"/>
      <ellipse cx="0" cy="-11" rx="12" ry="5.4" fill="${style.horse}" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>
      <path d="M 10 -13 q 5 -2 6.4 -7 l 2.6 3 q -1 5 -6 6.6 Z" fill="${style.horse}"/>
      <circle cx="17.6" cy="-18.4" r="3" fill="${style.horse}"/>
      <path d="M -11 -12 q -4 2 -4.6 6" fill="none" stroke="${style.horse}" stroke-width="1.8" stroke-linecap="round"/>
    </g>
  `;
}

function renderUnitSvg(unit, now) {
  const def = UNIT_DEF[unit.type];
  const style = UNIT_STYLE[unit.type];
  const hpRatio = Math.max(0, unit.health / unit.maxHealth);
  const swing = Math.sin((now + unit.id * 311) / 170);
  const strike = unit.lastAttackAt ? Math.max(0, 1 - (now - unit.lastAttackAt) / 300) : 0;
  const mounted = Boolean(def.mounted);
  const height = mounted ? 34 : 27;
  const barY = -(height + 4);

  const figure = mounted
    ? `${unitHorseSvg(style, swing)}<g transform="translate(-1 -9) scale(0.92)">${unitFigureSvg(unit, swing * 0.6, strike)}</g>`
    : unitFigureSvg(unit, swing, strike);

  return `
    <g class="combat-unit combat-unit-${unit.type}${unit.rebel ? " combat-unit-rebel" : ""}" transform="translate(${unit.x} ${unit.y})">
      <ellipse cx="0" cy="1" rx="${mounted ? 13 : 8}" ry="2.6" fill="rgba(15, 23, 42, 0.25)"/>
      <g transform="scale(${unit.facing} 1)">${figure}</g>
      <rect x="-11" y="${barY}" width="22" height="3.4" rx="1.7" fill="rgba(3, 10, 22, 0.66)"/>
      <rect x="-11" y="${barY}" width="${(22 * hpRatio).toFixed(1)}" height="3.4" rx="1.7" fill="${unit.rebel ? "#f87171" : "#7dd3fc"}"/>
    </g>
  `;
}

function renderEnemySvg(enemy, now) {
  const def = ENEMY_DEF[enemy.type];
  const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);
  const barWidth = def.barWidth;
  const barY = -(def.height + 4);
  const swing = Math.sin((now + enemy.id * 227) / 175);
  const strike = enemy.lastAttackAt
    ? Math.max(0, 1 - (now - enemy.lastAttackAt) / 300)
    : 0;

  const barHeight = enemy.isBoss ? 7 : enemy.isElite ? 5.5 : 4;
  const hitWidth = enemy.isBoss ? barWidth + 40 : enemy.isElite ? barWidth + 20 : barWidth + 8;
  const aura = enemy.isBoss
    ? `<circle cx="0" cy="${-def.height / 2}" r="${def.height * 0.78}" fill="url(#bossAura)"/>`
    : enemy.isElite
      ? `<circle cx="0" cy="${-def.height / 2}" r="${def.height * 0.66}" fill="url(#eliteAura)"/>`
      : "";
  const crown = enemy.isBoss
    ? `<text class="combat-boss-name" x="0" y="${barY - 8}" text-anchor="middle">${def.label}</text>`
    : enemy.isElite
      ? `<text class="combat-elite-name" x="0" y="${barY - 7}" text-anchor="middle">${def.label}</text>`
      : "";

  return `
    <g
      class="combat-enemy combat-enemy-${enemy.type}${enemy.isBoss ? " combat-enemy-boss" : ""}"
      transform="translate(${enemy.x} ${enemy.y})"
      data-action="attack-enemy"
      data-enemy-id="${enemy.id}"
      role="button"
      aria-label="Attack ${def.label}"
    >
      ${aura}
      <rect
        class="combat-enemy-hit"
        x="${-hitWidth / 2}"
        y="${-(def.height + 4)}"
        width="${hitWidth}"
        height="${def.height + 8}"
        fill="transparent"
      />
      <g class="combat-enemy-figure" transform="scale(${enemy.facing} 1)">
        ${MONSTER_SPRITES[enemy.type](swing, strike)}
      </g>
      ${crown}
      <rect x="${-barWidth / 2}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="rgba(3, 10, 22, 0.66)"/>
      <rect x="${-barWidth / 2}" y="${barY}" width="${barWidth * hpRatio}" height="${barHeight}" rx="${barHeight / 2}" fill="${enemyHealthColor(hpRatio)}"/>
    </g>
  `;
}

function timberWallSvg(hpRatio) {
  const cracks = hpRatio > 0.6
    ? ""
    : `
      <path d="M -46 -40 l 8 12 -5 9 M 12 -44 l -7 13 6 10" fill="none" stroke="#4a2f14" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    `;
  const breach = hpRatio > 0.3
    ? ""
    : `
      <g transform="rotate(16 34 0)">
        <rect class="palisade-log" x="28" y="-38" width="14" height="42" rx="4"/>
        <polygon class="palisade-tip" points="28,-38 35,-50 42,-38"/>
      </g>
      <path d="M -20 -46 l 9 14 -6 10" fill="none" stroke="#3f2a14" stroke-width="2.4" stroke-linecap="round"/>
    `;

  return `
    <ellipse class="prop-shadow" cx="0" cy="7" rx="84" ry="13"/>
    <rect x="-80" y="-2" width="160" height="9" rx="4" fill="#6b4520"/>
    <g transform="translate(-75 0)">${palisade(9)}</g>
    <rect x="-78" y="-32" width="156" height="6" rx="3" fill="#7b5228" opacity="0.9"/>
    <rect x="-78" y="-14" width="156" height="6" rx="3" fill="#7b5228" opacity="0.9"/>
    ${cracks}
    ${breach}
  `;
}

function stoneWallSvg(hpRatio) {
  const blocks = [];
  for (let row = 0; row < 4; row += 1) {
    const y = -44 + row * 11;
    const startX = -78 + (row % 2 === 0 ? 0 : -13);
    for (let bx = startX; bx < 78; bx += 26) {
      const left = Math.max(bx, -78);
      const right = Math.min(bx + 24, 78);
      if (right - left < 5) continue;
      blocks.push(
        `<rect x="${left}" y="${y}" width="${right - left}" height="9.4" rx="2" fill="url(#stoneFill)" stroke="#67748a" stroke-width="0.9"/>`
      );
    }
  }

  const merlonCount = hpRatio > 0.3 ? 6 : 5;
  const merlons = Array.from({ length: merlonCount }, (_, index) =>
    `<rect x="${-78 + index * 26}" y="-57" width="20" height="15" rx="2.5" fill="url(#golemStone)" stroke="#67748a" stroke-width="0.9"/>`
  ).join("");

  const cracks = hpRatio > 0.6
    ? ""
    : `
      <path d="M -40 -42 l 7 11 -5 9 4 8 M 24 -44 l -6 12 6 9" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
    `;

  const rubble = hpRatio > 0.3
    ? ""
    : `
      <path d="M 52 -42 l 9 6 -3 10 -10 -3 Z" fill="#7f8b9d" opacity="0.5"/>
      <ellipse cx="66" cy="3" rx="11" ry="5" fill="#8c9aad"/>
      <circle cx="60" cy="0" r="5" fill="#a6b2c2" stroke="#67748a" stroke-width="0.8"/>
      <circle cx="72" cy="2" r="4" fill="#94a3b8" stroke="#67748a" stroke-width="0.8"/>
    `;

  return `
    <ellipse class="prop-shadow" cx="0" cy="8" rx="92" ry="14"/>
    <rect x="-86" y="-4" width="172" height="12" rx="4" fill="#5b6879"/>
    ${blocks.join("")}
    ${merlons}
    <rect x="-80" y="-46" width="160" height="5" rx="2.5" fill="#b7c1ce" opacity="0.55"/>
    <rect x="-88" y="-62" width="18" height="70" rx="3" fill="url(#golemStone)" stroke="#67748a" stroke-width="1"/>
    <rect x="70" y="-62" width="18" height="70" rx="3" fill="url(#golemStone)" stroke="#67748a" stroke-width="1"/>
    <path d="M -88 -46 h 18 M -88 -30 h 18 M -88 -14 h 18 M 70 -46 h 18 M 70 -30 h 18 M 70 -14 h 18" fill="none" stroke="#67748a" stroke-width="0.9"/>
    <path d="M -70 -44 q 9 -5 18 -1 q -9 3 -18 1 Z M 14 -44 q 11 -4 20 0 q -10 3 -20 0 Z" fill="#5c7043" opacity="0.7"/>
    <path d="M -34 -2 q 12 -6 24 0 q -12 4 -24 0 Z" fill="#5c7043" opacity="0.55"/>
    ${cracks}
    ${rubble}
  `;
}

function palisadeWallSvg(hpRatio) {
  const backStakes = Array.from({ length: 12 }, (_, index) => {
    const x = -82 + index * 13.6;
    return `<rect class="palisade-back-stake" x="${x.toFixed(1)}" y="-50" width="11" height="54" rx="4"/>`;
  }).join("");

  const stakes = Array.from({ length: 12 }, (_, index) => {
    const x = -76 + index * 12.8;
    return `
      <rect class="palisade-log" x="${x.toFixed(1)}" y="-58" width="12" height="62" rx="4"/>
      <polygon class="palisade-tip" points="${x.toFixed(1)},-58 ${(x + 6).toFixed(1)},-73 ${(x + 12).toFixed(1)},-58"/>
    `;
  }).join("");

  const spikes = [-58, -29, 0, 29, 58]
    .map((x) => {
      const lean = x * 0.2;
      return `<polygon class="palisade-spike" points="${x - 5},-48 ${(x + lean).toFixed(1)},-82 ${x + 5},-46"/>`;
    })
    .join("");

  const braces = Array.from({ length: 4 }, (_, index) => {
    const left = -70 + index * 35;
    const right = left + 35;
    return `<path class="palisade-brace" d="M ${left} -40 L ${right} -24 M ${left} -24 L ${right} -40"/>`;
  }).join("");

  const post = (x) => `
    <rect class="palisade-post" x="${x}" y="-72" width="18" height="78" rx="5"/>
    <polygon class="palisade-tip" points="${x},-72 ${x + 9},-90 ${x + 18},-72"/>
    <rect class="palisade-lash" x="${x - 2}" y="-46" width="22" height="6" rx="3"/>
    <rect class="palisade-lash" x="${x - 2}" y="-22" width="22" height="6" rx="3"/>
  `;

  const cracks = hpRatio > 0.6
    ? ""
    : `
      <path d="M -38 -56 l 7 14 -5 11 M 30 -54 l -6 13 6 12" fill="none" stroke="#4a2f14" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
    `;

  const breach = hpRatio > 0.3
    ? ""
    : `
      <g transform="rotate(19 52 0)">
        <rect class="palisade-log" x="46" y="-54" width="12" height="58" rx="4"/>
        <polygon class="palisade-tip" points="46,-54 52,-68 58,-54"/>
      </g>
      <g transform="rotate(-74 -48 0)">
        <rect class="palisade-log" x="-54" y="-30" width="11" height="34" rx="4"/>
        <polygon class="palisade-tip" points="-54,-30 -48.5,-42 -43,-30"/>
      </g>
      <path d="M -14 -60 l 9 15 -6 12" fill="none" stroke="#3f2a14" stroke-width="2.4" stroke-linecap="round"/>
    `;

  return `
    <ellipse class="prop-shadow" cx="0" cy="8" rx="104" ry="15"/>
    <rect x="-96" y="-6" width="192" height="13" rx="5" fill="#6b4520"/>
    ${backStakes}
    ${stakes}
    ${spikes}
    ${braces}
    <rect class="palisade-rail" x="-88" y="-24" width="176" height="9" rx="4"/>
    <rect class="palisade-rail" x="-88" y="-48" width="176" height="9" rx="4"/>
    ${post(-98)}
    ${post(80)}
    ${cracks}
    ${breach}
  `;
}

function wallLevelSvg(hpRatio) {
  const level = getWallLevel();
  if (level >= 3) return palisadeWallSvg(hpRatio);
  if (level === 2) return stoneWallSvg(hpRatio);
  return timberWallSvg(hpRatio);
}

function renderWallSvg() {
  if (!isWallStanding()) return "";

  const level = getWallLevel();
  const hpRatio = state.wall.health / getWallMaxHp();
  const barWidth = 96;
  const barY = level >= 3 ? -102 : level === 2 ? -76 : -70;

  return `
    <g class="combat-wall" transform="translate(${WALL_POSITION.x} ${WALL_POSITION.y})">
      ${wallLevelSvg(hpRatio)}
      <rect x="${-barWidth / 2}" y="${barY}" width="${barWidth}" height="6" rx="3" fill="rgba(3, 10, 22, 0.66)"/>
      <rect x="${-barWidth / 2}" y="${barY}" width="${barWidth * hpRatio}" height="6" rx="3" fill="${enemyHealthColor(hpRatio)}"/>
    </g>
  `;
}

function renderBoltSvg(bolt) {
  const angle = Math.atan2(bolt.vy, bolt.vx) * (180 / Math.PI);

  if (bolt.kind === "catapult") {
    return `
      <g class="combat-bolt" transform="translate(${bolt.x} ${bolt.y})">
        <circle cx="0" cy="0" r="6.4" fill="#57534e" stroke="#292524" stroke-width="1.4"/>
        <path d="M -2.6 -2.8 q 2.4 -1.6 4.8 0" fill="none" stroke="#a8a29e" stroke-width="1.1"/>
      </g>
    `;
  }

  if (bolt.kind === "cannon") {
    return `
      <g class="combat-bolt" transform="translate(${bolt.x} ${bolt.y})">
        <circle cx="0" cy="0" r="5" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/>
        <circle cx="-1.4" cy="-1.4" r="1.5" fill="#64748b"/>
      </g>
    `;
  }

  if (bolt.kind === "missile") {
    return `
      <g class="combat-bolt" transform="translate(${bolt.x} ${bolt.y}) rotate(${angle})">
        <path d="M -14 0 L -20 -3.4 L -17.5 0 L -20 3.4 Z" fill="#f59e0b"/>
        <path d="M -15.5 0 L -19 -1.6 L -17.6 0 L -19 1.6 Z" fill="#fde047"/>
        <rect x="-13" y="-3" width="17" height="6" rx="3" fill="#e5e7eb" stroke="#6b7280" stroke-width="0.9"/>
        <path d="M 4 -3 L 11 0 L 4 3 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.8"/>
        <path d="M -13 -3 l -3.4 -3 l 0 3 Z M -13 3 l -3.4 3 l 0 -3 Z" fill="#9ca3af"/>
      </g>
    `;
  }

  return `
    <g class="combat-bolt" transform="translate(${bolt.x} ${bolt.y}) rotate(${angle})">
      <line x1="-10" y1="0" x2="8" y2="0" stroke="#6b4a2f" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M 8 0 L 3.2 -2.8 L 3.2 2.8 Z" fill="#94a3b8" stroke="#475569" stroke-width="0.5"/>
      <path d="M -10 0 L -6.5 -1.6 L -6.5 1.6 Z" fill="#cbd5e1"/>
    </g>
  `;
}

function renderBlastSvg(blast, now) {
  const t = Math.min(1, Math.max(0, (now - blast.bornAt) / BLAST_FLASH_MS));
  const radius = blast.radius * (0.35 + 0.65 * t);
  const fade = 1 - t;

  return `
    <g class="combat-blast" transform="translate(${blast.x} ${blast.y})" opacity="${fade.toFixed(3)}">
      <circle cx="0" cy="0" r="${radius.toFixed(1)}" fill="rgba(251, 191, 36, 0.28)" stroke="#f59e0b" stroke-width="3"/>
      <circle cx="0" cy="0" r="${(radius * 0.55).toFixed(1)}" fill="rgba(254, 243, 199, 0.5)"/>
      <circle cx="0" cy="0" r="${(radius * 0.22).toFixed(1)}" fill="#fef3c7"/>
    </g>
  `;
}

function syncCombatLayer() {
  combatLayer = document.querySelector(".combat-layer");
  if (!combatLayer) return;

  const now = performance.now();
  const unitMarkup = combat.units.map((unit) => renderUnitSvg(unit, now)).join("");
  const enemyMarkup = combat.enemies.map((enemy) => renderEnemySvg(enemy, now)).join("");
  const boltMarkup = combat.bolts.map((bolt) => renderBoltSvg(bolt)).join("");
  const blastMarkup = combat.blasts.map((blast) => renderBlastSvg(blast, now)).join("");
  const lootMarkup = combat.loot.map((loot) => renderLootSvg(loot, now)).join("");
  combatLayer.innerHTML = `${renderWallSvg()}${unitMarkup}${enemyMarkup}${boltMarkup}${blastMarkup}${lootMarkup}`;
}

function updateCombat(now) {
  if (state.gameOver) return;

  if (state.tentHealth <= 0) {
    handleGameOver();
    return;
  }

  const deltaSeconds = combat.lastFrameTime
    ? Math.min(0.05, (now - combat.lastFrameTime) / 1000)
    : 0.016;

  updateWaveTiming(now);
  updateCrossbowAim(deltaSeconds);
  updateCrossbow(now);
  updateBolts(deltaSeconds);
  updateLoot(now);
  updateBlasts(now);
  updateUnits(deltaSeconds, now);
  updateMint(deltaSeconds);

  if (combat.phase !== "attack") return;

  updateEnemies(deltaSeconds, now);
}

function combatLoop(now, loopId) {
  if (!combat.loopRunning || loopId !== combatLoopId) return;

  if (state.screen !== "camp") {
    stopCombatLoop();
    return;
  }

  if (!state.gameOver && !state.paused) {
    updateCombat(now);
    syncCombatLayer();
    applyCrossbowAim();
    refreshCombatHud();
  } else if (!state.gameOver && state.paused) {
    refreshCombatHud();
  }

  combat.lastFrameTime = now;
  combat.loopFrame = requestAnimationFrame((frameNow) => combatLoop(frameNow, loopId));
}

function startCombatLoop(resume = false) {
  if (combat.loopRunning || state.screen !== "camp") return;

  combat.loopRunning = true;
  if (!resume) {
    startWaveCycle(performance.now());
  }
  combat.lastFrameTime = 0;
  combatLoopId += 1;
  const loopId = combatLoopId;
  combat.loopFrame = requestAnimationFrame((now) => combatLoop(now, loopId));
}

function stopCombatLoop() {
  combat.loopRunning = false;
  combatLoopId += 1;
  if (combat.loopFrame) {
    cancelAnimationFrame(combat.loopFrame);
    combat.loopFrame = 0;
  }
}

function positionPanelAtScenePoint(panel, vbX, vbY) {
  const scene = document.querySelector(".camp-scene");
  const viewport = document.querySelector(".camp-viewport");
  if (!scene || !viewport || !scene.getScreenCTM) return;

  const ctm = scene.getScreenCTM();
  if (!ctm) return;

  const point = scene.createSVGPoint();
  point.x = vbX;
  point.y = vbY;

  const mapped = point.matrixTransform(ctm);
  const rect = viewport.getBoundingClientRect();
  panel.style.left = `${mapped.x - rect.left}px`;
  panel.style.top = `${mapped.y - rect.top}px`;
}

function syncCampPanel(viewport, selector, isOpen, markup, anchor) {
  const existing = viewport.querySelector(selector);

  if (!isOpen) {
    existing?.remove();
    return;
  }

  let panel = existing;

  if (panel) {
    panel.outerHTML = markup;
    panel = viewport.querySelector(selector);
  } else {
    const slot = document.createElement("div");
    slot.innerHTML = markup;
    panel = slot.firstElementChild;
    if (!panel) return;

    const gameOverOverlay = viewport.querySelector(".game-over-overlay");
    if (gameOverOverlay) {
      viewport.insertBefore(panel, gameOverOverlay);
    } else {
      viewport.appendChild(panel);
    }
  }

  if (panel && anchor) positionPanelAtScenePoint(panel, anchor.x, anchor.y);
}

function syncCampPanels() {
  const viewport = document.querySelector(".camp-viewport");
  if (!viewport) return;

  const tentHit = viewport.querySelector(".tent-hit");
  const crossbowHit = viewport.querySelector(".crossbow-hit");
  const tentUpgrade = viewport.querySelector(".tent-upgrade-button");

  if (tentHit) {
    tentHit.classList.toggle("is-active", state.tentUpgradeOpen);
    tentHit.setAttribute("aria-pressed", String(state.tentUpgradeOpen));
  }

  if (crossbowHit) {
    crossbowHit.classList.toggle("is-active", state.crossbowPanelOpen);
    crossbowHit.setAttribute("aria-pressed", String(state.crossbowPanelOpen));
  }

  if (tentUpgrade) {
    tentUpgrade.classList.toggle("is-open", state.tentUpgradeOpen);
  }

  syncCampPanel(viewport, ".crossbow-panel", state.crossbowPanelOpen, renderCrossbowPanel());
  syncCampPanel(viewport, ".wall-build-button", state.wallPanelOpen, renderWallPanelButton(), WALL_POSITION);

  const firePanelOpen = state.healingFirePanelOpen && state.healingFire;
  syncCampPanel(viewport, ".fire-panel", firePanelOpen, firePanelOpen ? renderHealingFirePanel() : "", HEALING_FIRE_POSITION);

  const buildSlot = state.buildPanelSlot === null ? null : BUILD_SLOTS[state.buildPanelSlot];
  const buildMarkup = buildSlot
    ? getSlotBuilding(state.buildPanelSlot)
      ? renderBuildingPanel(state.buildPanelSlot)
      : renderBuildPanel()
    : "";
  syncCampPanel(viewport, ".build-panel", Boolean(buildSlot), buildMarkup, buildSlot);

  viewport.querySelectorAll(".build-hit").forEach((button) => {
    const isActive = state.buildPanelSlot === Number(button.dataset.slotIndex);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  positionBuildHitButtons();

  refreshCombatHud();
}

function renderBuildHitButtons() {
  return BUILD_SLOTS.map((slot, index) => {
    if (!isBuildSlotOpen(index)) return "";
    const building = getSlotBuilding(index);
    const isActive = state.buildPanelSlot === index;
    const label = building
      ? `Manage ${getBuildingDef(building.id).label}`
      : "Choose a building for this plot";
    return `
      <button
        class="build-hit${isActive ? " is-active" : ""}"
        type="button"
        data-action="select-build-slot"
        data-slot-index="${index}"
        aria-label="${label}"
        aria-pressed="${isActive}"
      ></button>
    `;
  }).join("");
}

function positionBuildHitButtons() {
  document.querySelectorAll(".build-hit").forEach((button) => {
    const slot = BUILD_SLOTS[Number(button.dataset.slotIndex)];
    if (slot) positionPanelAtScenePoint(button, slot.x, slot.y - 26);
  });
}

function renderBuildPanel() {
  const options = BUILDINGS.map((def) => {
    const canAfford = state.coins >= def.cost;
    return `
      <button
        class="build-panel-option${canAfford ? "" : " is-broke"}"
        type="button"
        data-action="build-structure"
        data-building-id="${def.id}"
        ${canAfford ? "" : "disabled"}
        aria-label="Build ${def.label} for ${def.cost} coin"
      >
        <span class="build-panel-option-label">${def.label}</span>
        <span class="build-panel-option-blurb">${def.blurb}</span>
        <span class="build-panel-option-cost">${def.cost} coin</span>
      </button>
    `;
  }).join("");

  return `
    <div class="build-panel" role="dialog" aria-label="Choose a building">
      <p class="build-panel-kicker">Empty Plot</p>
      <div class="build-panel-options">${options}</div>
    </div>
  `;
}

function getBuildingPerkText(building) {
  if (building.id === "theater") {
    return `+${building.level} entertainment · keeps ${building.level * ENTERTAINMENT_TROOPS_PER_LEVEL} troops happy`;
  }
  if (building.id === "farm") {
    return `+${getFarmPopulation(building.level)} population`;
  }
  if (building.id === "mint") {
    return `+${getMintPayout(building.level)} coin every 15 sec`;
  }
  return getBuildingConfig(building.id).summary;
}

function getBuildingNextPerkText(building) {
  if (building.id === "theater") {
    return `+${building.level + 1} entertainment · keeps ${(building.level + 1) * ENTERTAINMENT_TROOPS_PER_LEVEL} troops happy`;
  }
  if (building.id === "farm") {
    return `+${getFarmPopulation(building.level + 1)} population`;
  }
  if (building.id === "mint") {
    return `+${getMintPayout(building.level + 1)} coin every 15 sec`;
  }
  const nextUnits = Object.values(UNIT_DEF)
    .filter((unit) => unit.building === building.id && unit.unlockLevel === building.level + 1)
    .map((unit) => unit.label);
  return nextUnits.length ? `Unlocks ${nextUnits.join(" and ")}` : getBuildingConfig(building.id).summary;
}

function renderTrainUnitButtons(building) {
  const unlocked = Object.entries(UNIT_DEF).filter(
    ([, unit]) => unit.building === building.id && unit.unlockLevel <= building.level
  );
  if (!unlocked.length) return "";

  return unlocked
    .map(([type, unit]) => {
      const popFull = !canTrainUnitType(type);
      const canAfford = state.coins >= unit.cost;
      const disabled = popFull || !canAfford;
      const rangeNote = unit.range ? " · ranged" : "";
      return `
        <button
          class="build-panel-option train-unit-button${disabled ? " is-broke" : ""}"
          type="button"
          data-action="train-unit"
          data-unit-type="${type}"
          ${disabled ? "disabled" : ""}
          aria-label="Make ${unit.label} for ${unit.cost} coin"
        >
          <span class="build-panel-option-label">Make ${unit.label}</span>
          <span class="build-panel-option-blurb">${unit.damage} dmg · ${unit.health} hp · ${formatHp(unit.defense)} def · ${unit.speed} spd${rangeNote}</span>
          <span class="build-panel-option-cost">${popFull ? "Pop full" : `${unit.cost} coin`}</span>
        </button>
      `;
    })
    .join("");
}

function renderBuildingPanel(slotIndex) {
  const building = getSlotBuilding(slotIndex);
  const def = getBuildingDef(building.id);
  const maxed = building.level >= getBuildingMaxLevel(building.id);
  const cost = maxed ? 0 : getBuildingUpgradeCost(building);
  const canAfford = state.coins >= cost;

  const upgradeButton = maxed
    ? `
      <button class="build-panel-option building-upgrade-button" type="button" disabled>
        <span class="build-panel-option-label">Max Level</span>
      </button>
      <button
        class="build-panel-option building-demolish-button"
        type="button"
        data-action="demolish-building"
        aria-label="Delete ${def.label} for ${BUILDING_DEMOLISH_REFUND} coin and clear this plot"
      >
        <span class="build-panel-option-label">Delete Building</span>
        <span class="build-panel-option-blurb">Clears this plot so you can build again</span>
        <span class="build-panel-option-cost">+${BUILDING_DEMOLISH_REFUND} coin</span>
      </button>
    `
    : `
      <button
        class="build-panel-option building-upgrade-button${canAfford ? "" : " is-broke"}"
        type="button"
        data-action="upgrade-building"
        ${canAfford ? "" : "disabled"}
        aria-label="Level up ${def.label} to level ${building.level + 1} for ${cost} coin"
      >
        <span class="build-panel-option-label">Lv up to ${building.level + 1}</span>
        <span class="build-panel-option-blurb">${getBuildingNextPerkText(building)}</span>
        <span class="build-panel-option-cost">${cost} coin</span>
      </button>
    `;

  const rebelWarning = unitsAreRebellious()
    ? `<p class="building-panel-perk building-panel-warning">Troops are rebelling! Need ${getRequiredEntertainment()} entertainment (have ${getEntertainment()}${getGemEntertainment() > 0 ? ` from ${state.gems} gems` : ""}).</p>`
    : "";

  return `
    <div class="build-panel building-panel" role="dialog" aria-label="${def.label}">
      <p class="build-panel-kicker">${def.label} · Level ${building.level}</p>
      <p class="building-panel-perk">${getBuildingPerkText(building)}</p>
      ${rebelWarning}
      <div class="build-panel-options">
        ${renderTrainUnitButtons(building)}
        ${upgradeButton}
      </div>
    </div>
  `;
}

function getWallPanelTitle() {
  const def = getWallDef();
  const thorns = def.retaliation > 0 ? ` · ${def.retaliation} thorns` : "";
  if (!isWallStanding()) {
    if (!isWallUnlocked()) return "Upgrade Tent";
    return `Build Wall · ${def.maxHealth} HP · ${def.defense} def`;
  }
  return `${def.label} · ${formatHp(state.wall.health)}/${def.maxHealth} HP · ${def.defense} def${thorns}`;
}

function renderWallPanelButton() {
  const standing = isWallStanding();
  const locked = !standing && !isWallUnlocked();
  const maxed = standing && isWallMaxed();
  const cost = standing ? getWallUpgradeCost() : WALL_COST;
  const canAfford = state.coins >= cost;
  const next = standing ? getNextWallDef() : null;

  const costLabel = locked
    ? `Needs ${getWallRequirementLabel()}`
    : maxed
      ? "Max Level"
      : standing
        ? `${next.label} · ${cost} coin`
        : `${cost} coin`;

  const ariaLabel = locked
    ? `Upgrade your tent to a ${getWallRequirementLabel()} before building the wall`
    : maxed
      ? "Wall fully upgraded"
      : standing
        ? `Upgrade to ${next.label} for ${cost} coin`
        : `Build wall for ${cost} coin`;

  return `
    <button
      class="wall-build-button${maxed ? " is-built" : ""}${locked ? " is-locked" : ""}${!maxed && !locked && !canAfford ? " is-broke" : ""}"
      type="button"
      data-action="${standing ? "upgrade-wall" : "build-wall"}"
      ${maxed || locked ? "disabled" : ""}
      aria-label="${ariaLabel}"
    >
      <span class="wall-build-face">
        <span class="wall-build-kicker">Crossroads</span>
        <span class="wall-build-title wall-panel-title">${getWallPanelTitle()}</span>
        <span class="wall-build-cost">${costLabel}</span>
      </span>
    </button>
  `;
}

function renderHealingFirePanel() {
  const rows = combat.units.map((unit) => {
    const def = UNIT_DEF[unit.type];
    const healing = Boolean(unit.healing);
    const full = unit.health >= unit.maxHealth;

    return `
      <button
        class="fire-unit-row${healing ? " is-healing" : ""}"
        type="button"
        data-action="send-unit-to-fire"
        data-unit-id="${unit.id}"
        aria-label="${healing ? `Send ${def.label} back to the road` : `Send ${def.label} to the fire to heal`}"
      >
        <span class="fire-unit-name">${def.label}</span>
        <span class="fire-unit-health" data-unit-id="${unit.id}">${formatHp(unit.health)}/${unit.maxHealth} hp</span>
        <span class="fire-unit-state" data-unit-id="${unit.id}">${healing ? "Resting" : full ? "Full" : "Send"}</span>
      </button>
    `;
  }).join("");

  return `
    <div class="fire-panel" role="dialog" aria-label="Healing campfire">
      <p class="fire-panel-kicker">Healing Campfire</p>
      ${combat.units.length
        ? `<div class="fire-panel-units">${rows}</div>`
        : `<p class="fire-panel-empty">No troops trained yet.</p>`}
    </div>
  `;
}

function renderCrossbowPanel() {
  const tier = getWeaponTier();
  const next = getNextWeaponTier();
  const level = state.crossbow.level;
  const damage = getCrossbowDamage();
  const cooldownSec = (getCrossbowCooldownMs() / 1000).toFixed(1);
  const maxed = isCrossbowMaxed();
  const cost = getCrossbowUpgradeCost();
  const canAfford = state.coins >= cost;
  const areaNote = tier.blastRadius > 0 ? " · area dmg" : "";

  const upgradeButton = `
    <button
      class="crossbow-upgrade-button is-open${maxed ? " is-maxed" : ""}${!maxed && !canAfford ? " is-broke" : ""}"
      type="button"
      data-action="upgrade-crossbow"
      ${maxed ? "disabled" : ""}
      aria-label="${maxed ? `${tier.label} maxed` : `Upgrade ${tier.label} for ${cost} coin`}"
    >
      <span class="crossbow-upgrade-face">
        <span class="crossbow-upgrade-kicker">${tier.label}</span>
        <span class="crossbow-upgrade-title">Level ${level} · ${formatHp(damage)} dmg · ${cooldownSec}s${areaNote}</span>
        <span class="crossbow-upgrade-cost">${maxed ? "Max Level" : `${cost} coin`}</span>
      </span>
    </button>
  `;

  const evolveButton = next
    ? `
      <button
        class="crossbow-upgrade-button crossbow-evolve-button is-open${state.coins < tier.evolveCost ? " is-broke" : ""}"
        type="button"
        data-action="evolve-crossbow"
        aria-label="Evolve to ${next.label} for ${tier.evolveCost} coin"
      >
        <span class="crossbow-upgrade-face">
          <span class="crossbow-upgrade-kicker">Evolve</span>
          <span class="crossbow-upgrade-title">${next.label} · ${next.baseDamage} dmg${next.blastRadius > 0 ? " · area dmg" : ""}</span>
          <span class="crossbow-upgrade-cost">${tier.evolveCost} coin</span>
        </span>
      </button>
    `
    : "";

  return `
    <div class="crossbow-panel">
      ${upgradeButton}
      ${evolveButton}
    </div>
  `;
}

function getTentPanelTitle() {
  const def = getTentDef();
  const stats = `${formatHp(state.tentHealth)}/${def.maxHealth} HP · ${def.defense} def · ${def.population} pop`;
  return def.retaliation > 0 ? `${stats} · ${def.retaliation} thorns` : stats;
}

function renderTentUpgradeButton() {
  const def = getTentDef();
  const next = getNextTentDef();
  const maxed = isTentMaxed();
  const cost = getTentUpgradeCost();
  const canAfford = state.coins >= cost;

  return `
    <button
      class="tent-upgrade-button${state.tentUpgradeOpen ? " is-open" : ""}${maxed ? " is-maxed" : ""}${!maxed && !canAfford ? " is-broke" : ""}"
      type="button"
      data-action="upgrade-tent"
      ${maxed ? "disabled" : ""}
      aria-label="${maxed ? `${def.label} fully upgraded` : `Upgrade to ${next.label} for ${cost} coin`}"
    >
      <span class="tent-upgrade-face">
        <span class="tent-upgrade-kicker">${def.kicker}</span>
        <span class="tent-upgrade-title">${getTentPanelTitle()}</span>
        <span class="tent-upgrade-cost">${maxed ? "Max Level" : `${next.label} · ${cost} coin`}</span>
      </span>
    </button>
  `;
}

function renderCamp() {
  template(`
    <div class="camp-viewport">
    <svg class="camp-scene" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Your base at the end of the main road, with four roads leading away past a river, tents, farms and scattered trees">
      ${sceneDefs()}
      <rect class="grass-base" x="0" y="0" width="1600" height="1000"/>
      ${distantHills()}
      ${grassDetail()}
      ${riverGroup()}
      ${pondGroup()}
      ${roadNetwork()}
      ${riverCrossings()}
      ${signpost()}
      ${villageGroup()}
      ${state.windmill ? windmillGroup() : ""}
      ${watchtowerGroup()}
      ${ruinsGroup()}
      ${state.paddock ? paddockGroup() : ""}
      ${state.mine ? quarryGroup() : ""}
      ${farmGroup()}
      ${sheepFlock(486, 726, 0.62)}
      ${sheepFlock(1232, 700, 0.56)}
      ${campBase()}
      ${scatterSvg()}
      ${wildlife()}
      <g class="combat-layer" aria-hidden="true"></g>
      <rect class="sun-wash" x="0" y="0" width="1600" height="1000"/>
      <g class="crossbow-click" transform="translate(${CROSSBOW_POSITION.x} ${CROSSBOW_POSITION.y})" data-action="select-crossbow">
        <rect class="crossbow-click-area" x="-52" y="-46" width="104" height="92" fill="transparent"/>
      </g>
      <g class="wall-click" transform="translate(${WALL_POSITION.x} ${WALL_POSITION.y})" data-action="select-wall">
        <rect class="wall-click-area" x="-86" y="-56" width="172" height="76" fill="transparent"/>
      </g>
      ${state.healingFire ? `
        <g class="healing-fire-click" transform="translate(${HEALING_FIRE_POSITION.x} ${HEALING_FIRE_POSITION.y})" data-action="select-healing-fire">
          <rect class="healing-fire-click-area" x="-52" y="-32" width="104" height="48" fill="transparent"/>
        </g>
      ` : ""}
    </svg>
    <button class="tent-hit${state.tentUpgradeOpen ? " is-active" : ""}" type="button" data-action="select-tent" aria-label="Select tent" aria-pressed="${state.tentUpgradeOpen}"></button>
    <button class="crossbow-hit${state.crossbowPanelOpen ? " is-active" : ""}" type="button" data-action="select-crossbow" aria-label="Select crossbow" aria-pressed="${state.crossbowPanelOpen}"></button>
    ${renderBuildHitButtons()}
    ${renderTentUpgradeButton()}
    <div class="camp-pause-overlay" ${state.paused ? "" : "hidden"} aria-hidden="${state.paused ? "false" : "true"}">
      <p class="camp-pause-label">Paused</p>
    </div>
    ${state.gameOver ? `
      <div class="game-over-overlay">
        <div class="game-over-panel">
          <p class="game-over-kicker">Defeat</p>
          <h2>Game Over</h2>
          <p>Your base was destroyed. Coins, gems, buildings, and wave progress have been reset.</p>
          <p class="game-over-start">Starting fresh at Wave 1 with ${STARTING_COINS} coin.</p>
          <button class="auth-button" type="button" data-action="dismiss-game-over">Start Again</button>
        </div>
      </div>
    ` : ""}
    </div>
    <div class="camp-hud">
      <div class="camp-hud-identity">
        <span class="camp-hud-crest">${crestSvg()}</span>
        <span class="camp-hud-text">
          <span class="camp-hud-label">Base of</span>
          <span class="camp-hud-name">${escapeHtml(state.username)}</span>
        </span>
      </div>
      <div class="camp-hud-stats">
        <div class="tent-hp-pill" aria-label="Base health">
          <span class="tent-hp-label">HP</span>
          <span class="tent-hp-value">${formatHp(state.tentHealth)}/${getTentMaxHp()}</span>
        </div>
        <div class="population-pill" aria-label="Population">
          <span class="population-label">Pop</span>
          <span class="population-value">${getUnitCount()}/${getTentPopulation()}</span>
        </div>
        <div class="wave-hud-pill" aria-label="Wave status">
          <span class="wave-hud-value">${getWaveHudText()}</span>
        </div>
        <button
          class="camp-hud-button camp-pause-button${state.paused ? " is-paused" : ""}"
          type="button"
          data-action="toggle-pause"
          aria-pressed="${state.paused}"
          ${state.gameOver ? "disabled" : ""}
        >
          ${state.paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div class="camp-hud-right">
        <div class="camp-currency camp-currency-coin" aria-label="Coin balance">
          <span class="camp-currency-icon-wrap camp-currency-icon-wrap-coin">
            <img class="camp-currency-icon" src="coin.png" alt="" width="32" height="32">
          </span>
          <span class="camp-currency-value camp-currency-value-coin">${state.coins}</span>
        </div>
        <div class="camp-currency camp-currency-gem" aria-label="Gem balance">
          <span class="camp-currency-icon-wrap camp-currency-icon-wrap-gem">
            <img class="camp-currency-icon" src="gem.png" alt="" width="32" height="32">
          </span>
          <span class="camp-currency-value camp-currency-value-gem">${state.gems}</span>
        </div>
        <div class="shop-wrap">
          <button
            class="shop-button camp-hud-button${state.shopOpen ? " is-open" : ""}"
            type="button"
            data-action="toggle-shop"
            aria-expanded="${state.shopOpen}"
            aria-haspopup="dialog"
            aria-label="Open shop"
          >
            <span class="shop-button-icons">
              <span class="shop-button-icon-wrap">
                <img class="shop-button-icon" src="coin.png" alt="" width="20" height="20">
              </span>
              <span class="shop-button-icon-wrap shop-button-icon-wrap-gem">
                <img class="shop-button-icon" src="gem.png" alt="" width="20" height="20">
              </span>
            </span>
            Shop
          </button>
          ${renderShopPanel()}
        </div>
        <button class="camp-hud-button" type="button" data-action="show-sign-in">Sign Out</button>
      </div>
    </div>
  `, "camp-screen");

  syncCampPanels();
  syncCombatLayer();
}

function enterCastle(username, password, savedGame) {
  stopCombatLoop();
  state.username = username;
  state.password = password;
  state.screen = "camp";
  state.error = "";
  state.success = "";
  state.tentUpgradeOpen = false;
  state.crossbowPanelOpen = false;
  state.wallPanelOpen = false;
  state.healingFirePanelOpen = false;
  state.shopOpen = false;
  shopPausedGame = false;
  state.buildPanelSlot = null;

  if (savedGame) {
    applyGameSave(savedGame);
  } else {
    state.coins = STARTING_COINS;
    state.gems = 0;
    state.tentLevel = 1;
    state.tentHealth = getTentMaxHp();
    state.crossbow = createDefaultCrossbow();
    state.wall = null;
    state.buildings = [];
    state.gameOver = false;
    state.paused = false;
    combat.pauseStartedAt = 0;
    resetCombatState();
  }

  writeLocalBackup(username, password, savedGame ?? null);

  render();
  startCombatLoop(Boolean(savedGame));
  startAutoSave();
}

function render() {
  if (state.screen === "loading") return renderStudioIntro();
  if (state.screen === "sign-in") return renderSignIn();
  if (state.screen === "create-account") return renderCreateAccount();
  if (state.screen === "camp") return renderCamp();
}

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  if (actionTarget.dataset.action === "toggle-password") {
    const input = actionTarget.closest(".auth-input-wrap").querySelector("input");
    const revealing = input.type === "password";
    input.type = revealing ? "text" : "password";
    actionTarget.classList.toggle("is-visible", revealing);
    actionTarget.setAttribute("aria-label", revealing ? "Hide password" : "Show password");
    return;
  }

  if (actionTarget.dataset.action === "show-create-account") {
    state.screen = "create-account";
    state.error = "";
    state.success = "";
    render();
    return;
  }

  if (actionTarget.dataset.action === "attack-enemy") {
    if (state.gameOver) return;
    const enemyId = Number(actionTarget.dataset.enemyId);
    if (!Number.isFinite(enemyId)) return;
    damageEnemy(enemyId, 1);
    return;
  }

  if (actionTarget.dataset.action === "select-crossbow") {
    if (state.gameOver) return;
    event.stopPropagation();
    state.crossbowPanelOpen = !state.crossbowPanelOpen;
    state.wallPanelOpen = false;
    state.tentUpgradeOpen = false;
    state.healingFirePanelOpen = false;
    state.buildPanelSlot = null;
    syncCampPanels();
    return;
  }

  if (actionTarget.dataset.action === "select-wall") {
    if (state.gameOver) return;
    event.stopPropagation();
    state.wallPanelOpen = !state.wallPanelOpen;
    state.crossbowPanelOpen = false;
    state.tentUpgradeOpen = false;
    state.healingFirePanelOpen = false;
    state.buildPanelSlot = null;
    syncCampPanels();
    return;
  }

  if (actionTarget.dataset.action === "select-healing-fire") {
    if (state.gameOver) return;
    event.stopPropagation();
    state.healingFirePanelOpen = !state.healingFirePanelOpen;
    state.wallPanelOpen = false;
    state.crossbowPanelOpen = false;
    state.tentUpgradeOpen = false;
    state.buildPanelSlot = null;
    syncCampPanels();
    return;
  }

  if (actionTarget.dataset.action === "send-unit-to-fire") {
    if (state.gameOver || !state.healingFirePanelOpen) return;
    event.stopPropagation();
    sendUnitToHealingFire(Number(actionTarget.dataset.unitId));
    return;
  }

  if (actionTarget.dataset.action === "select-build-slot") {
    if (state.gameOver) return;
    event.stopPropagation();
    const slotIndex = Number(actionTarget.dataset.slotIndex);
    if (!Number.isInteger(slotIndex)) return;
    state.buildPanelSlot = state.buildPanelSlot === slotIndex ? null : slotIndex;
    state.crossbowPanelOpen = false;
    state.wallPanelOpen = false;
    state.tentUpgradeOpen = false;
    state.healingFirePanelOpen = false;
    syncCampPanels();
    return;
  }

  if (actionTarget.dataset.action === "build-structure") {
    if (state.gameOver || state.buildPanelSlot === null) return;
    event.stopPropagation();
    if (buildStructure(state.buildPanelSlot, actionTarget.dataset.buildingId)) {
      state.buildPanelSlot = null;
      render();
      if (state.screen === "camp" && !combat.loopRunning) {
        startCombatLoop(true);
      }
    }
    return;
  }

  if (actionTarget.dataset.action === "upgrade-building") {
    if (state.gameOver || state.buildPanelSlot === null) return;
    event.stopPropagation();
    if (upgradeBuilding(state.buildPanelSlot)) {
      syncCampPanels();
    }
    return;
  }

  if (actionTarget.dataset.action === "demolish-building") {
    if (state.gameOver || state.buildPanelSlot === null) return;
    event.stopPropagation();
    if (demolishBuilding(state.buildPanelSlot)) {
      state.buildPanelSlot = null;
      render();
      if (state.screen === "camp" && !combat.loopRunning) {
        startCombatLoop(true);
      }
    }
    return;
  }

  if (actionTarget.dataset.action === "train-unit") {
    if (state.gameOver || state.buildPanelSlot === null) return;
    event.stopPropagation();
    if (trainUnit(state.buildPanelSlot, actionTarget.dataset.unitType)) {
      syncCampPanels();
    }
    return;
  }

  if (actionTarget.dataset.action === "upgrade-wall") {
    if (state.gameOver || !state.wallPanelOpen) return;
    event.stopPropagation();
    if (upgradeWall()) {
      syncCampPanels();
    }
    return;
  }

  if (actionTarget.dataset.action === "build-wall") {
    if (state.gameOver || !state.wallPanelOpen) return;
    event.stopPropagation();
    if (buildWall()) {
      syncCampPanels();
    }
    return;
  }

  if (actionTarget.dataset.action === "upgrade-crossbow") {
    if (state.gameOver || !state.crossbowPanelOpen) return;
    event.stopPropagation();
    if (upgradeCrossbow()) {
      syncCampPanels();
    }
    return;
  }

  if (actionTarget.dataset.action === "evolve-crossbow") {
    if (state.gameOver || !state.crossbowPanelOpen) return;
    event.stopPropagation();
    if (evolveCrossbow()) {
      render();
      if (state.screen === "camp" && !combat.loopRunning) {
        startCombatLoop(true);
      }
    }
    return;
  }

  if (actionTarget.dataset.action === "upgrade-tent") {
    if (state.gameOver) return;
    event.stopPropagation();
    upgradeTent();
    render();
    return;
  }

  if (actionTarget.dataset.action === "select-tent") {
    if (state.gameOver) return;
    state.tentUpgradeOpen = !state.tentUpgradeOpen;
    state.crossbowPanelOpen = false;
    state.wallPanelOpen = false;
    state.healingFirePanelOpen = false;
    state.buildPanelSlot = null;
    render();
    if (state.screen === "camp" && !combat.loopRunning) {
      startCombatLoop(true);
    }
    return;
  }

  if (actionTarget.dataset.action === "dismiss-game-over") {
    dismissGameOver();
    if (state.screen === "camp" && !combat.loopRunning) {
      startCombatLoop(true);
    }
    return;
  }

  if (actionTarget.dataset.action === "toggle-pause") {
    if (state.gameOver) return;
    event.stopPropagation();
    setPaused(!state.paused);
    return;
  }

  if (actionTarget.dataset.action === "toggle-shop") {
    if (state.gameOver) return;
    event.stopPropagation();
    setShopOpen(!state.shopOpen);
    return;
  }

  if (actionTarget.dataset.action === "show-shop-tab") {
    event.stopPropagation();
    state.shopTab = actionTarget.dataset.shopTab;
    render();
    return;
  }

  if (actionTarget.dataset.action === "run-exchange") {
    if (state.gameOver || !state.shopOpen) return;
    event.stopPropagation();
    runExchange(actionTarget.dataset.offerId);
    return;
  }

  if (actionTarget.dataset.action === "buy-healing-fire") {
    if (state.gameOver || !state.shopOpen) return;
    event.stopPropagation();
    buyHealingFire();
    return;
  }

  if (actionTarget.dataset.action === "buy-mine") {
    if (state.gameOver || !state.shopOpen) return;
    event.stopPropagation();
    buyMine();
    return;
  }

  if (actionTarget.dataset.action === "buy-windmill") {
    if (state.gameOver || !state.shopOpen) return;
    event.stopPropagation();
    buyWindmill();
    return;
  }

  if (actionTarget.dataset.action === "buy-paddock") {
    if (state.gameOver || !state.shopOpen) return;
    event.stopPropagation();
    buyPaddock();
    return;
  }

  if (actionTarget.dataset.action === "show-sign-in") {
    saveAccountProgress();
    stopAutoSave();
    stopCombatLoop();
    state.screen = "sign-in";
    state.username = "";
    state.password = "";
    state.tentUpgradeOpen = false;
    state.crossbowPanelOpen = false;
    state.wallPanelOpen = false;
    state.healingFirePanelOpen = false;
    state.shopOpen = false;
    shopPausedGame = false;
    state.buildPanelSlot = null;
    state.error = "";
    state.success = "";
    render();
  }
});

window.addEventListener("resize", () => {
  if (state.screen !== "camp") return;
  const wallPanel = document.querySelector(".wall-build-button");
  if (wallPanel) positionPanelAtScenePoint(wallPanel, WALL_POSITION.x, WALL_POSITION.y);
  const buildPanel = document.querySelector(".build-panel");
  const buildSlot = state.buildPanelSlot === null ? null : BUILD_SLOTS[state.buildPanelSlot];
  if (buildPanel && buildSlot) positionPanelAtScenePoint(buildPanel, buildSlot.x, buildSlot.y);
  positionBuildHitButtons();
});

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const username = String(data.get("username") || "").trim();
  const password = String(data.get("password") || "").trim();

  state.error = "";
  state.success = "";

  if (!username || !password) {
    state.error = "Enter both a username and password.";
    render();
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.disabled = true;

  try {
    const account = form.dataset.form === "create-account"
      ? await createAccount(username, password)
      : await signInAccount(username, password);

    enterCastle(account.username, password, account.save);
  } catch (error) {
    if (submitButton) submitButton.disabled = false;
    state.error = error.message;
    render();
  }
});

window.addEventListener("pagehide", flushAccountProgress);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushAccountProgress();
});

render();
restoreLocalBackup();

setTimeout(() => {
  state.screen = "sign-in";
  render();
}, 3400);
