# Sources

## Formulas

- J. C. Eade, "Rules for Interpolation in the Thai Calendar: Suriyayatra versus the Sasana",
  *Journal of the Siam Society* 88 (2000). Year-start arithmetic, the อธิกวาร rule (กัมมัชพล ≤ 207;
  อวมาน ≤ 126 / ≤ 137), the rule that an อธิกมาส year cannot also take the extra day,
  and the worked example for CS 1325 (Appendix A), used as a test.
- L. Gislén and J. C. Eade, "The Calendars of Southeast Asia, 2: Burma and Thailand"
  (*Journal of Astronomical History and Heritage* 22, 2019; via NARIT).
- ผ่า คัมภีร์ พระสุริยยาตร์ และ พระมานัตต์ (rungnapa-astro.com) — หรคุณเถลิงศก, กัมมัชพล, อวมาน.
- วิวิธโหราศาสตร์ — ภาคคำนวณสุริยยาตร: definitions of หรคุณ, กัมมัชพล, อวมาน.
- The tithi 24→6 and 25→5 adjustments to the อธิกมาส rule follow F. G. Faraut (as implemented
  in [pythaidate](https://github.com/hmmbug/pythaidate), MIT, © 2023 Mark Hollow).
  No code was copied; the rule was re-implemented here.

- L. Gislén, "Planetary longitudes in Thai and Burmese astronomy"
  (*Journal of Astronomical History and Heritage* 22, 2019; via NARIT): the Sun and Moon procedure
  (24350 / 811 / 14, −3′; อวมาน ÷ 25, −40′; อุจจพล 3232 days; the Sun and Moon equation tables),
  the two-step planetary correction scheme, and the Thai periods of Rahu (6795 days) and Ketu (679).
- โหราวิทยา ภาค 1 บทที่ 8 (reproduced on astroneemo.net): the ordinary rising-time table
  (อันโตนาทีสามัญ) and the rule for reading the ascendant from the time after sunrise.
- [thai-astrology](https://github.com/Kongesque/thai-astrology) (MIT, © 2026 Kongesque) was read
  as a cross-reference for the classical planetary constants (mean-motion divisors, apogees,
  divisors of the corrections, the shadow table 0/244/427/488). No code was copied; the procedure
  was written here independently and every constant was confirmed against the ephemeris below.

## Validation data

- **Planet positions**: myhora.com, ปฏิทินโหราศาสตร์ไทย สุริยยาตร์ (monthly and daily pages, read
  21 Nov 2026). It states it computes by คัมภีร์สุริยยาตร์ and คัมภีร์มานัตต์ at 24:00 Bangkok mean
  time (UTC+06:42) and was checked against ประติทินโหราศาสตร์ 2417–2479 (หลวงอรรถวาทีธรรมประวรรต),
  คัมภีร์โหราศาสตร์ไทยมาตรฐาน (หลวงวิศาลดรุณกร), คัมภีร์สุริยยาตรแลมานัตต์ (อ.วรพล ไม้สน) and
  ปฏิทินโหราศาสตร์ไทย 2504–2553 (อ.ทองเจือ อ่างแก้ว). Rows are in `test/ephemeris-data.ts`.
- **Retrograde periods**: the same site's yearly summary "ดาวโคจรวิปริต" (read 23 Nov 2026), 112 periods in `test/retrograde-data.ts`.


See `test/data.ts`: every row names its source (Thai Wikipedia holiday tables citing
ปัณณวัฒน์, *ปฏิทิน 100 ปี พ.ศ. 2468-2568* (2550); ประกาศสงกรานต์ พ.ศ. 2569 by the Royal Court
astrologers as reported by Thai PBS and Dailynews; holy-day lists of 2567 and 2569 from Thai PBS,
Sanook, 7-Eleven ALL Online and PPTV).
