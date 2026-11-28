import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { isLayoutChild } from '$js/shared/base';
import { Controller } from '$js/controllers/controller';
import { createClickSuppressor } from '$js/shared/helpers/gesture';

const SORTABLE_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const AUTO_SCROLL_EDGE = 40;
const AUTO_SCROLL_SPEED = 0.35;
const INTERACTIVE_SELECTOR =
  'input, textarea, select, option, button, a[href], label, [contenteditable="true"]';

interface PointerDragSession {
  pointerId: number;
  started: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  placeholder: HTMLElement;
  originSortable: Sortable;
  originIndex: number;
  dragClone: HTMLElement | null;
  touchedSortables: Set<Sortable>;
  movedTarget: HTMLElement | null;
}

interface KeyboardGrabSession {
  item: HTMLElement;
  originSortable: Sortable;
  originIndex: number;
}

interface HandleStyleBackup {
  touchAction: string;
  userSelect: string;
}

interface Cls extends Record<string, string> {
  base: string;
  item: string;
  placeholder: string;
  drag: string;
  'drag-state': string;
  'no-drag': string;
  empty: string;
  custom: string;
}

@customElement('z-sortable')
export class Sortable extends Controller {
  protected readonly eventPrefix = 'z-sortable';

  protected override readonly 'cls-default-element': string = 'custom';

  protected override $cls: Cls = {
    base: 'z-sortable',
    item: 'z-sortable-item',
    placeholder: 'z-sortable-placeholder',
    drag: 'z-sortable-drag',
    'drag-state': 'z-drag',
    'no-drag': 'z-sortable-nodrag',
    empty: 'z-sortable-empty',
    custom: '',
  };

  @property({ type: String })
  target: string = '';

  @property({ type: String })
  group: string = '';

  @property({ type: String })
  handle: string = '';

  @property({ type: Number })
  threshold: number = 5;

  @property({ type: Number })
  duration: number = 150;

  @property({ type: Boolean, attribute: 'no-animation' })
  'no-animation': boolean = false;

  @property({ type: Boolean })
  disabled: boolean = false;

  private dragSession: PointerDragSession | null = null;

  private keyboardSession: KeyboardGrabSession | null = null;

  private autoScrollRafId: number | null = null;

  private lastAutoScrollTime: number = 0;

  private trackedHandles: Map<HTMLElement, HandleStyleBackup> = new Map();

  private managedContainers: Set<HTMLElement> = new Set();

  private animatingItems: Set<HTMLElement> = new Set();

  private activeAnimations: Set<Animation> = new Set();

  private mutationObserver: MutationObserver | null = null;

  private observedExternalContainer: HTMLElement | null = null;

  private mutationRafId: number | null = null;

  private isMutatingDom: boolean = false;

  private isMovingDomFocus: boolean = false;

