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

  function interiorProps(b, rand) {
    const props = [];
    let nextId = b.id * 100;
    const floor = b.floor;
    const pad = 1.4;
    const innerW = b.w - pad * 2;
    const innerD = b.d - pad * 2;
    const types = ["desk", "shelf", "crate", "chair", "counter"];
    const count = b.type === "warehouse" ? 8 : b.type === "tower" ? 4 : 6;
    for (let i = 0; i < count; i += 1) {
      const type = types[Math.floor(rand() * types.length)];
      const px = b.x + (rand() - 0.5) * innerW * 0.85;
      const pz = b.z + (rand() - 0.5) * innerD * 0.85;
      let w = 1.2;
      let d = 0.8;
      let h = 1;
      if (type === "shelf") {
        w = 1.8;
        d = 0.5;
        h = 2.2;
      } else if (type === "crate") {
        w = d = h = 0.9;
      } else if (type === "counter") {
        w = 2.4;
        d = 0.9;
        h = 1.1;
      } else if (type === "chair") {
        w = 0.7;
        d = 0.7;
        h = 1.2;
      }
      props.push({
        id: nextId++,
        buildingId: b.id,
        type,
        x: px,
        z: pz,
        y: floor,
        w,
        d,
        h,
        hp: type === "crate" ? 35 : 55,
        broken: false
      });
    }
    return props;
  }

  function generateRoads(map, rand, terrainHeight, overlaps) {
    const roads = [];
    const lane = 7;
    const spokes = 6;
    for (let i = 0; i < spokes; i += 1) {
      const angle = (i / spokes) * Math.PI * 2 + rand() * 0.08;
      for (let dist = 40; dist < 300; dist += 28) {
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        if (Math.hypot(x, z) > 340) continue;
        const y = terrainHeight(map, x, z);
        if (y < 1) continue;
        if (overlaps.some((o) => Math.hypot(o.x - x, o.z - z) < o.radius + lane)) continue;
        roads.push({ x, z, w: lane, d: 24, y });
      }
    }
    for (let ring = 80; ring <= 260; ring += 70) {
      const segments = Math.max(8, Math.floor(ring / 18));
      for (let i = 0; i < segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        const x = Math.cos(a) * ring;
        const z = Math.sin(a) * ring;
        const y = terrainHeight(map, x, z);
        if (y < 1) continue;
        roads.push({ x, z, w: 24, d: lane, y });
      }
    }
    return roads;
  }

  function stoplightsForRoads(roads, rand) {
    const lights = [];
    const seen = new Set();
    roads.forEach((road, index) => {
      if (index % 5 !== 0) return;
      const key = `${Math.round(road.x / 12)},${Math.round(road.z / 12)}`;
      if (seen.has(key)) return;
      seen.add(key);
      lights.push({
        id: lights.length,
        x: road.x + (rand() - 0.5) * 4,
        z: road.z + (rand() - 0.5) * 4,
        y: road.y,
        hp: 70,
        broken: false
      });
    });
    return lights.slice(0, 48);
  }

  root.BBWorldCity = {
    DOOR_WIDTH,
    doorForBuilding,
    interiorProps,
    generateRoads,
    stoplightsForRoads
  };

  if (typeof module !== "undefined") {
    module.exports = root.BBWorldCity;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
