import * as THREE from "./vendor/three.module.js";

// Every model is built with the tip / muzzle along +Z, the top along +Y,
// and the origin where the main hand grips it.

const PALETTE = {
  steel: [0xdde4ec, 120, 0xaab4c0],
  edge: [0xfafcff, 170, 0xffffff],
  darkSteel: [0x6b7280, 70, 0x666b73],
  gunmetal: [0x2c313a, 60, 0x4b5563],
  black: [0x18191d, 25, 0x2a2a2a],
  wood: [0x9c6334, 12, 0x2a1508],
  darkWood: [0x5e3a1d, 10, 0x1a0c04],
  lightWood: [0xd8ad72, 14, 0x2a1a08],
  leather: [0x4a2d18, 8, 0x140a04],
  wrap: [0x24180f, 6, 0x000000],
  gold: [0xe2ae2c, 90, 0xa07a1f],
  brass: [0xc28b2f, 70, 0x80591f],
  iron: [0x34343b, 30, 0x333333],
  red: [0xd92626, 40, 0x442222],
  darkRed: [0x8f1d1d, 30, 0x331111],
  orange: [0xf47a1a, 40, 0x442211],
  yellow: [0xf6c915, 40, 0x444411],
  green: [0x17a34a, 40, 0x114411],
  olive: [0x58613a, 20, 0x222211],
  tan: [0xb59a6a, 18, 0x221a10],
  blue: [0x2563eb, 40, 0x112244],
  white: [0xf2f2f3, 40, 0x555555],
  rubber: [0x1c1c1c, 10, 0x111111],
  straw: [0xd9b45a, 5, 0x000000],
  glass: [0xc6ecff, 140, 0xffffff, { transparent: true, opacity: 0.5 }],
  chicken: [0xfde047, 20, 0x222200]
};

const GLOW = {
  blue: [0xdff3ff, 0x3b82f6],
  purple: [0xfbe4ff, 0xc026d3],
  cyan: [0xcffafe, 0x06b6d4],
  yellow: [0xfef9c3, 0xeab308],
  red: [0xffe4e6, 0xef4444],
  green: [0xdcfce7, 0x22c55e]
};

function makeKit() {
  const root = new THREE.Group();
  const cache = new Map();
  const mat = (key) => {
    if (typeof key !== "string") return key;
    if (cache.has(key)) return cache.get(key);
    let material;
    if (key.startsWith("glow:")) {
      material = new THREE.MeshBasicMaterial({ color: GLOW[key.slice(5)][0] });
    } else if (key.startsWith("halo:")) {
      material = new THREE.MeshBasicMaterial({ color: GLOW[key.slice(5)][1], transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
    } else if (key.startsWith("liquid:")) {
      material = new THREE.MeshPhongMaterial({ color: Number(key.slice(7)), shininess: 80, specular: 0xffffff, transparent: true, opacity: 0.85 });
    } else {
      const [color, shininess, specular, extra] = PALETTE[key];
      material = new THREE.MeshPhongMaterial({ color, shininess, specular, ...extra });
    }
    cache.set(key, material);
    return material;
  };
  const place = (mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = root) => {
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    if (mesh.isMesh) mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const mesh = (geometry, m) => new THREE.Mesh(geometry, mat(m));
  return {
    root,
    group: (x, y, z, rx, ry, rz, parent) => place(new THREE.Group(), x, y, z, rx, ry, rz, parent),
    box: (w, h, d, m, x, y, z, rx, ry, rz, parent) => place(mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z, rx, ry, rz, parent),
    // cylinder along Z from z0 to z0 + len, radius r0 at the start and r1 at the end
    rod: (r0, r1, z0, len, m, x = 0, y = 0, seg = 10, parent) =>
      place(mesh(new THREE.CylinderGeometry(r1, r0, len, seg), m), x, y, z0 + len / 2, Math.PI / 2, 0, 0, parent),
    // cylinder along Y from y0 to y0 + len
    post: (r0, r1, y0, len, m, x = 0, z = 0, seg = 10, parent) =>
      place(mesh(new THREE.CylinderGeometry(r1, r0, len, seg), m), x, y0 + len / 2, z, 0, 0, 0, parent),
    // cylinder along X
    wheel: (r, thick, m, x, y, z, seg = 18, parent) =>
      place(mesh(new THREE.CylinderGeometry(r, r, thick, seg), m), x, y, z, 0, 0, Math.PI / 2, parent),
    ball: (r, m, x, y, z, sx = 1, sy = 1, sz = 1, parent) => {
      const ball = place(mesh(new THREE.SphereGeometry(r, 14, 10), m), x, y, z, 0, 0, 0, parent);
      ball.scale.set(sx, sy, sz);
      return ball;
    },
    bowl: (r, m, x, y, z, parent) => place(mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m), x, y, z, 0, 0, 0, parent),
    // cone pointing +Y unless rotated
    cone: (r, h, m, x, y, z, rx, ry, rz, seg = 8, parent) => place(mesh(new THREE.ConeGeometry(r, h, seg), m), x, y, z, rx, ry, rz, parent),
    torus: (R, t, m, x, y, z, rx, ry, rz, arc = Math.PI * 2, parent) =>
      place(mesh(new THREE.TorusGeometry(R, t, 6, 20, arc), m), x, y, z, rx, ry, rz, parent),
    tube: (points, r, m, parent) => place(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, r, 6, false), m), 0, 0, 0, 0, 0, 0, parent)
  };
}

const UP = -Math.PI / 2;
const FWD = Math.PI / 2;

// Flat blade: thickness on X, width on Y, cutting edge on -Y, from z0 forward.
function blade(k, { z0, len, width, thick = 0.022, m = "steel", curve = 0, segs = curve ? 6 : 1, fuller = false, tipLen = width * 1.25, taper = 1, edgeM = "edge", serrated = false }) {
  const bodyLen = Math.max(0.02, len - tipLen);
  const segLen = bodyLen / segs;
  let parent = k.group(0, 0, z0);
  let w = width;
  for (let i = 0; i < segs; i++) {
    w = width * (1 + (taper - 1) * ((i + 0.5) / segs));
    k.box(thick, w, segLen + 0.003, m, 0, 0, segLen / 2, 0, 0, 0, parent);
    k.box(thick * 0.55, w * 0.2, segLen + 0.003, edgeM, 0, -w * 0.42, segLen / 2, 0, 0, 0, parent);
    if (fuller) k.box(thick + 0.004, w * 0.14, segLen * 0.85, "darkSteel", 0, w * 0.06, segLen / 2, 0, 0, 0, parent);
    if (serrated) {
      const teeth = Math.max(2, Math.round(segLen / 0.03));
      for (let t = 0; t < teeth; t++) k.cone(0.008, 0.016, "darkSteel", 0, -w / 2 - 0.006, (t + 0.5) * (segLen / teeth), Math.PI, 0, 0, 4, parent);
    }
    parent = k.group(0, 0, segLen, -curve / segs, 0, 0, parent);
  }
  const tip = k.cone(w / 2, tipLen, m, 0, 0, tipLen / 2, FWD, 0, 0, 4, parent);
  tip.scale.x = Math.min(1, (thick * 1.4) / w);
  return parent;
}

function wrappedGrip(k, z0, len, r = 0.032, base = "wrap", band = "leather") {
  k.rod(r, r * 0.95, z0, len, base);
  const bands = Math.max(2, Math.round(len / 0.055));
  for (let i = 0; i < bands; i++) k.rod(r + 0.005, r + 0.005, z0 + (i + 0.5) * (len / bands) - 0.007, 0.014, band, 0, 0, 8);
}

