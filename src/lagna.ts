/**
 * Ascendant (ลัคนา) by rising times (อันโตนาที).
 *
 * At sunrise the rising point is the Sun itself. From there, each sign takes its rising time
 * to pass the eastern horizon; the part of the Sun's sign still below the horizon at sunrise
 * and the position inside the rising sign are taken in proportion. The ascendant is the
 * point reached after the time elapsed since sunrise.
 */
import { MINUTES_PER_DAY, assertMoment, sunLongitude, type Moment } from './astro.js';

const FULL = 21600;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** One มหานาที (นาฬิกา) is 24 minutes; the twelve signs add up to 60 of them, one day. */
export const MAHANATI_MINUTES = 24;

/**
 * อันโตนาทีสามัญ: เมษ 5, พฤษภ 4, มิถุน 3, กรกฎ 5, สิงห์ 6, กันย์ 7, ตุลย์ 7, พิจิก 6,
 * ธนู 5, มกร 3, กุมภ์ 4, มีน 5 มหานาที, in minutes. (โหราวิทยา ภาค 1 บทที่ 8.)
 */
export const RISING_SAMANYA: readonly number[] = [5, 4, 3, 5, 6, 7, 7, 6, 5, 3, 4, 5].map((n) => n * MAHANATI_MINUTES);

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
   * Sunrise on the same clock, minutes after midnight. Default 360 (06:00) — the
   * fixed sunrise of ลัคนาสามัญ. Pass the real local sunrise for a place if you have it.
   */
  sunrise?: number;
  table?: readonly number[];
}

/** The ascendant at a moment, using the true Sun at sunrise of that day. */
function checkSunrise(sunrise: number) {
  if (!Number.isInteger(sunrise) || sunrise < 0 || sunrise >= MINUTES_PER_DAY) throw new RangeError('sunrise must be a whole minute 0–1439');
}

export function ascendant({ at, sunrise = 360, table = RISING_SAMANYA }: AscendantInput): number {
  assertMoment(at);
  checkSunrise(sunrise);
  // Before sunrise the day still belongs to the previous sunrise.
  const before = at.minute < sunrise;
  const jdn = before ? at.jdn - 1 : at.jdn;
  const sun = sunLongitude({ jdn, minute: sunrise });
  const elapsed = at.minute + (before ? MINUTES_PER_DAY : 0) - sunrise;
  return Math.floor(ascendantFromSun(sun, elapsed, table));
}

/**
 * When each sign starts rising on a day (จักรราศีวิภาค), as minutes of the day on the same
 * clock, starting with the Sun's sign. `start` is the moment the sign began, which for the
 * Sun's sign is before sunrise.
 */
export function risingSchedule(at: Moment, sunrise = 360, table: readonly number[] = RISING_SAMANYA): { sign: number; start: number }[] {
  assertMoment(at);
  checkSunrise(sunrise);
  checkTable(table);
  const sun = sunLongitude({ jdn: at.jdn, minute: sunrise });
  const s0 = Math.floor(sun / 1800);
  let t = sunrise - ((sun - s0 * 1800) / 1800) * table[s0];
  const out: { sign: number; start: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const sign = (s0 + i) % 12;
    out.push({ sign, start: mod(Math.round(t), MINUTES_PER_DAY) });
    t += table[sign];
  }
  return out;
}
