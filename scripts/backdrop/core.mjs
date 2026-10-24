/**
 * Ink atmosphere v3: generator core.
 *
 * Pure, seeded and deterministic (no Math.random, no DOM, no Node APIs), so the
 * CLI (scripts/generate-backdrop.mjs) and the /dev/backdrop playground produce
 * identical art from the same seed. Units are tile pixels, y pointing down.
 *
 * Art direction: calligraphy practice sheets on black, clean and confident.
 * One 40° nib (thick/thin by direction), few strokes with real clearance
 * between them (at most one deliberate crossing), fine dust instead of
 * splashes, edge-weighted placement with voids.
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
const intRange = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

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

function fbm1d(rng, cells, octaves) {
  const layers = Array.from({ length: octaves }, (_, o) => noise1d(rng, cells * 2 ** o));
  const norm = layers.reduce((sum, _, o) => sum + 0.5 ** o, 0);
  return (x) => layers.reduce((sum, n, o) => sum + n(x) * 0.5 ** o, 0) / norm;
}

/** Smooth 2D value noise in [-1, 1]. */
function noise2d(rng, cols, rows) {
  const grid = Array.from({ length: (cols + 1) * (rows + 1) }, () => rng() * 2 - 1);
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

function cubicChain(segments, perSegment = 48) {
  const out = [];
  segments.forEach((seg, k) => {
    for (let i = k === 0 ? 0 : 1; i <= perSegment; i++)
      out.push(cubicPoint(...seg, i / perSegment));
  });
  return out;
}

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

function transform(points, { angle = 0, mirror = false, scale = 1, x = 0, y = 0 }) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return points.map(([px, py]) => {
    const mx = (mirror ? -px : px) * scale;
    const my = py * scale;
    return [x + mx * c - my * s, y + mx * s + my * c];
  });
}

export function polygonsToPath(polygons) {
  let d = "";
  for (const poly of polygons) {
    if (poly.length < 3) continue;
    d += "M" + poly.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L") + "Z";
  }
  return d;
}

function ellipsePath(cx, cy, rx, ry, rotation) {
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  const p = (dx, dy) => `${fmt(cx + dx * c - dy * s)} ${fmt(cy + dx * s + dy * c)}`;
  const deg = fmt((rotation * 180) / Math.PI);
  return `M${p(rx, 0)}A${fmt(rx)} ${fmt(ry)} ${deg} 0 1 ${p(-rx, 0)}A${fmt(rx)} ${fmt(ry)} ${deg} 0 1 ${p(rx, 0)}Z`;
}

/* ------------------------------------------------------------------------ */
/* Broad-nib sweep (subtle dry brush, crisp edges)                            */
/* ------------------------------------------------------------------------ */

/**
 * Sweeps a flat nib at one fixed angle along a centerline: width follows the
 * direction of travel (thick across the nib, hairline along it). 6-14 bristle
 * bands give a subtle dry-brush lift-off; edges stay crisp.
 *
 * spec: { centerline, nibWidth, thickness, bristles, dryness (0..1),
 *         start: "pool"|"taper"|"blunt", startTaper, end: "taper"|"dry"|"blunt", endTaper }
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
  const rough = 0.018;
  const pressureVar = spec.pressureVar ?? 0.08;
  const widthNoise = fbm1d(rng, 6, 2);
  const edgeA = fbm1d(rng, 10, 2);
  const edgeB = fbm1d(rng, 10, 2);

  const B = clamp(spec.bristles, 6, 14);
  const cuts = [-1];
  for (let k = 1; k < B; k++) cuts.push(-1 + (2 * k) / B + range(rng, -0.25, 0.25) / B);
  cuts.push(1);
  const bands = Array.from({ length: B }, (_, j) => ({
    from: cuts[j],
    to: cuts[j + 1],
    capacity: range(rng, 0.85, 1.3),
    rate: spec.dryness * range(rng, 0.6, 1.4),
    ink: fbm1d(rng, 14, 2),
  }));

  const nibs = pts.map((p, i) => {
    const s = i / (n - 1);
    let start = 1;
    if (spec.start === "pool") start = 1 + 0.15 * Math.exp(-s / 0.03);
    else if (spec.start === "taper") start = smoothstep(s / spec.startTaper);
    let end = 1;
    if (spec.end === "taper") end = smoothstep((1 - s) / spec.endTaper);
    else if (spec.end === "dry")
      end = 1 - 0.25 * smoothstep((s - (1 - spec.endTaper)) / spec.endTaper);
    const pressure = Math.max(0.04, start * end) * (1 + pressureVar * widthNoise(s));
    return { p, half: (W / 2) * pressure, ea: edgeA(s) * W * rough, eb: edgeB(s) * W * rough };
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
      const supply = band.capacity - s * band.rate + 0.25 * band.ink(s);
      if (supply <= 0) continue;
      polygons.push(
        convexHull([
          ...corners(nibs[i - 1], band.from, band.to),
          ...corners(nibs[i], band.from, band.to),
        ]),
      );
    }
  }
  return polygons;
}

/* ------------------------------------------------------------------------ */
/* Tiles, palette, opacity                                                   */
/* ------------------------------------------------------------------------ */

