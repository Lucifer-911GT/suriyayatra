# suriyayatra

คำนวณตามคัมภีร์**สุริยยาตร์** (ระบบโหราศาสตร์และปฏิทินไทยดั้งเดิม) ด้วย TypeScript ไม่มี dependency ใช้ได้ทั้งเบราว์เซอร์และ Node.js

- **ปฏิทินจันทรคติไทย** — หรคุณ กัมมัชพล อวมาน เถลิงศก ปีอธิกมาส/อธิกวาร ข้างขึ้น/แรม ค่ำ เดือน วันพระ วันสำคัญทางพุทธศาสนา ปีนักษัตร
- **สมผุสดาว** — อาทิตย์ จันทร์ อังคาร พุธ พฤหัสบดี ศุกร์ เสาร์ ราหู เกตุ มฤตยู และเวลาย้ายราศี
- **ลัคนา** ด้วยอันโตนาที จากเวลาอาทิตย์ขึ้นจริงของ 77 จังหวัดหรือพิกัดใดก็ได้ และ**วันเกิดทางโหราศาสตร์** (ก่อน 06:00 นับเป็นวันก่อน, พุธกลางคืน)
- **ดวงกำเนิด** — ภพ นักษัตรและบาท ฤกษ์ 9 หมู่ นวางศ์ ตรียางศ์ ของลัคนาและดาวทั้ง 10 ดวง และ**ทักษา**
- **เครื่องมือสำหรับ AI** — JSON Schema ของ 10 เครื่องมือ (`suriyayatra/tools`) และ CLI สำหรับ agent หรือภาษาอื่น
- **ฤกษ์ตามตำรา** — กาลโยค ดิถีดี/ร้าย วันห้าม (มหาสูญ ทรธึก อายกรรมพลาย กระทิงวัน วันดับ วันศูนย์) ดิถีเรียงหมอน และฤกษ์บนรายวัน

```bash
npm install suriyayatra
```

```ts
import { toThaiLunar, fromThaiLunar, buddhistHolyDays, holyDays, eraYear, yearType } from 'suriyayatra';

toThaiLunar({ year: 2026, month: 11, day: 24 }).label;   // "ขึ้น 15 ค่ำ เดือน 12"
toThaiLunar(new Date());                                 // a Date is read as Thai time (UTC+7)

buddhistHolyDays(2569).asalhaBucha;                      // { year: 2026, month: 7, day: 29 } — เดือน 8 หลัง
holyDays({ year: 2026, month: 11, day: 1 }, { year: 2026, month: 11, day: 30 }); // วันพระ 3, 9, 17, 24

yearType(1388);                                          // "adhikamas" (พ.ศ. 2569)
eraYear(1388);                                           // { horakhun: 506980, kammacaphon: 311, avoman: 602, tithi: 29, … }

fromThaiLunar({ cs: 1388, month: 8, secondEighth: true, phase: 'waning', day: 1 }); // วันเข้าพรรษา 2569
yearAnimal({ year: 2026, month: 3, day: 19 }).th;      // "มะเมีย" — เปลี่ยนที่ขึ้น 1 ค่ำ เดือน 5
```

### สมผุสดาวและลัคนา

```ts
import { positions, signChanges, clock, fromThaiTime, ascendant, position, birthWeekday } from 'suriyayatra';

positions({ year: 2026, month: 11, day: 21 }).sun;       // { signTh: 'พิจิก', degree: 4, minute: 39, … } ณ 24:00 น.
positions(fromThaiTime({ year: 1984, month: 11, day: 15 }, 11, 30)).moon; // ณ เวลาที่ระบุ (เวลาประเทศไทย)

signChanges({ year: 2026, month: 11, day: 17 }).map((c) => [c.body, clock(c.minute), c.to]);
// [['sun', '09:44', 7]] — อาทิตย์ย้ายเข้าพิจิก (เวลาท้องถิ่นกรุงเทพฯ UTC+06:42)

// ดาวย้ายราศีทั้งช่วง (รวมการกระพริบข้ามขอบราศีให้เหลือครั้งเดียว)
ingresses(['rahu', 'jupiter'], { year: 2026, month: 11, day: 1 }, { year: 2027, month: 12, day: 31 });
// [{ body: 'rahu', at: { jdn, minute: 305 }, from: 10, to: 9 }, …] — 05:05 น. = 05:23 น. เวลาประเทศไทย

// ช่วงดาวพักร์
retrogrades('venus', { year: 2026, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 });
// [{ body: 'venus', start: { year: 2026, month: 10, day: 13 }, end: { …, day: 24 }, days: 42 }]

position(ascendant({ at: fromThaiTime({ year: 1984, month: 11, day: 15 }, 11, 30) })).signTh; // ลัคนา
birthWeekday({ year: 2026, month: 11, day: 18 }, 19, 0).dayTh; // "พุธกลางคืน"
```

