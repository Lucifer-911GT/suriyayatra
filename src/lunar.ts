/**
 * The Thai lunar calendar (ปฏิทินจันทรคติไทย) as the suriyayatra rules lay it
 * out, year by year from เดือน 5 (Caitra) to เดือน 4.
 *
 * Year types:
 *   ปกติมาส       354 days
 *   อธิกวาร       355 days — เดือน 7 gets a 30th day
 *   อธิกมาส       384 days — a second เดือน 8 (๘๘) of 30 days
 *
 * Rules (Eade 2000; Faraut via pythaidate):
 *   - อธิกมาส when the tithi at เถลิงศก is > 24 or < 6, except: tithi 24
 *     followed by 6 next year is อธิกมาส; tithi 25 followed by 5 is not.
 *   - อธิกวาร when กัมมัชพล ≤ 207 (solar leap year) and อวมาน ≤ 126, or
 *     กัมมัชพล > 207 and อวมาน ≤ 137.
 *   - A year cannot be both: the extra day passes to the next year.
 *   - Official exceptions (OFFICIAL_YEAR_TYPES) override the rules where the
 *     published calendar differs.
 */
import { eraYear } from './era.js';
import { fromJdn, toJdn, toYmd, type YMD } from './julian.js';

export type YearType = 'normal' | 'adhikawan' | 'adhikamas';

export const YEAR_LENGTH: Record<YearType, number> = { normal: 354, adhikawan: 355, adhikamas: 384 };

/**
 * Years where the published Thai calendar departs from the rules.
 * CS 1376 (พ.ศ. 2557): the rules give อธิกวาร (อวมาน exactly 137), but
 * the holy days of 2539–2557 and 2558–2569 are only consistent with a
 * 354-day year here.
 */
export const OFFICIAL_YEAR_TYPES: Readonly<Record<number, YearType>> = {
  1376: 'normal',
};

/**
 * Anchor: วันอาสาฬหบูชา 2562 (ขึ้น 15 ค่ำ เดือน 8, CS 1381, a ปกติมาส year)
 * fell on 16 July 2019; 1 ขึ้น เดือน 5 is 102 days earlier.
 */
const ANCHOR_CS = 1381;
const ANCHOR_START = toJdn({ year: 2019, month: 7, day: 16 }) - 102;

/** Supported range of Chula Sakarat years (about 1888–2238 CE). */
export const MIN_CS = 1250;
export const MAX_CS = 1600;

function ruleFlags(cs: number) {
  const y = eraYear(cs);
  const next = eraYear(cs + 1).tithi;
  let mas = y.tithi > 24 || y.tithi < 6;
  if (y.tithi === 24 && next === 6) mas = true;
  if (y.tithi === 25 && next === 5) mas = false;
  const solarLeap = y.kammacaphon <= 207;
  const wan = solarLeap ? y.avoman <= 126 : y.avoman <= 137;
  return { mas, wan };
}

const typeCache = new Map<number, YearType>();

/** Year type by the rules alone (no official exceptions), including a carried day. */
export function ruleYearType(cs: number): YearType {
  // the carried extra day only looks back a few years
  let carry = false;
  let type: YearType = 'normal';
  for (let c = cs - 6; c <= cs; c++) {
    const flags = ruleFlags(c);
    const extraDay: boolean = flags.wan || carry;
    carry = flags.mas && extraDay;
    type = flags.mas ? 'adhikamas' : extraDay ? 'adhikawan' : 'normal';
  }
  return type;
}

/** Year type as published: the rules, then the official exceptions. */
export function yearType(cs: number): YearType {
  const hit = typeCache.get(cs);
  if (hit) return hit;
  const t = OFFICIAL_YEAR_TYPES[cs] ?? ruleYearType(cs);
  typeCache.set(cs, t);
  return t;
}

function checkRange(cs: number) {
  if (!Number.isInteger(cs) || cs < MIN_CS || cs > MAX_CS) {
    throw new RangeError(`Chula Sakarat year ${cs} is outside ${MIN_CS}–${MAX_CS}`);
  }
}

const startCache = new Map<number, number>([[ANCHOR_CS, ANCHOR_START]]);

/** JDN of 1 ขึ้น ค่ำ เดือน 5 that opens lunar year `cs`. */
export function yearStartJdn(cs: number): number {
  checkRange(cs);
  const hit = startCache.get(cs);
  if (hit !== undefined) return hit;
  let jdn = ANCHOR_START;
  if (cs > ANCHOR_CS) for (let c = ANCHOR_CS; c < cs; c++) jdn += YEAR_LENGTH[yearType(c)];
  else for (let c = ANCHOR_CS - 1; c >= cs; c--) jdn -= YEAR_LENGTH[yearType(c)];
  startCache.set(cs, jdn);
  return jdn;
}