/**
 * desktop 1600x1000 (landscape screens), mobile 720x1560 (portrait).
 * cssPx = CSS px per tile px at the reference viewport (1440 / 390 wide).
 * safe = content column [from, to] (fraction of width): per-pixel alpha is
 * clamped there at render time (see clampSafeZone) so body text keeps contrast.
 */
export const TILES = {
  desktop: { width: 1600, height: 1000, cssPx: 1440 / 1600, safe: [0.24, 0.76], edgePower: 1.4 },
  // Phones: text spans the full width, so the whole tile is the content column.
  mobile: { width: 720, height: 1560, cssPx: 390 / 720, safe: [0, 1], edgePower: 0.8 },
};

/**
 * Max alpha inside the content column, per layer (strokes and dust alike).
 * Budget for silver body text at 4.5:1 during a lightning strike: background
 * value <= ~89/255. The bolt behind body text keeps 25% (min allowed shield
 * floor, ~63), leaving ~26 for art + dust: bone 0.05 each. Purple layers are
 * far darker, so they keep more.
 */
export const SAFE_CAPS = { bone: 0.05, "royal-light": 0.12, royal: 0.3 };

/** Strokes per ~100vh tile (desktop); phones use PHONE_SHARE. Bundles count as one. */
export const DENSITY = { long: [2, 3], bundle: [1, 2], medium: [3, 5], short: [4, 8] };
export const PHONE_SHARE = 0.55;

/** Minimum clearance between strokes, as a fraction of tile width. */
export const CLEARANCE = 0.05;

export const FAMILIES = ["long", "bundle", "medium", "short"];

export const DEFAULTS = { nibAngle: 40, density: 1, particleDensity: 1, particleSize: 1 };

const DEPTH = { far: [0.05, 0.1], mid: [0.1, 0.2], near: [0.18, 0.32], hero: [0.24, 0.4] };
const DEPTH_MIX = {
  long: [["hero", 1]],
  bundle: [
    ["far", 0.5],
    ["mid", 0.5],
  ],
  medium: [
    ["far", 0.25],
    ["mid", 0.45],
    ["near", 0.3],
  ],
  short: [
    ["mid", 0.5],
    ["near", 0.5],
  ],
};
const MAX_ALPHA = { bone: 0.32, "royal-light": 0.4, royal: 0.6 };
/** violet-deep is drawn into the royal layer at 29% (identical over ink). */
const VIOLET_IN_ROYAL = 0.29;

function pickColor(rng) {
  return weighted(rng, [
    ["bone", 0.65],
    ["royal", 0.18],
    ["royal-light", 0.12],
    ["violet", 0.05],
  ]);
}

/* ------------------------------------------------------------------------ */
/* Stroke families (sizes in CSS px at the reference viewport)               */
/* ------------------------------------------------------------------------ */

const px = (tile, cssPixels) => cssPixels / tile.cssPx;

