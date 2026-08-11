export default {
  text: 'Interactivity',
  items: [
    {
      type: 'vd',
      name: 'cursor',
      accepts: 'raw',
      description: 'Sets cursor via --cursor. E.g. pointer, grab.',
      keywords: ['cursor', 'mouse', 'pointer', 'interactive'],
    },
    {
      type: 'cc',
      name: 'cursor-pointer',
      description: 'Sets cursor: pointer. The hand cursor for clickable elements.',
      keywords: ['cursor', 'pointer', 'click', 'hand', 'link'],
    },
    {
      type: 'cc',
      name: 'cursor-default',
      description: 'Sets cursor: default. The standard arrow cursor.',
      keywords: ['cursor', 'default', 'arrow'],
    },
    {
      type: 'cc',
      name: 'cursor-not-allowed',
      description: 'Sets cursor: not-allowed. Communicates a disabled or forbidden action.',
      keywords: ['cursor', 'disabled', 'not-allowed', 'blocked', 'forbidden'],
    },
    {
      type: 'cc',
      name: 'cursor-wait',
      description: 'Sets cursor: wait. Indicates a loading or busy state.',
      keywords: ['cursor', 'wait', 'loading', 'busy', 'spinner'],
    },
    {
      type: 'cc',
      name: 'cursor-grab',
      description: 'Sets cursor: grab. Indicates the element is draggable.',
      keywords: ['cursor', 'grab', 'drag', 'move', 'pan'],
    },
    {
      type: 'cc',
      name: 'cursor-text',
      description: 'Sets cursor: text. Indicates editable or selectable text.',
      keywords: ['cursor', 'text', 'input', 'edit', 'select'],
    },
    {
      type: 'cc',
      name: 'cursor-none',
      description: 'Sets cursor: none. Hides the cursor entirely.',
      keywords: ['cursor', 'none', 'hide', 'invisible'],
    },
    {
      type: 'cc',
      name: 'pointer-events-none',
      description:
        'Sets pointer-events: none. Element ignores all mouse interactions and passes them through.',
      keywords: ['pointer-events', 'none', 'disabled', 'passthrough', 'no-click'],
    },
    {
      type: 'cc',
      name: 'pointer-events-auto',
      description: 'Sets pointer-events: auto. Restores normal mouse interaction.',
      keywords: ['pointer-events', 'auto', 'interactive', 'clickable', 'enable'],
    },
    {
      type: 'cc',
      name: 'select-none',
      description: 'Sets user-select: none. Prevents text selection.',
      keywords: ['user-select', 'none', 'no-select', 'prevent', 'unselectable'],
    },
    {
      type: 'cc',
      name: 'select-text',
      description: 'Sets user-select: text. Allows normal text selection.',
      keywords: ['user-select', 'text', 'select', 'copy'],
    },
    {
      type: 'cc',
      name: 'select-all',
      description: 'Sets user-select: all. A single click selects all content.',
      keywords: ['user-select', 'all', 'select-all', 'copy'],
    },
    {
      type: 'cc',
      name: 'resize',
      description: 'Sets resize: both. Element can be resized in both directions.',
      keywords: ['resize', 'both', 'handle', 'textarea'],
    },
    {
      type: 'cc',
      name: 'resize-x',
      description: 'Sets resize: horizontal. Element can only be resized horizontally.',
      keywords: ['resize', 'horizontal', 'x-axis', 'handle'],
    },
    {
      type: 'cc',
      name: 'resize-y',
      description: 'Sets resize: vertical. Element can only be resized vertically.',
      keywords: ['resize', 'vertical', 'y-axis', 'handle', 'textarea'],
    },
    {
      type: 'cc',
      name: 'resize-none',
      description: 'Sets resize: none. Prevents resizing.',
      keywords: ['resize', 'none', 'fixed', 'no-resize'],
    },
    {
      type: 'cc',
      name: 'scroll-smooth',
      description: 'Sets scroll-behavior: smooth. Anchor links scroll smoothly.',
      keywords: ['scroll', 'smooth', 'anchor', 'behavior', 'navigation'],
    },
    {
      type: 'cc',
      name: 'scroll-auto',
      description: 'Sets scroll-behavior: auto. Default instant scroll behavior.',
      keywords: ['scroll', 'auto', 'instant', 'behavior'],
    },
    {
      type: 'cc',
      name: 'appearance-none',
      description:
        'Removes native browser styling from form elements. Required for custom inputs and selects.',
      keywords: ['appearance', 'none', 'reset', 'input', 'select', 'custom', 'form'],
    },
    {
      type: 'vd',
      name: 'caret',
      accepts: 'color-mix',
      description: 'Sets caret-color (the text cursor color inside inputs) via --caret.',
      keywords: ['caret', 'cursor', 'input', 'color', 'text-cursor'],
    },
    {
      type: 'co',
      name: 'snap-x',
      description: 'Sets scroll-snap-type: x. Enables horizontal scroll snapping on a container.',
      keywords: ['snap', 'scroll', 'horizontal', 'carousel', 'x-axis'],
    },
    {
      type: 'co',
      name: 'snap-y',
      description: 'Sets scroll-snap-type: y. Enables vertical scroll snapping on a container.',
      keywords: ['snap', 'scroll', 'vertical', 'pagination', 'y-axis'],
    },
    {
      type: 'cc',
      name: 'snap-mandatory',
      description: 'Sets scroll-snap-type mandatory mode. Always snaps to an alignment point.',
      keywords: ['snap', 'mandatory', 'scroll', 'strict'],
    },
    {
      type: 'cc',
      name: 'snap-start',
      description: 'Sets scroll-snap-align: start on a snap child.',
      keywords: ['snap', 'align', 'start', 'scroll', 'child'],
    },
    {
      type: 'cc',
      name: 'snap-center',
      description: 'Sets scroll-snap-align: center on a snap child.',
      keywords: ['snap', 'align', 'center', 'scroll', 'child'],
    },
    {
      type: 'cc',
      name: 'snap-always',
      description: 'Sets scroll-snap-stop: always. Forces a stop at this snap point.',
      keywords: ['snap', 'stop', 'always', 'scroll', 'child'],
    },
    {
      type: 'vd',
      name: 'will-change',
      accepts: 'raw',
      description:
        'Sets will-change via --will-change. Hints the browser about upcoming changes. E.g. transform, opacity.',
      keywords: ['will-change', 'performance', 'optimize', 'gpu', 'hint'],
    },

    {
      type: 'cc',
      name: 'field-sizing-fixed',
      description:
        'Sets field-sizing to fixed, giving form fields a fixed size unaffected by their content.',
      keywords: ['field-sizing', 'interactivity', 'form', 'fixed'],
    },
    {
      type: 'cc',
      name: 'field-sizing-content',
      description:
        'Sets field-sizing to content, letting form fields grow or shrink to fit their content.',
      keywords: ['field-sizing', 'interactivity', 'form', 'content'],
    },
    {
      type: 'cc',
      name: 'snap-end',
      description:
        "Sets scroll-snap-align to end, snapping the element's end edge to the scroll container.",
      keywords: ['scroll-snap-align', 'interactivity', 'snap', 'end'],
    },
    {
      type: 'cc',
      name: 'snap-align-none',
      description: 'Sets scroll-snap-align to none, opting the element out of scroll snapping.',
      keywords: ['scroll-snap-align', 'interactivity', 'snap', 'none'],
    },
    {
      type: 'cc',
      name: 'snap-normal',
      description:
        'Sets scroll-snap-stop to normal, allowing the scroll to pass over this snap position.',
      keywords: ['scroll-snap-stop', 'interactivity', 'snap', 'normal'],
    },
    {
      type: 'cc',
      name: 'snap-none',
      description: 'Sets scroll-snap-type to none, disabling scroll snapping on this container.',
      keywords: ['scroll-snap-type', 'interactivity', 'snap', 'none'],
    },
    {
      type: 'co',
      name: 'snap-both',
      description:
        'Sets scroll-snap-type to snap on both axes, using the configured strictness variable.',
      keywords: ['scroll-snap-type', 'interactivity', 'snap', 'both', 'axes'],
    },
    {
      type: 'cc',
      name: 'snap-proximity',
      description:
        'Sets the scroll-snap strictness variable to proximity, snapping only when close to a snap point.',
      keywords: ['scroll-snap', 'interactivity', 'snap', 'proximity', 'strictness'],
    },
    {
      type: 'cc',
      name: 'touch-auto',
      description:
        "Sets touch-action to auto, allowing the browser's default touch gesture handling.",
      keywords: ['touch-action', 'interactivity', 'touch', 'auto'],
    },
    {
      type: 'cc',
      name: 'touch-none',
      description:
        'Sets touch-action to none, disabling all browser touch gesture handling on the element.',
      keywords: ['touch-action', 'interactivity', 'touch', 'none'],
    },
    {
      type: 'cc',
      name: 'touch-pan-x',
      description: 'Sets touch-action to pan-x, allowing horizontal panning gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pan-x', 'horizontal'],
    },
    {
      type: 'cc',
      name: 'touch-pan-left',
      description: 'Sets touch-action to pan-left, allowing leftward panning gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pan-left'],
    },
    {
      type: 'cc',
      name: 'touch-pan-right',
      description: 'Sets touch-action to pan-right, allowing rightward panning gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pan-right'],
    },
    {
      type: 'cc',
      name: 'touch-pan-y',
      description: 'Sets touch-action to pan-y, allowing vertical panning gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pan-y', 'vertical'],
    },
    {
      type: 'cc',
      name: 'touch-pan-up',
      description: 'Sets touch-action to pan-up, allowing upward panning gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pan-up'],
    },
    {
      type: 'cc',
      name: 'touch-pan-down',
      description: 'Sets touch-action to pan-down, allowing downward panning gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pan-down'],
    },
    {
      type: 'cc',
      name: 'touch-pinch-zoom',
      description: 'Sets touch-action to pinch-zoom, allowing pinch-to-zoom gestures only.',
      keywords: ['touch-action', 'interactivity', 'touch', 'pinch-zoom'],
    },
    {
      type: 'cc',
      name: 'touch-manipulation',
      description:
        'Sets touch-action to manipulation, allowing panning and pinch-zoom but disabling double-tap-to-zoom.',
      keywords: ['touch-action', 'interactivity', 'touch', 'manipulation'],
    },
    {
      type: 'cc',
      name: 'select-auto',
      description:
        "Sets user-select to auto, restoring the browser's default text selection behavior.",
      keywords: ['user-select', 'interactivity', 'selection', 'auto'],
    },

    {
      type: 'cc',
      name: 'appearance-auto',
      description: 'Restores the default platform-native styling to form controls.',
      keywords: ['appearance', 'form', 'auto', 'native', 'style'],
    },

    {
      type: 'vd',
      name: 'caret/o',
      accepts: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      description:
        'Sets caret color + opacity independently via --caret and --caret-o. Controls text cursor transparency.',
      keywords: ['caret', 'cursor', 'input', 'color', 'opacity'],
    },

    {
      type: 'cc',
      name: 'cursor-auto',
      description: 'Lets the browser decide the cursor for the current context.',
      keywords: ['cursor', 'auto', 'interaction', 'pointer'],
    },
    {
      type: 'cc',
      name: 'cursor-move',
      description: 'Indicates an element can be moved.',
      keywords: ['cursor', 'move', 'drag', 'interaction'],
    },
    {
      type: 'cc',
      name: 'cursor-help',
      description: 'Indicates contextual help is available.',
      keywords: ['cursor', 'help', 'tooltip', 'interaction'],
    },
    {
      type: 'cc',
      name: 'cursor-context-menu',
      description: 'Indicates a context menu can be opened.',
      keywords: ['cursor', 'context-menu', 'menu', 'interaction'],
    },
    {
      type: 'cc',
      name: 'cursor-progress',
      description: 'Indicates background work with a progress state.',
      keywords: ['cursor', 'progress', 'loading', 'interaction'],
    },
    {
      type: 'cc',
      name: 'cursor-cell',
      description: 'Indicates table cell selection.',
      keywords: ['cursor', 'cell', 'table', 'selection'],
    },
    {
      type: 'cc',
      name: 'cursor-crosshair',
      description: 'Precise selection cursor, common for canvases or pickers.',
      keywords: ['cursor', 'crosshair', 'precision', 'selection'],
    },
    {
      type: 'cc',
      name: 'cursor-vertical-text',
      description: 'Indicates vertical text selection.',
      keywords: ['cursor', 'vertical-text', 'text', 'selection'],
    },
    {
      type: 'cc',
      name: 'cursor-alias',
      description: 'Indicates a shortcut or alias will be created.',
      keywords: ['cursor', 'alias', 'shortcut', 'drag'],
    },
    {
      type: 'cc',
      name: 'cursor-copy',
      description: 'Indicates a copy action.',
      keywords: ['cursor', 'copy', 'clipboard', 'drag'],
    },
    {
      type: 'cc',
      name: 'cursor-no-drop',
      description: 'Indicates dropping is not allowed.',
      keywords: ['cursor', 'no-drop', 'drag', 'disabled'],
    },
    {
      type: 'cc',
      name: 'cursor-grabbing',
      description: 'Indicates active dragging.',
      keywords: ['cursor', 'grabbing', 'drag', 'interaction'],
    },
    {
      type: 'cc',
      name: 'cursor-all-scroll',
      description: 'Indicates scrolling in any direction.',
      keywords: ['cursor', 'all-scroll', 'scroll', 'pan'],
    },
    {
      type: 'cc',
      name: 'cursor-col-resize',
      description: 'Indicates column resizing.',
      keywords: ['cursor', 'resize', 'column', 'table'],
    },
    {
      type: 'cc',
      name: 'cursor-row-resize',
      description: 'Indicates row resizing.',
      keywords: ['cursor', 'resize', 'row', 'table'],
    },
    {
      type: 'cc',
      name: 'cursor-n-resize',
      description: 'Indicates resizing toward the top edge.',
      keywords: ['cursor', 'resize', 'north', 'top'],
    },
    {
      type: 'cc',
      name: 'cursor-e-resize',
      description: 'Indicates resizing toward the right edge.',
      keywords: ['cursor', 'resize', 'east', 'right'],
    },
    {
      type: 'cc',
      name: 'cursor-s-resize',
      description: 'Indicates resizing toward the bottom edge.',
      keywords: ['cursor', 'resize', 'south', 'bottom'],
    },
    {
      type: 'cc',
      name: 'cursor-w-resize',
      description: 'Indicates resizing toward the left edge.',
      keywords: ['cursor', 'resize', 'west', 'left'],
    },
    {
      type: 'cc',
      name: 'cursor-ne-resize',
      description: 'Indicates diagonal resizing toward the top-right corner.',
      keywords: ['cursor', 'resize', 'diagonal', 'top-right'],
    },
    {
      type: 'cc',
      name: 'cursor-nw-resize',
      description: 'Indicates diagonal resizing toward the top-left corner.',
      keywords: ['cursor', 'resize', 'diagonal', 'top-left'],
    },
    {
      type: 'cc',
      name: 'cursor-se-resize',
      description: 'Indicates diagonal resizing toward the bottom-right corner.',
      keywords: ['cursor', 'resize', 'diagonal', 'bottom-right'],
    },
    {
      type: 'cc',
      name: 'cursor-sw-resize',
      description: 'Indicates diagonal resizing toward the bottom-left corner.',
      keywords: ['cursor', 'resize', 'diagonal', 'bottom-left'],
    },
    {
      type: 'cc',
      name: 'cursor-ew-resize',
      description: 'Indicates horizontal resizing along the left/right axis.',
      keywords: ['cursor', 'resize', 'horizontal', 'ew'],
    },
    {
      type: 'cc',
      name: 'cursor-ns-resize',
      description: 'Indicates vertical resizing along the top/bottom axis.',
      keywords: ['cursor', 'resize', 'vertical', 'ns'],
    },
    {
      type: 'cc',
      name: 'cursor-nesw-resize',
      description: 'Indicates diagonal resizing along the northeast/southwest axis.',
      keywords: ['cursor', 'resize', 'diagonal', 'nesw'],
    },
    {
      type: 'cc',
      name: 'cursor-nwse-resize',
      description: 'Indicates diagonal resizing along the northwest/southeast axis.',
      keywords: ['cursor', 'resize', 'diagonal', 'nwse'],
    },
    {
      type: 'cc',
      name: 'cursor-zoom-in',
      description: 'Indicates zooming in.',
      keywords: ['cursor', 'zoom', 'in', 'magnify'],
    },
    {
      type: 'cc',
      name: 'cursor-zoom-out',
      description: 'Indicates zooming out.',
      keywords: ['cursor', 'zoom', 'out', 'magnify'],
    },
  ],
};