function sword(k, { len, width, grip = 0.22, guard = "cross", guardW = width * 2.8, guardM = "gold", gripM = "wrap", bandM = "leather", bladeM = "steel", curve = 0, fuller = !curve, taper = 1, tipLen }) {
  const back = grip * 0.55;
  wrappedGrip(k, -back, grip, 0.03, gripM, bandM);
  k.ball(0.042, guardM, 0, 0, -back - 0.03, 1, 1, 0.8);
  const gz = grip - back;
  if (guard === "cross") {
    k.box(0.055, guardW, 0.045, guardM, 0, 0, gz);
    k.ball(0.028, guardM, 0, guardW / 2, gz);
    k.ball(0.028, guardM, 0, -guardW / 2, gz);
  } else if (guard === "angled") {
    [-1, 1].forEach((s) => k.box(0.05, guardW / 2, 0.045, guardM, 0, (s * guardW) / 4, gz + 0.03, s * -0.35));
    k.box(0.06, 0.08, 0.06, guardM, 0, 0, gz);
  } else if (guard === "tsuba") {
    k.rod(0.07, 0.07, gz - 0.012, 0.024, guardM, 0, 0, 16);
    k.box(0.03, width * 1.1, 0.05, "gold", 0, 0, gz + 0.035);
  } else if (guard === "basket") {
    k.box(0.05, guardW, 0.045, guardM, 0, 0, gz);
    k.torus(0.1, 0.01, guardM, 0, -0.1, gz - 0.07, 0, FWD, 0, Math.PI);
  } else if (guard === "knuckle") {
    k.box(0.05, guardW, 0.04, guardM, 0, 0, gz);
    k.tube([new THREE.Vector3(0, -guardW / 2, gz), new THREE.Vector3(0, -0.1, gz - 0.08), new THREE.Vector3(0, -0.08, -back)], 0.009, guardM);
  } else if (guard === "bolster") {
    k.box(0.05, width * 1.05, 0.03, guardM, 0, -0.005, gz);
  }
  blade(k, { z0: gz + 0.02, len, width, m: bladeM, curve, fuller, taper, tipLen });
}

function knife(k, { len, width, handle = 0.13, handleM = "black", bladeM = "steel", rivets = true, curve = 0, taper = 0.8, serrated = false, guardM }) {
  k.box(0.034, 0.045, handle, handleM, 0, 0, -handle / 2 + 0.03);
  if (rivets) [0.25, 0.65].forEach((f) => k.wheel(0.008, 0.038, "darkSteel", 0, 0, -handle / 2 + 0.03 - handle / 2 + handle * f));
  if (guardM) k.box(0.04, width * 1.4, 0.025, guardM, 0, 0, 0.035);
  blade(k, { z0: 0.04, len, width, thick: 0.014, m: bladeM, curve, taper, serrated, tipLen: width * 1.1 });
}

function shaft(k, z0, len, m = "wood", r = 0.028) {
  k.rod(r, r * 0.92, z0, len, m);
}

function axeHead(k, z, size, { double = false, m = "darkSteel", spike = false, spikeM = m } = {}) {
  k.box(0.075, 0.11, 0.12, m, 0, 0, z);
  const side = (s) => {
    k.box(0.04, size * 0.55, 0.09, m, 0, s * size * 0.34, z);
    k.box(0.034, size * 0.32, size * 0.8, m, 0, s * size * 0.68, z);
    k.box(0.02, 0.035, size * 0.9, "edge", 0, s * size * 0.85, z);
  };
  side(-1);
  if (double) side(1);
  if (spike) k.cone(0.035, 0.2, spikeM, 0, 0.15, z, 0, 0, 0, 6);
}

function hammerHead(k, z, { w = 0.1, len = 0.3, m = "iron", spike = false } = {}) {
  if (spike) {
    k.box(w, len * 0.5, w, m, 0, -len * 0.25, z);
    k.box(w * 1.15, 0.03, w * 1.15, "darkSteel", 0, -len * 0.5, z);
    k.cone(w * 0.45, len * 0.55, m, 0, len * 0.27, z, 0, 0, 0, 4);
  } else {
    k.box(w, len, w, m, 0, 0, z);
    [-1, 1].forEach((s) => k.box(w * 1.12, 0.03, w * 1.12, "darkSteel", 0, (s * len) / 2, z));
  }
  k.cone(0.03, 0.08, m, 0, 0, z + w / 2 + 0.03, FWD, 0, 0, 4);
}

function pistolFrame(k, { slideM = "gunmetal", frameM = "black", gripM = frameM, len = 0.26 }) {
  k.box(0.055, 0.16, 0.075, gripM, 0, -0.07, -0.015, 0.22);
  k.box(0.056, 0.055, len * 0.85, frameM, 0, 0.015, len * 0.3);
  k.box(0.06, 0.06, len, slideM, 0, 0.072, len * 0.32);
  for (let i = 0; i < 4; i++) k.box(0.062, 0.045, 0.006, "black", 0, 0.072, -len * 0.12 + i * 0.016);
  k.rod(0.016, 0.016, len * 0.8, 0.02, "black", 0, 0.07);
  k.box(0.01, 0.018, 0.012, "black", 0, 0.108, len * 0.75);
  k.box(0.03, 0.016, 0.012, "black", 0, 0.108, -len * 0.15);
  k.torus(0.028, 0.006, frameM, 0, -0.022, 0.05, 0, FWD, 0);
  k.box(0.008, 0.03, 0.008, "darkSteel", 0, -0.015, 0.045, 0.3);
}

function stockAndGrip(k, { stockM = "black", gripM = "black", stockLen = 0.28, drop = 0.02 }) {
  k.box(0.05, 0.13, 0.08, gripM, 0, -0.07, 0, 0.3);
  k.box(0.055, 0.1, stockLen, stockM, 0, 0.03 - drop, -stockLen / 2 - 0.06, -0.08);
  k.box(0.06, 0.13, 0.025, "rubber", 0, 0.02 - drop * 2, -stockLen - 0.07, -0.08);
}

function rifle(k, { furniture = "black", body = "gunmetal", barrel = 0.36, mag = "curved", sight = "iron", length = 0.42 }) {
  stockAndGrip(k, { stockM: furniture, gripM: furniture });
  k.box(0.065, 0.1, length, body, 0, 0.05, length / 2 - 0.04);
  k.box(0.07, 0.085, 0.26, furniture, 0, 0.045, length + 0.09);
  for (let i = 0; i < 5; i++) k.box(0.074, 0.012, 0.025, "black", 0, 0.092, length - 0.02 + i * 0.045);
  k.rod(0.015, 0.015, length + 0.2, barrel, "black", 0, 0.06);
  k.rod(0.022, 0.022, length + 0.2 + barrel - 0.05, 0.06, "darkSteel", 0, 0.06, 8);
  k.box(0.012, 0.05, 0.012, "black", 0, 0.105, length + 0.18);
  if (mag === "curved") {
    k.box(0.04, 0.1, 0.07, "black", 0, -0.04, 0.16, 0.15);
    k.box(0.04, 0.1, 0.07, "black", 0, -0.12, 0.19, 0.4);
  } else if (mag === "straight") {
    k.box(0.04, 0.16, 0.06, "black", 0, -0.07, 0.15, 0.1);
  } else if (mag === "drum") {
    k.wheel(0.08, 0.06, "black", 0, -0.08, 0.16);
  }
  if (sight === "iron") {
    k.box(0.04, 0.035, 0.12, body, 0, 0.115, 0.06);
  } else if (sight === "red") {
    k.box(0.05, 0.05, 0.08, "black", 0, 0.125, 0.08);
    k.box(0.035, 0.03, 0.004, "glow:red", 0, 0.13, 0.121);
  }
}

function pole(k, { back, front, m = "wood", r = 0.026, caps = null }) {
  k.rod(r, r, -back, back + front, m);
  if (caps) {
    k.rod(r + 0.006, r + 0.006, -back - 0.01, 0.06, caps);
  }
}

function gripWrap(k, z0, len, r = 0.03, m = "leather") {
  const n = Math.max(2, Math.round(len / 0.04));
  for (let i = 0; i < n; i++) k.rod(r + 0.004, r + 0.004, z0 + i * (len / n), len / n - 0.008, m, 0, 0, 8);
}

