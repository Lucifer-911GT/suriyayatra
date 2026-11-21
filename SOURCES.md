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

## Validation data

See `test/data.ts`: every row names its source (Thai Wikipedia holiday tables citing
ปัณณวัฒน์, *ปฏิทิน 100 ปี พ.ศ. 2468-2568* (2550); ประกาศสงกรานต์ พ.ศ. 2569 by the Royal Court
astrologers as reported by Thai PBS and Dailynews; holy-day lists of 2567 and 2569 from Thai PBS,
Sanook, 7-Eleven ALL Online and PPTV).
