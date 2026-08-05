# Registry

**Current version:** `0.5.1`

This directory serves as the core definitions dictionary for the **0build** family of products. It provides the foundational design tokens, CSS generation rules, and component schemas used across the ecosystem.

> ⚠️ **IMPORTANT: DO NOT UPDATE THESE FILES DIRECTLY** ⚠️
>
> To maintain a single source of truth across all products, modifications should **never** be made locally in this repository.
>
> 1. Make your updates in the main [`0builddotdev/0build`](https://github.com/0builddotdev/0build) repository.
> 2. Copy and paste the updated files into this directory.

---

## 📁 File Manifest

### `common.ts`

The base design system configuration. It includes the registry of static design tokens such as:

* Colors and intensities
* Responsive breakpoints
* Other foundational theme variables

### `rules.ts`

The CSS generation engine's blueprint. This file exports a massive configuration object containing all CSS rules, divided into `styles` and `utilities` layers. It is heavily utilized for runtime (on-the-fly) CSS generation and IDE intellisense.

It also exports two derived sets used for quick validation and matching:

* `cc` **(Constant Classes):** Extracted from the `utilities` layer (e.g., static classes like `content-center`).
* `vd` **(Value-Driven Classes):** Extracted from the `styles` layer, automatically mapped with their `dark:` variants.

### `components.ts`

A comprehensive dictionary of all available 0build UI components mapped to their specific CSS variables. This is primarily used to power IDE Intellisense, auto-completion, and developer tooling across products.

**Schema Example:**

```typescript
export interface Component {
    selector: string;
    variables: string[];
}

// Example entry:
export const components: Component[] = [
    {
        selector: '.z-badge',
        variables: [
            '--z-badge-bg',
            '--z-badge-bg-o',
            '--z-badge-color',
            '--z-badge-color-o',
            '--z-badge-border',
            '--z-badge-border-o'
        ]
    }
];

```