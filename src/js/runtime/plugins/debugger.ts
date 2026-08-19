import { type ZRuntimePlugin } from '../types';
import { parseClassName, parseAttributeTokens, createCssVarName } from '../parsers';
import { BREAKPOINTS, STATES } from '../registry/common';
import { vd } from '../registry/rules';

export const debuggerPlugin: ZRuntimePlugin = {
  name: 'debugger',
  onInit: () => {
    const isDebug = typeof window !== 'undefined' && (window as any).zRuntime?.debug === true;

    if (isDebug) {
      console.info('[zRuntime] 🐛 Debugger plugin loaded and waiting for styles...');
    }
  },
  onAfterInject: () => {
    const isDebug = typeof window !== 'undefined' && (window as any).zRuntime?.debug === true;

    if (!isDebug) {
      return;
    }

    console.groupCollapsed('[zRuntime Debugger] Scanning DOM for missing variables...');
    const nodes = document.querySelectorAll('[class]');
    let issuesFound = 0;

    nodes.forEach(node => {
      const hasIssue = runDebug(node as HTMLElement);

      if (hasIssue) {
        issuesFound++;
      }
    });

    if (issuesFound === 0) {
      console.log('✅ All interactive classes have their required variables.');
    } else {
      console.warn(`⚠️ Found missing variables on ${issuesFound} element(s).`);
    }
    console.groupEnd();
  },
};

function runDebug(node: HTMLElement): boolean {
  let hasIssues = false;
  const classAttr = node.getAttribute('class') || '';
  const allClasses: string[] = [...parseAttributeTokens(classAttr)];

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
      hasIssues = true;
    }
  }

  const hasPseudoIssues = checkPseudoElementContentPairing(node);

  return hasIssues || hasPseudoIssues;
}

function checkPseudoElementContentPairing(node: HTMLElement): boolean {
  let hasIssues = false;
  const classAttr = node.getAttribute('class') || '';
  const allClasses: string[] = [...parseAttributeTokens(classAttr)];
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
