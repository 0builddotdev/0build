import { decoder, encoder, escaper, variable, type ParsedClass } from './functions';
import { BREAKPOINTS } from './registry/common';
import { RULES as defaultRules, type Rule } from './registry/rules';

// Plugins (debugger.ts removed; debugging is now per-plugin)
import { arbitraryPropertiesPlugin } from './plugins/arbitrary-properties';
import { clsPreventionPlugin } from './plugins/cls-prevention';
import { customRulesPlugin } from './plugins/custom-rules';
import { domExtractorPlugin } from './plugins/dom-extractor';
import { inlineVarsPlugin } from './plugins/inline-vars';
import { safelistPlugin } from './plugins/safelist';

// ============================================================================
// Types
// ============================================================================

export interface CssRule {
  css: string;
  layer: string;
  breakpoint: string | null;
}

export interface GeneratedCssLayer {
  base: string[];
  media: Record<string, string[]>;
}

export interface GeneratedCSS {
  components: GeneratedCssLayer;
  styles: GeneratedCssLayer;
  utilities: GeneratedCssLayer;
}

export interface ZRuntimePlugin {
  name: string;
  onInit?: (core: ZRuntimeCore) => void;
  onRulesLoad?: (rules: Rule[], core: ZRuntimeCore) => Rule[];
  onElementScan?: (element: Element, rules: Rule[], core: ZRuntimeCore) => ParsedClass[];
  onAdditionalClasses?: (core: ZRuntimeCore) => ParsedClass[];
  onBeforeInject?: (generatedCss: GeneratedCSS, core: ZRuntimeCore) => GeneratedCSS;
  onAfterInject?: (core: ZRuntimeCore) => void;
}

// ============================================================================
// Compiler
// ============================================================================

function buildCssRule(
  parsedClass: ParsedClass,
  ruleMap: ReadonlyMap<string, Rule>,
): CssRule | null {
  const { baseClass, property, fullClass, state, prefix, isDark, important } = parsedClass;

  const config = ruleMap.get(baseClass) ?? ruleMap.get(property) ?? null;

  if (!config) {
    return null;
  }

  if (config.impliedPseudo && !state) {
    return null;
  }

  const escapedClass = escaper(fullClass);
  const pseudoElement = parsedClass.pseudoElement ? `::${parsedClass.pseudoElement}` : '';
  const pseudoClass = pseudoElement ? state.slice(0, -pseudoElement.length) : state;

  let selectorCore = '';

  if (pseudoClass === ':group-hover') {
    selectorCore = `.group:hover .${escapedClass}${pseudoElement}`;
  } else {
    selectorCore = `.${escapedClass}${state}`;
  }

  if (config.impliedPseudo && !selectorCore.endsWith(config.impliedPseudo)) {
    selectorCore += config.impliedPseudo;
  }

  const selector = isDark ? `.dark ${selectorCore}` : selectorCore;
  const declarations: Record<string, string> = {};
  const props = Array.isArray(config.properties) ? config.properties : [config.properties];
  const importantSuffix = important ? ' !important' : '';

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];

    if (config.arbitrary) {
      const varName = variable({
        isDark,
        prefix,
        name: config.selector || property,
        state,
      });
      const fallback = config.fallback ? `, ${config.fallback}` : '';

      declarations[prop] = `var(${varName}${fallback})${importantSuffix}`;
    } else if (config.placeholders) {
      let value = config.values[i] || config.values[0];

      for (const [ph, name] of Object.entries(config.placeholders)) {
        const varName = variable({ isDark, prefix, name, state });

        value = value.replaceAll(ph, varName);
      }

      declarations[prop] = `${value}${importantSuffix}`;
    } else {
      declarations[prop] = `${config.values[i] || config.values[0]}${importantSuffix}`;
    }
  }

  const declarationString = Object.entries(declarations)
    .map(([prop, val]) => `${prop}: ${val};`)
    .join(' ');

  return {
    css: `${selector} { ${declarationString} }`,
    layer: config.layer || 'styles',
    breakpoint: prefix ? BREAKPOINTS[prefix] : null,
  };
}

// ============================================================================
// Core Engine
// ============================================================================

