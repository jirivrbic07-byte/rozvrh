import { useMemo, useState } from 'react';
import {
  CalendarRange,
  ExternalLink,
  FileText,
  FolderSearch,
  NotebookPen,
  PackageOpen,
  X,
} from 'lucide-react';
import { getSubject } from '../data/catalog';
import {
  DAY_NAMES,
  findBlock,
  formatLongDate,
  formatSlotRange,
  formatTeachingTimeRange,
} from '../lib/schedule';
import type {
  AttachmentRecord,
  BlockDescription,
  NoteRecord,
  ScheduleBlock,
} from '../types';

interface ExplorerPanelProps {
  notes: NoteRecord[];
  descriptions: Record<string, BlockDescription>;
  attachments: AttachmentRecord[];
  onOpenBlock: (block: ScheduleBlock) => void;
  onOpenAttachment: (attachment: AttachmentRecord) => Promise<void>;
}

interface ExplorerEntry {
  block: ScheduleBlock;
  notes: NoteRecord[];
  description?: BlockDescription;
  attachments: AttachmentRecord[];
}

const formatFileSize = (size: number) =>
  size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} kB`
    : `${(size / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;

export function ExplorerPanel({
  notes,
  descriptions,
  attachments,
  onOpenBlock,
  onOpenAttachment,
}: ExplorerPanelProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const entries = useMemo(() => {
    const blockIds = new Set<string>();
    notes.forEach((note) => blockIds.add(note.blockId));
    attachments.forEach((attachment) => blockIds.add(attachment.blockId));
    Object.values(descriptions).forEach((description) => {
      if (description.description.trim()) blockIds.add(description.blockId);
    });

    return [...blockIds]
      .map((blockId): ExplorerEntry | undefined => {
        const block = findBlock(blockId);
        if (!block) return undefined;
        return {
          block,
          notes: notes.filter((note) => note.blockId === blockId),
          description: descriptions[blockId],
          attachments: attachments.filter(
            (attachment) => attachment.blockId === blockId,
          ),
        };
      })
      .filter((entry): entry is ExplorerEntry => Boolean(entry))
      .sort(
        (left, right) =>
          right.block.date.localeCompare(left.block.date) ||
          left.block.slotStart - right.block.slotStart,
      );
  }, [attachments, descriptions, notes]);

  const subjects = useMemo(
    () => [...new Set(entries.map((entry) => entry.block.subjectCode))].sort(),
    [entries],
  );

  const filteredEntries = entries.filter(({ block }) => {
    if (selectedSubjects.length && !selectedSubjects.includes(block.subjectCode)) {
      return false;
    }
    if (dateFrom && block.date < dateFrom) return false;
    if (dateTo && block.date > dateTo) return false;
    return true;
  });

  const toggleSubject = (code: string) => {
    setSelectedSubjects((current) =>
      current.includes(code)
        ? current.filter((subjectCode) => subjectCode !== code)
        : [...current, code],
    );
  };

  const resetFilters = () => {
    setSelectedSubjects([]);
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = selectedSubjects.length > 0 || dateFrom || dateTo;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-brand">
          Studijní knihovna
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Průzkumník
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-muted">
          Vyberte jeden nebo více předmětů a datum výuky. Uvidíte společně
          zápisky, informace co si vzít s sebou a vložené dokumenty.
        </p>
      </div>

      <section className="mt-6 rounded-2.5xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <FolderSearch size={18} className="text-brand" />
            Filtrovat obsah
          </div>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="secondary-button">
              <X size={15} />
              Zrušit filtry
            </button>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Předměty
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {subjects.length ? (
              subjects.map((code) => {
                const subject = getSubject(code);
                const active = selectedSubjects.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSubject(code)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      active ? 'shadow-sm ring-2 ring-offset-1' : 'hover:-translate-y-px'
                    }`}
                    style={{
                      backgroundColor: active ? subject.background : '#fff',
                      borderColor: active ? subject.accent : '#e2e8f0',
                      color: active ? subject.text : '#64748b',
                      '--tw-ring-color': subject.accent,
                    } as React.CSSProperties}
                  >
                    {code}
                  </button>
                );
              })
            ) : (
              <span className="text-sm font-medium text-slate-400">
                Předměty se objeví po přidání prvního zápisku nebo dokumentu.
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">
            Datum od
            <span className="relative mt-1.5 block">
              <CalendarRange className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-semibold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-blue-50"
              />
            </span>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Datum do
            <span className="relative mt-1.5 block">
              <CalendarRange className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-semibold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-blue-50"
              />
            </span>
          </label>
        </div>
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-extrabold text-ink">Nalezené materiály</h2>
        <span className="text-xs font-bold text-slate-400">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'hodina' : 'hodin'}
        </span>
      </div>

      {filteredEntries.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredEntries.map(({ block, notes: blockNotes, description, attachments: files }) => {
            const subject = getSubject(block.subjectCode);
            return (
              <article
                key={block.id}
                className="overflow-hidden rounded-2.5xl border border-slate-200 bg-white shadow-card"
              >
                <div className="h-1.5" style={{ backgroundColor: subject.accent }} />
                <div className="p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => onOpenBlock(block)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <span className="min-w-0">
                      <span
                        className="inline-flex rounded-lg px-2.5 py-1 text-xs font-black"
                        style={{ backgroundColor: subject.background, color: subject.text }}
                      >
                        {subject.code}
                      </span>
                      <span className="mt-2 block truncate text-base font-extrabold text-ink">
                        {subject.name}
                      </span>
                      <span className="mt-1 block text-xs font-semibold capitalize text-muted">
                        {DAY_NAMES[block.dayId].full} · {formatLongDate(block.date)} · {formatSlotRange(block.slotStart, block.slotEnd)}
                        {formatTeachingTimeRange(block.slotStart, block.slotEnd)
                          ? ` · ${formatTeachingTimeRange(block.slotStart, block.slotEnd)}`
                          : ''}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-bold text-slate-400">
                        {block.classId} · Týden {block.weekId}
                      </span>
                    </span>
                    <ExternalLink size={17} className="mt-1 shrink-0 text-slate-400" />
                  </button>

                  {description?.description && (
                    <div className="mt-4 rounded-xl bg-violet-50 p-3.5">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-violet-500">
                        Co máme s sebou
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-violet-950">
                        {description.description}
                      </p>
                    </div>
                  )}

                  {blockNotes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                        <NotebookPen size={15} /> Zápisky ({blockNotes.length})
                      </div>
                      {blockNotes.map((note) => (
                        <p key={note.id} className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm font-medium leading-relaxed text-slate-700">
                          {note.body}
                        </p>
                      ))}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                        <FileText size={15} /> Dokumenty ({files.length})
                      </div>
                      {files.map((attachment) => (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => onOpenAttachment(attachment).catch(() => undefined)}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30"
                        >
                          <FileText size={17} className="shrink-0 text-emerald-600" />
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
                            {attachment.name}
                          </span>
                          <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                            {formatFileSize(attachment.size)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2.5xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-brand">
            <PackageOpen size={22} />
          </span>
          <h2 className="mt-4 text-base font-extrabold text-ink">
            {entries.length ? 'Filtrům neodpovídají žádné materiály' : 'Průzkumník je zatím prázdný'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm font-medium text-muted">
            {entries.length
              ? 'Zkuste odebrat předmět nebo změnit rozsah data.'
              : 'Otevřete hodinu v rozvrhu a přidejte poznámku, popis nebo dokument.'}
          </p>
        </div>
      )}
    </main>
  );
}
