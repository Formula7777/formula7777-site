import { SUPPLY, buildCurvePoints, calculatePrice } from "../lib/mintCurve";

const WIDTH = 420;
const HEIGHT = 180;
const PADDING = 18;
const points = buildCurvePoints(32);
const maxPrice = calculatePrice(SUPPLY);

function toSvgPoint(point) {
  const x = PADDING + (point.minted / SUPPLY) * (WIDTH - PADDING * 2);
  const y = HEIGHT - PADDING - (point.price / maxPrice) * (HEIGHT - PADDING * 2);
  return `${x},${y}`;
}

export function CurvePreview({ mintedSupply }) {
  const currentPrice = calculatePrice(mintedSupply);
  const rawProgressX = PADDING + (mintedSupply / SUPPLY) * (WIDTH - PADDING * 2);
  const minVisibleOffset = 26;
  const progressX =
    mintedSupply > 0
      ? Math.max(PADDING + minVisibleOffset, rawProgressX)
      : rawProgressX;
  const progressY = HEIGHT - PADDING - (currentPrice / maxPrice) * (HEIGHT - PADDING * 2);
  const progressPath = `M ${PADDING},${HEIGHT - PADDING} L ${progressX},${HEIGHT - PADDING} L ${progressX},${progressY}`;
  const priceLabelX = Math.min(progressX + 10, WIDTH - 118);
  const supplyLabelX = Math.min(progressX + 10, WIDTH - 132);
  const markerAlignedLeft = progressX < WIDTH * 0.58;

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-panel/80 p-4 shadow-glow sm:p-5">
      <div className="mb-4 flex flex-col gap-1 text-xs uppercase tracking-[0.16em] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.2em]">
        <span>Mint Curve</span>
        <span>x = minted supply</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full max-w-full">
        <defs>
          <linearGradient id="curve-line" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#75f7c3" />
            <stop offset="100%" stopColor="#8bd2ff" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width={WIDTH}
          height={HEIGHT}
          rx="20"
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.06)"
        />
        <path
          d={progressPath}
          fill="none"
          stroke="rgba(117,247,195,0.18)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${points.map(toSvgPoint).join(" L ")}`}
          fill="none"
          stroke="url(#curve-line)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1={progressX}
          y1={PADDING}
          x2={progressX}
          y2={HEIGHT - PADDING}
          stroke="rgba(117,247,195,0.52)"
          strokeDasharray="4 5"
        />
        <circle
          cx={progressX}
          cy={progressY}
          r="5.5"
          fill="#75f7c3"
        />
        <circle
          cx={progressX}
          cy={progressY}
          r="10"
          fill="rgba(117,247,195,0.12)"
          stroke="rgba(117,247,195,0.35)"
        />
        <g>
          <rect
            x={markerAlignedLeft ? supplyLabelX - 6 : progressX - 126}
            y={PADDING + 8}
            width="122"
            height="24"
            rx="8"
            fill="rgba(4,8,13,0.92)"
            stroke="rgba(117,247,195,0.14)"
          />
          <text
            x={markerAlignedLeft ? supplyLabelX : progressX - 120}
            y={PADDING + 24}
            fill="#d8e2f0"
            fontSize="10"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {`Current: ${mintedSupply} / ${SUPPLY}`}
          </text>
        </g>
        <g>
          <rect
            x={markerAlignedLeft ? priceLabelX - 6 : progressX - 112}
            y={PADDING + 38}
            width="108"
            height="22"
            rx="8"
            fill="rgba(4,8,13,0.92)"
            stroke="rgba(139,210,255,0.14)"
          />
          <text
            x={markerAlignedLeft ? priceLabelX : progressX - 106}
            y={PADDING + 53}
            fill="#8bd2ff"
            fontSize="10"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {`Price: ${currentPrice.toFixed(6)} ETH`}
          </text>
        </g>
      </svg>
      <div className="mt-4 flex justify-between text-xs text-slate-500">
        <span>0 minted</span>
        <span>7777 minted</span>
      </div>
    </div>
  );
}
