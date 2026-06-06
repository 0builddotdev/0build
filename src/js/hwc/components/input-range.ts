import { html, type PropertyValues } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { InputMixin } from './shared/input';
import { Base } from './shared/base';

interface Cls extends Record<string, string> {
  'host-inner': string;
  runnable: string;
  fill: string;
  knob: string;
  'knob-low': string;
  'knob-high': string;
  'knob-dragging': string;
  label: string;
  'label-top': string;
  'label-bottom': string;
}

interface Stl extends Record<string, string> {
  'host-inner': string;
  runnable: string;
  fill: string;
  knob: string;
  'knob-low': string;
  'knob-high': string;
  label: string;
  'label-top': string;
  'label-bottom': string;
}

@customElement('z-input-range')
export class InputRange extends InputMixin(Base) {
  protected readonly 'cls-default-element' = 'host-inner';

  protected readonly 'stl-default-element' = 'host-inner';

  protected readonly 'input-event' = 'z-input-range:input';

  @property({ type: Boolean })
  multiple = false;

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  @property({ type: String })
  label: string | boolean = false;

  @property({ type: String })
  'label-position': 'top' | 'bottom' = 'top';

  @property({ type: String })
  'aria-label': string = '';

  private _lowValue = this.min;

  private _highValue = this.max;

  private _label: boolean | string = false;

  private activeKnob: 'low' | 'high' | null = null;

  private trackElement: HTMLElement | null = null;

  private isDragging = false;

  private readonly defaultI18n = {
    'aria-value-text': 'Value: {value}',
    'aria-range-text': 'Range from {low} to {high}',
    'low-knob-label': 'Minimum value',
    'high-knob-label': 'Maximum value',
    'aria-label': 'Range slider',
  };

  @state()
  protected $cls: Cls = {
    'host-inner': 'z-input-range',
    runnable: '',
    fill: '',
    knob: '',
    'knob-low': '',
    'knob-high': '',
    'knob-dragging': '',
    label: '',
    'label-top': '',
    'label-bottom': '',
  };

  @state()
  protected $stl: Stl = {
    'host-inner': '',
    runnable: '',
    fill: '',
    knob: '',
    'knob-low': '',
    'knob-high': '',
    label: '',
    'label-top': '',
    'label-bottom': '',
  };

  protected get $text(): string {
    return '';
  }

  protected get $value(): string | string[] {
    return this.multiple ? this.value.split(',').map(a => a.trim()) : this.value;
  }

  private get precision(): number {
    const stepString = this.step.toString();

    if (stepString.includes('.')) {
      return stepString.split('.')[1].length;
    }

    return 0;
  }

  connectedCallback(): void {
    super.connectedCallback();
    const label = this.getAttribute('label');

    this._label = label === '' ? true : label || false;

    this.addEventListener('touchstart', this.preventScrolling, {
      passive: false,
    });
  }

  disconnectedCallback(): void {
    this.removeEventListener('touchstart', this.preventScrolling);
    this.cleanupEventListeners();
    super.disconnectedCallback?.();
  }

  protected updated(changedProps: PropertyValues) {
    if (changedProps.has('value') || changedProps.has('multiple')) {
      this.parseValue();
    }
  }

  protected initializeValue(): void {
    if (!this.value) {
      this._lowValue = this.min;
      this._highValue = this.max;
      this.value = this.multiple
        ? `${this.formatValue(this._lowValue)},${this.formatValue(this._highValue)}`
        : this.formatValue(this._lowValue);
    } else {
      this.parseValue();
    }
  }

  private parseValue(): void {
    if (this.multiple) {
      const [low, high] = this.value.split(',').map(val => parseFloat(val));

      if (low !== undefined && high !== undefined) {
        this._lowValue = this.clamp(low);
        this._highValue = this.clamp(high);
      }
    } else {
      this._lowValue = this.clamp(parseFloat(this.value));
    }
  }

