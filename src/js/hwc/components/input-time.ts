import { type PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { validateTime } from '../helpers/date';
import { InputMixin } from './shared/input';
import { Base } from './shared/base';

interface Cls extends Record<string, string> {
  container: string;
  input: string;
  'hour-input': string;
  'minute-input': string;
  separator: string;
  'meridiem-button': string;
  button: string;
}

interface Stl extends Record<string, string> {
  container: string;
  input: string;
  'hour-input': string;
  'minute-input': string;
  separator: string;
  'meridiem-button': string;
  button: string;
}

@customElement('z-input-time')
export class InputTime extends InputMixin(Base) {
  protected readonly 'cls-default-element' = 'container';

  protected readonly 'stl-default-element' = 'container';

  protected readonly 'input-event' = 'z-input-time:input';

  @property({ type: Boolean })
  autofocus: boolean = false;

  @property({ type: Boolean })
  now: boolean = false;

  @property({ type: String })
  clock: '12h' | '24h' = '12h';

  @property({ type: String })
  min: string = '';

  @property({ type: String })
  max: string = '';

  @state()
  protected $hour: number | undefined;

  @state()
  protected $min: number = 0;

  @state()
  protected $meridiem: 'am' | 'pm' = 'am';

  private readonly defaultI18n = {
    am: 'AM',
    pm: 'PM',
    'hour-label': 'Hour',
    'minute-label': 'Minute',
    'meridiem-label': 'AM/PM',
    'time-label': 'Time',
    'hour-placeholder': 'HH',
    'minute-placeholder': 'MM',
    'invalid-time': 'Invalid time format',
  };

  @state()
  protected $cls: Cls = {
    container: 'z-input-time',
    input: 'z-input',
    'hour-input': '',
    'minute-input': '',
    separator: '',
    'meridiem-button': 'z-input-fake',
    button: '',
  };

  @state()
  protected $stl: Stl = {
    container: '',
    input: '',
    'hour-input': '',
    'minute-input': '',
    separator: '',
    'meridiem-button': '',
    button: '',
  };

  get $HH(): string {
    return this.$hour !== undefined ? this.$hour.toString().padStart(2, '0') : '00';
  }

  get $MM(): string {
    return this.$min >= 0 ? this.$min.toString().padStart(2, '0') : '00';
  }

  protected get $value(): string {
    if (this.$hour === undefined || this.$hour === null) {
      return '';
    }

    let hour = this.$hour;

    if (this.clock === '12h') {
      if (this.$meridiem === 'pm') {
        hour = this.$hour === 12 ? 12 : this.$hour + 12;
      } else {
        hour = this.$hour === 12 ? 0 : this.$hour;
      }
    }

    return `${hour.toString().padStart(2, '0')}:${this.$min.toString().padStart(2, '0')}`;
  }

  protected get $text(): string {
    return '';
  }

  protected initializeValue(): void {
    if (this.value) {
      this.parseTimeValue();
    } else if (this.now) {
      this.setCurrentTime();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    if (['$hour', '$min', '$meridiem'].some(property => changedProperties.has(property))) {
      this.emit();
    }
  }

  private parseTimeValue(): void {
    try {
      const validatedTime = validateTime(this.value);
      const [hours, minutes] = validatedTime.split(':').map(Number);

      if (this.clock === '12h') {
        this.$hour = hours % 12 || 12;
      } else {
        this.$hour = hours;
      }

      this.$min = minutes;
      this.$meridiem = hours < 12 ? 'am' : 'pm';
    } catch (error) {
      console.error(this.getI18nText('invalid-time', this.defaultI18n), error);
    }
  }

  private setCurrentTime(): void {
    const date = new Date();

    if (this.clock === '12h') {
      this.$hour = date.getHours() % 12 || 12;
    } else {
      this.$hour = date.getHours();
    }

    this.$min = date.getMinutes();
    this.$meridiem = date.getHours() < 12 ? 'am' : 'pm';
  }

  private isTimeValid(): boolean {
    const currentValue = this.$value;

    if (!currentValue) {
      return true;
    }

    if (this.min && currentValue < this.min) {
      return false;
    }

    if (this.max && currentValue > this.max) {
      return false;
    }

    return true;
  }

  private handleInput(e: Event, state: '$hour' | '$min'): void {
    const input = e.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '').substring(0, 2);
    const numValue = parseInt(value);

    switch (state) {
      case '$hour':
        if (this.clock === '12h') {
          this.$hour = numValue <= 12 ? numValue : 12;
        } else {
          this.$hour = numValue <= 23 ? numValue : 23;
        }
        break;
      case '$min':
        this.$min = numValue <= 59 ? numValue : 59;
        break;
    }
    input.value = value;
  }

  private handleBlur(e: Event, state: '$hour' | '$min'): void {
    const input = e.target as HTMLInputElement;
    const numValue = parseInt(input.value);

    switch (state) {
      case '$hour':
        if (input.value === '') {
          if (!this.required) {
            this.$hour = undefined;
          } else {
            input.value = this.$HH;
          }

          return;
        }

        if (this.clock === '12h' && numValue > 12) {
          this.$hour = 12;
          input.value = '12';
        } else if (this.clock === '12h' && numValue === 0) {
          this.$hour = 12;
          input.value = '12';
        } else if (this.clock === '24h' && numValue > 23) {
          this.$hour = 23;
          input.value = '23';
        } else {
          input.value = this.$HH;
        }
        break;

      case '$min':
        if (numValue > 59) {
          this.$min = 59;
        }
        input.value = this.$MM;
        break;
    }
  }

  private handleKeydown(e: KeyboardEvent, state: '$hour' | '$min'): void {
    const input = e.target as HTMLInputElement;
    const currentValue = state === '$hour' ? this.$hour : this.$min;

    if (currentValue === undefined && state === '$hour') {
      return;
    }

    let delta = 0;
    let shouldPrevent = false;

    switch (e.key) {
      case 'ArrowUp':
        delta = 1;
        shouldPrevent = true;
        break;
      case 'ArrowDown':
        delta = -1;
        shouldPrevent = true;
        break;
      case 'PageUp':
        delta = state === '$hour' ? 1 : 15;
        shouldPrevent = true;
        break;
      case 'PageDown':
        delta = state === '$hour' ? -1 : -15;
        shouldPrevent = true;
        break;
    }

    if (shouldPrevent && delta !== 0) {
      e.preventDefault();

      if (state === '$hour') {
        const maxHour = this.clock === '12h' ? 12 : 23;
        const minHour = this.clock === '12h' ? 1 : 0;
        let newHour = (this.$hour || 0) + delta;

        if (newHour > maxHour) {
          newHour = minHour;
        }

        if (newHour < minHour) {
          newHour = maxHour;
        }

        this.$hour = newHour;
        input.value = newHour.toString().padStart(2, '0');
      } else {
        let newMin = this.$min + delta;

        if (newMin > 59) {
          newMin = 0;
        }

        if (newMin < 0) {
          newMin = 59;
        }

        this.$min = newMin;
        input.value = newMin.toString().padStart(2, '0');
      }
    }
  }

  private toggleMeridiem(): void {
    this.$meridiem = this.$meridiem === 'am' ? 'pm' : 'am';
  }

  private handleMeridiemKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      this.toggleMeridiem();
    }
  }

  private renderInput(options: {
    min: number;
    max: number;
    state: '$hour' | '$min';
    key: '$HH' | '$MM';
  }) {
    const { min, max, state, key } = options;
    const isHour = state === '$hour';

    const value = isHour
      ? this.$hour !== undefined
        ? this.$hour.toString().padStart(2, '0')
        : ''
      : this.$hour === undefined
        ? ''
        : this.$min >= 0
          ? this.$min.toString().padStart(2, '0')
          : '00';

    const label = this.getI18nText(isHour ? 'hour-label' : 'minute-label', this.defaultI18n);

    const placeholder = this.getI18nText(
      isHour ? 'hour-placeholder' : 'minute-placeholder',
      this.defaultI18n,
    );

    const inputClass = isHour
      ? this.$cls['hour-input'] || this.$cls['input'] || ''
      : this.$cls['minute-input'] || this.$cls['input'] || '';

    const inputStyle = isHour
      ? this.$stl['hour-input'] || this.$stl['input'] || ''
      : this.$stl['minute-input'] || this.$stl['input'] || '';

    return html`
      <input
        class="${inputClass}"
        style="${inputStyle}"
        data-key="${key}"
        data-field="${state}"
        type="number"
        inputmode="numeric"
        role="spinbutton"
        aria-label="${label}"
        aria-valuemin="${min}"
        aria-valuemax="${max}"
        aria-valuenow="${isHour ? this.$hour || 0 : this.$min}"
        aria-invalid="${!this.isTimeValid()}"
        min="${min}"
        max="${max}"
        step="1"
        placeholder="${placeholder}"
        maxlength="2"
        value="${value}"
        .autofocus="${isHour && this.autofocus}"
        ?disabled="${this.disabled || (!isHour && this.$hour === undefined)}"
        @keydown="${(e: KeyboardEvent) => this.handleKeydown(e, state)}"
        @input="${(e: Event) => this.handleInput(e, state)}"
        @blur="${(e: Event) => this.handleBlur(e, state)}"
      />
    `;
  }

  render() {
    const timeLabel = this.getI18nText('time-label', this.defaultI18n);
    const meridiemLabel = this.getI18nText('meridiem-label', this.defaultI18n);

    let meridiemButton = html``;

    if (this.clock === '12h') {
      const amLabel = this.getI18nText('am', this.defaultI18n);
      const pmLabel = this.getI18nText('pm', this.defaultI18n);
      const currentLabel = this.$meridiem === 'am' ? amLabel : pmLabel;

      meridiemButton = html`
        <button
          class="${this.$cls['meridiem-button'] || this.$cls['button'] || ''}"
          style="${this.$stl['meridiem-button'] || this.$stl['button'] || ''}"
          data-key="meridiem"
          data-meridiem="${this.$meridiem}"
          type="button"
          role="switch"
          aria-label="${meridiemLabel}"
          aria-checked="${this.$meridiem === 'pm'}"
          ?disabled="${this.disabled || this.$hour === undefined}"
          @click="${(e: MouseEvent) => {
            e.preventDefault();
            this.toggleMeridiem();
          }}"
          @keydown="${this.handleMeridiemKeydown}"
        >
          ${currentLabel}
        </button>
      `;
    }

    return html`
      <div
        data-host-inner
        class="${this.$cls['container'] || ''}"
        style="${this.$stl['container'] || ''}"
        role="group"
        aria-label="${timeLabel}"
        data-disabled="${this.disabled}"
        data-clock="${this.clock}"
        data-valid="${this.isTimeValid()}"
      >
        ${this.renderInput({
          min: this.clock === '12h' ? 1 : 0,
          max: this.clock === '12h' ? 12 : 23,
          state: '$hour',
          key: '$HH',
        })}
        <span
          class="${this.$cls['separator'] || ''}"
          style="${this.$stl['separator'] || ''}"
          aria-hidden="true"
        >
          :
        </span>
        ${this.renderInput({
          min: 0,
          max: 59,
          state: '$min',
          key: '$MM',
        })}
        ${meridiemButton} ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-input-time': InputTime;
  }
}