function longDiagonal(rng, tile) {
  const diag = Math.hypot(tile.width, tile.height);
  const length = range(rng, 0.62, 0.9) * diag;
  const angle = (range(rng, 18, 62) * Math.PI) / 180;
  const fromLeft = chance(rng, 0.5);
  const goingDown = chance(rng, 0.5);
  const x0 = fromLeft ? -range(rng, 10, 60) : tile.width + range(rng, 10, 60);
  const y0 = goingDown ? range(rng, -0.2, 0.45) * tile.height : range(rng, 0.55, 1.2) * tile.height;
  const dir = [Math.cos(angle) * (fromLeft ? 1 : -1), Math.sin(angle) * (goingDown ? 1 : -1)];
  const normal = [-dir[1], dir[0]];
  const bow = range(rng, -0.05, 0.05) * length;
  const centerline = Array.from({ length: 64 }, (_, i) => {
    const t = i / 63;
    const b = bow * 4 * t * (1 - t);
    return [x0 + dir[0] * length * t + normal[0] * b, y0 + dir[1] * length * t + normal[1] * b];
  });
  const W = px(tile, range(rng, 14, 26));
  return {
    family: "long",
    lines: [
      {
        centerline,
        nibWidth: W,
        thickness: Math.max(1, W * 0.05),
        bristles: 12,
        dryness: range(rng, 0.35, 0.6),
        pressureVar: 0.28,
        start: "taper",
        startTaper: 0.12,
        end: "dry",
        endTaper: 0.35,
      },
    ],
  };
}

function hairlineBundle(rng, tile, at, nibAngle) {
  const count = intRange(rng, 2, 3);
  const theta = ((nibAngle + range(rng, -3, 3)) * Math.PI) / 180;
  const dir = [Math.cos(theta), -Math.sin(theta)];
  const normal = [-dir[1], dir[0]];
  const base = px(tile, range(rng, 140, 380));
  let offset = 0;
  const lines = Array.from({ length: count }, (_, i) => {
    if (i > 0) offset += px(tile, range(rng, 10, 18));
    const length = base * range(rng, 0.65, 1);
    const shift = range(rng, -0.1, 0.1) * base;
    const start = [
      at[0] + normal[0] * offset + dir[0] * shift,
      at[1] + normal[1] * offset + dir[1] * shift,
    ];
    const centerline = Array.from({ length: 24 }, (_, k) => {
      const t = k / 23;
      return [start[0] + dir[0] * length * t, start[1] + dir[1] * length * t];
    });
    const W = px(tile, range(rng, 8, 12));
    return {
      centerline,
      nibWidth: W,
      thickness: px(tile, range(rng, 0.9, 1.4)),
      bristles: 6,
      dryness: range(rng, 0.1, 0.3),
      start: "blunt",
      end: "taper",
      endTaper: 0.25,
    };
  });
  return { family: "bundle", lines };
}

