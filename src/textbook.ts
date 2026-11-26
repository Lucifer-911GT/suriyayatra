// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * ฤกษ์ไทยตามตำรา — the textbook day rules of a calendar day.
 *
 * - กาลโยค: the year's ธงชัย / อธิบดี / อุบาทว์ / โลกาวินาศ weekdays from the Chula Sakarat
 *   year; the set changes on the day of เถลิงศก (not 1 January or 13 April).
 * - ดิถี: weekday × ค่ำ tables (five good, nineteen bad), the same for ข้างขึ้น and ข้างแรม.
 *   Where the books differ (Thursday ดิถีมหาสิทธิโชค: 3 or 7 ค่ำ) this follows
 *   หลวงวิศาลดรุณกร, คัมภีร์โหราศาสตร์ไทยมาตรฐาน: 3 ค่ำ.
 * - Strong bans: ดิถีมหาสูญ by the Sun's sign at 06:00 (ปฏิทิน อ.ทองเจือ อ่างแก้ว), วันทรธึก,
 *   อายกรรมพลาย ตติยะ, กระทิงวัน (weekday, ค่ำ and month all equal), วันดับ (last day of the
 *   lunar month) and วันศูนย์ (the Sun changing sign during the day).
 * - ฤกษ์บน: the Moon's นักษัตร through the day ({@link moonNakshatras}).
 *
 * The facts only; how much weight each one gets is left to the caller.
 */
import { MINUTES_PER_DAY, fromThaiTime, moonLongitude, sunLongitude } from './astro.js';
import { weekday, type Weekday } from './birthday.js';
import { eraYear } from './era.js';
import { MAX_ABS_YEAR, toJdn, type YMD } from './julian.js';
import { toThaiLunar } from './lunar.js';
import { mod } from './math.js';
import { REUK_GROUPS, type ReukGroup } from './natal.js';

export type KalaKey = 'thongchai' | 'athibodi' | 'ubat' | 'lokawinat';

export const KALA_TH: Readonly<Record<KalaKey, string>> = Object.freeze({
  thongchai: 'วันธงชัย', athibodi: 'วันอธิบดี', ubat: 'วันอุบาทว์', lokawinat: 'วันโลกาวินาศ',
});

/** A remainder of ÷7 as a weekday: 1 = Sunday … 0 = Saturday. */
const wd = (k: number) => mod(k - 1, 7) as Weekday;

/** The year's กาลโยค weekdays for a Chula Sakarat year. */
export function kalayok(cs: number): Record<KalaKey, Weekday> {
  if (!Number.isInteger(cs) || cs < 0 || cs > MAX_ABS_YEAR) throw new RangeError(`A Chula Sakarat year must be a whole number 0–${MAX_ABS_YEAR}`);
  return { thongchai: wd(cs * 10 + 3), athibodi: wd(cs % 498), ubat: wd(cs * 10 + 2), lokawinat: wd(cs + 1120) };
}

/** The Chula Sakarat year of a calendar day, changing on the day of เถลิงศก. */
export function csOfDay(date: YMD): number {
  const jdn = toJdn(date);
  const cs = date.year - 638;
  return jdn >= eraYear(cs).thaloengSokJdn ? cs : cs - 1;
}

export type GoodDithi = 'amrit' | 'sitthi' | 'mahasitthi' | 'chai' | 'racha';
/** Good ดิถี: the ค่ำ for each weekday, Sunday first. */
export const GOOD_DITHI: Readonly<Record<GoodDithi, { th: string; kham: readonly number[] }>> = Object.freeze({
  amrit: Object.freeze({ th: 'ดิถีอำมฤตโชค', kham: Object.freeze([8, 3, 9, 2, 4, 1, 5]) }),
  sitthi: Object.freeze({ th: 'ดิถีสิทธิโชค', kham: Object.freeze([11, 5, 14, 10, 9, 11, 4]) }),
  mahasitthi: Object.freeze({ th: 'ดิถีมหาสิทธิโชค', kham: Object.freeze([14, 12, 13, 4, 3, 10, 15]) }),
  chai: Object.freeze({ th: 'ดิถีชัยโชค', kham: Object.freeze([8, 3, 11, 10, 4, 1, 11]) }),
  racha: Object.freeze({ th: 'ดิถีราชาโชค', kham: Object.freeze([6, 3, 9, 6, 10, 1, 5]) }),
});

/**
 * Bad ดิถี: the ค่ำ for each weekday, Sunday first.
 *
 * ยมขันธ์ and พิฆาต have the same row, [12, 11, 7, 3, 6, 8, 9]. This is not a copying slip: the
 * owner checked it against the book (26 Nov 2569), so a day in that row carries both names.
 * Some Lanna and ฤกษ์พรหมประสิทธิ์ texts give พิฆาต (there also called มหาศูนย์) as
 * [12, 11, 7, 5, 6, 9, 8] instead, differing on Wednesday, Friday and Saturday. This table follows
 * the standard book; that variant is not used. See SOURCES.md.
 */
