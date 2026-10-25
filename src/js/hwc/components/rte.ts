import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import { Base } from './shared/base.js';
import { InputMixin } from './shared/input.js';

interface Cls extends Record<string, string> {
  'host-inner': string;
  header: string;
  toolbar: string;
  'toolbar-group': string;
  button: string;
  body: string;
  editor: string;
  footer: string;
}

interface Stl extends Record<string, string> {
  'host-inner': string;
  header: string;
  toolbar: string;
  'toolbar-group': string;
  button: string;
  body: string;
  editor: string;
  footer: string;
}

/**
 * Supported toolbar item keys.
 */
export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'list'
  | 'list-ordered'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'blockquote';

/**
 * Internationalization strings for the rich text editor.
 */
export type I18N = {
  'word-counter-singular': string;
  'word-counter-plural': string;
  'tooltip-bold': string;
  'tooltip-italic': string;
  'tooltip-underline': string;
  'tooltip-strikethrough': string;
  'tooltip-list': string;
  'tooltip-list-ordered': string;
  'tooltip-h1': string;
  'tooltip-h2': string;
  'tooltip-h3': string;
  'tooltip-h4': string;
  'tooltip-align-left': string;
  'tooltip-align-center': string;
  'tooltip-align-right': string;
  'tooltip-align-justify': string;
  'tooltip-blockquote': string;
  'aria-toolbar': string;
  'aria-editor': string;
};

type ToolbarButtonConfig = {
  icon: string;
  tooltipKey: keyof I18N;
  isActive: (editor: Editor) => boolean;
  action: (editor: Editor) => void;
};

const DEFAULT_TOOLBAR: ToolbarItem[][] = [
  ['bold', 'italic', 'underline', 'strikethrough'],
  ['list', 'list-ordered'],
  ['h1', 'h2', 'h3', 'h4'],
  ['align-left', 'align-right', 'align-center', 'align-justify'],
  ['blockquote'],
];

const TOOLBAR_ALIASES: Record<string, ToolbarItem> = {
  strike: 'strikethrough',
  'bullet-list': 'list',
  bulletList: 'list',
  'ordered-list': 'list-ordered',
  orderedList: 'list-ordered',
  'heading-1': 'h1',
  'heading-2': 'h2',
  'heading-3': 'h3',
  'heading-4': 'h4',
  quote: 'blockquote',
  'text-quote': 'blockquote',
};

