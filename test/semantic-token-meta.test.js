const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const colorEngine = require('../src/color-engine.js');
const metadata = JSON.parse(readFileSync(join(__dirname, '../design/semantic-tokens.json'), 'utf8'));

test('semantic token metadata covers runtime color and chart tokens exactly once', () => {
  const names = metadata.map((entry) => entry.token);
  assert.equal(new Set(names).size, names.length, 'semantic token metadata contains duplicate names');

  const palettes = colorEngine.buildPalettes('#5B5BD6');
  const runtimeNames = Object.keys(colorEngine.buildSemantics(palettes, 'light'));
  const chartNames = Array.from({ length: 6 }, (_, index) => `chart-${index + 1}`);
  const chartForegroundNames = Array.from({ length: 6 }, (_, index) => `chart-fg-${index + 1}`);

  for (const name of [...runtimeNames, ...chartNames, ...chartForegroundNames]) {
    assert.ok(names.includes(name), `missing semantic token metadata for ${name}`);
  }
});
