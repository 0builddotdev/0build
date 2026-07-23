import { vd } from './registry';
import {
  breakpoints,
  states,
  parseClassName,
  parseAttributeTokens,
  createCssVarName,
} from './parsers';

export function runDebugPass(nodes: NodeListOf<Element>): void {
  console.warn('[zRuntime] Debug mode is active. ...');

  nodes.forEach(node => {
    runDebug(node as HTMLElement);
    checkPseudoElementContentPairing(node as HTMLElement);
  });
}

function runDebug(node: HTMLElement): void {
  const classAttr = node.getAttribute('class') || '';

  // Use quote-aware parser to avoid warnings on fragmented browser-spaced tokens
  const allClasses: string[] = [...parseAttributeTokens(classAttr)];

  if (Array.isArray(vd) && vd.length > 0) {
    const getBase = (cls: string) => {
      let base = cls.replace(/^dark:/, '');

      const bpRegex = new RegExp(`^(${Object.keys(breakpoints).join('|')}):`);

      base = base.replace(bpRegex, '');

      let stripped = true;

      while (stripped) {
        stripped = false;

        for (const state of states) {
          if (base.endsWith(state)) {
            base = base.slice(0, -state.length);
            stripped = true;
            break;
          }
        }
      }

      return base;
    };

    const targetBases = new Set(vd.map(getBase));
    const missingVars: string[] = [];

    allClasses.forEach(cls => {
      if (cls.includes('=')) {
        return;
      }

      const base = getBase(cls);

      if (targetBases.has(base)) {
        const parsed = parseClassName(cls);

        // If it has a colon but still failed to parse, it attempted modifier
        // syntax with invalid ordering (e.g. "bg::before:hover") — there's no
        // real variable name to report, so skip instead of guessing one.
        if (!parsed && cls.includes(':')) {
          return;
        }

        const varName = parsed
          ? createCssVarName({
              isDark: parsed.isDark,
              prefix: parsed.prefix,
              name: parsed.baseClass,
              state: parsed.state,
            })
          : `--${cls.replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9-]/g, '-')}`;

        if (node.style.getPropertyValue(varName) === '') {
          missingVars.push(`${cls} → ${varName}`);
        }
      }
    });

    if (missingVars.length > 0) {
      console.warn(
        `[zRuntime] Missing variables (${missingVars.length}): ${missingVars.join(', ')}`,
        node,
      );
    }
  }

  checkPseudoElementContentPairing(node);
}

function checkPseudoElementContentPairing(node: HTMLElement): void {
  const classAttr = node.getAttribute('class') || '';
  const allClasses: string[] = [...parseAttributeTokens(classAttr)];

  // Collect all content-before / content-after classes (with their full modifier prefix)
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

  // For every class that uses ::before or ::after, verify a matching content-* exists
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

    const pseudoType = pseudoMatch[1]; // "before" | "after"

    // Reconstruct the expected content class with identical modifiers
    const expectedContentClass =
      `${parsed.isDark ? 'dark:' : ''}` +
      `${parsed.prefix ? `${parsed.prefix}:` : ''}` +
      `content-${pseudoType}`;

    if (!contentClassSet.has(expectedContentClass)) {
      console.warn(
        `[zRuntime] Pseudo-element class "${cls}" is missing its paired ` +
          `"${expectedContentClass}". A ::${pseudoType} pseudo-element requires a ` +
          `corresponding content-${pseudoType} class (with matching responsive/dark ` +
          `modifiers) to render properly.`,
        node,
      );
    }
  }
}
