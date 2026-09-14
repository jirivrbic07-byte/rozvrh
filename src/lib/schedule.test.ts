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

describe('třídy ze zdrojového Excelu', () => {
  it('nabízí ročníky I, II i III včetně kmenových učeben', () => {
    expect(scheduleData.classes).toEqual(
      expect.arrayContaining([
        'ZOP BS-3A',
        'I/1A/2026',
        'I/5A/2026',
        'II/1A/2026',
        'II/4A/2026',
        'III/1A/2026',
        'III/3A/2026',
        'III/4A/2026',
      ]),
    );
    expect(scheduleData.classrooms).toMatchObject({
      'ZOP BS-3A': '26',
      'I/1A/2026': '18',
      'II/1A/2026': '123',
      'III/3A/2026': '122',
      'III/4A/2026': '25',
    });
  });

  it('sloučí říjnové označení I. ročníku s p. do stejné třídy', () => {
    const week36 = scheduleData.weeks.find((week) => week.id === '36');
    const week40 = scheduleData.weeks.find((week) => week.id === '40');
    expect(week36 && getBlocks(week36, 'I/1A/2026').length > 0).toBe(true);
    expect(week40 && getBlocks(week40, 'I/1A/2026').length > 0).toBe(true);
    expect(scheduleData.classes.some((name) => name.includes(' p.'))).toBe(false);
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
