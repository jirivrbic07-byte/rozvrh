import { describe, expect, it } from 'vitest';
import { formatTeachingTimeRange, getBlocks, scheduleData } from './schedule';

describe('časy výukových bloků', () => {
  it('vrací přesný čas pro známé dvojhodiny', () => {
    expect(formatTeachingTimeRange(0, 1)).toBe('7:30–9:00');
    expect(formatTeachingTimeRange(2, 3)).toBe('9:15–10:45');
    expect(formatTeachingTimeRange(4, 5)).toBe('11:00–12:30');
    expect(formatTeachingTimeRange(7, 8)).toBe('13:45–15:15');
  });

  it('spojí navazující známé bloky a nevymýšlí čas 9.–10. hodiny', () => {
    expect(formatTeachingTimeRange(0, 5)).toBe('7:30–12:30');
    expect(formatTeachingTimeRange(9, 10)).toBeUndefined();
  });
});

describe('říjnový rozvrh', () => {
  it('obsahuje týdny 40–44 a třídu III/4A/2026', () => {
    expect(scheduleData.weeks.slice(-5).map((week) => week.id)).toEqual([
      '40',
      '41',
      '42',
      '43',
      '44',
    ]);
    expect(scheduleData.classes).toContain('III/4A/2026');
  });

  it('má pro III/4A/2026 výuku ve všech říjnových týdnech', () => {
    const octoberWeeks = scheduleData.weeks.filter((week) =>
      ['40', '41', '42', '43', '44'].includes(week.id),
    );
    expect(octoberWeeks).toHaveLength(5);
    expect(
      octoberWeeks.every((week) => getBlocks(week, 'III/4A/2026').length > 0),
    ).toBe(true);
  });
});

describe('věrnost zdrojovému rozvrhu', () => {
  it('zachovává všechny zdrojové bloky bez nedoložených ručních změn', () => {
    for (const week of scheduleData.weeks) {
      for (const classId of scheduleData.classes) {
        expect(getBlocks(week, classId).map(({ id, raw, slotStart, slotEnd }) => ({ id, raw, slotStart, slotEnd })))
          .toEqual((week.schedules[classId] ?? []).map(({ id, raw, slotStart, slotEnd }) => ({ id, raw, slotStart, slotEnd })));
      }
    }
  });
});
