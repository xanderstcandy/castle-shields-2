import * as THREE from "./vendor/three.module.js";
import { buildBbModel } from "./bb-models.js";
import { buildWeaponModel, buildPotionModel, buildResourceModel } from "./weapon-models.js";

const INTERP_DELAY_MS = 100;
const INPUT_SEND_MS = 50;
const FUN_HAZARD_TIME_SCALE = 0.35;
const BB_KIND_GUARD = 1;
const BB_KIND_WILD = 2;
const BATTLE_TUTORIAL_MS = 30000;
const MOVEMENT_KEY_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const KEY_CAPTURE = { capture: true };
const CAMERA_DISTANCE = 10;
const CAMERA_HEIGHT = 6.5;
const CAMERA_PAN_SIDE = 4;
const CAMERA_PAN_FORWARD = 5;
const MOUSE_TURN_DEADZONE = 0.3;
const MOUSE_TURN_SPEED = 2;
const PICKUP_RANGE = 3.2;
const SVG_NS = "http://www.w3.org/2000/svg";
const ROOF_HIDE_RANGE = 12;
const RIDE_REACH = 3.5;
const RIDER_HIP = 0.7;
const HIDDEN_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

const SKY = {
  island: { sky: 0x8fd3ff, fog: 0xb9e4ff, sun: 0xfff3d6, hemiSky: 0xcfeeff, hemiGround: 0x5a7d3a },
  volcano: { sky: 0xd9906b, fog: 0xc98a6c, sun: 0xffd2a8, hemiSky: 0xffc9a8, hemiGround: 0x5b4636 },
  hardVolcano: { sky: 0x7a3326, fog: 0x7e3a2b, sun: 0xff9a6a, hemiSky: 0xff9d7a, hemiGround: 0x3b2a22 }
};

let game = null;

function weaponDefsInner() {
  const match = WEAPON_ART_DEFS.match(/<defs>[\s\S]*<\/defs>/);
  return match ? match[0] : "";
}

function itemSvg(name) {
  return isPotionName(name) ? gearPotionArtSvg(name) : weaponArtSvg(name);
}

function svgToTexture(svg, width, height, extraDefs = "") {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const markup = svg
    .replace("<svg ", `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" `)
    .replace(/(<svg[^>]*>)/, `$1${extraDefs}`);
  const img = new Image();
  img.onload = () => {
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    texture.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  return texture;
}

function makeTextSprite(text, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true }));
  sprite.scale.set(2.8, 0.79, 1);
  sprite.userData.draw = (hpRatio) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 72);
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,0,0,.75)";
    ctx.strokeText(text, 128, 30);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 30);
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(38, 44, 180, 14);
    ctx.fillStyle = hpRatio > 0.5 ? "#4ade80" : hpRatio > 0.25 ? "#facc15" : "#ef4444";
    ctx.fillRect(40, 46, 176 * Math.max(0, Math.min(1, hpRatio)), 10);
    texture.needsUpdate = true;
  };
  sprite.userData.draw(1);
  return sprite;
}

const TWO_HAND_HOLDS = new Set(["gun2", "heavy", "pole"]);
const TWO_HAND_ARM_X = -1.35;
const TWO_HAND_RIGHT_Z = -0.54;
const TWO_HAND_LEFT_Z = 0.52;
const TWO_HAND_MOUNT_TILT = { gun2: 0, heavy: -1.15, pole: -0.75 };
const ONE_HAND_MELEE_TILT = -0.3;

function heldItemModel(name) {
  if (!name) return null;
  if (isPotionName(name)) return buildPotionModel(name);
  if (isResourceName(name)) return buildResourceModel(name);
  if (WEAPON_PASSIVE.includes(name)) return null;
  return buildWeaponModel(name);
}

function equipHeld(buddy, name) {
  if (buddy.heldModel) {
    buddy.heldModel.parent?.remove(buddy.heldModel);
    disposeObject(buddy.heldModel);
  }
  buddy.heldModel = null;
  buddy.hold = "";
  const model = heldItemModel(name);
  if (!model) return;
  buddy.heldModel = model.group;
  buddy.hold = model.hold;
  if (TWO_HAND_HOLDS.has(model.hold)) {
    model.group.rotation.x = TWO_HAND_MOUNT_TILT[model.hold];
    buddy.twoHandMount.add(model.group);
  } else {
    model.group.rotation.x = model.hold === "one" ? ONE_HAND_MELEE_TILT : 0;
    buddy.hand.add(model.group);
  }
}

function poseArms(buddy, swing, attacking, now) {
  const [left, right] = buddy.arms;
  const hold = buddy.hold;
  if (TWO_HAND_HOLDS.has(hold)) {
    let delta = 0;
    if (hold === "gun2") delta = attacking ? -0.07 : 0;
    else if (hold === "heavy") delta = attacking ? -0.25 + Math.sin(now / 40) * 0.85 : 0.35;
    else delta = attacking ? 0.75 + Math.sin(now / 40) * 0.12 : 0.3;
    buddy.twoHand.rotation.x = delta;
    right.rotation.set(TWO_HAND_ARM_X + delta, 0, TWO_HAND_RIGHT_Z);
    left.rotation.set(TWO_HAND_ARM_X + delta, 0, TWO_HAND_LEFT_Z);
    return;
  }
  buddy.twoHand.rotation.x = 0;
  left.rotation.set(-swing * 0.6, 0, 0);
  const aimed = hold === "gun" || hold === "potion";
  const armX = attacking
    ? (aimed ? -1.5 : -2.2 + Math.sin(now / 40) * 1.2)
    : hold === "gun" ? -1.35 : swing * 0.6;
  right.rotation.set(armX, 0, 0);
  if (hold === "gun" && buddy.heldModel) buddy.heldModel.rotation.x = -armX;
}

const ZOMBIE_LOOK = {
  skin: [0x7fa35a],
  hair: [0x2f3b22],
  outfit: [0x5b4a3a],
  pants: [0x343a4a],
  shoe: 0x1f1f1f
};

function buildBuddy(avatar, skinId, zombie = false) {
  const base = AVATAR_LOOKS[avatar] || AVATAR_LOOKS["boy-1"];
  const look = zombie ? { ...base, ...ZOMBIE_LOOK } : base;
  const outfit = skinId && !zombie ? findSkin(skinId) : null;
  const materials = [];
  const mat = (color, glow = 0, glowColor = outfit?.glow) => {
    const material = new THREE.MeshLambertMaterial({ color });
    if (glow && glowColor) {
      material.userData.glow = new THREE.Color(glowColor).multiplyScalar(glow).getHex();
      material.emissive.setHex(material.userData.glow);
    }
    materials.push(material);
    return material;
  };
  const skin = mat(outfit?.body || look.skin[0], outfit?.body ? 0.12 : 0);
  const hair = mat(outfit?.hair || look.hair[0], outfit?.hair ? 0.25 : 0);
  const shirt = mat(outfit?.outfit || look.outfit[0], 0.22);
  const pants = mat(outfit?.pants || look.pants[0], 0.1);
  const shoe = mat(outfit?.shoe || look.shoe);
  const group = new THREE.Group();
  const box = (w, h, d, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.castShadow = true;
    return mesh;
  };

  const legs = [-0.14, 0.14].map((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.82, 0);
    const leg = box(0.22, 0.72, 0.24, pants);
    leg.position.y = -0.36;
    const foot = box(0.24, 0.12, 0.32, shoe);
    foot.position.set(0, -0.76, 0.04);
    pivot.add(leg, foot);
    group.add(pivot);
    return pivot;
  });
  const torso = box(0.62, 0.7, 0.34, shirt);
  torso.position.y = 1.17;
  group.add(torso);
  const arms = [-0.42, 0.42].map((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.48, 0);
    const arm = box(0.18, 0.62, 0.2, shirt);
    arm.position.y = -0.3;
    const hand = box(0.16, 0.14, 0.18, skin);
    hand.position.y = -0.66;
    pivot.add(arm, hand);
    group.add(pivot);
    return pivot;
  });
  const head = box(0.46, 0.46, 0.44, skin);
  head.position.y = 1.78;
  group.add(head);
  const hairTop = box(0.5, 0.14, 0.48, hair);
  hairTop.position.y = 2.04;
  const hairBack = box(0.5, 0.36, 0.1, hair);
  hairBack.position.set(0, 1.86, -0.22);
  group.add(hairTop, hairBack);
  if (look.build === "f") {
    const longHair = box(0.5, 0.5, 0.1, hair);
    longHair.position.set(0, 1.6, -0.24);
    group.add(longHair);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: zombie ? 0xef4444 : 0x111827 });
  [-0.1, 0.1].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.02), eyeMat);
    eye.position.set(x, 1.8, 0.225);
    group.add(eye);
  });
  const stun = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 16), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
  stun.rotation.x = Math.PI / 2;
  stun.position.y = 2.35;
  stun.visible = false;
  group.add(stun);
  const hand = new THREE.Group();
  hand.position.set(0, -0.66, 0.02);
  arms[1].add(hand);
  const twoHand = new THREE.Group();
  twoHand.position.set(0, 1.48, 0);
  const twoHandMount = new THREE.Group();
  twoHandMount.position.set(0, -0.125, 0.565);
  twoHand.add(twoHandMount);
  group.add(twoHand);
  const extras = outfit ? addSkinParts(group, outfit, { box, mat, head, arms, hairParts: [hairTop, hairBack] }) : { tick: null };
  return { group, legs, arms, hand, twoHand, twoHandMount, heldModel: null, hold: "", stun, materials, tick: extras.tick };
}

