const app = document.getElementById("app");

const LAST_CALLSIGN_KEY = "bbLastCallsign";
const AVATAR_KEY = "bbBuddyAvatar";
const AVATAR_YAW_KEY = "bbBuddyYaw";
const SHOP_WALLET_KEY = "bbShopWallet";
const SHOP_INVENTORY_KEY = "bbShopInventory";
const REWARDS_SPIN_KEY = "bbRewardsSpinDaily";
function tutorialDoneKey(kind) {
  return `bbTutorialDone:${kind}:${String(state.username || "").toLowerCase()}`;
}

function tutorialStillNeeded(kind) {
  if (!state.username) return false;
  try {
    return localStorage.getItem(tutorialDoneKey(kind)) !== "1";
  } catch {
    return false;
  }
}

function markTutorialDone(kind) {
  try {
    localStorage.setItem(tutorialDoneKey(kind), "1");
  } catch {
    // ignore
  }
}
const AVATAR_IDS = ["boy-1", "boy-2", "boy-3", "girl-1", "girl-2", "girl-3"];
const BUDDY_YAW_COUNT = 8;
const YAW_LABELS = [
  "Front",
  "Front right",
  "Right side",
  "Back right",
  "Back",
  "Back left",
  "Left side",
  "Front left"
];

const state = {
  screen: "sign-in",
  username: "",
  password: "",
  avatar: "boy-1",
  avatarYaw: 0,
  drops: 0,
  league: "",
  leagueName: "",
  leagueRank: 0,
  stars: 0,
  draft: "",
  error: "",
  notice: "",
  busy: false,
  shake: 0,
  leaderboard: null,
  leaderboardLoading: false,
  leaderboardError: "",
  shopTab: "weapons",
  shopCoins: 0,
  shopDiamonds: 0,
  shopNotice: "",
  ownedOneGame: {},
  ownedPermanent: [],
  ownedPotions: {},
  ownedPotionsPermanent: [],
  equippedPotion: "",
  equippedWeapons: [],
  ownedBbsOneGame: {},
  ownedBbsPermanent: [],
  equippedBb: "",
  ownedSkins: [],
  equippedSkin: "",
  skinTryOn: "",
  gearPanel: "items",
  bbsNotice: "",
  matchQueue: null,
  matchResult: null,
  gearNotice: "",
  rewardsNotice: "",
  rewardsWheelRotation: 0,
  rewardsSpinning: false,
  coopFriends: [],
  coopIncoming: [],
  coopOutgoing: [],
  coopNotice: "",
  coopDraft: "",
  coopParty: null,
  coopBattleInvites: [],
  chatWith: ""
};

const REWARDS_WHEEL_SEGMENTS = [
  { kind: "coins", weight: 1, amount: 100 },
  { kind: "random-potion", weight: 10 },
  { kind: "coins", weight: 19, amount: 25 },
  { kind: "permanent", weight: 12, weaponName: "Spoon" },
  { kind: "coins", weight: 13, amount: 50 },
  { kind: "permanent", weight: 11, weaponName: "Butter Knife" },
  { kind: "coins", weight: 7, amount: 75 },
  { kind: "permanent", weight: 7, weaponName: "Fork" },
  { kind: "random-potion", weight: 10 },
  { kind: "bb-one-game", weight: 10, bbName: "Snavier" }
];

const MAX_EQUIPPED_WEAPONS = 2;

const BB_RARITIES = [
  { id: "common", label: "Common" },
  { id: "uncommon", label: "Uncommon" },
  { id: "rare", label: "Rare" },
  { id: "legendary", label: "Legendary" },
  { id: "heroic", label: "Heroic" }
];

const SHOP_TABS = [
  { id: "weapons", label: "Weapons" },
  { id: "currencies", label: "Currencies" },
  { id: "potions", label: "Potions" }
];

const CURRENCY_DEALS = {
  "coins-150": { diamondCost: 15, coinReward: 150 }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatStars(count) {
  const value = Number.isFinite(count) ? count : 0;
  if (value === 0) return "0 star";
  if (value === 1) return "1 star";
  return `${value} stars`;
}

function readLastCallsign() {
  try {
    return localStorage.getItem(LAST_CALLSIGN_KEY) || "";
  } catch {
    return "";
  }
}

function writeLastCallsign(username) {
  try {
    localStorage.setItem(LAST_CALLSIGN_KEY, username);
  } catch {}
}

function readAvatar() {
  try {
    const saved = localStorage.getItem(AVATAR_KEY);
    return AVATAR_IDS.includes(saved) ? saved : "boy-1";
  } catch {
    return "boy-1";
  }
}

function writeAvatar(avatarId) {
  try {
    localStorage.setItem(AVATAR_KEY, avatarId);
  } catch {}
}

function normalizeYaw(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return ((Math.round(n) % BUDDY_YAW_COUNT) + BUDDY_YAW_COUNT) % BUDDY_YAW_COUNT;
}

function readAvatarYaw() {
  try {
    const saved = localStorage.getItem(AVATAR_YAW_KEY);
    return saved === null ? 0 : normalizeYaw(Number(saved));
  } catch {
    return 0;
  }
}

function writeAvatarYaw(yaw) {
  try {
    localStorage.setItem(AVATAR_YAW_KEY, String(normalizeYaw(yaw)));
  } catch {}
}


const AVATAR_LOOKS = {
  "boy-1": {
    name: "Ridge",
    build: "m",
    skin: ["#f4cfab", "#cd956a"],
    hair: ["#5a3f24", "#2a1a0c"],
    outfit: ["#3573f0", "#1a3c96"],
    pants: ["#2b3550", "#161d2c"],
    shoe: "#111726",
    eye: "#3f7d5a",
    hairBack: `<path d="M46 30.6c-1-11.4 4.6-19.4 14-19.4s15 8 14 19.4l-1.7 1.2c-.8-5.5-2-9.2-3.9-11.5-4.6 2.7-13.2 2.7-17.8 0-1.9 2.3-3.1 6-3.9 11.5Z" fill="url(#hair-{uid})"/>`,
    hairFront: `
      <path d="M48 25.6c2.3-6.3 6.5-9.4 12-9.4s9.7 3.1 12 9.6c-3.1-2.9-7-4.4-11.8-4.4s-8.6 1.3-12.2 4.2Z" fill="url(#hair-{uid})"/>
      <path d="M53.8 15.6c3.1-3.1 8.1-2.9 11 .4-3.5-1.2-7.3-1.2-11-.4Z" fill="#6d4e2e" opacity="0.85"/>
      <path d="M46.6 27.6c.4-2 1-3.7 1.8-5.1l1.1 6.3ZM73.4 27.6c-.4-2-1-3.7-1.8-5.1l-1.1 6.3Z" fill="url(#hair-{uid})"/>
    `,
    outfitDetail: `
      <path d="M55.2 59.2 60 66.8l4.8-7.6-2.1-1.1L60 60.6l-2.7-2.5Z" fill="#eaf1ff" opacity="0.92"/>
      <path d="M60 66.8v46" stroke="#0d1a34" stroke-width="1.5" opacity="0.6"/>
      <path d="M44.4 84.6h4.4M75.6 84.6h-4.4" stroke="#0d1a34" stroke-width="1.3" opacity="0.4"/>
      <path d="M43.6 100.4c2.6 1.7 5.6 2.7 9 3M76.4 100.4c-2.6 1.7-5.6 2.7-9 3" stroke="#0d1a34" stroke-width="1.2" opacity="0.35" fill="none"/>
    `,
    extras: ""
  },
  "boy-2": {
    name: "Dex",
    build: "m",
    skin: ["#e7b184", "#b87e50"],
    hair: ["#2a1d11", "#130c06"],
    outfit: ["#e2703a", "#a6431a"],
    pants: ["#333d52", "#1a2130"],
    shoe: "#151b28",
    eye: "#5b4636",
    hairBack: `<path d="M46.4 30c-.8-10.4 4.6-17.6 13.6-17.6S74.4 19.6 73.6 30l-1.7 1c-.8-4.9-2.1-8.2-3.9-10.2-4.3 2.2-12 2.2-16 0-1.8 2-3.1 5.3-3.9 10.2Z" fill="url(#hair-{uid})"/>`,
    hairFront: `<path d="M47.4 27.4c.5-2.5 1.3-4.5 2.4-6.1l1 6.7ZM72.6 27.4c-.5-2.5-1.3-4.5-2.4-6.1l-1 6.7Z" fill="url(#hair-{uid})"/>`,
    outfitDetail: `
      <path d="M54.8 59.2 60 67.2l5.2-8-2.2-1.1L60 60.8l-3-2.7Z" fill="#fff2e6" opacity="0.92"/>
      <path d="M50.6 71.4h18.8" stroke="#7c3210" stroke-width="1.5" opacity="0.55"/>
      <path d="M44.6 92.6h5.6M75.4 92.6h-5.6" stroke="#7c3210" stroke-width="1.3" opacity="0.4"/>
      <rect x="66.4" y="82.4" width="8.6" height="10.4" rx="2" fill="#a6431a" stroke="#ffbf94" stroke-width="1.1" opacity="0.85"/>
    `,
    extras: `
      <path d="M45 24.8c1.2-8.3 7-13.6 15-13.6s13.8 5.3 15 13.6c.2 1.5-.9 2.8-2.4 2.8H47.4c-1.5 0-2.6-1.3-2.4-2.8Z" fill="#2f3a52"/>
      <path d="M45 24.8c1.2-8.3 7-13.6 15-13.6.8 0 1.6 0 2.4.2-6.9 1.8-11.5 6.9-13.2 16.2h-1.8c-1.5 0-2.6-1.3-2.4-2.8Z" fill="#404e6b" opacity="0.9"/>
      <path d="M72.4 24.8h7.4c1.8 0 3 1.7 2.3 3.3-.6 1.7-2.3 2.9-4.1 2.9h-8.7Z" fill="#232c40"/>
      <circle cx="60" cy="11.8" r="1.5" fill="#4d5c78"/>
      <path d="M47.3 27.5h25.4" stroke="#1b2334" stroke-width="1.1" opacity="0.75"/>
    `
  },
  "boy-3": {
    name: "Kofi",
    build: "m",
    skin: ["#96603d", "#66391f"],
    hair: ["#241809", "#0d0804"],
    outfit: ["#1f8a5c", "#0d5638"],
    pants: ["#2a2f3d", "#161b25"],
    shoe: "#111620",
    eye: "#42301f",
    hairBack: `
      <path d="M45.4 30.8c-1-11.6 4.8-20 14.6-20s15.6 8.4 14.6 20l-1.8 1c-.8-5.4-2-9-4-11.4-4.6 2.6-14 2.6-18.6 0-2 2.4-3.2 6-4 11.4Z" fill="url(#hair-{uid})"/>
      <circle cx="48.2" cy="20.4" r="3.6" fill="url(#hair-{uid})"/>
      <circle cx="53.6" cy="16.8" r="4" fill="url(#hair-{uid})"/>
      <circle cx="60" cy="15.2" r="4.2" fill="url(#hair-{uid})"/>
      <circle cx="66.4" cy="16.8" r="4" fill="url(#hair-{uid})"/>
      <circle cx="71.8" cy="20.4" r="3.6" fill="url(#hair-{uid})"/>
    `,
    hairFront: `
      <circle cx="50.6" cy="23.6" r="2.5" fill="#2c1d0c"/>
      <circle cx="56" cy="21.8" r="2.7" fill="#2c1d0c"/>
      <circle cx="64" cy="21.8" r="2.7" fill="#2c1d0c"/>
      <circle cx="69.4" cy="23.6" r="2.5" fill="#2c1d0c"/>
    `,
    outfitDetail: `
      <path d="M55 59.2 60 66.6l5-7.4-2.1-1.1L60 60.4l-2.9-2.3Z" fill="#dcfbe9" opacity="0.9"/>
      <path d="M45.6 76.6h28.8M46.4 88.4h27.2" stroke="#08422c" stroke-width="1.4" opacity="0.5"/>
      <rect x="65.6" y="93.4" width="9" height="11.4" rx="2.2" fill="#0d5638" stroke="#7de0b4" stroke-width="1.1" opacity="0.9"/>
      <path d="M60 66.6v46" stroke="#08422c" stroke-width="1.4" opacity="0.45"/>
    `,
    extras: `
      <path d="M46.6 25c3.6-2.9 8.3-4.4 13.4-4.4s9.8 1.5 13.4 4.4l-.7 3.6c-3.4-2.5-7.8-3.8-12.7-3.8s-9.3 1.3-12.7 3.8Z" fill="#f0b429"/>
      <path d="M46.6 25c3.6-2.9 8.3-4.4 13.4-4.4v4.2c-4.9 0-9.3 1.3-12.7 3.8Z" fill="#ffd772" opacity="0.8"/>
    `
  },
  "girl-1": {
    name: "Noa",
    build: "f",
    skin: ["#f7d5b4", "#d3a178"],
    hair: ["#8f5029", "#552a13"],
    outfit: ["#d94f86", "#a02659"],
    pants: ["#2f3550", "#1a1e2f"],
    shoe: "#161b28",
    eye: "#3b6ea5",
    hairBack: `
      <path d="M44.6 32c-1.2-12.4 5.2-20.8 15.4-20.8S76.6 19.6 75.4 32l-1 27.6c-.1 3.1-2.8 4.9-5.6 3.8l-3.9-1.6 1.6-30.2H53.5l1.6 30.2-3.9 1.6c-2.8 1.1-5.5-.7-5.6-3.8Z" fill="url(#hair-{uid})"/>
      <path d="M53.5 31.6h13l-.4 11.6H53.9Z" fill="#4a2411" opacity="0.35"/>
    `,
    hairFront: `
      <path d="M47.4 27.8C49.4 19 54 14.8 60 14.8s10.6 4.2 12.6 13c-2.1-4.9-5.6-7.8-10.1-8.8-.7 3.1-2.1 5.3-4.2 6.7-2.3 1.5-5.8 2.2-10.2 2.2-.3 0-.5 0-.7.1Z" fill="url(#hair-{uid})"/>
      <path d="M49.8 28.8c-.9 6-.7 11.6.4 16.9l-2.9 1c-1.2-6-1-11.8.4-17.6Z" fill="url(#hair-{uid})"/>
      <path d="M70.2 28.8c.9 6 .7 11.6-.4 16.9l2.9 1c1.2-6 1-11.8-.4-17.6Z" fill="url(#hair-{uid})"/>
    `,
    outfitDetail: `
      <path d="M55.6 59.4 60 66.4l4.4-7-1.9-1L60 60.4l-2.5-2Z" fill="#ffe7f1" opacity="0.92"/>
      <path d="M60 66.4v44" stroke="#7c1642" stroke-width="1.4" opacity="0.55"/>
      <path d="M45.8 84.6c3 2.2 6.6 3.5 10.8 3.7M74.2 84.6c-3 2.2-6.6 3.5-10.8 3.7" stroke="#7c1642" stroke-width="1.2" opacity="0.4" fill="none"/>
    `,
    extras: `<circle cx="46.4" cy="39.6" r="1.2" fill="#ffd76b"/><circle cx="73.6" cy="39.6" r="1.2" fill="#ffd76b"/>`
  },
  "girl-2": {
    name: "Amara",
    build: "f",
    skin: ["#c98f60", "#96603c"],
    hair: ["#2c2014", "#140d07"],
    outfit: ["#efb62c", "#b8820d"],
    pants: ["#39405a", "#1f2434"],
    shoe: "#181e2b",
    eye: "#4b3a2a",
    hairBack: `
      <path d="M45.4 30.8c-1-11.6 5-19.4 14.6-19.4s15.6 7.8 14.6 19.4l-1.8 1c-.9-5.2-2.1-8.7-4.1-10.9-4.5 2.3-13 2.3-17.5 0-2 2.2-3.2 5.7-4.1 10.9Z" fill="url(#hair-{uid})"/>
      <path d="M73.4 19.2c8.2 2.2 12.8 8 12.4 16-.4 7.8-3.2 15.2-8.4 22.2l-6.2-4.6c4.2-5.6 6.4-11.2 6.6-16.8.2-4.6-1.6-7.8-5.4-9.8Z" fill="url(#hair-{uid})"/>
      <ellipse cx="76.8" cy="21.2" rx="4.2" ry="3.4" fill="#efb62c"/>
    `,
    hairFront: `
      <path d="M46.8 26.8C49.2 19 53.7 14.6 60 14.6s10.8 4.4 13.2 12.2c-3.1-4.2-7.4-6.3-13.2-6.3s-10.1 2.1-13.2 6.3Z" fill="url(#hair-{uid})"/>
      <path d="M48.2 23.4c2.9-3.2 6.8-4.9 11.8-4.9 3.1 0 5.8.7 8 2.1-4.7-.4-8.8.3-12.4 2.1-2.2 1.2-4.7 1.4-7.4.7Z" fill="#3b2a1a" opacity="0.9"/>
    `,
    outfitDetail: `
      <path d="M55.4 59.4 60 66.6l4.6-7.2-2-1L60 60.6l-2.6-2.2Z" fill="#fff6dd" opacity="0.92"/>
      <path d="M47.6 72.6h24.8" stroke="#8a5c07" stroke-width="1.5" opacity="0.5"/>
      <path d="M60 66.6v20" stroke="#8a5c07" stroke-width="1.3" opacity="0.45"/>
      <path d="M45.4 96.4h6.2M74.6 96.4h-6.2" stroke="#8a5c07" stroke-width="1.2" opacity="0.4"/>
    `,
    extras: `<path d="M47.4 22.6c3.6-2.7 7.7-4.1 12.6-4.1" stroke="#efb62c" stroke-width="1.6" opacity="0.7" fill="none"/>`
  },
  "girl-3": {
    name: "Sky",
    build: "f",
    skin: ["#f1c69e", "#c78f61"],
    hair: ["#b57f42", "#7c4c1e"],
    outfit: ["#17a2b8", "#0b6a7c"],
    pants: ["#243447", "#131c27"],
    shoe: "#101720",
    eye: "#5f7a4a",
    hairBack: `
      <path d="M44.8 31.6c-1.2-12.1 5.1-20.3 15.2-20.3S76.4 19.5 75.2 31.6l-1.9 1c-.9-5.3-2.1-8.9-4.1-11.1-4.7 2.4-14.3 2.4-19 0-2 2.2-3.2 5.8-4.1 11.1Z" fill="url(#hair-{uid})"/>
      <path d="M47.6 31.4c-2.5 4.6-3.1 10-1.7 16.3l-3.7 14.2c-.6 2.2 1 4.1 3.2 4.1 1.6 0 3.1-1.1 3.5-2.7l3.9-15.2c-1.5-5.6-1.5-11 0-16.6Z" fill="url(#hair-{uid})"/>
      <path d="M72.4 31.4c2.5 4.6 3.1 10 1.7 16.3l3.7 14.2c.6 2.2-1 4.1-3.2 4.1-1.6 0-3.1-1.1-3.5-2.7l-3.9-15.2c1.5-5.6 1.5-11 0-16.6Z" fill="url(#hair-{uid})"/>
      <path d="M43.8 40.4h5.6M43 47h6M44.4 53.6h5.6M76.2 40.4h-5.6M77 47h-6M75.6 53.6h-5.6" stroke="#6b4118" stroke-width="1.2" opacity="0.5" fill="none"/>
    `,
    hairFront: `
      <path d="M46.8 27C49.2 19 53.8 14.4 60 14.4s10.8 4.6 13.2 12.6c-2.4-3.7-5.5-5.9-9.4-6.6-1.7 3.2-4.7 4.8-9 4.8-1.9 0-3.4.6-4.6 1.6Z" fill="url(#hair-{uid})"/>
      <path d="M48.6 23.6c3.9-4.2 8.9-6.3 15.2-6.3 1.8 0 3.5.2 5.1.6-5.2.4-9.8 1.6-13.8 3.7-2.2 1.2-4.4 1.8-6.5 2Z" fill="#cd9855" opacity="0.85"/>
    `,
    outfitDetail: `
      <path d="M55.4 59.4 60 66.6l4.6-7.2-2-1L60 60.6l-2.6-2.2Z" fill="#e4feff" opacity="0.92"/>
      <path d="M60 66.6v44" stroke="#064f5f" stroke-width="1.4" opacity="0.55"/>
      <rect x="44.6" y="80.6" width="9.4" height="11.6" rx="2.2" fill="#0b6a7c" stroke="#8ee9f5" stroke-width="1.1" opacity="0.9"/>
      <path d="M66.6 78.6h8" stroke="#064f5f" stroke-width="1.3" opacity="0.45"/>
    `,
    extras: ""
  }
};

const BUDDY_HEAD_PATH =
  "M60 16.6c-8.8 0-14.6 5.6-14.6 14.4 0 4.3.5 8.2 1.6 11.5 1.4 4.3 3.5 7.2 6.2 8.8 2 1.2 4.3 1.8 6.8 1.8s4.8-.6 6.8-1.8c2.7-1.6 4.8-4.5 6.2-8.8 1.1-3.3 1.6-7.2 1.6-11.5 0-8.8-5.8-14.4-14.6-14.4Z";

function buddyFaceFeatures(look, side) {
  const fx = side * 8.2;
  const profile = side > 0.92;
  const farOpacity = profile ? 0 : Math.max(0, 1 - side * 0.62);
  const farScale = 1 - side * 0.4;
  const noseX = 60 + fx * 1.3;
  const mouthX = 60 + fx * 1.05;

  const eye = (cx, scale, opacity) => {
    if (opacity <= 0.02) return "";
    return `
      <g transform="translate(${cx.toFixed(2)} 34) scale(${scale.toFixed(3)} 1)" opacity="${opacity.toFixed(2)}">
        <path d="M-3.4 0c1-1.7 2.3-2.6 3.4-2.6s2.4.9 3.4 2.6c-1 1.5-2.1 2.3-3.4 2.3s-2.4-.8-3.4-2.3Z" fill="#f6f1ea"/>
        <circle cx="${(side * 1.1).toFixed(2)}" cy="0" r="1.75" fill="${look.eye}"/>
        <circle cx="${(side * 1.1).toFixed(2)}" cy="0" r="0.75" fill="#140d08"/>
        <circle cx="${(side * 1.1 - 0.6).toFixed(2)}" cy="-0.7" r="0.4" fill="#ffffff" opacity="0.9"/>
        <path d="M-3.5 -0.3c1-1.9 2.4-2.9 3.5-2.9s2.5 1 3.5 2.9" stroke="#3a2711" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      </g>
    `;
  };

  return `
    <path d="M${(51.4 + fx).toFixed(2)} 28.8c1.4-1.1 3.3-1.2 4.8-.3" stroke="#33220f" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="${(0.75 * farOpacity).toFixed(2)}"/>
    <path d="M${(63.8 + fx).toFixed(2)} 28.5c1.5-.9 3.4-.8 4.8.3" stroke="#33220f" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.75"/>
    ${eye(55 + fx, farScale, farOpacity)}
    ${eye(65 + fx, 1, 1)}
    ${profile ? "" : `<path d="M${noseX.toFixed(2)} 34.6c.6 2.6 1.2 4.6 1.8 5.8.4.8-.2 1.7-1.1 1.7h-1.4c-.9 0-1.5-.9-1.1-1.7.6-1.2 1.2-3.2 1.8-5.8Z" fill="#000000" opacity="0.15"/>`}
    <path d="M${(mouthX - 2.4).toFixed(2)} 41.9c1.5.8 3.3.8 4.8 0" stroke="#000000" stroke-width="0.7" opacity="0.28" fill="none"/>
    <path d="M${(mouthX - 3.6).toFixed(2)} 44.8c1.2-1 2.4-1.5 3.6-1.5s2.4.5 3.6 1.5c-1 1.9-2.2 2.8-3.6 2.8s-2.6-.9-3.6-2.8Z" fill="#a85d55" opacity="0.72"/>
    <ellipse cx="${(51.8 + fx).toFixed(2)}" cy="39.8" rx="3.2" ry="2.1" fill="#d97b6c" opacity="${(0.2 * farOpacity).toFixed(2)}"/>
    <ellipse cx="${(68.2 + fx).toFixed(2)}" cy="39.8" rx="3.2" ry="2.1" fill="#d97b6c" opacity="0.2"/>
    <path d="M${(56.8 + fx * 0.9).toFixed(2)} 49.8c2 .8 4.4.8 6.4 0" stroke="#000000" stroke-width="0.7" opacity="0.14" fill="none"/>
  `;
}

const HELD_GUNS = new Set([
  "Pistol", "Revolver", "SMG", "Shotgun", "Assault Rifle", "Sniper Rifle", "Sniper", "Bazooka",
  "Automatic Rifle", "Energy Pistol", "BB Gun", "Crossbow", "Chainsaw"
]);
const HELD_CENTERED = new Set([
  "Shuriken", "Salt Shaker", "Pepper Mill", "Grater", "Hot Sauce Bottle", "Riot Shield"
]);

function buddyHeldWeapon(name, handX, handY, flip) {
  const draw = typeof WEAPON_ART !== "undefined" ? WEAPON_ART[name] : null;
  if (!draw) return "";
  let grip = [22, 24];
  let angle = -60;
  let scale = 0.42;
  if (HELD_GUNS.has(name)) {
    grip = [52, 34];
    angle = -8;
    scale = 0.4;
  } else if (HELD_CENTERED.has(name)) {
    grip = [80, 24];
    angle = 0;
    scale = name === "Riot Shield" ? 0.95 : 0.42;
  } else if (name === "Longbow") {
    grip = [80, 10];
    angle = -90;
  }
  const mirror = flip ? " scale(-1 1)" : "";
  return `<g transform="translate(${handX} ${handY})${mirror} rotate(${angle}) scale(${scale}) translate(${-grip[0]} ${-grip[1]})">${draw()}</g>`;
}

function buddyWornBack(equipped, offsetX) {
  if (!equipped.includes("Jetpack") || typeof WEAPON_ART === "undefined") return "";
  return `<g transform="translate(${(60 + offsetX).toFixed(2)} 84) scale(1.3) translate(-80 -24)">${WEAPON_ART["Jetpack"]()}</g>`;
}

function buddyWornTorso(equipped) {
  if (!equipped.includes("Body Armor") || typeof WEAPON_ART === "undefined") return "";
  return `<g transform="translate(60 86) scale(0.98) translate(-80 -25)">${WEAPON_ART["Body Armor"]()}</g>`;
}

function buddyWornHead(equipped, headShiftX) {
  if (!equipped.includes("Combat Helmet") || typeof WEAPON_ART === "undefined") return "";
  return `<g transform="translate(${(60 + headShiftX).toFixed(2)} 19) scale(0.7) translate(-80 -24)">${WEAPON_ART["Combat Helmet"]()}</g>`;
}

const BUDDY_WORN_ITEMS = new Set(["Jetpack", "Body Armor", "Combat Helmet"]);

function buddyAvatarSvg(avatarId, compact, yaw, equipped = [], cropViewBox = "") {
  const look = AVATAR_LOOKS[avatarId] || AVATAR_LOOKS["boy-1"];
  const step = normalizeYaw(yaw ?? 0);
  const mirror = step > 4;
  const s = mirror ? 8 - step : step;
  const rad = (s * Math.PI) / 4;
  const side = Math.sin(rad);
  const facing = Math.cos(rad);
  const isBack = facing < -0.3;
  const profile = side > 0.92;

  const uid = `${avatarId}-${compact ? "s" : cropViewBox ? "c" : "l"}-${step}`;
  const fill = (markup) => markup.replace(/\{uid\}/g, uid);

  const bodySx = 0.72 + 0.28 * Math.abs(facing);
  const mir = mirror ? -1 : 1;
  const headShiftX = side * 2.6;
  const fx = side * 8.2;

  const torso = look.build === "f"
    ? "M60 57.4c-5.6 0-10.6 1.4-14.8 4.3-4.1 2.8-6.4 6.8-6.9 12.1l-1.4 14.1c-.4 3.9.7 6.4 2.9 8.5 2.8 2.7 3.9 5.8 3.9 9.8v4.1h32.6v-4.1c0-4 1.1-7.1 3.9-9.8 2.2-2.1 3.3-4.6 2.9-8.5l-1.4-14.1c-.5-5.3-2.8-9.3-6.9-12.1-4.2-2.9-9.2-4.3-14.8-4.3Z"
    : "M60 57.4c-6.6 0-12.4 1.5-17.2 4.4-4.8 2.9-7.5 7.1-7.9 12.5L32.4 108c-.3 4.1 2.5 6.9 6.2 6.9h42.8c3.7 0 6.5-2.8 6.2-6.9l-2.5-33.7c-.4-5.4-3.1-9.6-7.9-12.5-4.8-2.9-10.6-4.4-17.2-4.4Z";

  const shoulders = look.build === "f" ? 18 : 20.5;
  const handX = shoulders + 7;
  const heldItems = equipped.filter((name) => !BUDDY_WORN_ITEMS.has(name));
  const heldMarkup = heldItems
    .slice(0, 2)
    .map((name, index) => index === 0
      ? buddyHeldWeapon(name, 60 + handX + 0.8, 111, false)
      : buddyHeldWeapon(name, 60 - handX - 0.8, 111, true))
    .join("");

  const earFar = `<ellipse cx="46.2" cy="34.8" rx="2.5" ry="3.9" fill="url(#skin-{uid})" opacity="${Math.max(0, 1 - side * 1.1).toFixed(2)}"/>`;
  const earNear = `<ellipse cx="73.8" cy="34.8" rx="2.5" ry="3.9" fill="url(#skin-{uid})"/>`;

  const headFront = `
    <g transform="translate(${headShiftX.toFixed(2)} 0)">
      <g transform="translate(${(fx * 0.28).toFixed(2)} 0)">${look.hairBack}</g>
      ${earFar}
      ${earNear}
      <path d="${BUDDY_HEAD_PATH}" fill="url(#skin-{uid})"/>
      <path d="M60 16.6c-8.8 0-14.6 5.6-14.6 14.4 0 4.3.5 8.2 1.6 11.5 1.4 4.3 3.5 7.2 6.2 8.8-3.6-4.8-5.4-11.5-5.4-20.1 0-6.3 2.4-11.5 7-15.5Z" fill="#000000" opacity="${(0.07 + side * 0.12).toFixed(2)}"/>
      <clipPath id="face-{uid}"><path d="${BUDDY_HEAD_PATH}"/></clipPath>
      ${side > 0.3 ? `<g clip-path="url(#face-{uid})" opacity="${Math.min(1, side * 1.5).toFixed(2)}">
        <path d="M62 15.5c-11 0-17.6 6.4-17.6 16 0 6.2 1 11.6 3 15.6 2.4-1.2 4-3.6 4.4-7.2.5-4.9 1.2-8.9 3.4-11.9 2.2-3 4.4-4.5 6.8-4.5Z" fill="url(#hair-{uid})"/>
        <path d="M49.2 22.6c-1.8 3.2-2.6 7-2.4 11.4M52.4 19.4c-2 3.6-3 8-2.8 12.8" stroke="#000000" stroke-width="0.6" opacity="0.2" fill="none"/>
      </g>` : ""}
      ${profile ? `<path d="M73.6 31.4c2.9 1 4.6 3.1 4.3 5.5-.2 1.8-1.7 2.9-3.9 2.8" fill="url(#skin-{uid})"/><path d="M77.6 35.4c-.4 1.6-1.5 2.5-3.2 2.4" stroke="#000000" stroke-width="0.6" opacity="0.2" fill="none"/>` : ""}
      <g clip-path="url(#face-{uid})">${buddyFaceFeatures(look, side)}</g>
      <g transform="translate(${(fx * 0.45).toFixed(2)} 0)">${look.hairFront}${look.extras}</g>
    </g>
  `;

  const headBack = `
    <g transform="translate(${headShiftX.toFixed(2)} 0)">
      <g transform="translate(${(fx * 0.28).toFixed(2)} 0)">${look.hairBack}</g>
      ${earFar}
      ${earNear}
      <path d="${BUDDY_HEAD_PATH}" fill="url(#skin-{uid})"/>
      <clipPath id="faceb-{uid}"><path d="${BUDDY_HEAD_PATH}"/></clipPath>
      <g clip-path="url(#faceb-{uid})">
        <ellipse cx="${(60 - fx * 0.3).toFixed(2)}" cy="32" rx="15.6" ry="18" fill="url(#hair-{uid})"/>
        <path d="M${(52 - fx * 0.3).toFixed(2)} 20c-2.4 9.4-2.4 19 0 28.6M${(60 - fx * 0.3).toFixed(2)} 17.6v32M${(68 - fx * 0.3).toFixed(2)} 20c2.4 9.4 2.4 19 0 28.6" stroke="#000000" stroke-width="0.7" opacity="0.18" fill="none"/>
        <path d="M${(49 - fx * 0.3).toFixed(2)} 25.4c2.4-5 6.4-7.8 11.6-8.2" stroke="#ffffff" stroke-width="1" opacity="0.22" fill="none" stroke-linecap="round"/>
      </g>
      <g transform="translate(${(fx * 0.3).toFixed(2)} 0)">${look.extras}</g>
    </g>
  `;

  const heroClass = compact ? "buddy-svg-compact" : "buddy-svg-hero";
  const viewBox = cropViewBox || (compact ? "38 5 44 66" : "0 0 120 204");

  return fill(`
    <svg class="buddy-svg ${heroClass}" data-buddy-yaw="${step}" viewBox="${viewBox}" aria-hidden="true">
      <defs>
        <linearGradient id="skin-{uid}" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="${look.skin[0]}"/>
          <stop offset="1" stop-color="${look.skin[1]}"/>
        </linearGradient>
        <linearGradient id="hair-{uid}" x1="0.1" y1="0" x2="0.85" y2="1">
          <stop offset="0" stop-color="${look.hair[0]}"/>
          <stop offset="1" stop-color="${look.hair[1]}"/>
        </linearGradient>
        <linearGradient id="cloth-{uid}" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="${look.outfit[0]}"/>
          <stop offset="1" stop-color="${look.outfit[1]}"/>
        </linearGradient>
        <linearGradient id="pants-{uid}" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0" stop-color="${look.pants[0]}"/>
          <stop offset="1" stop-color="${look.pants[1]}"/>
        </linearGradient>
        <linearGradient id="shade-{uid}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000000" stop-opacity="${(0.26 + side * 0.14).toFixed(2)}"/>
          <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000000" stop-opacity="0.2"/>
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="194.6" rx="${(25 * (0.78 + 0.22 * Math.abs(facing))).toFixed(1)}" ry="4.6" fill="#000000" opacity="0.34"/>

      <g transform="translate(60 0) scale(${mir} 1) translate(-60 0)">
        <g transform="translate(60 0) scale(${bodySx.toFixed(3)} 1) translate(-60 0)">
          ${isBack ? "" : buddyWornBack(equipped, -side * 16)}

          <path d="M54.4 114 51.6 148" stroke="url(#pants-{uid})" stroke-width="13.5" stroke-linecap="round" fill="none"/>
          <path d="M65.6 114 68.4 148" stroke="url(#pants-{uid})" stroke-width="13.5" stroke-linecap="round" fill="none"/>
          <path d="M51.6 148 49.8 180" stroke="url(#pants-{uid})" stroke-width="11.5" stroke-linecap="round" fill="none"/>
          <path d="M68.4 148 70.2 180" stroke="url(#pants-{uid})" stroke-width="11.5" stroke-linecap="round" fill="none"/>
          <path d="M45.8 148.6h11.4M62.8 148.6h11.4" stroke="#000000" stroke-width="1.2" opacity="0.18" fill="none"/>

          <path d="M43.4 180h8.2c2.2 0 3.8 1.8 3.8 4v4.2c0 1.6-1.3 2.8-2.9 2.8H39.8c-1.9 0-3.3-1.8-2.8-3.6l.8-3.5c.6-2.3 2.7-3.9 5.6-3.9Z" fill="${look.shoe}"/>
          <path d="M76.6 180h-8.2c-2.2 0-3.8 1.8-3.8 4v4.2c0 1.6 1.3 2.8 2.9 2.8h12.7c1.9 0 3.3-1.8 2.8-3.6l-.8-3.5c-.6-2.3-2.7-3.9-5.6-3.9Z" fill="${look.shoe}"/>
          <path d="M37.2 188.2h18.2M64.6 188.2h18.2" stroke="#f3f6ff" stroke-width="1.5" opacity="0.42" fill="none"/>

          <path d="${torso}" fill="url(#cloth-{uid})"/>
          <path d="${torso}" fill="url(#shade-{uid})"/>
          ${buddyWornTorso(equipped)}
          ${isBack ? buddyWornBack(equipped, -side * 4) : ""}

          <path d="M${60 - shoulders} 62.4 ${60 - shoulders - 2} 86.6" stroke="url(#cloth-{uid})" stroke-width="11.6" stroke-linecap="round" fill="none"/>
          <path d="M${60 + shoulders} 62.4 ${60 + shoulders + 2} 86.6" stroke="url(#cloth-{uid})" stroke-width="11.6" stroke-linecap="round" fill="none"/>
          <path d="M${60 - shoulders - 2} 85.4 ${60 - handX} 105.4" stroke="url(#cloth-{uid})" stroke-width="10.6" stroke-linecap="round" fill="none"/>
          <path d="M${60 + shoulders + 2} 85.4 ${60 + handX} 105.4" stroke="url(#cloth-{uid})" stroke-width="10.6" stroke-linecap="round" fill="none"/>
          ${heldMarkup}
          <ellipse cx="${60 - handX - 0.8}" cy="111" rx="4.1" ry="4.9" fill="url(#skin-{uid})"/>
          <ellipse cx="${60 + handX + 0.8}" cy="111" rx="4.1" ry="4.9" fill="url(#skin-{uid})"/>
          <path d="M${60 - handX - 3.4} 111c1.2 1.1 2.6 1.7 4 1.9M${60 + handX + 3.4} 111c-1.2 1.1-2.6 1.7-4 1.9" stroke="#000000" stroke-width="0.8" opacity="0.22" fill="none"/>

          <path d="M55.8 47.6h8.4v8.4c0 2.2-1.9 3.8-4.2 3.8s-4.2-1.6-4.2-3.8Z" fill="url(#skin-{uid})"/>
          <path d="M55.8 47.6h8.4v2.8c-2.7 1.3-5.7 1.3-8.4 0Z" fill="#000000" opacity="0.24"/>

          ${isBack ? headBack : headFront}
          ${isBack ? `<g transform="translate(${headShiftX.toFixed(2)} 1.6)" opacity="0.96">${look.hairBack}</g>` : ""}
          ${buddyWornHead(equipped, headShiftX)}

          ${facing > 0.35 ? look.outfitDetail : ""}
          ${isBack ? `<path d="M60 62v50" stroke="#000000" stroke-width="0.8" opacity="0.14" fill="none"/>` : ""}
        </g>
      </g>
    </svg>
  `);
}

async function postAuth(endpoint, username, password, extra) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extra ? { username, password, ...extra } : { username, password })
    });
  } catch {
    throw new Error("Could not reach the drop server. Check your connection and try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "The drop server could not handle that. Try again.");
  }

  return data;
}

