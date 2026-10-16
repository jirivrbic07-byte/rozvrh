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
    expect(scheduleData.weeks.map((week) => week.id)).toEqual(
      expect.arrayContaining(['40', '41', '42', '43', '44']),
    );
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

describe('listopadový rozvrh', () => {
  it('obsahuje týdny 45–48 včetně nových kurzů', () => {
    expect(scheduleData.weeks.slice(-4).map((week) => week.id)).toEqual([
      '45',
      '46',
      '47',
      '48',
    ]);
    expect(scheduleData.weeks.find((week) => week.id === '45')?.startDate).toBe(
      '2026-11-02',
    );
    expect(scheduleData.weeks.find((week) => week.id === '48')?.endDate).toBe(
      '2026-11-27',
    );
    expect(scheduleData.classes).toEqual(
      expect.arrayContaining([
        'IS ETŘ-Z-12A',
        'PSZ-18A',
        'SZZ-5A',
        'SZZ-6A',
        'TECC LE-5A',
        'TECC LE-6A',
      ]),
    );
    expect(scheduleData.classrooms).toMatchObject({
      'IS ETŘ-Z-12A': '16',
      'PSZ-18A': '6A-P2',
    });
  });

  it('má ve 47. týdnu dovolenou v pondělí a volné úterý', () => {
    const week47 = scheduleData.weeks.find((week) => week.id === '47');
    const blocks = week47 ? getBlocks(week47, 'ZOP BS-3A') : [];
    expect(blocks.some((block) => block.dayId === 'mon' && block.raw.includes('dovolená'))).toBe(
      true,
    );
    expect(blocks.some((block) => block.dayId === 'tue')).toBe(false);
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
