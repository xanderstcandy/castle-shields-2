const BB_OUTLINE = `stroke="#0b1220" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`;
const BB_LINE = `fill="none" stroke="#0b1220" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`;
const BB_SHINE = `fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"`;

function bbEyes(x1, x2, y, r = 1.6) {
  return `<circle cx="${x1}" cy="${y}" r="${r}" fill="#0b1220"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#0b1220"/>`
    + `<circle cx="${x1 + 0.5}" cy="${y - 0.5}" r="${r * 0.35}" fill="#fff"/><circle cx="${x2 + 0.5}" cy="${y - 0.5}" r="${r * 0.35}" fill="#fff"/>`;
}

function bbFace(style, cx, cy, s) {
  const l = cx - s;
  const r = cx + s;
  const my = cy + s * 0.9;
  const smile = `<path d="M${cx - s * 0.6} ${my} Q${cx} ${my + s * 0.6} ${cx + s * 0.6} ${my}" ${BB_LINE}/>`;
  const closed = (x) => `<path d="M${x - 1.6} ${cy} Q${x} ${cy + 1.4} ${x + 1.6} ${cy}" ${BB_LINE}/>`;
  const wideEye = (x, er) => `<circle cx="${x}" cy="${cy}" r="${er}" fill="#fff" ${BB_OUTLINE}/><circle cx="${x + er * 0.2}" cy="${cy + er * 0.1}" r="${er * 0.5}" fill="#0b1220"/>`;
  if (style === "grumpy") {
    return bbEyes(l, r, cy, 1.4)
      + `<path d="M${l - 2} ${cy - 3} L${l + 1.6} ${cy - 1.6} M${r + 2} ${cy - 3} L${r - 1.6} ${cy - 1.6}" ${BB_LINE}/>`
      + `<path d="M${cx - s * 0.5} ${my + 1} Q${cx} ${my - 1.2} ${cx + s * 0.5} ${my + 1}" ${BB_LINE}/>`;
  }
  if (style === "sleepy") {
    return closed(l) + closed(r)
      + `<circle cx="${cx}" cy="${my}" r=".9" fill="#0b1220"/>`
      + `<text x="${r + 2.5}" y="${cy - 3}" font-size="4.5" font-weight="900" fill="#bfdbfe" font-family="Arial,sans-serif">z</text>`;
  }
  if (style === "wow") {
    return wideEye(l, 2.5) + wideEye(r, 2.5)
      + `<ellipse cx="${cx}" cy="${my + 0.8}" rx="1.5" ry="2" fill="#0b1220"/>`;
  }
  if (style === "wink") {
    return `<circle cx="${l}" cy="${cy}" r="${Math.min(1.6, s * 0.55)}" fill="#0b1220"/>` + closed(r) + smile;
  }
  if (style === "cyclops") {
    return wideEye(cx, s * 0.62)
      + `<path d="M${cx - s * 0.5} ${my + 1.2} Q${cx} ${my + s * 0.5 + 1.2} ${cx + s * 0.5} ${my + 1.2}" ${BB_LINE}/>`;
  }
  if (style === "derp") {
    return wideEye(l, 2.3) + `<circle cx="${r}" cy="${cy + 0.6}" r="1.2" fill="#0b1220"/>`
      + smile + `<ellipse cx="${cx + 1}" cy="${my + s * 0.45}" rx="1.4" ry="1.1" fill="#f472b6"/>`;
  }
  if (style === "laugh") {
    return `<path d="M${l - 1.6} ${cy + 0.8} L${l} ${cy - 0.8} L${l + 1.6} ${cy + 0.8} M${r - 1.6} ${cy + 0.8} L${r} ${cy - 0.8} L${r + 1.6} ${cy + 0.8}" ${BB_LINE}/>`
      + `<path d="M${cx - s * 0.7} ${my - 0.5} Q${cx} ${my + s * 0.9} ${cx + s * 0.7} ${my - 0.5} Z" fill="#7f1d1d" ${BB_OUTLINE}/>`;
  }
  return bbEyes(l, r, cy, Math.min(1.6, s * 0.55)) + smile;
}

function bbStarPoints(cx, cy, outer, inner) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (-90 + i * 36) * (Math.PI / 180);
    const radius = i % 2 === 0 ? outer : inner;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

function bbHexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (-90 + i * 60) * (Math.PI / 180);
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

