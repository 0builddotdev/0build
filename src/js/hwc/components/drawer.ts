import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Hwc } from '$js/hwc/hwc';
import {
  computeVelocity,
  createClickSuppressor,
  recordVelocitySample,
  startPointerTrack,
  type DragVelocitySample,
} from '../../shared/helpers/gesture';
import { DialogMixin } from '../mixins/dialog';

export type DrawerPlacement = 'bottom' | 'top' | 'left' | 'right';

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

  @state()
  protected $cls = {
    overlay: 'z-modal z-drawer-overlay',
    drawer: 'z-drawer',
    handle: 'z-drawer-handle',
    'handle-bar': 'z-drawer-handle-bar',
    content: 'z-drawer-content',
  };

  private HTMLDrawerContent: HTMLElement | null = null;

  private boundPanel: HTMLElement | null = null;

  private stopDragTrack: (() => void) | null = null;

  private isDragging: boolean = false;

  private startedOnHandle: boolean = false;

  private startTarget: HTMLElement | null = null;

  private startX: number = 0;

  private startY: number = 0;

  private dragOriginX: number = 0;

  private dragOriginY: number = 0;

  private dragOffset: number = 0;

  private samples: DragVelocitySample[] = [];

  private savedBodyUserSelect: string = '';

  private hasSavedUserSelect: boolean = false;

  private readonly clickSuppressor = createClickSuppressor();

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

    this.adoptDialogTemplate(
      this.HTMLDrawerContent,
      ['z-drawer', 'z-offcanvas-bar'],
      '.z-modal-title, .z-drawer-title',
    );
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
    this.resetAdoptedDialog();
  }

  private bindDragEvents(panel: HTMLElement | null): void {
    if (!panel || this.boundPanel === panel) {
      return;
    }

    this.boundPanel = panel;
    panel.addEventListener('pointerdown', this.handlePointerDown);
    panel.addEventListener('click', this.clickSuppressor.onClickCapture, true);
  }

  private isInteractiveElement(target: HTMLElement): boolean {
    return Boolean(target.closest(INTERACTIVE_DESCENDANT_SELECTOR));
  }

  private canScrollBeforeDismiss(
    startTarget: HTMLElement | null,
    boundary: HTMLElement,
    side: DrawerPlacement,
  ): boolean {
    const isScrollable = (v: string) => v === 'auto' || v === 'scroll';
    let current: HTMLElement | null = startTarget;

    while (current && current !== boundary.parentElement) {
      const style = window.getComputedStyle(current);
      const isVertical = side === 'bottom' || side === 'top';
      const scrollable = isVertical
        ? isScrollable(style.overflowY) && current.scrollHeight > current.clientHeight
        : isScrollable(style.overflowX) && current.scrollWidth > current.clientWidth;

      if (scrollable) {
        const atEdge =
          side === 'bottom'
            ? current.scrollTop > 0
            : side === 'top'
              ? current.scrollTop + current.clientHeight < current.scrollHeight - 1
              : side === 'left'
                ? current.scrollLeft + current.clientWidth < current.scrollWidth - 1
                : current.scrollLeft > 0;

        if (atEdge) {
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
    this.stopDragTrack?.();
    this.stopDragTrack = null;
    this.restoreUserSelect();
    this.isDragging = false;
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

    this.startedOnHandle = startedOnHandle;
    this.startTarget = target;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragOriginX = event.clientX;
    this.dragOriginY = event.clientY;
    this.dragOffset = 0;
    this.isDragging = false;
    this.samples = [];

    this.stopDragTrack?.();
    this.stopDragTrack = startPointerTrack(event.pointerId, {
      onMove: this.handlePointerMove,
      onUp: () => void this.handlePointerUp(),
      onCancel: this.handlePointerCancel,
    });
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.HTMLDialogPanel) {
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

      recordVelocitySample(this.samples, 0);
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

    recordVelocitySample(this.samples, rawDeltaFromOrigin);
  };

  private handlePointerUp = async (): Promise<void> => {
    if (!this.isDragging || !this.HTMLDialogPanel) {
      this.resetDragState(false);

      return;
    }

    const side = this.resolvedPlacement;
    const panel = this.HTMLDialogPanel;
    const panelSize = this.getPanelSize(panel, side);
    const offset = this.dragOffset;
    const velocity = computeVelocity(this.samples);

    this.clickSuppressor.arm();
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

  private handlePointerCancel = (): void => {
    this.resetDragState(true);
  };

  private getDrawerClasses(): string {
    return [this.$cls['drawer'], this.adoptedPanelClasses, this.isDragging && 'z-dragging']
      .filter(Boolean)
      .join(' ');
  }

  render() {
    if (!this.$mounted) {
      return nothing;
    }

    const aria = this.getDialogAria();
    const overlayClasses = this.getOverlayClasses(
      this['backdrop-blur'] &&
        !this.splitClasses(this.$cls['overlay']).includes('z-modal-blur') &&
        'z-modal-blur',
      this.isDragging && 'z-dragging',
    );

    return html`
      <div
        data-host-inner
        data-part="overlay"
        class="${overlayClasses}"
        style=${this.partStyle('overlay')}
      >
        <div
          data-part="drawer"
          data-side="${this.resolvedPlacement}"
          class="${this.getDrawerClasses()}"
          style=${this.partStyle('drawer', this.adoptedPanelStyle)}
          role="${aria.role}"
          aria-modal="true"
          aria-label="${ifDefined(aria.ariaLabel)}"
          aria-labelledby="${ifDefined(aria.labelledBy)}"
          tabindex="-1"
        >
          ${this['no-handle']
            ? nothing
            : html`
                <div
                  data-part="handle"
                  class="${this.$cls['handle']}"
                  style=${this.partStyle('handle')}
                  aria-hidden="true"
                >
                  <span
                    data-part="handle-bar"
                    class="${this.$cls['handle-bar']}"
                    style=${this.partStyle('handle-bar')}
                  ></span>
                </div>
              `}
          <div
            data-part="content"
            class="${this.$cls['content']}"
            style=${this.partStyle('content')}
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
