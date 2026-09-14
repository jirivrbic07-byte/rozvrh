import { useMemo, useState } from 'react';
import { BookOpen, CalendarOff, Info, Layers3 } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { BlockModal } from './components/BlockModal';
import { DesktopSchedule } from './components/DesktopSchedule';
import { DailyRhythm } from './components/DailyRhythm';
import { ExplorerPanel } from './components/ExplorerPanel';
import { LegendModal } from './components/LegendModal';
import { MobileSchedule } from './components/MobileSchedule';
import { NotesPanel } from './components/NotesPanel';
import { ScheduleControls } from './components/ScheduleControls';
import { SUBJECTS, TEACHERS } from './data/catalog';
import { useNotes } from './hooks/useNotes';
import {
  formatWeekRange,
  getBlocks,
  getDefaultWeekId,
  scheduleData,
} from './lib/schedule';
import type { ScheduleBlock } from './types';

type View = 'schedule' | 'notes' | 'explorer';

const CLASS_STORAGE_KEY = 'rozvrh-zop-selected-class';
const WEEK_STORAGE_KEY = 'rozvrh-zop-selected-week';

const getStoredValue = (key: string, fallback: string, allowed: string[]) => {
  try {
    const value = localStorage.getItem(key);
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const storeValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Selection remains active for the current page session.
  }
};

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase('cs-CZ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const blockMatches = (block: ScheduleBlock, search: string) => {
  if (!search.trim()) return true;
  const subject = SUBJECTS[block.subjectCode] ?? SUBJECTS.EVENT;
  const teachers = block.teachers.map((code) => TEACHERS[code]?.name ?? code).join(' ');
  return normalizeSearch(
    `${block.raw} ${block.subjectCode} ${subject.name} ${teachers} ${block.location} ${block.note ?? ''}`,
  ).includes(normalizeSearch(search));
};

