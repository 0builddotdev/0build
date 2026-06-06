import { type PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

type LSHConfig = {
  [group: string]: string;
};

interface Cls extends Record<string, string> {
  button: string;
}

interface Stl extends Record<string, string> {
  button: string;
}

@customElement('z-lsh')
export class Lsh extends Base {
  protected 'cls-default-element' = 'button';

  protected 'stl-default-element' = 'button';

  protected readonly 'change-event': string = 'z-lsh:change';

  protected readonly 'before-change-event': string = 'z-lsh:before-change';

  private readonly defaultI18n = {
    'aria-label': 'Toggle theme',
    'active-label': 'Active',
    'switch-to-dark': 'Switch to dark mode',
    'switch-to-light': 'Switch to light mode',
  };

  @property({ type: String })
  value: string = '';

  @property({ type: String })
  group: string = '';

  @property({ type: Boolean })
  'prevent-autoupdate': boolean = false;

  @property({ type: Boolean })
  toggle: boolean = false;

  @state()
  private isActive: boolean = false;

  @state()
  private lshConfig: LSHConfig = {};

  @state()
  protected $cls: Cls = {
    button: 'z-lsh',
  };

  @state()
  protected $stl: Stl = {
    button: '',
  };

  private boundHandleExternalChange = this.handleExternalChange.bind(this);

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeConfiguration();
    this.updateActiveState();

    if (!this['prevent-autoupdate']) {
      document.addEventListener(
        'z-lsh:change' as keyof DocumentEventMap,
        this.boundHandleExternalChange,
      );
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener(
      'z-lsh:change' as keyof DocumentEventMap,
      this.boundHandleExternalChange,
    );
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('value') || changedProperties.has('group')) {
      this.updateActiveState();
    }

    if (changedProperties.has('prevent-autoupdate')) {
      if (this['prevent-autoupdate']) {
        document.removeEventListener(
          'z-lsh:change' as keyof DocumentEventMap,
          this.boundHandleExternalChange,
        );
      } else {
        document.addEventListener(
          'z-lsh:change' as keyof DocumentEventMap,
          this.boundHandleExternalChange,
        );
      }
    }
  }

  private initializeConfiguration(): void {
    this.lshConfig['mode'] = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    const storedConfig = localStorage.getItem('__Z_THEME__');

    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);

        Object.keys(parsed).forEach(key => {
          this.lshConfig[key] = parsed[key];
        });
      } catch (error) {
        console.warn('[z-lsh] Failed to parse stored configuration:', error);
      }
    }
  }

  private saveConfiguration(): void {
    try {
      localStorage.setItem('__Z_THEME__', JSON.stringify(this.lshConfig));
    } catch (error) {
      console.warn('[z-lsh] Failed to save configuration:', error);
    }
  }

  private emitBeforeChangeEvent(group: string, value: string, previousValue: string): boolean {
    const event = new CustomEvent(this['before-change-event'], {
      detail: {
        group,
        value,
        previousValue,
        config: { ...this.lshConfig },
      },
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    return this.dispatchEvent(event);
  }

  private emitChangeEvent(group: string, value: string, previousValue: string): void {
    this.dispatchEvent(
      new CustomEvent(this['change-event'], {
        detail: {
          group,
          value,
          previousValue,
          config: { ...this.lshConfig },
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private applyThemeValue(group: string, value: string): void {
    if (!group || !value) {
      return;
    }

    const previousValue = this.lshConfig[group] || '';

    const shouldContinue = this.emitBeforeChangeEvent(group, value, previousValue);

    if (!shouldContinue) {
      return;
    }

    const head = document.documentElement;

    this.lshConfig[group] = value;

    if (group === 'mode') {
      if (value === 'dark') {
        head.classList.add('dark');
      } else {
        head.classList.remove('dark');
      }
    } else {
      const prefix = value.split('-').slice(0, 2).join('-') + '-';
      const existingClass = Array.from(head.classList).find(cls => cls.startsWith(prefix));

      if (existingClass) {
        head.classList.remove(existingClass);
      }

      head.classList.add(value);
    }

    this.saveConfiguration();
    this.emitChangeEvent(group, value, previousValue);
  }

  private isValueActive(group: string, value: string): boolean {
    if (!group || !value) {
      return false;
    }

    if (group === 'mode') {
      const isDarkMode = document.documentElement.classList.contains('dark');

      return (value === 'dark' && isDarkMode) || (value === 'light' && !isDarkMode);
    } else {
      return this.lshConfig[group] === value;
    }
  }

  private updateActiveState(): void {
    this.isActive = this.isValueActive(this.group, this.value);
  }

  private handleExternalChange(event: Event): void {
    const customEvent = event as CustomEvent;

    if (customEvent.target === this) {
      return;
    }

    const { group, config } = customEvent.detail;

    if (config) {
      this.lshConfig = config;
    }

    if (group === this.group) {
      this.updateActiveState();
    }
  }

  private handleClick(): void {
    if (this.toggle && this.group === 'mode') {
      const currentMode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const newMode = currentMode === 'dark' ? 'light' : 'dark';

      this.applyThemeValue('mode', newMode);
    } else {
      this.applyThemeValue(this.group, this.value);
    }
    this.updateActiveState();
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick();
    }
  }

  private getAriaLabel(): string {
    if (this.toggle && this.group === 'mode') {
      const currentMode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const switchLabel =
        currentMode === 'dark'
          ? this.getI18nText('switch-to-light', this.defaultI18n)
          : this.getI18nText('switch-to-dark', this.defaultI18n);

      return `${this.getI18nText('aria-label', this.defaultI18n)} (${switchLabel})`;
    }

    const baseLabel = this.getI18nText('aria-label', this.defaultI18n);
    const valueLabel = this.value || '';
    const activeLabel = this.isActive
      ? `, ${this.getI18nText('active-label', this.defaultI18n)}`
      : '';

    return `${baseLabel}: ${valueLabel}${activeLabel}`;
  }

  render() {
    return html`
      <button
        data-part="button"
        data-host-inner
        class="${this.$cls['button']} ${this.isActive ? 'z-active' : ''}"
        style="${this.$stl['button']}"
        @click="${this.handleClick}"
        @keydown="${this.handleKeydown}"
        type="button"
        aria-label="${this.getAriaLabel()}"
        aria-pressed="${this.isActive}"
      >
        ${unsafeHTML(this.$template)}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-lsh': Lsh;
  }
}
