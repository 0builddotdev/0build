import { fileURLToPath } from 'node:url';
import { minifyHTMLLiterals } from 'minify-html-literals';

const SRC_JS_DIR = fileURLToPath(new URL('../src/js', import.meta.url));

export function minifyHtmlLiteralsPlugin() {
  return {
    name: 'minify-html-literals',
    transform(code, id) {
      if (!/\.(ts|js)$/.test(id) || id.includes('node_modules')) {
        return null;
      }
      const result = minifyHTMLLiterals(code, { fileName: id });

      return result ? { code: result.code, map: result.map } : null;
    },
  };
}

export const CORE_GLOBALS = {
  lit: 'zLit',
  'lit/decorators.js': 'zLitDecorators',
  'lit/directives/repeat.js': 'zLitRepeat',
  'lit/directives/unsafe-html.js': 'zLitUnsafeHTML',
  'lit/directives/class-map.js': 'zLitClassMap',
  'lit/directives/if-defined.js': 'zLitIfDefined',
  '@floating-ui/dom': 'zFloatingUI',
  '$js/shared/base': 'zBase',
  '$js/shared/helpers/common': 'zCommon',
  '$js/hwc/hwc': 'zHwc',
  '$js/controllers/controller': 'zController',
  '$js/hwc/mixins/input': 'zInput',
  '$js/hwc/mixins/dropdown': 'zDropdown',
  '$js/shared/helpers/options': 'zOptions',
};

export const ESSENTIALS_GLOBALS = {
  '$js/hwc/mixins/dialog': 'zDialog',
  '$js/shared/helpers/animation': 'zAnimation',
  '$js/shared/helpers/css': 'zCss',
  '$js/shared/helpers/gesture': 'zGesture',
  '$js/shared/helpers/svg': 'zSvg',
};

export const VENDOR_GLOBALS = {
  lucide: 'zLucide',
  apexcharts: 'zApexCharts',
};

export const CORE_EXTERNALS = Object.keys(CORE_GLOBALS);
export const PACK_EXTERNALS = [...CORE_EXTERNALS, ...Object.keys(ESSENTIALS_GLOBALS)];

export const BUNDLES = [
  {
    key: 'core',
    entry: 'src/js/core.ts',
    globalName: '__Z_CORE__',
    fileName: 'js/core',
    diskPath: 'dist/js/core.iife.js',
    tier: 'root',
  },
  {
    key: 'essentials',
    entry: 'src/js/essentials.ts',
    globalName: '__Z_ESSENTIALS__',
    fileName: 'js/essentials',
    diskPath: 'dist/js/essentials.iife.js',
    tier: 'essentials',
  },
  {
    key: 'toast',
    entry: 'src/js/pack/toast.ts',
    globalName: '__Z_PACK_TOAST__',
    fileName: 'js/pack/toast',
    diskPath: 'dist/js/pack/toast.iife.js',
    tier: 'pack',
  },
  {
    key: 'select',
    entry: 'src/js/pack/select.ts',
    globalName: '__Z_PACK_SELECT__',
    fileName: 'js/pack/select',
    diskPath: 'dist/js/pack/select.iife.js',
    tier: 'pack',
  },
  {
    key: 'cmd',
    entry: 'src/js/pack/cmd.ts',
    globalName: '__Z_PACK_CMD__',
    fileName: 'js/pack/cmd',
    diskPath: 'dist/js/pack/cmd.iife.js',
    tier: 'pack',
  },
  {
    key: 'date',
    entry: 'src/js/pack/date.ts',
    globalName: '__Z_PACK_DATE__',
    fileName: 'js/pack/date',
    diskPath: 'dist/js/pack/date.iife.js',
    tier: 'pack',
  },
  {
    key: 'inputs',
    entry: 'src/js/pack/inputs.ts',
    globalName: '__Z_PACK_INPUTS__',
    fileName: 'js/pack/inputs',
    diskPath: 'dist/js/pack/inputs.iife.js',
    tier: 'pack',
  },
  {
    key: 'carousel',
    entry: 'src/js/pack/carousel.ts',
    globalName: '__Z_PACK_CAROUSEL__',
    fileName: 'js/pack/carousel',
    diskPath: 'dist/js/pack/carousel.iife.js',
    tier: 'pack',
  },
  {
    key: 'lightbox',
    entry: 'src/js/pack/lightbox.ts',
    globalName: '__Z_PACK_LIGHTBOX__',
    fileName: 'js/pack/lightbox',
    diskPath: 'dist/js/pack/lightbox.iife.js',
    tier: 'pack',
  },
  {
    key: 'scroll',
    entry: 'src/js/pack/scroll.ts',
    globalName: '__Z_PACK_SCROLL__',
    fileName: 'js/pack/scroll',
    diskPath: 'dist/js/pack/scroll.iife.js',
    tier: 'pack',
  },
  {
    key: 'lists',
    entry: 'src/js/pack/lists.ts',
    globalName: '__Z_PACK_LISTS__',
    fileName: 'js/pack/lists',
    diskPath: 'dist/js/pack/lists.iife.js',
    tier: 'pack',
  },
  {
    key: 'icon',
    entry: 'src/js/pack/icon.ts',
    globalName: '__Z_PACK_ICON__',
    fileName: 'js/pack/icon',
    diskPath: 'dist/js/pack/icon.iife.js',
    tier: 'pack',
  },
  {
    key: 'chart',
    entry: 'src/js/pack/chart.ts',
    globalName: '__Z_PACK_CHART__',
    fileName: 'js/pack/chart',
    diskPath: 'dist/js/pack/chart.iife.js',
    tier: 'pack',
  },
  {
    key: 'rte',
    entry: 'src/js/pack/rte.ts',
    globalName: '__Z_PACK_RTE__',
    fileName: 'js/pack/rte',
    diskPath: 'dist/js/pack/rte.iife.js',
    tier: 'pack',
  },
  {
    key: 'runtime',
    entry: 'src/js/runtime/main.ts',
    globalName: '__Z_RUNTIME__',
    fileName: 'js/runtime',
    diskPath: 'dist/js/runtime.iife.js',
    tier: 'runtime',
  },
];

export function createViteConfig(bundle, overrides = {}) {
  const externals =
    bundle.tier === 'essentials'
      ? CORE_EXTERNALS
      : bundle.tier === 'pack'
        ? PACK_EXTERNALS
        : [];
  const externalSet = new Set(externals);
  const globals =
    bundle.tier === 'essentials'
      ? CORE_GLOBALS
      : bundle.tier === 'pack'
        ? { ...CORE_GLOBALS, ...ESSENTIALS_GLOBALS, ...VENDOR_GLOBALS }
        : {};

  const plugins = [];

  if (bundle.tier !== 'runtime') {
    plugins.push(minifyHtmlLiteralsPlugin());
  }

  if (externalSet.size > 0) {
    plugins.push({
      name: 'z-externals',
      enforce: 'pre',
      resolveId(id) {
        return externalSet.has(id) ? { id, external: true } : null;
      },
    });
  }

  return {
    configFile: false,
    plugins,
    resolve: {
      alias: {
        $js: SRC_JS_DIR,
      },
    },
    build: {
      emptyOutDir: false,
      ...(externalSet.size > 0
        ? {
            rollupOptions: {
              external: id => externalSet.has(id),
              output: { globals },
            },
          }
        : {}),
      lib: {
        entry: bundle.entry,
        name: bundle.globalName,
        fileName: bundle.fileName,
        formats: ['iife'],
      },
      ...overrides.build,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    esbuild: {
      legalComments: 'none',
    },
    ...overrides.top,
  };
}