const BB_TEMPLATES = {
  blob: {
    draw: (a) => `<path d="M6 40 Q3 25 13 18 Q24 9 35 18 Q45 25 42 40 Z" fill="${a}" ${BB_OUTLINE}/><path d="M13 23 Q17 17 23 15" ${BB_SHINE}/>`,
    face: [24, 28, 6], top: [24, 14], bot: 40, sides: [6, 42], armY: 31
  },
  box: {
    draw: (a) => `<rect x="10" y="12" width="28" height="28" rx="6" fill="${a}" ${BB_OUTLINE}/><rect x="13" y="15" width="8" height="3" rx="1.5" fill="#fff" fill-opacity=".4"/>`,
    face: [24, 25, 6], top: [24, 12], bot: 40, sides: [10, 38], armY: 28
  },
  ball: {
    draw: (a) => `<circle cx="24" cy="26" r="14" fill="${a}" ${BB_OUTLINE}/><path d="M15 21 Q17 16 22 14.5" ${BB_SHINE}/>`,
    face: [24, 25, 5.5], top: [24, 12], bot: 40, sides: [10, 38], armY: 28
  },
  tall: {
    draw: (a, b) => `<rect x="15" y="6" width="18" height="36" rx="9" fill="${a}" ${BB_OUTLINE}/><rect x="15.7" y="29" width="16.6" height="4" fill="${b}"/><path d="M19 12 Q20 9 23 8.5" ${BB_SHINE}/>`,
    face: [24, 17, 4.5], top: [24, 6], bot: 42, sides: [15, 33], armY: 25
  },
  tri: {
    draw: (a, b) => `<path d="M24 8 Q26 8 27 10 L41 36 Q42 40 38 40 L10 40 Q6 40 7 36 L21 10 Q22 8 24 8 Z" fill="${a}" ${BB_OUTLINE}/><path d="M9 36 L39 36" stroke="${b}" stroke-width="3"/>`,
    face: [24, 28, 4.5], top: [24, 8], bot: 40, sides: [13, 35], armY: 32
  },
  cloud: {
    draw: (a) => `<path d="M10 36 Q4 36 5 29 Q6 23 13 24 Q13 14 23 14 Q31 13 33 21 Q41 20 43 27 Q44 36 36 36 Z" fill="${a}" ${BB_OUTLINE}/><path d="M16 21 Q19 17 24 17" ${BB_SHINE}/>`,
    face: [24, 27, 5], top: [23, 14], bot: 36, sides: [6, 43], armY: 30
  },
  drop: {
    draw: (a) => `<path d="M24 6 Q38 24 37 31 Q36 42 24 42 Q12 42 11 31 Q10 24 24 6 Z" fill="${a}" ${BB_OUTLINE}/><path d="M16 28 Q17 22 21 17" ${BB_SHINE}/>`,
    face: [24, 31, 5], top: [24, 6], bot: 42, sides: [11, 37], armY: 33
  },
  star: {
    draw: (a) => `<polygon points="${bbStarPoints(24, 26, 18, 8.5)}" fill="${a}" ${BB_OUTLINE}/>`,
    face: [24, 27, 4], top: [24, 8], bot: 40, sides: [8, 40], armY: 22
  },
  hex: {
    draw: (a, b) => `<polygon points="${bbHexPoints(24, 26, 16)}" fill="${a}" ${BB_OUTLINE}/><polygon points="${bbHexPoints(24, 26, 12)}" fill="none" stroke="${b}" stroke-width="1.2"/>`,
    face: [24, 26, 5], top: [24, 10], bot: 41, sides: [10, 38], armY: 28
  },
  mushroom: {
    draw: (a, b) => `<rect x="16" y="22" width="16" height="18" rx="5" fill="${b}" ${BB_OUTLINE}/><path d="M5 24 Q5 7 24 7 Q43 7 43 24 Z" fill="${a}" ${BB_OUTLINE}/><circle cx="14" cy="17" r="2.6" fill="#fff"/><circle cx="24" cy="12" r="2.2" fill="#fff"/><circle cx="33" cy="17.5" r="2.8" fill="#fff"/>`,
    face: [24, 31, 4], top: [24, 7], bot: 40, sides: [16, 32], armY: 33
  },
  cactus: {
    draw: (a, b) => `<rect x="8" y="16" width="7" height="13" rx="3.5" fill="${a}" ${BB_OUTLINE}/><rect x="33" y="12" width="7" height="12" rx="3.5" fill="${a}" ${BB_OUTLINE}/>`
      + `<rect x="9" y="24" width="12" height="5" rx="2" fill="${a}"/><rect x="27" y="19" width="12" height="5" rx="2" fill="${a}"/>`
      + `<rect x="17" y="7" width="14" height="34" rx="7" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M19 30 L17.5 29 M29 32 L30.5 31 M20 37 L18.5 36.5 M28 12 L29.5 11" ${BB_LINE}/>`
      + `<circle cx="24" cy="6.5" r="2.6" fill="${b}" ${BB_OUTLINE}/>`,
    face: [24, 20, 3.5], top: [24, 4], bot: 41, sides: [17, 31], armY: 34
  },
  rock: {
    draw: (a, b) => `<polygon points="8,38 6,26 13,15 25,11 36,16 42,28 39,39" fill="${a}" ${BB_OUTLINE}/><ellipse cx="22" cy="14" rx="7" ry="2.4" fill="${b}"/><path d="M34 22 L31 27 L34 31 M12 32 L15 35" ${BB_LINE}/>`,
    face: [24, 27, 6], top: [24, 11], bot: 39, sides: [7, 42], armY: 28
  },
  sock: {
    draw: (a, b) => `<path d="M14 6 L28 6 L28 28 Q28 32 32 33 L38 34 Q43 36 41 41 Q40 43 36 43 L20 43 Q14 43 14 36 Z" fill="${a}" ${BB_OUTLINE}/><rect x="14.7" y="8" width="12.6" height="3" fill="${b}"/><rect x="14.7" y="13" width="12.6" height="3" fill="${b}"/>`,
    face: [21, 22, 4], top: [21, 6], bot: 43, sides: [14, 28], armY: 27
  },
  mug: {
    draw: (a, b) => `<path d="M34 19 Q42 19 42 26 Q42 33 34 33" fill="none" stroke="#0b1220" stroke-width="5"/><path d="M34 19 Q42 19 42 26 Q42 33 34 33" fill="none" stroke="${a}" stroke-width="2.6"/>`
      + `<rect x="10" y="14" width="24" height="26" rx="3" fill="${a}" ${BB_OUTLINE}/><ellipse cx="22" cy="15" rx="11" ry="2.4" fill="${b}" ${BB_OUTLINE}/>`
      + `<path d="M18 9 Q16 6 18 3 M24 9 Q22 6 24 3" fill="none" stroke="#e2e8f0" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`,
    face: [22, 27, 5], top: [22, 12], bot: 40, sides: [10, 34], armY: 30
  },
  book: {
    draw: (a, b) => `<rect x="10" y="8" width="28" height="34" rx="2" fill="${a}" ${BB_OUTLINE}/><rect x="10" y="8" width="5" height="34" fill="${b}" ${BB_OUTLINE}/><rect x="20" y="12" width="14" height="3" rx="1" fill="#fff" fill-opacity=".45"/>`,
    face: [26, 25, 5], top: [24, 8], bot: 42, sides: [10, 38], armY: 28
  },
  lamp: {
    draw: (a, b) => `<rect x="22" y="23" width="4" height="15" fill="#475569" ${BB_OUTLINE}/><ellipse cx="24" cy="40" rx="10" ry="3" fill="${b}" ${BB_OUTLINE}/><path d="M14 8 L34 8 L40 24 L8 24 Z" fill="${a}" ${BB_OUTLINE}/><path d="M12 22 L36 22" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>`,
    face: [24, 16, 5], top: [24, 8], bot: 42, sides: [8, 40], armY: 19
  },
  kettle: {
    draw: (a, b) => `<path d="M37 28 Q44 24 45 17" fill="none" stroke="#0b1220" stroke-width="5" stroke-linecap="round"/><path d="M37 28 Q44 24 45 17" fill="none" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/>`
      + `<path d="M14 20 Q24 6 34 20" fill="none" stroke="#0b1220" stroke-width="2.4"/>`
      + `<ellipse cx="24" cy="30" rx="15" ry="12" fill="${a}" ${BB_OUTLINE}/><ellipse cx="24" cy="19" rx="8" ry="2.8" fill="${b}" ${BB_OUTLINE}/><circle cx="24" cy="15.5" r="2" fill="${b}" ${BB_OUTLINE}/>`,
    face: [24, 30, 5], top: [24, 9], bot: 42, sides: [9, 39], armY: 31
  },
  sponge: {
    draw: (a, b) => `<rect x="9" y="14" width="30" height="24" rx="3" fill="${a}" ${BB_OUTLINE}/><rect x="9" y="14" width="30" height="6" rx="2" fill="${b}" ${BB_OUTLINE}/><circle cx="14" cy="34" r="1.4" fill="#000" fill-opacity=".18"/><circle cx="35" cy="25" r="1.6" fill="#000" fill-opacity=".18"/><circle cx="33" cy="34" r="1" fill="#000" fill-opacity=".18"/><circle cx="13" cy="25" r="1" fill="#000" fill-opacity=".18"/>`,
    face: [24, 28, 5], top: [24, 14], bot: 38, sides: [9, 39], armY: 28
  },
  toaster: {
    draw: (a, b) => `<rect x="13" y="9" width="9" height="10" rx="3" fill="#d97706" ${BB_OUTLINE}/><rect x="26" y="9" width="9" height="10" rx="3" fill="#d97706" ${BB_OUTLINE}/>`
      + `<rect x="8" y="15" width="32" height="25" rx="7" fill="${a}" ${BB_OUTLINE}/><rect x="40" y="22" width="3" height="7" rx="1" fill="${b}" ${BB_OUTLINE}/><path d="M12 19 Q14 17 18 17" ${BB_SHINE}/>`,
    face: [24, 29, 5], top: [24, 9], bot: 40, sides: [8, 40], armY: 30
  },
  pencil: {
    draw: (a, b) => `<polygon points="18,36 30,36 24,46" fill="#fcd9a8" ${BB_OUTLINE}/><polygon points="22.4,42.6 25.6,42.6 24,46" fill="#334155"/>`
      + `<rect x="18" y="11" width="12" height="25" fill="${a}" ${BB_OUTLINE}/><rect x="18" y="5" width="12" height="5" rx="2" fill="${b}" ${BB_OUTLINE}/><rect x="18" y="9" width="12" height="3" fill="#cbd5e1" ${BB_OUTLINE}/>`,
    face: [24, 22, 3.5], top: [24, 5], bot: 36, sides: [18, 30], armY: 27
  },
  donut: {
    draw: (a, b) => `<path d="M9 26 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z M19 26 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z" fill-rule="evenodd" fill="#d6a46a" ${BB_OUTLINE}/>`
      + `<path d="M11 25 a13 12 0 1 1 26 0 Q34 29 31 27 Q28 30 26 26.5 a5 5 0 1 0 -4 0 Q20 30 17 27 Q14 29 11 25 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M15 18 L17 17 M22 13 L24 14 M31 15 L32 17 M34 22 L36 22 M13 23 L14 21" stroke="${b}" stroke-width="1.6" stroke-linecap="round"/>`,
    face: [24, 35.5, 3.2], top: [24, 11], bot: 41, sides: [9, 39], armY: 26
  },
  pickle: {
    draw: (a) => `<ellipse cx="24" cy="26" rx="10" ry="17" fill="${a}" ${BB_OUTLINE}/><circle cx="18" cy="16" r="1.2" fill="#000" fill-opacity=".2"/><circle cx="30" cy="22" r="1.2" fill="#000" fill-opacity=".2"/><circle cx="19" cy="34" r="1.2" fill="#000" fill-opacity=".2"/><circle cx="29" cy="37" r="1.2" fill="#000" fill-opacity=".2"/><path d="M18 14 Q20 11 23 10" ${BB_SHINE}/>`,
    face: [24, 22, 4], top: [24, 9], bot: 43, sides: [14, 34], armY: 28
  },
  sandwich: {
    draw: (a) => `<rect x="7" y="31" width="34" height="7" rx="3" fill="#e7c08a" ${BB_OUTLINE}/><rect x="8" y="27" width="32" height="5" fill="#ef4444" ${BB_OUTLINE}/>`
      + `<path d="M6 27 Q9 23 12 27 Q15 23 18 27 Q21 23 24 27 Q27 23 30 27 Q33 23 36 27 Q39 23 42 27 Z" fill="#4ade80" ${BB_OUTLINE}/>`
      + `<polygon points="9,24 39,24 35,28 13,28" fill="#facc15" ${BB_OUTLINE}/><path d="M7 24 Q7 12 24 12 Q41 12 41 24 Z" fill="${a}" ${BB_OUTLINE}/>`,
    face: [24, 19, 5], top: [24, 12], bot: 38, sides: [7, 41], armY: 30
  },
  jelly: {
    draw: (a) => `<path d="M10 40 L12 16 Q24 10 36 16 L38 40 Q24 43 10 40 Z" fill="${a}" fill-opacity=".9" ${BB_OUTLINE}/><path d="M15 19 Q19 15 25 15" ${BB_SHINE}/><path d="M14 34 L15 22" ${BB_SHINE}/>`,
    face: [24, 28, 5], top: [24, 13], bot: 41, sides: [11, 37], armY: 30
  },
  moon: {
    draw: (a) => `<path d="M30 6 A18 18 0 1 0 30 42 A22 22 0 0 1 30 6 Z" fill="${a}" ${BB_OUTLINE}/><circle cx="16" cy="33" r="1.4" fill="#000" fill-opacity=".14"/><circle cx="20" cy="38" r="1" fill="#000" fill-opacity=".14"/>`,
    face: [16.5, 23, 2.8], top: [24, 8], bot: 42, sides: [12, 24], armY: 28
  },
  bell: {
    draw: (a, b) => `<circle cx="24" cy="38" r="3" fill="${b}" ${BB_OUTLINE}/><path d="M24 6 Q36 8 36 26 L40 36 L8 36 L12 26 Q12 8 24 6 Z" fill="${a}" ${BB_OUTLINE}/><path d="M24 6 L24 3" ${BB_LINE}/><path d="M16 14 Q18 10 22 9" ${BB_SHINE}/>`,
    face: [24, 24, 5], top: [24, 4], bot: 41, sides: [10, 38], armY: 28
  },
  brick: {
    draw: (a, b) => `<rect x="6" y="14" width="36" height="22" rx="2" fill="${a}" ${BB_OUTLINE}/><path d="M6 21 L42 21 M6 29 L42 29 M16 14 L16 21 M32 14 L32 21 M24 29 L24 36 M12 29 L12 36 M36 29 L36 36" stroke="${b}" stroke-width="1.2"/>`,
    face: [24, 25, 6], top: [24, 14], bot: 36, sides: [6, 42], armY: 25
  },
  dice: {
    draw: (a, b) => `<rect x="10" y="12" width="28" height="28" rx="5" fill="${a}" ${BB_OUTLINE}/><circle cx="15" cy="17" r="1.8" fill="${b}"/><circle cx="33" cy="17" r="1.8" fill="${b}"/><circle cx="15" cy="35" r="1.8" fill="${b}"/><circle cx="33" cy="35" r="1.8" fill="${b}"/>`,
    face: [24, 26, 5], top: [24, 12], bot: 40, sides: [10, 38], armY: 28
  },
  carrot: {
    draw: (a, b) => `<path d="M21 13 Q17 6 19 3 M24 12 Q24 5 27 2 M27 13 Q31 7 33 6" fill="none" stroke="${b}" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M14 14 L34 14 L25 44 Q24 46 23 44 Z" fill="${a}" ${BB_OUTLINE}/><path d="M17 24 L21 24 M28 30 L31 30 M20 35 L23 35" ${BB_LINE}/>`,
    face: [24, 19, 3.6], top: [24, 4], bot: 40, sides: [15, 33], armY: 22
  },
  button: {
    draw: (a, b) => `<circle cx="24" cy="26" r="15" fill="${a}" ${BB_OUTLINE}/><circle cx="24" cy="26" r="11.5" fill="none" stroke="${b}" stroke-width="1.3"/><circle cx="21" cy="17.5" r="1.3" fill="#0b1220" fill-opacity=".6"/><circle cx="27" cy="17.5" r="1.3" fill="#0b1220" fill-opacity=".6"/>`,
    face: [24, 28, 4.5], top: [24, 11], bot: 41, sides: [9, 39], armY: 26
  },
  acorn: {
    draw: (a, b) => `<path d="M12 22 L36 22 Q36 40 24 44 Q12 40 12 22 Z" fill="${a}" ${BB_OUTLINE}/><path d="M10 23 Q10 10 24 10 Q38 10 38 23 Z" fill="${b}" ${BB_OUTLINE}/><path d="M14 17 L34 17 M16 13 L32 13 M18 10 L18 22 M24 10 L24 22 M30 10 L30 22" stroke="#000" stroke-opacity=".2" stroke-width="1"/><path d="M24 10 Q25 6 28 5" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>`,
    face: [24, 31, 4.5], top: [24, 6], bot: 44, sides: [12, 36], armY: 29
  },
  boot: {
    draw: (a, b) => `<path d="M14 6 L28 6 L28 30 L39 32 Q44 34 43 40 L43 41 L14 41 Z" fill="${a}" ${BB_OUTLINE}/><rect x="13" y="40" width="31" height="4" rx="1.5" fill="${b}" ${BB_OUTLINE}/><path d="M17 12 L25 14 M17 17 L25 19 M17 22 L25 24" ${BB_LINE}/>`,
    face: [21, 30, 4], top: [21, 6], bot: 44, sides: [14, 28], armY: 32
  },
  leaf: {
    draw: (a, b) => `<path d="M24 4 Q42 18 24 44 Q6 18 24 4 Z" fill="${a}" ${BB_OUTLINE}/><path d="M24 8 L24 42 M24 18 L30 14 M24 26 L31 21 M24 18 L18 14 M24 26 L17 21" stroke="${b}" stroke-width="1.1" stroke-linecap="round"/>`,
    face: [24, 30, 3.6], top: [24, 4], bot: 42, sides: [13, 35], armY: 24
  },
  flame: {
    draw: (a, b) => `<path d="M24 4 Q30 14 34 18 Q42 28 34 38 Q28 44 24 44 Q20 44 14 38 Q6 28 14 18 Q20 14 24 4 Z" fill="${a}" ${BB_OUTLINE}/><path d="M24 20 Q28 27 30 30 Q32 38 24 40 Q16 38 18 30 Q20 27 24 20 Z" fill="${b}"/>`,
    face: [24, 32, 4], top: [24, 4], bot: 44, sides: [11, 37], armY: 30
  },
  crystal: {
    draw: (a, b) => `<polygon points="24,4 36,16 32,44 16,44 12,16" fill="${a}" ${BB_OUTLINE}/><path d="M12 16 L36 16 M24 4 L20 16 L24 44 M24 4 L28 16 L24 44" stroke="${b}" stroke-width="1" stroke-opacity=".8"/>`,
    face: [24, 25, 4], top: [24, 4], bot: 44, sides: [13, 35], armY: 26
  },
  robot: {
    draw: (a, b) => `<path d="M24 14 L24 8" ${BB_LINE}/><circle cx="24" cy="7" r="2" fill="${b}" ${BB_OUTLINE}/><rect x="11" y="14" width="26" height="24" rx="3" fill="${a}" ${BB_OUTLINE}/><rect x="14" y="18" width="20" height="14" rx="2" fill="#0f172a" ${BB_OUTLINE}/>`,
    face: [24, 24, 5], top: [24, 14], bot: 38, sides: [11, 37], armY: 28
  },
  balloon: {
    draw: (a, b) => `<path d="M24 35 Q20 40 25 43 Q29 46 26 48" fill="none" stroke="${b}" stroke-width="1.2"/><polygon points="22,35 26,35 24,32" fill="${a}" ${BB_OUTLINE}/><ellipse cx="24" cy="19" rx="13" ry="15" fill="${a}" ${BB_OUTLINE}/><path d="M15 15 Q16 9 21 7" ${BB_SHINE}/>`,
    face: [24, 19, 5], top: [24, 4], bot: 34, sides: [11, 37], armY: 22
  },
  bean: {
    draw: (a) => `<path d="M14 11 Q25 3 33 12 Q38 20 33 28 Q29 33 32 38 Q29 46 18 43 Q8 38 9 27 Q10 17 14 11 Z" fill="${a}" ${BB_OUTLINE}/><path d="M15 16 Q18 10 24 9" ${BB_SHINE}/>`,
    face: [22, 22, 4.5], top: [23, 6], bot: 43, sides: [9, 35], armY: 27
  },
  egg: {
    draw: (a, b) => `<ellipse cx="24" cy="27" rx="13" ry="16" fill="${a}" ${BB_OUTLINE}/><circle cx="18" cy="35" r="1.4" fill="${b}"/><circle cx="31" cy="20" r="1.2" fill="${b}"/><circle cx="29" cy="37" r="1" fill="${b}"/><path d="M15 21 Q17 15 22 13" ${BB_SHINE}/>`,
    face: [24, 27, 5], top: [24, 11], bot: 43, sides: [11, 37], armY: 30
  },
  quad: {
    draw: (a, b) => [10, 16, 26, 31].map((x) => `<rect x="${x}" y="32" width="4.5" height="11" rx="2" fill="${a}" ${BB_OUTLINE}/>`).join("")
      + `<path d="M8 26 Q2 22 4 15" fill="none" stroke="#0b1220" stroke-width="3.6" stroke-linecap="round"/><path d="M8 26 Q2 22 4 15" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`
      + `<ellipse cx="21" cy="28" rx="15" ry="9" fill="${a}" ${BB_OUTLINE}/>`
      + `<circle cx="36" cy="20" r="8" fill="${a}" ${BB_OUTLINE}/><ellipse cx="42" cy="23" rx="3.6" ry="2.6" fill="${b}" ${BB_OUTLINE}/><circle cx="43.6" cy="22.4" r=".8" fill="#0b1220"/>`,
    face: [35, 18.5, 2.6], top: [36, 12], bot: 43, sides: [6, 45], armY: 27
  },
  bird: {
    draw: (a, b) => `<path d="M20 37 L19 44 M28 37 L29 44 M16 44 L22 44 M26 44 L32 44" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>`
      + `<ellipse cx="11" cy="27" rx="4.5" ry="8.5" fill="${b}" ${BB_OUTLINE} transform="rotate(18 11 27)"/><ellipse cx="37" cy="27" rx="4.5" ry="8.5" fill="${b}" ${BB_OUTLINE} transform="rotate(-18 37 27)"/>`
      + `<circle cx="24" cy="25" r="13" fill="${a}" ${BB_OUTLINE}/><ellipse cx="24" cy="31" rx="8" ry="6.5" fill="${b}" fill-opacity=".75"/>`
      + `<path d="M21 13 Q22 6 25 9 Q27 4 29 11" fill="${b}" ${BB_OUTLINE}/>`
      + `<polygon points="20.5,26.5 27.5,26.5 24,31.5" fill="#f59e0b" ${BB_OUTLINE}/>`,
    face: [24, 20, 4.5], top: [24, 7], bot: 44, sides: [11, 37], armY: 27
  },
  fish: {
    draw: (a, b) => `<path d="M9 24 L2 15 L3 33 Z" fill="${b}" ${BB_OUTLINE}/><path d="M15 16 Q22 6 29 14" fill="${b}" ${BB_OUTLINE}/>`
      + `<ellipse cx="22" cy="24" rx="15" ry="10" fill="${a}" ${BB_OUTLINE}/><path d="M14 16 Q11 24 14 32" fill="none" stroke="${b}" stroke-width="2"/>`
      + `<path d="M20 29 Q24 33 28 29" fill="${b}" ${BB_OUTLINE}/>`
      + `<circle cx="42" cy="13" r="1.8" fill="none" stroke="#7dd3fc" stroke-width="1"/><circle cx="45" cy="8" r="1.1" fill="none" stroke="#7dd3fc" stroke-width="1"/>`,
    face: [30, 21, 3], top: [22, 9], bot: 36, sides: [7, 37], armY: 26
  },
  bug: {
    draw: (a, b) => `<path d="M13 22 L5 18 M12 29 L4 30 M13 36 L6 42 M35 22 L43 18 M36 29 L44 30 M35 36 L42 42" fill="none" stroke="#0b1220" stroke-width="2" stroke-linecap="round"/>`
      + `<path d="M21 9 Q18 3 14 3 M27 9 Q30 3 34 3" fill="none" stroke="#0b1220" stroke-width="1.3" stroke-linecap="round"/>`
      + `<ellipse cx="24" cy="29" rx="12" ry="13" fill="${a}" ${BB_OUTLINE}/><path d="M24 17 L24 42" stroke="#0b1220" stroke-width="1.2"/>`
      + `<circle cx="19" cy="27" r="2.2" fill="${b}"/><circle cx="29.5" cy="33" r="2.2" fill="${b}"/><circle cx="28.5" cy="23" r="1.6" fill="${b}"/><circle cx="18.5" cy="35" r="1.4" fill="${b}"/>`
      + `<circle cx="24" cy="14" r="6.5" fill="${b}" ${BB_OUTLINE}/>`,
    face: [24, 13.5, 2.6], top: [24, 7], bot: 42, sides: [12, 36], armY: 28
  },
  snake: {
    draw: (a, b) => `<ellipse cx="24" cy="38" rx="16" ry="5.5" fill="${a}" ${BB_OUTLINE}/><ellipse cx="24" cy="32" rx="12" ry="4.5" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M12 38 L14 36 M20 39.5 L22 37.5 M28 39.5 L30 37.5 M34 38 L36 36 M18 32.5 L20 30.5 M27 32.5 L29 30.5" stroke="${b}" stroke-width="1.6" stroke-linecap="round"/>`
      + `<path d="M30 31 Q36 22 28 16" fill="none" stroke="#0b1220" stroke-width="8"/><path d="M30 31 Q36 22 28 16" fill="none" stroke="${a}" stroke-width="5.4"/>`
      + `<ellipse cx="25" cy="13" rx="8" ry="6" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M25 18.6 L25 22 M25 22 L23.6 23.6 M25 22 L26.4 23.6" fill="none" stroke="#ef4444" stroke-width="1" stroke-linecap="round"/>`,
    face: [25, 11.5, 3], top: [25, 7], bot: 43, sides: [8, 40], armY: 32
  },
  frog: {
    draw: (a, b) => `<ellipse cx="10" cy="38" rx="6" ry="4" fill="${a}" ${BB_OUTLINE}/><ellipse cx="38" cy="38" rx="6" ry="4" fill="${a}" ${BB_OUTLINE}/>`
      + `<ellipse cx="24" cy="30" rx="15" ry="11" fill="${a}" ${BB_OUTLINE}/><ellipse cx="24" cy="35" rx="9" ry="5.5" fill="${b}"/>`
      + `<circle cx="16" cy="19" r="5" fill="${a}" ${BB_OUTLINE}/><circle cx="32" cy="19" r="5" fill="${a}" ${BB_OUTLINE}/>`
      + `<ellipse cx="17" cy="41.5" rx="3.6" ry="2" fill="${a}" ${BB_OUTLINE}/><ellipse cx="31" cy="41.5" rx="3.6" ry="2" fill="${a}" ${BB_OUTLINE}/>`,
    face: [24, 19, 8], top: [24, 14], bot: 43, sides: [9, 39], armY: 30
  },
  bunny: {
    draw: (a, b) => `<ellipse cx="18" cy="10" rx="3.3" ry="8" fill="${a}" ${BB_OUTLINE}/><ellipse cx="30" cy="10" rx="3.3" ry="8" fill="${a}" ${BB_OUTLINE}/>`
      + `<ellipse cx="18" cy="10.5" rx="1.4" ry="5.4" fill="${b}"/><ellipse cx="30" cy="10.5" rx="1.4" ry="5.4" fill="${b}"/>`
      + `<ellipse cx="24" cy="35" rx="11" ry="8.5" fill="${a}" ${BB_OUTLINE}/><circle cx="24" cy="23" r="9" fill="${a}" ${BB_OUTLINE}/>`
      + `<ellipse cx="18" cy="43" rx="4" ry="2" fill="${a}" ${BB_OUTLINE}/><ellipse cx="30" cy="43" rx="4" ry="2" fill="${a}" ${BB_OUTLINE}/>`
      + `<circle cx="24" cy="25.6" r="1.1" fill="${b}"/>`,
    face: [24, 21.5, 4], top: [24, 2], bot: 44, sides: [13, 35], armY: 33
  },
  trex: {
    draw: (a, b) => `<path d="M16 30 Q6 30 2 38 Q10 36 18 35 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M17 34 L15 44 L21 44 L22 36 Z" fill="${a}" ${BB_OUTLINE}/><path d="M26 34 L26 44 L31.5 44 L30.5 35 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M17 21 L19 17 L21 21 M13 24 L15 20.5 L17 23.5" fill="${b}" stroke="#0b1220" stroke-width="1" stroke-linejoin="round"/>`
      + `<ellipse cx="23" cy="29" rx="10" ry="9" fill="${a}" ${BB_OUTLINE}/><ellipse cx="25" cy="32" rx="6" ry="5" fill="${b}"/>`
      + `<path d="M26 22 Q28 12 34 10 L44 11 Q46.5 14 44 18 L36 19 Q33 22 31 26 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M37 18 L38 20 L39 18 L40 20 L41 18 L42 20 L43 18" fill="#fff" stroke="#0b1220" stroke-width=".6" stroke-linejoin="round"/>`
      + `<path d="M31 27 L35 29 L35.5 31.5" fill="none" stroke="#0b1220" stroke-width="2.4" stroke-linecap="round"/>`,
    face: [37, 13.2, 2.2], top: [36, 10], bot: 44, sides: [2, 45], armY: 28
  },
  raptor: {
    draw: (a, b) => `<path d="M17 29 Q6 27 1 31 Q8 33 18 33 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M19 33 L17 44 L21 44 L22.5 35 Z" fill="${a}" ${BB_OUTLINE}/><path d="M26 33 L26.5 44 L30.5 44 L29.5 34 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<ellipse cx="23.5" cy="29" rx="8" ry="6.5" fill="${a}" ${BB_OUTLINE}/><path d="M18 29 Q23 25 29 29" fill="none" stroke="${b}" stroke-width="2"/>`
      + `<path d="M27 25 Q29 16 34 14 L43 15 Q45 17.5 43 20.5 L35 21 Q32 24 30.5 27 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M31 15 Q28 9 24 9 Q28 13 29.5 16.5 Z" fill="${b}" ${BB_OUTLINE}/>`
      + `<path d="M36 20.5 L37 22 L38 20.5 L39 22 L40 20.5" fill="#fff" stroke="#0b1220" stroke-width=".6"/>`
      + `<path d="M30 28 L33.5 30.5" fill="none" stroke="#0b1220" stroke-width="2" stroke-linecap="round"/>`,
    face: [37, 16.8, 2], top: [35, 13], bot: 44, sides: [1, 44], armY: 28
  },
  longneck: {
    draw: (a, b) => `<path d="M10 30 Q2 32 1 40 Q8 36 13 34 Z" fill="${a}" ${BB_OUTLINE}/>`
      + [11, 16, 24.5, 29.5].map((x) => `<rect x="${x}" y="32" width="5" height="12" rx="2" fill="${a}" ${BB_OUTLINE}/>`).join("")
      + `<ellipse cx="21" cy="29" rx="13" ry="8" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M28 25 Q34 14 34 7" fill="none" stroke="#0b1220" stroke-width="7.6" stroke-linecap="round"/><path d="M28 25 Q34 14 34 7" fill="none" stroke="${a}" stroke-width="5" stroke-linecap="round"/>`
      + `<ellipse cx="37" cy="6" rx="6" ry="3.8" fill="${a}" ${BB_OUTLINE}/>`
      + `<circle cx="16" cy="26" r="1.8" fill="${b}"/><circle cx="23" cy="24" r="1.6" fill="${b}"/><circle cx="20" cy="31" r="1.4" fill="${b}"/><circle cx="27" cy="29" r="1.3" fill="${b}"/>`,
    face: [38, 5.2, 1.6], top: [37, 2], bot: 44, sides: [1, 43], armY: 28
  },
  trike: {
    draw: (a, b) => `<path d="M9 30 Q3 31 2 36 Q7 35 11 34 Z" fill="${a}" ${BB_OUTLINE}/>`
      + [11, 16, 25, 30].map((x) => `<rect x="${x}" y="33" width="5" height="10" rx="2" fill="${a}" ${BB_OUTLINE}/>`).join("")
      + `<ellipse cx="21" cy="29" rx="13" ry="8.5" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M30 15 Q38 5 46 14 Q46.5 24 38 28 Q31 26 30 15 Z" fill="${b}" ${BB_OUTLINE}/>`
      + `<ellipse cx="38" cy="24" rx="7" ry="5.5" fill="${a}" ${BB_OUTLINE}/>`
      + `<polygon points="34.5,19.5 36.5,10 39,19.5" fill="#f8fafc" ${BB_OUTLINE}/><polygon points="39.5,19.5 43,11 43.2,20.5" fill="#f8fafc" ${BB_OUTLINE}/><polygon points="43,24 47.5,22.5 44,27.5" fill="#f8fafc" ${BB_OUTLINE}/>`,
    face: [37, 23.5, 2.4], top: [40, 8], bot: 43, sides: [2, 46], armY: 28
  },
  stego: {
    draw: (a, b) => `<path d="M9 30 Q2 30 1 25 Q5 33 11 34 Z" fill="${a}" ${BB_OUTLINE}/><path d="M2.5 26.5 L0.5 22 M5 28.5 L3.5 23.5" stroke="#f8fafc" stroke-width="1.6" stroke-linecap="round"/>`
      + `<polygon points="10,23.5 13,13 17.5,22" fill="${b}" ${BB_OUTLINE}/><polygon points="16.5,21 20.5,9 25,20" fill="${b}" ${BB_OUTLINE}/><polygon points="24,20.5 28,11 31.5,22" fill="${b}" ${BB_OUTLINE}/>`
      + [11, 16, 25, 30].map((x) => `<rect x="${x}" y="33" width="5" height="10" rx="2" fill="${a}" ${BB_OUTLINE}/>`).join("")
      + `<ellipse cx="21" cy="29" rx="13" ry="8" fill="${a}" ${BB_OUTLINE}/>`
      + `<ellipse cx="37" cy="31" rx="6.5" ry="4.2" fill="${a}" ${BB_OUTLINE}/>`,
    face: [38, 30, 2], top: [21, 9], bot: 43, sides: [1, 43], armY: 30
  },
  ptero: {
    draw: (a, b) => `<path d="M22 22 Q10 12 1 18 Q8 22 12 28 Q17 25 22 28 Z" fill="${b}" ${BB_OUTLINE}/><path d="M26 22 Q38 12 47 18 Q40 22 36 28 Q31 25 26 28 Z" fill="${b}" ${BB_OUTLINE}/>`
      + `<path d="M22 36 L21 41 M26 36 L27 41" stroke="#0b1220" stroke-width="1.6" stroke-linecap="round"/>`
      + `<ellipse cx="24" cy="27" rx="5.5" ry="9" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M24 14 Q20 6 15 5 Q20 10 21 15 Z" fill="${a}" ${BB_OUTLINE}/><ellipse cx="24" cy="16" rx="5" ry="4.5" fill="${a}" ${BB_OUTLINE}/>`
      + `<polygon points="22,18.5 26,18.5 24,24" fill="#f59e0b" ${BB_OUTLINE}/>`,
    face: [24, 14.5, 2.2], top: [24, 5], bot: 41, sides: [1, 47], armY: 24
  },
  flower: {
    draw: (a, b) => `<path d="M24 44 Q22 34 24 25" fill="none" stroke="#15803d" stroke-width="2.6" stroke-linecap="round"/>`
      + `<path d="M23 37 Q14 36 12 30 Q20 30 23 37 Z" fill="#22c55e" ${BB_OUTLINE}/><path d="M24 33 Q32 31 35 25 Q27 26 24 33 Z" fill="#22c55e" ${BB_OUTLINE}/>`
      + Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return `<circle cx="${(24 + Math.cos(angle) * 8.5).toFixed(2)}" cy="${(16 + Math.sin(angle) * 8.5).toFixed(2)}" r="4.6" fill="${a}" ${BB_OUTLINE}/>`;
      }).join("")
      + `<circle cx="24" cy="16" r="6.5" fill="${b}" ${BB_OUTLINE}/>`,
    face: [24, 15.5, 2.6], top: [24, 3], bot: 44, sides: [12, 36], armY: 30
  },
  flytrap: {
    draw: (a, b) => `<path d="M24 44 Q26 37 24 31" fill="none" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M23 42 Q14 41 11 35 Q19 35 23 42 Z" fill="#22c55e" ${BB_OUTLINE}/><path d="M25 41 Q34 40 37 34 Q29 34 25 41 Z" fill="#22c55e" ${BB_OUTLINE}/>`
      + `<path d="M10 25 Q24 39 38 25 Z" fill="${a}" ${BB_OUTLINE}/><path d="M12 25.5 L36 25.5" stroke="${b}" stroke-width="3"/>`
      + `<path d="M8 23 Q24 3 40 23 Z" fill="${a}" ${BB_OUTLINE}/>`
      + `<path d="M11 23 L12 26 L13.5 23 L15 26 L16.5 23 M31.5 23 L33 26 L34.5 23 L36 26 L37 23" fill="#fff" stroke="#0b1220" stroke-width=".6" stroke-linejoin="round"/>`,
    face: [24, 14, 4.5], top: [24, 8], bot: 44, sides: [8, 40], armY: 26
  },
  treant: {
    draw: (a, b) => `<path d="M17 40 L14 45.5 M24 40 L24 45.5 M31 40 L34 45.5" stroke="#0b1220" stroke-width="5" stroke-linecap="round"/><path d="M17 40 L14 45.5 M24 40 L24 45.5 M31 40 L34 45.5" stroke="${b}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M16 25 L8 20 M32 25 L40 21" stroke="#0b1220" stroke-width="4.6" stroke-linecap="round"/><path d="M16 25 L8 20 M32 25 L40 21" stroke="${b}" stroke-width="2.6" stroke-linecap="round"/>`
      + `<path d="M16 17 L32 17 L33.5 40 L14.5 40 Z" fill="${b}" ${BB_OUTLINE}/>`
      + `<circle cx="15" cy="13" r="8" fill="${a}" ${BB_OUTLINE}/><circle cx="33" cy="13" r="8" fill="${a}" ${BB_OUTLINE}/><circle cx="24" cy="9" r="9" fill="${a}" ${BB_OUTLINE}/>`
      + `<circle cx="20" cy="7" r="2.6" fill="#fff" fill-opacity=".25"/>`,
    face: [24, 27, 4.5], top: [24, 0], bot: 45, sides: [15, 33], armY: 25
  }
};

