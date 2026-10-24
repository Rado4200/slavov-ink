/**
 * Ink atmosphere v2: generator core.
 *
 * Pure, seeded and deterministic (no Math.random, no DOM, no Node APIs), so the
 * CLI (scripts/generate-backdrop.mjs) and the /dev/backdrop playground produce
 * identical art from the same seed. Units are tile pixels, y pointing down.
 *
 * Art direction: hand-inked flash sheets and calligraphy practice sheets on
 * black. One coherent nib angle, scale hierarchy (few big, many small),
 * asymmetric clusters and voids, dry-brush texture, edge-weighted placement.
 */

/* ------------------------------------------------------------------------ */
/* Random                                                                    */
/* ------------------------------------------------------------------------ */

/** mulberry32: tiny seeded PRNG returning floats in [0, 1). */
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over the joined parts: stable sub-seeds per route/section/variant. */
export function hashSeed(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const range = (rng, min, max) => min + (max - min) * rng();
const chance = (rng, p) => rng() < p;
const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

function gaussian(rng) {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Power-law sample in [min, max], skewed toward min (many small, few big). */
function powerLaw(rng, min, max, exponent = 2.4) {
  return min + (max - min) * rng() ** exponent;
}

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

const smoothstep = (x) => {
  const c = clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
};

/** Smooth 1D value noise in [-1, 1] over x in [0, 1]. */
function noise1d(rng, cells) {
  const lattice = Array.from({ length: cells + 1 }, () => rng() * 2 - 1);
  return (x) => {
    const xf = clamp(x, 0, 1) * cells;
    const i = Math.min(cells - 1, Math.floor(xf));
    const s = smoothstep(xf - i);
    return lattice[i] * (1 - s) + lattice[i + 1] * s;
  };
}

/** Multi-octave 1D noise (multi-scale edge roughness). */
function fbm1d(rng, cells, octaves) {
  const layers = Array.from({ length: octaves }, (_, o) => noise1d(rng, cells * 2 ** o));
  const norm = layers.reduce((sum, _, o) => sum + 0.5 ** o, 0);
  return (x) => layers.reduce((sum, n, o) => sum + n(x) * 0.5 ** o, 0) / norm;
}

/** Smooth 2D value noise in [0, 1] (clusters and voids). */
function noise2d(rng, cols, rows) {
  const grid = Array.from({ length: (cols + 1) * (rows + 1) }, () => rng());
  const at = (i, j) => grid[j * (cols + 1) + i];
  return (x, y) => {
    const fx = clamp(x, 0, 1) * cols;
    const fy = clamp(y, 0, 1) * rows;
    const i = Math.min(cols - 1, Math.floor(fx));
    const j = Math.min(rows - 1, Math.floor(fy));
    const sx = smoothstep(fx - i);
    const sy = smoothstep(fy - j);
    const top = at(i, j) * (1 - sx) + at(i + 1, j) * sx;
    const bottom = at(i, j + 1) * (1 - sx) + at(i + 1, j + 1) * sx;
    return top * (1 - sy) + bottom * sy;
  };
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                  */
/* ------------------------------------------------------------------------ */

const fmt = (n) => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};

function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    return out;
  };
  const lower = build(pts);
  const upper = build([...pts].reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/** Dense polyline through a chain of cubic segments [[p0,c1,c2,p3], ...]. */
function cubicChain(segments, perSegment = 48) {
  const out = [];
  segments.forEach((seg, k) => {
    for (let i = k === 0 ? 0 : 1; i <= perSegment; i++)
      out.push(cubicPoint(...seg, i / perSegment));
  });
  return out;
}

/** Resamples a polyline at (roughly) even arc-length spacing. */
function resample(points, spacing) {
  const out = [points[0]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (seg === 0) continue;
    let pos = spacing - carry;
    while (pos <= seg) {
      const t = pos / seg;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      pos += spacing;
    }
    carry = seg - (pos - spacing);
  }
  const last = points[points.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > spacing * 0.3) out.push(last);
  return out;
}

/** Rotates (radians), mirrors, scales and translates template points. */
function transform(points, { angle = 0, mirror = false, scale = 1, x = 0, y = 0 }) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return points.map(([px, py]) => {
    const mx = (mirror ? -px : px) * scale;
    const my = py * scale;
    return [x + mx * c - my * s, y + mx * s + my * c];
  });
}

function bboxOf(polygons) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of polygons) {
    for (const [px, py] of poly) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
  }
  return { minX, minY, maxX, maxY };
}

