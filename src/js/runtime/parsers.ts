import { BREAKPOINTS, PSEUDO_CLASSES, PSEUDO_ELEMENTS, STATES } from './registry/common';

export interface ParsedClass {
  baseClass: string;
  state: string;
  fullClass: string;
  isDark: boolean;
  prefix: keyof typeof BREAKPOINTS | null;
}

export function parseClassName(className: string): ParsedClass | null {
  if (!className.includes(':')) {
    return null;
  }

  const match = className.match(
    new RegExp(
      `^(dark:)?(?:(${Object.keys(BREAKPOINTS).join('|')}):)?([^:=]+)` +
        `((?:${PSEUDO_CLASSES.join('|')})?)` +
        `(?:=(.*?))?` +
        `((?:${PSEUDO_ELEMENTS.join('|')})?)$`,
    ),
  );

  if (!match) {
    return null;
  }

  const [, dark, prefix, base, pseudoClass, value, pseudoElement] = match;

  const baseClass = value !== undefined && value !== '' ? `${base}=${value}` : base;

  // Reject cases where backtracking swallowed a pseudo suffix into baseClass
  // (e.g. "bg::before:hover" -> baseClass "bg::before")
  if (STATES.some(s => baseClass.endsWith(s))) {
    return null;
  }

  const state = `${pseudoClass || ''}${pseudoElement || ''}`;

  return {
    baseClass,
    state,
    fullClass: className,
    isDark: !!dark,
    prefix: (prefix as keyof typeof BREAKPOINTS) || null,
  };
}

/**
 * The canonical inverse of `parseClassName`: assembles the same
 * `[dark:][breakpoint:]base[:pseudoClass][=value][::pseudoElement]` shape
 * from its parts. Producers (like the Tailwind compat layer) should call
 * this instead of assembling the string themselves, so the two can't drift
 * apart — the parser above is the one place that grammar is defined.
 */
export function buildClassName({
  base,
  value,
  isDark = false,
  prefix = null,
  pseudoClass,
  pseudoElement,
}: {
  base: string;
  value?: string;
  isDark?: boolean;
  prefix?: keyof typeof BREAKPOINTS | null;
  pseudoClass?: string;
  pseudoElement?: string;
}): string {
  const darkPart = isDark ? 'dark:' : '';
  const prefixPart = prefix ? `${prefix}:` : '';
  const pseudoClassPart = pseudoClass ?? '';
  const valuePart = value !== undefined ? `=${value}` : '';
  const pseudoElementPart = pseudoElement ?? '';

  return `${darkPart}${prefixPart}${base}${pseudoClassPart}${valuePart}${pseudoElementPart}`;
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
