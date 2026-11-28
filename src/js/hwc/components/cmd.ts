import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Hwc } from '$js/hwc/hwc';
import type { OptionGrouped, OptionItem } from '../../shared/helpers/select';
import { svgIcon } from '../../shared/helpers/svg';
import { BaseSelectMixin } from '../mixins/base-select';
import { DialogMixin } from '../mixins/dialog';

interface Cls extends Record<string, string> {
  overlay: string;
  dialog: string;
  panel: string;
  search: string;
  'search-icon': string;
  'search-input': string;
  divider: string;
  list: string;
  separator: string;
  item: string;
  'item-active': string;
  'item-disabled': string;
  'item-header': string;
  'item-link': string;
  'item-wrapper': string;
  'item-icon': string;
  'item-content': string;
  'item-text': string;
  'item-subtitle': string;
  'item-shortcut': string;
  kbd: string;
  empty: string;
  footer: string;
  'footer-group': string;
  'footer-item': string;
  'footer-kbd': string;
  'footer-close': string;
}

interface Stl extends Record<string, string> {
  overlay: string;
  dialog: string;
  panel: string;
  search: string;
  'search-icon': string;
  'search-input': string;
  divider: string;
  list: string;
  separator: string;
  item: string;
  'item-active': string;
  'item-disabled': string;
  'item-header': string;
  'item-link': string;
  'item-wrapper': string;
  'item-icon': string;
  'item-content': string;
  'item-text': string;
  'item-subtitle': string;
  'item-shortcut': string;
  kbd: string;
  empty: string;
  footer: string;
  'footer-group': string;
  'footer-item': string;
  'footer-kbd': string;
  'footer-close': string;
}

interface FlatOptionEntry {
  key: string;
  index: number;
  globalIndex: number;
  item: OptionItem;
}

interface ParsedShortcut {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  mod: boolean;
}

@customElement('z-cmd')
export class Cmd extends BaseSelectMixin(DialogMixin(Hwc)) {
  protected readonly 'cls-default-element': string = 'dialog';

  protected readonly 'stl-default-element': string = 'dialog';

  protected readonly 'dialog-event-prefix': string = 'z-cmd';

  protected readonly 'search-event': string = 'z-cmd:search';

  protected readonly 'select-event': string = 'z-cmd:select';

  @property({ type: String })
  placeholder: string = '';

  @property({ type: String })
  shortcut: string = '';

  @property({ type: Boolean })
  'prevent-close': boolean = false;

  @property({ type: Boolean })
  'no-footer': boolean = false;

  @property({ type: String })
  icon: string = '';

  @state()
  protected $cls: Cls = {
    overlay: 'z-modal',
    dialog: 'z-modal-dialog z-cmd',
    panel: 'z-cmd-panel',
    search: 'z-custom-select-search',
    'search-icon': '',
    'search-input': '',
    divider: 'z-hr',
    list: 'z-nav z-dropdown-nav z-overflow-auto z-cmd-list',
    separator: 'z-nav-divider',
    item: '',
    'item-active': 'z-active',
    'item-disabled': 'z-disabled',
    'item-header': 'z-nav-header',
    'item-link': '',
    'item-wrapper': 'z-custom-select-item-wrapper',
    'item-icon': 'z-custom-select-item-icon',
    'item-content': 'z-cmd-item-content',
    'item-text': '',
    'item-subtitle': 'z-cmd-item-subtitle',
    'item-shortcut': 'z-cmd-item-shortcut',
    kbd: '',
    empty: 'z-cmd-empty',
    footer: 'z-cmd-footer',
    'footer-group': 'z-cmd-footer-group',
    'footer-item': 'z-cmd-footer-item',
    'footer-kbd': 'z-kbd',
    'footer-close': 'z-cmd-footer-item z-cmd-footer-close',
  };

