import { SUBJECTS, TEACHERS } from '../data/catalog';
import type { ParsedScheduleCell } from '../types';

const subjectCodes = Object.keys(SUBJECTS)
  .filter((code) => code !== 'EVENT')
  .sort((a, b) => b.length - a.length);

const locationPatterns: Array<{ pattern: RegExp; value: string }> = [
  {
    pattern: /FZŠ\s+Sosnová\s*\/\s*Polygon\s+VZ\s+Praha/iu,
    value: 'FZŠ Sosnová / Polygon VZ Praha',
  },
  {
    pattern: /FZŠ\s+Příbram\s*\/\s*Polygon\s+VZ\s+Praha/iu,
    value: 'FZŠ Příbram / Polygon VZ Praha',
  },
  {
    pattern: /DBA\s*-\s*Praha\s+venkov\s+východ\s+Vinoř/iu,
    value: 'DBA – Praha-venkov Vinoř',
  },
  { pattern: /DBA\s*-\s*Kladno/iu, value: 'DBA – Kladno' },
  { pattern: /DBA\s*-\s*Nymburk/iu, value: 'DBA – Nymburk' },
  { pattern: /Areál\s+Suchý\s+nácvik/iu, value: 'Areál Suchý nácvik' },
  { pattern: /Vzdělávací\s+centrum/iu, value: 'Vzdělávací centrum' },
  { pattern: /b?\.?6A\s*-\s*PC/iu, value: 'b.6A - PC' },
  { pattern: /Hloubětín/iu, value: 'Hloubětín' },
  { pattern: /Kněžmost/iu, value: 'Kněžmost' },
  { pattern: /Kladno/iu, value: 'Kladno' },
  { pattern: /Aula/iu, value: 'Aula' },
  { pattern: /S33/iu, value: 'S33' },
];

const normalize = (value: string) =>
  value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();

const expandRange = (start: number, end: number) => {
  if (end < start || end - start > 250) return [start, end];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const cleanupNote = (value: string) =>
  value
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s*\.\s*/g, ' ')
    .replace(/^[,\s–—-]+|[,\s–—-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

export function parseScheduleCell(rawValue: string): ParsedScheduleCell {
  const raw = normalize(rawValue);
  const subjectMatch = raw.match(
    new RegExp(`^(${subjectCodes.map((code) => code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:\\s|$)`, 'u'),
  );
  const subjectCode = subjectMatch?.[1] ?? 'EVENT';
  let remainder = subjectMatch ? raw.slice(subjectMatch[0].length).trim() : raw;

  const hoursMatch = remainder.match(/(?:^|\s)(\d{1,3})\s*[-–—]\s*(\d{1,3})\s*$/u);
  const hours = hoursMatch
    ? expandRange(Number(hoursMatch[1]), Number(hoursMatch[2]))
    : [];
  if (hoursMatch?.index !== undefined) {
    remainder = remainder.slice(0, hoursMatch.index).trim();
  }

  const possibleTeachers = remainder.match(
    /^([\p{L}]{2,4}(?:\s*,\s*[\p{L}]{2,4})*)(?:\s+|$)/u,
  );
  const teacherCodes = possibleTeachers
    ? possibleTeachers[1].split(',').map((code) => code.trim())
    : [];
  const teachers = teacherCodes.filter((code) => Boolean(TEACHERS[code]));
  if (possibleTeachers && teachers.length === teacherCodes.length) {
    remainder = remainder.slice(possibleTeachers[0].length).trim();
  }

  const locations: string[] = [];
  for (const { pattern, value } of locationPatterns) {
    if (pattern.test(remainder)) {
      locations.push(value);
      remainder = remainder.replace(pattern, ' ');
    }
  }

  const roomMatches = remainder.match(/\b(?:016|017|028|029|425)\b/gu) ?? [];
  if (roomMatches.length) {
    locations.push(...roomMatches);
    remainder = remainder.replace(/\b(?:016|017|028|029|425)\b/gu, ' ');
  }

  const distinctLocations = [...new Set(locations)];
  const pcRooms = distinctLocations.filter((item) => /^(?:0\d\d|425)$/.test(item));
  const namedLocations = distinctLocations.filter((item) => !pcRooms.includes(item));
  const location = [...namedLocations, ...(pcRooms.length ? [pcRooms.join(', ')] : [])].join(', ');
  const note = cleanupNote(remainder);

  return {
    subjectCode,
    teachers,
    location,
    hours,
    ...(note ? { note } : {}),
  };
}

export const formatNumberRange = (numbers: number[]) => {
  if (!numbers.length) return '';
  if (numbers.length === 1) return String(numbers[0]);
  return `${numbers[0]}–${numbers[numbers.length - 1]}`;
};
