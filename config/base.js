import { minifyHTMLLiterals } from 'minify-html-literals';

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

export default {
  rollupOptions: {
    external: [
      'lit',
      'lit/decorators.js',
      'lit/directives/repeat.js',
      'lit/directives/unsafe-html.js',
      'lit/directives/class-map.js',
      'lit/directives/if-defined.js',
      '@floating-ui/dom',
      '$js/shared/base',
      '$js/hwc/hwc',
      '$js/controllers/controller',
      '$js/hwc/mixins/input',
      '$js/hwc/mixins/dropdown',
      '$js/shared/helpers/common',
      '$js/shared/helpers/options',
    ],
    output: {
      globals: {
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
        lucide: 'zLucide',
        apexcharts: 'zApexCharts',
      },
    },
  },
};
