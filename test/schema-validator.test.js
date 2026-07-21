const test = require('node:test');
const assert = require('node:assert/strict');

test('validates required properties, local refs, and additional properties', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['item'],
    properties: { item: { $ref: '#/$defs/item' } },
    $defs: {
      item: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: { id: { type: 'string', pattern: '^[a-z]+$' } },
      },
    },
  };

  assert.deepEqual(validateAgainstSchema({ item: { id: 'button' } }, schema), []);
  const errors = validateAgainstSchema({ item: { id: 'Button', extra: true } }, schema);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /must match/);
  assert.match(errors[1], /not an allowed property/);
});

test('validates enums, arrays, and nullable types', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = {
    type: 'object',
    required: ['status', 'tags', 'completedAt'],
    properties: {
      status: { enum: ['draft', 'stable'] },
      tags: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
      completedAt: { type: ['string', 'null'] },
    },
  };

  assert.deepEqual(validateAgainstSchema({ status: 'draft', tags: ['ui'], completedAt: null }, schema), []);
  const errors = validateAgainstSchema({ status: 'done', tags: [], completedAt: 1 }, schema);
  assert.equal(errors.length, 3);
});

test('rejects schema assertions the local validator does not implement', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const errors = validateAgainstSchema('value', {
    type: 'string',
    oneOf: [{ const: 'value' }, { const: 'other' }],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /oneOf is not supported/);
});

test('validates inclusive numeric bounds', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = {
    type: 'object',
    required: ['count', 'ratio'],
    properties: {
      count: { type: 'integer', minimum: 1, maximum: 5 },
      ratio: { type: 'number', minimum: 0, maximum: 1 },
    },
  };

  assert.deepEqual(validateAgainstSchema({ count: 1, ratio: 1 }, schema), []);
  const errors = validateAgainstSchema({ count: 0, ratio: 1.1 }, schema);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /greater than or equal/);
  assert.match(errors[1], /less than or equal/);
});

test('validates inclusive array bounds', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = { type: 'array', minItems: 1, maxItems: 2, items: { type: 'string' } };

  assert.deepEqual(validateAgainstSchema(['one', 'two'], schema), []);
  const errors = validateAgainstSchema(['one', 'two', 'three'], schema);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /no more than 2 items/);
});