const BUILDERS = {
  // ---------- swords ----------
  "Katana": (k) => {
    sword(k, { len: 0.95, width: 0.05, grip: 0.34, guard: "tsuba", guardM: "black", gripM: "white", bandM: "black", curve: 0.18, tipLen: 0.07 });
    return "heavy";
  },
  "Longsword": (k) => { sword(k, { len: 0.95, width: 0.065, grip: 0.3, guardW: 0.24, guardM: "darkSteel" }); return "heavy"; },
  "Greatsword": (k) => { sword(k, { len: 1.35, width: 0.095, grip: 0.42, guardW: 0.36, guardM: "darkSteel", taper: 0.85 }); return "heavy"; },
  "Claymore": (k) => { sword(k, { len: 1.25, width: 0.08, grip: 0.4, guard: "angled", guardW: 0.42, guardM: "darkSteel", gripM: "darkWood" }); return "heavy"; },
  "Rapier": (k) => { sword(k, { len: 0.95, width: 0.025, grip: 0.16, guard: "basket", guardW: 0.2, guardM: "gold", fuller: false, tipLen: 0.06 }); return "one"; },
  "Cutlass": (k) => { sword(k, { len: 0.62, width: 0.06, grip: 0.15, guard: "basket", guardM: "brass", curve: 0.25, taper: 1.2 }); return "one"; },
  "Scimitar": (k) => { sword(k, { len: 0.72, width: 0.06, grip: 0.16, guardM: "gold", curve: 0.45, taper: 1.45, tipLen: 0.1 }); return "one"; },
  "Sabre": (k) => { sword(k, { len: 0.78, width: 0.04, grip: 0.16, guard: "knuckle", guardM: "brass", curve: 0.16 }); return "one"; },
  "Dagger": (k) => { sword(k, { len: 0.3, width: 0.05, grip: 0.12, guardW: 0.13, guardM: "darkSteel", tipLen: 0.07 }); return "one"; },
  "Laser Sword": (k) => {
    k.rod(0.036, 0.036, -0.16, 0.3, "darkSteel", 0, 0, 14);
    gripWrap(k, -0.12, 0.16, 0.034, "black");
    k.rod(0.046, 0.04, 0.12, 0.06, "steel", 0, 0, 14);
    k.box(0.02, 0.02, 0.03, "red", 0, 0.04, 0.02);
    k.rod(0.026, 0.026, 0.17, 1.05, "glow:blue", 0, 0, 12);
    k.rod(0.05, 0.05, 0.17, 1.08, "halo:blue", 0, 0, 12);
    k.ball(0.026, "glow:blue", 0, 0, 1.22);
    return "heavy";
  },
  "Plasma Blade": (k) => {
    k.rod(0.034, 0.034, -0.12, 0.22, "gunmetal", 0, 0, 12);
    gripWrap(k, -0.1, 0.13, 0.032, "darkRed");
    k.box(0.06, 0.14, 0.04, "gold", 0, 0, 0.1);
    const tip = blade(k, { z0: 0.12, len: 0.82, width: 0.07, thick: 0.03, m: "glow:purple", edgeM: "glow:purple", taper: 0.8, tipLen: 0.14 });
    k.box(0.07, 0.12, 0.8, "halo:purple", 0, 0, 0.52);
    k.ball(0.02, "glow:purple", 0, 0, 0.05, 1, 1, 1, tip);
    return "one";
  },

  // ---------- knives ----------
  "Kitchen Knife": (k) => { knife(k, { len: 0.24, width: 0.055, taper: 0.55 }); return "one"; },
  "Steak Knife": (k) => { knife(k, { len: 0.17, width: 0.025, handleM: "darkWood", serrated: true }); return "one"; },
  "Bread Knife": (k) => { knife(k, { len: 0.26, width: 0.03, taper: 1, handleM: "lightWood", serrated: true }); return "one"; },
  "Paring Knife": (k) => { knife(k, { len: 0.1, width: 0.022, handle: 0.1, handleM: "black" }); return "one"; },
  "Butter Knife": (k) => {
    k.box(0.02, 0.03, 0.14, "steel", 0, 0, -0.04);
    k.box(0.01, 0.026, 0.13, "steel", 0, -0.002, 0.1);
    k.wheel(0.013, 0.01, "steel", 0, -0.002, 0.165);
    return "one";
  },
  "Sushi Knife": (k) => {
    k.rod(0.022, 0.024, -0.1, 0.15, "lightWood", 0, 0, 8);
    k.rod(0.026, 0.026, 0.04, 0.02, "black", 0, 0, 8);
    blade(k, { z0: 0.06, len: 0.3, width: 0.032, thick: 0.012, taper: 0.9 });
    return "one";
  },
  "Bowie Knife": (k) => {
    for (let i = 0; i < 5; i++) k.rod(0.026, 0.026, -0.1 + i * 0.025, 0.022, i % 2 ? "darkWood" : "leather", 0, 0, 10);
    k.ball(0.03, "brass", 0, 0, -0.11);
    k.box(0.03, 0.1, 0.022, "brass", 0, 0, 0.035);
    blade(k, { z0: 0.045, len: 0.26, width: 0.055, thick: 0.016, taper: 0.9, fuller: true, tipLen: 0.08 });
    return "one";
  },
  "Kukri": (k) => {
    k.rod(0.026, 0.024, -0.1, 0.14, "darkWood", 0, 0, 10);
    k.rod(0.03, 0.03, 0.03, 0.02, "brass", 0, 0, 10);
    blade(k, { z0: 0.05, len: 0.32, width: 0.04, thick: 0.016, curve: -0.6, taper: 1.7, tipLen: 0.07 });
    return "one";
  },
  "Machete": (k) => {
    k.box(0.036, 0.05, 0.15, "black", 0, 0, -0.04);
    [0.0, -0.06].forEach((z) => k.wheel(0.008, 0.04, "darkSteel", 0, 0, z));
    blade(k, { z0: 0.04, len: 0.5, width: 0.06, thick: 0.014, taper: 1.25, tipLen: 0.08, m: "darkSteel" });
    return "one";
  },
  "Cleaver": (k) => {
    k.box(0.034, 0.045, 0.14, "darkWood", 0, 0, -0.04);
    [-0.07, -0.01].forEach((z) => k.wheel(0.008, 0.04, "steel", 0, 0, z));
    k.box(0.014, 0.15, 0.24, "steel", 0, -0.05, 0.15);
    k.box(0.01, 0.03, 0.24, "edge", 0, -0.12, 0.15);
    k.wheel(0.016, 0.02, "black", 0, -0.0, 0.23);
    return "one";
  },
  "Switchblade": (k) => { knife(k, { len: 0.16, width: 0.026, handle: 0.14, handleM: "black", guardM: "steel" }); k.box(0.04, 0.012, 0.016, "steel", 0, 0.025, -0.02); return "one"; },
  "Pocket Knife": (k) => {
    k.box(0.036, 0.042, 0.13, "red", 0, 0, -0.03);
    k.box(0.038, 0.012, 0.012, "white", 0, 0, -0.03);
    k.box(0.038, 0.004, 0.034, "white", 0, 0, -0.03);
    blade(k, { z0: 0.035, len: 0.13, width: 0.026, thick: 0.012 });
    return "one";
  },
  "Letter Opener": (k) => {
    k.rod(0.016, 0.02, -0.1, 0.13, "gold", 0, 0, 8);
    k.ball(0.024, "gold", 0, 0, -0.11);
    k.box(0.02, 0.06, 0.016, "gold", 0, 0, 0.035);
    blade(k, { z0: 0.04, len: 0.2, width: 0.022, thick: 0.008 });
    return "one";
  },
  "Box Cutter": (k) => {
    k.box(0.03, 0.04, 0.17, "yellow", 0, 0, 0.0);
    k.box(0.032, 0.02, 0.12, "black", 0, -0.012, -0.01);
    k.box(0.02, 0.014, 0.02, "black", 0, 0.025, 0.02);
    const tip = k.cone(0.016, 0.05, "edge", 0, -0.004, 0.11, FWD, 0, 0, 3);
    tip.scale.x = 0.3;
    return "one";
  },
  "Bayonet": (k) => {
    k.box(0.034, 0.04, 0.13, "darkWood", 0, 0, -0.04);
    k.box(0.036, 0.08, 0.025, "darkSteel", 0, 0, 0.035);
    k.torus(0.022, 0.006, "darkSteel", 0, 0.05, 0.035, 0, 0, 0);
    blade(k, { z0: 0.05, len: 0.3, width: 0.03, thick: 0.014, fuller: true, m: "darkSteel" });
    return "one";
  },
  "Throwing Knife": (k) => {
    k.box(0.016, 0.03, 0.1, "black", 0, 0, -0.03);
    k.torus(0.018, 0.005, "darkSteel", 0, 0, -0.095, 0, FWD, 0);
    blade(k, { z0: 0.02, len: 0.15, width: 0.03, thick: 0.01, m: "darkSteel", tipLen: 0.05 });
    return "gun";
  },
  "Sai": (k) => {
    wrappedGrip(k, -0.12, 0.13, 0.024, "black", "red");
    k.ball(0.028, "darkSteel", 0, 0, -0.13);
    k.rod(0.016, 0.006, 0.01, 0.4, "steel", 0, 0, 8);
    [-1, 1].forEach((s) => k.tube([
      new THREE.Vector3(0, 0, 0.02),
      new THREE.Vector3(0, s * 0.06, 0.03),
      new THREE.Vector3(0, s * 0.075, 0.08),
      new THREE.Vector3(0, s * 0.06, 0.13)
    ], 0.009, "steel"));
    return "one";
  },

  // ---------- axes ----------
  "Hatchet": (k) => { shaft(k, -0.12, 0.46, "wood", 0.024); axeHead(k, 0.29, 0.16); return "one"; },
  "Tomahawk": (k) => {
    shaft(k, -0.14, 0.56, "lightWood", 0.022);
    gripWrap(k, -0.12, 0.12, 0.022, "leather");
    axeHead(k, 0.36, 0.15, { spike: true });
    [0.05, 0.08].forEach((z) => k.box(0.012, 0.006, 0.06, "red", 0, -0.03, z, 0, 0, 0));
    return "one";
  },
  "Battle Axe": (k) => {
    shaft(k, -0.4, 1.2, "darkWood", 0.03);
    gripWrap(k, -0.3, 0.35, 0.03, "leather");
    axeHead(k, 0.7, 0.3, { double: true });
    k.cone(0.03, 0.12, "darkSteel", 0, 0, 0.86, FWD, 0, 0, 6);
    return "heavy";
  },
  "Fire Axe": (k) => {
    shaft(k, -0.35, 1.0, "yellow", 0.028);
    k.rod(0.032, 0.032, -0.35, 0.22, "black", 0, 0, 10);
    axeHead(k, 0.58, 0.26, { m: "red", spike: true, spikeM: "red" });
    return "heavy";
  },
  "Pickaxe": (k) => {
    shaft(k, -0.35, 1.0, "wood", 0.028);
    k.box(0.07, 0.1, 0.09, "darkSteel", 0, 0, 0.6);
    [-1, 1].forEach((s) => {
      k.cone(0.035, 0.34, "darkSteel", 0, s * 0.2, 0.57, s > 0 ? -0.3 : Math.PI + 0.3, 0, 0, 5);
    });
    return "heavy";
  },

  // ---------- blunt ----------
  "War Hammer": (k) => {
    shaft(k, -0.35, 0.95, "darkSteel", 0.024);
    gripWrap(k, -0.3, 0.3, 0.026, "leather");
    hammerHead(k, 0.56, { w: 0.11, len: 0.3, m: "iron", spike: true });
    return "heavy";
  },
  "Sledgehammer": (k) => {
    shaft(k, -0.4, 1.05, "lightWood", 0.028);
    k.rod(0.033, 0.033, -0.4, 0.2, "rubber", 0, 0, 10);
    hammerHead(k, 0.62, { w: 0.15, len: 0.34, m: "iron" });
    return "heavy";
  },
  "Mace": (k) => {
    shaft(k, -0.13, 0.55, "darkSteel", 0.022);
    gripWrap(k, -0.12, 0.17, 0.024, "leather");
    k.rod(0.045, 0.045, 0.32, 0.16, "iron", 0, 0, 10);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      k.box(0.014, 0.06, 0.14, "darkSteel", Math.sin(a) * 0.06, Math.cos(a) * 0.06, 0.4, 0, 0, -a);
    }
    k.cone(0.025, 0.06, "iron", 0, 0, 0.51, FWD, 0, 0, 6);
    return "one";
  },
  "Morning Star": (k) => {
    shaft(k, -0.14, 0.6, "darkWood", 0.024);
    gripWrap(k, -0.12, 0.16, 0.025, "leather");
    k.ball(0.09, "iron", 0, 0, 0.55);
    const n = 14;
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.39996;
      const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      const spike = k.cone(0.022, 0.08, "darkSteel", dir.x * 0.1, dir.y * 0.1, 0.55 + dir.z * 0.1, 0, 0, 0, 5);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
    return "one";
  },
  "Flail": (k) => {
    shaft(k, -0.13, 0.4, "darkWood", 0.024);
    gripWrap(k, -0.12, 0.16, 0.025, "leather");
    k.rod(0.03, 0.03, 0.26, 0.03, "darkSteel");
    for (let i = 0; i < 4; i++) k.torus(0.022, 0.006, "darkSteel", 0, -0.035 - i * 0.04, 0.3 + i * 0.02, i % 2 ? 0 : FWD, i % 2 ? FWD : 0, 0);
    k.ball(0.07, "iron", 0, -0.24, 0.39);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.6, Math.sin(a) * 0.8).normalize();
      const spike = k.cone(0.016, 0.06, "darkSteel", dir.x * 0.075, -0.24 + dir.y * 0.075, 0.39 + dir.z * 0.075, 0, 0, 0, 5);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
    return "one";
  },
  "Rolling Pin": (k) => {
    k.rod(0.018, 0.022, -0.08, 0.1, "lightWood", 0, 0, 10);
    k.rod(0.05, 0.05, 0.03, 0.32, "lightWood", 0, 0, 16);
    k.rod(0.022, 0.018, 0.35, 0.1, "lightWood", 0, 0, 10);
    k.ball(0.022, "lightWood", 0, 0, -0.08);
    k.ball(0.022, "lightWood", 0, 0, 0.45);
    return "one";
  },
  "Baseball Bat": (k) => {
    k.rod(0.026, 0.06, -0.3, 1.05, "lightWood", 0, 0, 14);
    k.rod(0.04, 0.04, -0.33, 0.03, "lightWood", 0, 0, 14);
    k.rod(0.03, 0.032, -0.3, 0.3, "black", 0, 0, 12);
    k.ball(0.06, "lightWood", 0, 0, 0.75, 1, 1, 0.4);
    return "heavy";
  },
  "Nail Bat": (k) => {
    k.rod(0.026, 0.062, -0.3, 1.05, "wood", 0, 0, 14);
    k.rod(0.04, 0.04, -0.33, 0.03, "wood", 0, 0, 14);
    k.rod(0.03, 0.032, -0.3, 0.28, "rubber", 0, 0, 12);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.2;
      const z = 0.42 + (i % 7) * 0.05;
      const r = 0.055;
      const nail = k.post(0.004, 0.004, 0, 0.07, "darkSteel", 0, 0, 5);
      nail.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
      nail.rotation.set(0, 0, a - Math.PI / 2);
    }
    k.ball(0.062, "wood", 0, 0, 0.75, 1, 1, 0.4);
    return "heavy";
  },
  "Cricket Bat": (k) => {
    k.rod(0.026, 0.026, -0.3, 0.42, "rubber", 0, 0, 10);
    k.box(0.05, 0.11, 0.6, "lightWood", 0, 0, 0.42);
    k.box(0.056, 0.05, 0.5, "lightWood", 0, 0.03, 0.42);
    k.box(0.052, 0.112, 0.02, "red", 0, 0, 0.2);
    return "heavy";
  },
  "Golf Club": (k) => {
    k.rod(0.026, 0.02, -0.3, 0.26, "rubber", 0, 0, 10);
    k.rod(0.012, 0.01, -0.04, 0.9, "steel", 0, 0, 8);
    k.box(0.06, 0.1, 0.04, "darkSteel", 0, -0.04, 0.88, 0.2);
    k.box(0.062, 0.05, 0.02, "steel", 0, -0.08, 0.9, 0.2);
    return "heavy";
  },
  "Hockey Stick": (k) => {
    k.box(0.03, 0.045, 1.0, "black", 0, 0, 0.2);
    k.box(0.034, 0.05, 0.16, "white", 0, 0, -0.22);
    k.box(0.02, 0.08, 0.28, "white", 0, -0.08, 0.74, 0.9);
    k.box(0.022, 0.03, 0.14, "black", 0, -0.13, 0.82, 0.9);
    return "heavy";
  },
  "Tennis Racket": (k) => {
    k.box(0.03, 0.035, 0.18, "white", 0, 0, -0.02);
    k.box(0.034, 0.038, 0.02, "blue", 0, 0, 0.07);
    [-1, 1].forEach((s) => k.box(0.016, 0.016, 0.13, "blue", 0, s * 0.035, 0.13, s * -0.4));
    const head = k.torus(0.12, 0.012, "blue", 0, 0, 0.32, 0, FWD, 0);
    head.scale.set(1.3, 1, 1);
    for (let i = -3; i <= 3; i++) {
      k.box(0.003, 0.003, 0.3, "white", 0, i * 0.03, 0.32);
      k.box(0.003, 0.22, 0.003, "white", 0, 0, 0.32 + i * 0.04);
    }
    return "one";
  },
  "Frying Pan": (k) => {
    k.rod(0.016, 0.02, -0.08, 0.26, "black", 0, 0, 8);
    k.rod(0.012, 0.012, 0.17, 0.06, "darkSteel", 0, 0.01, 6);
    k.post(0.14, 0.15, -0.02, 0.035, "darkSteel", 0, 0.37, 20);
    k.post(0.13, 0.13, 0.0, 0.017, "black", 0, 0.37, 20);
    k.torus(0.15, 0.01, "darkSteel", 0, 0.015, 0.37, FWD, 0, 0);
    return "one";
  },
  "Cast Iron Skillet": (k) => {
    k.box(0.04, 0.03, 0.26, "iron", 0, 0, 0.03);
    k.wheel(0.012, 0.042, "black", 0, 0, -0.08);
    k.post(0.15, 0.16, -0.025, 0.045, "iron", 0, 0.37, 20);
    k.post(0.14, 0.14, 0.0, 0.025, "black", 0, 0.37, 20);
    k.torus(0.16, 0.014, "iron", 0, 0.02, 0.37, FWD, 0, 0);
    k.box(0.06, 0.02, 0.04, "iron", 0, 0.012, 0.55);
    return "one";
  },
  "Crowbar": (k) => {
    k.rod(0.016, 0.016, -0.18, 0.7, "red", 0, 0, 6);
    k.tube([
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Vector3(0, 0.03, 0.57),
      new THREE.Vector3(0, 0.1, 0.6),
      new THREE.Vector3(0, 0.15, 0.56),
      new THREE.Vector3(0, 0.14, 0.51)
    ], 0.016, "red");
    k.box(0.03, 0.01, 0.04, "darkSteel", 0, 0.03, -0.2, 0.3);
    return "one";
  },
  "Pipe Wrench": (k) => {
    k.box(0.036, 0.05, 0.4, "red", 0, 0, 0.1);
    k.torus(0.016, 0.006, "darkSteel", 0, 0, -0.11, 0, FWD, 0);
    k.box(0.05, 0.12, 0.05, "darkSteel", 0, 0.02, 0.32);
    k.box(0.05, 0.03, 0.12, "darkSteel", 0, 0.07, 0.38);
    k.box(0.05, 0.03, 0.1, "darkSteel", 0, -0.02, 0.39);
    k.wheel(0.03, 0.04, "steel", 0, 0.03, 0.3);
    return "one";
  },
  "Bo Staff": (k) => {
    pole(k, { back: 0.85, front: 0.85, m: "darkWood", r: 0.024 });
    [-0.86, 0.8].forEach((z) => k.rod(0.03, 0.03, z, 0.06, "brass", 0, 0, 10));
    gripWrap(k, -0.2, 0.4, 0.024, "red");
    return "pole";
  },
  "Nunchaku": (k) => {
    k.rod(0.022, 0.022, -0.1, 0.3, "black", 0, 0, 8);
    k.rod(0.024, 0.024, 0.18, 0.02, "steel", 0, 0, 8);
    for (let i = 0; i < 3; i++) k.torus(0.012, 0.004, "steel", 0, -i * 0.02, 0.21 + i * 0.012, i % 2 ? 0 : FWD, i % 2 ? FWD : 0, 0);
    const swing = k.group(0, -0.06, 0.24, 2.2);
    k.rod(0.022, 0.022, 0, 0.3, "black", 0, 0, 8, swing);
    k.rod(0.024, 0.024, 0, 0.02, "steel", 0, 0, 8, swing);
    return "one";
  },
  "Stun Baton": (k) => {
    k.rod(0.026, 0.024, -0.14, 0.58, "black", 0, 0, 10);
    for (let i = 0; i < 5; i++) k.rod(0.03, 0.03, -0.12 + i * 0.03, 0.014, "rubber", 0, 0, 10);
    k.rod(0.03, 0.03, 0.05, 0.02, "yellow", 0, 0, 10);
    k.rod(0.03, 0.03, 0.44, 0.04, "darkSteel", 0, 0, 10);
    [-1, 1].forEach((s) => k.rod(0.006, 0.006, 0.47, 0.05, "steel", 0, s * 0.015, 5));
    k.ball(0.035, "halo:yellow", 0, 0, 0.53);
    k.ball(0.014, "glow:yellow", 0, 0, 0.52);
    return "one";
  },
  "Walking Stick": (k) => {
    k.rod(0.018, 0.016, -0.06, 0.95, "darkWood", 0, 0, 8);
    k.rod(0.02, 0.02, 0.86, 0.04, "brass", 0, 0, 8);
    k.torus(0.07, 0.018, "darkWood", 0, 0.07, -0.06, 0, FWD, UP, Math.PI);
    return "one";
  },
  "Umbrella": (k) => {
    k.rod(0.012, 0.012, -0.06, 0.95, "black", 0, 0, 8);
    k.rod(0.03, 0.065, 0.12, 0.3, "blue", 0, 0, 8);
    k.rod(0.065, 0.02, 0.42, 0.42, "blue", 0, 0, 8);
    k.rod(0.004, 0.004, 0.84, 0.1, "steel", 0, 0, 5);
    k.rod(0.06, 0.06, 0.36, 0.015, "white", 0, 0, 8);
    k.torus(0.06, 0.016, "black", 0, 0.06, -0.06, 0, FWD, UP, Math.PI);
    return "one";
  },

  // ---------- polearms ----------
  "Spear": (k) => {
    pole(k, { back: 0.8, front: 1.0, m: "wood", r: 0.022 });
    k.rod(0.026, 0.02, 0.98, 0.08, "darkSteel", 0, 0, 8);
    blade(k, { z0: 1.06, len: 0.3, width: 0.08, thick: 0.02, taper: 1, tipLen: 0.16, fuller: true });
    [0.9, 0.93].forEach((z) => k.rod(0.026, 0.026, z, 0.012, "red", 0, 0, 8));
    return "pole";
  },
  "Halberd": (k) => {
    pole(k, { back: 0.8, front: 1.1, m: "darkWood", r: 0.024 });
    k.rod(0.028, 0.028, 0.85, 0.3, "darkSteel", 0, 0, 8);
    blade(k, { z0: 1.12, len: 0.32, width: 0.05, thick: 0.02, tipLen: 0.14 });
    k.box(0.022, 0.22, 0.24, "darkSteel", 0, -0.12, 0.98);
    k.box(0.016, 0.03, 0.28, "edge", 0, -0.23, 0.98);
    k.cone(0.03, 0.14, "darkSteel", 0, 0.08, 1.0, -0.5, 0, 0, 4);
    return "pole";
  },
  "Trident": (k) => {
    pole(k, { back: 0.8, front: 1.0, m: "darkSteel", r: 0.02 });
    k.box(0.26, 0.03, 0.04, "gold", 0, 0, 1.0);
    [-0.12, 0, 0.12].forEach((x) => {
      k.rod(0.012, 0.01, 1.0, x ? 0.26 : 0.32, "gold", x, 0, 6);
      k.cone(0.026, 0.07, "gold", x, 0, 1.0 + (x ? 0.29 : 0.35), FWD, 0, 0, 4);
    });
    return "pole";
  },
  "Pitchfork": (k) => {
    pole(k, { back: 0.7, front: 0.95, m: "lightWood", r: 0.022 });
    k.rod(0.026, 0.02, 0.92, 0.08, "darkSteel", 0, 0, 8);
    k.box(0.2, 0.02, 0.025, "darkSteel", 0, 0, 1.0);
    [-0.09, 0, 0.09].forEach((x) => k.rod(0.008, 0.004, 1.0, 0.32, "darkSteel", x, 0, 5));
    return "pole";
  },
  "Rake": (k) => {
    pole(k, { back: 0.7, front: 1.0, m: "green", r: 0.02 });
    k.box(0.34, 0.03, 0.03, "darkSteel", 0, 0, 1.01);
    for (let i = 0; i < 9; i++) k.box(0.008, 0.08, 0.008, "darkSteel", -0.16 + i * 0.04, -0.05, 1.01);
    return "pole";
  },
  "Garden Hoe": (k) => {
    pole(k, { back: 0.7, front: 1.0, m: "lightWood", r: 0.02 });
    k.rod(0.008, 0.008, 0.98, 0.06, "darkSteel", 0, -0.02, 5);
    k.box(0.16, 0.12, 0.012, "darkSteel", 0, -0.08, 1.04);
    k.box(0.16, 0.012, 0.016, "edge", 0, -0.14, 1.04);
    return "pole";
  },
  "Shovel": (k) => {
    pole(k, { back: 0.7, front: 0.75, m: "wood", r: 0.022 });
    k.torus(0.05, 0.012, "black", 0, 0, -0.76, 0, FWD, 0);
    k.rod(0.03, 0.026, 0.68, 0.12, "darkSteel", 0, 0, 8);
    k.box(0.2, 0.02, 0.24, "darkSteel", 0, 0, 0.9);
    const tip = k.cone(0.1, 0.1, "darkSteel", 0, 0, 1.07, FWD, 0, 0, 4);
    tip.scale.z = 0.12;
    tip.rotation.z = Math.PI / 4;
    return "pole";
  },
  "Broom": (k) => {
    pole(k, { back: 0.7, front: 0.95, m: "red", r: 0.018 });
    k.rod(0.05, 0.1, 0.92, 0.32, "straw", 0, 0, 10);
    [0.97, 1.02].forEach((z) => k.rod(0.062, 0.066, z, 0.015, "red", 0, 0, 10));
    return "pole";
  },

  // ---------- guns ----------
  "Pistol": (k) => { pistolFrame(k, {}); return "gun"; },
  "Revolver": (k) => {
    k.box(0.05, 0.15, 0.07, "darkWood", 0, -0.07, -0.03, 0.45);
    k.box(0.05, 0.07, 0.12, "steel", 0, 0.03, 0.02);
    k.rod(0.048, 0.048, 0.0, 0.09, "steel", 0, 0.04, 6);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      k.rod(0.01, 0.01, 0.0, 0.092, "black", Math.cos(a) * 0.03, 0.04 + Math.sin(a) * 0.03, 6);
    }
    k.rod(0.018, 0.018, 0.08, 0.26, "steel", 0, 0.055, 10);
    k.rod(0.012, 0.012, 0.08, 0.2, "steel", 0, 0.025, 8);
    k.box(0.01, 0.02, 0.01, "steel", 0, 0.08, 0.33);
    k.box(0.016, 0.03, 0.03, "steel", 0, 0.075, -0.04, -0.4);
    k.torus(0.026, 0.006, "steel", 0, -0.02, 0.03, 0, FWD, 0);
    return "gun";
  },
  "Energy Pistol": (k) => {
    k.box(0.055, 0.15, 0.07, "gunmetal", 0, -0.07, -0.015, 0.22);
    k.box(0.07, 0.085, 0.22, "white", 0, 0.05, 0.07);
    k.ball(0.045, "white", 0, 0.05, -0.04, 0.8, 0.95, 1);
    k.rod(0.03, 0.03, 0.17, 0.12, "white", 0, 0.05, 12);
    [0.2, 0.24, 0.28].forEach((z) => k.torus(0.034, 0.007, "glow:cyan", 0, 0.05, z, 0, 0, 0));
    k.rod(0.016, 0.016, 0.0, 0.2, "glow:cyan", 0, 0.095, 8);
    k.ball(0.024, "glow:cyan", 0, 0.05, 0.3);
    k.ball(0.045, "halo:cyan", 0, 0.05, 0.3);
    k.torus(0.028, 0.006, "gunmetal", 0, -0.02, 0.05, 0, FWD, 0);
    return "gun";
  },
  "BB Gun": (k) => {
    k.box(0.05, 0.11, 0.3, "wood", 0, -0.0, -0.2, -0.1);
    k.box(0.06, 0.07, 0.18, "gunmetal", 0, 0.04, 0.05);
    k.rod(0.015, 0.015, 0.1, 0.55, "gunmetal", 0, 0.06, 8);
    k.rod(0.013, 0.013, 0.12, 0.45, "gunmetal", 0, 0.035, 8);
    k.box(0.05, 0.04, 0.2, "wood", 0, 0.02, 0.32);
    k.torus(0.04, 0.008, "brass", 0, -0.04, 0.02, 0, FWD, 0);
    k.box(0.008, 0.06, 0.012, "brass", 0, -0.015, 0.06);
    k.box(0.01, 0.02, 0.01, "gunmetal", 0, 0.08, 0.62);
    return "gun2";
  },
  "SMG": (k) => {
    k.box(0.05, 0.12, 0.07, "black", 0, -0.07, 0.0, 0.25);
    k.box(0.065, 0.09, 0.3, "gunmetal", 0, 0.045, 0.1);
    k.rod(0.02, 0.02, 0.25, 0.12, "black", 0, 0.05, 10);
    k.rod(0.03, 0.03, 0.37, 0.12, "black", 0, 0.05, 12);
    k.box(0.04, 0.18, 0.05, "black", 0, -0.08, 0.15, 0.08);
    k.box(0.04, 0.1, 0.04, "black", 0, -0.04, 0.26, 0.2);
    [-1, 1].forEach((s) => k.box(0.008, 0.008, 0.22, "darkSteel", s * 0.025, 0.04, -0.14));
    k.box(0.06, 0.08, 0.012, "darkSteel", 0, 0.03, -0.25);
    k.box(0.03, 0.025, 0.08, "black", 0, 0.1, 0.06);
    return "gun2";
  },
  "Shotgun": (k) => {
    stockAndGrip(k, { stockM: "wood", gripM: "wood", stockLen: 0.3, drop: 0.04 });
    k.box(0.06, 0.09, 0.2, "gunmetal", 0, 0.045, 0.06);
    k.rod(0.022, 0.022, 0.15, 0.62, "gunmetal", 0, 0.07, 12);
    k.rod(0.018, 0.018, 0.15, 0.52, "gunmetal", 0, 0.03, 10);
    k.box(0.06, 0.06, 0.18, "wood", 0, 0.03, 0.44);
    for (let i = 0; i < 4; i++) k.box(0.064, 0.064, 0.008, "darkWood", 0, 0.03, 0.37 + i * 0.045);
    k.ball(0.012, "brass", 0, 0.098, 0.75);
    k.rod(0.024, 0.024, 0.74, 0.03, "black", 0, 0.07, 12);
    return "gun2";
  },
  "Assault Rifle": (k) => {
    rifle(k, { furniture: "wood", body: "gunmetal", mag: "curved", sight: "iron" });
    return "gun2";
  },
  "Automatic Rifle": (k) => {
    rifle(k, { furniture: "tan", body: "black", mag: "drum", sight: "red", barrel: 0.4 });
    return "gun2";
  },
  "Sniper Rifle": (k) => {
    stockAndGrip(k, { stockM: "olive", gripM: "olive", stockLen: 0.34 });
    k.box(0.05, 0.04, 0.14, "olive", 0, 0.1, -0.22);
    k.box(0.065, 0.09, 0.42, "olive", 0, 0.04, 0.16);
    k.rod(0.018, 0.014, 0.36, 0.72, "black", 0, 0.06, 10);
    k.rod(0.026, 0.026, 1.02, 0.07, "black", 0, 0.06, 10);
    k.rod(0.032, 0.032, -0.06, 0.38, "black", 0, 0.15, 14);
    k.rod(0.04, 0.032, -0.1, 0.06, "black", 0, 0.15, 14);
    k.rod(0.032, 0.044, 0.3, 0.08, "black", 0, 0.15, 14);
    k.rod(0.04, 0.04, 0.381, 0.004, "glass", 0, 0.15, 14);
    [0.02, 0.22].forEach((z) => k.box(0.03, 0.05, 0.03, "black", 0, 0.105, z));
    k.box(0.006, 0.006, 0.02, "steel", 0.04, 0.05, -0.02);
    k.ball(0.014, "steel", 0.05, 0.05, -0.02);
    k.box(0.07, 0.1, 0.06, "black", 0, -0.08, 0.18, 0.1);
    [-1, 1].forEach((s) => k.box(0.012, 0.012, 0.22, "black", s * 0.02, 0.01, 0.62, 0, s * 0.05, 0));
    return "gun2";
  },

  // ---------- bows & thrown ----------
  "Crossbow": (k) => {
    k.box(0.05, 0.07, 0.7, "wood", 0, 0.0, 0.08);
    k.box(0.05, 0.12, 0.08, "wood", 0, -0.05, -0.02, 0.3);
    [-1, 1].forEach((s) => {
      k.box(0.3, 0.03, 0.035, "darkWood", s * 0.15, 0.03, 0.4 - 0.03, 0, s * 0.35, 0);
      k.box(0.004, 0.004, 0.24, "white", s * 0.13, 0.04, 0.27, 0, s * -0.85, 0);
    });
    k.box(0.06, 0.04, 0.05, "darkSteel", 0, 0.04, 0.4);
    k.rod(0.008, 0.008, 0.18, 0.32, "darkWood", 0, 0.05, 6);
    k.cone(0.016, 0.05, "darkSteel", 0, 0.05, 0.52, FWD, 0, 0, 4);
    k.torus(0.04, 0.007, "darkSteel", 0, -0.0, 0.47, FWD, 0, 0);
    return "gun2";
  },
  "Longbow": (k) => {
    const R = 0.62;
    k.torus(R, 0.022, "wood", 0, 0, -R, 0, UP, -1.0, 2.0);
    k.post(0.03, 0.03, -0.06, 0.12, "leather", 0, 0, 8);
    const sz = -R + R * Math.cos(1.0);
    const sy = R * Math.sin(1.0);
    k.box(0.005, sy * 2, 0.005, "white", 0, 0, sz);
    k.rod(0.007, 0.007, sz, 0.42 - sz, "lightWood", 0, 0.02, 6);
    k.cone(0.016, 0.05, "darkSteel", 0, 0.02, 0.44, FWD, 0, 0, 4);
    [-1, 1].forEach((s) => k.box(0.002, 0.03, 0.06, "red", 0, 0.02 + s * 0.012, sz + 0.05, s * 0.4));
    return "gun2";
  },
  "Slingshot": (k) => {
    k.post(0.02, 0.022, -0.14, 0.14, "wood", 0, 0, 8);
    [-1, 1].forEach((s) => {
      const arm = k.post(0.016, 0.02, 0, 0.12, "wood", 0, 0, 8);
      arm.position.set(0, 0.05, 0);
      arm.rotation.set(0, 0, s * -0.45);
      arm.position.x = s * 0.03;
    });
    k.box(0.12, 0.006, 0.006, "red", 0, 0.1, -0.03);
    k.box(0.03, 0.02, 0.02, "leather", 0, 0.1, -0.05);
    return "gun";
  },
  "Blowdart": (k) => {
    k.rod(0.016, 0.016, -0.12, 0.8, "lightWood", 0, 0, 8);
    [-0.04, 0.2, 0.45].forEach((z) => k.rod(0.019, 0.019, z, 0.016, "darkWood", 0, 0, 8));
    k.rod(0.022, 0.018, -0.14, 0.04, "darkWood", 0, 0, 8);
    return "gun";
  },
  "Shuriken": (k) => {
    k.post(0.03, 0.03, -0.006, 0.012, "darkSteel", 0, 0, 12);
    k.post(0.008, 0.008, -0.008, 0.016, "black", 0, 0, 8);
    for (let i = 0; i < 4; i++) {
      const arm = k.group(0, 0, 0, 0, (i * Math.PI) / 2, 0);
      const point = k.cone(0.03, 0.09, "steel", 0, 0, 0.065, FWD, 0, 0, 4, arm);
      point.scale.z = 0.18;
    }
    return "gun";
  },

  // ---------- kitchen & odd ----------
  "Fork": (k) => {
    k.box(0.016, 0.028, 0.14, "white", 0, 0, -0.03);
    k.box(0.008, 0.016, 0.08, "steel", 0, 0, 0.08);
    k.box(0.008, 0.044, 0.025, "steel", 0, 0, 0.13);
    for (let i = 0; i < 4; i++) k.box(0.007, 0.007, 0.07, "steel", 0, -0.0165 + i * 0.011, 0.175);
    return "one";
  },
  "Spoon": (k) => {
    k.box(0.01, 0.024, 0.2, "steel", 0, 0, 0.0);
    k.ball(0.04, "steel", 0, 0, 0.14, 0.3, 0.8, 1.3);
    return "one";
  },
  "Whisk": (k) => {
    k.rod(0.018, 0.02, -0.1, 0.14, "red", 0, 0, 10);
    k.rod(0.012, 0.012, 0.04, 0.03, "steel", 0, 0, 8);
    for (let i = 0; i < 4; i++) {
      const g = k.group(0, 0, 0.17, 0, 0, (i * Math.PI) / 4);
      const loop = k.torus(0.055, 0.003, "steel", 0, 0, 0, 0, FWD, 0, Math.PI * 2, g);
      loop.scale.x = 2.1;
    }
    return "one";
  },
  "Ladle": (k) => {
    k.box(0.012, 0.022, 0.36, "steel", 0, 0, 0.08);
    k.torus(0.014, 0.004, "steel", 0, 0, -0.11, 0, FWD, 0);
    k.bowl(0.06, "steel", 0, -0.02, 0.3);
    return "one";
  },
  "Tongs": (k) => {
    [-1, 1].forEach((s) => {
      k.box(0.024, 0.008, 0.26, "steel", 0, s * 0.015, 0.08, s * -0.06);
      k.box(0.03, 0.012, 0.04, "steel", 0, s * 0.03, 0.21, s * -0.06);
    });
    k.box(0.03, 0.03, 0.03, "black", 0, 0, -0.06);
    return "one";
  },
  "Meat Fork": (k) => {
    k.box(0.03, 0.04, 0.13, "darkWood", 0, 0, -0.03);
    k.rod(0.008, 0.008, 0.04, 0.12, "steel", 0, 0, 6);
    k.box(0.008, 0.03, 0.015, "steel", 0, 0, 0.165);
    [-1, 1].forEach((s) => k.rod(0.006, 0.003, 0.17, 0.13, "steel", 0, s * 0.012, 5));
    return "one";
  },
  "Peeler": (k) => {
    k.rod(0.02, 0.022, -0.1, 0.15, "green", 0, 0, 10);
    const loop = k.torus(0.03, 0.005, "steel", 0, 0, 0.09, 0, FWD, 0);
    loop.scale.x = 1.5;
    k.box(0.006, 0.05, 0.008, "edge", 0, 0, 0.1);
    return "one";
  },
  "Grater": (k) => {
    k.torus(0.03, 0.008, "black", 0, 0, -0.02, 0, FWD, 0);
    k.box(0.1, 0.07, 0.24, "steel", 0, 0, 0.14);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
      k.box(0.03, 0.074, 0.014, "black", -0.025 + c * 0.05, 0, 0.05 + r * 0.055);
    }
    return "one";
  },
  "Corkscrew": (k) => {
    k.box(0.03, 0.16, 0.035, "darkWood", 0, 0, -0.01);
    k.rod(0.006, 0.006, 0.0, 0.04, "steel", 0, 0, 6);
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * Math.PI * 10;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.012, Math.sin(a) * 0.012, 0.04 + t * 0.14));
    }
    k.tube(pts, 0.0035, "steel");
    return "one";
  },
  "Can Opener": (k) => {
    [-1, 1].forEach((s) => k.box(0.016, 0.022, 0.18, "red", 0, s * 0.018, -0.02, s * 0.06));
    k.box(0.02, 0.06, 0.06, "steel", 0, 0, 0.1);
    k.wheel(0.024, 0.012, "darkSteel", 0.014, 0.0, 0.12);
    k.box(0.06, 0.016, 0.016, "steel", 0.03, 0.02, 0.1);
    return "one";
  },
  "Ice Pick": (k) => {
    k.rod(0.022, 0.026, -0.1, 0.14, "wood", 0, 0, 10);
    k.rod(0.016, 0.012, 0.04, 0.02, "steel", 0, 0, 8);
    k.cone(0.007, 0.26, "steel", 0, 0, 0.19, FWD, 0, 0, 6);
    return "one";
  },
  "Scissors": (k) => {
    [-1, 1].forEach((s) => {
      k.torus(0.03, 0.008, "red", 0, s * 0.03, -0.03, 0, FWD, 0);
      const b = k.group(0, 0, 0.03, s * 0.08, 0, 0);
      k.box(0.008, 0.02, 0.18, "steel", s * 0.004, 0, 0.09, 0, 0, 0, b);
      const tip = k.cone(0.01, 0.04, "steel", s * 0.004, 0, 0.2, FWD, 0, 0, 4, b);
      tip.scale.x = 0.4;
    });
    k.wheel(0.01, 0.024, "darkSteel", 0, 0, 0.03);
    return "one";
  },
  "Spatula": (k) => {
    k.rod(0.016, 0.018, -0.1, 0.17, "black", 0, 0, 8);
    k.box(0.016, 0.006, 0.1, "steel", 0, 0.01, 0.1, -0.15);
    k.box(0.1, 0.006, 0.12, "steel", 0, 0.025, 0.2);
    for (let i = 0; i < 3; i++) k.box(0.012, 0.008, 0.08, "black", -0.025 + i * 0.025, 0.025, 0.2);
    return "one";
  },
  "Fish Slice": (k) => {
    k.rod(0.016, 0.018, -0.1, 0.17, "lightWood", 0, 0, 8);
    k.box(0.016, 0.006, 0.1, "steel", 0, 0.01, 0.1, -0.15);
    k.box(0.08, 0.005, 0.15, "steel", 0, 0.025, 0.22);
    for (let i = 0; i < 4; i++) k.box(0.006, 0.007, 0.11, "black", -0.024 + i * 0.016, 0.025, 0.22);
    return "one";
  },
  "Pizza Cutter": (k) => {
    k.rod(0.02, 0.022, -0.1, 0.15, "red", 0, 0, 10);
    k.box(0.01, 0.02, 0.09, "steel", 0.015, 0, 0.09);
    k.wheel(0.07, 0.008, "steel", 0, 0, 0.14, 24);
    k.wheel(0.016, 0.03, "darkSteel", 0, 0, 0.14);
    return "one";
  },
  "Chopsticks": (k) => {
    [-1, 1].forEach((s) => {
      const stick = k.rod(0.008, 0.004, -0.06, 0.3, "red", 0, s * 0.01, 6);
      stick.rotation.x = FWD + s * -0.04;
      k.rod(0.0085, 0.0085, -0.06, 0.05, "gold", 0, s * 0.01, 6);
    });
    return "one";
  },
  "Hot Sauce Bottle": (k) => {
    k.rod(0.042, 0.042, -0.06, 0.15, "red", 0, 0, 12);
    k.rod(0.043, 0.043, -0.02, 0.06, "white", 0, 0, 12);
    k.rod(0.042, 0.016, 0.09, 0.06, "red", 0, 0, 12);
    k.rod(0.018, 0.018, 0.15, 0.04, "green", 0, 0, 10);
    return "one";
  },
  "Salt Shaker": (k) => {
    k.rod(0.036, 0.032, -0.05, 0.12, "glass", 0, 0, 12);
    k.rod(0.028, 0.028, -0.045, 0.07, "white", 0, 0, 12);
    k.rod(0.038, 0.038, 0.07, 0.025, "steel", 0, 0, 12);
    k.ball(0.038, "steel", 0, 0, 0.095, 1, 1, 0.5);
    return "one";
  },
  "Pepper Mill": (k) => {
    k.rod(0.03, 0.03, -0.08, 0.06, "darkWood", 0, 0, 12);
    k.rod(0.026, 0.034, -0.02, 0.14, "darkWood", 0, 0, 12);
    k.rod(0.034, 0.03, 0.12, 0.06, "darkWood", 0, 0, 12);
    k.rod(0.01, 0.01, 0.18, 0.03, "steel", 0, 0, 8);
    k.ball(0.016, "steel", 0, 0, 0.215);
    return "one";
  },
  "Butcher Saw": (k) => {
    k.box(0.036, 0.1, 0.12, "darkWood", 0, -0.01, -0.02);
    k.torus(0.025, 0.008, "darkWood", 0, -0.01, -0.03, 0, FWD, 0);
    k.box(0.006, 0.1, 0.5, "steel", 0, -0.02, 0.29);
    for (let i = 0; i < 20; i++) k.cone(0.006, 0.014, "darkSteel", 0, -0.075, 0.06 + i * 0.024, Math.PI, 0, 0, 3);
    return "one";
  },
  "Bone Saw": (k) => {
    k.rod(0.022, 0.024, -0.1, 0.13, "black", 0, 0, 10);
    k.rod(0.01, 0.01, 0.03, 0.34, "steel", 0, 0.1, 8);
    k.post(0.01, 0.01, 0.0, 0.1, "steel", 0, 0.37, 8);
    k.post(0.01, 0.01, 0.0, 0.1, "steel", 0, 0.03, 8);
    k.box(0.004, 0.025, 0.34, "steel", 0, 0.0, 0.2);
    for (let i = 0; i < 14; i++) k.cone(0.005, 0.012, "darkSteel", 0, -0.015, 0.05 + i * 0.023, Math.PI, 0, 0, 3);
    return "one";
  },
  "Chainsaw": (k) => {
    k.torus(0.06, 0.014, "black", 0, 0.02, -0.04, 0, FWD, 0, Math.PI);
    k.box(0.15, 0.16, 0.3, "orange", 0, 0.04, 0.12);
    k.box(0.152, 0.07, 0.22, "black", 0, 0.1, 0.1);
    k.torus(0.1, 0.014, "black", 0, 0.08, 0.2, 0, 0, 0, Math.PI);
    k.box(0.02, 0.09, 0.62, "darkSteel", 0.02, 0.03, 0.56);
    k.box(0.016, 0.1, 0.63, "black", 0.02, 0.03, 0.56);
    k.wheel(0.045, 0.02, "darkSteel", 0.02, 0.03, 0.87);
    for (let i = 0; i < 14; i++) {
      [-1, 1].forEach((s) => k.box(0.024, 0.014, 0.018, "steel", 0.02, 0.03 + s * 0.052, 0.3 + i * 0.04));
    }
    return "gun2";
  },
  "Rubber Chicken": (k) => {
    [-1, 1].forEach((s) => {
      k.rod(0.008, 0.008, -0.04, 0.12, "orange", 0, s * 0.02, 6);
      k.box(0.04, 0.008, 0.03, "orange", 0, s * 0.02, -0.05);
    });
    k.ball(0.08, "chicken", 0, 0, 0.18, 0.8, 0.85, 1.4);
    [-1, 1].forEach((s) => k.ball(0.05, "chicken", s * 0.06, 0.01, 0.18, 0.3, 0.7, 1.2));
    k.rod(0.03, 0.026, 0.28, 0.12, "chicken", 0, 0.01, 10);
    k.ball(0.04, "chicken", 0, 0.015, 0.42);
    k.box(0.012, 0.04, 0.05, "red", 0, 0.06, 0.42);
    k.cone(0.016, 0.04, "orange", 0, 0.01, 0.47, FWD, 0, 0, 6);
    k.ball(0.012, "red", 0, -0.02, 0.45, 0.7, 1.2, 0.7);
    [-1, 1].forEach((s) => k.ball(0.007, "black", s * 0.03, 0.025, 0.44));
    return "one";
  }
};

