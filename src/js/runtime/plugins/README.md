# zRuntime Plugin Development Guide

`zRuntime` is built on a hook-based Core + Plugin architecture. The core engine is responsible for orchestration, caching, and DOM injection, while plugins handle the actual data extraction, rule modification, and lifecycle events.

This document outlines the plugin interface, the exact execution lifecycle, and provides context for humans and AI agents building new plugins.

## The Plugin Interface

All plugins must implement the `ZRuntimePlugin` interface:

```typescript
import { type Rule } from './registry/rules';

export interface ZRuntimePlugin {
  name: string; // Unique identifier for the plugin
  onInit?: (core: any) => void;
  onRulesLoad?: (rules: Rule[]) => Rule[];
  onElementScan?: (element: Element, rules: Rule[]) => ParsedClass[];
  onAdditionalClasses?: () => ParsedClass[];
  onBeforeInject?: (generatedCss: GeneratedCSS) => GeneratedCSS;
  onAfterInject?: () => void;
}
```

## Lifecycle & Hooks Explained

When `zRuntime.generate()` is called, the core executes hooks in the following exact order:

### 1. `onInit(core)`
*   **When it runs:** Immediately when the plugin is registered via `.use(plugin)`, before anything else happens.
*   **Purpose:** Initializing global state, dispatching initial `CustomEvent`s, setting up external observers, or injecting early hardcoded HTML/CSS (like CLS guards).
*   **Returns:** `void`

### 2. `onRulesLoad(rules)`
*   **When it runs:** At the very start of the `generate()` cycle.
*   **Purpose:** To add, modify, or remove CSS generating rules. Useful for merging user-defined configurations (e.g., custom Tailwind-like configurations).
*   **Arguments:** The current array of `Rule` objects.
*   **Returns:** A modified or newly constructed array of `Rule` objects.

### 3. `onElementScan(element, rules)`
*   **When it runs:** Loops over every single DOM element that possesses a `class` attribute.
*   **Purpose:** Extracting strings from the DOM and parsing them into `ParsedClass` objects that the compiler can understand.
*   **Arguments:** 
    *   `element`: The current HTML DOM element.
    *   `rules`: The array of available CSS rules (in case your plugin needs to validate existence).
*   **Returns:** An array of `ParsedClass` objects. (Return an empty array `[]` if no classes apply to this plugin).

### 4. `onAdditionalClasses()`
*   **When it runs:** After the DOM scan is complete.
*   **Purpose:** Injecting classes that *are not* currently in the DOM but need to be compiled anyway (e.g., Safelists, dynamic classes for components that haven't rendered yet).
*   **Returns:** An array of `ParsedClass` objects.

### 5. `onBeforeInject(generatedCss)`
*   **When it runs:** After the compiler has converted all `ParsedClass` objects into CSS strings, but before they are wrapped in `@layer` blocks and injected into the `<style>` tag.
*   **Purpose:** Post-processing the generated CSS. You can minify it, prefix it, or add manual fallbacks here.
*   **Arguments:** A `GeneratedCSS` object containing `components`, `styles`, and `utilities` layers.
*   **Returns:** The mutated or brand new `GeneratedCSS` object.

### 6. `onAfterInject()`
*   **When it runs:** After the final compiled CSS string has been inserted into the `<style id="z-interactive-styles">` tag.
*   **Purpose:** Cleanup, swapping layout-shift prevention classes (`z-not-ready` -> `z-runtime-ready`), or emitting `z-runtime:ready` events.
*   **Returns:** `void`

## Core Data Structures

When building a plugin, you will frequently interact with these types:

**ParsedClass**

This is what the compiler uses to build a CSS rule. If your plugin parses DOM attributes, it must output this.

```typescript
export interface ParsedClass {
  baseClass: string; // The core rule name (e.g., 'bg-red')
  fullClass: string; // The exact string found in the DOM
  state: string;     // Pseudo-states (e.g., ':hover', '::before')
  prefix: string | null; // Breakpoints (e.g., 'md', 'lg')
  isDark: boolean;   // True if prefixed with 'dark:'
}
```

**GeneratedCSS**

```typescript
export interface GeneratedCssLayer {
  base: string[];
  media: Record<string, string[]>; // Keyed by breakpoint size
}

export interface GeneratedCSS {
  components: GeneratedCssLayer;
  styles: GeneratedCssLayer;
  utilities: GeneratedCssLayer;
}
```

## Example: AI Prompt for Generating a New Plugin

If you want an AI to create a new plugin, provide it with this markdown file and use a prompt like this:

> **System:** "You are an expert TypeScript developer. Refer to the zRuntime Plugin Development Guide provided above."
> **Prompt:** "Write a zRuntime plugin named `data-theme-extractor`. It should hook into `onElementScan`, look for elements with a `data-theme` attribute, and if found, push a `ParsedClass` simulating a dark mode class (e.g., if `data-theme="dark"`, force `isDark: true` for the classes on that element). Keep it strongly typed."

## Plugin Blueprint Example

Here is a barebones template for a new plugin:

```typescript
import { type Rule } from '../registry/rules';
import { type ParsedClass } from '../parsers';
import { type ZRuntimePlugin, type Rule } from '../types';
// Import any shared parsers needed:
// import { parseClassName } from '../parsers';

export const myCustomPlugin: ZRuntimePlugin = {
  name: 'my-custom-plugin',
  
  onInit: (core) => {
    // Setup logic
  },

  onElementScan: (element: Element, rules: Rule[]): ParsedClass[] => {
    const extracted: ParsedClass[] = [];
    
    // Check if element meets plugin criteria
    if (element.hasAttribute('data-custom')) {
       // logic to push to extracted array
    }
    
    return extracted;
  }
};
```