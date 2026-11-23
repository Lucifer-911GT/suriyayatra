import { describe, expect, it } from 'vitest';
import {
  BODIES, endOfDay, longitude, positions, signChanges, clock, fromThaiTime, fromDate, momentDate,
  totalKammacaphon, eraYear, toJdn, sunLongitude, ascendantFromSun, ascendant, risingSchedule,
  RISING_SAMANYA, birthWeekday, weekday, yearAnimal, ingresses, type Body,
} from '../src/index.js';
import { EPHEMERIS, SIGN_CHANGES_NOV_2569, MOON_SIGN_CHANGES_NOV_2569 } from './ephemeris-data.js';

const ymd = (be: number, month: number, day: number) => ({ year: be - 543, month, day });

describe('positions at 24:00 match the published suriyayatra ephemeris', () => {
  it.each(EPHEMERIS.map((r) => [r.slice(0, 3).join('-'), r]))('%s', (_, r) => {
    const m = endOfDay(ymd(r[0], r[1], r[2]));
    const got = BODIES.map((b) => longitude(b, m));
    expect(got).toEqual(r.slice(3));
  });

  it('covers 2300–2700', () => {
    expect(EPHEMERIS.length).toBeGreaterThan(290);
  });
});

describe('sign changes are found minute by minute, as the ephemeris prints them', () => {
  it('November 2569 planets', () => {
    for (const e of SIGN_CHANGES_NOV_2569) {
      const found = signChanges({ year: 2026, month: 11, day: e.day }, [e.body as Body]);
      expect(found.map((c) => [clock(c.minute), c.to])).toContainEqual([e.time, e.to]);
    }
  });

  it('November 2569 Moon (เวลาจันทร์ยก)', () => {
    MOON_SIGN_CHANGES_NOV_2569.forEach((time, i) => {
      const found = signChanges({ year: 2026, month: 11, day: i + 1 }, ['moon']).map((c) => clock(c.minute));
      expect(found).toEqual(time ? [time] : []);
    });
  });
});

describe('clock', () => {
  it('24:00 of a day is 800·horakhun − 373, i.e. the year’s kammacaphon on เถลิงศก day', () => {
    const y = eraYear(1388);
    const K = totalKammacaphon({ jdn: y.thaloengSokJdn, minute: 1440 });
    expect(K - 1388 * 292207).toBe(y.kammacaphon);
  });

  it('Thai standard time is 18 minutes ahead', () => {
    expect(fromThaiTime({ year: 2026, month: 11, day: 17 }, 10, 2)).toEqual({ jdn: toJdn({ year: 2026, month: 11, day: 17 }), minute: 9 * 60 + 44 });
    // 00:10 Thai time is still the previous day on the UTC+06:42 clock
    expect(momentDate(fromThaiTime({ year: 2026, month: 11, day: 18 }, 0, 10))).toEqual({ year: 2026, month: 11, day: 17, minute: 1432 });
    expect(fromDate(new Date('2026-11-17T02:44:00Z'))).toEqual({ jdn: toJdn({ year: 2026, month: 11, day: 17 }), minute: 9 * 60 + 26 });
  });

  it('positions() takes a plain date as 24:00', () => {
    const p = positions({ year: 2026, month: 11, day: 21 });
    expect([p.sun.signTh, p.sun.degree, p.sun.minute]).toEqual(['พิจิก', 4, 39]);
    expect([p.rahu.signTh, p.rahu.degree, p.rahu.minute]).toEqual(['กุมภ์', 0, 0]);
    expect([p.uranus.signTh, p.uranus.degree, p.uranus.minute]).toEqual(['พฤษภ', 17, 59]);
  });
});