  private formatValue(value: number): string {
    return value.toFixed(this.precision);
  }

  private clamp(val: number): number {
    const clamped = Math.min(Math.max(val, this.min), this.max);

    return parseFloat(clamped.toFixed(this.precision));
  }

  private valueToPercent(val: number): number {
    return ((val - this.min) / (this.max - this.min)) * 100;
  }

  private positionToValue(clientX: number): number {
    if (!this.trackElement) {
      this.trackElement = this.querySelector('[data-range-track]') as HTMLElement;
    }

    const rect = this.trackElement!.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    return this.min + percent * (this.max - this.min);
  }

  private updateValue(): void {
    this.value = this.multiple
      ? `${this.formatValue(this._lowValue)},${this.formatValue(this._highValue)}`
      : this.formatValue(this._lowValue);
    this.emit();
  }

  private handleValueChange(knob: 'low' | 'high', newValue: number): void {
    const stepped = Math.round(newValue / this.step) * this.step;

    const fixedPrecision = parseFloat(stepped.toFixed(this.precision));

    newValue = this.clamp(fixedPrecision);

    if (knob === 'low') {
      this._lowValue = this.multiple ? Math.min(newValue, this._highValue) : newValue;
    } else {
      this._highValue = Math.max(newValue, this._lowValue);
    }

    this.updateValue();
    this.requestUpdate();
  }

  private preventScrolling = (e: TouchEvent): void => {
    if (this.isDragging) {
      e.preventDefault();
    }
  };

  private onPointerStart = (e: PointerEvent | TouchEvent, knob: 'low' | 'high'): void => {
    if (this.disabled) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.activeKnob = knob;
    this.isDragging = true;

    (e.currentTarget as HTMLElement).focus();

    document.addEventListener('pointermove', this.onPointerMove, {
      passive: false,
    });
    document.addEventListener('pointerup', this.onPointerEnd);
    document.addEventListener('pointercancel', this.onPointerEnd);
    document.addEventListener('touchmove', this.onTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', this.onPointerEnd);
    document.addEventListener('touchcancel', this.onPointerEnd);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging || !this.activeKnob || this.disabled) {
      return;
    }

    e.preventDefault();
    const newValue = this.positionToValue(e.clientX);

    this.handleValueChange(this.activeKnob, newValue);
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.isDragging || !this.activeKnob || this.disabled) {
      return;
    }

    e.preventDefault();
    const newValue = this.positionToValue(e.touches[0].clientX);

