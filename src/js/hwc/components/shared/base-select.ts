import { state } from 'lit/decorators.js';
import { html, type PropertyValues, type TemplateResult } from 'lit';
import { type OptionGrouped, type OptionItem } from '../../helpers/select.js';
import { repeat } from 'lit/directives/repeat.js';
import type { Base } from './base.js';
import type { DropdownState } from './dropdown.js';

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export const BaseSelectMixin = <TBase extends Constructor<Base & DropdownState>>(
  BaseClass: TBase,
) => {
  abstract class BaseSelectClass extends BaseClass {
    protected abstract readonly 'search-event': string;

    protected abstract readonly defaultI18n: { [key: string]: string };

    protected abstract _cls(options?: { item: OptionItem; index: number }): {
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

    protected abstract onKeydownEnter(): void;

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

    get count(): number {
      let total = 0;

      for (const parent in this.options) {
        const count = this.options[parent].options.length;

        total += count;
      }

      return total - 1;
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
      switch (direction) {
        case 't':
          if (this.$focused <= 0) {
            this.$focused = this.count;
          } else {
            this.$focused--;
          }
          break;

        case 'd':
          if (this.$focused < this.count) {
            this.$focused++;
          } else {
            this.$focused = 0;
          }
          break;
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

            this.onKeydownEnter();
            break;

          case 'Home':
            e.preventDefault();
            this.$focused = 0;
            break;

          case 'End':
            e.preventDefault();
            this.$focused = this.count;
            break;
        }
      }
    }

    protected renderList(): TemplateResult {
      const cls = this._cls();

      return html`
        <ul
          class="${cls['list']}"
          style="${this.$stl['list']}"
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

    protected renderListHeader(header: string): TemplateResult | string {
      const cls = this._cls();

      return header !== '__'
        ? html`<li
            class="${cls['item-header']}"
            style="${this.$cls['item-header']}"
            role="presentation"
          >
            ${header}
          </li>`
        : '';
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

      switch (icon) {
        case 'search':
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
            >
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>
          `;
        case 'check':
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
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          `;
        case 'chevrons-up-down':
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
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          `;
      }
    }
  }

  return BaseSelectClass;
};