export function polygonsToPath(polygons) {
  let d = "";
  for (const poly of polygons) {
    if (poly.length < 3) continue;
    d += "M" + poly.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L") + "Z";
  }
  return d;
}

/** Ellipse as two arcs; rotation in radians. */
function ellipsePath(cx, cy, rx, ry, rotation) {
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  const p = (dx, dy) => `${fmt(cx + dx * c - dy * s)} ${fmt(cy + dx * s + dy * c)}`;
  const deg = fmt((rotation * 180) / Math.PI);
  return `M${p(rx, 0)}A${fmt(rx)} ${fmt(ry)} ${deg} 0 1 ${p(-rx, 0)}A${fmt(rx)} ${fmt(ry)} ${deg} 0 1 ${p(rx, 0)}Z`;
}

/* ------------------------------------------------------------------------ */
/* Broad-nib sweep with dry-brush bristles                                    */
/* ------------------------------------------------------------------------ */

/**
 * Sweeps a flat nib at a fixed angle along a centerline. Width therefore comes
 * from the direction of travel relative to the nib (thick when perpendicular,
 * hairline when parallel). The nib is split into bristle bands, each with its
 * own ink supply that runs out along the stroke, giving streaks, small gaps
 * and a dry lift-off; the outer edges get multi-scale roughness.
 *
 * spec: { centerline, nibWidth, thickness, bristles, dryness (0..1),
 *         start: "pool"|"taper"|"blunt", startTaper,
 *         end: "taper"|"dry"|"blunt", endTaper, roughness }
 */
export function sweepStroke(rng, spec, nibAngleDeg) {
  const W = spec.nibWidth;
  const pts = resample(spec.centerline, clamp(W * 0.12, 1.1, 3.2));
  const n = pts.length;
  if (n < 2) return [];

  const theta = (nibAngleDeg * Math.PI) / 180;
  const u = [Math.cos(theta), -Math.sin(theta)];
  const v = [-u[1], u[0]];
  const h = spec.thickness / 2;
  const rough = spec.roughness ?? 0.05;

  const widthNoise = fbm1d(rng, 8, 2);
  const edgeA = fbm1d(rng, 18, 3);
  const edgeB = fbm1d(rng, 18, 3);

  // Bristle bands across the nib, with uneven boundaries.
  const B = spec.bristles;
  const cuts = [-1];
  for (let k = 1; k < B; k++) cuts.push(-1 + (2 * k) / B + range(rng, -0.35, 0.35) / B);
  cuts.push(1);
  const bands = Array.from({ length: B }, (_, j) => {
    const outer = B > 2 && (j === 0 || j === B - 1);
    return {
      from: cuts[j],
      to: cuts[j + 1],
      // Outer bristles carry less ink, so edges fray and break first.
      capacity: outer ? range(rng, 0.45, 0.9) : range(rng, 0.8, 1.35),
      rate: spec.dryness * range(rng, 0.7, 1.9),
      ink: fbm1d(rng, 22, 2),
      gaps: fbm1d(rng, 24, 2),
      gapThreshold: 0.62 - spec.dryness * range(rng, 0.05, 0.2),
    };
  });

  const nibs = pts.map((p, i) => {
    const s = i / (n - 1);
    let start = 1;
    if (spec.start === "pool") start = 1 + 0.2 * Math.exp(-s / 0.03);
    else if (spec.start === "taper") start = smoothstep(s / spec.startTaper);
    let end = 1;
    if (spec.end === "taper") end = smoothstep((1 - s) / spec.endTaper);
    else if (spec.end === "dry")
      end = 1 - 0.3 * smoothstep((s - (1 - spec.endTaper)) / spec.endTaper);
    const pressure = Math.max(0.04, start * end) * (1 + 0.14 * widthNoise(s));
    return {
      p,
      half: (W / 2) * pressure,
      ea: edgeA(s) * W * rough * 2,
      eb: edgeB(s) * W * rough * 2,
    };
  });

  const corners = (nib, from, to) => {
    const a = from * nib.half - (from <= -0.999 ? nib.eb : 0);
    const b = to * nib.half + (to >= 0.999 ? nib.ea : 0);
    const pt = (off, w) => [nib.p[0] + u[0] * off + v[0] * w, nib.p[1] + u[1] * off + v[1] * w];
    return [pt(a, -h), pt(a, h), pt(b, -h), pt(b, h)];
  };

  const polygons = [];
  for (let i = 1; i < n; i++) {
    const s = i / (n - 1);
    for (const band of bands) {
      const supply = band.capacity - s * band.rate + 0.4 * band.ink(s);
      if (supply <= 0) continue;
      // Gaps get likelier toward the end of the stroke (the brush runs dry).
      if (band.gaps(s) > band.gapThreshold - 0.35 * s * spec.dryness) continue;
      // A starving bristle thins, opening streaks along the stroke direction.
      const thin = supply < 0.45 ? ((0.45 - supply) / 0.45) * 0.55 : 0;
      const mid = (band.from + band.to) / 2;
      const half = ((band.to - band.from) / 2) * (1 - thin);
      const from = thin > 0 ? mid - half : band.from;
      const to = thin > 0 ? mid + half : band.to;
      polygons.push(convexHull([...corners(nibs[i - 1], from, to), ...corners(nibs[i], from, to)]));
    }
  }

  if (spec.start === "pool") {
    // Ink pooling where the nib lands: a soft lozenge along the nib edge.
    const p0 = pts[0];
    const rx = (W / 2) * 1.12;
    const ry = Math.max(h * 2.2, W * 0.16);
    polygons.push(
      Array.from({ length: 14 }, (_, k) => {
        const a = (k / 14) * Math.PI * 2;
        const r = 1 + 0.08 * Math.sin(a * 3);
        return [
          p0[0] + u[0] * Math.cos(a) * rx * r + v[0] * Math.sin(a) * ry,
          p0[1] + u[1] * Math.cos(a) * rx * r + v[1] * Math.sin(a) * ry,
        ];
      }),
    );
  }
  return polygons;
}

