import { createCssVarName, escapeCssIdentifier, type ParsedClass } from './parsers';
import { BREAKPOINTS } from './registry/common';
import { type Rule } from './registry/rules';
import { type CssRule } from './types';

export function buildCssRule(parsedClass: ParsedClass, rules: Rule[]): CssRule | null {
  const { baseClass, fullClass, state, prefix, isDark } = parsedClass;

  const config = rules.find(r => r.selector === baseClass) || null;

  if (!config) {
    return null;
  }

  if (config.impliedPseudo && !state) {
    return null;
  }

  const escapedClass = escapeCssIdentifier(fullClass);
  const pseudoElement = state.match(/::[a-z-]+$/i)?.[0] || '';
  const pseudoClass = pseudoElement ? state.slice(0, -pseudoElement.length) : state;

  let selectorCore = '';

  if (pseudoClass === ':group-hover') {
    selectorCore = `.group:hover .${escapedClass}${pseudoElement}`;
  } else {
    selectorCore = `.${escapedClass}${state}`;
  }

  if (config.impliedPseudo && !selectorCore.endsWith(config.impliedPseudo)) {
    selectorCore += config.impliedPseudo;
  }

  const selector = isDark ? `.dark ${selectorCore}` : selectorCore;
  const declarations: Record<string, string> = {};
  const props = Array.isArray(config.properties) ? config.properties : [config.properties];

  props.forEach((prop, i) => {
    if (config.arbitrary) {
      const varName = createCssVarName({ isDark, prefix, name: baseClass, state });
      const fallback = config.fallback ? `, ${config.fallback}` : '';

      declarations[prop] = `var(${varName}${fallback})`;
    } else if (config.placeholders) {
      let value = config.values[i] || config.values[0];

      for (const [ph, name] of Object.entries(config.placeholders)) {
        const varName = createCssVarName({ isDark, prefix, name, state });

        value = value.replaceAll(ph, varName);
      }

      declarations[prop] = value;
    } else {
      declarations[prop] = config.values[i] || config.values[0];
    }
  });

  const declarationString = Object.entries(declarations)
    .map(([prop, val]) => `${prop}: ${val};`)
    .join(' ');

  return {
    css: `${selector} { ${declarationString} }`,
    layer: config.layer || 'styles',
    breakpoint: prefix ? BREAKPOINTS[prefix] : null,
  };
}
