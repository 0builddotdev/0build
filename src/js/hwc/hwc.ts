import { html, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { parseOptions } from '../shared/helpers/options';
import { selectToObject, type OptionGrouped } from '../shared/helpers/select';
import { Base } from '../shared/base';

let __GI18N__: { [key: string]: string } | null = null;
let __IS_GI18N_INITIALIZED__: boolean = false;

let __GICONS__: Map<string, TemplateResult> | null = null;
let __IS_GICONS_INITIALIZED__: boolean = false;

export abstract class Hwc extends Base {
  @property({ type: String })
  i18n: string = '';

  @property({ type: String })
  floating: string = '';

  @property({ type: Boolean })
  'force-prevent-rerender': boolean = false;

  @state()
  protected $i18n: { [key: string]: string } = {};

  @state()
  protected $floating: Record<string, unknown> = {
    offset: 4,
    placement: 'bottom-start',
    flip: true,
    shift: true,
    shiftPadding: 5,
  };

  @state()
  protected $config: object = {};

  @state()
  protected $i: Map<string, TemplateResult> = new Map();

  @state()
  protected $template: string = '';

  @state()
  protected $data: OptionGrouped = {};

  protected isRendered: boolean = false;

  protected HTMLScript: HTMLScriptElement | null = null;

  protected HTMLIconContainer: HTMLTemplateElement | null = null;

  protected HTMLTemplateContainer: HTMLTemplateElement | null = null;

  protected HTMLDataSource: HTMLSelectElement | null = null;

  protected configObserver: MutationObserver | null = null;

  protected dataSourceObserver: MutationObserver | null = null;

  protected get $normalizedI18n(): { [key: string]: string | string[] } {
    const normalized: { [key: string]: string | string[] } = {};

    Object.keys(this.$i18n).forEach(key => {
      const value = this.$i18n[key];

      normalized[key] = value.includes(',') ? value.split(',').map(item => item.trim()) : value;
    });

    return normalized;
  }

  protected $icons(icon: string): TemplateResult | undefined {
    return this.$i.get(icon);
  }

  protected getI18nText(
    key: string,
    defaults: { [key: string]: string } = {},
    replacements?: { [key: string]: string | number } | number,
  ): string {
    let text = this.$i18n[key];

    if (!text) {
      const componentName = this.tagName.toLowerCase();
      const componentI18n = this.$i18n[componentName];

      if (typeof componentI18n === 'object' && componentI18n !== null && key in componentI18n) {
        const val = (componentI18n as Record<string, unknown>)[key];

        if (typeof val === 'string') {
          text = val;
        }
      }
    }

    if (!text) {
      text = defaults[key] || '';
    }

    if (replacements !== undefined) {
      if (typeof replacements === 'number') {
        text = text.replace('{n}', String(replacements));
      } else {
        Object.keys(replacements).forEach(placeholder => {
          const value = replacements[placeholder];

          text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
        });
      }
    }

    return text;
  }

  private initializeFloating(): void {
    if (this.floating) {
      const floating = parseOptions(this.floating) as Record<string, unknown>;

      if (typeof floating === 'object' && floating !== null) {
        if (floating.offset !== undefined) {
          floating.offset = Number(floating.offset);
        }

        if (floating.shiftPadding !== undefined) {
          floating.shiftPadding = Number(floating.shiftPadding);
        }

        this.$floating = { ...this.$floating, ...floating };
      }
    }
  }

  private initializeGI18n(): void {
    if (__IS_GI18N_INITIALIZED__) {
      return;
    }

    __IS_GI18N_INITIALIZED__ = true;

    const scriptEl = document.getElementById('z-i18n');

    if (scriptEl && scriptEl.textContent) {
      try {
        __GI18N__ = JSON.parse(scriptEl.textContent);
      } catch (e) {
        console.error('Failed to parse global i18n from <script id="z-i18n">.', e);
        __GI18N__ = {};
      }
    } else {
      __GI18N__ = {};
    }
  }

  private initializeI18n(): void {
    this.initializeGI18n();

    const LI18N = this.i18n ? parseOptions(this.i18n) : {};

    if (typeof LI18N === 'object' && LI18N !== null) {
      this.$i18n = Object.assign({}, __GI18N__, LI18N);
    }
  }

  private extractIconsFromTemplate(
    template: HTMLTemplateElement,
    targetMap: Map<string, TemplateResult>,
  ): void {
    const icons = template.content.querySelectorAll('[data-key]');

    icons.forEach(iconElement => {
      const key = iconElement.getAttribute('data-key');

      if (key) {
        const clonedIcon = iconElement.cloneNode(true) as Element;

        clonedIcon.removeAttribute('data-key');

        const iconHTML = clonedIcon.outerHTML;

        targetMap.set(key, html`${unsafeHTML(iconHTML)}`);
      }
    });
  }

  private initializeGIcons(): void {
    if (__IS_GICONS_INITIALIZED__) {
      return;
    }

    __IS_GICONS_INITIALIZED__ = true;
    __GICONS__ = new Map();

    const templateEl = document.getElementById('z-icons');

    if (templateEl instanceof HTMLTemplateElement) {
      this.extractIconsFromTemplate(templateEl, __GICONS__);
    }
  }

  private initializeConfig(): void {
    this.HTMLScript = this.querySelector(
      ':scope > script[data-fn="config"][type="application/json"]',
    );
  }

  private initializeIcons(): void {
    this.initializeGIcons();

    // Seed with a shallow clone of global icons so local overrides don't mutate __GICONS__
    this.$i = new Map(__GICONS__);

    this.HTMLIconContainer = this.querySelector(':scope > template[data-fn="icons"]');
  }

  private initializeTemplate(): void {
    this.HTMLTemplateContainer = this.querySelector(':scope > template[data-fn="template"]');
  }

  private initializeDataSource(): void {
    this.HTMLDataSource = this.querySelector(':scope > select[data-fn="data-source"]');
  }

  private parseIcons(): void {
    if (!this.HTMLIconContainer) {
      return;
    }

    // Overwrites matching keys from __GICONS__ while keeping the rest intact
    this.extractIconsFromTemplate(this.HTMLIconContainer, this.$i);
  }

  private parseTemplate(): void {
    if (!this.HTMLTemplateContainer) {
      return;
    }

    this.$template = this.HTMLTemplateContainer.innerHTML.trim();
  }

  protected parseConfig(): void {
    if (this.HTMLScript) {
      try {
        const content = this.HTMLScript.textContent;

        this.$config = content ? JSON.parse(content) : {};

        if (this.$config && typeof this.$config === 'object') {
          const configObj = this.$config as Record<string, unknown>;

          if ('i18n' in configObj) {
            const configI18n = configObj.i18n;

            if (typeof configI18n === 'object' && configI18n !== null) {
              this.$i18n = { ...this.$i18n, ...(configI18n as { [key: string]: string }) };
            }
          }

          if ('cls' in configObj) {
            this.syncCls(true);
            this.applyClsOverride(configObj.cls);
          }

          if ('stl' in configObj) {
            this.syncStl(true);
            this.applyStlOverride(configObj.stl);
          }

          if ('floating' in configObj) {
            const configFloating = configObj.floating;

            if (typeof configFloating === 'object' && configFloating !== null) {
              this.$floating = {
                ...this.$floating,
                ...(configFloating as Record<string, unknown>),
              };
            }
          }
        }
      } catch (error) {
        console.warn(`${this.tagName.toLowerCase()}: Failed to parse config JSON:`, error);

        this.$config = {};
      }
    }
  }

  private parseDataSource(): void {
    if (!this.HTMLDataSource) {
      return;
    }

    this.$data = selectToObject(this.HTMLDataSource);
  }

  private initializeConfigObserver(): void {
    if (!this.HTMLScript || !this.HTMLScript.hasAttribute('data-reactive')) {
      return;
    }

    this.configObserver = new MutationObserver(() => {
      this.parseConfig();
      this.onConfigChanged();
    });

    this.configObserver.observe(this.HTMLScript, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  private initializeDataSourceObserver(): void {
    if (!this.HTMLDataSource || !this.HTMLDataSource.hasAttribute('data-reactive')) {
      return;
    }

    this.dataSourceObserver = new MutationObserver(() => {
      this.parseDataSource();
      this.onDataSourceChanged();
    });

    this.dataSourceObserver.observe(this.HTMLDataSource, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  protected onConfigChanged(): void {}

  protected onDataSourceChanged(): void {}

  connectedCallback(): void {
    super.connectedCallback();

    if (this['force-prevent-rerender']) {
      const existing = this.querySelector('[data-host-inner]');

      if (existing) {
        this.isRendered = true;
      }
    }

    this.initializeI18n();
    this.initializeConfig();
    this.initializeIcons();
    this.initializeTemplate();
    this.initializeDataSource();
    this.initializeFloating();

    if (this.HTMLScript) {
      this.parseConfig();
      this.initializeConfigObserver();
    }

    if (this.HTMLIconContainer) {
      this.parseIcons();
    }

    if (this.HTMLTemplateContainer) {
      this.parseTemplate();
    }

    if (this.HTMLDataSource) {
      this.parseDataSource();
      this.initializeDataSourceObserver();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.configObserver) {
      this.configObserver.disconnect();
      this.configObserver = null;
    }

    if (this.dataSourceObserver) {
      this.dataSourceObserver.disconnect();
      this.dataSourceObserver = null;
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (
      changedProperties.has('cls') &&
      this.$config &&
      typeof this.$config === 'object' &&
      'cls' in this.$config
    ) {
      this.applyClsOverride((this.$config as Record<string, unknown>).cls);
    }

    if (
      changedProperties.has('stl') &&
      this.$config &&
      typeof this.$config === 'object' &&
      'stl' in this.$config
    ) {
      this.applyStlOverride((this.$config as Record<string, unknown>).stl);
    }
  }

  protected shouldUpdate(changedProperties: PropertyValues): boolean {
    if (this['force-prevent-rerender'] && this.isRendered) {
      return false;
    }

    return super.shouldUpdate(changedProperties);
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isRendered) {
      this.isRendered = true;
    }
  }
}
