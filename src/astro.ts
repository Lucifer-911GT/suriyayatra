/**
 * Planet positions (สมผุสดาว) by the suriyayatra (สุริยยาตร์) and manat (มานัตต์) rules.
 *
 * Every quantity is an integer in arcminutes (ลิปดา) from 0° เมษ, 0–21599, counted the way
 * the traditional tables count: there is no ayanamsa step, the zodiac is the system's own.
 *
 * Time is "minute of the day" (0–1440) in Bangkok local mean time, UTC+06:42 — the frame the
 * rules were written for. Thai standard time (UTC+7) is 18 minutes ahead; use
 * {@link fromThaiTime} or {@link fromDate} to convert. A day's 24:00 is minute 1440, which is
 * the moment printed in Thai ephemerides (ปฏิทินโหราศาสตร์ ณ เวลา 24:00 น.).
 */
import { HORAKHUN_JDN, KAMMACAPHON_PER_DAY, KAMMACAPHON_PER_YEAR, EPOCH_OFFSET } from './era.js';
import { toJdn, fromJdn, type YMD } from './julian.js';

export const MINUTES_PER_DAY = 1440;
/** Bangkok local mean time is UTC+06:42; Thai standard time is UTC+07:00. */
export const LMT_OFFSET_MINUTES = 6 * 60 + 42;
export const THAI_TIME_OFFSET_MINUTES = 7 * 60;
const FULL = 21600;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A moment on the suriyayatra clock: a calendar day and a minute of that day (UTC+06:42). */
export interface Moment {
  jdn: number;
  /** 0–1440 in Bangkok local mean time (UTC+06:42); 1440 = 24:00. */
  minute: number;
}

/** A date at 24:00 Bangkok mean time — the instant Thai ephemeris tables are printed for. */
export function endOfDay(date: YMD): Moment {
  return { jdn: toJdn(date), minute: MINUTES_PER_DAY };
}

/** A date and clock time in Thai standard time (UTC+7). Subtracts 18 minutes. */
export function fromThaiTime(date: YMD, hour: number, minute = 0): Moment {
  return normalize(toJdn(date), hour * 60 + minute - (THAI_TIME_OFFSET_MINUTES - LMT_OFFSET_MINUTES));
}

/** An instant, read on the UTC+06:42 clock. Whole minutes; seconds are dropped. */
export function fromDate(date: Date): Moment {
  const t = Math.floor(date.getTime() / 60000) + LMT_OFFSET_MINUTES;
  const day = Math.floor(t / MINUTES_PER_DAY);
  return { jdn: day + 2440588, minute: t - day * MINUTES_PER_DAY };
}

function normalize(jdn: number, minute: number): Moment {
  const d = Math.floor(minute / MINUTES_PER_DAY);
  if (minute === MINUTES_PER_DAY) return { jdn, minute };
  return { jdn: jdn + d, minute: minute - d * MINUTES_PER_DAY };
}

/** The calendar day and minute of a moment (useful after {@link fromThaiTime} crossed midnight). */
export function momentDate(m: Moment): YMD & { minute: number } {
  return { ...fromJdn(m.jdn), minute: m.minute };
}

// ── counters ────────────────────────────────────────────────────────────────

/**
 * Kammacaphon (กัมมัชพล) counted without a break from the era epoch: 800 per day,
 * 292207 per solar year. At 24:00 of the day with horakhun h it is 800·h − 373.
 */
export function totalKammacaphon({ jdn, minute }: Moment): number {
  const h = jdn - HORAKHUN_JDN;
  return KAMMACAPHON_PER_DAY * (h - 1) - EPOCH_OFFSET + Math.floor((minute * KAMMACAPHON_PER_DAY) / MINUTES_PER_DAY);
}

/**
 * Mean Sun (มัธยมอาทิตย์) from the kammacaphon of the year: ÷24350 gives the sign, the
 * remainder ÷811 the degree, that remainder ÷14 the minute, then −3′. Not wrapped:
 * it is −3…−1 for the first moments after the year starts.
 */
export function meanSunRaw(K: number): number {
  const k = mod(K, KAMMACAPHON_PER_YEAR);
  const sign = Math.floor(k / 24350);
  const r = k - sign * 24350;
  const deg = Math.floor(r / 811);
  return (sign * 30 + deg) * 60 + Math.floor((r - deg * 811) / 14) - 3;
}

/** Folds an anomaly into the first quadrant; `subtract` is true in the first half circle. */
function fold(x: number): { arc: number; subtract: boolean } {
  const a = mod(x, FULL);
  const q = Math.floor(a / 5400);
  return { arc: [a, 10800 - a, a - 10800, FULL - a][q], subtract: a < 10800 };
}

