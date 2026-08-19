import { type ZRuntimePlugin } from '../types';
import { parseClassName, type ParsedClass } from '../parsers';

export const safelistPlugin: ZRuntimePlugin = {
  name: 'safelist',
  onAdditionalClasses: () => {
    const safelist = (window as any).zRuntime?.safelist;

    if (!safelist || !Array.isArray(safelist)) {
      return [];
    }

    const parsedClasses: ParsedClass[] = [];

    safelist.forEach((item: any) => {
      if (typeof item === 'string') {
        const parsed = parseClassName(item);

        if (parsed) {
          parsedClasses.push(parsed);
        }
      } else if (typeof item === 'object' && item !== null) {
        const baseClass = item.class || item.className;

        if (!baseClass) {
          return;
        }

        const itemStates = item.states || [];
        const itemPrefixes = item.prefixes || [null];
        const itemDarkModes = item.dark === true ? [false, true] : [false];

        itemDarkModes.forEach(isDark => {
          itemPrefixes.forEach((prefix: any) => {
            itemStates.forEach((state: any) => {
              let fullClass = baseClass;

              if (prefix) {
                fullClass = `${prefix}:${fullClass}`;
              }

              if (isDark) {
                fullClass = `dark:${fullClass}`;
              }

              parsedClasses.push({ baseClass, state, fullClass, isDark, prefix: prefix || null });
            });
          });
        });
      }
    });

    return parsedClasses;
  },
};
