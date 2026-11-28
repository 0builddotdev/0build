import { LitElement, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { randomString } from './helpers/common';
import { parseOptions } from './helpers/options';

export abstract class Base extends LitElement {
  @property({ type: String })
  cls: string = '';

  @property({ type: String })
  stl: string = '';

  @state()
  protected $cls: { [key: string]: string } = {};

  @state()
  protected $stl: { [key: string]: string } = {};

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

    this.$cls = next;
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

    this.$stl = next;
  }

  protected applyClsOverride(override: unknown): void {
    if (typeof override === 'string') {
      this.$cls = { ...this.$cls, [this['cls-default-element']]: override };
    } else if (typeof override === 'object' && override !== null) {
      this.$cls = { ...this.$cls, ...(override as { [key: string]: string }) };
    }
  }

  protected applyStlOverride(override: unknown): void {
    if (typeof override === 'string') {
      this.$stl = { ...this.$stl, [this['stl-default-element']]: override };
    } else if (typeof override === 'object' && override !== null) {
      this.$stl = { ...this.$stl, ...(override as { [key: string]: string }) };
    }
  }

  protected hasChanged(changedProperties: PropertyValues, keys: readonly string[]): boolean {
    return keys.some(key => changedProperties.has(key));
  }

  protected splitClasses(raw: string): string[] {
    return raw
      .split(/\s+/)
      .map(token => token.trim())
      .filter(Boolean);
  }

  protected isRtl(el: Element = this): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.getComputedStyle(el).direction === 'rtl';
  }

  protected prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  protected cleanEmptyStyle(el: HTMLElement): void {
    if (el.getAttribute('style')?.trim() === '') {
      el.removeAttribute('style');
    }
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
