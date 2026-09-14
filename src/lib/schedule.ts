import { applyScheduleOverride } from '../data/scheduleOverrides';
import type {
  DayId,
  RawScheduleBlock,
  ScheduleBlock,
  ScheduleData,
  ScheduleDay,
  ScheduleWeek,
} from '../types';
import { parseScheduleCell } from './parser';

const runtimeGlobal = globalThis as typeof globalThis & {
  __SCHEDULE_DATA__?: ScheduleData;
};

export let scheduleData: ScheduleData = runtimeGlobal.__SCHEDULE_DATA__ ?? {
  source: '',
  classes: [],
  weeks: [],
};

export const setScheduleData = (data: ScheduleData) => {
  scheduleData = data;
  runtimeGlobal.__SCHEDULE_DATA__ = data;
};

export const DAY_NAMES: Record<DayId, { short: string; full: string }> = {
  mon: { short: 'Po', full: 'Pondělí' },
  tue: { short: 'Út', full: 'Úterý' },
  wed: { short: 'St', full: 'Středa' },
  thu: { short: 'Čt', full: 'Čtvrtek' },
  fri: { short: 'Pá', full: 'Pátek' },
};

export const HOUR_SLOTS = Array.from({ length: 11 }, (_, index) => index);

export const DAY_TIMING_ITEMS = [
  { label: 'Ranní nástup', time: '7:05', kind: 'assembly' },
  { label: '0.–1. hodina', time: '7:30–9:00', kind: 'lesson' },
  { label: '2.–3. hodina', time: '9:15–10:45', kind: 'lesson' },
  { label: '4.–5. hodina', time: '11:00–12:30', kind: 'lesson' },
  { label: '6. hodina', time: 'Pauza na oběd', kind: 'break' },
  { label: 'Odpolední nástup', time: '13:25', kind: 'assembly' },
  { label: '7.–8. hodina', time: '13:45–15:15', kind: 'lesson' },
] as const;

const SLOT_START_TIMES: Partial<Record<number, string>> = {
  0: '7:30',
  2: '9:15',
  4: '11:00',
  7: '13:45',
};

const SLOT_END_TIMES: Partial<Record<number, string>> = {
  1: '9:00',
  3: '10:45',
  5: '12:30',
  8: '15:15',
};

export const HOUR_TIME_MARKERS: Partial<Record<number, string>> = {
  0: '7:30',
  1: '9:00',
  2: '9:15',
  3: '10:45',
  4: '11:00',
  5: '12:30',
  6: 'oběd',
  7: '13:45',
  8: '15:15',
};

export const formatTeachingTimeRange = (start: number, end: number) => {
  const startTime = SLOT_START_TIMES[start];
  const endTime = SLOT_END_TIMES[end];
  return startTime && endTime ? `${startTime}–${endTime}` : undefined;
};

const parseLocalDate = (value: string) => new Date(`${value}T12:00:00`);

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric' }).format(
    parseLocalDate(value),
  );

export const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(value));

export const formatWeekRange = (week: ScheduleWeek) =>
  `${formatShortDate(week.startDate)}–${formatShortDate(week.endDate)}`;

export const isToday = (value: string) => {
  const today = new Date();
  const key = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return value === key;
};

export const getDefaultWeekId = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const matchingWeek = scheduleData.weeks.find((week) => {
    const start = parseLocalDate(week.startDate);
    const end = parseLocalDate(week.endDate);
    return today >= start && today <= end;
  });
  return matchingWeek?.id ?? scheduleData.weeks[0].id;
};

export const getDay = (week: ScheduleWeek, dayId: DayId): ScheduleDay => {
  const day = week.days.find((item) => item.id === dayId);
  if (!day) throw new Error(`Den ${dayId} v týdnu ${week.id} neexistuje.`);
  return day;
};

export const hydrateBlock = (
  rawBlock: RawScheduleBlock,
  classId: string,
  week: ScheduleWeek,
): ScheduleBlock => ({
  ...rawBlock,
  ...parseScheduleCell(rawBlock.raw),
  classId,
  weekId: week.id,
  date: getDay(week, rawBlock.dayId).date,
});

export const getBlocks = (week: ScheduleWeek, classId: string) =>
  (week.schedules[classId] ?? []).flatMap((block) => {
    const currentBlock = applyScheduleOverride(block);
    return currentBlock ? [hydrateBlock(currentBlock, classId, week)] : [];
  });

export const findBlock = (blockId: string) => {
  for (const week of scheduleData.weeks) {
    for (const classId of scheduleData.classes) {
      const rawBlock = week.schedules[classId]?.find((block) => block.id === blockId);
      if (rawBlock) {
        const currentBlock = applyScheduleOverride(rawBlock);
        return currentBlock ? hydrateBlock(currentBlock, classId, week) : undefined;
      }
    }
  }
  return undefined;
};

export const formatSlotRange = (start: number, end: number) =>
  start === end ? `${start}. hodina` : `${start}.–${end}. hodina`;
