import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import {
  NEW_RULES,
  SOURCES,
  LITERAL_VARS,
  LITERAL_PREFIXES,
  CC_EXTRA,
  VD_EXTRA,
  FLAGS,
  EXTRA_RULES,
  NOT_ARBITRARY,
} from './config';
import postcss, { AtRule, Rule as PostcssRule } from 'postcss';
import selectorParser from 'postcss-selector-parser';

// ---------- CLI & helpers ----------
const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: NEW_RULES },
  },
});

const isLiteral = (v: string) => LITERAL_VARS.has(v) || LITERAL_PREFIXES.some(p => v.startsWith(p));

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const arr = (a: string[]) => `[${a.map(q).join(', ')}]`;
const list = (a: string[]) => a.map(s => `  ${q(s)},`).join('\n');

const VAR_REF = /var\(\s*(--[\w-]+)/g;

interface Decl {
  prop: string;
  value: string;
}

/** CSS declarations → { properties, values, placeholders } in the old rules.ts shape. */
function templatize(decls: Decl[], isLit: (name: string) => boolean) {
  const placeholders: Record<string, string> = {};
  const seen = new Map<string, string>(); // '--bg' → '{var}'

  const values = decls.map(({ value }) =>
    value
      .replace(/\s+/g, ' ')
      .trim()
      .replace(VAR_REF, (match, name: string) => {
        if (isLit(name)) {
          return match;
        }
        let key = seen.get(name);

        if (!key) {
          key = seen.size === 0 ? '{var}' : `{var${seen.size + 1}}`;
          seen.set(name, key);
          placeholders[key] = name.slice(2); // stored as 'bg', not '--bg'
        }

        return `var(${key}`;
      }),
  );

  return { properties: decls.map(d => d.prop), values, placeholders };
}

// ---------- scanning ----------
interface Candidate {
  name: string;
  layer: string; // 'unlayered' if unknown
  layerSource: string;
  decls: Decl[];
  file: string;
  line?: number;
}

interface Skipped {
  file: string;
  line?: number;
  selector: string;
  why: string;
}

function getContext(rule: PostcssRule) {
  let layer: string | undefined;
  let skip = false;
  let media = false;

  for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
    if (p.type !== 'atrule') {
      continue;
    }
    const at = p as AtRule;

    if (at.name.endsWith('keyframes')) {
      skip = true;
    } else if (at.name === 'layer') {
      layer ??= at.params.trim() || undefined; // innermost wins
    } else if (['media', 'supports', 'container'].includes(at.name)) {
      media = true;
    }
  }

  return { layer, skip, media };
}

function resolveLayer(name: string, atLayer?: string, fileDefault?: string): [string, string] {
  if (atLayer) {
    return [atLayer, 'at-layer'];
  }

  // `.z` is the z-index utility; other z-* are components
  if (name !== 'z' && name.startsWith('z-')) {
    return ['components', 'name'];
  }

  if (fileDefault) {
    return [fileDefault, 'file-default'];
  }

  return ['unlayered', 'none'];
}

function parseList(selector: string) {
  const items: { raw: string; simple: string | null; classes: string[] }[] = [];

  selectorParser(sels => {
    sels.each(sel => {
      const classes: string[] = [];

      sel.walkClasses(c => {
        classes.push(c.value); // .value is already unescaped
      });
      const bare = sel.nodes.length === 1 && sel.nodes[0].type === 'class';

      items.push({ raw: sel.toString().trim(), simple: bare ? classes[0] : null, classes });
    });
  }).processSync(selector);

  return items;
}

const candidates = new Map<string, Candidate>();
const skipped: Skipped[] = [];
const warnings: string[] = [];
let inAtRules = 0;