function addSkinParts(group, outfit, { box, mat, arms, hairParts }) {
  const accent = mat(outfit.accent, 0.8, outfit.glow || outfit.accent);
  const accentFlat = mat(outfit.accent);
  const gold = mat(outfit.crownColor || "#facc15", 0.35, outfit.crownColor || "#facc15");
  const dark = mat("#111827");
  const helmetMat = mat(outfit.helmetColor || outfit.accent, 0.15);
  const capeMat = mat(outfit.capeColor || outfit.accent, 0.2);
  const wingMat = mat(outfit.wingColor || outfit.accent, 0.35);
  const hatMat = mat(outfit.hatColor || outfit.outfit);
  const animated = [];
  const add = (mesh, x, y, z, parent = group) => {
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const hideHair = () => hairParts.forEach((part) => { part.visible = false; });

  outfit.parts.forEach((part) => {
    if (part === "cap") {
      add(box(0.5, 0.12, 0.48, accentFlat), 0, 2.08, 0);
      add(box(0.44, 0.04, 0.22, accentFlat), 0, 2.03, 0.32);
    } else if (part === "scarf") {
      add(box(0.52, 0.12, 0.38, accentFlat), 0, 1.53, 0);
      add(box(0.12, 0.3, 0.06, accentFlat), 0.14, 1.38, 0.2);
    } else if (part === "pack") {
      add(box(0.44, 0.5, 0.18, accentFlat), 0, 1.2, -0.26);
    } else if (part === "beard") {
      add(box(0.44, 0.18, 0.08, mat(outfit.hair || "#5b3a1e")), 0, 1.62, 0.22);
    } else if (part === "mask") {
      add(box(0.48, 0.18, 0.06, dark), 0, 1.66, 0.23);
    } else if (part === "bunnyEars") {
      [-0.11, 0.11].forEach((x) => {
        const ear = add(box(0.09, 0.36, 0.05, accentFlat), x, 2.24, 0);
        ear.rotation.z = x < 0 ? 0.15 : -0.15;
      });
    } else if (part === "catEars") {
      [-0.15, 0.15].forEach((x) => {
        const ear = add(box(0.12, 0.14, 0.06, mat(outfit.outfit)), x, 2.1, 0.02);
        ear.rotation.z = Math.PI / 4;
      });
    } else if (part === "tail") {
      const tail = new THREE.Group();
      tail.position.set(0, 0.9, -0.18);
      [0, 1, 2, 3].forEach((i) => {
        const size = 0.18 - i * 0.03;
        const segment = box(size, size, 0.22, i === 3 ? accent : mat(outfit.body || outfit.outfit, 0.15));
        segment.position.set(0, -0.06 * i, -0.18 * i - 0.1);
        tail.add(segment);
      });
      tail.rotation.x = 0.35;
      group.add(tail);
      animated.push((now) => { tail.rotation.y = Math.sin(now / 260) * 0.35; });
    } else if (part === "belt") {
      add(box(0.66, 0.08, 0.38, dark), 0, 0.88, 0);
      add(box(0.12, 0.1, 0.04, gold), 0, 0.88, 0.19);
    } else if (part === "hood") {
      add(box(0.54, 0.12, 0.52, mat(outfit.outfit, 0.15)), 0, 2.06, -0.01);
      add(box(0.54, 0.5, 0.1, mat(outfit.outfit, 0.15)), 0, 1.8, -0.25);
      [-0.26, 0.26].forEach((x) => add(box(0.04, 0.5, 0.48, mat(outfit.outfit, 0.15)), x, 1.8, 0));
      hideHair();
    } else if (part === "tophat") {
      add(box(0.6, 0.04, 0.58, hatMat), 0, 2.03, 0);
      add(box(0.4, 0.36, 0.4, hatMat), 0, 2.23, 0);
      add(box(0.41, 0.06, 0.41, accentFlat), 0, 2.08, 0);
      hideHair();
    } else if (part === "wideHat") {
      const leather = mat("#78350f");
      add(box(0.86, 0.04, 0.8, leather), 0, 2.04, 0);
      add(box(0.44, 0.2, 0.42, leather), 0, 2.15, 0);
      add(box(0.45, 0.05, 0.43, accentFlat), 0, 2.08, 0);
      hideHair();
    } else if (part === "wizardHat") {
      add(box(0.7, 0.04, 0.68, capeMat), 0, 2.03, 0);
      const cone = add(new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.62, 4), capeMat), 0, 2.36, 0);
      cone.rotation.y = Math.PI / 4;
      add(box(0.08, 0.08, 0.08, accent), 0, 2.68, 0);
      hideHair();
    } else if (part === "helmet") {
      add(box(0.54, 0.22, 0.52, helmetMat), 0, 2.03, 0);
      add(box(0.54, 0.4, 0.08, helmetMat), 0, 1.82, -0.24);
      [-0.27, 0.27].forEach((x) => add(box(0.05, 0.36, 0.46, helmetMat), x, 1.84, 0));
      hideHair();
    } else if (part === "visor") {
      add(box(0.5, 0.11, 0.05, accent), 0, 1.8, 0.24);
    } else if (part === "jetpack") {
      [-0.12, 0.12].forEach((x) => {
        add(box(0.18, 0.5, 0.18, mat("#94a3b8")), x, 1.2, -0.27);
        const flame = add(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 6), accent), x, 0.86, -0.27);
        flame.rotation.x = Math.PI;
        animated.push((now) => { flame.scale.y = 0.75 + Math.abs(Math.sin(now / 70 + x * 9)) * 0.5; });
      });
    } else if (part === "shoulders") {
      arms.forEach((arm, index) => {
        const pad = box(0.28, 0.14, 0.3, accent);
        pad.position.set(index === 0 ? -0.03 : 0.03, 0.03, 0);
        pad.rotation.z = index === 0 ? 0.2 : -0.2;
        arm.add(pad);
      });
    } else if (part === "horns") {
      [-1, 1].forEach((side) => {
        const horn = add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), mat("#f5f5f4", 0.2, outfit.glow)), side * 0.2, 2.18, 0);
        horn.rotation.z = -side * 0.5;
      });
    } else if (part === "crown") {
      add(box(0.44, 0.1, 0.42, gold), 0, 2.13, 0);
      [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17], [0, 0.18]].forEach(([x, z]) => add(box(0.07, 0.12, 0.07, gold), x, 2.24, z));
      add(box(0.08, 0.08, 0.04, accent), 0, 2.14, 0.22);
    } else if (part === "cape") {
      const cape = new THREE.Group();
      cape.position.set(0, 1.5, -0.2);
      const cloth = box(0.64, 1.2, 0.04, capeMat);
      cloth.position.set(0, -0.58, 0);
      cape.add(cloth);
      cape.rotation.x = 0.12;
      group.add(cape);
      animated.push((now) => { cape.rotation.x = 0.12 + Math.sin(now / 420) * 0.06; });
    } else if (part === "mohawk") {
      [-0.12, 0, 0.12].forEach((z, i) => add(box(0.08, 0.22 - i * 0.03, 0.12, mat(outfit.hair || outfit.accent, 0.5, outfit.glow || outfit.accent)), 0, 2.14, z * -1 + 0.02));
    } else if (part === "wings") {
      [-1, 1].forEach((side) => {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.12, 1.36, -0.2);
        const upper = box(0.7, 0.4, 0.04, wingMat);
        upper.position.set(side * 0.38, 0.12, 0);
        const lower = box(0.46, 0.3, 0.04, wingMat);
        lower.position.set(side * 0.32, -0.22, 0);
        const tip = box(0.18, 0.18, 0.05, accent);
        tip.position.set(side * 0.72, 0.28, 0);
        pivot.add(upper, lower, tip);
        pivot.rotation.y = side * 0.45;
        group.add(pivot);
        animated.push((now) => { pivot.rotation.y = side * (0.45 + Math.sin(now / 300) * 0.18); });
      });
    } else if (part === "halo") {
      const halo = add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), mat("#fde68a", 1, "#fde68a")), 0, 2.36, 0);
      halo.rotation.x = Math.PI / 2;
      animated.push((now) => { halo.position.y = 2.36 + Math.sin(now / 380) * 0.04; });
    } else if (part === "antenna") {
      add(box(0.03, 0.26, 0.03, mat("#64748b")), 0.12, 2.18, 0);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), accent), 0.12, 2.33, 0);
    }
  });

  if (outfit.rainbow) {
    const shimmer = [accent, wingMat, capeMat];
    const color = new THREE.Color();
    animated.push((now) => {
      const hue = (now / 4000) % 1;
      shimmer.forEach((material, index) => {
        color.setHSL((hue + index * 0.18) % 1, 0.85, 0.62);
        material.color.copy(color);
        material.userData.glow = color.clone().multiplyScalar(0.45).getHex();
        material.emissive.setHex(material.userData.glow);
      });
    });
  }

  return { tick: animated.length ? (now) => animated.forEach((step) => step(now)) : null };
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function formatMs(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function buildTerrain(map) {
  const segments = 200;
  const geometry = new THREE.PlaneGeometry(map.half * 2, map.half * 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = BBMapGen.terrainHeight(map, x, z);
    pos.setY(i, h);
    const jitter = (Math.sin(x * 0.37) * Math.cos(z * 0.41) + 1) * 0.04;
    if (h < 0) color.set(0xc9b27a).multiplyScalar(0.8);
    else if (h < 1.1) color.set(0xe9d8a6);
    else if (map.id === "island") color.set(0x5aa845).lerp(new THREE.Color(0x3f7f33), Math.min(1, h / 10));
    else if (h < 8) color.set(0x7a8f3a).lerp(new THREE.Color(0x6b5b3a), h / 8);
    else color.set(0x5b4a40).lerp(new THREE.Color(0x2b2220), Math.min(1, (h - 8) / 50));
    color.offsetHSL(0, 0, jitter - 0.04);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = true;
  return mesh;
}

function buildHazardOverlay(geometry) {
  const rocks = Array.from({ length: 16 }, () => new THREE.Vector3(0, 0, -1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      lavaRadius: { value: 0 },
      time: { value: 0 },
      rocks: { value: rocks },
      rockRadius: { value: BBMapGen.ROCK_RADIUS }
    },
    vertexShader: `
      varying vec2 vXZ;
      void main() {
        vec3 p = position;
        p.y += 0.25;
        vXZ = p.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float lavaRadius;
      uniform float time;
      uniform vec3 rocks[16];
      uniform float rockRadius;
      varying vec2 vXZ;
      void main() {
        float r = length(vXZ);
        if (lavaRadius > 0.0 && r < lavaRadius) {
          float wave = sin(vXZ.x * 0.35 + time * 1.7) * sin(vXZ.y * 0.31 - time * 1.3);
          float edge = smoothstep(lavaRadius - 4.0, lavaRadius, r);
          vec3 col = mix(vec3(1.0, 0.32, 0.02), vec3(1.0, 0.82, 0.15), 0.5 + 0.5 * wave);
          col = mix(col, vec3(0.25, 0.05, 0.02), edge * 0.6);
          gl_FragColor = vec4(col, 1.0);
          return;
        }
        float alpha = 0.0;
        for (int i = 0; i < 16; i++) {
          vec3 rock = rocks[i];
          if (rock.z < 0.0) continue;
          float d = length(vXZ - rock.xy);
          if (d < rockRadius) {
            float flash = 0.5 + 0.5 * sin(time * 18.0);
            alpha = max(alpha, (0.16 + 0.22 * flash) * (1.0 - 0.4 * d / rockRadius));
          }
        }
        if (alpha <= 0.0) discard;
        gl_FragColor = vec4(1.0, 0.1, 0.08, alpha);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 2;
  return mesh;
}

function buildInstanced(geometry, material, count, cast = true) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, count));
  mesh.count = count;
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

const WOOD_TONES = [0x8b5a2b, 0x6b4423, 0xa0522d, 0x5c4033];
const FABRIC_TONES = [0x2563eb, 0x9333ea, 0x16a34a, 0xdc2626, 0x64748b, 0xd97706];
const BOOK_TONES = [0xdc2626, 0x2563eb, 0x16a34a, 0xeab308, 0x7c3aed, 0xf97316, 0x0f766e];
const GOODS_TONES = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xec4899, 0xfacc15, 0x14b8a6];
const SCREEN_TONES = [0x1d4ed8, 0x0e7490, 0x7c3aed, 0x15803d];
const BARREL_TONES = [0x7c2d12, 0x1e3a8a, 0x166534, 0x991b1b];
const FLOOR_TONES = { house: 0x9a6b42, shop: 0xd6d3d1, warehouse: 0x6b7280, tower: 0x94a3b8 };
const WALL_PAINT = {
  house: [0xfef3c7, 0xdbeafe, 0xfce7f3, 0xdcfce7, 0xf5f5f4],
  shop: [0xfafaf9, 0xfef9c3],
  warehouse: [0xa8a29e, 0x9ca3af],
  tower: [0xe2e8f0, 0xf1f5f9]
};
const RUG_TONES = [0x9f1239, 0x1e3a8a, 0x854d0e, 0x166534, 0x6b21a8];

function shadeHex(hex, amount) {
  return new THREE.Color(hex).multiplyScalar(amount).getHex();
}

function propParts(prop) {
  const v = prop.variant || 0;
  const wood = WOOD_TONES[v % WOOD_TONES.length];
  const fabric = FABRIC_TONES[(prop.id + v) % FABRIC_TONES.length];
  const { w, d, h } = prop;
  const parts = [];
  const box = (x, y, z, bw, bh, bd, c) => parts.push({ s: "box", x, y, z, w: bw, h: bh, d: bd, c });
  const cyl = (x, y, z, dia, ch, c) => parts.push({ s: "cyl", x, y, z, w: dia, h: ch, d: dia, c });
  const glow = (x, y, z, bw, bh, bd, c) => parts.push({ s: "glow", x, y, z, w: bw, h: bh, d: bd, c });
  const legs = (height, inset, size, c) => {
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => box(sx * (w / 2 - inset), height / 2, sz * (d / 2 - inset), size, height, size, c)));
  };
  const shelfFrame = (c, levels) => {
    box(-w / 2 + 0.03, h / 2, 0, 0.06, h, d, c);
    box(w / 2 - 0.03, h / 2, 0, 0.06, h, d, c);
    box(0, h / 2, -d / 2 + 0.02, w, h, 0.04, c);
    const ys = [];
    for (let i = 0; i <= levels; i += 1) {
      const y = 0.05 + (i / levels) * (h - 0.1);
      box(0, y, 0, w, 0.05, d, c);
      if (i < levels) ys.push(y + 0.025);
    }
    return ys;
  };
  switch (prop.type) {
    case "bed":
      box(0, 0.18, 0, w, 0.36, d, wood);
      box(0, 0.46, 0.05, w - 0.1, 0.2, d - 0.15, 0xf8fafc);
      box(0, 0.58, d * 0.15, w - 0.04, 0.08, d * 0.62, fabric);
      box(0, 0.62, -d / 2 + 0.38, w * 0.7, 0.14, 0.4, 0xffffff);
      box(0, 0.55, -d / 2 + 0.05, w, 1.1, 0.1, wood);
      break;
    case "wardrobe":
      box(0, h / 2, 0, w, h, d, wood);
      box(0, h / 2, d / 2 + 0.01, 0.03, h - 0.2, 0.02, shadeHex(wood, 0.6));
      box(-0.12, h * 0.55, d / 2 + 0.03, 0.04, 0.3, 0.04, 0xd4d4d8);
      box(0.12, h * 0.55, d / 2 + 0.03, 0.04, 0.3, 0.04, 0xd4d4d8);
      box(0, h + 0.02, 0, w + 0.06, 0.04, d + 0.06, shadeHex(wood, 0.8));
      break;
    case "sofa":
      box(0, 0.22, 0, w, 0.44, d, fabric);
      box(0, 0.7, -d / 2 + 0.13, w, 0.52, 0.26, fabric);
      box(-w / 2 + 0.1, 0.6, 0, 0.2, 0.34, d, fabric);
      box(w / 2 - 0.1, 0.6, 0, 0.2, 0.34, d, fabric);
      box(-w / 4 + 0.05, 0.5, 0.08, w / 2 - 0.3, 0.12, d - 0.36, shadeHex(fabric, 1.25));
      box(w / 4 - 0.05, 0.5, 0.08, w / 2 - 0.3, 0.12, d - 0.36, shadeHex(fabric, 1.25));
      box(-w / 2 + 0.45, 0.72, -d / 2 + 0.33, 0.4, 0.35, 0.12, 0xfef3c7);
      break;
    case "tv":
      box(0, 0.25, 0, w, 0.5, d, 0x292524);
      box(-w / 4, 0.25, d / 2 + 0.01, w / 2 - 0.1, 0.38, 0.02, 0x44403c);
      box(w / 4, 0.25, d / 2 + 0.01, w / 2 - 0.1, 0.38, 0.02, 0x44403c);
      box(0, 0.55, -0.05, 0.1, 0.1, 0.1, 0x111827);
      box(0, 0.95, -0.05, w * 0.85, 0.75, 0.07, 0x111827);
      glow(0, 0.95, -0.01, w * 0.78, 0.66, 0.02, SCREEN_TONES[v]);
      break;
    case "table":
      box(0, h - 0.04, 0, w, 0.08, d, wood);
      legs(h - 0.08, 0.1, 0.08, wood);
      cyl(0, h + 0.08, 0, 0.16, 0.16, 0xf8fafc);
      cyl(0, h + 0.22, 0, 0.12, 0.14, 0xf472b6);
      cyl(-w / 4, h + 0.01, 0.15, 0.3, 0.02, 0xffffff);
      cyl(w / 4, h + 0.01, -0.15, 0.3, 0.02, 0xffffff);
      break;
    case "chair":
      legs(0.41, 0.05, 0.06, wood);
      box(0, 0.45, 0, w, 0.08, d, wood);
      box(0, 0.5, 0.02, w - 0.08, 0.04, d - 0.1, fabric);
      box(0, 0.75, -d / 2 + 0.03, w, 0.55, 0.06, wood);
      break;
    case "kitchen":
      box(0, 0.45, 0, w, 0.9, d, 0xf5f5f4);
      box(0, 0.93, 0, w + 0.04, 0.06, d + 0.04, 0x44403c);
      box(-w / 6, 0.45, d / 2 + 0.01, 0.02, 0.8, 0.01, 0xa8a29e);
      box(w / 6, 0.45, d / 2 + 0.01, 0.02, 0.8, 0.01, 0xa8a29e);
      [-w / 3, 0, w / 3].forEach((x) => box(x, 0.75, d / 2 + 0.03, 0.18, 0.03, 0.03, 0x78716c));
      box(-w / 4, 0.965, 0, 0.6, 0.02, 0.4, 0x9ca3af);
      cyl(-w / 4, 1.1, -d / 2 + 0.12, 0.05, 0.28, 0xd4d4d8);
      cyl(w / 4 - 0.2, 0.97, -0.1, 0.22, 0.02, 0x111827);
      cyl(w / 4 + 0.2, 0.97, 0.1, 0.22, 0.02, 0x111827);
      box(0, 1.85, -d / 2 + 0.18, w, 0.7, 0.35, 0xf5f5f4);
      box(0, 1.85, -d / 2 + 0.36, 0.02, 0.6, 0.01, 0xa8a29e);
      break;
    case "fridge":
      box(0, h / 2, 0, w, h, d, 0xe5e7eb);
      box(0, h * 0.62, d / 2 + 0.01, w, 0.03, 0.02, 0x9ca3af);
      box(w / 2 - 0.12, h * 0.8, d / 2 + 0.04, 0.05, 0.4, 0.05, 0x6b7280);
      box(w / 2 - 0.12, h * 0.4, d / 2 + 0.04, 0.05, 0.5, 0.05, 0x6b7280);
      box(-0.15, h * 0.85, d / 2 + 0.02, 0.12, 0.1, 0.01, GOODS_TONES[v]);
      break;
    case "bookshelf":
      shelfFrame(wood, 4).forEach((y, s) => {
        const count = 6;
        const bw = (w - 0.2) / (count * 1.25);
        for (let j = 0; j < count; j += 1) {
          const bh = 0.25 + ((prop.id * 7 + j * 13 + s * 5) % 10) / 50;
          box(-w / 2 + 0.15 + j * bw * 1.25, y + bh / 2, 0.02, bw, bh, d - 0.12, BOOK_TONES[(prop.id + j + s * 3) % BOOK_TONES.length]);
        }
      });
      break;
    case "shelfGoods":
      shelfFrame(0xd1d5db, 4).forEach((y, s) => {
        for (let j = 0; j < 4; j += 1) {
          const gh = 0.18 + ((prop.id + j * 3 + s) % 4) * 0.05;
          box(-w / 2 + 0.35 + j * ((w - 0.5) / 4), y + gh / 2, 0.03, 0.42, gh, d - 0.15, GOODS_TONES[(prop.id + j + s * 2) % GOODS_TONES.length]);
        }
      });
      break;
    case "rack": {
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => box(sx * (w / 2 - 0.05), h / 2, sz * (d / 2 - 0.05), 0.1, h, 0.1, 0xea580c)));
      [0.15, h * 0.5, h - 0.05].forEach((y, level) => {
        box(0, y, d / 2 - 0.05, w, 0.1, 0.08, 0x1d4ed8);
        box(0, y, -d / 2 + 0.05, w, 0.1, 0.08, 0x1d4ed8);
        box(0, y + 0.05, 0, w - 0.1, 0.04, d - 0.1, 0x78716c);
        if (level < 2) {
          box(-w / 4, y + 0.42, 0, w / 2 - 0.25, 0.7, d - 0.2, 0xc8a165);
          box(w / 4, y + 0.42, 0, w / 2 - 0.25, 0.7, d - 0.2, shadeHex(0xc8a165, 0.9));
        }
      });
      break;
    }
    case "counter":
      box(0, 0.5, 0, w, 1, d, wood);
      box(0, 0.5, d / 2 + 0.01, w - 0.2, 0.7, 0.02, shadeHex(wood, 0.75));
      box(0, 1.03, 0, w + 0.06, 0.06, d + 0.06, 0x44403c);
      box(w / 4, 1.18, 0, 0.4, 0.24, 0.35, 0x1f2937);
      glow(w / 4, 1.34, -0.05, 0.28, 0.12, 0.02, 0x22c55e);
      box(-w / 4, 1.1, 0, 0.3, 0.08, 0.3, GOODS_TONES[v]);
      break;
    case "crate":
      box(0, h / 2, 0, w, h, d, 0xb8860b);
      box(0, 0.12, 0, w + 0.02, 0.1, d + 0.02, 0x8b5a2b);
      box(0, h - 0.12, 0, w + 0.02, 0.1, d + 0.02, 0x8b5a2b);
      box(0, h / 2, d / 2 + 0.01, 0.1, h, 0.02, 0x8b5a2b);
      box(0, h / 2, -d / 2 - 0.01, 0.1, h, 0.02, 0x8b5a2b);
      break;
    case "barrel":
      cyl(0, h / 2, 0, w, h, BARREL_TONES[v]);
      cyl(0, 0.2, 0, w + 0.03, 0.06, 0x374151);
      cyl(0, h - 0.2, 0, w + 0.03, 0.06, 0x374151);
      cyl(0, h + 0.005, 0, w * 0.85, 0.01, shadeHex(BARREL_TONES[v], 0.7));
      break;
    case "pallet":
      box(0, 0.07, 0, w, 0.14, d, 0xa16207);
      [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => box(sx * w / 4, 0.44, sz * d / 4, w / 2 - 0.05, 0.6, d / 2 - 0.05, 0xc8a165)));
      box(0, 1.04, 0, w / 2, 0.6, d / 2, 0xd6b47a);
      box(0, 0.74, d / 2 + 0.005, 0.25, 0.04, 0.01, 0x1f2937);
      break;
    case "desk":
      box(0, 0.74, 0, w, 0.06, d, wood);
      legs(0.71, 0.06, 0.06, 0x374151);
      box(0, 0.83, -d / 2 + 0.2, 0.06, 0.14, 0.06, 0x111827);
      box(0, 1.05, -d / 2 + 0.2, 0.62, 0.4, 0.04, 0x111827);
      glow(0, 1.05, -d / 2 + 0.225, 0.56, 0.34, 0.01, 0x38bdf8);
      box(0, 0.785, 0.05, 0.45, 0.03, 0.15, 0x374151);
      box(0.35, 0.78, 0.08, 0.08, 0.03, 0.12, 0x374151);
      cyl(-w / 2 + 0.2, 0.82, 0.1, 0.08, 0.1, 0xf8fafc);
      box(-w / 2 + 0.3, 0.79, -0.15, 0.3, 0.04, 0.22, 0xffffff);
      break;
    case "officeChair":
      cyl(0, 0.04, 0, 0.55, 0.06, 0x111827);
      cyl(0, 0.25, 0, 0.06, 0.4, 0x6b7280);
      box(0, 0.48, 0, w, 0.08, d, 0x1f2937);
      box(0, 0.8, -d / 2 + 0.05, w, 0.55, 0.08, 0x1f2937);
      break;
    case "cooler":
      box(0, 0.5, 0, w, 1, d, 0xf8fafc);
      cyl(0, 1.2, 0, 0.3, 0.4, 0x60a5fa);
      box(0, 0.75, d / 2 + 0.02, 0.06, 0.06, 0.04, 0x2563eb);
      box(0.1, 0.75, d / 2 + 0.02, 0.06, 0.06, 0.04, 0xdc2626);
      break;
    case "cabinet":
      box(0, h / 2, 0, w, h, d, 0x9ca3af);
      for (let i = 0; i < 4; i += 1) {
        box(0, (h * (i + 0.5)) / 4, d / 2 + 0.02, 0.18, 0.04, 0.03, 0x4b5563);
        if (i) box(0, (h * i) / 4, d / 2 + 0.005, w - 0.04, 0.02, 0.01, 0x6b7280);
      }
      break;
    case "plant":
      cyl(0, 0.2, 0, 0.45, 0.4, 0xb45309);
      cyl(0, 0.41, 0, 0.4, 0.03, 0x3f2a1a);
      cyl(0, 0.75, 0, 0.6, 0.55, 0x15803d);
      cyl(0, 1.1, 0, 0.42, 0.35, 0x16a34a);
      break;
    case "lamp":
      cyl(0, 0.03, 0, 0.36, 0.06, 0x374151);
      cyl(0, 0.8, 0, 0.05, 1.5, 0x6b7280);
      glow(0, 1.45, 0, 0.14, 0.14, 0.14, 0xfff1c1);
      cyl(0, 1.5, 0, 0.45, 0.32, 0xfef3c7);
      break;
    default:
      box(0, h / 2, 0, w, h, d, wood);
  }
  return parts;
}

function mergeColored(list) {
  const positions = [];
  const normals = [];
  const colors = [];
  const c = new THREE.Color();
  list.forEach(({ geo, color: hex }) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.attributes.position.array;
    const n = g.attributes.normal.array;
    c.setHex(hex);
    for (let i = 0; i < p.length; i += 3) {
      positions.push(p[i], p[i + 1], p[i + 2]);
      normals.push(n[i], n[i + 1], n[i + 2]);
      colors.push(c.r, c.g, c.b);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  out.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return out;
}

function chestTemplates() {
  const box = (w, h, d, x, y, z, color) => ({ geo: new THREE.BoxGeometry(w, h, d).translate(x, y, z), color });
  const dome = (radius, length, x, color) => {
    const geo = new THREE.CylinderGeometry(radius, radius, length, 14, 1, false, 0, Math.PI);
    geo.rotateZ(Math.PI / 2);
    geo.scale(1, 0.62, 1);
    geo.translate(x, 0, 0.375);
    return { geo, color };
  };
  const build = (palette) => {
    const { wood, groove, band, trim, lock } = palette;
    const body = [
      box(1.1, 0.6, 0.75, 0, 0.3, 0, wood),
      box(1.12, 0.03, 0.77, 0, 0.2, 0, groove),
      box(1.12, 0.03, 0.77, 0, 0.4, 0, groove),
      box(1.14, 0.06, 0.79, 0, 0.03, 0, trim),
      box(1.0, 0.02, 0.65, 0, 0.605, 0, 0x1a0f08),
      box(1.14, 0.05, 0.07, 0, 0.585, 0.36, trim),
      box(1.14, 0.05, 0.07, 0, 0.585, -0.36, trim),
      box(0.07, 0.05, 0.79, 0.535, 0.585, 0, trim),
      box(0.07, 0.05, 0.79, -0.535, 0.585, 0, trim),
      box(0.08, 0.62, 0.79, -0.35, 0.31, 0, band),
      box(0.08, 0.62, 0.79, 0.35, 0.31, 0, band)
    ];
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => body.push(box(0.07, 0.64, 0.07, sx * 0.55, 0.32, sz * 0.375, trim))));
    body.push(box(0.2, 0.22, 0.04, 0, 0.47, 0.39, lock));
    body.push(box(0.05, 0.08, 0.02, 0, 0.45, 0.415, 0x111827));
    [-1, 1].forEach((sx) => {
      body.push(box(0.04, 0.05, 0.26, sx * 0.575, 0.42, 0, trim));
      body.push(box(0.05, 0.12, 0.04, sx * 0.575, 0.38, 0.11, trim));
      body.push(box(0.05, 0.12, 0.04, sx * 0.575, 0.38, -0.11, trim));
    });
    const lid = [
      dome(0.375, 1.1, 0, wood),
      dome(0.39, 0.08, -0.35, band),
      dome(0.39, 0.08, 0.35, band),
      dome(0.39, 0.06, -0.53, trim),
      dome(0.39, 0.06, 0.53, trim),
      box(1.14, 0.05, 0.06, 0, 0.02, 0.75, trim),
      box(0.14, 0.18, 0.04, 0, -0.04, 0.77, lock)
    ];
    return { body: mergeColored(body), lid: mergeColored(lid) };
  };
  return {
    normal: build({ wood: 0x8b5a2b, groove: 0x5c3a1e, band: 0x6b7280, trim: 0x4b5563, lock: 0xd4a017 }),
    rare: build({ wood: 0x3b2f8f, groove: 0x241c5c, band: 0xfbbf24, trim: 0xf59e0b, lock: 0xfde047 })
  };
}

function carParts(hex) {
  const body = new THREE.Color(hex).getHex();
  const parts = [];
  const box = (x, y, z, w, h, d, c, s = "box") => parts.push({ s, x, y, z, w, h, d, c });
  box(0, 0.55, 0, 1.8, 0.62, 4.2, body);
  box(0, 0.95, 1.55, 1.74, 0.18, 1.05, body);
  box(0, 1.2, -0.25, 1.6, 0.58, 2.2, 0x1e3a5f);
  box(0, 1.52, -0.25, 1.62, 0.08, 2.0, body);
  box(0, 0.28, 2.12, 1.86, 0.2, 0.16, 0x9ca3af);
  box(0, 0.28, -2.12, 1.86, 0.2, 0.16, 0x9ca3af);
  box(0, 0.62, 2.11, 0.7, 0.14, 0.04, 0x374151);
  [-0.62, 0.62].forEach((x) => {
    box(x, 0.68, 2.11, 0.34, 0.14, 0.04, 0xfffbe6, "glow");
    box(x, 0.68, -2.11, 0.34, 0.14, 0.04, 0xdc2626, "glow");
  });
  [-0.85, 0.85].forEach((x) => [-1.35, 1.35].forEach((z) => {
    parts.push({ s: "cyl", x, y: 0.36, z, w: 0.72, h: 0.3, d: 0.72, c: 0x111827, rz: Math.PI / 2 });
    parts.push({ s: "cyl", x: x * 1.04, y: 0.36, z, w: 0.38, h: 0.28, d: 0.38, c: 0xd1d5db, rz: Math.PI / 2 });
  }));
  box(0.92, 1.0, 0.75, 0.08, 0.1, 0.18, body);
  box(-0.92, 1.0, 0.75, 0.08, 0.1, 0.18, body);
  return parts;
}

function lampParts() {
  return [
    { s: "cyl", x: 0, y: 0.15, z: 0, w: 0.4, h: 0.3, d: 0.4, c: 0x374151 },
    { s: "cyl", x: 0, y: 2.6, z: 0, w: 0.14, h: 5, d: 0.14, c: 0x4b5563 },
    { s: "box", x: 0, y: 5.05, z: 0.75, w: 0.1, h: 0.1, d: 1.6, c: 0x4b5563 },
    { s: "box", x: 0, y: 4.98, z: 1.45, w: 0.36, h: 0.14, d: 0.6, c: 0x1f2937 },
    { s: "glow", x: 0, y: 4.9, z: 1.45, w: 0.28, h: 0.04, d: 0.5, c: 0xfff1c1 }
  ];
}

function buildRoadGeometry(map) {
  const city = window.BBWorldCity;
  const positions = [];
  const colors = [];
  const c = new THREE.Color();
  const ground = (x, z) => BBMapGen.terrainHeight(map, x, z);
  const tri = (a, b, d) => {
    [a, b, d].forEach((p) => {
      positions.push(p[0], p[1], p[2]);
      colors.push(c.r, c.g, c.b);
    });
  };
  const quad = (a, b, cc, d, hex) => {
    c.setHex(hex);
    tri(a, b, cc);
    tri(a, cc, d);
  };
  const near = (x, z, range) => city.nearIntersection(map.intersections, x, z, range);
  const strip = (points, offA, offB, lift, hexAt, skip) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      const mz = (p0.z + p1.z) / 2;
      if (skip && skip(mx, mz, i)) continue;
      const f0 = city.roadFrame(points, i);
      const f1 = city.roadFrame(points, i + 1);
      const corner = (p, f, off) => {
        const x = p.x + f.nx * off;
        const z = p.z + f.nz * off;
        return [x, ground(x, z) + lift, z];
      };
      quad(corner(p0, f0, offA), corner(p0, f0, offB), corner(p1, f1, offB), corner(p1, f1, offA), hexAt(i));
    }
  };
  const curb = (points, off, liftLow, liftHigh, hex, skip) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i];
      const p1 = points[i + 1];
      if (skip && skip((p0.x + p1.x) / 2, (p0.z + p1.z) / 2)) continue;
      const f0 = city.roadFrame(points, i);
      const f1 = city.roadFrame(points, i + 1);
      const x0 = p0.x + f0.nx * off;
      const z0 = p0.z + f0.nz * off;
      const x1 = p1.x + f1.nx * off;
      const z1 = p1.z + f1.nz * off;
      const g0 = ground(x0, z0);
      const g1 = ground(x1, z1);
      quad([x0, g0 + liftLow, z0], [x1, g1 + liftLow, z1], [x1, g1 + liftHigh, z1], [x0, g0 + liftHigh, z0], hex);
    }
  };
  const flatQuad = (cx, cz, ax, az, along, across, lift, hex) => {
    const bx = -az;
    const bz = ax;
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sa, sb]) => {
      const x = cx + ax * along * sa / 2 + bx * across * sb / 2;
      const z = cz + az * along * sa / 2 + bz * across * sb / 2;
      return [x, ground(x, z) + lift, z];
    });
    quad(pts[0], pts[1], pts[2], pts[3], hex);
  };
  const hash = (i, k) => {
    const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  map.roads.forEach((road, roadIndex) => {
    const half = road.width / 2;
    const lift = road.kind === "spoke" ? 0.14 : 0.16;
    const otherHalf = road.kind === "spoke" ? city.RING_WIDTH / 2 : city.SPOKE_WIDTH / 2;
    const atJunction = (x, z) => near(x, z, otherHalf + 2.4);
    const asphalt = (i) => {
      const n = hash(i, roadIndex);
      const base = n > 0.93 ? 0x2b2b30 : 0x3a3a41;
      return shadeHex(base, 0.92 + hash(i + 7, roadIndex) * 0.16);
    };
    strip(road.points, -half, half, lift, asphalt);
    const markLift = 0.2;
    if (road.kind === "spoke") {
      strip(road.points, -0.22, -0.08, markLift, () => 0xfacc15, atJunction);
      strip(road.points, 0.08, 0.22, markLift, () => 0xfacc15, atJunction);
    } else {
      strip(road.points, -0.08, 0.08, markLift, () => 0xf8fafc, (x, z, i) => atJunction(x, z) || i % 3 === 2);
    }
    strip(road.points, -half + 0.3, -half + 0.45, markLift, () => 0xf1f5f9, atJunction);
    strip(road.points, half - 0.45, half - 0.3, markLift, () => 0xf1f5f9, atJunction);
    const walkSkip = (x, z) => near(x, z, otherHalf + 2.6);
    [-1, 1].forEach((sgn) => {
      const inner = sgn * half;
      const outer = sgn * (half + 1.9);
      strip(road.points, Math.min(inner, outer), Math.max(inner, outer), 0.32, (i) => shadeHex(i % 2 ? 0xb4b0aa : 0xa8a29e, 1), walkSkip);
      curb(road.points, inner, lift - 0.02, 0.32, 0x78716c, walkSkip);
      curb(road.points, outer, -0.2, 0.32, 0x8a857f, walkSkip);
      road.points.forEach((p, i) => {
        if (i % 2 || walkSkip(p.x, p.z)) return;
        const f = city.roadFrame(road.points, i);
        const off = sgn * (half + 0.95);
        flatQuad(p.x + f.nx * off, p.z + f.nz * off, f.tx, f.tz, 0.05, 1.9, 0.325, 0x8a857f);
      });
    });
    road.points.forEach((p, i) => {
      if (i % 17 !== 8 || near(p.x, p.z, 10)) return;
      const f = city.roadFrame(road.points, i);
      const off = (hash(i, roadIndex + 3) - 0.5) * half;
      flatQuad(p.x + f.nx * off, p.z + f.nz * off, f.tx, f.tz, 0.9, 0.9, lift + 0.03, 0x27272a);
      flatQuad(p.x + f.nx * off, p.z + f.nz * off, f.tx, f.tz, 0.6, 0.6, lift + 0.04, 0x52525b);
    });
  });
  map.intersections.forEach((it) => {
    const ux = Math.cos(it.angle);
    const uz = Math.sin(it.angle);
    const crossings = [
      { ax: ux, az: uz, dist: city.RING_WIDTH / 2 + 1.6, width: city.SPOKE_WIDTH },
      { ax: -uz, az: ux, dist: city.SPOKE_WIDTH / 2 + 1.6, width: city.RING_WIDTH }
    ];
    crossings.forEach(({ ax, az, dist, width }) => {
      [-1, 1].forEach((sgn) => {
        const cx = it.x + ax * dist * sgn;
        const cz = it.z + az * dist * sgn;
        const stripes = Math.floor(width / 0.9);
        for (let s = 0; s < stripes; s += 1) {
          const across = (s + 0.5) * (width / stripes) - width / 2;
          flatQuad(cx - az * across, cz + ax * across, ax, az, 2.2, 0.45, 0.21, 0xf8fafc);
        }
        flatQuad(cx + ax * 1.5 * sgn, cz + az * 1.5 * sgn, ax, az, 0.3, width - 0.4, 0.21, 0xf8fafc);
      });
    });
    flatQuad(it.x, it.z, ux, uz, city.RING_WIDTH + 0.4, city.SPOKE_WIDTH + 0.4, 0.17, 0x38383e);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildingDecor(map, b) {
  const rand = BBMapGen.mulberry32((map.seed ^ Math.imul(b.id + 1, 7919)) >>> 0);
  const parts = [];
  const t = 0.6;
  const story = BBMapGen.STORY_H;
  const paints = WALL_PAINT[b.type] || WALL_PAINT.house;
  const stairSide = b.w >= b.d ? (b.stairBlock.z > b.z ? 1 : 0) : (b.stairBlock.x > b.x ? 3 : 2);
  const sides = [
    { alongX: true, x: b.x, z: b.z - b.d / 2 + t, len: b.w - t * 2, n: 1 },
    { alongX: true, x: b.x, z: b.z + b.d / 2 - t, len: b.w - t * 2, n: -1 },
    { alongX: false, x: b.x - b.w / 2 + t, z: b.z, len: b.d - t * 2, n: 1 },
    { alongX: false, x: b.x + b.w / 2 - t, z: b.z, len: b.d - t * 2, n: -1 }
  ];
  const onWall = (side, along, out, y, bw, bh, thick, c, s = "box") => {
    parts.push(side.alongX
      ? { s, x: side.x + along, y, z: side.z + side.n * out, w: bw, h: bh, d: thick, c }
      : { s, x: side.x + side.n * out, y, z: side.z + along, w: thick, h: bh, d: bw, c });
  };
  const mirrorStairs = () => ({ x: b.x - (b.stairBlock.x - b.x) * 0.9, z: b.z - (b.stairBlock.z - b.z) * 0.9 });
  for (let level = 0; level < b.stories; level += 1) {
    const bottom = b.floor + level * story;
    const top = level === b.stories - 1 ? b.floor + b.h : b.floor + (level + 1) * story - BBMapGen.SLAB_T;
    const paint = paints[Math.floor(rand() * paints.length)];
    const start = parts.length;
    sides.forEach((side, index) => {
      const pieces = level === 0 && b.door === index
        ? [[-side.len / 2, -1.35], [1.35, side.len / 2]]
        : [[-side.len / 2, side.len / 2]];
      pieces.forEach(([a, c]) => {
        onWall(side, (a + c) / 2, 0.025, (bottom + top) / 2, c - a, top - bottom, 0.04, paint);
        onWall(side, (a + c) / 2, 0.06, bottom + 0.07, c - a, 0.14, 0.05, 0x57534e);
      });
      if (level === 0 && b.door === index) onWall(side, 0, 0.025, (bottom + 2.8 + top) / 2, 2.7, top - bottom - 2.8, 0.04, paint);
      if (index === stairSide || (level === 0 && index === b.door) || b.type === "warehouse") return;
      const span = side.len + t * 2 - 2;
      const count = Math.max(1, Math.floor(span / 4.5));
      const offs = count >= 2
        ? [((0.5 / count) * span + (1.5 / count) * span) / 2 - span / 2]
        : [side.len / 2 - 1.4];
      offs.forEach((along) => {
        if (rand() < 0.35) return;
        onWall(side, along, 0.07, bottom + 1.75, 1.1, 0.85, 0.05, 0x3f2a1a);
        onWall(side, along, 0.1, bottom + 1.75, 0.92, 0.67, 0.02, GOODS_TONES[Math.floor(rand() * GOODS_TONES.length)]);
      });
    });
    const center = mirrorStairs();
    if (b.type === "warehouse" || b.type === "tower") {
      const alongX = b.w >= b.d;
      [-1, 1].forEach((sgn) => {
        const x = alongX ? center.x + sgn * b.w * 0.22 : center.x;
        const z = alongX ? center.z : center.z + sgn * b.d * 0.22;
        parts.push({ s: "glow", x, y: top - 0.06, z, w: alongX ? 2.4 : 0.25, h: 0.06, d: alongX ? 0.25 : 2.4, c: 0xf8fafc });
      });
    } else {
      parts.push({ s: "cyl", x: center.x, y: top - 0.18, z: center.z, w: 0.04, h: 0.36, d: 0.04, c: 0x374151 });
      parts.push({ s: "glow", x: center.x, y: top - 0.42, z: center.z, w: 0.5, h: 0.14, d: 0.5, c: 0xfff1c1 });
    }
    if (b.type === "house" || b.type === "tower") {
      const rw = Math.min(4, b.w * 0.3);
      const rd = Math.min(3, b.d * 0.25);
      const rugY = (level === 0 ? Math.max(BBMapGen.terrainHeight(map, center.x, center.z), b.floor) : bottom) + 0.015;
      const rug = RUG_TONES[Math.floor(rand() * RUG_TONES.length)];
      parts.push({ s: "box", x: center.x, y: rugY, z: center.z, w: rw, h: 0.02, d: rd, c: rug });
      parts.push({ s: "box", x: center.x, y: rugY + 0.012, z: center.z, w: rw - 0.5, h: 0.01, d: rd - 0.5, c: shadeHex(rug, 1.5) });
    }
    for (let i = start; i < parts.length; i += 1) parts[i].level = level;
  }
  return parts;
}

function buildWorld(scene, map) {
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const levelParts = new Map(map.buildings.map((b) => [b.id, []]));
  const addPart = (mesh, index, buildingId, level) => {
    levelParts.get(buildingId).push({ mesh, index, level, matrix: dummy.matrix.clone() });
  };
  const placeBox = (mesh, index, x, y, z, w, h, d) => {
    dummy.position.set(x, y, z);
    dummy.scale.set(w, h, d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  };

  const wallSegments = [];
  map.walls.forEach((wall) => {
    const b = map.buildings[wall.b];
    for (let level = 0; level < b.stories; level += 1) {
      const bottom = Math.max(wall.y, level === 0 ? wall.y : b.floor + level * BBMapGen.STORY_H);
      const top = Math.min(wall.y + wall.h, b.floor + (level + 1) * BBMapGen.STORY_H);
      if (top - bottom > 0.05) wallSegments.push({ wall, b, level, bottom, top });
    }
  });
  const walls = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), wallSegments.length);
  wallSegments.forEach((seg, index) => {
    placeBox(walls, index, seg.wall.x, (seg.bottom + seg.top) / 2, seg.wall.z, seg.wall.w, seg.top - seg.bottom, seg.wall.d);
    walls.setColorAt(index, color.set(seg.b.color));
    addPart(walls, index, seg.b.id, seg.level);
  });
  scene.add(walls);

  const windowSpots = [];
  map.buildings.forEach((b) => {
    const sides = [
      { x: b.x, z: b.z - b.d / 2 + 0.3, len: b.w, alongX: true, door: b.door === 0 },
      { x: b.x, z: b.z + b.d / 2 - 0.3, len: b.w, alongX: true, door: b.door === 1 },
      { x: b.x - b.w / 2 + 0.3, z: b.z, len: b.d, alongX: false, door: b.door === 2 },
      { x: b.x + b.w / 2 - 0.3, z: b.z, len: b.d, alongX: false, door: b.door === 3 }
    ];
    for (let level = 0; level < b.stories; level += 1) {
      sides.forEach((side) => {
        const count = Math.max(1, Math.floor((side.len - 2) / 4.5));
        for (let i = 0; i < count; i += 1) {
          const off = (i + 0.5) / count * (side.len - 2) - (side.len - 2) / 2;
          if (level === 0 && side.door && Math.abs(off) < 2.6) continue;
          windowSpots.push({
            b,
            level,
            x: side.alongX ? side.x + off : side.x,
            z: side.alongX ? side.z : side.z + off,
            y: b.floor + level * BBMapGen.STORY_H + 2.2,
            alongX: side.alongX
          });
        }
      });
    }
  });
  const windows = buildInstanced(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x93c5fd, emissive: 0x1e3a8a }),
    windowSpots.length,
    false
  );
  windowSpots.forEach((spot, index) => {
    placeBox(windows, index, spot.x, spot.y, spot.z, spot.alongX ? 1.5 : 0.72, 1.3, spot.alongX ? 0.72 : 1.5);
    addPart(windows, index, spot.b.id, spot.level);
  });
  scene.add(windows);

  const slabCount = map.buildings.reduce((sum, b) => sum + b.slabs.length, 0);
  const slabs = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), slabCount);
  let slabIndex = 0;
  map.buildings.forEach((b) => {
    b.slabs.forEach((slab) => {
      placeBox(slabs, slabIndex, slab.x, slab.y - BBMapGen.SLAB_T / 2, slab.z, slab.w, BBMapGen.SLAB_T, slab.d);
      slabs.setColorAt(slabIndex, color.setHex(FLOOR_TONES[b.type] || FLOOR_TONES.house));
      addPart(slabs, slabIndex, b.id, slab.level);
      slabIndex += 1;
    });
  });
  scene.add(slabs);

  const STEPS = 12;
  const stepCount = map.buildings.reduce((sum, b) => sum + b.ramps.length * STEPS, 0);
  const steps = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xa8a29e }), stepCount);
  let stepIndex = 0;
  map.buildings.forEach((b) => {
    b.ramps.forEach((ramp) => {
      const run = ramp.len / STEPS;
      for (let i = 0; i < STEPS; i += 1) {
        const along = -ramp.len / 2 + (ramp.dir > 0 ? i + 0.5 : STEPS - i - 0.5) * run;
        const top = ramp.y0 + ((i + 1) / STEPS) * (ramp.y1 - ramp.y0);
        const x = ramp.axis === "x" ? ramp.cx + along : ramp.cx;
        const z = ramp.axis === "x" ? ramp.cz : ramp.cz + along;
        const h = top - ramp.y0;
        placeBox(steps, stepIndex, x, ramp.y0 + h / 2, z, ramp.axis === "x" ? run : ramp.wid, h, ramp.axis === "x" ? ramp.wid : run);
        addPart(steps, stepIndex, b.id, ramp.level);
        stepIndex += 1;
      }
    });
  });
  scene.add(steps);

  const roofs = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), map.buildings.length);
  const floors = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), map.buildings.length, false);
  map.buildings.forEach((b, index) => {
    placeBox(roofs, index, b.x, b.floor + b.h + 0.25, b.z, b.w + 0.6, 0.5, b.d + 0.6);
    roofs.setColorAt(index, color.set(b.roof));
    addPart(roofs, index, b.id, b.stories);
    placeBox(floors, index, b.x, b.floor + 0.02, b.z, b.w - 0.4, 0.1, b.d - 0.4);
    floors.setColorAt(index, color.setHex(FLOOR_TONES[b.type] || FLOOR_TONES.house));
  });
  scene.add(roofs, floors);

  const detailEntries = [];
  map.buildings.forEach((b) => {
    buildingDecor(map, b).forEach((part) => detailEntries.push({ part, buildingId: b.id, level: part.level, ox: 0, oy: 0, oz: 0, yaw: 0, prop: null }));
  });
  map.props.forEach((prop) => {
    propParts(prop).forEach((part) => detailEntries.push({ part, buildingId: prop.buildingId, level: prop.level, ox: prop.x, oy: prop.y, oz: prop.z, yaw: prop.yaw || 0, prop }));
  });
  const breakables = new Map();
  const addBreakablePart = (kind, id, x, y, z, mesh, index) => {
    const key = `${kind}:${id}`;
    if (!breakables.has(key)) breakables.set(key, { parts: [], position: new THREE.Vector3(x, y, z), broken: false });
    breakables.get(key).parts.push({ mesh, index });
  };
  (map.cars || []).forEach((car) => {
    carParts(car.color).forEach((part) => detailEntries.push({ part, buildingId: null, level: 0, ox: car.x, oy: car.y + 0.14, oz: car.z, yaw: car.yaw, prop: null, breakable: { kind: "car", id: car.id, x: car.x, y: car.y + 0.8, z: car.z } }));
  });
  (map.lamps || []).forEach((lamp) => {
    lampParts().forEach((part) => detailEntries.push({ part, buildingId: null, level: 0, ox: lamp.x, oy: lamp.y + 0.32, oz: lamp.z, yaw: lamp.yaw, prop: null, breakable: { kind: "lamp", id: lamp.id, x: lamp.x, y: lamp.y + 1.5, z: lamp.z } }));
  });
  const detailMeshes = {
    box: buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), detailEntries.filter((e) => e.part.s === "box").length, false),
    cyl: buildInstanced(new THREE.CylinderGeometry(0.5, 0.5, 1, 12), new THREE.MeshLambertMaterial(), detailEntries.filter((e) => e.part.s === "cyl").length, false),
    glow: buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), detailEntries.filter((e) => e.part.s === "glow").length, false)
  };
  const detailCounts = { box: 0, cyl: 0, glow: 0 };
  const propVisuals = new Map();
  detailEntries.forEach(({ part, buildingId, level, ox, oy, oz, yaw, prop, breakable }) => {
    const mesh = detailMeshes[part.s];
    const index = detailCounts[part.s]++;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    dummy.position.set(ox + part.x * cos + part.z * sin, oy + part.y, oz - part.x * sin + part.z * cos);
    dummy.rotation.set(0, yaw, part.rz || 0, "YXZ");
    dummy.scale.set(part.w, part.h, part.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, color.setHex(part.c));
    if (breakable) addBreakablePart(breakable.kind, breakable.id, breakable.x, breakable.y, breakable.z, mesh, index);
    if (buildingId === null) return;
    const entry = { mesh, index, level, matrix: dummy.matrix.clone() };
    if (prop) {
      entry.propId = prop.id;
      if (!propVisuals.has(prop.id)) {
        propVisuals.set(prop.id, {
          parts: [],
          position: new THREE.Vector3(prop.x, prop.y + prop.h / 2, prop.z),
          state: { ...prop }
        });
      }
      propVisuals.get(prop.id).parts.push({ mesh, index });
    }
    levelParts.get(buildingId).push(entry);
  });
  dummy.rotation.set(0, 0, 0, "XYZ");
  Object.values(detailMeshes).forEach((mesh) => scene.add(mesh));

  const pines = map.trees.filter((tree) => tree.kind === "pine");
  const rounds = map.trees.filter((tree) => tree.kind !== "pine");
  const trunks = buildInstanced(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), new THREE.MeshLambertMaterial({ color: 0x6b4423 }), map.trees.length);
  const roundTops = buildInstanced(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: map.id === "island" ? 0x2f8f3a : 0x5d7a2a, flatShading: true }), rounds.length);
  const pineTops = buildInstanced(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshLambertMaterial({ color: map.id === "island" ? 0x1f6f3a : 0x4b5d23, flatShading: true }), pines.length);
  map.trees.forEach((tree, index) => {
    const ground = BBMapGen.terrainHeight(map, tree.x, tree.z);
    dummy.position.set(tree.x, ground + tree.height * 0.3, tree.z);
    dummy.scale.set(1, tree.height * 0.6, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(index, dummy.matrix);
    addBreakablePart("tree", tree.id, tree.x, ground + tree.height * 0.5, tree.z, trunks, index);
  });
  rounds.forEach((tree, index) => {
    const ground = BBMapGen.terrainHeight(map, tree.x, tree.z);
    dummy.position.set(tree.x, ground + tree.height * 0.75, tree.z);
    dummy.scale.setScalar(tree.height * 0.32);
    dummy.updateMatrix();
    roundTops.setMatrixAt(index, dummy.matrix);
    addBreakablePart("tree", tree.id, tree.x, ground + tree.height * 0.5, tree.z, roundTops, index);
  });
  pines.forEach((tree, index) => {
    const ground = BBMapGen.terrainHeight(map, tree.x, tree.z);
    dummy.position.set(tree.x, ground + tree.height * 0.7, tree.z);
    dummy.scale.set(tree.height * 0.28, tree.height * 0.75, tree.height * 0.28);
    dummy.updateMatrix();
    pineTops.setMatrixAt(index, dummy.matrix);
    addBreakablePart("tree", tree.id, tree.x, ground + tree.height * 0.5, tree.z, pineTops, index);
  });
  scene.add(trunks, roundTops, pineTops);

  const rocks = buildInstanced(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8a8580, flatShading: true }), map.rocks.length);
  map.rocks.forEach((rock, index) => {
    dummy.position.set(rock.x, BBMapGen.terrainHeight(map, rock.x, rock.z) + rock.radius * 0.4, rock.z);
    dummy.scale.set(rock.radius, rock.radius * 0.7, rock.radius);
    dummy.rotation.set(0, rock.x, 0);
    dummy.updateMatrix();
    rocks.setMatrixAt(index, dummy.matrix);
    addBreakablePart("rock", rock.id, rock.x, BBMapGen.terrainHeight(map, rock.x, rock.z) + rock.radius * 0.5, rock.z, rocks, index);
  });
  dummy.rotation.set(0, 0, 0);
  scene.add(rocks);

  const chests = new Map();
  const templates = chestTemplates();
  const chestMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const rareChestMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x2e1065, side: THREE.DoubleSide });
  const gemGeo = new THREE.OctahedronGeometry(0.07, 0);
  const sparkGeo = new THREE.OctahedronGeometry(0.06, 0);
  const gemMat = new THREE.MeshBasicMaterial({ color: 0xe879f9 });
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.9 });
  map.chests.forEach((chest) => {
    const rare = Boolean(chest.rare);
    const group = new THREE.Group();
    const tpl = rare ? templates.rare : templates.normal;
    const body = new THREE.Mesh(tpl.body, rare ? rareChestMat.clone() : chestMat.clone());
    body.castShadow = true;
    const lid = new THREE.Group();
    lid.position.set(0, 0.6, -0.375);
    const lidMesh = new THREE.Mesh(tpl.lid, body.material);
    lidMesh.castShadow = true;
    lid.add(lidMesh);
    group.add(body, lid);
    if (rare) {
      group.scale.setScalar(1.12);
      [[0, 0.47, 0.42], [-0.35, 0.3, 0.41], [0.35, 0.3, 0.41]].forEach(([x, y, z]) => {
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(x, y, z);
        body.add(gem);
      });
      const crown = new THREE.Mesh(gemGeo, gemMat);
      crown.position.set(0, 0.24, 0.375);
      crown.scale.setScalar(1.4);
      lid.add(crown);
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.16, depthWrite: false })
      );
      aura.position.y = 0.5;
      aura.scale.set(1.15, 0.85, 0.95);
      group.add(aura);
      const sparks = new THREE.Group();
      sparks.position.y = 0.55;
      for (let i = 0; i < 6; i += 1) {
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        const a = (i / 6) * Math.PI * 2;
        spark.position.set(Math.cos(a) * 0.85, Math.sin(i * 1.7) * 0.25, Math.sin(a) * 0.85);
        sparks.add(spark);
      }
      group.add(sparks);
      const light = new THREE.PointLight(0xfbbf24, 0.85, 7);
      light.position.y = 1.1;
      group.add(light);
      group.userData.glow = { body, aura, sparks, light, phase: chest.id * 0.7 };
    }
    group.position.set(chest.x, chest.y + 0.05, chest.z);
    group.rotation.y = (chest.id * 1.7) % (Math.PI * 2);
    group.userData = { ...group.userData, lid, opened: false, openT: 0, rare };
    scene.add(group);
    chests.set(chest.id, group);
    const inside = BBMapGen.buildingAt(map, chest.x, chest.z);
    if (inside) levelParts.get(inside.id).push({ object: group, level: chest.level });
  });

  const roads = new THREE.Mesh(buildRoadGeometry(map), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  roads.receiveShadow = true;
  scene.add(roads);

  const doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
  const doorPanelMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
  const doorVisuals = new Map();
  map.doors.forEach((door) => {
    const group = new THREE.Group();
    group.position.set(door.x, door.y, door.z);
    group.rotation.y = door.yaw;
    const postGeo = new THREE.BoxGeometry(0.18, door.h + 0.2, 0.7);
    const leftPost = new THREE.Mesh(postGeo, doorFrameMat);
    leftPost.position.set(-door.w / 2 - 0.09, (door.h + 0.2) / 2, 0);
    const rightPost = new THREE.Mesh(postGeo, doorFrameMat);
    rightPost.position.set(door.w / 2 + 0.09, (door.h + 0.2) / 2, 0);
    const header = new THREE.Mesh(new THREE.BoxGeometry(door.w + 0.36, 0.2, 0.7), doorFrameMat);
    header.position.y = door.h + 0.1;
    const panelGeo = new THREE.BoxGeometry(door.w - 0.15, door.h - 0.15, 0.12);
    panelGeo.translate((door.w - 0.15) / 2, 0, 0);
    const panel = new THREE.Mesh(panelGeo, doorPanelMat);
    panel.position.set(-(door.w - 0.15) / 2, door.h / 2, 0.08);
    panel.castShadow = true;
    group.add(leftPost, rightPost, header, panel);
    scene.add(group);
    doorVisuals.set(door.id, { group, panel, state: { ...door } });
  });

  const stoplightVisuals = new Map();
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x525252 });
  const housingMat = new THREE.MeshLambertMaterial({ color: 0x1f1f1f });
  const bulbMats = [
    new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0x991111 }),
    new THREE.MeshLambertMaterial({ color: 0xeab308, emissive: 0x000000 }),
    new THREE.MeshLambertMaterial({ color: 0x22c55e, emissive: 0x000000 })
  ];
  map.stoplights.forEach((light) => {
    const group = new THREE.Group();
    group.position.set(light.x, light.y + 0.32, light.z);
    group.rotation.y = light.yaw || 0;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 10), poleMat);
    base.position.y = 0.15;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 8), poleMat);
    pole.position.y = 1.8;
    pole.castShadow = true;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.45), housingMat);
    box.position.y = 3.55;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.05), housingMat);
    back.position.set(0, 3.55, -0.25);
    const button = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.12), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    button.position.set(0, 1.1, 0.14);
    group.add(base, pole, box, back, button);
    const bulbs = [];
    for (let i = 0; i < 3; i += 1) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), bulbMats[i]);
      bulb.position.set(0, 3.95 - i * 0.38, 0.28);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.16), housingMat);
      visor.position.set(0, 4.09 - i * 0.38, 0.3);
      group.add(bulb, visor);
      bulbs.push(bulb);
    }
    scene.add(group);
    stoplightVisuals.set(light.id, { group, bulbs, bulbMats, state: { ...light } });
  });

  return { levelParts, chests, doorVisuals, propVisuals, stoplightVisuals, breakables };
}

const BREAKABLE_POOFS = {
  tree: [0x4d7c0f, 2],
  rock: [0x8a8580, 1.6],
  car: [0x6b7280, 2.4],
  lamp: [0xfde68a, 1]
};

function hideBreakable(entry) {
  if (!entry || entry.broken) return false;
  entry.broken = true;
  entry.parts.forEach(({ mesh, index }) => {
    mesh.setMatrixAt(index, HIDDEN_MATRIX);
    mesh.instanceMatrix.needsUpdate = true;
  });
  return true;
}

const BLOCK_GEOMETRY = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_HEIGHT, BLOCK_SIZE);
const BLOCK_EDGES = new THREE.EdgesGeometry(BLOCK_GEOMETRY);
const BLOCK_LOOKS = {
  wood: { color: 0xa0703c, edge: 0x5b3a1a, roughness: 0.9, metalness: 0 },
  metal: { color: 0x9ca3af, edge: 0x4b5563, roughness: 0.35, metalness: 0.75 }
};

function buildBlockMesh(block) {
  const look = BLOCK_LOOKS[block.mat] || BLOCK_LOOKS.wood;
  const material = new THREE.MeshStandardMaterial({ color: look.color, roughness: look.roughness, metalness: look.metalness });
  const mesh = new THREE.Mesh(BLOCK_GEOMETRY, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(new THREE.LineSegments(BLOCK_EDGES, new THREE.LineBasicMaterial({ color: look.edge })));
  mesh.position.set(block.x, block.y + BLOCK_HEIGHT / 2, block.z);
  mesh.userData = { look, maxHp: block.maxHp };
  tintBlock(mesh, block.hp);
  return mesh;
}

function tintBlock(mesh, hp) {
  const { look, maxHp } = mesh.userData;
  const health = Math.max(0, Math.min(1, hp / maxHp));
  mesh.material.color.setHex(look.color).multiplyScalar(0.45 + 0.55 * health);
}

function syncDoorVisual(entry) {
  if (!entry) return;
  const { panel, group, state } = entry;
  if (state.broken) {
    group.visible = false;
    return;
  }
  group.visible = true;
  panel.rotation.y = state.open ? -Math.PI / 2.05 : 0;
}

function syncPropVisual(entry) {
  if (!entry || !entry.state.broken) return;
  entry.parts.forEach(({ mesh, index }) => {
    mesh.setMatrixAt(index, HIDDEN_MATRIX);
    mesh.instanceMatrix.needsUpdate = true;
  });
}

function syncStoplightVisual(entry) {
  if (!entry || entry.broken || !entry.state.broken) return;
  entry.group.visible = false;
  entry.broken = true;
}

function renderHudShell(root) {
  root.insertAdjacentHTML("beforeend", `
    ${WEAPON_ART_DEFS}
    <div class="mh-crosshair" data-hud-crosshair></div>
    <div class="mh-frame">
    <div class="mh-top-left">
      <div class="mh-hp"><span class="mh-hp-fill" data-hud-hp-fill></span><span class="mh-hp-text" data-hud-hp>100 / 100</span></div>
      <div class="mh-stats" data-hud-stats></div>
      <div class="mh-effect" data-hud-effect></div>
      <div class="mh-bbs" data-hud-bbs></div>
    </div>
    <div class="mh-top-right">
      <div class="mh-chip" data-hud-map></div>
      <div class="mh-chip mh-alive" data-hud-alive></div>
      <div class="mh-chip" data-hud-kills></div>
      <div class="mh-chip mh-coins" data-hud-coins></div>
      <div class="mh-chip mh-mats" data-hud-mats></div>
      <div class="mh-chip mh-hazard" data-hud-hazard></div>
    </div>
    <div class="mh-feed" data-hud-feed></div>
    <div class="mh-warning" data-hud-warning></div>
    <div class="mh-toast" data-hud-toast></div>
    <div class="mh-prompt" data-hud-prompt></div>
    <div class="mh-hotbar" data-hud-hotbar></div>
    <div class="mh-help">WASD / arrows move · mouse aims · click attack · Space jump · 1-8 or wheel switch · Enter door / pick up · Backspace drop · Shift sprint · Q shop · E build · F switch block/vehicle · R ride B.B.s / get in vehicles · right-drag turn camera · Z scope</div>
    </div>
    <div class="mh-shop" data-hud-shop hidden></div>
  `);
}

function createGame({ root, socket, start, showBattleTutorial, onBattleTutorialDone }) {
  const map = BBMapGen.generateMap(start.map, start.seed);
  const palette = SKY[start.map];
  const roster = new Map(start.roster.map((entry) => [entry.id, entry]));
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(root.clientWidth || window.innerWidth, root.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "match-canvas";
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("role", "application");
  renderer.domElement.setAttribute("aria-label", "Match view");
  renderer.domElement.style.outline = "none";
  root.appendChild(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);
  scene.fog = new THREE.Fog(palette.fog, 60, 340);
  const camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 0.1, 1200);

  scene.add(new THREE.HemisphereLight(palette.hemiSky, palette.hemiGround, 1.1));
  const sun = new THREE.DirectionalLight(palette.sun, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 260 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  const terrain = buildTerrain(map);
  scene.add(terrain);
  const overlay = buildHazardOverlay(terrain.geometry);
  scene.add(overlay);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshPhongMaterial({ color: 0x1e88c8, transparent: true, opacity: 0.82, shininess: 90, specular: 0x88ccff })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  scene.add(water);
  const world = buildWorld(scene, map);
  world.doorVisuals.forEach(syncDoorVisual);

  renderHudShell(root);
  const hud = (key) => root.querySelector(`[data-hud-${key}]`);
  const tutorialEl = document.createElement("aside");
  tutorialEl.className = "mh-tutorial";
  tutorialEl.hidden = true;
  tutorialEl.innerHTML = `
    <p class="mh-tutorial-title">First drop — controls</p>
    <p class="mh-tutorial-body"><strong>Move</strong> WASD or arrow keys · <strong>Aim</strong> mouse · <strong>Attack</strong> click · <strong>Jump</strong> Space · <strong>Switch gear</strong> 1–8 or scroll wheel · <strong>Doors / pick up</strong> Enter · <strong>Drop item</strong> Backspace · <strong>Shop</strong> Q · <strong>Build</strong> E (F swaps wood/metal — smash trees, cars, lights and furniture for materials) · <strong>Ride big B.B.s</strong> R · <strong>Turn camera</strong> right-drag · <strong>Scope</strong> Z</p>
    <button class="mh-tutorial-btn" type="button" data-action="dismiss-battle-tutorial">Got it!</button>
  `;
  root.appendChild(tutorialEl);
  let battleTutorialUntil = 0;
  let battleTutorialFinished = false;
  const dismissBattleTutorial = () => {
    if (battleTutorialFinished) return;
    battleTutorialFinished = true;
    tutorialEl.hidden = true;
    battleTutorialUntil = 0;
    if (typeof onBattleTutorialDone === "function") onBattleTutorialDone();
  };
  if (showBattleTutorial) {
    tutorialEl.hidden = false;
    battleTutorialUntil = performance.now() + BATTLE_TUTORIAL_MS;
  }
  const defsInner = weaponDefsInner();
  const itemTextures = new Map();
  const itemTexture = (name) => {
    if (!itemTextures.has(name)) itemTextures.set(name, svgToTexture(itemSvg(name), 320, 96, defsInner));
    return itemTextures.get(name);
  };

  const g = {
    socket,
    root,
    renderer,
    scene,
    camera,
    map,
    myId: start.you,
    roster,
    snaps: [],
    players: new Map(),
    bbs: new Map(),
    vehicles: new Map(),
    projectiles: new Map(),
    loot: new Map(),
    blocks: new Map(),
    buildMat: "wood",
    fallingRocks: new Map(),
    effects: [],
    me: null,
    keys: new Set(),
    mouse: new THREE.Vector2(0, 0),
    camYaw: 0,
    camPan: new THREE.Vector2(0, 0),
    aimYaw: 0,
    aimPitch: 0,
    attackHeld: false,
    rightDrag: null,
    shopOpen: false,
    shopTab: "weapons",
    scope: false,
    hotbarKey: "",
    bbsKey: "",
    serverElapsed: 0,
    serverElapsedAt: performance.now(),
    displayLava: 0,
    displayWater: 0,
    cuts: new Map(),
    cutKey: "",
    shake: 0,
    raf: 0,
    lastInputAt: 0,
    lastClickAt: 0,
    listeners: [],
    disposed: false,
    socketLive: true,
    linkDown: false,
    pageHidden: false,
    stuckMs: 0,
    stuckPos: new THREE.Vector3(),
    toastTimer: 0,
    unbindSocket: null
  };

  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    g.listeners.push(() => target.removeEventListener(type, handler, opts));
  };

  on(root, "click", (event) => {
    if (event.target.closest("[data-action='dismiss-battle-tutorial']")) dismissBattleTutorial();
  });

  function bindSocket(socket) {
    if (g.unbindSocket) g.unbindSocket();
    g.socket = socket;
    const sync = () => {
      g.socketLive = socket.readyState === WebSocket.OPEN;
    };
    const onClose = () => {
      g.socketLive = false;
      g.linkDown = true;
      toast("Reconnecting…", 0);
    };
    const onOpen = () => {
      sync();
      g.linkDown = false;
      g.socketLive = true;
    };
    socket.addEventListener("close", onClose);
    socket.addEventListener("open", onOpen);
    sync();
    if (socket.readyState === WebSocket.OPEN) {
      g.linkDown = false;
      g.socketLive = true;
    }
    g.unbindSocket = () => {
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("open", onOpen);
    };
    g.listeners.push(() => {
      if (g.unbindSocket) g.unbindSocket();
    });
  }
  bindSocket(socket);
  g.bindSocket = bindSocket;

  const sendMsg = (payload) => {
    if (!g.socket || g.socket.readyState !== WebSocket.OPEN) return;
    g.socket.send(JSON.stringify(payload));
  };

  function toast(text, ms = 1800) {
    const el = hud("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(g.toastTimer);
    if (ms > 0) g.toastTimer = setTimeout(() => el.classList.remove("show"), ms);
  }

  function focusMatchView() {
    canvas.focus({ preventScroll: true });
  }

  function addFeed(text) {
    const feed = hud("feed");
    const row = document.createElement("div");
    row.className = "mh-feed-row";
    row.textContent = text;
    feed.prepend(row);
    while (feed.children.length > 5) feed.lastChild.remove();
    setTimeout(() => row.remove(), 7000);
  }

  function nameOf(id) {
    return roster.get(id)?.name || "Someone";
  }

  function spawnPoof(x, y, z, colorHex, size = 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.7, depthWrite: false })
    );
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(0.2 * size);
    scene.add(mesh);
    g.effects.push({ mesh, born: performance.now(), life: 600, size });
  }

  function addLoot(entry) {
    if (g.loot.has(entry.id)) return;
    const group = new THREE.Group();
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemTexture(entry.item), depthWrite: false, transparent: true }));
    sprite.scale.set(2.4, 0.72, 1);
    sprite.position.y = 1;
    sprite.userData.lootId = entry.id;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.7, 20),
      new THREE.MeshBasicMaterial({ color: isPotionName(entry.item) ? 0xa855f7 : entry.item === "Wood" ? 0xa0703c : entry.item === "Metal" ? 0x9ca3af : 0xfacc15, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    group.add(sprite, ring);
    let spinner = null;
    const model = heldItemModel(entry.item);
    if (model) {
      model.group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model.group);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model.group.position.sub(center);
      spinner = new THREE.Group();
      spinner.add(model.group);
      spinner.scale.setScalar(Math.min(1.6, 1.5 / Math.max(size.x, size.y, size.z, 0.01)));
      spinner.position.y = 0.95;
      spinner.rotation.z = 0.35;
      group.add(spinner);
      sprite.material.opacity = 0;
    }
    group.position.set(entry.x, entry.y, entry.z);
    group.userData = { entry, sprite, spinner, phase: Math.random() * 6 };
    scene.add(group);
    g.loot.set(entry.id, group);
  }

  function removeLoot(id) {
    const group = g.loot.get(id);
    if (!group) return;
    scene.remove(group);
    if (group.userData.spinner) disposeObject(group.userData.spinner);
    g.loot.delete(id);
  }

  function openChest(id, rare) {
    const chest = world.chests.get(id);
    if (!chest || chest.userData.opened) return;
    chest.userData.opened = true;
    const isRare = rare || chest.userData.rare;
    spawnPoof(chest.position.x, chest.position.y + 0.8, chest.position.z, isRare ? 0xc084fc : 0xfde68a, isRare ? 2.2 : 1.4);
    const self = g.players.get(g.myId);
    if (isRare && self && Math.hypot(chest.position.x - self.group.position.x, chest.position.z - self.group.position.z) < 10) {
      toast("Rare chest — premium loot!");
    }
  }

  function ensurePlayer(id) {
    if (g.players.has(id)) return g.players.get(id);
    const info = roster.get(id) || { name: "Buddy", avatar: "boy-1" };
    const zombie = Boolean(info.zombie);
    const buddy = buildBuddy(info.avatar, info.skin, zombie);
    const tag = makeTextSprite(info.name, id === g.myId ? "#86efac" : zombie ? "#f87171" : info.bot ? "#e2e8f0" : "#7dd3fc");
    tag.position.y = 2.75;
    tag.visible = id !== g.myId;
    buddy.group.add(tag);
    scene.add(buddy.group);
    const entry = { ...buddy, tag, zombie, hp: -1, held: null, heldName: "", walk: 0, flashUntil: 0, lastPos: new THREE.Vector3() };
    g.players.set(id, entry);
    return entry;
  }

  function bbRingColor(def, owner, kind) {
    if (kind === BB_KIND_GUARD) return 0xef4444;
    if (kind === BB_KIND_WILD) return 0xe2e8f0;
    if (owner === g.myId) return bbIsRideable(def) ? 0xfacc15 : 0x4ade80;
    return null;
  }

  function syncBbRing(entry, owner, kind) {
    if (entry.owner === owner && entry.kind === kind) return;
    entry.owner = owner;
    entry.kind = kind;
    if (entry.ring) {
      entry.group.remove(entry.ring);
      entry.ring.geometry.dispose();
      entry.ring.material.dispose();
      entry.ring = null;
    }
    const color = bbRingColor(entry.def, owner, kind);
    if (color === null) return;
    const inner = entry.model.radius * 0.95 + 0.1;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, inner + 0.12 + entry.model.radius * 0.08, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: kind === BB_KIND_WILD ? 0.45 : 0.8, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    entry.group.add(ring);
    entry.ring = ring;
  }

  function ensureBb(id, catalogIndex, owner, kind) {
    let entry = g.bbs.get(id);
    if (!entry) {
      const def = BB_CATALOG[catalogIndex];
      const model = buildBbModel(bbModelSpec(def), def.size * BB_CHARACTER_HEIGHT);
      const group = new THREE.Group();
      group.add(model.group);
      scene.add(group);
      entry = { group, model, def, owner: undefined, kind: undefined, ring: null, flashUntil: 0, flashing: false, walk: 0, lastPos: new THREE.Vector3() };
      g.bbs.set(id, entry);
    }
    syncBbRing(entry, owner, kind || 0);
    return entry;
  }

  const VEHICLE_SEATS = {
    car: [[0, 0.75, -0.1]],
    truck: [[-0.4, 0.95, 0.55], [0.4, 0.95, 0.55]],
    wartruck: [[-0.4, 1.0, 0.6], [0.4, 1.0, 0.6], [0, 1.3, -1.0]],
    tank: [[0, 1.75, 0], [-0.9, 1.3, -1.2], [0.9, 1.3, -1.2], [-0.9, 1.3, 1.2], [0.9, 1.3, 1.2]]
  };

  function buildVehicleModel(kind) {
    const group = new THREE.Group();
    const materials = [];
    const mat = (color) => {
      const material = new THREE.MeshLambertMaterial({ color });
      materials.push(material);
      return material;
    };
    const box = (w, h, d, color, x, y, z, parent = group) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const wheel = (r, w, x, y, z, color = 0x111827) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), mat(color));
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };
    const glass = 0x93c5fd;
    let turret = null;
    if (kind === "car") {
      box(1.6, 0.55, 3, 0xdc2626, 0, 0.55, 0);
      box(1.4, 0.5, 1.5, 0xb91c1c, 0, 1.08, -0.15);
      box(1.42, 0.38, 0.05, glass, 0, 1.08, 0.62);
      box(0.3, 0.15, 0.05, 0xfef08a, -0.55, 0.62, 1.52);
      box(0.3, 0.15, 0.05, 0xfef08a, 0.55, 0.62, 1.52);
      [[-0.85, 1], [0.85, 1], [-0.85, -1], [0.85, -1]].forEach(([x, z]) => wheel(0.35, 0.25, x, 0.35, z));
    } else if (kind === "truck") {
      box(2, 0.6, 4, 0x2563eb, 0, 0.75, 0);
      box(1.9, 0.9, 1.5, 0x1d4ed8, 0, 1.45, 1.1);
      box(1.92, 0.5, 0.05, glass, 0, 1.55, 1.86);
      box(2, 0.45, 0.1, 0x1e3a8a, 0, 1.25, -1.95);
      box(0.1, 0.45, 2.4, 0x1e3a8a, -0.95, 1.25, -0.75);
      box(0.1, 0.45, 2.4, 0x1e3a8a, 0.95, 1.25, -0.75);
      [[-1.05, 1.3], [1.05, 1.3], [-1.05, -1.3], [1.05, -1.3]].forEach(([x, z]) => wheel(0.45, 0.3, x, 0.45, z));
    } else if (kind === "wartruck") {
      box(2.2, 0.8, 4.4, 0x4d5d2a, 0, 0.9, 0);
      box(2.1, 1, 1.7, 0x3f4f22, 0, 1.75, 1.15);
      box(1.6, 0.18, 0.05, 0x1f2937, 0, 1.9, 2.01);
      box(2.2, 0.6, 2.5, 0x3f4f22, 0, 1.6, -0.9);
      box(2.3, 0.2, 0.3, 0x27272a, 0, 0.75, 2.25);
      [[-1.15, 1.5], [1.15, 1.5], [-1.15, 0], [1.15, 0], [-1.15, -1.5], [1.15, -1.5]].forEach(([x, z]) => wheel(0.5, 0.35, x, 0.5, z));
    } else {
      box(2.8, 0.9, 4.4, 0x556b2f, 0, 0.85, 0);
      box(0.6, 0.8, 4.6, 0x1f2937, -1.5, 0.45, 0);
      box(0.6, 0.8, 4.6, 0x1f2937, 1.5, 0.45, 0);
      [-1.6, -0.55, 0.55, 1.6].forEach((z) => {
        wheel(0.32, 0.62, -1.5, 0.38, z, 0x374151);
        wheel(0.32, 0.62, 1.5, 0.38, z, 0x374151);
      });
      turret = new THREE.Group();
      turret.position.set(0, 1.3, 0);
      group.add(turret);
      box(1.8, 0.7, 2, 0x4b5d27, 0, 0.35, 0, turret);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.6, 10), mat(0x27272a));
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.4, 2.2);
      turret.add(barrel);
    }
    return { group, materials, turret };
  }

  function ensureVehicle(id, kindIndex) {
    let entry = g.vehicles.get(id);
    if (!entry) {
      const kind = VEHICLE_KINDS[kindIndex] || "car";
      const model = buildVehicleModel(kind);
      const group = new THREE.Group();
      group.add(model.group);
      scene.add(group);
      entry = { group, model, kind, spec: VEHICLES[kind], flashUntil: 0, flashing: false, occupants: 0 };
      g.vehicles.set(id, entry);
    }
    return entry;
  }

  function applyEvents(events) {
    events.forEach((ev) => {
      if (ev.k === "loot+") addLoot(ev);
      else if (ev.k === "loot-") removeLoot(ev.id);
      else if (ev.k === "chest") openChest(ev.id, ev.rare);
      else if (ev.k === "kill") {
        const victim = nameOf(ev.b);
        const zombieDown = Boolean(roster.get(ev.b)?.zombie);
        if (!zombieDown) addFeed(ev.a ? `${nameOf(ev.a)} knocked out ${victim}` : `${victim} — ${ev.cause || "out"}`);
        const entry = g.players.get(ev.b);
        if (entry) spawnPoof(entry.group.position.x, entry.group.position.y + 1, entry.group.position.z, zombieDown ? 0x84cc16 : 0xffffff, 2);
        if (zombieDown) roster.delete(ev.b);
      } else if (ev.k === "hit") {
        const p = g.players.get(ev.id);
        if (p) p.flashUntil = performance.now() + 140;
        const bb = g.bbs.get(ev.id);
        if (bb) bb.flashUntil = performance.now() + 140;
      } else if (ev.k === "impact") {
        const ground = BBMapGen.terrainHeight(map, ev.x, ev.z);
        spawnPoof(ev.x, ground + 0.5, ev.z, 0x78716c, 5);
        const self = g.players.get(g.myId);
        if (self && self.group.position.distanceTo(new THREE.Vector3(ev.x, ground, ev.z)) < 25) g.shake = 0.6;
      } else if (ev.k === "bbdown") {
        const bb = g.bbs.get(ev.id);
        if (bb) spawnPoof(bb.group.position.x, bb.group.position.y + bb.model.height * 0.5, bb.group.position.z, 0xfca5a5, 1.2 + bb.model.height * 0.4);
      } else if (ev.k === "tamed") {
        const bb = g.bbs.get(ev.id);
        if (bb) spawnPoof(bb.group.position.x, bb.group.position.y + bb.model.height * 0.5, bb.group.position.z, 0x4ade80, 1.2 + bb.model.height * 0.4);
        addFeed(`${nameOf(ev.by)} tamed a wild B.B.`);
      } else if (ev.k === "drink" && ev.id === g.myId) {
        toast(`Drank ${ev.item}`);
      } else if (ev.k === "door") {
        const entry = world.doorVisuals.get(ev.id);
        if (entry) {
          entry.state.open = Boolean(ev.open);
          syncDoorVisual(entry);
        }
      } else if (ev.k === "break") {
        if (ev.kind === "door") {
          const entry = world.doorVisuals.get(ev.id);
          if (entry) {
            entry.state.broken = true;
            entry.state.open = true;
            syncDoorVisual(entry);
            spawnPoof(entry.group.position.x, entry.group.position.y + 1.2, entry.group.position.z, 0x8b6914, 1.4);
          }
        } else if (ev.kind === "prop") {
          const entry = world.propVisuals.get(ev.id);
          if (entry) {
            entry.state.broken = true;
            syncPropVisual(entry);
            const p = entry.position;
            spawnPoof(p.x, p.y, p.z, 0xa16207, 1);
          }
        } else if (ev.kind === "light") {
          const entry = world.stoplightVisuals.get(ev.id);
          if (entry && !entry.broken) {
            entry.state.broken = true;
            syncStoplightVisual(entry);
            spawnPoof(entry.group.position.x, entry.group.position.y + 2, entry.group.position.z, 0xef4444, 1.2);
          }
        } else if (BREAKABLE_POOFS[ev.kind]) {
          breakWorldThing(ev.kind, ev.id, true);
        }
      } else if (ev.k === "block+") {
        addBlock(ev);
      } else if (ev.k === "blockhit") {
        const mesh = g.blocks.get(ev.id);
        if (mesh) tintBlock(mesh, ev.hp);
      } else if (ev.k === "block-") {
        removeBlock(ev.id, true);
      } else if (ev.k === "spawn") {
        roster.set(ev.id, { id: ev.id, name: ev.name, avatar: ev.avatar, zombie: ev.zombie, bot: true });
      } else if (ev.k === "vhit") {
        const v = g.vehicles.get(ev.id);
        if (v) v.flashUntil = performance.now() + 140;
      } else if (ev.k === "tankfire") {
        const v = g.vehicles.get(ev.id);
        if (v) spawnPoof(v.group.position.x, v.group.position.y + 1.6, v.group.position.z, 0xfde68a, 0.8);
      } else if (ev.k === "vboom") {
        spawnPoof(ev.x, ev.y + 1, ev.z, 0xf97316, 3);
        spawnPoof(ev.x, ev.y + 1.5, ev.z, 0x9ca3af, 3.5);
        const self = g.players.get(g.myId);
        if (self && self.group.position.distanceTo(new THREE.Vector3(ev.x, ev.y, ev.z)) < 20) g.shake = 0.5;
      }
    });
  }

  function breakWorldThing(kind, id, withPoof) {
    const list = { tree: map.trees, rock: map.rocks, car: map.cars, lamp: map.lamps }[kind];
    if (list && list[id]) list[id].broken = true;
    if (kind === "car") map.carBlocks.forEach((block) => { if (block.car === id) block.broken = true; });
    const entry = world.breakables.get(`${kind}:${id}`);
    if (!hideBreakable(entry) || !withPoof) return;
    const [colorHex, size] = BREAKABLE_POOFS[kind];
    spawnPoof(entry.position.x, entry.position.y, entry.position.z, colorHex, size);
  }

  function addBlock(block) {
    if (g.blocks.has(block.id)) return;
    const mesh = buildBlockMesh(block);
    scene.add(mesh);
    g.blocks.set(block.id, mesh);
    map.blocks.push({ id: block.id, x: block.x, z: block.z, y: block.y, w: BLOCK_SIZE, d: BLOCK_SIZE, h: BLOCK_HEIGHT });
  }

  function removeBlock(id, withPoof) {
    const mesh = g.blocks.get(id);
    if (!mesh) return;
    if (withPoof) spawnPoof(mesh.position.x, mesh.position.y, mesh.position.z, mesh.userData.look.color, 1.3);
    scene.remove(mesh);
    mesh.material.dispose();
    mesh.children.forEach((child) => child.material.dispose());
    g.blocks.delete(id);
    const index = map.blocks.findIndex((block) => block.id === id);
    if (index >= 0) map.blocks.splice(index, 1);
  }

  function nearestDoor(self) {
    if (!self) return null;
    let best = null;
    let bestD = 3.4;
    world.doorVisuals.forEach((entry) => {
      if (entry.state.broken || Math.abs(entry.state.y - self.group.position.y) > 2.5) return;
      const d = Math.hypot(entry.state.x - self.group.position.x, entry.state.z - self.group.position.z);
      if (d < bestD) {
        bestD = d;
        best = entry.state;
      }
    });
    return best;
  }

  function applyWorldState(msg) {
    if (msg.doors) {
      msg.doors.forEach(([id, open, broken]) => {
        const entry = world.doorVisuals.get(id);
        if (!entry) return;
        entry.state.open = Boolean(open);
        entry.state.broken = Boolean(broken);
        syncDoorVisual(entry);
      });
    }
    if (msg.propsBroken) {
      msg.propsBroken.forEach((id) => {
        const entry = world.propVisuals.get(id);
        if (!entry) return;
        entry.state.broken = true;
        syncPropVisual(entry);
      });
    }
    if (msg.lightsBroken) {
      msg.lightsBroken.forEach((id) => {
        const entry = world.stoplightVisuals.get(id);
        if (!entry) return;
        entry.state.broken = true;
        syncStoplightVisual(entry);
      });
    }
    [["tree", msg.treesBroken], ["rock", msg.rocksBroken], ["car", msg.carsBroken], ["lamp", msg.lampsBroken]].forEach(([kind, ids]) => {
      if (ids) ids.forEach((id) => breakWorldThing(kind, id, false));
    });
    if (msg.blocks) {
      [...g.blocks.keys()].forEach((id) => removeBlock(id, false));
      msg.blocks.forEach(addBlock);
    }
  }

  function handleMessage(msg) {
    if (msg.t === "state") {
      msg.loot.forEach(addLoot);
      msg.chestsOpen.forEach(openChest);
      applyWorldState(msg);
      if (g.linkDown) {
        g.linkDown = false;
        g.socketLive = g.socket && g.socket.readyState === WebSocket.OPEN;
        toast("Back in the match.", 2200);
      }
    } else if (msg.t === "snap") {
      const players = new Map(msg.players.map((row) => [row[0], row]));
      const bbs = new Map(msg.bbs.map((row) => [row[0], row]));
      const vehicles = new Map((msg.vehicles || []).map((row) => [row[0], row]));
      g.snaps.push({ time: performance.now(), players, bbs, vehicles, proj: msg.proj, rocks: msg.rocks });
      if (g.snaps.length > 6) g.snaps.shift();
      g.serverElapsed = msg.e;
      g.serverElapsedAt = performance.now();
      g.me = msg.me;
      g.alive = msg.alive;
      g.zw = msg.zw || null;
      if (g.linkDown) {
        g.linkDown = false;
        g.socketLive = g.socket && g.socket.readyState === WebSocket.OPEN;
        toast("Back in the match. Tap your move keys again.", 2200);
      }
      applyEvents(msg.ev);
      updateHud();
    } else if (msg.t === "notice") {
      toast(msg.text);
    }
  }

  function updateHud() {
    const me = g.me;
    if (!me) return;
    hud("hp").textContent = `${me.hp} / ${me.maxHp}`;
    hud("hp-fill").style.width = `${Math.max(0, (me.hp / me.maxHp) * 100)}%`;
    hud("stats").innerHTML = `${shopShieldSvg()} ${me.def} defense · ${shopSwordSvg()} ${me.dmg} damage`;
    const effectText = me.effect ? `${me.effect}${me.effectMs >= 0 ? ` · ${formatMs(me.effectMs)}` : " · rest of game"}` : "";
    hud("effect").textContent = me.stunMs > 0
      ? `STUNNED ${(me.stunMs / 1000).toFixed(1)}s`
      : me.protectMs > 0 ? `Spawn protection ${formatMs(me.protectMs)}` : effectText;
    hud("effect").classList.toggle("mh-effect--stun", me.stunMs > 0);
    if (g.zw) {
      const [wave, zombiesLeft, nextMs] = g.zw;
      hud("map").textContent = wave ? `Zombie Survival · Wave ${wave}` : "Zombie Survival";
      hud("alive").textContent = `${zombiesLeft} zombies · next wave ${Math.ceil(nextMs / 1000)}s · ${g.alive} on squad`;
    } else {
      hud("map").textContent = BBMapGen.MAP_LABELS[map.id];
      hud("alive").textContent = `${g.alive} alive`;
    }
    hud("kills").textContent = `${me.kills} KO`;
    hud("coins").innerHTML = `${shopCoinSvg()} ${me.coins}`;
    const veh = me.veh;
    const matsKey = `${me.wood}|${me.metal}|${g.buildMat}|${veh ? veh.join(",") : ""}`;
    if (matsKey !== g.matsKey) {
      g.matsKey = matsKey;
      const chip = (mat, label, count) => `<span class="mh-mat${g.buildMat === mat ? " mh-mat--active" : ""}">${label} ${count}</span>`;
      const vehicle = VEHICLES[g.buildMat];
      const vehicleChip = vehicle ? ` <span class="mh-mat mh-mat--active">🚗 ${vehicle.label} (${vehicle.cost} 🔩)</span>` : "";
      const insideChip = veh
        ? ` <span class="mh-mat mh-mat--vehicle">${VEHICLES[veh[0]].label} ${veh[1]}/${veh[2]} HP${veh[3] === 0 ? " · driving" : ""}${veh[4] >= 0 ? (veh[4] > 0 ? " · reloading" : " · gun ready") : ""}</span>`
        : "";
      hud("mats").innerHTML = `${chip("wood", "🪵", me.wood)} ${chip("metal", "🔩", me.metal)}${vehicleChip}${insideChip} <span class="mh-mat-hint">E build · F switch</span>`;
    }

    const hotbarKey = JSON.stringify([me.inv, me.held]);
    if (hotbarKey !== g.hotbarKey) {
      g.hotbarKey = hotbarKey;
      hud("hotbar").innerHTML = me.inv.map((item, index) => `
        <button type="button" class="mh-slot${index === me.held ? " active" : ""}" data-hud-slot="${index}" title="${item ? escapeHtml(item) : "Empty"}">
          <span class="mh-slot-key">${index + 1}</span>
          <span class="mh-slot-art">${item ? itemSvg(item) : ""}</span>
          <span class="mh-slot-name">${item ? escapeHtml(item) : "Fists"}</span>
        </button>
      `).join("");
    }
    const bbsKey = JSON.stringify(me.bbs);
    if (bbsKey !== g.bbsKey) {
      g.bbsKey = bbsKey;
      hud("bbs").innerHTML = me.bbs.length
        ? `<p class="mh-bbs-title">B.B.s ${me.bbs.length}/${MATCH_MAX_BBS}</p>` + me.bbs.map(([name, hp, maxHp]) => `
          <div class="mh-bb-row"><span>${escapeHtml(name)}</span><span class="mh-bb-bar"><span style="width:${Math.max(0, (hp / maxHp) * 100)}%"></span></span></div>
        `).join("")
        : "";
    }
    if (g.shopOpen) refreshShopAffordability();
  }

  function shopItems() {
    if (g.shopTab === "potions") {
      return Object.keys(POTION_IN_GAME_PRICE).map((name) => ({ kind: "potion", name, price: POTION_IN_GAME_PRICE[name], art: itemSvg(name) }));
    }
    if (g.shopTab === "bbs") {
      return BB_CATALOG.map((bb) => ({ kind: "bb", name: bb.name, price: getBbInGamePrice(bb), art: bbArtSvg(bb.art) }));
    }
    return WEAPON_SHOP_ITEMS.map((name) => ({ kind: "weapon", name, price: getWeaponInGameShopPrice(name), art: weaponArtSvg(name) }))
      .sort((a, b) => a.price - b.price);
  }

  function renderShop() {
    const el = hud("shop");
    el.hidden = !g.shopOpen;
    if (!g.shopOpen) return;
    const tabs = [["weapons", "Weapons"], ["potions", "Potions"], ["bbs", "B.B.s"]];
    el.innerHTML = `
      <div class="mh-shop-panel">
        <header class="mh-shop-head">
          <h2>In-Game Shop</h2>
          <span class="mh-shop-coins">${shopCoinSvg()} <span data-hud-shop-coins>${g.me ? g.me.coins : 0}</span></span>
          <button type="button" class="mh-shop-close" data-hud-shop-close>Close (Q)</button>
        </header>
        <nav class="mh-shop-tabs">${tabs.map(([id, label]) => `<button type="button" class="mh-shop-tab${g.shopTab === id ? " active" : ""}" data-hud-shop-tab="${id}">${label}</button>`).join("")}</nav>
        <div class="mh-shop-grid">
          ${shopItems().map((item) => `
            <button type="button" class="mh-shop-item" data-hud-buy="${item.kind}" data-hud-buy-name="${escapeHtml(item.name)}" data-price="${item.price}">
              <span class="mh-shop-art${item.kind === "bb" ? " mh-shop-art--bb" : ""}">${item.art}</span>
              <span class="mh-shop-name">${escapeHtml(item.name)}</span>
              <span class="mh-shop-price">${shopCoinSvg()} ${item.price}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    refreshShopAffordability();
  }

  function refreshShopAffordability() {
    const coins = g.me ? g.me.coins : 0;
    const coinsEl = root.querySelector("[data-hud-shop-coins]");
    if (coinsEl) coinsEl.textContent = coins;
    root.querySelectorAll("[data-hud-buy]").forEach((button) => {
      button.disabled = Number(button.dataset.price) > coins;
    });
  }

  function toggleShop(open = !g.shopOpen) {
    g.shopOpen = open;
    g.attackHeld = false;
    renderShop();
  }

  function selectSlot(slot) {
    sendMsg({ t: "select", slot });
  }

  function cursorRay() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(g.mouse, camera);
    return raycaster;
  }

  function cursorGroundPoint() {
    const ray = cursorRay().ray;
    const point = new THREE.Vector3();
    const self = g.players.get(g.myId);
    const capY = self ? self.group.position.y + 0.5 : Infinity;
    for (let t = 1; t < 320; t += 0.75) {
      ray.at(t, point);
      if (point.y <= BBMapGen.groundHeight(map, point.x, point.z, Math.min(point.y, capY))) return point;
    }
    return ray.at(120, point);
  }

  function tryDoubleClickPickup() {
    const raycaster = cursorRay();
    const sprites = [...g.loot.values()].map((group) => group.userData.sprite);
    const hit = raycaster.intersectObjects(sprites, false)[0];
    if (hit) {
      sendMsg({ t: "pickup", id: hit.object.userData.lootId });
      return true;
    }
    return false;
  }

  on(window, "keydown", (event) => {
    if (event.repeat && !MOVEMENT_KEY_CODES.has(event.code)) return;
    const code = event.code;
    if (code === "KeyQ") {
      toggleShop();
      return;
    }
    if (code === "KeyB") return;
    if (code === "KeyE") {
      if (!g.shopOpen && g.me) {
        let mat = g.buildMat;
        if (BUILD_BLOCKS[mat]) {
          const other = mat === "wood" ? "metal" : "wood";
          if (g.me[mat] < BUILD_BLOCKS[mat].cost && g.me[other] >= BUILD_BLOCKS[other].cost) mat = other;
        }
        sendMsg({ t: "build", mat });
      }
      return;
    }
    if (code === "KeyF") {
      g.buildMat = BUILD_OPTIONS[(BUILD_OPTIONS.indexOf(g.buildMat) + 1) % BUILD_OPTIONS.length];
      const vehicle = VEHICLES[g.buildMat];
      if (vehicle) {
        toast(`Building a ${vehicle.label}: ${vehicle.cost} metal · ${vehicle.hp} HP · ${vehicle.seats} seat${vehicle.seats > 1 ? "s" : ""} · ${vehicle.speed}× speed${vehicle.gun ? ` · ${vehicle.gun.damage} dmg gun` : ""}`, 1800);
      } else {
        const spec = BUILD_BLOCKS[g.buildMat];
        toast(`Building with ${spec.item.toLowerCase()} (${spec.cost} per block, ${spec.hp} HP)`, 1400);
      }
      updateHud();
      return;
    }
    if (code === "Escape" && g.shopOpen) {
      toggleShop(false);
      return;
    }
    if (code === "Enter" || code === "NumpadEnter") {
      const self = g.players.get(g.myId);
      if (self && nearestDoor(self)) sendMsg({ t: "door" });
      else sendMsg({ t: "pickup" });
      event.preventDefault();
      return;
    }
    if (code === "Backspace") {
      sendMsg({ t: "drop" });
      event.preventDefault();
      return;
    }
    if (/^Digit[1-8]$/.test(code)) {
      selectSlot(Number(code.slice(5)) - 1);
      return;
    }
    if (code === "KeyR") {
      sendMsg({ t: "ride" });
      return;
    }
    if (code === "KeyZ") g.scope = !g.scope;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) event.preventDefault();
    g.keys.add(code);
  }, KEY_CAPTURE);
  on(window, "keyup", (event) => g.keys.delete(event.code), KEY_CAPTURE);
  on(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      g.pageHidden = true;
      g.keys.clear();
      g.attackHeld = false;
      g.rightDrag = null;
      return;
    }
    if (g.pageHidden) {
      g.pageHidden = false;
      g.attackHeld = false;
      g.rightDrag = null;
      toast("Tap a movement key (WASD) if you can't move", 3200);
      focusMatchView();
    }
  });
  on(window, "blur", () => {
    g.attackHeld = false;
    g.rightDrag = null;
  });

  on(canvas, "contextmenu", (event) => event.preventDefault());
  on(canvas, "mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    g.mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    if (g.rightDrag) {
      g.camYaw -= (event.clientX - g.rightDrag) * 0.006;
      g.rightDrag = event.clientX;
    }
  });
  on(canvas, "mouseleave", () => g.mouse.set(0, 0));
  on(canvas, "mousedown", (event) => {
    focusMatchView();
    if (event.button === 2) {
      g.rightDrag = event.clientX;
      return;
    }
    if (event.button !== 0 || g.shopOpen) return;
    g.attackHeld = true;
  });
  const releasePointer = (event) => {
    if (event.button === 2) g.rightDrag = null;
    if (event.button === 0) g.attackHeld = false;
  };
  on(window, "mouseup", releasePointer);
  on(window, "pointerup", releasePointer);
  on(window, "pointercancel", () => {
    g.rightDrag = null;
    g.attackHeld = false;
  });
  on(canvas, "dblclick", () => {
    if (tryDoubleClickPickup()) g.attackHeld = false;
  });
  on(canvas, "wheel", (event) => {
    if (!g.me) return;
    event.preventDefault();
    const dir = event.deltaY > 0 ? 1 : -1;
    selectSlot((g.me.held + dir + MATCH_INVENTORY_SLOTS) % MATCH_INVENTORY_SLOTS);
  }, { passive: false });
  on(root, "click", (event) => {
    const slot = event.target.closest("[data-hud-slot]");
    if (slot) {
      selectSlot(Number(slot.dataset.hudSlot));
      return;
    }
    if (event.target.closest("[data-hud-shop-close]")) {
      toggleShop(false);
      return;
    }
    const tab = event.target.closest("[data-hud-shop-tab]");
    if (tab) {
      g.shopTab = tab.dataset.hudShopTab;
      renderShop();
      return;
    }
    const buy = event.target.closest("[data-hud-buy]");
    if (buy && !buy.disabled) sendMsg({ t: "buy", kind: buy.dataset.hudBuy, name: buy.dataset.hudBuyName });
  });
  on(window, "resize", () => {
    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  function interpolated(now) {
    const renderTime = now - INTERP_DELAY_MS;
    const snaps = g.snaps;
    if (!snaps.length) return null;
    let older = snaps[0];
    let newer = snaps[snaps.length - 1];
    for (let i = snaps.length - 1; i > 0; i -= 1) {
      if (snaps[i - 1].time <= renderTime) {
        older = snaps[i - 1];
        newer = snaps[i];
        break;
      }
    }
    const span = newer.time - older.time;
    const t = span > 0 ? Math.max(0, Math.min(1, (renderTime - older.time) / span)) : 1;
    return { older, newer, t };
  }

  function updateEntities(now, dt) {
    const frame = interpolated(now);
    if (!frame) return;
    const { older, newer, t } = frame;
    const latest = g.snaps[g.snaps.length - 1];

    g.vehicles.forEach((entry, id) => {
      if (!latest.vehicles.has(id)) {
        scene.remove(entry.group);
        entry.model.materials.forEach((material) => material.dispose());
        g.vehicles.delete(id);
      }
    });
    latest.vehicles.forEach((row, id) => {
      const entry = ensureVehicle(id, row[1]);
      const a = older.vehicles.get(id) || row;
      const b = newer.vehicles.get(id) || row;
      entry.group.position.set(a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t);
      entry.model.group.rotation.y = lerpAngle(a[5], b[5], t);
      if (entry.model.turret) entry.model.turret.rotation.y = lerpAngle(a[8], b[8], t) - entry.model.group.rotation.y;
      entry.occupants = row[9] || 0;
      const flash = now < entry.flashUntil;
      if (flash !== entry.flashing) {
        entry.flashing = flash;
        entry.model.materials.forEach((material) => material.emissive.setHex(flash ? 0x991b1b : 0x000000));
      }
    });

    g.players.forEach((entry, id) => {
      if (!latest.players.has(id)) {
        scene.remove(entry.group);
        g.players.delete(id);
      }
    });
    latest.players.forEach((row, id) => {
      const entry = ensurePlayer(id);
      const a = older.players.get(id) || row;
      const b = newer.players.get(id) || row;
      const self = id === g.myId;
      const lt = self ? 1 : t;
      const source = self ? row : b;
      const from = self ? row : a;
      const x = from[1] + (source[1] - from[1]) * lt;
      const y = from[2] + (source[2] - from[2]) * lt;
      const z = from[3] + (source[3] - from[3]) * lt;
      if (self) {
        entry.group.position.lerp(new THREE.Vector3(x, y, z), Math.min(1, dt * 18));
        entry.group.rotation.y = g.aimYaw;
      } else {
        entry.group.position.set(x, y, z);
        entry.group.rotation.y = lerpAngle(from[4], source[4], lt);
      }
      const moved = entry.group.position.distanceTo(entry.lastPos);
      entry.lastPos.copy(entry.group.position);
      const speed = dt > 0 ? moved / dt : 0;
      entry.mountId = row[10] || 0;
      entry.vehicleId = row[11] || 0;
      entry.seat = row[12] || 0;
      const seated = entry.mountId || entry.vehicleId;
      entry.walk += seated ? 0 : speed * dt * 2.2;
      const swing = speed > 0.5 && !seated ? Math.sin(entry.walk) * 0.7 : 0;
      entry.legs[0].rotation.x = seated ? -1.45 : swing;
      entry.legs[1].rotation.x = seated ? -1.45 : -swing;
      const heldName = row[7];
      if (entry.heldName !== heldName) {
        entry.heldName = heldName;
        equipHeld(entry, heldName);
      }
      poseArms(entry, swing, row[9] === 1, now);
      if (entry.zombie) {
        const lunge = row[9] === 1 ? -0.5 : 0;
        entry.arms[0].rotation.set(-1.45 + lunge + Math.sin(entry.walk * 0.5) * 0.08, 0, 0);
        entry.arms[1].rotation.set(-1.45 + lunge - Math.sin(entry.walk * 0.5) * 0.08, 0, 0);
      }
      entry.stun.visible = row[8] === 1;
      if (entry.stun.visible) entry.stun.rotation.z += dt * 6;
      if (entry.hp !== row[5]) {
        entry.hp = row[5];
        entry.tag.userData.draw(row[5] / row[6]);
      }
      const flash = now < entry.flashUntil;
      if (entry.tick) entry.tick(now);
      entry.materials.forEach((material) => material.emissive.setHex(flash ? 0x991b1b : material.userData.glow || 0));
    });

    g.bbs.forEach((entry, id) => {
      if (!latest.bbs.has(id)) {
        scene.remove(entry.group);
        entry.model.disposables.forEach((material) => material.dispose());
        g.bbs.delete(id);
      }
    });
    latest.bbs.forEach((row, id) => {
      const entry = ensureBb(id, row[2], row[1], row[10]);
      const a = older.bbs.get(id) || row;
      const b = newer.bbs.get(id) || row;
      const ridden = Boolean(row[8]);
      const small = entry.def.size < 1;
      const bob = !ridden && small ? Math.abs(Math.sin(now / 160 + id)) * 0.15 * entry.def.size : 0;
      entry.group.position.set(a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t + bob, a[5] + (b[5] - a[5]) * t);
      const moved = Math.hypot(entry.group.position.x - entry.lastPos.x, entry.group.position.z - entry.lastPos.z);
      entry.lastPos.copy(entry.group.position);
      const speed = dt > 0 ? moved / dt : 0;
      entry.walk += speed * dt * (small ? 3 : 1.4) / Math.max(0.6, entry.def.size);
      const model = entry.model.group;
      model.rotation.y = lerpAngle(a[9] || 0, b[9] || 0, t);
      model.rotation.z = speed > 0.5 ? Math.sin(entry.walk) * 0.06 : 0;
      const flash = now < entry.flashUntil;
      if (flash !== entry.flashing) {
        entry.flashing = flash;
        entry.model.materials.forEach((material) => material.emissive.setHex(flash ? 0x991b1b : 0x000000));
      }
    });

    g.players.forEach((entry) => {
      const vehicle = entry.vehicleId ? g.vehicles.get(entry.vehicleId) : null;
      if (vehicle) {
        const seats = VEHICLE_SEATS[vehicle.kind];
        const [seatX, seatY, seatZ] = seats[entry.seat] || seats[0];
        const yaw = vehicle.model.group.rotation.y;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        entry.group.position.set(
          vehicle.group.position.x + seatX * cos + seatZ * sin,
          vehicle.group.position.y + seatY - RIDER_HIP,
          vehicle.group.position.z - seatX * sin + seatZ * cos
        );
        if (entry.seat === 0 || entry !== g.players.get(g.myId)) entry.group.rotation.y = yaw;
        return;
      }
      const mount = entry.mountId ? g.bbs.get(entry.mountId) : null;
      if (!mount) return;
      const [seatX, seatY, seatZ] = mount.model.seat;
      const yaw = mount.model.group.rotation.y;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      entry.group.position.set(
        mount.group.position.x + seatX * cos + seatZ * sin,
        mount.group.position.y + seatY - RIDER_HIP,
        mount.group.position.z - seatX * sin + seatZ * cos
      );
    });

    const liveProj = new Set();
    latest.proj.forEach(([id, x, y, z, big]) => {
      liveProj.add(id);
      let mesh = g.projectiles.get(id);
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.3 : 0.12, 8, 6), new THREE.MeshBasicMaterial({ color: big ? 0xf97316 : 0xfff1a8 }));
        mesh.position.set(x, y, z);
        scene.add(mesh);
        g.projectiles.set(id, mesh);
      }
      mesh.position.lerp(new THREE.Vector3(x, y, z), Math.min(1, dt * 25));
    });
    g.projectiles.forEach((mesh, id) => {
      if (!liveProj.has(id)) {
        scene.remove(mesh);
        g.projectiles.delete(id);
      }
    });

    const uniforms = overlay.material.uniforms;
    const rockIds = new Set();
    uniforms.rocks.value.forEach((v) => v.set(0, 0, -1));
    latest.rocks.slice(0, 16).forEach(([id, x, z, msLeft], index) => {
      rockIds.add(id);
      const left = msLeft - (now - latest.time);
      uniforms.rocks.value[index].set(x, z, Math.max(0, left));
      let rock = g.fallingRocks.get(id);
      if (!rock) {
        rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), new THREE.MeshLambertMaterial({ color: 0x57534e, emissive: 0x7c2d12, flatShading: true }));
        rock.castShadow = true;
        scene.add(rock);
        g.fallingRocks.set(id, rock);
      }
      const ground = BBMapGen.terrainHeight(map, x, z);
      rock.position.set(x, ground + 1 + Math.max(0, left / BBMapGen.ROCK_WARNING_MS) * 70, z);
      rock.rotation.x += dt * 3;
      rock.rotation.y += dt * 2;
    });
    g.fallingRocks.forEach((rock, id) => {
      if (!rockIds.has(id)) {
        scene.remove(rock);
        g.fallingRocks.delete(id);
      }
    });

    const self = g.players.get(g.myId);
    const warning = hud("warning");
    const inDanger = self && latest.rocks.some(([, x, z]) => Math.hypot(x - self.group.position.x, z - self.group.position.z) < BBMapGen.ROCK_RADIUS + 0.5);
    warning.textContent = inDanger ? "ROCK INCOMING — MOVE!" : "";
    warning.classList.toggle("show", Boolean(inDanger));
  }

  function updateWorld(now, dt) {
    const elapsed = g.serverElapsed + (now - g.serverElapsedAt);
    const zombieMode = start.mode === "zombies";
    const hazard = BBMapGen.hazardAt(map.id, zombieMode ? 0 : start.mode === "fun" ? elapsed * FUN_HAZARD_TIME_SCALE : elapsed);
    g.displayWater += (hazard.waterLevel - g.displayWater) * Math.min(1, dt * 0.8);
    g.displayLava += (hazard.lavaRadius - g.displayLava) * Math.min(1, dt * 0.8);
    water.position.y = g.displayWater + Math.sin(now / 900) * 0.05;
    overlay.material.uniforms.lavaRadius.value = g.displayLava;
    overlay.material.uniforms.time.value = now / 1000;
    const label = hazard.kind === "water" ? "Water rises" : "Lava spreads";
    hud("hazard").textContent = zombieMode ? "No rising water — just zombies" : `${label} in ${formatMs(hazard.nextStepMs)}`;

    world.chests.forEach((chest) => {
      const glow = chest.userData.glow;
      if (glow && !chest.userData.opened) {
        const pulse = 0.55 + Math.sin(now / 320 + glow.phase) * 0.45;
        glow.body.material.emissive.setHex(0x4c1d95).multiplyScalar(0.3 + pulse * 0.45);
        glow.aura.material.opacity = 0.1 + pulse * 0.1;
        glow.light.intensity = 0.55 + pulse * 0.75;
        glow.sparks.rotation.y = now / 900 + glow.phase;
        glow.sparks.children.forEach((spark, i) => {
          spark.position.y = Math.sin(now / 400 + i * 1.7) * 0.3;
          spark.rotation.y = now / 200;
        });
      }
      if (!chest.userData.opened || chest.userData.openT >= 1) return;
      chest.userData.openT = Math.min(1, chest.userData.openT + dt * 2);
      const t = chest.userData.openT;
      chest.userData.lid.rotation.x = -(1 - Math.pow(1 - t, 3)) * 1.95;
      if (chest.userData.openT >= 1) {
        if (glow) {
          glow.light.intensity = 0;
          glow.aura.visible = false;
          glow.sparks.visible = false;
        }
        const meshes = [];
        chest.traverse((obj) => {
          if (obj.isMesh) meshes.push(obj);
        });
        meshes.forEach((mesh) => {
          if (!mesh.material || !mesh.material.color) return;
          mesh.material = mesh.material.clone();
          mesh.material.color.multiplyScalar(0.55);
          if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000);
        });
      }
    });

    const self = g.players.get(g.myId);
    let nearLoot = null;
    let nearDist = PICKUP_RANGE;
    g.loot.forEach((group) => {
      group.userData.sprite.position.y = 1 + Math.sin(now / 400 + group.userData.phase) * 0.15;
      const spinner = group.userData.spinner;
      if (spinner) {
        spinner.position.y = 0.95 + Math.sin(now / 400 + group.userData.phase) * 0.15;
        spinner.rotation.y = now / 700 + group.userData.phase;
      }
      if (!self || Math.abs(group.position.y - self.group.position.y) >= 2.5) return;
      const d = Math.hypot(group.position.x - self.group.position.x, group.position.z - self.group.position.z);
      if (d < nearDist) {
        nearDist = d;
        nearLoot = group.userData.entry;
      }
    });
    let rideText = "";
    if (self && self.vehicleId) {
      const vehicle = g.vehicles.get(self.vehicleId);
      rideText = vehicle && vehicle.spec.gun ? "R: get out · Click: fire tank gun" : "R: get out";
    } else if (self && self.mountId) rideText = "R: hop off";
    else if (self) {
      let nearVehicle = Infinity;
      g.vehicles.forEach((v) => {
        if (Math.abs(v.group.position.y - self.group.position.y) >= 2.5) return;
        const d = Math.hypot(v.group.position.x - self.group.position.x, v.group.position.z - self.group.position.z);
        if (d <= v.spec.radius + RIDE_REACH && d < nearVehicle) {
          nearVehicle = d;
          rideText = v.occupants >= v.spec.seats ? `${v.spec.label} is full` : `R: get in ${v.spec.label} (${v.occupants}/${v.spec.seats})`;
        }
      });
    }
    if (self && !rideText) {
      let best = Infinity;
      g.bbs.forEach((bb) => {
        if (bb.owner !== g.myId || !bbIsRideable(bb.def)) return;
        const d = Math.hypot(bb.group.position.x - self.group.position.x, bb.group.position.z - self.group.position.z);
        if (d <= bbFootRadius(bb.def) + RIDE_REACH && d < best) {
          best = d;
          rideText = `R: ride ${bb.def.name}`;
        }
      });
    }
    let doorText = "";
    if (self) {
      const door = nearestDoor(self);
      if (door) doorText = door.open ? "Enter: close door" : "Enter: open door";
    }
    const prompt = hud("prompt");
    prompt.textContent = [doorText, nearLoot ? `Enter / double-click: pick up ${nearLoot.amount ? `${nearLoot.amount} ` : ""}${nearLoot.item}` : "", rideText].filter(Boolean).join(" · ");
    prompt.classList.toggle("show", Boolean(doorText || nearLoot || rideText));

    const lightPhase = Math.floor(now / 2200) % 3;
    world.stoplightVisuals.forEach((entry) => {
      if (entry.broken || entry.state.broken) return;
      entry.bulbs.forEach((bulb, index) => {
        const on = index === lightPhase;
        bulb.material.emissive.setHex(on ? (index === 0 ? 0x991111 : index === 1 ? 0x665500 : 0x116611) : 0x000000);
      });
    });

    if (self) {
      const px = self.group.position.x;
      const py = self.group.position.y;
      const pz = self.group.position.z;
      const moveIntent = [...MOVEMENT_KEY_CODES].some((code) => g.keys.has(code));
      const stunned = g.me && g.me.stunMs > 0;
      const moved = Math.hypot(px - g.stuckPos.x, pz - g.stuckPos.z);
      if (moveIntent && !stunned && g.socketLive && moved > 0.08) {
        g.stuckMs = 0;
        g.stuckPos.set(px, py, pz);
      } else if (moveIntent && !stunned && g.socketLive) {
        g.stuckMs += dt * 1000;
      } else {
        g.stuckMs = 0;
        g.stuckPos.set(px, py, pz);
      }
      if (g.stuckMs > 1400 && moveIntent) {
        toast("Stuck? Release WASD and press again, or jump sideways", 2600);
        g.stuckMs = 0;
      }
      const cuts = new Map();
      map.buildings.forEach((b) => {
        const gapX = Math.abs(px - b.x) - b.w / 2;
        const gapZ = Math.abs(pz - b.z) - b.d / 2;
        if (gapX < 0.5 && gapZ < 0.5) cuts.set(b.id, BBMapGen.levelAt(b, py));
        else if (Math.max(0, gapX) < ROOF_HIDE_RANGE && Math.max(0, gapZ) < ROOF_HIDE_RANGE) cuts.set(b.id, b.stories - 1);
      });
      const key = [...cuts].map(([id, level]) => `${id}:${level}`).join(",");
      if (key !== g.cutKey) {
        const touched = new Set();
        const apply = (id, cut) => {
          world.levelParts.get(id).forEach((part) => {
            const show = part.level <= cut;
            if (part.object) {
              part.object.visible = show;
              return;
            }
            const broken = part.propId !== undefined && world.propVisuals.get(part.propId).state.broken;
            part.mesh.setMatrixAt(part.index, show && !broken ? part.matrix : HIDDEN_MATRIX);
            touched.add(part.mesh);
          });
        };
        g.cuts.forEach((_, id) => { if (!cuts.has(id)) apply(id, Infinity); });
        cuts.forEach((cut, id) => { if (g.cuts.get(id) !== cut) apply(id, cut); });
        touched.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
        g.cuts = cuts;
        g.cutKey = key;
      }
    }

    g.effects = g.effects.filter((effect) => {
      const age = (now - effect.born) / effect.life;
      if (age >= 1) {
        scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
        return false;
      }
      effect.mesh.scale.setScalar((0.2 + age * 1.4) * effect.size);
      effect.mesh.material.opacity = 0.7 * (1 - age);
      return true;
    });
  }

  function updateCamera(now, dt) {
    const self = g.players.get(g.myId);
    if (!self) return;
    const turnAmount = Math.abs(g.mouse.x) - MOUSE_TURN_DEADZONE;
    if (turnAmount > 0 && !g.shopOpen && !g.rightDrag) {
      g.camYaw -= Math.sign(g.mouse.x) * (turnAmount / (1 - MOUSE_TURN_DEADZONE)) * MOUSE_TURN_SPEED * dt;
    }
    const scopeFov = g.scope && g.me ? WEAPON_SCOPE_FOV[g.me.inv[g.me.held]] : undefined;
    const scoped = Boolean(scopeFov);
    const panGoal = scoped ? new THREE.Vector2(0, 0) : g.mouse;
    g.camPan.lerp(panGoal, Math.min(1, dt * 3));
    const sideX = -Math.cos(g.camYaw);
    const sideZ = Math.sin(g.camYaw);
    const panSide = g.camPan.x * CAMERA_PAN_SIDE;
    const panForward = g.camPan.y * CAMERA_PAN_FORWARD;
    const target = self.group.position.clone().add(new THREE.Vector3(
      sideX * panSide + Math.sin(g.camYaw) * panForward,
      1.6,
      sideZ * panSide + Math.cos(g.camYaw) * panForward
    ));
    const mount = self.mountId ? g.bbs.get(self.mountId) : null;
    const rideBoost = mount ? mount.model.height : self.vehicleId ? 2 : 0;
    const distance = scoped ? 4 : CAMERA_DISTANCE + rideBoost * 1.3;
    const height = scoped ? 3 : CAMERA_HEIGHT + rideBoost * 0.9;
    const desired = new THREE.Vector3(
      target.x - Math.sin(g.camYaw) * distance,
      target.y + height,
      target.z - Math.cos(g.camYaw) * distance
    );
    const minY = Math.max(BBMapGen.terrainHeight(map, desired.x, desired.z), self.group.position.y) + 1;
    desired.y = Math.max(desired.y, minY);
    camera.position.lerp(desired, Math.min(1, dt * 10));
    if (g.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * g.shake;
      camera.position.y += (Math.random() - 0.5) * g.shake;
      g.shake = Math.max(0, g.shake - dt * 1.5);
    }
    camera.lookAt(target);
    const fov = scoped ? scopeFov : 60;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    sun.position.set(target.x + 60, target.y + 120, target.z + 40);
    sun.target.position.copy(target);

    const aim = cursorGroundPoint();
    const dx = aim.x - self.group.position.x;
    const dz = aim.z - self.group.position.z;
    if (Math.hypot(dx, dz) > 0.6) g.aimYaw = Math.atan2(dx, dz);
    const flat = Math.max(0.5, Math.hypot(dx, dz));
    g.aimPitch = Math.atan2(aim.y + 1 - (self.group.position.y + 1.3), flat);
    const crosshair = hud("crosshair");
    const projected = aim.clone().project(camera);
    crosshair.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`;
    crosshair.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
  }

  function sendInput(now) {
    if (!g.socket || g.socket.readyState !== WebSocket.OPEN) return;
    g.socketLive = true;
    if (now - g.lastInputAt < INPUT_SEND_MS) return;
    g.lastInputAt = now;
    const k = g.keys;
    const forward = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const right = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    const fx = Math.sin(g.camYaw);
    const fz = Math.cos(g.camYaw);
    let mx = fx * forward + -fz * right;
    let mz = fz * forward + fx * right;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    sendMsg({
      t: "input",
      mx,
      mz,
      yaw: g.aimYaw,
      pitch: g.aimPitch,
      jump: k.has("Space"),
      sprint: k.has("ShiftLeft") || k.has("ShiftRight"),
      attack: g.attackHeld && !g.shopOpen
    });
  }

  let last = performance.now();
  function frame(now) {
    if (g.disposed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (battleTutorialUntil && now >= battleTutorialUntil) dismissBattleTutorial();
    updateEntities(now, dt);
    updateWorld(now, dt);
    updateCamera(now, dt);
    sendInput(now);
    renderer.render(scene, camera);
    g.raf = requestAnimationFrame(frame);
  }

  hud("map").textContent = BBMapGen.MAP_LABELS[map.id];
  focusMatchView();
  g.raf = requestAnimationFrame(frame);

  g.handleMessage = handleMessage;
  g.dispose = () => {
    g.disposed = true;
    cancelAnimationFrame(g.raf);
    g.listeners.forEach((off) => off());
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) [].concat(object.material).forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    });
    itemTextures.forEach((texture) => texture.dispose());
    renderer.dispose();
    root.innerHTML = "";
  };
  return g;
}

window.BBGame = {
  start(opts) {
    if (game) game.dispose();
    game = createGame(opts);
  },
  setSocket(socket) {
    if (game && socket) game.bindSocket(socket);
  },
  handleMessage(msg) {
    if (game) game.handleMessage(msg);
  },
  stop() {
    if (!game) return;
    game.dispose();
    game = null;
  }
};

const PREVIEW_YAW_STEP = Math.PI / 4;

function disposeObject(root) {
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) [].concat(object.material).forEach((material) => material.dispose());
  });
}