function bbExtraBack(extras, tpl, a, b) {
  const [cx] = tpl.face;
  const [left, right] = tpl.sides;
  const y = tpl.armY;
  let markup = "";
  if (extras.includes("aura")) {
    markup += `<circle cx="24" cy="26" r="23" fill="${b}" fill-opacity=".16"/><circle cx="24" cy="26" r="19" fill="${b}" fill-opacity=".2"/>`;
  }
  const [tx, ty] = tpl.top;
  const [, fy, fs] = tpl.face;
  if (extras.includes("mane")) {
    markup += `<circle cx="${cx + 1}" cy="${fy + 1}" r="${fs * 4}" fill="${b}" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("antlers")) {
    const base = ty + 2;
    const tip = Math.max(1, base - 10);
    markup += `<path d="M${tx - 3} ${base} L${tx - 6} ${tip + 3} L${tx - 9} ${tip + 1} M${tx - 6} ${tip + 3} L${tx - 5} ${tip} M${tx + 3} ${base} L${tx + 6} ${tip + 3} L${tx + 9} ${tip + 1} M${tx + 6} ${tip + 3} L${tx + 5} ${tip}" fill="none" stroke="#0b1220" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M${tx - 3} ${base} L${tx - 6} ${tip + 3} L${tx - 9} ${tip + 1} M${tx - 6} ${tip + 3} L${tx - 5} ${tip} M${tx + 3} ${base} L${tx + 6} ${tip + 3} L${tx + 9} ${tip + 1} M${tx + 6} ${tip + 3} L${tx + 5} ${tip}" fill="none" stroke="#a16207" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (extras.includes("ears")) {
    markup += `<polygon points="${tx - 7},${ty + 4} ${tx - 5},${ty - 4} ${tx - 1.5},${ty + 2}" fill="${a}" ${BB_OUTLINE}/>`
      + `<polygon points="${tx + 7},${ty + 4} ${tx + 5},${ty - 4} ${tx + 1.5},${ty + 2}" fill="${a}" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("roundears")) {
    markup += `<circle cx="${tx - 5.5}" cy="${ty + 1.5}" r="3.2" fill="${a}" ${BB_OUTLINE}/><circle cx="${tx + 5.5}" cy="${ty + 1.5}" r="3.2" fill="${a}" ${BB_OUTLINE}/>`
      + `<circle cx="${tx - 5.5}" cy="${ty + 1.5}" r="1.5" fill="${b}"/><circle cx="${tx + 5.5}" cy="${ty + 1.5}" r="1.5" fill="${b}"/>`;
  }
  if (extras.includes("wings")) {
    markup += `<path d="M${left + 3} ${y - 4} Q${left - 10} ${y - 16} ${left - 12} ${y - 2} Q${left - 6} ${y - 2} ${left + 3} ${y + 3} Z" fill="${b}" fill-opacity=".9" ${BB_OUTLINE}/>`
      + `<path d="M${right - 3} ${y - 4} Q${right + 10} ${y - 16} ${right + 12} ${y - 2} Q${right + 6} ${y - 2} ${right - 3} ${y + 3} Z" fill="${b}" fill-opacity=".9" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("legs")) {
    const legH = Math.max(3, Math.min(6, 47 - tpl.bot));
    markup += `<rect x="${cx - 7}" y="${tpl.bot - 2}" width="4.5" height="${legH + 2}" rx="2" fill="${a}" ${BB_OUTLINE}/>`
      + `<rect x="${cx + 2.5}" y="${tpl.bot - 2}" width="4.5" height="${legH + 2}" rx="2" fill="${a}" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("arms")) {
    const arm = (x0, x1) => `<path d="M${x0} ${y} L${x1} ${y - 4}" fill="none" stroke="#0b1220" stroke-width="3.4" stroke-linecap="round"/>`
      + `<path d="M${x0} ${y} L${x1} ${y - 4}" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round"/>`
      + `<circle cx="${x1}" cy="${y - 4}" r="2" fill="${a}" ${BB_OUTLINE}/>`;
    markup += arm(left + 2, Math.max(2.5, left - 5)) + arm(right - 2, Math.min(45.5, right + 5));
  }
  return markup;
}