for (const { file, defaultLayer } of SOURCES) {
  const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });

  root.walkRules(rule => {
    const line = rule.source?.start?.line;
    const { layer: atLayer, skip, media } = getContext(rule);

    if (skip) {
      return;
    }

    if (media) {
      inAtRules++;

      return;
    }

    if (rule.selector.includes('&')) {
      warnings.push(`${file}:${line} nested selector skipped: ${rule.selector}`);

      return;
    }

    const decls: Decl[] = [];

    rule.each(n => {
      if (n.type === 'decl') {
        decls.push({ prop: n.prop, value: n.value });
      }
    });

    if (!decls.length) {
      return;
    }

    let items;

    try {
      items = parseList(rule.selector);
    } catch {
      warnings.push(`${file}:${line} unparsable: ${rule.selector}`);

      return;
    }

    for (const it of items) {
      if (!it.simple) {
        skipped.push({
          file,
          line,
          selector: it.raw,
          why: it.classes.length ? 'compound/combinator' : 'no class (attribute/tag/etc.)',
        });
        continue;
      }
      const [layer, layerSource] = resolveLayer(it.simple, atLayer, defaultLayer);
      const key = `${layer}:${it.simple}`;
      const prev = candidates.get(key);

      if (prev) {
        if (JSON.stringify(prev.decls) !== JSON.stringify(decls)) {
          warnings.push(
            `${file}:${line} .${it.simple} redefined with different declarations (first: ${prev.file}:${prev.line}); keeping first`,
          );
        }
        continue;
      }
      candidates.set(key, { name: it.simple, layer, layerSource, decls, file, line });
    }
  });
}

// same class name in more than one layer?
const byName = new Map<string, string[]>();

for (const c of candidates.values()) {
  byName.set(c.name, [...(byName.get(c.name) ?? []), c.layer]);
}

for (const [name, layers] of byName) {
  if (layers.length > 1) {
    warnings.push(`.${name} appears in multiple layers: ${layers.join(', ')}`);
  }
}

// ---------- build rules ----------
const flagSet = new Set(FLAGS);
const usedFlags = new Set<string>();
const rules: any[] = [];

for (const c of candidates.values()) {
  const { properties, values, placeholders } = templatize(
    c.decls,
    c.layer === 'components' ? () => true : isLiteral,
  );

  // `[bottom]` reads --bottom, so strip the brackets before comparing
  const varName = c.name.replace(/^\[(.+)\]$/, '$1');

  const arbitrary =
    c.layer === 'styles' &&
    !NOT_ARBITRARY.has(`${c.layer}:${c.name}`) &&
    c.decls.length === 1 &&
    c.decls[0].value.trim() === `var(--${varName})`;

  const rule: any = {
    ...(c.layer !== 'unlayered' && { layer: c.layer }),
    selector: c.name,
    properties,
    ...(arbitrary ? { arbitrary: true } : { values }),
  };

  if (!arbitrary && Object.keys(placeholders).length) {
    rule.placeholders = placeholders;
  }

  if (c.layer === 'styles' && flagSet.has(c.name)) {
    rule.dark = true;
    usedFlags.add(c.name);
  }

  rules.push(rule);
}
rules.push(...EXTRA_RULES);

// ---------- family compaction ----------
const MIN_FAMILY = 2;

type FamilyEntry = string | string[];

interface FamilyData {
  layer?: string;
  prefix: string;
  properties: string[];
  entries: FamilyEntry[];
}

// Only "plain" rules can be folded: static values per property, no special flags/placeholders.
const isPlain = (r: any) =>
  Array.isArray(r.properties) &&
  Array.isArray(r.values) &&
  r.values.length === r.properties.length &&
  !r.placeholders &&
  !r.dark &&
  !r.arbitrary &&
  !r.impliedPseudo &&
  !r.fallback;

function commonPrefix(names: string[]) {
  let p = names[0];

  for (const n of names) {
    while (!n.startsWith(p)) {
      p = p.slice(0, -1);
    }
  }

  // Allow exact token boundary (e.g. ['shadow', 'shadow-xs', 'shadow-sm'] → 'shadow')
  if (p && names.every(n => n === p || n.startsWith(`${p}-`))) {
    return p;
  }

  const cut = p.lastIndexOf('-');

  return cut >= 0 ? p.slice(0, cut + 1) : '';
}