### ดวงกำเนิด ทักษา และฤกษ์ตามตำรา

```ts
import { natalChart, provinceSunrise, fromThaiTime, birthTaksa, thaiDayRules, moonNakshatras, clock } from 'suriyayatra';

const date = { year: 1984, month: 11, day: 15 };
const chart = natalChart({
  at: fromThaiTime(date, 11, 30),          // เวลาเกิด (เวลาประเทศไทย)
  sunrise: provinceSunrise(10, date),      // อาทิตย์ขึ้นจริงที่กรุงเทพฯ (รหัสจังหวัด 10)
});
chart.ascendant.signTh;                    // ราศีลัคนา
chart.bodies.moon;                         // { signTh, degree, minute, house, nakshatra: { th, quarter, reuk }, navamsa, drekkana }

birthTaksa({ year: 2026, month: 11, day: 25 }, 20, 0).places.กาลกิณี; // 5 (พฤหัสบดี) — เกิดพุธกลางคืน

thaiDayRules({ year: 2026, month: 12, day: 14 }).kala;  // ['thongchai', 'lokawinat']
moonNakshatras({ year: 2026, month: 7, day: 27 }).map((r) => [r.reuk, clock(r.from)]);
// [['thalittho', '00:00'], ['mahatthano', '08:12']] — ตรงกับปฏิทินโหร (UTC+06:42)
```

### เครื่องมือสำหรับ AI และ CLI

ให้โมเดล AI หรือโปรแกรมภาษาอื่นเรียกการคำนวณผ่าน JSON แทนการเดาเอง มี 10 เครื่องมือ: `thai_lunar_date`, `holy_days`, `buddhist_holy_days`, `planet_positions`, `sign_changes`, `retrogrades`, `natal_chart`, `taksa`, `thai_day_rules`, `sunrise`

```ts
import { getTools, executeTool } from 'suriyayatra/tools';

getTools();   // [{ name, description, inputSchema, outputSchema }] — JSON Schema 2020-12 ส่งให้ AI ได้ตรงๆ
executeTool('thai_lunar_date', { date: { year: 2026, month: 11, day: 24 } });
// { ok: true, tool: 'thai_lunar_date', version: 1, data: { label: 'ขึ้น 15 ค่ำ เดือน 12', holyDay: true, yearAnimal: 'มะเมีย', … } }
executeTool('thai_lunar_date', { date: { year: 2026, month: 13, day: 1 } });
// { ok: false, …, error: { code: 'invalid_input', message: '/date/month must be ≤ 12', path: '/date/month' } }
```

```bash
npx suriyayatra tools                                # รายชื่อเครื่องมือ
npx suriyayatra schema natal_chart                   # JSON Schema ขาเข้าและขาออก
echo '{"be": 2569}' | npx suriyayatra call buddhist_holy_days
npx suriyayatra call natal_chart --input birth.json  # exit 0 สำเร็จ, 1 ข้อมูลไม่ผ่าน, 2 ใช้คำสั่งผิด
```

- ขาเข้าใช้วันที่ ค.ศ. และ**เวลาประเทศไทย** ผลที่เป็นเวลาให้ทั้งเวลาปฏิทินโหร (UTC+06:42) และเวลาไทย
- `executeTool` ไม่ throw: ตรวจกับ schema ก่อนทุกครั้ง ปฏิเสธ field ที่ไม่รู้จัก ข้อความ error ไม่สะท้อนค่าที่ส่งเข้ามา
- ช่วงวันมีเพดานตายตัว (`TOOL_LIMITS`: วันพระ 400 วัน ย้ายราศี 366 วัน ดาวพักร์ 3,660 วัน) ผู้เรียกเพิ่มเองไม่ได้ CLI รับ input ไม่เกิน 1 MB

