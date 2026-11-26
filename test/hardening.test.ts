import { describe, expect, it } from 'vitest';
import {
  buddhistHolyDays, eraYear, endOfDay, fromThaiLunar, holyDays, ingresses, monthsOf, planetLongitude,
  ruleYearType, settleIngresses, toThaiLunar, yearType, HOLY_DAYS_BE_RANGE, MAX_CS, MAX_SETTLE_MINUTES,
  type ClassicalPlanet,
} from '../src/index.js';

const d = (year: number, month: number, day: number) => ({ year, month, day });
// The Sun enters พิจิก at 09:44 (UTC+06:42) on this day.
const SUN_INGRESS_DAY = d(2026, 11, 17);

describe('ingresses: settleMinutes is bounded', () => {
  it('0 and the default both keep the change on the requested day', () => {
    expect(ingresses('sun', SUN_INGRESS_DAY, SUN_INGRESS_DAY)).toHaveLength(1);
    expect(ingresses('sun', SUN_INGRESS_DAY, SUN_INGRESS_DAY, { settleMinutes: 0 })).toHaveLength(1);
    expect(ingresses('sun', SUN_INGRESS_DAY, SUN_INGRESS_DAY, { settleMinutes: MAX_SETTLE_MINUTES })).toHaveLength(1);
  });
  it.each([[-1], [-1440], [MAX_SETTLE_MINUTES + 1], [3e8], [NaN], [Infinity]])('%s is refused', (settleMinutes) => {
    expect(() => ingresses('sun', SUN_INGRESS_DAY, SUN_INGRESS_DAY, { settleMinutes })).toThrow(RangeError);
  });
  it('settleIngresses treats NaN as no settling', () => {
    const events = ingresses('sun', SUN_INGRESS_DAY, SUN_INGRESS_DAY);
    expect(settleIngresses(events, NaN)).toEqual(events);
  });
});

describe('planetLongitude only accepts its own planets', () => {
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])('%s is a RangeError', (name) => {
    expect(() => planetLongitude(name as ClassicalPlanet, endOfDay(d(2026, 1, 1)))).toThrow(RangeError);
  });
  it('real planets still work', () => {
    expect(planetLongitude('venus', endOfDay(d(2026, 1, 1)))).toBeGreaterThanOrEqual(0);
  });
});

describe('year arithmetic checks its input', () => {
  it.each([[-5], [1.5], [NaN]])('eraYear(%s) is refused', (cs) => {
    expect(() => eraYear(cs)).toThrow(RangeError);
  });
  it.each([[NaN], [1.5], [1249], [1601]])('yearType / ruleYearType / monthsOf(%s) are refused', (cs) => {
    expect(() => yearType(cs)).toThrow(RangeError);
    expect(() => ruleYearType(cs)).toThrow(RangeError);
    expect(() => monthsOf(cs)).toThrow(RangeError);
  });
  it('fromThaiLunar refuses a year out of range', () => {
    expect(() => fromThaiLunar({ cs: 1601, month: 5, phase: 'waxing', day: 1 })).toThrow(RangeError);
  });
});

describe('edges of the supported range', () => {
  it('January–March after CE 2238 still belong to the last lunar year', () => {
    const l = toThaiLunar(d(2239, 1, 15));
    expect(l.cs).toBe(MAX_CS);
    expect(fromThaiLunar(l)).toEqual(d(2239, 1, 15));
  });
  it('a date after the last lunar year is a RangeError', () => {
    expect(() => toThaiLunar(d(2239, 12, 1))).toThrow(RangeError);
  });
  it('buddhistHolyDays covers HOLY_DAYS_BE_RANGE and refuses outside it', () => {
    expect(HOLY_DAYS_BE_RANGE).toEqual({ fromBe: 2432, toBe: 2781 });
    expect(() => buddhistHolyDays(HOLY_DAYS_BE_RANGE.fromBe)).not.toThrow();
    expect(() => buddhistHolyDays(HOLY_DAYS_BE_RANGE.toBe)).not.toThrow();
    for (const be of [2431, 2782, 2569.5, NaN]) expect(() => buddhistHolyDays(be)).toThrow(/2432–2781/);
  });
});

describe('holyDays', () => {
  it('takes maxDays like the other span functions', () => {
    expect(() => holyDays(d(2026, 1, 1), d(2026, 12, 31), { maxDays: 30 })).toThrow(RangeError);
    expect(holyDays(d(2026, 11, 1), d(2026, 11, 30), { maxDays: 30 })).toHaveLength(4);
    expect(() => holyDays(d(2026, 11, 1), d(2026, 11, 30), { maxDays: 0 })).toThrow(RangeError);
  });
  it('is still empty when `to` is before `from`', () => {
    expect(holyDays(d(2026, 11, 30), d(2026, 11, 1))).toEqual([]);
  });
  it('checks maxDays even when the span is empty', () => {
    expect(() => holyDays(d(2026, 11, 30), d(2026, 11, 1), { maxDays: -1 })).toThrow(RangeError);
  });
});
