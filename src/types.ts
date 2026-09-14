export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface SubjectDefinition {
  code: string;
  name: string;
  background: string;
  border: string;
  text: string;
  accent: string;
}

export interface TeacherDefinition {
  code: string;
  name: string;
}

export interface ParsedScheduleCell {
  subjectCode: string;
  teachers: string[];
  location: string;
  hours: number[];
  note?: string;
}

export interface RawScheduleBlock {
  id: string;
  dayId: DayId;
  slotStart: number;
  slotEnd: number;
  raw: string;
}

export interface ScheduleDay {
  id: DayId;
  date: string;
}

export interface ScheduleWeek {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  days: ScheduleDay[];
  schedules: Record<string, RawScheduleBlock[]>;
}

export interface ScheduleData {
  source: string;
  classes: string[];
  weeks: ScheduleWeek[];
}

export interface ScheduleBlock extends RawScheduleBlock, ParsedScheduleCell {
  classId: string;
  weekId: string;
  date: string;
}

export interface NoteRecord {
  id: string;
  blockId: string;
  classId: string;
  weekId: string;
  dayId: DayId;
  date: string;
  subjectCode: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockDescription {
  blockId: string;
  description: string;
  updatedAt: string;
}

export interface AttachmentRecord {
  id: string;
  blockId: string;
  classId: string;
  weekId: string;
  dayId: DayId;
  date: string;
  subjectCode: string;
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export type SyncMode = 'connecting' | 'cloud' | 'local';
