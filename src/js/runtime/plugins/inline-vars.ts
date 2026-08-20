import { type ZRuntimePlugin } from '../types';
import { parseClassName, createCssVarName, type ParsedClass } from '../parsers';
import { COLORS, INTENSITIES } from '../registry/common';
import { rules } from '../registry/rules';

/**
 * Shorthand for design-token colors: `pink-500` -> `var(--color-pink-500)`.
 *
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

/**
 * inlineVarsPlugin
 *
 * Scans element classes for `key=value` tokens (e.g., `[m]=4px`, `bg=pink-500`)
 * and converts them into inline CSS variables.
 *
 * ARCHITECTURE NOTE (The Two-Branch Strategy):
 * This plugin uses a two-branch approach to handle different complexities of tokens:
 * 1. BRANCH 1 (`parseClassName`): An advanced checker that looks for complex structures
 *    first (like semicolons, complex variant prefixes, or states). If it matches, it
 *    uses the structured output to generate the CSS variable name.
 * 2. BRANCH 2 (Fallback): If the advanced checker misses it, we fall back to a direct
 *    lookup against the base `rules` registry. This catches simple, direct selectors
 *    that don't require advanced parsing, ensuring we still generate the correct
 *    inline variables for standard utility keys.
 */
export const inlineVarsPlugin: ZRuntimePlugin = {
  name: 'inline-vars',

  onElementScan: (element: Element) => {
    const synthesized: ParsedClass[] = [];
    const classAttr = element.getAttribute('class') || '';
    const sources = classAttr.split(/\s+/).filter(Boolean);
    const target = element as HTMLElement;

    if (!target.style) {
      return synthesized;
    }

    for (const token of sources) {
      const eqIdx = token.indexOf('=');

      // 1. Must contain '=' and must NOT be the braced version (e.g. [margin]={4px})
      // If it has braces, we skip it here so the other plugin can handle it.
      if (eqIdx <= 0 || token.includes('{') || token.includes('}')) {
        continue;
      }

      const key = token.slice(0, eqIdx);
      const rawValue = token.slice(eqIdx + 1);

      if (!key || !rawValue) {
        continue;
      }

      // Replace underscores with spaces to allow spaces in CSS values
      // (since HTML class attributes can't contain raw spaces in a single token)
      const value = rawValue.replace(/_/g, ' ');

      // ==========================================
      // BRANCH 1: Advanced Parsing
      // ==========================================
      // `parseClassName()` is an advanced checker that checks for complex
      // structures (like semicolons) first. If it successfully parses the key,
      // we use its structured output to build the variable name.
      const parsed = parseClassName(key);

      if (parsed) {
        const varName = createCssVarName({
          isDark: parsed.isDark,
          prefix: parsed.prefix,
          name: parsed.baseClass,
          state: parsed.state,
        });

        // Format the final CSS value (applies color shorthand if applicable).
        // Note: content-before/content-after are mandatory static classes for
        // pseudo-elements and are not inline-vars targets, so no special-casing is needed.
        const finalValue = resolveColorShorthand(value);

        // Apply to DOM
        target.style.setProperty(varName, finalValue);

        // Because we enforce underscores, rawValue has no spaces.
        // Therefore, parsed.fullClass is perfectly safe for classList.add()
        target.classList.add(parsed.fullClass);
        target.classList.remove(token); // Clean up the raw `key=value` token
        synthesized.push(parsed);
      }
      // ==========================================
      // BRANCH 2: Direct Rule Fallback
      // ==========================================
      // If `parseClassName` doesn't catch it, we fall back to checking if the
      // raw key exists directly in our base `rules` registry. This achieves the
      // desired result for simple keys that bypass the advanced checker.
      else {
        // Strict check: If the key is not a registered rule selector, skip it.
        // (It might be a token meant for a different plugin).
        if (!rules.some(rule => rule.selector === key)) {
          continue;
        }

        // Generate a simple CSS variable name by stripping invalid characters
        // and replacing colons with hyphens (e.g., `sm:m` -> `--sm-m`)
        const varKey = key.replace(/:/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

        if (varKey) {
          target.style.setProperty(`--${varKey}`, resolveColorShorthand(value));
        }

        // Apply the raw key as the class and clean up the raw `key=value` token
        target.classList.add(key);
        target.classList.remove(token);
      }
    }

    return synthesized;
  },
};
