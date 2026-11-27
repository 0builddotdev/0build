import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Controller } from './shared/controller';

interface AccordionEntry {
  index: number;
  itemEl: HTMLElement;
  triggerEl: HTMLElement;
  contentEl: HTMLElement;
  disabled: boolean;
  value: string;
}

interface ActivePanelAnimation {
  animation: Animation;
  token: number;
}

@customElement('z-accordion')
export class Accordion extends Controller {
  protected readonly eventPrefix = 'z-accordion';

  @property({ type: Boolean })
  multiple: boolean = false;

  @property({ type: Boolean, attribute: 'no-collapsible' })
  'no-collapsible': boolean = false;

  private _active: string = '';

  @property({ type: String, noAccessor: true })
  get active(): string {
    return this._active;
  }

  set active(value: string) {
    const old = this._active;

    if (old === value) {
      return;
    }

    this._active = value;
    this.requestUpdate('active', old);
  }

  @property({ type: Number })
  duration: number = 150;

  @property({ type: Boolean, attribute: 'no-animation' })
  'no-animation': boolean = false;

  @property({ type: String })
  targets: string = '';

  @property({ type: String })
  trigger: string = '';

  @property({ type: String })
  content: string = '';

  private openIndices: Set<number> = new Set();

  private isEventsBound: boolean = false;

  private animationCounter: number = 0;

  private panelAnimations: WeakMap<HTMLElement, ActivePanelAnimation> = new WeakMap();

  private animatingPanels: Set<HTMLElement> = new Set();

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.detachListeners();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeAccordion();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (
      changedProperties.has('targets') ||
      changedProperties.has('trigger') ||
      changedProperties.has('content')
    ) {
      this.refresh();

      return;
    }

    if (changedProperties.has('multiple') && !this.multiple && this.openIndices.size > 1) {
      const firstOpen = this.activeIndices()[0];
      const nextSet = firstOpen !== undefined ? new Set([firstOpen]) : new Set<number>();

      void this.applyTargetIndices(nextSet, firstOpen ?? -1, firstOpen !== undefined, false);

      return;
    }

    if (changedProperties.has('no-collapsible')) {
      if (this['no-collapsible'] && this.openIndices.size === 0) {
        const container = this.resolveContainer();
        const entries = container ? this.resolveEntries(container) : [];
        const firstEnabled = entries.find(entry => !entry.disabled);

        if (firstEnabled) {
          void this.applyTargetIndices(
            new Set([firstEnabled.index]),
            firstEnabled.index,
            true,
            false,
          );

          return;
        }
      }

      this.syncState(false);
    }

