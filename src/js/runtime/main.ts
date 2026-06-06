import { rules as defaultRules, vd } from './registry';

if (typeof window !== 'undefined') {
  (window as any).FS = (window as any).FS || {};
}

(() => {
  type Breakpoints = Record<string, string>;

  const breakpoints: Breakpoints = {
    sm: '40rem',
    md: '48rem',
    lg: '64rem',
    xl: '80rem',
    '2xl': '96rem',
  };

  const states: string[] = [
    ':hover',
    ':active',
    ':focus',
    ':focus-within',
    ':target',
    ':checked',
    ':disabled',
    ':group-hover',
  ];

  const classParser = new RegExp(
    `^(dark:)?(?:(${Object.keys(breakpoints).join('|')}):)?(.+)(${states.join('|')})$`,
  );

  const ruleCache = new Map<string, CssRule>();

  interface CssRule {
    css: string;
    layer: string;
    breakpoint: string | null;
  }

  interface ParsedClass {
    baseClass: string;
    state: string;
    fullClass: string;
    isDark: boolean;
    prefix: string | null;
  }

  interface RuleConfig {
    selector: string;
    properties: string | string[];
    values: string[];
    arbitrary?: boolean;
    placeholders?: Record<string, string>;
    layer?: string;
  }

  interface GeneratedCssLayer {
    base: string[];
    media: Record<string, string[]>;
  }

  interface GeneratedCSS {
    components: GeneratedCssLayer;
    styles: GeneratedCssLayer;
    utilities: GeneratedCssLayer;
  }

  function getMergedRules(): RuleConfig[] {
    const customRules = (window as any).FS?.customRules || [];

    if (!Array.isArray(customRules)) {
      console.warn('[fs] FS.customRules must be an array. Ignoring custom rules.');

      return defaultRules as RuleConfig[];
    }

    const validatedCustomRules = customRules.filter((rule: any) => {
      if (!rule.selector || typeof rule.selector !== 'string') {
        return false;
      }

      if (!rule.properties) {
        return false;
      }

      if (!rule.arbitrary && (!rule.values || !Array.isArray(rule.values))) {
        return false;
      }

      return true;
    });

    const merged = [...(defaultRules as RuleConfig[])];

    validatedCustomRules.forEach((customRule: RuleConfig) => {
      const existingIndex = merged.findIndex(r => r.selector === customRule.selector);

      if (existingIndex !== -1) {
        merged[existingIndex] = customRule;
      } else {
        merged.push(customRule);
      }
    });

    return merged;
  }

  const rules = getMergedRules();

  function escapeCssIdentifier(str: string): string {
    return str.replace(/([ !"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
  }

  function normalizeClsClass(className: string): string {
    return className.replace(/\:/g, ':');
  }

  function createCssVarName({
    isDark,
    prefix,
    name,
    state,
  }: {
    isDark: boolean;
    prefix: string | null;
    name: string;
    state: string;
  }): string {
    const parts = [
      isDark ? 'dark' : '',
      prefix,
      name.replace(/[^a-zA-Z0-9-]/g, ''),
      state.replace(':', ''),
    ];

    return `--${parts.filter(Boolean).join('-')}`;
  }

  function findStyleRule(selector: string): RuleConfig | null {
    return rules.find(rule => rule.selector === selector) || null;
  }

  function buildCssRule({
    baseClass,
    fullClass,
    state,
    prefix,
    isDark,
  }: ParsedClass): CssRule | null {
    const config = findStyleRule(baseClass);

    if (!config) {
      return null;
    }

    const escapedClass = escapeCssIdentifier(fullClass);
    let selectorCore = '';

    if (state === ':group-hover') {
      selectorCore = `.group:hover .${escapedClass}`;
    } else {
      selectorCore = `.${escapedClass}${state}`;
    }

    const selector = isDark ? `.dark ${selectorCore}` : selectorCore;
    const declarations: Record<string, string> = {};

    const props = Array.isArray(config.properties) ? config.properties : [config.properties];

    props.forEach((prop, i) => {
      if (config.arbitrary) {
        const varName = createCssVarName({ isDark, prefix, name: baseClass, state });

        declarations[prop] = `var(${varName})`;
      } else if (config.placeholders) {
        let value = config.values[i] || config.values[0];

        for (const [ph, name] of Object.entries(config.placeholders)) {
          const varName = createCssVarName({ isDark, prefix, name, state });

          value = value.replaceAll(ph, varName);
        }
        declarations[prop] = value;
      } else {
        declarations[prop] = config.values[i] || config.values[0];
      }
    });

    const declarationString = Object.entries(declarations)
      .map(([prop, val]) => `${prop}: ${val};`)
      .join(' ');

    return {
      css: `${selector} { ${declarationString} }`,
      layer: config.layer || 'styles',
      breakpoint: prefix ? breakpoints[prefix] : null,
    };
  }

  function parseClassName(className: string): ParsedClass | null {
    const normalizedClass = normalizeClsClass(className);

    if (!normalizedClass.includes(':')) {
      return null;
    }

    const match = normalizedClass.match(classParser);

    if (!match) {
      return null;
    }

    const [, dark, prefix, baseClass, state] = match;

    return {
      baseClass,
      state,
      fullClass: normalizedClass,
      isDark: !!dark,
      prefix: prefix || null,
    };
  }

  // NEW: Splits attribute tokens by spaces but respects quotes (single or double)
  function parseAttributeTokens(attrValue: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote: string | null = null;

    for (let i = 0; i < attrValue.length; i++) {
      const char = attrValue[i];

      if (inQuote) {
        current += char;

        if (char === inQuote) {
          inQuote = null;
        }
      } else if (char === '"' || char === "'") {
        inQuote = char;
        current += char;
      } else if (/\s/.test(char)) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }

  function applyInlineVars(element: Element): ParsedClass[] {
    const synthesized: ParsedClass[] = [];
    const classAttr = element.getAttribute('class') || '';
    const clsAttr = element.getAttribute('cls') || '';

    // Use the new quote-aware parser instead of element.classList
    const sources = [...parseAttributeTokens(classAttr), ...parseAttributeTokens(clsAttr)];

    for (const token of sources) {
      const eqIdx = token.indexOf('=');

      if (eqIdx <= 0) {
        continue;
      }

      const key = token.slice(0, eqIdx);

      let value = token.slice(eqIdx + 1);

      if (!key || !value) {
        continue;
      }

      // Strip bounding quotes from the CSS variable value
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }

      const parsed = parseClassName(key);

      if (parsed) {
        const varName = createCssVarName({
          isDark: parsed.isDark,
          prefix: parsed.prefix,
          name: parsed.baseClass,
          state: parsed.state,
        });

        (element as HTMLElement).style.setProperty(varName, value);
        element.classList.add(parsed.fullClass);
        synthesized.push(parsed);
      } else {
        const varKey = key.replace(/:/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

        (element as HTMLElement).style.setProperty(`--${varKey}`, value);
        element.classList.add(key);
      }
    }

    return synthesized;
  }

  function runDebug(node: HTMLElement): void {
    const classAttr = node.getAttribute('class') || '';
    const clsAttr = node.getAttribute('cls') || '';

    // Use quote-aware parser to avoid warnings on fragmented browser-spaced tokens
    const allClasses: string[] = [
      ...parseAttributeTokens(classAttr),
      ...parseAttributeTokens(clsAttr),
    ];

    if (Array.isArray(vd) && vd.length > 0) {
      const getBase = (cls: string) => {
        let base = normalizeClsClass(cls);

        base = base.replace(/^dark:/, '');
        const bpRegex = new RegExp(`^(${Object.keys(breakpoints).join('|')}):`);

        base = base.replace(bpRegex, '');

        for (const state of states) {
          if (base.endsWith(state)) {
            base = base.slice(0, -state.length);
            break;
          }
        }

        return base;
      };

      const targetBases = new Set(vd.map(getBase));
      const missingVars: string[] = [];

      allClasses.forEach(cls => {
        if (cls.includes('=')) {
          return;
        }

        const base = getBase(cls);

        if (targetBases.has(base)) {
          let cleanCls = normalizeClsClass(cls);

          cleanCls = cleanCls.replace(/\[|\]/g, '');
          const varName = `--${cleanCls.replace(/[^a-zA-Z0-9-]/g, '-')}`;

          if (node.style.getPropertyValue(varName) === '') {
            missingVars.push(`${cls} → ${varName}`);
          }
        }
      });

      if (missingVars.length > 0) {
        console.warn(
          `[fs debug] Missing variables (${missingVars.length}): ${missingVars.join(', ')}`,
          node,
        );
      }
    }
  }

  function getSafelistClasses(): ParsedClass[] {
    const safelist = (window as any).FS?.safelist;

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
  }

  function extractInteractiveClasses(element: Element): ParsedClass[] {
    const interactiveClasses: ParsedClass[] = [];
    const classLists: { classes: string[] | DOMTokenList; fromCls: boolean }[] = [];

    if (element.classList.length > 0) {
      classLists.push({ classes: element.classList, fromCls: false });
    }

    if (element.hasAttribute('cls')) {
      const clsValue = element.getAttribute('cls') || '';
      // Use quote-aware parser
      const clsClasses = parseAttributeTokens(clsValue);

      classLists.push({ classes: clsClasses, fromCls: true });
    }

    classLists.forEach(({ classes, fromCls }) => {
      for (const className of Array.from(classes)) {
        if (className.includes('=')) {
          continue;
        }

        const normalizedClass = fromCls ? normalizeClsClass(className) : className;

        if (!normalizedClass.includes(':')) {
          continue;
        }

        const match = normalizedClass.match(classParser);

        if (match) {
          const [, dark, prefix, baseClass, state] = match;

          interactiveClasses.push({
            baseClass,
            state,
            fullClass: normalizedClass,
            isDark: !!dark,
            prefix: prefix || null,
          });
        }
      }
    });

    return interactiveClasses;
  }

  function generateInteractiveStyles(): void {
    try {
      const isDebug = (window as any).FS?.debug === true;

      if (isDebug) {
        console.warn(
          '[fs] Debug mode is active. Please ensure this is disabled in production for optimal performance.',
        );

        document.querySelectorAll('[class], [cls]').forEach(node => {
          runDebug(node as HTMLElement);
        });
      }

      const nodes = document.querySelectorAll('[class], [cls]');
      const allInteractiveClasses: ParsedClass[] = [];

      nodes.forEach(node => {
        applyInlineVars(node as HTMLElement);
        allInteractiveClasses.push(...extractInteractiveClasses(node));
      });

      const safelistClasses = getSafelistClasses();

      allInteractiveClasses.push(...safelistClasses);

      const generatedCss: GeneratedCSS = {
        components: { base: [], media: {} },
        styles: { base: [], media: {} },
        utilities: { base: [], media: {} },
      };

      allInteractiveClasses.forEach(parsedClass => {
        const { fullClass, state, isDark, prefix } = parsedClass;
        const ruleKey = `${fullClass}${state}${isDark ? '-dark' : ''}${prefix || ''}`;

        if (ruleCache.has(ruleKey)) {
          const rule = ruleCache.get(ruleKey)!;
          const layer = rule.layer as keyof GeneratedCSS;

          if (rule.breakpoint) {
            const mediaBucket = generatedCss[layer].media;

            mediaBucket[rule.breakpoint] = mediaBucket[rule.breakpoint] || [];

            if (!mediaBucket[rule.breakpoint].includes(rule.css)) {
              mediaBucket[rule.breakpoint].push(rule.css);
            }
          } else {
            if (!generatedCss[layer].base.includes(rule.css)) {
              generatedCss[layer].base.push(rule.css);
            }
          }

          return;
        }

        const rule = buildCssRule(parsedClass);

        if (!rule) {
          return;
        }

        ruleCache.set(ruleKey, rule);

        const layer = rule.layer as keyof GeneratedCSS;

        if (rule.breakpoint) {
          const mediaBucket = generatedCss[layer].media;

          mediaBucket[rule.breakpoint] = mediaBucket[rule.breakpoint] || [];
          mediaBucket[rule.breakpoint].push(rule.css);
        } else {
          generatedCss[layer].base.push(rule.css);
        }
      });

      const buildLayer = (layerName: string, { base, media }: GeneratedCssLayer): string => {
        const mediaQueries = Object.entries(media)
          .map(([size, rules]) => `@media (min-width: ${size}) {\n  ${rules.join('\n  ')}\n}`)
          .join('\n');
        const content = [...base, mediaQueries].filter(Boolean).join('\n');

        return content ? `@layer ${layerName} {\n${content}\n}` : '';
      };

      const finalCss = [
        buildLayer('components', generatedCss.components),
        buildLayer('styles', generatedCss.styles),
        buildLayer('utilities', generatedCss.utilities),
      ]
        .filter(Boolean)
        .join('\n\n');

      let styleTag = document.getElementById('uk-interactive-styles') as HTMLStyleElement | null;

      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'uk-interactive-styles';
        styleTag.setAttribute('data-fs-managed', 'true');
        document.head.appendChild(styleTag);
      }

      styleTag.textContent = finalCss;
    } catch (e) {
      console.error('[fs] Error generating styles:', e);
    }
  }

  function init(): void {
    const customRulesCount = ((window as any).FS?.customRules || []).length;

    if (customRulesCount > 0) {
      console.info(`[fs] Loaded ${customRulesCount} custom rule(s)`);
    }

    generateInteractiveStyles();
  }

  function refresh(): void {
    console.info('[fs] Refreshing interactive styles...');
    ruleCache.clear();
    generateInteractiveStyles();
  }

  if (typeof window !== 'undefined') {
    (window as any).FS = (window as any).FS || {};

    Object.assign((window as any).FS, {
      refresh,
      regenerate: generateInteractiveStyles,
      getCache: () => ruleCache,
      getRules: () => getMergedRules(),
      getSafelist: () => getSafelistClasses(),
      _initialized: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

export default typeof window !== 'undefined' ? (window as any).FS : {};
