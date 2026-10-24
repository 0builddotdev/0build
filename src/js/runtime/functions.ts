import { BREAKPOINTS, PSEUDO_CLASSES, PSEUDO_ELEMENTS, STATES } from './registry/common';

// ============================================================================
// Registry Lookups
// ============================================================================

export type Breakpoint = keyof typeof BREAKPOINTS;

const VALID_BREAKPOINTS = new Set<string>(Object.keys(BREAKPOINTS));

const VALID_PSEUDO_CLASSES = new Set<string>([
  ...PSEUDO_CLASSES.map(p => (p.startsWith(':') ? p.slice(1) : p)),
  'group-hover',
]);

const VALID_PSEUDO_ELEMENTS = new Set<string>(
  PSEUDO_ELEMENTS.map(p => (p.startsWith('::') ? p.slice(2) : p.startsWith(':') ? p.slice(1) : p)),
);

const VALID_STATES = new Set<string>(
  STATES.map(s => (s.startsWith('::') ? s.slice(2) : s.startsWith(':') ? s.slice(1) : s)),
);

// ============================================================================
// Types
// ============================================================================

/** One space-separated piece of a value. */
export type Token =
  | { kind: 'raw'; text: string }
  | { kind: 'bracket'; raw: string }
  | { kind: 'scale'; name: string | null; amount: string }
  | { kind: 'alpha'; color: string; alpha: string };

export interface ParsedClass {
  /** True when prefixed with `dark:`. */
  isDark: boolean;
  /** Responsive breakpoint prefix from `BREAKPOINTS`, or `null`. */
  prefix: Breakpoint | null;
  /** Base property/selector name (e.g. `bg`, `bg/o`, `[m]`). */
  property: string;
  /** Pseudo-classes without leading `:` (e.g. `['hover', 'focus']`). */
  pseudoClasses: string[];
  /** Pseudo-element without leading `::` (e.g. `'before'`). */
  pseudoElement: string | null;
  /** Parsed value tokens after `=`, or `null` when the class has no `=value`. */
  value: Token[] | null;
  /** True when suffixed with `!`. */
  important: boolean;
  /** Canonical base selector (`property` or `property=value`). */
  baseClass: string;
  /** Combined state suffix (e.g. `':hover::before'` or `''`). */
  state: string;
  /** Full canonical class string. */
  fullClass: string;
}

export interface DecodeOptions {
  /** Alias table, name to name: `{ ml: 'margin-left' }`. */
  aliases?: Readonly<Record<string, string>>;
  /** Decides whether `name` in `name/50` is a tokenized color. Default: never. */
  isColorToken?: (name: string) => boolean;
  /** When true, allows bare property names without `:` or `=` (e.g. `'bg'`, `'[m]'`). */
  allowBare?: boolean;
}

export type DecodeResult =
  | { ok: true; value: ParsedClass }
  | { ok: false; reason: 'not-ours' }
  | { ok: false; reason: 'invalid'; message: string; index: number };

export interface VariableInput {
  isDark?: boolean;
  prefix?: string | null;
  name?: string;
  property?: string;
  state?: string;
  pseudoClasses?: readonly string[];
  pseudoElement?: string | null;
}

// ============================================================================
// Errors
// ============================================================================

export class SyntaxFail extends Error {
  readonly index: number;
  constructor(message: string, index: number) {
    super(message);
    this.name = 'SyntaxFail';
    this.index = index;
  }
}

export class NotOurs extends Error {
  constructor() {
    super('not a framework class');
    this.name = 'NotOurs';
  }
}

export class EncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncodeError';
  }
}

// ============================================================================
// Scanner
// ============================================================================

export interface Scan {
  readonly text: string;
  readonly depth: Int32Array;
  readonly parens: Int32Array;
  readonly quoted: Uint8Array;
}

