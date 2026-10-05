(function () {
  const PLAYER_HEIGHT = 2.1;
  const prefixes = {
    animal: ["Tiny", "Swift", "Dusty", "River", "Shadow", "Copper", "Moss", "Bumble", "Prickle", "Golden"],
    plant: ["Sprout", "Vine", "Bloom", "Thorn", "Root", "Petal", "Cactus", "Fern", "Bark", "Spore"],
    dinosaur: ["Rex", "Raptor", "Tri", "Stego", "Bronto", "Anky", "Ptera", "Dilo", "Cera", "Spino"]
  };
  const cores = {
    animal: ["Fox", "Hare", "Boar", "Otter", "Badger", "Lynx", "Mole", "Crow", "Frog", "Goat", "Panda", "Koala", "Sloth", "Crab", "Newt"],
    plant: ["Sprig", "Bulb", "Leaf", "Bloom", "Creeper", "Shrub", "Palm", "Kelp", "Lotus", "Clover", "Thistle", "Bamboo", "Moss", "Fungus", "Seaweed"],
    dinosaur: ["Saur", "Don", "Cerat", "Raptor", "Ptero", "Ankylo", "Stego", "Bronto", "Compy", "Gallim", "Theriz", "Iguano", "Diplo", "Carno", "Para"]
  };
  const suffixes = ["ling", "let", "kin", "puff", "claw", "tail", "horn", "scale", "bud", "tooth"];
  const rarities = ["common", "common", "common", "uncommon", "uncommon", "rare", "legendary", "heroic"];
  const CATALOG = [];

  for (let i = 0; i < 150; i += 1) {
    const kind = i % 3 === 0 ? "animal" : i % 3 === 1 ? "plant" : "dinosaur";
    const pre = prefixes[kind][i % prefixes[kind].length];
    const core = cores[kind][Math.floor(i / 3) % cores[kind].length];
    const suf = suffixes[i % suffixes.length];
    const name = `${pre} ${core}${suf}`;
    const rarity = rarities[i % rarities.length];
    const sizeScale = 0.45 + (i % 13) * 0.18 + (kind === "dinosaur" ? 0.35 : kind === "plant" ? -0.05 : 0);
    const rideable = sizeScale >= 1.75;
    const hp = Math.round(30 + sizeScale * 55 + (rarity === "heroic" ? 120 : rarity === "legendary" ? 80 : 0));
    const damage = Math.round(8 + sizeScale * 12);
    const defense = Math.round(sizeScale * 3 * 10) / 10;
    const speed = sizeScale >= 2.2 ? "Slow" : sizeScale >= 1.4 ? "Fast" : undefined;
    CATALOG.push({
      name,
      rarity,
      art: `creature_${kind}_${i % 15}`,
      creatureKind: kind,
      creatureVariant: i % 15,
      sizeScale: Math.round(sizeScale * 100) / 100,
      rideable,
      hp,
      damage,
      defense,
      speed
    });
  }

  globalThis.BB_PLAYER_HEIGHT = PLAYER_HEIGHT;
  globalThis.BBCreatureCatalog = CATALOG;
  if (typeof module !== "undefined") {
    module.exports = { BBCreatureCatalog: CATALOG, BB_PLAYER_HEIGHT: PLAYER_HEIGHT };
  }
})();