function starField() {
  let markup = "";
  for (let index = 0; index < 70; index += 1) {
    const left = (index * 37.4) % 100;
    const top = (index * 61.7) % 62;
    const size = 1 + (index % 3) * 0.7;
    const delay = (index % 11) * 0.42;
    markup += `<span class="star" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;width:${size}px;height:${size}px;animation-delay:${delay}s"></span>`;
  }
  return markup;
}

function chuteField() {
  let markup = "";
  for (let index = 0; index < 5; index += 1) {
    const left = 14 + index * 17;
    const delay = index * 2.6;
    const duration = 12 + (index % 3) * 3;
    const scale = 0.7 + (index % 3) * 0.18;
    markup += `
      <span class="chute" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;--chute-scale:${scale}">
        <svg viewBox="0 0 40 54" aria-hidden="true">
          <path class="chute-canopy" d="M2 16a18 18 0 0 1 36 0c0 3-4.5 5-8 9l-10 0c-3.5-4-8-6-8-9Z"/>
          <path class="chute-line" d="M6 20 18 33M34 20 22 33M20 25v8"/>
          <rect class="chute-body" x="17" y="33" width="6" height="11" rx="3"/>
          <path class="chute-legs" d="M18 44 16 51M22 44 24 51"/>
        </svg>
      </span>
    `;
  }
  return markup;
}

function skylineSvg() {
  return `
    <svg class="drop-terrain" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <path class="terrain-far" d="M0 190 90 150l70 34 96-58 84 46 110-38 96 52 92-44 108 40 96-52 90 46 84-30 124 44 100-24v146H0Z"/>
      <path class="terrain-mid" d="M0 236l120-34 96 22 84-30 110 34 96-18 104 30 92-26 118 36 96-22 108 28 96-18 120 30v132H0Z"/>
      <g class="terrain-towers">
        <rect x="180" y="196" width="34" height="124"/>
        <rect x="222" y="216" width="20" height="104"/>
        <rect x="1044" y="184" width="40" height="136"/>
        <rect x="1092" y="212" width="24" height="108"/>
        <rect x="612" y="204" width="30" height="116"/>
        <rect x="650" y="228" width="18" height="92"/>
      </g>
      <g class="terrain-lights">
        <rect x="190" y="210" width="6" height="8"/>
        <rect x="200" y="230" width="6" height="8"/>
        <rect x="1054" y="200" width="7" height="9"/>
        <rect x="1066" y="224" width="7" height="9"/>
        <rect x="620" y="220" width="6" height="8"/>
      </g>
      <path class="terrain-near" d="M0 274l140-24 118 20 132-26 128 28 140-22 136 26 128-24 140 22 128-20 150 24v100H0Z"/>
    </svg>
  `;
}

function crestSvg() {
  return `
    <svg class="drop-crest-mark" viewBox="0 0 72 72" aria-hidden="true">
      <circle class="crest-ring" cx="36" cy="36" r="32"/>
      <circle class="crest-ring-inner" cx="36" cy="36" r="24"/>
      <path class="crest-ticks" d="M36 2v10M36 60v10M2 36h10M60 36h10"/>
      <path class="crest-bolt" d="M40 16 24 40h10l-4 18 18-26H37l3-16Z"/>
    </svg>
  `;
}

function userIcon() {
  return `
    <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.25" r="3.75"/>
      <path d="M4.75 20.25a7.25 7.25 0 0 1 14.5 0"/>
    </svg>
  `;
}

function lockIcon() {
  return `
    <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.25" y="10.25" width="15.5" height="10.5" rx="3"/>
      <path d="M8.25 10.25V7.5a3.75 3.75 0 0 1 7.5 0v2.75"/>
    </svg>
  `;
}

function passwordToggle() {
  return `
    <button class="field-toggle" type="button" data-action="toggle-password" aria-label="Show passcode">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z"/>
        <circle cx="12" cy="12" r="3.25"/>
        <line class="toggle-slash" x1="4" y1="20" x2="20" y2="4"/>
      </svg>
    </button>
  `;
}

function statusLine() {
  if (state.error) return `<p class="drop-status error" role="alert">${escapeHtml(state.error)}</p>`;
  if (state.notice) return `<p class="drop-status notice">${escapeHtml(state.notice)}</p>`;
  return `<p class="drop-status" aria-hidden="true"></p>`;
}

function liveBar() {
  return `
    <div class="drop-live">
      <span class="live-dot" aria-hidden="true"></span>
      <span class="live-label">Lobbies filling</span>
      <span class="live-count" data-live-count>98</span>
      <span class="live-unit">/100</span>
    </div>
  `;
}

function template(html, className) {
  disposeGearPreview3d();
  app.className = `app ${className}`.trim();
  app.innerHTML = html;
}

function renderScene(content, screenClass = "drop-screen") {
  template(`
    <div class="drop-sky" aria-hidden="true">
      <span class="sky-glow"></span>
      <div class="sky-stars">${starField()}</div>
      <span class="sky-aurora"></span>
    </div>
    <div class="drop-chutes" aria-hidden="true">${chuteField()}</div>
    <div class="drop-horizon" aria-hidden="true">
      <span class="storm-wall"></span>
      ${skylineSvg()}
    </div>
    <div class="drop-scanlines" aria-hidden="true"></div>
    ${content}
  `, screenClass);
}

const LEADERBOARD_TIERS = [
  { id: "diamond", name: "Diamond", percent: 3, label: "Top 3% of players" },
  { id: "platinum", name: "Platinum", percent: 5, label: "5% of players" },
  { id: "gold", name: "Gold", percent: 12, label: "12% of players" },
  { id: "silver", name: "Silver", percent: 20, label: "20% of players" },
  { id: "bronze", name: "Bronze", percent: 25, label: "25% of players" },
  { id: "wood", name: "Wood", percent: 35, label: "35% of players" }
];

function renderCard(inner, extraClass = "") {
  const shakeClass = state.shake ? " shake" : "";
  const cardClass = extraClass ? ` ${extraClass}` : "";
  return `
    <section class="drop-card${cardClass}${shakeClass}">
      <span class="card-ring" aria-hidden="true"></span>
      <span class="card-sweep" aria-hidden="true"></span>
      ${inner}
    </section>
  `;
}

function renderSignIn() {
  renderScene(renderCard(`
    <header class="drop-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Season 1</span></p>
      <h1 class="drop-title">BudyBattle</h1>
      <p class="drop-tagline">For Real <span class="tagline-mode">(battle royale)</span></p>
    </header>
    <form class="drop-form" data-form="sign-in">
      <label class="drop-field">
        <span class="field-label">Callsign</span>
        <span class="field-wrap">
          ${userIcon()}
          <input name="username" type="text" autocomplete="username" maxlength="20" placeholder="Your callsign" value="${escapeHtml(state.draft)}" required>
        </span>
      </label>
      <label class="drop-field">
        <span class="field-label">Passcode</span>
        <span class="field-wrap">
          ${lockIcon()}
          <input name="password" type="password" autocomplete="current-password" placeholder="Squad passcode" required>
          ${passwordToggle()}
        </span>
      </label>
      ${statusLine()}
      <button class="drop-button" type="submit" ${state.busy ? "disabled" : ""}>
        <span class="button-chevrons" aria-hidden="true"></span>
        <span class="button-text">${state.busy ? "Boarding" : "Drop In"}</span>
      </button>
      <div class="drop-divider"><span>No squad yet?</span></div>
      <button class="drop-button ghost" type="button" data-action="show-create-account">Enlist a Buddy</button>
      ${liveBar()}
    </form>
  `));
}

function renderCreateAccount() {
  renderScene(renderCard(`
    <header class="drop-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Recruit</span></p>
      <h1 class="drop-title">Enlist</h1>
      <p class="drop-tagline">Claim a callsign <span class="tagline-mode">(you keep it)</span></p>
    </header>
    <form class="drop-form" data-form="create-account">
      <label class="drop-field">
        <span class="field-label">Callsign</span>
        <span class="field-wrap">
          ${userIcon()}
          <input name="username" type="text" autocomplete="username" maxlength="20" placeholder="Pick a callsign" value="${escapeHtml(state.draft)}" required>
        </span>
      </label>
      <label class="drop-field">
        <span class="field-label">Passcode</span>
        <span class="field-wrap">
          ${lockIcon()}
          <input name="password" type="password" autocomplete="new-password" placeholder="At least 4 characters" required>
          ${passwordToggle()}
        </span>
      </label>
      ${statusLine()}
      <button class="drop-button" type="submit" ${state.busy ? "disabled" : ""}>
        <span class="button-chevrons" aria-hidden="true"></span>
        <span class="button-text">${state.busy ? "Enlisting" : "Lock It In"}</span>
      </button>
      <div class="drop-divider"><span>Already enlisted?</span></div>
      <button class="drop-button ghost" type="button" data-action="show-sign-in">Back to Drop In</button>
      ${liveBar()}
    </form>
  `));
}

