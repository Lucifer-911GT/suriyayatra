// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * ทักษา (ภูมิทักษา): the eight places of the planets counted from one's birth planet.
 *
 * The planets go round in the ทักษา order อาทิตย์ จันทร์ อังคาร พุธ เสาร์ พฤหัสบดี ราหู ศุกร์
 * (๑ ๒ ๓ ๔ ๗ ๕ ๘ ๖). Starting from the planet of the birth day they take the places บริวาร อายุ
 * เดช ศรี มูละ อุตสาหะ มนตรี กาลกิณี. The birth planet comes from {@link birthWeekday}, so a
 * birth before 06:00 counts as the day before and Wednesday night is ราหู (๘).
 */
import { birthWeekday, type DayPlanet } from './birthday.js';
import type { YMD } from './julian.js';

/** The ทักษา order of the planets. */
export const TAKSA_ORDER: readonly DayPlanet[] = Object.freeze<DayPlanet[]>([1, 2, 3, 4, 7, 5, 8, 6]);

export const TAKSA_PLACES = Object.freeze(['บริวาร', 'อายุ', 'เดช', 'ศรี', 'มูละ', 'อุตสาหะ', 'มนตรี', 'กาลกิณี'] as const);
export type TaksaPlace = (typeof TAKSA_PLACES)[number];

function checkPlanet(p: number): asserts p is DayPlanet {
  if (!Number.isInteger(p) || p < 1 || p > 8) throw new RangeError('A ทักษา planet is a whole number 1–8');
}

/** The place of `planet` for someone whose birth planet is `birthPlanet`. */
export function taksaPlace(birthPlanet: DayPlanet, planet: DayPlanet): TaksaPlace {
  checkPlanet(birthPlanet);
  checkPlanet(planet);
  return TAKSA_PLACES[(TAKSA_ORDER.indexOf(planet) - TAKSA_ORDER.indexOf(birthPlanet) + 8) % 8];
}

/** The planet in each place, for a birth planet. */
export function taksa(birthPlanet: DayPlanet): Record<TaksaPlace, DayPlanet> {
  checkPlanet(birthPlanet);
  const start = TAKSA_ORDER.indexOf(birthPlanet);
  const out = {} as Record<TaksaPlace, DayPlanet>;
  TAKSA_PLACES.forEach((place, i) => { out[place] = TAKSA_ORDER[(start + i) % 8]; });
  return out;
}

export interface BirthTaksa {
  /** Birth planet, 1–8 (8 = ราหู, Wednesday night). */
  planet: DayPlanet;
  /** Birth day as Thai astrology names it ("อาทิตย์", "พุธกลางคืน"). */
  dayTh: string;
  places: Record<TaksaPlace, DayPlanet>;
}

/**
 * ทักษา from a birth date and, if known, the clock time (Thai time, as {@link birthWeekday}
 * takes it). Without a time, the calendar weekday decides.
 */
export function birthTaksa(date: YMD, hour?: number, minute = 0): BirthTaksa {
  const w = birthWeekday(date, hour, minute);
  return { planet: w.planet, dayTh: w.dayTh, places: taksa(w.planet) };
}
