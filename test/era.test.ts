import { describe, expect, it } from 'vitest';
import { eraYear, fromJdn, thaloengSokSeconds } from '../src/index.js';

describe('eraYear', () => {
  it('reproduces Eade (2000), Appendix A, CS 1325', () => {
    const y = eraYear(1325);
    expect(y.horakhun).toBe(483969);
    expect(y.kammacaphon).toBe(552);
    expect(y.uccapon).toBe(1780);
    expect(y.avoman).toBe(61);
    expect(y.masaken).toBe(16388);
    expect(y.tithi).toBe(23);
  });

  it('reproduces Eade (2000) on CS 1320: กัมมัชพล 787, อวมาน 43, tithi 28', () => {
    expect(eraYear(1320)).toMatchObject({ kammacaphon: 787, avoman: 43, tithi: 28 });
  });

  it('puts เถลิงศก 2569 (CS 1388) on 16 April 2026', () => {
    expect(fromJdn(eraYear(1388).thaloengSokJdn)).toEqual({ year: 2026, month: 4, day: 16 });
  });
});

describe('เถลิงศก time', () => {
  it('matches the announced times 2567–2569', () => {
    const hms = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
    expect(hms(thaloengSokSeconds(1386))).toEqual([2, 15, 0]);
    expect(hms(thaloengSokSeconds(1387))).toEqual([8, 27, 36]);
    expect(hms(thaloengSokSeconds(1388))).toEqual([14, 40, 12]);
  });
});
