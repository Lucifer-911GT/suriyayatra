// Loads the built package both ways, the way consumers will, and runs the command line.
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const cjs = require('suriyayatra');
const cjsTools = require('suriyayatra/tools');
assert.strictEqual(typeof cjs.positions, 'function');
assert.strictEqual(cjs.positions({ year: 2026, month: 11, day: 21 }).sun.signTh, 'พิจิก');
assert.strictEqual(cjsTools.executeTool('buddhist_holy_days', { be: 2569 }).ok, true);
Promise.all([import('suriyayatra'), import('suriyayatra/tools')]).then(([esm, esmTools]) => {
  assert.strictEqual(typeof esm.ingresses, 'function');
  assert.strictEqual(esm.toThaiLunar({ year: 2026, month: 11, day: 17 }).label, cjs.toThaiLunar({ year: 2026, month: 11, day: 17 }).label);
  assert.deepStrictEqual(esmTools.getTools().map((t) => t.name), cjsTools.getTools().map((t) => t.name));
  const bin = path.join(__dirname, '..', 'bin', 'suriyayatra.mjs');
  const out = execFileSync(process.execPath, [bin, 'call', 'thai_lunar_date'], { input: '{"date":{"year":2026,"month":11,"day":24}}' });
  assert.strictEqual(JSON.parse(out).data.label, 'ขึ้น 15 ค่ำ เดือน 12');
  console.log('require and import both load suriyayatra and suriyayatra/tools; the CLI runs');
});
