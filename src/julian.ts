/** Proleptic Gregorian calendar ↔ Julian Day Number (integer, noon-based day count). */

export interface YMD {
  year: number;  // Common Era (ค.ศ.)
  month: number; // 1–12
  day: number;   // 1–31
}

export function toJdn({ year, month, day }: YMD): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function fromJdn(jdn: number): YMD {
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
  const t = new Date(date.getTime() + 7 * 3_600_000);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

export function toYmd(input: Date | YMD): YMD {
  return input instanceof Date ? thaiDay(input) : input;
}
