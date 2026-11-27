import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
  type Placement,
  type Strategy,
} from '@floating-ui/dom';
import { Base } from '$hwc/components/shared/base';
import {
  type ActiveDropEntry,
  ensureToggleListener,
  getActiveDrops,
  registerActiveDrop,
  type ToggleableElement,
  unregisterActiveDrop,
} from '../helpers/toggle';

interface Cls extends Record<string, string> {
  drop: string;
}

interface Stl extends Record<string, string> {
  drop: string;
}

@customElement('z-drop')
export class Drop extends Base implements ToggleableElement, ActiveDropEntry {
  protected readonly 'cls-default-element': string = 'drop';

  protected readonly 'stl-default-element': string = 'drop';

  @property({ type: Boolean, reflect: true })
  open: boolean = false;

  @property({ type: Boolean })
  dropdown: boolean = false;

  @property({ type: String })
  placement: Placement = 'bottom-start';

  @property({ type: String })
  mode: string = 'click';

  @property({ type: String })
  trigger: string = '';

  @property({ type: Boolean })
  manual: boolean = false;

  @property({ type: Number, attribute: 'delay-show' })
  'delay-show': number = 0;

  @property({ type: Number, attribute: 'delay-hide' })
  'delay-hide': number = 150;

  @property({ type: String })
  stretch: string = '';

  @property({ type: Number })
  offset: number | undefined = undefined;

  @property({ type: Boolean })
  inline: boolean = false;

  @property({ type: Boolean })
  unmount: boolean = false;

  @property({ type: Boolean, attribute: 'close-on-scroll' })
  'close-on-scroll': boolean = false;

  @property({ type: Boolean, attribute: 'no-esc-close' })
  'no-esc-close': boolean = false;

  @property({ type: Boolean, attribute: 'no-bg-close' })
  'no-bg-close': boolean = false;

  @state()
  protected $open: boolean = false;

  @state()
  protected $mounted: boolean = false;

  @state()
  protected $cls: Cls = {
    drop: 'z-drop',
  };

  @state()
  protected $stl: Stl = {
    drop: '',
  };

  private HTMLDrop: HTMLElement | null = null;

  private boundTrigger: HTMLElement | null = null;

  private activeAnchor: HTMLElement | null = null;

  private siblingCandidate: HTMLElement | null = null;

  private cleanupAutoUpdate: (() => void) | null = null;

  private isTeleporting: boolean = false;

  private isSyncingOpen: boolean = false;

  private transitionToken: number = 0;

  private showTimer: number | null = null;

  private hideTimer: number | null = null;

  private pointerDownTriggered: boolean = false;

  private boundDropElement: HTMLElement | null = null;

  private isDocumentListenersAttached: boolean = false;

  private triggerCleanup: (() => void) | null = null;

  public get element(): HTMLElement {
    return this;
  }

  public get openOnPointerDown(): boolean {
    return this.hasMode('click');
  }

  public getAnchorElement(): HTMLElement | null {
    return this.activeAnchor ?? this.boundTrigger;
  }

  public containsNode(node: Node | null): boolean {
    if (!node) {
      return false;
    }

    return this.contains(node) || Boolean(this.HTMLDrop?.contains(node));
  }

  connectedCallback(): void {
    super.connectedCallback();
    ensureToggleListener();

    if (this.isTeleporting) {
      return;
    }

    if (!this.siblingCandidate && this.previousElementSibling instanceof HTMLElement) {
      this.siblingCandidate = this.previousElementSibling;
    }

    this.syncTriggerBinding();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.isTeleporting) {
      return;
    }

