import { BookOpen, CalendarDays, Cloud, CloudOff, FolderSearch, NotebookPen } from 'lucide-react';
import type { SyncMode } from '../types';

type View = 'schedule' | 'notes' | 'explorer';

interface AppHeaderProps {
  activeView: View;
  noteCount: number;
  syncMode: SyncMode;
  onViewChange: (view: View) => void;
  onOpenLegend: () => void;
}

export function AppHeader({
  activeView,
  noteCount,
  syncMode,
  onViewChange,
  onOpenLegend,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="group flex min-w-0 items-center gap-3 text-left"
          onClick={() => onViewChange('schedule')}
          aria-label="Přejít na rozvrh"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-blue-200 transition-transform group-hover:-rotate-3">
            <CalendarDays size={21} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-bold tracking-tight text-ink">
              Rozvrh výcviku
            </span>
            <span className="hidden text-xs font-medium text-muted sm:block">
              Vzdělávací zařízení Praha
            </span>
          </span>
        </button>

        <nav className="ml-auto flex items-center gap-1 rounded-2xl bg-slate-100 p-1" aria-label="Hlavní navigace">
          <button
            type="button"
            onClick={() => onViewChange('schedule')}
            aria-label="Rozvrh"
            className={`nav-button ${activeView === 'schedule' ? 'nav-button-active' : ''}`}
          >
            <CalendarDays size={17} />
            <span className="hidden sm:inline">Rozvrh</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange('notes')}
            aria-label={noteCount ? `Poznámky, počet ${noteCount}` : 'Poznámky'}
            className={`nav-button ${activeView === 'notes' ? 'nav-button-active' : ''}`}
          >
            <NotebookPen size={17} />
            <span className="hidden sm:inline">Poznámky</span>
            {noteCount > 0 && (
              <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {noteCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onViewChange('explorer')}
            aria-label="Průzkumník"
            className={`nav-button ${activeView === 'explorer' ? 'nav-button-active' : ''}`}
          >
            <FolderSearch size={17} />
            <span className="hidden sm:inline">Průzkumník</span>
          </button>
        </nav>

        <button
          type="button"
          onClick={onOpenLegend}
          className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 md:flex"
        >
          <BookOpen size={17} />
          Číselníky
        </button>

        <div
          className="hidden items-center gap-2 text-xs font-semibold text-muted xl:flex"
          title={
            syncMode === 'cloud'
              ? 'Poznámky se ukládají do Firebase'
              : syncMode === 'local'
                ? 'Poznámky se ukládají jen v tomto prohlížeči'
                : 'Připojuji úložiště poznámek'
          }
        >
          {syncMode === 'local' ? <CloudOff size={15} /> : <Cloud size={15} />}
          {syncMode === 'cloud'
            ? 'Synchronizováno'
            : syncMode === 'local'
              ? 'Lokálně'
              : 'Připojuji…'}
        </div>
      </div>
    </header>
  );
}
