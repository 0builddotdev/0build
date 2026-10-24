import { decoder, type ParsedClass } from '../functions';
import { type ZRuntimeCore, type ZRuntimePlugin } from '../main';

export const domExtractorPlugin: ZRuntimePlugin = {
  name: 'dom-extractor',

  onElementScan: (element: Element, _rules, core: ZRuntimeCore): ParsedClass[] => {
    const interactiveClasses: ParsedClass[] = [];
    const isDebug = core.isDebug();

    for (const className of element.classList) {
      if (className.includes('=')) {
        continue;
      }

      const result = decoder(className);

      if (!result.ok) {
        continue;
      }

      const parsed = result.value;

      interactiveClasses.push(parsed);

      if (isDebug && (parsed.pseudoElement === 'before' || parsed.pseudoElement === 'after')) {
        const expectedContentClass =
          `${parsed.isDark ? 'dark:' : ''}` +
          `${parsed.prefix ? `${parsed.prefix}:` : ''}` +
          `content-${parsed.pseudoElement}`;

        if (!element.classList.contains(expectedContentClass)) {
          core.warn(
            'dom-extractor',
            `Pseudo-element class "${className}" is missing its paired "${expectedContentClass}".`,
            element,
          );
        }
      }
    }

    return interactiveClasses;
  },
};
