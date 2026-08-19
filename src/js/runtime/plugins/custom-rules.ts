import { type Rule } from '../registry/rules';
import { type ZRuntimePlugin } from '../types';

export const customRulesPlugin: ZRuntimePlugin = {
  name: 'custom-rules',
  onRulesLoad: (defaultRules: Rule[]) => {
    const customRules = (window as any).zRuntime?.customRules || [];

    if (!Array.isArray(customRules)) {
      console.warn('[zRuntime] zRuntime.customRules must be an array. Ignoring custom rules.');

      return defaultRules;
    }

    const validatedCustomRules = customRules.filter((rule: any) => {
      if (!rule.selector || typeof rule.selector !== 'string') {
        return false;
      }

      if (!rule.properties) {
        return false;
      }

      if (!rule.arbitrary && (!rule.values || !Array.isArray(rule.values))) {
        return false;
      }

      return true;
    });

    const merged = [...defaultRules];

    validatedCustomRules.forEach((customRule: Rule) => {
      const existingIndex = merged.findIndex(r => r.selector === customRule.selector);

      if (existingIndex !== -1) {
        merged[existingIndex] = customRule;
      } else {
        merged.push(customRule);
      }
    });

    return merged;
  },
};