/** Equation tables of the Sun and Moon, in arcminutes per 15° (ฉายา). */
export const SUN_EQUATION = [0, 35, 67, 94, 116, 129, 134] as const;
export const MOON_EQUATION = [0, 77, 148, 209, 256, 286, 296] as const;

function equation(arc: number, table: readonly number[]): number {
  const i = Math.floor(arc / 900);
  if (i >= 6) return table[6];
  return table[i] + Math.floor(((arc - i * 900) * (table[i + 1] - table[i])) / 900);
}

// ── Sun, Moon, Rahu, Ketu ────────────────────────────────────────────────────

/** True Sun (สมผุสอาทิตย์). Apogee 80° (4800′). */
export function sunLongitude(m: Moment): number {
  const mean = meanSunRaw(totalKammacaphon(m));
  const { arc, subtract } = fold(mean - 4800);
  const e = equation(arc, SUN_EQUATION);
  return mod(subtract ? mean - e : mean + e, FULL);
}

/**
 * True Moon (สมผุสจันทร์). Elongation from อวมาน (703 per day over a 20760 cycle = 30
 * tithis of 692), mean Moon = mean Sun + 720′ per tithi + อวมาน + อวมาน/25 − 40′, apogee
 * from อุจจพล (3232 days per revolution) + 2′.
 */
export function moonLongitude(m: Moment): number {
  const h = m.jdn - HORAKHUN_JDN - 1;
  const n = mod(h * 703 + 650 + Math.floor((m.minute * 703) / MINUTES_PER_DAY), 20760);
  const tithi = Math.floor(n / 692);
  const avoman = n - tithi * 692;
  const mean = tithi * 720 + avoman + Math.floor(avoman / 25) - 40 + meanSunRaw(totalKammacaphon(m));
  const u = mod(h - 621, 3232);
  const apogee = Math.floor(((u * MINUTES_PER_DAY + m.minute) * FULL) / (3232 * MINUTES_PER_DAY)) + 2;
  const { arc, subtract } = fold(mean - apogee);
  const e = equation(arc, MOON_EQUATION);
  return mod(subtract ? mean - e : mean + e, FULL);
}

/**
 * Accumulated Sun (พลรวิสะสม) that drives Rahu and the planets: whole solar years since
 * CS 610 times 21600′, plus the mean Sun − 23′.
 */
export function solarAccumulation(K: number): number {
  return (Math.floor(K / KAMMACAPHON_PER_YEAR) - 610) * FULL + meanSunRaw(K) - 23;
}

/** Rahu (ราหู), always retrograde: 15150′ − S/20 − S/265. */
export function rahuLongitude(m: Moment): number {
  const S = solarAccumulation(totalKammacaphon(m));
  return mod(15150 - Math.floor(S / 20) - Math.floor(S / 265), FULL);
}

/** Ketu (เกตุ) of Thai astrology — a separate point with a 679-day retrograde cycle. */
export function ketuLongitude(m: Moment): number {
  const c = mod(m.jdn - HORAKHUN_JDN - 1 - 344, 679);
  return mod(FULL - Math.floor(((c * MINUTES_PER_DAY + m.minute) * FULL) / (679 * MINUTES_PER_DAY)), FULL);
}

// ── the planets ──────────────────────────────────────────────────────────────

/** Shadow (ฉายา) table of the planets: arcminutes at 0°, 30°, 60°, 90°. */
export const PLANET_SHADOW = [0, 244, 427, 488] as const;

function shadow(arc: number): number {
  const i = Math.floor(arc / 1800);
  if (i >= 3) return PLANET_SHADOW[3];
  return PLANET_SHADOW[i] + ((arc - i * 1800) * (PLANET_SHADOW[i + 1] - PLANET_SHADOW[i])) / 1800;
}

/** Quadrant data for one correction: the folded arc, its sign, and the sign of the co-arc term. */
function quadrant(x: number) {
  const a = mod(x, FULL);
  const q = Math.floor(a / 5400);
  return {
    arc: [a, 10800 - a, a - 10800, FULL - a][q],
    dir: q < 2 ? -1 : 1,
    coDir: q === 0 || q === 3 ? 1 : -1,
  };
}

/**
 * The two corrections of the manat (มานัตต์) rules. The first is taken against `anchor`
 * with divisor `divisor` (half the co-arc shadow is added or removed), the second against
 * `against` with a divisor from `secondDivisor(first divisor)`.
 */
function twoCorrections(base: number, anchor: number, divisor: number, against: number, secondDivisor: (d: number) => number): number {
  const p = quadrant(base - anchor);
  const num1 = Math.floor(shadow(p.arc) * 60);
  const co1 = Math.floor(shadow(5400 - p.arc) + 0.5);
  const d1 = divisor + Math.floor(co1 / 2) * p.coDir;
  const first = base + Math.floor((num1 * 60) / d1) * p.dir;

  const s = quadrant(mod(first, FULL) - against);
  const num2 = Math.floor(shadow(s.arc) * 60);
  const co2 = Math.floor(shadow(5400 - s.arc) + 0.5);
  const d2 = Math.floor(Math.floor(num2 / 60 + 0.5) / 3) + secondDivisor(d1) + co2 * s.coDir;
  return mod(first + Math.floor((num2 * 60) / d2) * s.dir, FULL);
}

