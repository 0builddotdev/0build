import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions } from '../helpers/options';
import slugify from 'slugify';
import { InputMixin } from './shared/input';
import { Base } from './shared/base';

type SlugOptions = {
  replacement: string;
  remove: undefined | RegExp;
  lower: boolean;
  strict: boolean;
  locale: string;
  trim: boolean;
};

interface Cls extends Record<string, string> {
  'host-inner': string;
  wrapper: string;
  'tag-list': string;
  tag: string;
  'tag-text': string;
  'tag-remove': string;
  input: string;
  error: string;
}

interface Stl extends Record<string, string> {
  'host-inner': string;
  wrapper: string;
  'tag-list': string;
  tag: string;
  'tag-text': string;
  'tag-remove': string;
  input: string;
  error: string;
}

@customElement('z-input-tag')
export class InputTag extends InputMixin(Base) {
  protected readonly 'cls-default-element' = 'wrapper';

  protected readonly 'stl-default-element' = 'wrapper';

  protected readonly 'input-event' = 'z-input-tag:input';

  @property({ type: Number })
  maxlength: number = 20;

  @property({ type: Number })
  minlength: number = 1;

  @property({ type: Boolean })
  slugify: boolean = false;

  @property({ type: String })
  'slugify-options': string = '';

  @property({ type: String })
  delimiters: string = ',';

  @property({ type: Boolean })
  'allow-duplicates': boolean = false;

  @property({ type: Number })
  'max-tags': number = 0;

  @state()
  protected $input: string = '';

  @state()
  protected $slugOptions: Partial<SlugOptions> = {
    lower: true,
    strict: true,
  };

  @state()
  protected $tags: string[] = [];

  @state()
  protected $error: string = '';

  private readonly defaultI18n = {
    placeholder: 'Add a tag...',
    'remove-label': 'Remove tag',
    'edit-label': 'Edit tag',
    'tag-list-label': 'Tags',
    'min-length-error': 'Tag must be at least {min} characters',
    'max-length-error': 'Tag cannot exceed {max} characters',
    'duplicate-error': 'Tag already exists',
    'max-tags-error': 'Maximum {max} tags allowed',
    'input-label': 'Tag input',
  };

  @state()
  protected $cls: Cls = {
    'host-inner': '',
    wrapper: 'z-input-tag',
    'tag-list': 'z-input-tag-list',
    tag: 'z-tag z-tag-secondary',
    'tag-text': '',
    'tag-remove': '',
    input: '',
    error: 'sr-only',
  };

  @state()
  protected $stl: Stl = {
    'host-inner': '',
    wrapper: '',
    'tag-list': '',
    tag: '',
    'tag-text': '',
    'tag-remove': '',
    input: '',
    error: '',
  };

  protected get $value(): string[] {
    return this.$tags;
  }

  protected get $text(): string {
    return '';
  }

  private get delimiterChars(): string[] {
    return this.delimiters.split('');
  }

  protected initializeValue(): void {
    this.initializeTags();
    this.initializeSlugOptions();
  }

  private initializeTags(): void {
    this.$tags = this.value === '' ? [] : this.value.split(',');
  }

  private initializeSlugOptions(): void {
    if (!this['slugify-options']) {
      return;
    }

    const options = parseOptions(this['slugify-options']) as Record<string, string>;

    if (options.replacement) {
      this.$slugOptions.replacement = options.replacement;
    }

    if (options.remove) {
      this.$slugOptions.remove = new RegExp(options.remove, 'g');
    }

    if (options.lower) {
      this.$slugOptions.lower = options.lower === 'true';
    }

    if (options.strict) {
      this.$slugOptions.strict = options.strict === 'true';
    }

    if (options.locale) {
      this.$slugOptions.locale = options.locale;
    }

    if (options.trim) {
      this.$slugOptions.trim = options.trim === 'true';
    }
  }

  private validateTag(tag: string): boolean {
    this.$error = '';

    if (tag.length < this.minlength) {
      this.$error = this.getI18nText('min-length-error', this.defaultI18n, {
        min: String(this.minlength),
      });

      return false;
    }

    if (tag.length > this.maxlength) {
      this.$error = this.getI18nText('max-length-error', this.defaultI18n, {
        max: String(this.maxlength),
      });

      return false;
    }

    if (!this['allow-duplicates'] && this.$tags.includes(tag)) {
      this.$error = this.getI18nText('duplicate-error', this.defaultI18n);

      return false;
    }

    if (this['max-tags'] > 0 && this.$tags.length >= this['max-tags']) {
      this.$error = this.getI18nText('max-tags-error', this.defaultI18n, {
        max: String(this['max-tags']),
      });

      return false;
    }

    return true;
  }

  private addTag(): void {
    if (!this.$input.trim()) {
      return;
    }

    let tag = this.$input.trim();

    if (this.slugify) {
      tag = slugify(tag, this.$slugOptions);
    }

    if (this.validateTag(tag)) {
      this.$tags = [...this.$tags, tag];
      this.$input = '';
      this.$error = '';
      this.emit();
      this.requestUpdate();
    }
  }