export const BAD_DITHI: Readonly<Record<string, readonly number[]>> = Object.freeze({
  ทักทิน: Object.freeze([1, 4, 5, 9, 5, 3, 7]), ทรธึก: Object.freeze([4, 6, 1, 3, 8, 3, 1]),
  ยมขันธ์: Object.freeze([12, 11, 7, 3, 6, 8, 9]), ทัคธทิน: Object.freeze([12, 11, 10, 7, 8, 3, 6]),
  อัคนิโรธ: Object.freeze([4, 6, 1, 3, 3, 9, 1]), ทินกาล: Object.freeze([1, 2, 10, 3, 1, 6, 6]),
  ทินศูร: Object.freeze([12, 10, 15, 8, 5, 3, 8]), กาลโชค: Object.freeze([4, 6, 1, 3, 8, 9, 10]),
  กาลสูร: Object.freeze([4, 2, 7, 5, 8, 3, 6]), กาลทัณฑ์: Object.freeze([12, 11, 10, 9, 8, 7, 6]),
  โลกาวินาศ: Object.freeze([4, 6, 10, 9, 8, 9, 1]), วินาศ: Object.freeze([4, 5, 6, 6, 8, 8, 9]),
  พิลา: Object.freeze([6, 10, 8, 7, 12, 9, 12]), มฤตยู: Object.freeze([9, 1, 10, 9, 8, 7, 6]),
  บอด: Object.freeze([7, 8, 4, 7, 1, 14, 11]), กาลทิน: Object.freeze([5, 6, 10, 8, 11, 5, 7]),
  พิฆาต: Object.freeze([12, 11, 7, 3, 6, 8, 9]), ทินสูรย์: Object.freeze([5, 2, 8, 3, 1, 9, 8]),
  กาลกรรณี: Object.freeze([5, 6, 15, 8, 1, 2, 10]),
});

/** ดิถีมหาสูญ by the Sun's sign (เมษ … มีน), ปฏิทิน อ.ทองเจือ. */
const MAHASUN_SUN = [6, 4, 8, 6, 10, 8, 12, 10, 2, 12, 4, 2];
/** ดิถีมหาสูญ by lunar month (พรหมชาติ) — a second version, reported but not a ban here. */
const MAHASUN_MONTH: Record<number, number> = { 1: 2, 4: 2, 2: 12, 11: 12, 3: 4, 6: 4, 5: 6, 8: 6, 7: 8, 10: 8, 9: 10, 12: 10 };
/** วันทรธึก by lunar month. */
const TRATHUEK: Record<number, number> = { 5: 7, 6: 7, 7: 7, 8: 8, 9: 8, 10: 8, 11: 9, 12: 9, 1: 9, 2: 4, 3: 4, 4: 4 };
/** อายกรรมพลาย by lunar month: the ค่ำ of ปฐม, ทุติยะ, ตติยะ (worse in that order). */
const AYAKAM: Record<number, readonly [number, number, number]> = {
  3: [4, 5, 6], 7: [4, 5, 6], 4: [1, 2, 3], 10: [1, 2, 3], 5: [13, 14, 15], 11: [13, 14, 15],
  6: [10, 11, 12], 8: [6, 7, 8], 9: [3, 4, 5], 12: [2, 3, 4], 1: [9, 10, 11], 2: [7, 8, 9],
};
/** ดิถีอัคนิโรธ by ค่ำ: the one undertaking to avoid that day. */
const AKKHANIROTH = ['ซื้อสัตว์เลี้ยงใหญ่', 'เข้าป่า', 'เดินทางทางน้ำ', 'ขึ้นเขา', 'แบ่งเขตที่ดิน', 'ปลูกบ้าน ขึ้นบ้านใหม่',
  'พิธีใหญ่', 'ออกรถ ซื้อพาหนะ', 'ขุดหลุมลงเสา', 'เรือ', 'เพาะปลูก', 'เรื่องคู่ครอง', 'เรื่องคู่ครอง', 'บวช', 'บวงสรวง'];

export type BanKey = 'mahasun' | 'trathuek' | 'ayakam' | 'krathing' | 'dab' | 'sun';
export interface Ban { key: BanKey; th: string }

export interface ThaiDayRules {
  /** Chula Sakarat year in force (changes at เถลิงศก). */
  cs: number;
  /** The year's กาลโยค weekdays. */
  kalayok: Record<KalaKey, Weekday>;
  /** The กาลโยค falling on this day. */
  kala: KalaKey[];
  good: GoodDithi[];
  /** Bad ดิถี (BAD_DITHI names), plus the milder อายกรรมพลาย ปฐม / ทุติยะ and กระทิงวัน. */
  bad: string[];
  /** Strong bans: no auspicious undertaking that day. */
  bans: Ban[];
  /** ดิถีอัคนิโรธ: what to avoid that day. */
  akkhaniroth: string;
  /** ดิถีมหาสูญ by the lunar month (พรหมชาติ version), not counted as a ban. */
  mahasunMonth: boolean;
  /** ดิถีเรียงหมอน, the wedding days. */
  riangmon: boolean;
}

