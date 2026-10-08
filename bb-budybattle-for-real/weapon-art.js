const WPN_O = 'stroke="#0b1220" stroke-width="0.8" stroke-linejoin="round"';
const WPN_SHINE = 'stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none" stroke-linecap="round"';

function wf(name) {
  return `url(#wpn-${name})`;
}

function wn(value) {
  return Math.round(value * 100) / 100;
}

function wpnGradient(id, stops, horizontal = false) {
  const dir = horizontal ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
  const body = stops
    .map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`)
    .join("");
  return `<linearGradient id="wpn-${id}" ${dir}>${body}</linearGradient>`;
}

const WEAPON_ART_DEFS = `
  <svg class="wpn-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      ${wpnGradient("steel", [[0, "#f8fafc"], [0.42, "#cbd5e1"], [0.58, "#8b9bb0"], [1, "#e2e8f0"]])}
      ${wpnGradient("dark", [[0, "#94a3b8"], [0.5, "#334155"], [1, "#64748b"]])}
      ${wpnGradient("iron", [[0, "#71717a"], [0.5, "#18181b"], [1, "#3f3f46"]])}
      ${wpnGradient("wood", [[0, "#c58a52"], [0.5, "#8b5a2b"], [1, "#5c3a1a"]])}
      ${wpnGradient("woodlight", [[0, "#f1d3a8"], [0.5, "#c99c66"], [1, "#9a6d3e"]])}
      ${wpnGradient("black", [[0, "#6b7280"], [0.45, "#111827"], [1, "#374151"]])}
      ${wpnGradient("red", [[0, "#fca5a5"], [0.45, "#dc2626"], [1, "#7f1d1d"]])}
      ${wpnGradient("orange", [[0, "#fed7aa"], [0.45, "#ea580c"], [1, "#9a3412"]])}
      ${wpnGradient("gold", [[0, "#fef3c7"], [0.4, "#f59e0b"], [1, "#92400e"]])}
      ${wpnGradient("yellow", [[0, "#fef9c3"], [0.45, "#facc15"], [1, "#a16207"]])}
      ${wpnGradient("blue", [[0, "#bfdbfe"], [0.45, "#2563eb"], [1, "#1e3a8a"]])}
      ${wpnGradient("green", [[0, "#bbf7d0"], [0.45, "#16a34a"], [1, "#14532d"]])}
      ${wpnGradient("glass", [[0, "#ffffff"], [0.5, "#dbeafe"], [1, "#94a3b8"]], true)}
      ${wpnGradient("plasma", [[0, "#22d3ee"], [0.5, "#ffffff"], [1, "#22d3ee"]])}
      ${wpnGradient("plasmapink", [[0, "#f472b6"], [0.5, "#fff1f8"], [1, "#db2777"]])}
      ${wpnGradient("liquidblue", [[0, "#7dd3fc"], [0.45, "#2563eb"], [1, "#1e3a8a"]])}
      ${wpnGradient("liquidgreen", [[0, "#bef264"], [0.45, "#22c55e"], [1, "#14532d"]])}
      ${wpnGradient("liquidred", [[0, "#fca5a5"], [0.45, "#dc2626"], [1, "#7f1d1d"]])}
      ${wpnGradient("liquidfire", [[0, "#dc2626"], [0.45, "#f97316"], [1, "#fde047"]])}
      ${wpnGradient("sack", [[0, "#ecd2a6"], [0.5, "#b9864f"], [1, "#7c5230"]])}
      <filter id="wpn-shadow" x="-10%" y="-30%" width="120%" height="160%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.2" flood-color="#000" flood-opacity=".5"/>
      </filter>
      <filter id="wpn-glow" x="-20%" y="-80%" width="140%" height="260%">
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <clipPath id="wpn-racket-clip"><ellipse cx="114" cy="24" rx="31" ry="17"/></clipPath>
    </defs>
  </svg>
`;

function wpnHandle(x, len, h = 8, fill = "wood", rivets = 2) {
  const y = 24 - h / 2;
  let out = `<rect x="${x}" y="${wn(y)}" width="${len}" height="${h}" rx="${Math.min(h / 2, 3.5)}" fill="${wf(fill)}" ${WPN_O}/>`;
  out += `<line x1="${x + 2}" y1="${wn(y + h * 0.28)}" x2="${x + len - 2}" y2="${wn(y + h * 0.28)}" ${WPN_SHINE}/>`;
  for (let i = 0; i < rivets; i += 1) {
    const cx = x + (len * (i + 1)) / (rivets + 1);
    out += `<circle cx="${wn(cx)}" cy="24" r="1.4" fill="${wf("steel")}" stroke="#334155" stroke-width=".5"/>`;
  }
  return out;
}

function wpnPole(x1, x2, h = 4, fill = "wood") {
  return wpnHandle(x1, x2 - x1, h, fill, 0);
}

function wpnBands(xs, h, fill = "black") {
  return xs
    .map((x) => `<rect x="${x}" y="${wn(24 - h / 2 - 0.6)}" width="3" height="${wn(h + 1.2)}" rx="1" fill="${wf(fill)}" ${WPN_O}/>`)
    .join("");
}

function wpnBlade({ x, len, w, tip = "point", curve = 0, serrated = false, fill = "steel", hamon = false }) {
  const t = 24 - w / 2;
  const b = 24 + w / 2;
  const end = x + len;
  let d;
  let shine = `M${x + 2} ${wn(24 - w * 0.12)} L${wn(x + len * 0.7)} ${wn(24 - w * 0.12)}`;
  if (tip === "round") {
    d = `M${x} ${t} L${wn(end - w / 2)} ${t} A${w / 2} ${w / 2} 0 0 1 ${wn(end - w / 2)} ${b} L${x} ${b} Z`;
  } else if (tip === "square") {
    d = `M${x} ${t} L${end} ${t} L${end} ${b} L${x} ${b} Z`;
  } else if (tip === "double") {
    d = `M${x} ${t} L${wn(x + len * 0.86)} ${wn(t + w * 0.08)} L${end} 24 L${wn(x + len * 0.86)} ${wn(b - w * 0.08)} L${x} ${b} Z`;
    shine = `M${x + 2} 24 L${wn(x + len * 0.84)} 24`;
  } else if (curve) {
    const tipY = t - curve;
    d = `M${x} ${t} Q${wn(x + len * 0.6)} ${wn(t - curve * 0.2)} ${end} ${wn(tipY)} Q${wn(x + len * 0.66)} ${wn(b - curve * 0.4)} ${x} ${b} Z`;
    shine = `M${x + 2} ${wn(t + w * 0.3)} Q${wn(x + len * 0.55)} ${wn(t + w * 0.3 - curve * 0.25)} ${wn(x + len * 0.85)} ${wn(t - curve * 0.6)}`;
  } else {
    d = `M${x} ${t} L${wn(x + len * 0.78)} ${t} L${end} ${wn(t + w * 0.18)} Q${wn(x + len * 0.72)} ${b} ${wn(x + len * 0.48)} ${b} L${x} ${b} Z`;
  }
  let out = `<path d="${d}" fill="${wf(fill)}" ${WPN_O}/>`;
  out += `<path d="${shine}" ${WPN_SHINE}/>`;
  if (hamon) {
    let wave = `M${x + 3} ${wn(24 + w * 0.15)}`;
    for (let px = x + 3; px < x + len * 0.78; px += 8) wave += ` q2 -1.6 4 0 t4 0`;
    out += `<path d="${wave}" stroke="#fff" stroke-opacity=".7" stroke-width=".8" fill="none"/>`;
  }
  if (serrated) {
    let teeth = `M${x + 2} ${b}`;
    for (let px = x + 2; px < x + len * 0.62; px += 3) teeth += ` l1.5 1.6 l1.5 -1.6`;
    out += `<path d="${teeth}" fill="none" stroke="#475569" stroke-width=".8"/>`;
  }
  return out;
}

function wpnGuard(x, type, w) {
  if (type === "cross") {
    return `<rect x="${x - 2}" y="${wn(24 - w * 1.5)}" width="4" height="${wn(w * 3)}" rx="1.6" fill="${wf("gold")}" ${WPN_O}/>`
      + `<circle cx="${x}" cy="${wn(24 - w * 1.5)}" r="2" fill="${wf("gold")}" ${WPN_O}/>`
      + `<circle cx="${x}" cy="${wn(24 + w * 1.5)}" r="2" fill="${wf("gold")}" ${WPN_O}/>`;
  }
  if (type === "tsuba") return `<ellipse cx="${x}" cy="24" rx="2.6" ry="${wn(w * 1.25)}" fill="${wf("iron")}" ${WPN_O}/>`;
  if (type === "bar") return `<rect x="${x - 1.6}" y="${wn(24 - w * 0.6)}" width="3.2" height="${wn(w * 1.2)}" rx="1.2" fill="${wf("steel")}" ${WPN_O}/>`;
  if (type === "basket") {
    return `<path d="M${x} ${wn(24 - w * 1.8)} Q${x - 26} 24 ${x} ${wn(24 + w * 1.8)}" fill="none" stroke="#b7791f" stroke-width="2.2"/>`
      + `<path d="M${x} ${wn(24 - w * 1.2)} Q${x - 16} 24 ${x} ${wn(24 + w * 1.2)}" fill="none" stroke="#f6c453" stroke-width="1.2"/>`
      + `<ellipse cx="${x}" cy="24" rx="2" ry="${wn(w * 1.9)}" fill="${wf("gold")}" ${WPN_O}/>`;
  }
  return "";
}

function wpnKnife({ hx = 10, hl = 34, hh = 8, handle = "wood", rivets = 2, guard = "", wrap = false, pommel = "", blade }) {
  const bx = hx + hl + (guard ? 2 : 0);
  let out = wpnBlade({ x: bx - 1, ...blade });
  out += wpnHandle(hx, hl, hh, handle, rivets);
  if (wrap) {
    for (let cx = hx + 5; cx < hx + hl - 2; cx += 6) {
      out += `<path d="M${cx} ${wn(24 - hh / 2 + 0.8)} l2.6 ${wn(hh / 2 - 0.8)} l-2.6 ${wn(hh / 2 - 0.8)} l-2.6 ${wn(-(hh / 2 - 0.8))} Z" fill="#e5e7eb" fill-opacity=".75"/>`;
    }
  }
  if (guard) out += wpnGuard(hx + hl + 1, guard, blade.w);
  if (pommel) out += `<circle cx="${hx}" cy="24" r="${wn(hh * 0.62)}" fill="${wf(pommel)}" ${WPN_O}/>`;
  return out;
}

function wpnTines(x, n, len, spread, fill = "steel", tw = 2.2) {
  const top = 24 - spread / 2;
  let out = `<path d="M${x - 8} 22.5 Q${x - 2} ${wn(top)} ${x + 4} ${wn(top)} L${x + 4} ${wn(top + spread)} Q${x - 2} ${wn(top + spread)} ${x - 8} 25.5 Z" fill="${wf(fill)}" ${WPN_O}/>`;
  for (let i = 0; i < n; i += 1) {
    const y = top + ((spread - tw) * i) / Math.max(n - 1, 1);
    const x0 = x + 3;
    out += `<path d="M${x0} ${wn(y)} L${wn(x0 + len - 3)} ${wn(y)} L${x0 + len} ${wn(y + tw / 2)} L${wn(x0 + len - 3)} ${wn(y + tw)} L${x0} ${wn(y + tw)} Z" fill="${wf(fill)}" ${WPN_O}/>`;
  }
  return out;
}

function wpnAxeHead(cx, size, fill = "steel", double = false) {
  const half = (flip) => {
    const head = `M${cx - 6} 24 L${cx - 6} 19 L${cx + 6} 19 L${cx + 6} 24 Z`;
    const blade = `M${cx - 5} 27 L${cx + 5} 27 Q${wn(cx + size * 0.6)} ${wn(28 + size * 0.45)} ${wn(cx + size)} ${wn(27 + size)} Q${cx} ${wn(29 + size * 1.1)} ${wn(cx - size)} ${wn(27 + size)} Q${wn(cx - size * 0.6)} ${wn(28 + size * 0.45)} ${cx - 5} 27 Z`;
    const edge = `M${wn(cx - size + 1)} ${wn(26 + size)} Q${cx} ${wn(28 + size * 1.05)} ${wn(cx + size - 1)} ${wn(26 + size)}`;
    const body = `<path d="${blade}" fill="${wf(fill)}" ${WPN_O}/><path d="${edge}" ${WPN_SHINE}/>`;
    return flip ? `<g transform="translate(0 48) scale(1 -1)">${body}</g>` : body + `<path d="${head}" fill="${wf(fill)}" ${WPN_O}/>`;
  };
  let out = half(false);
  if (double) out += half(true);
  out += `<rect x="${cx - 6}" y="19" width="12" height="10" rx="2" fill="${wf("dark")}" ${WPN_O}/>`;
  return out;
}

function wpnSpikedBall(cx, cy, r, spikes, fill = "steel", spikeLen = 6) {
  let out = "";
  for (let i = 0; i < spikes; i += 1) {
    const a = (Math.PI * 2 * i) / spikes;
    const spread = Math.PI / spikes * 0.7;
    const p1 = [cx + Math.cos(a - spread) * r, cy + Math.sin(a - spread) * r];
    const p2 = [cx + Math.cos(a + spread) * r, cy + Math.sin(a + spread) * r];
    const tip = [cx + Math.cos(a) * (r + spikeLen), cy + Math.sin(a) * (r + spikeLen)];
    out += `<path d="M${wn(p1[0])} ${wn(p1[1])} L${wn(tip[0])} ${wn(tip[1])} L${wn(p2[0])} ${wn(p2[1])} Z" fill="${wf(fill)}" ${WPN_O}/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${wf(fill)}" ${WPN_O}/>`;
  out += `<ellipse cx="${wn(cx - r * 0.35)}" cy="${wn(cy - r * 0.4)}" rx="${wn(r * 0.35)}" ry="${wn(r * 0.22)}" fill="#fff" fill-opacity=".45"/>`;
  return out;
}

