/**
 * Ink atmosphere generator core: pure, seeded and deterministic (no Math.random,
 * no DOM, no Node APIs), so the CLI (scripts/generate-backdrop.mjs) and the
 * /dev/backdrop playground produce identical art from the same seed.
 *
 * Coordinates are SVG user units, y pointing down.
 */

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

const range = (rng, min, max) => min + (max - min) * rng();

function gaussian(rng) {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Smooth 1D value noise in [-1, 1] over x in [0, 1]. */
function noise1d(rng, cells = 12) {
  const lattice = Array.from({ length: cells + 1 }, () => rng() * 2 - 1);
  return (x) => {
    const xf = Math.min(Math.max(x, 0), 1) * cells;
    const i = Math.min(cells - 1, Math.floor(xf));
    const f = xf - i;
    const s = f * f * (3 - 2 * f);
    return lattice[i] * (1 - s) + lattice[i + 1] * s;
  };
}

const smoothstep = (x) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};

const fmt = (n) => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? "0" : String(r);
};

function cubic(p0, p1, p2, p3, t) {
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

function evalSegments(segments, t) {
  const scaled = Math.min(t, 0.999999) * segments.length;
  const index = Math.floor(scaled);
  const [p0, p1, p2, p3] = segments[index];
  return cubic(p0, p1, p2, p3, scaled - index);
}

/** Andrew's monotone chain; returns the hull with consistent orientation. */
function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function bounds(polygons) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of polygons) {
    for (const [x, y] of poly) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

/** Translates polygons to the origin (with padding) and serialises one path. */
function polygonsToShape(polygons, pad = 4) {
  const { minX, minY, maxX, maxY } = bounds(polygons);
  const dx = pad - minX;
  const dy = pad - minY;
  const d = polygons
    .filter((poly) => poly.length >= 3)
    .map((poly) => "M" + poly.map(([x, y]) => `${fmt(x + dx)} ${fmt(y + dy)}`).join("L") + "Z")
    .join("");
  return {
    d,
    width: Math.ceil(maxX - minX + pad * 2),
    height: Math.ceil(maxY - minY + pad * 2),
  };
}

/* ------------------------------------------------------------------------ */
/* Brush strokes                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Centerlines (cubic Bézier chains in a ~400 box) and pressure profiles.
 * startTaper/endTaper: fraction of length over which the nib lifts.
 * chisel: square-cut start (nib lands at full width). dry: dry-brush tail start.
 */
export const STROKE_KINDS = {
  arc: {
    path: (j) => [
      [
        [40, 300],
        [60 + j(), 90 + j()],
        [290 + j(), 30 + j()],
        [372, 170 + j()],
      ],
    ],
    startTaper: 0.12,
    endTaper: 0.35,
    chisel: false,
    dry: 0.78,
  },
  flick: {
    path: (j) => [
      [
        [70, 60],
        [100 + j(), 130 + j()],
        [140 + j(), 230],
        [170, 310],
      ],
      [
        [170, 310],
        [210 + j(), 250 + j()],
        [290 + j(), 140 + j()],
        [375, 50],
      ],
    ],
    startTaper: 0.04,
    endTaper: 0.3,
    chisel: true,
    dry: null,
  },
  slash: {
    path: (j) => [
      [
        [80, 60],
        [150 + j(), 130 + j()],
        [240 + j(), 250 + j()],
        [330, 340],
      ],
    ],
    startTaper: 0.02,
    endTaper: 0.55,
    chisel: true,
    dry: 0.7,
  },
  hook: {
    path: (j) => [
      [
        [140, 40],
        [120 + j(), 160 + j()],
        [120 + j(), 280],
        [210, 330],
      ],
      [
        [210, 330],
        [270 + j(), 360],
        [330, 320 + j()],
        [340 + j(), 250],
      ],
    ],
    startTaper: 0.08,
    endTaper: 0.3,
    chisel: true,
    dry: null,
  },
  swash: {
    path: (j) => [
      [
        [30, 220],
        [90 + j(), 80 + j()],
        [170 + j(), 90],
        [205, 200 + j()],
      ],
      [
        [205, 200],
        [240 + j(), 310 + j()],
        [320 + j(), 330],
        [375, 190 + j()],
      ],
    ],
    startTaper: 0.15,
    endTaper: 0.25,
    chisel: false,
    dry: 0.85,
  },
  comma: {
    path: (j) => [
      [
        [210, 50],
        [290 + j(), 110 + j()],
        [260 + j(), 260 + j()],
        [130, 345],
      ],
    ],
    startTaper: 0.03,
    endTaper: 0.6,
    chisel: true,
    dry: null,
  },
};

/**
 * Sweeps a flat rectangular nib (fixed angle, like a broad-edge pen) along the
 * kind's centerline. Each step contributes the convex hull of two consecutive
 * nib rectangles; all hulls share one orientation, so with the default nonzero
 * fill they merge into one seamless shape.
 */
export function generateStroke(rng, kindName, options = {}) {
  const kind = STROKE_KINDS[kindName];
  const jitter = () => range(rng, -22, 22);
  const segments = kind.path(jitter);
  const nibWidth = options.nibWidth ?? range(rng, 62, 84);
  const nibThickness = options.nibThickness ?? range(rng, 2.5, 4);
  const angle = (range(rng, 35, 45) * Math.PI) / 180;
  const u = [Math.cos(angle), -Math.sin(angle)]; // along the nib edge
  const v = [-u[1], u[0]]; // nib thickness direction
  const widthNoise = noise1d(rng, 14);
  const edgeNoiseA = noise1d(rng, 40);
  const edgeNoiseB = noise1d(rng, 40);
  const steps = 72;

  // Dry-brush bristle bands across the nib, each dying out at its own point.
  const bristles = Array.from({ length: 5 }, (_, i) => {
    const center = -0.8 + (1.6 * i) / 4 + range(rng, -0.08, 0.08);
    return { center, half: range(rng, 0.09, 0.17), life: range(rng, 0.35, 1) };
  });

  const nibAt = (t) => {
    const p = evalSegments(segments, t);
    const lift = kind.chisel ? 1 : smoothstep(t / kind.startTaper);
    const land = smoothstep((1 - t) / kind.endTaper);
    const pressure = Math.max(0.035, Math.min(lift, land));
    const half = (nibWidth / 2) * pressure * (1 + 0.18 * widthNoise(t));
    const rough = nibWidth * 0.055 * Math.max(0.3, pressure);
    return { p, half, roughA: edgeNoiseA(t) * rough, roughB: edgeNoiseB(t) * rough };
  };

  // Rectangle corners for the portion [from, to] (in -1..1) of the nib width.
  const corners = (nib, from = -1, to = 1) => {
    const a = from * nib.half + (from === -1 ? -nib.roughB : 0);
    const b = to * nib.half + (to === 1 ? nib.roughA : 0);
    const h = nibThickness / 2;
    const pt = (s, w) => [nib.p[0] + u[0] * s + v[0] * w, nib.p[1] + u[1] * s + v[1] * w];
    return [pt(a, -h), pt(a, h), pt(b, -h), pt(b, h)];
  };

  const polygons = [];
  let previous = nibAt(0);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const current = nibAt(t);
    if (kind.dry !== null && t > kind.dry) {
      const progress = (t - kind.dry) / (1 - kind.dry);
      for (const band of bristles) {
        if (progress > band.life) continue;
        const from = band.center - band.half;
        const to = band.center + band.half;
        polygons.push(convexHull([...corners(previous, from, to), ...corners(current, from, to)]));
      }
    } else {
      polygons.push(convexHull([...corners(previous), ...corners(current)]));
    }
    previous = current;
  }

  return { kind: kindName, ...polygonsToShape(polygons) };
}

