import { type ZRuntimePlugin } from '../types';
import { parseClassName, createCssVarName } from '../parsers';
import { BREAKPOINTS, STATES } from '../registry/common';
import { rules, scaled, vd } from '../registry/rules';

const INTEGER_PATTERN = /^-?\d+$/;

function runDebug(node: HTMLElement): boolean {
  let hasIssues = false;
  const classAttr = node.getAttribute('class') || '';
  const allClasses: string[] = [...classAttr.split(/\s+/).filter(Boolean)];

  const vdArray = Array.from(vd); // Set -> array, works whether vd is a Set or already an array

  if (vdArray.length > 0) {
    const getBase = (cls: string) => {
      let base = cls.replace(/^dark:/, '');
      const bpRegex = new RegExp(`^(${Object.keys(BREAKPOINTS).join('|')}):`);

      base = base.replace(bpRegex, '');

      let stripped = true;

      while (stripped) {
        stripped = false;

        for (const state of STATES) {
          if (base.endsWith(state)) {
            base = base.slice(0, -state.length);
            stripped = true;
            break;
          }
        }
      }

      return base;
    };

    const targetBases = new Set(vdArray.map(getBase));
    const missingVars: string[] = [];

    allClasses.forEach(cls => {
      if (cls.includes('=')) {
        return;
      }

      const base = getBase(cls);

      if (targetBases.has(base)) {
        const parsed = parseClassName(cls);

        if (!parsed && cls.includes(':')) {
          return;
        }

        let mainVarName: string;
        let opacityVarName: string | null = null;

        if (parsed) {
          let baseName = parsed.baseClass;
          const hasOpacityModifier = baseName.endsWith('/o');

          if (hasOpacityModifier) {
            baseName = baseName.slice(0, -2);
          }

          mainVarName = createCssVarName({
            isDark: parsed.isDark,
            prefix: parsed.prefix,
            name: baseName,
            state: parsed.state,
          });

          if (hasOpacityModifier) {
            opacityVarName = createCssVarName({
              isDark: parsed.isDark,
              prefix: parsed.prefix,
              name: `${baseName}-o`,
              state: parsed.state,
            });
          }
        } else {
          const isOpacity = cls.includes('/o');
          const baseCls = isOpacity ? cls.replace(/\/o/g, '') : cls;
          const cleaned = baseCls.replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9-]/g, '-');

          mainVarName = `--${cleaned}`;

          if (isOpacity) {
            opacityVarName = `--${cleaned}-o`;
          }
        }

        if (node.style.getPropertyValue(mainVarName) === '') {
          missingVars.push(`${cls} → ${mainVarName}`);
        }

        if (opacityVarName && node.style.getPropertyValue(opacityVarName) === '') {
          missingVars.push(`${cls} → ${opacityVarName}`);
        }
      }
    });

    if (missingVars.length > 0) {
      console.warn(
        `[zRuntime] Missing variables (${missingVars.length}): ${missingVars.join(', ')}`,
        node,
      );
      hasIssues = true;
    }
  }

  const hasPseudoIssues = checkPseudoElementContentPairing(node);
  const hasScaledMismatch = checkScaledValueMismatch(node);

  return hasIssues || hasPseudoIssues || hasScaledMismatch;
}

function checkPseudoElementContentPairing(node: HTMLElement): boolean {
  let hasIssues = false;
  const classAttr = node.getAttribute('class') || '';
  const allClasses: string[] = [...classAttr.split(/\s+/).filter(Boolean)];
  const contentClassSet = new Set<string>();

  for (const cls of allClasses) {
    if (cls.includes('=')) {
      continue;
    }
    const contentMatch = cls.match(/^(dark:)?(?:(sm|md|lg|xl|2xl):)?content-(before|after)$/);

    if (contentMatch) {
      contentClassSet.add(cls);
    }
  }

  for (const cls of allClasses) {
    if (cls.includes('=')) {
      continue;
    }
    const parsed = parseClassName(cls);

    if (!parsed) {
      continue;
    }

    const pseudoMatch = parsed.state.match(/::(before|after)$/);

    if (!pseudoMatch) {
      continue;
    }

    const pseudoType = pseudoMatch[1];
    const expectedContentClass =
      `${parsed.isDark ? 'dark:' : ''}` +
      `${parsed.prefix ? `${parsed.prefix}:` : ''}` +
      `content-${pseudoType}`;

    if (!contentClassSet.has(expectedContentClass)) {
      console.warn(
        `[zRuntime] Pseudo-element class "${cls}" is missing its paired ` +
          `"${expectedContentClass}".`,
        node,
      );
      hasIssues = true;
    }
  }

  return hasIssues;
}