class ZRuntimeCore {
  private plugins: ZRuntimePlugin[] = [];
  private ruleCache = new Map<string, CssRule>();
  private rules: Rule[] = [];
  private ruleMap = new Map<string, Rule>();
  private defaultRules: Rule[];
  private debugWarnings: { plugin: string; message: string; element?: Element }[] = [];

  constructor(initialRules: Rule[]) {
    this.defaultRules = initialRules;
  }

  use(plugin: ZRuntimePlugin): this {
    this.plugins.push(plugin);

    if (plugin.onInit) {
      plugin.onInit(this);
    }

    return this;
  }

  /** True when `window.zRuntime.debug === true`. */
  isDebug(): boolean {
    return typeof window !== 'undefined' && (window as any).zRuntime?.debug === true;
  }

  /** Per-plugin debug logger. Collects warnings when `isDebug()` is active. */
  warn(pluginName: string, message: string, element?: Element): void {
    if (!this.isDebug()) {
      return;
    }
    this.debugWarnings.push({ plugin: pluginName, message, element });
  }

  /** O(1) rule lookup or registration for plugins (e.g. arbitrary-properties, inline-vars). */
  hasRule(selector: string): boolean {
    return this.ruleMap.has(selector);
  }

  registerRule(rule: Rule): void {
    if (!this.ruleMap.has(rule.selector)) {
      this.rules.push(rule);
    }
    this.ruleMap.set(rule.selector, rule);
  }

  refresh(): void {
    console.info('[zRuntime] Refreshing interactive styles...');
    this.ruleCache.clear();
    this.generate();
  }

