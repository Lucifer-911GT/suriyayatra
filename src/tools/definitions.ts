// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * The tools: each one a JSON-in, JSON-out wrapper around the library with fixed limits.
 * Inputs use Thai standard time and Gregorian dates, as a person would give them; results carry
 * both the almanac clock (UTC+06:42) where the library uses it and Thai standard time.
 */
import {
  BODIES, RETROGRADE_BODIES, MINUTES_PER_DAY, THAI_TIME_OFFSET_MINUTES, LMT_OFFSET_MINUTES, clock, endOfDay, fromThaiTime,
  ingresses, momentDate, positions, retrogrades, type Body, type Moment, type RetrogradeBody,
} from '../astro.js';
import { buddhistHolyDays, holyDays } from '../holidays.js';
import { fromJdn, toJdn, type YMD } from '../julian.js';
import { toThaiLunar, yearAnimal } from '../lunar.js';
import type { AscendantSun } from '../lagna.js';
import { natalChart } from '../natal.js';
import { provinceByCode, provinceSunrise } from '../provinces.js';
import { sunriseMinute } from '../sunrise.js';
import { birthTaksa } from '../taksa.js';
import { moonNakshatras, thaiDayRules } from '../textbook.js';
import {
  DATE, OUT_DATE, OUT_POSITION, OUT_THAI_CLOCK, PLACE, S, TIME, type JsonSchema,
} from './schema.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  run(input: Record<string, unknown>): unknown;
}

/** Longest spans the tools accept: fixed here, not settable by the caller. */
export const TOOL_LIMITS = Object.freeze({ holyDays: 400, signChanges: 366, retrogrades: 3660 });

const ALMANAC_TO_THAI = THAI_TIME_OFFSET_MINUTES - LMT_OFFSET_MINUTES; // 18 minutes

/** A moment on the almanac clock as Thai standard time. */
function thaiClock(m: Moment): { date: YMD; time: string } {
  const total = m.minute + ALMANAC_TO_THAI;
  const days = Math.floor(total / MINUTES_PER_DAY);
  return { date: fromJdn(m.jdn + days), time: clock(total - days * MINUTES_PER_DAY) };
}

function spanDays(from: YMD, to: YMD, max: number): void {
  const n = toJdn(to) - toJdn(from) + 1;
  if (n < 1) throw new RangeError('`to` is before `from`');
  if (n > max) throw new RangeError(`The span is longer than this tool allows (${max} days); split it`);
}

type Place = { province?: number; lat?: number; lon?: number } | undefined;

/** Sunrise on the almanac clock for the moment's day at a place; 360 (06:00) without one. */
function sunriseFor(place: Place, m: Moment): number {
  if (!place) return 360;
  const date = momentDate(m);
  const day = { year: date.year, month: date.month, day: date.day };
  if (place.province !== undefined) {
    if (place.lat !== undefined || place.lon !== undefined) throw new RangeError('Give a province or lat and lon, not both');
    return provinceSunrise(place.province, day);
  }
  if (place.lat === undefined || place.lon === undefined) throw new RangeError('A place needs a province, or lat and lon together');
  const minute = sunriseMinute(day, place.lat, place.lon);
  if (minute === null) throw new RangeError('The Sun does not rise there that day');
  return minute;
}

/** A clock time as the tools take it: Thai standard time. */
type ClockTime = { hour: number; minute: number };

const momentOf = (date: YMD, time?: ClockTime): Moment =>
  time ? fromThaiTime(date, time.hour, time.minute) : endOfDay(date);

const chartPoint: JsonSchema = {
  ...OUT_POSITION,
  properties: {
    ...OUT_POSITION.properties,
    house: S.int('House 1–12 from the ascendant', 1, 12),
    nakshatra: { type: 'object', properties: { index: S.int('นักษัตร 1–27', 1, 27), th: S.str('Thai name'), quarter: S.int('บาท', 1, 4), reuk: S.str('ฤกษ์ group') } },
    navamsa: { type: 'object', properties: { part: S.int('Ninth of the sign', 1, 9), sign: S.int('Sign', 0, 11) } },
    drekkana: { type: 'object', properties: { part: S.int('Third of the sign', 1, 3), sign: S.int('Sign', 0, 11) } },
  },
  required: [...(OUT_POSITION.required ?? []), 'house', 'nakshatra', 'navamsa', 'drekkana'],
};

const bodyMap = (item: JsonSchema): JsonSchema => ({ type: 'object', properties: Object.fromEntries(BODIES.map((b) => [b, item])), required: [...BODIES] });