export interface LunarMonth {
  /** 1–12; the second เดือน 8 is 8 with `second: true`. */
  month: number;
  second: boolean;
  /** 29 (เดือนขาด) or 30 (เดือนเต็ม). */
  days: 29 | 30;
}

/** The months of lunar year `cs`, from เดือน 5 to เดือน 4. */
export function monthsOf(cs: number): LunarMonth[] {
  const t = yearType(cs);
  const m = (month: number, days: 29 | 30, second = false): LunarMonth => ({ month, second, days });
  return [
    m(5, 29), m(6, 30), m(7, t === 'adhikawan' ? 30 : 29), m(8, 30),
    ...(t === 'adhikamas' ? [m(8, 30, true)] : []),
    m(9, 29), m(10, 30), m(11, 29), m(12, 30), m(1, 29), m(2, 30), m(3, 29), m(4, 30),
  ];
}

export interface ThaiLunarDate {
  /** Lunar year (from เดือน 5) by its Chula Sakarat number. */
  cs: number;
  month: number;
  /** The second เดือน 8 (เดือนแปดหลัง) of an อธิกมาส year. */
  secondEighth: boolean;
  /** ข้างขึ้น (waxing) or ข้างแรม (waning). */
  phase: 'waxing' | 'waning';
  /** 1–15 (ค่ำ). */
  day: number;
  /** Days in this month: 29 ends at แรม 14 ค่ำ. */
  monthDays: 29 | 30;
  /** วันพระ: ขึ้น 8, ขึ้น 15, แรม 8, and the last day of the month. */
  holyDay: boolean;
  /** e.g. "แรม 12 ค่ำ เดือน 5", "ขึ้น 15 ค่ำ เดือน 8 หลัง". */
  label: string;
}

const MONTH_NAME: Record<number, string> = { 1: 'อ้าย', 2: 'ยี่' };

export function monthLabel(month: number, secondEighth = false): string {
  if (secondEighth) return 'เดือน 8 หลัง';
  return MONTH_NAME[month] ? `เดือน${MONTH_NAME[month]}` : `เดือน ${month}`;
}

/** Gregorian day (or Date, read as Thai time) → Thai lunar date. */
export function toThaiLunar(input: Date | YMD): ThaiLunarDate {
  const jdn = toJdn(toYmd(input));
  // the lunar year starts in March–April of CE year cs + 638
  let cs = toYmd(input).year - 638;
  if (yearStartJdn(cs) > jdn) cs -= 1;
  let off = jdn - yearStartJdn(cs);
  for (const m of monthsOf(cs)) {
    if (off < m.days) {
      const d = off + 1;
      const phase = d <= 15 ? 'waxing' : 'waning';
      const day = d <= 15 ? d : d - 15;
      const holyDay = d === 8 || d === 15 || d === 23 || d === m.days;
      const label = `${phase === 'waxing' ? 'ขึ้น' : 'แรม'} ${day} ค่ำ ${monthLabel(m.month, m.second)}`;
      return { cs, month: m.month, secondEighth: m.second, phase, day, monthDays: m.days, holyDay, label };
    }
    off -= m.days;
  }
  throw new Error('unreachable');
}

/** Thai lunar date → Gregorian day. */
export function fromThaiLunar(d: { cs: number; month: number; secondEighth?: boolean; phase: 'waxing' | 'waning'; day: number }): YMD {
  let off = 0;
  for (const m of monthsOf(d.cs)) {
    if (m.month === d.month && m.second === Boolean(d.secondEighth)) {
      const n = d.phase === 'waxing' ? d.day : d.day + 15;
      if (d.day < 1 || d.day > 15 || n > m.days) throw new RangeError(`no ${d.phase} ${d.day} in that month`);
      return fromJdn(yearStartJdn(d.cs) + off + n - 1);
    }
    off += m.days;
  }
  throw new RangeError(`lunar year ${d.cs} has no month ${d.month}${d.secondEighth ? ' (second)' : ''}`);
}

/** ชวด (rat) … กุน (pig). */
export const YEAR_ANIMALS_TH = ['ชวด', 'ฉลู', 'ขาล', 'เถาะ', 'มะโรง', 'มะเส็ง', 'มะเมีย', 'มะแม', 'วอก', 'ระกา', 'จอ', 'กุน'] as const;

/**
 * Year animal (ปีนักษัตร) by the Thai lunar year: it changes at ขึ้น 1 ค่ำ เดือน 5,
 * not at เถลิงศก nor at the Chinese New Year. Returns 0 = ชวด … 11 = กุน.
 */
export function yearAnimal(input: Date | YMD): { index: number; th: string; cs: number } {
  const { cs } = toThaiLunar(input);
  const index = (cs + 10) % 12;
  return { index, th: YEAR_ANIMALS_TH[index], cs };
}