function medium(rng, tile, at) {
  const size = px(tile, range(rng, 140, 340));
  const j = () => range(rng, -0.15, 0.15);
  const template = chance(rng, 0.55)
    ? [
        [
          [-0.5, 0.3],
          [-0.4 + j(), -0.4 + j()],
          [0.35 + j(), -0.45 + j()],
          [0.5, 0.15 + j()],
        ],
      ]
    : [
        [
          [-0.5, 0],
          [-0.3 + j(), -0.4 + j()],
          [-0.05 + j(), -0.3],
          [0, j()],
        ],
        [
          [0, 0],
          [0.05 + j(), 0.3],
          [0.3 + j(), 0.4 + j()],
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
  const W = px(tile, range(rng, 18, 34));
  return {
    family: "medium",
    lines: [
      {
        centerline,
        nibWidth: W,
        thickness: Math.max(0.9, W * 0.05),
        bristles: 10,
        dryness: range(rng, 0.15, 0.4),
        start: chance(rng, 0.6) ? "pool" : "taper",
        startTaper: 0.1,
        end: chance(rng, 0.5) ? "dry" : "taper",
        endTaper: range(rng, 0.2, 0.35),
      },
    ],
  };
}

function short(rng, tile, at) {
  const size = px(tile, range(rng, 24, 80));
  const bend = range(rng, -0.3, 0.3);
  const template = [
    [
      [0, 0],
      [0.35, bend * 0.5],
      [0.7, bend],
      [1, bend * 0.4],
    ],
  ];
  const centerline = transform(cubicChain(template, 24), {
    angle: range(rng, 0, Math.PI * 2),
    mirror: chance(rng, 0.5),
    scale: size,
    x: at[0],
    y: at[1],
  });
  const W = px(tile, range(rng, 7, 15));
  return {
    family: "short",
    lines: [
      {
        centerline,
        nibWidth: W,
        thickness: Math.max(0.8, W * 0.06),
        bristles: 6,
        dryness: range(rng, 0.1, 0.35),
        start: chance(rng, 0.5) ? "pool" : "blunt",
        end: "taper",
        endTaper: range(rng, 0.35, 0.55),
      },
    ],
  };
}

/* ------------------------------------------------------------------------ */
/* Clearance (overlap rule)                                                  */
/* ------------------------------------------------------------------------ */

function collider(element) {
  const samples = [];
  let r = 0;
  for (const line of element.lines) {
    samples.push(...resample(line.centerline, 8));
    r = Math.max(r, line.nibWidth * 0.6);
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of samples) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { samples, r, box: { minX: minX - r, minY: minY - r, maxX: maxX + r, maxY: maxY + r } };
}

/** Edge-to-edge distance between two strokes (<= 0 means they overlap). */
function clearanceBetween(a, b) {
  const gap = Math.max(
    a.box.minX - b.box.maxX,
    b.box.minX - a.box.maxX,
    a.box.minY - b.box.maxY,
    b.box.minY - a.box.maxY,
  );
  if (gap > 400) return gap;
  let best = Infinity;
  for (const p of a.samples) {
    for (const q of b.samples) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
      if (d < best) best = d;
    }
  }
  return Math.sqrt(best) - a.r - b.r;
}

const crossingAllowed = (a, b) =>
  (a.family === "long" && b.family === "medium") || (a.family === "medium" && b.family === "long");

/* ------------------------------------------------------------------------ */
/* Tile composition                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Builds one section tile. Returns
 *   { width, height, safe, elements: [{ layer, alpha, d, family }],
 *     heroes: [{ layer, alpha, d, angle, start, end }]  (only when options.hero),
 *     stats: { counts, minClearance, crossings, balance, attempts } }
 * The composition is re-rolled (new sub-seed) until the overlap rule and the
 * per-family counts hold.
 *
 * options: { variant, nibAngle, density, families: Set, hero }
 */
export function composeTile(seed, options = {}) {
  const variant = options.variant ?? "desktop";
  const tile = TILES[variant];
  const nibAngle = options.nibAngle ?? DEFAULTS.nibAngle;
  const families = options.families ?? new Set(FAMILIES);
  const share = (options.density ?? DEFAULTS.density) * (variant === "mobile" ? PHONE_SHARE : 1);
  const minClear = CLEARANCE * tile.width;

  let best = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = tryCompose(hashSeed(seed, "attempt", attempt), tile, {
      nibAngle,
      families,
      share,
      minClear,
      hero: options.hero ?? false,
    });
    result.stats.attempts = attempt + 1;
    if (result.valid) return finish(result, tile);
    if (!best || result.score > best.score) best = result;
  }
  return finish(best, tile);
}