function toEntry(r: any, prefix: string): FamilyEntry {
  const suffix = r.selector.slice(prefix.length);
  const values: string[] = r.values;
  const allSameValue = values.every(v => v === values[0]);

  if (allSameValue && values[0] === suffix) {
    return suffix;
  }

  if (allSameValue && values.length > 1) {
    return [suffix, values[0]];
  }

  return [suffix, ...values];
}

const emitEntry = (e: FamilyEntry) => (typeof e === 'string' ? q(e) : arr(e));

function buildFamily(members: any[]): FamilyData {
  const candPrefix = commonPrefix(members.map(r => r.selector));

  if (!candPrefix) {
    return {
      layer: members[0].layer,
      prefix: '',
      properties: members[0].properties,
      entries: members.map(r => toEntry(r, '')),
    };
  }

  const withPrefix = members.map(r => toEntry(r, candPrefix));
  const withoutPrefix = members.map(r => toEntry(r, ''));

  const lenWith = candPrefix.length + withPrefix.reduce((acc, e) => acc + emitEntry(e).length, 0);
  const lenWithout = withoutPrefix.reduce((acc, e) => acc + emitEntry(e).length, 0);

  const usePrefix = lenWith <= lenWithout;

  return {
    layer: members[0].layer,
    prefix: usePrefix ? candPrefix : '',
    properties: members[0].properties,
    entries: usePrefix ? withPrefix : withoutPrefix,
  };
}

// 1. Group plain rules by [layer, properties]
const propBuckets = new Map<string, any[]>();
const literal: any[] = [];

for (const r of rules) {
  if (!isPlain(r)) {
    literal.push(r);
    continue;
  }

  const key = JSON.stringify([r.layer ?? null, r.properties]);

  if (!propBuckets.has(key)) {
    propBuckets.set(key, []);
  }
  propBuckets.get(key)!.push(r);
}

// 2. Within each [layer, properties] bucket, form optimal families
const families: FamilyData[] = [];

for (const bucket of propBuckets.values()) {
  if (bucket.length < MIN_FAMILY) {
    literal.push(...bucket);
    continue;
  }

  // Sub-group by first hyphen segment to see if distinct prefixes exist in the same property bucket
  const byHead = new Map<string, any[]>();

  for (const r of bucket) {
    const head = r.selector.split('-')[0];

    if (!byHead.has(head)) {
      byHead.set(head, []);
    }
    byHead.get(head)!.push(r);
  }

  if (byHead.size === 1) {
    families.push(buildFamily(bucket));
    continue;
  }

  const unprefixedPool: any[] = [];

  for (const sub of byHead.values()) {
    if (sub.length >= MIN_FAMILY) {
      const fam = buildFamily(sub);

      if (fam.prefix) {
        families.push(fam);
        continue;
      }
    }
    unprefixedPool.push(...sub);
  }

  if (unprefixedPool.length >= MIN_FAMILY) {
    families.push(buildFamily(unprefixedPool));
  } else {
    literal.push(...unprefixedPool);
  }
}

// ---------- emit ----------
const emitFamily = (f: FamilyData) =>
  `  [${f.layer ? q(f.layer) : 'null'}, ${q(f.prefix)}, ${arr(f.properties)}, [\n` +
  f.entries.map(e => `    ${emitEntry(e)},`).join('\n') +
  `\n  ]],`;

function emitRule(r: any) {
  const lines: string[] = [];

  if (r.layer !== undefined) {
    lines.push(`layer: ${q(r.layer)},`);
  }
  lines.push(`selector: ${q(r.selector)},`);
  lines.push(`properties: ${Array.isArray(r.properties) ? arr(r.properties) : q(r.properties)},`);

  if (r.values) {
    lines.push(`values: ${arr(r.values)},`);
  }

  if (r.placeholders) {
    lines.push(
      `placeholders: { ${Object.entries(r.placeholders)
        .map(([k, v]) => `${q(k)}: ${q(v as string)}`)
        .join(', ')} },`,
    );
  }

  if (r.dark !== undefined) {
    lines.push(`dark: ${r.dark},`);
  }

  if (r.arbitrary !== undefined) {
    lines.push(`arbitrary: ${r.arbitrary},`);
  }

  if (r.impliedPseudo !== undefined) {
    lines.push(`impliedPseudo: ${q(r.impliedPseudo)},`);
  }

  if (r.fallback !== undefined) {
    lines.push(`fallback: ${q(r.fallback)},`);
  }

  return `  {\n${lines.map(l => `    ${l}`).join('\n')}\n  },`;
}

