import { MapPin, MessageSquareText, Paperclip, Users } from 'lucide-react';
import { getSubject } from '../data/catalog';
import { formatNumberRange, parseScheduleCell } from '../lib/parser';
import { formatSlotRange, formatTeachingTimeRange } from '../lib/schedule';
import type { ScheduleBlock } from '../types';

interface ScheduleBlockCardProps {
  block: ScheduleBlock;
  noteCount: number;
  attachmentCount?: number;
  variant?: 'desktop' | 'mobile';
  onClick: () => void;
}

export function ScheduleBlockCard({
  block,
  noteCount,
  attachmentCount = 0,
  variant = 'desktop',
  onClick,
}: ScheduleBlockCardProps) {
  const subject = getSubject(block.subjectCode);
  const span = block.slotEnd - block.slotStart + 1;
  const lessonRange = formatNumberRange(block.hours);
  const parsedLabel = parseScheduleCell(block.raw);
  const isRoomy = variant === 'mobile' || span >= 3;
  const teachingTime = formatTeachingTimeRange(block.slotStart, block.slotEnd);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`subject-card group relative w-full overflow-hidden text-left ${
        variant === 'desktop' ? 'h-full min-h-0 p-2.5' : 'min-h-[104px] p-4'
      }`}
      style={{
        backgroundColor: subject.background,
        borderColor: subject.border,
        color: subject.text,
        boxShadow: `inset 3px 0 0 ${subject.accent}`,
      }}
      aria-label={`${subject.name}, ${formatSlotRange(block.slotStart, block.slotEnd)}`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className={`${variant === 'mobile' ? 'text-base' : 'text-[13px]'} block font-black tracking-wide`}>
            {subject.code}
          </span>
          {variant === 'mobile' && (
            <span className="mt-0.5 block truncate text-xs font-bold opacity-75">
              {subject.name}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {lessonRange && (
            <span className="rounded-md bg-white/65 px-1.5 py-0.5 text-[9px] font-extrabold ring-1 ring-black/5">
              č. {lessonRange}
            </span>
          )}
          {noteCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-extrabold ring-1 ring-black/5">
              <MessageSquareText size={10} />
              {noteCount}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-extrabold ring-1 ring-black/5">
              <Paperclip size={10} />
              {attachmentCount}
            </span>
          )}
        </span>
      </span>

      <span
        className={`mt-1.5 flex items-center gap-1.5 font-bold opacity-85 ${
          variant === 'mobile' ? 'text-xs' : 'text-[10px]'
        }`}
      >
        <span>
          {formatSlotRange(block.slotStart, block.slotEnd)}
          {teachingTime ? ` · ${teachingTime}` : ''}
        </span>
      </span>

      {block.teachers.length > 0 && (
        <span
          className={`mt-1.5 flex items-center gap-1.5 font-semibold ${
            variant === 'mobile' ? 'text-xs' : 'text-[10px]'
          }`}
        >
          <Users size={variant === 'mobile' ? 13 : 11} className="shrink-0 opacity-70" />
          <span className="truncate">{block.teachers.join(', ')}</span>
        </span>
      )}

      {isRoomy && block.location && (
        <span
          className={`mt-1 flex items-start gap-1.5 font-semibold ${
            variant === 'mobile' ? 'text-xs' : 'text-[10px]'
          }`}
        >
          <MapPin size={variant === 'mobile' ? 13 : 11} className="mt-px shrink-0 opacity-70" />
          <span className="line-clamp-2">{block.location}</span>
        </span>
      )}

      {isRoomy && parsedLabel.note && block.subjectCode === 'EVENT' && (
        <span className="mt-2 block line-clamp-3 text-xs font-bold leading-snug opacity-85">
          {parsedLabel.note}
        </span>
      )}
    </button>
  );
}
