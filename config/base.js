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
      '$hwc/components/shared/base',
      '$hwc/components/shared/input',
      '$hwc/components/shared/dropdown',
      '$hwc/helpers/options',
    ],
    output: {
      globals: {
        lit: 'zLit',
        'lit/decorators.js': 'zLitDecorators',
        'lit/directives/repeat.js': 'zLitRepeat',
        'lit/directives/unsafe-html.js': 'zLitUnsafeHTML',
        'lit/directives/class-map.js': 'zLitClassMap',
        '$hwc/components/shared/base': 'zBase',
        '$hwc/components/shared/input': 'zInput',
        '$hwc/components/shared/dropdown': 'zDropdown',
        '$hwc/helpers/options': 'zOptions',
        lucide: 'zLucide',
        apexcharts: 'zApexCharts',
      },
    },
  },
};
