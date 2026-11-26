import { describe, expect, it } from 'vitest';
import {
  BODIES, HOUSE_TH, NAKSHATRA_TH, THAI_PROVINCES, TAKSA_PLACES, ascendant, birthTaksa, clock, csOfDay, drekkana,
  fromThaiTime, house, kalayok, moonNakshatras, nakshatra, natalChart, navamsa, provinceByCode, provinceSunrise,
  sunriseMinute, taksa, taksaPlace, thaiDayRules, toJdn, BAD_DITHI, type DayPlanet,
} from '../src/index.js';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, FRI = 5, SAT = 6;

describe('ascendant: which Sun to count from', () => {
  const jdn = toJdn(d(2026, 11, 26));
  it("'sunrise' stays the default", () => {
    for (const minute of [0, 359, 360, 700, 1440]) {
      expect(ascendant({ at: { jdn, minute } })).toBe(ascendant({ at: { jdn, minute }, sun: 'sunrise' }));
    }
  });
  it('both agree at sunrise, where the ascendant is the Sun', () => {
    expect(ascendant({ at: { jdn, minute: 360 }, sun: 'birth' })).toBe(ascendant({ at: { jdn, minute: 360 } }));
  });
  it("'birth' moves smoothly across sunrise; 'sunrise' steps by about a degree", () => {
    const step = (sun: 'birth' | 'sunrise') =>
      ascendant({ at: { jdn, minute: 360 }, sun }) - ascendant({ at: { jdn, minute: 359 }, sun });
    expect(step('birth')).toBeLessThan(20); // about 12′ a minute here
    expect(step('sunrise')).toBeGreaterThan(60);
  });
  it('takes a fractional sunrise and refuses a bad option', () => {
    expect(() => ascendant({ at: { jdn, minute: 600 }, sunrise: 364.73 })).not.toThrow();
    expect(() => ascendant({ at: { jdn, minute: 600 }, sun: 'noon' as never })).toThrow(RangeError);
    expect(() => ascendant({ at: { jdn, minute: 600 }, sunrise: 1440 })).toThrow(RangeError);
  });
});

describe('sunrise at a place', () => {
  // Reference values from Astronomy Engine 2.1 (SearchRiseSet, upper limb, standard refraction),
  // minutes after midnight on the UTC+06:42 clock: [province code, year, month, day, minute].
  const REFERENCE: [number, number, number, number, number][] = [
    [10, 1900, 1, 1, 383.46], [10, 1950, 4, 13, 348.62], [10, 2000, 6, 21, 333.55], [10, 2026, 11, 26, 364.73],
    [10, 2100, 12, 21, 378.13], [50, 1985, 3, 20, 370.55], [50, 2026, 1, 1, 398.73], [57, 2010, 7, 15, 331.83],
    [57, 2200, 9, 23, 351.79], [96, 1960, 2, 29, 367.67], [96, 2030, 10, 5, 342.0], [90, 1999, 5, 5, 344.52],
    [34, 2050, 8, 8, 326.67], [63, 2020, 12, 31, 394.35], [83, 1888, 6, 1, 349.45], [30, 2026, 4, 16, 339.16],
  ];
  it.each(REFERENCE)('province %i, %i-%i-%i: within 0.1 minute of Astronomy Engine', (code, y, m, day, want) => {
    expect(Math.abs(provinceSunrise(code, d(y, m, day)) - want)).toBeLessThan(0.1);
  });
  it('null where the Sun does not rise, RangeError for bad coordinates', () => {
    expect(sunriseMinute(d(2026, 12, 21), 80, 20)).toBeNull();
    expect(() => sunriseMinute(d(2026, 1, 1), 91, 0)).toThrow(RangeError);
    expect(() => sunriseMinute(d(2026, 1, 1), 0, NaN)).toThrow(RangeError);
  });
  it('77 provinces with unique codes', () => {
    expect(THAI_PROVINCES).toHaveLength(77);
    expect(new Set(THAI_PROVINCES.map((p) => p.code)).size).toBe(77);
    expect(provinceByCode(10).th).toBe('กรุงเทพมหานคร');
    expect(() => provinceByCode(99)).toThrow(RangeError);
  });
});

