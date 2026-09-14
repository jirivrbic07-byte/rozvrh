import { useEffect, useMemo, useState } from 'react';
import { BookOpen, MapPin, Search, Users, X } from 'lucide-react';
import { LOCATIONS, SUBJECTS, TEACHERS } from '../data/catalog';

interface LegendModalProps {
  onClose: () => void;
}

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function LegendModal({ onClose }: LegendModalProps) {
  const [search, setSearch] = useState('');
  const query = normalizeSearch(search);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const subjects = useMemo(
    () =>
      Object.values(SUBJECTS).filter(
        (subject) =>
          subject.code !== 'INFO' &&
          normalizeSearch(`${subject.code} ${subject.name}`).includes(query),
      ),
    [query],
  );
  const teachers = useMemo(
    () =>
      Object.values(TEACHERS)
        .filter((teacher) => normalizeSearch(`${teacher.code} ${teacher.name}`).includes(query))
        .sort((a, b) => a.code.localeCompare(b.code, 'cs')),
    [query],
  );
  const locations = useMemo(
    () => LOCATIONS.filter((location) => normalizeSearch(location).includes(query)),
    [query],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legend-title"
        className="modal-enter max-h-[94vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-modal sm:max-w-4xl sm:rounded-[28px]"
      >
        <header className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-brand">
                <BookOpen size={20} />
              </span>
              <div>
                <h2 id="legend-title" className="text-lg font-black tracking-tight text-ink">
                  Číselníky a legenda
                </h2>
                <p className="text-xs font-medium text-muted">Předměty, vyučující a místa výuky</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="icon-button" aria-label="Zavřít číselníky">
              <X size={19} />
            </button>
          </div>
          <label className="relative mt-4 block">
            <span className="sr-only">Hledat v číselnících</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Hledat zkratku, jméno nebo místo…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-ink outline-none focus:border-brand focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </header>

        <div className="max-h-[calc(94vh-150px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <LegendSection icon={<BookOpen size={17} />} title="Předměty" count={subjects.length}>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((subject) => (
                <div
                  key={subject.code}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ backgroundColor: subject.background, borderColor: subject.border }}
                >
                  <span
                    className="grid h-8 min-w-12 place-items-center rounded-lg bg-white/75 px-2 text-xs font-black ring-1 ring-black/5"
                    style={{ color: subject.text }}
                  >
                    {subject.code}
                  </span>
                  <span className="text-sm font-bold leading-snug text-slate-700">{subject.name}</span>
                </div>
              ))}
            </div>
          </LegendSection>

          <LegendSection icon={<Users size={17} />} title="Vyučující" count={teachers.length}>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <div key={teacher.code} className="flex items-center gap-3 border-b border-slate-100 py-2.5">
                  <span className="w-9 shrink-0 text-xs font-black text-brand">{teacher.code}</span>
                  <span className="text-sm font-semibold text-slate-600">{teacher.name}</span>
                </div>
              ))}
            </div>
          </LegendSection>

          <LegendSection icon={<MapPin size={17} />} title="Lokace a učebny" count={locations.length}>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <span
                  key={location}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
                >
                  {location}
                </span>
              ))}
            </div>
          </LegendSection>

          {subjects.length + teachers.length + locations.length === 0 && (
            <div className="py-16 text-center text-sm font-semibold text-slate-400">
              Pro „{search}“ jsme nic nenašli.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LegendSection({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (!count) return null;
  return (
    <section className="mb-7 last:mb-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
        <span className="text-slate-400">{icon}</span>
        {title}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{count}</span>
      </h3>
      {children}
    </section>
  );
}
