import { ZRuntimeCore } from './core';
import { rules as defaultRules } from './registry/rules';

// Plugins
import { clsPreventionPlugin } from './plugins/cls-prevention';
import { customRulesPlugin } from './plugins/custom-rules';
import { inlineVarsPlugin } from './plugins/inline-vars';
import { domExtractorPlugin } from './plugins/dom-extractor';
import { safelistPlugin } from './plugins/safelist';
import { debuggerPlugin } from './plugins/debugger';
import { arbitraryPropertiesPlugin } from './plugins/arbitrary-properties';

if (typeof window !== 'undefined') {
  (window as any).zRuntime = (window as any).zRuntime || {};
}

// Chain the new debuggerPlugin
const runtime = new ZRuntimeCore(defaultRules)
  .use(clsPreventionPlugin)
  .use(customRulesPlugin)
  .use(inlineVarsPlugin)
  .use(domExtractorPlugin)
  .use(safelistPlugin)
  .use(debuggerPlugin)
  .use(arbitraryPropertiesPlugin);

function init(): void {
  const customRulesCount = ((window as any).zRuntime?.customRules || []).length;

  if (customRulesCount > 0) {
    console.info(`[zRuntime] Loaded ${customRulesCount} custom rule(s)`);
  }

  // The generate() call will automatically trigger the debugger
  // via the onAfterInject hook if debug is enabled.
  runtime.generate();
}

if (typeof window !== 'undefined') {
  Object.assign((window as any).zRuntime, {
    refresh: () => runtime.refresh(),
    regenerate: () => runtime.generate(),
    getCache: () => runtime.getCache(),
    getRules: () => runtime.getRules(),
    _core: runtime,
    _initialized: true,
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export default typeof window !== 'undefined' ? (window as any).zRuntime : {};
