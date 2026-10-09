import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { todayRO } from "@/lib/format";
import { monthLabel, monthOf, shiftMonth } from "@/lib/month";

/** ‹ Septembrie 2026 › — links keep the user on the same page. */
export function MonthNav({ month, basePath }: { month: string; basePath: string }) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canNext = next <= monthOf(todayRO());
  const arrow =
    "flex size-9 items-center justify-center rounded-xl text-stone-500 transition hover:bg-white hover:text-stone-900";
  return (
    <nav aria-label="Alege luna" className="inline-flex items-center gap-1 rounded-2xl bg-stone-100 p-1">
      <Link href={`${basePath}?luna=${prev}`} className={arrow} aria-label="Luna anterioară" scroll={false}>
        <ChevronLeft className="size-[18px]" aria-hidden />
      </Link>
      <span className="min-w-36 text-center text-sm font-bold text-stone-900" aria-live="polite">
        {monthLabel(month)}
      </span>
      {canNext ? (
        <Link href={`${basePath}?luna=${next}`} className={arrow} aria-label="Luna următoare" scroll={false}>
          <ChevronRight className="size-[18px]" aria-hidden />
        </Link>
      ) : (
        <span className={`${arrow} pointer-events-none opacity-30`} aria-hidden>
          <ChevronRight className="size-[18px]" />
        </span>
      )}
    </nav>
  );
}
