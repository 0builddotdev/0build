import { type PropertyValues } from 'lit';
import { computePosition, flip, shift, offset, autoUpdate, type Placement } from '@floating-ui/dom';
import type { Base } from './base.js';
import { state } from 'lit/decorators.js';

export interface DropdownState {
  $open: boolean;
}

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export const DropdownMixin = <TBase extends Constructor<Base>>(BaseClass: TBase) => {
  abstract class Dropdown extends BaseClass {
    @state()
    $open: boolean = false;

    protected HTMLButton: HTMLElement | null = null;

    protected HTMLDrop: HTMLElement | null = null;

    private cleanupAutoUpdate: (() => void) | null = null;

    disconnectedCallback(): void {
      super.disconnectedCallback();
      this.closeDropdown();
    }

    protected updated(changedProperties: PropertyValues): void {
      super.updated(changedProperties);

      if (changedProperties.has('$open')) {
        if (this.$open) {
          this.openDropdown();
        } else {
          this.closeDropdown();
        }
      }
    }

    protected openDropdown() {
      if (!this.HTMLButton || !this.HTMLDrop) {
        return;
      }

      this.cleanupAutoUpdate = autoUpdate(this.HTMLButton, this.HTMLDrop, () => {
        this.updatePosition();
      });

      document.addEventListener('click', this.onOutsideClick, true);
      window.addEventListener('keydown', this.onEscapeKey);
    }

    protected closeDropdown() {
      if (this.cleanupAutoUpdate) {
        this.cleanupAutoUpdate();
        this.cleanupAutoUpdate = null;
      }

      document.removeEventListener('click', this.onOutsideClick, true);
      window.removeEventListener('keydown', this.onEscapeKey);

      // Hook for child components to reset state (like $focused, $term)
      if (typeof (this as any).onDropClose === 'function') {
        (this as any).onDropClose();
      }
    }

    private async updatePosition() {
      if (!this.HTMLButton || !this.HTMLDrop) {
        return;
      }

      const middleware = [];
      const config = this.$floating; // Inherited from Base

      if (config.offset !== undefined) {
        middleware.push(offset(Number(config.offset)));
      }

      const flipEnabled = config.flip !== false && config.flip !== 'false';

      if (flipEnabled) {
        middleware.push(flip());
      }

      const shiftEnabled = config.shift !== false && config.shift !== 'false';

      if (shiftEnabled) {
        middleware.push(shift({ padding: Number(config.shiftPadding ?? 5) }));
      }

      const { x, y } = await computePosition(this.HTMLButton, this.HTMLDrop, {
        placement: (config.placement || 'bottom-start') as Placement,
        middleware,
      });

      Object.assign(this.HTMLDrop.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
      });
    }

    protected toggleDropdown = () => {
      if ((this as any).disabled) {
        return;
      }

      this.$open = !this.$open;
    };

    private onOutsideClick = (e: MouseEvent) => {
      if (
        this.HTMLButton &&
        this.HTMLDrop &&
        !this.HTMLButton.contains(e.target as Node) &&
        !this.HTMLDrop.contains(e.target as Node)
      ) {
        this.$open = false;
      }
    };

    private onEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.$open) {
        this.$open = false;
        this.HTMLButton?.focus();
      }
    };
  }

  return Dropdown;
};
