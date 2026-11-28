const LENGTH_PATTERN = /^(-?\d+(?:\.\d+)?)(px|rem|em|vh|dvh|svh|lvh|vw|vmin|vmax|%)?$/i;
const ARITHMETIC_OFFSET_PATTERN =
  /^(.*?)\s*([+-])\s*(\d+(?:\.\d+)?(?:px|rem|em|vh|dvh|svh|lvh|vw|vmin|vmax|%)?)$/i;

const MEDIA_SHORTHANDS: Record<string, string> = {
  sm: '(min-width: 40rem)',
  md: '(min-width: 48rem)',
  lg: '(min-width: 64rem)',
  xl: '(min-width: 80rem)',
  '2xl': '(min-width: 96rem)',
};

export function toPx(
  raw: string,
  referenceHeight: number = 0,
  contextEl?: Element | null,
): number | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const match = LENGTH_PATTERN.exec(trimmed);

  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  const unit = (match[2] ?? 'px').toLowerCase();

  if (!Number.isFinite(value)) {
    return null;
  }

  switch (unit) {
    case 'px':
      return value;
    case 'rem': {
      const rootSize =
        typeof window !== 'undefined'
          ? Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
          : 16;

      return value * rootSize;
    }
    case 'em': {
      const target = contextEl ?? document.documentElement;
      const elSize =
        typeof window !== 'undefined'
          ? Number.parseFloat(window.getComputedStyle(target).fontSize) || 16
          : 16;

      return value * elSize;
    }
    case 'vh':
    case 'dvh':
    case 'svh':
    case 'lvh':
      return (value * window.innerHeight) / 100;
    case 'vw':
      return (value * window.innerWidth) / 100;
    case 'vmin':
      return (value * Math.min(window.innerWidth, window.innerHeight)) / 100;
    case 'vmax':
      return (value * Math.max(window.innerWidth, window.innerHeight)) / 100;
    case '%':
      return (value * referenceHeight) / 100;
    default:
      return value;
  }
}

export function queryOffsetElement(rawSelector: string, hostEl: Element): HTMLElement | null {
  const trimmed = rawSelector.trim();

  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith('!')) {
      return hostEl.closest<HTMLElement>(trimmed.slice(1).trim() || '*');
    }

    return document.querySelector<HTMLElement>(trimmed);
  } catch {
    return null;
  }
}

function getVisibleElementHeight(el: HTMLElement): number {
  return el.isConnected && el.getClientRects().length > 0 ? el.getBoundingClientRect().height : 0;
}

export function resolveOffsetPx(
  raw: string,
  hostEl: Element,
  referenceHeight: number,
  observedTargets?: Set<Element>,
): number {
  const trimmed = raw.trim();

  if (!trimmed || trimmed === '0') {
    return 0;
  }

  const directPx = toPx(trimmed, referenceHeight, hostEl);

  if (directPx !== null) {
    return directPx;
  }

  const arithmeticMatch = ARITHMETIC_OFFSET_PATTERN.exec(trimmed);

  if (arithmeticMatch) {
    const targetEl = queryOffsetElement(arithmeticMatch[1], hostEl);
    const deltaPx = toPx(arithmeticMatch[3], referenceHeight, hostEl);

    if (targetEl && deltaPx !== null) {
      observedTargets?.add(targetEl);
      const baseHeight = getVisibleElementHeight(targetEl);

      return arithmeticMatch[2] === '-' ? baseHeight - deltaPx : baseHeight + deltaPx;
    }
  }

  const targetEl = queryOffsetElement(trimmed, hostEl);

  if (!targetEl) {
    return 0;
  }

  observedTargets?.add(targetEl);

  return getVisibleElementHeight(targetEl);
}

export function readCssPxVar(el: Element, varName: string, fallback: number): number {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.getComputedStyle(el).getPropertyValue(varName).trim();

  return raw ? (toPx(raw, 0, el) ?? fallback) : fallback;
}

export function parseMediaQuery(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed in MEDIA_SHORTHANDS) {
    return MEDIA_SHORTHANDS[trimmed];
  }

  if (/^\d+$/.test(trimmed)) {
    return `(min-width: ${trimmed}px)`;
  }

  return trimmed;
}

export function observeMediaQuery(
  raw: string,
  onChange: (matches: boolean, isInitial: boolean) => void,
): (() => void) | null {
  const query = parseMediaQuery(raw);

  if (!query || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  const mql = window.matchMedia(query);
  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches, false);

  onChange(mql.matches, true);
  mql.addEventListener('change', handleChange);

  return () => mql.removeEventListener('change', handleChange);
}
