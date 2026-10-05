import * as THREE from "./vendor/three.module.js";

const GEO = new Map();
const geo = (key, make) => {
  if (!GEO.has(key)) GEO.set(key, make());
  return GEO.get(key);
};
const G = {
  sphere: () => geo("sphere", () => new THREE.SphereGeometry(1, 16, 12)),
  dome: () => geo("dome", () => new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
  box: () => geo("box", () => new THREE.BoxGeometry(1, 1, 1)),
  cyl: (taper) => geo(`cyl${taper}`, () => new THREE.CylinderGeometry(taper, 1, 1, 14)),
  hex: () => geo("hex", () => new THREE.CylinderGeometry(1, 1, 1, 6)),
  cone: () => geo("cone", () => new THREE.ConeGeometry(1, 1, 12)),
  pyramid: () => geo("pyramid", () => new THREE.ConeGeometry(1, 1, 4)),
  ico: () => geo("ico", () => new THREE.IcosahedronGeometry(1, 0)),
  octa: () => geo("octa", () => new THREE.OctahedronGeometry(1, 0)),
  torus: (arc) => geo(`torus${arc}`, () => new THREE.TorusGeometry(1, 0.22, 8, 24, arc)),
  ring: () => geo("ring", () => new THREE.TorusGeometry(1, 0.05, 6, 28)),
  star: () => geo("star", () => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 ? 0.45 : 1;
      const angle = Math.PI / 2 + (i * Math.PI) / 5;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 2 });
    g.translate(0, 0, -0.25);
    return g;
  })
};

const UP = new THREE.Vector3(0, 1, 0);

function makeKit(a, b) {
  const root = new THREE.Group();
  const materials = [];
  const lambert = (color) => {
    const m = new THREE.MeshLambertMaterial({ color });
    materials.push(m);
    return m;
  };
  const kit = {
    root,
    materials,
    mat: lambert,
    A: lambert(a),
    B: lambert(b),
    dark: lambert("#0b1220"),
    white: lambert("#ffffff"),
    put(geometry, material, p, scale = 1, rot = null) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(p[0], p[1], p[2]);
      if (Array.isArray(scale)) mesh.scale.set(scale[0], scale[1], scale[2]);
      else mesh.scale.setScalar(scale);
      if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
      mesh.castShadow = true;
      root.add(mesh);
      return mesh;
    },
    sphere(m, p, r, rot) {
      return kit.put(G.sphere(), m, p, r, rot);
    },
    dome(m, p, r, rot) {
      return kit.put(G.dome(), m, p, r, rot);
    },
    box(m, p, s, rot) {
      return kit.put(G.box(), m, p, s, rot);
    },
    cyl(m, p, r, h, taper = 1, rot) {
      return kit.put(G.cyl(taper), m, p, [r, h, r], rot);
    },
    between(geometry, m, from, to, r) {
      const start = new THREE.Vector3(...from);
      const dir = new THREE.Vector3(...to).sub(start);
      const length = dir.length() || 0.001;
      const mesh = kit.put(geometry, m, start.clone().addScaledVector(dir, 0.5).toArray(), [r, length, r]);
      mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
      return mesh;
    },
    limb(m, from, to, r, taper = 1) {
      return kit.between(G.cyl(Math.round(taper * 20) / 20), m, from, to, r);
    },
    spike(m, from, to, r) {
      return kit.between(G.cone(), m, from, to, r);
    },
    chain(m, points, r0, r1 = r0) {
      for (let i = 0; i < points.length - 1; i += 1) {
        const t0 = i / (points.length - 1);
        const t1 = (i + 1) / (points.length - 1);
        const ra = r0 + (r1 - r0) * t0;
        const rb = r0 + (r1 - r0) * t1;
        kit.limb(m, points[i], points[i + 1], ra, rb / ra);
        kit.sphere(m, points[i + 1], rb);
      }
    },
    face(style, p, s) {
      if (!style || style === "none") return;
      const [x, y, z] = p;
      const er = s * 0.15;
      const ex = s * 0.36;
      const ey = y + s * 0.12;
      const eye = (dx, r = er) => {
        kit.sphere(kit.dark, [x + dx, ey, z], [r, r, r * 0.6]);
        kit.sphere(kit.white, [x + dx + r * 0.35, ey + r * 0.35, z + r * 0.45], r * 0.3);
      };
      const bigEye = (dx, r) => {
        kit.sphere(kit.white, [x + dx, ey, z], [r, r, r * 0.55]);
        kit.sphere(kit.dark, [x + dx, ey, z + r * 0.45], [r * 0.5, r * 0.5, r * 0.3]);
      };
      const closed = (dx) => kit.box(kit.dark, [x + dx, ey, z + er * 0.2], [er * 2.2, er * 0.45, er * 0.6]);
      const smile = (r = s * 0.2, dx = 0) => kit.put(G.torus(Math.PI), kit.dark, [x + dx, y - s * 0.18, z], [r, r, r], [0, 0, Math.PI]);
      const frown = () => kit.put(G.torus(Math.PI), kit.dark, [x, y - s * 0.42, z], s * 0.17);
      const oh = (r = s * 0.1) => kit.sphere(kit.dark, [x, y - s * 0.3, z], [r, r * 1.2, r * 0.5]);
      if (style === "grumpy") {
        eye(-ex);
        eye(ex);
        kit.box(kit.dark, [x - ex, ey + er * 1.7, z + er * 0.3], [er * 2.6, er * 0.5, er * 0.6], [0, 0, -0.45]);
        kit.box(kit.dark, [x + ex, ey + er * 1.7, z + er * 0.3], [er * 2.6, er * 0.5, er * 0.6], [0, 0, 0.45]);
        frown();
      } else if (style === "sleepy") {
        closed(-ex);
        closed(ex);
        oh(s * 0.07);
      } else if (style === "wow") {
        bigEye(-ex, er * 1.45);
        bigEye(ex, er * 1.45);
        oh();
      } else if (style === "wink") {
        eye(-ex);
        closed(ex);
        smile();
      } else if (style === "cyclops") {
        bigEye(0, er * 2.2);
        smile(s * 0.18);
      } else if (style === "derp") {
        eye(-ex, er * 1.3);
        eye(ex, er * 0.75);
        smile(s * 0.17, s * 0.08);
      } else if (style === "laugh") {
        closed(-ex);
        closed(ex);
        kit.dome(kit.mat("#7f1d1d"), [x, y - s * 0.16, z], [s * 0.24, s * 0.22, s * 0.1], [Math.PI, 0, 0]);
      } else {
        eye(-ex);
        eye(ex);
        smile();
      }
    }
  };
  return kit;
}

const ellipsoidAnchor = (c, r, faceDy = 0.1, faceScale = 1) => ({
  face: [c[0], c[1] + r[1] * faceDy, c[2] + r[2] * Math.sqrt(1 - faceDy * faceDy) * 0.94, Math.min(r[0], r[1]) * faceScale],
  top: [c[0], c[1] + r[1], c[2]],
  body: { c, r }
});

const boxAnchor = (c, s, faceDy = 0.1) => ({
  face: [c[0], c[1] + s[1] * faceDy, c[2] + s[2] / 2, Math.min(s[0], s[1]) * 0.5],
  top: [c[0], c[1] + s[1] / 2, c[2]],
  body: { c, r: [s[0] / 2, s[1] / 2, s[2] / 2] }
});

