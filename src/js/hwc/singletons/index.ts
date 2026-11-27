import { zToast } from './toast';

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

if (typeof window !== 'undefined') {
  window.zToast = zToast;
}