function bbExtraFront(extras, tpl, b) {
  const [fx, fy] = tpl.face;
  const [tx, ty] = tpl.top;
  let markup = "";
  if (extras.includes("spots")) {
    markup += `<circle cx="${fx - 7}" cy="${fy + 6}" r="2" fill="${b}" fill-opacity=".85"/><circle cx="${fx + 7.5}" cy="${fy + 4}" r="1.6" fill="${b}" fill-opacity=".85"/><circle cx="${fx + 2}" cy="${fy - 7}" r="1.4" fill="${b}" fill-opacity=".85"/>`;
  }
  if (extras.includes("horns")) {
    markup += `<polygon points="${tx - 8},${ty + 3} ${tx - 6},${ty - 5} ${tx - 3},${ty + 2}" fill="${b}" ${BB_OUTLINE}/>`
      + `<polygon points="${tx + 8},${ty + 3} ${tx + 6},${ty - 5} ${tx + 3},${ty + 2}" fill="${b}" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("antenna")) {
    const top = Math.max(3, ty - 7);
    markup += `<path d="M${tx} ${ty} L${tx} ${top + 1.5}" ${BB_LINE}/><circle cx="${tx}" cy="${top}" r="2" fill="${b}" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("fire")) {
    const base = Math.max(9, ty + 1);
    markup += `<path d="M${tx} ${base - 9} Q${tx + 4} ${base - 5} ${tx + 3.5} ${base - 2} Q${tx + 3} ${base} ${tx} ${base} Q${tx - 3} ${base} ${tx - 3.5} ${base - 2} Q${tx - 4} ${base - 5} ${tx} ${base - 9} Z" fill="#f97316" ${BB_OUTLINE}/>`
      + `<path d="M${tx} ${base - 5} Q${tx + 2} ${base - 3} ${tx + 1.5} ${base - 1.4} Q${tx} ${base - 0.6} ${tx - 1.5} ${base - 1.4} Q${tx - 2} ${base - 3} ${tx} ${base - 5} Z" fill="#fde047"/>`;
  }
  if (extras.includes("stripes")) {
    const [left, right] = tpl.sides;
    const mid = (left + right) / 2;
    const y = tpl.armY;
    markup += `<path d="M${mid - 6} ${y - 6} q2 6 0 12 M${mid} ${y - 7} q2 7 0 14 M${mid + 6} ${y - 6} q2 6 0 12" fill="none" stroke="${b}" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  if (extras.includes("trunk")) {
    const x0 = fx + 6;
    const y0 = fy + 3;
    const trunk = `M${x0} ${y0} Q${Math.min(47, x0 + 5)} ${y0 + 7} ${Math.min(46, x0 + 2)} ${y0 + 14}`;
    markup += `<path d="${trunk}" fill="none" stroke="#0b1220" stroke-width="4.6" stroke-linecap="round"/><path d="${trunk}" fill="none" stroke="#94a3b8" stroke-width="2.8" stroke-linecap="round"/>`;
  }
  if (extras.includes("horn")) {
    markup += `<polygon points="${fx + 4},${fy - 0.5} ${Math.min(47, fx + 8.5)},${Math.max(1, fy - 9)} ${fx + 7.5},${fy + 1.5}" fill="#f8fafc" ${BB_OUTLINE}/>`;
  }
  if (extras.includes("sparkle")) {
    const star = (x, y, s) => `<path d="M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z" fill="#fef9c3"/>`;
    markup += star(6, 8, 3) + star(42, 11, 2.4) + star(41, 40, 2);
  }
  return markup;
}

function bbBuiltArt(spec) {
  const tpl = BB_TEMPLATES[spec.template] || BB_TEMPLATES.blob;
  const extras = spec.extras || [];
  const [fx, fy, fs] = tpl.face;
  return bbExtraBack(extras, tpl, spec.a, spec.b)
    + tpl.draw(spec.a, spec.b)
    + bbExtraFront(extras, tpl, spec.b)
    + bbFace(spec.face, fx, fy, fs);
}

function bbBonsai(trunk, canopyR, rootSpread) {
  const roots = [-1, -0.5, 0, 0.5, 1]
    .map((t) => `<path d="M24 38 Q${24 + t * rootSpread * 0.5} 41 ${24 + t * rootSpread} 45" fill="none" stroke="#7c4a21" stroke-width="1.4" stroke-linecap="round"/>`)
    .join("");
  return `<path d="M22 38 Q21 ${38 - trunk * 0.5} 23 ${38 - trunk} L25 ${38 - trunk} Q27 ${38 - trunk * 0.5} 26 38 Z" fill="#92400e" ${BB_OUTLINE}/>`
    + roots
    + `<circle cx="17" cy="${36 - trunk}" r="${canopyR * 0.7}" fill="#15803d" ${BB_OUTLINE}/>`
    + `<circle cx="31" cy="${36 - trunk}" r="${canopyR * 0.7}" fill="#15803d" ${BB_OUTLINE}/>`
    + `<circle cx="24" cy="${32 - trunk}" r="${canopyR}" fill="#22c55e" ${BB_OUTLINE}/>`
    + `<circle cx="20" cy="${30 - trunk}" r="${canopyR * 0.3}" fill="#86efac" fill-opacity=".7"/>`;
}

function bbTurtle(shell, head) {
  return `<ellipse cx="13" cy="37" rx="3.4" ry="2.4" fill="#65a30d" ${BB_OUTLINE}/>`
    + `<ellipse cx="33" cy="37" rx="3.4" ry="2.4" fill="#65a30d" ${BB_OUTLINE}/>`
    + `<ellipse cx="39" cy="28" rx="${head}" ry="${head * 0.85}" fill="#84cc16" ${BB_OUTLINE}/>`
    + `<circle cx="40.5" cy="26.5" r="1.1" fill="#0b1220"/>`
    + `<path d="M6 34 Q6 16 23 16 Q38 16 38 34 Z" fill="${shell}" ${BB_OUTLINE}/>`
    + `<path d="M13 33 L16 23 L23 20 L30 23 L33 33 M16 23 L23 27 L30 23 M23 27 L23 33" fill="none" stroke="#0b1220" stroke-width="1" stroke-opacity=".55"/>`
    + `<path d="M5 34 L39 34" stroke="#0b1220" stroke-width="1.4" stroke-linecap="round"/>`;
}

function bbHippo(body, spots) {
  const spotMarkup = spots
    ? `<circle cx="14" cy="25" r="2.2" fill="${spots}"/><circle cx="22" cy="31" r="1.8" fill="${spots}"/><circle cx="27" cy="23" r="2.4" fill="${spots}"/><circle cx="17" cy="33" r="1.3" fill="${spots}"/><circle cx="31" cy="30" r="1.5" fill="${spots}"/><circle cx="39" cy="20" r="1.2" fill="${spots}"/>`
    : "";
  return `<rect x="11" y="34" width="5" height="7" rx="2" fill="${body}" ${BB_OUTLINE}/>`
    + `<rect x="26" y="34" width="5" height="7" rx="2" fill="${body}" ${BB_OUTLINE}/>`
    + `<ellipse cx="22" cy="28" rx="16" ry="10" fill="${body}" ${BB_OUTLINE}/>`
    + `<ellipse cx="37" cy="24" rx="8" ry="7" fill="${body}" ${BB_OUTLINE}/>`
    + spotMarkup
    + `<circle cx="34" cy="16.5" r="2" fill="${body}" ${BB_OUTLINE}/>`
    + `<circle cx="36" cy="21" r="1.3" fill="#0b1220"/>`
    + `<circle cx="42" cy="26" r="1" fill="#475569"/><circle cx="39" cy="27" r="1" fill="#475569"/>`
    + `<path d="M33 30 Q38 32 43 29" ${BB_LINE}/>`;
}

const BB_ART = {
  snob: () => `<path d="M8 36 Q5 22 15 16 Q24 10 33 16 Q43 22 40 34 Q41 39 37 39 Q36 45 32.5 40 Q28 41 25 40 Q23.5 46 20 40.5 Q12 41 8 36 Z" fill="#a3e635" ${BB_OUTLINE}/>`
    + `<ellipse cx="17" cy="27" rx="4" ry="3" fill="#65a30d" fill-opacity=".55"/><ellipse cx="32" cy="32" rx="3" ry="2.2" fill="#65a30d" fill-opacity=".55"/><ellipse cx="28" cy="19" rx="2.4" ry="1.6" fill="#65a30d" fill-opacity=".5"/>`
    + `<path d="M14 20 Q18 15 24 14" ${BB_SHINE}/><circle cx="35" cy="22" r="1.3" fill="#fff" fill-opacity=".6"/>`
    + `<circle cx="20" cy="25" r="2.6" fill="#fff" ${BB_OUTLINE}/><circle cx="20.6" cy="25.4" r="1.2" fill="#0b1220"/><circle cx="29" cy="25.5" r="1.4" fill="#0b1220"/>`
    + `<path d="M20 31 Q24.5 34 29 31" ${BB_LINE}/><path d="M26 32.4 Q26.5 36 25.5 37.5" fill="none" stroke="#d9f99d" stroke-width="1.4" stroke-linecap="round"/>`,
  lol: () => `<rect x="21.5" y="34" width="5" height="11" rx="2" fill="#e7c08a" ${BB_OUTLINE}/>`
    + `<path d="M13 14 Q13 5 22 5 L25 5 Q24 9.5 28 9.5 Q28 13.5 32 12.8 Q35 12.6 35 16 L35 34 Q35 37 32 37 L16 37 Q13 37 13 34 Z" fill="#fb923c" ${BB_OUTLINE}/>`
    + `<path d="M13.7 24 L34.3 24" stroke="#fde047" stroke-width="3"/>`
    + `<path d="M16 10 Q17 7.5 20 7" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-opacity=".8"/>`
    + `<path d="M17.5 18.6 L19.2 16.8 L20.9 18.6 M27.1 18.6 L28.8 16.8 L30.5 18.6" ${BB_LINE}/>`
    + `<path d="M18.5 27 Q24 35 29.5 27 Z" fill="#7f1d1d" ${BB_OUTLINE}/><path d="M21 31 Q24 33 27 31" fill="#f87171"/>`
    + `<path d="M16.5 20.5 Q15.6 22.5 16.6 23.2 Q17.6 22.5 16.5 20.5 Z M31.5 20.5 Q30.6 22.5 31.6 23.2 Q32.6 22.5 31.5 20.5 Z" fill="#7dd3fc"/>`,
  snavier: () => `<path d="M20.5 37 L19 44 M27.5 37 L29 44" stroke="#0b1220" stroke-width="4.4" stroke-linecap="round"/>`
    + `<path d="M20.5 37 L19 44 M27.5 37 L29 44" stroke="#14b8a6" stroke-width="2.6" stroke-linecap="round"/>`
    + `<ellipse cx="17.6" cy="44.8" rx="2.8" ry="1.5" fill="#14b8a6" ${BB_OUTLINE}/><ellipse cx="30.4" cy="44.8" rx="2.8" ry="1.5" fill="#14b8a6" ${BB_OUTLINE}/>`
    + `<path d="M24 37 Q13 30 22.5 23 Q32 16 25.5 10" fill="none" stroke="#0b1220" stroke-width="10.6"/>`
    + `<path d="M24 37 Q13 30 22.5 23 Q32 16 25.5 10" fill="none" stroke="#0d9488" stroke-width="7.8"/>`
    + `<path d="M24 37 Q13 30 22.5 23 Q32 16 25.5 10" fill="none" stroke="#5eead4" stroke-width="2" stroke-dasharray="2 3"/>`
    + `<ellipse cx="24" cy="37" rx="6" ry="3.8" fill="#0d9488" ${BB_OUTLINE}/>`
    + `<ellipse cx="28" cy="8.5" rx="6.5" ry="5" fill="#0d9488" ${BB_OUTLINE}/>`
    + `<circle cx="29.6" cy="7" r="1.5" fill="#fde047" ${BB_OUTLINE}/><circle cx="29.8" cy="7" r=".6" fill="#0b1220"/>`
    + `<path d="M34.3 9.6 L37 9.6 M37 9.6 L38 8.4 M37 9.6 L38 10.8" fill="none" stroke="#ef4444" stroke-width="1" stroke-linecap="round"/>`,
  hippo: () => bbHippo("#94a3b8", ""),
  hobbler: () => bbHippo("#fde047", "#b45309"),
  sprout: () => `<path d="M14 36 L34 36 L31 45 L17 45 Z" fill="#b45309" ${BB_OUTLINE}/>`
    + `<rect x="12" y="33" width="24" height="4" rx="1.5" fill="#d97706" ${BB_OUTLINE}/>`
    + `<path d="M24 33 Q23 24 24 16" fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"/>`
    + `<path d="M24 22 Q14 21 12 13 Q21 13 24 22 Z" fill="#4ade80" ${BB_OUTLINE}/>`
    + `<path d="M24 18 Q33 16 36 9 Q27 9 24 18 Z" fill="#22c55e" ${BB_OUTLINE}/>`
    + bbEyes(20, 28, 40, 1.2),
  bonsaiSmall: () => bbBonsai(10, 7, 12),
  ipop: () => `<rect x="21.5" y="34" width="5" height="11" rx="2" fill="#e7c08a" ${BB_OUTLINE}/>`
    + `<path d="M13 14 Q13 5 24 5 Q35 5 35 14 L35 34 Q35 37 32 37 L16 37 Q13 37 13 34 Z" fill="#f472b6" ${BB_OUTLINE}/>`
    + `<path d="M13 22 L35 22" stroke="#fbcfe8" stroke-width="3"/>`
    + `<path d="M17 9 Q19 7 21 8" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-opacity=".8"/>`
    + bbEyes(20, 28, 27)
    + `<path d="M21 31.5 Q24 34 27 31.5" ${BB_LINE}/>`,
  turtleSmall: () => bbTurtle("#4d7c0f", 4),
  bonsaiMedium: () => bbBonsai(13, 9, 16),
  bonsaiLarge: () => bbBonsai(15, 11, 20)
    + `<circle cx="13" cy="21" r="2" fill="#f9a8d4"/><circle cx="33" cy="18" r="2" fill="#f9a8d4"/><circle cx="25" cy="11" r="2" fill="#f9a8d4"/>`,
  polygone: () => `<rect x="17.5" y="34" width="5" height="12" rx="2.5" fill="#facc15" ${BB_OUTLINE}/>`
    + `<rect x="27" y="34" width="5" height="12" rx="2.5" fill="#facc15" ${BB_OUTLINE}/>`
    + `<rect x="15" y="19" width="20" height="17" rx="3" fill="#ef4444" ${BB_OUTLINE}/>`
    + `<rect x="21.5" y="22" width="6" height="10" rx="3" fill="#fde047" ${BB_OUTLINE}/>`
    + `<path d="M16 34 L34 34" stroke="#b91c1c" stroke-width="1.6"/>`
    + `<rect x="3" y="10" width="21" height="4.6" rx="2.3" fill="#facc15" ${BB_OUTLINE}/>`
    + `<path d="M18 4 Q27 2.5 36 4 Q37 12 36 20 L19 20 Q17.5 12 18 4 Z" fill="#f97316" ${BB_OUTLINE}/>`
    + `<path d="M20 6 Q26 5 31 5.6" ${BB_SHINE}/>`
    + `<circle cx="29.5" cy="10" r="2.8" fill="#0b1220"/><circle cx="30.4" cy="9.1" r=".9" fill="#fff"/>`,
  sheldon: () => `<ellipse cx="10" cy="37.5" rx="4" ry="3" fill="#65a30d" ${BB_OUTLINE}/>`
    + `<ellipse cx="36" cy="37.5" rx="4" ry="3" fill="#65a30d" ${BB_OUTLINE}/>`
    + `<ellipse cx="42" cy="30" rx="5" ry="4.4" fill="#84cc16" ${BB_OUTLINE}/>`
    + `<circle cx="43.5" cy="28.6" r="1.2" fill="#0b1220"/><path d="M42 32.4 Q44 33.4 46 32" ${BB_LINE}/>`
    + `<path d="M4 35 Q4 15 23 15 Q42 15 42 35 Z" fill="#3b82f6" ${BB_OUTLINE}/>`
    + `<path d="M8 31 Q11 28 14 31 Q17 28 20 31 Q23 28 26 31 Q29 28 32 31 Q35 28 38 31 M10 25 Q13 22 16 25 Q19 22 22 25 Q25 22 28 25 Q31 22 34 25 Q37 22 39 25 M14 19.5 Q17 17 20 19.5 Q23 17 26 19.5 Q29 17 32 19.5" fill="none" stroke="#1d4ed8" stroke-width="1"/>`
    + `<path d="M10 28 Q12 22 17 19" ${BB_SHINE}/>`
    + `<rect x="3.5" y="33.5" width="39" height="3.6" rx="1.8" fill="#1e40af" ${BB_OUTLINE}/>`
    + `<circle cx="15" cy="15.5" r="4.2" fill="#22c55e" ${BB_OUTLINE}/><circle cx="23" cy="12.5" r="4.4" fill="#22c55e" ${BB_OUTLINE}/><circle cx="31" cy="15.5" r="4.2" fill="#22c55e" ${BB_OUTLINE}/>`
    + `<ellipse cx="15" cy="13.6" rx="1.6" ry="2.2" fill="#fde047"/><ellipse cx="23" cy="10.4" rx="1.7" ry="2.3" fill="#fde047"/><ellipse cx="31" cy="13.6" rx="1.6" ry="2.2" fill="#fde047"/>`
};

function bbArtSvg(art) {
  const markup = typeof art === "string" ? (BB_ART[art] ? BB_ART[art]() : "") : bbBuiltArt(art);
  return `<svg class="bbs-entry-art-svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${markup}</svg>`;
}

const BB_STAT_RANGES = {
  common: { hp: [30, 90], damage: [5, 18], defense: [0, 3] },
  uncommon: { hp: [60, 140], damage: [12, 28], defense: [0, 6] },
  rare: { hp: [100, 220], damage: [20, 42], defense: [2, 10] },
  legendary: { hp: [200, 400], damage: [30, 60], defense: [4, 14] },
  heroic: { hp: [300, 600], damage: [45, 100], defense: [8, 20] }
};

const BB_SPEEDS = ["Very slow", "Slow", "", "Fast", "Super fast"];

function bbSeededRandom(text) {
  let seed = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    seed ^= text.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822507);
    seed = Math.imul(seed ^ (seed >>> 13), 3266489909);
    seed ^= seed >>> 16;
    return (seed >>> 0) / 4294967296;
  };
}

