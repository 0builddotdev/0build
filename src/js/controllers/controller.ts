import { Base } from '../shared/base';

export abstract class Controller extends Base {
  protected abstract readonly eventPrefix: string;

  protected isInitialized: boolean = false;

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
}
