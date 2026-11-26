// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/** Shared arithmetic for the modules. Internal: not exported from the package. */

/** A full circle in arcminutes. */
export const FULL = 21600;
/** One zodiac sign (30°) in arcminutes. */
export const SIGN = 1800;

/** Floor modulo: the result has the sign of `n`, so negative `a` still lands in 0…n−1. */
export const mod = (a: number, n: number): number => ((a % n) + n) % n;
