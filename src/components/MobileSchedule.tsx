import { CalendarOff } from 'lucide-react';
import { DAY_NAMES, formatShortDate, isToday } from '../lib/schedule';
import type {
  AttachmentRecord,
  NoteRecord,
  ScheduleBlock,
  ScheduleWeek,
} from '../types';
import { ScheduleBlockCard } from './ScheduleBlockCard';

interface MobileScheduleProps {
  week: ScheduleWeek;
  blocks: ScheduleBlock[];
  notes: NoteRecord[];
  attachments: AttachmentRecord[];
  onBlockClick: (block: ScheduleBlock) => void;
}

export function MobileSchedule({
  week,
  blocks,
  notes,
  attachments,
  onBlockClick,
}: MobileScheduleProps) {
  return (
    <div className="space-y-4 lg:hidden">
      {week.days.map((day) => {
        const dayBlocks = blocks
          .filter((block) => block.dayId === day.id)
          .sort((a, b) => a.slotStart - b.slotStart);
        return (
          <section
            key={day.id}
            className={`overflow-hidden rounded-2.5xl border bg-white shadow-card ${
              isToday(day.date) ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-200'
            }`}
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl text-sm font-black ${
                    isToday(day.date) ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {DAY_NAMES[day.id].short}
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-ink">
                    {DAY_NAMES[day.id].full}
                  </span>
                  <span className="block text-xs font-semibold text-muted">
                    {formatShortDate(day.date)} {isToday(day.date) ? '· dnes' : ''}
                  </span>
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {dayBlocks.length} {dayBlocks.length === 1 ? 'blok' : dayBlocks.length < 5 ? 'bloky' : 'bloků'}
              </span>
            </header>
            <div className="space-y-2.5 p-3">
              {dayBlocks.length ? (
                dayBlocks.map((block) => (
                  <ScheduleBlockCard
                    key={block.id}
                    block={block}
                    variant="mobile"
                    noteCount={notes.filter((note) => note.blockId === block.id).length}
                    attachmentCount={attachments.filter(
                      (attachment) => attachment.blockId === block.id,
                    ).length}
                    onClick={() => onBlockClick(block)}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-slate-400">
                  <CalendarOff size={18} />
                  Bez výuky
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