export function buildWeaponModel(name) {
  const builder = BUILDERS[name];
  if (!builder) return null;
  const kit = makeKit();
  const hold = builder(kit);
  return { group: kit.root, hold };
}

export function buildResourceModel(name) {
  const kit = makeKit();
  if (name === "Wood") {
    [[-0.13, 0], [0.13, 0], [0, 0.22]].forEach(([x, y]) => {
      kit.rod(0.12, 0.12, -0.32, 0.64, "wood", x, y, 10);
      kit.wheel(0.1, 0.01, "lightWood", x, y, 0.325, 12).rotation.set(Math.PI / 2, 0, 0);
      kit.wheel(0.1, 0.01, "lightWood", x, y, -0.325, 12).rotation.set(Math.PI / 2, 0, 0);
    });
  } else {
    [[-0.13, 0, 0], [0.13, 0, 0], [0, 0.13, Math.PI / 2]].forEach(([x, y, ry]) => {
      kit.box(0.22, 0.12, 0.5, "darkSteel", x, y, 0, 0, ry, 0);
      kit.box(0.17, 0.02, 0.44, "steel", x, y + 0.065, 0, 0, ry, 0);
    });
  }
  return { group: kit.root, hold: "one" };
}

export function buildPotionModel(name) {
  const kit = makeKit();
  const tint = name.includes("Red") ? 0xef4444 : name.includes("Fire") ? 0xf97316 : name.includes("Health") ? 0x22c55e : name.includes("Water") ? 0x38bdf8 : 0x3b82f6;
  const big = !name.includes("1 min") && name !== "Red Glass" && name !== "Fire Resistance Potion";
  const r = big ? 0.075 : 0.06;
  if (name === "Water Bottle") {
    kit.post(0.04, 0.04, -0.1, 0.2, "glass", 0, 0, 12);
    kit.post(0.035, 0.035, -0.09, 0.15, `liquid:${tint}`, 0, 0, 12);
    kit.post(0.02, 0.02, 0.1, 0.03, "blue", 0, 0, 10);
  } else {
    kit.ball(r, "glass", 0, 0, 0);
    kit.ball(r * 0.86, `liquid:${tint}`, 0, -r * 0.08, 0);
    kit.post(r * 0.35, r * 0.35, r * 0.8, r * 0.7, "glass", 0, 0, 10);
    kit.post(r * 0.32, r * 0.36, r * 1.4, r * 0.4, "lightWood", 0, 0, 10);
  }
  return { group: kit.root, hold: "potion" };
}
