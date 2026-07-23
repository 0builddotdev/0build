export interface ParsedClass {
  baseClass: string;
  state: string;
  fullClass: string;
  isDark: boolean;
  prefix: string | null;
}

type Breakpoints = Record<string, string>;

export const breakpoints: Breakpoints = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '96rem',
};

const pseudoClasses: string[] = [
  ':hover',
  ':active',
  ':focus',
  ':focus-visible',
  ':focus-within',
  ':target',
  ':checked',
  ':disabled',
  ':group-hover',
];

const pseudoElements: string[] = ['::before', '::after'];

export const states: string[] = [...pseudoClasses, ...pseudoElements];

const classParser = new RegExp(
  `^(dark:)?(?:(${Object.keys(breakpoints).join('|')}):)?(.+?)` +
    `((?:${pseudoClasses.join('|')})?)((?:${pseudoElements.join('|')})?)$`,
);

export function parseClassName(className: string): ParsedClass | null {
  if (!className.includes(':')) {
    return null;
  }

  const match = className.match(classParser);

  if (!match) {
    return null;
  }

  const [, dark, prefix, baseClass, pseudoClass, pseudoElement] = match;

  // Reject cases where backtracking swallowed a pseudo suffix into baseClass
  // (e.g. "bg::before:hover" -> baseClass "bg::before")
  if (states.some(s => baseClass.endsWith(s))) {
    return null;
  }

  const state = `${pseudoClass || ''}${pseudoElement || ''}`;

  return {
    baseClass,
    state,
    fullClass: className,
    isDark: !!dark,
    prefix: prefix || null,
  };
}

// NEW: Splits attribute tokens by spaces but respects quotes (single or double)
export function parseAttributeTokens(attrValue: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (let i = 0; i < attrValue.length; i++) {
    const char = attrValue[i];

    if (inQuote) {
      current += char;

      if (char === inQuote) {
        inQuote = null;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
      current += char;
    } else if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export function createCssVarName({
  isDark,
  prefix,
  name,
  state,
}: {
  isDark: boolean;
  prefix: string | null;
  name: string;
  state: string;
}): string {
  const parts = [
    isDark ? 'dark' : '',
    prefix,
    name.replace(/[^a-zA-Z0-9-]/g, ''),
    normalizeStateForVarName(state),
  ];

  return `--${parts.filter(Boolean).join('-')}`;
}

function normalizeStateForVarName(state: string): string {
  return state.split(/::?/).filter(Boolean).join('-');
}

export function escapeCssIdentifier(str: string): string {
  return str.replace(/([ !"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
}
