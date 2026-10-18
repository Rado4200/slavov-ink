import type { StormConfig } from "@/components/atmosphere/storm.config";

/*
 * Lightning storm engine. Loaded after idle by <LightningStorm>; imperative
 * Web Animations API, no React state per strike, no animation library.
 */

type BoltLayer = { part: "all" | "main" | "forks"; width: number; color: string; opacity: number };
type Bolt = {
  style: string;
  width: number;
  height: number;
  length: number;
  main: string;
  forks: string;
};
type StormData = { styles: Record<string, BoltLayer[]>; bolts: Bolt[] };

const rand = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

function shuffled(count: number) {
  const bag = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/** Starts the storm inside the server-rendered .storm root; returns stop(). */
export function startStorm(root: HTMLElement, cfg: StormConfig): () => void {
  const bolt = root.querySelector<SVGGElement>(".storm-bolt");
  const cut = root.querySelector<SVGPathElement>(".storm-cut");
  const wash = root.querySelector<HTMLElement>(".storm-wash");
  if (!bolt || !cut || !wash) return () => {};
  const paths = Array.from(bolt.querySelectorAll("path"));
  const slow = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches
    ? cfg.mobileFactor
    : 1;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  let data: StormData | undefined;
  let timer = 0;
  let bag: number[] = [];
  let lastSlot = -9;
  let lastBolt = -1;

  // Shuffle bag over the slots, never the same or an adjacent slot twice in a row.
  const nextSlot = () => {
    let index = bag.findIndex((slot) => Math.abs(slot - lastSlot) > 1);
    if (index < 0) {
      bag = shuffled(cfg.slots);
      index = bag.findIndex((slot) => Math.abs(slot - lastSlot) > 1);
    }
    lastSlot = bag.splice(index, 1)[0];
    return lastSlot;
  };

  // Text boxes near the bolt become cut-outs in its mask (bolt dims behind text).
  const shields = (box: DOMRect) => {
    const p = cfg.shieldPadding;
    let d = "";
    for (const el of document.querySelectorAll(cfg.shieldSelector)) {
      const r = el.getBoundingClientRect();
      if (
        r.width === 0 ||
        r.bottom < box.top ||
        r.top > box.bottom ||
        r.right < box.left ||
        r.left > box.right
      )
        continue;
      d += `M${r.left - p} ${r.top - p}h${r.width + 2 * p}v${r.height + 2 * p}h${-(r.width + 2 * p)}z`;
    }
    return d;
  };

  const strike = () => {
    if (!data || document.hidden) return;
    let pick = Math.floor(Math.random() * data.bolts.length);
    if (pick === lastBolt) pick = (pick + 1) % data.bolts.length;
    lastBolt = pick;
    const b = data.bolts[pick];
    const layers = data.styles[b.style] ?? [];

    const scale = (b.length * window.innerHeight) / b.height;
    const x = ((nextSlot() + 0.5) / cfg.slots + (Math.random() - 0.5) * 0.04) * window.innerWidth;
    const mirror = Math.random() < 0.5 ? -1 : 1;
    const rotate = (Math.random() * 2 - 1) * cfg.maxRotation;
    bolt.setAttribute(
      "transform",
      `translate(${x} 0) rotate(${rotate}) scale(${mirror * scale} ${scale}) translate(${-b.width / 2} 0)`,
    );
    paths.forEach((path, i) => {
      const layer = layers[i];
      path.setAttribute(
        "d",
        !layer
          ? ""
          : layer.part === "main"
            ? b.main
            : layer.part === "forks"
              ? b.forks
              : b.main + b.forks,
      );
      if (!layer) return;
      path.setAttribute("stroke", `var(--${layer.color})`);
      path.setAttribute("stroke-width", String(layer.width));
      path.setAttribute("stroke-opacity", String(layer.opacity));
    });
    cut.setAttribute("d", shields(bolt.getBoundingClientRect()));

    const duration = cfg.secondPulseMs + rand(cfg.fadeMs);
    const at = (ms: number) => ms / duration;
    const pulse = (peak: number): Keyframe[] => [
      { opacity: 0 },
      { opacity: peak, offset: at(cfg.riseMs) },
      { opacity: peak * 0.25, offset: at(cfg.secondPulseMs * 0.55) },
      { opacity: peak * cfg.secondPulse, offset: at(cfg.secondPulseMs) },
      { opacity: 0 },
    ];
    bolt.animate(pulse(cfg.intensity), { duration, easing: "ease-out" });
    wash.animate(pulse(cfg.washAlpha), { duration, easing: "ease-out" });
  };

  const schedule = (ms: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      strike();
      schedule(rand(cfg.intervalMs) * slow);
    }, ms);
  };

  const onVisibility = () => {
    if (document.hidden) window.clearTimeout(timer);
    else if (data) schedule(rand(cfg.intervalMs) * slow);
  };
  const onReduced = () => {
    if (reduced.matches) stop();
  };
  const stop = () => {
    window.clearTimeout(timer);
    data = undefined;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("storm:strike", strike);
    reduced.removeEventListener("change", onReduced);
  };

  document.addEventListener("visibilitychange", onVisibility);
  // Manual trigger for the /dev/backdrop playground and tests.
  window.addEventListener("storm:strike", strike);
  reduced.addEventListener("change", onReduced);

  fetch(cfg.src)
    .then((response) => response.json() as Promise<StormData>)
    .then((json) => {
      data = json;
      schedule(rand(cfg.firstStrikeMs) * slow);
    })
    .catch(() => stop());

  return stop;
}
