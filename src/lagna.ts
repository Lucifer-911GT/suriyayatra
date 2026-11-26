// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * Ascendant (ลัคนา) by rising times (อันโตนาที).
 *
 * At sunrise the rising point is the Sun itself. From there, each sign takes its rising time
 * to pass the eastern horizon; the part of the Sun's sign still below the horizon at sunrise
 * and the position inside the rising sign are taken in proportion. The ascendant is the
 * point reached after the time elapsed since sunrise.
 */
import { MINUTES_PER_DAY, assertMoment, sunLongitude, type Moment } from './astro.js';

import { FULL, mod } from './math.js';

/** One มหานาที (นาฬิกา) is 24 minutes; the twelve signs add up to 60 of them, one day. */
export const MAHANATI_MINUTES = 24;

/**
 * อันโตนาทีสามัญ: เมษ 5, พฤษภ 4, มิถุน 3, กรกฎ 5, สิงห์ 6, กันย์ 7, ตุลย์ 7, พิจิก 6,
 * ธนู 5, มกร 3, กุมภ์ 4, มีน 5 มหานาที, in minutes. (โหราวิทยา ภาค 1 บทที่ 8.)
 */
export const RISING_SAMANYA: readonly number[] = Object.freeze([5, 4, 3, 5, 6, 7, 7, 6, 5, 3, 4, 5].map((n) => n * MAHANATI_MINUTES));

function checkTable(table: readonly number[]) {
  if (!Array.isArray(table) || table.length !== 12 || table.some((v) => !(v > 0) || !Number.isFinite(v))) throw new RangeError('A rising-time table needs 12 positive values');
}

/**
 * The ascendant, in arcminutes, `minutesAfterSunrise` after sunrise, for the Sun at
 * `sunLongitude` (arcminutes). Negative minutes count back from sunrise.
 */
export function ascendantFromSun(sunLongitudeArcmin: number, minutesAfterSunrise: number, table: readonly number[] = RISING_SAMANYA): number {
  checkTable(table);
  if (!Number.isFinite(sunLongitudeArcmin) || !Number.isFinite(minutesAfterSunrise)) throw new RangeError('Sun longitude and minutes must be finite numbers');
  const total = table.reduce((a, b) => a + b, 0);
  let t = mod(minutesAfterSunrise, total);
  let sign = Math.floor(mod(sunLongitudeArcmin, FULL) / 1800);
  let inSign = mod(sunLongitudeArcmin, FULL) - sign * 1800;
  // finish the Sun's sign first
  let left = ((1800 - inSign) / 1800) * table[sign];
  while (t >= left) {
    t -= left;
    sign = (sign + 1) % 12;
    inSign = 0;
    left = table[sign];
  }
  return mod(sign * 1800 + inSign + (t / table[sign]) * 1800, FULL);
}

export interface AscendantInput {
  /** The moment (UTC+06:42 clock). */
  at: Moment;
  /**
   * Sunrise on the same clock, minutes after midnight (fractions allowed). Default 360
   * (06:00) — the fixed sunrise of ลัคนาสามัญ. Pass the real local sunrise for a place,
   * for example from {@link sunriseMinute}.
   */
  sunrise?: number;
  /**
   * Which Sun the rising times are counted from. Both are in use in Thai practice:
   * - `'sunrise'` (default, อันโตนาทีสามัญ สมผุสอาทิตย์อุทัย): the Sun as it stood at sunrise.
   *   The ascendant steps by about the Sun's daily motion (≈1°) at each sunrise.
   * - `'birth'`: the Sun at the moment itself. The rising-time table adds up to one solar day
   *   (1440 minutes), so counting from the current Sun keeps the ascendant continuous.
   */
  sun?: AscendantSun;
  table?: readonly number[];
}

export type AscendantSun = 'sunrise' | 'birth';

function checkSunrise(sunrise: number): void {
  if (typeof sunrise !== 'number' || !Number.isFinite(sunrise) || sunrise < 0 || sunrise >= MINUTES_PER_DAY) {
    throw new RangeError('sunrise must be minutes 0–1439 (fractions allowed)');
  }
}

/** The ascendant at a moment, in arcminutes, from the rising times after sunrise. */
export function ascendant(input: AscendantInput): number {
  if (typeof input !== 'object' || input === null) throw new RangeError('ascendant needs { at, sunrise?, sun?, table? }');
  const { at, sunrise = 360, sun = 'sunrise', table = RISING_SAMANYA } = input;
  assertMoment(at);
  checkSunrise(sunrise);
  if (sun !== 'sunrise' && sun !== 'birth') throw new RangeError("sun must be 'sunrise' or 'birth'");
  // Before sunrise the day still belongs to the previous sunrise.
  const before = at.minute < sunrise;
  const elapsed = at.minute + (before ? MINUTES_PER_DAY : 0) - sunrise;
  const sunArcmin = sun === 'birth'
    ? sunLongitude(at)
    : sunLongitude({ jdn: before ? at.jdn - 1 : at.jdn, minute: Math.round(sunrise) });
  return Math.floor(ascendantFromSun(sunArcmin, elapsed, table));
}

/**
 * When each sign starts rising on a day (จักรราศีวิภาค), as minutes of the day on the same
 * clock, starting with the Sun's sign. `start` is the moment the sign began, which for the
 * Sun's sign is before sunrise.
 */
/** When a sign starts rising: minute of the day on the UTC+06:42 clock. */
export interface RisingStart {
  sign: number;
  start: number;
}

export function risingSchedule(at: Moment, sunrise = 360, table: readonly number[] = RISING_SAMANYA): RisingStart[] {
  assertMoment(at);
  checkSunrise(sunrise);
  checkTable(table);
  const sun = sunLongitude({ jdn: at.jdn, minute: Math.round(sunrise) });
  const s0 = Math.floor(sun / 1800);
  let t = sunrise - ((sun - s0 * 1800) / 1800) * table[s0];
  const out: RisingStart[] = [];
  for (let i = 0; i < 12; i++) {
    const sign = (s0 + i) % 12;
    out.push({ sign, start: mod(Math.round(t), MINUTES_PER_DAY) });
    t += table[sign];
  }
  return out;
}