const BUILDERS = {
  blob(k) {
    const c = [0, 0.8, 0];
    const r = [1, 0.8, 0.9];
    k.sphere(k.A, c, r);
    k.sphere(k.B, [0.45, 1.25, 0.5], [0.18, 0.12, 0.1]);
    return ellipsoidAnchor(c, r, 0.12, 0.85);
  },
  box(k) {
    k.box(k.A, [0, 0.8, 0], [1.6, 1.6, 1.6]);
    k.box(k.B, [0, 1.65, 0], [1.4, 0.1, 1.4]);
    return boxAnchor([0, 0.8, 0], [1.6, 1.6, 1.6]);
  },
  ball(k) {
    k.sphere(k.A, [0, 1, 0], 1);
    k.put(G.ring(), k.B, [0, 1, 0], [1.01, 1.01, 3], [Math.PI / 2, 0, 0]);
    return ellipsoidAnchor([0, 1, 0], [1, 1, 1], 0.15, 0.8);
  },
  tall(k) {
    const c = [0, 1.25, 0];
    const r = [0.65, 1.25, 0.6];
    k.sphere(k.A, c, r);
    k.sphere(k.B, [0, 0.5, 0.3], [0.4, 0.3, 0.3]);
    return ellipsoidAnchor(c, r, 0.35, 1);
  },
  tri(k) {
    k.put(G.pyramid(), k.A, [0, 1, 0], [1.3, 2, 1.3], [0, Math.PI / 4, 0]);
    k.box(k.B, [0, 0.12, 0], [1.6, 0.24, 1.6]);
    return { face: [0, 0.75, 0.62, 0.6], top: [0, 2, 0], body: { c: [0, 0.8, 0], r: [0.8, 0.8, 0.8] } };
  },
  cloud(k) {
    k.sphere(k.A, [0, 1, 0], [0.8, 0.65, 0.7]);
    k.sphere(k.A, [-0.75, 0.8, 0], 0.5);
    k.sphere(k.A, [0.75, 0.8, 0], 0.5);
    k.sphere(k.A, [-0.3, 1.5, -0.1], 0.45);
    k.sphere(k.B, [0.35, 1.45, -0.1], 0.4);
    return ellipsoidAnchor([0, 1, 0], [0.8, 0.65, 0.7], 0, 0.9);
  },
  drop(k) {
    k.sphere(k.A, [0, 0.75, 0], 0.75);
    k.put(G.cone(), k.A, [0, 1.75, 0], [0.62, 1.3, 0.62]);
    k.sphere(k.B, [0.3, 1.1, 0.45], [0.12, 0.2, 0.08]);
    return ellipsoidAnchor([0, 0.75, 0], [0.75, 0.75, 0.75], 0.1, 0.9);
  },
  star(k) {
    k.put(G.star(), k.A, [0, 1, 0], [1.1, 1.1, 1]);
    k.sphere(k.B, [0, 1, 0.2], [0.3, 0.3, 0.2]);
    return { face: [0, 0.95, 0.4, 0.55], top: [0, 2.1, 0], body: { c: [0, 1, 0], r: [0.6, 0.6, 0.35] } };
  },
  hex(k) {
    k.put(G.hex(), k.A, [0, 1, 0], [1, 0.9, 1], [Math.PI / 2, 0, 0]);
    k.put(G.hex(), k.B, [0, 1, 0.42], [0.75, 0.1, 0.75], [Math.PI / 2, 0, 0]);
    return { face: [0, 1, 0.48, 0.6], top: [0, 1.9, 0], body: { c: [0, 1, 0], r: [0.9, 0.9, 0.45] } };
  },
  mushroom(k) {
    k.cyl(k.mat("#fef3c7"), [0, 0.55, 0], 0.45, 1.1, 0.85);
    k.dome(k.A, [0, 1.05, 0], [1.1, 0.8, 1.1]);
    [[0.4, 1.6, 0.5], [-0.5, 1.45, 0.55], [0.1, 1.82, -0.1], [-0.2, 1.4, -0.8]].forEach((p) => k.sphere(k.B, p, 0.14));
    return { face: [0, 0.6, 0.42, 0.45], top: [0, 1.85, 0], body: { c: [0, 0.55, 0], r: [0.45, 0.55, 0.45] } };
  },
  cactus(k) {
    k.cyl(k.mat("#b45309"), [0, 0.25, 0], 0.55, 0.5, 1.15);
    const c = [0, 1.15, 0];
    const r = [0.45, 0.8, 0.45];
    k.sphere(k.A, c, r);
    k.limb(k.A, [0.35, 1.1, 0], [0.75, 1.1, 0], 0.15);
    k.limb(k.A, [0.75, 1.05, 0], [0.75, 1.55, 0], 0.15);
    k.limb(k.A, [-0.35, 0.95, 0], [-0.7, 0.95, 0], 0.15);
    k.limb(k.A, [-0.7, 0.9, 0], [-0.7, 1.3, 0], 0.15);
    k.sphere(k.B, [0, 1.98, 0], 0.15);
    return ellipsoidAnchor(c, r, 0.05, 1);
  },
  rock(k) {
    k.put(G.ico(), k.A, [0, 0.75, 0], [1.1, 0.8, 0.95], [0.3, 0.5, 0.1]);
    k.sphere(k.B, [0.2, 1.42, 0], [0.35, 0.1, 0.3]);
    return ellipsoidAnchor([0, 0.75, 0], [1, 0.75, 0.85], 0.05, 0.75);
  },
  sock(k) {
    k.limb(k.A, [0, 0.45, 0], [0, 1.9, 0], 0.45);
    k.sphere(k.A, [0, 0.45, 0.3], [0.45, 0.4, 0.75]);
    k.cyl(k.B, [0, 1.75, 0], 0.47, 0.3);
    return { face: [0, 1.25, 0.42, 0.45], top: [0, 1.9, 0], body: { c: [0, 1.1, 0], r: [0.45, 0.8, 0.45] } };
  },
  mug(k) {
    k.cyl(k.A, [0, 0.75, 0], 0.7, 1.5);
    k.cyl(k.B, [0, 1.47, 0], 0.6, 0.08);
    k.put(G.torus(Math.PI * 2), k.A, [0.78, 0.8, 0], [0.38, 0.38, 0.5]);
    return { face: [0, 0.8, 0.7, 0.6], top: [0, 1.5, 0], body: { c: [0, 0.75, 0], r: [0.7, 0.75, 0.7] } };
  },
  book(k) {
    k.box(k.A, [0, 1, 0], [1.5, 2, 0.45]);
    k.box(k.mat("#f8fafc"), [0.04, 1, 0], [1.4, 1.9, 0.38]);
    k.box(k.B, [-0.72, 1, 0], [0.12, 2.02, 0.47]);
    return boxAnchor([0, 1, 0.03], [1.5, 2, 0.45], 0.1);
  },
  lamp(k) {
    k.cyl(k.B, [0, 0.1, 0], 0.6, 0.2);
    k.cyl(k.B, [0, 0.75, 0], 0.08, 1.2);
    k.cyl(k.A, [0, 1.6, 0], 0.85, 0.9, 0.55);
    return { face: [0, 1.6, 0.68, 0.45], top: [0, 2.05, 0], body: { c: [0, 1.6, 0], r: [0.7, 0.45, 0.7] } };
  },
  kettle(k) {
    const c = [0, 0.75, 0];
    const r = [0.85, 0.7, 0.8];
    k.sphere(k.A, c, r);
    k.limb(k.A, [0.6, 0.7, 0], [1.15, 1.2, 0], 0.13, 0.6);
    k.dome(k.B, [0, 1.38, 0], [0.35, 0.18, 0.35]);
    k.put(G.torus(Math.PI), k.B, [0, 1.4, 0], [0.5, 0.45, 0.6]);
    return ellipsoidAnchor(c, r, 0.1, 0.85);
  },
  sponge(k) {
    k.box(k.A, [0, 0.65, 0], [1.6, 1.3, 1]);
    k.box(k.B, [0, 1.38, 0], [1.6, 0.2, 1]);
    [[0.5, 0.4, 0.5], [-0.55, 0.9, 0.5], [0.15, 1, 0.5]].forEach((p) => k.sphere(k.mat("#ca8a04"), p, [0.1, 0.1, 0.03]));
    return boxAnchor([0, 0.65, 0], [1.6, 1.3, 1], 0.05);
  },
  toaster(k) {
    k.box(k.A, [0, 0.7, 0], [1.7, 1.4, 1]);
    k.box(k.dark, [-0.35, 1.41, 0], [0.5, 0.04, 0.6]);
    k.box(k.dark, [0.35, 1.41, 0], [0.5, 0.04, 0.6]);
    k.box(k.mat("#d6a46a"), [-0.35, 1.52, 0], [0.45, 0.25, 0.55]);
    k.box(k.B, [0.9, 0.9, 0], [0.12, 0.12, 0.4]);
    return boxAnchor([0, 0.7, 0], [1.7, 1.4, 1], 0);
  },
  pencil(k) {
    k.put(G.hex(), k.A, [0, 1.15, 0], [0.45, 1.6, 0.45]);
    k.put(G.cone(), k.mat("#e7c08a"), [0, 0.12, 0], [0.45, 0.5, 0.45], [Math.PI, 0, 0]);
    k.cyl(k.mat("#f9a8d4"), [0, 2.05, 0], 0.44, 0.3);
    k.cyl(k.B, [0, 1.88, 0], 0.46, 0.12);
    return { face: [0, 1.25, 0.42, 0.42], top: [0, 2.2, 0], body: { c: [0, 1.15, 0], r: [0.45, 0.8, 0.45] } };
  },
  donut(k) {
    k.put(G.torus(Math.PI * 2), k.A, [0, 1, 0], [0.8, 0.8, 2.6]);
    k.put(G.torus(Math.PI * 2), k.B, [0, 1, 0.1], [0.8, 0.8, 2.2]);
    return { face: [0, 1.62, 0.36, 0.38], top: [0, 1.95, 0], body: { c: [0, 1, 0], r: [1, 1, 0.45] } };
  },
  pickle(k) {
    const c = [0, 1.1, 0];
    const r = [0.55, 1.1, 0.5];
    k.sphere(k.A, c, r, [0, 0, 0.12]);
    [[0.35, 1.6, 0.3], [-0.4, 0.8, 0.25], [0.3, 0.6, 0.3], [-0.2, 1.5, -0.4]].forEach((p) => k.sphere(k.B, p, 0.09));
    return ellipsoidAnchor(c, r, 0.25, 1);
  },
  sandwich(k) {
    k.box(k.A, [0, 0.2, 0], [1.7, 0.4, 1.4]);
    k.box(k.mat("#4ade80"), [0, 0.47, 0], [1.85, 0.12, 1.55]);
    k.box(k.mat("#ef4444"), [0, 0.6, 0], [1.6, 0.14, 1.3]);
    k.box(k.mat("#fde047"), [0, 0.72, 0], [1.75, 0.1, 1.45]);
    k.box(k.A, [0, 1, 0], [1.7, 0.45, 1.4]);
    k.box(k.B, [0, 1.23, 0], [1.72, 0.06, 1.42]);
    return { face: [0, 1, 0.7, 0.45], top: [0, 1.25, 0], body: { c: [0, 0.6, 0], r: [0.85, 0.6, 0.7] } };
  },
  jelly(k) {
    k.dome(k.A, [0, 0, 0], [1, 1.5, 1]);
    k.cyl(k.B, [0, 0.06, 0], 1.05, 0.12);
    k.sphere(k.mat("#ef4444"), [0, 1.55, 0], 0.18);
    return { face: [0, 0.6, 0.87, 0.55], top: [0, 1.5, 0], body: { c: [0, 0.6, 0], r: [0.9, 0.7, 0.9] } };
  },
  moon(k) {
    k.put(G.torus(Math.PI * 1.25), k.A, [0, 1.1, 0], [1, 1, 1.6], [0, 0, Math.PI * 0.4]);
    return { face: [0.62, 0.95, 0.3, 0.45], top: [0, 2, 0], body: { c: [0.2, 1.1, 0], r: [0.5, 0.8, 0.35] } };
  },
  bell(k) {
    k.cyl(k.A, [0, 0.7, 0], 0.95, 1.2, 0.6);
    k.dome(k.A, [0, 1.3, 0], [0.57, 0.5, 0.57]);
    k.cyl(k.B, [0, 0.1, 0], 1, 0.15);
    k.sphere(k.B, [0, 0.05, 0.3], 0.18);
    k.put(G.torus(Math.PI * 2), k.B, [0, 1.85, 0], 0.15);
    return { face: [0, 0.8, 0.8, 0.5], top: [0, 1.8, 0], body: { c: [0, 0.8, 0], r: [0.8, 0.8, 0.8] } };
  },
  brick(k) {
    k.box(k.A, [0, 0.55, 0], [1.9, 1.1, 1]);
    k.box(k.B, [0, 0.55, 0.5], [1.7, 0.06, 0.04]);
    return boxAnchor([0, 0.55, 0], [1.9, 1.1, 1], 0.05);
  },
  dice(k) {
    k.box(k.A, [0, 0.75, 0], [1.5, 1.5, 1.5]);
    [[0.4, 1.5, 0.4], [-0.4, 1.5, -0.4], [0, 1.5, 0], [0.75, 0.4, 0.4], [0.75, 1.1, -0.4]].forEach((p) => k.sphere(k.B, p, 0.13));
    return boxAnchor([0, 0.75, 0], [1.5, 1.5, 1.5], 0);
  },
  carrot(k) {
    k.put(G.cone(), k.A, [0, 1, 0], [0.6, 2, 0.6], [Math.PI, 0, 0]);
    k.spike(k.B, [0, 1.95, 0], [0.3, 2.6, 0], 0.12);
    k.spike(k.B, [0, 1.95, 0], [-0.3, 2.55, 0], 0.12);
    k.spike(k.B, [0, 1.95, 0], [0, 2.75, 0.05], 0.12);
    return { face: [0, 1.45, 0.43, 0.42], top: [0, 2, 0], body: { c: [0, 1.3, 0], r: [0.45, 0.7, 0.45] } };
  },
  button(k) {
    k.cyl(k.A, [0, 1, 0], 1, 0.35, 1, [Math.PI / 2, 0, 0]);
    k.put(G.ring(), k.B, [0, 1, 0.18], [0.8, 0.8, 1.5]);
    [[-0.25, 0.75], [0.25, 0.75]].forEach(([x, y]) => k.sphere(k.dark, [x, y, 0.17], [0.09, 0.09, 0.03]));
    return { face: [0, 1.2, 0.18, 0.55], top: [0, 2, 0], body: { c: [0, 1, 0], r: [1, 1, 0.18] } };
  },
  acorn(k) {
    const c = [0, 0.75, 0];
    const r = [0.75, 0.8, 0.75];
    k.sphere(k.A, c, r);
    k.dome(k.B, [0, 1.15, 0], [0.82, 0.5, 0.82]);
    k.limb(k.B, [0, 1.6, 0], [0.1, 1.95, 0], 0.07);
    return ellipsoidAnchor(c, r, -0.05, 0.85);
  },
  boot(k) {
    k.limb(k.A, [0, 0.5, -0.1], [0, 1.9, -0.1], 0.45);
    k.box(k.A, [0, 0.35, 0.3], [0.8, 0.7, 1.4]);
    k.box(k.B, [0, 0.05, 0.25], [0.85, 0.1, 1.5]);
    k.cyl(k.B, [0, 1.85, -0.1], 0.48, 0.15);
    return { face: [0, 1.25, 0.32, 0.45], top: [0, 1.9, -0.1], body: { c: [0, 1, -0.1], r: [0.45, 0.8, 0.45] } };
  },
  leaf(k) {
    const c = [0, 1.15, 0];
    const r = [0.7, 1, 0.22];
    k.sphere(k.A, c, r);
    k.limb(k.B, [0, 0, 0], [0, 2.1, 0.12], 0.04);
    return ellipsoidAnchor(c, r, 0.1, 0.8);
  },
  flame(k) {
    k.sphere(k.A, [0, 0.7, 0], 0.7);
    k.put(G.cone(), k.A, [0, 1.6, 0], [0.6, 1.4, 0.6]);
    k.sphere(k.B, [0, 0.65, 0.25], 0.42);
    k.put(G.cone(), k.B, [0, 1.25, 0.2], [0.35, 0.8, 0.35]);
    return ellipsoidAnchor([0, 0.7, 0.2], [0.6, 0.6, 0.6], 0.05, 0.9);
  },
  crystal(k) {
    k.put(G.octa(), k.A, [0, 1.15, 0], [0.75, 1.15, 0.75]);
    k.put(G.octa(), k.B, [0.65, 0.5, 0.1], [0.25, 0.5, 0.25], [0, 0, -0.4]);
    k.put(G.octa(), k.B, [-0.6, 0.45, -0.1], [0.22, 0.45, 0.22], [0, 0, 0.4]);
    return { face: [0, 1.1, 0.37, 0.5], top: [0, 2.3, 0], body: { c: [0, 1.15, 0], r: [0.5, 0.7, 0.45] } };
  },
  robot(k) {
    k.box(k.A, [0, 0.65, 0], [1.2, 1, 0.8]);
    k.box(k.A, [0, 1.55, 0], [0.95, 0.75, 0.75]);
    k.box(k.B, [0, 0.7, 0.41], [0.6, 0.4, 0.04]);
    k.limb(k.dark, [0, 1.9, 0], [0, 2.25, 0], 0.04);
    k.sphere(k.B, [0, 2.28, 0], 0.1);
    k.limb(k.A, [-0.3, 0.15, 0], [-0.3, 0, 0], 0.15);
    k.limb(k.A, [0.3, 0.15, 0], [0.3, 0, 0], 0.15);
    return boxAnchor([0, 1.55, 0], [0.95, 0.75, 0.75], 0);
  },
  balloon(k) {
    const c = [0, 1.55, 0];
    const r = [0.75, 0.9, 0.75];
    k.sphere(k.A, c, r);
    k.put(G.cone(), k.A, [0, 0.62, 0], [0.12, 0.15, 0.12], [Math.PI, 0, 0]);
    k.limb(k.B, [0, 0.55, 0], [0.1, 0, 0], 0.02);
    return ellipsoidAnchor(c, r, 0.1, 0.85);
  },
  bean(k) {
    const c = [0, 0.95, 0];
    const r = [0.6, 0.95, 0.55];
    k.sphere(k.A, c, r, [0, 0, 0.25]);
    k.sphere(k.B, [0.25, 1.4, 0.3], [0.12, 0.2, 0.08]);
    return ellipsoidAnchor(c, r, 0.15, 1);
  },
  egg(k) {
    const c = [0, 1.05, 0];
    const r = [0.8, 1.05, 0.8];
    k.sphere(k.A, c, r);
    k.put(G.ring(), k.B, [0, 0.9, 0], [0.82, 0.82, 2], [Math.PI / 2, 0, 0]);
    return ellipsoidAnchor(c, r, 0.2, 0.85);
  },
  quad(k) {
    const c = [0, 1, 0];
    const r = [0.55, 0.5, 0.9];
    k.sphere(k.A, c, r);
    [[0.32, 0.55], [-0.32, 0.55], [0.32, -0.55], [-0.32, -0.55]].forEach(([x, z]) => {
      k.limb(k.A, [x, 0.8, z], [x, 0.08, z], 0.14);
      k.sphere(k.B, [x, 0.06, z + 0.04], [0.16, 0.08, 0.18]);
    });
    k.limb(k.A, [0, 1.15, -0.85], [0, 1.45, -1.25], 0.06, 0.6);
    k.sphere(k.A, [0, 1.45, 1], 0.42);
    k.sphere(k.B, [0, 1.32, 1.36], [0.22, 0.16, 0.14]);
    k.sphere(k.dark, [0, 1.38, 1.49], [0.08, 0.05, 0.04]);
    return { face: [0, 1.5, 1.37, 0.4], top: [0, 1.85, 1], body: { c, r } };
  },
  bird(k) {
    const c = [0, 0.8, 0];
    const r = [0.5, 0.5, 0.6];
    k.sphere(k.A, c, r);
    k.sphere(k.A, [0, 1.35, 0.3], 0.36);
    k.spike(k.mat("#f59e0b"), [0, 1.28, 0.6], [0, 1.22, 0.95], 0.11);
    k.sphere(k.B, [0.48, 0.85, -0.05], [0.12, 0.35, 0.45], [0.2, 0, 0]);
    k.sphere(k.B, [-0.48, 0.85, -0.05], [0.12, 0.35, 0.45], [0.2, 0, 0]);
    k.sphere(k.B, [0, 0.95, -0.65], [0.3, 0.08, 0.35], [-0.4, 0, 0]);
    const leg = k.mat("#f59e0b");
    k.limb(leg, [0.18, 0.4, 0.05], [0.18, 0, 0.05], 0.04);
    k.limb(leg, [-0.18, 0.4, 0.05], [-0.18, 0, 0.05], 0.04);
    k.box(leg, [0.18, 0.02, 0.15], [0.12, 0.04, 0.25]);
    k.box(leg, [-0.18, 0.02, 0.15], [0.12, 0.04, 0.25]);
    return { face: [0, 1.42, 0.63, 0.34], top: [0, 1.7, 0.3], body: { c, r } };
  },
  fish(k) {
    const c = [0, 0.7, 0];
    const r = [0.35, 0.55, 0.9];
    k.sphere(k.A, c, r);
    k.put(G.cone(), k.B, [0, 0.7, -1.05], [0.5, 0.6, 0.1], [-Math.PI / 2, 0, 0]);
    k.put(G.cone(), k.B, [0, 1.3, -0.1], [0.4, 0.35, 0.06], [-0.3, 0, 0]);
    k.sphere(k.B, [0.36, 0.55, 0.2], [0.05, 0.15, 0.25], [0, 0.4, 0]);
    k.sphere(k.B, [-0.36, 0.55, 0.2], [0.05, 0.15, 0.25], [0, -0.4, 0]);
    return { face: [0, 0.82, 0.8, 0.36], top: [0, 1.25, 0.1], body: { c, r } };
  },
  bug(k) {
    const c = [0, 0.45, -0.1];
    const r = [0.55, 0.4, 0.65];
    k.sphere(k.A, c, r);
    k.put(G.ring(), k.B, [0, 0.62, -0.1], [0.02, 0.35, 0.62], [0, Math.PI / 2, 0]);
    k.sphere(k.B, [0, 0.5, 0.62], 0.3);
    [-0.35, 0, 0.35].forEach((z) => {
      k.limb(k.dark, [0.4, 0.35, z - 0.1], [0.8, 0, z - 0.05], 0.04);
      k.limb(k.dark, [-0.4, 0.35, z - 0.1], [-0.8, 0, z - 0.05], 0.04);
    });
    k.limb(k.dark, [0.1, 0.75, 0.75], [0.3, 1.1, 0.95], 0.025);
    k.limb(k.dark, [-0.1, 0.75, 0.75], [-0.3, 1.1, 0.95], 0.025);
    k.sphere(k.dark, [0.3, 1.1, 0.95], 0.05);
    k.sphere(k.dark, [-0.3, 1.1, 0.95], 0.05);
    return { face: [0, 0.55, 0.9, 0.3], top: [0, 0.8, 0.62], body: { c, r } };
  },
  snake(k) {
    const pts = [];
    for (let i = 0; i <= 8; i += 1) {
      const t = i / 8;
      pts.push([Math.sin(t * Math.PI * 2.2) * 0.45, 0.2 + (t > 0.7 ? (t - 0.7) * 2.3 : 0), -1.2 + t * 2]);
    }
    k.chain(k.A, pts, 0.08, 0.2);
    const head = pts[pts.length - 1];
    k.sphere(k.A, [head[0], head[1] + 0.05, head[2] + 0.15], [0.28, 0.24, 0.33]);
    k.limb(k.mat("#ef4444"), [head[0], head[1], head[2] + 0.45], [head[0], head[1] - 0.03, head[2] + 0.7], 0.02);
    [2, 4, 6].forEach((i) => k.sphere(k.B, [pts[i][0], pts[i][1] + 0.12, pts[i][2]], 0.07));
    return { face: [head[0], head[1] + 0.08, head[2] + 0.44, 0.27], top: [head[0], head[1] + 0.3, head[2] + 0.15], body: { c: [0, 0.3, -0.2], r: [0.4, 0.25, 0.9] } };
  },
  frog(k) {
    const c = [0, 0.55, 0];
    const r = [0.75, 0.5, 0.7];
    k.sphere(k.A, c, r);
    k.sphere(k.B, [0, 0.45, 0.35], [0.5, 0.35, 0.4]);
    k.sphere(k.A, [0.33, 0.98, 0.3], 0.22);
    k.sphere(k.A, [-0.33, 0.98, 0.3], 0.22);
    k.sphere(k.A, [0.68, 0.25, -0.15], [0.25, 0.22, 0.45]);
    k.sphere(k.A, [-0.68, 0.25, -0.15], [0.25, 0.22, 0.45]);
    k.sphere(k.A, [0.45, 0.06, 0.55], [0.18, 0.06, 0.2]);
    k.sphere(k.A, [-0.45, 0.06, 0.55], [0.18, 0.06, 0.2]);
    return { face: [0, 0.82, 0.63, 0.92], top: [0, 1.15, 0.3], body: { c, r } };
  },
  bunny(k) {
    const c = [0, 0.6, 0];
    const r = [0.5, 0.55, 0.5];
    k.sphere(k.A, c, r);
    k.sphere(k.A, [0, 1.25, 0.15], 0.4);
    [0.17, -0.17].forEach((x) => {
      k.limb(k.A, [x, 1.55, 0.1], [x * 1.5, 2.3, 0], 0.1, 0.8);
      k.sphere(k.B, [x * 1.25, 1.95, 0.12], [0.05, 0.3, 0.03]);
    });
    k.sphere(k.B, [0, 0.55, -0.5], 0.17);
    k.sphere(k.A, [0.25, 0.08, 0.3], [0.15, 0.08, 0.25]);
    k.sphere(k.A, [-0.25, 0.08, 0.3], [0.15, 0.08, 0.25]);
    k.sphere(k.B, [0, 1.15, 0.54], [0.06, 0.04, 0.03]);
    return { face: [0, 1.3, 0.52, 0.38], top: [0, 1.6, 0.15], body: { c, r } };
  },
  trex(k) {
    const c = [0, 1.5, 0];
    const r = [0.55, 0.6, 0.9];
    k.sphere(k.A, c, r, [-0.25, 0, 0]);
    k.sphere(k.B, [0, 1.35, 0.35], [0.4, 0.45, 0.5], [-0.25, 0, 0]);
    [0.35, -0.35].forEach((x) => {
      k.limb(k.A, [x, 1.4, -0.1], [x * 1.1, 0.7, 0.1], 0.22, 0.8);
      k.limb(k.A, [x * 1.1, 0.7, 0.1], [x * 1.1, 0.1, -0.05], 0.15);
      k.sphere(k.A, [x * 1.1, 0.08, 0.15], [0.18, 0.08, 0.3]);
      k.limb(k.A, [x * 0.8, 1.65, 0.75], [x, 1.4, 1], 0.06);
    });
    k.chain(k.A, [[0, 1.5, -0.8], [0, 1.3, -1.5], [0, 1.05, -2.1]], 0.35, 0.08);
    k.limb(k.A, [0, 1.8, 0.6], [0, 2.25, 0.9], 0.3);
    const head = [0, 2.35, 1.05];
    k.sphere(k.A, head, [0.38, 0.35, 0.58]);
    k.sphere(k.B, [0, 2.12, 1.15], [0.3, 0.12, 0.45]);
    [0.12, -0.12].forEach((x) => k.spike(k.white, [x, 2.12, 1.5], [x, 1.98, 1.52], 0.04));
    return { face: [0, 2.48, 1.56, 0.36], top: [0, 2.7, 1], body: { c, r } };
  },
  raptor(k) {
    const c = [0, 1.15, 0];
    const r = [0.38, 0.4, 0.75];
    k.sphere(k.A, c, r, [-0.15, 0, 0]);
    [0.22, -0.22].forEach((x) => {
      k.limb(k.A, [x, 1.05, -0.1], [x, 0.55, 0.1], 0.13, 0.7);
      k.limb(k.A, [x, 0.55, 0.1], [x, 0.08, -0.1], 0.08);
      k.sphere(k.A, [x, 0.06, 0.05], [0.1, 0.06, 0.2]);
      k.spike(k.white, [x, 0.12, 0.15], [x, 0.3, 0.3], 0.03);
      k.limb(k.A, [x * 0.8, 1.2, 0.6], [x, 1, 0.85], 0.05);
    });
    k.chain(k.A, [[0, 1.2, -0.65], [0, 1.25, -1.3], [0, 1.3, -1.9]], 0.22, 0.05);
    k.limb(k.A, [0, 1.35, 0.55], [0, 1.75, 0.8], 0.17);
    k.sphere(k.A, [0, 1.85, 0.95], [0.24, 0.22, 0.42]);
    k.sphere(k.B, [0, 1.95, 0.85], [0.08, 0.12, 0.3]);
    return { face: [0, 1.92, 1.32, 0.24], top: [0, 2.07, 0.9], body: { c, r } };
  },
  longneck(k) {
    const c = [0, 1.6, 0];
    const r = [0.75, 0.65, 1.2];
    k.sphere(k.A, c, r);
    [[0.42, 0.7], [-0.42, 0.7], [0.42, -0.7], [-0.42, -0.7]].forEach(([x, z]) => k.limb(k.A, [x, 1.4, z], [x, 0, z], 0.22));
    k.chain(k.A, [[0, 1.9, 0.9], [0, 2.8, 1.3], [0, 3.6, 1.55]], 0.3, 0.16);
    k.sphere(k.A, [0, 3.75, 1.75], [0.24, 0.21, 0.38]);
    k.chain(k.A, [[0, 1.6, -1.1], [0, 1.1, -1.9], [0, 0.7, -2.6]], 0.3, 0.05);
    [0.5, 0, -0.5].forEach((z) => k.sphere(k.B, [0.3, 2.05, z], 0.13));
    return { face: [0, 3.8, 2.08, 0.22], top: [0, 3.96, 1.72], body: { c, r } };
  },
  trike(k) {
    const c = [0, 1.05, 0];
    const r = [0.7, 0.6, 1.1];
    k.sphere(k.A, c, r);
    [[0.42, 0.6], [-0.42, 0.6], [0.42, -0.6], [-0.42, -0.6]].forEach(([x, z]) => k.limb(k.A, [x, 0.9, z], [x, 0, z], 0.2));
    k.chain(k.A, [[0, 1.05, -1], [0, 0.75, -1.7]], 0.3, 0.06);
    k.sphere(k.A, [0, 1.1, 1.3], [0.45, 0.4, 0.5]);
    k.cyl(k.B, [0, 1.45, 1], 0.85, 0.12, 1, [Math.PI / 2 - 0.5, 0, 0]);
    const horn = k.mat("#f8fafc");
    k.spike(horn, [0.22, 1.35, 1.55], [0.32, 1.7, 2.3], 0.07);
    k.spike(horn, [-0.22, 1.35, 1.55], [-0.32, 1.7, 2.3], 0.07);
    k.spike(horn, [0, 0.95, 1.75], [0, 1.15, 2.05], 0.06);
    k.spike(k.mat("#fde68a"), [0, 0.95, 1.7], [0, 0.85, 1.95], 0.1);
    return { face: [0, 1.22, 1.75, 0.38], top: [0, 1.5, 1.3], body: { c, r } };
  },
  stego(k) {
    const c = [0, 1.15, 0];
    const r = [0.6, 0.7, 1.2];
    k.sphere(k.A, c, r);
    [[0.38, 0.6, 0.15], [-0.38, 0.6, 0.15], [0.38, -0.6, 0.2], [-0.38, -0.6, 0.2]].forEach(([x, z, w]) => k.limb(k.A, [x, 0.9, z], [x, 0, z], w));
    k.chain(k.A, [[0, 1.05, 1.05], [0, 0.85, 1.55]], 0.25, 0.18);
    k.sphere(k.A, [0, 0.82, 1.7], [0.2, 0.18, 0.3]);
    [-0.8, -0.35, 0.1, 0.55].forEach((z, i) => {
      const h = 0.55 - Math.abs(i - 1.5) * 0.12;
      k.put(G.cone(), k.B, [0, 1.75 + h * 0.4 - Math.abs(z) * 0.2, z], [0.35, h * 1.8, 0.06]);
    });
    k.chain(k.A, [[0, 1.05, -1.1], [0, 0.7, -1.9]], 0.3, 0.08);
    const spike = k.mat("#f8fafc");
    [0.2, -0.2].forEach((x) => k.spike(spike, [x, 0.75, -1.8], [x * 2.5, 1.05, -1.95], 0.05));
    return { face: [0, 0.88, 1.98, 0.2], top: [0, 1, 1.7], body: { c, r } };
  },
  ptero(k) {
    const c = [0, 1, 0];
    const r = [0.3, 0.3, 0.6];
    k.sphere(k.A, c, r);
    k.put(G.cone(), k.B, [0.95, 1.1, -0.05], [0.3, 1.5, 0.04], [Math.PI / 2, 0, -Math.PI / 2 + 0.15]);
    k.put(G.cone(), k.B, [-0.95, 1.1, -0.05], [0.3, 1.5, 0.04], [Math.PI / 2, 0, Math.PI / 2 - 0.15]);
    k.limb(k.A, [0, 1.05, 0.5], [0, 1.2, 0.65], 0.12);
    k.sphere(k.A, [0, 1.25, 0.72], 0.22);
    k.spike(k.mat("#f59e0b"), [0, 1.2, 0.88], [0, 1.15, 1.35], 0.08);
    k.spike(k.B, [0, 1.35, 0.6], [0, 1.55, 0.2], 0.06);
    k.limb(k.A, [0.15, 0.75, -0.1], [0.15, 0.4, -0.05], 0.04);
    k.limb(k.A, [-0.15, 0.75, -0.1], [-0.15, 0.4, -0.05], 0.04);
    return { face: [0, 1.3, 0.92, 0.22], top: [0, 1.47, 0.72], body: { c, r } };
  },
  flower(k) {
    const stem = k.mat("#16a34a");
    k.limb(stem, [0, 0, 0], [0, 1.4, 0], 0.07);
    k.sphere(stem, [0.25, 0.5, 0], [0.3, 0.06, 0.14], [0, 0, 0.4]);
    k.sphere(stem, [-0.25, 0.75, 0], [0.3, 0.06, 0.14], [0, 0, -0.4]);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      k.sphere(k.A, [Math.cos(angle) * 0.5, 1.6 + Math.sin(angle) * 0.5, 0], [0.24, 0.24, 0.08], [0, 0, angle]);
    }
    k.sphere(k.B, [0, 1.6, 0.04], [0.36, 0.36, 0.2]);
    return { face: [0, 1.6, 0.22, 0.34], top: [0, 2.1, 0], body: { c: [0, 1.6, 0], r: [0.36, 0.36, 0.2] } };
  },
  flytrap(k) {
    const stem = k.mat("#16a34a");
    k.chain(stem, [[0, 0, 0], [0.15, 0.6, 0], [0, 1.1, 0.1]], 0.1, 0.08);
    k.sphere(stem, [0.35, 0.25, 0], [0.4, 0.06, 0.18], [0, 0, 0.3]);
    k.sphere(stem, [-0.35, 0.35, 0], [0.4, 0.06, 0.18], [0, 0, -0.3]);
    k.dome(k.A, [0, 1.3, 0.25], [0.6, 0.35, 0.6], [Math.PI, 0, 0]);
    k.dome(k.A, [0, 1.45, 0.15], [0.62, 0.55, 0.62], [-0.45, 0, 0]);
    k.dome(k.B, [0, 1.31, 0.25], [0.52, 0.28, 0.52], [Math.PI, 0, 0]);
    for (let i = -2; i <= 2; i += 1) {
      k.spike(k.white, [i * 0.2, 1.3, 0.72], [i * 0.2, 1.48, 0.8], 0.04);
    }
    return { face: [0, 1.75, 0.6, 0.45], top: [0, 2, 0.05], body: { c: [0, 1.4, 0.2], r: [0.6, 0.45, 0.6] } };
  },
  treant(k) {
    k.cyl(k.B, [0, 0.8, 0], 0.42, 1.6, 0.75);
    [0, 1, 2, 3].forEach((i) => {
      const angle = (i / 4) * Math.PI * 2 + 0.4;
      k.limb(k.B, [0, 0.15, 0], [Math.cos(angle) * 0.65, 0, Math.sin(angle) * 0.65], 0.12, 0.5);
    });
    k.limb(k.B, [0.25, 1.2, 0], [0.8, 1.55, 0.1], 0.09);
    k.limb(k.B, [-0.25, 1.1, 0], [-0.75, 1.45, 0.1], 0.09);
    k.sphere(k.A, [0.85, 1.65, 0.1], 0.25);
    k.sphere(k.A, [-0.8, 1.55, 0.1], 0.22);
    k.sphere(k.A, [0, 2.15, 0], 0.75);
    k.sphere(k.A, [0.5, 1.95, -0.2], 0.5);
    k.sphere(k.A, [-0.5, 2, -0.15], 0.5);
    return { face: [0, 0.95, 0.38, 0.38], top: [0, 2.9, 0], body: { c: [0, 0.8, 0], r: [0.4, 0.8, 0.4] }, seat: [0, 2.85, 0] };
  },
  popsicle(k) {
    k.box(k.mat("#e7c08a"), [0, 0.45, 0], [0.22, 0.9, 0.12]);
    k.box(k.A, [0, 1.6, 0], [1.1, 1.5, 0.45]);
    k.dome(k.A, [0, 2.35, 0], [0.55, 0.3, 0.225]);
    k.box(k.B, [0, 1.55, 0], [1.12, 0.18, 0.47]);
    return { face: [0, 1.75, 0.23, 0.45], top: [0, 2.6, 0], body: { c: [0, 1.6, 0], r: [0.55, 0.75, 0.22] } };
  },
  snavier(k) {
    [0.15, -0.15].forEach((x) => {
      k.limb(k.A, [x, 0.4, 0], [x * 1.3, 0, 0.05], 0.07);
      k.sphere(k.A, [x * 1.3, 0.03, 0.12], [0.1, 0.05, 0.16]);
    });
    k.sphere(k.A, [0, 0.45, 0], [0.32, 0.22, 0.28]);
    const pts = [[0, 0.45, 0], [0.25, 0.85, 0.05], [-0.15, 1.3, 0.1], [0.1, 1.75, 0.12]];
    k.chain(k.A, pts, 0.22, 0.18);
    [1, 2].forEach((i) => k.sphere(k.B, [pts[i][0], pts[i][1], pts[i][2] + 0.18], 0.06));
    k.sphere(k.A, [0.1, 1.95, 0.25], [0.3, 0.22, 0.32]);
    k.limb(k.mat("#ef4444"), [0.1, 1.9, 0.55], [0.1, 1.88, 0.75], 0.015);
    return { face: [0.1, 1.98, 0.54, 0.27], top: [0.1, 2.17, 0.25], body: { c: [0, 0.45, 0], r: [0.32, 0.22, 0.28] } };
  },
  sprout(k) {
    const pot = k.mat("#b45309");
    k.cyl(pot, [0, 0.4, 0], 0.55, 0.8, 1.3);
    k.cyl(k.mat("#d97706"), [0, 0.85, 0], 0.75, 0.16);
    const leaf = k.mat("#22c55e");
    k.limb(k.mat("#15803d"), [0, 0.9, 0], [0, 1.6, 0], 0.04);
    k.sphere(k.A, [-0.3, 1.35, 0], [0.32, 0.08, 0.18], [0, 0, -0.5]);
    k.sphere(leaf, [0.3, 1.55, 0], [0.32, 0.08, 0.18], [0, 0, 0.5]);
    return { face: [0, 0.4, 0.62, 0.4], top: [0, 1.6, 0], body: { c: [0, 0.4, 0], r: [0.6, 0.4, 0.6] } };
  },
  bonsai(k) {
    const trunk = k.mat("#92400e");
    k.chain(trunk, [[0, 0, 0], [0.15, 0.5, 0], [-0.1, 1, 0], [0, 1.3, 0]], 0.18, 0.1);
    [0, 1, 2, 3, 4].forEach((i) => {
      const angle = (i / 5) * Math.PI * 2;
      k.limb(trunk, [0, 0.1, 0], [Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5], 0.06, 0.5);
    });
    k.sphere(k.mat("#15803d"), [-0.5, 1.25, 0], 0.4);
    k.sphere(k.mat("#15803d"), [0.5, 1.25, 0], 0.4);
    k.sphere(k.A, [0, 1.6, 0], 0.6);
    return { face: [0, 0.6, 0.18, 0.2], top: [0, 2.2, 0], body: { c: [0, 1.5, 0], r: [0.6, 0.6, 0.6] } };
  },
  turtle(k) {
    [[0.55, 0.45], [-0.55, 0.45], [0.55, -0.45], [-0.55, -0.45]].forEach(([x, z]) => k.sphere(k.B, [x, 0.15, z], [0.22, 0.15, 0.2]));
    k.sphere(k.B, [0, 0.55, 1], 0.32);
    k.sphere(k.B, [0, 0.25, -0.85], [0.08, 0.08, 0.18]);
    k.dome(k.A, [0, 0.25, 0], [0.9, 0.85, 0.9]);
    k.cyl(k.mat("#1e3a8a"), [0, 0.25, 0], 0.95, 0.12);
    return { face: [0, 0.6, 1.29, 0.3], top: [0, 1.1, 0], body: { c: [0, 0.6, 0], r: [0.9, 0.5, 0.9] } };
  },
  polygone(k) {
    k.limb(k.B, [0.3, 0.9, 0], [0.3, 0, 0], 0.15);
    k.limb(k.B, [-0.3, 0.9, 0], [-0.3, 0, 0], 0.15);
    k.box(k.A, [0, 1.3, 0], [1.1, 0.95, 0.75]);
    k.box(k.mat("#fde047"), [0, 1.3, 0.38], [0.3, 0.55, 0.04]);
    k.box(k.B, [-0.9, 2.05, 0.1], [1.2, 0.24, 0.24]);
    k.box(k.mat("#f97316"), [0.15, 2.25, 0], [0.95, 0.9, 0.8]);
    k.sphere(k.dark, [0.32, 2.3, 0.4], [0.16, 0.16, 0.06]);
    k.sphere(k.white, [0.37, 2.36, 0.45], 0.05);
    return { face: [0.15, 2.25, 0.4, 0.4], top: [0.15, 2.7, 0], body: { c: [0, 1.3, 0], r: [0.55, 0.48, 0.38] }, seat: [0.15, 2.7, 0] };
  }
};