/* ------------------------------------------------------------------------ */
/* Stroke families (sizes in CSS px, multiplied by the tile scale)           */
/* ------------------------------------------------------------------------ */

export const FAMILIES = ["long", "bundle", "medium", "short", "hook"];

/** (a) Long straight diagonal entering from an edge or corner, clipped by it. */
function longDiagonal(rng, tile) {
  const diag = Math.hypot(tile.width, tile.height);
  const length = range(rng, 0.6, 0.95) * diag;
  const angle = (range(rng, 18, 62) * Math.PI) / 180;
  const fromLeft = chance(rng, 0.5);
  const goingDown = chance(rng, 0.5);
  const x0 = fromLeft ? -range(rng, 10, 80) : tile.width + range(rng, 10, 80);
  const y0 = goingDown
    ? range(rng, -0.25, 0.55) * tile.height
    : range(rng, 0.45, 1.25) * tile.height;
  const dir = [Math.cos(angle) * (fromLeft ? 1 : -1), Math.sin(angle) * (goingDown ? 1 : -1)];
  const normal = [-dir[1], dir[0]];
  const bow = range(rng, -0.04, 0.04) * length;
  const centerline = Array.from({ length: 64 }, (_, i) => {
    const t = i / 63;
    const b = bow * 4 * t * (1 - t);
    return [x0 + dir[0] * length * t + normal[0] * b, y0 + dir[1] * length * t + normal[1] * b];
  });
  const W = range(rng, 14, 30) * tile.scale;
  return [
    {
      family: "long",
      centerline,
      nibWidth: W,
      thickness: Math.max(1, W * 0.05),
      bristles: 24,
      dryness: range(rng, 0.45, 0.9),
      start: "blunt",
      end: "dry",
      endTaper: 0.3,
      roughness: 0.05,
    },
  ];
}

/** (b) Bundle of 2-5 parallel hairlines (moving along the nib = hairline). */
function hairlineBundle(rng, tile, at, nibAngle) {
  const count = 2 + Math.floor(rng() * 4);
  const theta = ((nibAngle + range(rng, -3, 3)) * Math.PI) / 180;
  const dir = [Math.cos(theta), -Math.sin(theta)];
  const normal = [-dir[1], dir[0]];
  const base = range(rng, 140, 460) * tile.scale;
  let offset = 0;
  return Array.from({ length: count }, () => {
    offset += range(rng, 5, 14) * tile.scale;
    const length = base * range(rng, 0.55, 1.05);
    const shift = range(rng, -0.12, 0.12) * base;
    const start = [
      at[0] + normal[0] * offset + dir[0] * shift,
      at[1] + normal[1] * offset + dir[1] * shift,
    ];
    const wobble = noise1d(rng, 4);
    const centerline = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      const w = wobble(t) * 1.5 * tile.scale;
      return [
        start[0] + dir[0] * length * t + normal[0] * w,
        start[1] + dir[1] * length * t + normal[1] * w,
      ];
    });
    const W = range(rng, 8, 14) * tile.scale;
    return {
      family: "bundle",
      centerline,
      nibWidth: W,
      thickness: range(rng, 0.9, 1.7) * tile.scale,
      bristles: 2,
      dryness: range(rng, 0.2, 0.6),
      start: "blunt",
      end: chance(rng, 0.6) ? "taper" : "dry",
      endTaper: 0.25,
      roughness: 0.02,
    };
  });
}