function bbMade(name, rarity, template, a, b, face, extras = "") {
  const rand = bbSeededRandom(name);
  const range = BB_STAT_RANGES[rarity];
  const pick = ([min, max]) => min + Math.floor(rand() * (max - min + 1));
  const entry = {
    name,
    rarity,
    art: { template, a, b, face, extras: extras ? extras.split(" ") : [] },
    hp: Math.round(pick(range.hp) / 5) * 5,
    damage: pick(range.damage),
    defense: pick(range.defense)
  };
  const speed = BB_SPEEDS[Math.floor(rand() * BB_SPEEDS.length)];
  if (speed) entry.speed = speed;
  return entry;
}

const BB_CATALOG = [
  { name: "Snob", rarity: "common", art: "snob", hp: 75, damage: 15, defense: 0.25 },
  { name: "LOL", rarity: "common", art: "lol", hp: 40, damage: 1, attackMs: 10, defense: 0.1 },
  bbMade("Mudmuffin", "common", "blob", "#92400e", "#d6a46a", "happy"),
  bbMade("Bricky", "common", "brick", "#dc2626", "#fecaca", "grumpy"),
  bbMade("Socko", "common", "sock", "#f8fafc", "#ef4444", "derp"),
  bbMade("Puddlin", "common", "drop", "#38bdf8", "#e0f2fe", "happy"),
  bbMade("Grumble Rock", "common", "rock", "#9ca3af", "#4ade80", "grumpy"),
  bbMade("Wobblin", "common", "jelly", "#4ade80", "#bbf7d0", "wow"),
  bbMade("Muglug", "common", "mug", "#f1f5f9", "#78350f", "sleepy"),
  bbMade("Pebblepop", "common", "ball", "#d6c3a1", "#a8a29e", "wink"),
  bbMade("Crumbo", "common", "sandwich", "#e7c08a", "#e7c08a", "happy"),
  bbMade("Dicey", "common", "dice", "#f8fafc", "#0b1220", "wow"),
  bbMade("Spongel", "common", "sponge", "#fde047", "#22c55e", "laugh"),
  bbMade("Toastie", "common", "toaster", "#cbd5e1", "#475569", "sleepy"),
  bbMade("Beanbo", "common", "bean", "#b91c1c", "#fecaca", "derp"),
  bbMade("Pickleton", "common", "pickle", "#65a30d", "#d9f99d", "grumpy"),
  bbMade("Buttony", "common", "button", "#f9a8d4", "#be185d", "happy"),
  bbMade("Fluffcloud", "common", "cloud", "#f8fafc", "#e2e8f0", "sleepy"),
  bbMade("Leafy Lou", "common", "leaf", "#4ade80", "#166534", "wink"),
  bbMade("Eggbert", "common", "egg", "#fef3c7", "#d6a46a", "wow"),
  bbMade("Nutty", "common", "acorn", "#b45309", "#78350f", "happy"),
  bbMade("Bootsy", "common", "boot", "#92400e", "#1c1917", "grumpy"),
  bbMade("Pencilo", "common", "pencil", "#facc15", "#f9a8d4", "derp"),
  bbMade("Dotty", "common", "ball", "#a78bfa", "#ede9fe", "happy", "spots"),
  bbMade("Boxo", "common", "box", "#c08a4a", "#7c4a21", "wow"),
  bbMade("Bellbo", "common", "bell", "#facc15", "#b45309", "happy"),
  bbMade("Mossy Mound", "common", "blob", "#4d7c0f", "#a3e635", "sleepy", "spots"),
  bbMade("Carroty", "common", "carrot", "#f97316", "#16a34a", "laugh"),
  bbMade("Squishy", "common", "jelly", "#f472b6", "#fbcfe8", "derp"),
  bbMade("Plonk", "common", "hex", "#94a3b8", "#e2e8f0", "grumpy"),
  bbMade("Scruff", "common", "cloud", "#6b7280", "#9ca3af", "grumpy"),
  bbMade("Gumdrop", "common", "drop", "#ef4444", "#fecaca", "wink"),
  { name: "Snavier", rarity: "uncommon", art: "snavier", hp: 100, damage: 25, defense: 4 },
  { name: "Hipoin", rarity: "uncommon", art: "hippo", hp: 50, damage: 35, defense: 3 },
  { name: "Boosoo", rarity: "uncommon", art: "sprout", hp: 25, damage: 15, defense: 0, speed: "Very slow" },
  bbMade("Donutty", "uncommon", "donut", "#f472b6", "#fef08a", "happy"),
  bbMade("Kettlebop", "uncommon", "kettle", "#38bdf8", "#0369a1", "wink"),
  bbMade("Lampy", "uncommon", "lamp", "#fde68a", "#78350f", "sleepy"),
  bbMade("Booky", "uncommon", "book", "#16a34a", "#14532d", "wow"),
  bbMade("Shroomer", "uncommon", "mushroom", "#dc2626", "#fef3c7", "happy"),
  bbMade("Pricklepants", "uncommon", "cactus", "#22c55e", "#f472b6", "grumpy", "legs"),
  bbMade("Moonbeam", "uncommon", "moon", "#fef08a", "#fde047", "sleepy"),
  bbMade("Balloony", "uncommon", "balloon", "#ef4444", "#e2e8f0", "laugh"),
  bbMade("Flicker", "uncommon", "flame", "#f97316", "#fde047", "wink"),
  bbMade("Gemmo", "uncommon", "crystal", "#22d3ee", "#cffafe", "wow"),
  bbMade("Robox", "uncommon", "robot", "#94a3b8", "#ef4444", "cyclops"),
  bbMade("Twinklet", "uncommon", "star", "#facc15", "#fef9c3", "happy"),
  bbMade("Jammo", "uncommon", "tall", "#7c3aed", "#c4b5fd", "derp"),
  bbMade("Stompy Brick", "uncommon", "brick", "#b45309", "#fde68a", "grumpy", "legs"),
  bbMade("Sockrates", "uncommon", "sock", "#60a5fa", "#1e3a8a", "sleepy", "arms"),
  bbMade("Thunderpuff", "uncommon", "cloud", "#64748b", "#facc15", "grumpy", "arms"),
  bbMade("Wobblegum", "uncommon", "jelly", "#3b82f6", "#bfdbfe", "laugh", "arms"),
  bbMade("Eggsplorer", "uncommon", "egg", "#fde68a", "#16a34a", "wow", "antenna"),
  bbMade("Mug Thug", "uncommon", "mug", "#334155", "#fef3c7", "grumpy", "arms"),
  bbMade("Bellow", "uncommon", "bell", "#cbd5e1", "#475569", "wow"),
  bbMade("Spudnik", "uncommon", "bean", "#a16207", "#fde047", "cyclops", "antenna"),
  bbMade("Brinebo", "uncommon", "pickle", "#4d7c0f", "#a3e635", "derp", "legs"),
  bbMade("Dicer", "uncommon", "dice", "#dc2626", "#f8fafc", "grumpy", "arms"),
  bbMade("Leaflet", "uncommon", "leaf", "#f97316", "#7c2d12", "happy", "legs"),
  bbMade("Rocko Stomp", "uncommon", "rock", "#78716c", "#a3e635", "grumpy", "legs"),
  { name: "Hobbler", rarity: "rare", art: "hobbler", hp: 85, damage: 50, defense: 2.5 },
  { name: "Bon San", rarity: "rare", art: "bonsaiSmall", hp: 35, damage: 25, defense: 0, speed: "Very slow" },
  { name: "Ipop", rarity: "rare", art: "ipop", hp: 200, damage: 38, defense: 15 },
  bbMade("Cactula", "rare", "cactus", "#15803d", "#fb7185", "grumpy", "horns"),
  bbMade("Flamewick", "rare", "flame", "#3b82f6", "#bfdbfe", "wow"),
  bbMade("Crystalix", "rare", "crystal", "#a855f7", "#f3e8ff", "happy", "sparkle"),
  bbMade("Lampster", "rare", "lamp", "#f97316", "#7c2d12", "wink", "legs"),
  bbMade("Mushmallow", "rare", "mushroom", "#a855f7", "#fdf4ff", "sleepy"),
  bbMade("Kettlequake", "rare", "kettle", "#dc2626", "#7f1d1d", "grumpy", "arms"),
  bbMade("Tomeflap", "rare", "book", "#7c3aed", "#3b0764", "wow", "wings"),
  bbMade("Hexabolt", "rare", "hex", "#facc15", "#78350f", "cyclops", "antenna"),
  bbMade("Moonmoth", "rare", "moon", "#e0e7ff", "#a5b4fc", "sleepy", "wings"),
  bbMade("Donutron", "rare", "donut", "#78350f", "#f8fafc", "cyclops", "antenna"),
  bbMade("Balloonatic", "rare", "balloon", "#22c55e", "#e2e8f0", "derp"),
  bbMade("Toastinator", "rare", "toaster", "#64748b", "#ef4444", "grumpy", "arms"),
  bbMade("Brickstack", "rare", "brick", "#7f1d1d", "#fca5a5", "grumpy", "arms legs"),
  bbMade("Stormbell", "rare", "bell", "#334155", "#facc15", "wow", "sparkle"),
  bbMade("Cloudroar", "rare", "cloud", "#94a3b8", "#f8fafc", "grumpy", "horns"),
  bbMade("Goober", "rare", "blob", "#84cc16", "#365314", "laugh", "arms"),
  bbMade("Boulderbump", "rare", "rock", "#57534e", "#84cc16", "grumpy", "arms"),
  bbMade("Inkblot", "rare", "tall", "#1e293b", "#38bdf8", "wink", "arms"),
  bbMade("Sporelord", "rare", "mushroom", "#65a30d", "#ecfccb", "grumpy", "horns"),
  bbMade("Frostcube", "rare", "box", "#bae6fd", "#f0f9ff", "wow", "sparkle"),
  { name: "Tortor", rarity: "legendary", art: "turtleSmall", hp: 300, damage: 38, defense: 5, speed: "Slow" },
  { name: "Bonsala Bosa", rarity: "legendary", art: "bonsaiMedium", hp: 450, damage: 35, defense: 0, speed: "Very slow" },
  bbMade("Volcanug", "legendary", "rock", "#7f1d1d", "#f97316", "grumpy", "fire"),
  bbMade("Prismarch", "legendary", "crystal", "#ec4899", "#fef9c3", "wow", "horns sparkle"),
  bbMade("Thunderkettle", "legendary", "kettle", "#facc15", "#1e293b", "grumpy", "sparkle"),
  bbMade("Lunarbell", "legendary", "bell", "#e2e8f0", "#93c5fd", "sleepy", "wings"),
  bbMade("Mega Mug", "legendary", "mug", "#f59e0b", "#7c2d12", "laugh", "arms sparkle"),
  bbMade("Ancient Tome", "legendary", "book", "#78350f", "#fde68a", "cyclops", "wings sparkle"),
  bbMade("Blazecap", "legendary", "mushroom", "#ea580c", "#fef3c7", "grumpy", "fire"),
  bbMade("Stormcloud King", "legendary", "cloud", "#334155", "#facc15", "grumpy", "horns arms"),
  bbMade("Titan Brick", "legendary", "brick", "#991b1b", "#fecaca", "grumpy", "arms legs"),
  bbMade("Novaburst", "legendary", "star", "#fb923c", "#fef08a", "wow", "sparkle"),
  bbMade("Glacierbox", "legendary", "box", "#7dd3fc", "#f0f9ff", "grumpy", "arms legs"),
  bbMade("Hexatron", "legendary", "hex", "#64748b", "#22d3ee", "cyclops", "antenna arms legs"),
  bbMade("Spinemaster", "legendary", "cactus", "#166534", "#facc15", "grumpy", "horns sparkle"),
  bbMade("Gloomshroom", "legendary", "mushroom", "#4c1d95", "#ddd6fe", "sleepy", "sparkle"),
  bbMade("Ember Egg", "legendary", "egg", "#f97316", "#fde047", "wow", "fire"),
  { name: "Boonasoo Bosa", rarity: "heroic", art: "bonsaiLarge", hp: 500, damage: 40, defense: 0, speed: "Very slow" },
  { name: "Polygone", rarity: "heroic", art: "polygone", hp: 250, damage: 100, defense: 10 },
  { name: "Sheldon", rarity: "heroic", art: "sheldon", hp: 125, damage: 50, defense: 15, speed: "Slow" },
  bbMade("Infernalamp", "heroic", "lamp", "#dc2626", "#f97316", "grumpy", "aura fire"),
  bbMade("Cosmoon", "heroic", "moon", "#c4b5fd", "#7c3aed", "sleepy", "aura wings"),
  bbMade("Omnicube", "heroic", "box", "#0ea5e9", "#fde047", "cyclops", "aura antenna arms legs"),
  bbMade("Crystal Colossus", "heroic", "crystal", "#06b6d4", "#a5f3fc", "grumpy", "aura arms legs"),
  bbMade("Thunderhex", "heroic", "hex", "#facc15", "#38bdf8", "wow", "aura antenna sparkle"),
  bbMade("Solar Kettle", "heroic", "kettle", "#f59e0b", "#fef08a", "laugh", "aura sparkle"),
  bbMade("Eternal Tome", "heroic", "book", "#1e1b4b", "#a78bfa", "cyclops", "aura wings"),
  bbMade("Brickfang", "heroic", "brick", "#450a0a", "#ef4444", "grumpy", "aura horns"),
  bbMade("Voidblob", "heroic", "blob", "#1e1b4b", "#a855f7", "cyclops", "aura sparkle"),
  bbMade("Mythic Mug", "heroic", "mug", "#fde68a", "#f472b6", "happy", "aura wings")
];