    this.clearTimers();
    this.detachTriggerBinding();
    this.detachDocumentListeners();
    this.stopAutoUpdate();
    unregisterActiveDrop(this);
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isSyncingOpen && changedProperties.has('open')) {
      if (this.open && !this.$open) {
        void this.show();
      } else if (!this.open && this.$open) {
        void this.hide();
      }
    }

    if (
      changedProperties.has('trigger') ||
      changedProperties.has('mode') ||
      changedProperties.has('manual')
    ) {
      this.syncTriggerBinding();
    }

    if (this.$open && (changedProperties.has('placement') || changedProperties.has('stretch'))) {
      void this.updatePosition();
    }
  }

  private hasMode(modeName: 'click' | 'hover'): boolean {
    const modes = this.mode
      .split(',')
      .map(part => part.trim().toLowerCase())
      .filter(Boolean);

    return modes.includes(modeName);
  }

  private clearTimers(): void {
    if (this.showTimer !== null) {
      window.clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private resolveTriggerElement(): HTMLElement | null {
    if (this.trigger && this.trigger !== 'false') {
      return (
        document.querySelector<HTMLElement>(this.trigger) ?? document.getElementById(this.trigger)
      );
    }

    if (this.id) {
      const explicitTrigger = document.querySelector<HTMLElement>(
        `[data-toggle="#${this.id}"], [data-toggle="${this.id}"], [data-open="#${this.id}"], [data-open="${this.id}"]`,
      );

      if (explicitTrigger) {
        return explicitTrigger;
      }
    }

    if (!this.manual && this.trigger !== 'false' && this.siblingCandidate) {
      const ignoredTags = ['SCRIPT', 'TEMPLATE', 'STYLE', 'Z-DROP', 'Z-DIALOG', 'Z-CMD'];

      if (!ignoredTags.includes(this.siblingCandidate.tagName)) {
        return this.siblingCandidate;
      }
    }

    return null;
  }

  private detachTriggerBinding(): void {
    if (this.triggerCleanup) {
      this.triggerCleanup();
      this.triggerCleanup = null;
    }

    this.boundTrigger = null;
  }

  private syncTriggerBinding(): void {
    const target = this.resolveTriggerElement();

    if (target === this.boundTrigger && this.triggerCleanup) {
      return;
    }

    this.detachTriggerBinding();

    if (!target) {
      return;
    }

    this.boundTrigger = target;

    if (!target.hasAttribute('aria-expanded')) {
      target.setAttribute('aria-expanded', this.$open ? 'true' : 'false');
    }

    const usesToggleHelper = target.hasAttribute('data-toggle') || target.hasAttribute('data-open');

    const onPointerDown = (event: PointerEvent) => {
      if (
        !this.hasMode('click') ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.pointerType === 'touch'
      ) {
        return;
      }

      this.pointerDownTriggered = true;
      void this.toggle(target);
    };

    const onPointerCancel = () => {
      this.pointerDownTriggered = false;
    };

    const onClick = (event: MouseEvent) => {
      if (this.pointerDownTriggered) {
        this.pointerDownTriggered = false;
        event.preventDefault();

        return;
      }

      if (!this.hasMode('click') || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      void this.toggle(target);
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (!this.hasMode('hover') || event.pointerType === 'touch') {
        return;
      }

      this.clearTimers();

      if (this.$open) {
        return;
      }

      if (this['delay-show'] <= 0) {
        void this.show(target);

        return;
      }

      this.showTimer = window.setTimeout(() => {
        this.showTimer = null;
        void this.show(target);
      }, this['delay-show']);
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (!this.hasMode('hover') || event.pointerType === 'touch') {
        return;
      }

      this.scheduleHoverHide();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' || (!this.$open && !this.hasMode('click'))) {
        return;
      }

      event.preventDefault();

      if (!this.$open) {
        void this.show(target).then(() => {
          this.focusNavItem('first');
        });

        return;
      }

      this.focusNavItem('first');
    };

    if (!usesToggleHelper) {
      target.addEventListener('pointerdown', onPointerDown);
      target.addEventListener('pointercancel', onPointerCancel);
      target.addEventListener('click', onClick);
    }

    target.addEventListener('pointerenter', onPointerEnter);
    target.addEventListener('pointerleave', onPointerLeave);
    target.addEventListener('keydown', onKeyDown);

    this.triggerCleanup = () => {
      if (!usesToggleHelper) {
        target.removeEventListener('pointerdown', onPointerDown);
        target.removeEventListener('pointercancel', onPointerCancel);
        target.removeEventListener('click', onClick);
      }

      target.removeEventListener('pointerenter', onPointerEnter);
      target.removeEventListener('pointerleave', onPointerLeave);
      target.removeEventListener('keydown', onKeyDown);
    };
  }

  private scheduleHoverHide(): void {
    this.clearTimers();

    if (!this.$open || !this.hasMode('hover')) {
      return;
    }

    const delay = Math.max(0, this['delay-hide']);

    this.hideTimer = window.setTimeout(() => {
      this.hideTimer = null;

      if (!this.isPointerOverDropOrAnchor()) {
        void this.hide(false);
      }
    }, delay);
  }

  private isPointerOverDropOrAnchor(): boolean {
    const anchor = this.getAnchorElement();

    return Boolean(anchor?.matches(':hover') || this.HTMLDrop?.matches(':hover'));
  }

  private isSameSiteHashAnchor(anchor: HTMLAnchorElement): boolean {
    return (
      Boolean(anchor.hash) &&
      anchor.pathname === window.location.pathname &&
      anchor.hostname === window.location.hostname
    );
  }

  private bindDropEvents(dropEl: HTMLElement | null): void {
    if (!dropEl || this.boundDropElement === dropEl) {
      return;
    }

    this.boundDropElement = dropEl;

    dropEl.addEventListener('pointerenter', (event: PointerEvent) => {
      if (this.hasMode('hover') && event.pointerType !== 'touch') {
        this.clearTimers();
      }
    });

    dropEl.addEventListener('pointerleave', (event: PointerEvent) => {
      if (this.hasMode('hover') && event.pointerType !== 'touch') {
        this.scheduleHoverHide();
      }
    });

    dropEl.addEventListener('click', (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;

      if (!target) {
        return;
      }

      if (target.closest('[data-toggle], [data-open], [data-close]')) {
        return;
      }

      if (target.closest('[class*="z-drop-close"], [role="menuitem"]')) {
        void this.hide(false);

        return;
      }

      const hashAnchor = target.closest<HTMLAnchorElement>('a[href*="#"]');

      if (hashAnchor && !event.defaultPrevented && this.isSameSiteHashAnchor(hashAnchor)) {
        const hashTarget = document.getElementById(hashAnchor.hash.slice(1));

        if (!hashTarget || !dropEl.contains(hashTarget)) {
          void this.hide(false);
        }
      }
    });

    dropEl.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!this.$open) {
        return;
      }

      const active = document.activeElement as HTMLElement | null;

      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.focusNavItem('next');
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.focusNavItem('prev');
          break;
        case 'Home':
          event.preventDefault();
          this.focusNavItem('first');
          break;
        case 'End':
          event.preventDefault();
          this.focusNavItem('last');
          break;
      }
    });
  }

  private getNavFocusableItems(): HTMLElement[] {
    if (!this.HTMLDrop) {
      return [];
    }

    return Array.from(
      this.HTMLDrop.querySelectorAll<HTMLElement>(
        '.z-dropdown-nav a[href], .z-dropdown-nav button:not(:disabled), [role="menuitem"]:not([aria-disabled="true"])',
      ),
    ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
  }

  private focusNavItem(direction: 'first' | 'last' | 'next' | 'prev'): void {
    const items = this.getNavFocusableItems();

    if (items.length === 0) {
      return;
    }

    const active = document.activeElement as HTMLElement | null;
    const currentIndex = active ? items.indexOf(active) : -1;

    if (direction === 'first' || (direction === 'next' && currentIndex === -1)) {
      items[0].focus();

      return;
    }

    if (direction === 'last' || (direction === 'prev' && currentIndex === -1)) {
      items[items.length - 1].focus();

      return;
    }

    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;

    items[nextIndex].focus();
  }

  private handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!this.$open || this['no-bg-close']) {
      return;
    }

    const target = event.target instanceof Node ? event.target : null;

    if (!target) {
      return;
    }

    if (this.containsNode(target) || this.activeAnchor?.contains(target)) {
      return;
    }

    const isInsideChildDrop = getActiveDrops().some(
      drop =>
        drop !== this && drop.containsNode(target) && this.containsNode(drop.getAnchorElement()),
    );

    if (isInsideChildDrop) {
      return;
    }

    void this.hide(false);
  };

  private handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || !this.$open) {
      return;
    }

    const drops = getActiveDrops();

    if (drops[drops.length - 1] !== this) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!this['no-esc-close']) {
      void this.hide(true);
    }
  };

  private handleDocumentScroll = (event: Event): void => {
    if (!this.$open || !this['close-on-scroll']) {
      return;
    }

    const target = event.target instanceof Node ? event.target : null;

    if (target && this.containsNode(target)) {
      return;
    }

    void this.hide(false);
  };

  private attachDocumentListeners(): void {
    if (this.isDocumentListenersAttached || typeof document === 'undefined') {
      return;
    }

    document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    document.addEventListener('keydown', this.handleDocumentKeyDown, true);

    if (this['close-on-scroll']) {
      window.addEventListener('scroll', this.handleDocumentScroll, true);
    }

    this.isDocumentListenersAttached = true;
  }

  private detachDocumentListeners(): void {
    if (!this.isDocumentListenersAttached || typeof document === 'undefined') {
      return;
    }

    document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    document.removeEventListener('keydown', this.handleDocumentKeyDown, true);
    window.removeEventListener('scroll', this.handleDocumentScroll, true);
    this.isDocumentListenersAttached = false;
  }

  private stopAutoUpdate(): void {
    if (this.cleanupAutoUpdate) {
      this.cleanupAutoUpdate();
      this.cleanupAutoUpdate = null;
    }
  }

  private readCssPixelVar(element: HTMLElement, varName: string, fallback: number): number {
    const raw = window.getComputedStyle(element).getPropertyValue(varName).trim();

    if (!raw) {
      return fallback;
    }

    const parsed = Number.parseFloat(raw);

    if (Number.isNaN(parsed)) {
      return fallback;
    }

    return raw.endsWith('rem') ? parsed * 16 : parsed;
  }

  private resolvePlacement(): Placement {
    if (this.hasAttribute('placement')) {
      return this.placement;
    }

    if (this.hasAttribute('floating') && typeof this.$floating.placement === 'string') {
      return this.$floating.placement as Placement;
    }

    return this.placement;
  }

  private async updatePosition(): Promise<void> {
    const anchor = this.activeAnchor ?? this.boundTrigger;

    if (!anchor || !this.HTMLDrop) {
      return;
    }

    const dropEl = this.HTMLDrop;
    const strategy: Strategy = this.inline ? 'absolute' : 'fixed';
    const hasFloatingAttr = this.hasAttribute('floating');
    const offsetValue =
      this.offset !== undefined
        ? this.offset
        : hasFloatingAttr && this.$floating.offset !== undefined
          ? Number(this.$floating.offset)
          : this.readCssPixelVar(dropEl, '--z-position-offset', 8);

    const shiftPadding =
      hasFloatingAttr && this.$floating.shiftPadding !== undefined
        ? Number(this.$floating.shiftPadding)
        : this.readCssPixelVar(dropEl, '--z-position-viewport-offset', 8);

    const middleware = [offset(offsetValue)];

    if (this.$floating.flip !== false && this.$floating.flip !== 'false') {
      middleware.push(flip());
    }

    if (this.$floating.shift !== false && this.$floating.shift !== 'false') {
      middleware.push(shift({ padding: shiftPadding }));
    }

    const hasStretch = this.hasAttribute('stretch') || Boolean(this.stretch);

    if (hasStretch) {
      const stretchMode = this.stretch || 'trigger';

      middleware.push(
        size({
          padding: shiftPadding,
          apply: ({ rects, availableWidth, availableHeight, elements }) => {
            if (stretchMode === 'fill') {
              Object.assign(elements.floating.style, {
                width: `${Math.max(0, availableWidth)}px`,
                maxHeight: `${Math.max(120, availableHeight)}px`,
              });
            } else {
              Object.assign(elements.floating.style, {
                minWidth: `${rects.reference.width}px`,
                maxHeight: `${Math.max(120, availableHeight)}px`,
              });
            }
          },
        }),
      );
    }

    const { x, y, placement } = await computePosition(anchor, dropEl, {
      placement: this.resolvePlacement(),
      strategy,
      middleware,
    });

    dropEl.dataset.side = placement.split('-')[0];

    Object.assign(dropEl.style, {
      position: strategy,
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  private computeZIndexAboveModals(): string {
    const openModals = Array.from(document.querySelectorAll<HTMLElement>('.z-modal.z-open'));

    if (openModals.length === 0) {
      return '';
    }

    let maxZ = 1010;

    for (const modal of openModals) {
      const parsed = Number.parseFloat(window.getComputedStyle(modal).zIndex);

      if (!Number.isNaN(parsed) && parsed > maxZ) {
        maxZ = parsed;
      }
    }

    return String(maxZ + 10);
  }

  private mountTemplate(): void {
    this.HTMLDrop = this.querySelector<HTMLElement>('[data-part="drop"]');

    if (!this.HTMLDrop) {
      return;
    }

    const template =
      this.HTMLTemplateContainer ??
      this.querySelector<HTMLTemplateElement>('template[data-fn="template"]');

    if (template) {
      const fragment = template.content.cloneNode(true) as DocumentFragment;
      const meaningfulNodes = Array.from(fragment.childNodes).filter(
        node => !(node.nodeType === Node.TEXT_NODE && !(node.textContent ?? '').trim()),
      );

      if (
        meaningfulNodes.length === 1 &&
        meaningfulNodes[0] instanceof Element &&
        meaningfulNodes[0].classList.contains('z-drop')
      ) {
        const wrapper = meaningfulNodes[0];

        while (wrapper.firstChild) {
          this.HTMLDrop.appendChild(wrapper.firstChild);
        }
      } else {
        this.HTMLDrop.appendChild(fragment);
      }
    }

    this.bindDropEvents(this.HTMLDrop);
  }

  private dispatchDropEvent(suffix: string, cancelable: boolean = false): boolean {
    return this.dispatchEvent(
      new CustomEvent(`z-drop:${suffix}`, {
        bubbles: true,
        composed: true,
        cancelable,
      }),
    );
  }

  private async syncOpenProp(value: boolean): Promise<void> {
    this.isSyncingOpen = true;
    this.open = value;
    await this.updateComplete;
    this.isSyncingOpen = false;
  }

  public async show(trigger?: HTMLElement | null): Promise<void> {
    this.clearTimers();

    const token = ++this.transitionToken;
    const anchor = trigger ?? this.activeAnchor ?? this.boundTrigger;

    if (!anchor) {
      return;
    }

    if (this.$open && this.activeAnchor === anchor) {
      return;
    }

    if (this.$open && this.activeAnchor !== anchor) {
      this.activeAnchor = anchor;
      this.stopAutoUpdate();

      if (this.HTMLDrop) {
        await this.updatePosition();
        this.cleanupAutoUpdate = autoUpdate(anchor, this.HTMLDrop, () => {
          void this.updatePosition();
        });
      }

      return;
    }

    const allowed = this.dispatchDropEvent('before-show', true);

    if (!allowed) {
      await this.syncOpenProp(false);

      return;
    }

    for (const other of [...getActiveDrops()]) {
      if (other !== this && !other.containsNode(anchor) && !other.containsNode(this)) {
        void other.hide(false);
      }
    }

    this.activeAnchor = anchor;
    anchor.setAttribute('aria-expanded', 'true');

    if (!this.inline && document.body && this.parentElement !== document.body) {
      this.isTeleporting = true;
      document.body.appendChild(this);
      this.isTeleporting = false;
    }

    if (!this.$mounted) {
      this.$mounted = true;
      await this.updateComplete;

      if (token !== this.transitionToken) {
        return;
      }

      this.mountTemplate();
      this.dispatchDropEvent('mount');
    }

    if (!this.HTMLDrop) {
      return;
    }

    registerActiveDrop(this);
    this.attachDocumentListeners();

    this.HTMLDrop.style.visibility = 'hidden';
    this.HTMLDrop.style.display = 'block';
    this.HTMLDrop.style.zIndex = this.computeZIndexAboveModals();

    await this.updatePosition();

    if (token !== this.transitionToken) {
      this.HTMLDrop.style.visibility = '';
      this.HTMLDrop.style.display = '';

      return;
    }

    this.stopAutoUpdate();
    this.cleanupAutoUpdate = autoUpdate(anchor, this.HTMLDrop, () => {
      void this.updatePosition();
    });

    this.HTMLDrop.style.visibility = '';
    this.HTMLDrop.style.display = '';
    this.HTMLDrop.classList.add('z-open');

    this.$open = true;
    await this.syncOpenProp(true);

    if (token !== this.transitionToken) {
      return;
    }

    this.dispatchDropEvent('show');
    this.dispatchDropEvent('shown');
  }

  public async hide(restoreFocus: boolean = false): Promise<void> {
    this.clearTimers();

    const token = ++this.transitionToken;

    if (!this.$open) {
      return;
    }

    const allowed = this.dispatchDropEvent('before-hide', true);

    if (!allowed) {
      await this.syncOpenProp(true);

      return;
    }

    for (const other of [...getActiveDrops()]) {
      if (other !== this && this.containsNode(other.getAnchorElement())) {
        void other.hide(false);
      }
    }

    this.stopAutoUpdate();
    this.detachDocumentListeners();
    unregisterActiveDrop(this);

    if (this.HTMLDrop) {
      this.HTMLDrop.classList.remove('z-open');
      this.HTMLDrop.style.zIndex = '';
    }

    this.$open = false;
    await this.syncOpenProp(false);

    if (token !== this.transitionToken) {
      return;
    }

    const anchor = this.activeAnchor;

    if (anchor) {
      anchor.setAttribute('aria-expanded', 'false');

      if (restoreFocus && anchor.isConnected) {
        anchor.focus({ preventScroll: true });
      }
    }

    this.dispatchDropEvent('hide');
    this.dispatchDropEvent('hidden');

    if (this.unmount && token === this.transitionToken && !this.$open) {
      await this.unmountDom();
    }
  }

  private async unmountDom(): Promise<void> {
    if (!this.$mounted) {
      return;
    }

    this.HTMLDrop = null;
    this.boundDropElement = null;
    this.$mounted = false;
    await this.updateComplete;
    this.dispatchDropEvent('destroy');
  }

  public async destroy(removeHost: boolean = false): Promise<void> {
    if (this.$open) {
      await this.hide(false);

      if (this.$open) {
        return;
      }
    }

    if (this.$mounted) {
      await this.unmountDom();
    }

    if (removeHost) {
      this.remove();
    }
  }

  public async toggle(trigger?: HTMLElement | null): Promise<void> {
    return this.$open ? this.hide(false) : this.show(trigger);
  }

  private getDropClasses(): string {
    const classes = [this.$cls['drop']];

    if (this.dropdown && !this.$cls['drop'].split(/\s+/).includes('z-dropdown')) {
      classes.push('z-dropdown');
    }

    if (this.HTMLDrop?.classList.contains('z-open')) {
      classes.push('z-open');
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
        data-part="drop"
        class="${this.getDropClasses()}"
        style="${this.$stl['drop']}"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-drop': Drop;
  }
}