function makePreviewScene() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xdbeafe, 0x3b2a4a, 1.6));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
  key.position.set(3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7dd3fc, 1.1);
  rim.position.set(-4, 3, -4);
  scene.add(rim);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  scene.add(floor);
  return { scene, floor };
}

function buildPreviewBuddy(avatar, weapons, skinId) {
  const buddy = buildBuddy(avatar, skinId);
  buddy.stun.visible = false;
  const [first, second] = weapons || [];
  equipHeld(buddy, first);
  if (second && !TWO_HAND_HOLDS.has(buddy.hold)) {
    const left = heldItemModel(second);
    if (left && !TWO_HAND_HOLDS.has(left.hold)) {
      const leftHand = new THREE.Group();
      leftHand.position.set(0, -0.66, 0.02);
      left.group.rotation.x = left.hold === "one" ? ONE_HAND_MELEE_TILT : Math.PI / 2;
      leftHand.add(left.group);
      buddy.arms[0].add(leftHand);
    } else if (left) {
      disposeObject(left.group);
    }
  }
  if (buddy.hold === "gun") buddy.heldModel.rotation.x = Math.PI / 2;
  return buddy;
}

function frameCamera(camera, height, width) {
  const fov = (camera.fov * Math.PI) / 180;
  const fitHeight = (height * 1.18) / (2 * Math.tan(fov / 2));
  const fitWidth = (width * 1.18) / (2 * Math.tan(fov / 2) * camera.aspect);
  const distance = Math.max(fitHeight, fitWidth, 3.2);
  camera.position.set(0, height * 0.55, distance);
  camera.lookAt(0, height * 0.47, 0);
}

