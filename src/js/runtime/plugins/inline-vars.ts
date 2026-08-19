import { type ZRuntimePlugin } from '../types';
import {
  parseAttributeTokens,
  parseClassName,
  createCssVarName,
  type ParsedClass,
} from '../parsers';

/**
 * Converts underscore notation into real spaces for CSS values.
 * Example: "calc(10px_+_20px)" -> "calc(10px + 20px)"
 */
function decodeUnderscoreSpaces(value: string): string {
  return value.replace(/_/g, ' ');
}

/**
 * Escapes single quotes for CSS `content: '...'` rules.
 */
function escapeCssString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export const inlineVarsPlugin: ZRuntimePlugin = {
  name: 'inline-vars',

  onElementScan: (element: Element) => {
    const synthesized: ParsedClass[] = [];
    const classAttr = element.getAttribute('class') || '';
    const sources = parseAttributeTokens(classAttr);
    const target = element as HTMLElement;

    if (!target.style) {
      return synthesized;
    }

    for (const token of sources) {
      const eqIdx = token.indexOf('=');

      // Skip tokens that aren't key=value pairs
      if (eqIdx <= 0) {
        continue;
      }

      const key = token.slice(0, eqIdx);
      const rawValue = token.slice(eqIdx + 1);

      if (!key || !rawValue) {
        continue;
      }

      // 1. Decode underscores back to spaces for the CSS variable
      const value = decodeUnderscoreSpaces(rawValue);

      // 2. Parse the key to see if it's a registered zRuntime rule
      const parsed = parseClassName(key);

      if (parsed) {
        const varName = createCssVarName({
          isDark: parsed.isDark,
          prefix: parsed.prefix,
          name: parsed.baseClass,
          state: parsed.state,
        });

        const isContentRule =
          parsed.baseClass === 'content-before' || parsed.baseClass === 'content-after';

        // 3. Format the final CSS value
        const finalValue = isContentRule ? `'${escapeCssString(value)}'` : value;

        // 4. Apply to DOM
        target.style.setProperty(varName, finalValue);

        // Because we enforce underscores, rawValue has no spaces.
        // Therefore, parsed.fullClass is perfectly safe for classList.add()
        target.classList.add(parsed.fullClass);
        synthesized.push(parsed);
      } else {
        // Fallback: Arbitrary CSS variables not registered in zRuntime
        // e.g., <div class="--my-custom-var=10px">
        const varKey = key.replace(/:/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

        if (varKey) {
          target.style.setProperty(`--${varKey}`, value);
        }

        target.classList.add(key);
      }
    }

    return synthesized;
  },
};
