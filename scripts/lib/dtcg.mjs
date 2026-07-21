const TOKEN_PROPERTIES = new Set(['$value', '$type', '$description', '$extensions', '$deprecated']);
const GROUP_PROPERTIES = new Set(['$type', '$description', '$extensions', '$deprecated', '$extends']);
const TOKEN_TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier',
  'number', 'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography',
]);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const aliasPattern = /^\{([^{}]+)\}$/;

export function collectDtcgTokens(document) {
  const tokens = [];
  function visit(node, path = [], inheritedType = null) {
    if (!isObject(node)) return;
    if (Object.hasOwn(node, '$value')) {
      tokens.push({ path: path.join('.'), segments: path, token: node, type: node.$type ?? inheritedType });
      return;
    }
    const nextType = node.$type ?? inheritedType;
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') && key !== '$root') continue;
      visit(child, [...path, key], nextType);
    }
  }
  visit(document);
  return tokens;
}

export function countDtcgTokens(document) {
  return collectDtcgTokens(document).length;
}

function aliasesIn(value, aliases = []) {
  if (typeof value === 'string') {
    const match = aliasPattern.exec(value);
    if (match) aliases.push(match[1]);
    return aliases;
  }
  if (Array.isArray(value)) {
    for (const item of value) aliasesIn(item, aliases);
    return aliases;
  }
  if (isObject(value)) {
    for (const item of Object.values(value)) aliasesIn(item, aliases);
  }
  return aliases;
}

function validateDimension(value, path, errors) {
  if (!isObject(value) || typeof value.value !== 'number' || !['px', 'rem'].includes(value.unit)) {
    errors.push(`${path}: dimension value must be { value: number, unit: "px" | "rem" }`);
  }
}

function validateDuration(value, path, errors) {
  if (!isObject(value) || typeof value.value !== 'number' || value.value < 0 || !['ms', 's'].includes(value.unit)) {
    errors.push(`${path}: duration value must be a non-negative { value: number, unit: "ms" | "s" }`);
  }
}

function validateColor(value, path, errors) {
  if (!isObject(value) || typeof value.colorSpace !== 'string' || !Array.isArray(value.components)) {
    errors.push(`${path}: color value must define colorSpace and components`);
    return;
  }
  if (value.colorSpace === 'srgb') {
    if (value.components.length !== 3 || value.components.some((part) => typeof part !== 'number' || part < 0 || part > 1)) {
      errors.push(`${path}: sRGB components must contain three numbers from 0 through 1`);
    }
  }
  if (value.alpha !== undefined && (typeof value.alpha !== 'number' || value.alpha < 0 || value.alpha > 1)) {
    errors.push(`${path}: color alpha must be a number from 0 through 1`);
  }
}

function validateTypography(value, path, errors) {
  const required = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'];
  if (!isObject(value) || required.some((key) => !Object.hasOwn(value, key))) {
    errors.push(`${path}: typography value must define ${required.join(', ')}`);
    return;
  }
  if (!(typeof value.fontFamily === 'string' || (Array.isArray(value.fontFamily) && value.fontFamily.every((item) => typeof item === 'string')))) {
    errors.push(`${path}: typography fontFamily must be a string or string array`);
  }
  validateDimension(value.fontSize, `${path}.fontSize`, errors);
  validateDimension(value.letterSpacing, `${path}.letterSpacing`, errors);
  if (!(typeof value.fontWeight === 'number' || typeof value.fontWeight === 'string')) {
    errors.push(`${path}: typography fontWeight must be a number or string`);
  }
  if (typeof value.lineHeight !== 'number') errors.push(`${path}: typography lineHeight must be a number`);
}

function validateShadowLayer(layer, path, errors) {
  if (!isObject(layer)) {
    errors.push(`${path}: shadow layer must be an object`);
    return;
  }
  for (const key of ['offsetX', 'offsetY', 'blur', 'spread']) validateDimension(layer[key], `${path}.${key}`, errors);
  if (!(typeof layer.color === 'string' && aliasPattern.test(layer.color))) validateColor(layer.color, `${path}.color`, errors);
}

function validateTypedValue(value, type, path, errors) {
  if (typeof value === 'string' && aliasPattern.test(value)) return;
  switch (type) {
    case 'color': validateColor(value, path, errors); break;
    case 'dimension': validateDimension(value, path, errors); break;
    case 'duration': validateDuration(value, path, errors); break;
    case 'number':
      if (typeof value !== 'number') errors.push(`${path}: number token value must be numeric`);
      break;
    case 'fontFamily':
      if (!(typeof value === 'string' || (Array.isArray(value) && value.every((item) => typeof item === 'string')))) {
        errors.push(`${path}: fontFamily value must be a string or string array`);
      }
      break;
    case 'fontWeight':
      if (!(typeof value === 'number' || typeof value === 'string')) errors.push(`${path}: fontWeight value must be numeric or a keyword`);
      break;
    case 'cubicBezier':
      if (!Array.isArray(value) || value.length !== 4 || value.some((part) => typeof part !== 'number') || value[0] < 0 || value[0] > 1 || value[2] < 0 || value[2] > 1) {
        errors.push(`${path}: cubicBezier value must contain four numbers with x coordinates from 0 through 1`);
      }
      break;
    case 'typography': validateTypography(value, path, errors); break;
    case 'shadow':
      (Array.isArray(value) ? value : [value]).forEach((layer, index) => validateShadowLayer(layer, `${path}[${index}]`, errors));
      break;
    default:
      break;
  }
}