/** (c) Medium arcs and S-curves. */
function medium(rng, tile, at) {
  const size = powerLaw(rng, 120, 380, 1.8) * tile.scale;
  const j = () => range(rng, -0.18, 0.18);
  const template = chance(rng, 0.5)
    ? [
        [
          [-0.5, 0.35],
          [-0.4 + j(), -0.45 + j()],
          [0.35 + j(), -0.5 + j()],
          [0.5, 0.15 + j()],
        ],
      ]
    : [
        [
          [-0.5, 0],
          [-0.3 + j(), -0.45 + j()],
          [-0.05 + j(), -0.3],
          [0, j()],
        ],
        [
          [0, 0],
          [0.05 + j(), 0.35],
          [0.3 + j(), 0.45 + j()],
          [0.5, 0.05 + j()],
        ],
      ];
  const centerline = transform(cubicChain(template), {
    angle: range(rng, 0, Math.PI * 2),
    mirror: chance(rng, 0.5),
    scale: size,
    x: at[0],
    y: at[1],
  });
  const W = powerLaw(rng, 16, 36, 1.6) * tile.scale;
  return [
    {
      family: "medium",
      centerline,
      nibWidth: W,
      thickness: Math.max(0.9, W * 0.05),
      bristles: 20,
      dryness: range(rng, 0.25, 0.75),
      start: chance(rng, 0.6) ? "pool" : "taper",
      startTaper: 0.12,
      end: chance(rng, 0.55) ? "dry" : "taper",
      endTaper: range(rng, 0.2, 0.4),
      roughness: 0.055,
    },
  ];
}

/** (d) Short flicks and ticks. */
function short(rng, tile, at) {
  const size = powerLaw(rng, 18, 90, 1.7) * tile.scale;
  const bend = range(rng, -0.35, 0.35);
  const template = [
    [
      [0, 0],
      [0.35, bend * 0.5],
      [0.7, bend],
      [1, bend * 0.4 + range(rng, -0.2, 0.2)],
    ],
  ];
  const centerline = transform(cubicChain(template, 24), {
    angle: range(rng, 0, Math.PI * 2),
    mirror: chance(rng, 0.5),
    scale: size,
    x: at[0],
    y: at[1],
  });
  const W = powerLaw(rng, 6, 16, 1.5) * tile.scale;
  return [
    {
      family: "short",
      centerline,
      nibWidth: W,
      thickness: Math.max(0.8, W * 0.06),
      bristles: 9,
      dryness: range(rng, 0.2, 0.7),
      start: chance(rng, 0.5) ? "pool" : "blunt",
      end: "taper",
      endTaper: range(rng, 0.35, 0.6),
      roughness: 0.05,
    },
  ];
}

/**
 * (e) Hook with blackletter terminals: a lozenge head (short move across the
 * nib), a thick downstroke, a curl, and a diamond foot like the logo letters.
 */
function hook(rng, tile, at) {
  const size = powerLaw(rng, 60, 200, 1.6) * tile.scale;
  const curl = range(rng, 0.25, 0.45);
  const template = [
    [
      [-0.12, -0.5],
      [-0.06, -0.47],
      [0, -0.44],
      [0.02, -0.4],
    ],
    [
      [0.02, -0.4],
      [0, -0.1],
      [-0.02, 0.15],
      [0.05, 0.32],
    ],
    [
      [0.05, 0.32],
      [0.12, 0.45],
      [curl, 0.5],
      [curl + 0.08, 0.4],
    ],
    [
      [curl + 0.08, 0.4],
      [curl + 0.12, 0.44],
      [curl + 0.16, 0.5],
      [curl + 0.2, 0.55],
    ],
  ];
  const centerline = transform(cubicChain(template, 20), {
    angle: range(rng, -0.25, 0.25),
    mirror: chance(rng, 0.35),
    scale: size,
    x: at[0],
    y: at[1],
  });
  const W = range(rng, 14, 28) * tile.scale;
  return [
    {
      family: "hook",
      centerline,
      nibWidth: W,
      thickness: Math.max(0.9, W * 0.05),
      bristles: 16,
      dryness: range(rng, 0.2, 0.55),
      start: "blunt",
      end: "blunt",
      roughness: 0.05,
    },
  ];
}