function tryCompose(seed, tile, { nibAngle, families, share, minClear, hero }) {
  const rng = createRng(seed);
  const target = (key) => {
    const [min, max] = DENSITY[key];
    return families.has(key)
      ? Math.max(share < 1 ? 1 : min, Math.round(range(rng, min, max) * share))
      : 0;
  };
  const field = noise2d(rng, 3, 3);
  const weightAt = (x, y) => {
    const fx = x / tile.width;
    const edge = clamp(Math.abs(fx - 0.5) * 2, 0, 1) ** tile.edgePower;
    const voids = smoothstep((field(fx, y / tile.height) + 0.35) / 0.9);
    return (0.08 + 0.92 * edge) * (0.15 + 0.85 * voids);
  };
  const randomPoint = () => {
    for (let i = 0; i < 40; i++) {
      const p = [range(rng, 0.03, 0.97) * tile.width, range(rng, 0.06, 0.94) * tile.height];
      if (rng() < weightAt(p[0], p[1])) return p;
    }
    return [range(rng, 0.05, 0.95) * tile.width, range(rng, 0.08, 0.92) * tile.height];
  };

  const placed = [];
  let crossings = 0;
  let minClearance = Infinity;
  const tryPlace = (make) => {
    for (let i = 0; i < 60; i++) {
      const element = make();
      const col = collider(element);
      let cross = 0;
      let ok = true;
      let nearest = Infinity;
      for (const other of placed) {
        const c = clearanceBetween(col, other.col);
        if (c >= minClear) {
          nearest = Math.min(nearest, c);
          continue;
        }
        if (c <= 0 && crossingAllowed(element, other) && crossings + cross === 0) {
          cross++;
          continue;
        }
        ok = false;
        break;
      }
      if (!ok) continue;
      crossings += cross;
      minClearance = Math.min(minClearance, nearest);
      placed.push({
        ...element,
        col,
        color: element.family === "long" ? (chance(rng, 0.8) ? "bone" : "violet") : pickColor(rng),
        alpha: range(rng, ...DEPTH[weighted(rng, DEPTH_MIX[element.family])]),
      });
      return true;
    }
    return false;
  };

  const want = {
    long: target("long"),
    bundle: target("bundle"),
    medium: target("medium"),
    short: target("short"),
  };
  const counts = { long: 0, bundle: 0, medium: 0, short: 0 };
  for (let i = 0; i < want.long; i++) if (tryPlace(() => longDiagonal(rng, tile))) counts.long++;
  for (let i = 0; i < want.medium; i++)
    if (tryPlace(() => medium(rng, tile, randomPoint()))) counts.medium++;
  for (let i = 0; i < want.bundle; i++)
    if (tryPlace(() => hairlineBundle(rng, tile, randomPoint(), nibAngle))) counts.bundle++;
  for (let i = 0; i < want.short; i++)
    if (tryPlace(() => short(rng, tile, randomPoint()))) counts.short++;

  const valid = FAMILIES.every(
    (f) =>
      counts[f] >=
      Math.min(want[f], f === "long" || f === "bundle" ? want[f] : Math.max(1, want[f] - 1)),
  );

  // Balance: ink mass left vs right of center and top vs bottom.
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  for (const el of placed) {
    const mass = el.lines.reduce((sum, l) => sum + l.centerline.length * l.nibWidth, 0) * el.alpha;
    const cx = (el.col.box.minX + el.col.box.maxX) / 2;
    const cy = (el.col.box.minY + el.col.box.maxY) / 2;
    if (cx < tile.width / 2) left += mass;
    else right += mass;
    if (cy < tile.height / 2) top += mass;
    else bottom += mass;
  }
  const balance =
    1 -
    (Math.abs(left - right) / (left + right || 1) + Math.abs(top - bottom) / (top + bottom || 1)) /
      2;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const wantTotal = Object.values(want).reduce((a, b) => a + b, 0);
  return {
    valid,
    rng,
    placed,
    nibAngle,
    hero,
    score: total / (wantTotal || 1),
    stats: {
      counts,
      want,
      minClearance: Number.isFinite(minClearance) ? minClearance : tile.width,
      crossings,
      balance,
    },
  };
}

