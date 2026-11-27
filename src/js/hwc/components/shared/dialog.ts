import { type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ensureToggleListener, getActiveDrops } from '../../helpers/toggle';
import type { Base } from './base';
import type { DropdownState } from './dropdown';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = abstract new (...args: any[]) => T;

interface ActiveDialogController {
  readonly 'no-esc-close': boolean;
  readonly HTMLDialogPanel: HTMLElement | null;
  hide(): Promise<void>;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

interface SavedScrollLockStyles {
  element: HTMLElement;
  overflowY: string;
  touchAction: string;
  scrollbarGutter: string;
}

const activeDialogs: ActiveDialogController[] = [];
let isKeydownListenerAttached = false;
let savedScrollLock: SavedScrollLockStyles | null = null;

function isElementVisible(element: HTMLElement): boolean {
  return element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => !el.hasAttribute('disabled') && isElementVisible(el),
  );
}

function syncModalPageClass(): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (activeDialogs.length > 0) {
    if (!savedScrollLock && typeof window !== 'undefined') {
      const el = (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
      const hasScrollbar = window.innerWidth > el.clientWidth;

      savedScrollLock = {
        element: el,
        overflowY: el.style.overflowY,
        touchAction: el.style.touchAction,
        scrollbarGutter: el.style.scrollbarGutter,
      };

      el.style.overflowY =
        typeof CSS !== 'undefined' && CSS.supports('overflow-y', 'clip') ? 'clip' : 'hidden';
      el.style.touchAction = 'none';

      if (hasScrollbar) {
        el.style.scrollbarGutter = 'stable';
      }
    }

    document.documentElement.classList.add('z-modal-page');

    return;
  }

  if (!document.querySelector('.z-modal.z-open')) {
    if (savedScrollLock) {
      const { element, overflowY, touchAction, scrollbarGutter } = savedScrollLock;

      element.style.overflowY = overflowY;
      element.style.touchAction = touchAction;
      element.style.scrollbarGutter = scrollbarGutter;

      if (element.getAttribute('style')?.trim() === '') {
        element.removeAttribute('style');
      }

      savedScrollLock = null;
    }

    document.documentElement.classList.remove('z-modal-page');
  }
}

function computeStackZIndex(overlay: HTMLElement): string {
  const openOverlays = Array.from(document.querySelectorAll<HTMLElement>('.z-modal.z-open')).filter(
    el => el !== overlay,
  );

  if (openOverlays.length === 0) {
    return '';
  }

  let maxZ = 1010;

  for (const el of openOverlays) {
    const parsed = Number.parseFloat(window.getComputedStyle(el).zIndex);

    if (!Number.isNaN(parsed) && parsed > maxZ) {
      maxZ = parsed;
    }
  }

  return String(maxZ + 1);
}

function isInsideActiveChildDrop(node: Node | null, panel: HTMLElement | null): boolean {
  if (!node || !panel) {
    return false;
  }

  return getActiveDrops().some(
    drop => drop.containsNode(node) && panel.contains(drop.getAnchorElement()),
  );
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  const top = activeDialogs[activeDialogs.length - 1];

  if (!top) {
    return;
  }

  if (event.key === 'Escape' && !event.defaultPrevented) {
    const activeDrops = getActiveDrops();

    if (activeDrops.length > 0) {
      const topDrop = activeDrops[activeDrops.length - 1];

      event.preventDefault();
      event.stopImmediatePropagation();

      if (!topDrop['no-esc-close']) {
        void topDrop.hide(true);
      }

      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!top['no-esc-close']) {
      void top.hide();
    }

    return;
  }

  if (event.key === 'Tab') {
    const panel = top.HTMLDialogPanel;

    if (!panel) {
      return;
    }

    const active = document.activeElement as HTMLElement | null;

    if (active && isInsideActiveChildDrop(active, panel)) {
      return;
    }

    const focusables = getFocusableElements(panel);

    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus();

      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!active || !panel.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();

      return;
    }

    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

function attachGlobalKeydown(): void {
  if (isKeydownListenerAttached || typeof document === 'undefined') {
    return;
  }

  document.addEventListener('keydown', handleDocumentKeydown, true);
  isKeydownListenerAttached = true;
}

function detachGlobalKeydownIfEmpty(): void {
  if (!isKeydownListenerAttached || activeDialogs.length > 0 || typeof document === 'undefined') {
    return;
  }

  document.removeEventListener('keydown', handleDocumentKeydown, true);
  isKeydownListenerAttached = false;
}

function parseCssTimeMs(value: string): number {
  const parts = value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  let maxMs = 0;

  for (const part of parts) {
    const numeric = Number.parseFloat(part);

    if (Number.isNaN(numeric)) {
      continue;
    }

    const ms = part.endsWith('ms') ? numeric : numeric * 1000;

    if (ms > maxMs) {
      maxMs = ms;
    }
  }

  return maxMs;
}

function waitForTransition(element: HTMLElement | null): Promise<void> {
  if (!element) {
    return Promise.resolve();
  }

  const style = window.getComputedStyle(element);
  const totalMs = parseCssTimeMs(style.transitionDuration) + parseCssTimeMs(style.transitionDelay);

  if (totalMs <= 0) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      element.removeEventListener('transitionend', onTransitionEnd);
      window.clearTimeout(timer);
      resolve();
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element) {
        finish();
      }
    };

    const timer = window.setTimeout(finish, totalMs + 50);

    element.addEventListener('transitionend', onTransitionEnd);
  });
}