export function scan(text: string, base = 0): Scan {
  const n = text.length;
  const depth = new Int32Array(n);
  const parens = new Int32Array(n);
  const quoted = new Uint8Array(n);
  const expected: string[] = [];
  let paren = 0;
  let quote: string | null = null;

  for (let i = 0; i < n; i++) {
    const ch = text[i];

    depth[i] = expected.length;
    parens[i] = paren;

    if (quote !== null) {
      if (ch === quote) {
        quote = null;
      } else {
        quoted[i] = 1;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === '(') {
      expected.push(')');
      paren++;
    } else if (ch === '[') {
      expected.push(']');
    } else if (ch === ')' || ch === ']') {
      const want = expected.pop();

      if (want === undefined) {
        throw new SyntaxFail(`unexpected "${ch}"`, base + i);
      }

      if (want !== ch) {
        throw new SyntaxFail(`expected "${want}" but found "${ch}"`, base + i);
      }

      if (ch === ')') {
        paren--;
      }
    }
  }

  if (quote !== null) {
    throw new SyntaxFail('unclosed quote', base + n);
  }

  if (expected.length > 0) {
    const open = expected[expected.length - 1] === ')' ? '(' : '[';

    throw new SyntaxFail(`unclosed "${open}"`, base + n);
  }

  return { text, depth, parens, quoted };
}

export function isTop(s: Scan, i: number): boolean {
  return s.depth[i] === 0 && s.quoted[i] === 0;
}

export function findTop(s: Scan, ch: string, from = 0, to = s.text.length): number {
  for (let i = from; i < to; i++) {
    if (s.text[i] === ch && isTop(s, i)) {
      return i;
    }
  }

  return -1;
}

export function isWholeBracket(s: Scan, open: '(' | '['): boolean {
  const n = s.text.length;

  if (n < 2 || s.text[0] !== open || s.text[n - 1] !== (open === '(' ? ')' : ']')) {
    return false;
  }

  for (let i = 1; i < n - 1; i++) {
    if (s.depth[i] < 1) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Text & Equality Helpers
// ============================================================================

export function underscoreRun(text: string, i: number, base: number): number {
  let j = i;

  while (text[j] === '_') {
    j++;
  }
  const n = j - i;

  if (n > 1 && n % 2 === 1) {
    throw new SyntaxFail(
      `a run of ${n} underscores is ambiguous: "_" is a space and "__" is a literal underscore`,
      base + i,
    );
  }

  return n;
}

export function decodeName(text: string, base = 0): string {
  let out = '';

  for (let i = 0; i < text.length; ) {
    if (text[i] !== '_') {
      out += text[i++];
      continue;
    }
    const n = underscoreRun(text, i, base);

    if (n === 1) {
      throw new SyntaxFail('a name cannot contain a space; use "__" for "_"', base + i);
    }
    out += '_'.repeat(n / 2);
    i += n;
  }

  return out;
}

export function checkRawText(text: string, base = 0): void {
  const s = scan(text, base);

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      throw new SyntaxFail('"\\" is not allowed: the syntax has no backslash escapes', base + i);
    }

    if (s.quoted[i]) {
      continue;
    }
    const ch = text[i];

    if (ch === '{' || ch === '}') {
      throw new SyntaxFail(`"${ch}" is not allowed outside a string`, base + i);
    }

    if (ch === ';' && s.parens[i] === 0) {
      throw new SyntaxFail('";" is only allowed inside parentheses or a string', base + i);
    }

    if (ch === '/' && text[i + 1] === '*' && !s.quoted[i + 1]) {
      throw new SyntaxFail('"/*" would start a CSS comment', base + i);
    }
  }
}

export function encodeText(text: string): string {
  return text.replace(/[_ ]+/g, group => {
    if (group === ' ') {
      return '_';
    }

    if (/^_+$/.test(group)) {
      return '__'.repeat(group.length);
    }
    throw new EncodeError(
      `cannot write ${JSON.stringify(group)}: a space next to an underscore or another space has no spelling`,
    );
  });
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every(
    key =>
      Object.hasOwn(b, key) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

export function formatState(
  pseudoClasses: readonly string[],
  pseudoElement: string | null,
): string {
  let out = '';

  for (const p of pseudoClasses) {
    out += `:${p}`;
  }

  if (pseudoElement !== null) {
    out += `::${pseudoElement}`;
  }

  return out;
}

// ============================================================================
// 1. decoder() - Decodes a class string into a ParsedClass object
// ============================================================================

const PROPERTY =
  /^(?:\[[A-Za-z0-9_-]+\]|--[\w\u{80}-\u{10FFFF}-]+|-?[A-Za-z\u{80}-\u{10FFFF}][\w\u{80}-\u{10FFFF}-]*)(?:\/o)?$/u;
const PSEUDO = /^[A-Za-z][A-Za-z0-9-]*$/;
const SCALE = /^([A-Za-z][A-Za-z0-9-]*)?\*(-?(?:\d+(?:\.\d+)?|\.\d+))$/;
const ALPHA = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

export function decoder(input: string, options: DecodeOptions = {}): DecodeResult {
  try {
    return { ok: true, value: decodeStrict(input, options) };
  } catch (error) {
    if (error instanceof NotOurs) {
      return { ok: false, reason: 'not-ours' };
    }

    if (error instanceof SyntaxFail) {
      return { ok: false, reason: 'invalid', message: error.message, index: error.index };
    }
    throw error;
  }
}

export function decodeStrict(input: string, options: DecodeOptions = {}): ParsedClass {
  if (!options.allowBare && !input.includes(':') && !input.includes('=')) {
    throw new NotOurs();
  }
  const space = /\s/.exec(input);

  if (space) {
    throw new SyntaxFail('whitespace is not allowed in a class name; use "_"', space.index);
  }
  const s = scan(input);
  const eq = findTop(s, '=');

  if (eq === -1) {
    if (!options.allowBare && !input.includes(':')) {
      throw new NotOurs();
    }
    const left = parseLeft(input, 0, options);
    const state = formatState(left.pseudoClasses, left.pseudoElement);
    const partial = {
      ...left,
      value: null,
      important: false,
      baseClass: left.property,
      state,
      fullClass: '',
    };

    partial.fullClass = build(partial);

    return partial;
  }

  const left = parseLeft(input.slice(0, eq), 0, options);
  const { value, important, rawBody } = parseValue(input.slice(eq + 1), eq + 1, options);
  const state = formatState(left.pseudoClasses, left.pseudoElement);
  const partial: ParsedClass = {
    ...left,
    value,
    important,
    baseClass: `${left.property}=${rawBody}`,
    state,
    fullClass: '',
  };

  partial.fullClass = build(partial);

  return partial;
}

function parseLeft(text: string, base: number, options: DecodeOptions) {
  if (text === '') {
    throw new SyntaxFail('missing property name', base);
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '(' || ch === ')') {
      throw new SyntaxFail('functional pseudo-classes such as :not() are not supported', base + i);
    }

    if (ch === "'" || ch === '"' || ch === ';' || ch === '@' || ch === '!' || ch === '|') {
      throw new SyntaxFail(`unexpected "${ch}" before "="`, base + i);
    }
  }

  let pos = 0;
  let isDark = false;

  if (text.startsWith('dark:')) {
    isDark = true;
    pos = 5;

    if (text.startsWith('dark:', pos)) {
      throw new SyntaxFail('duplicate "dark:" prefix', base + pos);
    }
  }

  let prefix: Breakpoint | null = null;
  const firstColon = text.indexOf(':', pos);

  if (firstColon !== -1) {
    const candidate = text.slice(pos, firstColon);

    if (VALID_BREAKPOINTS.has(candidate)) {
      prefix = candidate as Breakpoint;
      pos = firstColon + 1;

      if (text.startsWith('dark:', pos)) {
        throw new SyntaxFail('"dark:" must come before the breakpoint prefix', base + pos);
      }
      const nextColon = text.indexOf(':', pos);

      if (nextColon !== -1 && VALID_BREAKPOINTS.has(text.slice(pos, nextColon))) {
        throw new SyntaxFail('only one breakpoint prefix is allowed', base + pos);
      }
    }
  }

  const rem = text.slice(pos);
  const remBase = base + pos;

  if (rem === '') {
    throw new SyntaxFail('missing property name', remBase);
  }

  const colon = rem.indexOf(':');
  const rawName = colon === -1 ? rem : rem.slice(0, colon);

  if (rawName === '') {
    throw new SyntaxFail('missing property name', remBase);
  }
  const decoded = decodeName(rawName, remBase);

  if (!PROPERTY.test(decoded)) {
    throw new SyntaxFail(`"${decoded}" is not a valid property name`, remBase);
  }

  const aliases = options.aliases;
  const hasAlias = aliases !== undefined && Object.hasOwn(aliases, decoded);

  if (
    !hasAlias &&
    (decoded === 'dark' || VALID_BREAKPOINTS.has(decoded) || VALID_STATES.has(decoded))
  ) {
    throw new SyntaxFail(
      `"${decoded}" is a reserved prefix or state, not a property name`,
      remBase,
    );
  }
  const property = hasAlias ? aliases[decoded] : decoded;

  const pseudoClasses: string[] = [];
  let pseudoElement: string | null = null;
  const rest = colon === -1 ? '' : rem.slice(colon);
  const restBase = remBase + (colon === -1 ? rem.length : colon);

  for (let i = 0; i < rest.length; ) {
    if (pseudoElement !== null) {
      throw new SyntaxFail('a pseudo-element must come last', restBase + i);
    }
    const isElement = rest[i + 1] === ':';
    const start = i + (isElement ? 2 : 1);
    let end = rest.indexOf(':', start);

    if (end === -1) {
      end = rest.length;
    }
    const ident = rest.slice(start, end);

    if (!PSEUDO.test(ident)) {
      throw new SyntaxFail(
        ident === ''
          ? `missing name after "${isElement ? '::' : ':'}"`
          : `"${ident}" is not a valid pseudo-class or pseudo-element name`,
        restBase + start,
      );
    }

    if (isElement) {
      if (!VALID_PSEUDO_ELEMENTS.has(ident)) {
        throw new SyntaxFail(`"::${ident}" is not a supported pseudo-element`, restBase + i);
      }
      pseudoElement = ident;
    } else {
      if (!VALID_PSEUDO_CLASSES.has(ident)) {
        throw new SyntaxFail(`":${ident}" is not a supported pseudo-class`, restBase + i);
      }
      pseudoClasses.push(ident);
    }
    i = end;
  }

  return { isDark, prefix, property, pseudoClasses, pseudoElement };
}

function parseValue(text: string, base: number, options: DecodeOptions) {
  if (text === '') {
    throw new SyntaxFail('missing value', base);
  }
  const whole = scan(text, base);
  let important = false;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '!' && isTop(whole, i)) {
      if (i !== text.length - 1) {
        throw new SyntaxFail('"!" is only allowed at the very end of a value', base + i);
      }
      important = true;
    }
  }
  const body = important ? text.slice(0, -1) : text;

  if (body === '') {
    throw new SyntaxFail('missing value', base);
  }

  const value = parseSide(body, base, options);

  return { value, important, rawBody: body };
}

