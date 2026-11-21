/**
 * Buddhist holy days of the Thai calendar for a Buddhist-era year (พ.ศ.).
 * In an อธิกมาส year Makha and Visakha Bucha move one month later and
 * Asalha Bucha / Khao Phansa fall in the second เดือน 8.
 */
import { beToCs } from './era.js';
import { fromJdn, toJdn, type YMD } from './julian.js';
import { fromThaiLunar, toThaiLunar, yearStartJdn, yearType, type ThaiLunarDate } from './lunar.js';

export interface BuddhistHolyDays {
  makhaBucha: YMD;    // ขึ้น 15 ค่ำ เดือน 3 (เดือน 4 in an อธิกมาส year)
  visakhaBucha: YMD;  // ขึ้น 15 ค่ำ เดือน 6 (เดือน 7)
  asalhaBucha: YMD;   // ขึ้น 15 ค่ำ เดือน 8 (8 หลัง)
  khaoPhansa: YMD;    // แรม 1 ค่ำ เดือน 8 (8 หลัง)
  okPhansa: YMD;      // ขึ้น 15 ค่ำ เดือน 11
  loyKrathong: YMD;   // ขึ้น 15 ค่ำ เดือน 12
}

export function buddhistHolyDays(be: number): BuddhistHolyDays {
  const cs = beToCs(be);
  const leap = yearType(cs) === 'adhikamas';
  const full = (c: number, month: number, second = false) => fromThaiLunar({ cs: c, month, secondEighth: second, phase: 'waxing', day: 15 });
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

/** Every วันพระ (holy day) from `from` to `to`, inclusive. */
export function holyDays(from: YMD, to: YMD): { date: YMD; lunar: ThaiLunarDate }[] {
  const out: { date: YMD; lunar: ThaiLunarDate }[] = [];
  for (let j = toJdn(from); j <= toJdn(to); j++) {
    const date = fromJdn(j);
    const lunar = toThaiLunar(date);
    if (lunar.holyDay) out.push({ date, lunar });
  }
  return out;
}

export { yearStartJdn };
