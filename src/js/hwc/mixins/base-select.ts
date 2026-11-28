import { state } from 'lit/decorators.js';
import { html, type PropertyValues, type TemplateResult } from 'lit';
import { type OptionGrouped, type OptionItem } from '../../shared/helpers/select.js';
import { repeat } from 'lit/directives/repeat.js';
import type { Hwc } from '$js/hwc/hwc';
import { svgIcon } from '../../shared/helpers/svg.js';
import type { DropdownState } from './dropdown.js';

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export interface FlatOptionEntry {
  key: string;
  index: number;
  globalIndex: number;
  item: OptionItem;
}

export const BaseSelectMixin = <TBase extends Constructor<Hwc & DropdownState>>(
  BaseClass: TBase,
) => {
  abstract class BaseSelectClass extends BaseClass {
    protected abstract readonly 'search-event': string;

    protected abstract readonly defaultI18n: { [key: string]: string };

    protected abstract _cls(options?: {
      item: OptionItem;
      index: number;
      globalIndex?: number;
    }): {
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
      search: string;
      'search-input': string;
      'search-icon': string;
      [key: string]: string;
    };

    protected abstract onClick(context: { item: OptionItem; index: number }): void;

    protected abstract select(item: OptionItem): void;

    protected abstract onKeydownEnter(event?: KeyboardEvent): void;

    protected abstract renderListItem(
      key: string,
      item: OptionItem,
      index: number,
    ): TemplateResult | undefined;

    @state()
    $term: string = '';

    @state()
    $focused: number = -1;

    protected selected: OptionItem | null = null;

    protected HTMLRectParent: HTMLElement | null = null;

    protected HTMLRectActive: HTMLElement | null = null;

    get options(): OptionGrouped {
      const options: OptionGrouped = {};

      Object.entries(this.$data).forEach(([key, group]) => {
        const filtered = group.options.filter(option =>
          option.data.keywords?.some(k => k.toLowerCase().includes(this.$term.toLowerCase())),
        );

        if (filtered.length > 0) {
          options[key] = {
            text: group.text,
            options: filtered,
            ...(group.data && { data: group.data }),
          };
        }
      });

      return options;
    }

    protected hasLeadingOption(): boolean {
      return false;
    }

    protected get flatOptions(): FlatOptionEntry[] {
      const entries: FlatOptionEntry[] = [];
      let globalIndex = 0;

      if (this.hasLeadingOption()) {
        entries.push({
          key: '__insert__',
          index: 0,
          globalIndex: globalIndex++,
          item: {
            group: '__',
            value: this.$term,
            text: this.$term,
            disabled: false,
            selected: false,
            data: {},
          },
        });
      }

      for (const [key, group] of Object.entries(this.options)) {
        group.options.forEach((item, index) => {
          entries.push({ key, index, globalIndex: globalIndex++, item });
        });
      }

      return entries;
    }

    get count(): number {
      return this.flatOptions.length - 1;
    }

    protected getGlobalIndex(key: string, index: number): number {
      const match = this.flatOptions.find(entry => entry.key === key && entry.index === index);

      return match ? match.globalIndex : -1;
    }

    protected findFirstEnabledIndex(): number {
      return this.flatOptions.find(entry => !entry.item.disabled)?.globalIndex ?? -1;
    }

    protected findLastEnabledIndex(): number {
      const entries = this.flatOptions;

      for (let i = entries.length - 1; i >= 0; i--) {
        if (!entries[i].item.disabled) {
          return entries[i].globalIndex;
        }
      }

      return -1;
    }

    protected updated(_changedProperties: PropertyValues): void {
      super.updated(_changedProperties);

      if (_changedProperties.has('$term') && _changedProperties.get('$term') !== undefined) {
        this.dispatchEvent(
          new CustomEvent(this['search-event'], {
            detail: {
              value: this.$term,
            },
            bubbles: true,
            composed: true,
          }),
        );

        this.updateComplete.then(() => {
          this.$focused = -1;
        });
      }

      if (_changedProperties.has('$focused') && this.HTMLRectParent) {
        this.HTMLRectParent.querySelector('[role="option"][aria-selected="true"]')?.removeAttribute(
          'aria-selected',
        );

        const options = Array.from(this.HTMLRectParent.querySelectorAll('[role="option"]'));

        this.HTMLRectActive = options[this.$focused] as HTMLElement;

        if (this.HTMLRectActive) {
          this.HTMLRectActive.setAttribute('aria-selected', 'true');
          this.focusActiveOption();
        }
      }
    }

    protected navigate(direction: 't' | 'd'): void {
      const entries = this.flatOptions;

      if (entries.length === 0 || !entries.some(entry => !entry.item.disabled)) {
        this.$focused = -1;

        return;
      }

      const step = direction === 'd' ? 1 : -1;
      let cursor = this.$focused;

      for (let attempt = 0; attempt < entries.length; attempt++) {
        if (cursor === -1) {
          cursor = direction === 'd' ? 0 : entries.length - 1;
        } else {
          cursor = (cursor + step + entries.length) % entries.length;
        }

        if (!entries[cursor].item.disabled) {
          this.$focused = entries[cursor].globalIndex;

          return;
        }
      }
    }

    protected focusActiveOption(behavior: ScrollBehavior = 'smooth'): void {
      if (this.HTMLRectParent && this.HTMLRectActive) {
        const rects = {
          parent: this.HTMLRectParent.getBoundingClientRect(),
          active: this.HTMLRectActive.getBoundingClientRect(),
        };

        this.HTMLRectParent.scrollTo({
          top:
            this.HTMLRectActive.offsetTop -
            this.HTMLRectParent.offsetTop -
            rects.parent.height / 2 +
            rects.active.height / 2,
          behavior: behavior,
        });
      }
    }

    protected onKeydown(e: KeyboardEvent): void {
      if (this.$open === true) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            this.navigate('d');
            break;

          case 'ArrowUp':
            e.preventDefault();
            this.navigate('t');
            break;

          case 'Enter':
            e.preventDefault();

            if (this.$focused === -1) {
              return;
            }

            this.onKeydownEnter(e);
            break;

          case 'Home':
            e.preventDefault();
            this.$focused = this.findFirstEnabledIndex();
            break;

          case 'End':
            e.preventDefault();
            this.$focused = this.findLastEnabledIndex();
            break;
        }
      }
    }

    protected renderList(): TemplateResult {
      const cls = this._cls();

      return html`
        <ul
          class="${cls['list']}"
          style=${this.partStyle('list')}
          role="listbox"
          tabindex="-1"
          aria-label="${this.getI18nText('list-label', this.defaultI18n)}"
          @keydown="${this.onKeydown}"
        >
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

    protected renderListHeader(groupKey: string): TemplateResult | string {
      if (groupKey === '__') {
        return '';
      }

      const cls = this._cls();
      const label = this.options[groupKey]?.text ?? groupKey;

      return html`<li
        class="${cls['item-header']}"
        style=${this.partStyle('item-header')}
        data-part="item-header"
        role="presentation"
      >
        ${label}
      </li>`;
    }

    protected onDropClose(): void {
      this.$focused = -1;
      this.$term = '';
    }

    protected $icons(icon: string) {
      const customIcon = super.$icons(icon);

      if (customIcon) {
        return customIcon;
      }

      return icon === 'search' || icon === 'check' || icon === 'chevrons-up-down'
        ? svgIcon(icon)
        : undefined;
    }
  }

  return BaseSelectClass;
};
