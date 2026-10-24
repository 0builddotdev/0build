import { type ZRuntimePlugin } from '../main';

export const clsPreventionPlugin: ZRuntimePlugin = {
  name: 'cls-prevention',

  onInit: () => {
    if (typeof document === 'undefined') {
      return;
    }

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

    if (document.documentElement.classList.contains('z-not-ready')) {
      document.documentElement.classList.remove('z-not-ready');
      document.documentElement.classList.add('z-ready');
    }

    document.dispatchEvent(
      new CustomEvent('z-runtime:ready', {
        detail: { timestamp: Date.now() },
      }),
    );
  },
};