const BB_CREATURES = `
Pupkin|common|quad|#d6a46a|#78350f|happy|ears
Whiskerdoo|common|quad|#fb923c|#fed7aa|wink|ears
Snoutle|common|quad|#f9a8d4|#f472b6|derp|roundears
Moomoo|common|quad|#f8fafc|#1c1917|sleepy|spots horns
Barkley|common|quad|#a16207|#fde68a|laugh|ears
Foxlet|common|quad|#ea580c|#fff7ed|wink|ears
Cubbo|common|quad|#78350f|#d6a46a|sleepy|roundears
Hopsy|common|bunny|#f8fafc|#f9a8d4|happy|
Thumper Jr|common|bunny|#a8a29e|#fecdd3|wow|
Croaky|common|frog|#4ade80|#fef08a|happy|
Ribbit Rick|common|frog|#65a30d|#d9f99d|derp|
Beetlebop|common|bug|#16a34a|#facc15|wow|
Ladybit|common|bug|#ef4444|#0b1220|happy|
Antsy|common|bug|#7c2d12|#451a03|grumpy|
Tweetie|common|bird|#facc15|#fde68a|happy|
Pigeonaut|common|bird|#94a3b8|#cbd5e1|derp|
Robbin|common|bird|#78350f|#f97316|wink|
Bubbles|common|fish|#f97316|#f8fafc|happy|
Finn|common|fish|#38bdf8|#1d4ed8|wow|
Guppo|common|fish|#a855f7|#f0abfc|sleepy|
Slinky|common|snake|#84cc16|#365314|wink|
Hissy|common|snake|#facc15|#78350f|grumpy|
Daisy Doo|common|flower|#f8fafc|#facc15|happy|
Rosalina|common|flower|#f43f5e|#fde047|wink|
Tulipop|common|flower|#f472b6|#fbbf24|sleepy|
Sunny Sprout|common|flower|#facc15|#78350f|laugh|
Snapjaw|common|flytrap|#84cc16|#ef4444|grumpy|
Twiggy|common|treant|#4ade80|#92400e|happy|
Mini Rex|common|trex|#4ade80|#bbf7d0|derp|
Dinoby|common|raptor|#a3e635|#4d7c0f|happy|
Kittycat|common|quad|#fde68a|#f59e0b|happy|ears
Woofer|common|quad|#e5e7eb|#6b7280|derp|ears
Piglet Pop|common|quad|#fecdd3|#fb7185|laugh|roundears
Molewort|common|quad|#57534e|#f9a8d4|sleepy|roundears
Squeaker|common|quad|#d4d4d8|#f9a8d4|wow|roundears
Chickpea|common|bird|#fef3c7|#ef4444|happy|
Duckling|common|bird|#fde047|#f97316|derp|
Clownie|common|fish|#f97316|#f8fafc|laugh|stripes
Cloverhop|common|frog|#22c55e|#f8fafc|wink|spots
Fernie|common|treant|#22c55e|#78350f|sleepy|
Foxfire|uncommon|quad|#f97316|#fde047|wink|ears fire
Bearbo|uncommon|quad|#92400e|#fde68a|grumpy|roundears
Wolfie|uncommon|quad|#6b7280|#e5e7eb|grumpy|ears
Pandoo|uncommon|quad|#f8fafc|#0b1220|sleepy|roundears spots
Stripey|uncommon|quad|#f8fafc|#0b1220|wow|stripes mane
Ponyo|uncommon|quad|#c08a4a|#78350f|happy|mane
Hoothoot|uncommon|bird|#a16207|#fde68a|wow|
Parrotto|uncommon|bird|#22c55e|#ef4444|laugh|
Flamingle|uncommon|bird|#f9a8d4|#ec4899|wink|
Pufferino|uncommon|fish|#fde047|#f97316|wow|spots
Sharky|uncommon|fish|#64748b|#f8fafc|grumpy|
Jellyfin|uncommon|fish|#a5f3fc|#f0abfc|sleepy|
Cobrazz|uncommon|snake|#a16207|#fde047|grumpy|
Toadley|uncommon|frog|#a16207|#fde68a|grumpy|spots
Stagbeetle|uncommon|bug|#451a03|#b45309|grumpy|horns
Bumblo|uncommon|bug|#facc15|#0b1220|happy|wings stripes
Fireflyx|uncommon|bug|#1e293b|#fde047|wow|wings sparkle
Sunflare|uncommon|flower|#f59e0b|#78350f|laugh|
Violetta|uncommon|flower|#8b5cf6|#fde047|sleepy|
Chompstalk|uncommon|flytrap|#65a30d|#dc2626|laugh|
Oakley|uncommon|treant|#16a34a|#78350f|grumpy|
Birchy|uncommon|treant|#86efac|#d6d3d1|happy|
Raptorella|uncommon|raptor|#f97316|#fde68a|wink|
Speedclaw|uncommon|raptor|#64748b|#cbd5e1|grumpy|
Trikey|uncommon|trike|#a3e635|#f97316|happy|
Stegosnore|uncommon|stego|#65a30d|#f97316|sleepy|
Pterri|uncommon|ptero|#fb923c|#fde68a|wow|
Little Neck|uncommon|longneck|#86efac|#16a34a|happy|
Rexy|uncommon|trex|#22c55e|#fef08a|laugh|
Bunnyboo|uncommon|bunny|#c4b5fd|#fbcfe8|wink|
Hareball|uncommon|bunny|#d6a46a|#fef3c7|derp|
Deerling|uncommon|quad|#b45309|#fde68a|happy|antlers
Grapehippo|uncommon|quad|#a78bfa|#ddd6fe|sleepy|roundears
Lionel|uncommon|quad|#f59e0b|#b45309|grumpy|mane
Rhinobump|uncommon|quad|#94a3b8|#e5e7eb|grumpy|horn
Elephantom|rare|quad|#94a3b8|#cbd5e1|sleepy|trunk roundears
Tigress|rare|quad|#f97316|#0b1220|grumpy|stripes ears
Unicornet|rare|quad|#f8fafc|#f0abfc|wow|horn mane sparkle
Moose Moss|rare|quad|#78350f|#a3e635|sleepy|antlers
Snow Leopardo|rare|quad|#e5e7eb|#64748b|wink|spots ears
Thunderhawk|rare|bird|#1e293b|#facc15|grumpy|sparkle
Phoenixlet|rare|bird|#f97316|#fde047|wow|fire
Penguinzo|rare|bird|#0f172a|#f8fafc|derp|
Anglerglow|rare|fish|#1e3a8a|#fde047|grumpy|antenna
Swordfin|rare|fish|#0ea5e9|#e0f2fe|wow|horn
Kingcobra|rare|snake|#451a03|#f59e0b|grumpy|horns
Glowsnake|rare|snake|#22d3ee|#a5f3fc|wow|sparkle
Poisondart|rare|frog|#2563eb|#0b1220|grumpy|spots
Mantisaur|rare|bug|#84cc16|#365314|grumpy|wings
Scorpix|rare|bug|#7c2d12|#f97316|grumpy|horns
Lotusine|rare|flower|#f9a8d4|#fef9c3|sleepy|sparkle
Thornrose|rare|flower|#be123c|#166534|grumpy|horns
Megajaw|rare|flytrap|#4d7c0f|#b91c1c|grumpy|
Willowisp|rare|treant|#a3e635|#57534e|sleepy|sparkle
Rex Junior|rare|trex|#15803d|#bbf7d0|grumpy|
Velociraptor Vic|rare|raptor|#a16207|#fef3c7|grumpy|
Triceratops Tom|rare|trike|#65a30d|#fde047|grumpy|
Spikeback|rare|stego|#4d7c0f|#dc2626|grumpy|
Longneck Larry|rare|longneck|#a3e635|#4d7c0f|happy|
Pteranodon Pete|rare|ptero|#ea580c|#fef3c7|laugh|
Clubtail|rare|stego|#78716c|#a8a29e|grumpy|horns
Gorillo|rare|quad|#374151|#9ca3af|grumpy|roundears
Bisonbash|rare|quad|#78350f|#451a03|grumpy|horns mane
Hopper Supreme|rare|bunny|#f8fafc|#ef4444|wow|sparkle
Crocodoodle|rare|quad|#4d7c0f|#a3e635|grumpy|spots
Mammothar|legendary|quad|#92400e|#f8fafc|grumpy|trunk roundears
Sabertooth Sal|legendary|quad|#f59e0b|#f8fafc|grumpy|ears horns
Griffinox|legendary|bird|#fde68a|#78350f|wow|sparkle
Thunderbird Max|legendary|bird|#1d4ed8|#facc15|grumpy|sparkle
Leviathan Jr|legendary|fish|#0f766e|#5eead4|grumpy|horns
Krakenpup|legendary|fish|#7c3aed|#f0abfc|derp|antenna
Basilisk|legendary|snake|#166534|#facc15|grumpy|horns fire
Hydra Hiss|legendary|snake|#6d28d9|#c4b5fd|grumpy|horns
Golden Frog|legendary|frog|#facc15|#fef9c3|wow|sparkle
Titan Beetle|legendary|bug|#0f172a|#22d3ee|grumpy|horns sparkle
Corpse Bloom|legendary|flower|#7f1d1d|#fde047|grumpy|
Venus Maximus|legendary|flytrap|#15803d|#ef4444|laugh|
Elder Oak|legendary|treant|#166534|#57534e|sleepy|
Tyrant Rex|legendary|trex|#166534|#fef08a|grumpy|
Spinosaurus Spin|legendary|trex|#0369a1|#f97316|grumpy|horns
Utahraptor Ula|legendary|raptor|#7c2d12|#fde68a|grumpy|
Brachio Bro|legendary|longneck|#65a30d|#bbf7d0|sleepy|
Torosaurus Tor|legendary|trike|#b45309|#f8fafc|grumpy|
Kentro Spike|legendary|stego|#365314|#facc15|grumpy|
Quetzal Queen|legendary|ptero|#0d9488|#fde047|wow|
Woolly Rhino|legendary|quad|#a16207|#f8fafc|grumpy|horn
Direwolf Dan|legendary|quad|#1f2937|#9ca3af|grumpy|ears
Lava Lizard|legendary|quad|#b91c1c|#f97316|grumpy|fire
Moonbunny|legendary|bunny|#e0e7ff|#a5b4fc|sleepy|wings
Crystal Stag|legendary|quad|#a5f3fc|#f0f9ff|wow|antlers sparkle
Mega Mammoth|heroic|quad|#78350f|#fef3c7|grumpy|trunk roundears aura
Thunder Lion|heroic|quad|#facc15|#1d4ed8|grumpy|mane aura sparkle
Celestial Unicorn|heroic|quad|#f8fafc|#a855f7|wow|horn mane aura
Phoenix King|heroic|bird|#dc2626|#fde047|grumpy|fire aura
Storm Roc|heroic|bird|#334155|#38bdf8|grumpy|aura sparkle
Abyss Leviathan|heroic|fish|#0f172a|#22d3ee|grumpy|horns aura
World Serpent|heroic|snake|#14532d|#a3e635|grumpy|horns aura
Emperor Frog|heroic|frog|#7c3aed|#fde047|laugh|aura sparkle
Scarab Pharaoh|heroic|bug|#ca8a04|#1e3a8a|grumpy|horns aura
Bloom Titan|heroic|flower|#ec4899|#fef08a|happy|aura sparkle
Devourer Trap|heroic|flytrap|#052e16|#dc2626|grumpy|aura
World Tree|heroic|treant|#15803d|#78350f|sleepy|aura sparkle
Rex Omega|heroic|trex|#7f1d1d|#f97316|grumpy|horns aura
Giganotosaur Gigi|heroic|trex|#57534e|#fde68a|grumpy|aura
Indominus|heroic|raptor|#f8fafc|#ef4444|grumpy|aura
Supersaurus|heroic|longneck|#0e7490|#a5f3fc|sleepy|aura
Titanotrike|heroic|trike|#92400e|#fef08a|grumpy|horns aura
Stegolith|heroic|stego|#44403c|#fb923c|grumpy|aura fire
Sky Tyrant|heroic|ptero|#312e81|#f472b6|grumpy|aura sparkle
Dragon Rex|heroic|trex|#b91c1c|#facc15|grumpy|wings fire aura
`.trim().split("\n").map((line) => {
  const [name, rarity, plan, a, b, face, extras] = line.split("|");
  return bbMade(name, rarity, plan, a, b, face, extras);
});