function finish(result, tile) {
  const { rng, placed, nibAngle, hero } = result;
  const elements = [];
  const heroes = [];
  let echoes = 2;
  for (const el of placed) {
    const polygons = el.lines.flatMap((line) => sweepStroke(rng, line, nibAngle));
    const d = polygonsToPath(polygons);
    const layer = el.color === "violet" ? "royal" : el.color;
    const cap = el.family === "long" ? 0.4 : MAX_ALPHA[layer];
    let alpha = Math.min(el.alpha, cap);
    if (el.color === "violet") alpha = Math.min(1, el.alpha * 2) * VIOLET_IN_ROYAL;
    alpha = Math.round(alpha * 1000) / 1000;
    if (hero && el.family === "long") {
      const line = el.lines[0].centerline;
      const a = line[0];
      const b = line[line.length - 1];
      heroes.push({
        layer,
        alpha,
        d,
        angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
        start: a,
        end: b,
      });
      continue;
    }
    if (
      el.family === "medium" &&
      el.color === "bone" &&
      echoes > 0 &&
      el.lines[0].nibWidth > px(tile, 24)
    ) {
      // The logo's offset violet echo, never stronger than its stroke.
      echoes--;
      const off = px(tile, range(rng, 6, 14));
      const echo = polygons.map((poly) => poly.map(([x, y]) => [x + off, y + off * 0.8]));
      elements.push({
        layer: "royal",
        alpha: Math.round(Math.min(1, alpha * 1.8) * VIOLET_IN_ROYAL * 1000) / 1000,
        d: polygonsToPath(echo),
        family: "echo",
      });
    }
    elements.push({ layer, alpha, d, family: el.family });
  }
  return {
    width: tile.width,
    height: tile.height,
    safe: tile.safe,
    elements,
    heroes,
    stats: result.stats,
  };
}

/** 0-100 score per composition: clearance 40%, balance 30%, density 30%. */
export function scoreTile(tile) {
  const { counts, want, minClearance, balance } = tile.stats;
  const minClear = CLEARANCE * tile.width;
  const clearance = clamp(minClearance / (minClear * 2.5), 0, 1);
  const density =
    FAMILIES.reduce((sum, f) => {
      const [min, max] = DENSITY[f];
      const mid = (min + max) / 2;
      return sum + (want[f] === 0 ? 1 : 1 - clamp(Math.abs(counts[f] - mid) / mid, 0, 1));
    }, 0) / FAMILIES.length;
  return {
    clearance: Math.round(clearance * 100),
    balance: Math.round(balance * 100),
    density: Math.round(density * 100),
    total: Math.round((0.4 * clearance + 0.3 * balance + 0.3 * density) * 100),
  };
}

/* ------------------------------------------------------------------------ */
/* Dust (particles)                                                          */
/* ------------------------------------------------------------------------ */

export const DUST = {
  desktop: { count: [140, 220], minDistanceCss: 28 },
  mobile: { count: [60, 100], minDistanceCss: 28 },
  opacities: [
    [0.12, 0.3],
    [0.2, 0.28],
    [0.3, 0.2],
    [0.45, 0.14],
    [0.7, 0.08],
  ],
};

export const DUST_LAYERS = ["far-royal", "far-bone", "near-royal-light", "near-bone"];

/**
 * Fine dust over the whole page: Poisson-disc (blue noise) acceptance,
 * modulated +-40% by smooth noise, so it is everywhere but never a grid.
 * Radii 0.4-2.4 px (95%) up to 4 px (5%); ~10% slightly elongated.
 * 65% bone, 35% purple. Two depth layers. One path per (layer, opacity).
 * Returns { width, height, layers: { [layer]: [{ alpha, d }] }, count }.
 */
export function composeDust(seed, options = {}) {
  const variant = options.variant ?? "desktop";
  const tile = TILES[variant];
  const cfg = DUST[variant];
  const rng = createRng(seed);
  const target = Math.round(
    range(rng, ...cfg.count) * (options.density ?? DEFAULTS.particleDensity),
  );
  const size = options.size ?? DEFAULTS.particleSize;
  const minD = px(tile, cfg.minDistanceCss);
  const field = noise2d(rng, 5, 5);
  const points = [];
  const cell = minD;
  const grid = new Map();
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  const near = (x, y) => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const p of grid.get(`${cx + i},${cy + j}`) ?? []) {
          if ((p[0] - x) ** 2 + (p[1] - y) ** 2 < minD * minD) return true;
        }
      }
    }
    return false;
  };
  for (let tries = 0; points.length < target && tries < target * 60; tries++) {
    const x = rng() * tile.width;
    const y = range(rng, 0.004, 0.996) * tile.height;
    const density = 1 + 0.4 * field(x / tile.width, y / tile.height);
    if (rng() > density / 1.4) continue;
    if (near(x, y)) continue;
    points.push([x, y]);
    const k = key(x, y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push([x, y]);
  }

  const buckets = new Map();
  for (const [x, y] of points) {
    const depth = chance(rng, 0.45) ? "near" : "far";
    const purple = chance(rng, 0.35);
    const layer = purple ? (depth === "near" ? "near-royal-light" : "far-royal") : `${depth}-bone`;
    let r = chance(rng, 0.05) ? range(rng, 2.4, 4) : 0.4 + 2 * rng() ** 2.2;
    if (depth === "near") r *= 1.12;
    r = px(tile, r * size);
    const alpha = weighted(rng, DUST.opacities);
    const elongated = chance(rng, 0.1);
    const d = elongated
      ? ellipsePath(x, y, r * range(rng, 1.5, 2.2), r * 0.7, range(rng, 0, Math.PI))
      : ellipsePath(x, y, r, r, 0);
    const k = `${layer}|${alpha}`;
    buckets.set(k, (buckets.get(k) ?? "") + d);
  }
  const layers = Object.fromEntries(DUST_LAYERS.map((l) => [l, []]));
  for (const [k, d] of buckets) {
    const [layer, alpha] = k.split("|");
    layers[layer].push({ alpha: Number(alpha), d });
  }
  return { width: tile.width, height: tile.height, safe: tile.safe, layers, count: points.length };
}

