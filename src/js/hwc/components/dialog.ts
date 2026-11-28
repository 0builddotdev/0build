import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Hwc } from '$js/hwc/hwc';
import { randomString } from '../../shared/helpers/common';
import { DialogMixin } from '../mixins/dialog';

interface Cls extends Record<string, string> {
  overlay: string;
  dialog: string;
}

interface Stl extends Record<string, string> {
  overlay: string;
  dialog: string;
}

@customElement('z-dialog')
export class Dialog extends DialogMixin(Hwc) {
  protected readonly 'cls-default-element': string = 'dialog';

  protected readonly 'stl-default-element': string = 'dialog';

  protected readonly 'dialog-event-prefix': string = 'z-dialog';

  @property({ type: String, attribute: 'dialog-role' })
  dialogRole: 'dialog' | 'alertdialog' = 'dialog';

  @property({ type: String, attribute: 'aria-label' })
  ariaLabelText: string = '';

  @property({ type: String, attribute: 'aria-labelledby' })
  ariaLabelledbyText: string = '';

  @state()
  protected $cls: Cls = {
    overlay: 'z-modal',
    dialog: 'z-modal-dialog',
  };

  @state()
  protected $stl: Stl = {
    overlay: '',
    dialog: '',
  };

  @state()
  private autoLabelledBy: string = '';

  @state()
  private adoptedDialogClasses: string = '';

  @state()
  private adoptedDialogStyle: string = '';

  @state()
  private adoptedDialogRole: string = '';

  protected override onDialogMount(): void {
    this.HTMLOverlay = this.querySelector<HTMLElement>('[data-part="overlay"]');
    this.HTMLDialogPanel = this.querySelector<HTMLElement>('[data-part="dialog"]');

    this.adoptedDialogClasses = '';
    this.adoptedDialogStyle = '';
    this.adoptedDialogRole = '';
    this.autoLabelledBy = '';

    const template =
      this.HTMLTemplateContainer ??
      this.querySelector<HTMLTemplateElement>(':scope > template[data-fn="template"]');

    if (template && this.HTMLDialogPanel) {
      const fragment = template.content.cloneNode(true) as DocumentFragment;
      const meaningfulNodes = Array.from(fragment.childNodes).filter(
        node => !(node.nodeType === Node.TEXT_NODE && !(node.textContent ?? '').trim()),
      );

      if (
        meaningfulNodes.length === 1 &&
        meaningfulNodes[0] instanceof Element &&
        meaningfulNodes[0].classList.contains('z-modal-dialog')
      ) {
        const dialogWrapper = meaningfulNodes[0];

        this.adoptedDialogClasses = Array.from(dialogWrapper.classList)
          .filter(cls => cls !== 'z-modal-dialog')
          .join(' ');
        this.adoptedDialogStyle = dialogWrapper.getAttribute('style') ?? '';

        const wrapperRole = dialogWrapper.getAttribute('role');

        if (wrapperRole === 'dialog' || wrapperRole === 'alertdialog') {
          this.adoptedDialogRole = wrapperRole;
        }

        while (dialogWrapper.firstChild) {
          this.HTMLDialogPanel.appendChild(dialogWrapper.firstChild);
        }
      } else {
        this.HTMLDialogPanel.appendChild(fragment);
      }
    }

    if (!this.ariaLabelText && !this.ariaLabelledbyText && this.HTMLDialogPanel) {
      const titleEl = this.HTMLDialogPanel.querySelector<HTMLElement>('.z-modal-title');

      if (titleEl) {
        if (!titleEl.id) {
          titleEl.id = `z-dialog-title-${randomString(6)}`;
        }

        this.autoLabelledBy = titleEl.id;
      }
    }

    this.bindOverlayEvents(this.HTMLOverlay);
  }

  protected override onDialogDestroy(): void {
    this.adoptedDialogClasses = '';
    this.adoptedDialogStyle = '';
    this.adoptedDialogRole = '';
    this.autoLabelledBy = '';
  }

  private getOverlayClasses(): string {
    const classes = [this.$cls['overlay']];

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

    return classes.filter(Boolean).join(' ');
  }

  private getDialogClasses(): string {
    const classes = [this.$cls['dialog'], this.adoptedDialogClasses];

    if (this.center && !this.adoptedDialogClasses.split(/\s+/).includes('z-margin-auto-vertical')) {
      classes.push('z-margin-auto-vertical');
    }

    return classes.filter(Boolean).join(' ');
  }

  private getDialogStyle(): string {
    return [this.adoptedDialogStyle, this.$stl['dialog']].filter(Boolean).join('; ');
  }

  render() {
    if (!this.$mounted) {
      return nothing;
    }

    const effectiveRole = this.adoptedDialogRole || this.dialogRole || 'dialog';
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
          data-part="dialog"
          class="${this.getDialogClasses()}"
          style="${this.getDialogStyle()}"
          role="${effectiveRole}"
          aria-modal="true"
          aria-label="${ifDefined(ariaLabel)}"
          aria-labelledby="${ifDefined(labelledBy)}"
          tabindex="-1"
        ></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-dialog': Dialog;
  }
}
