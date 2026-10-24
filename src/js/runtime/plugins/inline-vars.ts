import { decoder, encoder, variable, type ParsedClass } from '../functions';
import { type ZRuntimeCore, type ZRuntimePlugin } from '../main';
import { COLORS, INTENSITIES } from '../registry/common';
import { SCALED, VD } from '../registry/rules';

const COLOR_SET = new Set<string>(COLORS);
const INTENSITY_SET = new Set<string>(INTENSITIES.map(String));
const NUMBER_PATTERN = /^-?\d*\.?\d+$/;

/** Precompute VD base property names once at module load instead of per DOM element. */
const VD_TARGET_BASES = new Set<string>(
  Array.from(VD).map(cls => {
    const res = decoder(cls, { allowBare: true });

    return res.ok ? res.value.property : cls;
  }),
);

function resolveColorShorthand(value: string): string {
  const dashIdx = value.indexOf('-');

  if (dashIdx <= 0 || value.indexOf('-', dashIdx + 1) !== -1) {
    return value;
  }

  const colorName = value.slice(0, dashIdx);
  const intensity = value.slice(dashIdx + 1);

  if (COLOR_SET.has(colorName) && INTENSITY_SET.has(intensity)) {
    return `var(--color-${colorName}-${intensity})`;
  }

  return value;
}

function splitOpacityValue(value: string): { mainValue: string; opacityValue: string } {
  const opacityMatch = value.match(/^(.*?)\s*\/\s*([\d.]+%?)$/);

  if (!opacityMatch) {
    return { mainValue: value, opacityValue: '100%' };
  }

  const mainValue = opacityMatch[1].trim();
  let opacityValue = opacityMatch[2].trim();

  if (/^\d+$/.test(opacityValue)) {
    opacityValue = `${opacityValue}%`;
  }

  return { mainValue, opacityValue };
}

function debugMissingVdVars(target: HTMLElement, core: ZRuntimeCore): void {
  if (VD_TARGET_BASES.size === 0) {
    return;
  }

  const missingVars: string[] = [];

  for (const cls of target.classList) {
    if (cls.includes('=')) {
      continue;
    }

    const res = decoder(cls, { allowBare: true });

    if (!res.ok) {
      continue;
    }

    const parsed = res.value;

    if (!VD_TARGET_BASES.has(parsed.property)) {
      continue;
    }

    const hasOpacity = parsed.property.endsWith('/o');
    const baseName = hasOpacity ? parsed.property.slice(0, -2) : parsed.property;

    const mainVarName = variable({
      isDark: parsed.isDark,
      prefix: parsed.prefix,
      name: baseName,
      pseudoClasses: parsed.pseudoClasses,
      pseudoElement: parsed.pseudoElement,
    });

    if (target.style.getPropertyValue(mainVarName) === '') {
      missingVars.push(`${cls} → ${mainVarName}`);
    }

    if (hasOpacity) {
      const opacityVarName = variable({
        isDark: parsed.isDark,
        prefix: parsed.prefix,
        name: `${baseName}-o`,
        pseudoClasses: parsed.pseudoClasses,
        pseudoElement: parsed.pseudoElement,
      });

      if (target.style.getPropertyValue(opacityVarName) === '') {
        missingVars.push(`${cls} → ${opacityVarName}`);
      }
    }
  }

  if (missingVars.length > 0) {
    core.warn(
      'inline-vars',
      `Missing variables (${missingVars.length}): ${missingVars.join(', ')}`,
      target,
    );
  }
}

export const inlineVarsPlugin: ZRuntimePlugin = {
  name: 'inline-vars',

  onElementScan: (element: Element, _rules, core: ZRuntimeCore): ParsedClass[] => {
    const synthesized: ParsedClass[] = [];
    const target = element as HTMLElement;

    if (!target.style) {
      return synthesized;
    }

    const classAttr = target.getAttribute('class') || '';

    if (!classAttr.includes('=') && !core.isDebug()) {
      return synthesized;
    }

    const sources = classAttr.split(/\s+/).filter(Boolean);

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

      const decodedKey = decoder(key, { allowBare: true });

      if (!decodedKey.ok) {
        continue;
      }

      let parsed = decodedKey.value;
      const value = rawValue.replace(/_/g, ' ');

      // Redirect scaled keys (`m=4px` or `dark:m=4px`) to `[m]` when given a non-numeric value
      if (SCALED.has(parsed.property) && !NUMBER_PATTERN.test(value)) {
        const arbitraryBase = `[${parsed.property}]`;

        if (core.hasRule(arbitraryBase)) {
          const redirected = encoder({
            ...parsed,
            property: arbitraryBase,
            value: null,
            important: false,
          });
          const redecoded = decoder(redirected, { allowBare: true });

          if (redecoded.ok) {
            parsed = redecoded.value;
          }
        } else if (core.isDebug()) {
          core.warn(
            'inline-vars',
            `"${token}" uses a raw value ("${rawValue}") on scaled property "${parsed.property}", ` +
              `but no "${arbitraryBase}" rule is registered to fall back to. This value will be ` +
              `multiplied by --spacing and likely produce broken CSS.`,
            target,
          );
        }
      }

      const isVariantOrStateful = parsed.isDark || parsed.prefix !== null || parsed.state !== '';

      // Bare rules must exist in the rule registry
      if (!isVariantOrStateful && !core.hasRule(parsed.property)) {
        continue;
      }

      const hasOpacityModifier = parsed.property.endsWith('/o');
      const baseName = hasOpacityModifier ? parsed.property.slice(0, -2) : parsed.property;

      let mainValue = value;
      let opacityValue: string | null = null;

      if (hasOpacityModifier) {
        const split = splitOpacityValue(value);

        mainValue = split.mainValue;
        opacityValue = split.opacityValue;
      }

      const varName = variable({
        isDark: parsed.isDark,
        prefix: parsed.prefix,
        name: baseName,
        pseudoClasses: parsed.pseudoClasses,
        pseudoElement: parsed.pseudoElement,
      });

      if (varName !== '--') {
        target.style.setProperty(varName, resolveColorShorthand(mainValue));
      }

      if (opacityValue !== null) {
        const opacityVarName = variable({
          isDark: parsed.isDark,
          prefix: parsed.prefix,
          name: `${baseName}-o`,
          pseudoClasses: parsed.pseudoClasses,
          pseudoElement: parsed.pseudoElement,
        });

        target.style.setProperty(opacityVarName, opacityValue);
      }

      target.classList.add(parsed.fullClass);
      target.classList.remove(token);

      if (isVariantOrStateful) {
        synthesized.push(parsed);
      }
    }

    if (core.isDebug()) {
      debugMissingVdVars(target, core);
    }

    return synthesized;
  },
};
