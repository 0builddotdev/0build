import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { parseOptions } from '../../helpers/options';
import { selectToObject, type OptionGrouped } from '../../helpers/select';

let __GI18N__: { [key: string]: string } | null = null;

let __IS_GI18N_INITIALIZED__: boolean = false;

export abstract class Base extends LitElement {
  @property({ type: String })
  cls: string = '';

  @property({ type: String })
  stl: string = '';

  @property({ type: String })
  i18n: string = '';

  @property({ type: String })
  floating: string = '';

  @property({ type: Boolean })
  'force-prevent-rerender': boolean = false;

  @state()
  protected $i18n: { [key: string]: string } = {};

  @state()
  protected $floating: Record<string, any> = {
    offset: 4,
    placement: 'bottom-start',
    flip: true,
    shift: true,
    shiftPadding: 5,
  };

  @state()
  protected $cls: { [key: string]: string } = {};

  @state()
  protected $stl: { [key: string]: string } = {};

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
        text = (componentI18n as any)[key];
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
      const floating = parseOptions(this.floating) as Record<string, any>;

      if (typeof floating === 'object' && floating !== null) {
        // Ensure numeric values are parsed correctly from string attributes
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

  private initializeCls(): void {
    if (this.cls) {
      const cls = parseOptions(this.cls) as { [key: string]: string } | string;

      if (typeof cls === 'string') {
        this.$cls[this['cls-default-element']] = cls;
      } else {
        Object.keys(cls).forEach(key => {
          this.$cls[key] = cls[key];
        });
      }
    }
  }

  private initializeStl(): void {
    if (this.stl) {
      const stl = parseOptions(this.stl) as { [key: string]: string } | string;

      if (typeof stl === 'string') {
        this.$stl[this['stl-default-element']] = stl;
      } else {
        Object.keys(stl).forEach(key => {
          this.$stl[key] = stl[key];
        });
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

  private initializeConfig(): void {
    this.HTMLScript = this.querySelector('script[data-fn="config"][type="application/json"]');
  }

  private initializeIcons(): void {
    this.HTMLIconContainer = this.querySelector('template[data-fn="icons"]');
  }

  private initializeTemplate(): void {
    this.HTMLTemplateContainer = this.querySelector('template[data-fn="template"]');
  }

  private initializeDataSource(): void {
    this.HTMLDataSource = this.querySelector('select[data-fn="data-source"]');
  }

  private parseIcons(): void {
    if (!this.HTMLIconContainer) {
      return;
    }

    const icons = this.HTMLIconContainer.content.querySelectorAll('[data-key]');

    icons.forEach(iconElement => {
      const key = iconElement.getAttribute('data-key');

      if (key) {
        const clonedIcon = iconElement.cloneNode(true) as Element;

        clonedIcon.removeAttribute('data-key');

        const iconHTML = clonedIcon.outerHTML;

        this.$i.set(key, html`${unsafeHTML(iconHTML)}`);
      }
    });
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
          if ('i18n' in this.$config) {
            const configI18n = (this.$config as any).i18n;

            if (typeof configI18n === 'object' && configI18n !== null) {
              this.$i18n = { ...this.$i18n, ...configI18n };
            }
          }

          if ('cls' in this.$config) {
            const configCls = (this.$config as any).cls;

            if (typeof configCls === 'string') {
              this.$cls[this['cls-default-element']] = configCls;
            } else if (typeof configCls === 'object' && configCls !== null) {
              this.$cls = { ...this.$cls, ...configCls };
            }
          }

          if ('stl' in this.$config) {
            const configStl = (this.$config as any).stl;

            if (typeof configStl === 'string') {
              this.$stl[this['stl-default-element']] = configStl;
            } else if (typeof configStl === 'object' && configStl !== null) {
              this.$stl = { ...this.$stl, ...configStl };
            }
          }

          if ('floating' in this.$config) {
            const configFloating = (this.$config as any).floating;

            if (typeof configFloating === 'object' && configFloating !== null) {
              this.$floating = { ...this.$floating, ...configFloating };
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
    this.initializeCls();
    this.initializeStl();
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

  protected 'cls-default-element': string = 'host-inner';

  protected 'stl-default-element': string = 'host-inner';

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
