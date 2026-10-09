import { formatRON } from "@/lib/format";
import type { MonthReport } from "@/lib/finance/report";

/** Market channels in greens, everything else in distinct calm colours. */
const MARKET = ["#2f7a54", "#8cc4a2", "#4f9d74", "#b6dcc4"];
const OTHER = ["#f59e0b", "#38bdf8", "#fb7185", "#818cf8", "#a78bfa", "#2dd4bf", "#a8a29e", "#f472b6"];

export function channelColors(channels: MonthReport["channels"]): Record<string, string> {
  let m = 0;
  let o = 0;
  return Object.fromEntries(
    channels.map((c) => [
      c.id,
      c.kind === "market" ? MARKET[m++ % MARKET.length] : OTHER[o++ % OTHER.length],
    ]),
  );
}

const lei = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

export function ChannelChart({ report }: { report: MonthReport }) {
  const total = Number(report.income);
  const channels = report.channels.filter((c) => Number(c.total) > 0);
  const colors = channelColors(channels);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const arcs = channels.reduce<{ id: string; len: number; start: number }[]>((acc, c) => {
    const prev = acc.at(-1);
    acc.push({ id: c.id, len: (Number(c.total) / total) * circ, start: prev ? prev.start + prev.len : 0 });
    return acc;
  }, []);

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
      <svg
        viewBox="0 0 140 140"
        className="mx-auto w-full max-w-[200px]"
        role="img"
        aria-label="Intrări pe canale"
      >
        <g transform="rotate(-90 70 70)">
          {arcs.map((a) => (
            <circle
              key={a.id}
              r={r}
              cx={70}
              cy={70}
              fill="none"
              stroke={colors[a.id]}
              strokeWidth={22}
              strokeDasharray={`${a.len} ${circ - a.len}`}
              strokeDashoffset={-a.start}
            />
          ))}
        </g>
        <text x={70} y={66} textAnchor="middle" className="fill-stone-500 text-[9px]">
          Total intrări
        </text>
        <text x={70} y={84} textAnchor="middle" className="fill-stone-900 text-[15px] font-extrabold">
          {lei.format(total)} lei
        </text>
      </svg>
      <ul className="space-y-2.5">
        {channels.map((c) => (
          <li key={c.id} className="flex items-center gap-3 text-sm">
            <span
              className="size-3 shrink-0 rounded-[4px]"
              style={{ background: colors[c.id] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-stone-700">{c.name}</span>
              <span className="block text-xs text-stone-500">
                {c.count} {c.count === 1 ? "intrare" : "intrări"} ·{" "}
                {lei.format((Number(c.total) / total) * 100)}%
              </span>
            </span>
            <span className="font-bold whitespace-nowrap text-stone-900 tabular">{formatRON(c.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
