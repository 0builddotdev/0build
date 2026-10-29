import * as Lit from 'lit';
import * as LitDecorators from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { classMap } from 'lit/directives/class-map.js';
import { Base } from './components/shared/base';
import { InputMixin } from './components/shared/input';
import { DropdownMixin } from './components/shared/dropdown';
import { parseOptions } from './helpers/options';

window.zLit = Lit;
window.zLitDecorators = LitDecorators;
window.zLitRepeat = { repeat };
window.zLitUnsafeHTML = { unsafeHTML };
window.zLitClassMap = { classMap };
window.zBase = { Base };
window.zInput = { InputMixin };
window.zDropdown = { DropdownMixin };
window.zOptions = { parseOptions };