    if (changedProperties.has('active')) {
      const container = this.resolveContainer();

      if (!container) {
        return;
      }

      const entries = this.resolveEntries(container);
      const parsed = this.parseActiveSelection(this.active, entries);

      void this.applyTargetIndices(parsed, this.activeIndices()[0] ?? -1, parsed.size > 0, true);
    }
  }

  public activeIndices(): number[] {
    return Array.from(this.openIndices).sort((a, b) => a - b);
  }

  public refresh(): void {
    this.detachListeners();
    this.initializeAccordion();
  }

  public async toggle(target: number | string, animate: boolean = true): Promise<boolean> {
    const container = this.resolveContainer();

    if (!container) {
      return false;
    }

    const entries = this.resolveEntries(container);
    const entry = this.resolveTargetEntry(target, entries);

    if (!entry || entry.disabled) {
      return false;
    }

    if (this.openIndices.has(entry.index)) {
      return this.close(entry.index, animate);
    }

    return this.open(entry.index, animate);
  }

  public async open(target: number | string, animate: boolean = true): Promise<boolean> {
    const container = this.resolveContainer();

    if (!container) {
      return false;
    }

    const entries = this.resolveEntries(container);
    const entry = this.resolveTargetEntry(target, entries);

    if (!entry || entry.disabled) {
      return false;
    }

    if (this.openIndices.has(entry.index)) {
      return true;
    }

    const nextSet = this.multiple ? new Set(this.openIndices) : new Set<number>();

    nextSet.add(entry.index);

    return this.applyTargetIndices(nextSet, entry.index, true, animate);
  }

  public async close(target: number | string, animate: boolean = true): Promise<boolean> {
    const container = this.resolveContainer();

    if (!container) {
      return false;
    }

    const entries = this.resolveEntries(container);
    const entry = this.resolveTargetEntry(target, entries);

    if (!entry || entry.disabled) {
      return false;
    }

    if (!this.openIndices.has(entry.index)) {
      return true;
    }

    if (this['no-collapsible'] && this.openIndices.size <= 1) {
      return false;
    }

    const nextSet = new Set(this.openIndices);

    nextSet.delete(entry.index);

    return this.applyTargetIndices(nextSet, entry.index, false, animate);
  }

  public async openAll(animate: boolean = true): Promise<boolean> {
    const container = this.resolveContainer();

    if (!container) {
      return false;
    }

    const entries = this.resolveEntries(container);
    const enabled = entries.filter(entry => !entry.disabled);

    if (enabled.length === 0) {
      return false;
    }

    if (!this.multiple) {
      if (this.openIndices.size > 0) {
        return true;
      }

      return this.open(enabled[0].index, animate);
    }

    const nextSet = new Set(enabled.map(entry => entry.index));

    return this.applyTargetIndices(nextSet, enabled[0].index, true, animate);
  }

  public async closeAll(animate: boolean = true): Promise<boolean> {
    const container = this.resolveContainer();

    if (!container) {
      return false;
    }

    const entries = this.resolveEntries(container);
    const nextSet = new Set<number>();

    if (this['no-collapsible']) {
      const keepIndex =
        this.activeIndices().find(idx => entries[idx] && !entries[idx].disabled) ??
        entries.find(entry => !entry.disabled)?.index;

      if (keepIndex !== undefined) {
        nextSet.add(keepIndex);
      }
    }

    const primaryClosed = this.activeIndices().find(idx => !nextSet.has(idx)) ?? -1;

    return this.applyTargetIndices(nextSet, primaryClosed, false, animate);
  }

  private initializeAccordion(): void {
    const container = this.resolveContainer();

    if (!container) {
      this.isInitialized = true;

      return;
    }

    const entries = this.resolveEntries(container);
    const initialSet = this.resolveInitialOpenSet(entries);

    this.openIndices = initialSet;
    this.syncActiveProp(initialSet);
    this.bindEvents();
    this.syncState(false);
    this.isInitialized = true;
  }

  private isOwnedByThis(el: Element): boolean {
    return el.closest('z-accordion') === this;
  }

  private isNavContainer(container: HTMLElement): boolean {
    return container.classList.contains('z-nav') && !container.classList.contains('z-accordion');
  }

  private normalizeScopedSelector(raw: string): string {
    return raw
      .split(',')
      .map(segment => segment.trim())
      .filter(Boolean)
      .map(segment => (segment.startsWith('>') ? `:scope ${segment}` : segment))
      .join(', ');
  }

  private resolveContainer(): HTMLElement | null {
    if (this.classList.contains('z-accordion') || this.classList.contains('z-nav')) {
      return this;
    }

    const explicit = Array.from(this.querySelectorAll<HTMLElement>('[data-part="list"]')).find(el =>
      this.isOwnedByThis(el),
    );

    if (explicit) {
      return explicit;
    }

    const semantic = Array.from(this.querySelectorAll<HTMLElement>('.z-accordion, .z-nav')).find(
      el => this.isOwnedByThis(el),
    );

    if (semantic) {
      return semantic;
    }

    const directChildren = Array.from(this.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.tagName !== 'SCRIPT' && child.tagName !== 'TEMPLATE',
    );

    const directLooksLikeItems = directChildren.some(
      child =>
        child.querySelector(':scope > .z-accordion-title, :scope > .z-accordion-content') !==
          null ||
        child.querySelector(
          ':scope > :is(h1, h2, h3, h4, h5, h6, header, div) > .z-accordion-title',
        ) !== null,
    );

    if (directLooksLikeItems) {
      return this;
    }

    return directChildren[0] ?? null;
  }

  private resolveEntries(container: HTMLElement): AccordionEntry[] {
    const isNav = this.isNavContainer(container);
    const customTargets = this.targets.trim();
    let candidateItems: HTMLElement[];

    if (customTargets) {
      candidateItems = Array.from(
        container.querySelectorAll<HTMLElement>(this.normalizeScopedSelector(customTargets)),
      ).filter(el => this.isOwnedByThis(el));
    } else if (isNav) {
      candidateItems = Array.from(container.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          (child.classList.contains('z-parent') ||
            child.querySelector(':scope > ul, :scope > .z-nav-sub') !== null),
      );
    } else {
      candidateItems = Array.from(container.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child.tagName !== 'SCRIPT' &&
          child.tagName !== 'TEMPLATE' &&
          !child.classList.contains('z-nav-header') &&
          !child.classList.contains('z-nav-divider') &&
          !child.hasAttribute('data-accordion-ignore'),
      );
    }

    const customTrigger = this.trigger.trim();
    const customContent = this.content.trim();
    const entries: AccordionEntry[] = [];

    for (const itemEl of candidateItems) {
      let triggerEl: HTMLElement | null = null;

      if (customTrigger) {
        triggerEl =
          Array.from(
            itemEl.querySelectorAll<HTMLElement>(this.normalizeScopedSelector(customTrigger)),
          ).find(el => this.isOwnedByThis(el) && el.closest('.z-accordion-content') === null) ??
          null;
      } else if (isNav) {
        triggerEl = itemEl.querySelector<HTMLElement>(':scope > a, :scope > button');
      } else {
        triggerEl = itemEl.querySelector<HTMLElement>(
          ':scope > .z-accordion-title, :scope > :is(h1, h2, h3, h4, h5, h6, header, div) > .z-accordion-title',
        );
      }

      let contentEl: HTMLElement | null = null;

      if (customContent) {
        contentEl =
          Array.from(
            itemEl.querySelectorAll<HTMLElement>(this.normalizeScopedSelector(customContent)),
          ).find(el => this.isOwnedByThis(el)) ?? null;
      } else if (isNav) {
        contentEl = itemEl.querySelector<HTMLElement>(':scope > ul, :scope > .z-nav-sub');
      } else {
        contentEl = itemEl.querySelector<HTMLElement>(':scope > .z-accordion-content');
      }

      if (!triggerEl || !contentEl) {
        continue;
      }

      const disabled =
        itemEl.classList.contains('z-disabled') ||
        itemEl.hasAttribute('disabled') ||
        triggerEl.classList.contains('z-disabled') ||
        triggerEl.hasAttribute('disabled');

      const index = entries.length;
      const value =
        triggerEl.dataset.value ?? itemEl.dataset.value ?? (itemEl.id ? itemEl.id : String(index));

      entries.push({
        index,
        itemEl,
        triggerEl,
        contentEl,
        disabled,
        value,
      });
    }

    return entries;
  }

  private resolveInitialOpenSet(entries: AccordionEntry[]): Set<number> {
    if (entries.length === 0) {
      return new Set();
    }

    if (this.hasAttribute('active')) {
      return this.parseActiveSelection(this.active, entries);
    }

    const openEntries = entries.filter(
      entry => !entry.disabled && entry.itemEl.classList.contains('z-open'),
    );

    const initialSet = new Set<number>();

    if (this.multiple) {
      for (const entry of openEntries) {
        initialSet.add(entry.index);
      }
    } else if (openEntries.length > 0) {
      initialSet.add(openEntries[0].index);
    }

    if (this['no-collapsible'] && initialSet.size === 0) {
      const firstEnabled = entries.find(entry => !entry.disabled);

      if (firstEnabled) {
        initialSet.add(firstEnabled.index);
      }
    }

    return initialSet;
  }

  private parseActiveSelection(raw: string, entries: AccordionEntry[]): Set<number> {
    const tokens = raw
      .split(/[\s,]+/)
      .map(token => token.trim())
      .filter(Boolean);

    const nextSet = new Set<number>();

    if (tokens.length > 0 && !tokens.includes('-1')) {
      for (const token of tokens) {
        const matched = this.resolveTargetEntry(token, entries);

        if (matched && !matched.disabled) {
          nextSet.add(matched.index);

          if (!this.multiple) {
            break;
          }
        }
      }
    }

    if (this['no-collapsible'] && nextSet.size === 0) {
      const firstEnabled = entries.find(entry => !entry.disabled);

      if (firstEnabled) {
        nextSet.add(firstEnabled.index);
      }
    }

    return nextSet;
  }

  private resolveTargetEntry(
    target: number | string,
    entries: AccordionEntry[],
  ): AccordionEntry | null {
    if (entries.length === 0) {
      return null;
    }

    if (typeof target === 'number') {
      if (!Number.isInteger(target) || target < 0 || target >= entries.length) {
        return null;
      }

      return entries[target];
    }

    const trimmed = target.trim();

    if (!trimmed) {
      return null;
    }

    if (/^-?\d+$/.test(trimmed)) {
      return this.resolveTargetEntry(Number.parseInt(trimmed, 10), entries);
    }

    return (
      entries.find(
        entry =>
          entry.value === trimmed ||
          entry.itemEl.id === trimmed ||
          entry.triggerEl.getAttribute('href') === trimmed ||
          entry.triggerEl.getAttribute('href') === `#${trimmed}`,
      ) ?? null
    );
  }

  private syncActiveProp(indices: Set<number>): void {
    const sorted = Array.from(indices).sort((a, b) => a - b);

    this._active = sorted.length > 0 ? sorted.join(',') : '-1';
  }

  private syncState(animate: boolean): void {
    const container = this.resolveContainer();

    if (!container) {
      return;
    }

    const entries = this.resolveEntries(container);

    this.syncEntriesMetadata(entries);

    for (const entry of entries) {
      const isOpen = this.openIndices.has(entry.index);

      if (isOpen) {
        this.unwrapDeferredTemplate(entry);
      }

      if (!animate && !this.animatingPanels.has(entry.contentEl)) {
        entry.contentEl.hidden = !isOpen;
      }
    }
  }

  private syncEntriesMetadata(entries: AccordionEntry[]): void {
    const openCount = this.openIndices.size;

    for (const entry of entries) {
      const isOpen = this.openIndices.has(entry.index);
      const isNonCollapsibleLock = this['no-collapsible'] && openCount <= 1 && isOpen;

      if (!entry.triggerEl.id) {
        entry.triggerEl.id = `z-accordion-trigger-${this.uid}-${entry.index}`;
      }

      if (!entry.contentEl.id) {
        entry.contentEl.id = `z-accordion-panel-${this.uid}-${entry.index}`;
      }

      entry.itemEl.classList.toggle('z-open', isOpen);

      if (entry.triggerEl.tagName !== 'BUTTON' && !entry.triggerEl.hasAttribute('role')) {
        entry.triggerEl.setAttribute('role', 'button');
      }

      if (entry.disabled) {
        if (entry.triggerEl.tagName !== 'BUTTON') {
          entry.triggerEl.setAttribute('tabindex', '-1');
        }
      } else if (
        entry.triggerEl.tagName !== 'BUTTON' &&
        !(entry.triggerEl.tagName === 'A' && entry.triggerEl.hasAttribute('href')) &&
        !entry.triggerEl.hasAttribute('tabindex')
      ) {
        entry.triggerEl.setAttribute('tabindex', '0');
      } else if (
        entry.triggerEl.tagName === 'A' &&
        entry.triggerEl.getAttribute('tabindex') === '-1'
      ) {
        entry.triggerEl.removeAttribute('tabindex');
      }

      entry.triggerEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      entry.triggerEl.setAttribute('aria-controls', entry.contentEl.id);

      if (entry.disabled || isNonCollapsibleLock) {
        entry.triggerEl.setAttribute('aria-disabled', 'true');
      } else {
        entry.triggerEl.removeAttribute('aria-disabled');
      }

      if (
        entry.contentEl.tagName !== 'UL' &&
        entry.contentEl.tagName !== 'OL' &&
        !entry.contentEl.hasAttribute('role')
      ) {
        entry.contentEl.setAttribute('role', 'region');
      }

      entry.contentEl.setAttribute('aria-labelledby', entry.triggerEl.id);
    }
  }

  private unwrapDeferredTemplate(entry: AccordionEntry): void {
    this.unwrapTemplate(entry.contentEl, {
      index: entry.index,
      item: entry.itemEl,
      content: entry.contentEl,
    });
  }

  private createItemDetail(entry: AccordionEntry): Record<string, unknown> {
    return {
      index: entry.index,
      item: entry.itemEl,
      trigger: entry.triggerEl,
      content: entry.contentEl,
      value: entry.value,
    };
  }

  private async applyTargetIndices(
    nextSet: Set<number>,
    primaryIndex: number,
    primaryOpen: boolean,
    animate: boolean,
  ): Promise<boolean> {
    const container = this.resolveContainer();

    if (!container) {
      return false;
    }

    const entries = this.resolveEntries(container);
    const toOpen: AccordionEntry[] = [];
    const toClose: AccordionEntry[] = [];

    for (const entry of entries) {
      const wasOpen = this.openIndices.has(entry.index);
      const willOpen = nextSet.has(entry.index);

      if (!wasOpen && willOpen) {
        toOpen.push(entry);
      } else if (wasOpen && !willOpen) {
        toClose.push(entry);
      }
    }

    if (toOpen.length === 0 && toClose.length === 0) {
      return true;
    }

    for (const entry of toOpen) {
      if (!this.emit('before-show', this.createItemDetail(entry), true)) {
        this.syncActiveProp(this.openIndices);

        return false;
      }
    }

    for (const entry of toClose) {
      if (!this.emit('before-hide', this.createItemDetail(entry), true)) {
        this.syncActiveProp(this.openIndices);

        return false;
      }
    }

    this.openIndices = new Set(nextSet);
    this.syncActiveProp(this.openIndices);
    this.syncEntriesMetadata(entries);

    for (const entry of toOpen) {
      this.unwrapDeferredTemplate(entry);
      this.emit('show', this.createItemDetail(entry));
    }

    for (const entry of toClose) {
      this.emit('hide', this.createItemDetail(entry));
    }

    const primaryEntry = primaryIndex >= 0 ? (entries[primaryIndex] ?? null) : null;

    this.emit('change', {
      activeIndices: this.activeIndices(),
      index: primaryIndex,
      open: primaryOpen,
      item: primaryEntry?.itemEl ?? null,
      trigger: primaryEntry?.triggerEl ?? null,
      content: primaryEntry?.contentEl ?? null,
      value: primaryEntry?.value ?? null,
    });

    const transitions: Promise<void>[] = [];

    for (const entry of toOpen) {
      transitions.push(this.animatePanel(entry, true, animate));
    }

    for (const entry of toClose) {
      transitions.push(this.animatePanel(entry, false, animate));
    }

    await Promise.all(transitions);

    return true;
  }

  private clearPanelOverflow(panel: HTMLElement): void {
    panel.style.removeProperty('overflow');
    this.cleanEmptyStyle(panel);
  }

  private animatePanel(entry: AccordionEntry, show: boolean, animate: boolean): Promise<void> {
    const panel = entry.contentEl;
    const durationMs = Number.isFinite(this.duration) && this.duration >= 0 ? this.duration : 150;
    const reducedMotion = this.prefersReducedMotion();
    const canAnimate =
      !this['no-animation'] &&
      animate &&
      !reducedMotion &&
      durationMs > 0 &&
      typeof window !== 'undefined' &&
      typeof panel.animate === 'function';

    const inFlight = this.panelAnimations.get(panel);
    let startHeight = 0;
    let startPt = '0px';
    let startPb = '0px';
    let startMt = '0px';
    let startMb = '0px';
    let startOpacity = show ? 0 : 1;

    if (inFlight || !show) {
      const computed = window.getComputedStyle(panel);
      const parsedOpacity = Number.parseFloat(computed.opacity);

      startHeight = panel.getBoundingClientRect().height;
      startPt = computed.paddingTop;
      startPb = computed.paddingBottom;
      startMt = computed.marginTop;
      startMb = computed.marginBottom;
      startOpacity = Number.isFinite(parsedOpacity) ? parsedOpacity : show ? 0 : 1;
    }

    if (inFlight) {
      this.panelAnimations.delete(panel);
      this.animatingPanels.delete(panel);
      inFlight.animation.cancel();
    }

    if (!canAnimate) {
      this.clearPanelOverflow(panel);
      panel.hidden = !show;
      this.emit(show ? 'shown' : 'hidden', this.createItemDetail(entry));

      return Promise.resolve();
    }

    let fromFrame: Keyframe;
    let toFrame: Keyframe;

    if (show) {
      panel.hidden = false;
      this.clearPanelOverflow(panel);

      const computed = window.getComputedStyle(panel);
      const endHeight = panel.getBoundingClientRect().height;
      const endPt = computed.paddingTop;
      const endPb = computed.paddingBottom;
      const endMt = computed.marginTop;
      const endMb = computed.marginBottom;

      fromFrame = {
        height: `${startHeight}px`,
        paddingTop: startPt,
        paddingBottom: startPb,
        marginTop: startMt,
        marginBottom: startMb,
        opacity: startOpacity,
      };
      toFrame = {
        height: `${endHeight}px`,
        paddingTop: endPt,
        paddingBottom: endPb,
        marginTop: endMt,
        marginBottom: endMb,
        opacity: 1,
      };
    } else {
      if (panel.hidden) {
        this.clearPanelOverflow(panel);
        this.emit('hidden', this.createItemDetail(entry));

        return Promise.resolve();
      }

      fromFrame = {
        height: `${startHeight}px`,
        paddingTop: startPt,
        paddingBottom: startPb,
        marginTop: startMt,
        marginBottom: startMb,
        opacity: startOpacity,
      };
      toFrame = {
        height: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        opacity: 0,
      };
    }

    panel.style.overflow = 'hidden';

    const token = ++this.animationCounter;
    const animation = panel.animate([fromFrame, toFrame], {
      duration: durationMs,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });

    this.panelAnimations.set(panel, { animation, token });
    this.animatingPanels.add(panel);

    return new Promise(resolve => {
      const finalize = (cancelled: boolean) => {
        const current = this.panelAnimations.get(panel);

        if (current && current.token === token) {
          this.panelAnimations.delete(panel);
          this.animatingPanels.delete(panel);
          this.clearPanelOverflow(panel);

          if (!cancelled) {
            panel.hidden = !show;
            this.emit(show ? 'shown' : 'hidden', this.createItemDetail(entry));
          }
        }

        resolve();
      };

      animation.onfinish = () => finalize(false);
      animation.oncancel = () => finalize(true);
    });
  }

  private bindEvents(): void {
    if (this.isEventsBound) {
      return;
    }

    this.addEventListener('click', this.handleClick);
    this.addEventListener('keydown', this.handleKeydown);
    this.isEventsBound = true;
  }

  private detachListeners(): void {
    if (this.isEventsBound) {
      this.removeEventListener('click', this.handleClick);
      this.removeEventListener('keydown', this.handleKeydown);
      this.isEventsBound = false;
    }
  }

  private findOwnedEntryFromTarget(
    target: Element,
    entries: AccordionEntry[],
  ): AccordionEntry | null {
    for (const entry of entries) {
      if (entry.triggerEl.contains(target)) {
        return entry;
      }
    }

    return null;
  }

  private handleAccordionItemControl(control: HTMLElement, entries: AccordionEntry[]): void {
    const raw = control.getAttribute('data-accordion-item');

    if (raw === null) {
      return;
    }

    const cmd = raw.trim();

    if (!cmd) {
      return;
    }

    if (cmd === 'open-all') {
      void this.openAll();

      return;
    }

    if (cmd === 'close-all') {
      void this.closeAll();

      return;
    }

    if (cmd === 'next' || cmd === 'previous') {
      const enabled = entries.filter(entry => !entry.disabled);

      if (enabled.length === 0) {
        return;
      }

      const currentOpen = this.activeIndices()[0] ?? -1;
      const pos = enabled.findIndex(entry => entry.index === currentOpen);
      const step = cmd === 'next' ? 1 : -1;
      const nextPos = pos === -1 ? 0 : (pos + step + enabled.length) % enabled.length;

      void this.open(enabled[nextPos].index);

      return;
    }

    void this.toggle(cmd);
  }

  private handleClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const container = this.resolveContainer();

    if (!container) {
      return;
    }

    const entries = this.resolveEntries(container);

    const itemControl = event.target.closest<HTMLElement>('[data-accordion-item]');

    if (itemControl && this.isOwnedByThis(itemControl)) {
      event.preventDefault();
      this.handleAccordionItemControl(itemControl, entries);

      return;
    }

    const entry = this.findOwnedEntryFromTarget(event.target, entries);

    if (!entry) {
      return;
    }

    const ignoredEl = event.target.closest(
      '[data-accordion-ignore], [data-toggle], [data-open], [data-close]',
    );

    if (ignoredEl && ignoredEl !== entry.triggerEl && entry.triggerEl.contains(ignoredEl)) {
      return;
    }

    if (entry.triggerEl.tagName === 'A') {
      event.preventDefault();
    }

    if (entry.disabled) {
      return;
    }

    void this.toggle(entry.index);
  };

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || !(event.target instanceof Element)) {
      return;
    }

    const container = this.resolveContainer();

    if (!container) {
      return;
    }

    const entries = this.resolveEntries(container);
    const entry = this.findOwnedEntryFromTarget(event.target, entries);

    if (!entry) {
      return;
    }

    const enabled = entries.filter(item => !item.disabled);

    if (enabled.length === 0) {
      return;
    }

    const currentPos = enabled.findIndex(item => item.index === entry.index);
    let targetEntry: AccordionEntry | null = null;

    if (event.key === 'ArrowDown') {
      const nextPos = currentPos === -1 ? 0 : (currentPos + 1) % enabled.length;

      targetEntry = enabled[nextPos];
    } else if (event.key === 'ArrowUp') {
      const prevPos =
        currentPos === -1 ? enabled.length - 1 : (currentPos - 1 + enabled.length) % enabled.length;

      targetEntry = enabled[prevPos];
    } else if (event.key === 'Home') {
      targetEntry = enabled[0];
    } else if (event.key === 'End') {
      targetEntry = enabled[enabled.length - 1];
    }

    if (targetEntry) {
      event.preventDefault();
      targetEntry.triggerEl.focus();

      return;
    }

    if (event.key === ' ') {
      if (entry.triggerEl.tagName !== 'BUTTON') {
        event.preventDefault();

        if (!entry.disabled) {
          void this.toggle(entry.index);
        }
      }

      return;
    }

    if (
      event.key === 'Enter' &&
      entry.triggerEl.tagName !== 'BUTTON' &&
      entry.triggerEl.tagName !== 'A'
    ) {
      event.preventDefault();

      if (!entry.disabled) {
        void this.toggle(entry.index);
      }
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'z-accordion': Accordion;
  }
}