let snapshotRig = null;
const snapshotCache = new Map();

function getSnapshotRig() {
  if (!snapshotRig) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    const camera = new THREE.PerspectiveCamera(30, 4 / 5, 0.1, 50);
    snapshotRig = { renderer, camera, ...makePreviewScene() };
  }
  return snapshotRig;
}

function buddyPortrait(avatar, skinId = "", size = 192) {
  const key = `portrait:${avatar}:${size}:${skinId}`;
  if (snapshotCache.has(key)) return snapshotCache.get(key);
  const { renderer, camera, scene, floor } = getSnapshotRig();
  renderer.setSize(size, size, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  const buddy = buildPreviewBuddy(avatar, [], skinId);
  buddy.group.rotation.y = -0.3;
  if (buddy.tick) buddy.tick(1200);
  scene.add(buddy.group);
  floor.visible = false;
  camera.position.set(0, 1.82, 2.4);
  camera.lookAt(0, 1.74, 0);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  floor.visible = true;
  scene.remove(buddy.group);
  disposeObject(buddy.group);
  snapshotCache.set(key, url);
  return url;
}

function buddySnapshot(avatar, size = 160, skinId = "") {
  const key = `${avatar}:${size}:${skinId}`;
  if (snapshotCache.has(key)) return snapshotCache.get(key);
  const { renderer, camera, scene, floor } = getSnapshotRig();
  renderer.setSize(Math.round(size * 0.8), size, false);
  camera.aspect = 4 / 5;
  camera.updateProjectionMatrix();
  const buddy = buildPreviewBuddy(avatar, [], skinId);
  buddy.group.rotation.y = -0.35;
  buddy.arms[0].rotation.x = 0.12;
  buddy.arms[1].rotation.x = -0.12;
  if (buddy.tick) buddy.tick(1200);
  scene.add(buddy.group);
  floor.scale.setScalar(0.55);
  frameCamera(camera, skinId ? 2.55 : 2.2, skinId ? 1.5 : 1);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  scene.remove(buddy.group);
  disposeObject(buddy.group);
  snapshotCache.set(key, url);
  return url;
}

function mountBuddyPreview(container, opts) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.className = "gear-preview-canvas";
  const camera = new THREE.PerspectiveCamera(30, 3 / 4, 0.1, 200);
  const { scene, floor } = makePreviewScene();
  const stage = new THREE.Group();
  scene.add(stage);

  const view = { avatar: "", weapons: "", skin: "", bb: "", yaw: 0, shownYaw: 0, buddy: null, bbModel: null, height: 2.2, width: 1 };
  let raf = 0;
  let disposed = false;

  function rebuild(next) {
    const weaponsKey = JSON.stringify(next.weapons || []);
    const bbName = next.bb || "";
    const skinId = next.skin || "";
    if (next.avatar !== view.avatar || weaponsKey !== view.weapons || skinId !== view.skin) {
      if (view.buddy) {
        stage.remove(view.buddy.group);
        disposeObject(view.buddy.group);
      }
      view.buddy = buildPreviewBuddy(next.avatar, next.weapons, skinId);
      stage.add(view.buddy.group);
      view.avatar = next.avatar;
      view.weapons = weaponsKey;
      view.skin = skinId;
    }
    if (bbName !== view.bb) {
      if (view.bbModel) {
        stage.remove(view.bbModel.group);
        view.bbModel.disposables.forEach((material) => material.dispose());
      }
      view.bbModel = null;
      const def = bbName ? BB_CATALOG.find((entry) => entry.name === bbName) : null;
      if (def) {
        view.bbModel = buildBbModel(bbModelSpec(def), def.size * BB_CHARACTER_HEIGHT);
        stage.add(view.bbModel.group);
      }
      view.bb = bbName;
    }
    const bb = view.bbModel;
    if (bb) {
      const gap = 0.35;
      const total = 0.9 + gap + bb.radius * 2;
      view.buddy.group.position.x = -total / 2 + 0.45;
      bb.group.position.set(total / 2 - bb.radius, 0, -0.2);
      bb.group.rotation.y = -0.5;
      view.height = Math.max(2.6, bb.height);
      view.width = total + 0.9;
    } else {
      view.buddy.group.position.x = 0;
      view.height = view.skin ? 2.6 : 2.2;
      view.width = view.skin ? 1.8 : 1.2;
    }
    floor.scale.setScalar(Math.max(0.7, view.width * 0.55));
    if (typeof next.yaw === "number") view.yaw = next.yaw;
  }

  function resize() {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 400;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    frameCamera(camera, view.height, view.width);
  }

  function frame(now) {
    if (disposed) return;
    const target = -view.yaw * PREVIEW_YAW_STEP;
    view.shownYaw = lerpAngle(view.shownYaw, target, 0.18);
    stage.rotation.y = view.shownYaw;
    if (view.buddy) {
      const breathe = Math.sin(now / 520);
      view.buddy.group.position.y = Math.abs(breathe) * 0.02;
      if (TWO_HAND_HOLDS.has(view.buddy.hold)) {
        poseArms(view.buddy, 0, false, now);
        view.buddy.twoHand.rotation.x += breathe * 0.03;
      } else {
        view.buddy.arms[0].rotation.x = 0.08 + breathe * 0.05;
        view.buddy.arms[1].rotation.x = -0.08 - breathe * 0.05;
      }
      if (view.buddy.tick) view.buddy.tick(now);
    }
    if (view.bbModel && view.bb && (BB_CATALOG.find((entry) => entry.name === view.bb)?.size || 1) < 1) {
      view.bbModel.group.position.y = Math.abs(Math.sin(now / 200)) * 0.06;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  rebuild(opts);
  view.shownYaw = -view.yaw * PREVIEW_YAW_STEP;
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  raf = requestAnimationFrame(frame);

  return {
    update(next) {
      rebuild({ avatar: view.avatar, weapons: JSON.parse(view.weapons), skin: view.skin, bb: view.bb, yaw: view.yaw, ...next });
      resize();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      disposeObject(scene);
      if (view.bbModel) view.bbModel.disposables.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}

window.BBBuddyPreview = { snapshot: buddySnapshot, portrait: buddyPortrait, mount: mountBuddyPreview };
window.dispatchEvent(new Event("bb3d-ready"));