const TOOLBAR_REGISTRY: Record<ToolbarItem, ToolbarButtonConfig> = {
  bold: {
    icon: 'bold',
    tooltipKey: 'tooltip-bold',
    isActive: editor => editor.isActive('bold'),
    action: editor => editor.chain().focus().toggleBold().run(),
  },
  italic: {
    icon: 'italic',
    tooltipKey: 'tooltip-italic',
    isActive: editor => editor.isActive('italic'),
    action: editor => editor.chain().focus().toggleItalic().run(),
  },
  underline: {
    icon: 'underline',
    tooltipKey: 'tooltip-underline',
    isActive: editor => editor.isActive('underline'),
    action: editor => editor.chain().focus().toggleUnderline().run(),
  },
  strikethrough: {
    icon: 'strikethrough',
    tooltipKey: 'tooltip-strikethrough',
    isActive: editor => editor.isActive('strike'),
    action: editor => editor.chain().focus().toggleStrike().run(),
  },
  list: {
    icon: 'list',
    tooltipKey: 'tooltip-list',
    isActive: editor => editor.isActive('bulletList'),
    action: editor => editor.chain().focus().toggleBulletList().run(),
  },
  'list-ordered': {
    icon: 'list-ordered',
    tooltipKey: 'tooltip-list-ordered',
    isActive: editor => editor.isActive('orderedList'),
    action: editor => editor.chain().focus().toggleOrderedList().run(),
  },
  h1: {
    icon: 'heading-1',
    tooltipKey: 'tooltip-h1',
    isActive: editor => editor.isActive('heading', { level: 1 }),
    action: editor => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  h2: {
    icon: 'heading-2',
    tooltipKey: 'tooltip-h2',
    isActive: editor => editor.isActive('heading', { level: 2 }),
    action: editor => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  h3: {
    icon: 'heading-3',
    tooltipKey: 'tooltip-h3',
    isActive: editor => editor.isActive('heading', { level: 3 }),
    action: editor => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  h4: {
    icon: 'heading-4',
    tooltipKey: 'tooltip-h4',
    isActive: editor => editor.isActive('heading', { level: 4 }),
    action: editor => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  'align-left': {
    icon: 'align-left',
    tooltipKey: 'tooltip-align-left',
    isActive: editor => editor.isActive({ textAlign: 'left' }),
    action: editor => editor.chain().focus().setTextAlign('left').run(),
  },
  'align-center': {
    icon: 'align-center',
    tooltipKey: 'tooltip-align-center',
    isActive: editor => editor.isActive({ textAlign: 'center' }),
    action: editor => editor.chain().focus().setTextAlign('center').run(),
  },
  'align-right': {
    icon: 'align-right',
    tooltipKey: 'tooltip-align-right',
    isActive: editor => editor.isActive({ textAlign: 'right' }),
    action: editor => editor.chain().focus().setTextAlign('right').run(),
  },
  'align-justify': {
    icon: 'align-justify',
    tooltipKey: 'tooltip-align-justify',
    isActive: editor => editor.isActive({ textAlign: 'justify' }),
    action: editor => editor.chain().focus().setTextAlign('justify').run(),
  },
  blockquote: {
    icon: 'text-quote',
    tooltipKey: 'tooltip-blockquote',
    isActive: editor => editor.isActive('blockquote'),
    action: editor => editor.chain().focus().toggleBlockquote().run(),
  },
};

/**
 * Rich Text Editor web component (`z-rte`) based on TipTap.
 *
 * @example
 * Basic usage:
 * ```html
 * <z-rte name="content" placeholder="Start writing..."></z-rte>
 * ```
 *
 * Custom grouped toolbar:
 * ```html
 * <z-rte toolbar="[[bold, italic], [list, list-ordered]]"></z-rte>
 * ```
 *
 * With initial content:
 * ```html
 * <z-rte name="description">
 *   <template data-fn="value">
 *     <p>Initial <strong>formatted</strong> content</p>
 *   </template>
 * </z-rte>
 * ```
 */
@customElement('z-rte')
export class Rte extends InputMixin(Base) {
  /**
   * Custom toolbar configuration.
   * Accepts bracket notation (`"[[bold, italic], [list]]"`), JSON arrays,
   * or pipe-separated groups (`"bold, italic | list"`).
   */
  @property({ type: String })
  toolbar: string = '';

  @state()
  protected content: string = '';

  @state()
  protected $toolbar: ToolbarItem[][] = DEFAULT_TOOLBAR;

  /**
   * Tracks roving tabindex index for keyboard navigation inside the toolbar.
   */
  @state()
  private focusedToolbarIndex: number = 0;

  protected 'input-event': string = 'z-rte:input';

  protected 'cls-default-element': string = 'editor';

  protected 'stl-default-element': string = 'editor';

  @state()
  protected $cls: Cls = {
    'host-inner': 'z-rte',
    header: 'z-rte-header',
    toolbar: 'z-rte-toolbar',
    'toolbar-group': 'z-rte-toolbar-group',
    button: 'z-button z-button-default z-button-icon z-button-xsmall',
    body: 'z-rte-body',
    editor: '',
    footer: 'z-rte-footer',
  };

  @state()
  protected $stl: Stl = {
    'host-inner': '',
    header: '',
    toolbar: '',
    'toolbar-group': '',
    button: '',
    body: '',
    editor: '',
    footer: '',
  };

  protected defaultI18n: I18N = {
    'word-counter-singular': 'word',
    'word-counter-plural': 'words',
    'tooltip-bold': 'Bold',
    'tooltip-italic': 'Italic',
    'tooltip-underline': 'Underline',
    'tooltip-strikethrough': 'Strikethrough',
    'tooltip-list': 'List',
    'tooltip-list-ordered': 'Ordered List',
    'tooltip-h1': 'Heading 1',
    'tooltip-h2': 'Heading 2',
    'tooltip-h3': 'Heading 3',
    'tooltip-h4': 'Heading 4',
    'tooltip-align-left': 'Align Left',
    'tooltip-align-center': 'Align Center',
    'tooltip-align-right': 'Align Right',
    'tooltip-align-justify': 'Align Justify',
    'tooltip-blockquote': 'Blockquote',
    'aria-toolbar': 'Formatting options',
    'aria-editor': 'Rich text editor',
  };

  private editor: Editor | null = null;

  /**
   * Guards against scheduling redundant Lit updates when TipTap transactions
   * are triggered synchronously inside Lit's own lifecycle methods.
   */
  private isSyncingEditor: boolean = false;

  protected get $value(): string {
    return this.content;
  }

  protected get $text(): string {
    return this.editor?.getText() ?? '';
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeToolbar();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.editor?.destroy();
    this.editor = null;
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has('toolbar')) {
      this.initializeToolbar();
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.initializeEditor();
  }

  protected updated(changedProperties: PropertyValues): void {
    const isFirstRender = !this.isRendered;

    super.updated(changedProperties);

    if (isFirstRender || !this.editor) {
      return;
    }

    this.isSyncingEditor = true;

    try {
      if (changedProperties.has('disabled')) {
        this.editor.setEditable(!this.disabled);
        this.syncEditorAttributes();
      }

      if (changedProperties.has('required')) {
        this.syncEditorAttributes();
      }
    } finally {
      this.isSyncingEditor = false;
    }
  }

  protected onConfigChanged(): void {
    this.isSyncingEditor = true;

    try {
      this.initializeToolbar();
      this.syncEditorAttributes();
    } finally {
      this.isSyncingEditor = false;
    }
    this.requestUpdate();
  }

  /**
   * Initializes the editor content strictly from `<template data-fn="value">`.
   */
  protected initializeValue(): void {
    const valueTemplate = this.querySelector<HTMLTemplateElement>('template[data-fn="value"]');

    if (valueTemplate) {
      this.content = valueTemplate.innerHTML.trim();
    }
  }

  /**
   * Parses toolbar configuration from the `toolbar` attribute or JSON config.
   */
  private initializeToolbar(): void {
    const configToolbar = (this.$config as Record<string, unknown>)?.toolbar;
    const rawToolbar = this.toolbar || configToolbar;

    if (!rawToolbar) {
      this.$toolbar = DEFAULT_TOOLBAR;

      return;
    }

    this.$toolbar = this.parseToolbar(rawToolbar);
  }

  private normalizeToolbarItem(item: unknown): ToolbarItem | null {
    if (typeof item !== 'string') {
      return null;
    }

    const key = item.trim();
    const resolved = (TOOLBAR_ALIASES[key] ?? key) as ToolbarItem;

    return resolved in TOOLBAR_REGISTRY ? resolved : null;
  }

  private normalizeToolbarArray(parsed: unknown[]): ToolbarItem[][] {
    if (parsed.length === 0) {
      return [];
    }

    if (parsed.every(item => typeof item === 'string')) {
      const group = parsed
        .map(item => this.normalizeToolbarItem(item))
        .filter((item): item is ToolbarItem => item !== null);

      return group.length > 0 ? [group] : [];
    }

    return parsed
      .filter(Array.isArray)
      .map(group =>
        group
          .map(item => this.normalizeToolbarItem(item))
          .filter((item): item is ToolbarItem => item !== null),
      )
      .filter(group => group.length > 0);
  }

  private parseToolbar(input: unknown): ToolbarItem[][] {
    if (Array.isArray(input)) {
      return this.normalizeToolbarArray(input);
    }

    if (typeof input !== 'string') {
      return DEFAULT_TOOLBAR;
    }

    const trimmed = input.trim();

    if (!trimmed || trimmed === 'none' || trimmed === 'false' || trimmed === '[]') {
      return [];
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return this.normalizeToolbarArray(parsed);
        }
      } catch {
        try {
          const normalizedJson = trimmed.replace(/([a-zA-Z0-9_-]+)/g, '"$1"');
          const parsed = JSON.parse(normalizedJson);

          if (Array.isArray(parsed)) {
            return this.normalizeToolbarArray(parsed);
          }
        } catch (error) {
          console.warn('z-rte: Failed to parse toolbar attribute:', error);

          return DEFAULT_TOOLBAR;
        }
      }
    }

    const groups = trimmed
      .split(/[|;]/)
      .map(groupStr =>
        groupStr
          .split(',')
          .map(item => this.normalizeToolbarItem(item))
          .filter((item): item is ToolbarItem => item !== null),
      )
      .filter(group => group.length > 0);

    return groups.length > 0 ? groups : DEFAULT_TOOLBAR;
  }

  private getEditorAttributes(): Record<string, string> {
    const attrs: Record<string, string> = {
      'data-part': 'editor',
      role: 'textbox',
      'aria-multiline': 'true',
      'aria-label': this.getI18nText('aria-editor', this.defaultI18n) || this.placeholder || '',
      'aria-required': this.required ? 'true' : 'false',
      'aria-disabled': this.disabled ? 'true' : 'false',
    };

    if (this.$cls.editor) {
      attrs.class = this.$cls.editor;
    }

    if (this.$stl.editor) {
      attrs.style = this.$stl.editor;
    }

    return attrs;
  }

  private syncEditorAttributes(): void {
    this.editor?.setOptions({
      editorProps: {
        attributes: this.getEditorAttributes(),
      },
    });
  }

  private initializeEditor(): void {
    const mountEl = this.renderRoot.querySelector('[data-part="body"]');

    if (!mountEl) {
      return;
    }

    this.isSyncingEditor = true;

    try {
      this.editor = new Editor({
        editable: !this.disabled,
        editorProps: {
          attributes: this.getEditorAttributes(),
        },
        element: mountEl,
        extensions: [
          StarterKit.configure({
            link: false,
          }),
          Placeholder.configure({
            placeholder: this.placeholder,
          }),
          TextAlign.configure({
            types: ['heading', 'paragraph'],
          }),
          CharacterCount,
        ],
        content: this.content,
        onTransaction: () => {
          if (!this.isSyncingEditor) {
            this.requestUpdate();
          }
        },
        onUpdate: ({ editor }) => {
          this.content = editor.getHTML();
          this.emit();
        },
      });
    } finally {
      this.isSyncingEditor = false;
    }
  }

  /**
   * WAI-ARIA roving tabindex keyboard navigation for the toolbar.
   */
  private handleToolbarKeydown(e: KeyboardEvent): void {
    const toolbarEl = e.currentTarget as HTMLElement;
    const buttons = Array.from(
      toolbarEl.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );

    if (buttons.length === 0) {
      return;
    }

    let nextIndex = this.focusedToolbarIndex;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (this.focusedToolbarIndex + 1) % buttons.length;
        break;
      case 'ArrowLeft':
        nextIndex = (this.focusedToolbarIndex - 1 + buttons.length) % buttons.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = buttons.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.focusedToolbarIndex = nextIndex;
    buttons[nextIndex]?.focus();
  }

  private getWordCount(): number {
    if (this.editor) {
      return (
        this.editor.storage.characterCount?.words({
          node: this.editor.state.doc,
        }) ?? 0
      );
    }

    if (!this.content) {
      return 0;
    }

    const temp = document.createElement('div');

    temp.innerHTML = this.content;
    const text = temp.textContent?.trim() ?? '';

    return text ? text.split(/\s+/).length : 0;
  }

  private getWordCounterLabel(): string {
    const wordCount = this.getWordCount();

    return wordCount === 1
      ? this.getI18nText('word-counter-singular', this.defaultI18n)
      : this.getI18nText('word-counter-plural', this.defaultI18n);
  }

  /**
   * Internal icon repository for the component.
   *
   * Returns SVG icons as Lit HTML templates for consistent rendering across the component.
   * Icons are defined inline to avoid external dependencies and ensure reliability.
   *
   * @param icon - The name of the icon to retrieve.
   * @returns A Lit HTML template containing the requested SVG icon.
   *
   * @example
   * Usage in a render method:
   * ```typescript
   * render() {
   *   return html`
   *     <button>${this.$icons('plus')} Save</button>
   *   `;
   * }
   * ```
   */
  protected $icons(icon: string) {
    switch (icon) {
      case 'heading-1':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="m17 12 3-2v8" />
          </svg>
        `;
      case 'heading-2':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
          </svg>
        `;
      case 'heading-3':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
            <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
          </svg>
        `;
      case 'heading-4':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 18V6" />
            <path d="M17 10v3a1 1 0 0 0 1 1h3" />
            <path d="M21 10v8" />
            <path d="M4 12h8" />
            <path d="M4 18V6" />
          </svg>
        `;
      case 'align-center':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 12H7" />
            <path d="M19 18H5" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'align-justify':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12h18" />
            <path d="M3 18h18" />
            <path d="M3 6h18" />
          </svg>
        `;
      case 'align-left':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 12H3" />
            <path d="M17 18H3" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'align-right':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12H9" />
            <path d="M21 18H7" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'bold':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
          </svg>
        `;
      case 'italic':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" x2="10" y1="4" y2="4" />
            <line x1="14" x2="5" y1="20" y2="20" />
            <line x1="15" x2="9" y1="4" y2="20" />
          </svg>
        `;
      case 'underline':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" x2="20" y1="20" y2="20" />
          </svg>
        `;
      case 'strikethrough':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16 4H9a3 3 0 0 0-2.83 4" />
            <path d="M14 12a4 4 0 0 1 0 8H6" />
            <line x1="4" x2="20" y1="12" y2="12" />
          </svg>
        `;
      case 'list':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
            <path d="M3 6h.01" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M8 6h13" />
          </svg>
        `;
      case 'list-ordered':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10 12h11" />
            <path d="M10 18h11" />
            <path d="M10 6h11" />
            <path d="M4 10h2" />
            <path d="M4 6h1v4" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        `;
      case 'text-quote':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 6H3" />
            <path d="M21 12H8" />
            <path d="M21 18H8" />
            <path d="M3 12v6" />
          </svg>
        `;
      case 'link':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        `;
    }
  }

  private renderToolbar() {
    if (this.$toolbar.length === 0) {
      return nothing;
    }

    let flatButtonIndex = 0;

    return html`
      <div data-part="header" class="${this.$cls.header}" style="${this.$stl.header}">
        <div
          data-part="toolbar"
          class="${this.$cls.toolbar}"
          style="${this.$stl.toolbar}"
          role="toolbar"
          aria-label="${this.getI18nText('aria-toolbar', this.defaultI18n)}"
          @keydown="${this.handleToolbarKeydown}"
        >
          ${this.$toolbar.map(
            group => html`
              <div
                data-part="toolbar-group"
                class="${this.$cls['toolbar-group']}"
                style="${this.$stl['toolbar-group']}"
                role="group"
              >
                ${group.map(itemKey => {
                  const config = TOOLBAR_REGISTRY[itemKey];
                  const isActive = this.editor ? config.isActive(this.editor) : false;
                  const label = this.getI18nText(config.tooltipKey, this.defaultI18n);
                  const currentIndex = flatButtonIndex++;
                  const tabIndex = currentIndex === this.focusedToolbarIndex ? 0 : -1;
                  const buttonClass = [this.$cls.button, isActive ? 'z-active' : '']
                    .filter(Boolean)
                    .join(' ');

                  return html`
                    <button
                      data-part="button"
                      type="button"
                      tabindex="${tabIndex}"
                      class="${buttonClass}"
                      style="${this.$stl.button}"
                      ?disabled="${this.disabled}"
                      aria-label="${label}"
                      aria-pressed="${isActive ? 'true' : 'false'}"
                      title="${label}"
                      @focus="${() => {
                        this.focusedToolbarIndex = currentIndex;
                      }}"
                      @click="${() => {
                        if (this.editor && !this.disabled) {
                          config.action(this.editor);
                        }
                      }}"
                    >
                      ${this.$icons(config.icon) || nothing}
                    </button>
                  `;
                })}
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div
        data-host-inner
        data-part="host-inner"
        class="${this.$cls['host-inner']}"
        style="${this.$stl['host-inner']}"
      >
        ${this.renderToolbar()}

        <div data-part="body" class="${this.$cls.body}" style="${this.$stl.body}"></div>

        <div
          data-part="footer"
          class="${this.$cls.footer}"
          style="${this.$stl.footer}"
          aria-live="polite"
          aria-atomic="true"
        >
          ${this.getWordCount()} ${this.getWordCounterLabel()}
        </div>

        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-rte': Rte;
  }
}