function wpnChain(x1, x2, y1, y2, sag = 4) {
  let out = "";
  const count = Math.max(3, Math.round((x2 - x1) / 6));
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag;
    const vertical = i % 2 === 1;
    out += `<ellipse cx="${wn(x)}" cy="${wn(y)}" rx="${vertical ? 1.6 : 3.4}" ry="${vertical ? 2.6 : 1.8}" fill="none" stroke="#94a3b8" stroke-width="1.4"/>`;
  }
  return out;
}

function wpnTeeth(x1, x2, y, size = 2.4, dir = 1) {
  let d = `M${x1} ${y}`;
  for (let x = x1; x < x2; x += size) d += ` l${wn(size / 2)} ${wn(size * dir)} l${wn(size / 2)} ${wn(-size * dir)}`;
  return `<path d="${d}" fill="${wf("steel")}" stroke="#334155" stroke-width=".6" stroke-linejoin="round"/>`;
}

function wpnStar(cx, cy, points, outer, inner) {
  let d = "";
  for (let i = 0; i < points * 2; i += 1) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    d += `${i === 0 ? "M" : "L"}${wn(cx + Math.cos(a) * r)} ${wn(cy + Math.sin(a) * r)} `;
  }
  return `${d}Z`;
}

const WEAPON_ART = {
  "Fork": () => wpnHandle(10, 72, 6, "steel", 0) + wpnTines(92, 4, 46, 15),
  "Butter Knife": () => wpnKnife({ hl: 46, hh: 7, handle: "steel", rivets: 0, blade: { len: 74, w: 10, tip: "round", serrated: true } }),
  "Spoon": () => wpnHandle(10, 84, 6, "steel", 0)
    + `<ellipse cx="118" cy="24" rx="24" ry="12" fill="${wf("steel")}" ${WPN_O}/>`
    + `<ellipse cx="120" cy="25" rx="18" ry="8" fill="${wf("dark")}" fill-opacity=".35"/>`
    + `<ellipse cx="112" cy="20" rx="9" ry="3" fill="#fff" fill-opacity=".6"/>`,
  "Kitchen Knife": () => wpnKnife({ hl: 38, handle: "black", rivets: 3, guard: "bar", blade: { len: 94, w: 17 } }),
  "Steak Knife": () => wpnKnife({ hl: 42, handle: "wood", rivets: 3, blade: { len: 72, w: 10, serrated: true } }),
  "Bread Knife": () => wpnKnife({ hl: 40, handle: "black", rivets: 2, blade: { len: 98, w: 12, tip: "round", serrated: true } }),
  "Katana": () => wpnKnife({ hl: 36, handle: "black", rivets: 0, wrap: true, guard: "tsuba", pommel: "gold", blade: { len: 104, w: 7, curve: 6, hamon: true } }),
  "Machete": () => wpnKnife({ hl: 34, handle: "black", rivets: 3, blade: { len: 104, w: 15 } }),
  "Cleaver": () => wpnHandle(10, 40, 8, "wood", 3)
    + `<path d="M50 15 L124 15 Q128 15 128 19 L128 42 L50 42 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M50 39 L128 39" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>`
    + `<path d="M54 19 L120 19" ${WPN_SHINE}/>`
    + `<circle cx="118" cy="22" r="3.2" fill="#0b1a33" ${WPN_O}/>`,
  "Paring Knife": () => wpnKnife({ hl: 36, handle: "wood", rivets: 2, blade: { len: 48, w: 9 } }),
  "Rolling Pin": () => wpnHandle(8, 28, 7, "wood", 0) + wpnHandle(124, 28, 7, "wood", 0)
    + `<rect x="34" y="14" width="92" height="20" rx="5" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M40 19 Q80 17 120 19 M44 28 Q82 30 118 27" stroke="#8b5a2b" stroke-opacity=".45" stroke-width=".8" fill="none"/>`
    + `<line x1="38" y1="17.5" x2="122" y2="17.5" ${WPN_SHINE}/>`,
  "Whisk": () => {
    let wires = "";
    [4, 8, 12, 16].forEach((s) => {
      wires += `<path d="M62 24 C92 ${24 - s} 146 ${24 - s * 1.15} 146 24 C146 ${24 + s * 1.15} 92 ${24 + s} 62 24" fill="none" stroke="#cbd5e1" stroke-width="1.3"/>`;
    });
    return wires + `<path d="M62 24 L146 24" stroke="#cbd5e1" stroke-width="1.3"/>` + wpnHandle(10, 54, 9, "steel", 0) + wpnBands([60], 9, "dark");
  },
  "Ladle": () => wpnHandle(10, 96, 5, "steel", 0)
    + `<circle cx="14" cy="24" r="2" fill="#0b1a33"/>`
    + `<circle cx="128" cy="24" r="16" fill="${wf("steel")}" ${WPN_O}/>`
    + `<ellipse cx="130" cy="22" rx="12" ry="9" fill="${wf("dark")}" fill-opacity=".4"/>`
    + `<ellipse cx="122" cy="17" rx="6" ry="2.4" fill="#fff" fill-opacity=".6"/>`,
  "Tongs": () => `<path d="M14 21 L142 8 L144 13 L16 25 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M14 27 L142 40 L144 35 L16 23 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="128" y="6" width="18" height="8" rx="3" fill="${wf("red")}" ${WPN_O} transform="rotate(-6 137 10)"/>`
    + `<rect x="128" y="34" width="18" height="8" rx="3" fill="${wf("red")}" ${WPN_O} transform="rotate(6 137 38)"/>`
    + `<circle cx="14" cy="24" r="5" fill="${wf("dark")}" ${WPN_O}/>`,
  "Meat Fork": () => wpnHandle(10, 42, 9, "wood", 2) + `<rect x="52" y="22" width="34" height="4" fill="${wf("steel")}" ${WPN_O}/>` + wpnTines(92, 2, 54, 11, "steel", 2.6),
  "Peeler": () => wpnHandle(10, 62, 11, "green", 0)
    + `<path d="M72 17 L132 17 Q136 17 136 21 L136 27 Q136 31 132 31 L72 31" fill="none" stroke="${wf("steel")}" stroke-width="3.4"/>`
    + `<rect x="80" y="22" width="50" height="4" rx="1" fill="${wf("steel")}" ${WPN_O}/>`
    + `<line x1="84" y1="24" x2="126" y2="24" stroke="#334155" stroke-width=".8"/>`,
  "Grater": () => {
    let holes = "";
    for (let y = 13; y < 42; y += 5) {
      for (let x = 58 + (y - 13) * 0.18; x < 104 - (y - 13) * -0.18; x += 6) {
        holes += `<path d="M${wn(x)} ${y} q2 -2 4 0" fill="none" stroke="#1e293b" stroke-width="1.1"/>`;
      }
    }
    return `<rect x="70" y="1" width="20" height="5" rx="2.5" fill="${wf("black")}" ${WPN_O}/>`
      + `<path d="M54 6 L106 6 L114 46 L46 46 Z" fill="${wf("steel")}" ${WPN_O}/>` + holes;
  },
  "Corkscrew": () => {
    let coil = "M52 24";
    for (let x = 52; x < 136; x += 12) coil += " q3 -9 6 0 t6 0";
    return `<rect x="10" y="4" width="14" height="40" rx="6" fill="${wf("wood")}" ${WPN_O}/>`
      + `<line x1="13" y1="8" x2="13" y2="40" ${WPN_SHINE}/>`
      + `<rect x="24" y="22" width="28" height="4" fill="${wf("steel")}" ${WPN_O}/>`
      + `<path d="${coil} L148 24" fill="none" stroke="#475569" stroke-width="3.4" stroke-linecap="round"/>`
      + `<path d="${coil} L148 24" fill="none" stroke="#e2e8f0" stroke-width="1.6" stroke-linecap="round"/>`;
  },
  "Can Opener": () => `<rect x="10" y="15" width="94" height="7" rx="3.5" fill="${wf("red")}" ${WPN_O}/>`
    + `<rect x="10" y="26" width="94" height="7" rx="3.5" fill="${wf("red")}" ${WPN_O}/>`
    + `<rect x="100" y="13" width="28" height="22" rx="4" fill="${wf("steel")}" ${WPN_O}/>`
    + `<circle cx="134" cy="24" r="10" fill="${wf("steel")}" stroke="#334155" stroke-width="2.4" stroke-dasharray="2 1.4"/>`
    + `<circle cx="134" cy="24" r="3" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M108 13 Q104 2 114 4 Q124 2 120 13 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "Ice Pick": () => `<path d="M66 21.5 L152 24 L66 26.5 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + wpnHandle(10, 50, 12, "wood", 0)
    + `<rect x="58" y="19" width="9" height="10" rx="2" fill="${wf("steel")}" ${WPN_O}/>`,
  "Scissors": () => `<path d="M38 13 L64 21.5 L144 23 L64 25 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M38 35 L64 26.5 L144 25 L64 23 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<ellipse cx="24" cy="13" rx="13" ry="7.5" fill="none" stroke="${wf("red")}" stroke-width="4.5"/>`
    + `<ellipse cx="24" cy="35" rx="13" ry="7.5" fill="none" stroke="${wf("red")}" stroke-width="4.5"/>`
    + `<circle cx="64" cy="24" r="2.4" fill="${wf("dark")}" ${WPN_O}/>`,
  "Letter Opener": () => wpnKnife({ hl: 40, hh: 7, handle: "gold", rivets: 0, guard: "bar", pommel: "gold", blade: { len: 92, w: 6, tip: "double" } })
    + `<path d="M18 24 l3 -2.4 l3 2.4 l-3 2.4 Z M30 24 l3 -2.4 l3 2.4 l-3 2.4 Z" fill="#b91c1c"/>`,
  "Box Cutter": () => `<path d="M108 19 L132 19 L144 28 L108 28 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M116 19 L124 28 M124 19 L132 28" stroke="#64748b" stroke-width=".8"/>`
    + `<rect x="10" y="16" width="102" height="16" rx="4" fill="${wf("yellow")}" ${WPN_O}/>`
    + `<rect x="18" y="21" width="70" height="6" rx="3" fill="${wf("black")}"/>`
    + `<rect x="90" y="13" width="10" height="5" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`,
  "Switchblade": () => wpnKnife({ hl: 50, hh: 9, handle: "black", rivets: 0, blade: { len: 76, w: 10 } })
    + `<rect x="10" y="19.5" width="6" height="9" rx="2" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="54" y="19.5" width="6" height="9" rx="2" fill="${wf("steel")}" ${WPN_O}/>`
    + `<circle cx="36" cy="22" r="2" fill="${wf("red")}" ${WPN_O}/>`,
  "Pocket Knife": () => `<g transform="rotate(-28 22 21)"><path d="M22 19.6 L4 19.6 L2 21 L4 22.4 L22 22.4 Z" fill="${wf("steel")}" ${WPN_O}/><path d="M6 19.6 L6 17.8 L9 17.8" fill="none" stroke="#475569" stroke-width="1"/></g>`
    + wpnBlade({ x: 66, len: 62, w: 9 })
    + `<path d="M74 21.4 q2.4 -1.6 4.8 0" fill="none" stroke="#475569" stroke-width="1"/>`
    + `<rect x="18" y="16.4" width="52" height="15.2" rx="7.6" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="18" y="17.6" width="52" height="12.8" rx="6.4" fill="${wf("red")}" ${WPN_O}/>`
    + `<line x1="24" y1="20.2" x2="64" y2="20.2" ${WPN_SHINE}/>`
    + `<rect x="42.6" y="20.4" width="2.8" height="7.2" fill="#fff"/><rect x="40.4" y="22.6" width="7.2" height="2.8" fill="#fff"/>`
    + `<circle cx="24" cy="24" r="1.6" fill="${wf("steel")}" stroke="#334155" stroke-width=".5"/>`
    + `<circle cx="64" cy="24" r="1.6" fill="${wf("steel")}" stroke="#334155" stroke-width=".5"/>`
    + `<circle cx="13" cy="24" r="4" fill="none" stroke="#94a3b8" stroke-width="1.6"/>`,
  "Dagger": () => wpnKnife({ hl: 30, handle: "wood", rivets: 0, guard: "cross", pommel: "gold", blade: { len: 84, w: 11, tip: "double" } }),
  "Rapier": () => wpnKnife({ hx: 12, hl: 24, hh: 7, handle: "black", rivets: 0, guard: "basket", pommel: "gold", blade: { len: 112, w: 4, tip: "double" } }),
  "Cutlass": () => wpnKnife({ hx: 12, hl: 26, handle: "wood", rivets: 0, guard: "basket", pommel: "gold", blade: { len: 92, w: 11, curve: 6 } }),
  "Scimitar": () => wpnKnife({ hl: 28, handle: "red", rivets: 0, guard: "cross", pommel: "gold", blade: { len: 98, w: 13, curve: 11 } }),
  "Longsword": () => wpnKnife({ hl: 28, handle: "wood", rivets: 0, guard: "cross", pommel: "steel", blade: { len: 104, w: 8, tip: "double" } }),
  "Greatsword": () => wpnKnife({ hx: 8, hl: 32, hh: 9, handle: "black", rivets: 0, guard: "cross", pommel: "steel", blade: { len: 110, w: 13, tip: "double" } }),
  "Claymore": () => wpnKnife({ hx: 8, hl: 30, hh: 8, handle: "wood", rivets: 0, guard: "cross", pommel: "gold", blade: { len: 108, w: 10, tip: "double" } })
    + `<circle cx="41" cy="12" r="2.4" fill="${wf("gold")}" ${WPN_O}/><circle cx="41" cy="36" r="2.4" fill="${wf("gold")}" ${WPN_O}/>`,
  "Sabre": () => wpnKnife({ hx: 12, hl: 26, hh: 7, handle: "black", rivets: 0, guard: "basket", pommel: "steel", blade: { len: 106, w: 7, curve: 5 } }),
  "Bowie Knife": () => wpnKnife({ hl: 38, hh: 9, handle: "wood", rivets: 3, guard: "cross", blade: { len: 72, w: 15 } }),
  "Kukri": () => wpnKnife({ hl: 38, hh: 9, handle: "wood", rivets: 2, guard: "bar", blade: { len: 78, w: 15, curve: -7 } }),
  "Bayonet": () => wpnKnife({ hl: 36, handle: "black", rivets: 2, guard: "bar", blade: { len: 80, w: 9, tip: "double" } })
    + `<circle cx="47" cy="15" r="3.6" fill="none" stroke="${wf("steel")}" stroke-width="2"/>`,
  "Hatchet": () => wpnPole(10, 120, 6, "wood") + wpnAxeHead(114, 13, "steel"),
  "Battle Axe": () => wpnPole(6, 128, 5, "wood") + wpnBands([20, 32], 5, "black") + wpnAxeHead(126, 16, "steel", true)
    + `<path d="M132 22 L152 24 L132 26 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "Tomahawk": () => wpnPole(10, 122, 5, "wood") + wpnBands([24, 30], 5, "red") + wpnAxeHead(116, 10, "steel")
    + `<path d="M112 19 L116 4 L120 19 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "War Hammer": () => wpnPole(8, 124, 5, "wood") + wpnBands([18, 26], 5, "black")
    + `<path d="M118 28 L124 44 L130 28 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="114" y="4" width="20" height="16" rx="2" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="116" y="18" width="16" height="12" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M134 22 L150 24 L134 26 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "Mace": () => {
    let flanges = "";
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6;
      flanges += `<path d="M128 24 L${wn(128 + Math.cos(a) * 20)} ${wn(24 + Math.sin(a) * 18)}" stroke="#475569" stroke-width="5" stroke-linecap="round"/>`;
    }
    return wpnPole(10, 116, 6, "black") + wpnBands([30, 40, 50], 6, "red") + flanges
      + `<circle cx="128" cy="24" r="11" fill="${wf("steel")}" ${WPN_O}/>`
      + `<circle cx="125" cy="20" r="3.5" fill="#fff" fill-opacity=".45"/>`;
  },
  "Flail": () => wpnHandle(10, 50, 8, "wood", 0) + wpnBands([56], 8, "dark")
    + wpnChain(62, 112, 24, 28, 5) + wpnSpikedBall(126, 28, 10, 10, "iron", 6),
  "Morning Star": () => wpnPole(10, 118, 6, "wood") + wpnBands([24, 34], 6, "black") + wpnSpikedBall(132, 24, 12, 12, "iron", 7),
  "Spear": () => wpnPole(6, 122, 4, "wood")
    + `<path d="M120 24 Q132 14 154 24 Q132 34 120 24 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M122 24 L150 24" stroke="#64748b" stroke-width=".9"/>`
    + wpnBands([114, 118], 4, "red"),
  "Halberd": () => wpnPole(6, 130, 4, "wood")
    + `<path d="M130 21.5 L156 24 L130 26.5 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + wpnAxeHead(126, 14, "steel")
    + `<path d="M122 20 Q126 8 116 4 Q130 8 130 20 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "Trident": () => wpnPole(6, 108, 4, "wood") + wpnBands([100], 4, "gold") + wpnTines(114, 3, 38, 22, "gold", 2.8)
    + `<path d="M146 9.5 L140 6 M146 34.5 L140 38" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>`,
  "Pitchfork": () => wpnPole(6, 98, 4, "wood") + wpnTines(106, 3, 46, 18, "dark", 2.2),
  "Crowbar": () => `<path d="M12 22 L128 22 Q148 22 150 8 L144 6 Q143 16 128 17" fill="none" stroke="#0b1220" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M12 22 L128 22 Q148 22 150 8 L144 6 Q143 16 128 17" fill="none" stroke="${wf("red")}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M6 18 L16 20 L16 25 L6 28 L10 23 Z" fill="${wf("dark")}" ${WPN_O}/>`,
  "Pipe Wrench": () => {
    let ridges = "";
    for (let x = 18; x < 96; x += 6) ridges += `<line x1="${x}" y1="20" x2="${x}" y2="28" stroke="#7f1d1d" stroke-width="1"/>`;
    return `<rect x="10" y="18" width="98" height="12" rx="5" fill="${wf("red")}" ${WPN_O}/>` + ridges
      + `<rect x="106" y="20" width="36" height="9" fill="${wf("dark")}" ${WPN_O}/>`
      + `<path d="M118 6 L150 6 L150 16 L124 16 L124 20 L118 20 Z" fill="${wf("steel")}" ${WPN_O}/>`
      + wpnTeeth(126, 148, 16, 2.2)
      + `<rect x="112" y="28" width="12" height="10" rx="3" fill="${wf("steel")}" stroke="#334155" stroke-width="1" stroke-dasharray="1.4 1"/>`;
  },
  "Sledgehammer": () => wpnPole(10, 124, 6, "woodlight") + `<rect x="10" y="20.5" width="30" height="7" rx="3" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="120" y="6" width="26" height="36" rx="3" fill="${wf("iron")}" ${WPN_O}/>`
    + `<rect x="120" y="6" width="26" height="5" rx="2" fill="${wf("steel")}"/>`
    + `<rect x="120" y="37" width="26" height="5" rx="2" fill="${wf("steel")}"/>`,
  "Baseball Bat": () => `<path d="M12 21.6 L62 21.6 Q104 17 146 14.5 Q154 24 146 33.5 Q104 31 62 26.4 L12 26.4 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M64 21.4 Q104 17.5 144 16.5" ${WPN_SHINE}/>`
    + `<ellipse cx="11" cy="24" rx="3" ry="5" fill="${wf("wood")}" ${WPN_O}/>`
    + wpnBands([18, 24, 30, 36], 4.8, "black"),
  "Nail Bat": () => {
    let nails = "";
    [[90, 18, -1], [104, 17, -1], [118, 16, -1], [132, 15, -1], [96, 30, 1], [112, 31, 1], [128, 32, 1], [142, 26, 1]].forEach(([x, y, dir]) => {
      nails += `<line x1="${x}" y1="${y}" x2="${x + 2}" y2="${y + dir * 9}" stroke="#94a3b8" stroke-width="1.4"/>`
        + `<circle cx="${x}" cy="${y}" r="1.4" fill="${wf("steel")}" stroke="#334155" stroke-width=".4"/>`;
    });
    return WEAPON_ART["Baseball Bat"]() + nails;
  },
  "Bo Staff": () => wpnPole(4, 156, 6, "wood") + wpnBands([10, 72, 85, 147], 6, "black"),
  "Nunchaku": () => wpnHandle(6, 58, 9, "black", 0) + wpnBands([10, 56], 9, "gold")
    + wpnChain(64, 96, 24, 24, 5) + wpnHandle(96, 58, 9, "black", 0) + wpnBands([100, 146], 9, "gold"),
  "Sai": () => `<path d="M50 22 L152 24 L50 26 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M50 22 Q56 8 76 8" fill="none" stroke="#0b1220" stroke-width="4.4" stroke-linecap="round"/>`
    + `<path d="M50 22 Q56 8 76 8" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M50 26 Q56 40 76 40" fill="none" stroke="#0b1220" stroke-width="4.4" stroke-linecap="round"/>`
    + `<path d="M50 26 Q56 40 76 40" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>`
    + wpnHandle(12, 40, 8, "red", 0) + `<circle cx="10" cy="24" r="4.4" fill="${wf("steel")}" ${WPN_O}/>`,
  "Shuriken": () => `<path d="${wpnStar(80, 24, 4, 22, 6)}" fill="${wf("steel")}" ${WPN_O} transform="rotate(20 80 24)"/>`
    + `<circle cx="80" cy="24" r="3.4" fill="#0b1a33" ${WPN_O}/>`
    + `<path d="M80 6 L80 18" ${WPN_SHINE} transform="rotate(20 80 24)"/>`,
  "Throwing Knife": () => wpnBlade({ x: 44, len: 100, w: 12, tip: "double" })
    + `<rect x="14" y="20" width="32" height="8" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M18 20 l4 8 M24 20 l4 8 M30 20 l4 8 M36 20 l4 8" stroke="#9ca3af" stroke-width=".8"/>`
    + `<circle cx="12" cy="24" r="5" fill="none" stroke="${wf("steel")}" stroke-width="2.6"/>`,
  "Crossbow": () => `<path d="M114 3 Q132 24 114 45" fill="none" stroke="#0b1220" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M114 3 Q132 24 114 45" fill="none" stroke="${wf("dark")}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M114 4 L84 24 L114 44" fill="none" stroke="#e5e7eb" stroke-width=".9"/>`
    + `<path d="M10 20 L120 21 L120 27 L40 27 L30 33 L10 30 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<path d="M60 27 Q62 34 58 36" fill="none" stroke="#1e293b" stroke-width="1.6"/>`
    + `<path d="M84 23.4 L148 23.4" stroke="#475569" stroke-width="1.4"/><path d="M146 21 L154 23.4 L146 26 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "Longbow": () => `<path d="M8 38 Q80 -18 152 38" fill="none" stroke="#0b1220" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M8 38 Q80 -18 152 38" fill="none" stroke="#a0693a" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M8 38 L152 38" stroke="#e5e7eb" stroke-width=".9"/>`
    + `<rect x="72" y="7" width="16" height="6" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M80 38 L80 2" stroke="#78350f" stroke-width="1.2"/><path d="M77 6 L80 0 L83 6 Z" fill="${wf("steel")}"/>`
    + `<path d="M77 44 L80 38 L83 44" fill="#dc2626"/>`,
  "Slingshot": () => `<path d="M70 24 L118 8 M70 24 L118 40" stroke="#0b1220" stroke-width="8" stroke-linecap="round"/>`
    + `<path d="M70 24 L118 8 M70 24 L118 40" stroke="#a0693a" stroke-width="6.4" stroke-linecap="round"/>`
    + `<path d="M118 8 L94 24 L118 40" fill="none" stroke="#d97706" stroke-width="2"/>`
    + `<ellipse cx="94" cy="24" rx="4" ry="6" fill="${wf("wood")}" ${WPN_O}/>`
    + wpnHandle(10, 62, 10, "wood", 0) + wpnBands([20, 30, 40], 10, "black"),
  "Blowdart": () => wpnPole(8, 132, 7, "woodlight") + wpnBands([36, 70, 104], 7, "wood")
    + `<path d="M138 24 L156 24" stroke="#475569" stroke-width="1.2"/><path d="M154 22.4 L158 24 L154 25.6 Z" fill="#334155"/>`
    + `<path d="M136 20 L142 24 L136 28 Z" fill="#f43f5e"/>`,
  "Pistol": () => `<path d="M40 26 L114 26 L114 29 L72 29 L68 27 L44 29 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M66 28 Q66 40 80 38 L82 28" fill="none" stroke="#0b1220" stroke-width="2.4"/>`
    + `<path d="M73 28 Q73 34 76 35" fill="none" stroke="#94a3b8" stroke-width="1.4"/>`
    + `<path d="M44 27 L66 27 L60 45 Q52 47 40 44 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M46 32 L58 32 M45 36 L57 36 M44 40 L56 40" stroke="#4b5563" stroke-width=".8"/>`
    + `<rect x="38" y="12" width="84" height="14" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M42 15 L42 23 M45 15 L45 23 M48 15 L48 23 M51 15 L51 23" stroke="#1e293b" stroke-width="1"/>`
    + `<line x1="56" y1="15" x2="118" y2="15" ${WPN_SHINE}/>`
    + `<rect x="40" y="9.5" width="5" height="3" fill="${wf("black")}"/><rect x="116" y="9.5" width="3" height="3" fill="${wf("black")}"/>`
    + `<rect x="121" y="16" width="3" height="5" fill="#0b1220"/>`,
  "Revolver": () => `<rect x="72" y="14" width="74" height="7" rx="1.5" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="72" y="21" width="40" height="4" rx="1" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="142" y="10.5" width="3" height="4" fill="${wf("dark")}"/>`
    + `<path d="M40 14 L74 14 L74 30 L66 30 L62 28 L44 28 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="50" y="12" width="24" height="16" rx="4" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M54 15 L70 15 M54 20 L70 20 M54 25 L70 25" stroke="#475569" stroke-width="1.2"/>`
    + `<path d="M42 14 L36 8 L40 6 L46 13 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M58 29 Q58 40 70 38 L72 29" fill="none" stroke="#0b1220" stroke-width="2.2"/>`
    + `<path d="M64 29 Q64 34 66 35" fill="none" stroke="#94a3b8" stroke-width="1.3"/>`
    + `<path d="M40 26 L58 27 Q54 38 50 46 L34 46 Q34 34 40 26 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<circle cx="45" cy="36" r="1.4" fill="${wf("gold")}"/>`,
  "SMG": () => `<path d="M30 17 L10 17 L10 33 L14 33 L14 21 L30 21" fill="none" stroke="#0b1220" stroke-width="2.6" stroke-linejoin="round"/>`
    + `<path d="M30 17 L10 17 L10 33 L14 33 L14 21 L30 21" fill="none" stroke="#64748b" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<rect x="114" y="16" width="30" height="8" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M118 18 L118 22 M123 18 L123 22 M128 18 L128 22 M133 18 L133 22" stroke="#6b7280" stroke-width="1.6"/>`
    + `<rect x="144" y="18" width="10" height="4" fill="${wf("dark")}" ${WPN_O}/>`
    + `<rect x="28" y="12" width="88" height="15" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<line x1="32" y1="15" x2="112" y2="15" ${WPN_SHINE}/>`
    + `<rect x="74" y="27" width="11" height="19" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M46 27 L58 27 L54 43 L44 43 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M58 28 Q58 36 68 35 L70 28" fill="none" stroke="#0b1220" stroke-width="2"/>`
    + `<rect x="60" y="9" width="10" height="3" fill="${wf("black")}"/>`,
  "Shotgun": () => `<rect x="60" y="13" width="94" height="5" rx="1" fill="${wf("dark")}" ${WPN_O}/>`
    + `<rect x="70" y="18" width="76" height="4.5" rx="1" fill="${wf("dark")}" ${WPN_O}/>`
    + `<line x1="64" y1="14.4" x2="150" y2="14.4" ${WPN_SHINE}/>`
    + `<rect x="92" y="17" width="34" height="9" rx="3" fill="${wf("wood")}" ${WPN_O}/>`
    + `<path d="M96 19 L96 24 M101 19 L101 24 M106 19 L106 24 M111 19 L111 24 M116 19 L116 24 M121 19 L121 24" stroke="#5c3a1a" stroke-width="1"/>`
    + `<rect x="40" y="12" width="24" height="15" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M50 27 Q50 35 60 34 L62 27" fill="none" stroke="#0b1220" stroke-width="2"/>`
    + `<path d="M42 15 L8 19 Q6 26 8 34 L14 35 L42 26 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<path d="M8 19 Q6 26 8 34" stroke="#1f2937" stroke-width="2.4" fill="none"/>`
    + `<circle cx="152" cy="11.5" r="1.3" fill="${wf("gold")}"/>`,
  "Assault Rifle": () => `<path d="M46 15 L12 16 L10 31 L22 31 L46 24 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="108" y="13" width="34" height="11" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M113 16 L119 16 M123 16 L129 16 M133 16 L139 16 M113 21 L119 21 M123 21 L129 21 M133 21 L139 21" stroke="#6b7280" stroke-width="1.4" stroke-linecap="round"/>`
    + `<rect x="142" y="16.5" width="10" height="3.5" fill="${wf("dark")}" ${WPN_O}/>`
    + `<rect x="151" y="15.5" width="6" height="5.5" rx="1" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="44" y="12" width="66" height="13" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<line x1="48" y1="14.5" x2="106" y2="14.5" ${WPN_SHINE}/>`
    + `<rect x="58" y="7" width="34" height="5" rx="1" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M80 25 L92 25 Q96 36 104 42 L94 46 Q84 38 80 25 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M58 25 L68 25 L64 41 L54 41 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M68 26 Q68 33 76 32 L78 25" fill="none" stroke="#0b1220" stroke-width="2"/>`,
  "Sniper Rifle": () => `<path d="M118 22 L110 38 M120 22 L128 38" stroke="#0b1220" stroke-width="2.2" stroke-linecap="round"/>`
    + `<path d="M118 22 L110 38 M120 22 L128 38" stroke="#64748b" stroke-width="1.2" stroke-linecap="round"/>`
    + `<rect x="84" y="17" width="70" height="4" rx="1" fill="${wf("dark")}" ${WPN_O}/>`
    + `<rect x="150" y="15.5" width="8" height="7" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M44 15 L88 15 L88 25 L60 25 L56 28 L44 28 Z" fill="${wf("green")}" ${WPN_O}/>`
    + `<path d="M46 15 L8 18 L8 34 L18 34 L30 27 L46 27 Z" fill="${wf("green")}" ${WPN_O}/>`
    + `<path d="M20 18 L40 16.5" stroke="#14532d" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="8" y="18" width="3" height="16" fill="${wf("black")}"/>`
    + `<path d="M60 28 Q60 36 70 35 L72 27" fill="none" stroke="#0b1220" stroke-width="2"/>`
    + `<path d="M74 15 L78 9 L80 10 L77 15" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="54" y="11" width="4" height="4" fill="${wf("black")}"/><rect x="82" y="11" width="4" height="4" fill="${wf("black")}"/>`
    + `<rect x="46" y="4" width="48" height="7" rx="3" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="42" y="3" width="8" height="9" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="90" y="2.5" width="8" height="10" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<ellipse cx="97.5" cy="7.5" rx="1.2" ry="4" fill="#38bdf8"/>`
    + `<line x1="52" y1="5.6" x2="88" y2="5.6" ${WPN_SHINE}/>`,
  "Sniper": () => `<path d="M124 23 L114 40 M126 23 L136 40" stroke="#0b1220" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M124 23 L114 40 M126 23 L136 40" stroke="#a8a29e" stroke-width="1.2" stroke-linecap="round"/>`
    + `<rect x="86" y="18" width="70" height="3.6" rx="1" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="152" y="16" width="7" height="7.5" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M44 15 L90 15 L90 26 L62 26 L58 29 L44 29 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M46 15 L6 18 L6 35 L17 35 L30 28 L46 28 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<rect x="6" y="18" width="3" height="17" fill="${wf("black")}"/>`
    + `<path d="M62 29 Q62 37 72 36 L74 28" fill="none" stroke="#0b1220" stroke-width="2"/>`
    + `<rect x="52" y="10" width="4" height="5" fill="${wf("black")}"/><rect x="84" y="10" width="4" height="5" fill="${wf("black")}"/>`
    + `<rect x="44" y="2" width="56" height="9" rx="4" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="38" y="1" width="9" height="11" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="97" y="0.5" width="10" height="12" rx="2" fill="${wf("black")}" ${WPN_O}/>`
    + `<ellipse cx="106" cy="6.5" rx="1.4" ry="5" fill="#a855f7"/>`
    + `<line x1="50" y1="4.4" x2="94" y2="4.4" ${WPN_SHINE}/>`,
  "Bazooka": () => `<rect x="10" y="12" width="132" height="16" rx="7" fill="${wf("green")}" ${WPN_O}/>`
    + `<path d="M4 9 L14 12 L14 28 L4 31 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M140 10 L156 8 L156 32 L140 30 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="40" y="10.5" width="6" height="19" rx="1" fill="${wf("black")}"/><rect x="104" y="10.5" width="6" height="19" rx="1" fill="${wf("black")}"/>`
    + `<rect x="60" y="4" width="18" height="7" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M58 28 L68 28 L65 42 L55 42 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M86 28 L96 28 L93 42 L83 42 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M68 29 Q68 35 75 34" fill="none" stroke="#0b1220" stroke-width="2"/>`
    + `<circle cx="150" cy="20" r="5" fill="#f97316"/>`
    + `<line x1="16" y1="15.5" x2="136" y2="15.5" ${WPN_SHINE}/>`,
  "Automatic Rifle": () => `<rect x="118" y="15" width="34" height="5" rx="1" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M122 15 L122 20 M126 15 L126 20 M130 15 L130 20 M134 15 L134 20 M138 15 L138 20" stroke="#1e293b" stroke-width="1.4"/>`
    + `<rect x="150" y="14" width="6" height="7" rx="1" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M44 14 L8 18 L8 32 L16 33 L44 25 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<rect x="42" y="11" width="78" height="14" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<line x1="46" y1="13.5" x2="116" y2="13.5" ${WPN_SHINE}/>`
    + `<rect x="98" y="25" width="10" height="13" rx="3" fill="${wf("wood")}" ${WPN_O}/>`
    + `<circle cx="78" cy="34" r="10" fill="${wf("iron")}" ${WPN_O}/>`
    + `<circle cx="78" cy="34" r="6.5" fill="none" stroke="#71717a" stroke-width="1"/>`
    + `<circle cx="78" cy="34" r="2" fill="${wf("steel")}"/>`
    + `<path d="M52 25 L62 25 L58 40 L48 40 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<path d="M62 26 Q62 32 68 31" fill="none" stroke="#0b1220" stroke-width="2"/>`
    + `<rect x="56" y="8" width="6" height="3" fill="${wf("black")}"/><rect x="112" y="8" width="3" height="3" fill="${wf("black")}"/>`,
  "Energy Pistol": () => `<rect x="118" y="15" width="26" height="6" rx="3" fill="#22d3ee" fill-opacity=".35" filter="url(#wpn-glow)"/>`
    + `<path d="M42 27 L64 27 L58 45 Q50 47 38 44 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="44" y="30" width="12" height="3" rx="1" fill="#22d3ee" fill-opacity=".8"/>`
    + `<path d="M64 28 Q64 38 76 36 L78 28" fill="none" stroke="#0b1220" stroke-width="2.4"/>`
    + `<path d="M36 12 L104 10 Q116 10 120 16 L120 22 Q116 28 104 28 L40 28 Q34 28 34 22 L34 16 Q34 12 36 12 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="54" y="15" width="44" height="7" rx="3.5" fill="${wf("plasma")}" filter="url(#wpn-glow)"/>`
    + `<path d="M58 18.5 L94 18.5" stroke="#fff" stroke-width="1"/>`
    + `<rect x="118" y="14" width="8" height="10" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<circle cx="128" cy="19" r="2.6" fill="#a5f3fc" filter="url(#wpn-glow)"/>`
    + `<path d="M40 12 L42 7 L50 7 L50 11" fill="${wf("dark")}" ${WPN_O}/>`,
  "BB Gun": () => `<path d="M8 22 Q8 18 14 18 L50 20 L52 30 L20 36 Q10 38 8 33 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<path d="M14 21 L46 22.5" stroke="#fde68a" stroke-opacity=".35" stroke-width="1.2"/>`
    + `<rect x="6" y="19" width="4" height="16" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="50" y="17" width="30" height="10" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<rect x="58" y="14.5" width="12" height="2.5" rx="1" fill="${wf("black")}"/>`
    + `<rect x="80" y="17.5" width="70" height="4" rx="1.5" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="80" y="21.5" width="58" height="3" rx="1.5" fill="${wf("gold")}" ${WPN_O}/>`
    + `<path d="M80 26 L112 26 L110 30 L82 30 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<line x1="84" y1="18.6" x2="146" y2="18.6" ${WPN_SHINE}/>`
    + `<rect x="146" y="14.5" width="2.5" height="3" fill="${wf("black")}"/>`
    + `<path d="M56 27 L56 33 Q56 40 64 40 L72 40 Q76 40 76 35 L76 27" fill="none" stroke="#0b1220" stroke-width="2.6"/>`
    + `<path d="M62 27 Q62 33 66 34" fill="none" stroke="#94a3b8" stroke-width="1.3"/>`
    + `<circle cx="122" cy="38" r="2.6" fill="${wf("gold")}" ${WPN_O}/>`
    + `<circle cx="130" cy="40" r="2.6" fill="${wf("gold")}" ${WPN_O}/>`
    + `<circle cx="138" cy="37.5" r="2.6" fill="${wf("gold")}" ${WPN_O}/>`,
  "Jetpack": () => `<path d="M68 38 Q66 44 72 48 Q78 44 76 38 Z M84 38 Q82 44 88 48 Q94 44 92 38 Z" fill="${wf("liquidfire")}" filter="url(#wpn-glow)"/>`
    + `<path d="M69 36 L75 36 L76 40 L68 40 Z M85 36 L91 36 L92 40 L84 40 Z" fill="${wf("iron")}" ${WPN_O}/>`
    + `<rect x="64" y="6" width="14" height="31" rx="7" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="82" y="6" width="14" height="31" rx="7" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="74" y="10" width="12" height="24" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M67 10 L67 32 M85 10 L85 32" ${WPN_SHINE} stroke-width="1.4"/>`
    + `<rect x="64" y="14" width="14" height="3" fill="${wf("red")}"/><rect x="82" y="14" width="14" height="3" fill="${wf("red")}"/>`
    + `<circle cx="80" cy="17" r="2" fill="#22c55e"/><rect x="77" y="23" width="6" height="6" rx="1" fill="${wf("black")}"/>`
    + `<path d="M58 8 Q60 22 66 34 M102 8 Q100 22 94 34" fill="none" stroke="#1f2937" stroke-width="2.4" stroke-linecap="round"/>`,
  "Body Armor": () => `<path d="M62 5 L72 5 Q80 12 88 5 L98 5 L104 15 L102 44 Q80 47 58 44 L56 15 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M80 12 L80 45" stroke="#1e293b" stroke-width="1.2"/>`
    + `<rect x="62" y="24" width="8" height="11" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="72" y="24" width="7" height="11" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="81" y="24" width="7" height="11" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<rect x="90" y="24" width="8" height="11" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M59 38 L101 38" stroke="#1f2937" stroke-width="2.4"/>`
    + `<rect x="66" y="15" width="28" height="6" rx="1" fill="#e5e7eb" ${WPN_O}/>`
    + `<text x="80" y="20" text-anchor="middle" font-size="5" font-weight="800" fill="#111827" font-family="Arial,sans-serif">ARMOR</text>`
    + `<path d="M62 8 L58 16" ${WPN_SHINE}/>`,
  "Combat Helmet": () => `<path d="M56 34 Q55 7 80 7 Q105 7 104 34 Q104 38 100 38 L60 38 Q56 38 56 34 Z" fill="${wf("green")}" ${WPN_O}/>`
    + `<path d="M54 36 L106 36 L104 41 L56 41 Z" fill="${wf("green")}" ${WPN_O}/>`
    + `<path d="M62 22 Q80 18 98 22 L98 30 Q80 26 62 30 Z" fill="${wf("black")}" ${WPN_O}/>`
    + `<ellipse cx="72" cy="25" rx="7" ry="3.6" fill="${wf("plasma")}" fill-opacity=".85"/>`
    + `<ellipse cx="88" cy="25" rx="7" ry="3.6" fill="${wf("plasma")}" fill-opacity=".85"/>`
    + `<path d="M66 12 Q72 9 80 9" ${WPN_SHINE} stroke-width="1.6"/>`
    + `<path d="M60 38 Q60 44 66 46 M100 38 Q100 44 94 46" fill="none" stroke="#1f2937" stroke-width="1.6"/>`,
  "Riot Shield": () => `<rect x="61" y="2" width="38" height="44" rx="5" fill="${wf("glass")}" fill-opacity=".55" stroke="#0b1220" stroke-width="2.6"/>`
    + `<rect x="64" y="5" width="32" height="38" rx="3" fill="none" stroke="#1e293b" stroke-width=".8"/>`
    + `<rect x="64" y="18" width="32" height="9" fill="#1e293b" fill-opacity=".85"/>`
    + `<text x="80" y="25" text-anchor="middle" font-size="7" font-weight="900" fill="#f8fafc" font-family="Arial,sans-serif" letter-spacing="1">RIOT</text>`
    + `<path d="M66 7 L70 40" ${WPN_SHINE} stroke-width="1.6"/>`
    + `<rect x="57" y="20" width="4" height="8" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`,
  "Grappling Hook": () => `<ellipse cx="22" cy="26" rx="14" ry="10" fill="none" stroke="#a16207" stroke-width="3"/>`
    + `<ellipse cx="22" cy="26" rx="9" ry="6" fill="none" stroke="#ca8a04" stroke-width="3"/>`
    + `<path d="M34 22 Q60 10 84 22 T120 24" fill="none" stroke="#a16207" stroke-width="2.6"/>`
    + `<path d="M34 22 Q60 10 84 22 T120 24" fill="none" stroke="#fde68a" stroke-width=".8" stroke-dasharray="2 2"/>`
    + `<circle cx="121" cy="24" r="2.6" fill="none" stroke="${wf("steel")}" stroke-width="1.8"/>`
    + `<rect x="123" y="22.5" width="20" height="3" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M140 24 Q152 24 152 12 L148 14 Q148 21 140 22" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M140 24 Q152 24 152 36 L148 34 Q148 27 140 26" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M141 23 L157 24 L141 25 Z" fill="${wf("steel")}" ${WPN_O}/>`,
  "Stun Baton": () => {
    let grip = "";
    for (let x = 16; x < 62; x += 5) grip += `<line x1="${x}" y1="19" x2="${x}" y2="29" stroke="#4b5563" stroke-width="1.2"/>`;
    return wpnHandle(10, 124, 10, "black", 0) + grip
      + `<rect x="68" y="20" width="10" height="8" rx="2" fill="${wf("yellow")}" ${WPN_O}/>`
      + `<path d="M134 20 L144 20 M134 28 L144 28" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M144 20 L148 14 L146 22 L154 18 L148 26 L156 30 L144 28" fill="none" stroke="#67e8f9" stroke-width="1.4" filter="url(#wpn-glow)"/>`;
  },
  "Chainsaw": () => `<rect x="64" y="17" width="88" height="14" rx="7" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="65" y="16.5" width="86" height="15" rx="7.5" fill="none" stroke="#1f2937" stroke-width="1.8" stroke-dasharray="2.2 1.6"/>`
    + `<path d="M12 12 Q12 8 18 8 L64 8 Q72 8 72 16 L72 36 Q72 42 64 42 L18 42 Q12 42 12 36 Z" fill="${wf("orange")}" ${WPN_O}/>`
    + `<path d="M22 8 Q22 0 36 0 L58 0 Q64 0 64 8" fill="none" stroke="#111827" stroke-width="3"/>`
    + `<rect x="18" y="16" width="30" height="18" rx="3" fill="${wf("black")}"/>`
    + `<path d="M22 20 L44 20 M22 25 L44 25 M22 30 L44 30" stroke="#4b5563" stroke-width="1.2"/>`,
  "Fire Axe": () => wpnPole(10, 122, 6, "red") + wpnBands([12, 20], 6, "black") + wpnAxeHead(116, 14, "red")
    + `<path d="M110 19 L116 2 L122 19 Z" fill="${wf("dark")}" ${WPN_O}/>`,
  "Pickaxe": () => wpnPole(8, 126, 6, "wood")
    + `<path d="M118 3 Q138 24 118 45 L122 46 Q146 24 122 2 Z" fill="${wf("iron")}" ${WPN_O}/>`
    + `<path d="M121 6 Q138 24 121 42" ${WPN_SHINE}/>`
    + `<rect x="120" y="18" width="12" height="12" rx="2" fill="${wf("dark")}" ${WPN_O}/>`,
  "Shovel": () => `<path d="M6 16 L18 16 L18 32 L6 32 Z" fill="none" stroke="${wf("black")}" stroke-width="3.6" stroke-linejoin="round"/>`
    + wpnPole(18, 104, 5, "wood")
    + `<rect x="100" y="20" width="12" height="8" rx="2" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M110 13 L134 11 Q158 24 134 37 L110 35 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M114 24 L140 24" stroke="#cbd5e1" stroke-opacity=".6" stroke-width="1.2"/>`,
  "Garden Hoe": () => wpnPole(6, 136, 4, "wood")
    + `<path d="M134 22 L142 22 L142 30 L138 30 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M130 30 L156 30 L154 44 L132 44 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<line x1="133" y1="42" x2="153" y2="42" ${WPN_SHINE}/>`,
  "Rake": () => {
    let tines = "";
    for (let y = 6; y <= 42; y += 4) tines += `<path d="M136 ${y} L146 ${y + 0.6} L136 ${y + 1.8} Z" fill="${wf("dark")}" ${WPN_O}/>`;
    return wpnPole(6, 132, 4, "wood") + `<rect x="130" y="4" width="7" height="40" rx="2" fill="${wf("dark")}" ${WPN_O}/>` + tines;
  },
  "Broom": () => {
    let straw = "";
    for (let i = 0; i < 9; i += 1) {
      const y = 6 + i * 4.5;
      straw += `<path d="M110 ${wn(20 + i)} L156 ${wn(y)}" stroke="#a16207" stroke-width=".7"/>`;
    }
    return wpnPole(6, 106, 5, "wood")
      + `<path d="M106 18 L156 3 L156 45 L106 30 Z" fill="${wf("yellow")}" ${WPN_O}/>` + straw
      + wpnBands([104, 110], 13, "red");
  },
  "Umbrella": () => `<path d="M34 24 L16 24 Q6 24 6 32 Q6 40 14 40" fill="none" stroke="#0b1220" stroke-width="5.4" stroke-linecap="round"/>`
    + `<path d="M34 24 L16 24 Q6 24 6 32 Q6 40 14 40" fill="none" stroke="#a0693a" stroke-width="3.8" stroke-linecap="round"/>`
    + `<rect x="32" y="23" width="122" height="2" fill="${wf("steel")}"/>`
    + `<path d="M44 24 Q56 12 124 19 L148 24 L124 29 Q56 36 44 24 Z" fill="${wf("blue")}" ${WPN_O}/>`
    + `<path d="M58 18 Q90 18 120 21 M58 30 Q90 30 120 27" stroke="#1e3a8a" stroke-width=".8" fill="none"/>`
    + `<rect x="86" y="18.5" width="5" height="11" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`,
  "Walking Stick": () => `<path d="M30 24 Q30 6 16 6 Q4 6 4 16" fill="none" stroke="#0b1220" stroke-width="6.4" stroke-linecap="round"/>`
    + `<path d="M30 24 Q30 6 16 6 Q4 6 4 16" fill="none" stroke="#7c4a21" stroke-width="4.8" stroke-linecap="round"/>`
    + wpnPole(28, 148, 5, "wood") + `<rect x="146" y="21" width="8" height="6" rx="2" fill="${wf("gold")}" ${WPN_O}/>`,
  "Golf Club": () => wpnPole(8, 138, 2.6, "steel") + `<rect x="8" y="21" width="34" height="6" rx="3" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M134 21 L150 19 Q158 30 152 42 L138 42 Q132 36 134 21 Z" fill="${wf("dark")}" ${WPN_O}/>`
    + `<path d="M140 28 L151 27 M140 32 L152 31 M140 36 L152 35" stroke="#e2e8f0" stroke-width=".7"/>`,
  "Hockey Stick": () => wpnPole(8, 122, 6, "woodlight") + `<rect x="8" y="20.5" width="18" height="7" rx="3" fill="${wf("black")}" ${WPN_O}/>`
    + `<path d="M118 21 L128 21 Q132 36 154 38 L154 46 Q122 46 118 27 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M126 34 Q136 42 154 42" stroke="#111827" stroke-width="3" fill="none"/>`,
  "Cricket Bat": () => wpnHandle(8, 46, 6, "black", 0)
    + `<path d="M52 16 L148 14.5 Q154 24 148 33.5 L52 32 Q48 24 52 16 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M52 20 L66 24 L52 28" fill="none" stroke="#8b5a2b" stroke-width="1"/>`
    + `<path d="M58 18 L146 17" ${WPN_SHINE}/>`
    + `<rect x="100" y="21" width="34" height="6" rx="1" fill="#1d4ed8" fill-opacity=".75"/>`,
  "Tennis Racket": () => {
    let strings = "";
    for (let x = 86; x <= 144; x += 5) strings += `<line x1="${x}" y1="4" x2="${x}" y2="44" stroke="#f8fafc" stroke-width=".6"/>`;
    for (let y = 9; y <= 40; y += 4) strings += `<line x1="80" y1="${y}" x2="148" y2="${y}" stroke="#f8fafc" stroke-width=".6"/>`;
    return wpnHandle(8, 54, 7, "black", 0)
      + `<path d="M62 24 L84 14 M62 24 L84 34" stroke="${wf("blue")}" stroke-width="3.4" stroke-linecap="round"/>`
      + `<g clip-path="url(#wpn-racket-clip)">${strings}</g>`
      + `<ellipse cx="114" cy="24" rx="32" ry="18" fill="none" stroke="#0b1220" stroke-width="5"/>`
      + `<ellipse cx="114" cy="24" rx="32" ry="18" fill="none" stroke="${wf("blue")}" stroke-width="3.6"/>`;
  },
  "Frying Pan": () => wpnHandle(8, 82, 7, "black", 0) + `<circle cx="14" cy="24" r="1.8" fill="#0b1a33"/>`
    + `<circle cx="112" cy="24" r="22" fill="${wf("dark")}" ${WPN_O}/>`
    + `<circle cx="112" cy="24" r="17" fill="${wf("iron")}"/>`
    + `<ellipse cx="104" cy="16" rx="7" ry="3" fill="#fff" fill-opacity=".25"/>`,
  "Cast Iron Skillet": () => `<rect x="30" y="19" width="62" height="10" rx="4" fill="${wf("iron")}" ${WPN_O}/>`
    + `<circle cx="38" cy="24" r="2.6" fill="#0b1a33"/>`
    + `<path d="M132 18 Q144 18 144 24 Q144 30 132 30 Z" fill="${wf("iron")}" ${WPN_O}/>`
    + `<circle cx="110" cy="24" r="23" fill="${wf("iron")}" ${WPN_O}/>`
    + `<circle cx="110" cy="24" r="18" fill="#27272a" stroke="#52525b" stroke-width="1"/>`
    + `<ellipse cx="102" cy="15" rx="7" ry="2.6" fill="#fff" fill-opacity=".18"/>`,
  "Hot Sauce Bottle": () => `<rect x="18" y="11" width="94" height="26" rx="9" fill="${wf("red")}" ${WPN_O}/>`
    + `<path d="M112 16 Q122 20 126 20 L134 20 L134 28 L126 28 Q122 28 112 32 Z" fill="${wf("red")}" ${WPN_O}/>`
    + `<rect x="134" y="17" width="14" height="14" rx="3" fill="${wf("green")}" ${WPN_O}/>`
    + `<rect x="40" y="14" width="50" height="20" rx="2" fill="#fef3c7" ${WPN_O}/>`
    + `<path d="M65 31 Q56 26 62 18 Q63 23 66 22 Q66 17 70 16 Q76 24 65 31 Z" fill="#f97316"/>`
    + `<line x1="24" y1="15" x2="106" y2="15" ${WPN_SHINE}/>`,
  "Salt Shaker": () => `<path d="M66 14 L94 14 L100 46 L60 46 Z" fill="${wf("glass")}" fill-opacity=".85" ${WPN_O}/>`
    + `<path d="M63 30 L97 30 L100 46 L60 46 Z" fill="#ffffff"/>`
    + `<path d="M64 14 Q64 3 80 3 Q96 3 96 14 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<circle cx="74" cy="9" r="1" fill="#334155"/><circle cx="80" cy="7" r="1" fill="#334155"/><circle cx="86" cy="9" r="1" fill="#334155"/>`
    + `<line x1="70" y1="18" x2="66" y2="42" ${WPN_SHINE}/>`,
  "Pepper Mill": () => `<path d="M72 9 L88 9 L90 15 Q83 25 92 36 L94 46 L66 46 L68 36 Q77 25 70 15 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<rect x="70" y="14" width="20" height="2.4" fill="${wf("gold")}"/>`
    + `<ellipse cx="80" cy="6" rx="4.2" ry="3.2" fill="${wf("steel")}" ${WPN_O}/>`
    + `<line x1="72" y1="18" x2="70" y2="42" ${WPN_SHINE}/>`,
  "Fish Slice": () => wpnHandle(10, 50, 9, "black", 0)
    + `<path d="M60 22.5 L84 20 L84 28 L60 25.5 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M84 12 L146 9 Q152 24 146 39 L84 36 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + `<path d="M94 16 L138 14 M94 22 L140 21 M94 28 L140 28 M94 33 L138 34" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round"/>`,
  "Spatula": () => wpnHandle(10, 58, 9, "red", 0) + `<rect x="68" y="22" width="16" height="4" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="84" y="13" width="62" height="22" rx="5" fill="${wf("black")}" ${WPN_O}/>`
    + `<line x1="88" y1="16" x2="142" y2="16" ${WPN_SHINE}/>`,
  "Pizza Cutter": () => wpnHandle(10, 74, 10, "red", 0) + `<rect x="84" y="22" width="34" height="4" fill="${wf("steel")}" ${WPN_O}/>`
    + `<circle cx="126" cy="24" r="19" fill="${wf("steel")}" ${WPN_O}/>`
    + `<circle cx="126" cy="24" r="15" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`
    + `<circle cx="126" cy="24" r="4" fill="${wf("dark")}" ${WPN_O}/>`,
  "Chopsticks": () => `<path d="M8 17 L152 22.6 L152 23.6 L8 21 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M8 27 L152 24.4 L152 25.4 L8 31 Z" fill="${wf("woodlight")}" ${WPN_O}/>`
    + `<path d="M20 17.5 L20 21.5 M26 17.8 L26 21.6 M20 27.4 L20 30.6 M26 27.3 L26 30.4" stroke="#b91c1c" stroke-width="2"/>`,
  "Sushi Knife": () => wpnKnife({ hl: 38, hh: 8, handle: "woodlight", rivets: 0, blade: { len: 104, w: 9 } })
    + `<rect x="44" y="19.5" width="6" height="9" rx="1.5" fill="${wf("black")}" ${WPN_O}/>`,
  "Butcher Saw": () => `<path d="M40 22 L46 8 L146 8 L150 22" fill="none" stroke="#0b1220" stroke-width="4.4" stroke-linejoin="round"/>`
    + `<path d="M40 22 L46 8 L146 8 L150 22" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linejoin="round"/>`
    + `<rect x="40" y="22" width="110" height="7" fill="${wf("steel")}" ${WPN_O}/>` + wpnTeeth(41, 149, 29, 2.6)
    + wpnHandle(8, 34, 12, "wood", 2),
  "Bone Saw": () => `<path d="M44 14 L150 20 L150 32 L44 36 Z" fill="${wf("steel")}" ${WPN_O}/>`
    + wpnTeeth(46, 149, 36 - 0.6, 2.4)
    + `<path d="M48 18 L146 22" ${WPN_SHINE}/>`
    + `<path d="M8 10 Q8 6 14 6 L46 8 L48 40 L16 42 Q8 42 8 36 Z" fill="${wf("wood")}" ${WPN_O}/>`
    + `<rect x="18" y="16" width="20" height="16" rx="6" fill="#0b1a33"/>`
    + `<circle cx="42" cy="14" r="1.6" fill="${wf("steel")}"/><circle cx="42" cy="34" r="1.6" fill="${wf("steel")}"/>`,
  "Laser Sword": () => `<rect x="54" y="18" width="100" height="12" rx="6" fill="#22d3ee" fill-opacity=".35" filter="url(#wpn-glow)"/>`
    + `<rect x="54" y="21" width="100" height="6" rx="3" fill="${wf("plasma")}"/>`
    + wpnHandle(10, 46, 10, "dark", 0)
    + `<rect x="50" y="17" width="6" height="14" rx="1.5" fill="${wf("steel")}" ${WPN_O}/>`
    + `<rect x="24" y="19" width="5" height="3" rx="1" fill="#ef4444"/><rect x="32" y="19" width="5" height="3" rx="1" fill="#22c55e"/>`
    + wpnBands([14, 18], 10, "black"),
  "Plasma Blade": () => `<path d="M54 16 L148 22 L156 24 L148 26 L54 32 Z" fill="#f472b6" fill-opacity=".35" filter="url(#wpn-glow)"/>`
    + `<path d="M54 19 L148 23 L154 24 L148 25 L54 29 Z" fill="${wf("plasmapink")}"/>`
    + wpnHandle(12, 40, 9, "iron", 0)
    + `<path d="M50 14 L58 18 L58 30 L50 34 Z" fill="${wf("gold")}" ${WPN_O}/>`
    + `<circle cx="12" cy="24" r="5" fill="${wf("gold")}" ${WPN_O}/>`
    + `<circle cx="32" cy="24" r="2.2" fill="#f472b6"/>`,
  "Rubber Chicken": () => `<path d="M16 26 Q14 14 34 15 Q62 17 92 22 Q112 24 124 17 Q136 10 146 17 Q150 24 144 28 Q130 33 114 30 Q92 32 62 34 Q30 38 16 26 Z" fill="${wf("yellow")}" ${WPN_O}/>`
    + `<path d="M146 19 L157 22 L146 25 Z" fill="${wf("orange")}" ${WPN_O}/>`
    + `<path d="M132 13 Q133 7 137 10 Q139 5 142 10 Q146 8 145 14 Z" fill="${wf("red")}" ${WPN_O}/>`
    + `<path d="M137 17 l3 3 M140 17 l-3 3" stroke="#111827" stroke-width="1.2"/>`
    + `<path d="M40 34 L36 44 M36 44 L32 46 M36 44 L38 47 M52 34 L50 44 M50 44 L46 46 M50 44 L53 47" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round"/>`
    + `<path d="M30 20 Q60 20 90 24" ${WPN_SHINE}/>`
};

