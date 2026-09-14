import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search, UsersRound } from 'lucide-react';
import { formatWeekRange } from '../lib/schedule';
import type { ScheduleWeek } from '../types';

interface ScheduleControlsProps {
  classes: string[];
  weeks: ScheduleWeek[];
  selectedClass: string;
  selectedWeekId: string;
  search: string;
  onClassChange: (value: string) => void;
  onWeekChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function ScheduleControls({
  classes,
  weeks,
  selectedClass,
  selectedWeekId,
  search,
  onClassChange,
  onWeekChange,
  onSearchChange,
}: ScheduleControlsProps) {
  const activeWeekRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const button = activeWeekRef.current;
    const container = button?.parentElement;
    if (button && container) container.scrollLeft = button.offsetLeft - container.offsetLeft - (container.clientWidth - button.clientWidth) / 2;
  }, [selectedWeekId]);
  const selectedWeekIndex = weeks.findIndex((week) => week.id === selectedWeekId);
  const moveWeek = (direction: -1 | 1) => {
    const nextWeek = weeks[selectedWeekIndex + direction];
    if (nextWeek) onWeekChange(nextWeek.id);
  };

  return (
    <section className="rounded-2.5xl border border-slate-200/90 bg-white p-3 shadow-card sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative block shrink-0 xl:w-60">
          <span className="sr-only">Vybrat třídu</span>
          <UsersRound
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={selectedClass}
            onChange={(event) => onClassChange(event.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-9 text-sm font-bold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-100"
          >
            {classes.map((className) => (
              <option key={className}>{className}</option>
            ))}
          </select>
          <ChevronRight
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
          />
        </label>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => moveWeek(-1)}
            disabled={selectedWeekIndex <= 0}
            className="icon-button shrink-0"
            aria-label="Předchozí týden"
          >
            <ChevronLeft size={19} />
          </button>
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto rounded-xl bg-slate-100 p-1 scrollbar-none">
            {weeks.map((week) => (
              <button
                type="button"
                key={week.id}
                ref={week.id === selectedWeekId ? activeWeekRef : undefined}
                aria-pressed={week.id === selectedWeekId}
                onClick={() => onWeekChange(week.id)}
                className={`min-w-[126px] flex-1 rounded-lg px-3 py-2 text-center transition sm:min-w-[140px] ${
                  week.id === selectedWeekId
                    ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200/60'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
              >
                <span className="block text-xs font-extrabold sm:text-sm">{week.label}</span>
                <span className="mt-0.5 block text-[10px] font-semibold opacity-75 sm:text-[11px]">
                  {formatWeekRange(week)}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => moveWeek(1)}
            disabled={selectedWeekIndex >= weeks.length - 1}
            className="icon-button shrink-0"
            aria-label="Následující týden"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <label className="relative block shrink-0 xl:w-64">
          <span className="sr-only">Hledat v rozvrhu</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Předmět, učitel, místo…"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>
    </section>
  );
}