describe('ทักษา', () => {
  // กาลกิณี of each birth planet, as Thai almanacs list it.
  const KALAKINI: Record<DayPlanet, DayPlanet> = { 1: 6, 2: 1, 3: 2, 4: 3, 5: 7, 6: 8, 7: 4, 8: 5 };
  it.each(Object.entries(KALAKINI))('birth planet %s: กาลกิณี is %s', (birth, kala) => {
    expect(taksa(Number(birth) as DayPlanet).กาลกิณี).toBe(kala);
  });
  it('born on Sunday: the places in ทักษา order', () => {
    expect(TAKSA_PLACES.map((p) => taksa(1)[p])).toEqual([1, 2, 3, 4, 7, 5, 8, 6]);
    expect(taksaPlace(1, 4)).toBe('ศรี');
  });
  it('Wednesday night is ราหู, and before 06:00 is the day before', () => {
    expect(birthTaksa(d(2026, 11, 25), 20, 0)).toMatchObject({ planet: 8, dayTh: 'พุธกลางคืน' });
    expect(birthTaksa(d(2026, 11, 26), 5, 0).planet).toBe(8); // Thursday 05:00 → Wednesday night
    expect(birthTaksa(d(2026, 11, 26)).planet).toBe(5);
    expect(() => taksa(9 as DayPlanet)).toThrow(RangeError);
  });
});

describe('chart readings', () => {
  it('houses count whole signs from the ascendant', () => {
    expect(house(0, 0)).toBe(1);
    expect(house(1799, 0)).toBe(1);
    expect(house(1800, 0)).toBe(2);
    expect(house(0, 1800)).toBe(12);
    expect(HOUSE_TH[0]).toBe('ตนุ');
  });
  it('นักษัตร, quarter and ฤกษ์ group', () => {
    expect(nakshatra(0)).toEqual({ index: 1, th: NAKSHATRA_TH[0], quarter: 1, reuk: 'thalittho' });
    expect(nakshatra(799)).toMatchObject({ index: 1, quarter: 4 });
    expect(nakshatra(800)).toMatchObject({ index: 2, quarter: 1, reuk: 'mahatthano' });
    expect(nakshatra(21599)).toMatchObject({ index: 27, quarter: 4, reuk: 'samano' });
  });
  it('นวางศ์: movable signs start from themselves, fixed from the 9th, dual from the 5th', () => {
    expect(navamsa(0)).toEqual({ part: 1, sign: 0 });
    expect(navamsa(1800)).toEqual({ part: 1, sign: 9 }); // พฤษภ 0° → มกร
    expect(navamsa(3600)).toEqual({ part: 1, sign: 6 }); // มิถุน 0° → ตุลย์
    expect(navamsa(1799)).toEqual({ part: 9, sign: 8 });
  });
  it('ตรียางศ์: the sign, then the 5th and the 9th from it', () => {
    expect(drekkana(0)).toEqual({ part: 1, sign: 0 });
    expect(drekkana(600)).toEqual({ part: 2, sign: 4 });
    expect(drekkana(1200)).toEqual({ part: 3, sign: 8 });
    expect(drekkana(1800 * 11 + 1200)).toEqual({ part: 3, sign: 7 }); // มีน 20° → พิจิก
  });
  it('natalChart: the ascendant in house 1 and all ten bodies', () => {
    const at = fromThaiTime(d(1984, 11, 15), 11, 30);
    const chart = natalChart({ at, sunrise: provinceSunrise(10, d(1984, 11, 15)), sun: 'birth' });
    expect(chart.ascendant.house).toBe(1);
    expect(chart.ascendant.longitude).toBe(ascendant({ at, sunrise: provinceSunrise(10, d(1984, 11, 15)), sun: 'birth' }));
    expect(Object.keys(chart.bodies)).toEqual([...BODIES]);
    for (const b of BODIES) expect(chart.bodies[b].house).toBe(house(chart.bodies[b].longitude, chart.ascendant.longitude));
  });
});

