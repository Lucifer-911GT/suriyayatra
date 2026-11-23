import { describe, expect, it } from 'vitest';
import {
  toJdn, fromJdn, isValidYmd, thaiDay, toThaiLunar, fromThaiLunar, positions, longitude, position,
  fromThaiTime, fromDate, ingresses, retrogrades, signChanges, birthWeekday, ascendant, ascendantFromSun,
  risingSchedule, endOfDay, DEFAULT_MAX_DAYS, VALIDATED_RANGES, momentDate, type Body, type RetrogradeBody,
} from '../src/index.js';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('calendar dates are checked', () => {
  it.each([
    ['30 February', d(2026, 2, 30)],
    ['29 February in a common year', d(2026, 2, 29)],
    ['month 13', d(2026, 13, 1)],
    ['day 0', d(2026, 1, 0)],
    ['NaN year', d(NaN, 1, 1)],
    ['fractional year', d(2026.5, 1, 1)],
    ['fractional day', d(2026, 1, 1.5)],
  ])('%s is refused', (_, ymd) => {
    expect(isValidYmd(ymd)).toBe(false);
    expect(() => toJdn(ymd)).toThrow(RangeError);
    expect(() => positions(ymd)).toThrow(RangeError);
    expect(() => toThaiLunar(ymd)).toThrow(RangeError);
  });
  it('real days pass, leap days included', () => {
    expect(isValidYmd(d(2024, 2, 29))).toBe(true);
    expect(isValidYmd(d(2000, 2, 29))).toBe(true);
    expect(isValidYmd(d(1900, 2, 29))).toBe(false);
    expect(fromJdn(toJdn(d(2024, 2, 29)))).toEqual(d(2024, 2, 29));
  });
  it('fromJdn needs a whole number', () => {
    expect(() => fromJdn(2461000.5)).toThrow(RangeError);
  });
  it('an invalid Date is refused', () => {
    expect(() => thaiDay(new Date('x'))).toThrow(RangeError);
    expect(() => toThaiLunar(new Date('x'))).toThrow(RangeError);
    expect(() => fromDate(new Date('x'))).toThrow(RangeError);
  });
  it('fromThaiLunar checks the phase and day', () => {
    expect(() => fromThaiLunar({ cs: 1388, month: 12, phase: 'full' as never, day: 1 })).toThrow(RangeError);
    expect(() => fromThaiLunar({ cs: 1388, month: 12, phase: 'waxing', day: 16 })).toThrow(RangeError);
    expect(() => fromThaiLunar({ cs: 1388, month: 12, phase: 'waxing', day: 1.5 })).toThrow(RangeError);
  });
  it('error messages do not echo the input', () => {
    expect(() => toThaiLunar(d(1700, 1, 1))).toThrow(/outside 1250–1600/);
    expect(() => toThaiLunar(d(1700, 1, 1))).not.toThrow(/1062/);
  });
});

describe('moments and clock times are checked', () => {
  const jdn = toJdn(d(2026, 11, 17));
  it.each([[-5], [1441], [2000], [10.5], [NaN]])('minute %s is refused', (minute) => {
    expect(() => longitude('sun', { jdn, minute })).toThrow(RangeError);
    expect(() => positions({ jdn, minute })).toThrow(RangeError);
  });
  it('0 and 1440 are fine', () => {
    expect(() => positions({ jdn, minute: 0 })).not.toThrow();
    expect(() => positions({ jdn, minute: 1440 })).not.toThrow();
  });
  it('fractional jdn is refused', () => {
    expect(() => longitude('moon', { jdn: jdn + 0.5, minute: 0 })).toThrow(RangeError);
  });
  it('Thai clock time must be 00:00–24:00', () => {
    expect(() => fromThaiTime(d(2026, 11, 17), 25, 0)).toThrow(RangeError);
    expect(() => fromThaiTime(d(2026, 11, 17), 24, 1)).toThrow(RangeError);
    expect(() => fromThaiTime(d(2026, 11, 17), 10, 60)).toThrow(RangeError);
    expect(momentDate(fromThaiTime(d(2026, 11, 17), 24, 0))).toEqual({ ...d(2026, 11, 17), minute: 1422 });
  });
  it('unknown bodies are refused, not ignored', () => {
    expect(() => longitude('pluto' as Body, endOfDay(d(2026, 11, 17)))).toThrow(RangeError);
    expect(() => signChanges(d(2026, 11, 17), ['pluto' as Body])).toThrow(RangeError);
    expect(() => ingresses('pluto' as Body, d(2026, 11, 1), d(2026, 11, 2))).toThrow(RangeError);
    expect(() => retrogrades('sun' as RetrogradeBody, d(2026, 1, 1), d(2026, 2, 1))).toThrow(RangeError);
  });
  it('position needs a finite number', () => {
    expect(() => position(NaN)).toThrow(RangeError);
  });
});

describe('spans are limited', () => {
  it('about ten years by default', () => {
    expect(DEFAULT_MAX_DAYS).toBe(3660);
    expect(() => ingresses('sun', d(2000, 1, 1), d(2050, 1, 1))).toThrow(/maxDays/);
    expect(() => retrogrades('mercury', d(1950, 1, 1), d(2050, 1, 1))).toThrow(/maxDays/);
  });
  it('can be raised on purpose', () => {
    expect(retrogrades('jupiter', d(2000, 1, 1), d(2020, 1, 1), { maxDays: 8000 }).length).toBeGreaterThan(15);
  });
  it('options are checked', () => {
    expect(() => retrogrades('mars', d(2026, 1, 1), d(2026, 2, 1), { gapDays: -1 })).toThrow(RangeError);
    expect(() => retrogrades('mars', d(2026, 1, 1), d(2026, 2, 1), { minDays: 0 })).toThrow(RangeError);
    expect(() => ingresses('mars', d(2026, 1, 1), d(2026, 2, 1), { maxDays: 0 })).toThrow(RangeError);
    expect(() => ingresses('mars', d(2026, 1, 1), d(2026, 2, 1), { settleMinutes: NaN })).toThrow(RangeError);
  });
});

describe('birth time, ascendant', () => {
  it('birth time must be 00:00–23:59', () => {
    expect(() => birthWeekday(d(2026, 11, 18), 24, 0)).toThrow(RangeError);
    expect(() => birthWeekday(d(2026, 11, 18), 10, 60)).toThrow(RangeError);
    expect(() => birthWeekday(d(2026, 11, 18), 10, 0, 2000)).toThrow(RangeError);
    expect(birthWeekday(d(2026, 11, 18), 23, 59).dayTh).toBe('พุธกลางคืน');
  });
  it('ascendant checks its inputs', () => {
    expect(() => ascendantFromSun(NaN, 10)).toThrow(RangeError);
    expect(() => ascendantFromSun(0, Infinity)).toThrow(RangeError);
    expect(() => ascendant({ at: endOfDay(d(2026, 11, 17)), sunrise: 1440 })).toThrow(RangeError);
    expect(() => risingSchedule(endOfDay(d(2026, 11, 17)), 360, [1, 2, 3])).toThrow(RangeError);
  });
});

it('validated ranges are exported', () => {
  expect(VALIDATED_RANGES.positions).toEqual({ fromBe: 2300, toBe: 2700 });
  expect(VALIDATED_RANGES.lunarCalendar).toEqual({ fromBe: 2539, toBe: 2574 });
});
