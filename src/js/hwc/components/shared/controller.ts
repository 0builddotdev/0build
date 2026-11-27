import { LitElement } from 'lit';
import { randomString } from '../../helpers/common';

export abstract class Controller extends LitElement {
  protected abstract readonly eventPrefix: string;

  protected readonly uid: string = randomString(6);

  protected isInitialized: boolean = false;

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.isInitialized) {
      this.refresh();
    }
  }

  public abstract refresh(): void;

  protected emit(
    name: string,
    detail: Record<string, unknown>,
    cancelable: boolean = false,
  ): boolean {
    return this.dispatchEvent(
      new CustomEvent(`${this.eventPrefix}:${name}`, {
        detail,
        bubbles: true,
        composed: true,
        cancelable,
      }),
    );
  }

  protected unwrapTemplate(container: HTMLElement, mountDetail: Record<string, unknown>): boolean {
    const directTemplates = Array.from(container.children).filter(
      (child): child is HTMLTemplateElement => child instanceof HTMLTemplateElement,
    );
    const template =
      directTemplates.find(el => el.getAttribute('data-fn') === 'template') ??
      (container.children.length === 1 ? directTemplates[0] : undefined);

    if (!template) {
      return false;
    }

    const fragment = template.content.cloneNode(true);

    template.remove();
    container.appendChild(fragment);
    this.emit('mount', mountDetail);

    return true;
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
}
