# Changelog

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