export const TOOLS: readonly Tool[] = [
  {
    name: 'thai_lunar_date',
    description: 'Thai lunar calendar date (ข้างขึ้น/แรม, ค่ำ, เดือน), whether it is a วันพระ, and the year animal (ปีนักษัตร) for a Gregorian date. Supported CE 1888–2239.',
    inputSchema: S.obj({ date: DATE }, ['date']),
    outputSchema: S.obj({
      label: S.str('e.g. "ขึ้น 15 ค่ำ เดือน 12"'), phase: { enum: ['waxing', 'waning'] }, day: S.int('ค่ำ', 1, 15),
      month: S.int('Lunar month', 1, 12), secondEighth: { type: 'boolean' }, holyDay: { type: 'boolean' },
      monthDays: { enum: [29, 30] }, cs: { type: 'integer' }, yearAnimal: S.str('ปีนักษัตร'),
    }, ['label', 'phase', 'day', 'month', 'holyDay', 'yearAnimal']),
    run: ({ date }) => {
      const d = date as YMD;
      return { ...toThaiLunar(d), yearAnimal: yearAnimal(d).th };
    },
  },
  {
    name: 'holy_days',
    description: `Every วันพระ (Buddhist holy day) between two dates, inclusive, with its lunar date. At most ${TOOL_LIMITS.holyDays} days per call.`,
    inputSchema: S.obj({ from: DATE, to: DATE }, ['from', 'to']),
    outputSchema: { type: 'array', items: S.obj({ date: OUT_DATE, label: S.str('Lunar date') }, ['date', 'label']) },
    run: ({ from, to }) => {
      spanDays(from as YMD, to as YMD, TOOL_LIMITS.holyDays);
      return holyDays(from as YMD, to as YMD).map((h) => ({ date: h.date, label: h.lunar.label }));
    },
  },
  {
    name: 'buddhist_holy_days',
    description: 'Dates of มาฆบูชา, วิสาขบูชา, อาสาฬหบูชา, เข้าพรรษา, ออกพรรษา and ลอยกระทง for a Buddhist-era year (พ.ศ. 2432–2781).',
    inputSchema: S.obj({ be: S.int('Buddhist-era year (พ.ศ.)', 2432, 2781) }, ['be']),
    outputSchema: S.obj(Object.fromEntries(['makhaBucha', 'visakhaBucha', 'asalhaBucha', 'khaoPhansa', 'okPhansa', 'loyKrathong'].map((k) => [k, OUT_DATE])),
      ['makhaBucha', 'visakhaBucha', 'asalhaBucha', 'khaoPhansa', 'okPhansa', 'loyKrathong']),
    run: ({ be }) => buddhistHolyDays(be as number),
  },
  {
    name: 'planet_positions',
    description: 'สมผุสดาว: sign, degree and arcminute of the ten Thai bodies (sun … uranus) by the suriyayatra rules. Without a time, positions are at 24:00 almanac time, as Thai ephemerides print them.',
    inputSchema: S.obj({ date: DATE, time: TIME }, ['date']),
    outputSchema: S.obj({ at: OUT_THAI_CLOCK, bodies: bodyMap(OUT_POSITION) }, ['at', 'bodies']),
    run: ({ date, time }) => {
      const m = momentOf(date as YMD, time as ClockTime | undefined);
      return { at: thaiClock(m), bodies: positions(m) };
    },
  },
  {
    name: 'sign_changes',
    description: `When bodies change sign (ย้ายราศี) between two dates, inclusive; brief back-and-forth crossings at a boundary are merged. At most ${TOOL_LIMITS.signChanges} days per call. Times are given on the almanac clock (UTC+06:42) and in Thai standard time.`,
    inputSchema: S.obj({
      bodies: { type: 'array', items: { type: 'string', enum: BODIES }, minItems: 1, maxItems: 10, uniqueItems: true, description: 'Default: all ten' },
      from: DATE, to: DATE,
    }, ['from', 'to']),
    outputSchema: { type: 'array', items: S.obj({ body: { enum: BODIES }, fromSign: S.int('Sign left', 0, 11), toSign: S.int('Sign entered', 0, 11), almanacTime: S.str('HH:MM UTC+06:42'), thai: OUT_THAI_CLOCK }, ['body', 'fromSign', 'toSign', 'almanacTime', 'thai']) },
    run: ({ bodies, from, to }) => {
      spanDays(from as YMD, to as YMD, TOOL_LIMITS.signChanges);
      return ingresses((bodies as Body[] | undefined) ?? BODIES, from as YMD, to as YMD)
        .map((e) => ({ body: e.body, fromSign: e.from, toSign: e.to, almanacTime: clock(e.at.minute), thai: thaiClock(e.at) }));
    },
  },
  {
    name: 'retrogrades',
    description: `Retrograde periods (ดาวพักร์) of mercury, venus, mars, jupiter, saturn and uranus that overlap two dates, each given whole. At most ${TOOL_LIMITS.retrogrades} days per call.`,
    inputSchema: S.obj({
      bodies: { type: 'array', items: { type: 'string', enum: RETROGRADE_BODIES }, minItems: 1, maxItems: 6, uniqueItems: true, description: 'Default: all six' },
      from: DATE, to: DATE,
    }, ['from', 'to']),
    outputSchema: { type: 'array', items: S.obj({ body: { enum: RETROGRADE_BODIES }, start: OUT_DATE, end: OUT_DATE, days: { type: 'integer' } }, ['body', 'start', 'end', 'days']) },
    run: ({ bodies, from, to }) => {
      spanDays(from as YMD, to as YMD, TOOL_LIMITS.retrogrades);
      return retrogrades((bodies as RetrogradeBody[] | undefined) ?? RETROGRADE_BODIES, from as YMD, to as YMD);
    },
  },
  {
    name: 'natal_chart',
    description: "Thai birth chart (ดวงกำเนิด): the ascendant (ลัคนา, อันโตนาทีสามัญ) and ten bodies, each with house (ภพ), นักษัตร and บาท, ฤกษ์ group, นวางศ์ and ตรียางศ์. Give the birthplace for the real sunrise (else 06:00). `sun` chooses the ascendant method: 'sunrise' (สมผุสอาทิตย์อุทัย, default) or 'birth'.",
    inputSchema: S.obj({ date: DATE, time: TIME, place: PLACE, sun: { type: 'string', enum: ['sunrise', 'birth'], description: 'Ascendant method' } }, ['date', 'time']),
    outputSchema: S.obj({ at: OUT_THAI_CLOCK, sunriseAlmanacMinute: { type: 'number' }, ascendant: chartPoint, bodies: bodyMap(chartPoint) }, ['at', 'ascendant', 'bodies']),
    run: ({ date, time, place, sun }) => {
      const at = momentOf(date as YMD, time as ClockTime);
      const sunrise = sunriseFor(place as Place, at);
      const chart = natalChart({ at, sunrise, sun: (sun as AscendantSun | undefined) ?? 'sunrise' });
      return { at: thaiClock(at), sunriseAlmanacMinute: sunrise, ...chart };
    },
  },
  {
    name: 'taksa',
    description: 'ทักษา: the planet in each of the eight places (บริวาร … กาลกิณี) from the birth day. With a birth time, before 06:00 counts as the day before and Wednesday 18:00–06:00 is พุธกลางคืน (ราหู, 8). Planets: 1 อาทิตย์ … 7 เสาร์, 8 ราหู.',
    inputSchema: S.obj({ date: DATE, time: TIME }, ['date']),
    outputSchema: S.obj({ planet: S.int('Birth planet', 1, 8), dayTh: S.str('Birth day'), places: { type: 'object' } }, ['planet', 'dayTh', 'places']),
    run: ({ date, time }) => {
      const t = time as ClockTime | undefined;
      return birthTaksa(date as YMD, t?.hour, t?.minute);
    },
  },
  {
    name: 'thai_day_rules',
    description: 'ฤกษ์ไทยตามตำรา for a date: the year\'s กาลโยค and those falling that day, good and bad ดิถี, strong bans (มหาสูญ, ทรธึก, อายกรรมพลาย, กระทิงวัน, วันดับ, วันศูนย์), ดิถีอัคนิโรธ, ดิถีเรียงหมอน, and the Moon\'s ฤกษ์ through the day.',
    inputSchema: S.obj({ date: DATE }, ['date']),
    outputSchema: S.obj({
      cs: { type: 'integer' }, kalayok: { type: 'object' }, kala: { type: 'array' }, good: { type: 'array' }, bad: { type: 'array' },
      bans: { type: 'array' }, akkhaniroth: { type: 'string' }, mahasunMonth: { type: 'boolean' }, riangmon: { type: 'boolean' },
      reuk: { type: 'array', items: S.obj({ nakshatra: S.int('นักษัตร', 1, 27), reuk: S.str('ฤกษ์ group'), almanacFrom: S.str('HH:MM UTC+06:42'), almanacTo: S.str('HH:MM UTC+06:42') }, ['nakshatra', 'reuk', 'almanacFrom', 'almanacTo']) },
    }, ['cs', 'kalayok', 'kala', 'good', 'bad', 'bans', 'riangmon', 'reuk']),
    run: ({ date }) => ({
      ...thaiDayRules(date as YMD),
      reuk: moonNakshatras(date as YMD).map((r) => ({ nakshatra: r.nakshatra, reuk: r.reuk, almanacFrom: clock(r.from), almanacTo: clock(r.to) })),
    }),
  },
  {
    name: 'sunrise',
    description: 'Sunrise on a date at a Thai province or any latitude/longitude (NOAA equations, upper limb, standard refraction), in Thai standard time and on the almanac clock (UTC+06:42).',
    inputSchema: S.obj({ date: DATE, place: PLACE }, ['date', 'place']),
    outputSchema: S.obj({ thaiTime: S.str('HH:MM, Thai standard time'), almanacMinute: { type: 'number', description: 'Minutes after midnight, UTC+06:42' }, province: S.str('Thai name, when a province was given') }, ['thaiTime', 'almanacMinute']),
    run: ({ date, place }) => {
      const d = date as YMD;
      const minute = sunriseFor(place as Place, { jdn: toJdn(d), minute: 0 });
      const p = place as Place;
      return {
        thaiTime: clock(Math.round(minute) + ALMANAC_TO_THAI),
        almanacMinute: Math.round(minute * 100) / 100,
        ...(p?.province !== undefined ? { province: provinceByCode(p.province).th } : {}),
      };
    },
  },
];
