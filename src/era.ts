/**
 * The year-start (เถลิงศก) arithmetic of the Thai suriyayatra (สุริยยาตร์)
 * method, counted from the Chula Sakarat (จุลศักราช, CS) epoch.
 *
 *   หรคุณเถลิงศก  = ⌊(CS × 292207 + 373) / 800⌋ + 1
 *   กัมมัชพล      = 800 − ((CS × 292207 + 373) mod 800)
 *   อุจจพล        = (หรคุณ + 2611) mod 3232
 *   อวมาน         = (หรคุณ × 11 + 650) mod 692
 *   มาสเกณฑ์      = ⌊(⌊(หรคุณ × 11 + 650) / 692⌋ + หรคุณ) / 30⌋, remainder = ดิถี
 *
 * A solar year is 292207/800 days; one day is 800 กัมมัชพล; a tithi
 * (ดิถี) is 692 อวมาน. Worked example: Eade (2000), Appendix A, CS 1325.
 */

export const KAMMACAPHON_PER_YEAR = 292207;
export const KAMMACAPHON_PER_DAY = 800;
export const EPOCH_OFFSET = 373;
/** หรคุณ 0 is JDN 1954167; horakhun 1 is 1 day after the epoch, 638 CE. */
export const HORAKHUN_JDN = 1954167;

/** Buddhist-era year whose Songkran falls in a given Chula Sakarat year. */
export const csToBe = (cs: number) => cs + 1181;
export const beToCs = (be: number) => be - 1181;
export const csToCe = (cs: number) => cs + 638;

export interface EraYear {
  /** Chula Sakarat year (จุลศักราช). */
  cs: number;
  /** Days since the epoch to เถลิงศก (หรคุณเถลิงศก). */
  horakhun: number;
  /** Fraction of the day left at เถลิงศก, in 1/800 day (กัมมัชพล). */
  kammacaphon: number;
  /** Moon's apogee counter (อุจจพล), 0–3231. */
  uccapon: number;
  /** Excess of lunar over solar days in 1/692 tithi (อวมาน), 0–691. */
  avoman: number;
  /** Lunar months since the epoch (มาสเกณฑ์). */
  masaken: number;
  /** Tithi at เถลิงศก (ดิถีเถลิงศก), 0–29. */
  tithi: number;
  /** JDN of เถลิงศก. */
  thaloengSokJdn: number;
}

export function eraYear(cs: number): EraYear {
  const n = cs * KAMMACAPHON_PER_YEAR + EPOCH_OFFSET;
  const horakhun = Math.floor(n / KAMMACAPHON_PER_DAY) + 1;
  const kammacaphon = KAMMACAPHON_PER_DAY - (n % KAMMACAPHON_PER_DAY);
  const a = horakhun * 11 + 650;
  const q = Math.floor(a / 692);
  return {
    cs,
    horakhun,
    kammacaphon,
    uccapon: (horakhun + 2611) % 3232,
    avoman: a % 692,
    masaken: Math.floor((q + horakhun) / 30),
    tithi: (q + horakhun) % 30,
    thaloengSokJdn: horakhun + HORAKHUN_JDN,
  };
}