describe('ascendant (อันโตนาที)', () => {
  it('the table sums to one day', () => {
    expect(RISING_SAMANYA.reduce((a, b) => a + b)).toBe(1440);
  });

  it('is the Sun at sunrise and advances one sign per rising time', () => {
    expect(ascendantFromSun(7 * 1800 + 600, 0)).toBe(7 * 1800 + 600);
    // 20° left in พิจิก (6 มหานาที = 144 min) take 96 minutes
    expect(ascendantFromSun(7 * 1800 + 600, 96)).toBeCloseTo(8 * 1800);
    // then all of ธนู (120 min)
    expect(ascendantFromSun(7 * 1800 + 600, 216)).toBeCloseTo(9 * 1800);
    // a full day comes back to the Sun
    expect(ascendantFromSun(7 * 1800 + 600, 1440)).toBeCloseTo(7 * 1800 + 600);
    // before sunrise
    expect(ascendantFromSun(7 * 1800 + 600, -48)).toBeCloseTo(7 * 1800);
  });

  it('a birth before sunrise uses the previous day’s sunrise', () => {
    const d = { year: 2026, month: 11, day: 21 };
    const sunPrev = sunLongitude({ jdn: toJdn(d) - 1, minute: 360 });
    expect(ascendant({ at: { jdn: toJdn(d), minute: 300 } })).toBe(Math.floor(ascendantFromSun(sunPrev, 1380)));
  });

  it('rising schedule of 21 Nov 2569 starts with the Sun’s sign before sunrise', () => {
    const s = risingSchedule(endOfDay({ year: 2026, month: 11, day: 21 }), 362);
    expect(s[0].sign).toBe(7);
    expect(s.map((x) => x.sign)).toEqual([7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6]);
    expect(s[0].start).toBeLessThan(362);
  });
});

describe('birth weekday', () => {
  it('weekday of a date', () => {
    expect(weekday({ year: 2026, month: 11, day: 21 })).toBe(6);
    expect(weekday({ year: 1970, month: 1, day: 1 })).toBe(4);
  });
  it('before 06:00 is the previous day; Wednesday evening is ราหู', () => {
    expect(birthWeekday({ year: 2026, month: 11, day: 21 }, 5, 59)).toMatchObject({ dayTh: 'ศุกร์', previousDay: true });
    expect(birthWeekday({ year: 2026, month: 11, day: 18 }, 18, 0)).toMatchObject({ dayTh: 'พุธกลางคืน', planet: 8 });
    expect(birthWeekday({ year: 2026, month: 11, day: 19 }, 3, 0)).toMatchObject({ dayTh: 'พุธกลางคืน', previousDay: true });
    expect(birthWeekday({ year: 2026, month: 11, day: 18 }, 17, 59)).toMatchObject({ dayTh: 'พุธ', planet: 4 });
    expect(birthWeekday({ year: 2026, month: 11, day: 18 })).toMatchObject({ dayTh: 'พุธ' });
  });
});

describe('year animal changes at ขึ้น 1 ค่ำ เดือน 5', () => {
  it('2569 is ปีมะเมีย from 19 Mar 2569', () => {
    expect(yearAnimal({ year: 2026, month: 11, day: 21 }).th).toBe('มะเมีย');
    expect(yearAnimal({ year: 2026, month: 3, day: 19 }).th).toBe('มะเมีย');
    expect(yearAnimal({ year: 2026, month: 3, day: 18 }).th).toBe('มะเส็ง');
  });
});

describe('ingresses over a span', () => {
  it('agrees with the published November 2569 changes', () => {
    const ev = ingresses(['sun', 'mars', 'mercury', 'rahu'], { year: 2026, month: 11, day: 1 }, { year: 2026, month: 11, day: 30 });
    expect(ev.map((e) => [e.body, momentDate(e.at).day, clock(e.at.minute), e.to])).toEqual(
      SIGN_CHANGES_NOV_2569.map((e) => [e.body, e.day, e.time, e.to]),
    );
  });

  it('merges a boundary flicker into one change (Mars, 19 Mar 2570)', () => {
    const day = { year: 2027, month: 3, day: 19 };
    const raw = [
      ...signChanges({ year: 2027, month: 3, day: 18 }, ['mars']),
      ...signChanges(day, ['mars']),
    ];
    expect(raw.length).toBeGreaterThan(1);
    const ev = ingresses('mars', { year: 2027, month: 3, day: 15 }, { year: 2027, month: 3, day: 25 });
    expect(ev).toHaveLength(1);
    expect([ev[0].from, ev[0].to]).toEqual([4, 3]);
    // the last entry, after which it stays
    expect(clock(ev[0].at.minute)).toBe(clock(raw[raw.length - 1].minute));
  });

  it('keeps real retrograde returns, which last weeks', () => {
    const ev = ingresses('mars', { year: 2026, month: 11, day: 1 }, { year: 2027, month: 5, day: 31 });
    expect(ev.map((e) => e.to)).toEqual([4, 3, 4]);
  });

  it('a year of nine bodies is quick', () => {
    const t = Date.now();
    ingresses(['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu', 'uranus'], { year: 2026, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 });
    expect(Date.now() - t).toBeLessThan(2000);
  });
});
