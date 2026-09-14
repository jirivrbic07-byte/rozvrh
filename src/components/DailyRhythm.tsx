import { Clock3, Coffee, ShieldCheck, Utensils } from 'lucide-react';
import { DAY_TIMING_ITEMS } from '../lib/schedule';

const icons = {
  assembly: ShieldCheck,
  lesson: Clock3,
  break: Utensils,
};

export function DailyRhythm() {
  return (
    <section className="mb-5 mt-5" aria-labelledby="daily-rhythm-title">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Coffee size={15} className="text-brand" />
        <h2 id="daily-rhythm-title" className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
          Denní časový režim
        </h2>
      </div>
      <div className="flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-7">
        {DAY_TIMING_ITEMS.map((item) => {
          const Icon = icons[item.kind];
          return (
            <div
              key={item.label}
              className={`flex min-w-[154px] snap-start items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:min-w-0 ${
                item.kind === 'assembly'
                  ? 'border-blue-100 bg-blue-50 text-blue-900'
                  : item.kind === 'break'
                    ? 'border-amber-100 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <Icon size={16} className="shrink-0 opacity-70" />
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[10px] font-extrabold uppercase tracking-wide opacity-60">
                  {item.label}
                </span>
                <span className="block whitespace-nowrap text-xs font-black">
                  {item.time}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 px-1 text-[10px] font-semibold text-slate-400">
        Časy 9.–10. hodiny zatím nejsou zadané.
      </p>
    </section>
  );
}
