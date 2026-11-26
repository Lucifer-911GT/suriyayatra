# Sources

## Texts studied

The calculations follow these texts and studies. The rules themselves are not restated here.

- คัมภีร์สุริยยาตร์ and คัมภีร์มานัตต์: the lunar calendar and the positions of the planets.
- J. C. Eade, "Rules for Interpolation in the Thai Calendar: Suriyayatra versus the Sasana",
  *Journal of the Siam Society* 88 (2000); its worked example for CS 1325 is one of the tests.
- L. Gislén and J. C. Eade, "The Calendars of Southeast Asia, 2: Burma and Thailand"
  (*Journal of Astronomical History and Heritage* 22, 2019; via NARIT).
- L. Gislén, "Planetary longitudes in Thai and Burmese astronomy"
  (*Journal of Astronomical History and Heritage* 22, 2019; via NARIT).
- F. G. Faraut on the Siamese calendar, as implemented in
  [pythaidate](https://github.com/hmmbug/pythaidate) (MIT, © 2023 Mark Hollow). No code was copied.
- ผ่า คัมภีร์ พระสุริยยาตร์ และ พระมานัตต์ (rungnapa-astro.com).
- วิวิธโหราศาสตร์: ภาคคำนวณสุริยยาตร, and "กระดานดวงเดิม" (hippohoro.blogspot.com, 2558) on the
  named ascendant variants of สุริยยาตรวิธี, among them อันโตนาทีสามัญ สมผุสอาทิตย์อุทัย.
- โหราวิทยา ภาค 1 บทที่ 8 (reproduced on astroneemo.net): the ascendant by อันโตนาทีสามัญ.
- J. Meeus, *Astronomical Algorithms* (2nd ed., 1998), through the NOAA Global Monitoring
  Laboratory solar calculator: sunrise.
- Province coordinates, codes and English names: dataengineercafe/thailand-province-latitude-longitude,
  MIT License, Copyright (c) 2020 BearData.io. The full MIT notice is in NOTICE, which ships with
  the package.

## Textbook day rules (`thaiDayRules`)

- กาลโยค, checked against yearly tables published by myhora, Lemon8 and
  Pantip for จ.ศ. 1347, 1382, 1384 and 1387–1390.
- ดิถี tables (อำมฤตโชค, สิทธิโชค, มหาสิทธิโชค, ชัยโชค, ราชาโชค and nineteen bad ดิถี); where the
  books differ, หลวงวิศาลดรุณกร, *คัมภีร์โหราศาสตร์ไทยมาตรฐาน*. Good ดิถี of January 2567 checked
  against PPTV's "วันมงคลมหาโชค" list.
- ดิถีมหาสูญ by the Sun's sign: ปฏิทินโหราศาสตร์ไทย, อ.ทองเจือ อ่างแก้ว; the lunar-month version:
  ตำราพรหมชาติ (reported, not a ban).
- ฤกษ์บน change times checked against the printed suriyayatra almanac (myhora, dooroek) for
  7 and 28 January and 27 July 2569.

## Checked notes

- **ดิถียมขันธ์ and ดิถีพิฆาต** fall on the same ค่ำ for every weekday. Checked against the book on
  26 Nov 2569: this is what the book gives, so such a day carries both names.
- **ดิถีพิฆาต in other traditions.** Some Lanna texts and ฤกษ์พรหมประสิทธิ์ tables (there sometimes
  calling it มหาศูนย์) give different ค่ำ on Wednesday, Friday and Saturday. This package follows
  the standard book. The variant is reported in almanac articles and has not been checked here
  against a primary text.

## Validation data

The data below belongs to its sources. It is used only to test the calculations, is not shipped
in the npm package, and is not covered by this project's license (Apache-2.0).

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
