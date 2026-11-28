import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Hwc } from '$js/hwc/hwc';
import { randomString } from '../../shared/helpers/common';
import { DialogMixin } from '../mixins/dialog';

export type DrawerPlacement = 'bottom' | 'top' | 'left' | 'right';

interface Cls extends Record<string, string> {
  overlay: string;
  drawer: string;
  handle: string;
  'handle-bar': string;
  content: string;
}

interface Stl extends Record<string, string> {
  overlay: string;
  drawer: string;
  handle: string;
  'handle-bar': string;
  content: string;
}

interface DragSample {
  time: number;
  delta: number;
}

const VALID_PLACEMENTS = new Set<DrawerPlacement>(['bottom', 'top', 'left', 'right']);

const INTERACTIVE_DESCENDANT_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  'label',
  '[contenteditable="true"]',
  '[data-no-drag]',
  'z-input-range',
  'z-select',
  'z-rte',
].join(', ');

const DRAG_THRESHOLD_PX = 4;
const VELOCITY_WINDOW_MS = 120;
const VELOCITY_DISMISS_THRESHOLD = 0.45;
const MIN_FLICK_DISTANCE_PX = 12;

@customElement('z-drawer')
export class Drawer extends DialogMixin(Hwc) {
  protected readonly 'cls-default-element': string = 'drawer';

  protected readonly 'stl-default-element': string = 'drawer';

  protected readonly 'dialog-event-prefix': string = 'z-drawer';

  @property({ type: String })
  placement: DrawerPlacement = 'bottom';

  @property({ type: Boolean, attribute: 'no-handle' })
  'no-handle': boolean = false;

  @property({ type: Boolean, attribute: 'no-swipe' })
  'no-swipe': boolean = false;

  @property({ type: Boolean, attribute: 'blur' })
  'backdrop-blur': boolean = false;

  @property({ type: String, attribute: 'dialog-role' })
  dialogRole: 'dialog' | 'alertdialog' = 'dialog';

  @property({ type: String, attribute: 'aria-label' })
  ariaLabelText: string = '';

  @property({ type: String, attribute: 'aria-labelledby' })
  ariaLabelledbyText: string = '';

  @state()
  protected $cls: Cls = {
    overlay: 'z-modal z-drawer-overlay',
    drawer: 'z-drawer',
    handle: 'z-drawer-handle',
    'handle-bar': 'z-drawer-handle-bar',
    content: 'z-drawer-content',
  };

  @state()
  protected $stl: Stl = {
    overlay: '',
    drawer: '',
    handle: '',
    'handle-bar': '',
    content: '',
  };

  @state()
  private autoLabelledBy: string = '';

  @state()
  private adoptedDrawerClasses: string = '';

  @state()
  private adoptedDrawerStyle: string = '';

  @state()
  private adoptedDrawerRole: string = '';

  private HTMLDrawerContent: HTMLElement | null = null;

  private boundPanel: HTMLElement | null = null;

  private isTrackingDrag: boolean = false;

  private isDragging: boolean = false;

  private activePointerId: number = -1;

  private startedOnHandle: boolean = false;

  private startTarget: HTMLElement | null = null;

  private startX: number = 0;

  private startY: number = 0;

  private dragOriginX: number = 0;

  private dragOriginY: number = 0;

  private dragOffset: number = 0;

  private samples: DragSample[] = [];

  private savedBodyUserSelect: string = '';

  private hasSavedUserSelect: boolean = false;

  private suppressNextClick: boolean = false;

  private suppressClickTimer: number | null = null;

  private get resolvedPlacement(): DrawerPlacement {
    return VALID_PLACEMENTS.has(this.placement) ? this.placement : 'bottom';
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.isTeleporting) {
      return;
    }

