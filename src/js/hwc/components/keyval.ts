import { html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { randomString } from '../helpers/common';
import type { OptionItem } from '$hwc/helpers/select';

interface Cls extends Record<string, string> {
  'host-inner': string;
  table: string;
  'header-row': string;
  'header-key': string;
  'header-value': string;
  'header-actions': string;
  row: string;
  'data-key': string;
  'key-input': string;
  input: string;
  textarea: string;
  'data-value': string;
  'value-wrapper': string;
  'random-button': string;
  'value-input': string;
  'value-textarea': string;
  'data-actions': string;
  actions: string;
  button: string;
  'toggle-button': string;
  'remove-button': string;
  'add-row': string;
  'add-cell': string;
  'add-wrapper': string;
  'add-button': string;
}

interface Stl extends Record<string, string> {
  'host-inner': string;
  table: string;
  'header-row': string;
  'header-key': string;
  'header-value': string;
  'header-actions': string;
  row: string;
  'data-key': string;
  'key-input': string;
  input: string;
  textarea: string;
  'data-value': string;
  'value-wrapper': string;
  'random-button': string;
  'value-input': string;
  'value-textarea': string;
  'data-actions': string;
  actions: string;
  button: string;
  'toggle-button': string;
  'remove-button': string;
  'add-row': string;
  'add-cell': string;
  'add-wrapper': string;
  'add-button': string;
}

@customElement('z-kv')
export class Keyval extends Base {
  protected readonly 'cls-default-element' = 'host-inner';

  protected readonly 'stl-default-element' = 'host-inner';

  /**
   * Disables the ability to add new rows.
   *
   * @default false
   */
  @property({ type: Boolean })
  noninsertable: boolean = false;

  /**
   * Maximum number of rows allowed. When set to 0, there is no limit.
   *
   * @default 0
   */
  @property({ type: Number })
  max: number = 0;

  /**
   * Minimum number of rows required. Prevents deletion below this threshold.
   *
   * @default 1
   */
  @property({ type: Number })
  min: number = 1;

  /**
   * ARIA label for the key-value table.
   * Overrides i18n label if provided.
   */
  @property({ type: String })
  'aria-label': string = '';

  /**
   * Tracks password visibility state for each row when sensitive mode is enabled on that row.
   * @internal
   */
  @state()
  protected valueVisibility: { [key: number]: boolean } = {};

  /**
   * Default i18n strings (kebab-case keys).
   * @internal
   */
  protected readonly $defaultI18n = {
    'header-key': 'Key',
    'header-value': 'Value',
    'placeholder-key': 'Enter key',
    'placeholder-value': 'Enter value',
    'add-button-text': 'Add',
    'add-row-label': 'Add row',
    'remove-row-label': 'Remove row {index}',
    'toggle-visibility-label': 'Toggle visibility for row {index}',
    'generate-random-label': 'Generate random value for row {index}',
    'table-label': 'Key-value pairs',
    'actions-label': 'Actions',
    'key-label': 'Key for row {index}',
    'value-label': 'Value for row {index}',
  };

  /**
   * CSS class configuration (kebab-case keys).
   * @internal
   */
  @state()
  protected $cls: Cls = {
    'host-inner': 'z-kv',
    table: 'z-table z-table-divider z-table-responsive',
    'header-row': '',
    'header-key': '',
    'header-value': '',
    'header-actions': 'z-table-shrink',
    row: '',
    'data-key': '',
    'key-input': '',
    input: 'z-input',
    textarea: 'z-textarea',
    'data-value': '',
    'value-wrapper': 'z-kv-value-wrapper',
    'random-button': '',
    'value-input': 'z-input',
    'value-textarea': 'z-textarea',
    'data-actions': 'z-table-shrink',
    actions: 'z-kv-actions',
    button: 'z-button z-button-default z-button-icon',
    'toggle-button': '',
    'remove-button': 'z-button z-button-danger z-button-outline z-button-icon',
    'add-row': '',
    'add-cell': '',
    'add-wrapper': 'z-kv-add-wrapper',
    'add-button': 'z-button z-button-default',
  };

  /**
   * Inline styles configuration (kebab-case keys).
   * @internal
   */
  @state()
  protected $stl: Stl = {
    'host-inner': '',
    table: '',
    'header-row': '',
    'header-key': '',
    'header-value': '',
    'header-actions': '',
    row: '',
    'data-key': '',
    'key-input': '',
    input: '',
    textarea: '',
    'data-value': '',
    'value-wrapper': '',
    'random-button': '',
    'value-input': '',
    'value-textarea': '',
    'data-actions': '',
    actions: '',
    button: '',
    'toggle-button': '',
    'remove-button': '',
    'add-row': '',
    'add-cell': '',
    'add-wrapper': '',
    'add-button': '',
  };

  connectedCallback(): void {
    super.connectedCallback();

    this.syncDataOptions();
    this.initializePasswordVisibility();
  }

  protected onDataSourceChanged(): void {
    this.syncDataOptions();
    this.initializePasswordVisibility();
    this.requestUpdate();
  }

  /**
   * Normalizes options from `select[data-fn="data-source"]` (or initializes empty data)
   * and enforces `min` rows.
   * @private
   */
  private syncDataOptions(): void {
    if (!this.$data.__ || !Array.isArray(this.$data.__.options)) {
      this.initializeEmptyData();
    }

    this.$data.__.options.forEach(option => {
      option.data = option.data || {};

      if (option.data.key === undefined) {
        option.data.key = option.text !== option.value ? option.text : '';
      }
    });

    this.ensureMinimumRows();
  }

  private ensureMinimumRows(): void {
    const targetMin = Math.max(0, this.min);

    while (this.$data.__.options.length < targetMin && this.canAddRow()) {
      this.pushEmptyRow();
    }
  }

  private initializeEmptyData(): void {
    this.$data = {
      __: {
        text: '__',
        options: [],
      },
    };
  }

  private pushEmptyRow(): number {
    if (!this.$data.__) {
      this.initializeEmptyData();
    }

    const newIndex = this.$data.__.options.length;

    this.$data.__.options.push({
      group: '__',
      value: '',
      text: '',
      disabled: false,
      selected: false,
      data: { key: '' },
    });

    return newIndex;
  }

  private initializePasswordVisibility(): void {
    const nextVisibility: { [key: number]: boolean } = {};

    if (this.$data.__ && this.$data.__.options) {
      this.$data.__.options.forEach((_, index) => {
        if (this.isRowSensitive(index)) {
          nextVisibility[index] = this.valueVisibility[index] ?? false;
        }
      });
    }

    this.valueVisibility = nextVisibility;
  }

  /**
   * Safely retrieves a `data-*` attribute from `option.data`, supporting both
   * camelCase (`dataset` standard) and kebab-case keys.
   * @private
   */
  private getOptionData(
    option: OptionItem | undefined,
    camelKey: string,
    kebabKey?: string,
  ): unknown {
    const data = option?.data;

    if (!data) {
      return undefined;
    }

    if (camelKey in data) {
      return data[camelKey];
    }

    if (kebabKey && kebabKey in data) {
      return data[kebabKey];
    }

    return undefined;
  }

  /**
   * Parses boolean-like `data-*` attribute values from `option.data`.
   * Supports bare attributes (`""`), `"true"`, `"1"`, `"false"`, `"0"`, and booleans.
   * @private
   */
  private parseDataBoolean(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null) {
      return fallback;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === '' || normalized === 'true' || normalized === '1') {
        return true;
      }

      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }

    return fallback;
  }

  /**
   * Checks if a row is configured as sensitive via `data-sensitive` or `data-type="password"`.
   * @protected
   */
  protected isRowSensitive(index: number): boolean {
    const option = this.$data.__?.options?.[index];
    const sensitiveAttr = this.getOptionData(option, 'sensitive');

    if (sensitiveAttr !== undefined) {
      return this.parseDataBoolean(sensitiveAttr, false);
    }

    return this.getOptionData(option, 'type') === 'password';
  }

  /**
   * Checks if a row should render a `<textarea>` via `data-textarea` or `data-type="textarea"`.
   * @protected
   */
  protected isRowTextarea(index: number): boolean {
    const option = this.$data.__?.options?.[index];
    const textareaAttr = this.getOptionData(option, 'textarea');

    if (textareaAttr !== undefined) {
      return this.parseDataBoolean(textareaAttr, false);
    }

    return this.getOptionData(option, 'type') === 'textarea';
  }

  /**
   * Checks if a row's key input is readonly via `data-key-readonly` or `data-readonly`.
   * @protected
   */
  protected isKeyReadonly(index: number): boolean {
    const option = this.$data.__?.options?.[index];
    const keyReadonly =
      this.getOptionData(option, 'keyReadonly', 'key-readonly') ??
      this.getOptionData(option, 'readonlyKey', 'readonly-key');

    if (keyReadonly !== undefined) {
      return this.parseDataBoolean(keyReadonly, false);
    }

    return this.parseDataBoolean(this.getOptionData(option, 'readonly'), false);
  }

  /**
   * Checks if a row's value field is readonly via `data-value-readonly` or `data-readonly`.
   * @protected
   */
  protected isValueReadonly(index: number): boolean {
    const option = this.$data.__?.options?.[index];
    const valueReadonly =
      this.getOptionData(option, 'valueReadonly', 'value-readonly') ??
      this.getOptionData(option, 'readonlyValue', 'readonly-value');

    if (valueReadonly !== undefined) {
      return this.parseDataBoolean(valueReadonly, false);
    }

    return this.parseDataBoolean(this.getOptionData(option, 'readonly'), false);
  }

  /**
   * Checks if a row's key input is disabled via `<option disabled>` or `data-key-disabled`.
   * @protected
   */
  protected isKeyDisabled(index: number): boolean {
    const option = this.$data.__?.options?.[index];

    if (!option) {
      return true;
    }

    if (option.disabled) {
      return true;
    }

    const keyDisabled =
      this.getOptionData(option, 'keyDisabled', 'key-disabled') ??
      this.getOptionData(option, 'disabledKey', 'disabled-key');

    return this.parseDataBoolean(keyDisabled, false);
  }

  /**
   * Checks if a row's value field is disabled via `<option disabled>`, `data-value-disabled`,
   * or because the row has no key yet.
   * @protected
   */
  protected isValueDisabled(index: number): boolean {
    const option = this.$data.__?.options?.[index];

    if (!option || option.disabled || !option.data?.key) {
      return true;
    }

    const valueDisabled =
      this.getOptionData(option, 'valueDisabled', 'value-disabled') ??
      this.getOptionData(option, 'disabledValue', 'disabled-value');

    return this.parseDataBoolean(valueDisabled, false);
  }

  /**
   * Checks if a row can be removed. Defaults to `true` unless `<option disabled>`
   * or `data-removable="false"` is set.
   * @protected
   */
  protected isRowRemovable(index: number): boolean {
    const option = this.$data.__?.options?.[index];

    if (!option || option.disabled) {
      return false;
    }

    return this.parseDataBoolean(this.getOptionData(option, 'removable'), true);
  }

  private canAddRow(): boolean {
    const currentCount = this.$data.__?.options?.length ?? 0;

    if (this.max === 0) {
      return true;
    }

    return currentCount < this.max;
  }

  private canRemoveRow(): boolean {
    const currentCount = this.$data.__?.options?.length ?? 0;

    return currentCount > this.min;
  }

  protected addRow(): void {
    if (!this.canAddRow() || this.noninsertable) {
      return;
    }

    const newIndex = this.pushEmptyRow();

    this.requestUpdate();

    this.updateComplete.then(() => {
      const inputs = this.renderRoot.querySelectorAll<HTMLInputElement>('[data-field="key"]');
      const newInput = inputs[newIndex];

      if (newInput && !newInput.disabled) {
        newInput.focus();
      }
    });
  }

  protected removeRow(index: number): void {
    if (!this.canRemoveRow() || !this.isRowRemovable(index)) {
      return;
    }

    if (this.$data.__ && this.$data.__.options) {
      this.$data.__.options.splice(index, 1);
      this.reindexVisibilityAfterRemoval(index);
      this.requestUpdate();

      this.updateComplete.then(() => {
        const keyInputs = this.renderRoot.querySelectorAll<HTMLInputElement>('[data-field="key"]');

        if (keyInputs.length > 0) {
          const targetIndex = Math.min(index, keyInputs.length - 1);

          keyInputs[targetIndex]?.focus();
        } else {
          const addBtn = this.renderRoot.querySelector<HTMLButtonElement>(
            '[data-part="add-button"]',
          );

          addBtn?.focus();
        }
      });
    }
  }

  private reindexVisibilityAfterRemoval(removedIndex: number): void {
    const newVisibility: { [key: number]: boolean } = {};

    Object.keys(this.valueVisibility).forEach(key => {
      const numKey = parseInt(key, 10);

      if (numKey < removedIndex) {
        newVisibility[numKey] = this.valueVisibility[numKey];
      } else if (numKey > removedIndex) {
        newVisibility[numKey - 1] = this.valueVisibility[numKey];
      }
    });

    this.valueVisibility = newVisibility;
  }

  protected handleKeyChange(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const option = this.$data.__?.options?.[index];

    if (!option) {
      return;
    }

    // Prevent DOM tampering if key is readonly or disabled
    if (this.isKeyReadonly(index) || this.isKeyDisabled(index)) {
      inputElement.value = option.data.key || '';

      return;
    }

    option.data.key = inputElement.value;
    this.requestUpdate();
  }

  protected handleValueChange(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement | HTMLTextAreaElement;
    const option = this.$data.__?.options?.[index];

    if (!option) {
      return;
    }

    // Prevent DOM tampering if value is readonly or disabled
    if (this.isValueReadonly(index) || this.isValueDisabled(index)) {
      inputElement.value = option.value || '';

      return;
    }

    option.value = inputElement.value;
    this.requestUpdate();
  }

  protected setRandomValue(index: number): void {
    const option = this.$data.__?.options?.[index];

    if (
      !option ||
      !this.isRowSensitive(index) ||
      this.isValueDisabled(index) ||
      this.isValueReadonly(index) ||
      !!option.value
    ) {
      return;
    }

    option.value = randomString(16);
    this.valueVisibility[index] = true;
    this.requestUpdate();

    this.updateComplete.then(() => {
      const valueFields = this.renderRoot.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        '[data-field="value"]',
      );

      valueFields[index]?.focus();
    });
  }

  protected togglePasswordVisibility(index: number): void {
    if (this.isRowSensitive(index) && !this.isValueDisabled(index)) {
      this.valueVisibility[index] = !this.getPasswordVisibility(index);
      this.requestUpdate();
    }
  }

  protected getPasswordVisibility(index: number): boolean {
    return Boolean(this.valueVisibility[index]);
  }

  protected getInputType(index: number): 'text' | 'password' {
    if (!this.isRowSensitive(index)) {
      return 'text';
    }

    return this.getPasswordVisibility(index) ? 'text' : 'password';
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !this.noninsertable) {
      e.preventDefault();
      this.addRow();
    }
  };

  protected $icons(icon: string) {
    const customIcon = super.$icons(icon);

    if (customIcon) {
      return customIcon;
    }

    switch (icon) {
      case 'plus':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        `;
      case 'wand':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 4V2" />
            <path d="M15 16v-2" />
            <path d="M8 9h2" />
            <path d="M20 9h2" />
            <path d="M17.8 11.8 19 13" />
            <path d="M15 9h.01" />
            <path d="M17.8 6.2 19 5" />
            <path d="m3 21 9-9" />
            <path d="M12.2 6.2 11 5" />
          </svg>
        `;
      case 'eye-off':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
            />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <path
              d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
            />
            <path d="m2 2 20 20" />
          </svg>
        `;
      case 'eye':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        `;
      case 'trash-2':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        `;
    }
  }

  protected renderHeader(): TemplateResult {
    const headerKey = this.getI18nText('header-key', this.$defaultI18n);
    const headerValue = this.getI18nText('header-value', this.$defaultI18n);
    const actionsLabel = this.getI18nText('actions-label', this.$defaultI18n);

    return html`
      <thead>
        <tr
          data-part="header-row"
          class="${this.$cls['header-row'] || ''}"
          style="${this.$stl['header-row'] || ''}"
          role="row"
        >
          <th
            data-part="header-key"
            class="${this.$cls['header-key'] || ''}"
            style="${this.$stl['header-key'] || ''}"
            role="columnheader"
            scope="col"
          >
            ${headerKey}
          </th>
          <th
            data-part="header-value"
            class="${this.$cls['header-value'] || ''}"
            style="${this.$stl['header-value'] || ''}"
            role="columnheader"
            scope="col"
          >
            ${headerValue}
          </th>
          <th
            data-part="header-actions"
            class="${this.$cls['header-actions'] || ''}"
            style="${this.$stl['header-actions'] || ''}"
            role="columnheader"
            scope="col"
          >
            ${actionsLabel}
          </th>
        </tr>
      </thead>
    `;
  }

  protected renderKeyCell(option: OptionItem, index: number): TemplateResult {
    const rowNum = String(index + 1);
    const isKeyReadonly = this.isKeyReadonly(index);
    const isKeyDisabled = this.isKeyDisabled(index);
    const keyLabel = this.getI18nText('key-label', this.$defaultI18n, { index: rowNum });
    const customPlaceholder =
      this.getOptionData(option, 'keyPlaceholder', 'key-placeholder') ??
      this.getOptionData(option, 'placeholderKey', 'placeholder-key');
    const placeholderKey =
      typeof customPlaceholder === 'string'
        ? customPlaceholder
        : this.getI18nText('placeholder-key', this.$defaultI18n);

    return html`
      <td
        data-part="data-key"
        class="${this.$cls['data-key'] || ''}"
        style="${this.$stl['data-key'] || ''}"
        role="cell"
      >
        <input
          data-part="key-input"
          class="${this.$cls['key-input'] || this.$cls['input'] || ''}"
          style="${this.$stl['key-input'] || this.$stl['input'] || ''}"
          autocomplete="off"
          type="text"
          placeholder="${placeholderKey}"
          .value="${option.data.key || ''}"
          aria-label="${keyLabel}"
          data-field="key"
          ?readonly="${isKeyReadonly}"
          ?disabled="${isKeyDisabled}"
          @input=${(e: Event) => this.handleKeyChange(index, e)}
        />
      </td>
    `;
  }

  protected renderValueCell(option: OptionItem, index: number): TemplateResult {
    const rowNum = String(index + 1);
    const isSensitive = this.isRowSensitive(index);
    const isTextarea = this.isRowTextarea(index);
    const isVisible = this.getPasswordVisibility(index);
    const isValueReadonly = this.isValueReadonly(index);
    const isValueDisabled = this.isValueDisabled(index);

    const valueLabel = this.getI18nText('value-label', this.$defaultI18n, { index: rowNum });
    const randomLabel = this.getI18nText('generate-random-label', this.$defaultI18n, {
      index: rowNum,
    });
    const customPlaceholder =
      this.getOptionData(option, 'valuePlaceholder', 'value-placeholder') ??
      this.getOptionData(option, 'placeholderValue', 'placeholder-value') ??
      this.getOptionData(option, 'placeholder');
    const placeholderValue =
      typeof customPlaceholder === 'string'
        ? customPlaceholder
        : this.getI18nText('placeholder-value', this.$defaultI18n);
    const rowsAttr = Number(this.getOptionData(option, 'rows')) || 3;

    const textareaStyle = [
      this.$stl['value-textarea'] || this.$stl['textarea'] || this.$stl['input'] || '',
      isSensitive && !isVisible ? '-webkit-text-security: disc;' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <td
        data-part="data-value"
        class="${this.$cls['data-value'] || ''}"
        style="${this.$stl['data-value'] || ''}"
        role="cell"
      >
        <div
          data-part="value-wrapper"
          class="${this.$cls['value-wrapper'] || ''}"
          style="${this.$stl['value-wrapper'] || ''}"
        >
          ${isSensitive
            ? html`
                <button
                  data-part="random-button"
                  class="${this.$cls['random-button'] || this.$cls['button'] || ''}"
                  style="${this.$stl['random-button'] || this.$stl['button'] || ''}"
                  type="button"
                  aria-label="${randomLabel}"
                  ?disabled="${isValueDisabled || isValueReadonly || !!option.value}"
                  @click=${() => this.setRandomValue(index)}
                >
                  ${this.$icons('wand')}
                </button>
              `
            : nothing}
          ${isTextarea
            ? html`
                <textarea
                  data-part="value-textarea"
                  class="${this.$cls['value-textarea'] ||
                  this.$cls['textarea'] ||
                  this.$cls['input'] ||
                  ''}"
                  style="${textareaStyle}"
                  rows="${rowsAttr}"
                  placeholder="${placeholderValue}"
                  name="${option.data.key || ''}"
                  .value="${option.value || ''}"
                  aria-label="${valueLabel}"
                  data-field="value"
                  ?readonly="${isValueReadonly}"
                  ?disabled="${isValueDisabled}"
                  @input=${(e: Event) => this.handleValueChange(index, e)}
                ></textarea>
              `
            : html`
                <input
                  data-part="value-input"
                  class="${this.$cls['value-input'] || this.$cls['input'] || ''}"
                  style="${this.$stl['value-input'] || this.$stl['input'] || ''}"
                  autocomplete="off"
                  type="${this.getInputType(index)}"
                  placeholder="${placeholderValue}"
                  name="${option.data.key || ''}"
                  .value="${option.value || ''}"
                  aria-label="${valueLabel}"
                  data-field="value"
                  ?readonly="${isValueReadonly}"
                  ?disabled="${isValueDisabled}"
                  @input=${(e: Event) => this.handleValueChange(index, e)}
                />
              `}
        </div>
      </td>
    `;
  }

  protected renderActionsCell(_option: OptionItem, index: number): TemplateResult {
    const rowNum = String(index + 1);
    const isSensitive = this.isRowSensitive(index);
    const isVisible = this.getPasswordVisibility(index);
    const isValueDisabled = this.isValueDisabled(index);
    const canRemove = this.canRemoveRow() && this.isRowRemovable(index);

    const actionsLabel = this.getI18nText('actions-label', this.$defaultI18n);
    const removeLabel = this.getI18nText('remove-row-label', this.$defaultI18n, { index: rowNum });
    const toggleLabel = this.getI18nText('toggle-visibility-label', this.$defaultI18n, {
      index: rowNum,
    });

    return html`
      <td
        data-part="data-actions"
        class="${this.$cls['data-actions'] || ''}"
        style="${this.$stl['data-actions'] || ''}"
        role="cell"
      >
        <div
          data-part="actions"
          class="${this.$cls['actions'] || ''}"
          style="${this.$stl['actions'] || ''}"
          role="group"
          aria-label="${actionsLabel}"
        >
          ${isSensitive
            ? html`
                <button
                  data-part="toggle-button"
                  class="${this.$cls['toggle-button'] || this.$cls['button'] || ''}"
                  style="${this.$stl['toggle-button'] || this.$stl['button'] || ''}"
                  type="button"
                  aria-label="${toggleLabel}"
                  aria-pressed="${isVisible ? 'true' : 'false'}"
                  ?disabled="${isValueDisabled}"
                  @click=${() => this.togglePasswordVisibility(index)}
                >
                  ${isVisible ? this.$icons('eye-off') : this.$icons('eye')}
                </button>
              `
            : nothing}
          <button
            data-part="remove-button"
            class="${this.$cls['remove-button'] || this.$cls['button'] || ''}"
            style="${this.$stl['remove-button'] || this.$stl['button'] || ''}"
            type="button"
            aria-label="${removeLabel}"
            ?disabled="${!canRemove}"
            @click=${() => this.removeRow(index)}
          >
            ${this.$icons('trash-2')}
          </button>
        </div>
      </td>
    `;
  }

  protected renderRow(option: OptionItem, index: number): TemplateResult {
    return html`
      <tr
        data-part="row"
        class="${this.$cls['row'] || ''}"
        style="${this.$stl['row'] || ''}"
        role="row"
        data-row-index="${index}"
      >
        ${this.renderKeyCell(option, index)} ${this.renderValueCell(option, index)}
        ${this.renderActionsCell(option, index)}
      </tr>
    `;
  }

  protected renderAddRow(): TemplateResult | typeof nothing {
    if (this.noninsertable) {
      return nothing;
    }

    const addRowLabel = this.getI18nText('add-row-label', this.$defaultI18n);
    const addButtonText = this.getI18nText('add-button-text', this.$defaultI18n);

    return html`
      <tr
        data-part="add-row"
        class="${this.$cls['add-row'] || ''}"
        style="${this.$stl['add-row'] || ''}"
        role="row"
      >
        <td
          data-part="add-cell"
          class="${this.$cls['add-cell'] || ''}"
          style="${this.$stl['add-cell'] || ''}"
          colspan="3"
          role="cell"
        >
          <div
            data-part="add-wrapper"
            class="${this.$cls['add-wrapper'] || ''}"
            style="${this.$stl['add-wrapper'] || ''}"
          >
            <button
              data-part="add-button"
              class="${this.$cls['add-button'] || ''}"
              style="${this.$stl['add-button'] || ''}"
              type="button"
              data-action="add"
              aria-label="${addRowLabel}"
              ?disabled="${!this.canAddRow()}"
              @click=${() => this.addRow()}
            >
              ${this.$icons('plus')}
              <span>${addButtonText}</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  protected renderBody(): TemplateResult {
    const options = this.$data.__?.options;

    return html`
      <tbody>
        ${options ? options.map((option, index) => this.renderRow(option, index)) : nothing}
        ${this.renderAddRow()}
      </tbody>
    `;
  }

  protected renderTable(): TemplateResult {
    const tableLabel = this['aria-label'] || this.getI18nText('table-label', this.$defaultI18n);

    return html`
      <table
        data-part="table"
        class="${this.$cls['table'] || ''}"
        style="${this.$stl['table'] || ''}"
        role="table"
        aria-label="${tableLabel}"
      >
        ${this.renderHeader()} ${this.renderBody()}
      </table>
    `;
  }

  render(): TemplateResult {
    return html`
      <div
        data-host-inner
        data-part="host-inner"
        class="${this.$cls['host-inner'] || ''}"
        style="${this.$stl['host-inner'] || ''}"
        @keydown="${this.handleKeyDown}"
      >
        ${this.renderTable()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-kv': Keyval;
  }
}