function parseSide(side: string, base: number, options: DecodeOptions): Token[] {
  const s = scan(side, base);
  const pieces: { text: string; at: number }[] = [];
  let current = '';
  let startedAt = 0;

  for (let i = 0; i < side.length; ) {
    if (side[i] !== '_') {
      current += side[i++];
      continue;
    }
    const n = underscoreRun(side, i, base);

    if (n === 1) {
      if (isTop(s, i)) {
        pieces.push({ text: current, at: startedAt });
        current = '';
        startedAt = i + 1;
      } else {
        current += ' ';
      }
    } else {
      current += '_'.repeat(n / 2);
    }
    i += n;
  }
  pieces.push({ text: current, at: startedAt });

  return pieces.map(({ text, at }) => {
    if (text === '') {
      throw new SyntaxFail('empty token: check for a leading, trailing or doubled "_"', base + at);
    }

    return classify(text, base + at, options);
  });
}

function classify(text: string, base: number, options: DecodeOptions): Token {
  const s = scan(text, base);

  if (isWholeBracket(s, '[')) {
    const raw = text.slice(1, -1);

    if (raw.trim() === '') {
      throw new SyntaxFail('empty brackets', base);
    }
    checkRawText(raw, base + 1);

    return { kind: 'bracket', raw };
  }

  let hasStar = false;
  const slashes: number[] = [];

  for (let i = 0; i < text.length; i++) {
    if (!isTop(s, i)) {
      continue;
    }
    const ch = text[i];

    if (ch === ';' || ch === '=' || ch === '{' || ch === '}' || ch === '|') {
      throw new SyntaxFail(`unexpected "${ch}" in a value`, base + i);
    }

    if (ch === '*') {
      hasStar = true;
    }

    if (ch === '/') {
      slashes.push(i);
    }
  }

  if (hasStar) {
    const m = SCALE.exec(text);

    if (!m) {
      throw new SyntaxFail('"*" must form a scale such as *4 or name*-4', base);
    }

    return { kind: 'scale', name: m[1] ?? null, amount: m[2] };
  }

  if (slashes.length > 0 && options.isColorToken !== undefined) {
    const color = text.slice(0, slashes[0]);

    if (options.isColorToken(color)) {
      const alpha = text.slice(slashes[0] + 1);

      if (slashes.length > 1 || !ALPHA.test(alpha)) {
        throw new SyntaxFail(
          `"${alpha}" is not a valid alpha after "${color}/"`,
          base + slashes[0],
        );
      }

      return { kind: 'alpha', color, alpha };
    }
  }

  checkRawText(text, base);

  return { kind: 'raw', text };
}

