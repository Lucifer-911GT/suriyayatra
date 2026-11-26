// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * Where the results have been checked against published data (พ.ศ., inclusive). Outside these
 * the rules still compute, but nothing has confirmed them; see README "ช่วงที่ใช้ได้".
 */
export const VALIDATED_RANGES = Object.freeze({
  /** Planet positions, sign changes and retrogrades, against a suriyayatra ephemeris. */
  positions: Object.freeze({ fromBe: 2300, toBe: 2700 }),
  /** Thai lunar calendar and holy days, against an almanac table and official holy days. */
  lunarCalendar: Object.freeze({ fromBe: 2539, toBe: 2574 }),
} as const);