BB_CATALOG.push(...BB_CREATURES);

const BB_CHARACTER_HEIGHT = 2.1;
const BB_RIDE_MIN_SIZE = 1.5;
const BB_MAX_SIZE = 3;

const BB_PLAN_SIZE = {
  bug: 0.42, fish: 0.6, frog: 0.5, bunny: 0.62, bird: 0.6, snake: 0.85, flower: 0.72,
  quad: 1, flytrap: 1.05, treant: 1.55, raptor: 1.25, trike: 1.75, stego: 1.75,
  ptero: 1.4, trex: 2, longneck: 2.35
};

const BB_RARITY_SIZE = { common: 0.8, uncommon: 0.95, rare: 1.1, legendary: 1.25, heroic: 1.4 };

const BB_NAMED_SIZES = {
  Polygone: 3, Snob: 0.5, LOL: 0.62, Snavier: 0.95, Hipoin: 1.15, Hobbler: 1.35, Boosoo: 0.4,
  "Bon San": 0.55, Ipop: 1.05, Tortor: 1.6, "Bonsala Bosa": 1.25, "Boonasoo Bosa": 2.2, Sheldon: 1.85
};

const BB_ART_MODELS = {
  snob: { template: "blob", a: "#a3e635", b: "#65a30d", face: "wink", extras: ["spots"] },
  lol: { template: "popsicle", a: "#fb923c", b: "#fde047", face: "laugh", extras: [] },
  ipop: { template: "popsicle", a: "#f472b6", b: "#fbcfe8", face: "happy", extras: [] },
  snavier: { template: "snavier", a: "#0d9488", b: "#5eead4", face: "happy", extras: [] },
  hippo: { template: "quad", a: "#94a3b8", b: "#cbd5e1", face: "sleepy", extras: ["roundears"] },
  hobbler: { template: "quad", a: "#fde047", b: "#b45309", face: "happy", extras: ["roundears", "spots"] },
  sprout: { template: "sprout", a: "#4ade80", b: "#b45309", face: "happy", extras: [] },
  bonsaiSmall: { template: "bonsai", a: "#22c55e", b: "#92400e", face: "none", extras: [] },
  bonsaiMedium: { template: "bonsai", a: "#22c55e", b: "#92400e", face: "none", extras: [] },
  bonsaiLarge: { template: "bonsai", a: "#22c55e", b: "#92400e", face: "none", extras: ["blossom"] },
  turtleSmall: { template: "turtle", a: "#4d7c0f", b: "#84cc16", face: "happy", extras: [] },
  sheldon: { template: "turtle", a: "#3b82f6", b: "#84cc16", face: "happy", extras: ["orbs"] },
  polygone: { template: "polygone", a: "#ef4444", b: "#facc15", face: "none", extras: [] }
};

