export interface OptionData {
  keywords?: string[];
  gid?: string;
  [key: string]: any;
}

export interface OptionItem {
  group: string;
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  data: OptionData;
}

export interface OptionGrouped {
  [groupKey: string]: {
    text: string;
    options: OptionItem[];
    data?: OptionData;
  };
}

export function selectToObject(select: HTMLSelectElement): OptionGrouped {
  const groupedOptions: OptionGrouped = {};

  const processDataAttributes = (element: HTMLElement, baseKeywords: string[] = []): OptionData => {
    const data: OptionData = baseKeywords.length > 0 ? { keywords: baseKeywords } : {};

    Object.keys(element.dataset).forEach(attribute => {
      if (attribute === 'keywords') {
        const additionalKeywords = element.dataset
          .keywords!.split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);

        data.keywords =
          baseKeywords.length > 0 ? [...baseKeywords, ...additionalKeywords] : additionalKeywords;
      } else {
        data[attribute] = element.dataset[attribute];
      }
    });

    return data;
  };

  const processOption = (
    groupKey: string,
    groupLabel: string,
    option: HTMLOptionElement,
    isGroupDisabled = false,
  ): void => {
    const optionValue = option.hasAttribute('value')
      ? option.getAttribute('value')!
      : option.textContent!.trim();

    const optionData = processDataAttributes(option, [optionValue]);

    if (!groupedOptions[groupKey]) {
      groupedOptions[groupKey] = {
        text: groupLabel,
        options: [],
      };
    }

    groupedOptions[groupKey].options.push({
      group: groupKey,
      value: optionValue,
      text: option.textContent!.trim(),
      disabled: isGroupDisabled || option.disabled,
      selected: option.hasAttribute('selected'),
      data: optionData,
    });
  };

  Array.from(select.children).forEach(element => {
    if (element.nodeName === 'OPTGROUP') {
      const optgroup = element as HTMLOptGroupElement;
      const groupKey = optgroup.dataset.key || optgroup.getAttribute('label')!;
      const groupLabel = optgroup.getAttribute('label')!.trim();

      const optgroupData = processDataAttributes(optgroup);

      Array.from(optgroup.children).forEach(child => {
        if (child.nodeName === 'OPTION') {
          processOption(groupKey, groupLabel, child as HTMLOptionElement, optgroup.disabled);
        }
      });

      if (Object.keys(optgroupData).length > 0) {
        if (!groupedOptions[groupKey]) {
          groupedOptions[groupKey] = {
            text: groupLabel,
            options: [],
          };
        }
        groupedOptions[groupKey].data = optgroupData;
      }
    } else if (element.nodeName === 'OPTION') {
      processOption('__', '__', element as HTMLOptionElement);
    }
  });

  return groupedOptions;
}