const hubIcons = {
  rewards: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 14.2 8.8 20.5 9.3 15.8 13.2 17.2 19.4 12 16.2 6.8 19.4 8.2 13.2 3.5 9.3 9.8 8.8Z"/>
    </svg>
  `,
  shops: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8.5 6.2 4h11.6L20 8.5V10a3 3 0 0 1-3 3h-1.1a3.5 3.5 0 0 1-6.8 0H8a3 3 0 0 1-3-3V8.5Z"/>
      <path d="M8 13v5.5h8V13"/>
    </svg>
  `,
  bbs: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="3"/>
      <circle cx="16.5" cy="10" r="2.5"/>
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M13 18.5a4.5 4.5 0 0 1 7.5 1"/>
    </svg>
  `,
  battle: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 4v16M4 12h16"/>
      <path d="M12 8.5 14.5 12 12 15.5 9.5 12Z"/>
    </svg>
  `,
  gear: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2"/>
      <path d="M12 2.5v3.2M12 18.3v3.2M2.5 12h3.2M18.3 12h3.2M5.1 5.1l2.3 2.3M16.6 16.6l2.3 2.3M18.9 5.1l-2.3 2.3M7.4 16.6l-2.3 2.3"/>
    </svg>
  `
};

function hubButton(label, variant) {
  const chevrons = variant === "battle"
    ? `<span class="button-chevrons" aria-hidden="true"></span>`
    : "";
  let action = "";
  if (variant === "battle") action = ` data-action="open-battle"`;
  if (variant === "gear") action = ` data-action="open-gear"`;
  if (variant === "shops") action = ` data-action="open-shops"`;
  if (variant === "rewards") action = ` data-action="open-rewards"`;
  if (variant === "bbs") action = ` data-action="open-bbs"`;
  return `
    <button class="drop-button hub-button hub-${variant}" type="button"${action}>
      ${chevrons}
      <span class="hub-icon">${hubIcons[variant]}</span>
      <span class="button-text">${escapeHtml(label)}</span>
    </button>
  `;
}

const modeIcons = {
  fun: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.9" cy="13.5" r="6.7"/>
      <path d="M8.1 12.1c.6-.85 1.7-.85 2.3 0"/>
      <path d="M12.4 12.1c.6-.85 1.7-.85 2.3 0"/>
      <path d="M7.7 15.8a4.1 4.1 0 0 0 6.5 0"/>
      <path d="M7.7 15.8h6.5"/>
      <path class="solid" d="M18.4 2.6 19.4 5.3 22.1 6.3 19.4 7.3 18.4 10 17.4 7.3 14.7 6.3 17.4 5.3Z"/>
      <path d="M20.4 14.5l1.4.8M4.2 5.6 5.1 7.2M3.6 20.4l-1.3.9"/>
      <circle class="solid" cx="19.9" cy="18.4" r="0.9"/>
      <circle class="solid" cx="3.1" cy="9.9" r="0.75"/>
    </svg>
  `,
  competitive: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.6 3.3h3.1l8 8.1"/>
      <path d="M20.4 3.3h-3.1l-8 8.1"/>
      <path d="M13 16.4 16.4 13"/>
      <path d="M11 16.4 7.6 13"/>
      <path d="M14.6 14.8 18 18.2"/>
      <path d="M9.4 14.8 6 18.2"/>
      <circle cx="18.9" cy="19.1" r="1.5"/>
      <circle cx="5.1" cy="19.1" r="1.5"/>
      <path class="solid" d="M12 8.9 13.5 10.7 12 12.5 10.5 10.7Z"/>
    </svg>
  `,
  coop: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6.6" cy="6.2" r="2.7"/>
      <circle cx="17.4" cy="6.2" r="2.7"/>
      <path d="M3.4 9.4a3.6 3.6 0 0 0-1.5 2.9v3.1"/>
      <path d="M20.6 9.4a3.6 3.6 0 0 1 1.5 2.9v3.1"/>
      <path d="M4.1 20.6v-4.2a3.4 3.4 0 0 1 2.5-3.3"/>
      <path d="M19.9 20.6v-4.2a3.4 3.4 0 0 0-2.5-3.3"/>
      <path d="M8.4 13.4l2.4 1.6h2.4l2.4-1.6"/>
      <path class="solid" d="M10.2 15.6h3.6l1 4.9h-5.6Z"/>
      <path d="M12 9.6v3.1"/>
    </svg>
  `,
  ranked: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2.9h8v5.2a4 4 0 0 1-8 0Z"/>
      <path d="M8 4.3H5.2v2a3.4 3.4 0 0 0 3.2 3.4"/>
      <path d="M16 4.3h2.8v2a3.4 3.4 0 0 1-3.2 3.4"/>
      <path class="solid" d="M12 4.1 12.85 5.9 14.8 6.15 13.4 7.5 13.75 9.4 12 8.5 10.25 9.4 10.6 7.5 9.2 6.15 11.15 5.9Z"/>
      <path d="M12 12.1v2.4"/>
      <path d="M9.6 14.5h4.8l1 3.1H8.6Z"/>
      <path d="M6.8 20.9h10.4"/>
      <path d="M7.9 17.6h8.2v3.3"/>
      <path d="M2.6 12.5 4.9 14.7 2.6 16.9"/>
      <path d="M21.4 12.5 19.1 14.7 21.4 16.9"/>
    </svg>
  `
};

function modeButton(label, variant) {
  const action = variant === "ranked"
    ? ` data-action="open-ranked"`
    : variant === "competitive"
      ? ` data-action="open-competitive-play"`
      : variant === "fun"
        ? ` data-action="start-for-fun"`
        : variant === "coop"
          ? ` data-action="open-coop"`
          : "";
  return `
    <button class="drop-button hub-button mode-button mode-${variant}" type="button"${action}>
      <span class="hub-icon">${modeIcons[variant]}</span>
      <span class="button-text">${escapeHtml(label)}</span>
    </button>
  `;
}

function rankedPlainButton(label, variant) {
  const action = variant === "leaderboard"
    ? ` data-action="open-leaderboard"`
    : variant === "play"
      ? ` data-action="open-ranked-play"`
      : "";
  return `
    <button class="drop-button ranked-plain ranked-${variant}" type="button"${action}>
      <span class="button-text">${escapeHtml(label)}</span>
    </button>
  `;
}

function islandMapSvg(uid) {
  return `
    <svg class="island-map-svg" viewBox="0 0 160 92" aria-hidden="true">
      <defs>
        <linearGradient id="is-sky-${uid}" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0" stop-color="#9ad8ff"/>
          <stop offset="0.45" stop-color="#4aa7e4"/>
          <stop offset="1" stop-color="#1a6fa8"/>
        </linearGradient>
        <radialGradient id="is-sun-${uid}" cx="0.82" cy="0.16" r="0.28">
          <stop offset="0" stop-color="#fff8c8"/>
          <stop offset="0.35" stop-color="#ffd56a"/>
          <stop offset="1" stop-color="#ffd56a" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="is-sea-${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5ec8e8"/>
          <stop offset="0.35" stop-color="#1e8fc0"/>
          <stop offset="1" stop-color="#0a4a72"/>
        </linearGradient>
        <radialGradient id="is-mound-${uid}" cx="0.38" cy="0.28" r="0.78">
          <stop offset="0" stop-color="#b6e86a"/>
          <stop offset="0.4" stop-color="#5aaa36"/>
          <stop offset="1" stop-color="#1e4e1c"/>
        </radialGradient>
        <radialGradient id="is-sand-${uid}" cx="0.4" cy="0.2" r="0.85">
          <stop offset="0" stop-color="#ffe9b8"/>
          <stop offset="0.55" stop-color="#e0b66a"/>
          <stop offset="1" stop-color="#9a6a2c"/>
        </radialGradient>
        <linearGradient id="is-trunk-${uid}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#c0894a"/>
          <stop offset="0.45" stop-color="#7a4a22"/>
          <stop offset="1" stop-color="#3a220e"/>
        </linearGradient>
        <radialGradient id="is-leaf-${uid}" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stop-color="#8fe05a"/>
          <stop offset="1" stop-color="#1f6a28"/>
        </radialGradient>
      </defs>
      <rect width="160" height="92" fill="url(#is-sky-${uid})"/>
      <ellipse cx="128" cy="16" rx="28" ry="16" fill="url(#is-sun-${uid})"/>
      <ellipse cx="130" cy="16" rx="8" ry="8" fill="#fff6c2"/>
      <ellipse cx="128" cy="16" rx="5.2" ry="5.2" fill="#ffe27a"/>
      <path d="M0 50c22-7 40-4 56 4 18 9 34 6 50-4 20-12 40-10 54 2v40H0Z" fill="url(#is-sea-${uid})"/>
      <path d="M0 62c30-4 58 2 86-6 20-6 40-2 74 8" stroke="#9be7ff" stroke-width="1.2" fill="none" opacity="0.28"/>
      <path d="M10 74c24-3 48 2 72-4" stroke="#c8f4ff" stroke-width="0.9" fill="none" opacity="0.18"/>
      <ellipse cx="82" cy="80" rx="62" ry="8" fill="#041828" opacity="0.28"/>
      <ellipse cx="80" cy="74" rx="58" ry="16" fill="url(#is-sand-${uid})"/>
      <ellipse cx="80" cy="73" rx="50" ry="12" fill="#fff1c4" opacity="0.22"/>
      <ellipse cx="78" cy="70" rx="46" ry="18" fill="url(#is-mound-${uid})"/>
      <ellipse cx="68" cy="64" rx="22" ry="10" fill="#d4f08a" opacity="0.35"/>
      <ellipse cx="92" cy="68" rx="18" ry="8" fill="#163816" opacity="0.28"/>
      <ellipse cx="80" cy="76" rx="40" ry="7" fill="#0c2810" opacity="0.18"/>
      <path d="M38 74c8-2 18-1 26 3 8-6 20-8 32-4 8 3 18 2 26-2" stroke="#fff8d8" stroke-width="1.4" fill="none" opacity="0.35"/>

      <rect x="87.2" y="46" width="3.2" height="16" rx="1.2" fill="url(#is-trunk-${uid})"/>
      <ellipse cx="89" cy="44" rx="8.4" ry="7.2" fill="url(#is-leaf-${uid})"/>
      <ellipse cx="84" cy="46" rx="5" ry="4.2" fill="#2f7a2a"/>
      <ellipse cx="93" cy="45" rx="4.4" ry="3.6" fill="#b6f06a" opacity="0.7"/>
      <rect x="54.6" y="50" width="2.4" height="12" rx="1" fill="url(#is-trunk-${uid})"/>
      <ellipse cx="56" cy="48" rx="6.2" ry="5.2" fill="url(#is-leaf-${uid})"/>
      <ellipse cx="53" cy="50" rx="3.6" ry="3" fill="#245c22"/>
      <rect x="116.6" y="56" width="2.2" height="10" rx="1" fill="url(#is-trunk-${uid})"/>
      <ellipse cx="118" cy="55" rx="5.6" ry="4.6" fill="url(#is-leaf-${uid})"/>

      <ellipse cx="52" cy="78" rx="9" ry="2.2" fill="#000000" opacity="0.2"/>
      <path d="M46 74h16l-2.4 5H48.4Z" fill="#8a5a28"/>
      <path d="M46 74h16l-2.4 5H48.4Z" fill="#3a220e" opacity="0.25"/>
      <path d="M48 74h12V68.6L54 64 48 68.6Z" fill="#f0d8a8"/>
      <path d="M54 64 60 68.6V74h-6Z" fill="#c8a66a"/>
      <path d="M48 74h12V68.6L54 64Z" fill="#000000" opacity="0.12"/>
      <rect x="52.6" y="70.2" width="2.8" height="3.8" fill="#4a2c12"/>
    </svg>
  `;
}

function volcanoRock3d(cx, cy, s, rot) {
  return `
    <g transform="translate(${cx} ${cy}) rotate(${rot})">
      <ellipse cx="0" cy="${s * 0.7}" rx="${s * 0.7}" ry="${s * 0.28}" fill="#000000" opacity="0.28"/>
      <path d="M${-s} ${s * 0.2} L${-s * 0.15} ${-s} L${s * 0.85} ${-s * 0.15} L${s * 0.7} ${s * 0.55} Z" fill="#6e5a52"/>
      <path d="M${-s} ${s * 0.2} L${-s * 0.15} ${-s} L${s * 0.2} ${s * 0.1} Z" fill="#c4b2a4"/>
      <path d="M${s * 0.2} ${s * 0.1} L${-s * 0.15} ${-s} L${s * 0.85} ${-s * 0.15} Z" fill="#8a7468"/>
      <path d="M${-s} ${s * 0.2} L${s * 0.2} ${s * 0.1} L${s * 0.7} ${s * 0.55} Z" fill="#3a2a24"/>
    </g>
  `;
}

function volcanoMapSvg(uid, erupting) {
  return `
    <svg class="island-map-svg" viewBox="0 0 160 92" aria-hidden="true">
      <defs>
        <linearGradient id="vo-sky-${uid}" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stop-color="#1a1020"/>
          <stop offset="0.45" stop-color="#5a2030"/>
          <stop offset="1" stop-color="#8a3418"/>
        </linearGradient>
        <radialGradient id="vo-glow-${uid}" cx="0.5" cy="0.28" r="0.42">
          <stop offset="0" stop-color="#ffb347" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#ff4b1f" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="vo-cone-${uid}" x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0" stop-color="#2a1c18"/>
          <stop offset="0.28" stop-color="#8a7468"/>
          <stop offset="0.48" stop-color="#d2c0b4"/>
          <stop offset="0.62" stop-color="#6a544c"/>
          <stop offset="1" stop-color="#140e0c"/>
        </linearGradient>
        <linearGradient id="vo-land-${uid}" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stop-color="#7aaa44"/>
          <stop offset="0.45" stop-color="#3a5c22"/>
          <stop offset="1" stop-color="#1a2c10"/>
        </linearGradient>
        <linearGradient id="vo-lava-${uid}" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stop-color="#fff6c2"/>
          <stop offset="0.2" stop-color="#ffb133"/>
          <stop offset="0.55" stop-color="#ef3d10"/>
          <stop offset="1" stop-color="#5a0c08"/>
        </linearGradient>
        <radialGradient id="vo-crater-${uid}" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stop-color="#fff4b0"/>
          <stop offset="0.28" stop-color="#ff7a1f"/>
          <stop offset="1" stop-color="#3a0808"/>
        </radialGradient>
      </defs>
      <rect width="160" height="92" fill="url(#vo-sky-${uid})"/>
      <ellipse cx="24" cy="16" rx="22" ry="8" fill="#2a1018" opacity="0.45"/>
      <ellipse cx="138" cy="12" rx="26" ry="9" fill="#140c10" opacity="0.4"/>
      <ellipse cx="80" cy="36" rx="46" ry="26" fill="url(#vo-glow-${uid})"/>

      <ellipse cx="80" cy="86" rx="68" ry="8" fill="#000000" opacity="0.32"/>
      <ellipse cx="78" cy="78" rx="70" ry="16" fill="url(#vo-land-${uid})"/>
      <ellipse cx="58" cy="74" rx="24" ry="8" fill="#b6d86a" opacity="0.28"/>
      <ellipse cx="104" cy="80" rx="34" ry="10" fill="url(#vo-lava-${uid})"/>
      <path d="M78 76c10 2 22 6 34 8 12 2 22 0 36-4v12H72Z" fill="url(#vo-lava-${uid})"/>
      <path d="M86 80c12 2 26 4 40 0" stroke="#fff4b0" stroke-width="1.3" fill="none" opacity="0.45"/>
      <path d="M94 84c10 1 22 2 32-1" stroke="#5a0c08" stroke-width="2" fill="none" opacity="0.35"/>

      <path d="M34 80 68 20h24l36 60Z" fill="url(#vo-cone-${uid})"/>
      <path d="M34 80 80 22 80 80Z" fill="#000000" opacity="0.08"/>
      <path d="M80 22 126 80 80 80Z" fill="#000000" opacity="0.28"/>
      <ellipse cx="80" cy="48" rx="18" ry="5" fill="#000000" opacity="0.1"/>
      <ellipse cx="80" cy="62" rx="26" ry="6" fill="#000000" opacity="0.08"/>
      <path d="M64 20c4-6 10-9 16-9s12 3 16 9l-5 5H69Z" fill="#3a2a24"/>
      <path d="M69 25h22l-3 3H72Z" fill="#1a1210"/>
      <ellipse cx="80" cy="23" rx="12.5" ry="4.6" fill="url(#vo-crater-${uid})"/>
      <ellipse cx="80" cy="22.2" rx="7" ry="2.2" fill="#fff4b0" opacity="0.7"/>

      <path d="M76 27c1 16 2 32 4 49 5-18 10-34 16-47-6 0-13-1-20-2Z" fill="url(#vo-lava-${uid})"/>
      <path d="M84 30c4 16 10 30 16 42 8-5 16-4 24 1-14-16-24-30-30-44-4 0-7 1-10 1Z" fill="url(#vo-lava-${uid})" opacity="0.92"/>
      <path d="M80 32c1 14 2 28 3 42" stroke="#fff6c2" stroke-width="1.4" opacity="0.55"/>
      <path d="M92 40c4 12 10 24 16 32" stroke="#ffb133" stroke-width="1.2" opacity="0.4"/>

      ${volcanoRock3d(30, 76, 6.2, -18)}
      ${volcanoRock3d(128, 74, 7.4, 16)}
      ${volcanoRock3d(48, 82, 4.2, 8)}

      <ellipse cx="68" cy="6" rx="8" ry="3.2" fill="#efe6d8" opacity="0.28"/>
      <ellipse cx="86" cy="3" rx="10" ry="3.6" fill="#efe6d8" opacity="0.22"/>
      <ellipse cx="80" cy="10" rx="6" ry="2.4" fill="#efe6d8" opacity="0.18"/>
      <path d="M72 20c-3-8-1-14 3-18" stroke="#efe6d8" stroke-width="2" fill="none" opacity="0.28" stroke-linecap="round"/>
      <path d="M80 18c1-10 3-16 7-20" stroke="#f4ece0" stroke-width="2.3" fill="none" opacity="0.22" stroke-linecap="round"/>
      <path d="M88 20c3-8 2-14-1-18" stroke="#efe6d8" stroke-width="1.8" fill="none" opacity="0.2" stroke-linecap="round"/>
      ${erupting ? `
      <ellipse cx="80" cy="18" rx="22" ry="12" fill="#ffb133" opacity="0.2"/>
      <path d="M74 22 70 4l5-1 5 18Z" fill="#ff7a1f" opacity="0.75"/>
      <path d="M86 22 92 2l5 2-5 18Z" fill="#ef3d10" opacity="0.7"/>
      ${volcanoRock3d(58, 10, 5.6, -32)}
      ${volcanoRock3d(104, 8, 6.4, 28)}
      ${volcanoRock3d(74, 2, 4.8, -8)}
      ${volcanoRock3d(90, 0, 5.2, 18)}
      ${volcanoRock3d(46, 22, 3.8, -22)}
      ${volcanoRock3d(118, 24, 4.4, 20)}
      ${volcanoRock3d(80, -2, 3.6, 6)}
      <circle cx="62" cy="6" r="1.3" fill="#fff4b0"/>
      <circle cx="108" cy="12" r="1.1" fill="#ffb133"/>
      <circle cx="50" cy="16" r="1" fill="#ef3d10"/>
      ` : ""}
    </svg>
  `;
}

const MAP_VARIANT_IDS = { lv1: "island", volcano: "volcano", erupt: "hardVolcano" };

function rankedMapButton(title, variant, mode) {
  const art = variant === "volcano"
    ? volcanoMapSvg(variant, false)
    : variant === "erupt"
      ? volcanoMapSvg(variant, true)
      : islandMapSvg(variant);
  return `
    <button class="drop-button ranked-map ranked-map-${variant}" type="button" data-action="drop-map" data-map="${MAP_VARIANT_IDS[variant]}" data-mode="${mode}">
      <span class="ranked-map-art">${art}</span>
      <span class="button-text">${escapeHtml(title)}</span>
    </button>
  `;
}

function applyAccountToState(account) {
  state.username = account.username;
  state.drops = account.drops || 0;
  state.league = account.league || "";
  state.leagueName = account.leagueName || "";
  state.leagueRank = account.leagueRank || 0;
  state.stars = Number.isFinite(account.stars) ? account.stars : 0;
}

function loadShopProfile(account) {
  if (account.shopSynced) {
    state.shopCoins = Math.max(0, Number(account.shopCoins) || 0);
    state.shopDiamonds = Math.max(0, Number(account.shopDiamonds) || 0);
    applyShopInventory(sanitizeShopInventory(account.shopInventory));
  } else {
    const local = readShopWalletRecord(account.username);
    state.shopCoins = Math.max(Number(account.shopCoins) || 0, local.coins);
    state.shopDiamonds = Math.max(Number(account.shopDiamonds) || 0, local.diamonds);
    applyShopInventory(readShopInventoryRecord(account.username));
  }
  persistShopWallet();
  persistShopInventory();
}

function walletStoreKey(username) {
  return String(username || "").trim().toLowerCase();
}

function readShopWalletRecord(username) {
  if (!username) return { coins: 0, diamonds: 0 };
  try {
    const store = JSON.parse(localStorage.getItem(SHOP_WALLET_KEY) || "{}");
    const key = walletStoreKey(username);
    const entry = store[key] || store[username];
    if (!entry || typeof entry !== "object") return { coins: 0, diamonds: 0 };
    return {
      coins: Math.max(0, Number(entry.coins) || 0),
      diamonds: Math.max(0, Number(entry.diamonds) || 0)
    };
  } catch {
    return { coins: 0, diamonds: 0 };
  }
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readRewardsSpinDate(username) {
  if (!username) return "";
  try {
    const store = JSON.parse(localStorage.getItem(REWARDS_SPIN_KEY) || "{}");
    return typeof store[username] === "string" ? store[username] : "";
  } catch {
    return "";
  }
}

function writeRewardsSpinDate(username, dateKey) {
  if (!username || !dateKey) return;
  try {
    const store = JSON.parse(localStorage.getItem(REWARDS_SPIN_KEY) || "{}");
    store[username] = dateKey;
    localStorage.setItem(REWARDS_SPIN_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

function canSpinRewardsToday(username) {
  return readRewardsSpinDate(username) !== getLocalDateKey();
}

function writeShopWalletRecord(username, coins, diamonds) {
  if (!username) return;
  try {
    const store = JSON.parse(localStorage.getItem(SHOP_WALLET_KEY) || "{}");
    const key = walletStoreKey(username);
    delete store[username];
    store[key] = {
      coins: Math.max(0, Math.floor(coins)),
      diamonds: Math.max(0, Math.floor(diamonds))
    };
    localStorage.setItem(SHOP_WALLET_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

function readShopInventoryStore() {
  try {
    const store = JSON.parse(localStorage.getItem(SHOP_INVENTORY_KEY) || "{}");
    return store && typeof store === "object" ? store : {};
  } catch {
    return {};
  }
}

function readShopInventoryRecord(username) {
  const store = readShopInventoryStore();
  return sanitizeShopInventory(username ? store[walletStoreKey(username)] || store[username] : null);
}

function sanitizeShopInventory(entry) {
  const oneGame = {};
  if (entry && entry.oneGame && typeof entry.oneGame === "object") {
    Object.entries(entry.oneGame).forEach(([name, count]) => {
      const value = Math.floor(Number(count) || 0);
      if (WEAPON_SHOP_ITEMS.includes(name) && value > 0) oneGame[name] = value;
    });
  }
  const permanent = Array.isArray(entry?.permanent)
    ? entry.permanent.filter((name) => WEAPON_SHOP_ITEMS.includes(name))
    : [];
  const equipped = Array.isArray(entry?.equipped)
    ? entry.equipped
      .filter((name) => oneGame[name] > 0 || permanent.includes(name))
      .slice(0, MAX_EQUIPPED_WEAPONS)
    : [];
  const potions = {};
  if (entry?.potions && typeof entry.potions === "object") {
    Object.entries(entry.potions).forEach(([name, count]) => {
      const value = Math.floor(Number(count) || 0);
      if (SPIN_POTION_NAMES.includes(name) && value > 0) potions[name] = value;
    });
  }
  const potionsPermanent = Array.isArray(entry?.potionsPermanent)
    ? entry.potionsPermanent.filter((name) => SPIN_POTION_NAMES.includes(name))
    : [];
  let equippedPotion = typeof entry?.equippedPotion === "string" ? entry.equippedPotion : "";
  if (!SPIN_POTION_NAMES.includes(equippedPotion) || !(potions[equippedPotion] > 0 || potionsPermanent.includes(equippedPotion))) {
    equippedPotion = "";
  }
  const bbOneGame = {};
  if (entry?.bbOneGame && typeof entry.bbOneGame === "object") {
    Object.entries(entry.bbOneGame).forEach(([name, count]) => {
      const value = Math.floor(Number(count) || 0);
      if (findBb(name) && value > 0) bbOneGame[name] = value;
    });
  }
  const bbPermanent = Array.isArray(entry?.bbPermanent)
    ? entry.bbPermanent.filter((name) => findBb(name))
    : [];
  let equippedBb = typeof entry?.equippedBb === "string" ? entry.equippedBb : "";
  if (!(bbOneGame[equippedBb] > 0) && !bbPermanent.includes(equippedBb)) equippedBb = "";
  const skins = Array.isArray(entry?.skins) ? entry.skins.filter((id) => SKIN_IDS.includes(id)) : [];
  const equippedSkin = skins.includes(entry?.equippedSkin) ? entry.equippedSkin : "";
  return { oneGame, permanent, equipped, potions, potionsPermanent, equippedPotion, bbOneGame, bbPermanent, equippedBb, skins, equippedSkin };
}

function buySkin(id) {
  const entry = findSkin(id);
  if (!entry) return;
  if (state.ownedSkins.includes(id)) {
    state.gearNotice = `You already own ${entry.name}.`;
    return;
  }
  const currency = skinCurrency(entry);
  const balance = currency === "diamonds" ? state.shopDiamonds : state.shopCoins;
  if (balance < entry.price) {
    state.gearNotice = `Not enough ${currency} for ${entry.name}.`;
    return;
  }
  if (currency === "diamonds") state.shopDiamonds -= entry.price;
  else state.shopCoins -= entry.price;
  state.ownedSkins = [...state.ownedSkins, id];
  state.equippedSkin = id;
  state.skinTryOn = "";
  persistShopWallet();
  persistShopInventory();
  state.gearNotice = `Unlocked and equipped ${entry.name}!`;
}

function toggleEquipSkin(id) {
  const entry = findSkin(id);
  if (!entry || !state.ownedSkins.includes(id)) return;
  state.skinTryOn = "";
  if (state.equippedSkin === id) {
    state.equippedSkin = "";
    state.gearNotice = `Unequipped ${entry.name}.`;
  } else {
    state.equippedSkin = id;
    state.gearNotice = `Equipped ${entry.name}.`;
  }
  persistShopInventory();
}

function findBb(name) {
  return BB_CATALOG.find((bb) => bb.name === name) || null;
}

function isBbOwned(name) {
  return (state.ownedBbsOneGame[name] || 0) > 0 || state.ownedBbsPermanent.includes(name);
}

function toggleEquipBb(name) {
  if (!isBbOwned(name)) return;
  if (state.equippedBb === name) {
    state.equippedBb = "";
    state.gearNotice = `Unequipped ${name}.`;
  } else {
    state.equippedBb = name;
    state.gearNotice = `Equipped ${name}.`;
  }
  persistShopInventory();
}

function buyBb(name, plan) {
  const bb = findBb(name);
  if (!bb) return;
  if (plan !== "one-game" && plan !== "permanent") return;
  if (plan === "permanent" && state.ownedBbsPermanent.includes(name)) {
    state.bbsNotice = `You already own ${name} permanently.`;
    return;
  }
  const price = getBbPlanPrice(bb, plan);
  if (state.shopCoins < price) {
    state.bbsNotice = "Not enough coins.";
    return;
  }
  state.shopCoins -= price;
  if (plan === "permanent") {
    state.ownedBbsPermanent = [...state.ownedBbsPermanent, name];
  } else {
    state.ownedBbsOneGame = { ...state.ownedBbsOneGame, [name]: (state.ownedBbsOneGame[name] || 0) + 1 };
  }
  persistShopWallet();
  persistShopInventory();
  state.bbsNotice = `Bought ${name} ${plan === "permanent" ? "permanently" : "for 1 game"}.`;
}

function pickRandomSpinPotion() {
  const weights = SPIN_POTION_ITEMS.map((entry) => 1 / entry.oneGameCoins);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let index = 0; index < SPIN_POTION_ITEMS.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return SPIN_POTION_ITEMS[index].name;
  }
  return SPIN_POTION_ITEMS[SPIN_POTION_ITEMS.length - 1].name;
}

function grantSpinPotionPermanent(name) {
  if (!SPIN_POTION_NAMES.includes(name)) return false;
  if (state.ownedPotionsPermanent.includes(name)) return false;
  state.ownedPotionsPermanent = [...state.ownedPotionsPermanent, name];
  persistShopInventory();
  return true;
}

function grantSpinBbOneGame(name) {
  if (!findBb(name)) return;
  state.ownedBbsOneGame = { ...state.ownedBbsOneGame, [name]: (state.ownedBbsOneGame[name] || 0) + 1 };
  persistShopInventory();
}

function isWeaponOwned(name) {
  return (state.ownedOneGame[name] || 0) > 0 || state.ownedPermanent.includes(name);
}

function isPotionOwned(name) {
  return (state.ownedPotions[name] || 0) > 0 || state.ownedPotionsPermanent.includes(name);
}

function gearPotionArtSvg(name) {
  if (name === "Water Bottle") return waterBottleArtSvg();
  if (name === "Health Potion") return potionArtSvg("liquidgreen");
  if (name === "Defense Potion (1 min)") return potionArtSvg("liquidblue", "small");
  if (name === "Defense Potion") return potionArtSvg("liquidblue");
  if (name === "Red Glass") return potionArtSvg("liquidred", "small");
  if (name === "Red Glass (game)") return potionArtSvg("liquidred");
  if (name === "Fire Resistance Potion") return fireBottleArtSvg("small");
  if (name === "Fire Resistance Potion (game)") return fireBottleArtSvg();
  return potionArtSvg("liquidblue");
}

function toggleEquipPotion(name) {
  if (!isPotionOwned(name)) return;
  if (state.equippedPotion === name) {
    state.equippedPotion = "";
    state.gearNotice = `Unequipped ${name}.`;
  } else {
    state.equippedPotion = name;
    state.gearNotice = `Equipped ${name}.`;
  }
  persistShopInventory();
}

function toggleEquipWeapon(name) {
  if (!isWeaponOwned(name)) return;
  if (state.equippedWeapons.includes(name)) {
    state.equippedWeapons = state.equippedWeapons.filter((entry) => entry !== name);
    state.gearNotice = `Unequipped ${name}.`;
  } else if (state.equippedWeapons.length >= MAX_EQUIPPED_WEAPONS) {
    state.gearNotice = `You can only equip ${MAX_EQUIPPED_WEAPONS}. Unequip one first.`;
    return;
  } else {
    state.equippedWeapons = [...state.equippedWeapons, name];
    state.gearNotice = `Equipped ${name}.`;
  }
  persistShopInventory();
}

function syncShopWalletFromStorage() {
  const wallet = readShopWalletRecord(state.username);
  state.shopCoins = wallet.coins;
  state.shopDiamonds = wallet.diamonds;
  applyShopInventory(readShopInventoryRecord(state.username));
}

function applyShopInventory(inventory) {
  state.ownedOneGame = inventory.oneGame;
  state.ownedPermanent = inventory.permanent;
  state.ownedPotions = inventory.potions;
  state.ownedPotionsPermanent = inventory.potionsPermanent;
  state.equippedPotion = inventory.equippedPotion;
  state.equippedWeapons = inventory.equipped;
  state.ownedBbsOneGame = inventory.bbOneGame;
  state.ownedBbsPermanent = inventory.bbPermanent;
  state.equippedBb = inventory.equippedBb;
  state.ownedSkins = inventory.skins;
  state.equippedSkin = inventory.equippedSkin;
}

let profileSaveTimer = null;

function scheduleProfileSave() {
  if (!state.username || !state.password) return;
  clearTimeout(profileSaveTimer);
  const username = state.username;
  const password = state.password;
  profileSaveTimer = setTimeout(() => {
    postAuth("/api/profile", username, password, {
      coins: state.shopCoins,
      diamonds: state.shopDiamonds,
      inventory: currentShopInventory()
    }).catch(() => {});
  }, 250);
}

function currentShopInventory() {
  return {
    oneGame: state.ownedOneGame,
    permanent: state.ownedPermanent,
    potions: state.ownedPotions,
    potionsPermanent: state.ownedPotionsPermanent,
    equippedPotion: state.equippedPotion,
    equipped: state.equippedWeapons,
    bbOneGame: state.ownedBbsOneGame,
    bbPermanent: state.ownedBbsPermanent,
    equippedBb: state.equippedBb,
    skins: state.ownedSkins,
    equippedSkin: state.equippedSkin
  };
}

function persistShopWallet() {
  if (!state.username) return;
  writeShopWalletRecord(state.username, state.shopCoins, state.shopDiamonds);
  scheduleProfileSave();
}

function persistShopInventory() {
  if (!state.username) return;
  try {
    const store = readShopInventoryStore();
    delete store[state.username];
    store[walletStoreKey(state.username)] = currentShopInventory();
    localStorage.setItem(SHOP_INVENTORY_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
  scheduleProfileSave();
}

function getWeaponPlanPrice(name, plan) {
  if (plan === "permanent") return getWeaponPermanentShopPrice(name);
  return getWeaponShopPrice(name);
}

function buyWeapon(name, plan) {
  if (!WEAPON_SHOP_ITEMS.includes(name)) return;
  if (plan !== "one-game" && plan !== "permanent") return;
  if (plan === "permanent" && state.ownedPermanent.includes(name)) {
    state.shopNotice = `You already own ${name} permanently.`;
    return;
  }
  const price = getWeaponPlanPrice(name, plan);
  if (state.shopCoins < price) {
    state.shopNotice = "Not enough coins.";
    return;
  }
  state.shopCoins -= price;
  if (plan === "permanent") {
    state.ownedPermanent = [...state.ownedPermanent, name];
  } else {
    state.ownedOneGame = { ...state.ownedOneGame, [name]: (state.ownedOneGame[name] || 0) + 1 };
  }
  persistShopWallet();
  persistShopInventory();
  const planLabel = plan === "permanent" ? "permanently" : "for 1 game";
  state.shopNotice = `Bought ${name} ${planLabel}.`;
}

function buyCurrencyDeal(dealId) {
  const deal = CURRENCY_DEALS[dealId];
  if (!deal) return;
  if (state.shopDiamonds < deal.diamondCost) {
    state.shopNotice = "Not enough diamonds.";
    return;
  }
  state.shopDiamonds -= deal.diamondCost;
  state.shopCoins += deal.coinReward;
  persistShopWallet();
  state.shopNotice = `Traded ${deal.diamondCost} diamonds for ${deal.coinReward} coins.`;
}

function leaderboardTierRows(activeLeague) {
  const maxShare = 35;
  return LEADERBOARD_TIERS.map((tier) => {
    const barWidth = (tier.percent / maxShare) * 100;
    const activeClass = tier.id === activeLeague ? " lb-tier-active" : "";
    return `
      <article class="lb-tier lb-${tier.id}${activeClass}">
        <div class="lb-tier-head">
          <h2 class="lb-tier-name">${escapeHtml(tier.name)}</h2>
          <p class="lb-tier-label">${escapeHtml(tier.label)}</p>
        </div>
        <div class="lb-tier-track" aria-hidden="true">
          <span class="lb-tier-fill" style="width:${barWidth.toFixed(2)}%"></span>
        </div>
        <p class="lb-tier-share"><span class="lb-tier-pct">${tier.percent}%</span> player share</p>
      </article>
    `;
  }).join("");
}

function leagueRosterRows(roster) {
  return roster.map((row) => `
    <div class="lb-row${row.you ? " lb-row-you" : ""}">
      <span class="lb-row-rank">#${row.rank}</span>
      <span class="lb-row-name">
        ${escapeHtml(row.username)}
        ${row.leagueName ? `<span class="lb-row-league">${escapeHtml(row.leagueName)}</span>` : ""}
        ${row.you ? `<span class="lb-you-tag">You</span>` : ""}
      </span>
      <span class="lb-row-stars">${escapeHtml(formatStars(row.stars))}</span>
    </div>
  `).join("");
}

function renderLeaderboardStanding() {
  if (state.leaderboardLoading) {
    return `<p class="lb-loading">Scanning your league...</p>`;
  }
  if (state.leaderboardError) {
    return `<p class="drop-status error" role="alert">${escapeHtml(state.leaderboardError)}</p>`;
  }
  if (!state.leaderboard) {
    return `<p class="lb-loading">Preparing ranks...</p>`;
  }

  const { you, roster } = state.leaderboard;
  return `
    <section class="lb-you-card lb-${you.league}" aria-label="Your rank">
      <p class="lb-you-kicker">Your standing</p>
      <h2 class="lb-you-league">${escapeHtml(you.leagueName)} League</h2>
      <p class="lb-you-rank">Rank <strong>#${you.leagueRank}</strong> of ${you.leagueSize} real ${you.leagueSize === 1 ? "account" : "accounts"}</p>
      <p class="lb-you-stars">${escapeHtml(formatStars(you.stars))}</p>
      <p class="lb-you-blurb">${escapeHtml(you.leagueLabel)}</p>
    </section>
    <section class="lb-roster-wrap" aria-label="Signed-up accounts">
      <div class="lb-roster-head">
        <h2 class="lb-roster-title">Signed-up accounts</h2>
        <p class="lb-roster-badge">${roster.length} real ${roster.length === 1 ? "account" : "accounts"}</p>
      </div>
      <p class="lb-roster-hint">${roster.length > 1 ? "Scroll to see every signed-up account, ranked by stars." : "Only your account is on the board until someone else signs up."}</p>
      <div class="lb-roster" tabindex="0">
        ${leagueRosterRows(roster)}
      </div>
    </section>
  `;
}

function renderLeaderboard() {
  const activeLeague = state.leaderboard?.you?.league || state.league;
  renderScene(renderCard(`
    <header class="drop-head hub-head lb-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Ranked</span></p>
      <h1 class="drop-title drop-title-compact">Leaderboard</h1>
      <p class="drop-tagline">${escapeHtml(state.username || "Buddy")} <span class="tagline-mode">(season 1)</span></p>
    </header>
    ${renderLeaderboardStanding()}
    <div class="lb-list" role="list">
      ${leaderboardTierRows(activeLeague)}
    </div>
    <p class="lb-footnote">Tier shares total 100% of ranked players.</p>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="ranked-back">Back to Ladder</button>
  `, "leaderboard-card"));
}

async function loadLeaderboard() {
  if (!state.username || !state.password) {
    state.leaderboardError = "Sign in again to view the leaderboard.";
    state.leaderboardLoading = false;
    render();
    return;
  }

  state.leaderboardLoading = true;
  state.leaderboardError = "";
  render();

  try {
    const data = await postAuth("/api/leaderboard", state.username, state.password);
    state.leaderboard = data;
    applyAccountToState(data.you);
  } catch (error) {
    state.leaderboard = null;
    state.leaderboardError = error.message;
  }

  state.leaderboardLoading = false;
  render();

  requestAnimationFrame(() => {
    app.querySelector(".lb-row-you")?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function renderRankedMenu() {
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Ranked</span></p>
      <h1 class="drop-title drop-title-compact">Ladder</h1>
      <p class="drop-tagline">Climb or queue <span class="tagline-mode">(for real)</span></p>
    </header>
    <nav class="ranked-menu" aria-label="Ranked options">
      ${rankedPlainButton("Check Leaderboard", "leaderboard")}
      ${rankedPlainButton("Play", "play")}
    </nav>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="battle-back">Back to Drop Zone</button>
    ${liveBar()}
  `));
}

