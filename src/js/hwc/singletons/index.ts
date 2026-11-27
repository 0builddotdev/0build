import { ensureToggleListener } from '../helpers/toggle';
import { zToast } from './toast';
import { ensureTooltipListener } from './tooltip';

export { dismissElement, togglePlainElements, type ZCloseOptions } from './close';
export {
  zToast,
  type ZToast,
  type ZToastAction,
  type ZToastGlobalConfig,
  type ZToastOptions,
  type ZToastPart,
  type ZToastPosition,
  type ZToastPromiseOptions,
  type ZToastPromiseResult,
  type ZToastStatus,
} from './toast';
export { ensureTooltipListener, hideTooltip, type ZTooltipOptions } from './tooltip';
export { ensureToggleListener };

if (typeof window !== 'undefined') {
  window.zToast = zToast;
}

ensureToggleListener();
ensureTooltipListener();