// ============================================================================
// 2. encoder() - Encodes a ParsedClass object back into a canonical class name
// ============================================================================

export type EncodableClass = Pick<
  ParsedClass,
  'isDark' | 'prefix' | 'property' | 'pseudoClasses' | 'pseudoElement'
> & {
  value?: Token[] | null;
  important?: boolean;
};

export function encoder(c: EncodableClass): string {
  const out = build(c);

  verify(c, out);

  return out;
}

function build(c: EncodableClass): string {
  let out = '';

  if (c.isDark) {
    out += 'dark:';
  }

  if (c.prefix !== null) {
    out += `${String(c.prefix)}:`;
  }
  out += c.property.replaceAll('_', '__');

  for (const p of c.pseudoClasses) {
    out += ':' + p;
  }

  if (c.pseudoElement !== null) {
    out += '::' + c.pseudoElement;
  }

  if (c.value !== undefined && c.value !== null && c.value.length > 0) {
    out += '=' + encodeSide(c.value);

    if (c.important) {
      out += '!';
    }
  }

  return out;
}

function encodeSide(tokens: readonly Token[]): string {
  return tokens.map(encodeToken).join('_');
}

function encodeToken(t: Token): string {
  switch (t.kind) {
    case 'raw':
      return encodeText(t.text);
    case 'bracket':
      return `[${encodeText(t.raw)}]`;
    case 'scale':
      return `${(t.name ?? '').replaceAll('_', '__')}*${t.amount}`;
    case 'alpha':
      return `${t.color.replaceAll('_', '__')}/${t.alpha}`;
    default:
      throw new EncodeError(`unknown token kind: ${JSON.stringify(t)}`);
  }
}

