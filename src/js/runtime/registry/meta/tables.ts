export default {
  text: 'Tables',
  items: [
    {
      type: 'cc',
      name: 'border-collapse',
      description: 'Sets border-collapse: collapse. Adjacent cell borders merge into one.',
      keywords: ['table', 'border', 'collapse', 'merge', 'cell'],
    },
    {
      type: 'cc',
      name: 'border-separate',
      description: 'Sets border-collapse: separate. Each cell maintains its own border.',
      keywords: ['table', 'border', 'separate', 'cell'],
    },
    {
      type: 'vd',
      name: 'border-spacing',
      accepts: 'scaled',
      description:
        'Sets spacing between separated table cell borders via --border-spacing. Requires border-separate. Scaled.',
      keywords: ['table', 'border', 'spacing', 'cell', 'gap'],
    },
    {
      type: 'cc',
      name: 'table-auto',
      description: 'Sets table-layout: auto. Table adapts column widths to content.',
      keywords: ['table', 'layout', 'auto', 'content'],
    },
    {
      type: 'cc',
      name: 'table-fixed',
      description: 'Sets table-layout: fixed. Table respects explicit column widths.',
      keywords: ['table', 'layout', 'fixed', 'width', 'predictable'],
    },
    {
      type: 'cc',
      name: 'caption-top',
      description: 'Sets caption-side: top. Places the table caption above the table.',
      keywords: ['table', 'caption', 'top', 'label'],
    },
    {
      type: 'cc',
      name: 'caption-bottom',
      description: 'Sets caption-side: bottom. Places the table caption below the table.',
      keywords: ['table', 'caption', 'bottom', 'label'],
    },

    {
      type: 'vd',
      name: '[border-spacing]',
      description: 'Applies raw --border-spacing directly to spacing between table cell borders.',
      keywords: ['table', 'border-spacing', 'cell-gap', 'cellspacing', 'raw'],
    },
    {
      type: 'vd',
      name: 'border-spacing-x',
      accepts: 'numeric',
      description:
        'Sets horizontal table cell spacing via --border-spacing-x. Scaled by spacing unit. Use [border-spacing-x] for raw values.',
      keywords: ['table', 'border-spacing', 'x', 'cell-gap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[border-spacing-x]',
      description: 'Applies raw --border-spacing-x directly to horizontal table cell spacing.',
      keywords: ['table', 'border-spacing', 'x', 'cell-gap', 'raw'],
    },
    {
      type: 'vd',
      name: 'border-spacing-y',
      accepts: 'numeric',
      description:
        'Sets vertical table cell spacing via --border-spacing-y. Scaled by spacing unit. Use [border-spacing-y] for raw values.',
      keywords: ['table', 'border-spacing', 'y', 'cell-gap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[border-spacing-y]',
      description: 'Applies raw --border-spacing-y directly to vertical table cell spacing.',
      keywords: ['table', 'border-spacing', 'y', 'cell-gap', 'raw'],
    },
  ],
};
