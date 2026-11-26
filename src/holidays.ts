// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * Buddhist holy days of the Thai calendar for a Buddhist-era year (พ.ศ.).
 * In an อธิกมาส year Makha and Visakha Bucha move one month later and
 * Asalha Bucha / Khao Phansa fall in the second เดือน 8.
 */
import { beToCs, csToBe } from './era.js';
import { fromJdn, toJdn, type YMD } from './julian.js';
import { MAX_CS, MIN_CS, fromThaiLunar, toThaiLunar, yearStartJdn, yearType, type ThaiLunarDate } from './lunar.js';
import { checkSpanLength } from './span.js';

export interface BuddhistHolyDays {
  makhaBucha: YMD;    // ขึ้น 15 ค่ำ เดือน 3 (เดือน 4 in an อธิกมาส year)
  visakhaBucha: YMD;  // ขึ้น 15 ค่ำ เดือน 6 (เดือน 7)
  asalhaBucha: YMD;   // ขึ้น 15 ค่ำ เดือน 8 (8 หลัง)
  khaoPhansa: YMD;    // แรม 1 ค่ำ เดือน 8 (8 หลัง)
  okPhansa: YMD;      // ขึ้น 15 ค่ำ เดือน 11
  loyKrathong: YMD;   // ขึ้น 15 ค่ำ เดือน 12
}

/**
 * Buddhist-era years {@link buddhistHolyDays} accepts. Makha Bucha falls in the lunar year
 * before, so the first year is one later than the lunar calendar's first.
 */
export const HOLY_DAYS_BE_RANGE = Object.freeze({ fromBe: csToBe(MIN_CS + 1), toBe: csToBe(MAX_CS) } as const);

export function buddhistHolyDays(be: number): BuddhistHolyDays {
  const { fromBe, toBe } = HOLY_DAYS_BE_RANGE;
  if (!Number.isInteger(be) || be < fromBe || be > toBe) {
    throw new RangeError(`Buddhist-era year must be a whole number ${fromBe}–${toBe}`);
  }
  const cs = beToCs(be);
  const leap = yearType(cs) === 'adhikamas';
  const full = (c: number, month: number, second = false): YMD =>
    fromThaiLunar({ cs: c, month, secondEighth: second, phase: 'waxing', day: 15 });
  return {
    // month 3/4 belongs to the lunar year that began the April before
    makhaBucha: full(cs - 1, leap ? 4 : 3),
    visakhaBucha: full(cs, leap ? 7 : 6),
    asalhaBucha: full(cs, 8, leap),
    khaoPhansa: fromThaiLunar({ cs, month: 8, secondEighth: leap, phase: 'waning', day: 1 }),
    okPhansa: full(cs, 11),
    loyKrathong: full(cs, 12),
  };
}

export interface HolyDay {
  date: YMD;
  lunar: ThaiLunarDate;
}

export interface HolyDaysOptions {
  /**
   * Longest span accepted, in days. Default: no limit of its own — the supported lunar
   * years (about 350) already bound the work, and the whole range takes tens of milliseconds.
   */
  maxDays?: number;
}

/** Every วันพระ (holy day) from `from` to `to`, inclusive. Empty when `to` is before `from`. */
export function holyDays(from: YMD, to: YMD, options?: HolyDaysOptions | null): HolyDay[] {
  const { maxDays = Infinity } = options ?? {};
  const a = toJdn(from);
  const b = toJdn(to);
  checkSpanLength(a, b, maxDays); // checks maxDays even when the span is empty
  if (b < a) return [];
  const out: HolyDay[] = [];
  for (let j = a; j <= b; j++) {
    const date = fromJdn(j);
    const lunar = toThaiLunar(date);
    if (lunar.holyDay) out.push({ date, lunar });
  }
  return out;
}

export { yearStartJdn };
