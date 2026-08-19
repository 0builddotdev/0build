import { type ZRuntimePlugin } from '../types';
import {
  parseAttributeTokens,
  parseClassName,
  createCssVarName,
  type ParsedClass,
} from '../parsers';
import { COLORS, INTENSITIES } from '../registry/common';

/**
 * Converts underscore notation into real spaces for CSS values.
 * Example: "calc(10px_+_20px)" -> "calc(10px + 20px)"
 */
function decodeUnderscoreSpaces(value: string): string {
  return value.replace(/_/g, ' ');
}

/**
 * Shorthand for design-token colors: `pink-500` -> `var(--color-pink-500)`.
 * Matches purely on the shape of the value (a known color name, a hyphen,
 * a known intensity), regardless of which key it was assigned to — so
 * `color=pink-500`, `bg=pink-500`, etc. all resolve the same way. Anything
 * that isn't an exact "<color>-<intensity>" pair (e.g. "#fff", "4px",
 * "rgba(0,0,0,.5)") is returned unchanged and continues to work as a
 * literal value, same as before.
 */
function resolveColorShorthand(value: string): string {
  const parts = value.split('-');

  if (parts.length !== 2) {
    return value;
  }

  const [colorName, intensity] = parts;

  if (COLORS.includes(colorName) && INTENSITIES.includes(Number(intensity))) {
    return `var(--color-${colorName}-${intensity})`;
  }

  return value;
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

        // 3. Format the final CSS value. content-before/content-after are just
        // a mandatory static class for the color::before/color::after utilities
        // (::before/::after need *a* `content` value to render at all) — they're
        // not an inline-vars target, so no special-casing needed here.
        const finalValue = resolveColorShorthand(value);

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
          target.style.setProperty(`--${varKey}`, resolveColorShorthand(value));
        }

        target.classList.add(key);
      }
    }

    return synthesized;
  },
};
