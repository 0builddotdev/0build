/** @type {import("prettier").Config} */
export default {
  singleQuote: true,
  arrowParens: 'avoid',
  trailingComma: 'all',
  printWidth: 100,
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-curly'],
  importOrder: ['^lit(/.*)?$', '<THIRD_PARTY_MODULES>', '^[./]'],
};