const POTION_TINTS = {
  liquidblue: { surface: "#bae6fd", bubble: "#e0f2fe" },
  liquidgreen: { surface: "#d9f99d", bubble: "#f7fee7" },
  liquidred: { surface: "#fecaca", bubble: "#fee2e2" }
};

function potionArtSvg(liquid = "liquidblue", size = "normal") {
  const tint = POTION_TINTS[liquid] || POTION_TINTS.liquidblue;
  const art = `<rect x="74" y="1.5" width="12" height="7" rx="2" fill="${wf("wood")}" ${WPN_O}/>`
    + `<rect x="75.5" y="8" width="9" height="9" fill="${wf("glass")}" fill-opacity=".8" ${WPN_O}/>`
    + `<circle cx="80" cy="30" r="15" fill="${wf("glass")}" fill-opacity=".55" ${WPN_O}/>`
    + `<path d="M65.86 25 A15 15 0 1 0 94.14 25 Z" fill="${wf(liquid)}"/>`
    + `<ellipse cx="80" cy="25" rx="14.1" ry="2" fill="${tint.surface}" fill-opacity=".8"/>`
    + `<circle cx="76" cy="34" r="1.6" fill="${tint.bubble}" fill-opacity=".8"/><circle cx="84" cy="30" r="1.1" fill="${tint.bubble}" fill-opacity=".8"/><circle cx="80" cy="38" r=".9" fill="${tint.bubble}" fill-opacity=".8"/>`
    + `<circle cx="80" cy="30" r="15" fill="none" ${WPN_O}/>`
    + `<path d="M70 24 Q70 19 75 17" ${WPN_SHINE} stroke-width="1.6"/>`
    + `<rect x="74.5" y="16" width="11" height="2.4" rx="1" fill="${wf("gold")}" ${WPN_O}/>`;
  const scale = size === "small" ? 0.62 : 1;
  const viewBox = size === "small" ? "62 6 36 36" : "56 0 48 48";
  const transform = size === "small"
    ? `transform="translate(80 26) scale(${scale}) translate(-80 -26)"`
    : "";
  return `<svg class="shops-weapon-art shops-potion-art${size === "small" ? " shops-potion-art--small" : ""}" viewBox="${viewBox}" aria-hidden="true" focusable="false"><g filter="url(#wpn-shadow)" ${transform}>${art}</g></svg>`;
}

