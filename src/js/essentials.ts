import { DialogMixin } from '$js/hwc/mixins/dialog';
import {
  applyDeckSlideFrame,
  clampNumber,
  clearDeckSlideStyles,
  createDeckTransition,
  evaluateEasing,
  readCollapseMetrics,
  resolveAnimationPreset,
  runCssAnimation,
  zeroCollapseFrame,
} from '$js/shared/helpers/animation';
import {
  observeMediaQuery,
  parseMediaQuery,
  queryOffsetElement,
  readCssPxVar,
  resolveOffsetPx,
  toPx,
} from '$js/shared/helpers/css';
import {
  computeVelocity,
  createClickSuppressor,
  recordVelocitySample,
  startPointerTrack,
} from '$js/shared/helpers/gesture';
import { svgIcon, svgIconMarkup } from '$js/shared/helpers/svg';
import { ensureToggleListener } from './shared/helpers/toggle';
import { ensureTooltipListener } from './singletons/tooltip';

export * from './hwc/components/dialog';
export * from './hwc/components/drawer';
export * from './hwc/components/drop';
export * from './hwc/components/lsh';
export * from './controllers/components/accordion';
export * from './controllers/components/switcher';
export { dismissElement, togglePlainElements, type ZCloseOptions } from './singletons/close';
export { ensureTooltipListener, hideTooltip, type ZTooltipOptions } from './singletons/tooltip';
export { ensureToggleListener };

window.zDialog = { DialogMixin };
window.zAnimation = {
  applyDeckSlideFrame,
  clampNumber,
  clearDeckSlideStyles,
  createDeckTransition,
  evaluateEasing,
  readCollapseMetrics,
  resolveAnimationPreset,
  runCssAnimation,
  zeroCollapseFrame,
};
window.zCss = {
  observeMediaQuery,
  parseMediaQuery,
  queryOffsetElement,
  readCssPxVar,
  resolveOffsetPx,
  toPx,
};
window.zGesture = {
  computeVelocity,
  createClickSuppressor,
  recordVelocitySample,
  startPointerTrack,
};
window.zSvg = { svgIcon, svgIconMarkup };

ensureToggleListener();
ensureTooltipListener();