interface OuterModel { mean: (S: number) => number; apogee: number; divisor: number; second: (d: number) => number }
interface InnerModel { mean: (S: number) => number; apogee: number; divisor: number; second: number }

/** Mean motion in terms of the accumulated Sun S, the apogee (มนทโจจ์) and divisors. */
const OUTER: Record<'mars' | 'jupiter' | 'saturn' | 'uranus', OuterModel> = {
  mars: { mean: (S) => Math.floor(S / 2) + Math.floor((S * 16) / 505) + 5420, apogee: 7620, divisor: 2700, second: (d) => Math.floor((d * 4) / 15) },
  jupiter: { mean: (S) => Math.floor(S / 12) + Math.floor(S / 1032) + 14297, apogee: 10320, divisor: 5520, second: (d) => Math.floor((d * 3) / 7) },
  saturn: { mean: (S) => Math.floor(S / 30) + Math.floor((S * 6) / 10000) + 11944, apogee: 14820, divisor: 3780, second: (d) => Math.floor((d * 7) / 6) },
  uranus: { mean: (S) => Math.floor(S / 84) + Math.floor(S / 7224) + 16277, apogee: 7440, divisor: 38640, second: (d) => Math.floor((d * 3) / 7) },
};
/** Mercury and Venus: the Sun is corrected first, then against the planet's own (ศีฆร) mean. */
const INNER: Record<'mercury' | 'venus', InnerModel> = {
  mercury: { mean: (S) => Math.floor((S * 7) / 46) + S * 4 + 10642, apogee: 13200, divisor: 6000, second: 21 * 60 },
  venus: { mean: (S) => Math.floor((S * 5) / 3) - Math.floor((S * 10) / 243) + 10944, apogee: 4800, divisor: 19200, second: 11 * 60 },
};

export type ClassicalPlanet = 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'uranus';

export function planetLongitude(planet: ClassicalPlanet, m: Moment): number {
  const K = totalKammacaphon(m);
  const S = solarAccumulation(K);
  const ravi = mod(meanSunRaw(K) - 23, FULL);
  if (planet === 'mercury' || planet === 'venus') {
    const p = INNER[planet];
    return twoCorrections(ravi, p.apogee, p.divisor, mod(p.mean(S), FULL), () => p.second);
  }
  const p = OUTER[planet];
  return twoCorrections(mod(p.mean(S), FULL), p.apogee, p.divisor, ravi, p.second);
}

// ── public shape ─────────────────────────────────────────────────────────────

export type Body = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu' | 'uranus';

