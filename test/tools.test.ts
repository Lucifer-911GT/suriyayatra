import { describe, expect, it } from 'vitest';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { executeTool, getTool, getTools, TOOL_LIMITS, TOOL_PROTOCOL_VERSION } from '../src/tools.js';
import { runCli, type CliIo } from '../src/cli.js';
import { validate } from '../src/tools/schema.js';
import { buddhistHolyDays, natalChart, fromThaiTime, provinceSunrise, positions, toThaiLunar } from '../src/index.js';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const ajv = new Ajv2020({ strict: false, allErrors: true });

/** One valid call per tool. */
const SAMPLES: Record<string, unknown> = {
  thai_lunar_date: { date: d(2026, 11, 24) },
  holy_days: { from: d(2026, 11, 1), to: d(2026, 11, 30) },
  buddhist_holy_days: { be: 2569 },
  planet_positions: { date: d(2026, 11, 21) },
  sign_changes: { bodies: ['sun', 'rahu'], from: d(2026, 11, 1), to: d(2026, 12, 31) },
  retrogrades: { bodies: ['venus'], from: d(2026, 1, 1), to: d(2026, 12, 31) },
  natal_chart: { date: d(1984, 11, 15), time: { hour: 11, minute: 30 }, place: { province: 10 }, sun: 'birth' },
  taksa: { date: d(2026, 11, 25), time: { hour: 20, minute: 0 } },
  thai_day_rules: { date: d(2026, 7, 27) },
  sunrise: { date: d(2026, 11, 26), place: { lat: 13.75, lon: 100.5 } },
};

describe('tool definitions', () => {
  it('ten tools, each with a sample here, schemas that compile as JSON Schema 2020-12', () => {
    expect(getTools().map((t) => t.name).sort()).toEqual(Object.keys(SAMPLES).sort());
    for (const t of getTools()) {
      expect(() => ajv.compile(t.inputSchema), t.name).not.toThrow();
      expect(() => ajv.compile(t.outputSchema), t.name).not.toThrow();
      expect(t.inputSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    }
  });
  it('are frozen all the way down', () => {
    const walk = (v: unknown): boolean => typeof v !== 'object' || v === null || (Object.isFrozen(v) && Object.values(v).every(walk));
    expect(walk(getTools())).toBe(true);
  });
});

describe('every tool on a valid call', () => {
  it.each(Object.entries(SAMPLES))('%s: ok, and the data satisfies its output schema', (name, args) => {
    const r = executeTool(name, args);
    expect(r).toMatchObject({ ok: true, tool: name, version: TOOL_PROTOCOL_VERSION });
    const check = ajv.compile(getTool(name)!.outputSchema);
    expect(check(r.ok && r.data), JSON.stringify(check.errors)).toBe(true);
  });
  it('gives the same answers as the library', () => {
    const ok = <T>(r: ReturnType<typeof executeTool>) => (r.ok ? (r.data as T) : expect.fail(JSON.stringify(r)));
    expect(ok<{ label: string }>(executeTool('thai_lunar_date', SAMPLES.thai_lunar_date)).label).toBe(toThaiLunar(d(2026, 11, 24)).label);
    expect(ok(executeTool('buddhist_holy_days', { be: 2569 }))).toEqual(buddhistHolyDays(2569));
    expect(ok<{ bodies: unknown }>(executeTool('planet_positions', SAMPLES.planet_positions)).bodies).toEqual(positions(d(2026, 11, 21)));
    const at = fromThaiTime(d(1984, 11, 15), 11, 30);
    const chart = natalChart({ at, sunrise: provinceSunrise(10, d(1984, 11, 15)), sun: 'birth' });
    expect(ok<{ ascendant: unknown }>(executeTool('natal_chart', SAMPLES.natal_chart)).ascendant).toEqual(chart.ascendant);
  });
  it('reports times in Thai standard time as well as the almanac clock', () => {
    const r = executeTool('sign_changes', { bodies: ['rahu'], from: d(2026, 11, 22), to: d(2026, 11, 22) });
    // ราหูเข้ามังกร 05:05 almanac time = 05:23 Thai time
    expect(r.ok && r.data).toEqual([{ body: 'rahu', fromSign: 10, toSign: 9, almanacTime: '05:05', thai: { date: d(2026, 11, 22), time: '05:23' } }]);
  });
});

describe('bad calls get an envelope, never an exception', () => {
  const code = (name: unknown, args: unknown) => {
    const r = executeTool(name, args);
    return r.ok ? 'ok' : r.error.code;
  };
  it('unknown tools and invalid input', () => {
    expect(code('nope', {})).toBe('unknown_tool');
    expect(code(42, {})).toBe('unknown_tool');
    expect(code('thai_lunar_date', {})).toBe('invalid_input');
    expect(code('thai_lunar_date', { date: d(2026, 13, 1) })).toBe('invalid_input');
    expect(code('thai_lunar_date', { date: { ...d(2026, 1, 1), extra: 1 } })).toBe('invalid_input');
    expect(code('thai_lunar_date', JSON.parse('{"date":{"year":2026,"month":1,"day":1},"__proto__":{"x":1}}'))).toBe('invalid_input');
    expect(code('sign_changes', { bodies: ['sun', 'sun'], from: d(2026, 1, 1), to: d(2026, 1, 2) })).toBe('invalid_input');
    expect(code('sign_changes', { bodies: ['pluto'], from: d(2026, 1, 1), to: d(2026, 1, 2) })).toBe('invalid_input');
  });
  it('values the calculation refuses are out_of_range, with no echo of the input', () => {
    expect(code('thai_lunar_date', { date: d(1700, 1, 1) })).toBe('out_of_range');
    expect(code('thai_lunar_date', { date: d(2026, 2, 30) })).toBe('out_of_range');
    expect(code('natal_chart', { ...SAMPLES.natal_chart as object, place: { province: 10, lat: 1, lon: 1 } })).toBe('out_of_range');
    expect(code('natal_chart', { ...SAMPLES.natal_chart as object, place: { lat: 13 } })).toBe('out_of_range');
    expect(code('natal_chart', { ...SAMPLES.natal_chart as object, place: { province: 28 } })).toBe('out_of_range'); // no province has code 28
    const r = executeTool('thai_lunar_date', { date: d(1700, 1, 1) });
    expect(JSON.stringify(r)).not.toContain('1700');
  });
  it('spans are capped and the caller cannot raise the cap', () => {
    expect(code('holy_days', { from: d(2026, 1, 1), to: d(2027, 2, 5) })).toBe('out_of_range'); // 401 days
    expect(code('holy_days', { from: d(2026, 1, 1), to: d(2027, 2, 4) })).toBe('ok'); // 400
    expect(code('sign_changes', { from: d(2026, 1, 1), to: d(2027, 1, 2), maxDays: 9999 })).toBe('invalid_input');
    expect(TOOL_LIMITS.signChanges).toBe(366);
  });
  it('live objects: a throwing getter or Proxy does not escape, and arguments are read once', () => {
    const bomb = { get date() { throw new Error('secret in a getter'); } };
    const r = executeTool('thai_lunar_date', bomb);
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid_input' } });
    expect(JSON.stringify(r)).not.toContain('secret');
    const trap = new Proxy({ date: d(2026, 1, 1) }, { getPrototypeOf() { throw new Error('trap'); }, ownKeys() { throw new Error('trap'); } });
    expect(() => executeTool('thai_lunar_date', trap)).not.toThrow();
    let reads = 0;
    const shifty = { from: d(2026, 1, 1), get to() { reads++; return reads === 1 ? d(2026, 1, 31) : d(2200, 1, 1); } };
    expect(executeTool('holy_days', shifty).ok).toBe(true); // validated and run on the same copy
    expect(reads).toBe(1);
    expect(executeTool('holy_days', { from: d(2026, 1, 1), to: d(2026, 1, 2), n: 10n }).ok).toBe(false); // BigInt is not JSON
  });
  it('fuzz: junk arguments to every tool never throw', () => {
    const junk: unknown[] = [undefined, null, 0, NaN, 'x', [], {}, { date: null }, { date: d(1e9, 1, 1) }, { from: d(2026, 1, 1) },
      { be: 2569.5 }, { date: d(2026, 1, 1), time: { hour: 24, minute: 0 } }, { place: { province: '10' } }];
    for (const t of getTools()) for (const a of junk) expect(() => executeTool(t.name, a)).not.toThrow();
  });
});

describe('our schema validator agrees with ajv on tool inputs', () => {
  it('for valid samples and a range of broken ones', () => {
    const variants = (s: Record<string, unknown>): unknown[] => [
      s, {}, { ...s, extra: true }, Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'object' ? { ...v as object, year: 1.5 } : 'x'])),
      Object.fromEntries(Object.entries(s).map(([k]) => [k, null])),
    ];
    for (const t of getTools()) {
      const check = ajv.compile(t.inputSchema);
      for (const v of variants(SAMPLES[t.name] as Record<string, unknown>)) {
        expect(validate(t.inputSchema, v) === null, `${t.name} ${JSON.stringify(v)}`).toBe(check(v));
      }
    }
  });
});

