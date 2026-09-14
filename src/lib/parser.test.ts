import { describe, expect, it } from 'vitest';
import { parseScheduleCell } from './parser';

describe('parseScheduleCell', () => {
  it('parses two teachers and multiple PC rooms', () => {
    expect(parseScheduleCell('AIT Kou,Maz 017, 029 7-8')).toEqual({
      subjectCode: 'AIT',
      teachers: ['Kou', 'Maz'],
      location: '017, 029',
      hours: [7, 8],
    });
  });

  it('parses a practical location and a longer range', () => {
    expect(parseScheduleCell('PPZ Šaf,Jad Areál Suchý nácvik 1-6')).toEqual({
      subjectCode: 'PPZ',
      teachers: ['Šaf', 'Jad'],
      location: 'Areál Suchý nácvik',
      hours: [1, 2, 3, 4, 5, 6],
    });
  });

  it('keeps the text between location and number range as a note', () => {
    expect(parseScheduleCell('SPP Uhe Aula přednáška NOC 13-14')).toEqual({
      subjectCode: 'SPP',
      teachers: ['Uhe'],
      location: 'Aula',
      hours: [13, 14],
      note: 'přednáška NOC',
    });
  });

  it('handles organisational events without a subject code', () => {
    expect(parseScheduleCell('Nájezd etapy, školení')).toEqual({
      subjectCode: 'EVENT',
      teachers: [],
      location: '',
      hours: [],
      note: 'Nájezd etapy, školení',
    });
  });
});