export function validateDtcgDocument(document, { label = 'document', allowUnresolvedAliases = false } = {}) {
  const errors = [];
  if (!isObject(document)) return [`${label}: root must be a JSON object`];

  function visit(node, path = [], inheritedType = null) {
    const location = path.length ? `${label}:${path.join('.')}` : label;
    if (!isObject(node)) {
      errors.push(`${location}: group or token must be an object`);
      return;
    }
    const isToken = Object.hasOwn(node, '$value');
    if (isToken) {
      for (const key of Object.keys(node)) {
        if (!TOKEN_PROPERTIES.has(key)) errors.push(`${location}: token has unsupported property ${key}`);
      }
      const type = node.$type ?? inheritedType;
      if (node.$type !== undefined && !TOKEN_TYPES.has(node.$type)) errors.push(`${location}: unsupported token type ${node.$type}`);
      if (!type && !(typeof node.$value === 'string' && aliasPattern.test(node.$value))) {
        errors.push(`${location}: token type cannot be determined`);
      } else if (type) {
        validateTypedValue(node.$value, type, `${location}.$value`, errors);
      }
      return;
    }

    if (node.$type !== undefined && !TOKEN_TYPES.has(node.$type)) errors.push(`${location}: unsupported group type ${node.$type}`);
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) {
        if (key === '$root') {
          visit(child, [...path, key], node.$type ?? inheritedType);
        } else if (!GROUP_PROPERTIES.has(key)) {
          errors.push(`${location}: group has unsupported property ${key}`);
        }
        continue;
      }
      if (/[{}.]/.test(key)) errors.push(`${location}: token and group names must not contain period or braces (${key})`);
      visit(child, [...path, key], node.$type ?? inheritedType);
    }
  }
  visit(document);

  const tokenEntries = collectDtcgTokens(document);
  const tokensByPath = new Map(tokenEntries.map((entry) => [entry.path, entry]));
  function resolveTokenType(path, resolving = new Set()) {
    const entry = tokensByPath.get(path);
    if (!entry) return null;
    if (entry.type) return entry.type;
    if (typeof entry.token.$value !== 'string') return null;
    const match = aliasPattern.exec(entry.token.$value);
    if (!match || resolving.has(path)) return null;
    resolving.add(path);
    const type = resolveTokenType(match[1], resolving);
    resolving.delete(path);
    return type;
  }
  for (const entry of tokenEntries) {
    for (const alias of aliasesIn(entry.token.$value)) {
      if (!tokensByPath.has(alias) && !allowUnresolvedAliases) {
        errors.push(`${label}:${entry.path}: unresolved alias {${alias}}`);
      }
    }
    if (typeof entry.token.$value === 'string') {
      const match = aliasPattern.exec(entry.token.$value);
      const targetType = match ? resolveTokenType(match[1]) : null;
      const effectiveType = entry.type ?? targetType;
      if (match && tokensByPath.has(match[1]) && !effectiveType) {
        errors.push(`${label}:${entry.path}: token type cannot be determined from alias {${match[1]}}`);
      }
      if (match && entry.type && targetType && entry.type !== targetType) {
        errors.push(`${label}:${entry.path}: ${entry.type} alias must not reference ${targetType} token {${match[1]}}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visitAlias(path) {
    if (visiting.has(path)) {
      errors.push(`${label}:${path}: circular alias`);
      return;
    }
    if (visited.has(path)) return;
    visiting.add(path);
    const entry = tokensByPath.get(path);
    if (entry) {
      for (const alias of aliasesIn(entry.token.$value)) if (tokensByPath.has(alias)) visitAlias(alias);
    }
    visiting.delete(path);
    visited.add(path);
  }
  for (const path of tokensByPath.keys()) visitAlias(path);
  return errors;
}

export function resolveDtcgValue(document, tokenPath) {
  const tokens = new Map(collectDtcgTokens(document).map((entry) => [entry.path, entry.token]));
  const resolving = new Set();
  function resolveValue(value) {
    if (typeof value === 'string') {
      const match = aliasPattern.exec(value);
      if (!match) return value;
      if (resolving.has(match[1])) throw new Error(`Circular alias: ${match[1]}`);
      const token = tokens.get(match[1]);
      if (!token) throw new Error(`Unknown alias: ${match[1]}`);
      resolving.add(match[1]);
      const resolved = resolveValue(token.$value);
      resolving.delete(match[1]);
      return resolved;
    }
    if (Array.isArray(value)) return value.map(resolveValue);
    if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveValue(item)]));
    return value;
  }
  const token = tokens.get(tokenPath);
  if (!token) throw new Error(`Unknown token path: ${tokenPath}`);
  return resolveValue(token.$value);
}
