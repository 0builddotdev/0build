import { type ParsedClass } from './parsers';
import { type Rule } from './registry/rules';

export interface CssRule {
  css: string;
  layer: string;
  breakpoint: string | null;
}

export interface GeneratedCssLayer {
  base: string[];
  media: Record<string, string[]>;
}

export interface GeneratedCSS {
  components: GeneratedCssLayer;
  styles: GeneratedCssLayer;
  utilities: GeneratedCssLayer;
}

export interface ZRuntimePlugin {
  name: string;
  onInit?: (core: any) => void;
  onRulesLoad?: (rules: Rule[]) => Rule[];
  onElementScan?: (element: Element, rules: Rule[]) => ParsedClass[];
  onAdditionalClasses?: () => ParsedClass[];
  onBeforeInject?: (generatedCss: GeneratedCSS) => GeneratedCSS;
  onAfterInject?: () => void;
}
