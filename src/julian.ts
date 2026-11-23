/** Proleptic Gregorian calendar ↔ Julian Day Number (integer, noon-based day count). */

export interface YMD {
  year: number;  // Common Era (ค.ศ.)
  month: number; // 1–12
  day: number;   // 1–31
}

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Whether `d` is a real calendar day with whole-number fields. */
export function isValidYmd(d: YMD): boolean {
  if (!d || !Number.isInteger(d.year) || !Number.isInteger(d.month) || !Number.isInteger(d.day)) return false;
  if (d.month < 1 || d.month > 12 || d.day < 1) return false;
  return d.day <= (d.month === 2 && leap(d.year) ? 29 : DAYS[d.month - 1]);
}

/** Throws a RangeError unless `d` is a real calendar day. */
export function assertYmd(d: YMD): void {
  if (!isValidYmd(d)) throw new RangeError('Not a calendar date (year, month 1–12 and day must be whole numbers that exist)');
}

/** Calendar day → Julian Day Number. Throws a RangeError for a day that does not exist (e.g. 30 February). */
export function toJdn(d: YMD): number {
  assertYmd(d);
  const { year, month, day } = d;
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function fromJdn(jdn: number): YMD {
  if (!Number.isInteger(jdn)) throw new RangeError('A Julian Day Number must be a whole number');
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    year: 100 * b + d - 4800 + Math.floor(m / 10),
    month: m + 3 - 12 * Math.floor(m / 10),
    day: e - Math.floor((153 * m + 2) / 5) + 1,
  };
}

/** The Thai calendar day (UTC+7) of a JavaScript Date. */
export function thaiDay(date: Date): YMD {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new RangeError('Invalid Date');
  const t = new Date(date.getTime() + 7 * 3_600_000);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

export function toYmd(input: Date | YMD): YMD {
  return input instanceof Date ? thaiDay(input) : input;
}
