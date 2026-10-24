import { decoder, formatState, type Breakpoint, type ParsedClass } from '../functions';
import { type ZRuntimeCore, type ZRuntimePlugin } from '../main';

function parseStateString(stateStr: string): {
  pseudoClasses: string[];
  pseudoElement: string | null;
} {
  const pseudoClasses: string[] = [];
  let pseudoElement: string | null = null;

  if (!stateStr) {
    return { pseudoClasses, pseudoElement };
  }

  for (let i = 0; i < stateStr.length; ) {
    const isElement = stateStr[i + 1] === ':';
    const start = i + (isElement ? 2 : 1);
    let end = stateStr.indexOf(':', start);

    if (end === -1) {
      end = stateStr.length;
    }
    const ident = stateStr.slice(start, end);

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

export const safelistPlugin: ZRuntimePlugin = {
  name: 'safelist',

  onAdditionalClasses: (core: ZRuntimeCore): ParsedClass[] => {
    const safelist = (window as any).zRuntime?.safelist;

    if (!safelist || !Array.isArray(safelist)) {
      return [];
    }

    const parsedClasses: ParsedClass[] = [];

    for (const item of safelist) {
      if (typeof item === 'string') {
        const result = decoder(item);

        if (result.ok) {
          parsedClasses.push(result.value);
        } else if (core.isDebug()) {
          core.warn('safelist', `Invalid safelist class string "${item}".`);
        }
      } else if (typeof item === 'object' && item !== null) {
        const baseClass: string | undefined = item.class || item.className;

        if (!baseClass) {
          core.warn(
            'safelist',
            `Safelist object is missing "class" or "className": ${JSON.stringify(item)}`,
          );
          continue;
        }

        const itemStates: string[] = item.states?.length ? item.states : [''];
        const itemPrefixes: (Breakpoint | null)[] = item.prefixes || [null];
        const itemDarkModes = item.dark === true ? [false, true] : [false];

        for (const isDark of itemDarkModes) {
          for (const prefix of itemPrefixes) {
            for (const state of itemStates) {
              const { pseudoClasses, pseudoElement } = parseStateString(state);
              const normalizedState = formatState(pseudoClasses, pseudoElement);
              const fullClass =
                `${isDark ? 'dark:' : ''}` +
                `${prefix ? `${prefix}:` : ''}` +
                `${baseClass}${normalizedState}`;

              parsedClasses.push({
                isDark,
                prefix: prefix || null,
                property: baseClass,
                pseudoClasses,
                pseudoElement,
                value: null,
                important: false,
                baseClass,
                state: normalizedState,
                fullClass,
              });
            }
          }
        }
      }
    }

    return parsedClasses;
  },
};
