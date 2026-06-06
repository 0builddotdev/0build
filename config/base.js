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
    ],
    output: {
      globals: {
        lit: 'zLit',
        'lit/decorators.js': 'zLitDecorators',
        'lit/directives/repeat.js': 'zLitRepeat',
        'lit/directives/unsafe-html.js': 'zLitUnsafeHTML',
        lucide: 'zLucide',
        apexcharts: 'zApexCharts',
      },
    },
  },
};
