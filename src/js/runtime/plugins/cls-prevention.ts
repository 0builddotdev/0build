import { type ZRuntimePlugin } from '../types';

export const clsPreventionPlugin: ZRuntimePlugin = {
  name: 'cls-prevention',

  onInit: () => {
    if (typeof document === 'undefined') {
      return;
    }

    // Emit initialization event
    document.dispatchEvent(
      new CustomEvent('z-runtime:init', {
        detail: { timestamp: Date.now() },
      }),
    );
  },

  onAfterInject: () => {
    if (typeof document === 'undefined') {
      return;
    }

    // Only swap state classes if the page opted into the not-ready guard.
    // Prevents an unnecessary class mutation / flicker when it wasn't set.
    if (document.documentElement.classList.contains('z-not-ready')) {
      document.documentElement.classList.remove('z-not-ready');
      document.documentElement.classList.add('z-ready');
    }

    // Emit ready event for developers to hook into
    document.dispatchEvent(
      new CustomEvent('z-runtime:ready', {
        detail: { timestamp: Date.now() },
      }),
    );
  },
};
