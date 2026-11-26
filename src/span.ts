// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/** Limits on how many days one call may walk through. Internal; the constants are re-exported. */

/** Default longest span, in days, that the span functions accept (about ten years). */
export const DEFAULT_MAX_DAYS = 3660;

/** Throws a RangeError unless the inclusive day span `a`…`b` fits within `maxDays`. */
export function checkSpanLength(a: number, b: number, maxDays: number): void {
  if (!(maxDays > 0)) throw new RangeError('maxDays must be positive');
  if (b - a + 1 > maxDays) throw new RangeError('The span is longer than maxDays; split it or raise maxDays');
}
