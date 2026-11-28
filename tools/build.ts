import { existsSync, unlinkSync } from 'node:fs';
import { build } from 'vite';
import { BUNDLES, createViteConfig } from '../config/base.js';

const LEGACY_DIST_FILES = [
  'dist/js/components.iife.js',
  'dist/js/icon.iife.js',
  'dist/js/chart.iife.js',
  'dist/js/rte.iife.js',
];

function selectBundles(args: string[]) {
  if (args.length === 0) {
    return BUNDLES;
  }

  const wanted = new Set(args);

  return BUNDLES.filter(b => {
    if (wanted.has(b.key)) {
      return true;
    }

    if (wanted.has('packs') && b.tier === 'pack') {
      return true;
    }

    return false;
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const targets = selectBundles(args);

  if (targets.length === 0) {
    console.error(`Unknown build target(s): ${args.join(', ')}`);
    process.exitCode = 1;

    return;
  }

  for (const bundle of targets) {
    await build(createViteConfig(bundle));
  }

  if (args.length === 0) {
    for (const stalePath of LEGACY_DIST_FILES) {
      if (existsSync(stalePath)) {
        unlinkSync(stalePath);
      }
    }
  }
}

void main();