**เวลา** สูตรสุริยยาตร์ใช้เวลาท้องถิ่นกรุงเทพฯ (UTC+06:42) ซึ่งช้ากว่าเวลาประเทศไทยปัจจุบัน 18 นาที
`Moment` คือ `{ jdn, minute }` โดย `minute` นับจากเที่ยงคืนตามเวลา UTC+06:42 (0–1440)
ใช้ `fromThaiTime(date, hh, mm)` แปลงจากเวลาประเทศไทย หรือ `fromDate(new Date())` จากเวลาจริง
ส่งวันที่อย่างเดียวจะได้ 24:00 น. ของวันนั้น ซึ่งเป็นเวลาที่ปฏิทินโหราศาสตร์ไทยพิมพ์สมผุส

## ตำราที่ใช้

การคำนวณทั้งหมดศึกษาจากคัมภีร์และตำราโหราศาสตร์ไทย รายชื่อเต็มพร้อมฉบับที่ใช้อยู่ใน [SOURCES.md](SOURCES.md)

- **ปฏิทินจันทรคติและสมผุสดาว:** คัมภีร์สุริยยาตร์และคัมภีร์มานัตต์ ประกอบกับงานวิจัยของ J. C. Eade และ L. Gislén
- **ลัคนา:** โหราวิทยา ภาค 1 (อันโตนาทีสามัญ)
- **ฤกษ์และดิถี:** หลวงวิศาลดรุณกร *คัมภีร์โหราศาสตร์ไทยมาตรฐาน* และปฏิทินโหราศาสตร์ไทยของ อ.ทองเจือ อ่างแก้ว
- **เวลาอาทิตย์ขึ้น:** J. Meeus, *Astronomical Algorithms*

### ตัวเลือกที่ตำราต่างกัน

- **ลัคนา** (`sun`): `'sunrise'` (ค่าเริ่มต้น) คือ**อันโตนาทีสามัญ สมผุสอาทิตย์อุทัย** ส่วน `'birth'` นับจากสมผุสอาทิตย์ ณ เวลาเกิด สองแบบให้ค่าเท่ากันตอนอาทิตย์ขึ้น และห่างกันได้เกือบ 1° ก่อนรุ่งเช้าถัดไป ส่งเวลาอาทิตย์ขึ้นจริงได้ทาง `sunrise` (เช่นจาก `provinceSunrise` หรือ `sunriseMinute`) และใช้ตารางอันโตนาทีของละติจูดอื่นได้ทาง `table`
- **เวลาย้ายราศี:** `signChanges` แสดงทุกครั้งที่ดาวข้ามขอบราศีในวันนั้น ส่วน `ingresses` รวมการข้ามไปกลับในเวลาสั้นๆ ให้เหลือครั้งเดียว (ปรับได้ด้วย `settleMinutes`)
- **ดาวพักร์:** ตั้งค่าให้ตรงกับช่วงพักร์ที่ปฏิทินโหรสุริยยาตร์ตีพิมพ์ ค่าเกณฑ์นี้ไม่ได้มาจากคัมภีร์ ปฏิทินเล่มอื่นอาจตัดช่วงต่างไป ปรับได้ด้วย `gapDays` และ `minDays`
- **ปีที่ประกาศจริงต่างจากกฎ:** ใช้ตามปฏิทินที่ประกาศ อยู่ใน `OFFICIAL_YEAR_TYPES` ตอนนี้มีปีเดียวคือ จ.ศ. 1376 (พ.ศ. 2557)

### ช่วงที่ใช้ได้และการตรวจค่า

| ส่วน | คำนวณได้ | ตรวจกับข้อมูลที่ตีพิมพ์แล้ว (`VALIDATED_RANGES`) |
|---|---|---|
| ปฏิทินจันทรคติ วันพระ ปีนักษัตร | จ.ศ. 1250–1600 (พ.ศ. 2431–2781 นับจากขึ้น 1 ค่ำ เดือน 5 ปีแรก ถึงสิ้นเดือน 4 ปีสุดท้าย) นอกช่วง throw `RangeError` | พ.ศ. 2539–2574 |
| `buddhistHolyDays` | พ.ศ. 2432–2781 (`HOLY_DAYS_BE_RANGE`) มาฆบูชาอยู่ในปีจันทรคติก่อนหน้า จึงเริ่มช้ากว่า 1 ปี | พ.ศ. 2539–2574 |
| สมผุสดาว เวลาย้ายราศี ดาวพักร์ | ทุกปี | พ.ศ. 2300–2700 |