  private removeTag(index: number): void {
    if (this.disabled) {
      return;
    }

    this.$tags = this.$tags.filter((_, i) => i !== index);
    this.$error = '';
    this.emit();
    this.requestUpdate();
  }

  private editTag(index: number): void {
    if (this.disabled) {
      return;
    }

    this.$input = this.$tags[index];
    this.removeTag(index);

    this.updateComplete.then(() => {
      this.renderRoot.querySelector('input')?.focus();
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Backspace':
        if (this.$tags.length > 0 && this.$input.length === 0) {
          e.preventDefault();
          this.editTag(this.$tags.length - 1);
        }
        break;

      case 'Enter':
        e.preventDefault();
        this.addTag();
        break;

      case 'Escape':
        if (this.$input) {
          e.preventDefault();
          this.$input = '';
          this.$error = '';
          this.requestUpdate();
        }
        break;

      default:
        if (this.delimiterChars.includes(e.key)) {
          e.preventDefault();
          this.addTag();
        }
        break;
    }
  }

  private handleInput(e: InputEvent): void {
    const input = e.target as HTMLInputElement;

    this.$input = input.value;
    this.$error = '';
  }

  private handlePaste(e: ClipboardEvent): void {
    const pastedText = e.clipboardData?.getData('text');

    if (!pastedText) {
      return;
    }

    const hasDelimiters = this.delimiterChars.some(d => pastedText.includes(d));

    if (hasDelimiters) {
      e.preventDefault();

      const delimiterRegex = new RegExp(`[${this.delimiterChars.join('')}]`);
      const tags = pastedText
        .split(delimiterRegex)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      tags.forEach(tag => {
        if (this.slugify) {
          tag = slugify(tag, this.$slugOptions);
        }

        if (this.validateTag(tag)) {
          this.$tags = [...this.$tags, tag];
        }
      });

      this.$input = '';
      this.emit();
      this.requestUpdate();
    }
  }

  private renderTag(tag: string, index: number) {
    const removeLabel = this.getI18nText('remove-label', this.defaultI18n);
    const editLabel = this.getI18nText('edit-label', this.defaultI18n);

    return html`
      <div
        data-part="tag"
        class="${this.$cls['tag'] || ''}"
        style="${this.$stl['tag'] || ''}"
        role="listitem"
        data-tag-index="${index}"
      >
        <span
          data-part="tag-text"
          class="${this.$cls['tag-text'] || ''}"
          style="${this.$stl['tag-text'] || ''}"
          role="button"
          tabindex="${this.disabled ? '-1' : '0'}"
          aria-label="${editLabel}: ${tag}"
          @click="${() => this.editTag(index)}"
          @keydown="${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.editTag(index);
            }
          }}"
        >
          ${tag}
        </span>
        <button
          data-part="tag-remove"
          type="button"
          class="${this.$cls['tag-remove'] || ''}"
          style="${this.$stl['tag-remove'] || ''}"
          aria-label="${removeLabel}: ${tag}"
          ?disabled="${this.disabled}"
          @click="${() => this.removeTag(index)}"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;
  }

  private renderError() {
    if (!this.$error) {
      return '';
    }

    return html`
      <div
        data-part="error"
        class="${this.$cls['error'] || ''}"
        style="${this.$stl['error'] || ''}"
        role="alert"
        aria-live="polite"
        id="tag-error"
      >
        ${this.$error}
      </div>
    `;
  }

  render() {
    const placeholder = this.placeholder || this.getI18nText('placeholder', this.defaultI18n);
    const tagListLabel = this.getI18nText('tag-list-label', this.defaultI18n);
    const inputLabel = this.getI18nText('input-label', this.defaultI18n);

    return html`
      <div
        data-part="host-inner"
        data-host-inner
        class="${this.$cls['host-inner'] || ''}"
        style="${this.$stl['host-inner'] || ''}"
        data-disabled="${this.disabled}"
        data-has-error="${!!this.$error}"
      >
        <div
          data-part="wrapper"
          class="${this.$cls['wrapper'] || ''}"
          style="${this.$stl['wrapper'] || ''}"
        >
          <div
            data-part="tag-list"
            class="${this.$cls['tag-list'] || ''}"
            style="${this.$stl['tag-list'] || ''}"
            role="list"
            aria-label="${tagListLabel}"
          >
            ${this.$tags.map((tag, index) => this.renderTag(tag, index))}
          </div>

          <input
            data-part="input"
            class="${this.$cls['input'] || ''}"
            style="${this.$stl['input'] || ''}"
            type="text"
            role="textbox"
            aria-label="${inputLabel}"
            aria-invalid="${!!this.$error}"
            aria-describedby="${this.$error ? 'tag-error' : ''}"
            autocomplete="off"
            placeholder="${placeholder}"
            maxlength="${this.maxlength}"
            .value="${this.$input}"
            ?disabled="${this.disabled}"
            @keydown="${this.handleKeydown}"
            @input="${this.handleInput}"
            @paste="${this.handlePaste}"
          />
        </div>

        ${this.renderError()} ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-input-tag': InputTag;
  }
}