function fireBottleArtSvg(size = "normal") {
  const flame = "M80 46 C68 46 63.5 38 65.5 30 C66.8 25 70 22 70 17 C73.5 20.5 73.6 24 74.4 26 C74.4 19 77 13.5 80 10 C81.5 15.5 86 18.5 86 24 C88 22 89 19 89 15.5 C93.5 21 95.5 27 94.5 33 C93.5 41 88 46 80 46 Z";
  const core = "M80 43 C73.5 43 71 38.5 72.5 33.5 C73.5 30.5 75.5 29 76 26 C78 28.5 78 30.5 78.6 31.5 C79 27 81 24 82.5 22 C83.5 26 87 28 87 32.5 C88 31.5 88.6 30 88.6 28.5 C90.6 32 90.6 35 89.6 38 C88.4 41.6 85 43 80 43 Z";
  const art = `<path d="${flame}" fill="#f97316" fill-opacity=".45" filter="url(#wpn-glow)"/>`
    + `<path d="${flame}" fill="${wf("liquidfire")}" fill-opacity=".95"/>`
    + `<path d="${core}" fill="#fef08a" fill-opacity=".85"/>`
    + `<circle cx="77" cy="38" r="1.2" fill="#fff7ed" fill-opacity=".85"/><circle cx="84" cy="35" r=".9" fill="#fff7ed" fill-opacity=".85"/>`
    + `<path d="M69 32 Q68.5 26 72 21.5" ${WPN_SHINE} stroke-width="1.5"/>`
    + `<path d="${flame}" fill="none" ${WPN_O}/>`
    + `<rect x="78" y="6.5" width="4" height="5" fill="${wf("glass")}" fill-opacity=".8" ${WPN_O}/>`
    + `<rect x="76.5" y="1.5" width="7" height="6" rx="1.5" fill="${wf("wood")}" ${WPN_O}/>`;
  const transform = size === "small" ? `transform="translate(80 26) scale(0.62) translate(-80 -26)"` : "";
  const viewBox = size === "small" ? "62 6 36 36" : "56 0 48 48";
  return `<svg class="shops-weapon-art" viewBox="${viewBox}" aria-hidden="true" focusable="false"><g filter="url(#wpn-shadow)" ${transform}>${art}</g></svg>`;
}