- ทุกฟังก์ชันตรวจค่าที่รับเข้ามาและ throw `RangeError` เมื่อวันที่ไม่มีจริง (เช่น 30 ก.พ.) ค่าไม่ใช่จำนวนเต็ม ปี จ.ศ. นอกช่วง เวลาอยู่นอก 00:00–24:00 `Date` ไม่ valid หรือชื่อดาวไม่รู้จัก ข้อความ error ไม่สะท้อนค่าที่ส่งเข้ามา
- `ingresses` และ `retrogrades` รับช่วงได้ไม่เกิน `DEFAULT_MAX_DAYS` (3660 วัน ราว 10 ปี) ต่อครั้ง เพื่อไม่ให้คำขอเดียวใช้ CPU นานเกินไป เพิ่มได้ด้วย `maxDays` ถ้าตั้งใจ `settleMinutes` ของ `ingresses` ต้องอยู่ระหว่าง 0 ถึง `MAX_SETTLE_MINUTES` (30 วัน)
- `holyDays` รับ `maxDays` ได้เหมือนกัน แต่ไม่มีค่าจำกัดเริ่มต้น เพราะช่วงปีจันทรคติที่รองรับจำกัดงานอยู่แล้ว (ทั้งช่วงใช้เวลาไม่กี่สิบมิลลิวินาที)
- ความปลอดภัย: ทุกฟังก์ชันคืนผลหรือ throw `RangeError` เท่านั้น (มี fuzz test ครอบคลุมทุก export) ตารางค่าคงที่ที่ export ถูก freeze แก้จากภายนอกไม่ได้ ชื่อดาวที่ซ้ำนับครั้งเดียว และวันที่จำกัดที่ ±`MAX_ABS_YEAR` ปี ดูรายละเอียดและวิธีแจ้งช่องโหว่ที่ [SECURITY.md](SECURITY.md) ถ้าใช้บนเซิร์ฟเวอร์ อย่าส่ง `maxDays` ที่มาจากผู้ใช้เข้ามาตรงๆ
- `isRetrograde` หาช่วงพักร์ทั้งช่วงทุกครั้งที่เรียก (ราว 320 วันรอบวันที่) ถ้าต้องเช็กหลายวัน เรียก `retrogrades` ครั้งเดียวทั้งช่วงแล้วเทียบวันที่เองจะเร็วกว่ามาก

## API ทั้งหมด

ทุกอย่างด้านล่าง import จาก `'suriyayatra'` ได้โดยตรง พร้อม type ของ TypeScript