function bbModelSpec(def) {
  if (typeof def.art === "string") return BB_ART_MODELS[def.art] || BB_ART_MODELS.snob;
  return def.art;
}

function bbDerivedSize(def) {
  if (BB_NAMED_SIZES[def.name]) return BB_NAMED_SIZES[def.name];
  const spec = bbModelSpec(def);
  const rand = bbSeededRandom(`${def.name}:size`);
  const base = BB_PLAN_SIZE[spec.template] || (spec.template === "tall" ? 0.9 : 0.72);
  const size = base * BB_RARITY_SIZE[def.rarity] * (0.8 + rand() * 0.4);
  return Math.max(0.3, Math.min(BB_MAX_SIZE - 0.1, size));
}

{
  const used = new Set();
  BB_CATALOG.forEach((def) => {
    const start = Math.round(bbDerivedSize(def) * 1000);
    let size = start;
    for (let step = 1; used.has(size) && def.name !== "Polygone"; step += 1) {
      size = start + (step % 2 ? 1 : -1) * Math.ceil(step / 2);
      if (size < 300 || size >= BB_MAX_SIZE * 1000) size = start;
    }
    used.add(size);
    def.size = size / 1000;
  });
}

function bbIsRideable(def) {
  return def.size >= BB_RIDE_MIN_SIZE;
}

function bbFootRadius(def) {
  return Math.max(0.35, Math.min(2.2, def.size * BB_CHARACTER_HEIGHT * 0.3));
}

if (typeof module !== "undefined") {
  module.exports = { BB_CATALOG, bbArtSvg, bbModelSpec, bbIsRideable, bbFootRadius, BB_CHARACTER_HEIGHT, BB_RIDE_MIN_SIZE };
}
