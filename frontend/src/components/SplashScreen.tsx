import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const TOTAL_DURATION_MS = 2800;
const DISSOLVE_START_MS = 2000;
const DISSOLVE_DURATION_MS = 800;

const TOP_LINES: Array<[number, number]> = [
  [10, 0], [25, 40], [40, 20], [50, 0], [60, 30], [75, 50], [85, 10], [95, 60],
];
const BOTTOM_LINES: Array<[number, number]> = [
  [15, 30], [30, 10], [45, 50], [55, 0], [65, 20], [80, 40], [90, 60], [5, 70],
];
const LEFT_LINES: Array<[number, number]> = [
  [30, 0], [50, 30], [70, 60],
];
const RIGHT_LINES: Array<[number, number]> = [
  [40, 20], [60, 50], [80, 40],
];

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [dissolving, setDissolving] = useState(false);

  useEffect(() => {
    const dissolveTimer = setTimeout(() => {
      setDissolving(true);
    }, DISSOLVE_START_MS);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{
        animation: dissolving
          ? `splash-dissolve ${DISSOLVE_DURATION_MS}ms ease-in-out forwards`
          : "none",
      }}
    >
      {/* Speed Lines Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {TOP_LINES.map(([offset, delay], i) => (
          <div
            key={`top-${i}`}
            className="absolute top-0 h-[45%]"
            style={{
              left: `${offset}%`,
              width: "2px",
              background: "linear-gradient(to bottom, transparent, #4f46e5 40%, #818cf8)",
              animation: `splash-speed-line-top 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
              opacity: 0,
            }}
          />
        ))}

        {BOTTOM_LINES.map(([offset, delay], i) => (
          <div
            key={`bottom-${i}`}
            className="absolute bottom-0 h-[45%]"
            style={{
              left: `${offset}%`,
              width: "2px",
              background: "linear-gradient(to top, transparent, #4f46e5 40%, #818cf8)",
              animation: `splash-speed-line-bottom 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
              opacity: 0,
            }}
          />
        ))}

        {LEFT_LINES.map(([offset, delay], i) => (
          <div
            key={`left-${i}`}
            className="absolute left-0 w-[45%]"
            style={{
              top: `${offset}%`,
              height: "2px",
              background: "linear-gradient(to right, transparent, #4f46e5 40%, #818cf8)",
              animation: `splash-speed-line-left 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
              opacity: 0,
            }}
          />
        ))}

        {RIGHT_LINES.map(([offset, delay], i) => (
          <div
            key={`right-${i}`}
            className="absolute right-0 w-[45%]"
            style={{
              top: `${offset}%`,
              height: "2px",
              background: "linear-gradient(to left, transparent, #4f46e5 40%, #818cf8)",
              animation: `splash-speed-line-right 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Center Content */}
      <div className="relative flex flex-col items-center">
        {/* Speed stripe above logo */}
        <div
          className="w-48 h-[2px] mb-6 bg-brand-500"
          style={{
            animation: "splash-stripe-expand 600ms cubic-bezier(0.16, 1, 0.3, 1) 600ms forwards",
            transformOrigin: "center",
            transform: "scaleX(0)",
            opacity: 0,
          }}
        />

        {/* Logo row: badge + JET text */}
        <div
          className="flex items-center gap-4"
          style={{
            animation: "splash-logo-reveal 800ms cubic-bezier(0.87, 0, 0.13, 1) 600ms forwards",
            clipPath: "inset(50% 50% 50% 50%)",
            opacity: 0,
          }}
        >
          <div
            className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white text-xl"
            style={{
              animation: "splash-badge-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 900ms both",
            }}
          >
            J
          </div>
          <span className="text-7xl font-bold text-white tracking-[0.25em]">
            JET
          </span>
        </div>

        {/* Speed blocks + Tagline */}
        <div
          className="flex items-center gap-3 mt-4"
          style={{
            animation: "splash-tagline-fade 600ms ease-out 1400ms forwards",
            opacity: 0,
          }}
        >
          <div
            className="flex gap-1"
            style={{ animation: "splash-speed-block-left 400ms ease-out 1500ms both" }}
          >
            <div className="w-[3px] h-3 bg-brand-600 rounded-sm" />
            <div className="w-[3px] h-3 bg-brand-500 rounded-sm" />
            <div className="w-[3px] h-3 bg-brand-400 rounded-sm" />
          </div>

          <span className="text-sm text-slate-400 tracking-[0.15em] uppercase">
            Equity Derivatives Analytics
          </span>

          <div
            className="flex gap-1"
            style={{ animation: "splash-speed-block-right 400ms ease-out 1500ms both" }}
          >
            <div className="w-[3px] h-3 bg-brand-400 rounded-sm" />
            <div className="w-[3px] h-3 bg-brand-500 rounded-sm" />
            <div className="w-[3px] h-3 bg-brand-600 rounded-sm" />
          </div>
        </div>

        {/* Speed stripe below tagline */}
        <div
          className="w-32 h-[1px] mt-4 bg-brand-700"
          style={{
            animation: "splash-stripe-expand 500ms cubic-bezier(0.16, 1, 0.3, 1) 1600ms forwards",
            transformOrigin: "center",
            transform: "scaleX(0)",
            opacity: 0,
          }}
        />
      </div>
    </div>
  );
}