| กลุ่ม | ฟังก์ชัน | ค่าคงที่และ type |
|---|---|---|
| วันที่และ JDN | `toJdn`, `fromJdn`, `isValidYmd`, `assertYmd`, `thaiDay` (วันตามเวลาไทยของ `Date`), `toYmd`, `weekday` | `YMD`, `MAX_ABS_YEAR`, `MAX_ABS_JDN` |
| ศักราช | `eraYear`, `assertCsYear`, `thaloengSokSeconds` (เวลาเถลิงศก เป็นวินาทีหลังเที่ยงคืน), `csToBe`, `beToCs`, `csToCe` | `EraYear`, `KAMMACAPHON_PER_YEAR`, `KAMMACAPHON_PER_DAY`, `EPOCH_OFFSET`, `HORAKHUN_JDN` |
| ปฏิทินจันทรคติ | `toThaiLunar`, `fromThaiLunar`, `yearType`, `ruleYearType` (ตามกฎล้วน ไม่รวมข้อยกเว้นทางการ), `yearStartJdn`, `monthsOf`, `monthLabel`, `yearAnimal` | `ThaiLunarDate`, `ThaiLunarDateInput`, `LunarPhase`, `LunarMonth`, `YearType`, `YEAR_LENGTH`, `OFFICIAL_YEAR_TYPES`, `MIN_CS`, `MAX_CS`, `YEAR_ANIMALS_TH` |
| วันพระ วันสำคัญ | `holyDays`, `buddhistHolyDays` | `HolyDay`, `HolyDaysOptions`, `BuddhistHolyDays`, `HOLY_DAYS_BE_RANGE` |
| เวลา | `fromThaiTime`, `fromDate`, `endOfDay` (24:00 น. ของวัน), `momentDate`, `assertMoment`, `clock` | `Moment`, `MINUTES_PER_DAY`, `LMT_OFFSET_MINUTES`, `THAI_TIME_OFFSET_MINUTES` |
| สมผุส | `positions`, `position`, `longitude`, `sunLongitude`, `moonLongitude`, `planetLongitude`, `rahuLongitude`, `ketuLongitude` | `Body`, `ClassicalPlanet`, `Position`, `BODIES`, `BODY_NUMBER`, `BODY_TH`, `SIGN_TH` |
| ตัวนับภายในของสูตร | `totalKammacaphon`, `meanSunRaw`, `solarAccumulation` | `SUN_EQUATION`, `MOON_EQUATION`, `PLANET_SHADOW` |
| ย้ายราศี | `signChanges` (รายนาทีของวันเดียว), `ingresses` (ทั้งช่วง ตัดการกระพริบ), `settleIngresses` | `SignChange`, `Ingress`, `IngressOptions`, `DEFAULT_MAX_DAYS`, `MAX_SETTLE_MINUTES` |
| ดาวพักร์ | `retrogrades`, `isRetrograde` | `Retrograde`, `RetrogradeOptions`, `RetrogradeBody`, `RETROGRADE_BODIES` |
| ลัคนา | `ascendant` (ตัวเลือก `sun`), `ascendantFromSun`, `risingSchedule` (เวลาที่แต่ละราศีเริ่มขึ้นในวันนั้น) | `AscendantInput`, `AscendantSun`, `RisingStart`, `RISING_SAMANYA`, `MAHANATI_MINUTES` |
| อาทิตย์ขึ้นและจังหวัด | `sunriseMinute`, `provinceSunrise`, `provinceByCode` | `THAI_PROVINCES`, `ThaiProvince` |
| ดวงกำเนิด | `natalChart`, `house`, `nakshatra`, `navamsa`, `drekkana` | `NatalChart`, `NatalChartInput`, `ChartPoint`, `DivisionalSign`, `Nakshatra`, `ReukGroup`, `HOUSE_TH`, `NAKSHATRA_TH`, `REUK_GROUPS`, `REUK_TH` |
| ทักษา | `birthTaksa`, `taksa`, `taksaPlace` | `BirthTaksa`, `TaksaPlace`, `TAKSA_ORDER`, `TAKSA_PLACES` |
| ฤกษ์ตามตำรา | `thaiDayRules`, `kalayok`, `csOfDay`, `isRiangmon`, `moonNakshatras` (ฤกษ์บน) | `ThaiDayRules`, `Ban`, `BanKey`, `KalaKey`, `GoodDithi`, `NakshatraSpan`, `KALA_TH`, `GOOD_DITHI`, `BAD_DITHI` |
| วันเกิด | `birthWeekday`, `weekday` | `BirthWeekday`, `Weekday`, `DayPlanet` |
| ช่วงที่ตรวจแล้ว | — | `VALIDATED_RANGES` |

## ผลการตรวจสอบ

ทุกค่าที่ใช้ตรวจมาจากแหล่งที่เผยแพร่แล้ว ไม่ได้มาจากโค้ดนี้เอง (`test/data.ts`)

