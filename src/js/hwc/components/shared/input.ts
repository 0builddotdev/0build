import { html } from 'lit';
import { property } from 'lit/decorators.js';
import type { Base } from './base.js';

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export const InputMixin = <TBase extends Constructor<Base>>(BaseClass: TBase) => {
  abstract class Input extends BaseClass {
    @property({ type: Boolean })
    disabled: boolean = false;

    @property({ type: String })
    name: string = '';

    @property({ type: String })
    placeholder: string = '';

    @property({ type: Boolean })
    required: boolean = false;

    @property({ type: String })
    value: string = '';

    protected renderHidden() {
      return typeof this.$value === 'string'
        ? this.name
          ? html` <input name="${this.name}" type="hidden" value="${this.$value}" /> `
          : ''
        : (this.$value as string[]).map(
            item => html` <input name="${this.name}[]" type="hidden" value="${item}" /> `,
          );
    }

    protected emit() {
      this.dispatchEvent(
        new CustomEvent(this['input-event'], {
          detail: { value: this.$value },
          bubbles: true,
          composed: true,
        }),
      );
    }

    connectedCallback(): void {
      super.connectedCallback();

      this.initializeValue();
    }

    protected abstract get $value(): string | string[];

    protected abstract get $text(): string;

    protected abstract 'input-event': string;

    protected abstract initializeValue(): void;
  }

  return Input;
};