function verify(c: EncodableClass, out: string): void {
  const colors = new Set<string>();

  for (const t of c.value ?? []) {
    if (t.kind === 'alpha') {
      colors.add(t.color);
    }
  }
  const hasValue = c.value !== undefined && c.value !== null && c.value.length > 0;
  const expectedCore = {
    isDark: c.isDark,
    prefix: c.prefix,
    property: c.property,
    pseudoClasses: c.pseudoClasses,
    pseudoElement: c.pseudoElement,
    value: hasValue ? c.value : null,
    important: hasValue ? Boolean(c.important) : false,
  };
  const result = decoder(out, {
    isColorToken: name => colors.has(name),
    allowBare: true,
  });

  if (!result.ok) {
    const why = result.reason === 'invalid' ? result.message : 'not a class';

    throw new EncodeError(`the object cannot be written as a class (${why}): ${out}`);
  }
  const actualCore = {
    isDark: result.value.isDark,
    prefix: result.value.prefix,
    property: result.value.property,
    pseudoClasses: result.value.pseudoClasses,
    pseudoElement: result.value.pseudoElement,
    value: result.value.value,
    important: result.value.important,
  };

  if (!deepEqual(actualCore, expectedCore)) {
    throw new EncodeError(`the object does not survive a round trip through "${out}"`);
  }
}

// ============================================================================
// 3. variable() - Generates a normalized CSS custom property name
// ============================================================================

export function variable(input: VariableInput): string {
  const rawName = input.name ?? input.property ?? '';
  const statePart =
    input.state !== undefined
      ? normalizeStateForVarName(input.state)
      : [...(input.pseudoClasses ?? []), input.pseudoElement ?? ''].filter(Boolean).join('-');

  const parts = [
    input.isDark ? 'dark' : '',
    input.prefix ?? '',
    rawName.replace(/[^a-zA-Z0-9-]/g, ''),
    statePart,
  ];

  return `--${parts.filter(Boolean).join('-')}`;
}

function normalizeStateForVarName(state: string): string {
  return state.split(/::?/).filter(Boolean).join('-');
}

// ============================================================================
// 4. escaper() - CSSOM identifier escaper
// ============================================================================

export function escaper(value: string): string {
  let out = '';
  let index = 0;
  const startsWithHyphen = value.startsWith('-');

  for (const ch of value) {
    const cp = ch.codePointAt(0) as number;
    const isDigit = cp >= 0x30 && cp <= 0x39;

    if (cp === 0x0) {
      out += '\uFFFD';
    } else if (
      (cp >= 0x1 && cp <= 0x1f) ||
      cp === 0x7f ||
      (index === 0 && isDigit) ||
      (index === 1 && isDigit && startsWithHyphen)
    ) {
      out += '\\' + cp.toString(16) + ' ';
    } else if (index === 0 && cp === 0x2d && value.length === 1) {
      out += '\\-';
    } else if (
      cp >= 0x80 ||
      cp === 0x2d ||
      cp === 0x5f ||
      isDigit ||
      (cp >= 0x41 && cp <= 0x5a) ||
      (cp >= 0x61 && cp <= 0x7a)
    ) {
      out += ch;
    } else {
      out += '\\' + ch;
    }
    index++;
  }

  return out;
}