function coinSackArtSvg() {
  const coin = (cx, cy, rx = 4.2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${wn(rx * 0.45)}" fill="${wf("gold")}" ${WPN_O}/>`;
  const art = `<path d="M71 18 Q61 26 62.5 36 Q64 46.5 80 46.5 Q96 46.5 97.5 36 Q99 26 89 18 Z" fill="${wf("sack")}" ${WPN_O}/>`
    + `<path d="M70 30 Q72 40 80 42 M90 30 Q88 40 80 42" fill="none" stroke="#7c5230" stroke-opacity=".55" stroke-width=".8"/>`
    + `<path d="M67 26 Q65 33 67 40" ${WPN_SHINE} stroke-width="1.4"/>`
    + `<path d="M73 17 L87 17 L86 12 Q91 7 87 3.5 Q83 7 80 5 Q77 7 73 3.5 Q69 7 74 12 Z" fill="${wf("sack")}" ${WPN_O}/>`
    + `<path d="M76 6.5 L77.5 12 M80 6 L80 12 M84 6.5 L82.5 12" stroke="#7c5230" stroke-opacity=".6" stroke-width=".7"/>`
    + `<rect x="71" y="15" width="18" height="4" rx="2" fill="${wf("wood")}" ${WPN_O}/>`
    + `<path d="M85 19 Q87 24 84 27" fill="none" stroke="#5c3a1a" stroke-width="1.4" stroke-linecap="round"/>`
    + `<circle cx="80" cy="32" r="7.5" fill="${wf("gold")}" ${WPN_O}/>`
    + `<circle cx="80" cy="32" r="5.6" fill="none" stroke="#fde68a" stroke-width=".8"/>`
    + `<text x="80" y="35.4" text-anchor="middle" font-size="9" font-weight="800" fill="#78350f" font-family="Arial,sans-serif">C</text>`
    + coin(64, 45.5) + coin(95.5, 45) + coin(97, 42.6, 3.6);
  return `<svg class="shops-weapon-art" viewBox="56 0 48 48" aria-hidden="true" focusable="false"><g filter="url(#wpn-shadow)">${art}</g></svg>`;
}

function waterBottleArtSvg() {
  const body = "M76 11 L84 11 Q90 14 90 19 L90 44 Q90 46.5 87.5 46.5 L72.5 46.5 Q70 46.5 70 44 L70 19 Q70 14 76 11 Z";
  const art = `<path d="${body}" fill="${wf("glass")}" fill-opacity=".45" ${WPN_O}/>`
    + `<path d="M70 21 L90 21 L90 44 Q90 46.5 87.5 46.5 L72.5 46.5 Q70 46.5 70 44 Z" fill="#38bdf8" fill-opacity=".55"/>`
    + `<ellipse cx="80" cy="21" rx="10" ry="1.2" fill="#e0f2fe" fill-opacity=".9"/>`
    + `<rect x="70" y="27" width="20" height="9" fill="#f8fafc" ${WPN_O}/>`
    + `<path d="M80 28.4 Q77.4 31.6 77.4 33 A2.6 2.6 0 0 0 82.6 33 Q82.6 31.6 80 28.4 Z" fill="#0ea5e9"/>`
    + `<path d="M70 39 L90 39 M70 42 L90 42" stroke="#7dd3fc" stroke-opacity=".8" stroke-width=".7"/>`
    + `<path d="M73 18 L73 44" ${WPN_SHINE} stroke-width="1.4"/>`
    + `<path d="${body}" fill="none" ${WPN_O}/>`
    + `<rect x="76" y="7.5" width="8" height="3.5" fill="${wf("glass")}" fill-opacity=".7" ${WPN_O}/>`
    + `<rect x="75" y="1.5" width="10" height="6.5" rx="1.5" fill="${wf("blue")}" ${WPN_O}/>`
    + `<path d="M77 2.5 L77 7 M79 2.5 L79 7 M81 2.5 L81 7 M83 2.5 L83 7" stroke="#1e3a8a" stroke-width=".6"/>`;
  return `<svg class="shops-weapon-art" viewBox="56 0 48 48" aria-hidden="true" focusable="false"><g filter="url(#wpn-shadow)">${art}</g></svg>`;
}

function weaponArtSvg(name) {
  const draw = WEAPON_ART[name];
  if (!draw) return "";
  return `<svg class="shops-weapon-art" viewBox="0 0 160 48" aria-hidden="true" focusable="false"><g filter="url(#wpn-shadow)">${draw()}</g></svg>`;
}
