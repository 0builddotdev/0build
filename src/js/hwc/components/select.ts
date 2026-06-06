import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type OptionItem } from '$hwc/helpers/select';
import { BaseSelectMixin } from './shared/base-select';
import { repeat } from 'lit/directives/repeat.js';
import { InputMixin } from './shared/input';
import { Base } from './shared/base';
import { DropdownMixin } from './shared/dropdown';

type Cls = {
  'host-inner': string;
  button: string;
  'button-text': string;
  icon: string;
  list: string;
  item: string;
  'item-active': string;
  'item-disabled': string;
  'item-header': string;
  'item-link': string;
  'item-wrapper': string;
  'item-icon': string;
  'item-text': string;
  'item-check': string;
  'item-subtitle': string;
  search: string;
  'search-input': string;
  'search-icon': string;
  dropdown: string;
  divider: string;
};

type Stl = {
  'host-inner': string;
  button: string;
  'button-text': string;
  icon: string;
  list: string;
  item: string;
  'item-active': string;
  'item-disabled': string;
  'item-header': string;
  'item-link': string;
  'item-wrapper': string;
  'item-icon': string;
  'item-text': string;
  'item-check': string;
  'item-subtitle': string;
  search: string;
  'search-input': string;
  'search-icon': string;
  dropdown: string;
  divider: string;
};

@customElement('z-select')
export class Select extends BaseSelectMixin(DropdownMixin(InputMixin(Base))) {
  protected 'cls-default-element' = 'button';
  protected 'stl-default-element' = 'button';
  protected readonly 'input-event': string = 'z-select:input';
  protected readonly 'search-event': string = 'z-select:search';

  @property({ type: Boolean })
  searchable: boolean = false;

  @property({ type: Boolean })
  insertable: boolean = false;

  @property({ type: String, attribute: 'send-headers' })
  'send-headers': string = '';

  @property({ type: String, attribute: 'send-url' })
  'send-url': string = '';

  @property({ type: String, attribute: 'send-method' })
  'send-method': string = 'POST';

  @property({ type: Boolean })
  multiple: boolean = false;

  @property({ type: String })
  icon: string = '';

  @state()
  $selected: string[] = [];

  @state()
  protected $cls: Cls = {
    'host-inner': 'z-position-relative',
    button: '',
    'button-text': '',
    icon: '',
    list: 'z-nav z-dropdown-nav z-overflow-auto z-custom-select-list',
    item: '',
    'item-active': 'z-active',
    'item-disabled': 'z-disabled',
    'item-header': 'z-nav-header',
    'item-link': '',
    'item-wrapper': 'z-custom-select-item-wrapper',
    'item-icon': 'z-custom-select-item-icon',
    'item-text': 'z-custom-select-item-text',
    'item-check': '',
    'item-subtitle': '',
    search: 'z-custom-select-search',
    'search-input': '',
    'search-icon': '',
    dropdown: 'z-select-dropdown',
    divider: 'z-hr',
  };

  @state()
  protected $stl: Stl = {
    'host-inner': '',
    button: '',
    'button-text': '',
    icon: '',
    list: '',
    item: '',
    'item-active': 'z-active',
    'item-disabled': 'z-disabled',
    'item-header': '',
    'item-link': '',
    'item-wrapper': '',
    'item-icon': '',
    'item-text': '',
    'item-check': '',
    'item-subtitle': '',
    search: '',
    'search-input': '',
    'search-icon': '',
    dropdown: '',
    divider: 'z-hr',
  };

  protected readonly defaultI18n = {
    'button-label': 'Select an option',
    'selection-count': '{n} options selected',
    'search-placeholder': 'Search',
    insert: 'Insert',
    'list-label': 'Options',
  };

  protected get $text(): string {
    if (this.$selected.length === 0) {
      return this.placeholder !== ''
        ? this.placeholder
        : this.getI18nText('button-label', this.defaultI18n);
    }

    if (this.multiple === false && this.selected) {
      return this.selected.text;
    }

    if (this.$selected.length === 1 && this.selected) {
      return this.selected.text;
    }

    return this.getI18nText('selection-count', this.defaultI18n, {
      n: this.$selected.length,
    });
  }

  protected get $value(): string | string[] {
    return this.multiple ? this.$selected : this.$selected.length === 1 ? this.$selected[0] : '';
  }