function renderRankedPlay() {
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Ranked</span></p>
      <h1 class="drop-title drop-title-compact">Drop Maps</h1>
      <p class="drop-tagline">Pick an island <span class="tagline-mode">(for real)</span></p>
    </header>
    <nav class="ranked-map-menu" aria-label="Ranked maps">
      ${rankedMapButton("3rd 5 star, 2nd 10 star, 1st 25 star", "lv1", "ranked")}
      ${rankedMapButton("3rd 10 star, 2nd 20 star, 1st 50 star", "volcano", "ranked")}
      ${rankedMapButton("3rd 25 star, 2nd 50 star, 1st 125 star", "erupt", "ranked")}
    </nav>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="ranked-back">Back to Ladder</button>
    ${liveBar()}
  `, "ranked-play-card"));
}

function renderCompetitivePlay() {
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Competitive</span></p>
      <h1 class="drop-title drop-title-compact">Drop Maps</h1>
      <p class="drop-tagline">Pick an island <span class="tagline-mode">(for real)</span></p>
    </header>
    <nav class="ranked-map-menu" aria-label="Competitive maps">
      ${rankedMapButton("1st 300 coin, 2nd 200 coin, 3rd 100 coin, top 8: 3 coin", "lv1", "competitive")}
      ${rankedMapButton("1st 500 coin, 2nd 300 coin, 3rd 150 coin, top 15: 5 coin", "volcano", "competitive")}
      ${rankedMapButton("1st 1000 coin, 2nd 500 coin, 3rd 300 coin, top 10: 15 coin, 11-20th: 5 coin", "erupt", "competitive")}
    </nav>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="battle-back">Back to Drop Zone</button>
    ${liveBar()}
  `, "ranked-play-card"));
}

let matchSocket = null;
let coopSocket = null;
let coopReady = false;

function isCoopScreen() {
  return state.screen === "coop" || state.screen === "coop-friend" || state.screen === "coop-friends" || state.screen === "coop-play" || state.screen === "coop-chat";
}

function needsCoopConnection() {
  return isCoopScreen() || state.screen === "lobby";
}

function closeCoopSocket() {
  if (!coopSocket || coopSocket === matchSocket) {
    coopSocket = null;
    coopReady = false;
    return;
  }
  const socket = coopSocket;
  coopSocket = null;
  coopReady = false;
  socket.onclose = null;
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
}

function ensureCoopSocket() {
  if (!state.username || !state.password) return;
  if (matchSocket && matchSocket.readyState === WebSocket.OPEN && state.screen !== "match") {
    coopSocket = matchSocket;
    coopReady = matchDropAuthed;
    return;
  }
  if (coopSocket && coopSocket.readyState === WebSocket.OPEN) return;
  if (coopSocket && coopSocket.readyState === WebSocket.CONNECTING) return;
  closeCoopSocket();
  const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  coopSocket = socket;
  socket.onopen = () => {
    socket.send(JSON.stringify({
      t: "hello",
      username: state.username,
      password: state.password,
      avatar: state.avatar,
      loadout: { weapons: state.equippedWeapons, potion: state.equippedPotion, bb: state.equippedBb, skin: state.equippedSkin }
    }));
  };
  socket.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleCoopMessage(msg);
  };
  socket.onclose = () => {
    if (coopSocket !== socket) return;
    coopSocket = null;
    coopReady = false;
    if (needsCoopConnection()) {
      state.coopNotice = "Lost connection to co-op lobby. Reconnecting…";
      render();
      ensureCoopSocket();
    }
  };
}

function handleCoopMessage(msg) {
  if (msg.t === "hello-ok") {
    coopReady = true;
    if (needsCoopConnection()) render();
    return;
  }
  if (msg.t === "coop") {
    state.coopFriends = Array.isArray(msg.friends) ? msg.friends : [];
    state.coopIncoming = Array.isArray(msg.incoming) ? msg.incoming : [];
    state.coopOutgoing = Array.isArray(msg.outgoing) ? msg.outgoing : [];
    if (needsCoopConnection()) render();
    return;
  }
  if (msg.t === "party") {
    state.coopParty = msg.party || null;
    state.coopBattleInvites = Array.isArray(msg.invites) ? msg.invites : [];
    if (isCoopScreen()) render();
    return;
  }
  if (msg.t === "coop-notice") {
    state.coopNotice = String(msg.text || "");
    if (needsCoopConnection()) render();
    return;
  }
  if (msg.t === "start" && coopSocket) {
    const socket = coopSocket;
    coopSocket = null;
    coopReady = false;
    if (matchSocket && matchSocket !== socket) detachMatchSocket();
    clearPlayBotsWatchdog();
    matchLeaveIntent = false;
    matchDropAuthed = true;
    state.coopParty = null;
    if (!msg.resumed) {
      state.matchQueue = { mode: "zombies", map: "island", count: 0, needed: 0, waitMs: 0, status: "Starting zombie survival..." };
    }
    bindMatchSocket(socket);
    handleMatchMessage(msg);
  }
}

function sendCoop(payload) {
  if (!coopSocket || coopSocket.readyState !== WebSocket.OPEN) {
    state.coopNotice = "Connecting to co-op… try again in a moment.";
    ensureCoopSocket();
    render();
    return false;
  }
  coopSocket.send(JSON.stringify(payload));
  return true;
}

function sendCoopFriendRequest(username) {
  const to = String(username || "").trim();
  if (!to) {
    state.coopNotice = "Enter a callsign to invite.";
    render();
    return;
  }
  state.coopDraft = to;
  if (!coopSocket || coopSocket.readyState !== WebSocket.OPEN) {
    state.coopNotice = "Connecting to co-op… try again in a moment.";
    ensureCoopSocket();
    render();
    return;
  }
  coopSocket.send(JSON.stringify({ t: "friendRequest", to }));
}

function acceptCoopFriend(from) {
  if (!sendCoop({ t: "friendAccept", from })) {
    state.coopNotice = "Not connected. Wait a moment and try again.";
    render();
  }
}

function declineCoopFriend(from) {
  if (!sendCoop({ t: "friendDecline", from })) {
    state.coopNotice = "Not connected. Wait a moment and try again.";
    render();
  }
}

const VOICE_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
const VOICE_RING_MS = 30000;
const SOCIAL_NOTICE_MS = 4500;

const social = {
  socket: null,
  retryTimer: null,
  retryAttempt: 0,
  friends: [],
  unread: {},
  chats: {},
  notice: "",
  noticeTimer: null,
  call: null
};

const socialBar = document.createElement("div");
socialBar.className = "social-bar";
socialBar.setAttribute("aria-label", "Friends");
document.body.appendChild(socialBar);

const voiceAudio = document.createElement("audio");
voiceAudio.autoplay = true;
document.body.appendChild(voiceAudio);

function socialKey(name) {
  return String(name || "").trim().toLowerCase();
}

function ensureSocialSocket() {
  if (!state.username || !state.password) return;
  if (social.socket && (social.socket.readyState === WebSocket.OPEN || social.socket.readyState === WebSocket.CONNECTING)) return;
  clearTimeout(social.retryTimer);
  const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  social.socket = socket;
  socket.onopen = () => {
    social.retryAttempt = 0;
    socket.send(JSON.stringify({ t: "social-hello", username: state.username, password: state.password }));
  };
  socket.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleSocialMessage(msg);
  };
  socket.onclose = () => {
    if (social.socket !== socket) return;
    social.socket = null;
    if (social.call) endVoice("Voice chat disconnected.");
    if (!state.username) return;
    const delay = Math.min(15000, 1000 + social.retryAttempt * 2000);
    social.retryAttempt += 1;
    social.retryTimer = setTimeout(ensureSocialSocket, delay);
  };
}

function closeSocialSocket() {
  clearTimeout(social.retryTimer);
  if (social.call) endVoice("");
  const socket = social.socket;
  social.socket = null;
  if (socket) {
    socket.onclose = null;
    socket.close();
  }
  social.friends = [];
  social.unread = {};
  social.chats = {};
  social.notice = "";
  renderSocialBar();
}

function sendSocial(payload) {
  if (!social.socket || social.socket.readyState !== WebSocket.OPEN) {
    ensureSocialSocket();
    return false;
  }
  social.socket.send(JSON.stringify(payload));
  return true;
}

function showSocialNotice(text) {
  social.notice = text;
  clearTimeout(social.noticeTimer);
  if (text) {
    social.noticeTimer = setTimeout(() => {
      social.notice = "";
      renderSocialBar();
    }, SOCIAL_NOTICE_MS);
  }
  renderSocialBar();
}

function handleSocialMessage(msg) {
  if (msg.t === "social") {
    social.friends = Array.isArray(msg.friends) ? msg.friends : [];
    renderSocialBar();
    if (state.screen === "coop-chat") updateChatHeader();
    return;
  }
  if (msg.t === "social-notice") {
    showSocialNotice(String(msg.text || ""));
    return;
  }
  if (msg.t === "chat") {
    const key = socialKey(msg.with);
    const list = social.chats[key] || (social.chats[key] = []);
    list.push(msg.msg);
    const viewing = state.screen === "coop-chat" && socialKey(state.chatWith) === key;
    if (viewing) {
      updateChatLog();
    } else if (socialKey(msg.msg.from) !== socialKey(state.username)) {
      social.unread[key] = (social.unread[key] || 0) + 1;
      showSocialNotice(`New message from ${msg.msg.from}`);
    }
    return;
  }
  if (msg.t === "chatHistory") {
    social.chats[socialKey(msg.with)] = Array.isArray(msg.messages) ? msg.messages : [];
    if (state.screen === "coop-chat" && socialKey(state.chatWith) === socialKey(msg.with)) updateChatLog();
    return;
  }
  if (msg.t === "voice") handleVoiceSignal(msg);
}

function friendOnline(name) {
  return social.friends.some((friend) => socialKey(friend.name) === socialKey(name) && friend.online);
}

async function getVoiceMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("no-mic");
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
}

async function requestVoice(name) {
  if (social.call) {
    showSocialNotice(socialKey(social.call.with) === socialKey(name) ? `Already in voice with ${name}.` : "Hang up your current voice chat first.");
    return;
  }
  if (!friendOnline(name)) {
    showSocialNotice(`${name} is offline.`);
    return;
  }
  social.call = { with: name, status: "calling", pc: null, stream: null, muted: false, pendingIce: [], ringTimer: null };
  renderSocialBar();
  const call = social.call;
  try {
    call.stream = await getVoiceMic();
  } catch {
    if (social.call === call) endVoice("Allow microphone access to voice chat.");
    return;
  }
  if (social.call !== call) {
    call.stream.getTracks().forEach((track) => track.stop());
    return;
  }
  if (!sendSocial({ t: "voice", to: name, kind: "request" })) {
    endVoice("Not connected yet. Try again in a moment.");
    return;
  }
  call.ringTimer = setTimeout(() => {
    if (social.call === call && call.status === "calling") {
      sendSocial({ t: "voice", to: name, kind: "cancel" });
      endVoice(`${name} didn't answer.`);
    }
  }, VOICE_RING_MS);
}

async function acceptVoice() {
  const call = social.call;
  if (!call || call.status !== "ringing") return;
  call.status = "connecting";
  renderSocialBar();
  try {
    call.stream = await getVoiceMic();
  } catch {
    sendSocial({ t: "voice", to: call.with, kind: "decline" });
    if (social.call === call) endVoice("Allow microphone access to voice chat.");
    return;
  }
  if (social.call !== call) {
    call.stream.getTracks().forEach((track) => track.stop());
    return;
  }
  sendSocial({ t: "voice", to: call.with, kind: "accept" });
}

function declineVoice() {
  const call = social.call;
  if (!call) return;
  sendSocial({ t: "voice", to: call.with, kind: call.status === "ringing" ? "decline" : call.status === "calling" ? "cancel" : "end" });
  endVoice("");
}

function toggleVoiceMute() {
  const call = social.call;
  if (!call || !call.stream) return;
  call.muted = !call.muted;
  call.stream.getAudioTracks().forEach((track) => { track.enabled = !call.muted; });
  renderSocialBar();
}

function endVoice(notice) {
  const call = social.call;
  social.call = null;
  if (call) {
    clearTimeout(call.ringTimer);
    if (call.pc) call.pc.close();
    if (call.stream) call.stream.getTracks().forEach((track) => track.stop());
  }
  voiceAudio.srcObject = null;
  if (notice) showSocialNotice(notice);
  else renderSocialBar();
}

function createVoicePeer(call) {
  const pc = new RTCPeerConnection({ iceServers: VOICE_ICE_SERVERS });
  call.pc = pc;
  call.stream.getTracks().forEach((track) => pc.addTrack(track, call.stream));
  pc.onicecandidate = (event) => {
    if (event.candidate) sendSocial({ t: "voice", to: call.with, kind: "ice", data: event.candidate.toJSON() });
  };
  pc.ontrack = (event) => {
    voiceAudio.srcObject = event.streams[0];
    voiceAudio.play().catch(() => {});
  };
  pc.onconnectionstatechange = () => {
    if (social.call !== call) return;
    if (pc.connectionState === "connected") {
      call.status = "live";
      renderSocialBar();
    } else if (pc.connectionState === "failed") {
      sendSocial({ t: "voice", to: call.with, kind: "end" });
      endVoice("Voice couldn't connect on this network.");
    }
  };
  return pc;
}

async function flushVoiceIce(call) {
  const pending = call.pendingIce;
  call.pendingIce = [];
  for (const candidate of pending) await call.pc.addIceCandidate(candidate).catch(() => {});
}

