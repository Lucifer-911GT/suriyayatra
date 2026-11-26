// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * Birth-chart readings of a longitude: houses (ภพ) counted by whole signs from the ascendant,
 * the 27 นักษัตร with their quarter (บาท) and ฤกษ์ group, นวางศ์ and ตรียางศ์, and a whole
 * chart at a moment ({@link natalChart}).
 *
 * All inputs and outputs are arcminutes from 0° เมษ, as elsewhere in this package.
 */
import { BODIES, assertMoment, longitude, position, type Body, type Moment, type Position } from './astro.js';
import { ascendant, type AscendantSun } from './lagna.js';

import { FULL, SIGN } from './math.js';

/** One นักษัตร is 13°20′; one quarter (บาท) and one นวางศ์ are 3°20′; one ตรียางศ์ is 10°. */
const NAKSHATRA = 800;
const PADA = 200;
const DREKKANA = 600;

function arc(x: number): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new RangeError('Longitude must be a finite number of arcminutes');
  return ((Math.floor(x) % FULL) + FULL) % FULL;
}

/** The twelve houses from the ascendant: ตนุ (1) … วินาศ (12). */
export const HOUSE_TH = Object.freeze(['ตนุ', 'กดุมภะ', 'สหัชชะ', 'พันธุ', 'ปุตตะ', 'อริ', 'ปัตนิ', 'มรณะ', 'ศุภะ', 'กัมมะ', 'ลาภะ', 'วินาศ'] as const);

/** House 1–12 of a longitude, counting whole signs from the ascendant's sign. */
export function house(longitudeArcmin: number, ascendantArcmin: number): number {
  return ((Math.floor(arc(longitudeArcmin) / SIGN) - Math.floor(arc(ascendantArcmin) / SIGN) + 12) % 12) + 1;
}

/** The 27 นักษัตร from 0° เมษ, one common Thai spelling each; use the index for logic. */
export const NAKSHATRA_TH = Object.freeze([
  'อัศวินี', 'ภรณี', 'กฤตติกา', 'โรหิณี', 'มฤคศิระ', 'อารทรา', 'ปุนัพสุ', 'ปุษยะ', 'อาศเลษา',
  'มาฆะ', 'ปุพพผลคุนี', 'อุตตรผลคุนี', 'หัตถะ', 'จิตรา', 'สวาตี', 'วิสาขะ', 'อนุราธะ', 'เชษฐะ',
  'มูละ', 'ปุพพาสาฬหะ', 'อุตตราสาฬหะ', 'สาวนะ', 'ธนิษฐะ', 'สตภิสะ', 'ปุพพภัททะ', 'อุตตรภัททะ', 'เรวตี',
] as const);

/** The nine ฤกษ์ groups; นักษัตร n (1–27) belongs to group (n − 1) mod 9. */
export const REUK_GROUPS = Object.freeze([
  'thalittho', 'mahatthano', 'choro', 'phumipalo', 'thesatri', 'thewi', 'phetchakhat', 'racha', 'samano',
] as const);
export type ReukGroup = (typeof REUK_GROUPS)[number];
export const REUK_TH: Readonly<Record<ReukGroup, string>> = Object.freeze({
  thalittho: 'ทลิทโทฤกษ์', mahatthano: 'มหัทธโนฤกษ์', choro: 'โจโรฤกษ์', phumipalo: 'ภูมิปาโลฤกษ์', thesatri: 'เทศาตรีฤกษ์',
  thewi: 'เทวีฤกษ์', phetchakhat: 'เพชฌฆาตฤกษ์', racha: 'ราชาฤกษ์', samano: 'สมโณฤกษ์',
});

export interface Nakshatra {
  /** 1 (อัศวินี) … 27 (เรวตี). */
  index: number;
  th: string;
  /** บาท 1–4. */
  quarter: number;
  reuk: ReukGroup;
}

/** The นักษัตร of a longitude, its quarter and ฤกษ์ group. */
export function nakshatra(longitudeArcmin: number): Nakshatra {
  const l = arc(longitudeArcmin);
  const i = Math.floor(l / NAKSHATRA);
  return { index: i + 1, th: NAKSHATRA_TH[i], quarter: Math.floor((l % NAKSHATRA) / PADA) + 1, reuk: REUK_GROUPS[i % 9] };
}

/** A divisional chart's reading: which part of the sign (1-based) and the sign it maps to (0 = เมษ). */
export interface DivisionalSign {
  part: number;
  sign: number;
}

/** นวางศ์: the ninth part of the sign (1–9) and the sign it falls in (0 = เมษ). */
export function navamsa(longitudeArcmin: number): DivisionalSign {
  const l = arc(longitudeArcmin);
  return { part: Math.floor((l % SIGN) / PADA) + 1, sign: Math.floor(l / PADA) % 12 };
}

/** ตรียางศ์: the third of the sign (1–3) and its sign — the sign itself, the 5th and the 9th from it. */
export function drekkana(longitudeArcmin: number): DivisionalSign {
  const l = arc(longitudeArcmin);
  const part = Math.floor((l % SIGN) / DREKKANA);
  return { part: part + 1, sign: (Math.floor(l / SIGN) + 4 * part) % 12 };
}

export interface ChartPoint extends Position {
  /** House 1–12 from the ascendant (the ascendant itself is 1). */
  house: number;
  nakshatra: Nakshatra;
  navamsa: DivisionalSign;
  drekkana: DivisionalSign;
}

export interface NatalChartInput {
  /** The moment of birth (UTC+06:42 clock); see fromThaiTime / fromDate. */
  at: Moment;
  /** Sunrise that day on the same clock (e.g. {@link provinceSunrise}); default 06:00. */
  sunrise?: number;
  /** Which Sun the ascendant counts from; see {@link ascendant}. */
  sun?: AscendantSun;
  table?: readonly number[];
}

export interface NatalChart {
  ascendant: ChartPoint;
  bodies: Record<Body, ChartPoint>;
}

function point(l: number, asc: number): ChartPoint {
  return { ...position(l), house: house(l, asc), nakshatra: nakshatra(l), navamsa: navamsa(l), drekkana: drekkana(l) };
}

/** The ascendant and the ten bodies at a moment, each with its house, นักษัตร, นวางศ์ and ตรียางศ์. */
export function natalChart(input: NatalChartInput): NatalChart {
  if (typeof input !== 'object' || input === null) throw new RangeError('natalChart needs { at, sunrise?, sun?, table? }');
  assertMoment(input.at);
  const asc = ascendant(input);
  const bodies = {} as Record<Body, ChartPoint>;
  for (const b of BODIES) bodies[b] = point(longitude(b, input.at), asc);
  return { ascendant: point(asc, asc), bodies };
}
