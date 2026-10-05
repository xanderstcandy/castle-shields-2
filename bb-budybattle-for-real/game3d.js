import * as THREE from "./vendor/three.module.js";
import { buildBbModel } from "./bb-models.js";

const INTERP_DELAY_MS = 100;
const INPUT_SEND_MS = 50;
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

function heldItemMesh(name) {
  if (!name) return null;
  const group = new THREE.Group();
  if (isPotionName(name)) {
    const tint = name.includes("Red") ? 0xef4444 : name.includes("Fire") ? 0xf97316 : name.includes("Health") ? 0x22c55e : name.includes("Water") ? 0x38bdf8 : 0x3b82f6;
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.28, 10), new THREE.MeshLambertMaterial({ color: tint, transparent: true, opacity: 0.85 }));
    group.add(bottle);
    return group;
  }
  if (WEAPON_PASSIVE.includes(name)) return null;
  const ranged = getWeaponRanged(name);
  if (ranged) {
    const bow = /bow/i.test(name);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bow ? 0.08 : 0.12, bow ? 0.7 : 0.16, bow ? 0.1 : (name.includes("Sniper") || name.includes("Rifle") ? 0.9 : 0.5)),
      new THREE.MeshLambertMaterial({ color: bow ? 0x8b5a2b : name === "Energy Pistol" ? 0x22d3ee : 0x334155 })
    );
    body.position.z = bow ? 0.1 : 0.25;
    group.add(body);
    return group;
  }
  const length = 0.35 + Math.min(1.1, getWeaponDamage(name) / 30);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.09, length),
    new THREE.MeshLambertMaterial({ color: /Laser|Plasma/.test(name) ? 0x60a5fa : /Bat|Stick|Staff|Pin|Broom|Rake|Hoe|Shovel|Club/.test(name) ? 0xa16207 : 0xcbd5e1, emissive: /Laser|Plasma/.test(name) ? 0x1d4ed8 : 0x000000 })
  );
  blade.position.z = length / 2 + 0.08;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.2), new THREE.MeshLambertMaterial({ color: 0x4b2e12 }));
  group.add(blade, handle);
  return group;
}

