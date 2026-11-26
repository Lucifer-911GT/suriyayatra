import { describe, expect, it } from 'vitest';
import * as lib from '../src/index.js';
import {
  BODIES, BODY_NUMBER, BODY_TH, HOLY_DAYS_BE_RANGE, MAX_ABS_JDN, MAX_ABS_YEAR, MOON_EQUATION, OFFICIAL_YEAR_TYPES,
  PLANET_SHADOW, RETROGRADE_BODIES, RISING_SAMANYA, SIGN_TH, SUN_EQUATION, VALIDATED_RANGES, YEAR_ANIMALS_TH,
  YEAR_LENGTH, clock, fromJdn, ingresses, isValidYmd, meanSunRaw, momentDate, monthLabel, positions, retrogrades,
  signChanges, solarAccumulation, toJdn, toThaiLunar, yearType,
} from '../src/index.js';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const DAY = d(2026, 11, 17);

describe('exported tables cannot be changed by other code', () => {
  const tables: [string, object][] = [
    ['BODIES', BODIES], ['BODY_NUMBER', BODY_NUMBER], ['BODY_TH', BODY_TH], ['SIGN_TH', SIGN_TH],
    ['RETROGRADE_BODIES', RETROGRADE_BODIES], ['SUN_EQUATION', SUN_EQUATION], ['MOON_EQUATION', MOON_EQUATION],
    ['PLANET_SHADOW', PLANET_SHADOW], ['RISING_SAMANYA', RISING_SAMANYA], ['YEAR_LENGTH', YEAR_LENGTH],
    ['OFFICIAL_YEAR_TYPES', OFFICIAL_YEAR_TYPES], ['YEAR_ANIMALS_TH', YEAR_ANIMALS_TH],
    ['HOLY_DAYS_BE_RANGE', HOLY_DAYS_BE_RANGE], ['VALIDATED_RANGES', VALIDATED_RANGES],
    ['VALIDATED_RANGES.positions', VALIDATED_RANGES.positions], ['VALIDATED_RANGES.lunarCalendar', VALIDATED_RANGES.lunarCalendar],
  ];
  it.each(tables)('%s is frozen', (_, table) => {
    expect(Object.isFrozen(table)).toBe(true);
  });
  it('every exported object or array is frozen, all the way down', () => {
    const unfrozen: string[] = [];
    const walk = (path: string, v: unknown) => {
      if (typeof v !== 'object' || v === null) return;
      if (!Object.isFrozen(v)) unfrozen.push(path);
      for (const [k, child] of Object.entries(v)) walk(`${path}.${k}`, child);
    };
    for (const [name, value] of Object.entries(lib)) walk(name, value);
    expect(unfrozen).toEqual([]);
  });
  it('an attempt to change them throws and the results stay the same', () => {
    const sun = positions(DAY).sun.longitude;
    const lunar = toThaiLunar(DAY).label;
    expect(() => { (SUN_EQUATION as unknown as number[])[3] = 9999; }).toThrow(TypeError);
    expect(() => { (YEAR_LENGTH as Record<string, number>).normal = 1; }).toThrow(TypeError);
    expect(() => { (OFFICIAL_YEAR_TYPES as Record<number, string>)[1300] = 'adhikamas'; }).toThrow(TypeError);
    expect(() => { (BODIES as string[]).push('pluto'); }).toThrow(TypeError);
    expect(positions(DAY).sun.longitude).toBe(sun);
    expect(toThaiLunar(DAY).label).toBe(lunar);
    expect(yearType(1300)).not.toBe('adhikamas');
  });
});

describe('repeated bodies do not multiply the work', () => {
  it('signChanges, ingresses and retrogrades take each body once', () => {
    expect(signChanges(DAY, Array(1000).fill('sun'))).toEqual(signChanges(DAY, ['sun']));
    expect(ingresses(Array(1000).fill('sun'), DAY, DAY)).toEqual(ingresses('sun', DAY, DAY));
    const year = [d(2026, 1, 1), d(2026, 12, 31)] as const;
    expect(retrogrades(Array(1000).fill('venus'), ...year)).toEqual(retrogrades('venus', ...year));
  });
});