/** In Thai order: ๑ อาทิตย์ … ๙ เกตุ, ๐ มฤตยู. */
export const BODIES: readonly Body[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu', 'uranus'];
export const BODY_NUMBER: Record<Body, number> = { sun: 1, moon: 2, mars: 3, mercury: 4, jupiter: 5, venus: 6, saturn: 7, rahu: 8, ketu: 9, uranus: 0 };
export const BODY_TH: Record<Body, string> = {
  sun: 'อาทิตย์', moon: 'จันทร์', mars: 'อังคาร', mercury: 'พุธ', jupiter: 'พฤหัสบดี',
  venus: 'ศุกร์', saturn: 'เสาร์', rahu: 'ราหู', ketu: 'เกตุ', uranus: 'มฤตยู',
};
export const SIGN_TH = ['เมษ', 'พฤษภ', 'มิถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มกร', 'กุมภ์', 'มีน'] as const;

export function longitude(body: Body, m: Moment): number {
  switch (body) {
    case 'sun': return sunLongitude(m);
    case 'moon': return moonLongitude(m);
    case 'rahu': return rahuLongitude(m);
    case 'ketu': return ketuLongitude(m);
    default: return planetLongitude(body, m);
  }
}

export interface Position {
  /** Arcminutes from 0° เมษ, 0–21599. */
  longitude: number;
  /** 0 = เมษ … 11 = มีน. */
  sign: number;
  signTh: string;
  degree: number;
  minute: number;
}

export function position(arcminutes: number): Position {
  const l = mod(Math.floor(arcminutes), FULL);
  const sign = Math.floor(l / 1800);
  const inSign = l - sign * 1800;
  return { longitude: l, sign, signTh: SIGN_TH[sign], degree: Math.floor(inSign / 60), minute: inSign % 60 };
}

/** All ten bodies at a moment. Default moment: 24:00 of the date, as in Thai ephemerides. */
export function positions(at: Moment | YMD): Record<Body, Position> {
  const m = 'jdn' in at ? at : endOfDay(at);
  const out = {} as Record<Body, Position>;
  for (const b of BODIES) out[b] = position(longitude(b, m));
  return out;
}

export interface SignChange {
  body: Body;
  /** Minute of the day (UTC+06:42) of the first whole minute in the new sign. */
  minute: number;
  from: number;
  to: number;
}

/**
 * Sign changes during one calendar day, found minute by minute from 00:00 to 24:00
 * (the convention of Thai ephemerides: the time printed is the first minute in the new sign).
 * Raw: near a boundary a slow body can cross back and forth several times. For a span of
 * days with those flickers merged, use {@link ingresses}.
 */
export function signChanges(date: YMD, bodies: readonly Body[] = BODIES): SignChange[] {
  const jdn = toJdn(date);
  const out: SignChange[] = [];
  for (const body of bodies) {
    let prev = Math.floor(longitude(body, { jdn, minute: 0 }) / 1800);
    for (let minute = 1; minute <= MINUTES_PER_DAY; minute++) {
      const s = Math.floor(longitude(body, { jdn, minute }) / 1800);
      if (s !== prev) out.push({ body, minute, from: prev, to: s });
      prev = s;
    }
  }
  return out.sort((a, b) => a.minute - b.minute);
}

/** "HH:MM" of a minute of the day. */
export function clock(minute: number): string {
  const h = Math.floor(minute / 60);
  return `${String(h).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

// ── sign changes over a span, with flicker merged ───────────────────────────

export interface Ingress {
  body: Body;
  /** The moment it entered the new sign (UTC+06:42 clock). */
  at: Moment;
  from: number;
  to: number;
}

export interface IngressOptions {
  /**
   * Near a sign boundary the integer rules can step back and forth across it for a while
   * (the ephemerides call it อนุวักระ). Changes that are undone within this many minutes are
   * dropped, and the last entry is kept. Default 1440 (one day). 0 turns this off, but
   * a change undone inside the same clock hour is never reported; use {@link signChanges}
   * for the raw minute-by-minute list of a single day.
   */
  settleMinutes?: number;
}

function raw(body: Body, fromJdn: number, toJdn: number): Ingress[] {
  const out: Ingress[] = [];
  const step = 60;
  const at = (jdn: number, minute: number) => Math.floor(longitude(body, { jdn, minute }) / 1800);
  for (let jdn = fromJdn; jdn <= toJdn; jdn++) {
    let prev = at(jdn, 0);
    for (let m0 = 0; m0 < MINUTES_PER_DAY; m0 += step) {
      const end = at(jdn, m0 + step);
      if (end === prev) {
        // A flicker that is undone inside the hour never reaches the result.
        continue;
      }
      let s = prev;
      for (let minute = m0 + 1; minute <= m0 + step; minute++) {
        const t = at(jdn, minute);
        if (t !== s) {
          out.push({ body, at: { jdn, minute }, from: s, to: t });
          s = t;
        }
      }
      prev = end;
    }
  }
  return out;
}

const minutesOf = (m: Moment) => m.jdn * MINUTES_PER_DAY + m.minute;

/** Drops changes that are reversed within `settle` minutes; keeps the last entry. */
export function settleIngresses(events: readonly Ingress[], settle: number): Ingress[] {
  if (settle <= 0) return [...events];
  const kept: Ingress[] = [];
  for (const e of events) {
    const last = kept[kept.length - 1];
    if (last && last.body === e.body && last.to === e.from && last.from === e.to && minutesOf(e.at) - minutesOf(last.at) <= settle) {
      kept.pop();
      continue;
    }
    kept.push(e);
  }
  return kept;
}

/**
 * Sign changes of one or more bodies from the start of `from` to 24:00 of `to`
 * (inclusive dates), in time order. The time of each change is its first whole minute
 * in the new sign, as Thai ephemerides print it.
 */
export function ingresses(bodies: Body | readonly Body[], from: YMD, to: YMD, { settleMinutes = MINUTES_PER_DAY }: IngressOptions = {}): Ingress[] {
  const list = typeof bodies === 'string' ? [bodies] : bodies;
  const a = toJdn(from);
  const b = toJdn(to);
  if (b < a) throw new RangeError('`to` is before `from`');
  const out: Ingress[] = [];
  // A little margin on both sides so a flicker that straddles the span is still settled.
  const pad = Math.ceil(settleMinutes / MINUTES_PER_DAY);
  for (const body of list) {
    const settled = settleIngresses(raw(body, a - pad, b + pad), settleMinutes);
    out.push(...settled.filter((e) => e.at.jdn >= a && e.at.jdn <= b));
  }
  return out.sort((x, y) => minutesOf(x.at) - minutesOf(y.at));
}