async function handleVoiceSignal(msg) {
  const from = String(msg.from || "");
  const call = social.call;
  const fromCurrent = call && socialKey(call.with) === socialKey(from);
  if (msg.kind === "request") {
    if (call) {
      sendSocial({ t: "voice", to: from, kind: "decline" });
      return;
    }
    social.call = { with: from, status: "ringing", pc: null, stream: null, muted: false, pendingIce: [], ringTimer: null };
    social.call.ringTimer = setTimeout(() => {
      if (social.call && social.call.status === "ringing" && socialKey(social.call.with) === socialKey(from)) {
        sendSocial({ t: "voice", to: from, kind: "decline" });
        endVoice(`Missed voice chat from ${from}.`);
      }
    }, VOICE_RING_MS);
    renderSocialBar();
    return;
  }
  if (!fromCurrent) return;
  try {
    if (msg.kind === "accept" && call.status === "calling") {
      clearTimeout(call.ringTimer);
      call.status = "connecting";
      renderSocialBar();
      const pc = createVoicePeer(call);
      await pc.setLocalDescription(await pc.createOffer());
      sendSocial({ t: "voice", to: from, kind: "offer", data: pc.localDescription.toJSON() });
    } else if (msg.kind === "offer" && call.status === "connecting" && call.stream) {
      clearTimeout(call.ringTimer);
      const pc = createVoicePeer(call);
      await pc.setRemoteDescription(msg.data);
      await pc.setLocalDescription(await pc.createAnswer());
      sendSocial({ t: "voice", to: from, kind: "answer", data: pc.localDescription.toJSON() });
      await flushVoiceIce(call);
    } else if (msg.kind === "answer" && call.pc) {
      await call.pc.setRemoteDescription(msg.data);
      await flushVoiceIce(call);
    } else if (msg.kind === "ice" && msg.data) {
      if (call.pc && call.pc.remoteDescription) await call.pc.addIceCandidate(msg.data).catch(() => {});
      else call.pendingIce.push(msg.data);
    } else if (msg.kind === "decline") {
      endVoice(`${from} can't voice chat right now.`);
    } else if (msg.kind === "cancel") {
      endVoice(`${from} stopped calling.`);
    } else if (msg.kind === "busy") {
      endVoice(`${from} is already in a voice chat.`);
    } else if (msg.kind === "offline") {
      endVoice(`${from} is offline.`);
    } else if (msg.kind === "end") {
      endVoice(`${from} left voice chat.`);
    }
  } catch {
    sendSocial({ t: "voice", to: from, kind: "end" });
    endVoice("Voice chat failed to connect.");
  }
}

function socialCallHtml() {
  const call = social.call;
  if (!call) return "";
  const name = escapeHtml(call.with);
  if (call.status === "ringing") {
    return `
      <div class="social-call social-call--ringing" role="alertdialog" aria-label="Voice chat request">
        <span class="social-call-text">🎙 <strong>${name}</strong> wants to voice chat</span>
        <button type="button" class="social-call-btn social-call-btn--go" data-social="accept">Accept</button>
        <button type="button" class="social-call-btn social-call-btn--stop" data-social="decline">Decline</button>
      </div>`;
  }
  if (call.status === "calling") {
    return `
      <div class="social-call" role="status">
        <span class="social-call-text">🎙 Calling <strong>${name}</strong>…</span>
        <button type="button" class="social-call-btn social-call-btn--stop" data-social="decline">Cancel</button>
      </div>`;
  }
  return `
    <div class="social-call social-call--live" role="status">
      <span class="social-call-text">${call.status === "live" ? "🔊 Voice with" : "🎙 Connecting to"} <strong>${name}</strong></span>
      <button type="button" class="social-call-btn" data-social="mute" aria-pressed="${call.muted}">${call.muted ? "Unmute" : "Mute"}</button>
      <button type="button" class="social-call-btn social-call-btn--stop" data-social="decline">Hang up</button>
    </div>`;
}

function renderSocialBar() {
  const signedIn = Boolean(state.username) && state.screen !== "sign-in" && state.screen !== "create-account";
  socialBar.hidden = !signedIn;
  if (!signedIn) {
    socialBar.innerHTML = "";
    return;
  }
  const chips = social.friends.length
    ? social.friends.map((friend) => {
        const unread = social.unread[socialKey(friend.name)] || 0;
        const status = friend.inCall ? "in voice" : friend.online ? "online" : "offline";
        return `
          <button
            type="button"
            class="social-friend${friend.online ? " social-friend--online" : ""}"
            data-social="call"
            data-name="${escapeHtml(friend.name)}"
            title="${friend.online ? `Request voice chat with ${escapeHtml(friend.name)}` : `${escapeHtml(friend.name)} is offline`}"
            aria-label="${escapeHtml(friend.name)}, ${status}. Request voice chat"
          >
            <span class="social-friend-dot${friend.inCall ? " social-friend-dot--call" : ""}" aria-hidden="true"></span>
            <span class="social-friend-name">${escapeHtml(friend.name)}</span>
            ${unread ? `<span class="social-friend-unread" aria-label="${unread} unread">${unread}</span>` : ""}
          </button>`;
      }).join("")
    : `<span class="social-empty">No friends yet · add them in Co-op</span>`;
  socialBar.innerHTML = `
    <div class="social-friends">${chips}</div>
    ${socialCallHtml()}
    ${social.notice ? `<p class="social-notice" role="status">${escapeHtml(social.notice)}</p>` : ""}
  `;
}

socialBar.addEventListener("click", (event) => {
  const target = event.target.closest("[data-social]");
  if (!target) return;
  event.stopPropagation();
  const kind = target.dataset.social;
  if (kind === "call") requestVoice(target.dataset.name);
  else if (kind === "accept") acceptVoice();
  else if (kind === "decline") declineVoice();
  else if (kind === "mute") toggleVoiceMute();
});

function chatMessagesHtml() {
  const list = social.chats[socialKey(state.chatWith)];
  if (!list) return `<li class="chat-empty">Loading messages…</li>`;
  if (!list.length) return `<li class="chat-empty">No messages yet. Say hi to ${escapeHtml(state.chatWith)}!</li>`;
  const me = socialKey(state.username);
  return list.map((entry) => {
    const mine = socialKey(entry.from) === me;
    const time = new Date(entry.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `
      <li class="chat-msg${mine ? " chat-msg--mine" : ""}">
        <span class="chat-msg-meta">${mine ? "You" : escapeHtml(entry.from)} · ${time}</span>
        <span class="chat-msg-text">${escapeHtml(entry.text)}</span>
      </li>`;
  }).join("");
}

function updateChatLog() {
  const log = app.querySelector("[data-chat-log]");
  if (!log) return;
  log.innerHTML = chatMessagesHtml();
  log.scrollTop = log.scrollHeight;
}

function chatStatusText() {
  const friend = social.friends.find((entry) => socialKey(entry.name) === socialKey(state.chatWith));
  if (!friend) return "Offline";
  return friend.inCall ? "In voice chat" : friend.online ? "Online" : "Offline · they'll see it later";
}

function updateChatHeader() {
  const status = app.querySelector("[data-chat-status]");
  if (status) status.textContent = chatStatusText();
}

function openChat(name) {
  state.chatWith = name;
  state.screen = "coop-chat";
  social.unread[socialKey(name)] = 0;
  render();
  if (!sendSocial({ t: "chatHistory", with: name })) {
    const retry = setInterval(() => {
      if (state.screen !== "coop-chat" || socialKey(state.chatWith) !== socialKey(name)) {
        clearInterval(retry);
        return;
      }
      if (sendSocial({ t: "chatHistory", with: name })) clearInterval(retry);
    }, 700);
  }
}

function submitChat(form) {
  const input = form.querySelector("input[name='text']");
  const text = String(input.value || "").trim();
  if (!text) return;
  if (!sendSocial({ t: "chat", to: state.chatWith, text })) {
    showSocialNotice("Connecting to chat… try again in a moment.");
    return;
  }
  input.value = "";
  input.focus();
}

function formatQueueWait(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

let matchLeaveIntent = false;
let matchReconnectTimer = null;
let matchReconnectAttempt = 0;
let matchDropAuthed = false;
let pendingPlayBots = false;
let playBotsWatchdog = null;

function detachMatchSocket() {
  if (!matchSocket) return;
  clearTimeout(matchReconnectTimer);
  matchReconnectTimer = null;
  const socket = matchSocket;
  matchSocket = null;
  socket.onclose = null;
  socket.close();
}

function closeMatchSocket() {
  if (!matchSocket) return;
  matchLeaveIntent = true;
  matchReconnectAttempt = 0;
  detachMatchSocket();
}

function scheduleMatchReconnect() {
  clearTimeout(matchReconnectTimer);
  const delay = Math.min(15000, 1000 + matchReconnectAttempt * 1500);
  matchReconnectTimer = setTimeout(() => {
    matchReconnectAttempt += 1;
    reconnectMatchSocket();
  }, delay);
}

function reconnectMatchSocket() {
  if (matchLeaveIntent || state.screen !== "match" || !state.username || !state.password) return;
  const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  matchSocket = socket;
  socket.onopen = () => {
    matchReconnectAttempt = 0;
    if (window.BBGame) window.BBGame.setSocket(socket);
    socket.send(JSON.stringify({
      t: "hello",
      username: state.username,
      password: state.password,
      avatar: state.avatar,
      loadout: { weapons: state.equippedWeapons, potion: state.equippedPotion, bb: state.equippedBb, skin: state.equippedSkin }
    }));
  };
  socket.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleMatchMessage(msg);
  };
  socket.onclose = () => {
    if (matchSocket !== socket) return;
    matchSocket = null;
    if (matchLeaveIntent) return;
    if (state.screen === "match" && window.BBGame) scheduleMatchReconnect();
  };
}

function bindMatchSocket(socket) {
  matchSocket = socket;
  socket.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleMatchMessage(msg);
  };
  socket.onclose = () => {
    if (matchSocket !== socket) return;
    matchSocket = null;
    if (matchLeaveIntent) return;
    if (state.screen === "match" && window.BBGame) {
      scheduleMatchReconnect();
      return;
    }
    if (state.screen === "queue" || state.screen === "match") {
      state.screen = "queue";
      state.matchQueue = { ...state.matchQueue, status: "Lost connection to the drop server." };
      render();
    }
  };
}

function consumeOneGameLoadout() {
  state.equippedWeapons.forEach((name) => {
    if (state.ownedPermanent.includes(name) || !(state.ownedOneGame[name] > 0)) return;
    const next = { ...state.ownedOneGame, [name]: state.ownedOneGame[name] - 1 };
    if (next[name] <= 0) delete next[name];
    state.ownedOneGame = next;
  });
  state.equippedWeapons = state.equippedWeapons.filter((name) => isWeaponOwned(name));
  if (state.equippedPotion && !state.ownedPotionsPermanent.includes(state.equippedPotion) && state.ownedPotions[state.equippedPotion] > 0) {
    const next = { ...state.ownedPotions, [state.equippedPotion]: state.ownedPotions[state.equippedPotion] - 1 };
    if (next[state.equippedPotion] <= 0) {
      delete next[state.equippedPotion];
      state.equippedPotion = "";
    }
    state.ownedPotions = next;
  }
  const bb = state.equippedBb;
  if (bb && !state.ownedBbsPermanent.includes(bb) && state.ownedBbsOneGame[bb] > 0) {
    const next = { ...state.ownedBbsOneGame, [bb]: state.ownedBbsOneGame[bb] - 1 };
    if (next[bb] <= 0) {
      delete next[bb];
      state.equippedBb = "";
    }
    state.ownedBbsOneGame = next;
  }
  persistShopInventory();
}

function updateQueueDom() {
  const queue = state.matchQueue;
  if (!queue || state.screen !== "queue") return;
  const count = app.querySelector("[data-queue-count]");
  const wait = app.querySelector("[data-queue-wait]");
  const status = app.querySelector("[data-queue-status]");
  if (count) count.textContent = `${queue.count}/${queue.needed}`;
  if (wait) wait.textContent = formatQueueWait(queue.waitMs);
  if (status) status.textContent = queue.status;
}

function clearPlayBotsWatchdog() {
  if (playBotsWatchdog) {
    clearTimeout(playBotsWatchdog);
    playBotsWatchdog = null;
  }
}

function requestPlayBots() {
  const queue = state.matchQueue;
  if (!queue) return;
  if (!matchSocket || matchSocket.readyState !== WebSocket.OPEN) {
    state.matchQueue = { ...queue, status: "Not connected. Leave and try again." };
    updateQueueDom();
    return;
  }
  if (!window.BBGame) {
    state.matchQueue = { ...queue, status: "3D game still loading. Wait a few seconds, then tap Play Bots again." };
    updateQueueDom();
    return;
  }
  if (!matchDropAuthed) {
    pendingPlayBots = true;
    state.matchQueue = { ...queue, status: "Signing in… bot match starts when ready." };
    updateQueueDom();
    return;
  }
  pendingPlayBots = false;
  clearPlayBotsWatchdog();
  sendMatchQueueJoin();
  matchSocket.send(JSON.stringify({ t: "playBots", mode: queue.mode, map: queue.map }));
  state.matchQueue = { ...queue, status: "Starting a bot match..." };
  updateQueueDom();
  playBotsWatchdog = setTimeout(() => {
    if (state.screen !== "queue" || !state.matchQueue) return;
    if (state.matchQueue.status !== "Starting a bot match...") return;
    state.matchQueue = {
      ...state.matchQueue,
      status: "Match did not start. Hard refresh (Ctrl+F5), sign in again, then Play Bots."
    };
    updateQueueDom();
  }, 12000);
}

function joinMatchQueue(mode, map) {
  closeMatchSocket();
  clearPlayBotsWatchdog();
  matchDropAuthed = false;
  pendingPlayBots = false;
  matchLeaveIntent = false;
  syncShopWalletFromStorage();
  state.matchQueue = { mode, map, count: 0, needed: MATCH_PLAYERS, waitMs: 90000, status: "Connecting to the drop server..." };
  state.matchResult = null;
  state.screen = "queue";
  render();

  const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  bindMatchSocket(socket);
  socket.onopen = () => {
    state.matchQueue = { ...state.matchQueue, status: "Signing in to the drop server..." };
    updateQueueDom();
    socket.send(JSON.stringify({
      t: "hello",
      username: state.username,
      password: state.password,
      avatar: state.avatar,
      loadout: { weapons: state.equippedWeapons, potion: state.equippedPotion, bb: state.equippedBb, skin: state.equippedSkin }
    }));
  };
}

function sendMatchQueueJoin() {
  const queue = state.matchQueue;
  if (!queue || !matchSocket || matchSocket.readyState !== WebSocket.OPEN) return;
  matchSocket.send(JSON.stringify({ t: "queue", mode: queue.mode, map: queue.map }));
}

function handleMatchMessage(msg) {
  if (msg.t === "error") {
    state.matchQueue = { ...state.matchQueue, status: msg.text };
    updateQueueDom();
  } else if (msg.t === "hello-ok") {
    matchDropAuthed = true;
    coopReady = true;
    if (isCoopScreen()) handleCoopMessage(msg);
    if (state.screen === "match" && window.BBGame && matchSocket) {
      window.BBGame.setSocket(matchSocket);
      if (window.BBGame.handleMessage) {
        window.BBGame.handleMessage({ t: "notice", text: "Could not rejoin your match. It may have ended — head back to the Hub." });
      }
    }
    if (state.screen === "queue" && state.matchQueue) {
      state.matchQueue = { ...state.matchQueue, status: "Joining queue..." };
      updateQueueDom();
      sendMatchQueueJoin();
      if (pendingPlayBots) requestPlayBots();
    }
  } else if (msg.t === "queue") {
    state.matchQueue = {
      ...state.matchQueue,
      count: msg.count,
      needed: msg.needed,
      waitMs: msg.waitMs,
      status: msg.count >= msg.needed ? "Lobby full, dropping in..." : "Waiting for players. Bots fill in when the timer ends."
    };
    updateQueueDom();
  } else if (msg.t === "start") {
    clearPlayBotsWatchdog();
    matchLeaveIntent = false;
    matchDropAuthed = true;
    if (!window.BBGame) {
      state.matchQueue = { ...state.matchQueue, status: "The 3D game failed to load. Refresh and try again." };
      updateQueueDom();
      return;
    }
    if (msg.resumed && state.screen === "match" && window.BBGame) {
      window.BBGame.setSocket(matchSocket);
      return;
    }
    if (msg.mode !== "fun" && !msg.resumed) consumeOneGameLoadout();
    state.screen = "match";
    render();
    try {
      window.BBGame.start({
        root: app.querySelector("[data-match-root]"),
        socket: matchSocket,
        start: msg,
        avatar: state.avatar,
        showBattleTutorial: !msg.resumed && tutorialStillNeeded("battle"),
        onBattleTutorialDone: () => markTutorialDone("battle")
      });
    } catch (error) {
      console.error(error);
      state.screen = "queue";
      state.matchQueue = { ...state.matchQueue, status: "Could not open the 3D match. Refresh and try again." };
      render();
    }
  } else if (msg.t === "end") {
    finishMatch(msg);
  } else if (msg.t === "coop" || msg.t === "coop-notice" || msg.t === "party") {
    handleCoopMessage(msg);
  } else if (window.BBGame && state.screen === "match") {
    window.BBGame.handleMessage(msg);
  }
}

async function finishMatch(result) {
  if (window.BBGame) window.BBGame.stop();
  closeMatchSocket();
  const coinReward = (result.mode === "competitive" || result.mode === "zombies") && result.reward > 0;
  if (coinReward || result.diamonds > 0) {
    syncShopWalletFromStorage();
    if (coinReward) state.shopCoins += result.reward;
    state.shopDiamonds += result.diamonds || 0;
    persistShopWallet();
  }
  state.matchResult = result;
  state.screen = "match-result";
  render();
  if (result.mode === "ranked") {
    try {
      const response = await postAuth("/api/match-result", state.username, state.password);
      applyAccountToState(response.account);
    } catch {
      // the stars still saved on the server
    }
  }
}

function placeSuffix(place) {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[place % 10] || "th";
}

function queueModeLabel(mode) {
  if (mode === "ranked") return "Ranked";
  if (mode === "fun") return "For Fun";
  return "Competitive";
}

function renderQueue() {
  const queue = state.matchQueue;
  const tagline = queue.mode === "fun"
    ? `Extra easy island <span class="tagline-mode">(no rewards)</span>`
    : `Drop queue <span class="tagline-mode">(for real)</span>`;
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>${queueModeLabel(queue.mode)}</span></p>
      <h1 class="drop-title drop-title-compact">${escapeHtml(BBMapGen.MAP_LABELS[queue.map])}</h1>
      <p class="drop-tagline">${tagline}</p>
    </header>
    <div class="queue-panel">
      <p class="queue-count"><span data-queue-count>${queue.count}/${queue.needed}</span> players</p>
      <p class="queue-wait">Bots fill in <span data-queue-wait>${formatQueueWait(queue.waitMs)}</span></p>
      <p class="queue-status" data-queue-status>${escapeHtml(queue.status)}</p>
    </div>
    <button class="drop-button queue-bots" type="button" data-action="play-bots">
      <span class="button-text">Play Bots</span>
    </button>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="leave-queue">Leave Queue</button>
  `, "queue-card"));
}

function renderMatch() {
  template(`<div class="match-root" data-match-root></div>`, "match-screen");
}

function formatSurvival(ms) {
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function renderZombieResult(result) {
  const coins = result.reward > 0 ? `+${result.reward} ${result.reward === 1 ? "coin" : "coins"}` : "No coins this time — survive longer!";
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Zombie Survival</span></p>
      <h1 class="drop-title drop-title-compact">Overrun!</h1>
      <p class="drop-tagline">Survived ${formatSurvival(result.survivedMs)} · reached wave ${result.wave || 0}</p>
    </header>
    <div class="queue-panel result-panel">
      <p class="result-reward">${escapeHtml(coins)}</p>
      <p class="queue-status">${result.kills} ${result.kills === 1 ? "zombie" : "zombies"} knocked out${result.killedBy ? ` · Taken out by ${escapeHtml(result.killedBy)}` : ""}</p>
    </div>
    <button class="drop-button queue-bots" type="button" data-action="coop-play">
      <span class="button-text">Play Again</span>
    </button>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="hub-back">Back to Hub</button>
  `, "queue-card"));
}

function renderMatchResult() {
  const result = state.matchResult;
  if (result.mode === "zombies") {
    renderZombieResult(result);
    return;
  }
  const rewards = [];
  if (result.reward > 0) rewards.push(result.mode === "competitive" ? `+${result.reward} coins` : `+${formatStars(result.reward)}`);
  if (result.diamonds > 0) rewards.push(`+${result.diamonds} ${result.diamonds === 1 ? "diamond" : "diamonds"}`);
  const rewardLine = result.mode === "fun"
    ? "For Fun — no rewards"
    : rewards.length ? rewards.join(" · ") : "No reward this time";
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>${escapeHtml(BBMapGen.MAP_LABELS[result.map])}</span></p>
      <h1 class="drop-title drop-title-compact">${result.place === 1 ? "Victory!" : "Knocked Out"}</h1>
      <p class="drop-tagline">${result.place}${placeSuffix(result.place)} of ${result.total}</p>
    </header>
    <div class="queue-panel result-panel">
      <p class="result-reward">${escapeHtml(rewardLine)}</p>
      <p class="queue-status">${result.kills} ${result.kills === 1 ? "knockout" : "knockouts"}${result.killedBy ? ` · Taken out by ${escapeHtml(result.killedBy)}` : ""}</p>
    </div>
    <button class="drop-button queue-bots" type="button" data-action="drop-map" data-map="${result.map}" data-mode="${result.mode}">
      <span class="button-text">Drop Again</span>
    </button>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="hub-back">Back to Hub</button>
  `, "queue-card"));
}

function coopNoticeHtml() {
  if (!state.coopNotice) return "";
  return `<p class="coop-notice" role="status">${escapeHtml(state.coopNotice)}</p>`;
}

function hubFriendRequestRow(from) {
  const name = escapeHtml(from);
  return `
    <div class="hub-friend-request" role="listitem">
      <span class="hub-friend-request-name">${name}</span>
      <span class="hub-friend-request-text">sent you a friend request</span>
      <button type="button" class="hub-friend-request-btn hub-friend-request-btn--accept" data-action="coop-accept" data-from="${name}">accept</button>
      <button type="button" class="hub-friend-request-btn hub-friend-request-btn--decline" data-action="coop-decline" data-from="${name}">decline</button>
    </div>`;
}

function hubFriendRequestsHtml() {
  if (!state.coopIncoming.length) return "";
  return `
    <section class="hub-friend-requests" aria-label="Friend requests">
      ${state.coopIncoming.map((row) => hubFriendRequestRow(row.from)).join("")}
    </section>`;
}

function renderCoopMenu() {
  ensureCoopSocket();
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Co-op</span></p>
      <h1 class="drop-title drop-title-compact">Squad Up</h1>
      <p class="drop-tagline">Invite buddies, build your squad, then survive zombies together <span class="tagline-mode">(for real)</span></p>
    </header>
    ${coopNoticeHtml()}
    <nav class="coop-menu" aria-label="Co-op steps">
      <button class="drop-button coop-step" type="button" data-action="coop-friend">
        <span class="button-text">Friend</span>
        <span class="coop-step-hint">Send invites</span>
      </button>
      <button class="drop-button coop-step coop-step-next" type="button" data-action="coop-next">
        <span class="button-text">Friends</span>
        <span class="coop-step-hint">Your squad (${state.coopFriends.length})</span>
      </button>
      <button class="drop-button coop-step coop-step-play" type="button" data-action="coop-play">
        <span class="button-text">Play</span>
        <span class="coop-step-hint">Zombie survival${state.coopBattleInvites.length ? ` · ${state.coopBattleInvites.length} battle request${state.coopBattleInvites.length > 1 ? "s" : ""}` : ""}</span>
      </button>
    </nav>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="battle-back">Back to Drop Zone</button>
    ${liveBar()}
  `));
}

