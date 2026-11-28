import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Hwc } from '$js/hwc/hwc';
import { DialogMixin } from '$js/hwc/mixins/dialog';

@customElement('z-dialog')
export class Dialog extends DialogMixin(Hwc) {
  protected readonly 'cls-default-element': string = 'dialog';

  protected readonly 'stl-default-element': string = 'dialog';

  protected readonly 'dialog-event-prefix': string = 'z-dialog';

  @state()
  protected $cls = {
    overlay: 'z-modal',
    dialog: 'z-modal-dialog',
  };

  protected override onDialogMount(): void {
    this.HTMLOverlay = this.querySelector<HTMLElement>('[data-part="overlay"]');
    this.HTMLDialogPanel = this.querySelector<HTMLElement>('[data-part="dialog"]');
    this.adoptDialogTemplate(this.HTMLDialogPanel, ['z-modal-dialog'], '.z-modal-title');
    this.bindOverlayEvents(this.HTMLOverlay);
  }

  private getDialogClasses(): string {
    const classes = [this.$cls['dialog'], this.adoptedPanelClasses];

    if (this.center && !this.adoptedPanelClasses.split(/\s+/).includes('z-margin-auto-vertical')) {
      classes.push('z-margin-auto-vertical');
    }

    return classes.filter(Boolean).join(' ');
  }

  render() {
    if (!this.$mounted) {
      return nothing;
    }

    const aria = this.getDialogAria();

    return html`
      <div
        data-host-inner
        data-part="overlay"
        class="${this.getOverlayClasses()}"
        style=${this.partStyle('overlay')}
      >
        <div
          data-part="dialog"
          class="${this.getDialogClasses()}"
          style=${this.partStyle('dialog', this.adoptedPanelStyle)}
          role="${aria.role}"
          aria-modal="true"
          aria-label="${ifDefined(aria.ariaLabel)}"
          aria-labelledby="${ifDefined(aria.labelledBy)}"
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
