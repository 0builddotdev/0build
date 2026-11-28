import type { ZToast } from './src/js/singletons/toast';

export {};

declare global {
  interface Window {
    zLit: any;
    zLitDecorators: any;
    zLitRepeat: any;
    zLitUnsafeHTML: any;
    zLitClassMap: any;
    zLitIfDefined: any;
    zFloatingUI: typeof import('@floating-ui/dom');
    zBase: any;
    zHwc: typeof import('./src/js/hwc/hwc');
    zController: typeof import('./src/js/controllers/controller');
    zInput: any;
    zDropdown: any;
    zOptions: any;
    zLucide: any;
    zApexCharts: any;
    zToast: ZToast;
  }
}