function buildBuddy(avatar, skinId) {
  const look = AVATAR_LOOKS[avatar] || AVATAR_LOOKS["boy-1"];
  const outfit = skinId ? findSkin(skinId) : null;
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
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
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
  hand.position.set(0, -0.66, 0.05);
  arms[1].add(hand);
  const extras = outfit ? addSkinParts(group, outfit, { box, mat, head, arms, hairParts: [hairTop, hairBack] }) : { tick: null };
  return { group, legs, arms, hand, stun, materials, tick: extras.tick };
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

function buildWorld(scene, map) {
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const walls = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), map.walls.length);
  map.walls.forEach((wall, index) => {
    dummy.position.set(wall.x, wall.y + wall.h / 2, wall.z);
    dummy.scale.set(wall.w, wall.h, wall.d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    walls.setMatrixAt(index, dummy.matrix);
    walls.setColorAt(index, color.set(map.buildings[Math.floor(index / 5)].color));
  });
  scene.add(walls);

  const roofs = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), map.buildings.length);
  const floors = buildInstanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x8b6b4a }), map.buildings.length, false);
  const roofMatrices = [];
  map.buildings.forEach((b, index) => {
    dummy.position.set(b.x, b.floor + b.h + 0.25, b.z);
    dummy.scale.set(b.w + 0.6, 0.5, b.d + 0.6);
    dummy.updateMatrix();
    roofs.setMatrixAt(index, dummy.matrix);
    roofMatrices.push(dummy.matrix.clone());
    roofs.setColorAt(index, color.set(b.roof));
    dummy.position.set(b.x, b.floor + 0.02, b.z);
    dummy.scale.set(b.w - 0.4, 0.1, b.d - 0.4);
    dummy.updateMatrix();
    floors.setMatrixAt(index, dummy.matrix);
  });
  scene.add(roofs, floors);

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
  });
  rounds.forEach((tree, index) => {
    const ground = BBMapGen.terrainHeight(map, tree.x, tree.z);
    dummy.position.set(tree.x, ground + tree.height * 0.75, tree.z);
    dummy.scale.setScalar(tree.height * 0.32);
    dummy.updateMatrix();
    roundTops.setMatrixAt(index, dummy.matrix);
  });
  pines.forEach((tree, index) => {
    const ground = BBMapGen.terrainHeight(map, tree.x, tree.z);
    dummy.position.set(tree.x, ground + tree.height * 0.7, tree.z);
    dummy.scale.set(tree.height * 0.28, tree.height * 0.75, tree.height * 0.28);
    dummy.updateMatrix();
    pineTops.setMatrixAt(index, dummy.matrix);
  });
  scene.add(trunks, roundTops, pineTops);

  const rocks = buildInstanced(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8a8580, flatShading: true }), map.rocks.length);
  map.rocks.forEach((rock, index) => {
    dummy.position.set(rock.x, BBMapGen.terrainHeight(map, rock.x, rock.z) + rock.radius * 0.4, rock.z);
    dummy.scale.set(rock.radius, rock.radius * 0.7, rock.radius);
    dummy.rotation.set(0, rock.x, 0);
    dummy.updateMatrix();
    rocks.setMatrixAt(index, dummy.matrix);
  });
  dummy.rotation.set(0, 0, 0);
  scene.add(rocks);

  const chests = new Map();
  const chestBody = new THREE.BoxGeometry(1.1, 0.6, 0.75);
  const chestLid = new THREE.BoxGeometry(1.14, 0.25, 0.79);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const lidMat = new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0x3a2a00 });
  map.chests.forEach((chest) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(chestBody, bodyMat);
    body.position.y = 0.3;
    body.castShadow = true;
    const lid = new THREE.Mesh(chestLid, lidMat);
    lid.position.y = 0.72;
    lid.castShadow = true;
    group.add(body, lid);
    const inside = BBMapGen.buildingAt(map, chest.x, chest.z);
    group.position.set(chest.x, inside ? inside.floor + 0.05 : BBMapGen.terrainHeight(map, chest.x, chest.z), chest.z);
    group.rotation.y = (chest.id * 1.7) % (Math.PI * 2);
    group.userData = { lid, opened: false, openT: 0 };
    scene.add(group);
    chests.set(chest.id, group);
  });

  return { roofs, roofMatrices, chests };
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
      <div class="mh-chip mh-hazard" data-hud-hazard></div>
    </div>
    <div class="mh-feed" data-hud-feed></div>
    <div class="mh-warning" data-hud-warning></div>
    <div class="mh-toast" data-hud-toast></div>
    <div class="mh-prompt" data-hud-prompt></div>
    <div class="mh-hotbar" data-hud-hotbar></div>
    <div class="mh-help">WASD / arrows move · mouse aims · click attack · Space jump · 1-8 or wheel switch · Enter or double-click pick up · B shop · R ride big B.B.s · Q/E or right-drag turn camera · Z scope</div>
    </div>
    <div class="mh-shop" data-hud-shop hidden></div>
  `);
}

function createGame({ root, socket, start }) {
  const map = BBMapGen.generateMap(start.map, start.seed);
  const palette = SKY[start.map];
  const roster = new Map(start.roster.map((entry) => [entry.id, entry]));
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(root.clientWidth || window.innerWidth, root.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "match-canvas";
  root.appendChild(renderer.domElement);

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

  renderHudShell(root);
  const hud = (key) => root.querySelector(`[data-hud-${key}]`);
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
    projectiles: new Map(),
    loot: new Map(),
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
    hiddenRoofs: new Set(),
    hiddenRoofsKey: "",
    shake: 0,
    raf: 0,
    lastInputAt: 0,
    lastClickAt: 0,
    listeners: [],
    disposed: false
  };

  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    g.listeners.push(() => target.removeEventListener(type, handler, opts));
  };

  const sendMsg = (payload) => {
    if (g.socket.readyState === WebSocket.OPEN) g.socket.send(JSON.stringify(payload));
  };

  function toast(text) {
    const el = hud("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(g.toastTimer);
    g.toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
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
      new THREE.MeshBasicMaterial({ color: isPotionName(entry.item) ? 0xa855f7 : 0xfacc15, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    group.add(sprite, ring);
    const inside = BBMapGen.buildingAt(map, entry.x, entry.z);
    group.position.set(entry.x, Math.max(entry.y, inside ? inside.floor : -99), entry.z);
    group.userData = { entry, sprite, phase: Math.random() * 6 };
    scene.add(group);
    g.loot.set(entry.id, group);
  }

  function removeLoot(id) {
    const group = g.loot.get(id);
    if (!group) return;
    scene.remove(group);
    g.loot.delete(id);
  }

  function openChest(id) {
    const chest = world.chests.get(id);
    if (!chest || chest.userData.opened) return;
    chest.userData.opened = true;
    spawnPoof(chest.position.x, chest.position.y + 0.8, chest.position.z, 0xfde68a, 1.4);
  }

  function ensurePlayer(id) {
    if (g.players.has(id)) return g.players.get(id);
    const info = roster.get(id) || { name: "Buddy", avatar: "boy-1" };
    const buddy = buildBuddy(info.avatar, info.skin);
    const tag = makeTextSprite(info.name, id === g.myId ? "#86efac" : info.bot ? "#e2e8f0" : "#7dd3fc");
    tag.position.y = 2.75;
    tag.visible = id !== g.myId;
    buddy.group.add(tag);
    scene.add(buddy.group);
    const entry = { ...buddy, tag, hp: -1, held: null, heldName: "", walk: 0, flashUntil: 0, lastPos: new THREE.Vector3() };
    g.players.set(id, entry);
    return entry;
  }

  function ensureBb(id, catalogIndex, owner) {
    if (g.bbs.has(id)) return g.bbs.get(id);
    const def = BB_CATALOG[catalogIndex];
    const model = buildBbModel(bbModelSpec(def), def.size * BB_CHARACTER_HEIGHT);
    const group = new THREE.Group();
    group.add(model.group);
    if (owner === g.myId) {
      const inner = model.radius * 0.95 + 0.1;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, inner + 0.12 + model.radius * 0.08, 28),
        new THREE.MeshBasicMaterial({ color: bbIsRideable(def) ? 0xfacc15 : 0x4ade80, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.06;
      group.add(ring);
    }
    scene.add(group);
    const entry = { group, model, def, owner, flashUntil: 0, flashing: false, walk: 0, lastPos: new THREE.Vector3() };
    g.bbs.set(id, entry);
    return entry;
  }

  function applyEvents(events) {
    events.forEach((ev) => {
      if (ev.k === "loot+") addLoot(ev);
      else if (ev.k === "loot-") removeLoot(ev.id);
      else if (ev.k === "chest") openChest(ev.id);
      else if (ev.k === "kill") {
        const victim = nameOf(ev.b);
        addFeed(ev.a ? `${nameOf(ev.a)} knocked out ${victim}` : `${victim} — ${ev.cause || "out"}`);
        const entry = g.players.get(ev.b);
        if (entry) spawnPoof(entry.group.position.x, entry.group.position.y + 1, entry.group.position.z, 0xffffff, 2);
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
      } else if (ev.k === "drink" && ev.id === g.myId) {
        toast(`Drank ${ev.item}`);
      }
    });
  }

  function handleMessage(msg) {
    if (msg.t === "state") {
      msg.loot.forEach(addLoot);
      msg.chestsOpen.forEach(openChest);
    } else if (msg.t === "snap") {
      const players = new Map(msg.players.map((row) => [row[0], row]));
      const bbs = new Map(msg.bbs.map((row) => [row[0], row]));
      g.snaps.push({ time: performance.now(), players, bbs, proj: msg.proj, rocks: msg.rocks });
      if (g.snaps.length > 6) g.snaps.shift();
      g.serverElapsed = msg.e;
      g.serverElapsedAt = performance.now();
      g.me = msg.me;
      g.alive = msg.alive;
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
    hud("map").textContent = BBMapGen.MAP_LABELS[map.id];
    hud("alive").textContent = `${g.alive} alive`;
    hud("kills").textContent = `${me.kills} KO`;
    hud("coins").innerHTML = `${shopCoinSvg()} ${me.coins}`;

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
          <button type="button" class="mh-shop-close" data-hud-shop-close>Close (B)</button>
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
    for (let t = 1; t < 320; t += 0.75) {
      ray.at(t, point);
      if (point.y <= BBMapGen.terrainHeight(map, point.x, point.z)) return point;
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
    if (event.repeat && !["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) return;
    const code = event.code;
    if (code === "KeyB") {
      toggleShop();
      return;
    }
    if (code === "Escape" && g.shopOpen) {
      toggleShop(false);
      return;
    }
    if (code === "Enter" || code === "NumpadEnter") {
      sendMsg({ t: "pickup" });
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
  });
  on(window, "keyup", (event) => g.keys.delete(event.code));
  on(window, "blur", () => {
    g.keys.clear();
    g.attackHeld = false;
  });

  const canvas = renderer.domElement;
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
    if (event.button === 2) {
      g.rightDrag = event.clientX;
      return;
    }
    if (event.button !== 0 || g.shopOpen) return;
    g.attackHeld = true;
  });
  on(window, "mouseup", (event) => {
    if (event.button === 2) g.rightDrag = null;
    if (event.button === 0) g.attackHeld = false;
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
      entry.walk += entry.mountId ? 0 : speed * dt * 2.2;
      const swing = speed > 0.5 && !entry.mountId ? Math.sin(entry.walk) * 0.7 : 0;
      entry.legs[0].rotation.x = entry.mountId ? -1.45 : swing;
      entry.legs[1].rotation.x = entry.mountId ? -1.45 : -swing;
      entry.arms[0].rotation.x = -swing * 0.6;
      const heldName = row[7];
      const ranged = heldName && getWeaponRanged(heldName);
      const attacking = row[9] === 1;
      entry.arms[1].rotation.x = attacking ? (ranged ? -1.5 : -2.2 + Math.sin(now / 40) * 1.2) : ranged ? -1.35 : swing * 0.6;
      if (entry.heldName !== heldName) {
        entry.heldName = heldName;
        entry.hand.clear();
        const mesh = heldItemMesh(heldName);
        if (mesh) {
          mesh.rotation.x = ranged ? 0 : Math.PI / 2;
          entry.hand.add(mesh);
        }
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
      const entry = ensureBb(id, row[2], row[1]);
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
    latest.proj.forEach(([id, x, y, z]) => {
      liveProj.add(id);
      let mesh = g.projectiles.get(id);
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff1a8 }));
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
    const hazard = BBMapGen.hazardAt(map.id, elapsed);
    g.displayWater += (hazard.waterLevel - g.displayWater) * Math.min(1, dt * 0.8);
    g.displayLava += (hazard.lavaRadius - g.displayLava) * Math.min(1, dt * 0.8);
    water.position.y = g.displayWater + Math.sin(now / 900) * 0.05;
    overlay.material.uniforms.lavaRadius.value = g.displayLava;
    overlay.material.uniforms.time.value = now / 1000;
    const label = hazard.kind === "water" ? "Water rises" : "Lava spreads";
    hud("hazard").textContent = `${label} in ${formatMs(hazard.nextStepMs)}`;

    world.chests.forEach((chest) => {
      if (!chest.userData.opened || chest.userData.openT >= 1) return;
      chest.userData.openT = Math.min(1, chest.userData.openT + dt * 2);
      chest.userData.lid.rotation.x = -chest.userData.openT * 1.9;
      chest.userData.lid.position.set(0, 0.72 + chest.userData.openT * 0.15, -chest.userData.openT * 0.3);
      if (chest.userData.openT >= 1) {
        chest.children.forEach((mesh) => {
          mesh.material = mesh.material.clone();
          mesh.material.color.multiplyScalar(0.55);
          mesh.material.emissive.setHex(0x000000);
        });
      }
    });

    const self = g.players.get(g.myId);
    let nearLoot = null;
    let nearDist = PICKUP_RANGE;
    g.loot.forEach((group) => {
      group.userData.sprite.position.y = 1 + Math.sin(now / 400 + group.userData.phase) * 0.15;
      if (!self) return;
      const d = Math.hypot(group.position.x - self.group.position.x, group.position.z - self.group.position.z);
      if (d < nearDist) {
        nearDist = d;
        nearLoot = group.userData.entry;
      }
    });
    let rideText = "";
    if (self && self.mountId) rideText = "R: hop off";
    else if (self) {
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
    const prompt = hud("prompt");
    prompt.textContent = [nearLoot ? `Enter / double-click: pick up ${nearLoot.item}` : "", rideText].filter(Boolean).join(" · ");
    prompt.classList.toggle("show", Boolean(nearLoot || rideText));

    if (self) {
      const px = self.group.position.x;
      const pz = self.group.position.z;
      const near = new Set(map.buildings
        .filter((b) => Math.max(0, Math.abs(px - b.x) - b.w / 2) < ROOF_HIDE_RANGE && Math.max(0, Math.abs(pz - b.z) - b.d / 2) < ROOF_HIDE_RANGE)
        .map((b) => b.id));
      const key = [...near].join(",");
      if (key !== g.hiddenRoofsKey) {
        g.hiddenRoofs.forEach((id) => { if (!near.has(id)) world.roofs.setMatrixAt(id, world.roofMatrices[id]); });
        near.forEach((id) => world.roofs.setMatrixAt(id, HIDDEN_MATRIX));
        world.roofs.instanceMatrix.needsUpdate = true;
        g.hiddenRoofs = near;
        g.hiddenRoofsKey = key;
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
    if (g.keys.has("KeyQ")) g.camYaw += dt * 2.2;
    if (g.keys.has("KeyE")) g.camYaw -= dt * 2.2;
    const turnAmount = Math.abs(g.mouse.x) - MOUSE_TURN_DEADZONE;
    if (turnAmount > 0 && !g.shopOpen && !g.rightDrag) {
      g.camYaw -= Math.sign(g.mouse.x) * (turnAmount / (1 - MOUSE_TURN_DEADZONE)) * MOUSE_TURN_SPEED * dt;
    }
    const scoped = g.scope && g.me && g.me.inv[g.me.held] === "Sniper Rifle";
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
    const rideBoost = mount ? mount.model.height : 0;
    const distance = scoped ? 4 : CAMERA_DISTANCE + rideBoost * 1.3;
    const height = scoped ? 3 : CAMERA_HEIGHT + rideBoost * 0.9;
    const desired = new THREE.Vector3(
      target.x - Math.sin(g.camYaw) * distance,
      target.y + height,
      target.z - Math.cos(g.camYaw) * distance
    );
    const minY = BBMapGen.terrainHeight(map, desired.x, desired.z) + 1;
    desired.y = Math.max(desired.y, minY);
    camera.position.lerp(desired, Math.min(1, dt * 10));
    if (g.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * g.shake;
      camera.position.y += (Math.random() - 0.5) * g.shake;
      g.shake = Math.max(0, g.shake - dt * 1.5);
    }
    camera.lookAt(target);
    const fov = scoped ? 22 : 60;
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
      attack: g.attackHeld && !g.shopOpen
    });
  }

  let last = performance.now();
  function frame(now) {
    if (g.disposed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    updateEntities(now, dt);
    updateWorld(now, dt);
    updateCamera(now, dt);
    sendInput(now);
    renderer.render(scene, camera);
    g.raf = requestAnimationFrame(frame);
  }

  hud("map").textContent = BBMapGen.MAP_LABELS[map.id];
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
    if (game) game.socket = socket;
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
  const right = heldItemMesh(first);
  if (right) {
    right.rotation.x = getWeaponRanged(first) ? 0 : Math.PI / 2;
    buddy.hand.add(right);
  }
  if (second) {
    const left = heldItemMesh(second);
    if (left) {
      const leftHand = new THREE.Group();
      leftHand.position.set(0, -0.66, 0.05);
      left.rotation.x = getWeaponRanged(second) ? 0 : Math.PI / 2;
      leftHand.add(left);
      buddy.arms[0].add(leftHand);
    }
  }
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
      view.buddy.arms[0].rotation.x = 0.08 + breathe * 0.05;
      view.buddy.arms[1].rotation.x = -0.08 - breathe * 0.05;
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
