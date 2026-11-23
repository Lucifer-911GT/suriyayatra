# Changelog

## 0.1.1

- `ingresses(bodies, from, to, { settleMinutes })`: sign changes over a span of days, with the
  back-and-forth crossings the integer rules make near a boundary merged into one change.
- Works from CommonJS too: `require('suriyayatra')` loads `dist/cjs`; ESM `import` is unchanged.

## 0.1.0

- Thai lunar calendar, holy days, year animal.
- Positions of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu and Uranus,
  sign changes per day, ascendant from rising times, Thai birth weekday.
