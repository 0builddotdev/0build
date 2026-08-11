export default {
  text: 'Layout',
  items: [
    {
      type: 'vd',
      name: 'accent',
      accepts: 'color-mix',
      description:
        'Sets the accent color via --accent. Used for highlights, focus rings, and branded tints.',
      keywords: ['highlight', 'brand', 'tint', 'focus', 'color'],
    },
    {
      type: 'vd',
      name: 'accent/o',
      accepts: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      description: 'Sets accent color + opacity via --accent and --accent-o independently.',
      keywords: ['highlight', 'brand', 'tint', 'focus', 'color', 'transparent', 'alpha'],
    },
    {
      type: 'vd',
      name: 'aspect',
      accepts: 'ratio',
      description: 'Sets aspect-ratio via --aspect. E.g. 16/9, 4/3.',
      keywords: ['aspect', 'ratio', 'proportion', 'responsive'],
    },
    {
      type: 'cc',
      name: 'aspect-square',
      description: 'Sets aspect-ratio: 1 / 1.',
      keywords: ['aspect', 'square', 'ratio', 'proportion'],
    },
    {
      type: 'co',
      name: 'aspect-video',
      description: 'Sets aspect-ratio: 16 / 9.',
      keywords: ['aspect', 'video', 'widescreen', 'ratio'],
    },
    {
      type: 'vd',
      name: 'columns',
      accepts: 'integer',
      description: 'Sets the number of equal-width columns via --columns.',
      keywords: ['columns', 'multi-column', 'layout', 'count'],
    },
    {
      type: 'cc',
      name: 'static',
      description: 'Sets position: static.',
      keywords: ['position', 'layout', 'static'],
    },
    {
      type: 'cc',
      name: 'relative',
      description: 'Sets position: relative.',
      keywords: ['position', 'layout', 'relative'],
    },
    {
      type: 'cc',
      name: 'absolute',
      description: 'Sets position: absolute.',
      keywords: ['position', 'layout', 'absolute', 'offset'],
    },
    {
      type: 'cc',
      name: 'fixed',
      description: 'Sets position: fixed.',
      keywords: ['position', 'layout', 'fixed', 'viewport'],
    },
    {
      type: 'cc',
      name: 'sticky',
      description: 'Sets position: sticky.',
      keywords: ['position', 'layout', 'sticky', 'scroll'],
    },
    {
      type: 'vd',
      name: 'top',
      accepts: 'scaled',
      description: 'Sets top offset via --top. Scaled by spacing unit. Use [top] for raw values.',
      keywords: ['position', 'top', 'offset', 'placement'],
    },
    {
      type: 'vd',
      name: 'right',
      accepts: 'scaled',
      description:
        'Sets right offset via --right. Scaled by spacing unit. Use [right] for raw values.',
      keywords: ['position', 'right', 'offset', 'placement'],
    },
    {
      type: 'vd',
      name: 'bottom',
      accepts: 'scaled',
      description:
        'Sets bottom offset via --bottom. Scaled by spacing unit. Use [bottom] for raw values.',
      keywords: ['position', 'bottom', 'offset', 'placement'],
    },
    {
      type: 'vd',
      name: 'left',
      accepts: 'scaled',
      description:
        'Sets left offset via --left. Scaled by spacing unit. Use [left] for raw values.',
      keywords: ['position', 'left', 'offset', 'placement'],
    },
    {
      type: 'vd',
      name: 'inset',
      accepts: 'scaled',
      description:
        'Sets all side offsets via --inset. Scaled by spacing unit. Use [inset] for raw values.',
      keywords: ['position', 'inset', 'all-sides', 'offset', 'placement'],
    },
    {
      type: 'vd',
      name: 'z',
      accepts: 'integer',
      description: 'Sets z-index via --z. Raw integer value, not scaled.',
      keywords: ['z-index', 'stacking', 'layer', 'order', 'depth'],
    },
    {
      type: 'cc',
      name: 'z-auto',
      description: 'Sets z-index: auto.',
      keywords: ['z-index', 'stacking', 'layer', 'auto'],
    },
    {
      type: 'cc',
      name: 'overflow-hidden',
      description: 'Sets overflow: hidden. Clips content that exceeds bounds.',
      keywords: ['overflow', 'clip', 'hidden', 'contain'],
    },
    {
      type: 'cc',
      name: 'overflow-auto',
      description: 'Sets overflow: auto. Adds scrollbars only when needed.',
      keywords: ['overflow', 'scroll', 'auto', 'contain'],
    },
    {
      type: 'cc',
      name: 'overflow-scroll',
      description: 'Sets overflow: scroll. Always shows scrollbars.',
      keywords: ['overflow', 'scroll', 'contain'],
    },
    {
      type: 'cc',
      name: 'overflow-visible',
      description: 'Sets overflow: visible. Content can exceed the element bounds.',
      keywords: ['overflow', 'visible', 'leak'],
    },
    {
      type: 'cc',
      name: 'overflow-x-hidden',
      description: 'Sets overflow-x: hidden. Clips only horizontal overflow.',
      keywords: ['overflow', 'horizontal', 'clip', 'hidden'],
    },
    {
      type: 'cc',
      name: 'overflow-y-auto',
      description: 'Sets overflow-y: auto. Vertical scroll when content overflows.',
      keywords: ['overflow', 'vertical', 'scroll', 'auto'],
    },
    {
      type: 'cc',
      name: 'visible',
      description: 'Sets visibility: visible.',
      keywords: ['visibility', 'show', 'visible'],
    },
    {
      type: 'cc',
      name: 'invisible',
      description: 'Sets visibility: hidden. Hides the element while preserving its space.',
      keywords: ['visibility', 'hide', 'invisible', 'hidden'],
    },
    {
      type: 'cc',
      name: 'isolate',
      description: 'Sets isolation: isolate. Creates a new stacking context.',
      keywords: ['isolation', 'stacking', 'context', 'z-index', 'blend'],
    },
    {
      type: 'cc',
      name: 'float-left',
      description: 'Sets float: left.',
      keywords: ['float', 'left', 'layout', 'wrap'],
    },
    {
      type: 'cc',
      name: 'float-right',
      description: 'Sets float: right.',
      keywords: ['float', 'right', 'layout', 'wrap'],
    },
    {
      type: 'cc',
      name: 'float-none',
      description: 'Sets float: none. Removes float.',
      keywords: ['float', 'none', 'clear', 'layout'],
    },
    {
      type: 'cc',
      name: 'clear-both',
      description: 'Sets clear: both. Clears floating elements on both sides.',
      keywords: ['clear', 'float', 'both', 'layout'],
    },
    {
      type: 'cc',
      name: 'object-cover',
      description: 'Sets object-fit: cover. Image fills container, cropping if needed.',
      keywords: ['object-fit', 'cover', 'image', 'crop', 'fill'],
    },
    {
      type: 'cc',
      name: 'object-contain',
      description: 'Sets object-fit: contain. Image fits inside container, letterboxed.',
      keywords: ['object-fit', 'contain', 'image', 'fit', 'letterbox'],
    },
    {
      type: 'vd',
      name: 'object-position',
      accepts: 'raw',
      description: 'Sets object-position via --object-position. E.g. 50% 50%.',
      keywords: ['object-position', 'image', 'focal-point', 'align'],
    },

    {
      type: 'cc',
      name: 'col-start-auto',
      description:
        'Sets grid-column-start to auto, letting the grid placement algorithm decide the column start.',
      keywords: ['grid', 'column', 'start', 'auto', 'placement'],
    },
    {
      type: 'cc',
      name: 'col-end-auto',
      description:
        'Sets grid-column-end to auto, letting the grid placement algorithm decide the column end.',
      keywords: ['grid', 'column', 'end', 'auto', 'placement'],
    },
    {
      type: 'cc',
      name: 'row-auto',
      description:
        'Sets grid-row to auto, letting the grid placement algorithm decide row placement.',
      keywords: ['grid', 'row', 'auto', 'placement'],
    },
    {
      type: 'cc',
      name: 'row-start-auto',
      description:
        'Sets grid-row-start to auto, letting the grid placement algorithm decide the row start.',
      keywords: ['grid', 'row', 'start', 'auto', 'placement'],
    },
    {
      type: 'cc',
      name: 'row-end-auto',
      description:
        'Sets grid-row-end to auto, letting the grid placement algorithm decide the row end.',
      keywords: ['grid', 'row', 'end', 'auto', 'placement'],
    },
    {
      type: 'cc',
      name: 'grid-rows-none',
      description: 'Removes explicit grid row tracks by setting grid-template-rows to none.',
      keywords: ['grid', 'rows', 'template', 'none'],
    },
    {
      type: 'cc',
      name: 'grid-rows-subgrid',
      description:
        'Sets grid-template-rows to subgrid, inheriting row tracks from the parent grid.',
      keywords: ['grid', 'rows', 'template', 'subgrid', 'nested'],
    },
    {
      type: 'cc',
      name: 'top-full',
      description: 'Sets top offset to 100% of the containing block.',
      keywords: ['position', 'top', 'offset', 'full'],
    },
    {
      type: 'cc',
      name: 'top-auto',
      description: 'Sets top offset to auto, removing explicit top positioning.',
      keywords: ['position', 'top', 'offset', 'auto'],
    },
    {
      type: 'cc',
      name: 'right-full',
      description: 'Sets right offset to 100% of the containing block.',
      keywords: ['position', 'right', 'offset', 'full'],
    },
    {
      type: 'cc',
      name: 'right-auto',
      description: 'Sets right offset to auto, removing explicit right positioning.',
      keywords: ['position', 'right', 'offset', 'auto'],
    },
    {
      type: 'cc',
      name: 'bottom-full',
      description: 'Sets bottom offset to 100% of the containing block.',
      keywords: ['position', 'bottom', 'offset', 'full'],
    },
    {
      type: 'cc',
      name: 'bottom-auto',
      description: 'Sets bottom offset to auto, removing explicit bottom positioning.',
      keywords: ['position', 'bottom', 'offset', 'auto'],
    },
    {
      type: 'cc',
      name: 'left-full',
      description: 'Sets left offset to 100% of the containing block.',
      keywords: ['position', 'left', 'offset', 'full'],
    },
    {
      type: 'cc',
      name: 'left-auto',
      description: 'Sets left offset to auto, removing explicit left positioning.',
      keywords: ['position', 'left', 'offset', 'auto'],
    },
    {
      type: 'cc',
      name: 'inset-full',
      description:
        'Sets all inset offsets (top/right/bottom/left) to 100% of the containing block.',
      keywords: ['position', 'inset', 'offset', 'full'],
    },
    {
      type: 'cc',
      name: 'inset-auto',
      description: 'Sets all inset offsets to auto, removing explicit positioning on every side.',
      keywords: ['position', 'inset', 'offset', 'auto'],
    },
    {
      type: 'cc',
      name: 'inset-x-full',
      description: 'Sets inset-inline (left/right) offsets to 100% of the containing block.',
      keywords: ['position', 'inset', 'inline', 'horizontal', 'full'],
    },
    {
      type: 'cc',
      name: 'inset-y-full',
      description: 'Sets inset-block (top/bottom) offsets to 100% of the containing block.',
      keywords: ['position', 'inset', 'block', 'vertical', 'full'],
    },
    {
      type: 'cc',
      name: 'start-full',
      description: 'Sets logical inline-start offset to 100%, respecting writing direction.',
      keywords: ['position', 'inset', 'start', 'logical', 'rtl', 'full'],
    },
    {
      type: 'cc',
      name: 'end-full',
      description: 'Sets logical inline-end offset to 100%, respecting writing direction.',
      keywords: ['position', 'inset', 'end', 'logical', 'rtl', 'full'],
    },
    {
      type: 'cc',
      name: 'isolation-auto',
      description: 'Sets isolation to auto, removing forced creation of a new stacking context.',
      keywords: ['isolation', 'stacking', 'context', 'auto'],
    },

    {
      type: 'cc',
      name: 'box-decoration-slice',
      description:
        'Sets box decoration break to slice, applying backgrounds and borders across the whole element as if it were not fragmented.',
      keywords: ['box', 'decoration', 'break', 'slice'],
    },
    {
      type: 'cc',
      name: 'box-decoration-clone',
      description:
        'Sets box decoration break to clone, rendering backgrounds and borders for each individual fragment.',
      keywords: ['box', 'decoration', 'break', 'clone'],
    },
    {
      type: 'cc',
      name: 'box-border',
      description:
        "Sets box-sizing to border-box, including padding and borders in the element's total width and height.",
      keywords: ['box', 'sizing', 'border'],
    },
    {
      type: 'cc',
      name: 'box-content',
      description:
        "Sets box-sizing to content-box, excluding padding and borders from the element's total width and height.",
      keywords: ['box', 'sizing', 'content'],
    },
    {
      type: 'cc',
      name: 'break-after-auto',
      description: 'Allows auto page/column breaks after an element.',
      keywords: ['break', 'after', 'auto', 'page', 'column'],
    },
    {
      type: 'cc',
      name: 'break-after-avoid',
      description: 'Avoids page/column breaks after an element.',
      keywords: ['break', 'after', 'avoid', 'page', 'column'],
    },
    {
      type: 'cc',
      name: 'break-after-all',
      description: 'Forces a page/column break after an element.',
      keywords: ['break', 'after', 'all', 'force'],
    },
    {
      type: 'cc',
      name: 'break-after-avoid-page',
      description: 'Avoids page breaks after an element.',
      keywords: ['break', 'after', 'avoid', 'page'],
    },
    {
      type: 'cc',
      name: 'break-after-page',
      description: 'Forces a page break after an element.',
      keywords: ['break', 'after', 'page'],
    },
    {
      type: 'cc',
      name: 'break-after-left',
      description:
        'Forces one or two page breaks after an element so the next page is a left page.',
      keywords: ['break', 'after', 'left', 'page'],
    },
    {
      type: 'cc',
      name: 'break-after-right',
      description:
        'Forces one or two page breaks after an element so the next page is a right page.',
      keywords: ['break', 'after', 'right', 'page'],
    },
    {
      type: 'cc',
      name: 'break-after-column',
      description: 'Forces a column break after an element.',
      keywords: ['break', 'after', 'column'],
    },
    {
      type: 'cc',
      name: 'break-before-auto',
      description: 'Allows auto page/column breaks before an element.',
      keywords: ['break', 'before', 'auto', 'page', 'column'],
    },
    {
      type: 'cc',
      name: 'break-before-avoid',
      description: 'Avoids page/column breaks before an element.',
      keywords: ['break', 'before', 'avoid', 'page', 'column'],
    },
    {
      type: 'cc',
      name: 'break-before-all',
      description: 'Forces a page/column break before an element.',
      keywords: ['break', 'before', 'all', 'force'],
    },
    {
      type: 'cc',
      name: 'break-before-avoid-page',
      description: 'Avoids page breaks before an element.',
      keywords: ['break', 'before', 'avoid', 'page'],
    },
    {
      type: 'cc',
      name: 'break-before-page',
      description: 'Forces a page break before an element.',
      keywords: ['break', 'before', 'page'],
    },
    {
      type: 'cc',
      name: 'break-before-left',
      description: 'Forces one or two page breaks before an element so it appears on a left page.',
      keywords: ['break', 'before', 'left', 'page'],
    },
    {
      type: 'cc',
      name: 'break-before-right',
      description: 'Forces one or two page breaks before an element so it appears on a right page.',
      keywords: ['break', 'before', 'right', 'page'],
    },
    {
      type: 'cc',
      name: 'break-before-column',
      description: 'Forces a column break before an element.',
      keywords: ['break', 'before', 'column'],
    },
    {
      type: 'cc',
      name: 'break-inside-auto',
      description: 'Allows auto page/column breaks inside an element.',
      keywords: ['break', 'inside', 'auto', 'page', 'column'],
    },
    {
      type: 'cc',
      name: 'break-inside-avoid',
      description: 'Avoids page/column breaks inside an element.',
      keywords: ['break', 'inside', 'avoid', 'page', 'column'],
    },
    {
      type: 'cc',
      name: 'break-inside-avoid-page',
      description: 'Avoids page breaks inside an element.',
      keywords: ['break', 'inside', 'avoid', 'page'],
    },
    {
      type: 'cc',
      name: 'break-inside-avoid-column',
      description: 'Avoids column breaks inside an element.',
      keywords: ['break', 'inside', 'avoid', 'column'],
    },
    {
      type: 'cc',
      name: 'clear-start',
      description: 'Clears floated elements on the inline-start side.',
      keywords: ['clear', 'start', 'float', 'layout'],
    },
    {
      type: 'cc',
      name: 'clear-end',
      description: 'Clears floated elements on the inline-end side.',
      keywords: ['clear', 'end', 'float', 'layout'],
    },
    {
      type: 'cc',
      name: 'clear-left',
      description: 'Clears left-floated elements.',
      keywords: ['clear', 'left', 'float', 'layout'],
    },
    {
      type: 'cc',
      name: 'clear-right',
      description: 'Clears right-floated elements.',
      keywords: ['clear', 'right', 'float', 'layout'],
    },
    {
      type: 'cc',
      name: 'clear-none',
      description:
        'Removes clear rules, allowing the element to float next to other floated elements.',
      keywords: ['clear', 'none', 'float', 'layout'],
    },
    {
      type: 'co',
      name: 'columns-3xs',
      description: 'Sets a 3xs column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '3xs'],
    },
    {
      type: 'co',
      name: 'columns-2xs',
      description: 'Sets a 2xs column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '2xs'],
    },
    {
      type: 'co',
      name: 'columns-xs',
      description: 'Sets an xs column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', 'xs'],
    },
    {
      type: 'co',
      name: 'columns-sm',
      description: 'Sets a small column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', 'sm'],
    },
    {
      type: 'co',
      name: 'columns-md',
      description: 'Sets a medium column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', 'md'],
    },
    {
      type: 'co',
      name: 'columns-lg',
      description: 'Sets a large column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', 'lg'],
    },
    {
      type: 'co',
      name: 'columns-xl',
      description: 'Sets an xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', 'xl'],
    },
    {
      type: 'co',
      name: 'columns-2xl',
      description: 'Sets a 2xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '2xl'],
    },
    {
      type: 'co',
      name: 'columns-3xl',
      description: 'Sets a 3xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '3xl'],
    },
    {
      type: 'co',
      name: 'columns-4xl',
      description: 'Sets a 4xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '4xl'],
    },
    {
      type: 'co',
      name: 'columns-5xl',
      description: 'Sets a 5xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '5xl'],
    },
    {
      type: 'co',
      name: 'columns-6xl',
      description: 'Sets a 6xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '6xl'],
    },
    {
      type: 'co',
      name: 'columns-7xl',
      description: 'Sets a 7xl column width for multi-column layouts.',
      keywords: ['columns', 'layout', 'multi-column', '7xl'],
    },
    {
      type: 'cc',
      name: 'columns-auto',
      description: 'Allows column widths and counts to be determined automatically.',
      keywords: ['columns', 'layout', 'multi-column', 'auto'],
    },
    {
      type: 'cc',
      name: 'float-start',
      description: 'Floats the element to the inline-start side.',
      keywords: ['float', 'start', 'layout'],
    },
    {
      type: 'cc',
      name: 'float-end',
      description: 'Floats the element to the inline-end side.',
      keywords: ['float', 'end', 'layout'],
    },
    {
      type: 'cc',
      name: 'grid-flow-row-dense',
      description:
        'Sets grid auto-flow to row dense, filling in holes in the grid as elements appear.',
      keywords: ['grid', 'flow', 'row', 'dense', 'layout'],
    },
    {
      type: 'cc',
      name: 'grid-flow-col-dense',
      description:
        'Sets grid auto-flow to column dense, filling in holes in the grid as elements appear.',
      keywords: ['grid', 'flow', 'column', 'col', 'dense', 'layout'],
    },

    {
      type: 'cc',
      name: 'object-fill',
      description:
        "Sets object-fit to fill, stretching the element's content to fit its container.",
      keywords: ['object', 'fit', 'fill', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-none',
      description: "Sets object-fit to none, maintaining the element's original size.",
      keywords: ['object', 'fit', 'none', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-scale-down',
      description:
        'Sets object-fit to scale-down, behaving as either none or contain depending on which is smaller.',
      keywords: ['object', 'fit', 'scale', 'down', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-bottom',
      description: 'Positions the object content at the bottom of its container.',
      keywords: ['object', 'position', 'bottom', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-center',
      description: 'Positions the object content in the center of its container.',
      keywords: ['object', 'position', 'center', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-left',
      description: 'Positions the object content at the left of its container.',
      keywords: ['object', 'position', 'left', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-left-bottom',
      description: 'Positions the object content at the bottom-left of its container.',
      keywords: ['object', 'position', 'left', 'bottom', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-left-top',
      description: 'Positions the object content at the top-left of its container.',
      keywords: ['object', 'position', 'left', 'top', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-right',
      description: 'Positions the object content at the right of its container.',
      keywords: ['object', 'position', 'right', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-right-bottom',
      description: 'Positions the object content at the bottom-right of its container.',
      keywords: ['object', 'position', 'right', 'bottom', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-right-top',
      description: 'Positions the object content at the top-right of its container.',
      keywords: ['object', 'position', 'right', 'top', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'object-top',
      description: 'Positions the object content at the top of its container.',
      keywords: ['object', 'position', 'top', 'image', 'video'],
    },
    {
      type: 'cc',
      name: 'overflow-clip',
      description:
        "Clips overflow content extending beyond the element's box, hiding it without enabling scrolling.",
      keywords: ['overflow', 'clip', 'hide'],
    },
    {
      type: 'cc',
      name: 'overflow-x-auto',
      description: 'Adds horizontal scrolling if content overflows the element horizontally.',
      keywords: ['overflow', 'horizontal', 'x', 'auto', 'scroll'],
    },
    {
      type: 'cc',
      name: 'overflow-y-hidden',
      description: 'Hides content that overflows the element vertically.',
      keywords: ['overflow', 'vertical', 'y', 'hidden', 'hide'],
    },
    {
      type: 'cc',
      name: 'overflow-x-clip',
      description: "Clips horizontal overflow content extending beyond the element's box.",
      keywords: ['overflow', 'horizontal', 'x', 'clip'],
    },
    {
      type: 'cc',
      name: 'overflow-y-clip',
      description: "Clips vertical overflow content extending beyond the element's box.",
      keywords: ['overflow', 'vertical', 'y', 'clip'],
    },
    {
      type: 'cc',
      name: 'overflow-x-visible',
      description: 'Ensures horizontal overflow is not clipped or hidden.',
      keywords: ['overflow', 'horizontal', 'x', 'visible', 'show'],
    },
    {
      type: 'cc',
      name: 'overflow-y-visible',
      description: 'Ensures vertical overflow is not clipped or hidden.',
      keywords: ['overflow', 'vertical', 'y', 'visible', 'show'],
    },
    {
      type: 'cc',
      name: 'overflow-x-scroll',
      description: 'Forces a horizontal scrollbar whether content overflows or not.',
      keywords: ['overflow', 'horizontal', 'x', 'scroll'],
    },
    {
      type: 'cc',
      name: 'overflow-y-scroll',
      description: 'Forces a vertical scrollbar whether content overflows or not.',
      keywords: ['overflow', 'vertical', 'y', 'scroll'],
    },
    {
      type: 'cc',
      name: 'overscroll-auto',
      description: "Allows the browser's default overscroll behavior (like pull-to-refresh).",
      keywords: ['overscroll', 'behavior', 'auto', 'scroll'],
    },
    {
      type: 'cc',
      name: 'overscroll-contain',
      description:
        'Prevents scroll chaining to parent elements, but keeps local overscroll effects.',
      keywords: ['overscroll', 'behavior', 'contain', 'scroll'],
    },
    {
      type: 'cc',
      name: 'overscroll-none',
      description: 'Prevents scroll chaining and local overscroll bounce effects completely.',
      keywords: ['overscroll', 'behavior', 'none', 'scroll'],
    },
    {
      type: 'cc',
      name: 'overscroll-y-auto',
      description: 'Allows default vertical overscroll behavior.',
      keywords: ['overscroll', 'vertical', 'y', 'auto'],
    },
    {
      type: 'cc',
      name: 'overscroll-y-contain',
      description: 'Prevents vertical scroll chaining to parent elements.',
      keywords: ['overscroll', 'vertical', 'y', 'contain'],
    },
    {
      type: 'cc',
      name: 'overscroll-y-none',
      description: 'Prevents vertical scroll chaining and overscroll bounce effects.',
      keywords: ['overscroll', 'vertical', 'y', 'none'],
    },
    {
      type: 'cc',
      name: 'overscroll-x-auto',
      description: 'Allows default horizontal overscroll behavior.',
      keywords: ['overscroll', 'horizontal', 'x', 'auto'],
    },
    {
      type: 'cc',
      name: 'overscroll-x-contain',
      description: 'Prevents horizontal scroll chaining to parent elements.',
      keywords: ['overscroll', 'horizontal', 'x', 'contain'],
    },
    {
      type: 'cc',
      name: 'overscroll-x-none',
      description: 'Prevents horizontal scroll chaining and overscroll bounce effects.',
      keywords: ['overscroll', 'horizontal', 'x', 'none'],
    },

    {
      type: 'vd',
      name: '[bottom]',
      description:
        'Offsets an element from the bottom edge using raw --bottom. Best for absolute/fixed positioning.',
      keywords: ['position', 'offset', 'bottom', 'absolute', 'fixed'],
    },
    {
      type: 'vd',
      name: 'col',
      accepts: 'string',
      description:
        'Places a grid item within columns using an arbitrary grid-column expression, such as span 2.',
      keywords: ['grid', 'column', 'placement', 'span', 'layout'],
    },
    {
      type: 'vd',
      name: 'row',
      accepts: 'string',
      description:
        'Places a grid item within rows using an arbitrary grid-row expression, such as span 2.',
      keywords: ['grid', 'row', 'placement', 'span', 'layout'],
    },
    {
      type: 'vd',
      name: 'row-start',
      accepts: 'numeric',
      description: 'Sets the row line where a grid item begins.',
      keywords: ['grid', 'row', 'start', 'placement', 'layout'],
    },
    {
      type: 'vd',
      name: 'row-end',
      accepts: 'numeric',
      description: 'Sets the row line where a grid item ends.',
      keywords: ['grid', 'row', 'end', 'placement', 'layout'],
    },
    {
      type: 'vd',
      name: '[grid-cols]',
      description:
        'Defines grid column tracks using raw --grid-cols. Useful for custom grid templates.',
      keywords: ['grid', 'columns', 'template', 'tracks', 'raw'],
    },
    {
      type: 'vd',
      name: '[grid-rows]',
      description:
        'Defines grid row tracks using raw --grid-rows. Useful for custom grid templates.',
      keywords: ['grid', 'rows', 'template', 'tracks', 'raw'],
    },
    {
      type: 'vd',
      name: 'start',
      accepts: 'numeric',
      description:
        'Sets inset-inline-start via --start. Scaled by spacing unit. Use [start] for raw values.',
      keywords: ['position', 'inset', 'start', 'logical', 'spacing'],
    },
    {
      type: 'vd',
      name: 'end',
      accepts: 'numeric',
      description:
        'Sets inset-inline-end via --end. Scaled by spacing unit. Use [end] for raw values.',
      keywords: ['position', 'inset', 'end', 'logical', 'spacing'],
    },
    {
      type: 'vd',
      name: 'inset-x',
      accepts: 'numeric',
      description:
        'Sets inline-axis insets via --inset-x. Scaled by spacing unit. Use [inset-x] for raw values.',
      keywords: ['position', 'inset', 'x', 'inline', 'spacing'],
    },
    {
      type: 'vd',
      name: 'inset-y',
      accepts: 'numeric',
      description:
        'Sets block-axis insets via --inset-y. Scaled by spacing unit. Use [inset-y] for raw values.',
      keywords: ['position', 'inset', 'y', 'block', 'spacing'],
    },
    {
      type: 'vd',
      name: '[inset]',
      description:
        'Applies raw --inset to all four offsets. Shortcut for top/right/bottom/left positioning.',
      keywords: ['position', 'inset', 'offset', 'raw', 'layout'],
    },
    {
      type: 'vd',
      name: '[start]',
      description:
        'Applies raw --start directly to inset-inline-start. Use start for spacing-scaled values.',
      keywords: ['position', 'inset', 'start', 'logical', 'raw'],
    },
    {
      type: 'vd',
      name: '[end]',
      description:
        'Applies raw --end directly to inset-inline-end. Use end for spacing-scaled values.',
      keywords: ['position', 'inset', 'end', 'logical', 'raw'],
    },
    {
      type: 'vd',
      name: '[inset-x]',
      description:
        'Applies raw --inset-x directly to inline-axis insets. Use inset-x for spacing-scaled values.',
      keywords: ['position', 'inset', 'x', 'inline', 'raw'],
    },
    {
      type: 'vd',
      name: '[inset-y]',
      description:
        'Applies raw --inset-y directly to block-axis insets. Use inset-y for spacing-scaled values.',
      keywords: ['position', 'inset', 'y', 'block', 'raw'],
    },
    {
      type: 'vd',
      name: '[left]',
      description:
        'Offsets an element from the left edge using raw --left. Best for absolute/fixed positioning.',
      keywords: ['position', 'offset', 'left', 'absolute', 'fixed'],
    },

    {
      type: 'vd',
      name: '[right]',
      description:
        'Offsets an element from the right edge using raw --right. Best for absolute/fixed positioning.',
      keywords: ['position', 'offset', 'right', 'absolute', 'fixed'],
    },
    {
      type: 'vd',
      name: '[top]',
      description:
        'Offsets an element from the top edge using raw --top. Best for absolute/fixed positioning.',
      keywords: ['position', 'offset', 'top', 'absolute', 'fixed'],
    },

    {
      type: 'cc',
      name: 'auto-rows-auto',
      description: 'Sizes implicit grid rows by their natural content size.',
      keywords: ['grid', 'auto-rows', 'layout', 'auto'],
    },
    {
      type: 'cc',
      name: 'auto-rows-min',
      description: 'Sizes implicit grid rows to their minimum content size.',
      keywords: ['grid', 'auto-rows', 'min-content', 'layout'],
    },
    {
      type: 'cc',
      name: 'auto-rows-max',
      description: 'Sizes implicit grid rows to their maximum content size.',
      keywords: ['grid', 'auto-rows', 'max-content', 'layout'],
    },

    {
      type: 'cc',
      name: 'auto-rows-fr',
      description: 'Distributes implicit grid rows evenly using fractional 1fr tracks.',
      keywords: ['grid', 'auto-rows', 'fr', 'layout', 'tracks'],
    },
    {
      type: 'vd',
      name: 'auto-rows',
      accepts: 'string',
      description: 'Sets implicit grid row sizing with an arbitrary grid-auto-rows value.',
      keywords: ['grid', 'auto-rows', 'arbitrary', 'layout', 'tracks'],
    },
    {
      type: 'cc',
      name: 'auto-cols-auto',
      description: 'Sizes implicit grid columns by their natural content size.',
      keywords: ['grid', 'auto-cols', 'layout', 'auto'],
    },
    {
      type: 'cc',
      name: 'auto-cols-min',
      description: 'Sizes implicit grid columns to their minimum content size.',
      keywords: ['grid', 'auto-cols', 'min-content', 'layout'],
    },
    {
      type: 'cc',
      name: 'auto-cols-max',
      description: 'Sizes implicit grid columns to their maximum content size.',
      keywords: ['grid', 'auto-cols', 'max-content', 'layout'],
    },
    {
      type: 'cc',
      name: 'auto-cols-fr',
      description: 'Distributes implicit grid columns evenly using fractional 1fr tracks.',
      keywords: ['grid', 'auto-cols', 'fr', 'layout', 'tracks'],
    },
    {
      type: 'vd',
      name: 'auto-cols',
      accepts: 'string',
      description: 'Sets implicit grid column sizing with an arbitrary grid-auto-columns value.',
      keywords: ['grid', 'auto-cols', 'arbitrary', 'layout', 'tracks'],
    },
  ],
};
