import { type ZRuntimeCore, type ZRuntimePlugin } from '../main';
import { type Rule } from '../registry/rules';

export const customRulesPlugin: ZRuntimePlugin = {
  name: 'custom-rules',

  onRulesLoad: (defaultRules: Rule[], core: ZRuntimeCore) => {
    const customRules = (window as any).zRuntime?.customRules || [];

    if (!Array.isArray(customRules)) {
      console.warn('[zRuntime] zRuntime.customRules must be an array. Ignoring custom rules.');

      return defaultRules;
    }

    if (customRules.length === 0) {
      return defaultRules;
    }

    const ruleMap = new Map<string, Rule>();

    for (const rule of defaultRules) {
      ruleMap.set(rule.selector, rule);
    }

    for (const rule of customRules) {
      const isValid =
        rule &&
        typeof rule.selector === 'string' &&
        rule.selector.length > 0 &&
        Boolean(rule.properties) &&
        (rule.arbitrary || (Array.isArray(rule.values) && rule.values.length > 0));

      if (!isValid) {
        core.warn('custom-rules', `Skipped invalid custom rule: ${JSON.stringify(rule)}`);
        continue;
      }

      ruleMap.set(rule.selector, rule);
    }

    return Array.from(ruleMap.values());
  },
};