function renderCoopFriend() {
  ensureCoopSocket();
  const incoming = state.coopIncoming.map((row) => `
    <li class="coop-request">${hubFriendRequestRow(row.from)}</li>
  `).join("");
  const outgoing = state.coopOutgoing.map((row) => `
    <li class="coop-request coop-request--pending">
      <span class="coop-request-name">${escapeHtml(row.to)}</span>
      <span class="coop-pending-label">${row.online ? "Waiting…" : "Delivers when they sign in"}</span>
    </li>
  `).join("");
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <p class="drop-kicker">Co-op · <span>Friend</span></p>
      <h1 class="drop-title drop-title-compact">Invite a Buddy</h1>
      <p class="drop-tagline">Press Enter to send the request. If they're offline, it waits and delivers next time they sign in.</p>
    </header>
    ${coopNoticeHtml()}
    <form class="drop-form coop-friend-form" data-form="coop-friend">
      <label class="drop-field">
        <span class="drop-label">Callsign</span>
        <input name="username" type="text" autocomplete="off" maxlength="20" placeholder="Their callsign" value="${escapeHtml(state.coopDraft)}" required>
      </label>
      <button class="drop-button" type="submit">
        <span class="button-text">Send Request</span>
      </button>
    </form>
    ${incoming ? `<section class="coop-panel"><h2 class="coop-panel-title">Incoming</h2><ul class="coop-request-list">${incoming}</ul></section>` : ""}
    ${outgoing ? `<section class="coop-panel"><h2 class="coop-panel-title">Sent</h2><ul class="coop-request-list">${outgoing}</ul></section>` : ""}
    <button class="drop-button ghost hub-sign-out" type="button" data-action="coop-back">Back to Co-op</button>
    ${liveBar()}
  `));
}

function renderCoopPlay() {
  ensureCoopSocket();
  const party = state.coopParty;
  const isHost = !party || party.isHost;
  const memberKeys = new Set((party?.members || []).map((name) => name.toLowerCase()));
  const invitedKeys = new Set((party?.invited || []).map((name) => name.toLowerCase()));
  const invites = state.coopBattleInvites.map((row) => `
    <li class="coop-request">
      <span class="coop-request-name">${escapeHtml(row.from)} <span class="coop-pending-label">wants you on their squad</span></span>
      <span class="coop-request-actions">
        <button class="drop-button coop-accept" type="button" data-action="battle-accept" data-from="${escapeHtml(row.from)}">Join</button>
        <button class="drop-button ghost coop-accept" type="button" data-action="battle-decline" data-from="${escapeHtml(row.from)}">No</button>
      </span>
    </li>
  `).join("");
  const squadRows = party
    ? party.members.map((name, index) => `
      <li class="coop-squad-member">
        <span class="coop-squad-badge" aria-hidden="true">${modeIcons.coop}</span>
        <span class="coop-squad-name">${escapeHtml(name)}${name.toLowerCase() === state.username.toLowerCase() ? " (you)" : ""}</span>
        <span class="coop-squad-status">${index === 0 ? "Leader" : "Ready"}</span>
      </li>
    `).join("") + party.invited.map((name) => `
      <li class="coop-squad-member coop-squad-member--offline">
        <span class="coop-squad-badge" aria-hidden="true">${modeIcons.coop}</span>
        <span class="coop-squad-name">${escapeHtml(name)}</span>
        <span class="coop-squad-status">Request sent…</span>
      </li>
    `).join("")
    : `<li class="coop-squad-empty">Just you so far. Send a battle request below or play with bot teammates.</li>`;
  const friendRows = state.coopFriends.length
    ? state.coopFriends.map((friend) => {
      const key = friend.name.toLowerCase();
      let control = `<button class="drop-button coop-accept" type="button" data-action="battle-invite" data-to="${escapeHtml(friend.name)}">Battle Request</button>`;
      if (memberKeys.has(key)) control = `<span class="coop-pending-label">On your squad</span>`;
      else if (invitedKeys.has(key)) control = `<span class="coop-pending-label">Request sent…</span>`;
      else if (!friend.online) control = `<span class="coop-pending-label">Offline</span>`;
      else if (!isHost) control = "";
      return `
        <li class="coop-request${friend.online ? "" : " coop-request--pending"}">
          <span class="coop-request-name">${escapeHtml(friend.name)}</span>
          ${control}
        </li>
      `;
    }).join("")
    : `<li class="coop-squad-empty">No friends yet. Add some from the <strong>Friend</strong> screen.</li>`;
  const squadSize = party ? party.members.length : 1;
  const controls = isHost
    ? `
      <button class="drop-button queue-bots" type="button" data-action="squad-start" data-bots="1">
        <span class="button-text">Play with Bots</span>
      </button>
      <button class="drop-button" type="button" data-action="squad-start" data-bots="0">
        <span class="button-text">${squadSize > 1 ? `Start with Squad (${squadSize})` : "Start Solo"}</span>
      </button>
      ${party ? `<button class="drop-button ghost" type="button" data-action="squad-leave">Close Squad</button>` : ""}
    `
    : `
      <p class="queue-status">Waiting for ${escapeHtml(party.host)} to start…</p>
      <button class="drop-button ghost" type="button" data-action="squad-leave">Leave Squad</button>
    `;
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <p class="drop-kicker">Co-op · <span>Play</span></p>
      <h1 class="drop-title drop-title-compact">Zombie Survival</h1>
      <p class="drop-tagline">You and your squad vs. endless zombie waves. Last longer for more coins.</p>
    </header>
    ${coopNoticeHtml()}
    ${invites ? `<section class="coop-panel"><h2 class="coop-panel-title">Battle Requests</h2><ul class="coop-request-list">${invites}</ul></section>` : ""}
    <section class="coop-panel"><h2 class="coop-panel-title">Your Squad (${squadSize}/4)</h2><ul class="coop-squad-list">${squadRows}</ul></section>
    <div class="coop-play-controls">${controls}</div>
    <section class="coop-panel"><h2 class="coop-panel-title">Friends</h2><ul class="coop-request-list">${friendRows}</ul></section>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="coop-back">Back to Co-op</button>
    ${liveBar()}
  `));
}

function renderCoopFriends() {
  ensureCoopSocket();
  const squad = state.coopFriends.length
    ? state.coopFriends.map((friend) => {
        const unread = social.unread[socialKey(friend.name)] || 0;
        const online = friend.online || friendOnline(friend.name);
        return `
      <li>
        <button
          type="button"
          class="coop-squad-member coop-squad-member--chat${online ? "" : " coop-squad-member--offline"}"
          data-action="open-chat"
          data-name="${escapeHtml(friend.name)}"
          aria-label="Chat with ${escapeHtml(friend.name)}"
        >
          <span class="coop-squad-badge" aria-hidden="true">${modeIcons.coop}</span>
          <span class="coop-squad-name">${escapeHtml(friend.name)}</span>
          ${unread ? `<span class="social-friend-unread">${unread}</span>` : ""}
          <span class="coop-squad-status">${online ? "Online" : "Offline"} · Chat ›</span>
        </button>
      </li>`;
      }).join("")
    : `<li class="coop-squad-empty">No squad yet. Tap <strong>Friend</strong> to invite someone who accepts your request.</li>`;
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <p class="drop-kicker">Co-op · <span>Squad</span></p>
      <h1 class="drop-title drop-title-compact">Your Friends</h1>
      <p class="drop-tagline">Tap a friend to send them messages.</p>
    </header>
    ${coopNoticeHtml()}
    <ul class="coop-squad-list" aria-label="Co-op squad">${squad}</ul>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="coop-back">Back to Co-op</button>
    ${liveBar()}
  `));
}

function renderCoopChat() {
  ensureCoopSocket();
  const name = escapeHtml(state.chatWith);
  const previousInput = app.querySelector(".chat-input");
  const draft = previousInput && previousInput.dataset.with === state.chatWith ? previousInput.value : "";
  renderScene(renderCard(`
    <header class="drop-head hub-head chat-head">
      <p class="drop-kicker">Friends · <span>Chat</span></p>
      <h1 class="drop-title drop-title-compact">${name}</h1>
      <p class="drop-tagline chat-status" data-chat-status>${escapeHtml(chatStatusText())}</p>
      <button type="button" class="social-call-btn social-call-btn--go chat-voice-btn" data-action="chat-voice" data-name="${name}">🎙 Voice chat</button>
    </header>
    <ul class="chat-log" data-chat-log aria-label="Messages with ${name}" aria-live="polite">${chatMessagesHtml()}</ul>
    <form class="chat-form" data-form="chat" autocomplete="off">
      <input class="chat-input" name="text" type="text" maxlength="300" placeholder="Message ${name}…" aria-label="Message ${name}" data-with="${name}" value="${escapeHtml(draft)}">
      <button class="drop-button chat-send" type="submit">Send</button>
    </form>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="coop-next">Back to Friends</button>
  `, "chat-card"));
  const log = app.querySelector("[data-chat-log]");
  if (log) log.scrollTop = log.scrollHeight;
  const input = app.querySelector(".chat-input");
  if (input) input.focus();
}

function renderBattleMenu() {
  renderScene(renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Battle</span></p>
      <h1 class="drop-title drop-title-compact">Drop Zone</h1>
      <p class="drop-tagline">Choose your queue <span class="tagline-mode">(for real)</span></p>
    </header>
    <nav class="hub-menu battle-menu" aria-label="Battle modes">
      ${modeButton("For Fun", "fun")}
      ${modeButton("Competitive", "competitive")}
      ${modeButton("CO OP", "coop")}
      ${modeButton("Ranked", "ranked")}
    </nav>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="hub-back">Back to Hub</button>
    ${liveBar()}
  `));
}

function gearSkinLookButton(skinId) {
  const entry = findSkin(skinId);
  if (!entry) return "";
  const owned = state.ownedSkins.includes(skinId);
  const active = state.equippedSkin === skinId || state.skinTryOn === skinId;
  const currency = skinCurrency(entry);
  return `
    <button
      type="button"
      class="gear-avatar-btn gear-avatar-btn--skin gear-skin-${entry.rarity}${active ? " active" : ""}${owned ? "" : " locked"}"
      data-action="${owned ? "wear-skin" : "preview-skin"}"
      data-skin="${skinId}"
      aria-pressed="${active}"
      aria-label="${owned ? "Wear" : "Try on"} ${escapeHtml(entry.name)}"
    >
      ${window.BBBuddyPreview
        ? `<img class="gear-avatar-3d" src="${window.BBBuddyPreview.snapshot(state.avatar, 160, skinId)}" alt="" draggable="false">`
        : `<span class="gear-skin-swatch" style="background:linear-gradient(160deg, ${entry.outfit}, ${entry.accent})"></span>`}
      ${owned ? "" : `<span class="gear-avatar-skin-price">${currency === "diamonds" ? shopDiamondSvg() : shopCoinSvg()}${escapeHtml(formatShopCoinAmount(entry.price))}</span>`}
      <span class="gear-avatar-skin-name">${escapeHtml(entry.name)}</span>
    </button>
  `;
}

function gearSpecialLooks() {
  const owned = SKIN_CATALOG.filter((entry) => state.ownedSkins.includes(entry.id));
  const locked = SKIN_CATALOG.filter((entry) => !state.ownedSkins.includes(entry.id));
  return `
    <p class="gear-picker-label">Special looks ${owned.length}/${SKIN_CATALOG.length}</p>
    ${[...owned, ...locked].map((entry) => gearSkinLookButton(entry.id)).join("")}
  `;
}

function gearAvatarButton(avatarId) {
  const selected = state.avatar === avatarId && !state.equippedSkin;
  const active = selected ? " active" : "";
  return `
    <button
      type="button"
      class="gear-avatar-btn${active}"
      data-action="pick-avatar"
      data-avatar="${avatarId}"
      aria-pressed="${selected}"
      aria-label="Choose buddy look ${avatarId}"
    >
      ${window.BBBuddyPreview
        ? `<img class="gear-avatar-3d" src="${window.BBBuddyPreview.snapshot(avatarId)}" alt="" draggable="false">`
        : buddyAvatarSvg(avatarId, true)}
    </button>
  `;
}

let gearPreview3d = null;

function disposeGearPreview3d() {
  if (!gearPreview3d) return;
  gearPreview3d.dispose();
  gearPreview3d = null;
}

function gearPreviewOptions() {
  return { avatar: state.avatar, weapons: state.equippedWeapons, skin: state.skinTryOn || state.equippedSkin, bb: state.equippedBb, yaw: state.avatarYaw };
}

function renderSkinCard(entry) {
  const owned = state.ownedSkins.includes(entry.id);
  const equipped = state.equippedSkin === entry.id;
  const trying = state.skinTryOn === entry.id;
  const currency = skinCurrency(entry);
  const balance = currency === "diamonds" ? state.shopDiamonds : state.shopCoins;
  const art = window.BBBuddyPreview
    ? `<img class="gear-skin-art" src="${window.BBBuddyPreview.snapshot(state.avatar, 150, entry.id)}" alt="" draggable="false">`
    : `<span class="gear-skin-swatch" style="background:linear-gradient(160deg, ${entry.outfit}, ${entry.accent})"></span>`;
  const action = owned
    ? `<button type="button" class="gear-skin-btn${equipped ? " gear-skin-btn--equipped" : ""}" data-action="equip-skin" data-skin="${entry.id}">${equipped ? "Equipped" : "Equip"}</button>`
    : `<button type="button" class="gear-skin-btn gear-skin-btn--buy gear-skin-btn--${currency}" data-action="buy-skin" data-skin="${entry.id}" ${balance < entry.price ? "disabled" : ""} aria-label="Buy ${escapeHtml(entry.name)} for ${entry.price} ${currency}">
        ${currency === "diamonds" ? shopDiamondSvg() : shopCoinSvg()}<span>${escapeHtml(formatShopCoinAmount(entry.price))}</span>
      </button>`;
  return `
    <li class="gear-skin-card gear-skin-${entry.rarity}${equipped ? " equipped" : ""}${trying ? " trying" : ""}">
      <button type="button" class="gear-skin-try" data-action="try-skin" data-skin="${entry.id}" aria-label="Try on ${escapeHtml(entry.name)}">
        ${art}
        ${owned ? "" : `<span class="gear-skin-lock" aria-hidden="true">🔒</span>`}
      </button>
      <span class="gear-skin-name">${escapeHtml(entry.name)}</span>
      ${action}
    </li>
  `;
}

function renderGearSkinsPanel() {
  const tryOn = findSkin(state.skinTryOn);
  return `
    <section class="gear-skins-col" aria-label="Skins">
      <header class="gear-skins-head">
        <h2 class="gear-weapons-title gear-skins-title">Skins</h2>
        <p class="gear-equip-count">Owned ${state.ownedSkins.length}/${SKIN_CATALOG.length} · tap a skin to try it on</p>
        ${renderShopWalletBar()}
        ${state.gearNotice ? `<p class="gear-equip-notice" role="status">${escapeHtml(state.gearNotice)}</p>` : ""}
        ${tryOn ? `<p class="gear-skin-trying">Trying on <strong>${escapeHtml(tryOn.name)}</strong> · <button type="button" class="gear-skin-clear" data-action="try-skin" data-skin="">Stop</button></p>` : ""}
      </header>
      <div class="gear-skins-body">
        ${SKIN_RARITIES.map((rarity) => `
          <section class="gear-skin-section gear-skin-section--${rarity.id}">
            <h3 class="gear-weapon-section-title">${escapeHtml(rarity.label)} · ${rarity.currency === "diamonds" ? "Diamonds" : "Coins"}</h3>
            <ul class="gear-skin-grid">${SKIN_CATALOG.filter((entry) => entry.rarity === rarity.id).map(renderSkinCard).join("")}</ul>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

function renderBbStats(bb) {
  const parts = [
    `${shopHeartSvg()} ${bb.hp} HP`,
    `${shopSwordSvg()} ${bb.damage} damage${bb.attackMs ? ` / ${bb.attackMs}ms` : ""}`
  ];
  if (bb.defense !== undefined) parts.push(`${shopShieldSvg()} ${bb.defense} defense`);
  if (bb.speed) parts.push(escapeHtml(bb.speed));
  parts.push(`${bb.size.toFixed(2)}× your height`);
  if (bbIsRideable(bb)) parts.push(`<strong class="bbs-entry-rideable">Rideable</strong>`);
  return parts.map((part) => `<span class="bbs-entry-stat">${part}</span>`).join("");
}

function renderBbBuySlot(bb, plan) {
  const price = getBbPlanPrice(bb, plan);
  const label = formatShopCoinAmount(price);
  const ownedForever = plan === "permanent" && state.ownedBbsPermanent.includes(bb.name);
  const oneGameCount = plan === "one-game" ? state.ownedBbsOneGame[bb.name] || 0 : 0;
  const disabled = ownedForever || state.shopCoins < price;
  let caption = plan === "permanent" ? "Permanent" : "1 Game";
  if (ownedForever) caption = "Owned";
  else if (oneGameCount > 0) caption = `Have ${oneGameCount}`;
  return `
    <button
      type="button"
      class="bbs-price bbs-buy${ownedForever ? " bbs-buy--owned" : ""}"
      data-action="buy-bb"
      data-bb-name="${escapeHtml(bb.name)}"
      data-plan="${plan}"
      ${disabled ? "disabled" : ""}
      aria-label="Buy ${escapeHtml(bb.name)} ${plan === "permanent" ? "permanently" : "for 1 game"} for ${escapeHtml(label)} coins"
    >
      <span class="bbs-price-value">${shopCoinSvg()}${escapeHtml(label)}</span>
      <span class="bbs-price-label">${escapeHtml(caption)}</span>
    </button>
  `;
}

function renderBbPrices(bb) {
  return `
    <div class="bbs-prices">
      ${renderBbBuySlot(bb, "one-game")}
      ${renderBbBuySlot(bb, "permanent")}
      <div class="bbs-price bbs-price--ingame" aria-label="In game price ${escapeHtml(formatShopCoinAmount(getBbInGamePrice(bb)))} coins">
        <span class="bbs-price-value">${shopCoinSvg()}${escapeHtml(formatShopCoinAmount(getBbInGamePrice(bb)))}</span>
        <span class="bbs-price-label">In Game</span>
      </div>
    </div>
  `;
}

function renderBbsRaritySection(id, label, bbs) {
  const items = bbs.map((bb) => `
    <li class="bbs-entry">
      <div class="bbs-entry-card">
        <span class="bbs-entry-art">${bbArtSvg(bb.art)}</span>
        <span class="bbs-entry-name">${escapeHtml(bb.name)}</span>
        <span class="bbs-entry-stats">${renderBbStats(bb)}</span>
        ${renderBbPrices(bb)}
      </div>
    </li>
  `).join("");
  return `
    <section class="bbs-rarity-section bbs-rarity-${id}">
      <h3 class="gear-weapon-section-title">${escapeHtml(label)}</h3>
      <ul class="bbs-grid">${items}</ul>
    </section>
  `;
}

function renderBbs() {
  template(`
    <div class="gear-backdrop bbs-backdrop" aria-hidden="true"></div>
    <div class="bbs-page">
      <header class="bbs-header">
        <button class="drop-button ghost bbs-back" type="button" data-action="hub-back">Back to Hub</button>
        <h1 class="bbs-collection-title">B.B.s</h1>
        ${renderShopWalletBar()}
      </header>
      ${state.bbsNotice ? `<p class="bbs-notice" role="status">${escapeHtml(state.bbsNotice)}</p>` : ""}
      <div class="bbs-collection-body">
        ${BB_RARITIES.map((rarity) => renderBbsRaritySection(rarity.id, rarity.label, BB_CATALOG.filter((bb) => bb.rarity === rarity.id))).join("")}
      </div>
    </div>
  `, "drop-screen bbs-screen");
}

function renderGearBbsSection() {
  const entries = [
    ...Object.entries(state.ownedBbsOneGame).filter(([, count]) => count > 0).map(([name, count]) => ["1 Game", name, count]),
    ...state.ownedBbsPermanent.map((name) => ["Permanent", name, 0])
  ];
  const section = (title) => {
    const rows = entries.filter(([group]) => group === title);
    const items = rows.length
      ? rows.map(([, name, count]) => {
        const bb = findBb(name);
        const equipped = state.equippedBb === name;
        return `
          <li>
            <button
              type="button"
              class="gear-weapon-item gear-bb-item${equipped ? " equipped" : ""}"
              data-action="toggle-equip-bb"
              data-bb-name="${escapeHtml(name)}"
              aria-pressed="${equipped}"
            >
              <span class="gear-bb-art">${bbArtSvg(bb.art)}</span>
              <span class="gear-weapon-name">${escapeHtml(name)}${count > 1 ? ` <span class="gear-weapon-count">×${count}</span>` : ""}</span>
              ${equipped ? `<span class="gear-weapon-badge">Equipped</span>` : ""}
            </button>
          </li>
        `;
      }).join("")
      : `<li class="gear-weapon-empty">None yet</li>`;
    return `
      <section class="gear-weapon-section">
        <h3 class="gear-weapon-section-title">${title}</h3>
        <ul class="gear-weapon-list">${items}</ul>
      </section>
    `;
  };
  return `
    <aside class="gear-potions-col gear-bbs-col" aria-label="B.B.s">
      <h2 class="gear-weapons-title gear-bbs-title">B.B.s</h2>
      <p class="gear-equip-count">Equipped ${state.equippedBb ? "1/1" : "0/1"} · tap to equip</p>
      <div class="gear-weapons-body gear-bbs-body">
        ${section("1 Game")}
        ${section("Permanent")}
      </div>
    </aside>
  `;
}

function gearEquippedBbMarkup() {
  const bb = findBb(state.equippedBb);
  return bb ? `<span class="gear-preview-bb" aria-label="${escapeHtml(bb.name)}">${bbArtSvg(bb.art)}</span>` : "";
}

function renderGearPotionsSection() {
  const entries = [
    ...Object.entries(state.ownedPotions).filter(([, count]) => count > 0).map(([name, count]) => ["1 Game", name, count]),
    ...state.ownedPotionsPermanent.map((name) => ["Permanent", name, 0])
  ];
  const section = (title) => {
    const rows = entries.filter(([group]) => group === title);
    const items = rows.length
      ? rows.map(([, name, count]) => {
        const equipped = state.equippedPotion === name;
        return `
          <li>
            <button
              type="button"
              class="gear-weapon-item gear-potion-item${equipped ? " equipped" : ""}"
              data-action="toggle-equip-potion"
              data-potion-name="${escapeHtml(name)}"
              aria-pressed="${equipped}"
            >
              <span class="gear-weapon-art gear-potion-art">${gearPotionArtSvg(name)}</span>
              <span class="gear-weapon-name">${escapeHtml(name)}${count > 1 ? ` <span class="gear-weapon-count">×${count}</span>` : ""}</span>
              ${equipped ? `<span class="gear-weapon-badge">Equipped</span>` : ""}
            </button>
          </li>
        `;
      }).join("")
      : `<li class="gear-weapon-empty">None yet</li>`;
    return `
      <section class="gear-weapon-section">
        <h3 class="gear-weapon-section-title">${title}</h3>
        <ul class="gear-weapon-list">${items}</ul>
      </section>
    `;
  };
  return `
    <aside class="gear-potions-col" aria-label="Potions">
      <h2 class="gear-weapons-title gear-potions-title">Potions</h2>
      <p class="gear-equip-count">Equipped ${state.equippedPotion ? "1/1" : "0/1"} · tap to equip</p>
      ${state.gearNotice ? `<p class="gear-equip-notice" role="status">${escapeHtml(state.gearNotice)}</p>` : ""}
      <div class="gear-weapons-body gear-potions-body">
        ${section("1 Game")}
        ${section("Permanent")}
      </div>
    </aside>
  `;
}

function renderGearWeaponSection(title, entries) {
  const items = entries.length
    ? entries.map(([name, count]) => {
      const equipped = state.equippedWeapons.includes(name);
      return `
        <li>
          <button
            type="button"
            class="gear-weapon-item${equipped ? " equipped" : ""}"
            data-action="toggle-equip"
            data-weapon-name="${escapeHtml(name)}"
            aria-pressed="${equipped}"
          >
            <span class="gear-weapon-art">${weaponArtSvg(name)}</span>
            <span class="gear-weapon-name">${escapeHtml(name)}${count > 1 ? ` <span class="gear-weapon-count">×${count}</span>` : ""}</span>
            ${equipped ? `<span class="gear-weapon-badge">Equipped</span>` : ""}
          </button>
        </li>
      `;
    }).join("")
    : `<li class="gear-weapon-empty">None yet</li>`;
  return `
    <section class="gear-weapon-section">
      <h3 class="gear-weapon-section-title">${escapeHtml(title)}</h3>
      <ul class="gear-weapon-list">${items}</ul>
    </section>
  `;
}

function renderGear() {
  template(`
    ${WEAPON_ART_DEFS}
    <div class="gear-backdrop" aria-hidden="true"></div>
    <div class="gear-layout">
      <aside class="gear-picker" aria-label="Choose your buddy">
        ${gearAvatarButton("boy-1")}
        ${gearAvatarButton("boy-2")}
        ${gearAvatarButton("boy-3")}
        ${gearAvatarButton("girl-1")}
        ${gearAvatarButton("girl-2")}
        ${gearAvatarButton("girl-3")}
        ${gearSpecialLooks()}
        <p class="gear-scroll-hint">Scroll for all looks</p>
      </aside>
      <span class="gear-rail" aria-hidden="true"><span class="gear-rail-thumb" data-gear-thumb></span></span>
      ${state.gearPanel === "skins" ? renderGearSkinsPanel() : `
      <aside class="gear-weapons-col" aria-label="Weapons">
        <h2 class="gear-weapons-title">Weapons</h2>
        <p class="gear-equip-count">Equipped ${state.equippedWeapons.length}/${MAX_EQUIPPED_WEAPONS} · tap to equip</p>
        ${state.gearNotice ? `<p class="gear-equip-notice" role="status">${escapeHtml(state.gearNotice)}</p>` : ""}
        <div class="gear-weapons-body">
          ${renderGearWeaponSection("1 Game", Object.entries(state.ownedOneGame))}
          ${renderGearWeaponSection("Permanent", state.ownedPermanent.map((name) => [name, 0]))}
        </div>
      </aside>
      ${renderGearPotionsSection()}
      ${renderGearBbsSection()}
      `}
      <section class="gear-stage">
        <header class="gear-head">
          <p class="drop-kicker">B.B <span>Gear</span></p>
          <h1 class="gear-title">Your Buddy</h1>
          <p class="gear-sub">${escapeHtml(state.username || "Drop buddy")}</p>
        </header>
        ${renderGearStats()}
        <div class="gear-preview-wrap gear-preview-turnable" data-gear-preview tabindex="0" aria-label="Drag or use buttons to turn your buddy">
          <span class="gear-preview-glow" aria-hidden="true"></span>
          ${window.BBBuddyPreview
            ? `<div class="gear-preview-3d" data-gear-3d></div>`
            : buddyAvatarSvg(state.avatar, false, state.avatarYaw, state.equippedWeapons) + gearEquippedBbMarkup()}
        </div>
        <div class="gear-turn-controls">
          <button type="button" class="gear-turn-btn" data-action="turn-buddy" data-dir="-1" aria-label="Turn left">◀ Turn</button>
          <p class="gear-yaw-label">${YAW_LABELS[state.avatarYaw]}</p>
          <button type="button" class="gear-turn-btn" data-action="turn-buddy" data-dir="1" aria-label="Turn right">Turn ▶</button>
        </div>
        <div class="gear-panel-tabs" role="tablist" aria-label="Gear panels">
          <button type="button" class="gear-panel-tab${state.gearPanel === "items" ? " active" : ""}" data-action="gear-panel" data-panel="items" role="tab" aria-selected="${state.gearPanel === "items"}">Items</button>
          <button type="button" class="gear-panel-tab gear-panel-tab--skins${state.gearPanel === "skins" ? " active" : ""}" data-action="gear-panel" data-panel="skins" role="tab" aria-selected="${state.gearPanel === "skins"}">Skins ${state.ownedSkins.length}/${SKIN_CATALOG.length}</button>
        </div>
        <button class="drop-button ghost gear-back" type="button" data-action="hub-back">Back to Hub</button>
      </section>
    </div>
  `, "drop-screen gear-screen");

  bindGearRail();
  bindGearTurn();
  const mount = app.querySelector("[data-gear-3d]");
  if (mount && window.BBBuddyPreview) gearPreview3d = window.BBBuddyPreview.mount(mount, gearPreviewOptions());
}

function bindGearTurn() {
  const preview = app.querySelector("[data-gear-preview]");
  if (!preview) return;

  let dragStartX = 0;
  let startYaw = 0;
  let dragging = false;

  const applyYaw = (yaw) => {
    state.avatarYaw = normalizeYaw(yaw);
    writeAvatarYaw(state.avatarYaw);
    const label = app.querySelector(".gear-yaw-label");
    if (label) label.textContent = YAW_LABELS[state.avatarYaw];
    if (gearPreview3d) {
      gearPreview3d.update({ yaw: state.avatarYaw });
      return;
    }
    preview.innerHTML = `<span class="gear-preview-glow" aria-hidden="true"></span>${buddyAvatarSvg(state.avatar, false, state.avatarYaw, state.equippedWeapons)}`;
  };

  preview.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    dragStartX = event.clientX;
    startYaw = state.avatarYaw;
    preview.setPointerCapture(event.pointerId);
  });

  preview.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - dragStartX;
    const steps = Math.round(delta / 36);
    if (steps !== 0) {
      applyYaw(startYaw - steps);
    }
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    try {
      preview.releasePointerCapture(event.pointerId);
    } catch {}
  };

  preview.addEventListener("pointerup", endDrag);
  preview.addEventListener("pointercancel", endDrag);

  preview.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applyYaw(state.avatarYaw - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      applyYaw(state.avatarYaw + 1);
    }
  });
}

