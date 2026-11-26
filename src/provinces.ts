// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Lucifer-911GT
/**
 * The 77 Thai provinces: official province code, Thai and English names, and the coordinates
 * of the provincial seat, for sunrise at a birthplace ({@link sunriseMinute}).
 *
 * Coordinates, codes and English names from dataengineercafe/thailand-province-latitude-longitude
 * (MIT License, Copyright (c) 2020 BearData.io; see SOURCES.md). Listed in Thai alphabetical order.
 */
import { sunriseMinute } from './sunrise.js';
import type { YMD } from './julian.js';

export interface ThaiProvince {
  /** Official province code (กรุงเทพมหานคร = 10). */
  readonly code: number;
  readonly th: string;
  readonly en: string;
  /** Degrees, north positive. */
  readonly lat: number;
  /** Degrees, east positive. */
  readonly lon: number;
}

export const THAI_PROVINCES: readonly ThaiProvince[] = Object.freeze([
  { code: 10, th: 'กรุงเทพมหานคร', en: 'Bangkok', lat: 13.7279, lon: 100.5241 },
  { code: 81, th: 'กระบี่', en: 'Krabi', lat: 8.0863, lon: 98.9063 },
  { code: 71, th: 'กาญจนบุรี', en: 'Kanchanaburi', lat: 14.0228, lon: 99.5328 },
  { code: 46, th: 'กาฬสินธุ์', en: 'Kalasin', lat: 16.4314, lon: 103.5059 },
  { code: 62, th: 'กำแพงเพชร', en: 'Kamphaeng Phet', lat: 16.4828, lon: 99.5227 },
  { code: 40, th: 'ขอนแก่น', en: 'Khon Kaen', lat: 16.4419, lon: 102.8360 },
  { code: 22, th: 'จันทบุรี', en: 'Chanthaburi', lat: 12.6113, lon: 102.1039 },
  { code: 24, th: 'ฉะเชิงเทรา', en: 'Chachoengsao', lat: 13.6904, lon: 101.0780 },
  { code: 20, th: 'ชลบุรี', en: 'Chon Buri', lat: 13.3611, lon: 100.9847 },
  { code: 18, th: 'ชัยนาท', en: 'Chai Nat', lat: 15.1852, lon: 100.1251 },
  { code: 36, th: 'ชัยภูมิ', en: 'Chaiyaphum', lat: 15.8068, lon: 102.0315 },
  { code: 86, th: 'ชุมพร', en: 'Chumphon', lat: 10.4930, lon: 99.1800 },
  { code: 57, th: 'เชียงราย', en: 'Chiang Rai', lat: 19.9072, lon: 99.8310 },
  { code: 50, th: 'เชียงใหม่', en: 'Chiang Mai', lat: 18.7877, lon: 98.9931 },
  { code: 92, th: 'ตรัง', en: 'Trang', lat: 7.5594, lon: 99.6110 },
  { code: 23, th: 'ตราด', en: 'Trat', lat: 12.2428, lon: 102.5175 },
  { code: 63, th: 'ตาก', en: 'Tak', lat: 16.8840, lon: 99.1258 },
  { code: 26, th: 'นครนายก', en: 'Nakhon Nayok', lat: 14.2069, lon: 101.2131 },
  { code: 73, th: 'นครปฐม', en: 'Nakhon Pathom', lat: 13.8199, lon: 100.0622 },
  { code: 48, th: 'นครพนม', en: 'Nakhon Phanom', lat: 17.3920, lon: 104.7696 },
  { code: 30, th: 'นครราชสีมา', en: 'Nakhon Ratchasima', lat: 14.9799, lon: 102.0978 },
  { code: 80, th: 'นครศรีธรรมราช', en: 'Nakhon Si Thammarat', lat: 8.4304, lon: 99.9631 },
  { code: 60, th: 'นครสวรรค์', en: 'Nakhon Sawan', lat: 15.6930, lon: 100.1226 },
  { code: 12, th: 'นนทบุรี', en: 'Nonthaburi', lat: 13.8621, lon: 100.5144 },
  { code: 96, th: 'นราธิวาส', en: 'Narathiwat', lat: 6.4255, lon: 101.8253 },
  { code: 55, th: 'น่าน', en: 'Nan', lat: 18.7756, lon: 100.7730 },
  { code: 38, th: 'บึงกาฬ', en: 'Bueng Kan', lat: 18.3609, lon: 103.6464 },
  { code: 31, th: 'บุรีรัมย์', en: 'Buri Ram', lat: 14.9930, lon: 103.1029 },
  { code: 13, th: 'ปทุมธานี', en: 'Pathum Thani', lat: 14.0208, lon: 100.5250 },
  { code: 77, th: 'ประจวบคีรีขันธ์', en: 'Prachuap Khiri Khan', lat: 11.8124, lon: 99.7973 },
  { code: 25, th: 'ปราจีนบุรี', en: 'Prachin Buri', lat: 14.0510, lon: 101.3727 },
  { code: 94, th: 'ปัตตานี', en: 'Pattani', lat: 6.8695, lon: 101.2505 },
  { code: 14, th: 'พระนครศรีอยุธยา', en: 'Phra Nakhon Si Ayutthaya', lat: 14.3532, lon: 100.5690 },
  { code: 56, th: 'พะเยา', en: 'Phayao', lat: 19.1665, lon: 99.9019 },
  { code: 82, th: 'พังงา', en: 'Phang-nga', lat: 8.4407, lon: 98.5193 },
  { code: 93, th: 'พัทลุง', en: 'Phatthalung', lat: 7.6167, lon: 100.0740 },
  { code: 66, th: 'พิจิตร', en: 'Phichit', lat: 16.4430, lon: 100.3482 },
  { code: 65, th: 'พิษณุโลก', en: 'Phitsanulok', lat: 16.8298, lon: 100.2615 },
  { code: 76, th: 'เพชรบุรี', en: 'Phetchaburi', lat: 13.1112, lon: 99.9391 },
  { code: 67, th: 'เพชรบูรณ์', en: 'Phetchabun', lat: 16.4190, lon: 101.1551 },
  { code: 54, th: 'แพร่', en: 'Phrae', lat: 18.1446, lon: 100.1403 },
  { code: 83, th: 'ภูเก็ต', en: 'Phuket', lat: 7.9810, lon: 98.3639 },
  { code: 44, th: 'มหาสารคาม', en: 'Maha Sarakham', lat: 16.1851, lon: 103.3026 },
  { code: 49, th: 'มุกดาหาร', en: 'Mukdahan', lat: 16.5424, lon: 104.7209 },
  { code: 58, th: 'แม่ฮ่องสอน', en: 'Mae Hong Son', lat: 19.2991, lon: 97.9656 },
  { code: 35, th: 'ยโสธร', en: 'Yasothon', lat: 15.7926, lon: 104.1453 },
  { code: 95, th: 'ยะลา', en: 'Yala', lat: 6.5411, lon: 101.2804 },
  { code: 45, th: 'ร้อยเอ็ด', en: 'Roi Et', lat: 16.0538, lon: 103.6520 },
  { code: 85, th: 'ระนอง', en: 'Ranong', lat: 9.9529, lon: 98.6085 },
  { code: 21, th: 'ระยอง', en: 'Rayong', lat: 12.6833, lon: 101.2374 },
  { code: 70, th: 'ราชบุรี', en: 'Ratchaburi', lat: 13.5283, lon: 99.8134 },
  { code: 16, th: 'ลพบุรี', en: 'Lop Buri', lat: 14.7995, lon: 100.6534 },
  { code: 52, th: 'ลำปาง', en: 'Lampang', lat: 18.2888, lon: 99.4909 },
  { code: 51, th: 'ลำพูน', en: 'Lamphun', lat: 18.5745, lon: 99.0087 },
  { code: 42, th: 'เลย', en: 'Loei', lat: 17.4860, lon: 101.7223 },
  { code: 33, th: 'ศรีสะเกษ', en: 'Si Sa Ket', lat: 15.1186, lon: 104.3220 },
  { code: 47, th: 'สกลนคร', en: 'Sakon Nakhon', lat: 17.1546, lon: 104.1348 },
  { code: 90, th: 'สงขลา', en: 'Songkhla', lat: 7.1756, lon: 100.6143 },
  { code: 91, th: 'สตูล', en: 'Satun', lat: 6.6238, lon: 100.0674 },
  { code: 11, th: 'สมุทรปราการ', en: 'Samut Prakan', lat: 13.5991, lon: 100.5998 },
  { code: 75, th: 'สมุทรสงคราม', en: 'Samut Songkhram', lat: 13.4098, lon: 100.0023 },
  { code: 74, th: 'สมุทรสาคร', en: 'Samut Sakhon', lat: 13.5475, lon: 100.2744 },
  { code: 27, th: 'สระแก้ว', en: 'Sa Kaeo', lat: 13.8240, lon: 102.0646 },
  { code: 19, th: 'สระบุรี', en: 'Saraburi', lat: 14.5289, lon: 100.9101 },
  { code: 17, th: 'สิงห์บุรี', en: 'Sing Buri', lat: 14.8936, lon: 100.3967 },
  { code: 64, th: 'สุโขทัย', en: 'Sukhothai', lat: 17.0056, lon: 99.8264 },
  { code: 72, th: 'สุพรรณบุรี', en: 'Suphan Buri', lat: 14.4745, lon: 100.1177 },
  { code: 84, th: 'สุราษฎร์ธานี', en: 'Surat Thani', lat: 9.1382, lon: 99.3217 },
  { code: 32, th: 'สุรินทร์', en: 'Surin', lat: 14.8829, lon: 103.4937 },
  { code: 43, th: 'หนองคาย', en: 'Nong Khai', lat: 17.8783, lon: 102.7413 },
  { code: 39, th: 'หนองบัวลำภู', en: 'Nong Bua Lam Phu', lat: 17.2218, lon: 102.4260 },
  { code: 15, th: 'อ่างทอง', en: 'Ang Thong', lat: 14.5896, lon: 100.4551 },
  { code: 37, th: 'อำนาจเจริญ', en: 'Amnat Charoen', lat: 15.8657, lon: 104.6258 },
  { code: 41, th: 'อุดรธานี', en: 'Udon Thani', lat: 17.4138, lon: 102.7872 },
  { code: 53, th: 'อุตรดิตถ์', en: 'Uttaradit', lat: 17.6201, lon: 100.0993 },
  { code: 61, th: 'อุทัยธานี', en: 'Uthai Thani', lat: 15.3835, lon: 100.0246 },
  { code: 34, th: 'อุบลราชธานี', en: 'Ubon Ratchathani', lat: 15.2287, lon: 104.8564 },
].map((p) => Object.freeze(p)));

const BY_CODE: ReadonlyMap<number, ThaiProvince> = new Map(THAI_PROVINCES.map((p) => [p.code, p]));

/** The province with an official code; a RangeError for an unknown code. */
export function provinceByCode(code: number): ThaiProvince {
  const p = Number.isInteger(code) ? BY_CODE.get(code) : undefined;
  if (!p) throw new RangeError('Unknown Thai province code');
  return p;
}

/** Sunrise at a province's seat on a date, on the UTC+06:42 clock. See {@link sunriseMinute}. */
export function provinceSunrise(code: number, date: YMD): number {
  const p = provinceByCode(code);
  const minute = sunriseMinute(date, p.lat, p.lon);
  if (minute === null) throw new RangeError('No sunrise on that date'); // never happens in Thailand
  return minute;
}