/* ------------------------------------------------------------------------ */
/* Spatter                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * A flicked-brush spatter cluster: 30-90 droplets whose density decays from
 * the impact point along the fling direction. Radii follow a power law
 * (0.6-5 px, rarely up to 9, never above 10); ~15% are elongated with a tail.
 */
function spatterCluster(rng, tile, impact, fling) {
  const count = 30 + Math.floor(rng() * 61);
  const spread = range(rng, 40, 140) * tile.scale;
  const droplets = [];
  for (let i = 0; i < count; i++) {
    const along = -Math.log(Math.max(rng(), 1e-6)) * spread * 0.55;
    const angle = fling + gaussian(rng) * range(rng, 0.25, 0.6);
    const x = impact[0] + Math.cos(angle) * along;
    const y = impact[1] + Math.sin(angle) * along;
    const near = Math.exp(-along / spread);
    let r = 0.6 + 4.4 * rng() ** 3.2 * (0.45 + 0.55 * near);
    if (chance(rng, 0.03)) r = range(rng, 5, 9);
    r = Math.min(r, 10) * tile.scale;
    if (chance(rng, 0.15)) {
      const stretch = range(rng, 1.6, 3);
      const tail = r * range(rng, 2, 4);
      const bx = x - Math.cos(angle) * (r * stretch + tail);
      const by = y - Math.sin(angle) * (r * stretch + tail);
      const nx = -Math.sin(angle) * r * 0.45;
      const ny = Math.cos(angle) * r * 0.45;
      const d =
        ellipsePath(x, y, r * stretch, r, angle) +
        `M${fmt(x + nx)} ${fmt(y + ny)}L${fmt(bx)} ${fmt(by)}L${fmt(x - nx)} ${fmt(y - ny)}Z`;
      droplets.push({ d, x });
    } else {
      droplets.push({ d: ellipsePath(x, y, r, r * range(rng, 0.8, 1), rng() * Math.PI), x });
    }
  }
  return droplets;
}

/* ------------------------------------------------------------------------ */
/* Composition                                                               */
/* ------------------------------------------------------------------------ */

/** violet-deep is drawn into the royal layer at 29% (identical over ink). */
const VIOLET_IN_ROYAL = 0.29;

/** Elements per ~100vh tile on desktop; mobile uses MOBILE_DENSITY of it. */
export const DENSITY = {
  long: [3, 5],
  bundle: [2, 3],
  medium: [8, 12],
  short: [14, 22],
  hook: [2, 4],
  clusters: [8, 14],
  specks: [40, 80],
};
export const MOBILE_DENSITY = 0.45;

/** Opacity hierarchy by depth. */
const DEPTH = { far: [0.05, 0.1], mid: [0.1, 0.2], near: [0.18, 0.32] };

/** Opacity caps where art overlaps the content column (body text stays >= 4.5:1). */
export const SAFE_CAPS = { bone: 0.09, "royal-light": 0.22, royal: 0.35 };

/** Absolute caps per layer (white never above 0.32 for strokes). */
const MAX_ALPHA = { bone: 0.32, "royal-light": 0.4, royal: 0.6 };

export const DEFAULTS = { nibAngle: 40, density: 1 };

/**
 * Tiles: desktop 1600x1000 (cover-fit on landscape screens), mobile 720x1560
 * (portrait). `scale` = tile px per design px (element size multiplier);
 * `safe` = the content column [from, to] as fractions of the width.
 */
export const TILES = {
  desktop: { width: 1600, height: 1000, scale: 1600 / 1440, safe: [0.24, 0.76], edgePower: 1.5 },
  // Mobile elements use the desktop px scale, so they appear ~60% as large on a phone.
  mobile: { width: 720, height: 1560, scale: 1600 / 1440, safe: [0.05, 0.95], edgePower: 0.8 },
};

function pickColor(rng) {
  return weighted(rng, [
    ["bone", 0.65],
    ["royal", 0.2],
    ["royal-light", 0.1],
    ["violet", 0.05],
  ]);
}

const DEPTH_MIX = {
  long: [
    ["far", 0.7],
    ["mid", 0.3],
  ],
  bundle: [
    ["far", 0.45],
    ["mid", 0.55],
  ],
  medium: [
    ["far", 0.3],
    ["mid", 0.45],
    ["near", 0.25],
  ],
  short: [
    ["far", 0.2],
    ["mid", 0.4],
    ["near", 0.4],
  ],
  hook: [
    ["mid", 0.5],
    ["near", 0.5],
  ],
};