| ชุดข้อมูล | ผล |
|---|---|
| ตัวอย่างคำนวณ จ.ศ. 1325 และ 1320 ใน Eade (2000) | ตรงทุกค่า |
| วันเถลิงศกและชนิดปีจากประกาศสงกรานต์ พ.ศ. 2569 | ตรง (16 เม.ย. 2569, อธิกมาส) |
| ข้างขึ้น/แรม ค่ำ เดือน ของวันพระและวันสำคัญ ปี 2567 และ 2569 (20 วัน) | ตรงทั้งหมด |
| มาฆะ วิสาขะ อาสาฬหบูชา ตามปฏิทินทางการ 2567–2569 (7 วัน) | ตรงทั้งหมด |
| ตารางวันสำคัญ พ.ศ. 2539–2566 จากปฏิทิน 100 ปี (84 วัน) | ตรง 81 วัน · ต่าง 1 วันเฉพาะ วิสาขบูชา 2540, 2543 และอาสาฬหบูชา 2548 ซึ่งปีข้างเคียงตรงหมด จึงน่าจะเป็นความคลาดของตาราง |

| สมผุส 10 ดวง ณ 24:00 น. จากปฏิทินโหราศาสตร์ไทย สุริยยาตร์ (myhora.com) พ.ศ. 2300–2700 (299 วัน × 10 ดวง) | ตรงทุกค่าระดับลิปดา |
| เวลาย้ายราศีของอาทิตย์ อังคาร พุธ ราหู และเวลาจันทร์ยกทั้งเดือน พ.ย. 2569 | ตรงทุกนาที |
| ช่วงดาวพักร์ (พุธ ศุกร์ อังคาร พฤหัสบดี เสาร์ มฤตยู) 112 ช่วง พ.ศ. 2400–2650 | ตรงทั้งวันเริ่มและวันจบ |
| เวลาเถลิงศกตามประกาศสงกรานต์ 2567–2569 | ตรงทุกวินาที |
| กาลโยค (ธงชัย อธิบดี อุบาทว์ โลกาวินาศ) จ.ศ. 1347, 1382, 1384, 1387–1390 จากตารางที่เผยแพร่ | ตรงทุกปี |
| ดิถีสิทธิโชคและมหาสิทธิโชค มกราคม 2567 (PPTV) | ตรงทั้งหมด |
| เวลาเปลี่ยนฤกษ์บนตามปฏิทินโหร (27 ก.ค., 7 ม.ค., 28 ม.ค. 2569) | ตรงทุกนาที |
| เวลาอาทิตย์ขึ้น 77 จังหวัด ค.ศ. 1850–2200 (12,936 ค่า) เทียบ Astronomy Engine | ต่างไม่เกิน 0.07 นาที |

ตารางเดียวกันสำหรับปี 2567 เป็นต้นไปพิมพ์ไว้ตั้งแต่ 2550 และต่างจากปฏิทินทางการ 1 วัน เราจึงตรวจปีเหล่านั้นกับวันทางการแทน

**ข้อจำกัดของสมผุสและลัคนา**
- วันเถลิงศก 16 เม.ย. 2567 ปฏิทินที่ใช้ตรวจให้ค่าเหมือนกัมมัชพลมากกว่าที่นี่ราว 10 หน่วย (18 นาที) ทำให้ต่าง 1 ลิปดาในบางดวง วันเถลิงศกปี 2568 และ 2569 ตรงกัน
- เวลาอาทิตย์ยกเข้าเมษ (มหาสงกรานต์) ตามสูตรนี้ต่างจากเวลาที่ประกาศจริงหลายนาที (เช่น 2569 ได้ 10:43 น. ประกาศ 10:34:35 น.) วิธีของประกาศทางการไม่ได้เผยแพร่ แต่เวลาเถลิงศกตรงกันทุกปี
- ลัคนาขึ้นกับตารางอันโตนาทีและเวลาอาทิตย์ขึ้นที่เลือก แต่ละตำราใช้ต่างกัน ผลจึงต่างกันได้หลายนาทีใกล้รอยต่อราศี
- มฤตยูไม่ได้อยู่ในคัมภีร์สุริยยาตร์ดั้งเดิม เป็นส่วนที่เพิ่มภายหลัง แบบเดียวกับปฏิทินที่ใช้ตรวจ

**ข้อจำกัดของปฏิทิน**: ปฏิทินที่ประกาศจริงอาจปรับต่างจากกฎในบางปีเหมือนปี 2557 ปีอนาคตที่ยังไม่ได้ประกาศจึงเป็นค่าตามกฎ รองรับ จ.ศ. 1250–1600 (ราว ค.ศ. 1888–2238) ปีเก่ากว่านั้นการใช้กฎในอดีตต่างกันไป ถ้าเจอวันที่ไม่ตรงปฏิทินหลวง เปิด issue พร้อมแหล่งอ้างอิงได้เลย