describe('ฤกษ์ตามตำรา', () => {
  it('ยมขันธ์ and พิฆาต share one row, as the book has it (checked 26 Nov 2569)', () => {
    expect(BAD_DITHI['ยมขันธ์']).toEqual([12, 11, 7, 3, 6, 8, 9]);
    expect(BAD_DITHI['พิฆาต']).toEqual([12, 11, 7, 3, 6, 8, 9]);
  });

  // Published yearly tables (myhora, Lemon8, Pantip); อธิบดี 1390 missing from its source.
  it.each([
    [1347, { thongchai: THU, athibodi: SUN, ubat: WED, lokawinat: TUE }],
    [1382, { thongchai: THU, athibodi: SUN, ubat: WED, lokawinat: TUE }],
    [1384, { thongchai: WED, athibodi: TUE, ubat: TUE, lokawinat: THU }],
    [1387, { thongchai: FRI, athibodi: FRI, ubat: THU, lokawinat: SUN }],
    [1388, { thongchai: MON, athibodi: SAT, ubat: SUN, lokawinat: MON }],
    [1389, { thongchai: THU, athibodi: SUN, ubat: WED, lokawinat: TUE }],
    [1390, { thongchai: SUN, athibodi: MON, ubat: SAT, lokawinat: WED }],
  ])('กาลโยค จ.ศ. %i matches the published table', (cs, want) => {
    expect(kalayok(cs)).toEqual(want);
  });
  it('the year changes on the day of เถลิงศก', () => {
    expect(csOfDay(d(2026, 1, 1))).toBe(1387);
    expect(csOfDay(d(2026, 4, 15))).toBe(1387);
    expect(csOfDay(d(2026, 4, 16))).toBe(1388);
  });
  it('good ดิถี listed by PPTV for January 2567', () => {
    expect(thaiDayRules(d(2024, 1, 1)).good).toContain('sitthi');
    expect(thaiDayRules(d(2024, 1, 7)).good).toContain('sitthi');
    expect(thaiDayRules(d(2024, 1, 8)).good).toContain('mahasitthi');
    expect(thaiDayRules(d(2024, 1, 9)).good).toContain('mahasitthi');
  });
  it('กาลโยค of the day, bans and ดิถีเรียงหมอน', () => {
    expect(thaiDayRules(d(2026, 12, 14)).kala).toEqual(['thongchai', 'lokawinat']);
    expect(thaiDayRules(d(2026, 12, 26)).bans.map((b) => b.key)).toContain('mahasun');
    expect(thaiDayRules(d(2026, 12, 9)).bans.map((b) => b.key)).toContain('dab');
    expect(thaiDayRules(d(2026, 12, 8)).riangmon).toBe(true); // แรม 14 ค่ำ
  });
  it('ฤกษ์บน: the changes printed by Thai almanacs (UTC+06:42), to the minute', () => {
    const at = (date: ReturnType<typeof d>) => moonNakshatras(date).map((s) => [s.reuk, clock(s.from)]);
    expect(moonNakshatras(d(2026, 7, 27))).toEqual([
      { nakshatra: 19, reuk: 'thalittho', from: 0, to: 492 },
      { nakshatra: 20, reuk: 'mahatthano', from: 492, to: 1440 },
    ]);
    expect(at(d(2026, 1, 7))[1]).toEqual(['mahatthano', '14:43']);
    expect(at(d(2026, 1, 28))[1]).toEqual(['phumipalo', '07:00']);
  });
  it('ฤกษ์บน spans cover each day without gaps or empty spans', () => {
    const check = (date: ReturnType<typeof d>) => {
      const s = moonNakshatras(date);
      expect(s[0].from).toBe(0);
      expect(s[s.length - 1].to).toBe(1440);
      for (let i = 0; i < s.length; i++) {
        expect(s[i].to).toBeGreaterThan(s[i].from);
        if (i) expect(s[i].from).toBe(s[i - 1].to);
      }
    };
    for (let day = 1; day <= 31; day++) check(d(2026, 12, day));
    // The Moon changes นักษัตร at exactly 24:00 here; the new one starts the next day.
    expect(moonNakshatras(d(1893, 2, 2)).map((s) => s.nakshatra)).toEqual([9, 10]);
    expect(moonNakshatras(d(1893, 2, 3))[0]).toMatchObject({ nakshatra: 11, from: 0 });
    check(d(1893, 2, 2));
  });
  it('a day can be both วันดับ and วันศูนย์', () => {
    expect(thaiDayRules(d(1952, 10, 17)).bans.map((b) => b.key)).toEqual(['dab', 'sun']);
  });
  it('kalayok refuses a year beyond exact arithmetic', () => {
    expect(() => kalayok(2 ** 53)).toThrow(RangeError);
  });
});