    this.resetDragState(true);
  }

  protected override onDialogMount(): void {
    this.HTMLOverlay = this.querySelector<HTMLElement>('[data-part="overlay"]');
    this.HTMLDialogPanel = this.querySelector<HTMLElement>('[data-part="drawer"]');
    this.HTMLDrawerContent = this.querySelector<HTMLElement>('[data-part="content"]');

    this.adoptedDrawerClasses = '';
    this.adoptedDrawerStyle = '';
    this.adoptedDrawerRole = '';
    this.autoLabelledBy = '';

    const template =
      this.HTMLTemplateContainer ??
      this.querySelector<HTMLTemplateElement>(':scope > template[data-fn="template"]');

    if (template && this.HTMLDrawerContent) {
      const fragment = template.content.cloneNode(true) as DocumentFragment;
      const meaningfulNodes = Array.from(fragment.childNodes).filter(
        node => !(node.nodeType === Node.TEXT_NODE && !(node.textContent ?? '').trim()),
      );

      if (
        meaningfulNodes.length === 1 &&
        meaningfulNodes[0] instanceof Element &&
        (meaningfulNodes[0].classList.contains('z-drawer') ||
          meaningfulNodes[0].classList.contains('z-offcanvas-bar'))
      ) {
        const drawerWrapper = meaningfulNodes[0];

        this.adoptedDrawerClasses = Array.from(drawerWrapper.classList)
          .filter(cls => cls !== 'z-drawer' && cls !== 'z-offcanvas-bar')
          .join(' ');
        this.adoptedDrawerStyle = drawerWrapper.getAttribute('style') ?? '';

        const wrapperRole = drawerWrapper.getAttribute('role');

        if (wrapperRole === 'dialog' || wrapperRole === 'alertdialog') {
          this.adoptedDrawerRole = wrapperRole;
        }

        while (drawerWrapper.firstChild) {
          this.HTMLDrawerContent.appendChild(drawerWrapper.firstChild);
        }
      } else {
        this.HTMLDrawerContent.appendChild(fragment);
      }
    }

    if (!this.ariaLabelText && !this.ariaLabelledbyText && this.HTMLDrawerContent) {
      const titleEl = this.HTMLDrawerContent.querySelector<HTMLElement>(
        '.z-modal-title, .z-drawer-title',
      );

      if (titleEl) {
        if (!titleEl.id) {
          titleEl.id = `z-drawer-title-${randomString(6)}`;
        }

        this.autoLabelledBy = titleEl.id;
      }
    }

    this.bindOverlayEvents(this.HTMLOverlay);
    this.bindDragEvents(this.HTMLDialogPanel);
  }

  protected override onDialogHide(): void {
    this.resetDragState(true);
  }

  protected override onDialogDestroy(): void {
    this.resetDragState(true);
    this.HTMLDrawerContent = null;
    this.boundPanel = null;
    this.adoptedDrawerClasses = '';
    this.adoptedDrawerStyle = '';
    this.adoptedDrawerRole = '';
    this.autoLabelledBy = '';
  }

  private bindDragEvents(panel: HTMLElement | null): void {
    if (!panel || this.boundPanel === panel) {
      return;
    }

    this.boundPanel = panel;
    panel.addEventListener('pointerdown', this.handlePointerDown);
    panel.addEventListener('click', this.handlePanelClickCapture, true);
  }

  private handlePanelClickCapture = (event: MouseEvent): void => {
    if (!this.suppressNextClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.clearSuppressClick();
  };

  private scheduleSuppressClick(): void {
    this.suppressNextClick = true;

    if (this.suppressClickTimer !== null) {
      window.clearTimeout(this.suppressClickTimer);
    }

    this.suppressClickTimer = window.setTimeout(() => {
      this.suppressNextClick = false;
      this.suppressClickTimer = null;
    }, 100);
  }

  private clearSuppressClick(): void {
    this.suppressNextClick = false;

    if (this.suppressClickTimer !== null) {
      window.clearTimeout(this.suppressClickTimer);
      this.suppressClickTimer = null;
    }
  }

  private isInteractiveElement(target: HTMLElement): boolean {
    return Boolean(target.closest(INTERACTIVE_DESCENDANT_SELECTOR));
  }

  private canScrollBeforeDismiss(
    startTarget: HTMLElement | null,
    boundary: HTMLElement,
    side: DrawerPlacement,
  ): boolean {
    let current: HTMLElement | null = startTarget;

    while (current && current !== boundary.parentElement) {
      const style = window.getComputedStyle(current);

      if (side === 'bottom') {
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight &&
          current.scrollTop > 0
        ) {
          return true;
        }
      } else if (side === 'top') {
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          current.scrollHeight > current.clientHeight &&
          current.scrollTop + current.clientHeight < current.scrollHeight - 1
        ) {
          return true;
        }
      } else if (side === 'left') {
        if (
          (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
          current.scrollWidth > current.clientWidth &&
          current.scrollLeft + current.clientWidth < current.scrollWidth - 1
        ) {
          return true;
        }
      } else if (side === 'right') {
        if (
          (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
          current.scrollWidth > current.clientWidth &&
          current.scrollLeft > 0
        ) {
          return true;
        }
      }

      if (current === boundary) {
        break;
      }

      current = current.parentElement;
    }

    return false;
  }

  private getSignedDelta(dx: number, dy: number, side: DrawerPlacement): number {
    switch (side) {
      case 'bottom':
        return dy;
      case 'top':
        return -dy;
      case 'left':
        return -dx;
      case 'right':
        return dx;
    }
  }

  private getPanelSize(panel: HTMLElement, side: DrawerPlacement): number {
    const size = side === 'bottom' || side === 'top' ? panel.offsetHeight : panel.offsetWidth;

    return size > 0 ? size : 1;
  }

  private applyDragTransform(panel: HTMLElement, offset: number, side: DrawerPlacement): void {
    switch (side) {
      case 'bottom':
        panel.style.transform = `translate3d(0, ${offset}px, 0)`;
        break;
      case 'top':
        panel.style.transform = `translate3d(0, ${-offset}px, 0)`;
        break;
      case 'left':
        panel.style.transform = `translate3d(${-offset}px, 0, 0)`;
        break;
      case 'right':
        panel.style.transform = `translate3d(${offset}px, 0, 0)`;
        break;
    }
  }

  private attachDragWindowListeners(): void {
    if (this.isTrackingDrag || typeof window === 'undefined') {
      return;
    }

    this.isTrackingDrag = true;
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
  }

  private detachDragWindowListeners(): void {
    if (!this.isTrackingDrag || typeof window === 'undefined') {
      return;
    }

    this.isTrackingDrag = false;
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
  }

  private restoreUserSelect(): void {
    if (!this.hasSavedUserSelect || typeof document === 'undefined') {
      return;
    }

    document.body.style.userSelect = this.savedBodyUserSelect;

    if (document.body.getAttribute('style')?.trim() === '') {
      document.body.removeAttribute('style');
    }

    this.hasSavedUserSelect = false;
    this.savedBodyUserSelect = '';
  }

  private resetDragState(clearInlineStyles: boolean): void {
    this.detachDragWindowListeners();
    this.restoreUserSelect();
    this.isDragging = false;
    this.activePointerId = -1;
    this.startedOnHandle = false;
    this.startTarget = null;
    this.dragOffset = 0;
    this.samples = [];

    if (this.HTMLDialogPanel) {
      this.HTMLDialogPanel.classList.remove('z-dragging');

      if (clearInlineStyles) {
        this.HTMLDialogPanel.style.transform = '';
      }
    }

    if (this.HTMLOverlay) {
      this.HTMLOverlay.classList.remove('z-dragging');

      if (clearInlineStyles) {
        this.HTMLOverlay.style.opacity = '';
      }
    }
  }

  private recordSample(delta: number): void {
    const now = performance.now();
    const cutoff = now - VELOCITY_WINDOW_MS;

    this.samples.push({ time: now, delta });

    while (this.samples.length > 2 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }
  }

  private computeVelocity(): number {
    if (this.samples.length < 2) {
      return 0;
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const elapsed = last.time - first.time;

    if (elapsed <= 0) {
      return 0;
    }

    return (last.delta - first.delta) / elapsed;
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.$open || this['no-swipe'] || event.defaultPrevented) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;

    if (!target || !this.HTMLDialogPanel) {
      return;
    }

    const startedOnHandle = Boolean(target.closest('[data-part="handle"], [data-drawer-handle]'));

    if (event.pointerType === 'mouse' && !startedOnHandle) {
      return;
    }

    if (!startedOnHandle && this.isInteractiveElement(target)) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.startedOnHandle = startedOnHandle;
    this.startTarget = target;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragOriginX = event.clientX;
    this.dragOriginY = event.clientY;
    this.dragOffset = 0;
    this.isDragging = false;
    this.samples = [];

    this.attachDragWindowListeners();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId || !this.HTMLDialogPanel) {
      return;
    }

    const side = this.resolvedPlacement;

    if (!this.isDragging) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      const isVertical = side === 'bottom' || side === 'top';
      const primary = isVertical ? Math.abs(dy) : Math.abs(dx);
      const cross = isVertical ? Math.abs(dx) : Math.abs(dy);

      if (primary < DRAG_THRESHOLD_PX && cross < DRAG_THRESHOLD_PX) {
        return;
      }

      const rawDelta = this.getSignedDelta(dx, dy, side);

      if (!this.startedOnHandle) {
        if (
          cross > primary ||
          rawDelta <= 0 ||
          this.canScrollBeforeDismiss(this.startTarget, this.HTMLDialogPanel, side)
        ) {
          this.resetDragState(false);

          return;
        }
      }

      this.isDragging = true;
      this.dragOriginX = event.clientX;
      this.dragOriginY = event.clientY;
      this.HTMLDialogPanel.classList.add('z-dragging');
      this.HTMLOverlay?.classList.add('z-dragging');

      if (!this.hasSavedUserSelect && typeof document !== 'undefined') {
        this.savedBodyUserSelect = document.body.style.userSelect;
        this.hasSavedUserSelect = true;
        document.body.style.userSelect = 'none';
      }

      this.recordSample(0);
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const rawDeltaFromOrigin = this.getSignedDelta(
      event.clientX - this.dragOriginX,
      event.clientY - this.dragOriginY,
      side,
    );
    const offset = Math.max(0, rawDeltaFromOrigin);
    const panelSize = this.getPanelSize(this.HTMLDialogPanel, side);
    const progress = Math.min(1, offset / panelSize);

    this.dragOffset = offset;
    this.applyDragTransform(this.HTMLDialogPanel, offset, side);

    if (this.HTMLOverlay) {
      this.HTMLOverlay.style.opacity = String(Math.max(0, 1 - progress));
    }

    this.recordSample(rawDeltaFromOrigin);
  };

  private handlePointerUp = async (event: PointerEvent): Promise<void> => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    if (!this.isDragging || !this.HTMLDialogPanel) {
      this.resetDragState(false);

      return;
    }

    const side = this.resolvedPlacement;
    const panel = this.HTMLDialogPanel;
    const panelSize = this.getPanelSize(panel, side);
    const offset = this.dragOffset;
    const velocity = this.computeVelocity();

    this.scheduleSuppressClick();
    this.resetDragState(false);

    const shouldDismiss =
      velocity <= -VELOCITY_DISMISS_THRESHOLD
        ? false
        : (velocity >= VELOCITY_DISMISS_THRESHOLD && offset > MIN_FLICK_DISTANCE_PX) ||
          offset >= Math.min(panelSize * 0.35, 160);

    if (shouldDismiss) {
      await this.hide();

      if (this.$open) {
        panel.style.transform = '';

        if (this.HTMLOverlay) {
          this.HTMLOverlay.style.opacity = '';
        }
      }

      return;
    }

    panel.style.transform = '';

    if (this.HTMLOverlay) {
      this.HTMLOverlay.style.opacity = '';
    }
  };

  private handlePointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.resetDragState(true);
  };

  private getOverlayClasses(): string {
    const classes = [this.$cls['overlay']];

    if (this['backdrop-blur'] && !this.$cls['overlay'].split(/\s+/).includes('z-modal-blur')) {
      classes.push('z-modal-blur');
    }

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

    if (this.isDragging) {
      classes.push('z-dragging');
    }

    return classes.filter(Boolean).join(' ');
  }

  private getDrawerClasses(): string {
    const classes = [this.$cls['drawer'], this.adoptedDrawerClasses];

    if (this.isDragging) {
      classes.push('z-dragging');
    }

    return classes.filter(Boolean).join(' ');
  }

  private getDrawerStyle(): string {
    return [this.adoptedDrawerStyle, this.$stl['drawer']].filter(Boolean).join('; ');
  }

  render() {
    if (!this.$mounted) {
      return nothing;
    }

    const effectiveRole = this.adoptedDrawerRole || this.dialogRole || 'dialog';
    const labelledBy = this.ariaLabelledbyText || this.autoLabelledBy || undefined;
    const ariaLabel = labelledBy ? undefined : this.ariaLabelText || undefined;

    return html`
      <div
        data-host-inner
        data-part="overlay"
        class="${this.getOverlayClasses()}"
        style="${this.$stl['overlay']}"
      >
        <div
          data-part="drawer"
          data-side="${this.resolvedPlacement}"
          class="${this.getDrawerClasses()}"
          style="${this.getDrawerStyle()}"
          role="${effectiveRole}"
          aria-modal="true"
          aria-label="${ifDefined(ariaLabel)}"
          aria-labelledby="${ifDefined(labelledBy)}"
          tabindex="-1"
        >
          ${this['no-handle']
            ? nothing
            : html`
                <div
                  data-part="handle"
                  class="${this.$cls['handle']}"
                  style="${this.$stl['handle']}"
                  aria-hidden="true"
                >
                  <span
                    data-part="handle-bar"
                    class="${this.$cls['handle-bar']}"
                    style="${this.$stl['handle-bar']}"
                  ></span>
                </div>
              `}
          <div
            data-part="content"
            class="${this.$cls['content']}"
            style="${this.$stl['content']}"
          ></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-drawer': Drawer;
  }
}
