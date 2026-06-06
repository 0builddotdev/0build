import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { validateDate, formatDate } from '../helpers/date';
import { BaseCalendarMixin } from './shared/base-calendar';
import { InputMixin } from './shared/input';
import { Base } from './shared/base';
import { DropdownMixin } from './shared/dropdown';

interface Cls extends Record<string, string> {
  container: string;
  button: string;
  'button-text': string;
  icon: string;
  dropdown: string;
  calendar: string;
  'time-wrapper': string;
  time: string;
}

interface Stl extends Record<string, string> {
  container: string;
  button: string;
  'button-text': string;
  icon: string;
  dropdown: string;
  calendar: string;
  'time-wrapper': string;
  time: string;
}

@customElement('z-input-date')
export class InputDate extends BaseCalendarMixin(DropdownMixin(InputMixin(Base))) {
  protected 'cls-default-element' = 'button';
  protected 'stl-default-element' = 'button';
  protected 'input-event' = 'z-input-date:change';

  @property({ type: String, attribute: 'display-format' })
  'display-format': string = 'MMMM DD, YYYY';

  @property({ type: Boolean, attribute: 'with-time' })
  'with-time': boolean = false;

  @property({ type: String })
  clock: '12h' | '24h' = '12h';

  @property({ type: Boolean, attribute: 'require-time' })
  'require-time': boolean = false;

  @state()
  private $date: string | undefined;

  @state()
  private $time: string | undefined;

  @state()
  protected $cls: Cls = {
    container: '',
    button: '',
    'button-text': '',
    icon: '',
    dropdown: 'z-dropdown z-datepicker-dropdown',
    calendar: '',
    'time-wrapper': 'z-datepicker-time',
    time: '',
  };

  @state()
  protected $stl: Stl = {
    container: '',
    button: '',
    'button-text': '',
    icon: '',
    dropdown: '',
    calendar: '',
    'time-wrapper': '',
    time: '',
  };

  private readonly defaultI18n = {
    'button-label': 'Select date',
    'dialog-label': 'Date picker',
    selected: 'selected',
    placeholder: 'Select a date',
    'placeholder-with-time': 'Select a date and time',
  };

  protected get $value(): string {
    if (this.$date && this.$time) {
      return `${this.$date}T${this.$time}`;
    }

    if (this.$date) {
      return this.$date;
    }

    return '';
  }

  protected get $text(): string {
    if (this.$value) {
      try {
        const dateValue = this.$value.includes('T')
          ? new Date(this.$value)
          : new Date(this.$value + 'T00:00:00');

        let displayFormat = this['display-format'];

        if (this['with-time'] && this.$time) {
          const timeFormat = this.clock === '12h' ? 'h:mm A' : 'HH:mm';

          displayFormat = `${this['display-format']} ${timeFormat}`;
        }

        return formatDate(dateValue, displayFormat, this.lang);
      } catch (error) {
        console.error('[z-input-date] Failed to format date:', error);

        return this.$value;
      }
    }

    if (this.placeholder) {
      return this.placeholder;
    }

    return this.getI18nText(
      this['with-time'] ? 'placeholder-with-time' : 'placeholder',
      this.defaultI18n,
    );
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.closeDropdown();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated?.(_changedProperties);

    this.HTMLButton = this.renderRoot.querySelector('button');
    this.HTMLDrop = this.renderRoot.querySelector('[data-part="dropdown"]');

    this.renderRoot.querySelector('z-calendar')?.addEventListener('z-calendar:change', (e: any) => {
      this.$date = e.detail.value;
    });

    if (this['with-time']) {
      this.renderRoot
        .querySelector('z-input-time')
        ?.addEventListener('z-input-time:input', (e: any) => {
          this.$time = e.detail.value;
        });
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('$date') || changedProperties.has('$time')) {
      this.emit();
    }
  }

  private onButtonClick = () => {
    if (this.disabled) {
      return;
    }

    this.$open = !this.$open;
  };

  protected initializeValue(): void {
    if (this.value) {
      try {
        validateDate(this.value);

        const hasTime = this.value.includes('T');

        if (!hasTime) {
          this.$date = this.value;
        } else {
          const [datePart, timePart] = this.value.split('T');

          this.$date = datePart;
          this.$time = timePart;
        }
      } catch (error) {
        console.error('[z-input-date] Failed to initialize date value:', error);
      }
    }
  }

  private get buttonLabel(): string {
    const baseLabel = this.getI18nText('button-text', this.defaultI18n);

    if (this.$value) {
      return `${baseLabel}, ${this.getI18nText('selected', this.defaultI18n)}: ${this.$text}`;
    }

    return baseLabel;
  }

  render() {
    const ariaLabel = this.getI18nText('dialog-label', this.defaultI18n);

    return html`
      <div
        data-host-inner
        data-part="host-inner"
        class="${this.$cls.container}"
        style="${this.$stl.container}"
      >
        <div class="z-position-relative">
          <button
            data-part="button"
            class="${this.$cls.button}"
            style="${this.$stl.button}"
            type="button"
            ?disabled=${this.disabled}
            aria-label="${this.buttonLabel}"
            aria-haspopup="dialog"
            aria-expanded="${this.$open}"
            @click="${this.onButtonClick}"
          >
            <span
              data-part="button-text"
              class="${this.$cls['button-text']}"
              style="${this.$stl['button-text']}"
            >
              ${this.$text}
            </span>
            <span data-part="icon" class="${this.$cls.icon}" style="${this.$stl.icon}">
              ${this.$icons('calendar') || nothing}
            </span>
          </button>

          <div
            data-part="dropdown"
            class="${this.$cls.dropdown}"
            style="${this.$stl.dropdown}"
            ?hidden="${!this.$open}"
            role="dialog"
            aria-label="${ariaLabel}"
          >
            <z-calendar
              data-part="calendar"
              class="${this.$cls.calendar}"
              style="${this.$stl.calendar}"
              .starts-with=${this['starts-with']}
              .disabled-dates=${this['disabled-dates']}
              .marked-dates=${this['marked-dates']}
              .i18n=${this.i18n}
              .view-date=${this['view-date']}
              .min=${this.min}
              .max=${this.max}
              .value=${this.$date || ''}
              ?today=${this.today}
              ?jumpable=${this.jumpable}
              .weekday-format=${this['weekday-format']}
              .lang=${this.lang}
            ></z-calendar>

            ${this.renderTimeInput()}
          </div>
        </div>

        ${this.renderHidden()}
      </div>
    `;
  }

  private renderTimeInput() {
    if (!this['with-time']) {
      return nothing;
    }

    return html`
      <div
        data-part="time-wrapper"
        class="${this.$cls['time-wrapper']}"
        style="${this.$stl['time-wrapper']}"
      >
        <z-input-time
          data-part="time"
          class="${this.$cls['time']}"
          style="${this.$stl['time']}"
          ?required=${this['require-time']}
          .i18n=${this.i18n}
          .value=${this.$time || ''}
          .clock=${this.clock}
          .lang=${this.lang}
          .now=${this.today}
        ></z-input-time>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-input-date': InputDate;
  }
}