  generate(): void {
    try {
      this.debugWarnings = [];

      // 1. Load rules and build O(1) lookup map
      this.rules = [...this.defaultRules];

      for (const p of this.plugins) {
        if (p.onRulesLoad) {
          this.rules = p.onRulesLoad(this.rules, this);
        }
      }

      this.ruleMap.clear();

      for (const r of this.rules) {
        this.ruleMap.set(r.selector, r);
      }

      const allParsedClasses: ParsedClass[] = [];

      // 2. Scan DOM elements via plugins
      const nodes = document.querySelectorAll('[class]');

      nodes.forEach(node => {
        for (const p of this.plugins) {
          if (p.onElementScan) {
            const extracted = p.onElementScan(node, this.rules, this);

            for (let i = 0; i < extracted.length; i++) {
              allParsedClasses.push(extracted[i]);
            }
          }
        }
      });

      // 3. Fetch additional classes (e.g. safelists)
      for (const p of this.plugins) {
        if (p.onAdditionalClasses) {
          const extra = p.onAdditionalClasses(this);

          for (let i = 0; i < extra.length; i++) {
            allParsedClasses.push(extra[i]);
          }
        }
      }

      // 4. Compile classes into CSS layers using O(1) Set deduplication
      const layerSets = {
        components: { base: new Set<string>(), media: new Map<string, Set<string>>() },
        styles: { base: new Set<string>(), media: new Map<string, Set<string>>() },
        utilities: { base: new Set<string>(), media: new Map<string, Set<string>>() },
      };

      const seenRuleKeys = new Set<string>();

      const appendRuleToLayer = (rule: CssRule) => {
        const targetLayer = layerSets[rule.layer as keyof typeof layerSets] ?? layerSets.styles;

        if (rule.breakpoint) {
          let mediaSet = targetLayer.media.get(rule.breakpoint);

          if (!mediaSet) {
            mediaSet = new Set<string>();
            targetLayer.media.set(rule.breakpoint, mediaSet);
          }
          mediaSet.add(rule.css);
        } else {
          targetLayer.base.add(rule.css);
        }
      };

      for (let i = 0; i < allParsedClasses.length; i++) {
        const parsedClass = allParsedClasses[i];
        const { fullClass, state, isDark, prefix } = parsedClass;
        const ruleKey = `${fullClass}|${state}|${isDark ? 'dark' : 'light'}|${prefix || ''}`;

        if (seenRuleKeys.has(ruleKey)) {
          continue;
        }
        seenRuleKeys.add(ruleKey);

        const cachedRule = this.ruleCache.get(ruleKey);

        if (cachedRule) {
          appendRuleToLayer(cachedRule);
          continue;
        }

        const rule = buildCssRule(parsedClass, this.ruleMap);

        if (!rule) {
          continue;
        }

        this.ruleCache.set(ruleKey, rule);
        appendRuleToLayer(rule);
      }

      const toLayerObject = (bucket: (typeof layerSets)['styles']): GeneratedCssLayer => {
        const media: Record<string, string[]> = {};

        bucket.media.forEach((set, bp) => {
          media[bp] = Array.from(set);
        });

        return {
          base: Array.from(bucket.base),
          media,
        };
      };

      let finalGeneratedCss: GeneratedCSS = {
        components: toLayerObject(layerSets.components),
        styles: toLayerObject(layerSets.styles),
        utilities: toLayerObject(layerSets.utilities),
      };

      // 5. Pre-injection hooks
      for (const p of this.plugins) {
        if (p.onBeforeInject) {
          finalGeneratedCss = p.onBeforeInject(finalGeneratedCss, this);
        }
      }

      // 6. Build layer strings and inject into style tag
      const buildLayer = (layerName: string, { base, media }: GeneratedCssLayer): string => {
        const mediaQueries = Object.entries(media)
          .map(([size, rules]) => `@media (min-width: ${size}) {\n  ${rules.join('\n  ')}\n}`)
          .join('\n');
        const content = [...base, mediaQueries].filter(Boolean).join('\n');

        return content ? `@layer ${layerName} {\n${content}\n}` : '';
      };

      const finalCss = [
        buildLayer('components', finalGeneratedCss.components),
        buildLayer('styles', finalGeneratedCss.styles),
        buildLayer('utilities', finalGeneratedCss.utilities),
      ]
        .filter(Boolean)
        .join('\n\n');

      let styleTag = document.getElementById('z-interactive-styles') as HTMLStyleElement | null;

      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'z-interactive-styles';
        styleTag.setAttribute('data-z-runtime-managed', 'true');
        document.head.appendChild(styleTag);
      }

      // Guard against no-op DOM textContent replacement to avoid unnecessary style recalculation
      if (styleTag.textContent !== finalCss) {
        styleTag.textContent = finalCss;
      }

      // 7. Post-injection hooks
      for (const p of this.plugins) {
        if (p.onAfterInject) {
          p.onAfterInject(this);
        }
      }

      // 8. Flush per-plugin debug diagnostics if debug mode is enabled
      if (this.isDebug()) {
        console.groupCollapsed(
          `[zRuntime] Debug scan complete (${this.debugWarnings.length} issue(s) found)`,
        );

        if (this.debugWarnings.length === 0) {
          console.log('[zRuntime] All interactive classes and variables are valid.');
        } else {
          for (const w of this.debugWarnings) {
            if (w.element) {
              console.warn(`[zRuntime:${w.plugin}] ${w.message}`, w.element);
            } else {
              console.warn(`[zRuntime:${w.plugin}] ${w.message}`);
            }
          }
        }
        console.groupEnd();
      }
    } catch (e) {
      console.error('[zRuntime] Error generating styles:', e);
    }
  }

  getCache(): Map<string, CssRule> {
    return this.ruleCache;
  }

  getRules(): Rule[] {
    return this.rules;
  }
}

// ============================================================================
// Bootstrap & Global Initialization
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).zRuntime = (window as any).zRuntime || {};
}

const runtime = new ZRuntimeCore(defaultRules)
  .use(clsPreventionPlugin)
  .use(customRulesPlugin)
  .use(inlineVarsPlugin)
  .use(domExtractorPlugin)
  .use(safelistPlugin)
  .use(arbitraryPropertiesPlugin);

function init(): void {
  const customRulesCount = ((window as any).zRuntime?.customRules || []).length;

  if (customRulesCount > 0) {
    console.info(`[zRuntime] Loaded ${customRulesCount} custom rule(s)`);
  }

  runtime.generate();
}

if (typeof window !== 'undefined') {
  Object.assign((window as any).zRuntime, {
    refresh: () => runtime.refresh(),
    regenerate: () => runtime.generate(),
    getCache: () => runtime.getCache(),
    getRules: () => runtime.getRules(),
    decoder,
    encoder,
    escaper,
    variable,
    _core: runtime,
    _initialized: true,
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export type { ZRuntimeCore };

export default typeof window !== 'undefined' ? (window as any).zRuntime : {};
