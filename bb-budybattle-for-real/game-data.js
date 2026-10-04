const COINS_PER_DIAMOND = 10;

const SPIN_POTION_ITEMS = [
  { name: "Defense Potion (1 min)", oneGameCoins: 5 * COINS_PER_DIAMOND },
  { name: "Red Glass", oneGameCoins: 2 * COINS_PER_DIAMOND },
  { name: "Water Bottle", oneGameCoins: 15 },
  { name: "Health Potion", oneGameCoins: 20 },
  { name: "Red Glass (game)", oneGameCoins: 20 * COINS_PER_DIAMOND },
  { name: "Defense Potion", oneGameCoins: 25 * COINS_PER_DIAMOND },
  { name: "Fire Resistance Potion", oneGameCoins: 45 * COINS_PER_DIAMOND },
  { name: "Fire Resistance Potion (game)", oneGameCoins: 150 * COINS_PER_DIAMOND }
];

const SPIN_POTION_NAMES = SPIN_POTION_ITEMS.map((entry) => entry.name);

const WEAPON_SHOP_ITEMS = [
  "Fork",
  "Butter Knife",
  "Spoon",
  "Kitchen Knife",
  "Steak Knife",
  "Bread Knife",
  "Katana",
  "Machete",
  "Cleaver",
  "Paring Knife",
  "Rolling Pin",
  "Whisk",
  "Ladle",
  "Tongs",
  "Meat Fork",
  "Peeler",
  "Grater",
  "Corkscrew",
  "Can Opener",
  "Ice Pick",
  "Scissors",
  "Letter Opener",
  "Box Cutter",
  "Switchblade",
  "Pocket Knife",
  "Dagger",
  "Rapier",
  "Cutlass",
  "Scimitar",
  "Longsword",
  "Greatsword",
  "Claymore",
  "Sabre",
  "Bowie Knife",
  "Kukri",
  "Bayonet",
  "Hatchet",
  "Battle Axe",
  "Tomahawk",
  "War Hammer",
  "Mace",
  "Flail",
  "Morning Star",
  "Spear",
  "Halberd",
  "Trident",
  "Pitchfork",
  "Crowbar",
  "Pipe Wrench",
  "Sledgehammer",
  "Baseball Bat",
  "Nail Bat",
  "Bo Staff",
  "Nunchaku",
  "Sai",
  "Shuriken",
  "Throwing Knife",
  "Crossbow",
  "Longbow",
  "Slingshot",
  "Blowdart",
  "Pistol",
  "Revolver",
  "SMG",
  "Shotgun",
  "Assault Rifle",
  "Sniper Rifle",
  "Automatic Rifle",
  "Energy Pistol",
  "BB Gun",
  "Jetpack",
  "Body Armor",
  "Combat Helmet",
  "Riot Shield",
  "Grappling Hook",
  "Stun Baton",
  "Chainsaw",
  "Fire Axe",
  "Pickaxe",
  "Shovel",
  "Garden Hoe",
  "Rake",
  "Broom",
  "Umbrella",
  "Walking Stick",
  "Golf Club",
  "Hockey Stick",
  "Cricket Bat",
  "Tennis Racket",
  "Frying Pan",
  "Cast Iron Skillet",
  "Hot Sauce Bottle",
  "Salt Shaker",
  "Pepper Mill",
  "Fish Slice",
  "Spatula",
  "Pizza Cutter",
  "Chopsticks",
  "Sushi Knife",
  "Butcher Saw",
  "Bone Saw",
  "Laser Sword",
  "Plasma Blade",
  "Rubber Chicken"
];

const WEAPON_SHOP_PRICE_OVERRIDE = {
  "Laser Sword": 2500,
  "Plasma Blade": 2750,
  "Energy Pistol": 2250,
  "Walking Stick": 2850,
  "Rubber Chicken": 3000
};

const BASE_PLAYER_STATS = { hp: 100, defense: 0, damage: 0 };

