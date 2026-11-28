import { LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { randomString } from './helpers/common';
import { parseOptions } from './helpers/options';

const EMPTY_RECORD_HANDLER: ProxyHandler<Record<string, string>> = {
  get: (target, prop) =>
    typeof prop === 'string' ? (target[prop] ?? '') : Reflect.get(target, prop),
};

function withEmptyFallback(obj: Record<string, string>): Record<string, string> {
  return new Proxy(obj, EMPTY_RECORD_HANDLER);
}

export function isLayoutChild(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && el.tagName !== 'SCRIPT' && el.tagName !== 'TEMPLATE';
}

export function splitClasses(raw: string): string[] {
  return raw ? raw.split(/\s+/).filter(Boolean) : [];
}

export function toggleClasses(el: Element, raw: string, force?: boolean): void {
  for (const token of splitClasses(raw)) {
    el.classList.toggle(token, force);
  }
}

export function hasClasses(el: Element, raw: string): boolean {
  const tokens = splitClasses(raw);

  return tokens.length > 0 && tokens.every(token => el.classList.contains(token));
}

export function removeClasses(
  targets: Element | Iterable<Element>,
  raw: string | readonly string[],
): void {
  const tokens = typeof raw === 'string' ? splitClasses(raw) : raw;

  if (tokens.length === 0) {
    return;
  }

  if (targets instanceof Element) {
    targets.classList.remove(...tokens);

    return;
  }

  for (const el of targets) {
    el.classList.remove(...tokens);
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function cleanEmptyStyle(el: HTMLElement): void {
  if (el.getAttribute('style')?.trim() === '') {
    el.removeAttribute('style');
  }
}

export function isDisabledElement(el: Element, checkAria: boolean = true): boolean {
  return (
    el.hasAttribute('disabled') ||
    el.classList.contains('z-disabled') ||
    Boolean((el as HTMLButtonElement).disabled) ||
    (checkAria && el.getAttribute('aria-disabled') === 'true')
  );
}

export function ensureButtonAccessibility(
  el: HTMLElement,
  options?: { disabled?: boolean; ariaDisabled?: boolean; resetDisabledTabindex?: boolean },
): void {
  if (!el.matches('button, input, select, textarea') && !el.hasAttribute('role')) {
    el.setAttribute('role', 'button');
  }

  if (options?.disabled) {
    if (el.tagName !== 'BUTTON') {
      el.setAttribute('tabindex', '-1');
    }
  } else if (
    el.tagName !== 'BUTTON' &&
    !(el.tagName === 'A' && el.hasAttribute('href')) &&
    !el.hasAttribute('tabindex')
  ) {
    el.setAttribute('tabindex', '0');
  } else if (options?.resetDisabledTabindex && el.getAttribute('tabindex') === '-1') {
    el.removeAttribute('tabindex');
  }

  if (options && ('disabled' in options || 'ariaDisabled' in options)) {
    const ariaDis = options.ariaDisabled ?? options.disabled ?? false;

    if (ariaDis) {
      el.setAttribute('aria-disabled', 'true');
    } else {
      el.removeAttribute('aria-disabled');
    }
  }
}

export abstract class Base extends LitElement {
  @property({ type: String })
  cls: string = '';

  @property({ type: String })
  stl: string = '';

  @state()
  protected $cls: { [key: string]: string } = withEmptyFallback({});

  @state()
  protected $stl: { [key: string]: string } = withEmptyFallback({});

  protected $prevCls: { [key: string]: string } = {};

  protected $prevStl: { [key: string]: string } = {};

  protected 'cls-default-element': string = 'host-inner';

  protected 'stl-default-element': string = 'host-inner';

  protected readonly uid: string = randomString(6);

  private defaultClsSnapshot: { [key: string]: string } | null = null;

  private defaultStlSnapshot: { [key: string]: string } | null = null;

  private lastSyncedClsAttr: string | null = null;

  private lastSyncedStlAttr: string | null = null;

  protected syncCls(force: boolean = false): void {
    if (!this.defaultClsSnapshot) {
      this.defaultClsSnapshot = { ...this.$cls };
    }

    if (!force && this.lastSyncedClsAttr === this.cls) {
      return;
    }

    this.lastSyncedClsAttr = this.cls;
    this.$prevCls = { ...this.$cls };

    const next: { [key: string]: string } = { ...this.defaultClsSnapshot };

    if (this.cls) {
      const parsed = parseOptions(this.cls) as { [key: string]: string } | string;

      if (typeof parsed === 'string') {
        next[this['cls-default-element']] = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        Object.keys(parsed).forEach(key => {
          next[key] = parsed[key];
        });
      }
    }

    this.$cls = withEmptyFallback(next);
  }

  protected syncStl(force: boolean = false): void {
    if (!this.defaultStlSnapshot) {
      this.defaultStlSnapshot = { ...this.$stl };
    }

    if (!force && this.lastSyncedStlAttr === this.stl) {
      return;
    }

    this.lastSyncedStlAttr = this.stl;
    this.$prevStl = { ...this.$stl };

    const next: { [key: string]: string } = { ...this.defaultStlSnapshot };

    if (this.stl) {
      const parsed = parseOptions(this.stl) as { [key: string]: string } | string;

      if (typeof parsed === 'string') {
        next[this['stl-default-element']] = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        Object.keys(parsed).forEach(key => {
          next[key] = parsed[key];
        });
      }
    }

    this.$stl = withEmptyFallback(next);
  }

  protected applyClsOverride(override: unknown): void {
    if (typeof override === 'string') {
      this.$cls = withEmptyFallback({ ...this.$cls, [this['cls-default-element']]: override });
    } else if (typeof override === 'object' && override !== null) {
      this.$cls = withEmptyFallback({
        ...this.$cls,
        ...(override as { [key: string]: string }),
      });
    }
  }

  protected applyStlOverride(override: unknown): void {
    if (typeof override === 'string') {
      this.$stl = withEmptyFallback({ ...this.$stl, [this['stl-default-element']]: override });
    } else if (typeof override === 'object' && override !== null) {
      this.$stl = withEmptyFallback({
        ...this.$stl,
        ...(override as { [key: string]: string }),
      });
    }
  }

  protected partStyle(part: string, before?: string): string | typeof nothing {
    const own = this.$stl[part];
    const val = before ? (own ? `${before}; ${own}` : before) : own;

    return val || nothing;
  }

  protected hasChanged(changedProperties: PropertyValues, keys: readonly string[]): boolean {
    return keys.some(key => changedProperties.has(key));
  }

  protected splitClasses(raw: string): string[] {
    return splitClasses(raw);
  }

  protected toggleClasses(el: Element, raw: string, force?: boolean): void {
    toggleClasses(el, raw, force);
  }

  protected hasClasses(el: Element, raw: string): boolean {
    return hasClasses(el, raw);
  }

  protected clearPrevClasses(
    targets: Element | Iterable<Element>,
    prevRaw: string | undefined,
    nextRaw?: string,
  ): void {
    if (prevRaw && prevRaw !== nextRaw) {
      removeClasses(targets, prevRaw);
    }
  }

  protected isRtl(el: Element = this): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.getComputedStyle(el).direction === 'rtl';
  }

  protected prefersReducedMotion(): boolean {
    return prefersReducedMotion();
  }

  protected cleanEmptyStyle(el: HTMLElement): void {
    cleanEmptyStyle(el);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.syncCls(true);
    this.syncStl(true);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('cls')) {
      this.syncCls();
    }

    if (changedProperties.has('stl')) {
      this.syncStl();
    }
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