/* ------------------------------------------------------------------------ */
/* Contact tile                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Behind the glass contact panel: 2 bold strokes with violet echo that pass
 * under the panel edges, plus a dust band along those edges, so the glass
 * visibly refracts something. Kept below the heading (top 30% stays empty).
 * Returns { width, height, elements: [{ layer, alpha, d }] }.
 */
export function composeContactTile(seed, options = {}) {
  const variant = options.variant ?? "desktop";
  const tile = TILES[variant];
  const nibAngle = options.nibAngle ?? DEFAULTS.nibAngle;
  const rng = createRng(seed);
  const edges = variant === "desktop" ? [0.27, 0.73] : [0.04, 0.96];
  const elements = [];
  edges.forEach((edge, i) => {
    const side = i === 0 ? -1 : 1;
    const x0 = (edge + side * range(rng, 0.06, 0.1)) * tile.width;
    const x1 = (edge - side * range(rng, 0.08, 0.14)) * tile.width;
    const y0 = range(rng, 0.34, 0.42) * tile.height;
    const y1 = range(rng, 0.9, 1.02) * tile.height;
    const centerline = cubicChain([
      [
        [x0, y0],
        [x0 + side * px(tile, 90), y0 + (y1 - y0) * 0.35],
        [x1 - side * px(tile, 60), y0 + (y1 - y0) * 0.65],
        [x1, y1],
      ],
    ]);
    const W = px(tile, range(rng, 34, 44));
    const polygons = sweepStroke(
      rng,
      {
        centerline,
        nibWidth: W,
        thickness: W * 0.05,
        bristles: 12,
        dryness: 0.3,
        start: "pool",
        end: "dry",
        endTaper: 0.3,
      },
      nibAngle,
    );
    const off = px(tile, range(rng, 8, 14));
    elements.push({
      layer: "royal",
      alpha: 0.45,
      d: polygonsToPath(polygons.map((p) => p.map(([x, y]) => [x + off, y + off * 0.8]))),
    });
    elements.push({ layer: "bone", alpha: 0.3, d: polygonsToPath(polygons) });
  });
  // Dust band along both panel edges.
  let band = { bone: "", "royal-light": "" };
  const count = variant === "desktop" ? 90 : 50;
  for (let k = 0; k < count; k++) {
    const edge = edges[k % 2];
    const x = (edge + (rng() - 0.5) * 0.12) * tile.width;
    const y = range(rng, 0.32, 0.98) * tile.height;
    const r = px(tile, 0.5 + 2 * rng() ** 2);
    const layer = chance(rng, 0.7) ? "bone" : "royal-light";
    band = { ...band, [layer]: band[layer] + ellipsePath(x, y, r, r, 0) };
  }
  elements.push({ layer: "bone", alpha: 0.45, d: band.bone });
  elements.push({ layer: "royal-light", alpha: 0.5, d: band["royal-light"] });
  return { width: tile.width, height: tile.height, elements: elements.filter((e) => e.d) };
}

