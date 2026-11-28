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
    zFloatingUI: Pick<
      typeof import('@floating-ui/dom'),
      'autoUpdate' | 'computePosition' | 'flip' | 'offset' | 'shift' | 'size'
    >;
    zBase: typeof import('./src/js/shared/base');
    zCommon: typeof import('./src/js/shared/helpers/common');
    zHwc: Pick<
      typeof import('./src/js/hwc/hwc'),
      'Hwc' | 'getGlobalI18n' | 'getGlobalIconStrings'
    >;
    zController: typeof import('./src/js/controllers/controller');
    zInput: any;
    zDropdown: typeof import('./src/js/hwc/mixins/dropdown');
    zOptions: typeof import('./src/js/shared/helpers/options');
    zLucide: any;
    zApexCharts: any;
    zToast: ZToast;
    zDialog: typeof import('./src/js/hwc/mixins/dialog');
    zAnimation: typeof import('./src/js/shared/helpers/animation');
    zCss: typeof import('./src/js/shared/helpers/css');
    zGesture: typeof import('./src/js/shared/helpers/gesture');
    zSvg: typeof import('./src/js/shared/helpers/svg');
  }
}
