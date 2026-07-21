const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const motion = JSON.parse(readFileSync(join(root, 'tokens/src/motion.json'), 'utf8'));
const lightBundle = JSON.parse(readFileSync(join(root, 'tokens/build/meridian.tokens.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const foundationPage = readFileSync(join(root, 'js/pages-foundations.js'), 'utf8');
const utils = readFileSync(join(root, 'js/utils.js'), 'utf8');
const generatedSource = readFileSync(join(root, 'js/generated/foundation-token-meta.js'), 'utf8');
const generated = vm.runInNewContext(`${generatedSource}\n({ MOTION_DURATIONS, MOTION_EASINGS, MOTION_DISTANCES });`);
const entries = (group) => Object.entries(group).filter(([key]) => !key.startsWith('$'));

test('motion source, generated metadata, and CSS stay synchronized', () => {
  assert.deepEqual(lightBundle.motion, motion);
  assert.equal(generated.MOTION_DURATIONS.length, entries(motion.duration).length);
  assert.equal(generated.MOTION_EASINGS.length, entries(motion.easing).length);
  assert.equal(generated.MOTION_DISTANCES.length, entries(motion.distance).length);

  for (const row of generated.MOTION_DURATIONS) assert.match(css, new RegExp(`${row.token.slice(2)}:${row.value}`));
  for (const row of generated.MOTION_EASINGS) assert.match(css, new RegExp(`${row.token.slice(2)}:${row.value.replace(/[()]/g, '\\$&')}`));
  for (const row of generated.MOTION_DISTANCES) assert.match(css, new RegExp(`${row.token.slice(2)}:${row.value}`));
});

test('duration order is monotonic and easing curves avoid overshoot', () => {
  const durations = entries(motion.duration).map(([, token]) => token.$value.value);
  assert.deepEqual(durations, [...durations].sort((a, b) => a - b));
  for (const [, token] of entries(motion.easing)) {
    assert.equal(token.$value.length, 4);
    for (const coordinate of token.$value) assert.ok(coordinate >= 0 && coordinate <= 1);
  }
});

test('reduced-motion mode zeroes every spatial duration and distance', () => {
  assert.match(indexHtml, /@media \(prefers-reduced-motion: reduce\)/);
  for (const [id] of entries(motion.duration)) assert.match(css, new RegExp(`--dur-${id}:0ms`));
  for (const [id, token] of entries(motion.distance)) {
    if (token.$value.value > 0) assert.match(css, new RegExp(`--motion-distance-${id}:0px`));
  }
  assert.doesNotMatch(indexHtml, /--dur-instant:0ms/);
  assert.doesNotMatch(indexHtml, /--motion-distance-sm:0px/);
  assert.match(indexHtml, /animation-iteration-count:1!important/);
});

test('docs and implementation use generated motion token names', () => {
  assert.doesNotMatch(foundationPage, /--duration-/);
  assert.doesNotMatch(foundationPage, /\beasing-(?:standard|enter|exit|emphasized)\b/);
  assert.doesNotMatch(indexHtml, /animation:[^;\n]*(?:\.7s|1\.2s|1\.4s)/);
  assert.doesNotMatch(utils, /transition='[^']*\.3s/);
});