  private readonly clickSuppressor = createClickSuppressor();

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerdown', this.onPointerDown);
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('focusout', this.onFocusOut);
    this.cleanupActivePointerDrag(true);
    this.clearKeyboardGrabState();
    this.disconnectMutationObserver();
    this.cancelMutationRaf();
    this.cancelAllAnimations();
    this.restoreAllHandleStyles();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeSortable();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (this.hasChanged(changedProperties, ['target', 'handle', 'disabled', 'cls'])) {
      if (changedProperties.has('disabled') && this.disabled) {
        this.cleanupActivePointerDrag(true);

        if (this.keyboardSession) {
          this.finishKeyboardGrab(true);
        }
      }

      if (changedProperties.has('cls')) {
        this.clearPrevClasses(this.managedContainers, this.$prevCls.base, this.$cls.base);
        this.clearPrevClasses(this.managedContainers, this.$prevCls.empty, this.$cls.empty);
      }

      this.refresh();
    }
  }

  public refresh(): void {
    const container = this.getTargetContainer();

    this.syncObservedContainer(container);
    this.syncContainerAndItems(container);
  }

  public items(): HTMLElement[] {
    return this.getContainerItems(this.getTargetContainer());
  }

  public serialize(attribute: string = 'data-id'): string[] {
    return this.items().map(
      item => item.getAttribute(attribute) ?? item.dataset.value ?? item.id ?? '',
    );
  }

  public async move(fromIndex: number, toIndex: number, animate: boolean = true): Promise<void> {
    const currentItems = this.items();

    if (
      fromIndex < 0 ||
      fromIndex >= currentItems.length ||
      toIndex < 0 ||
      toIndex >= currentItems.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const container = this.getTargetContainer();
    const item = currentItems[fromIndex];
    const reference =
      fromIndex < toIndex ? currentItems[toIndex].nextElementSibling : currentItems[toIndex];

    const moveFn = (): void => {
      if (reference) {
        container.insertBefore(item, reference);
      } else {
        container.appendChild(item);
      }
    };

    if (animate) {
      this.animateMutation(container, moveFn, item);
    } else {
      this.withDomMutation(moveFn);
    }

    this.syncContainerAndItems(container);

    const values = this.serialize();

    this.emit('moved', { item, index: toIndex, previousIndex: fromIndex, sortable: this });
    this.emit('change', {
      item,
      action: 'moved',
      index: toIndex,
      previousIndex: fromIndex,
      values,
    });
    this.emit('stop', { item, index: toIndex, sortable: this });

    await this.waitForAnimations();
  }

  private initializeSortable(): void {
    this.withDomMutation(() => {
      this.unwrapTemplate(this, {});
    });

    const container = this.getTargetContainer();

    this.syncContainerAndItems(container);
    this.addEventListener('pointerdown', this.onPointerDown);
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('focusout', this.onFocusOut);
    this.setupMutationObserver(container);
    this.isInitialized = true;
  }

  private belongsToThis(el: Element): boolean {
    return el === this || this.owns(el);
  }

  private getTargetContainer(): HTMLElement {
    const rawTarget = this.target.trim();

    if (rawTarget) {
      const selector = this.normalizeScopedSelector(rawTarget);

      try {
        const matched = this.querySelector<HTMLElement>(selector);

        if (matched && this.belongsToThis(matched)) {
          return this.unwrapTableBody(matched);
        }
      } catch {
        // Ignore invalid target selector
      }
    }

    const attrTarget = this.querySelector<HTMLElement>('[data-sortable-target]');

    if (attrTarget && this.belongsToThis(attrTarget)) {
      return this.unwrapTableBody(attrTarget);
    }

    const directChildren = Array.from(this.children).filter(isLayoutChild);

    if (directChildren.length === 1) {
      const onlyChild = directChildren[0];

      if (onlyChild.matches('ul, ol')) {
        return onlyChild;
      }

      if (onlyChild instanceof HTMLTableElement) {
        return this.unwrapTableBody(onlyChild);
      }
    }

    const directTbody = directChildren.find(
      (child): child is HTMLTableSectionElement => child instanceof HTMLTableSectionElement,
    );

    if (directTbody) {
      return directTbody;
    }

    return this;
  }

  private unwrapTableBody(el: HTMLElement): HTMLElement {
    if (el instanceof HTMLTableElement && el.tBodies.length > 0) {
      return el.tBodies[0];
    }

    return el;
  }

  private getContainerItems(container: HTMLElement): HTMLElement[] {
    return Array.from(container.children).filter(isLayoutChild);
  }

  private resolveItemHandles(item: HTMLElement): HTMLElement[] {
    const customHandle = this.handle.trim();

    if (customHandle) {
      try {
        const matches = Array.from(item.querySelectorAll<HTMLElement>(customHandle));

        if (item.matches(customHandle)) {
          matches.unshift(item);
        }

        return matches;
      } catch {
        return [];
      }
    }

    const dataHandles = Array.from(item.querySelectorAll<HTMLElement>('[data-sortable-handle]'));

    if (item.hasAttribute('data-sortable-handle')) {
      dataHandles.unshift(item);
    }

    if (dataHandles.length > 0) {
      return dataHandles;
    }

    return [];
  }

  private getKeyboardFocusTarget(item: HTMLElement): HTMLElement {
    const handles = this.resolveItemHandles(item);

    return handles.length > 0 ? handles[0] : item;
  }

  private syncContainerAndItems(container: HTMLElement = this.getTargetContainer()): void {
    const items = this.getContainerItems(container);

    this.managedContainers.add(container);

    for (const managed of this.managedContainers) {
      if (managed !== container) {
        this.toggleClasses(managed, this.$cls.empty, false);
      }
    }

    this.toggleClasses(container, this.$cls.base, true);
    this.toggleClasses(container, this.$cls.empty, items.length === 0);

    const activeHandles = new Set<HTMLElement>();

    for (const item of items) {
      if (!item.hasAttribute('data-sortable-item')) {
        item.setAttribute('data-sortable-item', '');
      }

      const explicitHandles = this.resolveItemHandles(item);
      const dragTargets = explicitHandles.length > 0 ? explicitHandles : [item];

      for (const dragEl of dragTargets) {
        activeHandles.add(dragEl);

        if (!this.disabled) {
          if (!this.trackedHandles.has(dragEl)) {
            this.trackedHandles.set(dragEl, {
              touchAction: dragEl.style.touchAction,
              userSelect: dragEl.style.userSelect,
            });
          }

          dragEl.style.touchAction = 'none';
          dragEl.style.userSelect = 'none';
        }
      }

      const focusTarget = explicitHandles.length > 0 ? explicitHandles[0] : item;

      if (!focusTarget.hasAttribute('aria-roledescription')) {
        focusTarget.setAttribute('aria-roledescription', 'sortable');
      }

      if (explicitHandles.length > 0 && !this.isNativelyInteractive(focusTarget)) {
        if (!focusTarget.hasAttribute('role')) {
          focusTarget.setAttribute('role', 'button');
        }
      }

      if (!this.disabled && !focusTarget.hasAttribute('tabindex')) {
        if (!this.isNaturallyFocusable(focusTarget)) {
          focusTarget.setAttribute('tabindex', '0');
        }
      }
    }

    for (const [trackedEl, backup] of this.trackedHandles) {
      if (this.disabled || !activeHandles.has(trackedEl) || !this.contains(trackedEl)) {
        trackedEl.style.touchAction = backup.touchAction;
        trackedEl.style.userSelect = backup.userSelect;
        this.cleanEmptyStyle(trackedEl);
        this.trackedHandles.delete(trackedEl);
      }
    }
  }

  private restoreAllHandleStyles(): void {
    for (const [trackedEl, backup] of this.trackedHandles) {
      trackedEl.style.touchAction = backup.touchAction;
      trackedEl.style.userSelect = backup.userSelect;
      this.cleanEmptyStyle(trackedEl);
    }

    this.trackedHandles.clear();
  }

  private isNativelyInteractive(el: HTMLElement): boolean {
    return el.matches('button, a[href]');
  }

  private isNaturallyFocusable(el: HTMLElement): boolean {
    return el.matches('button, input, select, textarea, a[href]');
  }

  private isNoDragTarget(target: Element, item: HTMLElement): boolean {
    if (target.closest('[data-sortable-nodrag]')) {
      return true;
    }

    const noDragClasses = this.splitClasses(this.$cls['no-drag']);

    for (const cls of noDragClasses) {
      if (target.closest(`.${CSS.escape(cls)}`)) {
        return true;
      }
    }

    const handles = this.resolveItemHandles(item);

    if (handles.length > 0) {
      return !handles.some(handleEl => handleEl === target || handleEl.contains(target));
    }

    const interactiveAncestor = target.closest(INTERACTIVE_SELECTOR);

    if (interactiveAncestor && interactiveAncestor !== item) {
      return true;
    }

    return false;
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.defaultPrevented || this.dragSession) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button > 0) {
      return;
    }

    const rawTarget = event.target;

    if (!(rawTarget instanceof Element)) {
      return;
    }

    const container = this.getTargetContainer();
    const items = this.getContainerItems(container);
    const placeholder = items.find(item => item === rawTarget || item.contains(rawTarget));

    if (!placeholder || this.isNoDragTarget(rawTarget, placeholder)) {
      return;
    }

    event.preventDefault();

    const originIndex = items.indexOf(placeholder);

    this.dragSession = {
      pointerId: event.pointerId,
      started: false,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      placeholder,
      originSortable: this,
      originIndex,
      dragClone: null,
      touchedSortables: new Set([this]),
      movedTarget: null,
    };

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerCancel);
    document.addEventListener('keydown', this.onDocumentKeyDown, true);
    document.addEventListener('dragstart', this.onNativeDragStart, true);

    if (this.threshold <= 0) {
      this.startPointerDrag();
    }
  };

  private onNativeDragStart = (event: DragEvent): void => {
    if (this.dragSession) {
      event.preventDefault();
    }
  };

  private onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.dragSession) {
      event.preventDefault();
      event.stopPropagation();
      this.cleanupActivePointerDrag(true);
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    const session = this.dragSession;

    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    session.currentX = event.clientX;
    session.currentY = event.clientY;

    if (!session.started) {
      const dx = Math.abs(session.currentX - session.startX);
      const dy = Math.abs(session.currentY - session.startY);

      if (dx <= this.threshold && dy <= this.threshold) {
        return;
      }

      if (!this.startPointerDrag()) {
        return;
      }
    }

    this.updatePointerDrag();
  };

  private onPointerUp = (event: PointerEvent): void => {
    const session = this.dragSession;

    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    this.cleanupActivePointerDrag(false);
  };

  private onPointerCancel = (event: PointerEvent): void => {
    const session = this.dragSession;

    if (!session || event.pointerId !== session.pointerId) {
      return;
    }

    this.cleanupActivePointerDrag(true);
  };

  private startPointerDrag(): boolean {
    const session = this.dragSession;

    if (!session || session.started) {
      return false;
    }

    const allowed = this.emit(
      'start',
      {
        item: session.placeholder,
        index: session.originIndex,
        sortable: this,
      },
      true,
    );

    if (!allowed) {
      this.cleanupActivePointerDrag(false);

      return false;
    }

    session.started = true;
    const rect = session.placeholder.getBoundingClientRect();
    const dragClone = this.createDragClone(session.placeholder, rect);

    this.toggleClasses(dragClone, this.$cls.drag, true);
    this.toggleClasses(dragClone, this.$cls.custom, true);
    document.body.appendChild(dragClone);
    session.dragClone = dragClone;

    this.toggleClasses(session.placeholder, this.$cls.placeholder, true);

    for (const item of this.items()) {
      this.toggleClasses(item, this.$cls.item, true);
    }

    this.toggleClasses(document.documentElement, this.$cls['drag-state'], true);

    this.startAutoScroll();
    this.updatePointerDrag();

    return true;
  }

  private createDragClone(element: HTMLElement, rect: DOMRect): HTMLElement {
    let clone: HTMLElement;

    if (element instanceof HTMLTableRowElement) {
      clone = document.createElement('div');
      clone.style.display = 'flex';
      clone.style.alignItems = 'stretch';

      for (const attr of Array.from(element.attributes)) {
        if (attr.name !== 'id' && attr.name !== 'style') {
          clone.setAttribute(attr.name, attr.value);
        }
      }

      const sourceCells = Array.from(element.children);

      for (const cell of sourceCells) {
        const cellRect = cell.getBoundingClientRect();
        const cellClone = document.createElement('div');

        for (const attr of Array.from(cell.attributes)) {
          if (attr.name !== 'id') {
            cellClone.setAttribute(attr.name, attr.value);
          }
        }

        cellClone.innerHTML = cell.innerHTML;
        cellClone.style.boxSizing = 'border-box';
        cellClone.style.width = `${cellRect.width}px`;
        cellClone.style.height = `${cellRect.height}px`;
        cellClone.style.flex = '0 0 auto';
        clone.appendChild(cellClone);
      }
    } else if (element instanceof HTMLLIElement) {
      clone = document.createElement('div');

      for (const attr of Array.from(element.attributes)) {
        if (attr.name !== 'id' && attr.name !== 'style') {
          clone.setAttribute(attr.name, attr.value);
        }
      }

      for (const child of Array.from(element.childNodes)) {
        clone.appendChild(child.cloneNode(true));
      }
    } else {
      clone = element.cloneNode(true) as HTMLElement;
    }

    clone.removeAttribute('id');

    for (const descendant of Array.from(clone.querySelectorAll('[id]'))) {
      descendant.removeAttribute('id');
    }

    clone.setAttribute('aria-hidden', 'true');
    clone.style.setProperty('margin', '0', 'important');
    clone.style.boxSizing = 'border-box';
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.transform = 'translate3d(0, 0, 0)';

    return clone;
  }

  private updatePointerDrag(): void {
    const session = this.dragSession;

    if (!session || !session.started || !session.dragClone || !session.placeholder.isConnected) {
      return;
    }

    const dx = session.currentX - session.startX;
    const dy = session.currentY - session.startY;

    session.dragClone.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

    const point = { x: session.currentX, y: session.currentY };
    const hitElement = document.elementFromPoint(point.x, point.y);
    const targetSortable = this.findCompatibleSortable(hitElement);

    if (!targetSortable || targetSortable.hasAnimatingItems()) {
      return;
    }

    const previousSortable = this.findCompatibleSortable(session.placeholder);

    if (!previousSortable) {
      return;
    }

    const targetContainer = targetSortable.getTargetContainer();
    const targetItems = targetSortable.getContainerItems(targetContainer);
    const hoverItem = this.findTargetItem(targetItems, point);

    let insertBeforeEl: Element | null | false = null;

    if (targetItems.length > 0) {
      if (!hoverItem) {
        if (targetSortable === previousSortable) {
          return;
        }

        const containerRect = targetContainer.getBoundingClientRect();

        if (point.y < containerRect.top + containerRect.height / 2) {
          insertBeforeEl = targetItems[0];
        } else {
          insertBeforeEl = null;
        }
      } else {
        if (hoverItem === session.placeholder) {
          return;
        }

        insertBeforeEl = this.findInsertTarget(
          targetContainer,
          hoverItem,
          session.placeholder,
          point,
          targetSortable === previousSortable && session.movedTarget !== hoverItem,
        );
      }
    }

    if (insertBeforeEl === false || insertBeforeEl === session.placeholder) {
      return;
    }

    const previousParent = session.placeholder.parentElement;

    if (
      previousParent === targetContainer &&
      ((insertBeforeEl && insertBeforeEl.previousElementSibling === session.placeholder) ||
        (!insertBeforeEl && targetContainer.lastElementChild === session.placeholder))
    ) {
      return;
    }

    if (targetSortable !== previousSortable) {
      previousSortable.removeItemAnimated(session.placeholder);
      session.movedTarget = hoverItem ?? null;
    } else {
      session.movedTarget = null;
    }

    targetSortable.insertItemAnimated(session.placeholder, insertBeforeEl);
    session.touchedSortables.add(targetSortable);

    if (previousSortable !== targetSortable) {
      previousSortable.syncContainerAndItems();
    }

    targetSortable.syncContainerAndItems();
    this.emit('move', {
      item: session.placeholder,
      sortable: this,
      targetSortable,
    });
  }

  private findCompatibleSortable(element: Element | null): Sortable | null {
    let current: Element | null = element;

    while (current) {
      const candidate = current instanceof Sortable ? current : current.closest('z-sortable');

      if (!(candidate instanceof Sortable)) {
        return null;
      }

      if (
        !candidate.disabled &&
        (candidate === this || (this.group !== '' && candidate.group === this.group))
      ) {
        return candidate;
      }

      current = candidate.parentElement;
    }

    return null;
  }

  private findTargetItem(
    items: HTMLElement[],
    point: { x: number; y: number },
  ): HTMLElement | null {
    for (const item of items) {
      const rect = item.getBoundingClientRect();

      if (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
      ) {
        return item;
      }
    }

    return null;
  }

  private findInsertTarget(
    container: HTMLElement,
    hoverItem: HTMLElement,
    placeholder: HTMLElement,
    point: { x: number; y: number },
    sameList: boolean,
  ): Element | null | false {
    const rect = hoverItem.getBoundingClientRect();

    if (!sameList) {
      if (!this.isHorizontalLayout(container, placeholder)) {
        return point.y < rect.top + rect.height / 2 ? hoverItem : hoverItem.nextElementSibling;
      }

      return point.x < rect.left + rect.width / 2 ? hoverItem : hoverItem.nextElementSibling;
    }

    const placeholderRect = placeholder.getBoundingClientRect();
    const sameRow = this.linesIntersect(
      placeholderRect.top,
      placeholderRect.bottom,
      rect.top,
      rect.bottom,
    );

    const pointerPos = sameRow ? point.x : point.y;
    const itemSize = sameRow ? rect.width : rect.height;
    const placeholderSize = sameRow ? placeholderRect.width : placeholderRect.height;
    const itemStart = sameRow ? rect.left : rect.top;
    const itemEnd = sameRow ? rect.right : rect.bottom;
    const placeholderStart = sameRow ? placeholderRect.left : placeholderRect.top;

    const sizeDiff = placeholderSize < itemSize ? itemSize - placeholderSize : 0;

    if (placeholderStart < itemStart) {
      if (sizeDiff > 0 && pointerPos < itemStart + sizeDiff) {
        return false;
      }

      return hoverItem.nextElementSibling;
    }

    if (sizeDiff > 0 && pointerPos > itemEnd - sizeDiff) {
      return false;
    }

    return hoverItem;
  }

  private isHorizontalLayout(container: HTMLElement, placeholder: HTMLElement): boolean {
    const items = this.getContainerItems(container);
    const wasSingle = items.length === 1 && !container.contains(placeholder);

    if (wasSingle) {
      this.withDomMutation(() => {
        container.appendChild(placeholder);
      });
    }

    const checkItems = this.getContainerItems(container);
    let horizontal = false;

    for (let i = 0; i < checkItems.length && !horizontal; i++) {
      const rectA = checkItems[i].getBoundingClientRect();

      for (let j = i + 1; j < checkItems.length; j++) {
        const rectB = checkItems[j].getBoundingClientRect();

        if (!this.linesIntersect(rectA.left, rectA.right, rectB.left, rectB.right)) {
          horizontal = true;
          break;
        }
      }
    }

    if (wasSingle) {
      this.withDomMutation(() => {
        placeholder.remove();
      });
    }

    return horizontal;
  }

  private linesIntersect(startA: number, endA: number, startB: number, endB: number): boolean {
    return endA > startB && endB > startA;
  }

  private startAutoScroll(): void {
    this.stopAutoScroll();
    this.lastAutoScrollTime = performance.now();

    const step = (now: number): void => {
      const session = this.dragSession;

      if (!session || !session.started) {
        this.autoScrollRafId = null;

        return;
      }

      const dt = Math.min(64, Math.max(8, now - this.lastAutoScrollTime));

      this.lastAutoScrollTime = now;
      const dist = dt * AUTO_SCROLL_SPEED;
      const didScroll = this.performAutoScroll(session.currentX, session.currentY, dist);

      if (didScroll) {
        this.updatePointerDrag();
      }

      this.autoScrollRafId = window.requestAnimationFrame(step);
    };

    this.autoScrollRafId = window.requestAnimationFrame(step);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollRafId !== null) {
      window.cancelAnimationFrame(this.autoScrollRafId);
      this.autoScrollRafId = null;
    }
  }

  private performAutoScroll(x: number, y: number, dist: number): boolean {
    const hit = document.elementFromPoint(x, y);
    const scrollContainers = this.getScrollAncestors(hit);

    for (const scrollEl of scrollContainers) {
      const isRoot =
        scrollEl === document.scrollingElement || scrollEl === document.documentElement;
      const rect = isRoot
        ? {
            top: 0,
            bottom: window.innerHeight,
            left: 0,
            right: window.innerWidth,
            height: window.innerHeight,
            width: window.innerWidth,
          }
        : scrollEl.getBoundingClientRect();

      let deltaY = 0;
      let deltaX = 0;

      if (y > rect.top && y < rect.top + AUTO_SCROLL_EDGE) {
        deltaY = -dist;
      } else if (y < rect.bottom && y > rect.bottom - AUTO_SCROLL_EDGE) {
        deltaY = dist;
      }

      if (x > rect.left && x < rect.left + AUTO_SCROLL_EDGE) {
        deltaX = -dist;
      } else if (x < rect.right && x > rect.right - AUTO_SCROLL_EDGE) {
        deltaX = dist;
      }

      if (deltaY !== 0) {
        const nextTop = Math.max(
          0,
          Math.min(scrollEl.scrollHeight - scrollEl.clientHeight, scrollEl.scrollTop + deltaY),
        );

        if (Math.abs(nextTop - scrollEl.scrollTop) > 0.5) {
          scrollEl.scrollTop = nextTop;

          return true;
        }
      }

      if (deltaX !== 0) {
        const nextLeft = Math.max(
          0,
          Math.min(scrollEl.scrollWidth - scrollEl.clientWidth, scrollEl.scrollLeft + deltaX),
        );

        if (Math.abs(nextLeft - scrollEl.scrollLeft) > 0.5) {
          scrollEl.scrollLeft = nextLeft;

          return true;
        }
      }
    }

    return false;
  }

  private getScrollAncestors(start: Element | null): HTMLElement[] {
    const result: HTMLElement[] = [];
    let current: Element | null = start;

    while (current && current !== document.documentElement) {
      if (current instanceof HTMLElement) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;

        if (
          overflowY === 'auto' ||
          overflowY === 'scroll' ||
          overflowX === 'auto' ||
          overflowX === 'scroll'
        ) {
          result.push(current);
        }
      }

      current = current.parentElement;
    }

    const root = document.scrollingElement;

    if (root instanceof HTMLElement) {
      result.push(root);
    }

    return result;
  }

  private cleanupActivePointerDrag(canceled: boolean): void {
    const session = this.dragSession;

    if (!session) {
      return;
    }

    this.dragSession = null;

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerCancel);
    document.removeEventListener('keydown', this.onDocumentKeyDown, true);
    document.removeEventListener('dragstart', this.onNativeDragStart, true);
    this.stopAutoScroll();

    if (!session.started) {
      return;
    }

    document.addEventListener('click', this.clickSuppressor.onClickCapture, true);
    this.clickSuppressor.arm();
    window.requestAnimationFrame(() => {
      document.removeEventListener('click', this.clickSuppressor.onClickCapture, true);
      this.clickSuppressor.clear();
    });

    if (session.dragClone) {
      session.dragClone.remove();
      session.dragClone = null;
    }

    for (const sortable of session.touchedSortables) {
      for (const item of sortable.items()) {
        this.toggleClasses(item, sortable.$cls.placeholder, false);
        this.toggleClasses(item, sortable.$cls.item, false);
      }
    }

    this.toggleClasses(session.placeholder, this.$cls.placeholder, false);
    this.toggleClasses(document.documentElement, this.$cls['drag-state'], false);

    if (canceled) {
      this.restoreItemToOrigin(session.originSortable, session.placeholder, session.originIndex);

      for (const sortable of session.touchedSortables) {
        sortable.syncContainerAndItems();
      }

      this.emit('cancel', { item: session.placeholder, sortable: this });
      this.emit('stop', { item: session.placeholder, index: session.originIndex, sortable: this });

      return;
    }

    for (const sortable of session.touchedSortables) {
      sortable.syncContainerAndItems();
    }

    this.emitCompletionEvents(session.originSortable, session.placeholder, session.originIndex);
  }

  private restoreItemToOrigin(
    originSortable: Sortable,
    item: HTMLElement,
    originIndex: number,
  ): void {
    const originContainer = originSortable.getTargetContainer();

    originSortable.withDomMutation(() => {
      const currentSiblings = originSortable
        .getContainerItems(originContainer)
        .filter(el => el !== item);
      const reference = currentSiblings[originIndex] ?? null;

      if (reference) {
        originContainer.insertBefore(item, reference);
      } else {
        originContainer.appendChild(item);
      }
    });
  }

  private emitCompletionEvents(
    originSortable: Sortable,
    item: HTMLElement,
    originIndex: number,
  ): void {
    const finalSortable = originSortable.findCompatibleSortable(item) ?? originSortable;
    const finalIndex = finalSortable.items().indexOf(item);

    if (finalSortable === originSortable) {
      if (finalIndex !== originIndex) {
        const values = originSortable.serialize();

        originSortable.emit('moved', {
          item,
          index: finalIndex,
          previousIndex: originIndex,
          sortable: originSortable,
        });
        originSortable.emit('change', {
          item,
          action: 'moved',
          index: finalIndex,
          previousIndex: originIndex,
          values,
        });
      }
    } else {
      finalSortable.emit('added', {
        item,
        index: finalIndex,
        from: originSortable,
        sortable: finalSortable,
      });
      finalSortable.emit('change', {
        item,
        action: 'added',
        index: finalIndex,
        previousIndex: originIndex,
        values: finalSortable.serialize(),
      });

      originSortable.emit('removed', {
        item,
        previousIndex: originIndex,
        to: finalSortable,
        sortable: originSortable,
      });
      originSortable.emit('change', {
        item,
        action: 'removed',
        index: -1,
        previousIndex: originIndex,
        values: originSortable.serialize(),
      });
    }

    originSortable.emit('stop', {
      item,
      index: finalIndex,
      sortable: finalSortable,
    });
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled || this.dragSession) {
      return;
    }

    const rawTarget = event.target;

    if (!(rawTarget instanceof HTMLElement)) {
      return;
    }

    const currentItems = this.items();
    const item = currentItems.find(el => el === rawTarget || el.contains(rawTarget));

    if (!item || rawTarget !== this.getKeyboardFocusTarget(item)) {
      return;
    }

    if (this.keyboardSession && this.keyboardSession.item !== item) {
      this.finishKeyboardGrab(false);
    }

    if (!this.keyboardSession) {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      const originIndex = currentItems.indexOf(item);
      const allowed = this.emit('start', { item, index: originIndex, sortable: this }, true);

      if (!allowed) {
        return;
      }

      this.keyboardSession = {
        item,
        originSortable: this,
        originIndex,
      };
      item.setAttribute('data-sortable-grabbed', 'true');

      return;
    }

    const session = this.keyboardSession;
    const currentIndex = currentItems.indexOf(item);

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.finishKeyboardGrab(false);

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.finishKeyboardGrab(true);

      return;
    }

    const isCrossGroupBack =
      event.key === 'PageUp' ||
      (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowLeft'));
    const isCrossGroupForward =
      event.key === 'PageDown' ||
      (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowRight'));

    if ((isCrossGroupBack || isCrossGroupForward) && this.group !== '') {
      const peers = Array.from(document.querySelectorAll<Sortable>('z-sortable')).filter(
        el => el instanceof Sortable && !el.disabled && el.group === this.group,
      );

      if (peers.length > 1) {
        const myPos = peers.indexOf(this);
        const step = isCrossGroupForward ? 1 : -1;
        const targetPeer = peers[(myPos + step + peers.length) % peers.length];

        if (targetPeer && targetPeer !== this) {
          event.preventDefault();
          this.transferKeyboardGrabTo(targetPeer, session);

          return;
        }
      }
    }

    let nextIndex = currentIndex;

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = Math.min(currentItems.length - 1, currentIndex + 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = currentItems.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    if (nextIndex === currentIndex) {
      return;
    }

    const container = this.getTargetContainer();
    const reference =
      nextIndex > currentIndex
        ? currentItems[nextIndex].nextElementSibling
        : currentItems[nextIndex];

    this.restoreFocusAroundMutation(item, () => {
      this.insertItemAnimated(item, reference);
      this.syncContainerAndItems(container);
    });

    this.emit('move', {
      item,
      sortable: session.originSortable,
      targetSortable: this,
    });
  };

  private onFocusOut = (event: FocusEvent): void => {
    const session = this.keyboardSession;

    if (!session || this.isMovingDomFocus) {
      return;
    }

    const related = event.relatedTarget;

    if (related instanceof Node && session.item.contains(related)) {
      return;
    }

    this.finishKeyboardGrab(false);
  };

  private transferKeyboardGrabTo(targetSortable: Sortable, session: KeyboardGrabSession): void {
    const { item, originSortable, originIndex } = session;

    this.keyboardSession = null;

    this.restoreFocusAroundMutation(item, () => {
      this.removeItemAnimated(item);
      this.syncContainerAndItems();

      targetSortable.insertItemAnimated(item, null);
      targetSortable.syncContainerAndItems();
      targetSortable.keyboardSession = {
        item,
        originSortable,
        originIndex,
      };
    });

    this.emit('move', {
      item,
      sortable: originSortable,
      targetSortable,
    });
  }

  private restoreFocusAroundMutation(item: HTMLElement, fn: () => void): void {
    this.isMovingDomFocus = true;

    try {
      fn();
      const targetSortable = this.findCompatibleSortable(item) ?? this;
      const focusEl = targetSortable.getKeyboardFocusTarget(item);

      if (document.activeElement !== focusEl) {
        focusEl.focus({ preventScroll: true });
      }
    } finally {
      this.isMovingDomFocus = false;
    }
  }

  private finishKeyboardGrab(canceled: boolean): void {
    const session = this.keyboardSession;

    if (!session) {
      return;
    }

    this.keyboardSession = null;
    session.item.removeAttribute('data-sortable-grabbed');

    if (canceled) {
      this.restoreFocusAroundMutation(session.item, () => {
        this.restoreItemToOrigin(session.originSortable, session.item, session.originIndex);
        this.syncContainerAndItems();

        if (session.originSortable !== this) {
          session.originSortable.syncContainerAndItems();
        }
      });

      session.originSortable.emit('cancel', {
        item: session.item,
        sortable: session.originSortable,
      });
      session.originSortable.emit('stop', {
        item: session.item,
        index: session.originIndex,
        sortable: session.originSortable,
      });

      return;
    }

    this.syncContainerAndItems();

    if (session.originSortable !== this) {
      session.originSortable.syncContainerAndItems();
    }

    this.emitCompletionEvents(session.originSortable, session.item, session.originIndex);
  }

  private clearKeyboardGrabState(): void {
    if (this.keyboardSession) {
      this.keyboardSession.item.removeAttribute('data-sortable-grabbed');
      this.keyboardSession = null;
    }
  }

  public hasAnimatingItems(): boolean {
    return this.animatingItems.size > 0;
  }

  public insertItemAnimated(item: HTMLElement, reference: Element | null): void {
    const container = this.getTargetContainer();

    this.toggleClasses(item, this.$cls.item, true);

    this.animateMutation(
      container,
      () => {
        if (reference && reference.parentElement === container) {
          container.insertBefore(item, reference);
        } else {
          container.appendChild(item);
        }
      },
      this.dragSession?.placeholder ?? item,
    );
  }

  public removeItemAnimated(item: HTMLElement): void {
    const container = this.getTargetContainer();

    if (!container.contains(item)) {
      return;
    }

    this.animateMutation(
      container,
      () => {
        item.remove();
      },
      item,
    );
  }

  private animateMutation(
    container: HTMLElement,
    mutate: () => void,
    skipItem?: HTMLElement,
  ): void {
    const shouldAnimate =
      !this['no-animation'] && !this.prefersReducedMotion() && this.duration > 0;

    if (!shouldAnimate) {
      this.withDomMutation(mutate);

      return;
    }

    const beforeRects = new Map<HTMLElement, DOMRect>();

    for (const child of this.getContainerItems(container)) {
      if (child !== skipItem) {
        beforeRects.set(child, child.getBoundingClientRect());
      }
    }

    this.withDomMutation(mutate);

    for (const child of this.getContainerItems(container)) {
      if (child === skipItem || typeof child.animate !== 'function') {
        continue;
      }

      const first = beforeRects.get(child);

      if (!first) {
        continue;
      }

      const last = child.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        continue;
      }

      this.animatingItems.add(child);
      const anim = child.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        {
          duration: this.duration,
          easing: SORTABLE_EASING,
        },
      );

      this.activeAnimations.add(anim);
      void anim.finished
        .catch(() => {
          // Animation canceled
        })
        .finally(() => {
          this.animatingItems.delete(child);
          this.activeAnimations.delete(anim);
        });
    }
  }

  private async waitForAnimations(): Promise<void> {
    if (this.activeAnimations.size === 0) {
      return;
    }

    await Promise.allSettled(Array.from(this.activeAnimations).map(anim => anim.finished));
  }

  private cancelAllAnimations(): void {
    for (const anim of this.activeAnimations) {
      anim.cancel();
    }

    this.activeAnimations.clear();
    this.animatingItems.clear();
  }

  private setupMutationObserver(container: HTMLElement): void {
    this.disconnectMutationObserver();

    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.mutationObserver = new MutationObserver(() => {
      if (this.isMutatingDom || this.dragSession?.started) {
        return;
      }

      this.scheduleMutationRefresh();
    });

    this.mutationObserver.observe(this, { childList: true });
    this.syncObservedContainer(container);
  }

  private syncObservedContainer(container: HTMLElement): void {
    if (!this.mutationObserver) {
      return;
    }

    if (container === this) {
      if (this.observedExternalContainer) {
        this.mutationObserver.disconnect();
        this.observedExternalContainer = null;
        this.mutationObserver.observe(this, { childList: true });
      }

      return;
    }

    if (this.observedExternalContainer !== container) {
      this.mutationObserver.disconnect();
      this.observedExternalContainer = container;
      this.mutationObserver.observe(this, { childList: true });
      this.mutationObserver.observe(container, { childList: true });
    }
  }

  private disconnectMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.observedExternalContainer = null;
  }

  private scheduleMutationRefresh(): void {
    if (this.mutationRafId !== null) {
      return;
    }

    this.mutationRafId = window.requestAnimationFrame(() => {
      this.mutationRafId = null;

      if (!this.isConnected) {
        return;
      }

      this.refresh();
    });
  }

  private cancelMutationRaf(): void {
    if (this.mutationRafId !== null) {
      window.cancelAnimationFrame(this.mutationRafId);
      this.mutationRafId = null;
    }
  }

  private withDomMutation(fn: () => void): void {
    const prev = this.isMutatingDom;

    this.isMutatingDom = true;

    try {
      fn();
    } finally {
      if (this.mutationObserver && !prev) {
        this.mutationObserver.takeRecords();
      }

      this.isMutatingDom = prev;
    }
  }
}