export const DialogMixin = <TBase extends Constructor<Base>>(BaseClass: TBase) => {
  abstract class DialogBase extends BaseClass implements DropdownState, ActiveDialogController {
    @property({ type: Boolean, reflect: true })
    open: boolean = false;

    @property({ type: Boolean })
    center: boolean = false;

    @property({ type: Boolean })
    container: boolean = false;

    @property({ type: Boolean })
    full: boolean = false;

    @property({ type: Boolean })
    stack: boolean = false;

    @property({ type: Boolean })
    inline: boolean = false;

    @property({ type: Boolean })
    'no-bg-close': boolean = false;

    @property({ type: Boolean })
    'no-esc-close': boolean = false;

    @property({ type: Boolean })
    unmount: boolean = false;

    @state()
    $open: boolean = false;

    @state()
    protected $mounted: boolean = false;

    HTMLOverlay: HTMLElement | null = null;

    HTMLDialogPanel: HTMLElement | null = null;

    protected triggerElement: HTMLElement | null = null;

    protected isTeleporting: boolean = false;

    private isSyncingOpen: boolean = false;

    private transitionToken: number = 0;

    private boundOverlay: HTMLElement | null = null;

    private pointerDownOnOverlay: boolean = false;

    protected abstract readonly 'dialog-event-prefix': string;

    connectedCallback(): void {
      super.connectedCallback();
      ensureToggleListener();
    }

    disconnectedCallback(): void {
      super.disconnectedCallback();

      if (this.isTeleporting) {
        return;
      }

      this.removeFromActiveDialogs();
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
    }

    protected bindOverlayEvents(overlay: HTMLElement | null): void {
      if (!overlay || this.boundOverlay === overlay) {
        return;
      }

      this.boundOverlay = overlay;

      overlay.addEventListener('pointerdown', (event: PointerEvent) => {
        this.pointerDownOnOverlay = event.target === overlay;
      });

      overlay.addEventListener('click', (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target : null;

        if (target?.closest('[class*="z-modal-close"]')) {
          event.preventDefault();
          void this.hide();

          return;
        }

        if (this.pointerDownOnOverlay && event.target === overlay && !this['no-bg-close']) {
          void this.hide();
        }

        this.pointerDownOnOverlay = false;
      });
    }

    private dispatchDialogEvent(suffix: string, cancelable: boolean = false): boolean {
      const eventName = `${this['dialog-event-prefix']}:${suffix}`;

      return this.dispatchEvent(
        new CustomEvent(eventName, {
          bubbles: true,
          composed: true,
          cancelable,
        }),
      );
    }

    private removeFromActiveDialogs(): void {
      const index = activeDialogs.indexOf(this);

      if (index !== -1) {
        activeDialogs.splice(index, 1);
      }

      detachGlobalKeydownIfEmpty();
      syncModalPageClass();
    }

    private async syncOpenProp(value: boolean): Promise<void> {
      this.isSyncingOpen = true;
      this.open = value;
      await this.updateComplete;
      this.isSyncingOpen = false;
    }

    public async show(trigger?: HTMLElement | null): Promise<void> {
      const token = ++this.transitionToken;

      if (this.$open) {
        return;
      }

      const allowed = this.dispatchDialogEvent('before-show', true);

      if (!allowed) {
        await this.syncOpenProp(false);

        return;
      }

      if (!this.stack && activeDialogs.length > 0) {
        const others = activeDialogs.filter(dialog => dialog !== this);

        await Promise.all(others.map(dialog => dialog.hide()));

        if (token !== this.transitionToken) {
          return;
        }
      }

      const rawTrigger =
        trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      const parentDrop = rawTrigger
        ? getActiveDrops().find(drop => drop.containsNode(rawTrigger))
        : undefined;
      const resolvedTrigger =
        parentDrop && !this.contains(parentDrop.getAnchorElement())
          ? parentDrop.getAnchorElement()
          : rawTrigger;

      this.triggerElement = resolvedTrigger && resolvedTrigger !== this ? resolvedTrigger : null;

      for (const drop of [...getActiveDrops()]) {
        if (!this.contains(drop.getAnchorElement())) {
          void drop.hide(false);
        }
      }

      if (this.triggerElement?.hasAttribute('aria-expanded')) {
        this.triggerElement.setAttribute('aria-expanded', 'true');
      }

      if (!this.inline && document.body && this.parentElement !== document.body) {
        this.isTeleporting = true;
        document.body.appendChild(this);
        this.isTeleporting = false;
      }

      await this.updateComplete;

      if (token !== this.transitionToken) {
        return;
      }

      if (!this.$mounted) {
        this.$mounted = true;
        await this.updateComplete;

        if (token !== this.transitionToken) {
          return;
        }

        this.onDialogMount();
        await this.updateComplete;

        if (token !== this.transitionToken) {
          return;
        }

        this.dispatchDialogEvent('mount');
      }

      if (!activeDialogs.includes(this)) {
        activeDialogs.push(this);
      }

      attachGlobalKeydown();
      syncModalPageClass();

      this.$open = true;
      await this.syncOpenProp(true);

      if (token !== this.transitionToken) {
        return;
      }

      if (this.HTMLOverlay) {
        this.HTMLOverlay.style.zIndex = computeStackZIndex(this.HTMLOverlay);

        const isCentered =
          this.center ||
          Boolean(this.HTMLDialogPanel?.classList.contains('z-margin-auto-vertical'));

        if (isCentered) {
          this.HTMLOverlay.classList.add('z-flex');
          this.HTMLOverlay.style.display = '';
        } else {
          this.HTMLOverlay.classList.remove('z-flex');
          this.HTMLOverlay.style.display = 'block';
        }

        void this.HTMLOverlay.offsetHeight;
        void this.HTMLDialogPanel?.offsetHeight;

        if (token !== this.transitionToken || !this.$open) {
          return;
        }

        this.HTMLOverlay.classList.add('z-open');
      }

      this.dispatchDialogEvent('show');
      this.onDialogOpen();

      await waitForTransition(this.HTMLDialogPanel);

      if (token === this.transitionToken && this.$open) {
        this.dispatchDialogEvent('shown');
      }
    }

    public async hide(): Promise<void> {
      const token = ++this.transitionToken;

      if (!this.$open) {
        return;
      }

      const allowed = this.dispatchDialogEvent('before-hide', true);

      if (!allowed) {
        await this.syncOpenProp(true);

        return;
      }

      for (const drop of [...getActiveDrops()]) {
        if (this.HTMLDialogPanel?.contains(drop.getAnchorElement())) {
          void drop.hide(false);
        }
      }

      this.$open = false;
      await this.syncOpenProp(false);

      if (token !== this.transitionToken) {
        return;
      }

      this.HTMLOverlay?.classList.remove('z-open');
      this.dispatchDialogEvent('hide');

      await waitForTransition(this.HTMLDialogPanel);

      if (token !== this.transitionToken || this.$open) {
        return;
      }

      if (this.HTMLOverlay) {
        this.HTMLOverlay.classList.remove('z-flex');
        this.HTMLOverlay.style.display = '';
        this.HTMLOverlay.style.zIndex = '';
      }

      this.removeFromActiveDialogs();

      const withDropHook = this as unknown as { onDropClose?: () => void };

      withDropHook.onDropClose?.();
      this.onDialogClosed();

      if (this.triggerElement) {
        if (this.triggerElement.hasAttribute('aria-expanded')) {
          this.triggerElement.setAttribute('aria-expanded', 'false');
        }

        if (activeDialogs.length === 0 && this.triggerElement.isConnected) {
          this.triggerElement.focus({ preventScroll: true });
        }

        this.triggerElement = null;
      }

      this.dispatchDialogEvent('hidden');

      if (this.unmount && token === this.transitionToken && !this.$open) {
        await this.unmountDom();
      }
    }

    private async unmountDom(): Promise<void> {
      if (!this.$mounted) {
        return;
      }

      this.onDialogDestroy();
      this.HTMLOverlay = null;
      this.HTMLDialogPanel = null;
      this.boundOverlay = null;
      this.$mounted = false;
      await this.updateComplete;
      this.dispatchDialogEvent('destroy');
    }

    public async destroy(removeHost: boolean = false): Promise<void> {
      if (this.$open) {
        await this.hide();

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
      return this.$open ? this.hide() : this.show(trigger);
    }

    protected onDialogMount(): void {}

    protected onDialogOpen(): void {
      if (!this.HTMLDialogPanel) {
        return;
      }

      const autofocusEl = this.HTMLDialogPanel.querySelector<HTMLElement>('[autofocus]');

      if (autofocusEl && isElementVisible(autofocusEl)) {
        autofocusEl.focus();

        return;
      }

      const focusables = getFocusableElements(this.HTMLDialogPanel);

      if (focusables.length > 0) {
        focusables[0].focus();

        return;
      }

      this.HTMLDialogPanel.focus();
    }

    protected onDialogClosed(): void {}

    protected onDialogDestroy(): void {}
  }

  return DialogBase;
};
