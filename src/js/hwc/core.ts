import * as Lit from 'lit';
import * as LitDecorators from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

window.zLit = Lit;
window.zLitDecorators = LitDecorators;
window.zLitRepeat = { repeat };
window.zLitUnsafeHTML = { unsafeHTML };
