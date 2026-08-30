import { type ZRuntimePlugin } from '../types';
import { parseClassName, createCssVarName, type ParsedClass, buildClassName } from '../parsers';
import { COLORS, INTENSITIES } from '../registry/common';
import { rules, scaled } from '../registry/rules';

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

/** A bare (optionally negative) number, decimals included — the shape a `scaled` rule accepts. */
const INTEGER_PATTERN = /^-?\d*\.?\d+$/;

/**
 * `scaled` selectors (e.g. `m`, `p`, `gap`) generate CSS as
 * `calc(var(--spacing) * var(--m))` — they expect a plain integer multiplier
 * (`m=4`), not a raw CSS value (`m=4px`).
 *
 * If someone passes a non-integer value for a scaled key, they almost
 * certainly meant the arbitrary counterpart (`[m]=4px`) instead. We
 * transparently redirect to it — but only if `[key]` is actually a
 * registered rule. If it isn't, we leave `key` untouched and let the
 * existing (unscaled-but-literal) path handle it as before, rather than
 * silently inventing a rule that doesn't exist.
 *
 * `scaled` only ever contains bare selector names (`m`, not `sm:m` or
 * `dark:m`), so a prefixed/stateful key needs its dark/breakpoint/pseudo
 * wrapping stripped off before we check membership — and, if we do
 * redirect, that same wrapping needs to be reattached around `[base]`
 * rather than around the whole original key. We delegate that stripping
 * and reassembly to parseClassName/buildClassName (the canonical grammar)
 * instead of re-deriving it here, so the two definitions can't drift apart.
 */
function resolveScaledKey(key: string, value: string): string {
  if (INTEGER_PATTERN.test(value)) {
    return key;
  }

  const parsed = parseClassName(key);
  const base = parsed ? parsed.baseClass : key;

  if (!scaled.has(base)) {
    return key;
  }

  const arbitraryBase = `[${base}]`;

  if (!rules.some(rule => rule.selector === arbitraryBase)) {
    return key;
  }

  if (!parsed) {
    return arbitraryBase;
  }

  return buildClassName({
    base: arbitraryBase,
    isDark: parsed.isDark,
    prefix: parsed.prefix,
    pseudoClass: parsed.state || undefined,
  });
}

/**
 * inlineVarsPlugin
 *
 * Scans element classes for `key=value` tokens (e.g., `[m]=4px`, `bg=pink-500`)
 * and converts them into inline CSS variables.
 *
 * ARCHITECTURE NOTE (The Two-Branch Strategy):
 * Before either branch runs, `resolveScaledKey` may rewrite a plain scaled
 * key (`m`) to its arbitrary counterpart (`[m]`) if the value looks like a
 * raw CSS value rather than an integer multiplier. Both branches below then
 * operate on that resolved key as if the user had typed it directly.
 *
 * 1. BRANCH 1 (`parseClassName`): An advanced checker that looks for complex
 *    structures first (like semicolons, complex variant prefixes, or states). If it matches, it
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

      if (eqIdx <= 0 || token.includes('{') || token.includes('}')) {
        continue;
      }

      const key = token.slice(0, eqIdx);
      const rawValue = token.slice(eqIdx + 1);

      if (!key || !rawValue) {
        continue;
      }

      const value = rawValue.replace(/_/g, ' ');

      // Redirect scaled keys (`m`) to their arbitrary counterpart (`[m]`)
      // when the value is a raw CSS value rather than an integer multiplier.
      const resolvedKey = resolveScaledKey(key, value);

      // ==========================================
      // BRANCH 1: Advanced Parsing
      // ==========================================
      const parsed = parseClassName(resolvedKey);

      if (parsed) {
        const hasOpacityModifier = parsed.baseClass.endsWith('/o');

        let mainValue = value;
        let opacityValue: string | null = null;

        if (hasOpacityModifier) {
          opacityValue = '100%';

          const opacityMatch = value.match(/^(.*?)\s*\/\s*([\d.]+%?)$/);

          if (opacityMatch) {
            mainValue = opacityMatch[1].trim();
            opacityValue = opacityMatch[2].trim();

            if (/^\d+$/.test(opacityValue)) {
              opacityValue = `${opacityValue}%`;
            }
          }
        }

        const baseName = hasOpacityModifier ? parsed.baseClass.slice(0, -2) : parsed.baseClass;

        const varName = createCssVarName({
          isDark: parsed.isDark,
          prefix: parsed.prefix,
          name: baseName,
          state: parsed.state,
        });

        const finalValue = resolveColorShorthand(mainValue);

        target.style.setProperty(varName, finalValue);

        if (opacityValue !== null) {
          const opacityVarName = createCssVarName({
            isDark: parsed.isDark,
            prefix: parsed.prefix,
            name: `${baseName}-o`,
            state: parsed.state,
          });

          target.style.setProperty(opacityVarName, opacityValue);
        }

        target.classList.add(parsed.fullClass);
        target.classList.remove(token);
        synthesized.push(parsed);
      }
      // ==========================================
      // BRANCH 2: Direct Rule Fallback
      // ==========================================
      else {
        if (!rules.some(rule => rule.selector === resolvedKey)) {
          continue;
        }

        const isOpacity = resolvedKey.includes('/o');
        const baseVarKey = resolvedKey
          .replace(/\/o/g, '')
          .replace(/:/g, '-')
          .replace(/[^a-zA-Z0-9-]/g, '');

        let mainValue = value;
        let opacityValue: string | null = null;

        if (isOpacity) {
          opacityValue = '100%';

          const opacityMatch = value.match(/^(.*?)\s*\/\s*([\d.]+%?)$/);

          if (opacityMatch) {
            mainValue = opacityMatch[1].trim();
            opacityValue = opacityMatch[2].trim();

            if (/^\d+$/.test(opacityValue)) {
              opacityValue = `${opacityValue}%`;
            }
          }
        }

        if (baseVarKey) {
          target.style.setProperty(`--${baseVarKey}`, resolveColorShorthand(mainValue));
        }

        if (opacityValue !== null) {
          target.style.setProperty(`--${baseVarKey}-o`, opacityValue);
        }

        target.classList.add(resolvedKey);
        target.classList.remove(token);
      }
    }

    return synthesized;
  },
};
