import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { DELIVERY_ZONE, type Point } from '../data';

// Schematic Dhaka-like city map drawn in SVG. Stands in for a maps provider; no tiles or API keys.

const W = 400;
const H = 300;

const MAJOR_H = [60, 120, 180, 240];
const MAJOR_V = [60, 140, 200, 260, 330];
const AREA_LABELS = [
  { x: 112, y: 36, en: 'Mirpur' },
  { x: 300, y: 28, en: 'Uttara ↑' },
  { x: 236, y: 74, en: 'Banani' },
  { x: 312, y: 98, en: 'Gulshan' },
  { x: 70, y: 132, en: 'Mohammadpur' },
  { x: 196, y: 150, en: 'Tejgaon' },
  { x: 104, y: 252, en: 'Dhanmondi' },
  { x: 60, y: 292, en: 'Lalbagh' },
];

type Props = {
  destination?: Point;
  restaurant?: Point;
  rider?: { pos: Point; live: boolean };
  route?: Point[];
  draggablePin?: boolean;
  onPinChange?: (p: Point) => void;
  showZone?: boolean;
  label: string;
};

export function inZone(p: Point) {
  let inside = false;
  for (let i = 0, j = DELIVERY_ZONE.length - 1; i < DELIVERY_ZONE.length; j = i++) {
    const a = DELIVERY_ZONE[i];
    const b = DELIVERY_ZONE[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function CityMap({ destination, restaurant, rider, route, draggablePin, onPinChange, showZone, label }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const toPoint = (e: PointerEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.round(Math.max(4, Math.min(W - 4, ((e.clientX - rect.left) / rect.width) * W))),
      y: Math.round(Math.max(8, Math.min(H - 4, ((e.clientY - rect.top) / rect.height) * H))),
    };
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!draggablePin || !onPinChange) return;
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onPinChange(toPoint(e));
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current && onPinChange) onPinChange(toPoint(e));
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: KeyboardEvent) => {
    if (!draggablePin || !onPinChange || !destination) return;
    const step = e.shiftKey ? 12 : 4;
    const d: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    onPinChange({ x: Math.max(4, Math.min(W - 4, destination.x + v[0])), y: Math.max(8, Math.min(H - 4, destination.y + v[1])) });
  };

  return (
    <div className="map-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role={draggablePin ? 'application' : 'img'}
        aria-label={label}
        tabIndex={draggablePin ? 0 : undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        style={{ cursor: draggablePin ? 'crosshair' : 'default' }}
      >
        <rect width={W} height={H} fill="var(--map-land)" />
        {/* water: river along the south-west, lake in Gulshan */}
        <path d="M0 268 C 60 258, 110 290, 170 286 S 260 300, 300 300 L 0 300 Z" fill="var(--map-water)" />
        <path d="M268 40 C 290 50, 286 70, 300 84 S 330 110, 322 132 C 312 120, 300 110, 288 96 S 262 60, 268 40 Z" fill="var(--map-water)" />
        {/* parks */}
        <rect x="150" y="196" width="34" height="26" rx="6" fill="var(--map-park)" />
        <rect x="64" y="84" width="40" height="24" rx="6" fill="var(--map-park)" />
        <circle cx="352" cy="214" r="18" fill="var(--map-park)" />
        {/* minor grid */}
        <g stroke="var(--map-road)" strokeWidth="2" opacity="0.8">
          {Array.from({ length: 19 }, (_, i) => (i + 1) * 20).map((x) => <line key={'v' + x} x1={x} y1={0} x2={x} y2={H} />)}
          {Array.from({ length: 14 }, (_, i) => (i + 1) * 20).map((y) => <line key={'h' + y} x1={0} y1={y} x2={W} y2={y} />)}
        </g>
        {/* major roads */}
        <g stroke="var(--map-road-major)" strokeWidth="5" strokeLinecap="round">
          {MAJOR_H.map((y) => <line key={'H' + y} x1={0} y1={y} x2={W} y2={y} />)}
          {MAJOR_V.map((x) => <line key={'V' + x} x1={x} y1={0} x2={x} y2={H} />)}
        </g>
        {showZone && (
          <polygon
            points={DELIVERY_ZONE.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="color-mix(in srgb, var(--brand) 7%, transparent)"
            stroke="var(--brand)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        )}
        <g fontSize="10" fontWeight="600" fill="var(--ink-3)" fontFamily="Inter, system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
          {AREA_LABELS.map((a) => <text key={a.en} x={a.x} y={a.y} textAnchor="middle">{a.en}</text>)}
        </g>

        {route && route.length > 1 && (
          <polyline
            points={route.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3.5"
            strokeDasharray="1 7"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}

        {restaurant && (
          <g transform={`translate(${restaurant.x} ${restaurant.y})`} aria-hidden>
            <rect x="-11" y="-11" width="22" height="22" rx="6" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.5" />
            <path d="M-4 -5 v4 a2 2 0 0 0 4 0 v-4 M-2 -1 v7 M4 -5 c-2 2 -2 5 0 6 v5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        )}

        {destination && (
          <g transform={`translate(${destination.x} ${destination.y})`} className={draggablePin ? 'pin-drag' : undefined}>
            <ellipse cx="0" cy="1" rx="6" ry="2.5" fill="rgb(0 0 0 / 25%)" />
            <path d="M0 0 C -4 -8, -12 -12, -12 -22 A 12 12 0 1 1 12 -22 C 12 -12, 4 -8, 0 0 Z" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2.5" />
            <circle cx="0" cy="-22" r="4.5" fill="var(--surface)" />
          </g>
        )}

        {rider && (
          <g className="rider-dot" style={{ transform: `translate(${rider.pos.x}px, ${rider.pos.y}px)` }} aria-hidden>
            {rider.live && <circle r="16" fill="color-mix(in srgb, var(--info) 18%, transparent)" />}
            <circle r="10" fill={rider.live ? 'var(--info)' : 'var(--ink-3)'} stroke="var(--surface)" strokeWidth="3" />
            <path d="M-4 2 l4 -7 l4 7 z" fill="#fff" />
          </g>
        )}
      </svg>
    </div>
  );
}

/** Nearest known place to a point, for a readable reverse-geocoded label. */
export function nearestPlace<T extends { pos: Point }>(p: Point, places: T[]): { place: T; distance: number } {
  let best = places[0];
  let bestD = Infinity;
  for (const pl of places) {
    const d = Math.hypot(pl.pos.x - p.x, pl.pos.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = pl;
    }
  }
  return { place: best, distance: bestD };
}
