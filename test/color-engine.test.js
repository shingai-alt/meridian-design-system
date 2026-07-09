const test = require('node:test');
const assert = require('node:assert/strict');
const {
  hexToOklch, oklchToHex, contrast, onColor, mix, clamp,
  buildPalettes, buildSemantics, buildCharts, SEED_PRESETS, STEPS,
} = require('../src/color-engine.js');

test('hexToOklch -> oklchToHex round-trips within rounding tolerance', () => {
  for (const { hex } of SEED_PRESETS) {
    const { l, c, h } = hexToOklch(hex);
    const roundTripped = oklchToHex(l, c, h);
    for (let i = 0; i < 3; i++) {
      const a = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
      const b = parseInt(roundTripped.slice(1 + i * 2, 3 + i * 2), 16);
      assert.ok(Math.abs(a - b) <= 1, `${hex} -> ${roundTripped} channel ${i} diverged`);
    }
  }
});

test('oklchToHex clamps out-of-gamut chroma into a valid #rrggbb', () => {
  const hex = oklchToHex(60, 5, 30); // chroma 5 is far outside sRGB gamut
  assert.match(hex, /^#[0-9a-f]{6}$/);
});

test('buildPalettes is deterministic for the same seed', () => {
  const a = buildPalettes('#5B5BD6');
  const b = buildPalettes('#5B5BD6');
  assert.deepEqual(a, b);
});

test('buildPalettes produces all 11 tone steps for every role', () => {
  const p = buildPalettes('#3D74E0');
  for (const role of Object.values(p)) {
    for (const step of STEPS) assert.match(role[step], /^#[0-9a-f]{6}$/);
  }
});

test('onColor picks the higher-contrast of black/white', () => {
  assert.equal(onColor('#0a0a0f'), '#ffffff');
  assert.equal(onColor('#ffffff'), '#0a0a14');
});

test('mix blends toward the second color as weight approaches 1', () => {
  assert.equal(mix('#ff0000', '#0000ff', 0), '#ff0000');
  assert.equal(mix('#ff0000', '#0000ff', 1), '#0000ff');
});

test('clamp bounds a value to [min, max]', () => {
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(5, 0, 10), 5);
});

test('buildSemantics: light and dark themes meet WCAG AA (4.5:1) for primary-on-background', () => {
  for (const { hex } of SEED_PRESETS) {
    const P = buildPalettes(hex);
    for (const theme of ['light', 'dark']) {
      const T = buildSemantics(P, theme);
      assert.ok(
        contrast(T.primary, T.background) >= 4.5,
        `${hex}/${theme}: primary vs background contrast ${contrast(T.primary, T.background).toFixed(2)} < 4.5`
      );
      assert.ok(
        contrast(T.foreground, T.background) >= 4.5,
        `${hex}/${theme}: foreground vs background contrast too low`
      );
    }
  }
});

test('buildSemantics: high-contrast theme meets AAA (7:1) for primary-on-background', () => {
  for (const { hex } of SEED_PRESETS) {
    const P = buildPalettes(hex);
    const T = buildSemantics(P, 'hc');
    assert.ok(contrast(T.primary, T.background) >= 7, `${hex}/hc: primary contrast below AAA`);
  }
});

test('buildCharts returns 6 distinct, valid hex colors', () => {
  const chart = buildCharts('#5B5BD6', 'light');
  assert.equal(chart.length, 6);
  for (const hex of chart) assert.match(hex, /^#[0-9a-f]{6}$/);
  assert.equal(new Set(chart).size, 6);
});