function bindGearRail() {
  const picker = app.querySelector(".gear-picker");
  const rail = app.querySelector(".gear-rail");
  const thumb = app.querySelector("[data-gear-thumb]");
  if (!picker || !rail || !thumb) return;

  const sync = () => {
    const railHeight = rail.clientHeight;
    const scrollable = picker.scrollHeight - picker.clientHeight;
    const ratio = picker.clientHeight / picker.scrollHeight;
    const thumbHeight = Math.max(52, Math.round(railHeight * Math.min(ratio, 1)));
    const travel = railHeight - thumbHeight;
    const progress = scrollable > 0 ? picker.scrollTop / scrollable : 0;

    rail.hidden = scrollable <= 0;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${Math.round(progress * travel)}px)`;
  };

  picker.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();

  let dragOffset = 0;

  const drag = (event) => {
    const railTop = rail.getBoundingClientRect().top;
    const travel = rail.clientHeight - thumb.offsetHeight;
    if (travel <= 0) return;

    const progress = Math.min(1, Math.max(0, (event.clientY - railTop - dragOffset) / travel));
    picker.scrollTop = progress * (picker.scrollHeight - picker.clientHeight);
  };

  const stop = () => {
    window.removeEventListener("pointermove", drag);
    window.removeEventListener("pointerup", stop);
  };

  thumb.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dragOffset = event.clientY - thumb.getBoundingClientRect().top;
    window.addEventListener("pointermove", drag);
    window.addEventListener("pointerup", stop);
  });

  rail.addEventListener("pointerdown", (event) => {
    if (event.target === thumb) return;
    dragOffset = thumb.offsetHeight / 2;
    drag(event);
  });
}

function getShopTabLabel(tabId = state.shopTab) {
  return SHOP_TABS.find((tab) => tab.id === tabId)?.label || "Weapons";
}

function formatShopCoinAmount(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  return value.toLocaleString("en-US");
}

function shopCoinSvg() {
  return `
    <svg class="shops-coin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#92400e" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#fde68a" stroke-width="1"/>
      <ellipse cx="9.5" cy="9" rx="3.5" ry="2" fill="#fff" fill-opacity=".45"/>
      <text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="800" fill="#78350f" font-family="Arial,sans-serif">C</text>
    </svg>
  `;
}

function shopDiamondSvg() {
  return `
    <svg class="shops-coin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 3 L18 3 L23 9 L12 22 L1 9 Z" fill="#22d3ee" stroke="#0e7490" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M1 9 L23 9 M6 3 L9 9 L12 22 L15 9 L18 3 M9 9 L12 3 L15 9" fill="none" stroke="#0e7490" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M6 3 L9 9 L1 9 Z" fill="#a5f3fc"/>
      <path d="M12 3 L15 9 L9 9 Z" fill="#ecfeff"/>
    </svg>
  `;
}

function shopShieldSvg() {
  return `
    <svg class="shops-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2 L20 5 L20 11 Q20 18 12 22 Q4 18 4 11 L4 5 Z" fill="#60a5fa" stroke="#1e3a8a" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M12 4.5 L12 19.5 Q6.5 16.5 6.5 11 L6.5 6.6 Z" fill="#bfdbfe" fill-opacity=".7"/>
    </svg>
  `;
}

function shopSwordSvg() {
  return `
    <svg class="shops-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19.5 2.5 L21.5 4.5 L10 16 L8 14 Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M5.5 12.5 L11.5 18.5" stroke="#b45309" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M8 16 L4 20" stroke="#78350f" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="3.6" cy="20.4" r="1.4" fill="#f59e0b"/>
    </svg>
  `;
}

function renderWeaponEffect(name) {
  const damage = getWeaponDamage(name);
  const defense = getWeaponDefense(name);
  const ability = WEAPON_ABILITY[name];
  const parts = [];
  if (damage > 0) parts.push(`<span class="shops-weapon-stat">${shopSwordSvg()} ${damage} damage</span>`);
  if (defense > 0) parts.push(`<span class="shops-weapon-stat shops-weapon-stat--defense">${shopShieldSvg()} +${defense} defense</span>`);
  if (ability) parts.push(`<span class="shops-weapon-stat shops-weapon-stat--ability">${escapeHtml(ability)}</span>`);
  return parts.length ? `<span class="shops-weapon-effect">${parts.join("")}</span>` : "";
}

function renderGearStats() {
  const stats = getEquippedPlayerStats(state.equippedWeapons);
  return `
    <ul class="gear-stats" aria-label="Your stats">
      <li class="gear-stat gear-stat--hp">${shopHeartSvg()} ${stats.hp} HP</li>
      <li class="gear-stat gear-stat--defense">${shopShieldSvg()} ${stats.defense} defense</li>
      <li class="gear-stat gear-stat--damage">${shopSwordSvg()} ${stats.damage} damage</li>
      <li class="gear-stat gear-stat--ability">${stats.abilities.length ? stats.abilities.map(escapeHtml).join(" · ") : "No abilities"}</li>
    </ul>
  `;
}

function shopHeartSvg() {
  return `
    <svg class="shops-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 21 Q3 14.5 3 8.5 A4.8 4.8 0 0 1 12 6.2 A4.8 4.8 0 0 1 21 8.5 Q21 14.5 12 21 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.3" stroke-linejoin="round"/>
      <ellipse cx="8" cy="8.6" rx="2" ry="1.3" fill="#fff" fill-opacity=".55"/>
    </svg>
  `;
}

function renderShopCoinPriceSlot(price, ariaLabel, showPriceCaption = true, currency = "coin") {
  const label = formatShopCoinAmount(price);
  const unit = currency === "diamond" ? "diamonds" : "coins";
  return `
    <div class="shops-weapon-slot shops-weapon-slot--price${currency === "diamond" ? " shops-weapon-slot--diamond" : ""}" aria-label="${escapeHtml(ariaLabel)} ${escapeHtml(label)} ${unit}">
      <div class="shops-price-panel">
        ${currency === "diamond" ? shopDiamondSvg() : shopCoinSvg()}
        <span class="shops-price-value">${escapeHtml(label)}</span>
      </div>
      ${showPriceCaption ? `<span class="shops-price-label">Price</span>` : `<span class="shops-price-label shops-price-label--spacer" aria-hidden="true"></span>`}
    </div>
  `;
}

function renderShopWalletBar() {
  const coins = formatShopCoinAmount(state.shopCoins);
  const diamonds = formatShopCoinAmount(state.shopDiamonds);
  return `
    <div class="shops-wallet" aria-label="Your shop balance">
      <span class="shops-wallet-item shops-wallet-coins">
        ${shopCoinSvg()}
        <span class="shops-wallet-value">${escapeHtml(coins)}</span>
      </span>
      <span class="shops-wallet-item shops-wallet-diamonds">
        ${shopDiamondSvg()}
        <span class="shops-wallet-value">${escapeHtml(diamonds)}</span>
      </span>
    </div>
  `;
}

function renderWeaponBuySlot(name, plan) {
  const price = getWeaponPlanPrice(name, plan);
  const label = formatShopCoinAmount(price);
  const ownedForever = plan === "permanent" && state.ownedPermanent.includes(name);
  const oneGameCount = plan === "one-game" ? state.ownedOneGame[name] || 0 : 0;
  const disabled = ownedForever || state.shopCoins < price;
  let caption = "Buy";
  if (ownedForever) caption = "Owned";
  else if (oneGameCount > 0) caption = `Have ${oneGameCount}`;
  const planLabel = plan === "permanent" ? "permanently" : "for 1 game";
  return `
    <button
      type="button"
      class="shops-weapon-slot shops-weapon-slot--price shops-buy-slot${ownedForever ? " shops-buy-slot--owned" : ""}"
      data-action="buy-weapon"
      data-weapon-name="${escapeHtml(name)}"
      data-plan="${plan}"
      ${disabled ? "disabled" : ""}
      aria-label="Buy ${escapeHtml(name)} ${planLabel} for ${escapeHtml(label)} coins"
    >
      <span class="shops-price-panel">
        ${shopCoinSvg()}
        <span class="shops-price-value">${escapeHtml(label)}</span>
      </span>
      <span class="shops-price-label">${escapeHtml(caption)}</span>
    </button>
  `;
}

function renderShopOneGamePriceSlot(name) {
  return renderWeaponBuySlot(name, "one-game");
}

function renderShopPermanentPriceSlot(name) {
  return renderWeaponBuySlot(name, "permanent");
}

function renderShopInGamePriceSlot(name) {
  return renderShopCoinPriceSlot(getWeaponInGameShopPrice(name), "In game price", false);
}

function renderShopStageContent() {
  if (state.shopTab === "weapons") {
    const chips = WEAPON_SHOP_ITEMS.map(
      (name) => `
        <div class="shops-weapon-row">
          <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-weapon-name="${escapeHtml(name)}">
            <span class="shops-weapon-frame">${weaponArtSvg(name)}</span>
            <span class="shops-weapon-name">${escapeHtml(name)}</span>
            ${renderWeaponEffect(name)}
          </button>
          ${renderShopOneGamePriceSlot(name)}
          ${renderShopPermanentPriceSlot(name)}
          ${renderShopInGamePriceSlot(name)}
        </div>
      `
    ).join("");
    return `
      ${WEAPON_ART_DEFS}
      <div class="shops-weapons-scroll" tabindex="0" aria-label="Weapon catalog">
        <div class="shops-weapons-row">
          <div class="shops-weapon-row shops-weapon-head" aria-hidden="true">
            <span></span>
            <span class="shops-weapon-head-label">1 Game</span>
            <span class="shops-weapon-head-label">Permanent</span>
            <span class="shops-weapon-head-label">In Game</span>
          </div>
          ${chips}
        </div>
      </div>
    `;
  }
  if (state.shopTab === "currencies") {
    const coinDeal = CURRENCY_DEALS["coins-150"];
    const canBuyCoinSack = state.shopDiamonds >= coinDeal.diamondCost;
    return `
      ${WEAPON_ART_DEFS}
      <div class="shops-weapons-scroll" tabindex="0" aria-label="Currency deals">
        <div class="shops-currency-grid">
          <button
            type="button"
            class="shops-weapon-slot shops-weapon-slot--weapon shops-currency-deal${canBuyCoinSack ? "" : " shops-currency-deal--disabled"}"
            data-action="buy-currency-deal"
            data-currency-deal="coins-150"
            ${canBuyCoinSack ? "" : "disabled"}
            aria-disabled="${canBuyCoinSack ? "false" : "true"}"
          >
            <span class="shops-weapon-frame">${coinSackArtSvg()}</span>
            <span class="shops-weapon-name">150 ${shopCoinSvg()} coin for 15 ${shopDiamondSvg()} diamond</span>
          </button>
        </div>
      </div>
    `;
  }
  if (state.shopTab === "potions") {
    const blankSlot = `<div class="shops-weapon-slot shops-weapon-slot--blank" aria-hidden="true"></div>`;
    const defenseRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Defense Potion">
          <span class="shops-weapon-frame">${potionArtSvg("liquidblue")}</span>
          <span class="shops-weapon-name">+1 Defense ${shopShieldSvg()} rest of game</span>
        </button>
        ${renderShopCoinPriceSlot(25, "1 game price", true, "diamond")}
        ${renderShopCoinPriceSlot(200, "Permanent price", false, "diamond")}
        ${renderShopCoinPriceSlot(20, "In game price", false, "diamond")}
      </div>
    `;
    const defenseMinuteRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Defense Potion (1 min)">
          <span class="shops-weapon-frame">${potionArtSvg("liquidblue", "small")}</span>
          <span class="shops-weapon-name">+1 Defense ${shopShieldSvg()} 1 minute</span>
        </button>
        ${renderShopCoinPriceSlot(5, "1 game price", true, "diamond")}
        ${renderShopCoinPriceSlot(40, "Permanent price", false, "diamond")}
        ${renderShopCoinPriceSlot(4, "In game price", false, "diamond")}
      </div>
    `;
    const waterRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Water Bottle">
          <span class="shops-weapon-frame">${waterBottleArtSvg()}</span>
          <span class="shops-weapon-name">Water bottle heals 5 HP ${shopHeartSvg()}</span>
        </button>
        ${renderShopCoinPriceSlot(15, "1 game price", true)}
        ${renderShopCoinPriceSlot(145, "Permanent price", false)}
        ${renderShopCoinPriceSlot(14, "In game price", false)}
      </div>
    `;
    const healthRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Health Potion">
          <span class="shops-weapon-frame">${potionArtSvg("liquidgreen")}</span>
          <span class="shops-weapon-name">+5 HP ${shopHeartSvg()}</span>
        </button>
        ${renderShopCoinPriceSlot(20, "1 game price", true)}
        ${renderShopCoinPriceSlot(175, "Permanent price", false)}
        ${renderShopCoinPriceSlot(18, "In game price", false)}
      </div>
    `;
    const dpRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Red Glass">
          <span class="shops-weapon-frame">${potionArtSvg("liquidred", "small")}</span>
          <span class="shops-weapon-name">+1 damage 1 minute</span>
        </button>
        ${renderShopCoinPriceSlot(2, "1 game price", true, "diamond")}
        ${renderShopCoinPriceSlot(18, "Permanent price", false, "diamond")}
        ${renderShopCoinPriceSlot(2, "In game price", false, "diamond")}
      </div>
    `;
    const dpGameRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Red Glass (game)">
          <span class="shops-weapon-frame">${potionArtSvg("liquidred")}</span>
          <span class="shops-weapon-name">+1 damage rest of game</span>
        </button>
        ${renderShopCoinPriceSlot(20, "1 game price", true, "diamond")}
        ${renderShopCoinPriceSlot(175, "Permanent price", false, "diamond")}
        ${renderShopCoinPriceSlot(18, "In game price", false, "diamond")}
      </div>
    `;
    const fireRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Fire Resistance Potion">
          <span class="shops-weapon-frame">${fireBottleArtSvg("small")}</span>
          <span class="shops-weapon-name">Fire resistant 3 minutes</span>
        </button>
        ${renderShopCoinPriceSlot(45, "1 game price", true, "diamond")}
        ${renderShopCoinPriceSlot(425, "Permanent price", false, "diamond")}
        ${renderShopCoinPriceSlot(40, "In game price", false, "diamond")}
      </div>
    `;
    const fireGameRow = `
      <div class="shops-weapon-row">
        <button type="button" class="shops-weapon-slot shops-weapon-slot--weapon" data-potion-name="Fire Resistance Potion (game)">
          <span class="shops-weapon-frame">${fireBottleArtSvg()}</span>
          <span class="shops-weapon-name">Fire resistant rest of game</span>
        </button>
        ${renderShopCoinPriceSlot(150, "1 game price", true, "diamond")}
        ${renderShopCoinPriceSlot(1000, "Permanent price", false, "diamond")}
        ${renderShopCoinPriceSlot(100, "In game price", false, "diamond")}
      </div>
    `;
    const emptyRows = Array.from({ length: 0 }, () => `
      <div class="shops-weapon-row">${blankSlot}${blankSlot}${blankSlot}${blankSlot}</div>
    `).join("");
    return `
      ${WEAPON_ART_DEFS}
      <div class="shops-weapons-scroll" tabindex="0" aria-label="Potion catalog">
        <div class="shops-weapons-row">
          <div class="shops-weapon-row shops-weapon-head" aria-hidden="true">
            <span></span>
            <span class="shops-weapon-head-label">1 Game</span>
            <span class="shops-weapon-head-label">Permanent</span>
            <span class="shops-weapon-head-label">In Game</span>
          </div>
          ${defenseRow}
          ${defenseMinuteRow}
          ${waterRow}
          ${healthRow}
          ${dpRow}
          ${dpGameRow}
          ${fireRow}
          ${fireGameRow}
          ${emptyRows}
        </div>
      </div>
    `;
  }
  return `<p class="shops-stage-empty">More items coming soon.</p>`;
}

function getRewardsWheelLayout() {
  let angle = 0;
  return REWARDS_WHEEL_SEGMENTS.map((segment) => {
    const sweep = (segment.weight / 100) * 360;
    const entry = { ...segment, start: angle, sweep };
    angle += sweep;
    return entry;
  });
}

