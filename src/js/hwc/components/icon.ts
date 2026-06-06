import { nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as icons from 'lucide';
import { createElement } from 'lucide';
import { Base } from './shared/base';

@customElement('z-icon')
export class Icon extends Base {
  protected 'cls-default-element' = 'svg';

  protected 'stl-default-element' = 'svg';

  @property({ type: String })
  icon: string = '';

  @property({ type: String })
  label: string = '';

  @property({ type: Boolean })
  decorative: boolean = false;

  @property({ type: String })
  role: string = '';

  @property({ type: String })
  'stroke-width': string = '2';

  @property({ type: String })
  height: string = '16';

  @property({ type: String })
  width: string = '16';

  @property({ type: String })
  size: string | undefined;

  @property({ type: String })
  color: string = '';

  @property({ type: String })
  fill: string = 'none';

  @state()
  protected $svg: SVGElement | undefined;

  private readonly defaultI18n = {
    label: '',
  };

  get key() {
    return this.icon
      .trim()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private getEffectiveLabel(): string {
    const i18nLabel = this.getI18nText('label', this.defaultI18n);

    return i18nLabel || this.label;
  }

  protected updated(changedProperties: PropertyValues): void {
    const iconProperties = [
      'icon',
      'stroke-width',
      'height',
      'width',
      'size',
      'color',
      'fill',
      'label',
      'decorative',
      'role',
      '$cls',
      '$stl',
    ];

    if (
      iconProperties.some(property => changedProperties.has(property)) ||
      changedProperties.has('$i18n')
    ) {
      this.updateComplete.then(() => {
        this.regenerateSvg();
      });
    }
  }

  private regenerateSvg(): void {
    this.$svg = this.createSvg({
      icon: this.key,
      cls: this.$cls['svg'] || '',
      stl: this.$stl['svg'] || '',
      height: this.size || this.height,
      width: this.size || this.width,
      strokeWidth: this['stroke-width'],
      color: this.color,
      fill: this.fill,
      label: this.getEffectiveLabel(),
      decorative: this.decorative,
      role: this.role,
    });
  }

  private createSvg(options: {
    icon: string;
    cls: string;
    stl: string;
    height: string;
    width: string;
    strokeWidth: string;
    color: string;
    fill: string;
    label: string;
    decorative: boolean;
    role: string;
  }): SVGElement | undefined {
    const { icon, cls, stl, height, width, strokeWidth, color, fill, label, decorative, role } =
      options;

    try {
      const iconData = (icons as unknown as Record<string, icons.IconNode>)[icon];

      if (!iconData) {
        console.warn(`z-icon: Icon "${this.icon}" not found in Lucide icons.`);

        return undefined;
      }

      const svgElement = createElement(iconData);

      if (cls) {
        svgElement.setAttribute('class', cls);
      }

      if (stl) {
        svgElement.setAttribute('style', stl);
      }

      svgElement.setAttribute('height', height);
      svgElement.setAttribute('width', width);
      svgElement.setAttribute('stroke-width', strokeWidth);

      if (fill !== 'none') {
        svgElement.setAttribute('fill', fill);
      }

      if (color) {
        const currentStyle = svgElement.getAttribute('style') || '';

        svgElement.setAttribute('style', `${currentStyle}; color: ${color};`);
      }

      if (decorative) {
        svgElement.setAttribute('aria-hidden', 'true');
        svgElement.removeAttribute('role');
        svgElement.removeAttribute('aria-label');
      } else if (label) {
        svgElement.setAttribute('role', role || 'img');
        svgElement.setAttribute('aria-label', label);
        svgElement.removeAttribute('aria-hidden');
      } else if (role) {
        svgElement.setAttribute('role', role);
        svgElement.removeAttribute('aria-hidden');
      }

      svgElement.setAttribute('data-icon', this.icon);
      svgElement.setAttribute('data-lucide', this.icon);

      return svgElement;
    } catch (error) {
      console.warn(`z-icon: Failed to create icon "${this.icon}":`, error);

      return undefined;
    }
  }

  render() {
    return this.renderRoot.children.length === 0 ? this.$svg : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-icon': Icon;
  }
}