function addExtras(k, extras, anchor) {
  const has = (name) => extras.includes(name);
  const { c, r } = anchor.body;
  const [fx, fy, fz, s] = anchor.face;
  const [tx, ty, tz] = anchor.top;
  if (has("legs")) {
    const bottom = c[1] - r[1];
    [0.4, -0.4].forEach((side) => {
      k.limb(k.A, [c[0] + r[0] * side, bottom + 0.15, c[2]], [c[0] + r[0] * side * 1.1, bottom - 0.45, c[2]], Math.max(0.08, r[0] * 0.14));
      k.sphere(k.A, [c[0] + r[0] * side * 1.1, bottom - 0.45, c[2] + 0.06], [r[0] * 0.2, 0.08, r[0] * 0.28]);
    });
  }
  if (has("arms")) {
    [1, -1].forEach((side) => {
      const from = [c[0] + r[0] * 0.9 * side, c[1], c[2]];
      const to = [c[0] + (r[0] + 0.45) * side, c[1] + 0.3, c[2] + 0.1];
      k.limb(k.A, from, to, 0.07);
      k.sphere(k.A, to, 0.12);
    });
  }
  if (has("wings")) {
    const w = Math.max(r[0], r[1]);
    [1, -1].forEach((side) => k.sphere(k.B, [c[0] + (r[0] + w * 0.45) * side, c[1] + r[1] * 0.35, c[2] - r[2] * 0.25], [w * 0.65, w * 0.38, w * 0.06], [0, 0.35 * side, 0.5 * side]));
  }
  if (has("horns")) {
    [1, -1].forEach((side) => k.spike(k.B, [tx + s * 0.4 * side, ty - s * 0.1, tz], [tx + s * 0.7 * side, ty + s * 0.6, tz - s * 0.1], s * 0.13));
  }
  if (has("antenna")) {
    k.limb(k.dark, [tx, ty - 0.02, tz], [tx, ty + s * 0.7, tz + s * 0.15], 0.025);
    k.sphere(k.B, [tx, ty + s * 0.75, tz + s * 0.15], s * 0.14);
  }
  if (has("fire")) {
    k.put(G.cone(), k.mat("#f97316"), [tx, ty + s * 0.35, tz], [s * 0.3, s * 0.8, s * 0.3]);
    k.put(G.cone(), k.mat("#fde047"), [tx, ty + s * 0.25, tz + s * 0.05], [s * 0.17, s * 0.5, s * 0.17]);
  }
  if (has("spots")) {
    [[0.5, 0.55, 0.65], [-0.62, 0.3, 0.72], [0.15, 0.85, 0.5], [-0.3, 0.7, -0.6], [0.7, 0.2, -0.65]].forEach((d) => {
      const len = Math.hypot(d[0], d[1], d[2]);
      k.sphere(k.B, [c[0] + (d[0] / len) * r[0], c[1] + (d[1] / len) * r[1], c[2] + (d[2] / len) * r[2]], Math.min(r[0], r[1], r[2]) * 0.16);
    });
  }
  if (has("mane")) {
    k.sphere(k.B, [fx, fy - s * 0.1, fz - s * 1.15], [s * 1.45, s * 1.45, s * 0.9]);
  }
  if (has("ears")) {
    [1, -1].forEach((side) => k.spike(k.A, [tx + s * 0.45 * side, ty - s * 0.15, tz], [tx + s * 0.62 * side, ty + s * 0.5, tz - s * 0.05], s * 0.2));
  }
  if (has("roundears")) {
    [1, -1].forEach((side) => {
      k.sphere(k.A, [tx + s * 0.6 * side, ty - s * 0.05, tz], [s * 0.3, s * 0.3, s * 0.14]);
      k.sphere(k.B, [tx + s * 0.6 * side, ty - s * 0.05, tz + s * 0.08], [s * 0.16, s * 0.16, s * 0.08]);
    });
  }
  if (has("trunk")) {
    k.chain(k.A, [[fx, fy - s * 0.3, fz], [fx, fy - s * 0.5, fz + s * 0.45], [fx, fy - s * 1, fz + s * 0.6], [fx, fy - s * 1.5, fz + s * 0.45]], s * 0.2, s * 0.1);
  }
  if (has("horn")) {
    k.spike(k.white, [fx, fy - s * 0.25, fz], [fx, fy + s * 0.55, fz + s * 0.6], s * 0.13);
  }
  if (has("antlers")) {
    const antler = k.mat("#a16207");
    [1, -1].forEach((side) => {
      const base = [tx + s * 0.3 * side, ty - s * 0.05, tz];
      const mid = [tx + s * 0.75 * side, ty + s * 0.7, tz - s * 0.1];
      k.limb(antler, base, mid, s * 0.06);
      k.limb(antler, mid, [tx + s * 1.1 * side, ty + s * 1.15, tz - s * 0.2], s * 0.05);
      k.limb(antler, mid, [tx + s * 0.6 * side, ty + s * 1.25, tz], s * 0.05);
    });
  }
  if (has("stripes")) {
    const ringMat = k.B;
    const horizontal = r[2] > r[1] * 1.1;
    [-0.45, 0, 0.45].forEach((t) => {
      const f = Math.sqrt(1 - t * t) * 1.02;
      if (horizontal) k.put(G.ring(), ringMat, [c[0], c[1], c[2] + t * r[2]], [r[0] * f, r[1] * f, 2]);
      else k.put(G.ring(), ringMat, [c[0], c[1] + t * r[1], c[2]], [r[0] * f, r[2] * f, 2], [Math.PI / 2, 0, 0]);
    });
  }
  if (has("orbs")) {
    const orb = k.mat("#22c55e");
    const glow = k.mat("#fde047");
    [[-0.45, -0.1], [0, 0.1], [0.45, -0.1]].forEach(([x, z]) => {
      k.sphere(orb, [x, ty + 0.12, z], 0.24);
      k.sphere(glow, [x, ty + 0.22, z + 0.12], [0.08, 0.11, 0.05]);
    });
  }
  if (has("blossom")) {
    const pink = k.mat("#f9a8d4");
    [[-0.5, 1.5, 0.3], [0.45, 1.6, 0.25], [0.1, 2.1, 0.3], [-0.2, 1.85, 0.5], [0.35, 1.95, -0.35]].forEach((p) => k.sphere(pink, p, 0.11));
  }
}

