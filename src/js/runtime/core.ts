import { buildCssRule } from './compiler';
import { type Rule } from './registry/rules';
import { type GeneratedCSS, type ZRuntimePlugin } from './types';

export class ZRuntimeCore {
  private plugins: ZRuntimePlugin[] = [];
  private ruleCache = new Map<string, any>();
  private rules: Rule[] = [];

  private defaultRules: Rule[];

  constructor(defaultRules: Rule[]) {
    this.defaultRules = defaultRules;
  }

  use(plugin: ZRuntimePlugin) {
    this.plugins.push(plugin);

    if (plugin.onInit) {
      plugin.onInit(this);
    }

    return this;
  }

  refresh() {
    console.info('[zRuntime] Refreshing interactive styles...');
    this.ruleCache.clear();
    this.generate();
  }

  generate() {
    try {
      // 1. Load rules
      this.rules = [...this.defaultRules];
      this.plugins.forEach(p => {
        if (p.onRulesLoad) {
          this.rules = p.onRulesLoad(this.rules);
        }
      });

      const allParsedClasses: any[] = [];

      // 2. Scan DOM elements via plugins
      const nodes = document.querySelectorAll('[class]');

      nodes.forEach(node => {
        this.plugins.forEach(p => {
          if (p.onElementScan) {
            allParsedClasses.push(...p.onElementScan(node, this.rules));
          }
        });
      });

      // 3. Fetch additional classes (e.g. safelists)
      this.plugins.forEach(p => {
        if (p.onAdditionalClasses) {
          allParsedClasses.push(...p.onAdditionalClasses());
        }
      });

      // 4. Compile classes into CSS layers
      const generatedCss: GeneratedCSS = {
        components: { base: [], media: {} },
        styles: { base: [], media: {} },
        utilities: { base: [], media: {} },
      };

      allParsedClasses.forEach(parsedClass => {
        const { fullClass, state, isDark, prefix } = parsedClass;
        const ruleKey = `${fullClass}${state}${isDark ? '-dark' : ''}${prefix || ''}`;

        if (this.ruleCache.has(ruleKey)) {
          const rule = this.ruleCache.get(ruleKey)!;
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

        const rule = buildCssRule(parsedClass, this.rules);

        if (!rule) {
          return;
        }

        this.ruleCache.set(ruleKey, rule);
        const layer = rule.layer as keyof GeneratedCSS;

        if (rule.breakpoint) {
          const mediaBucket = generatedCss[layer].media;

          mediaBucket[rule.breakpoint] = mediaBucket[rule.breakpoint] || [];
          mediaBucket[rule.breakpoint].push(rule.css);
        } else {
          generatedCss[layer].base.push(rule.css);
        }
      });

      // 5. Pre-injection hooks
      let finalGeneratedCss = generatedCss;

      this.plugins.forEach(p => {
        if (p.onBeforeInject) {
          finalGeneratedCss = p.onBeforeInject(finalGeneratedCss);
        }
      });

      // 6. Build layer strings and inject into style tag
      const buildLayer = (layerName: string, { base, media }: any): string => {
        const mediaQueries = Object.entries(media)
          .map(
            ([size, rules]: [string, any]) =>
              `@media (min-width: ${size}) {\n  ${rules.join('\n  ')}\n}`,
          )
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

      styleTag.textContent = finalCss;

      // 7. Post-injection hooks
      this.plugins.forEach(p => {
        if (p.onAfterInject) {
          p.onAfterInject();
        }
      });
    } catch (e) {
      console.error('[zRuntime] Error generating styles:', e);
    }
  }

  getCache() {
    return this.ruleCache;
  }

  getRules() {
    return this.rules;
  }
}