  override get count(): number {
    let total = this.insertable && this.$term !== '' && !this.hasOption(this.$term) ? 1 : 0;

    for (const parent in this.options) {
      const count = this.options[parent].options.length;

      total += count;
    }

    return total - 1;
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.insertable) {
      this.searchable = true;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.closeDropdown();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated?.(_changedProperties);

    this.HTMLButton = this.renderRoot.querySelector('button');
    this.HTMLDrop = this.renderRoot.querySelector('[data-part="dropdown"]');

    if (this.HTMLDrop) {
      this.HTMLRectParent = this.renderRoot.querySelector('ul');
    }

    this.updateComplete.then(() => {
      if (this.hasAttribute('value')) {
        this.$selected = this.value.split(',').map(v => v.trim());

        if (!this.multiple) {
          this.$selected = this.$selected.slice(-1);
        }

        this.updateSelectedFromValues();
      } else {
        let values: string[] = [];

        for (const parent in this.$data) {
          const options = this.$data[parent].options;

          if (this.multiple) {
            options.forEach(option => {
              if (option.selected) {
                values.push(option.value);
              }
            });
          } else {
            const lastSelected = [...options].reverse().find(option => option.selected);

            if (lastSelected) {
              values = [lastSelected.value];
              this.selected = lastSelected;
              break;
            }
          }
        }

        this.$selected = values;

        if (this.multiple) {
          this.updateSelectedFromValues();
        }
      }
    });

    this.isRendered = true;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (
      this.isRendered &&
      changedProperties.has('$selected') &&
      changedProperties.get('$selected') !== undefined
    ) {
      this.emit();
    }
  }

  private onButtonClick = () => {
    if (this.disabled) {
      return;
    }

    this.$open = !this.$open;
  };

  protected initializeValue(): void {}

  protected select(item: OptionItem): void {
    if (item.disabled) {
      return;
    }

    if (this.multiple) {
      const existingIndex = this.$selected.findIndex(a => a === item?.value);

      if (existingIndex === -1) {
        this.$selected = [...this.$selected, item.value];
      } else {
        this.$selected = this.$selected.filter(a => a !== item.value);
      }

      if (this.$selected.length > 0) {
        this.updateSelectedFromValues();
      }

      this.requestUpdate();
    } else {
      this.$selected = [item.value];
      this.selected = item;
      this.$open = false; // Close dropdown on single select
    }
  }

  private updateSelectedFromValues(): void {
    if (this.$selected.length > 0) {
      const lastValue = this.$selected[this.$selected.length - 1];

      for (const parent in this.$data) {
        const lastSelected = this.$data[parent].options.find(option => option.value === lastValue);

        if (lastSelected) {
          this.selected = lastSelected;
          break;
        }
      }
    }
  }

