import {
  DAY_NAMES,
  HOUR_SLOTS,
  HOUR_TIME_MARKERS,
  formatShortDate,
  isToday,
} from '../lib/schedule';
import type {
  AttachmentRecord,
  NoteRecord,
  ScheduleBlock,
  ScheduleWeek,
} from '../types';
import { ScheduleBlockCard } from './ScheduleBlockCard';

interface DesktopScheduleProps {
  week: ScheduleWeek;
  blocks: ScheduleBlock[];
  notes: NoteRecord[];
  attachments: AttachmentRecord[];
  onBlockClick: (block: ScheduleBlock) => void;
}

export function DesktopSchedule({
  week,
  blocks,
  notes,
  attachments,
  onBlockClick,
}: DesktopScheduleProps) {
  return (
    <div className="hidden overflow-hidden rounded-2.5xl border border-slate-200 bg-white shadow-card lg:block">
      <div className="overflow-x-auto">
        <div
          className="schedule-grid relative min-w-[1040px]"
          style={{
            gridTemplateColumns: '80px repeat(5, minmax(182px, 1fr))',
            gridTemplateRows: '68px repeat(11, 72px)',
          }}
        >
          <div className="z-10 grid place-items-center border-b border-r border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            Hodina
          </div>

          {week.days.map((day) => (
            <div
              key={day.id}
              className={`z-10 flex items-center justify-center gap-3 border-b border-r border-slate-200 px-3 text-center last:border-r-0 ${
                isToday(day.date) ? 'bg-blue-50/80' : 'bg-slate-50'
              }`}
            >
              <span
                className={`grid size-9 place-items-center rounded-xl text-sm font-black ${
                  isToday(day.date) ? 'bg-brand text-white shadow-md shadow-blue-200' : 'bg-white text-ink ring-1 ring-slate-200'
                }`}
              >
                {DAY_NAMES[day.id].short}
              </span>
              <span className="text-left">
                <span className="block text-sm font-extrabold text-ink">
                  {DAY_NAMES[day.id].full}
                </span>
                <span className="block text-[11px] font-semibold text-muted">
                  {formatShortDate(day.date)}
                  {isToday(day.date) ? ' · dnes' : ''}
                </span>
              </span>
            </div>
          ))}

          {HOUR_SLOTS.map((hour, hourIndex) => (
            <div
              key={`hour-${hour}`}
              className={`z-[1] flex flex-col items-center justify-center border-b border-r border-slate-200 text-slate-500 ${
                hour === 6 ? 'bg-amber-50/80' : 'bg-slate-50/70'
              }`}
              style={{ gridColumn: 1, gridRow: hourIndex + 2 }}
            >
              <span className="text-sm font-black">{hour}</span>
              {HOUR_TIME_MARKERS[hour] && (
                <span className={`mt-0.5 text-[9px] font-extrabold ${hour === 6 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {HOUR_TIME_MARKERS[hour]}
                </span>
              )}
            </div>
          ))}

          {week.days.flatMap((day, dayIndex) =>
            HOUR_SLOTS.map((hour, hourIndex) => (
              <div
                key={`${day.id}-${hour}`}
                className={`border-b border-r border-slate-200 ${
                  hour === 6
                    ? 'bg-amber-50/40'
                    : isToday(day.date)
                      ? 'bg-blue-50/20'
                      : 'bg-white'
                }`}
                style={{ gridColumn: dayIndex + 2, gridRow: hourIndex + 2 }}
              />
            )),
          )}

          {blocks.map((block) => {
            const dayIndex = week.days.findIndex((day) => day.id === block.dayId);
            const span = Math.max(1, block.slotEnd - block.slotStart + 1);
            const noteCount = notes.filter((note) => note.blockId === block.id).length;
            return (
              <div
                key={block.id}
                className="z-20 p-1.5"
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: `${block.slotStart + 2} / span ${span}`,
                }}
              >
                <ScheduleBlockCard
                  block={block}
                  noteCount={noteCount}
                  attachmentCount={attachments.filter(
                    (attachment) => attachment.blockId === block.id,
                  ).length}
                  onClick={() => onBlockClick(block)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
