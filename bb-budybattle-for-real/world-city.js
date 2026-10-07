(function (root) {
  const DOOR_WIDTH = 2.6;

  function doorForBuilding(b) {
    const halfW = b.w / 2;
    const halfD = b.d / 2;
    const y = b.floor;
    let x = b.x;
    let z = b.z;
    let yaw = 0;
    if (b.door === 0) {
      z = b.z - halfD;
      yaw = 0;
    } else if (b.door === 1) {
      z = b.z + halfD;
      yaw = Math.PI;
    } else if (b.door === 2) {
      x = b.x - halfW;
      yaw = Math.PI / 2;
    } else {
      x = b.x + halfW;
      yaw = -Math.PI / 2;
    }
    return {
      id: b.id,
      buildingId: b.id,
      x,
      z,
      y,
      yaw,
      w: DOOR_WIDTH,
      h: 2.6,
      open: false,
      broken: false,
      hp: 120
    };
  }

  const PROP_SPECS = {
    bed: { w: 1.6, d: 2.2, h: 1.1, wall: true, hp: 70 },
    wardrobe: { w: 1.4, d: 0.6, h: 2.2, wall: true, hp: 70 },
    sofa: { w: 2.2, d: 0.9, h: 0.95, wall: true, hp: 60 },
    tv: { w: 1.6, d: 0.5, h: 1.35, wall: true, hp: 40 },
    table: { w: 1.6, d: 1, h: 0.8, wall: false, hp: 50 },
    chair: { w: 0.6, d: 0.6, h: 1, wall: false, hp: 30 },
    kitchen: { w: 2.4, d: 0.7, h: 1, wall: true, hp: 80 },
    fridge: { w: 0.9, d: 0.8, h: 2, wall: true, hp: 80 },
    bookshelf: { w: 1.6, d: 0.4, h: 2.1, wall: true, hp: 60 },
    plant: { w: 0.6, d: 0.6, h: 1.3, wall: false, hp: 20 },
    lamp: { w: 0.45, d: 0.45, h: 1.7, wall: false, hp: 20 },
    shelfGoods: { w: 2.4, d: 0.6, h: 1.9, wall: true, hp: 70 },
    counter: { w: 2.4, d: 0.8, h: 1.1, wall: false, hp: 80 },
    crate: { w: 0.9, d: 0.9, h: 0.9, wall: false, hp: 35 },
    barrel: { w: 0.8, d: 0.8, h: 1.1, wall: false, hp: 45 },
    pallet: { w: 1.2, d: 1, h: 1.4, wall: false, hp: 50 },
    rack: { w: 3, d: 0.9, h: 2.6, wall: true, hp: 100 },
    desk: { w: 1.6, d: 0.8, h: 1.2, wall: false, hp: 55 },
    officeChair: { w: 0.6, d: 0.6, h: 1.1, wall: false, hp: 30 },
    cooler: { w: 0.4, d: 0.4, h: 1.45, wall: true, hp: 25 },
    cabinet: { w: 0.5, d: 0.6, h: 1.3, wall: true, hp: 50 }
  };

  const ROOM_SETS = {
    house: [
      ["sofa", "tv", "kitchen", "fridge", "bookshelf", "table", "chair", "chair", "plant", "lamp"],
      ["bed", "wardrobe", "bookshelf", "bed", "desk", "chair", "lamp", "plant"]
    ],
    shop: [
      ["shelfGoods", "shelfGoods", "shelfGoods", "shelfGoods", "fridge", "counter", "crate", "plant"],
      ["shelfGoods", "cabinet", "pallet", "crate", "crate", "table", "chair", "chair"]
    ],
    warehouse: [
      ["rack", "rack", "rack", "rack", "pallet", "pallet", "pallet", "crate", "crate", "crate", "barrel", "barrel", "barrel"],
      ["rack", "rack", "cabinet", "pallet", "crate", "crate", "barrel", "barrel", "desk", "officeChair"]
    ],
    tower: [
      ["sofa", "sofa", "cooler", "counter", "table", "chair", "chair", "plant", "plant"],
      ["bookshelf", "cabinet", "cabinet", "cooler", "desk", "officeChair", "desk", "officeChair", "desk", "officeChair", "plant"]
    ]
  };

  function interiorProps(b, rand, placeProp) {
    const props = [];
    let nextId = b.id * 100;
    const sets = ROOM_SETS[b.type] || ROOM_SETS.house;
    for (let level = 0; level < b.stories; level += 1) {
      const list = [...sets[level === 0 ? 0 : 1]].sort((a, c) => Number(PROP_SPECS[c].wall) - Number(PROP_SPECS[a].wall));
      list.forEach((type) => {
        const spec = PROP_SPECS[type];
        const spot = placeProp(level, spec);
        if (!spot) return;
        props.push({
          id: nextId++,
          buildingId: b.id,
          type,
          x: spot.x,
          z: spot.z,
          y: spot.y,
          level,
          yaw: spot.yaw,
          w: spec.w,
          d: spec.d,
          h: spec.h,
          variant: Math.floor(rand() * 4),
          hp: spec.hp,
          broken: false
        });
      });
    }
    return props;
  }

  const SPOKE_WIDTH = 8;
  const RING_WIDTH = 7;
  const ROAD_STEP = 2;
  const CAR_COLORS = ["#dc2626", "#2563eb", "#f8fafc", "#111827", "#facc15", "#16a34a", "#9ca3af", "#ea580c"];

  function splitRuns(samples, blocked, minLength) {
    const runs = [];
    let run = [];
    samples.forEach((p) => {
      if (blocked(p.x, p.z)) {
        if (run.length * ROAD_STEP >= minLength) runs.push(run);
        run = [];
      } else run.push(p);
    });
    if (run.length * ROAD_STEP >= minLength) runs.push(run);
    return runs;
  }

  function generateRoads(map, rand, terrainHeight, blocked) {
    const roads = [];
    const spokeAngles = [];
    const spokeCount = 6;
    const offset = rand() * Math.PI * 2;
    const start = map.id === "island" ? 30 : 185;
    const end = 330;
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = offset + (i / spokeCount) * Math.PI * 2 + (rand() - 0.5) * 0.15;
      spokeAngles.push(angle);
      const samples = [];
      for (let dist = start; dist <= end; dist += ROAD_STEP) samples.push({ x: Math.cos(angle) * dist, z: Math.sin(angle) * dist });
      splitRuns(samples, (x, z) => blocked(x, z, SPOKE_WIDTH / 2 + 1.5), 16).forEach((points) => {
        roads.push({ kind: "spoke", width: SPOKE_WIDTH, angle, points: points.map((p) => ({ ...p, y: terrainHeight(map, p.x, p.z) })) });
      });
    }
    const ringRadii = map.id === "island" ? [95, 180, 265] : [215, 285];
    ringRadii.forEach((radius) => {
      const count = Math.round((Math.PI * 2 * radius) / ROAD_STEP);
      const samples = [];
      for (let i = 0; i <= count; i += 1) {
        const a = (i / count) * Math.PI * 2;
        samples.push({ x: Math.cos(a) * radius, z: Math.sin(a) * radius });
      }
      splitRuns(samples, (x, z) => blocked(x, z, RING_WIDTH / 2 + 1.5), 16).forEach((points) => {
        roads.push({ kind: "ring", width: RING_WIDTH, radius, points: points.map((p) => ({ ...p, y: terrainHeight(map, p.x, p.z) })) });
      });
    });
    const onRoad = (kind, x, z) => roads.some((road) => road.kind === kind && road.points.some((p) => Math.hypot(p.x - x, p.z - z) < ROAD_STEP));
    const intersections = [];
    spokeAngles.forEach((angle) => {
      ringRadii.forEach((radius) => {
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (onRoad("spoke", x, z) && onRoad("ring", x, z)) intersections.push({ x, z, y: terrainHeight(map, x, z), angle });
      });
    });
    return { roads, intersections };
  }

  function nearIntersection(intersections, x, z, range) {
    return intersections.some((it) => Math.hypot(it.x - x, it.z - z) < range);
  }

  function roadFrame(points, i) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    const tx = (b.x - a.x) / len;
    const tz = (b.z - a.z) / len;
    return { tx, tz, nx: -tz, nz: tx };
  }

  function streetFurniture(map, rand, terrainHeight, roads, intersections) {
    const stoplights = [];
    intersections.forEach((it) => {
      const ux = Math.cos(it.angle);
      const uz = Math.sin(it.angle);
      const ou = RING_WIDTH / 2 + 1.4;
      const ov = SPOKE_WIDTH / 2 + 1.4;
      [1, -1].forEach((sgn) => {
        const x = it.x + sgn * (ux * ou - uz * ov);
        const z = it.z + sgn * (uz * ou + ux * ov);
        stoplights.push({ id: stoplights.length, x, z, y: terrainHeight(map, x, z), yaw: Math.atan2(it.x - x, it.z - z), hp: 70, broken: false });
      });
    });
    const lamps = [];
    const cars = [];
    roads.forEach((road) => {
      const lampEvery = road.kind === "spoke" ? 13 : 15;
      let side = 1;
      road.points.forEach((p, i) => {
        if (i % lampEvery !== Math.floor(lampEvery / 2)) return;
        if (nearIntersection(intersections, p.x, p.z, 12)) return;
        const f = roadFrame(road.points, i);
        const off = road.width / 2 + 1.1;
        const x = p.x + f.nx * off * side;
        const z = p.z + f.nz * off * side;
        lamps.push({ id: lamps.length, x, z, y: terrainHeight(map, x, z), yaw: Math.atan2(-f.nx * side, -f.nz * side) });
        side = -side;
      });
      road.points.forEach((p, i) => {
        if (i % 11 !== 5 || rand() > 0.32) return;
        if (nearIntersection(intersections, p.x, p.z, 14)) return;
        const f = roadFrame(road.points, i);
        const sgn = rand() < 0.5 ? 1 : -1;
        const off = road.width / 2 - 1.15;
        const x = p.x + f.nx * off * sgn;
        const z = p.z + f.nz * off * sgn;
        const yaw = Math.atan2(f.tx, f.tz) + (rand() < 0.5 ? 0 : Math.PI);
        cars.push({ id: cars.length, x, z, y: terrainHeight(map, x, z), yaw, color: CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)] });
      });
    });
    const carBlocks = [];
    cars.forEach((car) => {
      [-1.15, 1.15].forEach((along) => carBlocks.push({ car: car.id, x: car.x + Math.sin(car.yaw) * along, z: car.z + Math.cos(car.yaw) * along, radius: 1 }));
    });
    return { stoplights, lamps, cars, carBlocks };
  }

  root.BBWorldCity = {
    DOOR_WIDTH,
    PROP_SPECS,
    SPOKE_WIDTH,
    RING_WIDTH,
    doorForBuilding,
    interiorProps,
    generateRoads,
    streetFurniture,
    nearIntersection,
    roadFrame
  };

  if (typeof module !== "undefined") {
    module.exports = root.BBWorldCity;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
