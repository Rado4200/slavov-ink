import type { StormConfig } from "@/components/atmosphere/storm.config";

/*
 * Lightning storm engine (loaded after idle by <LightningStorm>). Imperative
 * Web Animations API on two composited <svg> layers (bright strike + purple
 * afterglow); no React state per strike, no animation library.
 */

type Bolt = {
  style: string;
  width: number;
  height: number;
  length: number;
  main: string;
  forks: string;
};
type Layer = { part: string; width: number; phoneWidth?: number; color: string; opacity: number };

const rand = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

export function startStorm(root: HTMLElement, cfg: StormConfig, gentle: boolean): () => void {
  const [bright, glow] = Array.from(root.querySelectorAll<SVGSVGElement>(".storm-svg"));
  const cut = root.querySelector<SVGPathElement>(".storm-cut");
  const wash = root.querySelector<HTMLElement>(".storm-wash");
  if (!bright || !glow || !cut || !wash) return () => {};
  const phone = matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const slow = phone ? cfg.phoneFactor : 1;
  let bolts: Bolt[] = [];
  let timer = 0;
  let bag: number[] = [];
  let lastSlot = -9;
  let lastBolt = -1;

  // Shuffle bag over the slots; never the same or an adjacent slot twice in a row.
  const nextSlot = () => {
    let i = bag.findIndex((s) => Math.abs(s - lastSlot) > 1);
    if (i < 0) {
      bag = Array.from({ length: cfg.slots }, (_, k) => k).sort(() => Math.random() - 0.5);
      i = bag.findIndex((s) => Math.abs(s - lastSlot) > 1);
    }
    lastSlot = bag.splice(i, 1)[0];
    return lastSlot;
  };

  // Body-text boxes inside the bolt's reach become dimmed areas of its mask.
  const shields = (left: number, right: number, bottom: number) => {
    const p = cfg.shieldPadding;
    let d = "";
    for (const el of document.querySelectorAll(cfg.shieldSelector)) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > bottom || r.right < left || r.left > right) continue;
      d += `M${r.left - p} ${r.top - p}h${r.width + 2 * p}v${r.height + 2 * p}h${-r.width - 2 * p}z`;
    }
    return d;
  };

  const paint = (svg: SVGSVGElement, b: Bolt, layers: readonly Layer[], transform: string) => {
    const group = svg.querySelector("g g");
    if (!group) return;
    group.setAttribute("transform", transform);
    group.querySelectorAll("path").forEach((path, i) => {
      const l = layers[i];
      path.setAttribute(
        "d",
        !l ? "" : l.part === "main" ? b.main : l.part === "forks" ? b.forks : b.main + b.forks,
      );
      if (!l) return;
      path.setAttribute("stroke", `var(--${l.color})`);
      path.setAttribute("stroke-width", String(phone && l.phoneWidth ? l.phoneWidth : l.width));
      path.setAttribute("stroke-opacity", String(l.opacity));
    });
  };

  const strike = () => {
    if (!bolts.length || document.hidden) return;
    let pick = Math.floor(Math.random() * bolts.length);
    if (pick === lastBolt) pick = (pick + 1) % bolts.length;
    lastBolt = pick;
    const b = bolts[pick];
    const style = cfg.styles[b.style as keyof StormConfig["styles"]] ?? cfg.styles.bold;
    const height = b.length * innerHeight;
    const scale = height / b.height;
    const x = ((nextSlot() + 0.5) / cfg.slots + (Math.random() - 0.5) * 0.04) * innerWidth;
    const mirror = Math.random() < 0.5 ? -1 : 1;
    const rotate = (Math.random() * 2 - 1) * cfg.maxRotation;
    const reach = (b.width * scale) / 2 + height * Math.sin((cfg.maxRotation * Math.PI) / 180);
    // Read layout first (no forced reflow), then write.
    cut.setAttribute("d", shields(x - reach, x + reach, height));
    const transform = `translate(${x} 0) rotate(${rotate}) scale(${mirror * scale} ${scale}) translate(${-b.width / 2} 0)`;
    paint(bright, b, style.bright, transform);
    paint(glow, b, style.afterglow, transform);

    if (gentle) {
      const g = cfg.gentle;
      bright.animate([{ opacity: 0 }, { opacity: g.peak }, { opacity: 0 }], {
        duration: g.durationMs,
        easing: "ease-in-out",
      });
      return;
    }
    // Per-keyframe timing (no effect-level easing, which would warp the peaks).
    const t = cfg.timeline;
    const end = t.secondMs + t.fadeMs;
    bright.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: t.riseMs / end },
        { opacity: t.dip, offset: t.dipMs / end },
        { opacity: t.second, offset: t.secondMs / end },
        { opacity: 0, offset: 1 },
      ],
      { duration: end },
    );
    glow.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: t.secondMs / t.goneMs },
        { opacity: t.afterglow, offset: (t.secondMs + t.fadeMs * 0.45) / t.goneMs },
        { opacity: 0, offset: 1 },
      ],
      { duration: t.goneMs },
    );
    wash.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: cfg.washAlpha, offset: t.riseMs / end },
        { opacity: 0, offset: 1 },
      ],
      { duration: end },
    );
  };

  const interval = () => (gentle ? rand(cfg.gentle.intervalMs) : rand(cfg.intervalMs) * slow);
  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      strike();
      schedule(interval());
    }, ms);
  };
  const onVisibility = () => {
    if (document.hidden) clearTimeout(timer);
    else if (bolts.length) schedule(interval());
  };

  document.addEventListener("visibilitychange", onVisibility);
  // Manual trigger for the /dev/backdrop playground and tests.
  addEventListener("storm:strike", strike);
  fetch(cfg.src)
    .then((r) => r.json() as Promise<{ bolts: Bolt[] }>)
    .then((json) => {
      bolts = json.bolts;
      schedule(rand(cfg.firstStrikeMs));
    })
    .catch(() => {});

  return () => {
    clearTimeout(timer);
    bolts = [];
    document.removeEventListener("visibilitychange", onVisibility);
    removeEventListener("storm:strike", strike);
  };
}