/* ------------------------------------------------------------------------ */
/* Splashes                                                                  */
/* ------------------------------------------------------------------------ */

/** Closed Catmull-Rom spline through points, as a cubic Bézier path. */
function closedSpline(points, dx, dy) {
  const n = points.length;
  const p = (i) => points[(i + n) % n];
  let d = `M${fmt(p(0)[0] + dx)} ${fmt(p(0)[1] + dy)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${fmt(c1[0] + dx)} ${fmt(c1[1] + dy)} ${fmt(c2[0] + dx)} ${fmt(c2[1] + dy)} ${fmt(p2[0] + dx)} ${fmt(p2[1] + dy)}`;
  }
  return d + "Z";
}

function ellipsePoints(cx, cy, rx, ry, rotation, count = 10) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [
      cx + x * Math.cos(rotation) - y * Math.sin(rotation),
      cy + x * Math.sin(rotation) + y * Math.cos(rotation),
    ];
  });
}

/**
 * Irregular main blob with narrow spikes thrown mostly toward one direction,
 * satellite droplets (bigger near the blob, stretched along the throw), bead
 * trails and stray specks.
 */
export function generateSplash(rng) {
  const R = 60;
  const fling = range(rng, 0, Math.PI * 2);
  const outline = noise1d(rng, 16);
  const lobes = Array.from({ length: 6 + Math.floor(rng() * 6) }, () => {
    const thrown = rng() < 0.7;
    return {
      angle: thrown ? fling + gaussian(rng) * 0.55 : range(rng, 0, Math.PI * 2),
      amp: R * range(rng, 0.3, 1.5) * (thrown ? 1 : 0.55),
      width: range(rng, 0.035, 0.09),
    };
  });

  const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const samples = 120;
  const blob = Array.from({ length: samples }, (_, i) => {
    const a = (i / samples) * Math.PI * 2;
    let r = R * (1 + 0.22 * outline(i / samples));
    for (const lobe of lobes) {
      r += lobe.amp * Math.exp(-((angleDelta(a, lobe.angle) / lobe.width) ** 2));
    }
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

  const smooth = [blob];

  const dropletCount = 7 + Math.floor(rng() * 8);
  for (let i = 0; i < dropletCount; i++) {
    const angle = fling + gaussian(rng) * 0.45;
    const distance = R * (1.6 + rng() ** 1.4 * 3.2);
    const falloff = Math.max(0.25, 1.4 - distance / (R * 4.5));
    const size = R * range(rng, 0.05, 0.18) * falloff;
    const stretch = 1 + rng() * 1.6 * (distance / (R * 4.8));
    const cx = Math.cos(angle) * distance;
    const cy = Math.sin(angle) * distance;
    smooth.push(ellipsePoints(cx, cy, size * stretch, size, angle));
  }

  // Bead trails: droplets in a line, shrinking and spreading out.
  for (let trail = 0, trails = 1 + Math.floor(rng() * 2); trail < trails; trail++) {
    const angle = fling + gaussian(rng) * 0.3;
    let distance = R * range(rng, 1.7, 2.1);
    let size = R * range(rng, 0.09, 0.13);
    for (let bead = 0, beads = 4 + Math.floor(rng() * 4); bead < beads; bead++) {
      const wobble = gaussian(rng) * 0.03;
      smooth.push(
        ellipsePoints(
          Math.cos(angle + wobble) * distance,
          Math.sin(angle + wobble) * distance,
          size * 1.3,
          size,
          angle,
        ),
      );
      distance += size * range(rng, 2.6, 4.2);
      size *= range(rng, 0.7, 0.85);
    }
  }

  for (let i = 0, n = 6 + Math.floor(rng() * 8); i < n; i++) {
    const angle = range(rng, 0, Math.PI * 2);
    const distance = R * range(rng, 1.4, 2.8);
    const r = range(rng, 1.1, 2.8);
    smooth.push(
      ellipsePoints(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        r,
        r * range(rng, 0.7, 1),
        angle,
        6,
      ),
    );
  }

  const { minX, minY, maxX, maxY } = bounds(smooth);
  const pad = 4;
  const dx = pad - minX;
  const dy = pad - minY;
  const d = smooth.map((points) => closedSpline(points, dx, dy)).join("");
  return {
    d,
    width: Math.ceil(maxX - minX + pad * 2),
    height: Math.ceil(maxY - minY + pad * 2),
  };
}

/* ------------------------------------------------------------------------ */
/* Lightning                                                                 */
/* ------------------------------------------------------------------------ */

function displace(rng, a, b, depth, roughness) {
  if (depth === 0) return [a];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  const offset = (rng() - 0.5) * len * roughness;
  const m = [mid[0] + nx * offset, mid[1] + ny * offset];
  return [
    ...displace(rng, a, m, depth - 1, roughness),
    ...displace(rng, m, b, depth - 1, roughness),
  ];
}

function bolt(rng, a, b, depth, roughness) {
  return [...displace(rng, a, b, depth, roughness), b];
}

/**
 * One branching bolt (midpoint displacement) with 1-2 forks. Returns the main
 * channel and forks as separate polylines so styles can weight them differently.
 * The glow is stacked wide, faint strokes (no blur filter).
 */
export function generateLightning(rng) {
  const H = 600;
  const main = bolt(rng, [range(rng, 120, 160), 0], [range(rng, 50, 110), H], 7, 0.36);
  const direction = (points, index) => {
    const a = points[Math.max(0, index - 4)];
    const b = points[Math.min(points.length - 1, index + 4)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };

  const forks = [];
  const forkCount = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < forkCount; i++) {
    const index = Math.floor(main.length * range(rng, 0.25, 0.6));
    const start = main[index];
    const side = i % 2 === 0 ? 1 : -1;
    const angle = direction(main, index) + side * range(rng, 0.4, 0.75);
    const length = H * range(rng, 0.2, 0.34);
    const end = [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length];
    const fork = bolt(rng, start, end, 5, 0.42);
    forks.push(fork);
    if (rng() > 0.45) {
      const subIndex = Math.floor(fork.length * range(rng, 0.35, 0.6));
      const subAngle = direction(fork, subIndex) - side * range(rng, 0.35, 0.6);
      const subLength = length * range(rng, 0.3, 0.45);
      const subStart = fork[subIndex];
      forks.push(
        bolt(
          rng,
          subStart,
          [
            subStart[0] + Math.cos(subAngle) * subLength,
            subStart[1] + Math.sin(subAngle) * subLength,
          ],
          4,
          0.45,
        ),
      );
    }
  }

  const { minX, minY, maxX, maxY } = bounds([main, ...forks]);
  const pad = 24;
  const line = (points) =>
    "M" + points.map(([x, y]) => `${fmt(x + pad - minX)} ${fmt(y + pad - minY)}`).join("L");
  const mainD = line(main);
  const forksD = forks.map(line).join("");
  const allD = mainD + forksD;

  return {
    width: Math.ceil(maxX - minX + pad * 2),
    height: Math.ceil(maxY - minY + pad * 2),
    /** Stroke widths are CSS px (rendered with vector-effect: non-scaling-stroke). */
    styles: {
      A: [
        { d: allD, strokeWidth: 5, color: "royal-light", opacity: 0.12 },
        { d: mainD, strokeWidth: 1.1, color: "bone", opacity: 0.85 },
        { d: forksD, strokeWidth: 0.7, color: "bone", opacity: 0.6 },
      ],
      B: [
        { d: allD, strokeWidth: 22, color: "royal-light", opacity: 0.05 },
        { d: allD, strokeWidth: 9, color: "royal-light", opacity: 0.12 },
        { d: allD, strokeWidth: 3.5, color: "bone", opacity: 0.22 },
        { d: mainD, strokeWidth: 2, color: "bone", opacity: 0.95 },
        { d: forksD, strokeWidth: 1.2, color: "bone", opacity: 0.8 },
      ],
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Full set                                                                  */
/* ------------------------------------------------------------------------ */

export const STROKE_ORDER = ["arc", "swash", "slash", "hook", "flick", "comma"];
export const SPLASH_COUNT = 5;

/** Every asset for one seed. Each piece gets its own sub-seed, so they are independent. */
export function generateSet(seed) {
  const seeds = createRng(seed);
  const next = () => createRng(Math.floor(seeds() * 2 ** 32));
  return {
    seed,
    strokes: STROKE_ORDER.map((kind) => generateStroke(next(), kind)),
    splashes: Array.from({ length: SPLASH_COUNT }, () => generateSplash(next())),
    lightning: generateLightning(next()),
  };
}