/* ------------------------------------------------------------------------ */
/* Rendering helpers                                                         */
/* ------------------------------------------------------------------------ */

/** One SVG for a list of { alpha, d } (white fill; only alpha matters for masks). */
export function pathsToSvg(width, height, paths) {
  const body = paths
    .map((p) => `<path fill="#fff" fill-opacity="${p.alpha}" d="${p.d}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

export const LAYERS = ["royal", "royal-light", "bone"];

/**
 * Clamps alpha (0-255, one byte per pixel) inside the content column so body
 * text keeps WCAG contrast; ramps over 10% of the width at the column edges.
 */
export function clampSafeZone(alpha, width, height, safe, cap) {
  const capByte = Math.round(cap * 255);
  const ramp = 0.1 * width;
  const [from, to] = [safe[0] * width, safe[1] * width];
  for (let x = 0; x < width; x++) {
    const inside = Math.min(x - from, to - x);
    if (inside <= -ramp) continue;
    const t = clamp((inside + ramp) / ramp, 0, 1);
    const limit = Math.round(255 - (255 - capByte) * smoothstep(t));
    for (let y = 0, i = x; y < height; y++, i += width) if (alpha[i] > limit) alpha[i] = limit;
  }
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
 * forks). 1000-unit height; `length` = share of the viewport height (0.55-1).
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
  const forkCount = intRange(rng, 1, 3);
  for (let i = 0; i < forkCount; i++) {
    const index = Math.floor(main.length * range(rng, 0.2, 0.65));
    const start = main[index];
    const side = i % 2 === 0 ? 1 : -1;
    const angle = heading(main, index) + side * range(rng, 0.35, 0.8);
    const length = H * range(rng, 0.18, 0.36);
    forks.push(
      bolt(
        rng,
        start,
        [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length],
        5,
        0.42,
      ),
    );
  }
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of [...main, ...forks.flat()]) {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
  }
  const pad = 40;
  const line = (points) =>
    "M" + points.map(([x, y]) => `${Math.round(x - minX + pad)} ${Math.round(y)}`).join("L");
  return {
    style,
    width: Math.ceil(maxX - minX + pad * 2),
    height: H,
    length: Math.round(range(rng, 0.55, 1) * 100) / 100,
    main: line(main),
    forks: forks.map(line).join(""),
  };
}

/** 8 bolts, mixing bold and hairline (styles live in storm.config.ts). */
export function generateStorm(seed, count = 8) {
  const rng = createRng(seed);
  return {
    bolts: Array.from({ length: count }, (_, i) =>
      generateBolt(createRng(Math.floor(rng() * 2 ** 32)), i % 2 === 0 ? "bold" : "hairline"),
    ),
  };
}

/* ------------------------------------------------------------------------ */
/* Samples (contact sheet)                                                   */
/* ------------------------------------------------------------------------ */

export function familySample(seed, family, cell, nibAngle = DEFAULTS.nibAngle) {
  const rng = createRng(seed);
  const tile = { width: cell.width, height: cell.height, cssPx: 1, edgePower: 1 };
  const center = [cell.width / 2, cell.height / 2];
  const element = {
    long: () => longDiagonal(rng, tile),
    bundle: () => hairlineBundle(rng, tile, [cell.width * 0.2, cell.height * 0.75], nibAngle),
    medium: () => medium(rng, tile, center),
    short: () => short(rng, tile, [cell.width * 0.4, cell.height * 0.5]),
  }[family]();
  return element.lines.map((line) => polygonsToPath(sweepStroke(rng, line, nibAngle))).join("");
}

export function dustSample(seed, cell) {
  const rng = createRng(seed);
  let d = "";
  for (let i = 0; i < 70; i++) {
    const r = chance(rng, 0.05) ? range(rng, 2.4, 4) : 0.4 + 2 * rng() ** 2.2;
    d += ellipsePath(
      rng() * cell.width,
      rng() * cell.height,
      r * (chance(rng, 0.1) ? 1.8 : 1),
      r,
      rng() * Math.PI,
    );
  }
  return d;
}
