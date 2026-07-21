function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function matchesType(value, expected) {
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'null') return value === null;
  return typeof value === expected;
}

function resolveLocalRef(rootSchema, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Only local schema refs are supported: ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((current, part) => current?.[part], rootSchema);
}

function joinPath(base, segment) {
  if (typeof segment === 'number') return `${base}[${segment}]`;
  return base === '$' ? `$.${segment}` : `${base}.${segment}`;
}

const supportedKeywords = new Set([
  '$schema',
  '$id',
  '$defs',
  '$ref',
  '$comment',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
  'type',
  'required',
  'properties',
  'additionalProperties',
  'items',
  'enum',
  'const',
  'pattern',
  'minLength',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'uniqueItems',
]);

export function findUnsupportedSchemaKeywords(schema) {
  const errors = [];

  function visit(rule, path) {
    if (typeof rule === 'boolean') return;
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      errors.push(`${path} must be a schema object or boolean`);
      return;
    }
    for (const key of Object.keys(rule)) {
      if (!supportedKeywords.has(key)) errors.push(`${path}.${key} is not supported by the local schema validator`);
    }
    for (const [name, child] of Object.entries(rule.properties ?? {})) visit(child, `${path}.properties.${name}`);
    for (const [name, child] of Object.entries(rule.$defs ?? {})) visit(child, `${path}.$defs.${name}`);
    if (rule.items !== undefined) visit(rule.items, `${path}.items`);
    if (rule.additionalProperties && typeof rule.additionalProperties === 'object') {
      visit(rule.additionalProperties, `${path}.additionalProperties`);
    }
  }

  visit(schema, '$schema');
  return errors;
}

export function validateAgainstSchema(value, schema, options = {}) {
  const errors = [];
  const label = options.label ? `${options.label}: ` : '';

  for (const error of findUnsupportedSchemaKeywords(schema)) errors.push(`${label}${error}`);

  function report(path, message) {
    errors.push(`${label}${path} ${message}`);
  }

  function visit(current, rule, path) {
    if (typeof rule === 'boolean') {
      if (!rule) report(path, 'is not allowed');
      return;
    }

    if (rule.$ref) {
      const resolved = resolveLocalRef(schema, rule.$ref);
      if (!resolved) {
        report(path, `references missing schema ${rule.$ref}`);
        return;
      }
      visit(current, resolved, path);
      return;
    }

    if (rule.type) {
      const expected = Array.isArray(rule.type) ? rule.type : [rule.type];
      if (!expected.some((type) => matchesType(current, type))) {
        report(path, `must be ${expected.join(' or ')}, received ${valueType(current)}`);
        return;
      }
    }

    if (rule.const !== undefined && current !== rule.const) {
      report(path, `must equal ${JSON.stringify(rule.const)}`);
    }

    if (rule.enum && !rule.enum.some((candidate) => Object.is(candidate, current))) {
      report(path, `must be one of ${rule.enum.map((item) => JSON.stringify(item)).join(', ')}`);
    }

    if (typeof current === 'string') {
      if (rule.minLength !== undefined && current.length < rule.minLength) {
        report(path, `must contain at least ${rule.minLength} characters`);
      }
      if (rule.pattern && !new RegExp(rule.pattern).test(current)) {
        report(path, `must match ${rule.pattern}`);
      }
    }

    if (typeof current === 'number' && Number.isFinite(current)) {
      if (rule.minimum !== undefined && current < rule.minimum) {
        report(path, `must be greater than or equal to ${rule.minimum}`);
      }
      if (rule.maximum !== undefined && current > rule.maximum) {
        report(path, `must be less than or equal to ${rule.maximum}`);
      }
    }

    if (Array.isArray(current)) {
      if (rule.minItems !== undefined && current.length < rule.minItems) {
        report(path, `must contain at least ${rule.minItems} items`);
      }
      if (rule.maxItems !== undefined && current.length > rule.maxItems) {
        report(path, `must contain no more than ${rule.maxItems} items`);
      }
      if (rule.uniqueItems) {
        const serialized = current.map((item) => JSON.stringify(item));
        if (new Set(serialized).size !== serialized.length) report(path, 'must contain unique items');
      }
      if (rule.items) current.forEach((item, index) => visit(item, rule.items, joinPath(path, index)));
    }

    if (current !== null && typeof current === 'object' && !Array.isArray(current)) {
      const properties = rule.properties ?? {};
      for (const key of rule.required ?? []) {
        if (!Object.hasOwn(current, key)) report(path, `is missing required property ${JSON.stringify(key)}`);
      }

      for (const [key, child] of Object.entries(current)) {
        if (Object.hasOwn(properties, key)) {
          visit(child, properties[key], joinPath(path, key));
          continue;
        }
        if (rule.additionalProperties === false) {
          report(joinPath(path, key), 'is not an allowed property');
        } else if (rule.additionalProperties && typeof rule.additionalProperties === 'object') {
          visit(child, rule.additionalProperties, joinPath(path, key));
        }
      }
    }
  }

  visit(value, schema, '$');
  return errors;
}
