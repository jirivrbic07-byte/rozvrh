import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  Hash,
  MapPin,
  MessageSquarePlus,
  NotebookPen,
  Save,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { getSubject, TEACHERS } from '../data/catalog';
import { formatNumberRange } from '../lib/parser';
import {
  DAY_NAMES,
  formatLongDate,
  formatSlotRange,
  formatTeachingTimeRange,
} from '../lib/schedule';
import type {
  AttachmentRecord,
  NoteRecord,
  ScheduleBlock,
} from '../types';

interface BlockModalProps {
  block: ScheduleBlock;
  notes: NoteRecord[];
  attachments: AttachmentRecord[];
  description: string;
  onClose: () => void;
  onAddNote: (body: string) => Promise<void>;
  onSaveDescription: (description: string) => Promise<void>;
  onUploadAttachment: (
    file: File,
    onProgress: (progress: number) => void,
  ) => Promise<void>;
  onOpenAttachment: (attachment: AttachmentRecord) => Promise<void>;
}

const formatSavedAt = (value: string) =>
  new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export function BlockModal({
  block,
  notes,
  attachments,
  description,
  onClose,
  onAddNote,
  onSaveDescription,
  onUploadAttachment,
  onOpenAttachment,
}: BlockModalProps) {
  const subject = getSubject(block.subjectCode);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [noteValue, setNoteValue] = useState('');
  const [descriptionSaved, setDescriptionSaved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const blockNotes = useMemo(
    () => notes.filter((note) => note.blockId === block.id),
    [block.id, notes],
  );
  const blockAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.blockId === block.id),
    [attachments, block.id],
  );

  useEffect(() => {
    setDescriptionValue(description);
    setNoteValue('');
    setDescriptionSaved(false);
    setUploadProgress(null);
    setUploadError('');
  }, [block.id, description]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const saveDescription = async () => {
    await onSaveDescription(descriptionValue);
    setDescriptionSaved(true);
    window.setTimeout(() => setDescriptionSaved(false), 1800);
  };

  const addNote = async () => {
    if (!noteValue.trim()) return;
    await onAddNote(noteValue);
    setNoteValue('');
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadProgress(0);
    try {
      await onUploadAttachment(file, setUploadProgress);
      setUploadProgress(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Dokument se nepodařilo nahrát.',
      );
      setUploadProgress(null);
    } finally {
      input.value = '';
    }
  };

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
        aria-labelledby="block-title"
        className="modal-enter max-h-[94vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-modal sm:max-w-3xl sm:rounded-[28px]"
      >
        <div
          className="relative overflow-hidden px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7"
          style={{ backgroundColor: subject.background }}
        >
          <span
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ backgroundColor: subject.accent }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/75 text-slate-500 ring-1 ring-black/5 transition hover:bg-white hover:text-slate-800"
            aria-label="Zavřít detail"
          >
            <X size={20} />
          </button>
          <div className="pr-12">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-lg bg-white/75 px-2.5 py-1 text-xs font-black tracking-wider ring-1 ring-black/5"
                style={{ color: subject.text }}
              >
                {subject.code}
              </span>
              <span className="text-xs font-bold text-slate-500">{block.classId}</span>
            </div>
            <h2 id="block-title" className="mt-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
              {subject.name}
            </h2>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-600">
              {formatLongDate(block.date)}
            </p>
          </div>
        </div>

        <div className="max-h-[calc(94vh-150px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <InfoCard icon={<Clock3 size={17} />} label="Čas v rozvrhu">
              {formatSlotRange(block.slotStart, block.slotEnd)}
              {formatTeachingTimeRange(block.slotStart, block.slotEnd)
                ? ` · ${formatTeachingTimeRange(block.slotStart, block.slotEnd)}`
                : ''}
            </InfoCard>
            {block.hours.length > 0 && (
              <InfoCard icon={<Hash size={17} />} label="Výukový blok">
                Čísla hodin {formatNumberRange(block.hours)}
              </InfoCard>
            )}
            {block.teachers.length > 0 && (
              <InfoCard icon={<Users size={17} />} label="Vyučující">
                {block.teachers
                  .map((code) => `${TEACHERS[code]?.name ?? code} (${code})`)
                  .join(', ')}
              </InfoCard>
            )}
            {block.location && (
              <InfoCard icon={<MapPin size={17} />} label="Místo">
                {block.location}
              </InfoCard>
            )}
            {block.note && (
              <InfoCard icon={<BookOpen size={17} />} label="Poznámka v rozvrhu">
                {block.note}
              </InfoCard>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <NotebookPen size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-ink">Co máme s sebou</h3>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  Trvalý popis pro tento konkrétní blok výuky.
                </p>
              </div>
            </div>
            <textarea
              value={descriptionValue}
              onChange={(event) => setDescriptionValue(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Např. služební opasek, psací potřeby, sportovní oblečení…"
              className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={saveDescription} className="secondary-button">
                {descriptionSaved ? <Check size={16} /> : <Save size={16} />}
                {descriptionSaved ? 'Uloženo' : 'Uložit popis'}
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-ink">Dokumenty k hodině</h3>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    PDF, DOC nebo DOCX, maximálně 20 MB. Uloží se v tomto zařízení.
                  </p>
                </div>
              </div>
              <label
                className={`secondary-button cursor-pointer ${
                  uploadProgress !== null
                    ? 'pointer-events-none opacity-45'
                    : ''
                }`}
              >
                <Upload size={16} />
                {uploadProgress !== null ? `Nahrávám ${uploadProgress} %` : 'Vložit dokument'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={uploadProgress !== null}
                  onChange={uploadFile}
                />
              </label>
            </div>

            {uploadProgress !== null && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {uploadError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700">
                {uploadError}
              </p>
            )}

            {blockAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {blockAttachments.map((attachment) => (
                  <button
                    type="button"
                    key={attachment.id}
                    onClick={() => onOpenAttachment(attachment).catch(() => undefined)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      <FileText size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-700">
                        {attachment.name}
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-400">
                        {formatFileSize(attachment.size)}
                      </span>
                    </span>
                    <ExternalLink size={16} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-ink">Moje poznámky</h3>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  {blockNotes.length
                    ? `${blockNotes.length} uložených poznámek k tomuto bloku`
                    : 'Zatím tu není žádná poznámka'}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-brand">
                {blockNotes.length}
              </span>
            </div>

            {blockNotes.length > 0 && (
              <div className="mt-3 space-y-2">
                {blockNotes.map((note) => (
                  <article key={note.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                      {note.body}
                    </p>
                    <time className="mt-2 block text-[11px] font-semibold text-slate-400">
                      {formatSavedAt(note.createdAt)}
                    </time>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Nová poznámka</span>
                <textarea
                  value={noteValue}
                  onChange={(event) => setNoteValue(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Napsat novou poznámku…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-blue-50"
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') addNote();
                  }}
                />
              </label>
              <button
                type="button"
                onClick={addNote}
                disabled={!noteValue.trim()}
                className="primary-button h-11 shrink-0"
              >
                <MessageSquarePlus size={17} />
                Přidat poznámku
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
  return `${(size / (1024 * 1024)).toLocaleString('cs-CZ', {
    maximumFractionDigits: 1,
  })} MB`;
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
        <span className="mt-1 block text-sm font-bold leading-snug text-slate-700">{children}</span>
      </span>
    </div>
  );
}