const pickAlpha = (rng, family) => range(rng, ...DEPTH[weighted(rng, DEPTH_MIX[family])]);

/**
 * Builds one tile: { width, height, safe, elements }, where each element is
 * { layer: "bone"|"royal-light"|"royal", alpha, d, family }.
 *
 * options: { variant: "desktop"|"mobile", nibAngle, density, families: Set }
 */
export function composeTile(seed, options = {}) {
  const variant = options.variant ?? "desktop";
  const tile = TILES[variant];
  const nibAngle = options.nibAngle ?? DEFAULTS.nibAngle;
  const families = options.families ?? new Set([...FAMILIES, "spatter"]);
  const densityScale =
    (options.density ?? DEFAULTS.density) * (variant === "mobile" ? MOBILE_DENSITY : 1);
  const rng = createRng(seed);
  const count = (key) => {
    const [min, max] = DENSITY[key];
    return Math.max(0, Math.round(range(rng, min, max) * densityScale));
  };

  // Placement field: edge-weighted, with low-frequency clusters and voids.
  const field = noise2d(rng, 4, 4);
  const weightAt = (x, y) => {
    const fx = x / tile.width;
    const edge = clamp(Math.abs(fx - 0.5) * 2, 0, 1) ** tile.edgePower;
    const cluster = smoothstep((field(fx, y / tile.height) - 0.25) / 0.6);
    return (0.06 + 0.94 * edge) * (0.12 + 0.88 * cluster);
  };
  const placed = [];
  const placePoint = (minDist) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const p = [rng() * tile.width, rng() * tile.height];
      if (rng() > weightAt(p[0], p[1])) continue;
      if (placed.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < minDist)) continue;
      placed.push(p);
      return p;
    }
    const p = [rng() * tile.width, rng() * tile.height];
    placed.push(p);
    return p;
  };

  const strokes = [];
  const add = (specs, family) => {
    const color = family === "long" ? (chance(rng, 0.8) ? "bone" : "violet") : pickColor(rng);
    const alpha = pickAlpha(rng, family);
    for (const spec of specs) strokes.push({ spec, color, alpha });
  };
  const s = tile.scale;
  if (families.has("long"))
    for (let i = count("long"); i > 0; i--) add(longDiagonal(rng, tile), "long");
  if (families.has("bundle")) {
    for (let i = count("bundle"); i > 0; i--)
      add(hairlineBundle(rng, tile, placePoint(220 * s), nibAngle), "bundle");
  }
  if (families.has("medium"))
    for (let i = count("medium"); i > 0; i--) add(medium(rng, tile, placePoint(110 * s)), "medium");
  if (families.has("hook"))
    for (let i = count("hook"); i > 0; i--) add(hook(rng, tile, placePoint(120 * s)), "hook");
  if (families.has("short"))
    for (let i = count("short"); i > 0; i--) add(short(rng, tile, placePoint(40 * s)), "short");

  const [safeFrom, safeTo] = [tile.safe[0] * tile.width, tile.safe[1] * tile.width];
  const elements = [];
  const push = (layer, alpha, d, minX, maxX, family) => {
    const cap = maxX > safeFrom && minX < safeTo ? SAFE_CAPS[layer] : 1;
    const value = Math.min(alpha, cap, MAX_ALPHA[layer]);
    elements.push({ layer, alpha: Math.round(value * 1000) / 1000, d, family });
    return value;
  };

  // Sweep strokes. A few large white strokes get the logo's offset violet echo.
  let echoes = 3;
  const strokeEnds = [];
  for (const { spec, color, alpha } of strokes) {
    const polygons = sweepStroke(rng, spec, nibAngle);
    if (polygons.length === 0) continue;
    const box = bboxOf(polygons);
    const big = spec.family === "long" || (spec.family === "medium" && spec.nibWidth > 26 * s);
    const wantsEcho = color === "bone" && big && echoes > 0 && chance(rng, 0.6);
    const echoIndex = elements.length;
    if (wantsEcho) elements.push(null); // reserve: the echo is painted behind its stroke
    const d = polygonsToPath(polygons);
    let painted;
    if (color === "violet") {
      // Violet reads darker than bone at equal alpha; boost it, except quiet long diagonals.
      const boost = spec.family === "long" ? 1.2 : 2.2;
      painted = push(
        "royal",
        Math.min(1, alpha * boost) * VIOLET_IN_ROYAL,
        d,
        box.minX,
        box.maxX,
        spec.family,
      );
    } else {
      painted = push(color, alpha, d, box.minX, box.maxX, spec.family);
    }
    if (wantsEcho) {
      // The logo's offset violet echo, as strong as the stroke it shadows (never stronger).
      echoes--;
      const off = range(rng, 6, 14) * s;
      const echo = polygons.map((poly) => poly.map(([x, y]) => [x + off, y + off * 0.8]));
      const echoAlpha = Math.round(Math.min(1, painted * 1.8) * VIOLET_IN_ROYAL * 1000) / 1000;
      elements[echoIndex] = {
        layer: "royal",
        alpha: echoAlpha,
        d: polygonsToPath(echo),
        family: "echo",
      };
    }
    if (spec.family !== "long" && spec.family !== "bundle") {
      const line = spec.centerline;
      const a = line[line.length - 2];
      const b = line[line.length - 1];
      strokeEnds.push({ at: b, dir: Math.atan2(b[1] - a[1], b[0] - a[0]) });
    }
  }

  if (families.has("spatter")) {
    // Droplets merge into one path per (color, opacity) bucket.
    const buckets = new Map();
    const drop = (layer, alpha, droplet) => {
      const inSafe = droplet.x > safeFrom && droplet.x < safeTo;
      const value = inSafe ? Math.min(alpha, SAFE_CAPS[layer]) : alpha;
      const key = `${layer}|${value}`;
      buckets.set(key, (buckets.get(key) ?? "") + droplet.d);
    };
    const opacities = [0.15, 0.25, 0.4, 0.6];
    for (let i = count("clusters"); i > 0; i--) {
      let impact;
      let fling;
      if (strokeEnds.length > 0 && chance(rng, 0.55)) {
        const end = strokeEnds[Math.floor(rng() * strokeEnds.length)];
        impact = end.at;
        fling = end.dir + gaussian(rng) * 0.3;
      } else {
        impact = placePoint(160 * s);
        fling = range(rng, 0, Math.PI * 2);
      }
      const layer = chance(rng, 0.15) ? (chance(rng, 0.5) ? "royal" : "royal-light") : "bone";
      for (const droplet of spatterCluster(rng, tile, impact, fling)) {
        drop(layer, opacities[Math.floor(rng() ** 1.4 * opacities.length)], droplet);
      }
    }
    for (let i = count("specks"); i > 0; i--) {
      const at = placePoint(12 * s);
      const r = range(rng, 0.5, 1.6) * s;
      const layer = chance(rng, 0.85) ? "bone" : "royal-light";
      drop(layer, opacities[Math.floor(rng() * 3)], {
        d: ellipsePath(at[0], at[1], r, r, 0),
        x: at[0],
      });
    }
    for (const [key, d] of buckets) {
      const [layer, alpha] = key.split("|");
      elements.push({ layer, alpha: Number(alpha), d, family: "spatter" });
    }
  }

  return { width: tile.width, height: tile.height, safe: tile.safe, elements };
}