const WEAPON_DAMAGE = {
  "Fork": 3, "Butter Knife": 2, "Spoon": 1, "Kitchen Knife": 14, "Steak Knife": 10,
  "Bread Knife": 11, "Katana": 32, "Machete": 22, "Cleaver": 20, "Paring Knife": 8,
  "Rolling Pin": 7, "Whisk": 2, "Ladle": 4, "Tongs": 3, "Meat Fork": 9,
  "Peeler": 3, "Grater": 4, "Corkscrew": 5, "Can Opener": 3, "Ice Pick": 12,
  "Scissors": 7, "Letter Opener": 5, "Box Cutter": 7, "Switchblade": 13, "Pocket Knife": 10,
  "Dagger": 16, "Rapier": 26, "Cutlass": 24, "Scimitar": 25, "Longsword": 28,
  "Greatsword": 38, "Claymore": 35, "Sabre": 24, "Bowie Knife": 15, "Kukri": 18,
  "Bayonet": 15, "Hatchet": 16, "Battle Axe": 30, "Tomahawk": 17, "War Hammer": 30,
  "Mace": 26, "Flail": 28, "Morning Star": 30, "Spear": 22, "Halberd": 34,
  "Trident": 26, "Pitchfork": 13, "Crowbar": 12, "Pipe Wrench": 13, "Sledgehammer": 28,
  "Baseball Bat": 14, "Nail Bat": 18, "Bo Staff": 9, "Nunchaku": 10, "Sai": 12,
  "Shuriken": 6, "Throwing Knife": 10, "Crossbow": 35, "Longbow": 30, "Slingshot": 4,
  "Blowdart": 4, "Pistol": 20, "Revolver": 28, "SMG": 14, "Shotgun": 45,
  "Assault Rifle": 25, "Sniper Rifle": 80, "Automatic Rifle": 22, "Energy Pistol": 24, "BB Gun": 3,
  "Jetpack": 0, "Body Armor": 0, "Combat Helmet": 0, "Riot Shield": 5, "Grappling Hook": 3,
  "Stun Baton": 6, "Chainsaw": 40, "Fire Axe": 24, "Pickaxe": 18, "Shovel": 12,
  "Garden Hoe": 10, "Rake": 7, "Broom": 4, "Umbrella": 5, "Walking Stick": 7,
  "Golf Club": 13, "Hockey Stick": 11, "Cricket Bat": 13, "Tennis Racket": 6, "Frying Pan": 12,
  "Cast Iron Skillet": 16, "Hot Sauce Bottle": 2, "Salt Shaker": 1, "Pepper Mill": 4, "Fish Slice": 3,
  "Spatula": 3, "Pizza Cutter": 6, "Chopsticks": 2, "Sushi Knife": 16, "Butcher Saw": 18,
  "Bone Saw": 18, "Laser Sword": 40, "Plasma Blade": 42, "Rubber Chicken": 1
};

const WEAPON_DEFENSE = {
  "Body Armor": 8,
  "Riot Shield": 6,
  "Combat Helmet": 4
};

const WEAPON_ABILITY = {
  "Jetpack": "Fly",
  "Grappling Hook": "Grapple up walls",
  "Stun Baton": "Stun for 2 seconds",
  "Blowdart": "Poison: 10 damage over 5 seconds",
  "Sniper Rifle": "Scope: zoom in far",
  "BB Gun": "2× damage to B.B.s"
};

const WEAPON_BB_DAMAGE_MULTIPLIER = {
  "BB Gun": 2
};

function getWeaponDamage(name) {
  return WEAPON_DAMAGE[name] ?? 0;
}

function getWeaponDefense(name) {
  return WEAPON_DEFENSE[name] ?? 0;
}

function getWeaponBbDamageMultiplier(name) {
  return WEAPON_BB_DAMAGE_MULTIPLIER[name] ?? 1;
}

function getEquippedPlayerStats(equipped) {
  return {
    hp: BASE_PLAYER_STATS.hp,
    defense: BASE_PLAYER_STATS.defense + equipped.reduce((sum, name) => sum + getWeaponDefense(name), 0),
    damage: Math.max(BASE_PLAYER_STATS.damage, ...equipped.map(getWeaponDamage)),
    abilities: equipped.filter((name) => WEAPON_ABILITY[name]).map((name) => WEAPON_ABILITY[name])
  };
}