---

## English

Thai **suriyayatra** calculations in dependency-free TypeScript:

- the Thai lunar calendar — Chula Sakarat year arithmetic (horakhun, kammacaphon, avoman, tithi), adhikamas / adhikawan years, Gregorian ↔ Thai lunar dates, holy days (wan phra), Buddhist holidays, the year animal;
- positions of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu and Uranus by the suriyayatra and manat rules, with sign-change times and retrograde periods;
- the ascendant (lagna) from rising times, with the real sunrise of the 77 Thai provinces or any coordinates, and a choice of the Sun at sunrise or at birth;
- birth-chart readings (houses, nakshatra and quarter, the nine ฤกษ์ groups, navamsa, drekkana), ทักษา and the Thai astrological birth weekday;
- the textbook day rules: กาลโยค, good and bad ดิถี, the strong bans, ดิถีเรียงหมอน and the Moon's ฤกษ์ through the day;
- ten JSON tools for AI models and other languages (`suriyayatra/tools`: JSON Schema 2020-12 inputs and outputs, an envelope that never throws, fixed span limits) and a `suriyayatra` CLI.

Times run on Bangkok local mean time (UTC+06:42), as the rules do; `fromThaiTime` and `fromDate` convert. Positions are integer arcminutes from 0° Aries of the system's own zodiac.

Every function checks its input and throws a `RangeError` for impossible dates, out-of-range times and unknown bodies; `ingresses` and `retrogrades` take at most `DEFAULT_MAX_DAYS` (about ten years) per call unless `maxDays` says otherwise, and `settleMinutes` is capped at `MAX_SETTLE_MINUTES` (30 days). The lunar calendar covers CS 1250–1600; `buddhistHolyDays` covers BE 2432–2781 (`HOLY_DAYS_BE_RANGE`). The table "API ทั้งหมด" above lists every export. `VALIDATED_RANGES` gives the years checked against published data.

It is checked against published data only — Eade's worked examples, the official Songkran announcements, official holy days 2567–2569, an almanac table for 2539–2566, and a suriyayatra ephemeris for 2300–2700 BE (299 days × 10 bodies, all equal to the arcminute; see `test/`). One year, CS 1376 (2014), follows the published calendar rather than the rule; it is listed in `OFFICIAL_YEAR_TYPES`.

License: [Apache-2.0](LICENSE) from 0.2.0 on, with a [NOTICE](NOTICE) file; 0.1.0–0.1.3 were published under MIT and stay MIT.

---

## สัญญาอนุญาต (License)

Copyright © 2026 Lucifer-911GT

ตั้งแต่เวอร์ชัน 0.2.0 แพ็กเกจนี้ใช้สัญญาอนุญาต **Apache License 2.0** (`Apache-2.0`) ดูตัวบทเต็มที่ [LICENSE](LICENSE)

- ใช้ ศึกษา แก้ไข และแจกจ่ายต่อได้ฟรี รวมถึงใช้ในโปรแกรมเชิงพาณิชย์และโปรแกรมปิดซอร์ส
- เมื่อแจกจ่ายต่อ ต้องแนบสำเนาสัญญาอนุญาตและไฟล์ [NOTICE](NOTICE) ไปด้วย และถ้าแก้ไขไฟล์ใด ต้องระบุไว้ในไฟล์นั้นว่าแก้ไขแล้ว
- สัญญานี้ให้สิทธิ์ในสิทธิบัตรที่เกี่ยวข้องกับโค้ดด้วย แต่ไม่ให้สิทธิ์ใช้ชื่อหรือเครื่องหมายการค้า
- เวอร์ชัน 0.1.0–0.1.3 ออกภายใต้ MIT ไปแล้ว ผู้ที่ได้รับเวอร์ชันเหล่านั้นยังใช้ตามเงื่อนไข MIT ได้ต่อไป

ข้อมูลที่ใช้ตรวจใน `test/*-data.ts` เป็นของแหล่งที่มาตามที่ระบุใน [SOURCES.md](SOURCES.md) ไม่อยู่ภายใต้สัญญาอนุญาตของโปรเจกต์นี้