  private onInputKeydown = (e: KeyboardEvent): void => {
    this.onKeydown(e);

    if (this.$open === true) {
      switch (e.key) {
        case 'Tab':
          if (!e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
          break;
      }
    }
  };

  protected onKeydownEnter(): void {
    const dataset = this.HTMLRectActive?.dataset;

    if (dataset) {
      const key: string = dataset.key as string;
      const index: number = dataset.index as unknown as number;

      if (key === '__insert__') {
        this.insert();
      } else {
        this.select(this.options[key].options[index]);
      }
    }
  }

  protected onClick(options: { item: OptionItem; index: number }): void {
    const { item } = options;

    this.select(item);
  }

  protected _cls(options?: { item: OptionItem; index: number }): {
    button: string;
    icon: string;
    list: string;
    item: string;
    'item-header': string;
    'item-link': string;
    'item-wrapper': string;
    'item-icon': string;
    'item-text': string;
    'item-check': string;
    'item-subtitle': string;
    search: string;
    'search-input': string;
    'search-icon': string;
    dropdown: string;
    [key: string]: string;
  } {
    const item: string[] = [this.$cls['item']];

    if (options?.item.disabled) {
      item.push(this.$cls['item-disabled']);
    }

    if (this.$focused === options?.index) {
      item.push(this.$cls['item-active']);
    }

    return {
      button: this.$cls['button'],
      icon: this.$cls['icon'],
      list: this.$cls['list'],
      item: item.join(' '),
      'item-header': this.$cls['item-header'],
      'item-link': this.multiple === false ? 'z-drop-close' : '',
      'item-wrapper': this.$cls['item-wrapper'],
      'item-icon': this.$cls['item-icon'],
      'item-text': this.$cls['item-text'],
      'item-check': this.$cls['item-check'],
      'item-subtitle': this.$cls['item-subtitle'],
      search: this.$cls['search'],
      'search-input': this.$cls['search-input'],
      'search-icon': this.$cls['search-icon'],
      dropdown: this.$cls['dropdown'],
    };
  }

  protected renderListItem(key: string, item: OptionItem, index: number): TemplateResult {
    const cls = this._cls({ item, index });
    const isSelected = this.$selected.includes(item.value);
    const globalIndex = this.getGlobalIndex(key, index);

    return html`
      <li
        data-part="item"
        class="${cls['item']}"
        role="option"
        aria-selected="${globalIndex === this.$focused ? 'true' : 'false'}"
        aria-disabled="${item.disabled ? 'true' : 'false'}"
        data-key="${key}"
        data-index="${index}"
      >
        <a
          data-part="item-link"
          class="${cls['item-link']}"
          @click="${() => this.onClick({ item, index })}"
          tabindex="-1"
          ?disabled="${item.disabled}"
          aria-label="${item.text}"
        >
          <div class="${cls['item-wrapper']}" data-part="item-wrapper">
            ${item.data.icon
              ? html`
                  <span class="${cls['item-icon']}" data-part="item-icon">
                    ${this.$icons(item.data.icon) || nothing}
                  </span>
                `
              : nothing}
            ${item.data.description
              ? html`
                  <div>
                    <span class="${cls['item-text']}" data-part="item-text">${item.text}</span>
                    <div class="${cls['item-subtitle']}" data-part="item-subtitle">
                      ${item.data.description}
                    </div>
                  </div>
                `
              : html` <span class="${cls['item-text']}" data-part="item-text">${item.text}</span>`}
          </div>
          ${isSelected
            ? html`
                <span class="${cls['item-check']}" data-part="item-check">
                  ${this.$icons('check') || nothing}
                </span>
              `
            : nothing}
        </a>
      </li>
    `;
  }

  private getGlobalIndex(key: string, index: number): number {
    let globalIndex = 0;
    let found = false;

    if (this.insertable && this.$term && !this.hasOption(this.$term)) {
      globalIndex++;
    }

    for (const groupKey in this.options) {
      if (groupKey === key) {
        globalIndex += index;
        found = true;
        break;
      }
      globalIndex += this.options[groupKey].options.length;
    }

    return found ? globalIndex : -1;
  }

  private hasOption(value: string): boolean {
    return Object.values(this.$data).some(group =>
      group.options.some(option => option.value === value),
    );
  }

  private addOption(item: OptionItem, key: string): boolean {
    const options = this.$data[key]?.options || [];
    const exists = options.some(option => option.value === item.value);

    if (!exists) {
      this.$data = { ...this.$data };

      if (this.$data[key] === undefined) {
        this.$data[key] = {
          text: item.group || '__',
          options: [],
        };
      }

      this.$data[key].options.push(item);
    }

    return !exists;
  }

  private async send(): Promise<OptionItem> {
    function validate(data: any): boolean {
      return (
        typeof data === 'object' &&
        'group' in data &&
        'value' in data &&
        'text' in data &&
        'disabled' in data &&
        'selected' in data &&
        'data' in data &&
        'key' in data.data &&
        'keywords' in data.data
      );
    }

    try {
      if (!this['send-url']) {
        throw new Error('No send URL provided');
      }

      const headers: HeadersInit = this['send-headers']
        ? JSON.parse(this['send-headers'])
        : { 'Content-Type': 'application/json' };

      const payload = {
        term: this.$term,
      };

      const response = await fetch(this['send-url'], {
        method: this['send-method'],
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (validate(data)) {
        return data as OptionItem;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      return {
        group: '__',
        text: this.$term,
        value: this.$term,
        data: {
          gid: '__',
          keywords: [this.$term],
        },
        selected: true,
        disabled: false,
      };
    }
  }

  protected async insert(): Promise<void> {
    const item = await this.send();

    this.addOption(item, item.data.gid as string);

    if (this.multiple) {
      this.$selected = [...this.$selected, this.$term];
    } else {
      this.$selected = [this.$term];
    }

    this.selected = item;
    this.$term = '';
  }

  private renderSearch() {
    const cls = this._cls();

    return this.searchable === true
      ? html`
          <div class="${cls['search']}" data-part="search" role="search">
            <span class="${cls['search-icon']}" data-part="search-icon">
              ${this.$icons('search') || nothing}
            </span>
            <input
              class="${cls['search-input']}"
              data-part="search-input"
              placeholder="${this.getI18nText('search-placeholder', this.defaultI18n)}"
              type="text"
              role="searchbox"
              aria-label="${this.getI18nText('search-placeholder', this.defaultI18n)}"
              .value="${this.$term}"
              @input="${(e: InputEvent) => {
                const input = e.target as HTMLInputElement;

                this.$term = input.value;
              }}"
              @keydown="${this.onInputKeydown}"
            />
          </div>
          ${Object.keys(this.options).length > 0
            ? html` <hr
                class="${this.$cls['divider']}"
                data-part="divider"
                style="${this.$stl['divider']}"
              />`
            : ''}
        `
      : '';
  }

  private renderInsertion() {
    const cls = this._cls();

    return html`
      <li class="${cls['item']}" data-part="item" role="option" data-key="__insert__">
        <a
          class="${cls['item-link']}"
          data-part="item-link"
          @click="${(e: MouseEvent) => {
            e.preventDefault();
            this.insert();
          }}"
          tabindex="-1"
          aria-label="${this.getI18nText('insert', this.defaultI18n)} ${this.$term}"
        >
          ${this.getI18nText('insert', this.defaultI18n)} ${this.$term}
        </a>
      </li>
    `;
  }

  protected override renderList() {
    const cls = this._cls();

    return html`
      <ul
        class="${cls['list']}"
        data-part="list"
        role="listbox"
        tabindex="-1"
        aria-label="${this.getI18nText('list-label', this.defaultI18n)}"
        aria-multiselectable="${this.multiple}"
        @keydown="${this.onKeydown}"
      >
        ${this.insertable && this.$term && !this.hasOption(this.$term)
          ? this.renderInsertion()
          : ''}
        ${repeat(
          Object.keys(this.options),
          groupKey => html`
            ${this.renderListHeader(groupKey)}
            ${repeat(this.options[groupKey].options, (option, index) =>
              this.renderListItem(groupKey, option, index),
            )}
          `,
        )}
      </ul>
    `;
  }

  render() {
    const cls = this._cls();
    const buttonId = this.id
      ? `${this.id}-button`
      : `z-select-${Math.random().toString(36).substr(2, 9)}`;
    const listboxId = this.id
      ? `${this.id}-listbox`
      : `z-listbox-${Math.random().toString(36).substr(2, 9)}`;

    return html`
      <div
        data-host-inner
        data-part="host-inner"
        class="${this.$cls['host-inner']}"
        style="${this.$stl['host-inner']}"
      >
        <button
          id="${buttonId}"
          class="${cls['button']}"
          data-part="button"
          style="${this.$stl['button']}"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded="${this.$open}"
          aria-controls="${listboxId}"
          aria-label="${this.getI18nText('button-label', this.defaultI18n)}"
          ?disabled="${this.disabled}"
          @click="${this.onButtonClick}"
          @keydown="${this.onKeydown}"
        >
          <span
            class="${cls['button-text']}"
            data-part="button-text"
            style="${this.$stl['button-text']}"
            >${this.$text}</span
          >
          <span class="${cls['icon']}" data-part="icon" style="${this.$stl['icon']}">
            ${this.icon ? this.$icons(this.icon) || nothing : this.$icons('chevrons-up-down')}
          </span>
        </button>

        <div
          id="${listboxId}"
          class="${cls['dropdown']}"
          data-part="dropdown"
          style="${this.$stl['dropdown']}"
          ?hidden="${!this.$open}"
          role="dialog"
          aria-label="${this.getI18nText('button-label', this.defaultI18n)}"
        >
          ${this.renderSearch()} ${this.renderList()}
        </div>
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-select': Select;
  }
}