describe('command line', () => {
  const io = (input: string | Error): CliIo => ({ readInput: () => { if (input instanceof Error) throw input; return input; } });
  const run = (argv: string[], input: string | Error = '') => runCli(argv, io(input));
  const out = async (argv: string[], input?: string) => JSON.parse((await run(argv, input)).stdout);
  it('lists tools and prints schemas', async () => {
    expect(await out(['tools'])).toHaveLength(10);
    expect((await out(['schema', 'taksa'])).inputSchema.required).toEqual(['date']);
    expect((await run(['schema', 'nope'])).code).toBe(2);
  });
  it('calls a tool with JSON input', async () => {
    const r = await run(['call', 'thai_lunar_date'], JSON.stringify(SAMPLES.thai_lunar_date));
    expect(r.code).toBe(0);
    expect(JSON.parse(r.stdout).data.label).toBe('ขึ้น 15 ค่ำ เดือน 12');
  });
  it('exit 1 with an envelope when the tool refuses, 2 for usage errors', async () => {
    expect((await run(['call', 'thai_lunar_date'], '{"date":{}}')).code).toBe(1);
    expect((await out(['call', 'thai_lunar_date'], 'not json')).error.code).toBe('invalid_input');
    expect((await out(['call', 'nope'], 'not json')).error.code).toBe('unknown_tool');
    expect((await run(['call', 'thai_lunar_date'], new Error('ENOENT'))).code).toBe(2);
    expect((await run(['call', 'thai_lunar_date', '--bogus'])).code).toBe(2);
    expect((await run([])).code).toBe(2);
    expect((await run(['frobnicate'])).code).toBe(2);
    expect((await run(['--help'])).code).toBe(0);
  });
});