function rewardsWheelSlicePath(cx, cy, r, startDeg, sweepDeg) {
  const start = (startDeg - 90) * (Math.PI / 180);
  const end = (startDeg + sweepDeg - 90) * (Math.PI / 180);
  const x0 = cx + r * Math.cos(start);
  const y0 = cy + r * Math.sin(start);
  const x1 = cx + r * Math.cos(end);
  const y1 = cy + r * Math.sin(end);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function rewardsWheelWeaponArt(name, startDeg, sweepDeg) {
  if (typeof WEAPON_ART === "undefined" || !WEAPON_ART[name]) return "";
  const cx = 120;
  const cy = 120;
  const mid = startDeg + sweepDeg / 2;
  const rad = (mid - 90) * (Math.PI / 180);
  const scale = sweepDeg < 9 ? 0.2 : sweepDeg < 13 ? 0.24 : 0.28;
  const lx = cx + 52 * Math.cos(rad);
  const ly = cy + 52 * Math.sin(rad);
  return `<g transform="translate(${lx.toFixed(2)} ${ly.toFixed(2)}) rotate(${mid.toFixed(2)}) scale(${scale}) translate(-80 -24)">${WEAPON_ART[name]()}</g>`;
}

function rewardsWheelWeaponLabel(name, startDeg, sweepDeg) {
  const cx = 120;
  const cy = 120;
  const mid = startDeg + sweepDeg / 2;
  const rad = (mid - 90) * (Math.PI / 180);
  const lx = cx + 78 * Math.cos(rad);
  const ly = cy + 78 * Math.sin(rad);
  const shortName = name === "Butter Knife" ? "Butter" : name;
  const fontSize = sweepDeg < 9 ? 5.5 : 6.5;
  return `
    <text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(${mid.toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)})"
      font-size="${fontSize}" font-weight="900" fill="#e0f2fe" font-family="Arial,sans-serif">${escapeHtml(shortName)}</text>
  `;
}

function rewardsWheelBbArt(bbName, startDeg, sweepDeg) {
  const bb = findBb(bbName);
  if (!bb || typeof bbArtSvg === "undefined") return "";
  const cx = 120;
  const cy = 120;
  const mid = startDeg + sweepDeg / 2;
  const rad = (mid - 90) * (Math.PI / 180);
  const scale = sweepDeg < 9 ? 0.22 : 0.26;
  const lx = cx + 50 * Math.cos(rad);
  const ly = cy + 50 * Math.sin(rad);
  const inner = bbArtSvg(bb.art).replace(/^<svg[^>]*>|<\/svg>$/g, "");
  return `<g transform="translate(${lx.toFixed(2)} ${ly.toFixed(2)}) rotate(${mid.toFixed(2)}) scale(${scale}) translate(-24 -24)">${inner}</g>`;
}

function rewardsWheelBbLabel(bbName, startDeg, sweepDeg) {
  const cx = 120;
  const cy = 120;
  const mid = startDeg + sweepDeg / 2;
  const rad = (mid - 90) * (Math.PI / 180);
  const lx = cx + 78 * Math.cos(rad);
  const ly = cy + 78 * Math.sin(rad);
  const fontSize = sweepDeg < 9 ? 5.5 : 6;
  return `
    <text x="${lx.toFixed(2)}" y="${(ly - 4).toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(${mid.toFixed(2)} ${lx.toFixed(2)} ${(ly - 4).toFixed(2)})"
      font-size="${fontSize}" font-weight="900" fill="#ccfbf1" font-family="Arial,sans-serif">${escapeHtml(bbName)}</text>
    <text x="${lx.toFixed(2)}" y="${(ly + 5).toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(${mid.toFixed(2)} ${lx.toFixed(2)} ${(ly + 5).toFixed(2)})"
      font-size="5" font-weight="800" fill="#99f6e4" font-family="Arial,sans-serif">1 game</text>
  `;
}

function rewardsWheelRandomPotionArt(startDeg, sweepDeg) {
  if (typeof potionArtSvg === "undefined") return "";
  const cx = 120;
  const cy = 120;
  const mid = startDeg + sweepDeg / 2;
  const rad = (mid - 90) * (Math.PI / 180);
  const scale = 0.24;
  const lx = cx + 50 * Math.cos(rad);
  const ly = cy + 50 * Math.sin(rad);
  return `
    <g transform="translate(${lx.toFixed(2)} ${ly.toFixed(2)}) rotate(${mid.toFixed(2)}) scale(${scale}) translate(-80 -24)">
      ${potionArtSvg("liquidgreen").replace(/^<svg[^>]*>|<\/svg>$/g, "")}
    </g>
  `;
}

function rewardsWheelRandomPotionLabel(startDeg, sweepDeg) {
  const cx = 120;
  const cy = 120;
  const mid = startDeg + sweepDeg / 2;
  const rad = (mid - 90) * (Math.PI / 180);
  const lx = cx + 78 * Math.cos(rad);
  const ly = cy + 78 * Math.sin(rad);
  return `
    <text x="${lx.toFixed(2)}" y="${(ly - 4).toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(${mid.toFixed(2)} ${lx.toFixed(2)} ${(ly - 4).toFixed(2)})"
      font-size="6.5" font-weight="900" fill="#e9d5ff" font-family="Arial,sans-serif">Random</text>
    <text x="${lx.toFixed(2)}" y="${(ly + 5).toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(${mid.toFixed(2)} ${lx.toFixed(2)} ${(ly + 5).toFixed(2)})"
      font-size="5" font-weight="800" fill="#ddd6fe" font-family="Arial,sans-serif">perm</text>
  `;
}

function resolveRewardsSpin(segment) {
  if (segment.kind === "coins") {
    state.shopCoins += segment.amount;
    persistShopWallet();
    return `You won ${segment.amount} coins!`;
  }
  if (segment.kind === "permanent") {
    const name = segment.weaponName;
    if (state.ownedPermanent.includes(name)) {
      return `You spun ${name} permanent, but you already own it.`;
    }
    state.ownedPermanent = [...state.ownedPermanent, name];
    persistShopInventory();
    return `You won ${name} permanent!`;
  }
  if (segment.kind === "random-potion") {
    const name = pickRandomSpinPotion();
    if (!grantSpinPotionPermanent(name)) {
      return `You spun ${name}, but you already own it permanently.`;
    }
    return `You won ${name} permanent!`;
  }
  if (segment.kind === "bb-one-game") {
    const name = segment.bbName;
    if (!findBb(name)) return "No reward this spin.";
    grantSpinBbOneGame(name);
    return `You won ${name} for 1 game!`;
  }
  return "No reward this spin.";
}

function rewardsWheelSvg() {
  const cx = 120;
  const cy = 120;
  const r = 98;
  const layout = getRewardsWheelLayout();
  const coinFills = { 100: "#fbbf24", 75: "#fde68a", 50: "#f59e0b", 25: "#fcd34d" };
  const segments = layout.map((segment, index) => {
    const isCoins = segment.kind === "coins";
    const isPermanent = segment.kind === "permanent";
    const isRandomPotion = segment.kind === "random-potion";
    const isBbOneGame = segment.kind === "bb-one-game";
    const fill = isCoins
      ? (coinFills[segment.amount] || "#fbbf24")
      : isPermanent
        ? "#1a4a66"
        : isRandomPotion
          ? "#5b21b6"
          : isBbOneGame
            ? "#0f766e"
            : index % 2 === 0
              ? "#132a52"
              : "#0b1836";
    const path = rewardsWheelSlicePath(cx, cy, r, segment.start, segment.sweep);
    let label = "";
    if (isCoins) {
      const mid = segment.start + segment.sweep / 2;
      const rad = (mid - 90) * (Math.PI / 180);
      const labelRadius = segment.sweep < 8 ? 58 : 66;
      const lx = cx + labelRadius * Math.cos(rad);
      const ly = cy + labelRadius * Math.sin(rad);
      const fontSize = segment.sweep < 6 ? 6 : segment.sweep < 14 ? 8 : 10;
      label = `
        <text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="middle" dominant-baseline="middle"
          transform="rotate(${mid.toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)})"
          font-size="${fontSize}" font-weight="900" fill="#78350f" font-family="Arial,sans-serif">${segment.amount}</text>
      `;
    } else if (isPermanent) {
      label = rewardsWheelWeaponArt(segment.weaponName, segment.start, segment.sweep)
        + rewardsWheelWeaponLabel(segment.weaponName, segment.start, segment.sweep);
    } else if (isRandomPotion) {
      label = rewardsWheelRandomPotionArt(segment.start, segment.sweep)
        + rewardsWheelRandomPotionLabel(segment.start, segment.sweep);
    } else if (isBbOneGame) {
      label = rewardsWheelBbArt(segment.bbName, segment.start, segment.sweep)
        + rewardsWheelBbLabel(segment.bbName, segment.start, segment.sweep);
    }
    return `<path d="${path}" fill="${fill}" stroke="rgba(147, 197, 253, 0.42)" stroke-width="1.4"/>${label}`;
  }).join("");
  return `
    <svg class="rewards-wheel-svg" viewBox="0 0 240 240" role="img" aria-label="Reward spinner with ten sections">
      <circle cx="${cx}" cy="${cy}" r="104" fill="none" stroke="rgba(252, 211, 77, 0.55)" stroke-width="4"/>
      ${segments}
      <circle cx="${cx}" cy="${cy}" r="18" fill="#fcd34d" stroke="#78350f" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="8" fill="#fef08a"/>
    </svg>
  `;
}

function pickRewardsSpinIndex() {
  const roll = Math.random() * 100;
  let cursor = 0;
  for (let index = 0; index < REWARDS_WHEEL_SEGMENTS.length; index += 1) {
    cursor += REWARDS_WHEEL_SEGMENTS[index].weight;
    if (roll < cursor) return index;
  }
  return REWARDS_WHEEL_SEGMENTS.length - 1;
}

function spinRewardsWheel() {
  if (state.rewardsSpinning || !state.username) return;
  if (!canSpinRewardsToday(state.username)) {
    state.rewardsNotice = "You already spun today. Come back tomorrow.";
    render();
    return;
  }
  const dial = app.querySelector("[data-rewards-dial]");
  if (!dial) return;
  writeRewardsSpinDate(state.username, getLocalDateKey());
  const layout = getRewardsWheelLayout();
  const winIndex = pickRewardsSpinIndex();
  const segment = layout[winIndex];
  const targetAngle = segment.start + segment.sweep * (0.15 + Math.random() * 0.7);
  const extraSpins = 4 + Math.floor(Math.random() * 3);
  const delta = extraSpins * 360 + (360 - targetAngle);
  const pendingSegment = segment;
  const fromRotation = state.rewardsWheelRotation;
  state.rewardsSpinning = true;
  state.rewardsNotice = "";
  state.rewardsWheelRotation += delta;

  const spinBtn = app.querySelector("[data-action=spin-rewards]");
  const backBtn = app.querySelector(".rewards-back");
  if (spinBtn) spinBtn.disabled = true;
  if (backBtn) backBtn.disabled = true;
  const notice = app.querySelector(".rewards-top-notice");
  if (notice) notice.remove();

  dial.classList.remove("is-spinning");
  dial.style.transform = `rotate(${fromRotation}deg)`;
  void dial.offsetWidth;
  dial.classList.add("is-spinning");
  dial.style.transform = `rotate(${state.rewardsWheelRotation}deg)`;

  window.setTimeout(() => {
    syncShopWalletFromStorage();
    state.rewardsNotice = resolveRewardsSpin(pendingSegment);
    state.rewardsSpinning = false;
    render();
  }, 4200);
}

function bindRewardsWheel() {
  const dial = app.querySelector("[data-rewards-dial]");
  if (!dial) return;
  dial.style.transform = `rotate(${state.rewardsWheelRotation}deg)`;
}

function renderRewards() {
  const canSpin = canSpinRewardsToday(state.username);
  const notice = state.rewardsNotice
    ? `<p class="rewards-top-notice" role="status">${escapeHtml(state.rewardsNotice)}</p>`
    : !canSpin
      ? `<p class="rewards-top-notice rewards-top-notice--wait" role="status">You already spun today. Come back tomorrow.</p>`
      : "";
  template(`
    ${WEAPON_ART_DEFS}
    <header class="rewards-top">
      <p class="rewards-top-brand">B.B <span>All Rewards</span></p>
      <h1 class="rewards-top-title">Spinner</h1>
      ${notice}
    </header>
    <section class="rewards-stage" aria-label="Reward spinner">
      <div class="rewards-wheel-wrap">
        <div class="rewards-wheel-pointer" aria-hidden="true"></div>
        <div class="rewards-wheel-dial${state.rewardsSpinning ? " is-spinning" : ""}" data-rewards-dial>
          ${rewardsWheelSvg()}
        </div>
      </div>
      <button
        type="button"
        class="drop-button rewards-spin-btn"
        data-action="spin-rewards"
        ${state.rewardsSpinning || !canSpin ? "disabled" : ""}
      >${canSpin ? "Spin" : "Spun for today"}</button>
    </section>
    <button class="drop-button ghost rewards-back" type="button" data-action="hub-back" ${state.rewardsSpinning ? "disabled" : ""}>Back to Hub</button>
  `, "drop-screen rewards-screen");
  bindRewardsWheel();
}

function renderShops() {
  const activeLabel = getShopTabLabel();
  const tabs = SHOP_TABS.map(
    (tab) => `
      <button
        type="button"
        class="shops-tab shops-tab-${tab.id}${state.shopTab === tab.id ? " active" : ""}"
        data-action="show-shop-tab"
        data-shop-tab="${tab.id}"
        aria-pressed="${state.shopTab === tab.id}"
      >
        ${escapeHtml(tab.label)}
      </button>
    `
  ).join("");

  const shopNotice = state.shopNotice
    ? `<p class="shops-top-notice" role="status">${escapeHtml(state.shopNotice)}</p>`
    : "";

  template(`
    <header class="shops-top">
      ${renderShopWalletBar()}
      <p class="shops-top-brand">B.B <span>Shops</span></p>
      <h1 class="shops-top-title">${escapeHtml(activeLabel)}</h1>
      ${shopNotice}
    </header>
    <div class="shops-layout">
      <aside class="shops-rail" aria-label="Shop categories">
        <div class="shops-tab-row">${tabs}</div>
      </aside>
      <section class="shops-stage" aria-label="Shop items">
        <div class="shops-stage-inner">${renderShopStageContent()}</div>
      </section>
    </div>
    <button class="drop-button ghost shops-back" type="button" data-action="hub-back">Back to Hub</button>
  `, "drop-screen shops-screen");
}

function hubPortrait() {
  return `
    ${WEAPON_ART_DEFS}
    <button class="hub-portrait" type="button" data-action="open-gear" aria-label="Your buddy — open Gear">
      ${window.BBBuddyPreview
        ? `<img class="hub-portrait-3d" src="${window.BBBuddyPreview.portrait(state.avatar, state.equippedSkin)}" alt="" draggable="false">`
        : buddyAvatarSvg(state.avatar, false, 0, state.equippedWeapons, "16 7 88 88")}
    </button>
  `;
}

function lobbyTutorialBubble() {
  if (!tutorialStillNeeded("hub")) return "";
  return `
    <aside class="bb-speech bb-speech--float" role="dialog" aria-label="Hub tutorial">
      <p class="bb-speech-title">Welcome to the Hub!</p>
      <p class="bb-speech-body">This is your home base between drops. Tap your buddy portrait for <strong>Gear</strong> (skins and loadout). <strong>All Rewards</strong> spins daily prizes. <strong>Shops</strong> buys coins, weapons, and potions with what you earn. <strong>B.B.s</strong> is your buddy collection. <strong>Battle</strong> queues you into real matches on the island maps.</p>
      <button class="drop-button bb-speech-btn" type="button" data-action="dismiss-lobby-tutorial">
        <span class="button-text">Got it!</span>
      </button>
    </aside>
  `;
}

function renderLobby() {
  renderScene(hubPortrait() + renderCard(`
    <header class="drop-head hub-head">
      <div class="drop-crest">${crestSvg()}</div>
      <p class="drop-kicker">B.B <span>Hub</span></p>
      <h1 class="drop-title drop-title-compact">${escapeHtml(state.username)}</h1>
      <p class="drop-tagline">Pick your drop <span class="tagline-mode">(for real)</span></p>
    </header>
    ${hubFriendRequestsHtml()}
    <nav class="hub-menu" aria-label="Main menu">
      ${hubButton("All Rewards", "rewards")}
      ${hubButton("Shops", "shops")}
      ${hubButton("B.B.s", "bbs")}
      ${hubButton("Battle", "battle")}
      ${hubButton("Gear", "gear")}
    </nav>
    <button class="drop-button ghost hub-sign-out" type="button" data-action="sign-out">Sign Out</button>
    ${liveBar()}
  `) + lobbyTutorialBubble());
}

function render() {
  if (state.screen === "create-account") {
    renderCreateAccount();
  } else if (state.screen === "battle") {
    renderBattleMenu();
  } else if (state.screen === "ranked") {
    renderRankedMenu();
  } else if (state.screen === "ranked-play") {
    renderRankedPlay();
  } else if (state.screen === "competitive-play") {
    renderCompetitivePlay();
  } else if (state.screen === "coop") {
    renderCoopMenu();
  } else if (state.screen === "coop-friend") {
    renderCoopFriend();
  } else if (state.screen === "coop-friends") {
    renderCoopFriends();
  } else if (state.screen === "coop-play") {
    renderCoopPlay();
  } else if (state.screen === "coop-chat") {
    renderCoopChat();
  } else if (state.screen === "queue") {
    renderQueue();
  } else if (state.screen === "match") {
    renderMatch();
  } else if (state.screen === "match-result") {
    renderMatchResult();
  } else if (state.screen === "leaderboard") {
    renderLeaderboard();
  } else if (state.screen === "gear") {
    renderGear();
  } else if (state.screen === "bbs") {
    renderBbs();
  } else if (state.screen === "shops") {
    renderShops();
  } else if (state.screen === "rewards") {
    renderRewards();
  } else if (state.screen === "lobby") {
    renderLobby();
  } else {
    renderSignIn();
  }

  state.shake = 0;
  if (state.username && state.password) {
    ensureSocialSocket();
    if (needsCoopConnection()) ensureCoopSocket();
  }
  renderSocialBar();

  const firstInput = app.querySelector("input[name='username']");
  if (firstInput && !state.busy && (state.screen === "sign-in" || state.screen === "create-account")) {
    firstInput.focus();
    firstInput.setSelectionRange(firstInput.value.length, firstInput.value.length);
  }
  const coopInput = app.querySelector(".coop-friend-form input[name='username']");
  if (coopInput && state.screen === "coop-friend") {
    coopInput.focus();
    coopInput.setSelectionRange(coopInput.value.length, coopInput.value.length);
  }
}

function tickLiveCount() {
  const target = app.querySelector("[data-live-count]");
  if (!target) return;

  const current = Number(target.textContent) || 96;
  const next = Math.min(100, Math.max(88, current + (Math.random() < 0.6 ? 1 : -1)));
  target.textContent = String(next);
}

async function submitAuth(form) {
  if (state.busy) return;

  const data = new FormData(form);
  const username = String(data.get("username") || "").trim();
  const password = String(data.get("password") || "").trim();
  const creating = form.dataset.form === "create-account";

  state.draft = username;
  state.error = "";
  state.notice = "";

  if (!username || !password) {
    state.error = "Enter both a callsign and a passcode.";
    state.shake += 1;
    render();
    return;
  }

  state.busy = true;
  render();

  try {
    const account = await postAuth(creating ? "/api/create-account" : "/api/sign-in", username, password);
    writeLastCallsign(account.username);
    state.password = password;
    applyAccountToState(account);
    loadShopProfile(account);
    state.leaderboard = null;
    state.leaderboardError = "";
    state.screen = "lobby";
    state.busy = false;
    state.draft = "";
    render();
  } catch (error) {
    state.busy = false;
    state.error = error.message;
    state.shake += 1;
    render();
  }
}

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  const action = actionTarget.dataset.action;

  if (action === "toggle-password") {
    const input = actionTarget.parentElement.querySelector("input");
    const revealing = input.type === "password";
    input.type = revealing ? "text" : "password";
    actionTarget.classList.toggle("revealed", revealing);
    actionTarget.setAttribute("aria-label", revealing ? "Hide passcode" : "Show passcode");
    return;
  }

  if (action === "dismiss-lobby-tutorial") {
    markTutorialDone("hub");
    render();
    return;
  }

  if (action === "show-create-account") {
    state.screen = "create-account";
    state.error = "";
    state.notice = "Callsigns are first come, first served.";
    render();
    return;
  }

  if (action === "show-sign-in") {
    state.screen = "sign-in";
    state.error = "";
    state.notice = "";
    render();
    return;
  }

  if (action === "open-battle") {
    state.screen = "battle";
    state.error = "";
    state.notice = "";
    render();
    return;
  }

  if (action === "start-for-fun") {
    pendingPlayBots = true;
    joinMatchQueue("fun", "island");
    return;
  }

  if (action === "open-gear") {
    state.screen = "gear";
    state.gearNotice = "";
    syncShopWalletFromStorage();
    render();
    return;
  }

  if (action === "open-bbs") {
    state.screen = "bbs";
    state.bbsNotice = "";
    syncShopWalletFromStorage();
    render();
    return;
  }

  if (action === "toggle-equip") {
    const list = app.querySelector(".gear-weapons-body");
    const scrollTop = list ? list.scrollTop : 0;
    toggleEquipWeapon(actionTarget.dataset.weaponName);
    render();
    const nextList = app.querySelector(".gear-weapons-body");
    if (nextList) nextList.scrollTop = scrollTop;
    return;
  }

  if (action === "toggle-equip-potion") {
    const list = app.querySelector(".gear-potions-body");
    const scrollTop = list ? list.scrollTop : 0;
    toggleEquipPotion(actionTarget.dataset.potionName);
    render();
    const nextList = app.querySelector(".gear-potions-body");
    if (nextList) nextList.scrollTop = scrollTop;
    return;
  }

  if (action === "open-shops") {
    state.screen = "shops";
    state.shopTab = "weapons";
    state.shopNotice = "";
    syncShopWalletFromStorage();
    render();
    return;
  }

  if (action === "open-rewards") {
    state.screen = "rewards";
    state.rewardsNotice = "";
    syncShopWalletFromStorage();
    render();
    return;
  }

  if (action === "spin-rewards") {
    spinRewardsWheel();
    return;
  }

  if (action === "show-shop-tab") {
    const tab = actionTarget.dataset.shopTab;
    if (!SHOP_TABS.some((entry) => entry.id === tab)) return;
    state.shopTab = tab;
    state.shopNotice = "";
    render();
    return;
  }

  if (action === "buy-currency-deal") {
    buyCurrencyDeal(actionTarget.dataset.currencyDeal);
    render();
    return;
  }

  if (action === "buy-bb") {
    const scroller = app.querySelector(".bbs-collection-body");
    const scrollTop = scroller ? scroller.scrollTop : 0;
    buyBb(actionTarget.dataset.bbName, actionTarget.dataset.plan);
    render();
    const nextScroller = app.querySelector(".bbs-collection-body");
    if (nextScroller) nextScroller.scrollTop = scrollTop;
    return;
  }

  if (action === "toggle-equip-bb") {
    const list = app.querySelector(".gear-bbs-body");
    const scrollTop = list ? list.scrollTop : 0;
    toggleEquipBb(actionTarget.dataset.bbName);
    render();
    const nextList = app.querySelector(".gear-bbs-body");
    if (nextList) nextList.scrollTop = scrollTop;
    return;
  }

  if (action === "buy-weapon") {
    const scroller = app.querySelector(".shops-weapons-scroll");
    const scrollTop = scroller ? scroller.scrollTop : 0;
    buyWeapon(actionTarget.dataset.weaponName, actionTarget.dataset.plan);
    render();
    const nextScroller = app.querySelector(".shops-weapons-scroll");
    if (nextScroller) nextScroller.scrollTop = scrollTop;
    return;
  }

  if (action === "gear-panel") {
    state.gearPanel = actionTarget.dataset.panel === "skins" ? "skins" : "items";
    state.skinTryOn = "";
    state.gearNotice = "";
    render();
    return;
  }

  if (action === "try-skin" || action === "buy-skin" || action === "equip-skin") {
    const skinId = actionTarget.dataset.skin;
    const list = app.querySelector(".gear-skins-body");
    const scrollTop = list ? list.scrollTop : 0;
    if (action === "try-skin") {
      state.skinTryOn = findSkin(skinId) && skinId !== state.equippedSkin ? skinId : "";
    } else if (action === "buy-skin") {
      buySkin(skinId);
    } else {
      toggleEquipSkin(skinId);
    }
    render();
    const nextList = app.querySelector(".gear-skins-body");
    if (nextList) nextList.scrollTop = scrollTop;
    return;
  }

  if (action === "pick-avatar") {
    const avatarId = actionTarget.dataset.avatar;
    if (!AVATAR_IDS.includes(avatarId)) return;
    state.avatar = avatarId;
    writeAvatar(avatarId);
    state.skinTryOn = "";
    if (state.equippedSkin) {
      state.equippedSkin = "";
      persistShopInventory();
    }
    render();
    return;
  }

  if (action === "preview-skin") {
    const skinId = actionTarget.dataset.skin;
    if (!findSkin(skinId)) return;
    const picker = app.querySelector(".gear-picker");
    const pickerScroll = picker ? picker.scrollTop : 0;
    state.gearPanel = "skins";
    state.skinTryOn = skinId;
    state.gearNotice = "";
    render();
    const nextPicker = app.querySelector(".gear-picker");
    if (nextPicker) nextPicker.scrollTop = pickerScroll;
    app.querySelector(`.gear-skin-try[data-skin="${skinId}"]`)?.closest(".gear-skin-card")?.scrollIntoView({ block: "center" });
    return;
  }

  if (action === "wear-skin") {
    const skinId = actionTarget.dataset.skin;
    if (!state.ownedSkins.includes(skinId)) return;
    state.equippedSkin = skinId;
    state.skinTryOn = "";
    state.gearNotice = `Wearing ${findSkin(skinId).name}.`;
    persistShopInventory();
    const picker = app.querySelector(".gear-picker");
    const pickerScroll = picker ? picker.scrollTop : 0;
    render();
    const nextPicker = app.querySelector(".gear-picker");
    if (nextPicker) nextPicker.scrollTop = pickerScroll;
    return;
  }

  if (action === "turn-buddy") {
    const dir = Number(actionTarget.dataset.dir);
    if (!Number.isFinite(dir)) return;
    state.avatarYaw = normalizeYaw(state.avatarYaw + dir);
    writeAvatarYaw(state.avatarYaw);
    render();
    return;
  }

  if (action === "open-ranked") {
    state.screen = "ranked";
    render();
    return;
  }

  if (action === "open-ranked-play") {
    state.screen = "ranked-play";
    render();
    return;
  }

  if (action === "open-competitive-play") {
    state.screen = "competitive-play";
    render();
    return;
  }

  if (action === "open-coop") {
    state.coopNotice = "";
    state.screen = "coop";
    ensureCoopSocket();
    render();
    return;
  }

  if (action === "coop-friend") {
    state.screen = "coop-friend";
    render();
    return;
  }

  if (action === "coop-next") {
    state.screen = "coop-friends";
    render();
    return;
  }

  if (action === "open-chat") {
    openChat(actionTarget.dataset.name);
    return;
  }

  if (action === "chat-voice") {
    requestVoice(actionTarget.dataset.name);
    return;
  }

  if (action === "coop-play") {
    state.coopNotice = "";
    state.screen = "coop-play";
    render();
    if (coopSocket && coopSocket.readyState === WebSocket.OPEN) coopSocket.send(JSON.stringify({ t: "partyState" }));
    return;
  }

  if (action === "battle-invite") {
    sendCoop({ t: "battleInvite", to: actionTarget.dataset.to || "" });
    return;
  }

  if (action === "battle-accept") {
    sendCoop({ t: "battleAccept", from: actionTarget.dataset.from || "" });
    return;
  }

  if (action === "battle-decline") {
    sendCoop({ t: "battleDecline", from: actionTarget.dataset.from || "" });
    return;
  }

  if (action === "squad-leave") {
    sendCoop({ t: "squadLeave" });
    return;
  }

  if (action === "squad-start") {
    if (!window.BBGame) {
      state.coopNotice = "3D game still loading. Wait a few seconds, then try again.";
      render();
      return;
    }
    if (sendCoop({ t: "squadStart", bots: actionTarget.dataset.bots === "1" })) {
      state.coopNotice = "Starting zombie survival...";
      render();
    }
    return;
  }

  if (action === "coop-back") {
    state.screen = "coop";
    render();
    return;
  }

  if (action === "coop-accept") {
    acceptCoopFriend(actionTarget.dataset.from || "");
    return;
  }

  if (action === "coop-decline") {
    declineCoopFriend(actionTarget.dataset.from || "");
    return;
  }

  if (action === "open-leaderboard") {
    state.screen = "leaderboard";
    state.leaderboard = null;
    loadLeaderboard();
    return;
  }

  if (action === "ranked-back") {
    state.screen = "ranked";
    render();
    return;
  }

  if (action === "battle-back") {
    if (isCoopScreen()) closeCoopSocket();
    state.screen = "battle";
    render();
    return;
  }

  if (action === "drop-map") {
    const { mode, map } = actionTarget.dataset;
    if (!BBMapGen.MAP_IDS.includes(map) || (mode !== "ranked" && mode !== "competitive" && mode !== "fun")) return;
    joinMatchQueue(mode, map);
    return;
  }

  if (action === "play-bots") {
    requestPlayBots();
    return;
  }

  if (action === "leave-queue") {
    clearPlayBotsWatchdog();
    pendingPlayBots = false;
    if (matchSocket && matchSocket.readyState === WebSocket.OPEN) matchSocket.send(JSON.stringify({ t: "leave" }));
    closeMatchSocket();
    const qMode = state.matchQueue && state.matchQueue.mode;
    state.screen = qMode === "ranked" ? "ranked-play" : qMode === "fun" ? "battle" : "competitive-play";
    state.matchQueue = null;
    render();
    return;
  }

  if (action === "hub-back") {
    closeCoopSocket();
    state.screen = "lobby";
    state.skinTryOn = "";
    render();
    return;
  }

  if (action === "sign-out") {
    closeCoopSocket();
    closeSocialSocket();
    state.screen = "sign-in";
    state.username = "";
    state.password = "";
    state.drops = 0;
    state.league = "";
    state.leagueName = "";
    state.leagueRank = 0;
    state.stars = 0;
    state.leaderboard = null;
    state.leaderboardError = "";
    state.draft = readLastCallsign();
    state.error = "";
    state.notice = "Signed out of the hub.";
    render();
  }
});

function submitCoopFriend(form) {
  const data = new FormData(form);
  sendCoopFriendRequest(String(data.get("username") || "").trim());
}

app.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || !event.target.matches(".chat-input")) return;
  event.preventDefault();
  submitChat(event.target.form);
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;

  event.preventDefault();
  if (form.dataset.form === "chat") {
    submitChat(form);
    return;
  }
  if (form.dataset.form === "coop-friend") {
    submitCoopFriend(form);
    return;
  }
  submitAuth(form);
});

state.draft = readLastCallsign();
state.avatar = readAvatar();
state.avatarYaw = readAvatarYaw();
render();
setInterval(tickLiveCount, 2200);
window.addEventListener("bb3d-ready", () => {
  if (state.screen === "gear" || state.screen === "lobby") render();
});
