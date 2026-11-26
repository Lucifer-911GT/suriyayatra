// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * The Thai astrological birth weekday (วันเกิดทางโหราศาสตร์).
 *
 * The astrological day starts at sunrise, taken as 06:00, so a birth before 06:00 belongs to
 * the day before. Wednesday from 18:00 until the next 06:00 is Wednesday night (พุธกลางคืน),
 * ruled by Rahu (๘).
 */
import { toJdn, type YMD } from './julian.js';
import { mod } from './math.js';

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** The planet of a birth day as Thai astrology counts them: 1 อาทิตย์ … 7 เสาร์, 8 ราหู (Wednesday night). */
export type DayPlanet = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface BirthWeekday {
  /** 0 = Sunday … 6 = Saturday, 7 = Wednesday night. */
  index: Weekday | 7;
  dayTh: string;
  /** Ruling body: 1 อาทิตย์ … 7 เสาร์, 8 ราหู. */
  planet: DayPlanet;
  planetTh: string;
  /** True when a birth before 06:00 was moved to the previous day. */
  previousDay: boolean;
}

const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'พุธกลางคืน'];
const PLANETS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'ราหู'];

/** Weekday of a calendar date, 0 = Sunday. */
export function weekday(date: YMD): Weekday {
  // Floor modulo: JDNs before 4713 BCE are negative, and `%` would give a negative weekday there.
  return mod(toJdn(date) + 1, 7) as Weekday;
}

/**
 * @param date the calendar date of birth
 * @param hour,minute clock time of birth; omit for the plain calendar weekday
 * @param dayStart minute the astrological day starts, default 360 (06:00)
 */
export function birthWeekday(date: YMD, hour?: number, minute = 0, dayStart = 360): BirthWeekday {
  const cal = weekday(date);
  if (hour === undefined) return make(cal, false);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new RangeError('Birth time must be 00:00–23:59');
  }
  if (!Number.isInteger(dayStart) || dayStart < 0 || dayStart >= 1440) throw new RangeError('dayStart must be a whole minute 0–1439');
  const t = hour * 60 + minute;
  const early = t < dayStart;
  const day = (early ? (cal + 6) % 7 : cal) as Weekday;
  const wedNight = day === 3 && (early || t >= 18 * 60);
  return make(wedNight ? 7 : day, early);
}

function make(index: Weekday | 7, previousDay: boolean): BirthWeekday {
  return { index, dayTh: DAYS[index], planet: (index + 1) as DayPlanet, planetTh: PLANETS[index], previousDay };
}
