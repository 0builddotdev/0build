import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { Controller } from './controllers/controller';
import { getGlobalI18n, getGlobalIconStrings, Hwc } from './hwc/hwc';
import { DropdownMixin } from './hwc/mixins/dropdown';
import { InputMixin } from './hwc/mixins/input';
import {
  Base,
  cleanEmptyStyle,
  ensureButtonAccessibility,
  hasClasses,
  isDisabledElement,
  prefersReducedMotion,
  removeClasses,
  splitClasses,
  toggleClasses,
} from './shared/base';
import { randomString } from './shared/helpers/common';
import { parseAttrObject, parseOptions } from './shared/helpers/options';

window.zLit = { html, LitElement, nothing };
window.zLitDecorators = { customElement, property, state };
window.zLitRepeat = { repeat };
window.zLitUnsafeHTML = { unsafeHTML };
window.zLitClassMap = { classMap };
window.zLitIfDefined = { ifDefined };
window.zFloatingUI = { autoUpdate, computePosition, flip, offset, shift, size };
window.zBase = {
  Base,
  cleanEmptyStyle,
  ensureButtonAccessibility,
  hasClasses,
  isDisabledElement,
  prefersReducedMotion,
  removeClasses,
  splitClasses,
  toggleClasses,
};
window.zCommon = { randomString };
window.zHwc = { Hwc, getGlobalI18n, getGlobalIconStrings };
window.zController = { Controller };
window.zInput = { InputMixin };
window.zDropdown = { DropdownMixin };
window.zOptions = { parseOptions, parseAttrObject };