/** Realistic-ish shop unit value; displayed price is unit × 50 coins (unless overridden). */
const WEAPON_UNIT_PRICE = {
  "Fork": 1,
  "Butter Knife": 1,
  "Spoon": 1,
  "Kitchen Knife": 12,
  "Steak Knife": 8,
  "Bread Knife": 10,
  "Katana": 40,
  "Machete": 18,
  "Cleaver": 22,
  "Paring Knife": 8,
  "Rolling Pin": 6,
  "Whisk": 5,
  "Ladle": 8,
  "Tongs": 10,
  "Meat Fork": 12,
  "Peeler": 6,
  "Grater": 8,
  "Corkscrew": 5,
  "Can Opener": 8,
  "Ice Pick": 7,
  "Scissors": 6,
  "Letter Opener": 4,
  "Box Cutter": 5,
  "Switchblade": 25,
  "Pocket Knife": 14,
  "Dagger": 45,
  "Rapier": 120,
  "Cutlass": 85,
  "Scimitar": 90,
  "Longsword": 110,
  "Greatsword": 180,
  "Claymore": 150,
  "Sabre": 95,
  "Bowie Knife": 35,
  "Kukri": 40,
  "Bayonet": 55,
  "Hatchet": 25,
  "Battle Axe": 65,
  "Tomahawk": 35,
  "War Hammer": 70,
  "Mace": 60,
  "Flail": 75,
  "Morning Star": 80,
  "Spear": 55,
  "Halberd": 120,
  "Trident": 85,
  "Pitchfork": 20,
  "Crowbar": 12,
  "Pipe Wrench": 18,
  "Sledgehammer": 35,
  "Baseball Bat": 25,
  "Nail Bat": 28,
  "Bo Staff": 15,
  "Nunchaku": 20,
  "Sai": 30,
  "Shuriken": 8,
  "Throwing Knife": 15,
  "Crossbow": 150,
  "Longbow": 120,
  "Slingshot": 8,
  "Blowdart": 12,
  "Pistol": 60,
  "BB Gun": 30,
  "Revolver": 75,
  "SMG": 130,
  "Shotgun": 110,
  "Assault Rifle": 180,
  "Sniper Rifle": 240,
  "Automatic Rifle": 200,
  "Jetpack": 300,
  "Body Armor": 150,
  "Combat Helmet": 80,
  "Riot Shield": 120,
  "Grappling Hook": 90,
  "Stun Baton": 45,
  "Chainsaw": 120,
  "Fire Axe": 55,
  "Pickaxe": 30,
  "Shovel": 20,
  "Garden Hoe": 18,
  "Rake": 15,
  "Broom": 12,
  "Umbrella": 15,
  "Golf Club": 80,
  "Hockey Stick": 35,
  "Cricket Bat": 40,
  "Tennis Racket": 45,
  "Frying Pan": 22,
  "Cast Iron Skillet": 28,
  "Hot Sauce Bottle": 4,
  "Salt Shaker": 2,
  "Pepper Mill": 8,
  "Fish Slice": 10,
  "Spatula": 6,
  "Pizza Cutter": 8,
  "Chopsticks": 3,
  "Sushi Knife": 25,
  "Butcher Saw": 45,
  "Bone Saw": 50
};

const BB_SPEED_PRICE_MULTIPLIER = {
  "Very slow": 0.7,
  Slow: 0.85,
  Fast: 1.15,
  "Super fast": 1.3
};
const BB_COINS_PER_POWER = 25 / 7;

function getBbDamagePerSecond(bb) {
  return bb.damage * (1000 / (bb.attackMs || 1000));
}

function getBbPowerScore(bb) {
  const speed = BB_SPEED_PRICE_MULTIPLIER[bb.speed] || 1;
  return (bb.hp + getBbDamagePerSecond(bb) * 4 + (bb.defense || 0) * 20) * speed;
}

function getBbOneGamePrice(bb) {
  return Math.max(5, Math.round(getBbPowerScore(bb) * BB_COINS_PER_POWER / 5) * 5);
}

function getBbPermanentPrice(bb) {
  return Math.round(getBbOneGamePrice(bb) * 9.5);
}

function getBbInGamePrice(bb) {
  return Math.round(getBbOneGamePrice(bb) * 0.95);
}

function getBbPlanPrice(bb, plan) {
  return plan === "permanent" ? getBbPermanentPrice(bb) : getBbOneGamePrice(bb);
}

function getWeaponShopPrice(name) {
  if (Object.prototype.hasOwnProperty.call(WEAPON_SHOP_PRICE_OVERRIDE, name)) {
    return WEAPON_SHOP_PRICE_OVERRIDE[name];
  }
  const unit = WEAPON_UNIT_PRICE[name];
  if (!Number.isFinite(unit)) return 50;
  return unit * 50;
}

function getWeaponPermanentShopPrice(name) {
  const oneGame = getWeaponShopPrice(name);
  return Math.max(0, Math.floor(oneGame * 9.8) - 1);
}

function getWeaponInGameShopPrice(name) {
  const oneGame = getWeaponShopPrice(name);
  return Math.max(0, Math.floor(oneGame * 0.98) - 1);
}

const POTION_EFFECTS = {
  "Water Bottle": { heal: 5 },
  "Health Potion": { bonusHp: 5 },
  "Red Glass": { damage: 1, durationMs: 60000 },
  "Red Glass (game)": { damage: 1, durationMs: Infinity },
  "Defense Potion (1 min)": { defense: 1, durationMs: 60000 },
  "Defense Potion": { defense: 1, durationMs: Infinity },
  "Fire Resistance Potion": { fireResist: true, durationMs: 180000 },
  "Fire Resistance Potion (game)": { fireResist: true, durationMs: Infinity }
};

