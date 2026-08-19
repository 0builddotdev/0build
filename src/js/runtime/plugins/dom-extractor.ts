import { type ZRuntimePlugin } from '../types';
import { parseClassName, type ParsedClass } from '../parsers';

export const domExtractorPlugin: ZRuntimePlugin = {
  name: 'dom-extractor',
  onElementScan: (element: Element) => {
    const interactiveClasses: ParsedClass[] = [];

    for (const className of element.classList) {
      if (className.includes('=')) {
        continue;
      }

      const parsed = parseClassName(className);

      if (parsed) {
        interactiveClasses.push(parsed);
      }
    }

    return interactiveClasses;
  },
};
