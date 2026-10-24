export const NEW_RULES = 'src/js/runtime/registry/rules.ts';

export const SOURCES: { file: string; defaultLayer?: string }[] = [
  { file: 'src/css/constants.css' },
  { file: 'src/css/core-components.css', defaultLayer: 'components' },
  // { file: 'src/css/core.css' },
  // { file: 'src/css/kit-components.css', defaultLayer: 'components' },
  // { file: 'src/css/kit-core.css' },
  { file: 'src/css/value-driven.css' },
];

// A var() is literal (kept as-is) if it matches here; any other var() becomes {var}, {var2}, ...
export const LITERAL_VARS = new Set(['--spacing']);
export const LITERAL_PREFIXES = ['--tw-', '--default-'];

// Hardcoded exceptions that were in the old rules.ts footer
export const CC_EXTRA = ['divide-x-reverse', 'divide-y-reverse'];
export const VD_EXTRA = [
  'divide-x',
  '[divide-x]',
  'divide-y',
  '[divide-y]',
  'space-x',
  '[space-x]',
  'space-y',
  '[space-y]',
];

// Style rules that support dark mode
export const FLAGS = [
  'bg',
  'bg/o',
  'color',
  'color/o',
  'border',
  'border-t',
  'border-r',
  'border-b',
  'border-l',
  'border-s',
  'border-e',
  'border-x',
  'border-y',
  'border/o',
  'border-t/o',
  'border-r/o',
  'border-b/o',
  'border-l/o',
  'border-s/o',
  'border-e/o',
  'border-x/o',
  'border-y/o',
  'outline',
  'outline/o',
  'decoration',
  'decoration/o',
  'accent',
  'accent/o',
  'caret',
  'caret/o',
  'fill',
  'fill/o',
  'stroke',
  'stroke/o',
  'shadow',
  '[shadow]',
  'shadow/o',
  'ring',
  'ring/o',
  'inset-ring',
  'inset-ring/o',
  'from',
  'from/o',
  'via',
  'via/o',
  'to',
  'to/o',
];

// Rules with no CSS counterpart at all (e.g. arbitrary ones), appended verbatim
export const EXTRA_RULES: any[] = [];

// Rules that look arbitrary in the CSS but aren't flagged in the old registry
export const NOT_ARBITRARY = new Set<string>(['styles:ring-w', 'styles:inset-ring-w']);