/**
 * Catches the dead-end case that `inline-vars`'s scaled-key redirect can't
 * recover from: a `scaled` key (e.g. `m`, `p`, `gap`) given a non-integer
 * value with no registered arbitrary counterpart (`[m]`) to redirect to.
 *
 * When that happens, `inline-vars` falls back to setting the raw value on
 * the scaled key's own CSS var — which then feeds into
 * `calc(var(--spacing) * <raw value>)` and produces broken CSS silently.
 * This surfaces it instead of letting it fail quietly.
 *
 * NOTE: mirrors inline-vars's own (raw, un-parsed) key matching, so it only
 * catches bare scaled keys like `m=4px` — not variant-prefixed ones like
 * `dark:m=4px`, since `scaled` only stores base selectors. Flagging this as
 * a known gap rather than silently "fixing" the scope of the check.
 */
function checkScaledValueMismatch(node: HTMLElement): boolean {
  let hasIssues = false;
  const classAttr = node.getAttribute('class') || '';
  const allClasses: string[] = classAttr.split(/\s+/).filter(Boolean);

  for (const token of allClasses) {
    const eqIdx = token.indexOf('=');

    if (eqIdx <= 0 || token.includes('{') || token.includes('}')) {
      continue;
    }

    const key = token.slice(0, eqIdx);
    const rawValue = token.slice(eqIdx + 1);

    if (!key || !rawValue || !scaled.has(key)) {
      continue;
    }

    const value = rawValue.replace(/_/g, ' ');

    if (INTEGER_PATTERN.test(value)) {
      continue;
    }

    const arbitraryKey = `[${key}]`;
    const hasArbitraryFallback = rules.some(rule => rule.selector === arbitraryKey);

    if (!hasArbitraryFallback) {
      console.warn(
        `[zRuntime] "${token}" uses a raw value ("${rawValue}") on scaled property "${key}", ` +
          `but no "${arbitraryKey}" rule is registered to fall back to. This value will be ` +
          `multiplied by --spacing and likely produce broken CSS. Register "${arbitraryKey}" ` +
          `as an arbitrary rule, or pass an integer multiplier instead.`,
        node,
      );
      hasIssues = true;
    }
  }

  return hasIssues;
}

export const debuggerPlugin: ZRuntimePlugin = {
  name: 'debugger',

  onInit: () => {
    const isDebug = typeof window !== 'undefined' && (window as any).zRuntime?.debug === true;

    if (isDebug) {
      console.info('[zRuntime] Debugger loaded and waiting for styles.');
    }
  },

  onAfterInject: () => {
    const isDebug = typeof window !== 'undefined' && (window as any).zRuntime?.debug === true;

    if (!isDebug) {
      return;
    }

    console.groupCollapsed('[zRuntime] Scanning DOM for missing variables.');

    const nodes = document.querySelectorAll('[class]');
    let issuesFound = 0;

    nodes.forEach(node => {
      const hasIssue = runDebug(node as HTMLElement);

      if (hasIssue) {
        issuesFound++;
      }
    });

    if (issuesFound === 0) {
      console.log('[zRuntime] All interactive classes have their required variables.');
    } else {
      console.warn(`[zRuntime] Found missing variables on ${issuesFound} element(s).`);
    }

    console.groupEnd();
  },
};
