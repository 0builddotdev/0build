import { type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { parseOptions } from '$js/shared/helpers/options';
import { Controller } from '$js/controllers/controller';

export type FilterOrder = 'asc' | 'desc';

export type FilterAnimation = 'slide' | 'fade' | 'delayed-fade' | 'none' | 'false' | '';

export interface FilterControlConfig {
  filter?: string;
  group?: string;
  sort?: string;
  order?: FilterOrder;
}

export interface FilterState {
  filter: Record<string, string>;
  sort: [string, FilterOrder] | [];
}

interface FirstItemBox {
  relLeft: number;
  relTop: number;
  width: number;
  height: number;
  opacity: number;
  inView: boolean;
}

const FILTER_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const DELAYED_FADE_STAGGER = 40;
const MAX_STAGGER_DELAY = 400;

interface Cls extends Record<string, string> {
  active: string;
}

@customElement('z-filter')
export class Filter extends Controller {
  protected readonly eventPrefix = 'z-filter';

  protected override readonly 'cls-default-element': string = 'active';

  protected override $cls: Cls = {
    active: 'z-active',
  };

  @property({ type: String })
  target: string = '';

  @property({ type: String, attribute: 'sel-active' })
  selActive: string = '';

  @property({ type: String })
  animation: FilterAnimation = 'slide';

  @property({ type: Boolean, attribute: 'no-animation' })
  'no-animation': boolean = false;

  @property({ type: Number })
  duration: number = 250;

  private currentState: FilterState = { filter: { '': '' }, sort: [] };

  private originalOrderMap: WeakMap<HTMLElement, number> = new WeakMap();

  private nextOriginalOrder: number = 0;

  private hasSortedDom: boolean = false;

  private transitionCleanups: Map<HTMLElement, () => void> = new Map();

  private transitionTokens: WeakMap<HTMLElement, number> = new WeakMap();

  private mutationObserver: MutationObserver | null = null;

  private observedExternalTargets: Set<HTMLElement> = new Set();

  private mutationRafId: number | null = null;

  private isMutatingDom: boolean = false;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.detachListeners();
    this.disconnectMutationObserver();
    this.cancelMutationRaf();
    this.cancelAllTransitions();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.initializeFilter();
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (!this.isInitialized) {
      return;
    }

    if (changedProperties.has('selActive')) {
      this.currentState = this.resolveInitialState();
      this.refresh();

      return;
    }

    if (changedProperties.has('target')) {
      this.syncObservedTargets();
      this.refresh();

      return;
    }

    if (changedProperties.has('cls')) {
      const previousClass = this.$prevCls.active;

      if (typeof previousClass === 'string' && previousClass !== this.$cls.active) {
        this.clearActiveClasses(previousClass);
      }

      this.syncControlsAriaAndClass(this.currentState);
    }
  }

  public refresh(): void {
    const targets = this.resolveTargets();

    for (const target of targets) {
      this.indexOriginalOrder(target);
    }

    this.syncObservedTargets(targets);
    this.syncControlsAriaAndClass(this.currentState);
    this.applyImmediate(this.currentState, targets);
  }

  public getState(): FilterState {
    return {
      filter: { ...this.currentState.filter },
      sort: [...this.currentState.sort],
    };
  }

  public async setState(state: Partial<FilterState>, animate: boolean = true): Promise<void> {
    const nextState = this.normalizeState(state);
    const previousState = this.getState();

    const allowed = this.emit(
      'before-filter',
      {
        state: { filter: { ...nextState.filter }, sort: [...nextState.sort] },
        previousState,
      },
      true,
    );

    if (!allowed) {
      return;
    }

    this.currentState = nextState;
    this.syncControlsAriaAndClass(nextState);

    const targets = this.resolveTargets();

    for (const target of targets) {
      this.indexOriginalOrder(target);
    }

    const shouldAnimate =
      animate &&
      !this['no-animation'] &&
      !this.prefersReducedMotion() &&
      this.duration > 0 &&
      this.animation !== 'none' &&
      this.animation !== 'false' &&
      this.animation !== '';

    let matchingCount = 0;
    let totalCount = 0;

    if (shouldAnimate) {
      await Promise.all(
        targets.map(target =>
          this.animateTarget(() => {
            const counts = this.applyStateToTarget(nextState, target);

            matchingCount += counts.matching;
            totalCount += counts.total;
          }, target),
        ),
      );
    } else {
      const counts = this.applyImmediate(nextState, targets);

      matchingCount = counts.matching;
      totalCount = counts.total;
    }

    this.updateEmptyStateElements(matchingCount);

    const detail = {
      state: this.getState(),
      matchingCount,
      totalCount,
    };

    this.emit('after-filter', detail);
    this.emit('change', detail);
  }

  public async apply(controlEl: HTMLElement, animate: boolean = true): Promise<void> {
    if (!this.belongsToThis(controlEl) || this.isControlDisabled(controlEl)) {
      return;
    }

    const config = this.parseControlConfig(controlEl);
    const prevState = this.getState();
    const nextState = this.mergeState(config, this.getState());

    if (!this.isEqualState(prevState, nextState)) {
      await this.setState(nextState, animate);
    }
  }

  public async reset(animate: boolean = true): Promise<void> {
    await this.setState({ filter: { '': '' }, sort: [] }, animate);
  }

  private initializeFilter(): void {
    this.withDomMutation(() => {
      this.unwrapTemplate(this, {});
    });

    const targets = this.resolveTargets();

    for (const target of targets) {
      this.indexOriginalOrder(target);
    }

    this.currentState = this.resolveInitialState();
    this.syncControlsAriaAndClass(this.currentState);

    const counts = this.applyImmediate(this.currentState, targets);

    this.updateEmptyStateElements(counts.matching);
    this.attachListeners();
    this.setupMutationObserver(targets);
    this.isInitialized = true;
  }

  private attachListeners(): void {
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
  }

  private detachListeners(): void {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
  }

  private onClick = (event: MouseEvent): void => {
    const rawTarget = event.target;

    if (!(rawTarget instanceof Element)) {
      return;
    }

    const controlEl = rawTarget.closest<HTMLElement>('[data-filter-control]');

    if (!controlEl || !this.belongsToThis(controlEl)) {
      return;
    }

    const triggerEl = rawTarget.closest<HTMLElement>('a, button, [role="button"], [role="tab"]');

    if (!triggerEl && controlEl !== rawTarget && !controlEl.contains(rawTarget)) {
      return;
    }

    if (this.isControlDisabled(controlEl)) {
      event.preventDefault();

      return;
    }

    const anchorEl = rawTarget.closest('a');

    if (anchorEl && this.belongsToThis(anchorEl)) {
      const href = anchorEl.getAttribute('href');

      if (href === null || href === '' || href === '#') {
        event.preventDefault();
      }
    }

    void this.apply(controlEl);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter') {
      return;
    }

    const rawTarget = event.target;

    if (!(rawTarget instanceof Element)) {
      return;
    }

    const controlEl = rawTarget.closest<HTMLElement>('[data-filter-control]');

    if (!controlEl || !this.belongsToThis(controlEl)) {
      return;
    }

    if (this.isControlDisabled(controlEl)) {
      return;
    }

    const interactiveEl = this.findInteractiveEl(controlEl);

    if (rawTarget !== interactiveEl && rawTarget !== controlEl) {
      return;
    }

    if (event.key === 'Enter') {
      if (interactiveEl instanceof HTMLButtonElement) {
        return;
      }

      if (interactiveEl instanceof HTMLAnchorElement) {
        const href = interactiveEl.getAttribute('href');

        if (href && href !== '#') {
          return;
        }
      }
    } else if (interactiveEl instanceof HTMLButtonElement) {
      return;
    }

    event.preventDefault();
    void this.apply(controlEl);
  };

  private setupMutationObserver(initialTargets?: HTMLElement[]): void {
    this.disconnectMutationObserver();

    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.mutationObserver = new MutationObserver(() => {
      if (this.isMutatingDom) {
        return;
      }

      this.scheduleMutationRefresh();
    });

    this.mutationObserver.observe(this, { childList: true, subtree: true });
    this.syncObservedTargets(initialTargets);
  }

  private syncObservedTargets(targets: HTMLElement[] = this.resolveTargets()): void {
    if (!this.mutationObserver) {
      return;
    }

    const externalSet = new Set(targets.filter(target => !this.contains(target)));
    let needsReobserve = false;

    for (const existing of this.observedExternalTargets) {
      if (!externalSet.has(existing)) {
        needsReobserve = true;
        break;
      }
    }

    if (needsReobserve) {
      this.mutationObserver.disconnect();
      this.observedExternalTargets.clear();
      this.mutationObserver.observe(this, { childList: true, subtree: true });
    }

    for (const externalTarget of externalSet) {
      if (!this.observedExternalTargets.has(externalTarget)) {
        this.observedExternalTargets.add(externalTarget);
        this.mutationObserver.observe(externalTarget, { childList: true });
      }
    }
  }

  private disconnectMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.observedExternalTargets.clear();
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

  private belongsToThis(el: Element): boolean {
    return el.closest('z-filter') === this;
  }

  private resolveTargets(): HTMLElement[] {
    const rawTarget = this.target.trim();

    if (!rawTarget) {
      return Array.from(this.querySelectorAll<HTMLElement>('[data-filter-target]')).filter(el =>
        this.belongsToThis(el),
      );
    }

    const startsWithCombinator = rawTarget.startsWith('>');
    const scopedSelector = startsWithCombinator ? `:scope ${rawTarget}` : rawTarget;

    try {
      const internalMatches = Array.from(this.querySelectorAll<HTMLElement>(scopedSelector)).filter(
        el => this.belongsToThis(el),
      );

      if (internalMatches.length > 0 || startsWithCombinator) {
        return internalMatches;
      }

      return Array.from(document.querySelectorAll<HTMLElement>(rawTarget));
    } catch {
      return [];
    }
  }

  private getControls(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>('[data-filter-control]')).filter(el =>
      this.belongsToThis(el),
    );
  }

  private resolveInitialState(): FilterState {
    const baseState: FilterState = { filter: { '': '' }, sort: [] };
    const controls = this.getControls();
    const selActive = this.selActive.trim();

    if (selActive && selActive.toLowerCase() !== 'false') {
      try {
        const matched = new Set(
          Array.from(this.querySelectorAll<HTMLElement>(selActive)).filter(el =>
            this.belongsToThis(el),
          ),
        );

        let seeded = baseState;

        for (const control of controls) {
          if (matched.has(control) || control.matches(selActive)) {
            seeded = this.mergeState(this.parseControlConfig(control), seeded);
          }
        }

        return seeded;
      } catch {
        return baseState;
      }
    }

    const activeClasses = this.getActiveClassList();

    if (activeClasses.length === 0) {
      return baseState;
    }

    let initialState = baseState;

    for (const control of controls) {
      const hasAllClasses = activeClasses.every(cls => control.classList.contains(cls));

      if (hasAllClasses) {
        initialState = this.mergeState(this.parseControlConfig(control), initialState);
      }
    }

    return initialState;
  }

  private parseControlConfig(el: HTMLElement): FilterControlConfig {
    const raw = (el.getAttribute('data-filter-control') ?? '').trim();
    const config: FilterControlConfig = {};

    if (raw) {
      if (raw.startsWith('{') || /^(?:filter|group|sort|order)\s*:/i.test(raw)) {
        const parsed = parseOptions(raw);

        if (typeof parsed === 'object' && parsed !== null) {
          const record = parsed as Record<string, unknown>;

          if (typeof record.filter === 'string') {
            config.filter = record.filter.trim();
          }

          if (typeof record.group === 'string') {
            config.group = record.group.trim();
          }

          if (typeof record.sort === 'string') {
            config.sort = record.sort.trim();
          }

          if (record.order === 'desc' || record.order === 'asc') {
            config.order = record.order;
          }
        }
      } else {
        config.filter = raw;
      }
    }

    if (el.hasAttribute('data-filter')) {
      config.filter = (el.getAttribute('data-filter') ?? '').trim();
    }

    if (el.hasAttribute('data-group')) {
      config.group = (el.getAttribute('data-group') ?? '').trim();
    }

    if (el.hasAttribute('data-sort')) {
      config.sort = (el.getAttribute('data-sort') ?? '').trim();
    }

    if (el.hasAttribute('data-order')) {
      const orderAttr = (el.getAttribute('data-order') ?? '').trim().toLowerCase();

      if (orderAttr === 'desc' || orderAttr === 'asc') {
        config.order = orderAttr;
      }
    }

    if (config.sort !== undefined && !config.order) {
      config.order = 'asc';
    }

    return config;
  }

  private normalizeState(state: Partial<FilterState>): FilterState {
    const normalizedFilter: Record<string, string> =
      state.filter && typeof state.filter === 'object' ? { ...state.filter } : { '': '' };

    if (Object.keys(normalizedFilter).length === 0) {
      normalizedFilter[''] = '';
    }

    let normalizedSort: [string, FilterOrder] | [] = [];

    if (Array.isArray(state.sort) && state.sort.length >= 1 && state.sort[0]) {
      const order: FilterOrder = state.sort[1] === 'desc' ? 'desc' : 'asc';

      normalizedSort = [String(state.sort[0]), order];
    }

    return {
      filter: normalizedFilter,
      sort: normalizedSort,
    };
  }

  private mergeState(config: FilterControlConfig, state: FilterState): FilterState {
    const next: FilterState = {
      filter: { ...state.filter },
      sort: [...state.sort],
    };

    const filter = config.filter ?? '';
    const group = config.group ?? '';

    if (filter || config.sort === undefined) {
      if (group) {
        if (filter) {
          delete next.filter[''];
          next.filter[group] = filter;
        } else {
          delete next.filter[group];

          if (Object.keys(next.filter).length === 0 || '' in next.filter) {
            next.filter = { '': '' };
          }
        }
      } else {
        next.filter = { '': filter };
      }
    }

    if (config.sort !== undefined) {
      next.sort = config.sort ? [config.sort, config.order ?? 'asc'] : [];
    }

    return next;
  }

  private matchesControl(config: FilterControlConfig, state: FilterState): boolean {
    const stateFilter = state.filter;
    const [stateSort, stateOrder] = state.sort;

    const filter = config.filter ?? '';
    const group = config.group ?? '';

    const defaultFilterMatches = !group && '' in stateFilter && filter === stateFilter[''];
    const groupFilterMatches =
      Boolean(group) && group in stateFilter && filter === stateFilter[group];
    const groupResetMatches =
      !filter && Boolean(group) && !(group in stateFilter) && !stateFilter[''];
    const filterMatches = defaultFilterMatches || groupFilterMatches || groupResetMatches;

    if (config.sort === undefined) {
      return filterMatches;
    }

    const expectedOrder = config.order ?? 'asc';
    const sortMatches =
      config.sort === ''
        ? state.sort.length === 0
        : stateSort === config.sort && stateOrder === expectedOrder;

    const hasFilter = Boolean(filter || group);

    return sortMatches && (!hasFilter || filterMatches);
  }

  private isEqualState(stateA: FilterState, stateB: FilterState): boolean {
    const keysA = Object.keys(stateA.filter);
    const keysB = Object.keys(stateB.filter);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (stateA.filter[key] !== stateB.filter[key]) {
        return false;
      }
    }

    if (stateA.sort.length !== stateB.sort.length) {
      return false;
    }

    return stateA.sort[0] === stateB.sort[0] && stateA.sort[1] === stateB.sort[1];
  }

  private getActiveClassList(): string[] {
    return this.splitClasses(this.$cls.active);
  }

  private clearActiveClasses(classListString: string): void {
    const classes = classListString.split(/\s+/).filter(Boolean);

    if (classes.length === 0) {
      return;
    }

    for (const control of this.getControls()) {
      control.classList.remove(...classes);
    }
  }

  private findInteractiveEl(controlEl: HTMLElement): HTMLElement {
    if (controlEl.matches('a, button, [role="button"], [role="tab"]')) {
      return controlEl;
    }

    return (
      controlEl.querySelector<HTMLElement>('a, button, [role="button"], [role="tab"]') ?? controlEl
    );
  }

  private isControlDisabled(controlEl: HTMLElement): boolean {
    const interactiveEl = this.findInteractiveEl(controlEl);

    return (
      controlEl.hasAttribute('disabled') ||
      controlEl.getAttribute('aria-disabled') === 'true' ||
      controlEl.classList.contains('z-disabled') ||
      interactiveEl.hasAttribute('disabled') ||
      interactiveEl.getAttribute('aria-disabled') === 'true'
    );
  }

  private syncControlsAriaAndClass(state: FilterState): void {
    const activeClasses = this.getActiveClassList();

    for (const controlEl of this.getControls()) {
      const config = this.parseControlConfig(controlEl);
      const isActive = this.matchesControl(config, state);

      for (const cls of activeClasses) {
        controlEl.classList.toggle(cls, isActive);
      }

      const interactiveEl = this.findInteractiveEl(controlEl);

      if (interactiveEl instanceof HTMLAnchorElement) {
        if (!interactiveEl.hasAttribute('role')) {
          interactiveEl.setAttribute('role', 'button');
        }

        if (!interactiveEl.hasAttribute('href') && !interactiveEl.hasAttribute('tabindex')) {
          interactiveEl.setAttribute('tabindex', '0');
        }
      } else if (!interactiveEl.matches('button, input, select, textarea')) {
        if (!interactiveEl.hasAttribute('role')) {
          interactiveEl.setAttribute('role', 'button');
        }

        if (!interactiveEl.hasAttribute('tabindex')) {
          interactiveEl.setAttribute('tabindex', '0');
        }
      }

      if (interactiveEl.getAttribute('role') === 'tab') {
        interactiveEl.setAttribute('aria-selected', String(isActive));
      } else {
        interactiveEl.setAttribute('aria-pressed', String(isActive));
      }
    }
  }

  private getFilterItems(target: HTMLElement): HTMLElement[] {
    return Array.from(target.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        !(child instanceof HTMLTemplateElement) &&
        !child.hasAttribute('data-filter-empty'),
    );
  }

  private indexOriginalOrder(target: HTMLElement): void {
    for (const item of this.getFilterItems(target)) {
      if (!this.originalOrderMap.has(item)) {
        this.originalOrderMap.set(item, this.nextOriginalOrder++);
      }
    }
  }

  private applyImmediate(
    state: FilterState,
    targets: HTMLElement[],
  ): { matching: number; total: number } {
    let matching = 0;
    let total = 0;

    for (const target of targets) {
      this.cleanupTargetTransition(target);
      const counts = this.applyStateToTarget(state, target);

      matching += counts.matching;
      total += counts.total;
    }

    this.updateEmptyStateElements(matching);

    return { matching, total };
  }

  private applyStateToTarget(
    state: FilterState,
    target: HTMLElement,
  ): { matching: number; total: number } {
    let matching = 0;
    let total = 0;

    this.withDomMutation(() => {
      const items = this.getFilterItems(target);

      total = items.length;
      const selectors = Object.values(state.filter).filter(Boolean);

      for (const item of items) {
        const isMatch = selectors.every(selector => this.safeMatches(item, selector));

        if (isMatch) {
          matching++;
        }

        item.style.display = isMatch ? '' : 'none';
        item.hidden = !isMatch;
        this.cleanEmptyStyle(item);
      }

      if (state.sort.length === 2 && state.sort[0]) {
        const [sortKey, order] = state.sort;
        const sorted = this.sortItems(items, sortKey, order);

        if (!this.areArraysEqual(sorted, items)) {
          target.append(...sorted);
          this.hasSortedDom = true;
        }
      } else if (this.hasSortedDom) {
        const restored = [...items].sort(
          (a, b) => (this.originalOrderMap.get(a) ?? 0) - (this.originalOrderMap.get(b) ?? 0),
        );

        if (!this.areArraysEqual(restored, items)) {
          target.append(...restored);
        }
      }
    });

    return { matching, total };
  }

  private updateEmptyStateElements(matchingCount: number): void {
    const emptyEls = Array.from(this.querySelectorAll<HTMLElement>('[data-filter-empty]')).filter(
      el => this.belongsToThis(el),
    );

    for (const emptyEl of emptyEls) {
      emptyEl.hidden = matchingCount > 0;
    }
  }

  private safeMatches(el: HTMLElement, selector: string): boolean {
    try {
      return el.matches(selector);
    } catch {
      return false;
    }
  }

  private sortItems(items: HTMLElement[], sortKey: string, order: FilterOrder): HTMLElement[] {
    const direction = order === 'desc' ? -1 : 1;

    return [...items].sort((a, b) => {
      const valA = this.getSortValue(a, sortKey);
      const valB = this.getSortValue(b, sortKey);
      const trimmedA = valA.trim();
      const trimmedB = valB.trim();
      const numA = Number(trimmedA);
      const numB = Number(trimmedB);
      const bothNumeric =
        trimmedA !== '' && trimmedB !== '' && Number.isFinite(numA) && Number.isFinite(numB);

      const cmp = bothNumeric
        ? numA - numB
        : valA.localeCompare(valB, undefined, { numeric: true });

      if (cmp !== 0) {
        return cmp * direction;
      }

      return (this.originalOrderMap.get(a) ?? 0) - (this.originalOrderMap.get(b) ?? 0);
    });
  }

  private getSortValue(el: HTMLElement, sortKey: string): string {
    if (sortKey === ':text') {
      return (el.textContent ?? '').trim();
    }

    return el.getAttribute(sortKey) ?? el.getAttribute(`data-${sortKey}`) ?? '';
  }

  private areArraysEqual(a: HTMLElement[], b: HTMLElement[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
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

  private nextTransitionToken(target: HTMLElement): number {
    const next = (this.transitionTokens.get(target) ?? 0) + 1;

    this.transitionTokens.set(target, next);

    return next;
  }

  private isTransitionCurrent(target: HTMLElement, token: number): boolean {
    return this.isConnected && this.transitionTokens.get(target) === token;
  }

  private cleanupTargetTransition(target: HTMLElement): void {
    const cleanup = this.transitionCleanups.get(target);

    if (cleanup) {
      this.transitionCleanups.delete(target);
      cleanup();
    }
  }

  private cancelAllTransitions(): void {
    for (const [target, cleanup] of this.transitionCleanups) {
      this.transitionTokens.set(target, (this.transitionTokens.get(target) ?? 0) + 1);
      cleanup();
    }

    this.transitionCleanups.clear();
  }

  private animateTarget(action: () => void, target: HTMLElement): Promise<void> {
    if (this.animation === 'fade') {
      return this.animateFade(action, target, this.duration, 0);
    }

    if (this.animation === 'delayed-fade') {
      return this.animateFade(action, target, this.duration, DELAYED_FADE_STAGGER);
    }

    return this.animateSlide(action, target, this.duration);
  }

  private isItemVisible(el: HTMLElement): boolean {
    return (
      !el.hidden &&
      el.style.display !== 'none' &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
    );
  }

  private isRectNearViewport(rect: DOMRect): boolean {
    if (typeof window === 'undefined') {
      return true;
    }

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;

    return rect.bottom >= -vh * 0.25 && rect.top <= vh * 1.25 && rect.right >= 0 && rect.left <= vw;
  }

  private async animateSlide(
    action: () => void,
    target: HTMLElement,
    duration: number,
  ): Promise<void> {
    this.cleanupTargetTransition(target);
    this.nextTransitionToken(target);

    const items = this.getFilterItems(target);
    const firstTargetRect = target.getBoundingClientRect();
    const oldHeight = firstTargetRect.height;
    const firstBoxes = new Map<HTMLElement, FirstItemBox>();

    for (const item of items) {
      if (!this.isItemVisible(item)) {
        continue;
      }

      const rect = item.getBoundingClientRect();

      firstBoxes.set(item, {
        relLeft: rect.left - (firstTargetRect.left + target.clientLeft) + target.scrollLeft,
        relTop: rect.top - (firstTargetRect.top + target.clientTop) + target.scrollTop,
        width: rect.width,
        height: rect.height,
        opacity: Number.parseFloat(window.getComputedStyle(item).opacity) || 1,
        inView: this.isRectNearViewport(rect),
      });
    }

    action();

    const updatedItems = this.getFilterItems(target);
    const lastTargetRect = target.getBoundingClientRect();
    const newHeight = lastTargetRect.height;

    const animations: Animation[] = [];
    const cleanupFns: Array<() => void> = [];

    const hasLeavingItem = updatedItems.some(item => {
      const first = firstBoxes.get(item);

      return first !== undefined && first.inView && !this.isItemVisible(item);
    });

    if (hasLeavingItem && window.getComputedStyle(target).position === 'static') {
      const prevPosition = target.style.position;

      target.style.position = 'relative';
      cleanupFns.push(() => {
        target.style.position = prevPosition;
        this.cleanEmptyStyle(target);
      });
    }

    for (const item of updatedItems) {
      const first = firstBoxes.get(item);
      const isNowVisible = this.isItemVisible(item);

      if (first && !isNowVisible) {
        if (!first.inView || typeof item.animate !== 'function') {
          continue;
        }

        const prevStyles = {
          position: item.style.position,
          left: item.style.left,
          top: item.style.top,
          width: item.style.width,
          height: item.style.height,
          margin: item.style.margin,
          boxSizing: item.style.boxSizing,
          pointerEvents: item.style.pointerEvents,
        };

        this.withDomMutation(() => {
          item.hidden = false;
          item.style.display = '';
          item.style.position = 'absolute';
          item.style.left = `${first.relLeft}px`;
          item.style.top = `${first.relTop}px`;
          item.style.width = `${first.width}px`;
          item.style.height = `${first.height}px`;
          item.style.margin = '0';
          item.style.boxSizing = 'border-box';
          item.style.pointerEvents = 'none';
        });

        const anim = item.animate(
          [
            { opacity: first.opacity, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.96)' },
          ],
          {
            duration,
            easing: FILTER_EASING,
            fill: 'forwards',
          },
        );

        animations.push(anim);
        cleanupFns.push(() => {
          anim.cancel();
          item.style.position = prevStyles.position;
          item.style.left = prevStyles.left;
          item.style.top = prevStyles.top;
          item.style.width = prevStyles.width;
          item.style.height = prevStyles.height;
          item.style.margin = prevStyles.margin;
          item.style.boxSizing = prevStyles.boxSizing;
          item.style.pointerEvents = prevStyles.pointerEvents;
          item.style.display = 'none';
          item.hidden = true;
          this.cleanEmptyStyle(item);
        });

        continue;
      }

      if (!first && isNowVisible) {
        const lastRect = item.getBoundingClientRect();

        if (!this.isRectNearViewport(lastRect) || typeof item.animate !== 'function') {
          continue;
        }

        const anim = item.animate(
          [
            { opacity: 0, transform: 'scale(0.96)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          {
            duration,
            easing: FILTER_EASING,
          },
        );

        animations.push(anim);
        cleanupFns.push(() => {
          anim.cancel();
        });

        continue;
      }

      if (first && isNowVisible) {
        const lastRect = item.getBoundingClientRect();

        if (
          (!first.inView && !this.isRectNearViewport(lastRect)) ||
          typeof item.animate !== 'function'
        ) {
          continue;
        }

        const lastRelLeft =
          lastRect.left - (lastTargetRect.left + target.clientLeft) + target.scrollLeft;
        const lastRelTop =
          lastRect.top - (lastTargetRect.top + target.clientTop) + target.scrollTop;
        const dx = first.relLeft - lastRelLeft;
        const dy = first.relTop - lastRelTop;

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          const anim = item.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
            {
              duration,
              easing: FILTER_EASING,
            },
          );

          animations.push(anim);
          cleanupFns.push(() => {
            anim.cancel();
          });
        }
      }
    }

    if (Math.abs(oldHeight - newHeight) > 0.5 && typeof target.animate === 'function') {
      const heightAnim = target.animate(
        [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
        {
          duration,
          easing: FILTER_EASING,
        },
      );

      animations.push(heightAnim);
      cleanupFns.push(() => {
        heightAnim.cancel();
      });
    }

    if (animations.length === 0) {
      return;
    }

    const cleanup = (): void => {
      this.withDomMutation(() => {
        for (const fn of cleanupFns) {
          fn();
        }
      });
    };

    this.transitionCleanups.set(target, cleanup);

    await Promise.allSettled(animations.map(anim => anim.finished));

    if (this.transitionCleanups.get(target) === cleanup) {
      this.transitionCleanups.delete(target);
      cleanup();
    }
  }

  private async animateFade(
    action: () => void,
    target: HTMLElement,
    duration: number,
    staggerMs: number,
  ): Promise<void> {
    this.cleanupTargetTransition(target);
    const token = this.nextTransitionToken(target);
    const halfDuration = Math.max(1, duration / 2);

    const activeAnimations: Animation[] = [];
    const cleanupFns: Array<() => void> = [];

    const registerCleanup = (): (() => void) => {
      const cleanup = (): void => {
        this.withDomMutation(() => {
          target.classList.remove('z-transition-leave', 'z-transition-enter');

          for (const anim of activeAnimations) {
            anim.cancel();
          }

          for (const fn of cleanupFns) {
            fn();
          }
        });
      };

      this.transitionCleanups.set(target, cleanup);

      return cleanup;
    };

    const cleanup = registerCleanup();

    target.classList.add('z-transition-leave');

    if (staggerMs > 0) {
      const visibleItems = this.getFilterItems(target).filter(
        item => this.isItemVisible(item) && this.isRectNearViewport(item.getBoundingClientRect()),
      );

      visibleItems.forEach((item, index) => {
        if (typeof item.animate !== 'function') {
          return;
        }

        const anim = item.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: halfDuration,
          delay: Math.min(index * staggerMs, MAX_STAGGER_DELAY),
          easing: 'ease',
          fill: 'forwards',
        });

        activeAnimations.push(anim);
      });
    } else if (typeof target.animate === 'function') {
      const anim = target.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: halfDuration,
        easing: 'ease',
        fill: 'forwards',
      });

      activeAnimations.push(anim);
    }

    await Promise.allSettled(activeAnimations.map(anim => anim.finished));

    if (!this.isTransitionCurrent(target, token)) {
      return;
    }

    target.classList.remove('z-transition-leave');
    const oldHeight = target.getBoundingClientRect().height;

    for (const anim of activeAnimations) {
      anim.cancel();
    }

    activeAnimations.length = 0;
    action();

    const newHeight = target.getBoundingClientRect().height;

    target.classList.add('z-transition-enter');

    if (Math.abs(oldHeight - newHeight) > 0.5 && typeof target.animate === 'function') {
      const heightAnim = target.animate(
        [{ height: `${oldHeight}px` }, { height: `${newHeight}px` }],
        {
          duration: halfDuration,
          easing: 'ease',
        },
      );

      activeAnimations.push(heightAnim);
    }

    if (staggerMs > 0) {
      const visibleItems = this.getFilterItems(target).filter(
        item => this.isItemVisible(item) && this.isRectNearViewport(item.getBoundingClientRect()),
      );

      visibleItems.forEach((item, index) => {
        if (typeof item.animate !== 'function') {
          return;
        }

        const anim = item.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: halfDuration,
          delay: Math.min(index * staggerMs, MAX_STAGGER_DELAY),
          easing: 'ease',
          fill: 'backwards',
        });

        activeAnimations.push(anim);
      });
    } else if (typeof target.animate === 'function') {
      const anim = target.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: halfDuration,
        easing: 'ease',
      });

      activeAnimations.push(anim);
    }

    await Promise.allSettled(activeAnimations.map(anim => anim.finished));

    if (this.transitionCleanups.get(target) === cleanup) {
      this.transitionCleanups.delete(target);
      cleanup();
    }
  }
}