const source = `interface BaseRule {
  selector: string;
  properties: string | string[];
  dark?: boolean;
  placeholders?: Record<string, string>;
  layer?: string;
  impliedPseudo?: string;
  fallback?: string;
}

export type Rule = BaseRule &
  (
    | {
        arbitrary: true;
        values?: string[];
      }
    | {
        arbitrary?: false;
        values: string[];
      }
  );

type FamilyEntry = string | string[];
type Family = [layer: string | null, prefix: string, properties: string[], entries: FamilyEntry[]];

const FAMILIES: Family[] = [
${families.map(emitFamily).join('\n')}
];

const LITERAL_RULES: any[] = [
${literal.map(emitRule).join('\n')}
];

function expand(families: Family[]): Rule[] {
  return families.flatMap(([layer, prefix, properties, entries]) =>
    entries.map((e): Rule => {
      const [suffix, ...rest] = Array.isArray(e) ? e : [e, e];
      return {
        ...(layer ? { layer } : {}),
        selector: prefix + suffix,
        properties: [...properties],
        values: rest.length === 1 && properties.length > 1 ? properties.map(() => rest[0]) : rest,
      };
    }),
  );
}

export const RULES: Rule[] = [... (LITERAL_RULES as Rule[]), ...expand(FAMILIES)];

// 1. Derive \`cc\` from utilities and append hardcoded exceptions
export const CC: Set<string> = new Set([
  ...RULES.filter(rule => rule.layer === 'utilities').map(rule => rule.selector),
${list(CC_EXTRA)}
]);

// 2. Derive \`vd\` from styles and append hardcoded exceptions
export const VD: Set<string> = new Set([
  ...RULES
    .filter(rule => rule.layer === 'styles')
    .flatMap(rule => (rule.dark ? [rule.selector, \`dark:\${rule.selector}\`] : [rule.selector])),
${list(VD_EXTRA)}
]);

// 3. Derive \`scaled\` from rules where the first value matches the spacing calculation pattern
export const SCALED: Set<string> = new Set(
  RULES
    .filter(
      rule => Array.isArray(rule.values) && rule.values[0] === 'calc(var(--spacing) * var({var}))',
    )
    .map(rule => rule.selector),
);
`;

mkdirSync(dirname(args.out!), { recursive: true });
writeFileSync(args.out!, source);

const skippedFile = 'tools/rules/out/skipped.json';

mkdirSync(dirname(skippedFile), { recursive: true });
writeFileSync(skippedFile, JSON.stringify(skipped, null, 2));

// ---------- summary ----------
const counts: Record<string, number> = {};

for (const r of rules) {
  counts[r.layer ?? 'unlayered'] = (counts[r.layer ?? 'unlayered'] ?? 0) + 1;
}
const foldedCount = families.reduce((acc, f) => acc + f.entries.length, 0);
console.log(
  `Wrote ${rules.length} rules (${foldedCount} in ${families.length} families, ${literal.length} literal) → ${args.out}`,
);

for (const [l, n] of Object.entries(counts)) {
  console.log(`  ${l}: ${n}`);
}
console.log(`Skipped inside @media/@supports/@container: ${inAtRules} rules`);
console.log(`Skipped non-bare selectors: ${skipped.length} (see ${skippedFile})`);

const stale = FLAGS.filter(f => !usedFlags.has(f));

if (stale.length) {
  console.warn(`Flags matching nothing: ${stale.join(', ')}`);
}

if (warnings.length) {
  console.warn(`\n${warnings.length} warnings:\n${warnings.join('\n')}`);
}