export const LAYERS = ["royal", "royal-light", "bone"];

/** One SVG per color layer (white fill: only alpha matters for the masks). */
export function tileLayersToSvg(tile) {
  const bodies = Object.fromEntries(LAYERS.map((layer) => [layer, ""]));
  for (const el of tile.elements) {
    bodies[el.layer] += `<path fill="#fff" fill-opacity="${el.alpha}" d="${el.d}"/>`;
  }
  const wrap = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile.width}" height="${tile.height}" viewBox="0 0 ${tile.width} ${tile.height}">${body}</svg>`;
  return Object.fromEntries(
    LAYERS.map((layer) => [layer, bodies[layer] ? wrap(bodies[layer]) : null]),
  );
}

/* ------------------------------------------------------------------------ */
/* Lightning                                                                 */
/* ------------------------------------------------------------------------ */

function displace(rng, a, b, depth, roughness) {
  if (depth === 0) return [a];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  const offset = (rng() - 0.5) * len * roughness;
  const m = [(a[0] + b[0]) / 2 + nx * offset, (a[1] + b[1]) / 2 + ny * offset];
  return [
    ...displace(rng, a, m, depth - 1, roughness),
    ...displace(rng, m, b, depth - 1, roughness),
  ];
}

const bolt = (rng, a, b, depth, roughness) => [...displace(rng, a, b, depth, roughness), b];