  @state()
  protected $stl: Stl = {
    overlay: '',
    dialog: '',
    panel: '',
    search: '',
    'search-icon': '',
    'search-input': '',
    divider: '',
    list: '',
    separator: '',
    item: '',
    'item-active': '',
    'item-disabled': '',
    'item-header': '',
    'item-link': '',
    'item-wrapper': '',
    'item-icon': '',
    'item-content': '',
    'item-text': '',
    'item-subtitle': '',
    'item-shortcut': '',
    kbd: '',
    empty: '',
    footer: '',
    'footer-group': '',
    'footer-item': '',
    'footer-kbd': '',
    'footer-close': '',
  };

  protected readonly defaultI18n = {
    'dialog-label': 'Command menu',
    'search-placeholder': 'Search for apps and commands...',
    'list-label': 'Commands',
    'empty-message': 'No results found.',
    'navigate-label': 'Navigate',
    'select-label': 'Open',
    'close-label': 'Close',
    'close-hint': 'Esc',
  };

  private parsedShortcut: ParsedShortcut | null = null;

  private isShortcutListenerAttached: boolean = false;

  private isPointerHovering: boolean = false;

  private readonly listboxId: string = `z-cmd-listbox-${this.uid}`;

  override get options(): OptionGrouped {
    const query = this.$term.trim().toLowerCase();

    if (!query) {
      const nonEmpty: OptionGrouped = {};

      for (const [key, group] of Object.entries(this.$data)) {
        if (group.options.length > 0) {
          nonEmpty[key] = group;
        }
      }

      return nonEmpty;
    }

    const tokens = query.split(/\s+/).filter(Boolean);
    const filteredGroups: OptionGrouped = {};

    for (const [key, group] of Object.entries(this.$data)) {
      const groupTitle = group.text !== '__' ? group.text : '';
      const filtered = group.options.filter(option => {
        const searchableParts = [
          option.text,
          option.value,
          groupTitle,
          typeof option.data.description === 'string' ? option.data.description : '',
          ...(option.data.keywords ?? []),
        ]
          .filter(Boolean)
          .map(part => part.toLowerCase());

        return tokens.every(token => searchableParts.some(part => part.includes(token)));
      });

      if (filtered.length > 0) {
        filteredGroups[key] = {
          text: group.text,
          options: filtered,
          ...(group.data && { data: group.data }),
        };
      }
    }

    return filteredGroups;
  }

  private get flatOptions(): FlatOptionEntry[] {
    const entries: FlatOptionEntry[] = [];
    let globalIndex = 0;

    for (const [key, group] of Object.entries(this.options)) {
      group.options.forEach((item, index) => {
        entries.push({ key, index, globalIndex, item });
        globalIndex++;
      });
    }

    return entries;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.syncShortcutListener();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.isTeleporting) {
      return;
    }

