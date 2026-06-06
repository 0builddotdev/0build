import { type PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { InputMixin } from './shared/input';
import { Base } from './shared/base';

interface Cls extends Record<string, string> {
  'host-inner': string;
  wrapper: string;
  input: string;
  label: string;
  description: string;
}

interface Stl extends Record<string, string> {
  container: string;
  wrapper: string;
  input: string;
  label: string;
  description: string;
}

@customElement('z-input-pin')
export class InputPin extends InputMixin(Base) {
  protected 'cls-default-element' = 'wrapper';

  protected 'stl-default-element' = 'wrapper';

  protected 'input-event' = 'z-input-pin:change';

  @property({ type: Boolean })
  autofocus: boolean = false;

  @property({ type: Number })
  length: number = 6;

  @property({ type: String, attribute: 'input-mode' })
  'input-mode': 'numeric' | 'text' = 'numeric';

  @property({ type: String })
  pattern?: string;

  private readonly defaultI18n = {
    label: 'PIN Code',
    description: 'Enter {length}-digit code',
    'field-label': 'Digit {n} of {total}',
    loaded: 'PIN input ready',
    complete: 'PIN entry complete',
    'field-filled': 'Field {n} filled',
    'invalid-character': 'Invalid character entered',
  };

  @state()
  protected $cls: Cls = {
    'host-inner': '',
    wrapper: 'z-input-pin',
    input: '',
    label: 'sr-only',
    description: 'sr-only',
  };

  @state()
  protected $stl: Stl = {
    container: '',
    wrapper: '',
    input: '',
    label: '',
    description: '',
  };

  @state()
  private $focus: undefined | number;

  @state()
  private $pin: string = '';

  protected get $value(): string {
    return this.$pin;
  }

  protected get $text(): string {
    return '';
  }

  private $inputs: NodeListOf<HTMLInputElement> | null = null;

  private groupId: string = '';

  protected initializeValue(): void {
    this.groupId = this.id ? `${this.id}-group` : `pin-${Math.random().toString(36).substr(2, 9)}`;

    if (this.value) {
      const trimmedValue = this.value.substring(0, this.length);

      if (this.pattern) {
        const regex = new RegExp(`^[${this.pattern}]*$`);

        if (!regex.test(trimmedValue)) {
          console.warn(
            `[z-input-pin] Initial value "${this.value}" does not match pattern "${this.pattern}"`,
          );

          return;
        }
      }

      this.$pin = trimmedValue;
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.$inputs = this.renderRoot.querySelectorAll(
      'input[data-pin-input]',
    ) as NodeListOf<HTMLInputElement>;

    this.setupPasteHandlers();
    this.populateInitialValue();

    this.announceToScreenReader(this.getI18nText('loaded', this.defaultI18n));
  }

  private populateInitialValue(): void {
    if (!this.$pin || !this.$inputs) {
      return;
    }

    this.$pin.split('').forEach((char, index) => {
      const input = this.$inputs![index];

      if (input) {
        input.value = char;
        input.disabled = false;
      }
    });

    if (this.$pin.length < this.length) {
      const nextInput = this.$inputs[this.$pin.length];

      if (nextInput) {
        nextInput.disabled = false;
      }
    }
  }

  private setupPasteHandlers(): void {
    this.$inputs?.forEach(input => {
      input.addEventListener('paste', (e: Event) => {
        e.preventDefault();
        const clipboardData = (e as ClipboardEvent).clipboardData;

        if (clipboardData) {
          this.handlePaste(clipboardData.getData('Text'));
        }
      });
    });
  }

  private handlePaste(text: string): void {
    if (!this.$inputs) {
      return;
    }

    const trimmedText = text.substring(0, this.length);

    if (this.pattern) {
      const regex = new RegExp(`^[${this.pattern}]*$`);

      if (!regex.test(trimmedText)) {
        this.announceToScreenReader(this.getI18nText('invalid-character', this.defaultI18n));

        return;
      }
    }

    this.$pin = trimmedText;

    trimmedText.split('').forEach((char, index) => {
      const input = this.$inputs![index];

      input.disabled = false;
      input.value = char;
    });

    for (let i = trimmedText.length; i < this.length; i++) {
      const input = this.$inputs[i];

      input.value = '';
      input.disabled = i !== trimmedText.length;
    }

    if (trimmedText.length < this.length) {
      const nextInput = this.$inputs[trimmedText.length];

      nextInput.disabled = false;
      nextInput.focus();
      this.announceToScreenReader(
        this.getI18nText('field-filled', this.defaultI18n, {
          n: trimmedText.length + 1,
        }),
      );
    } else {
      const currentInput = this.$inputs[this.$focus as number];

      currentInput?.blur();
      this.announceToScreenReader(this.getI18nText('complete', this.defaultI18n));
      this.emitComplete();
    }

    this.emit();
  }

  private handleKeyNavigation(e: KeyboardEvent, input: HTMLInputElement): void {
    if (this.$focus === undefined || !this.$inputs) {
      return;
    }

    switch (e.key) {
      case 'Backspace':
        if (input.value.length === 0 && this.$focus > 0) {
          e.preventDefault();
          const prevInput = this.$inputs[this.$focus - 1];

          prevInput.focus();
          prevInput.select();
          input.disabled = true;
        }
        break;

      case 'Delete':
        if (input.value.length === 0) {
          e.preventDefault();

          const nextInput = this.$inputs[this.$focus + 1];

          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(0, 0);
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();

        if (this.$focus > 0) {
          const prevInput = this.$inputs[this.$focus - 1];

          prevInput.focus();
          prevInput.setSelectionRange(1, 1);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();

        if (this.$focus < this.length - 1) {
          const nextInput = this.$inputs[this.$focus + 1];

          if (!nextInput.disabled) {
            nextInput.focus();
            nextInput.setSelectionRange(0, 0);
          }
        }
        break;

      case 'Home':
        e.preventDefault();
        this.$inputs[0]?.focus();
        break;

      case 'End':
        e.preventDefault();

        for (let i = this.length - 1; i >= 0; i--) {
          const inp = this.$inputs[i];

          if (!inp.disabled) {
            inp.focus();
            break;
          }
        }
        break;
    }
  }

  private handleInput(e: InputEvent, fieldIndex: number): void {
    if (!this.$inputs) {
      return;
    }

    const input = e.target as HTMLInputElement;

    if (this.pattern && input.value && !new RegExp(`[${this.pattern}]`).test(input.value)) {
      input.value = '';
      this.announceToScreenReader(this.getI18nText('invalid-character', this.defaultI18n));

      return;
    }

    if (input.value.length === 1) {
      if (fieldIndex < this.length - 1) {
        const nextInput = this.$inputs[fieldIndex + 1];

        nextInput.disabled = false;
        nextInput.focus();
        this.announceToScreenReader(
          this.getI18nText('field-filled', this.defaultI18n, {
            n: fieldIndex + 2,
          }),
        );
      } else {
        input.blur();
        this.announceToScreenReader(this.getI18nText('complete', this.defaultI18n));
        this.emitComplete();
      }
    }

    this.updatePinValue();
    this.emit();
  }

  private updatePinValue(): void {
    if (!this.$inputs) {
      return;
    }

    let value = '';

    this.$inputs.forEach(input => {
      value += input.value;
    });
    this.$pin = value;
  }

  private emitComplete(): void {
    this.dispatchEvent(
      new CustomEvent('z-input-pin:complete', {
        detail: {
          value: this.$value,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private announceToScreenReader(message: string): void {
    if (!message) {
      return;
    }

    const liveRegion = this.renderRoot.querySelector('[role="status"]');

    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  private get groupLabel(): string {
    return this.getI18nText('label', this.defaultI18n);
  }

  private get groupDescription(): string {
    return this.getI18nText('description', this.defaultI18n, {
      length: this.length,
    });
  }

  private getFieldLabel(index: number): string {
    return this.getI18nText('field-label', this.defaultI18n, {
      n: index + 1,
      total: this.length,
    });
  }

  private renderInput(index: number) {
    const fieldLabel = this.getFieldLabel(index);

    return html`
      <input
        data-part="input"
        class=${this.$cls['input']}
        style=${this.$stl['input']}
        data-pin-input
        type="text"
        inputmode=${this['input-mode']}
        autocomplete=${index === 0 ? 'one-time-code' : 'off'}
        maxlength="1"
        placeholder="○"
        pattern=${this.pattern || ''}
        aria-label=${fieldLabel}
        .autofocus=${this.autofocus && index === 0}
        .disabled=${this.disabled ? true : index !== 0 ? true : false}
        .required=${this.required}
        @keydown=${(e: KeyboardEvent) => this.handleKeyNavigation(e, e.target as HTMLInputElement)}
        @input=${(e: InputEvent) => this.handleInput(e, index)}
        @focus=${() => (this.$focus = index)}
        @blur=${() => (this.$focus = undefined)}
      />
    `;
  }

  render() {
    return html`
      <div
        data-part="host-inner"
        data-host-inner
        class=${this.$cls['host-inner']}
        style=${this.$stl['host-inner']}
        role="group"
        aria-labelledby="${this.groupId}-label ${this.groupId}-desc"
      >
        <span
          data-part="label"
          id="${this.groupId}-label"
          class="${this.$cls['label']}"
          style=${this.$stl['label']}
        >
          ${this.groupLabel}
        </span>

        <span
          data-part="description"
          id="${this.groupId}-desc"
          class="${this.$cls['description']}"
          style=${this.$stl['description']}
        >
          ${this.groupDescription}
        </span>

        <div
          data-part="wrapper"
          class=${this.$cls['wrapper']}
          style=${this.$stl['wrapper']}
          role="presentation"
        >
          ${Array(this.length)
            .fill('')
            .map((_, index) => this.renderInput(index))}
        </div>

        <span role="status" aria-live="polite" aria-atomic="true" class="sr-only"></span>

        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-input-pin': InputPin;
  }
}