/**
 * A branching bolt descending from the top edge (midpoint displacement, 1-3
 * forks). Coordinates use a 1000-unit height; `length` is its share of the
 * viewport height (0.3-0.75).
 */
export function generateBolt(rng, style) {
  const H = 1000;
  const main = bolt(rng, [range(rng, 180, 260), 0], [range(rng, 80, 340), H], 7, 0.34);
  const heading = (points, index) => {
    const a = points[Math.max(0, index - 4)];
    const b = points[Math.min(points.length - 1, index + 4)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };
  const forks = [];
  const forkCount = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < forkCount; i++) {
    const index = Math.floor(main.length * range(rng, 0.2, 0.65));
    const start = main[index];
    const side = i % 2 === 0 ? 1 : -1;
    const angle = heading(main, index) + side * range(rng, 0.35, 0.8);
    const length = H * range(rng, 0.18, 0.38);
    const end = [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length];
    const fork = bolt(rng, start, end, 5, 0.42);
    forks.push(fork);
    if (chance(rng, 0.4)) {
      const k = Math.floor(fork.length * range(rng, 0.35, 0.6));
      const a2 = heading(fork, k) - side * range(rng, 0.3, 0.6);
      const l2 = length * range(rng, 0.3, 0.45);
      const p = fork[k];
      forks.push(bolt(rng, p, [p[0] + Math.cos(a2) * l2, p[1] + Math.sin(a2) * l2], 4, 0.45));
    }
  }
  const { minX, maxX } = bboxOf([main, ...forks]);
  const pad = 30;
  const line = (points) =>
    "M" + points.map(([x, y]) => `${Math.round(x - minX + pad)} ${Math.round(y)}`).join("L");
  return {
    style,
    width: Math.ceil(maxX - minX + pad * 2),
    height: H,
    length: Math.round(range(rng, 0.3, 0.75) * 100) / 100,
    main: line(main),
    forks: forks.map(line).join(""),
  };
}

/** Layer stacks per bolt style: bone-white core, royal-light surround (no blur). */
export const BOLT_STYLES = {
  hairline: [
    { part: "all", width: 6, color: "royal-light", opacity: 0.14 },
    { part: "main", width: 1.2, color: "bone", opacity: 0.9 },
    { part: "forks", width: 0.75, color: "bone", opacity: 0.65 },
  ],
  bold: [
    { part: "all", width: 22, color: "royal-light", opacity: 0.05 },
    { part: "all", width: 9, color: "royal-light", opacity: 0.13 },
    { part: "all", width: 3.5, color: "bone", opacity: 0.22 },
    { part: "main", width: 2, color: "bone", opacity: 0.95 },
    { part: "forks", width: 1.2, color: "bone", opacity: 0.8 },
  ],
};

/** 8 bolts by default, mixing hairline and bold. */
export function generateStorm(seed, count = 8) {
  const rng = createRng(seed);
  const bolts = Array.from({ length: count }, (_, i) =>
    generateBolt(createRng(Math.floor(rng() * 2 ** 32)), i % 3 === 1 ? "bold" : "hairline"),
  );
  return { styles: BOLT_STYLES, bolts };
}

/* ------------------------------------------------------------------------ */
/* Samples (contact sheet, playground)                                       */
/* ------------------------------------------------------------------------ */

/** One family sample centered in a cell; returns a path in cell coordinates. */
export function familySample(seed, family, cell, nibAngle = DEFAULTS.nibAngle) {
  const rng = createRng(seed);
  const tile = { width: cell.width, height: cell.height, scale: 1 };
  const center = [cell.width / 2, cell.height / 2];
  const specs = {
    long: () => longDiagonal(rng, tile),
    bundle: () => hairlineBundle(rng, tile, [cell.width * 0.2, cell.height * 0.75], nibAngle),
    medium: () => medium(rng, tile, center),
    short: () => short(rng, tile, [cell.width * 0.4, cell.height * 0.5]),
    hook: () => hook(rng, tile, center),
  }[family]();
  return specs.map((spec) => polygonsToPath(sweepStroke(rng, spec, nibAngle))).join("");
}

/** One spatter cluster thrown from the left of a cell toward the right. */
export function spatterSample(seed, cell) {
  const rng = createRng(seed);
  const tile = { width: cell.width, height: cell.height, scale: 1 };
  const fling = range(rng, -0.5, 0.5);
  return spatterCluster(rng, tile, [cell.width * 0.22, cell.height * 0.5], fling)
    .map((droplet) => droplet.d)
    .join("");
}
