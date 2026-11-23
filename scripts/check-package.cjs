// Loads the built package both ways, the way consumers will.
const assert = require('node:assert');
const cjs = require('suriyayatra');
assert.strictEqual(typeof cjs.positions, 'function');
assert.strictEqual(cjs.positions({ year: 2026, month: 11, day: 21 }).sun.signTh, 'พิจิก');
import('suriyayatra').then((esm) => {
  assert.strictEqual(typeof esm.ingresses, 'function');
  assert.strictEqual(esm.toThaiLunar({ year: 2026, month: 11, day: 17 }).label, cjs.toThaiLunar({ year: 2026, month: 11, day: 17 }).label);
  console.log('require and import both load suriyayatra');
});