const FLOATERS = new Set(["fish", "ptero", "balloon", "cloud"]);

export function buildBbModel(spec, worldHeight) {
  const kit = makeKit(spec.a, spec.b);
  const builder = BUILDERS[spec.template] || BUILDERS.blob;
  const anchor = builder(kit);
  const extras = spec.extras || [];
  addExtras(kit, extras, anchor);
  kit.face(spec.face, anchor.face.slice(0, 3), anchor.face[3]);

  kit.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(kit.root);
  const size = box.getSize(new THREE.Vector3());
  const rawHeight = size.y || 1;
  kit.root.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);

  const unit = new THREE.Group();
  unit.add(kit.root);
  unit.scale.setScalar(1 / rawHeight);
  if (FLOATERS.has(spec.template)) unit.position.y = 0.12;

  const footprint = Math.max(size.x, size.z) / rawHeight / 2;
  const disposables = [];
  if (extras.includes("aura")) {
    const auraMat = new THREE.MeshBasicMaterial({ color: spec.b, transparent: true, opacity: 0.16, depthWrite: false });
    disposables.push(auraMat);
    const aura = new THREE.Mesh(G.sphere(), auraMat);
    aura.position.y = 0.5;
    aura.scale.set(Math.max(0.7, footprint * 1.25), 0.72, Math.max(0.7, footprint * 1.25));
    unit.add(aura);
  }
  if (extras.includes("sparkle")) {
    const sparkleMat = new THREE.MeshBasicMaterial({ color: "#fef9c3" });
    disposables.push(sparkleMat);
    [[0.6, 0.9, 0.2], [-0.55, 0.75, -0.3], [0.35, 1.08, -0.45], [-0.3, 0.3, 0.55]].forEach(([x, y, z]) => {
      const star = new THREE.Mesh(G.octa(), sparkleMat);
      star.position.set(x * Math.max(1, footprint * 1.5), y, z * Math.max(1, footprint * 1.5));
      star.scale.setScalar(0.05);
      unit.add(star);
    });
  }

  const group = new THREE.Group();
  group.add(unit);
  group.scale.setScalar(worldHeight);
  const { c, r } = anchor.body;
  const seat = anchor.seat || [c[0], c[1] + r[1] * 0.9, c[2]];
  const toWorld = (value, offset) => ((value + offset) / rawHeight) * worldHeight;
  return {
    group,
    materials: kit.materials,
    disposables: [...kit.materials, ...disposables],
    height: worldHeight,
    radius: Math.max(0.3, footprint * worldHeight),
    seat: [
      toWorld(seat[0], kit.root.position.x),
      toWorld(seat[1], kit.root.position.y) + unit.position.y * worldHeight,
      toWorld(seat[2], kit.root.position.z)
    ]
  };
}
