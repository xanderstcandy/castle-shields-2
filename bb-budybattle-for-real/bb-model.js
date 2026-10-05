import * as THREE from "./vendor/three.module.js";

const PLAYER_HEIGHT = typeof BB_PLAYER_HEIGHT === "number" ? BB_PLAYER_HEIGHT : 2.1;

function mat(color, emissive = 0) {
  return new THREE.MeshLambertMaterial({ color, emissive, flatShading: true });
}

function box(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function hashColor(seed, shift = 0) {
  const n = Math.abs(Math.sin((seed + 1) * 12.9898 + shift * 78.233) * 43758.5453);
  const hue = (n % 1) * 360;
  return new THREE.Color().setHSL(hue / 360, 0.55, 0.48).getHex();
}

function buildAnimal(group, variant, primary, secondary, scale) {
  const body = box(0.55, 0.38, 0.85, mat(primary));
  body.position.y = 0.42 * scale;
  group.add(body);
  const head = box(0.32, 0.3, 0.36, mat(secondary));
  head.position.set(0, 0.58 * scale, 0.42 * scale);
  group.add(head);
  [[-0.22, 0.18], [0.22, 0.18], [-0.22, -0.22], [0.22, -0.22]].forEach(([x, z], leg) => {
    const legMesh = box(0.12, 0.34, 0.12, mat(leg % 2 ? secondary : primary));
    legMesh.position.set(x * scale, 0.17 * scale, z * scale);
    group.add(legMesh);
  });
  if (variant % 4 === 0) {
    const tail = box(0.1, 0.1, 0.45, mat(secondary));
    tail.position.set(0, 0.45 * scale, -0.55 * scale);
    group.add(tail);
  }
  if (variant % 5 === 1) {
    const earL = box(0.08, 0.16, 0.06, mat(secondary));
    earL.position.set(-0.14 * scale, 0.72 * scale, 0.38 * scale);
    const earR = earL.clone();
    earR.position.x *= -1;
    group.add(earL, earR);
  }
}

function buildPlant(group, variant, primary, secondary, scale) {
  const pot = box(0.42, 0.22, 0.42, mat(0x78350f));
  pot.position.y = 0.11 * scale;
  group.add(pot);
  const stem = box(0.12, 0.55 + (variant % 3) * 0.15, 0.12, mat(0x166534));
  stem.position.y = 0.45 * scale;
  group.add(stem);
  if (variant % 3 === 0) {
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.32 * scale, 6, 5), mat(primary));
    top.position.y = 0.82 * scale;
    group.add(top);
  } else if (variant % 3 === 1) {
    [-0.2, 0, 0.2].forEach((x, i) => {
      const leaf = box(0.28, 0.08, 0.14, mat(i % 2 ? primary : secondary));
      leaf.position.set(x * scale, (0.55 + i * 0.12) * scale, 0);
      leaf.rotation.y = x * 0.6;
      group.add(leaf);
    });
  } else {
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38 * scale, 0.28 * scale, 6), mat(primary));
    cap.position.y = 0.78 * scale;
    const stalk = box(0.18, 0.18, 0.18, mat(secondary));
    stalk.position.y = 0.62 * scale;
    group.add(cap, stalk);
  }
}

function buildDinosaur(group, variant, primary, secondary, scale) {
  const body = box(0.7, 0.45, 1.05, mat(primary));
  body.position.y = 0.55 * scale;
  group.add(body);
  const neck = box(0.22, 0.42, 0.22, mat(secondary));
  neck.position.set(0, 0.78 * scale, 0.48 * scale);
  neck.rotation.x = -0.35;
  group.add(neck);
  const head = box(0.34, 0.26, 0.42, mat(secondary));
  head.position.set(0, 0.98 * scale, 0.62 * scale);
  group.add(head);
  const tail = box(0.18, 0.16, 0.75, mat(primary));
  tail.position.set(0, 0.48 * scale, -0.72 * scale);
  tail.rotation.x = 0.15;
  group.add(tail);
  [[-0.26, 0.28], [0.26, 0.28], [-0.26, -0.18], [0.26, -0.18]].forEach(([x, z]) => {
    const leg = box(0.16, 0.42, 0.16, mat(0x57534e));
    leg.position.set(x * scale, 0.21 * scale, z * scale);
    group.add(leg);
  });
  if (variant % 4 === 2) {
    const plate = box(0.08, 0.22, 0.14, mat(0xfacc15));
    plate.position.set(0, 0.72 * scale, 0);
    group.add(plate);
  }
  if (variant % 5 === 3) {
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), mat(0xf8fafc));
    hornL.position.set(-0.1 * scale, 1.08 * scale, 0.72 * scale);
    const hornR = hornL.clone();
    hornR.position.x *= -1;
    group.add(hornL, hornR);
  }
}

function buildLegacyBlob(group, primary, secondary, scale) {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 8, 6), mat(primary));
  body.position.y = 0.38 * scale;
  group.add(body);
  const eye = mat(0x0b1220);
  [-0.1, 0.1].forEach((x) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 4, 4), eye);
    e.position.set(x * scale, 0.48 * scale, 0.28 * scale);
    group.add(e);
  });
  const accent = box(0.12, 0.12, 0.12, mat(secondary));
  accent.position.set(0, 0.62 * scale, 0.2 * scale);
  group.add(accent);
}

export function buildBbMesh(def, catalogIndex = 0) {
  const group = new THREE.Group();
  const sizeScale = def.sizeScale ?? 1;
  const height = PLAYER_HEIGHT * sizeScale;
  const primary = hashColor(catalogIndex, 0);
  const secondary = hashColor(catalogIndex, 1);
  const kind = def.creatureKind;
  const variant = def.creatureVariant ?? catalogIndex;
  if (kind === "animal") buildAnimal(group, variant, primary, secondary, sizeScale);
  else if (kind === "plant") buildPlant(group, variant, primary, secondary, sizeScale);
  else if (kind === "dinosaur") buildDinosaur(group, variant, primary, secondary, sizeScale);
  else buildLegacyBlob(group, primary, secondary, sizeScale);
  group.scale.setScalar(height / (PLAYER_HEIGHT * (kind === "plant" ? 0.85 : 1)));
  group.userData.height = height;
  group.userData.rideY = height * 0.62;
  return group;
}

export function bbMountOffset(def) {
  const sizeScale = def.sizeScale ?? 1;
  return PLAYER_HEIGHT * sizeScale * 0.62;
}