describe('absurd sizes are refused instead of answered wrong', () => {
  it('years are limited to ±MAX_ABS_YEAR, and the ends still work', () => {
    for (const year of [MAX_ABS_YEAR, -MAX_ABS_YEAR]) {
      expect(isValidYmd(d(year, 1, 1))).toBe(true);
      expect(fromJdn(toJdn(d(year, 6, 15)))).toEqual(d(year, 6, 15));
      expect(positions(d(year, 1, 1)).sun.sign).toBeGreaterThanOrEqual(0);
    }
    expect(isValidYmd(d(MAX_ABS_YEAR + 1, 1, 1))).toBe(false);
    expect(() => positions(d(1e12, 1, 1))).toThrow(RangeError);
  });
  it('JDNs are limited to ±MAX_ABS_JDN', () => {
    expect(() => positions({ jdn: 1e17, minute: 0 })).toThrow(RangeError);
    expect(() => fromJdn(MAX_ABS_JDN + 1)).toThrow(RangeError);
    expect(() => momentDate({ jdn: 2461000, minute: 99999 })).toThrow(RangeError);
  });
  it('the counters need safe integers', () => {
    for (const K of [NaN, 1.5, 2 ** 60]) {
      expect(() => meanSunRaw(K)).toThrow(RangeError);
      expect(() => solarAccumulation(K)).toThrow(RangeError);
    }
  });
});

describe('small helpers check their input', () => {
  it('clock', () => {
    expect(clock(0)).toBe('00:00');
    expect(clock(1440)).toBe('24:00');
    for (const m of [-5, 1441, NaN, 1.5]) expect(() => clock(m)).toThrow(RangeError);
  });
  it('monthLabel', () => {
    expect(monthLabel(1)).toBe('เดือนอ้าย');
    expect(monthLabel(8, true)).toBe('เดือน 8 หลัง');
    for (const m of [0, 13, 1.5, NaN, 'constructor' as never]) expect(() => monthLabel(m)).toThrow(RangeError);
    expect(() => monthLabel(5, true)).toThrow(RangeError);
  });
  it('error messages do not echo maxDays', () => {
    expect(() => ingresses('sun', DAY, d(2040, 1, 1), { maxDays: 4242 })).toThrow(RangeError);
    expect(() => ingresses('sun', DAY, d(2040, 1, 1), { maxDays: 4242 })).not.toThrow(/4242/);
  });
});

// ── fuzz: every public function, junk arguments ─────────────────────────────

/** Small deterministic PRNG (mulberry32) so a failure can be reproduced. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JUNK: unknown[] = [
  undefined, null, NaN, Infinity, -Infinity, -0, 0, 1, -1, 1.5, 2 ** 53, -(2 ** 60), 1e300,
  '', 'sun', '__proto__', 'constructor', 'toString', [], ['sun', 'sun'], ['pluto'], {}, { jdn: 1e20, minute: 0 },
  { year: 2026, month: 2, day: 30 }, { year: '2026', month: 1, day: 1 }, { __proto__: { year: 2026 } },
  new Date('x'), new Date(8.64e15), Symbol('s'), () => 1, true,
];
const GOOD: unknown[] = [DAY, d(2026, 4, 14), { jdn: 2461000, minute: 600 }, 1388, 2569, 'moon', ['mars'], 'venus', 30];

/** Every exported function. */
/** Raise for a longer local run: FUZZ_ITERATIONS=50000 npx vitest run test/security.test.ts */
const ITERATIONS = Number((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.FUZZ_ITERATIONS ?? 2000);
const FUNCTIONS = Object.entries(lib).filter((e): e is [string, (...a: unknown[]) => unknown] => typeof e[1] === 'function');

describe('fuzz: junk input gives a result or a RangeError, never another error or a hang', () => {
  it('covers every exported function', () => {
    expect(FUNCTIONS.length).toBeGreaterThanOrEqual(49);
  });
  it.each(FUNCTIONS)('%s', (_, fn) => {
    const next = rng(fn.name.length * 7919 + 1);
    const pick = () => (next() < 0.7 ? JUNK : GOOD)[Math.floor(next() * (next() < 0.7 ? JUNK.length : GOOD.length))];
    for (let i = 0; i < ITERATIONS; i++) {
      const args = Array.from({ length: Math.floor(next() * 4) }, pick);
      const t0 = performance.now();
      try {
        fn(...args);
      } catch (e) {
        if (!(e instanceof RangeError)) throw new Error(`${fn.name}(${args.map(String).join(', ')}) threw ${String(e)}`);
      }
      // generous: a valid default span is the slowest legal call
      expect(performance.now() - t0, `${fn.name} took too long`).toBeLessThan(2000);
    }
  });
});
