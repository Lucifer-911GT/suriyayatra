// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * Sunrise at a place, for the ascendant (ลัคนา) from the real local sunrise.
 *
 * NOAA's solar position equations (after Meeus, "Astronomical Algorithms"): the Sun's
 * declination and the equation of time, iterated at the moment of rising. Sunrise is the upper
 * limb on a sea-level horizon with standard refraction (zenith 90.833°); terrain, elevation and
 * weather are ignored. Good to well under a minute for 1800–2200 CE at Thai latitudes.
 */
import { LMT_OFFSET_MINUTES, MINUTES_PER_DAY } from './astro.js';
import { toJdn, type YMD } from './julian.js';

const RAD = Math.PI / 180;
const ZENITH = 90.833;
const ITERATIONS = 3;

/** UTC minutes after midnight of the day `jdn` at which the Sun rises, or null (polar day/night). */
function riseUtc(jdn: number, lat: number, lon: number): number | null {
  let t = 720 - 4 * lon; // first guess: local noon
  for (let i = 0; i < ITERATIONS; i++) {
    const T = (jdn - 0.5 + t / MINUTES_PER_DAY - 2451545) / 36525;
    const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
      + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const omega = 125.04 - 1934.136 * T;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
    const y = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime = 4 / RAD * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD)
      + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
      - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
    const cosH = Math.cos(ZENITH * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
    if (cosH > 1 || cosH < -1) return null;
    t = 720 - 4 * (lon + Math.acos(cosH) / RAD) - eqTime;
  }
  return t;
}

/**
 * Sunrise on `date` at latitude/longitude (degrees, north and east positive), as minutes after
 * midnight on the suriyayatra clock (UTC+06:42) — the value {@link ascendant} takes as
 * `sunrise`. Fractional; null when the Sun does not rise that day.
 *
 * `date` is the day on the UTC+06:42 clock, which is the Thai calendar day at any hour a
 * sunrise can happen in Thailand.
 */
export function sunriseMinute(date: YMD, lat: number, lon: number): number | null {
  const jdn = toJdn(date);
  if (typeof lat !== 'number' || !(Math.abs(lat) <= 90) || typeof lon !== 'number' || !(Math.abs(lon) <= 180)) {
    throw new RangeError('lat must be −90…90 and lon −180…180 degrees');
  }
  // The rise that falls in this day on the UTC+06:42 clock may be computed from a neighbouring
  // UTC day far from Bangkok's meridian, so try the three around it.
  for (const d of [0, -1, 1]) {
    const utc = riseUtc(jdn + d, lat, lon);
    if (utc === null) continue;
    const minute = utc + LMT_OFFSET_MINUTES + d * MINUTES_PER_DAY;
    if (minute >= 0 && minute < MINUTES_PER_DAY) return minute;
  }
  return null;
}