    this.detachShortcutListener();
  }

  protected override onDialogMount(): void {
    this.syncDomReferences();
    this.bindOverlayEvents(this.HTMLOverlay);
  }

  protected override onDialogDestroy(): void {
    this.$term = '';
    this.$focused = -1;
    this.HTMLRectParent = null;
    this.HTMLRectActive = null;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (this.$mounted) {
      this.syncDomReferences();
    }

    if (changedProperties.has('shortcut')) {
      this.syncShortcutListener();
    }

    if (changedProperties.has('$term') && this.$open) {
      this.updateComplete.then(() => {
        this.$focused = this.findFirstEnabledIndex();
      });
    }
  }

  private syncDomReferences(): void {
    this.HTMLOverlay = this.querySelector<HTMLElement>('[data-part="overlay"]');
    this.HTMLDialogPanel = this.querySelector<HTMLElement>('[data-part="dialog"]');
    this.HTMLRectParent = this.querySelector<HTMLElement>('[data-part="list"]');
  }

  private isMacPlatform(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    const tag = target.tagName;

    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  private parseShortcut(raw: string): ParsedShortcut | null {
    const tokens = raw
      .trim()
      .toLowerCase()
      .split('+')
      .map(token => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return null;
    }

    const parsed: ParsedShortcut = {
      key: '',
      ctrl: false,
      meta: false,
      alt: false,
      shift: false,
      mod: false,
    };

    for (const token of tokens) {
      switch (token) {
        case 'mod':
          parsed.mod = true;
          break;
        case 'ctrl':
        case 'control':
          parsed.ctrl = true;
          break;
        case 'meta':
        case 'cmd':
        case 'command':
          parsed.meta = true;
          break;
        case 'alt':
        case 'option':
          parsed.alt = true;
          break;
        case 'shift':
          parsed.shift = true;
          break;
        default:
          parsed.key = token;
          break;
      }
    }

    return parsed.key ? parsed : null;
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut): boolean {
    if (event.key.toLowerCase() !== shortcut.key) {
      return false;
    }

    const mac = this.isMacPlatform();
    const expectCtrl = shortcut.ctrl || (shortcut.mod && !mac);
    const expectMeta = shortcut.meta || (shortcut.mod && mac);

    return (
      event.ctrlKey === expectCtrl &&
      event.metaKey === expectMeta &&
      event.altKey === shortcut.alt &&
      event.shiftKey === shortcut.shift
    );
  }

  private syncShortcutListener(): void {
    this.parsedShortcut = this.parseShortcut(this.shortcut);

    if (this.parsedShortcut) {
      this.attachShortcutListener();
    } else {
      this.detachShortcutListener();
    }
  }

  private attachShortcutListener(): void {
    if (this.isShortcutListenerAttached || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('keydown', this.handleGlobalShortcut);
    this.isShortcutListenerAttached = true;
  }

  private detachShortcutListener(): void {
    if (!this.isShortcutListenerAttached || typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('keydown', this.handleGlobalShortcut);
    this.isShortcutListenerAttached = false;
  }

  private handleGlobalShortcut = (event: KeyboardEvent): void => {
    if (!this.parsedShortcut || event.defaultPrevented) {
      return;
    }

    const hasModifier =
      this.parsedShortcut.mod ||
      this.parsedShortcut.ctrl ||
      this.parsedShortcut.meta ||
      this.parsedShortcut.alt;

    if (!hasModifier && this.isEditableTarget(event.target)) {
      return;
    }

    if (!this.matchesShortcut(event, this.parsedShortcut)) {
      return;
    }

    event.preventDefault();
    void this.toggle();
  };

  protected override onDataSourceChanged(): void {
    this.requestUpdate();

    if (this.$open) {
      this.updateComplete.then(() => {
        this.$focused = this.findFirstEnabledIndex();
      });
    }
  }

  protected override onDialogOpen(): void {
    const searchInput = this.querySelector<HTMLInputElement>('[data-part="search-input"]');

    if (searchInput) {
      searchInput.focus();
    } else {
      super.onDialogOpen();
    }

    this.$focused = this.findFirstEnabledIndex();
  }

  protected override focusActiveOption(behavior: ScrollBehavior = 'smooth'): void {
    if (this.isPointerHovering) {
      return;
    }

    super.focusActiveOption(behavior);
  }

  private findFirstEnabledIndex(): number {
    const entry = this.flatOptions.find(item => !item.item.disabled);

    return entry ? entry.globalIndex : -1;
  }

  private findLastEnabledIndex(): number {
    const entries = this.flatOptions;

    for (let i = entries.length - 1; i >= 0; i--) {
      if (!entries[i].item.disabled) {
        return entries[i].globalIndex;
      }
    }

    return -1;
  }

  private getGlobalIndex(key: string, index: number): number {
    const match = this.flatOptions.find(entry => entry.key === key && entry.index === index);

    return match ? match.globalIndex : -1;
  }

  protected override navigate(direction: 't' | 'd'): void {
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

  protected override onKeydown(event: KeyboardEvent): void {
    if (!this.$open) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigate('d');
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigate('t');
        break;
      case 'Home':
        event.preventDefault();
        this.$focused = this.findFirstEnabledIndex();
        break;
      case 'End':
        event.preventDefault();
        this.$focused = this.findLastEnabledIndex();
        break;
      case 'Enter':
        event.preventDefault();
        this.triggerFocusedSelection(event);
        break;
    }
  }

  private triggerFocusedSelection(originalEvent?: KeyboardEvent): void {
    const entry = this.flatOptions.find(item => item.globalIndex === this.$focused);

    if (entry) {
      this.selectItem(entry.item, originalEvent);

      return;
    }

    this.onKeydownEnter();
  }

  protected onKeydownEnter(): void {
    const dataset = this.HTMLRectActive?.dataset;

    if (!dataset?.key || dataset.index === undefined) {
      return;
    }

    const index = Number(dataset.index);
    const item = this.options[dataset.key]?.options[index];

    if (item) {
      this.selectItem(item);
    }
  }

  protected onClick(context: { item: OptionItem; index: number }): void {
    this.selectItem(context.item);
  }

  protected select(item: OptionItem): void {
    this.selectItem(item);
  }

  private selectItem(item: OptionItem, originalEvent?: MouseEvent | KeyboardEvent): void {
    if (item.disabled) {
      return;
    }

    const selectEvent = new CustomEvent(this['select-event'], {
      detail: {
        value: item.value,
        text: item.text,
        group: item.group,
        item,
        originalEvent,
      },
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    const shouldClose = this.dispatchEvent(selectEvent);

    if (shouldClose && !this['prevent-close']) {
      void this.hide();
    }
  }

  protected _cls(options?: { item: OptionItem; index: number; globalIndex?: number }): {
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
    [key: string]: string;
  } {
    const itemClasses = [this.$cls['item']];

    if (options?.item.disabled) {
      itemClasses.push(this.$cls['item-disabled']);
    }

    if (options?.globalIndex !== undefined && this.$focused === options.globalIndex) {
      itemClasses.push(this.$cls['item-active']);
    }

    return {
      button: '',
      icon: '',
      list: this.$cls['list'],
      item: itemClasses.filter(Boolean).join(' '),
      'item-header': this.$cls['item-header'],
      'item-link': this.$cls['item-link'],
      'item-wrapper': this.$cls['item-wrapper'],
      'item-icon': this.$cls['item-icon'],
      'item-text': this.$cls['item-text'],
      'item-check': '',
      'item-subtitle': this.$cls['item-subtitle'],
      'item-content': this.$cls['item-content'],
      'item-shortcut': this.$cls['item-shortcut'],
      kbd: this.$cls['kbd'],
      search: this.$cls['search'],
      'search-input': this.$cls['search-input'],
      'search-icon': this.$cls['search-icon'],
    };
  }

  protected override renderListHeader(groupKey: string): TemplateResult | string {
    if (groupKey === '__') {
      return '';
    }

    const cls = this._cls();
    const label = this.options[groupKey]?.text ?? groupKey;

    return html`
      <li
        class="${cls['item-header']}"
        style="${this.$stl['item-header']}"
        data-part="item-header"
        role="presentation"
      >
        ${label}
      </li>
    `;
  }

  private renderShortcutKbd(shortcutValue: unknown): TemplateResult | typeof nothing {
    if (typeof shortcutValue !== 'string' || !shortcutValue.trim()) {
      return nothing;
    }

    const keys = shortcutValue.includes('+')
      ? shortcutValue
          .split('+')
          .map(key => key.trim())
          .filter(Boolean)
      : shortcutValue.trim().split(/\s+/).filter(Boolean);

    return html`
      <span
        class="${this.$cls['item-shortcut']}"
        style="${this.$stl['item-shortcut']}"
        data-part="item-shortcut"
      >
        ${keys.map(
          key => html`<kbd class="${this.$cls['kbd']}" style="${this.$stl['kbd']}">${key}</kbd>`,
        )}
      </span>
    `;
  }

  protected renderListItem(key: string, item: OptionItem, index: number): TemplateResult {
    const globalIndex = this.getGlobalIndex(key, index);
    const cls = this._cls({ item, index, globalIndex });
    const isFocused = globalIndex !== -1 && globalIndex === this.$focused;
    const shortcutValue = item.data.kbd ?? item.data.shortcut;

    return html`
      <li
        id="${this.listboxId}-option-${globalIndex}"
        data-part="item"
        class="${cls['item']}"
        style="${this.$stl['item']}"
        role="option"
        aria-selected="${isFocused ? 'true' : 'false'}"
        aria-disabled="${item.disabled ? 'true' : 'false'}"
        data-key="${key}"
        data-index="${index}"
      >
        <a
          data-part="item-link"
          class="${cls['item-link']}"
          style="${this.$stl['item-link']}"
          tabindex="-1"
          aria-label="${item.text}"
          @pointermove="${() => {
            if (!item.disabled && globalIndex !== -1 && this.$focused !== globalIndex) {
              this.isPointerHovering = true;
              this.$focused = globalIndex;
              queueMicrotask(() => {
                this.isPointerHovering = false;
              });
            }
          }}"
          @click="${(event: MouseEvent) => {
            event.preventDefault();
            this.selectItem(item, event);
          }}"
        >
          <div
            class="${cls['item-wrapper']}"
            style="${this.$stl['item-wrapper']}"
            data-part="item-wrapper"
          >
            ${item.data.icon
              ? html`
                  <span
                    class="${cls['item-icon']}"
                    style="${this.$stl['item-icon']}"
                    data-part="item-icon"
                  >
                    ${this.$icons(String(item.data.icon)) || nothing}
                  </span>
                `
              : nothing}
            <div
              class="${cls['item-content']}"
              style="${this.$stl['item-content']}"
              data-part="item-content"
            >
              <span
                class="${cls['item-text']}"
                style="${this.$stl['item-text']}"
                data-part="item-text"
              >
                ${item.text}
              </span>
              ${item.data.description
                ? html`
                    <span
                      class="${cls['item-subtitle']}"
                      style="${this.$stl['item-subtitle']}"
                      data-part="item-subtitle"
                    >
                      ${item.data.description}
                    </span>
                  `
                : nothing}
            </div>
          </div>
          ${this.renderShortcutKbd(shortcutValue)}
        </a>
      </li>
    `;
  }

  protected override renderList(): TemplateResult {
    const cls = this._cls();
    const entries = this.flatOptions;
    const activeDescendant =
      this.$focused >= 0 && entries[this.$focused]
        ? `${this.listboxId}-option-${this.$focused}`
        : undefined;

    if (entries.length === 0) {
      return html`
        <div
          id="${this.listboxId}"
          class="${this.$cls['empty']}"
          style="${this.$stl['empty']}"
          data-part="empty"
          role="status"
          aria-live="polite"
        >
          ${this.getI18nText('empty-message', this.defaultI18n)}
        </div>
      `;
    }

    return html`
      <ul
        id="${this.listboxId}"
        class="${cls['list']}"
        style="${this.$stl['list']}"
        data-part="list"
        role="listbox"
        tabindex="-1"
        aria-label="${this.getI18nText('list-label', this.defaultI18n)}"
        aria-activedescendant="${activeDescendant ?? ''}"
        @keydown="${this.onKeydown}"
      >
        ${repeat(
          Object.keys(this.options),
          groupKey => groupKey,
          (groupKey, groupIndex) => html`
            ${groupIndex > 0
              ? html`
                  <li
                    class="${this.$cls['separator']}"
                    style="${this.$stl['separator']}"
                    data-part="separator"
                    role="separator"
                  ></li>
                `
              : nothing}
            ${this.renderListHeader(groupKey)}
            ${repeat(
              this.options[groupKey].options,
              (option, index) => `${groupKey}:${option.value}:${index}`,
              (option, index) => this.renderListItem(groupKey, option, index),
            )}
          `,
        )}
      </ul>
    `;
  }

  protected override $icons(icon: string) {
    const customIcon = super.$icons(icon);

    if (customIcon) {
      return customIcon;
    }

    return icon === 'arrow-up' || icon === 'arrow-down' || icon === 'corner-down-left'
      ? svgIcon(icon, 12)
      : undefined;
  }

  private renderSearch(): TemplateResult {
    const cls = this._cls();
    const searchPlaceholder =
      this.placeholder || this.getI18nText('search-placeholder', this.defaultI18n);

    return html`
      <div class="${cls['search']}" style="${this.$stl['search']}" data-part="search" role="search">
        <span
          class="${cls['search-icon']}"
          style="${this.$stl['search-icon']}"
          data-part="search-icon"
        >
          ${this.icon ? this.$icons(this.icon) || nothing : this.$icons('search')}
        </span>
        <input
          class="${cls['search-input']}"
          style="${this.$stl['search-input']}"
          data-part="search-input"
          type="text"
          role="combobox"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          aria-expanded="${this.$open ? 'true' : 'false'}"
          aria-controls="${this.listboxId}"
          aria-autocomplete="list"
          aria-label="${searchPlaceholder}"
          placeholder="${searchPlaceholder}"
          .value="${this.$term}"
          @input="${(event: InputEvent) => {
            const input = event.target as HTMLInputElement;

            this.$term = input.value;
          }}"
          @keydown="${this.onKeydown}"
        />
      </div>
      <hr class="${this.$cls['divider']}" style="${this.$stl['divider']}" data-part="divider" />
    `;
  }

  private renderFooter(): TemplateResult | typeof nothing {
    if (this['no-footer']) {
      return nothing;
    }

    const closeLabel = this.getI18nText('close-label', this.defaultI18n);
    const closeHint = this.getI18nText('close-hint', this.defaultI18n);

    return html`
      <div class="${this.$cls['footer']}" style="${this.$stl['footer']}" data-part="footer">
        <div
          class="${this.$cls['footer-group']}"
          style="${this.$stl['footer-group']}"
          data-part="footer-group"
        >
          <span
            class="${this.$cls['footer-item']}"
            style="${this.$stl['footer-item']}"
            data-part="footer-item"
          >
            <kbd class="${this.$cls['footer-kbd']}" style="${this.$stl['footer-kbd']}">
              ${this.$icons('arrow-up') || nothing}
            </kbd>
            <kbd class="${this.$cls['footer-kbd']}" style="${this.$stl['footer-kbd']}">
              ${this.$icons('arrow-down') || nothing}
            </kbd>
            <span>${this.getI18nText('navigate-label', this.defaultI18n)}</span>
          </span>
          <span
            class="${this.$cls['footer-item']}"
            style="${this.$stl['footer-item']}"
            data-part="footer-item"
          >
            <kbd class="${this.$cls['footer-kbd']}" style="${this.$stl['footer-kbd']}">
              ${this.$icons('corner-down-left') || nothing}
            </kbd>
            <span>${this.getI18nText('select-label', this.defaultI18n)}</span>
          </span>
        </div>
        <button
          type="button"
          class="${this.$cls['footer-close']}"
          style="${this.$stl['footer-close']}"
          data-part="footer-close"
          data-close
          aria-label="${closeLabel}"
        >
          <kbd class="${this.$cls['footer-kbd']}" style="${this.$stl['footer-kbd']}">
            ${closeHint}
          </kbd>
          <span>${closeLabel}</span>
        </button>
      </div>
    `;
  }

  private getOverlayClasses(): string {
    const classes = [this.$cls['overlay']];

    if (this.container) {
      classes.push('z-modal-container');
    }

    if (this.full) {
      classes.push('z-modal-full');
    }

    if (this.HTMLOverlay?.classList.contains('z-flex')) {
      classes.push('z-flex');
    }

    if (this.HTMLOverlay?.classList.contains('z-open')) {
      classes.push('z-open');
    }

    return classes.filter(Boolean).join(' ');
  }

  private getDialogClasses(): string {
    const classes = [this.$cls['dialog']];

    if (this.center) {
      classes.push('z-margin-auto-vertical');
    }

    return classes.filter(Boolean).join(' ');
  }

  render() {
    if (!this.$mounted) {
      return nothing;
    }

    return html`
      <div
        data-host-inner
        data-part="overlay"
        class="${this.getOverlayClasses()}"
        style="${this.$stl['overlay']}"
      >
        <div
          data-part="dialog"
          class="${this.getDialogClasses()}"
          style="${this.$stl['dialog']}"
          role="dialog"
          aria-modal="true"
          aria-label="${this.getI18nText('dialog-label', this.defaultI18n)}"
          tabindex="-1"
        >
          <div class="${this.$cls['panel']}" style="${this.$stl['panel']}" data-part="panel">
            ${this.renderSearch()} ${this.renderList()}
          </div>
          ${this.renderFooter()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-cmd': Cmd;
  }
}
