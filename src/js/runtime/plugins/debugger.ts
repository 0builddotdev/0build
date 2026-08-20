import { type ZRuntimePlugin } from '../types';
import { parseClassName, createCssVarName } from '../parsers';
import { BREAKPOINTS, STATES } from '../registry/common';
import { vd } from '../registry/rules';

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
          // Extract base name and check for opacity modifier
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

          // If opacity modifier is present, prepare the expected opacity variable name
          if (hasOpacityModifier) {
            opacityVarName = createCssVarName({
              isDark: parsed.isDark,
              prefix: parsed.prefix,
              name: `${baseName}-o`,
              state: parsed.state,
            });
          }
        } else {
          // Fallback for unparsed classes
          const isOpacity = cls.includes('/o');
          const baseCls = isOpacity ? cls.replace(/\/o/g, '') : cls;
          const cleaned = baseCls.replace(/\[|\]/g, '').replace(/[^a-zA-Z0-9-]/g, '-');

          mainVarName = `--${cleaned}`;

          if (isOpacity) {
            opacityVarName = `--${cleaned}-o`;
          }
        }

        // Check if main variable exists
        if (node.style.getPropertyValue(mainVarName) === '') {
          missingVars.push(`${cls} → ${mainVarName}`);
        }

        // Check if opacity variable exists (when expected)
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

  return hasIssues || hasPseudoIssues;
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