    this.handleValueChange(this.activeKnob, newValue);
  };

  private onPointerEnd = (): void => {
    this.isDragging = false;
    this.activeKnob = null;
    this.cleanupEventListeners();
  };

  private cleanupEventListeners(): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerEnd);
    document.removeEventListener('pointercancel', this.onPointerEnd);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onPointerEnd);
    document.removeEventListener('touchcancel', this.onPointerEnd);
  }

  private onKeyDown = (e: KeyboardEvent, knob: 'low' | 'high'): void => {
    if (this.disabled) {
      return;
    }

    const currentValue = knob === 'low' ? this._lowValue : this._highValue;
    let delta = 0;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        delta = this.step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -this.step;
        break;
      case 'Home':
        this.handleValueChange(knob, knob === 'low' ? this.min : this._lowValue);
        e.preventDefault();

        return;
      case 'End':
        this.handleValueChange(knob, this.max);
        e.preventDefault();

        return;
      case 'PageUp':
        delta = this.step * 10;
        break;
      case 'PageDown':
        delta = -this.step * 10;
        break;
      default:
        return;
    }

    if (delta) {
      e.preventDefault();
      this.handleValueChange(knob, currentValue + delta);
    }
  };

  private getAriaValueText(value: number): string {
    if (this.multiple) {
      return this.getI18nText('aria-range-text', this.defaultI18n, {
        low: this.formatValue(this._lowValue),
        high: this.formatValue(this._highValue),
      });
    }

    return this.getI18nText('aria-value-text', this.defaultI18n, {
      value: this.formatValue(value),
    });
  }

  private getKnobAriaLabel(type: 'low' | 'high'): string {
    const key = type === 'low' ? 'low-knob-label' : 'high-knob-label';

    return this.getI18nText(key, this.defaultI18n);
  }

  private renderKnob(type: 'low' | 'high') {
    const value = type === 'low' ? this._lowValue : this._highValue;
    const percent = this.valueToPercent(value);
    const min = type === 'low' ? this.min : this._lowValue;
    const max = type === 'low' ? (this.multiple ? this._highValue : this.max) : this.max;

    const isDraggingThis = this.isDragging && this.activeKnob === type;
    const knobClasses = [
      this.$cls['knob'] || 'z-input-range-knob',
      this.$cls[type === 'low' ? 'knob-low' : 'knob-high'] || '',
      isDraggingThis ? this.$cls['knob-dragging'] || '' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const labelPositionClass =
      this['label-position'] === 'top'
        ? this.$cls['label-top'] || 'z-input-range-label-top'
        : this.$cls['label-bottom'] || 'z-input-range-label-bottom';

    return html`
      <button
        type="button"
        data-part="knob"
        class="${knobClasses}"
        role="slider"
        aria-label="${this.getKnobAriaLabel(type)}"
        aria-valuemin="${min}"
        aria-valuemax="${max}"
        aria-valuenow="${value}"
        aria-valuetext="${this.getAriaValueText(value)}"
        aria-disabled="${this.disabled}"
        ?disabled=${this.disabled}
        style="${this.$stl['knob'] || ''}${this.$stl[type === 'low' ? 'knob-low' : 'knob-high'] ||
        ''}left: ${percent}%;"
        data-knob="${type}"
        data-dragging="${isDraggingThis}"
        @pointerdown=${(e: PointerEvent) => this.onPointerStart(e, type)}
        @touchstart=${(e: TouchEvent) => this.onPointerStart(e, type)}
        @keydown=${(e: KeyboardEvent) => this.onKeyDown(e, type)}
      >
        ${this._label
          ? html`
              <span
                data-part="label"
                class="${this.$cls['label'] || 'z-input-range-label'} ${labelPositionClass}"
                style="${this.$stl['label'] || ''}"
                data-label-position="${this['label-position']}"
              >
                ${type === 'low' ? this.formatValue(value) : ''}
                ${typeof this.label === 'string' ? this.label : ''}
                ${type === 'high' ? this.formatValue(value) : ''}
              </span>
            `
          : ''}
      </button>
    `;
  }

  render() {
    const lowPercent = this.valueToPercent(this._lowValue);
    const highPercent = this.multiple ? this.valueToPercent(this._highValue) : lowPercent;
    const rangeStyle = `left: ${this.multiple ? lowPercent : 0}%; width: ${this.multiple ? highPercent - lowPercent : lowPercent}%`;

    const ariaLabel = this['aria-label'] || this.getI18nText('aria-label', this.defaultI18n);

    return html`
      <div
        data-part="host-inner"
        data-host-inner
        class="${this.$cls['host-inner'] || ''}"
        style="${this.$stl['host-inner'] || ''}"
        role="group"
        aria-label="${ariaLabel}"
        data-disabled="${this.disabled}"
        data-multiple="${this.multiple}"
      >
        <div
          data-part="runnable"
          class="${this.$cls['runnable'] || 'z-input-range-runnable'}"
          style="${this.$stl['runnable'] || ''}"
          data-range-track
        ></div>
        <div
          data-part="fill"
          class="${this.$cls['fill'] || 'z-input-range-fill'}"
          style="${this.$stl['fill'] || ''}${rangeStyle}"
          data-fill-track
        ></div>
        ${this.renderKnob('low')} ${this.multiple ? this.renderKnob('high') : ''}
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-input-range': InputRange;
  }
}
