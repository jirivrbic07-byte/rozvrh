import { Cloud, CloudOff, MessageSquareText, Search } from 'lucide-react';
import { getSubject } from '../data/catalog';
import { DAY_NAMES, findBlock, formatLongDate, formatSlotRange } from '../lib/schedule';
import type { NoteRecord, ScheduleBlock, SyncMode } from '../types';

interface NotesPanelProps {
  notes: NoteRecord[];
  syncMode: SyncMode;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenBlock: (block: ScheduleBlock) => void;
}

const normalize = (value: string) => value.toLocaleLowerCase('cs-CZ');

export function NotesPanel({
  notes,
  syncMode,
  search,
  onSearchChange,
  onOpenBlock,
}: NotesPanelProps) {
  const filteredNotes = notes.filter((note) => {
    const block = findBlock(note.blockId);
    return normalize(
      `${note.body} ${note.classId} ${note.subjectCode} ${block?.raw ?? ''}`,
    ).includes(normalize(search));
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-brand">Osobní přehled</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">Všechny poznámky</h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Poznámky ze všech tříd, týdnů a předmětů na jednom místě.
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
            syncMode === 'cloud'
              ? 'bg-emerald-50 text-emerald-700'
              : syncMode === 'local'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {syncMode === 'local' ? <CloudOff size={14} /> : <Cloud size={14} />}
          {syncMode === 'cloud'
            ? 'Uloženo ve Firebase'
            : syncMode === 'local'
              ? 'Uloženo v tomto zařízení'
              : 'Připojuji úložiště…'}
        </div>
      </div>

      <label className="relative mt-6 block">
        <span className="sr-only">Hledat v poznámkách</span>
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Hledat v poznámkách…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-ink shadow-card outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
        />
      </label>

      {filteredNotes.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {filteredNotes.map((note) => {
            const block = findBlock(note.blockId);
            const subject = getSubject(note.subjectCode);
            return (
              <button
                type="button"
                key={note.id}
                disabled={!block}
                onClick={() => block && onOpenBlock(block)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg disabled:hover:translate-y-0"
              >
                <div className="h-1" style={{ backgroundColor: subject.accent }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-black ring-1 ring-black/5"
                      style={{ backgroundColor: subject.background, color: subject.text }}
                    >
                      {subject.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Týden {note.weekId}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
                    {note.body}
                  </p>
                  <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold leading-relaxed text-slate-500">
                    <span className="block">{note.classId}</span>
                    <span className="block capitalize">
                      {DAY_NAMES[note.dayId].full} · {formatLongDate(note.date)}
                      {block ? ` · ${formatSlotRange(block.slotStart, block.slotEnd)}` : ''}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2.5xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-brand">
            <MessageSquareText size={22} />
          </span>
          <h2 className="mt-4 text-base font-extrabold text-ink">
            {notes.length ? 'Žádná odpovídající poznámka' : 'Zatím nemáte žádné poznámky'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm font-medium text-muted">
            {notes.length
              ? 'Zkuste změnit hledaný výraz.'
              : 'Otevřete blok v rozvrhu a přidejte si k němu první poznámku.'}
          </p>
        </div>
      )}
    </main>
  );
}
