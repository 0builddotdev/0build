import { formatState, type Breakpoint, type ParsedClass } from '../functions';
import { type ZRuntimeCore, type ZRuntimePlugin } from '../main';
import { BREAKPOINTS } from '../registry/common';
import { type Rule } from '../registry/rules';

const ARBITRARY_PROPERTY_REGEX =
  /^((?:[a-zA-Z0-9]+:)*)\[([a-zA-Z-]+)\]((?::{1,2}[a-zA-Z-]+)*)=\{(.+)\}$/;

function splitState(state: string): { pseudoClasses: string[]; pseudoElement: string | null } {
  const pseudoClasses: string[] = [];
  let pseudoElement: string | null = null;

  for (let i = 0; i < state.length; ) {
    const isElement = state[i + 1] === ':';
    const start = i + (isElement ? 2 : 1);
    let end = state.indexOf(':', start);

    if (end === -1) {
      end = state.length;
    }
    const ident = state.slice(start, end);

    if (ident) {
      if (isElement) {
        pseudoElement = ident;
      } else {
        pseudoClasses.push(ident);
      }
    }
    i = end;
  }

  return { pseudoClasses, pseudoElement };
}

export const arbitraryPropertiesPlugin: ZRuntimePlugin = {
  name: 'arbitrary-properties',

  onElementScan: (element: Element, _rules: Rule[], core: ZRuntimeCore): ParsedClass[] => {
    const parsedClasses: ParsedClass[] = [];
    const classAttr = element.getAttribute('class') || '';

    if (!classAttr.includes('={')) {
      return parsedClasses;
    }

    const tokens = classAttr.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      const match = token.match(ARBITRARY_PROPERTY_REGEX);

      if (!match) {
        continue;
      }

      const [, variantString, property, state, rawValue] = match;

      let isDark = false;
      let prefix: Breakpoint | null = null;
      let unknownVariant: string | null = null;

      if (variantString) {
        for (const variant of variantString.split(':').filter(Boolean)) {
          if (variant === 'dark') {
            isDark = true;
          } else if (variant in BREAKPOINTS) {
            prefix = variant as Breakpoint;
          } else {
            unknownVariant = variant;
            break;
          }
        }
      }

      if (unknownVariant !== null) {
        core.warn(
          'arbitrary-properties',
          `Unknown variant "${unknownVariant}:" in arbitrary property "${token}".`,
          element,
        );
        continue;
      }

      const baseClass = `[${property}]={${rawValue}}`;

      if (!core.hasRule(baseClass)) {
        core.registerRule({
          selector: baseClass,
          properties: property,
          arbitrary: false,
          values: [rawValue.replace(/_/g, ' ')],
          layer: 'utilities',
        });
      }

      const { pseudoClasses, pseudoElement } = splitState(state);

      parsedClasses.push({
        isDark,
        prefix,
        property: baseClass,
        pseudoClasses,
        pseudoElement,
        value: null,
        important: false,
        baseClass,
        state: formatState(pseudoClasses, pseudoElement),
        fullClass: token,
      });
    }

    return parsedClasses;
  },
};