export default function App() {
  const classIds = scheduleData.classes;
  const weekIds = scheduleData.weeks.map((week) => week.id);
  const [activeView, setActiveView] = useState<View>('schedule');
  const [selectedClass, setSelectedClassState] = useState(() =>
    getStoredValue(CLASS_STORAGE_KEY, classIds.includes('III/3A/2026') ? 'III/3A/2026' : classIds[0], classIds),
  );
  const [selectedWeekId, setSelectedWeekIdState] = useState(() =>
    getStoredValue(WEEK_STORAGE_KEY, getDefaultWeekId(), weekIds),
  );
  const [search, setSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [activeBlock, setActiveBlock] = useState<ScheduleBlock | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const {
    notes,
    descriptions,
    attachments,
    syncMode,
    addNote,
    saveDescription,
    uploadAttachment,
    openAttachment,
  } = useNotes();

  const selectedWeek =
    scheduleData.weeks.find((week) => week.id === selectedWeekId) ?? scheduleData.weeks[0];
  const allBlocks = useMemo(
    () => getBlocks(selectedWeek, selectedClass),
    [selectedClass, selectedWeek],
  );
  const visibleBlocks = useMemo(
    () => allBlocks.filter((block) => blockMatches(block, search)),
    [allBlocks, search],
  );
  const teachingBlocks = allBlocks.filter(block => block.subjectCode !== 'EVENT');
  const scheduledSlots = teachingBlocks.reduce(
    (total, block) => total + block.slotEnd - block.slotStart + 1,
    0,
  );

  const selectClass = (classId: string) => {
    setSelectedClassState(classId);
    storeValue(CLASS_STORAGE_KEY, classId);
    setActiveBlock(null);
  };

  const selectWeek = (weekId: string) => {
    setSelectedWeekIdState(weekId);
    storeValue(WEEK_STORAGE_KEY, weekId);
    setActiveBlock(null);
  };

  const openBlockFromNotes = (block: ScheduleBlock) => {
    selectClass(block.classId);
    selectWeek(block.weekId);
    setActiveBlock(block);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        activeView={activeView}
        noteCount={notes.length}
        syncMode={syncMode}
        onViewChange={setActiveView}
        onOpenLegend={() => setLegendOpen(true)}
      />

      {activeView === 'schedule' ? (
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <ScheduleControls
            classes={classIds}
            classrooms={scheduleData.classrooms}
            weeks={scheduleData.weeks}
            selectedClass={selectedClass}
            selectedWeekId={selectedWeek.id}
            search={search}
            onClassChange={selectClass}
            onWeekChange={selectWeek}
            onSearchChange={setSearch}
          />

          <DailyRhythm />

          <div className="mb-4 mt-2 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">
                  {selectedClass}
                </p>
                {scheduleData.classrooms?.[selectedClass] && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                    uč. {scheduleData.classrooms[selectedClass]}
                  </span>
                )}
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-brand">
                  {formatWeekRange(selectedWeek)}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                {selectedWeek.label}
              </h1>
              <p className="mt-1 text-sm font-medium text-muted">
                {search
                  ? `${visibleBlocks.length} výsledků pro „${search}“`
                  : allBlocks.length
                    ? `${teachingBlocks.length} výukových bloků · ${scheduledSlots} hodin výuky${allBlocks.length > teachingBlocks.length ? ` · ${allBlocks.length - teachingBlocks.length} organizačních bloků` : ''}`
                    : 'Pro tuto třídu není v týdnu naplánovaná výuka.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLegendOpen(true)}
              className="secondary-button md:hidden"
            >
              <BookOpen size={16} />
              Legenda
            </button>
          </div>

          {allBlocks.length && (!search || visibleBlocks.length) ? (
            <>
              <DesktopSchedule
                week={selectedWeek}
                blocks={visibleBlocks}
                notes={notes}
                attachments={attachments}
                onBlockClick={setActiveBlock}
              />
              <MobileSchedule
                week={selectedWeek}
                blocks={visibleBlocks}
                notes={notes}
                attachments={attachments}
                onBlockClick={setActiveBlock}
              />
              <div className="mt-4 flex items-start gap-2 px-1 text-[11px] font-medium leading-relaxed text-slate-400">
                <Info size={14} className="mt-px shrink-0" />
                <p>
                  Poloha karty určuje hodinu dne. Označení „č.“ v kartě přebírá čísla výukového bloku z původního rozvrhu.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2.5xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-card">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                {search ? <Layers3 size={24} /> : <CalendarOff size={24} />}
              </span>
              <h2 className="mt-4 text-base font-extrabold text-ink">
                {search ? 'Žádný blok neodpovídá hledání' : 'Tento týden je bez výuky'}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm font-medium text-muted">
                {search
                  ? 'Zkuste jinou zkratku předmětu, jméno vyučujícího nebo učebnu.'
                  : 'Vyberte jiný týden nebo jinou třídu.'}
              </p>
            </div>
          )}
        </main>
      ) : activeView === 'notes' ? (
        <NotesPanel
          notes={notes}
          syncMode={syncMode}
          search={noteSearch}
          onSearchChange={setNoteSearch}
          onOpenBlock={openBlockFromNotes}
        />
      ) : (
        <ExplorerPanel
          notes={notes}
          descriptions={descriptions}
          attachments={attachments}
          onOpenBlock={openBlockFromNotes}
          onOpenAttachment={openAttachment}
        />
      )}

      {activeBlock && (
        <BlockModal
          block={activeBlock}
          notes={notes}
          attachments={attachments}
          description={descriptions[activeBlock.id]?.description ?? ''}
          onClose={() => setActiveBlock(null)}
          onAddNote={(body) => addNote(activeBlock, body)}
          onSaveDescription={(description) => saveDescription(activeBlock.id, description)}
          onUploadAttachment={(file, onProgress) =>
            uploadAttachment(activeBlock, file, onProgress).then(() => undefined)
          }
          onOpenAttachment={openAttachment}
        />
      )}

      {legendOpen && <LegendModal onClose={() => setLegendOpen(false)} />}
    </div>
  );
}
