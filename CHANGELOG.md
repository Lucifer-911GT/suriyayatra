# Changelog

## 0.2.0

### Breaking

- **License: Apache-2.0** (was MIT), with a NOTICE file that copies must keep. 0.1.0–0.1.3 stay
  under MIT. Validation data in `test/` is not covered by the license (see SOURCES.md).
- Input that used to give an answer now throws a `RangeError`:
  - `yearType`, `ruleYearType`, `monthsOf` and `fromThaiLunar` outside CS `MIN_CS`–`MAX_CS`
    (`yearType(NaN)` used to return `'normal'`);
  - `eraYear` / `thaloengSokSeconds` for a CS year that is not a whole number ≥ 0;
  - `csToBe` / `beToCs` / `csToCe` for non-integers; `clock`, `monthLabel`, `momentDate`,
    `meanSunRaw`, `solarAccumulation` and `settleIngresses` for bad input;
  - dates beyond ±`MAX_ABS_YEAR` (1,000,000) years and JDNs beyond ±`MAX_ABS_JDN`, where the
    integer arithmetic stops being exact and results used to be silently wrong;
  - `ingresses` with `settleMinutes` outside 0–`MAX_SETTLE_MINUTES` (30 days).
- `signChanges`, `ingresses` and `retrogrades` count a repeated body once (results are no
  longer repeated).

### Added

- **AI tools** (`suriyayatra/tools`): `getTools()` lists ten tools with JSON Schema 2020-12 for
  input and output; `executeTool(name, args)` validates, runs and returns
  `{ ok, tool, version, data | error }` without throwing. Fixed span limits (`TOOL_LIMITS`).
- **CLI**: `suriyayatra tools | schema <tool> | call <tool> [--input file]`, JSON on stdout, exit
  codes 0 / 1 / 2, input capped at 1 MB.
- **Ascendant**: `ascendant({ …, sun })` chooses the Sun the rising times count from —
  `'sunrise'` (default, unchanged: อันโตนาทีสามัญ สมผุสอาทิตย์อุทัย) or `'birth'` (the Sun at the
  moment, continuous across sunrise). `sunrise` may be fractional.
- **Sunrise**: `sunriseMinute(date, lat, lon)` (NOAA equations, no dependency; within 0.07 minute
  of Astronomy Engine for the 77 provinces, CE 1850–2200), `THAI_PROVINCES`, `provinceByCode`,
  `provinceSunrise`.
- **Birth chart**: `natalChart` (ascendant and ten bodies with house, นักษัตร, นวางศ์,
  ตรียางศ์), `house`, `nakshatra` (quarter and ฤกษ์ group), `navamsa`, `drekkana`.
- **ทักษา**: `birthTaksa`, `taksa`, `taksaPlace` — Wednesday night is ราหู.
- **Textbook day rules**: `thaiDayRules` (กาลโยค of the day, good and bad ดิถี, strong bans,
  ดิถีอัคนิโรธ, ดิถีเรียงหมอน), `kalayok`, `csOfDay`, `moonNakshatras` (ฤกษ์บน through the day,
  to the minute of the printed almanac).
- `holyDays(from, to, { maxDays })`, `HOLY_DAYS_BE_RANGE`, types `HolyDay`, `HolyDaysOptions`.
- README lists every export; SECURITY.md (reporting, guarantees, server use, releases).

### Fixed

- `ingresses`: a negative `settleMinutes` silently dropped changes on the first and last day,
  and a huge one walked thousands of days around a one-day span, getting past `maxDays`.
- January–March after CE 2238 (the last lunar year, CS 1600) now convert instead of throwing; a
  date after that year is a `RangeError`, not a plain `Error`.
- `buddhistHolyDays` checks the year against `HOLY_DAYS_BE_RANGE` (BE 2432–2781).
- `weekday` (and so `birthWeekday`) gave a negative weekday before 4713 BCE.
- `planetLongitude` refuses names such as `'constructor'` with a `RangeError`, not a `TypeError`.
- Every export returns a result or throws a `RangeError` for junk input; option objects may be
  `null`. The year-type cache no longer grows with unchecked keys.

### Security

- Exported tables (`BODIES`, `SUN_EQUATION`, `OFFICIAL_YEAR_TYPES`, `RISING_SAMANYA`, …) are
  frozen all the way down; other code in the process could change them, which silently changed
  every later result.
- Error messages no longer echo input (the `maxDays` error did).
- Fuzz tests over every export and every tool; releases are staged through npm Trusted
  Publishing and need a 2FA approval (see SECURITY.md).

### Development

- vitest 5 (the audit warnings were in vitest 3's dependencies); running the tests needs Node
  22.12 or later, the package still runs on Node 18+. ajv (tests only) checks the tool schemas.

## 0.1.3

- Input is checked: impossible dates (30 Feb), non-integer fields, minutes outside 0–1440,
  clock times outside 00:00–24:00, invalid `Date`s and unknown bodies throw a `RangeError`
  instead of giving a silent wrong answer or `null`. Error messages do not echo the input (#4).
- `ingresses` and `retrogrades` refuse spans longer than `maxDays` (default `DEFAULT_MAX_DAYS`,
  3660 days) so one call cannot tie up a server.
- `VALIDATED_RANGES`: the years each part was checked against published data.
- README: supported vs validated ranges; the retrograde thresholds are fitted to a published
  ephemeris, not taken from the classical texts.


## 0.1.2

- `retrogrades(bodies, from, to, { gapDays, minDays })` and `isRetrograde(body, date)`:
  retrograde periods (พักร์) of Mercury, Venus, Mars, Jupiter, Saturn and Uranus from the
  suriyayatra positions. Equal to the 112 periods printed in a published ephemeris for
  พ.ศ. 2400–2650 (#3).

## 0.1.1

- `ingresses(bodies, from, to, { settleMinutes })`: sign changes over a span of days, with the
  back-and-forth crossings the integer rules make near a boundary merged into one change.
- Works from CommonJS too: `require('suriyayatra')` loads `dist/cjs`; ESM `import` is unchanged.

## 0.1.0

- Thai lunar calendar, holy days, year animal.
- Positions of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu and Uranus,
  sign changes per day, ascendant from rising times, Thai birth weekday.