const POTION_IN_GAME_PRICE = {
  "Water Bottle": 14,
  "Health Potion": 18,
  "Red Glass": 2 * COINS_PER_DIAMOND,
  "Red Glass (game)": 18 * COINS_PER_DIAMOND,
  "Defense Potion (1 min)": 4 * COINS_PER_DIAMOND,
  "Defense Potion": 20 * COINS_PER_DIAMOND,
  "Fire Resistance Potion": 40 * COINS_PER_DIAMOND,
  "Fire Resistance Potion (game)": 100 * COINS_PER_DIAMOND
};

const WEAPON_RANGED = {
  "Crossbow": { range: 70, cooldownMs: 1100, speed: 70 },
  "Longbow": { range: 80, cooldownMs: 1000, speed: 75 },
  "Slingshot": { range: 35, cooldownMs: 700, speed: 45 },
  "Blowdart": { range: 30, cooldownMs: 900, speed: 50 },
  "Shuriken": { range: 30, cooldownMs: 500, speed: 50 },
  "Throwing Knife": { range: 30, cooldownMs: 650, speed: 50 },
  "Pistol": { range: 55, cooldownMs: 400, speed: 120 },
  "Energy Pistol": { range: 60, cooldownMs: 380, speed: 130 },
  "BB Gun": { range: 40, cooldownMs: 300, speed: 90 },
  "Revolver": { range: 60, cooldownMs: 600, speed: 120 },
  "SMG": { range: 45, cooldownMs: 120, speed: 120 },
  "Shotgun": { range: 22, cooldownMs: 950, speed: 100 },
  "Assault Rifle": { range: 75, cooldownMs: 180, speed: 140 },
  "Automatic Rifle": { range: 75, cooldownMs: 150, speed: 140 },
  "Sniper Rifle": { range: 220, cooldownMs: 1600, speed: 260 }
};

const WEAPON_PASSIVE = ["Body Armor", "Combat Helmet", "Riot Shield", "Jetpack", "Grappling Hook"];

const MELEE_RANGE = 2.8;
const MELEE_COOLDOWN_MS = 450;
const MATCH_INVENTORY_SLOTS = 8;
const MATCH_MAX_BBS = 5;
const MATCH_PLAYERS = 30;
const MATCH_KILL_COINS = 10;

const COMPETITIVE_PAYOUTS = {
  island: [[1, 1, 300], [2, 2, 200], [3, 3, 100]],
  volcano: [[1, 1, 500], [2, 2, 300], [3, 3, 150], [4, 15, 5]],
  hardVolcano: [[1, 1, 1000], [2, 2, 500], [3, 3, 300], [4, 10, 15], [11, 20, 5]]
};

const RANKED_STARS = {
  island: [[1, 1, 25], [2, 2, 10], [3, 3, 5]],
  volcano: [[1, 1, 50], [2, 2, 20], [3, 3, 10]],
  hardVolcano: [[1, 1, 125], [2, 2, 50], [3, 3, 25]]
};

function getPlacementReward(table, map, place) {
  const row = (table[map] || []).find(([from, to]) => place >= from && place <= to);
  return row ? row[2] : 0;
}

function getWeaponRanged(name) {
  return WEAPON_RANGED[name] || null;
}

function isPotionName(name) {
  return Object.prototype.hasOwnProperty.call(POTION_EFFECTS, name);
}

if (typeof module !== "undefined") {
  module.exports = {
    COINS_PER_DIAMOND,
    SPIN_POTION_ITEMS,
    SPIN_POTION_NAMES,
    WEAPON_SHOP_ITEMS,
    BASE_PLAYER_STATS,
    WEAPON_DAMAGE,
    WEAPON_DEFENSE,
    WEAPON_ABILITY,
    WEAPON_BB_DAMAGE_MULTIPLIER,
    getWeaponDamage,
    getWeaponDefense,
    getWeaponBbDamageMultiplier,
    getWeaponShopPrice,
    getWeaponInGameShopPrice,
    getBbInGamePrice,
    getBbDamagePerSecond,
    POTION_EFFECTS,
    POTION_IN_GAME_PRICE,
    WEAPON_RANGED,
    WEAPON_PASSIVE,
    MELEE_RANGE,
    MELEE_COOLDOWN_MS,
    MATCH_INVENTORY_SLOTS,
    MATCH_MAX_BBS,
    MATCH_PLAYERS,
    MATCH_KILL_COINS,
    COMPETITIVE_PAYOUTS,
    RANKED_STARS,
    getPlacementReward,
    getWeaponRanged,
    isPotionName
  };
}
