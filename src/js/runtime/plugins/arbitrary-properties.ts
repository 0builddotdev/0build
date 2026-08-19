import { type Rule } from '../registry/rules';
import { type ZRuntimePlugin } from '../types';
import { parseAttributeTokens, type ParsedClass } from '../parsers';
import { BREAKPOINTS } from '../registry/common';

/**
 * Matches tokens like:
 *   [color]={red}
 *   sm:[background-color]={rgba(0,0,0,0.5)}
 *   dark:sm:[border-radius]={8px}
 *   [writing-mode]:hover={horizontal-tb}
 *   [color]::before={pink}
 *   sm:[color]:hover::before={pink}
 *
 * Group 1: zero or more colon-separated variants ("dark", "sm", "md", ...) —
 *          these are prefixes, matching how breakpoint/dark already work.
 * Group 2: the raw CSS property name
 * Group 3: zero or more chained pseudo-class/pseudo-element states
 *          (":hover", "::before", ":hover::before", ...) — these are a
 *          suffix on the property, matching the existing `color:hover=pink` /
 *          `color::before=pink` convention rather than the prefix style
 *          used for breakpoints/dark.
 * Group 4: the raw value (underscores stand in for spaces, same convention
 *          as inline-vars.ts, since a literal space would split the token)
 */
const ARBITRARY_PROPERTY_REGEX =
  /^((?:[a-zA-Z0-9]+:)*)\[([a-zA-Z-]+)\]((?::{1,2}[a-zA-Z-]+)*)=\{(.+)\}$/;

function decodeUnderscoreSpaces(value: string): string {
  return value.replace(/_/g, ' ');
}

/**
 * Handles the `[css-property]={value}` escape hatch — arbitrary CSS
 * properties that aren't in registry/rules.ts at all, as opposed to the
 * existing `[m]=4px` syntax which maps onto an *already-registered* rule
 * shorthand (`m`) and just splits the token.
 *
 * How it resolves rules: buildCssRule() looks up a Rule by
 * `rules.find(r => r.selector === baseClass)`. Instead of pre-declaring every
 * possible property/value combo in registry/rules.ts (impossible, it's
 * arbitrary), this plugin synthesizes a one-off Rule per unique
 * property+value pair the first time it's seen, and pushes it directly into
 * the `rules` array passed into onElementScan.
 *
 * That works within a single generate() pass because core.ts passes
 * `this.rules` by reference into every onElementScan call, and doesn't
 * reassign `this.rules` again until the *next* generate() call — so the
 * push is visible to buildCssRule() in step 4, later in the same pass.
 *
 * Caveat: this relies on that reference not being copied/frozen between
 * step 2 and step 4 in core.ts. If a future refactor changes that (e.g.
 * `this.rules` gets re-spread before compiling), this plugin would need an
 * onRulesLoad hook backed by a persisted registry (a la customRulesPlugin's
 * `window.zRuntime.customRules`) instead, accepting that newly-discovered
 * combos only render on the *next* generate()/refresh() call.
 *
 * Also note: like the rest of the compiler, the value is interpolated into
 * `${prop}: ${val};` unescaped — there's no CSS-injection sanitization here,
 * consistent with the rest of this codebase treating class attributes as
 * developer-controlled, not raw user input.
 *
 * States (`:hover`, `::before`, chained combinations) are a suffix on the
 * property, matching the existing `color:hover=pink` / `color::before=pink`
 * convention — e.g. `[color]:hover={pink}`, not `hover:[color]={pink}`.
 * `dark:`/breakpoints stay prefixes, same as before. No validation is done
 * against a known list of pseudo-classes — any `:word` or `::word` shape is
 * accepted and passed straight through, same as the rest of this codebase's
 * generic/unvalidated approach to state.
 */
export const arbitraryPropertiesPlugin: ZRuntimePlugin = {
  name: 'arbitrary-properties',

  onElementScan: (element: Element, rules: Rule[]): ParsedClass[] => {
    const parsedClasses: ParsedClass[] = [];
    const classAttr = element.getAttribute('class') || '';
    const tokens = parseAttributeTokens(classAttr);

    for (const token of tokens) {
      const match = token.match(ARBITRARY_PROPERTY_REGEX);

      if (!match) {
        continue;
      }

      const [, variantString, property, state, rawValue] = match;

      let isDark = false;
      // 1. Strongly type the prefix to match the keys of BREAKPOINTS
      let prefix: keyof typeof BREAKPOINTS | null = null;
      let hasUnknownVariant = false;

      if (variantString) {
        for (const variant of variantString.split(':').filter(Boolean)) {
          if (variant === 'dark') {
            isDark = true;
          } else if (variant in BREAKPOINTS) {
            // 2. Use `in` to safely check if the string is a valid key,
            // then assert the type when assigning to prefix
            prefix = variant as keyof typeof BREAKPOINTS;
          } else {
            // Not a variant we understand — leave this token alone in case
            // some other plugin/syntax is meant to handle it.
            hasUnknownVariant = true;
            break;
          }
        }
      }

      if (hasUnknownVariant) {
        continue;
      }

      // baseClass is variant-free, so `[color]={red}`, `sm:[color]={red}`,
      // and `dark:sm:[color]={red}` all resolve to the same Rule (and the
      // same declaration block), differentiated only by fullClass/prefix/isDark
      // — exactly like a normal registry rule reused across variants.
      const baseClass = `[${property}]={${rawValue}}`;

      if (!rules.some(r => r.selector === baseClass)) {
        const dynamicRule: Rule = {
          selector: baseClass,
          properties: property,
          // Explicit even though it's the default: `values` (not a CSS var)
          // is the correct branch of the Rule union for a literal property/value pair.
          arbitrary: false,
          values: [decodeUnderscoreSpaces(rawValue)],
          layer: 'utilities',
        };

        rules.push(dynamicRule);
      }

      parsedClasses.push({
        baseClass,
        fullClass: token,
        state,
        prefix,
        isDark,
      });
    }

    return parsedClasses;
  },
};