/** ดิถีเรียงหมอน (ดิถีแมลงปอ): ขึ้น 7, 10, 13 · แรม 4, 8, 10, 14 ค่ำ. */
export function isRiangmon(waxing: boolean, kham: number): boolean {
  return waxing ? [7, 10, 13].includes(kham) : [4, 8, 10, 14].includes(kham);
}

const sunSignAt = (date: YMD, hour: number) => Math.floor(sunLongitude(fromThaiTime(date, hour, 0)) / 1800);

/** The textbook facts of a calendar day (Thai date). */
export function thaiDayRules(date: YMD): ThaiDayRules {
  const day = weekday(date);
  const t = toThaiLunar(date);
  const kham = t.day;
  const lm = t.month; // เดือน 8 หลัง counts as 8
  const cs = csOfDay(date);
  const year = kalayok(cs);
  const kala = (Object.keys(year) as KalaKey[]).filter((k) => year[k] === day);
  const good = (Object.keys(GOOD_DITHI) as GoodDithi[]).filter((k) => GOOD_DITHI[k].kham[day] === kham);
  const bad = Object.keys(BAD_DITHI).filter((k) => BAD_DITHI[k][day] === kham);
  const bans: Ban[] = [];

  if (MAHASUN_SUN[sunSignAt(date, 6)] === kham) bans.push({ key: 'mahasun', th: 'ดิถีมหาสูญ' });
  if (TRATHUEK[lm] === kham) bans.push({ key: 'trathuek', th: 'วันทรธึก' });
  const ayakam = AYAKAM[lm].indexOf(kham);
  if (ayakam === 2) bans.push({ key: 'ayakam', th: 'อายกรรมพลาย (ตติยะ)' });
  else if (ayakam >= 0) bad.push(ayakam === 0 ? 'อายกรรมพลาย (ปฐม)' : 'อายกรรมพลาย (ทุติยะ)');

  // กระทิงวัน: the weekday number (อาทิตย์ = 1 … เสาร์ = 7, then 8 = อาทิตย์ …) equal to the ค่ำ and/or the month.
  const wdKham = kham <= 12 && mod(kham - 1, 7) === day;
  const monthKham = lm === kham;
  if (wdKham && monthKham && mod(lm - 1, 7) === day) bans.push({ key: 'krathing', th: 'กระทิงวัน' });
  else if (wdKham || monthKham) bad.push('กระทิงวัน');

  // Independent facts: a day can be both วันดับ and วันศูนย์.
  if (t.phase === 'waning' && kham === t.monthDays - 15) bans.push({ key: 'dab', th: 'วันดับ' });
  if (sunSignAt(date, 0) !== sunSignAt(date, 24)) bans.push({ key: 'sun', th: 'วันศูนย์' });

  return {
    cs, kalayok: year, kala, good, bad, bans,
    akkhaniroth: AKKHANIROTH[kham - 1],
    mahasunMonth: MAHASUN_MONTH[lm] === kham,
    riangmon: isRiangmon(t.phase === 'waxing', kham),
  };
}

export interface NakshatraSpan {
  /** นักษัตร 1–27. */
  nakshatra: number;
  reuk: ReukGroup;
  /** Minutes of the day on the UTC+06:42 clock, the one Thai almanacs print. */
  from: number;
  to: number;
}

/**
 * ฤกษ์บน: the Moon's นักษัตร through a day, from 00:00 to 24:00 on the UTC+06:42 clock (convert
 * with THAI_TIME_OFFSET_MINUTES for Thai time). The Moon passes one นักษัตร in about a day, so a
 * day has two spans, sometimes three. Each change is the first whole minute in the new นักษัตร.
 */
export function moonNakshatras(date: YMD): NakshatraSpan[] {
  const jdn = toJdn(date);
  const at = (minute: number) => Math.floor(moonLongitude({ jdn, minute }) / 800);
  const spans: NakshatraSpan[] = [];
  const STEP = 15;
  let start = 0;
  let cur = at(0);
  for (let t = STEP; t <= MINUTES_PER_DAY; t += STEP) {
    if (at(t) === cur) continue;
    let lo = t - STEP, hi = t;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (at(mid) === cur) lo = mid; else hi = mid; }
    spans.push({ nakshatra: cur + 1, reuk: REUK_GROUPS[cur % 9], from: start, to: hi });
    start = hi;
    cur = at(hi);
  }
  // A change at exactly 24:00 belongs to the next day: no empty span at the end.
  if (start < MINUTES_PER_DAY) spans.push({ nakshatra: cur + 1, reuk: REUK_GROUPS[cur % 9], from: start, to: MINUTES_PER_DAY });
  return spans;
}
