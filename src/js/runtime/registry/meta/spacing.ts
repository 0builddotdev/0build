export default {
  text: 'Spacing',
  items: [
    {
      type: 'vd',
      name: 'm',
      accepts: 'scaled',
      description:
        'Sets margin on all sides via --m. Scaled by spacing unit. Use [m] for raw values.',
      keywords: ['margin', 'spacing', 'outer', 'gap'],
    },
    {
      type: 'vd',
      name: 'mx',
      accepts: 'scaled',
      description: 'Sets horizontal margin (left & right) via --mx. Scaled.',
      keywords: ['margin', 'horizontal', 'x-axis', 'spacing'],
    },
    {
      type: 'vd',
      name: 'my',
      accepts: 'scaled',
      description: 'Sets vertical margin (top & bottom) via --my. Scaled.',
      keywords: ['margin', 'vertical', 'y-axis', 'spacing'],
    },
    {
      type: 'vd',
      name: 'mt',
      accepts: 'scaled',
      description: 'Sets margin-top via --mt. Scaled.',
      keywords: ['margin', 'top', 'spacing'],
    },
    {
      type: 'vd',
      name: 'mb',
      accepts: 'scaled',
      description: 'Sets margin-bottom via --mb. Scaled.',
      keywords: ['margin', 'bottom', 'spacing'],
    },
    {
      type: 'vd',
      name: 'ml',
      accepts: 'scaled',
      description: 'Sets margin-left via --ml. Scaled.',
      keywords: ['margin', 'left', 'spacing'],
    },
    {
      type: 'vd',
      name: 'mr',
      accepts: 'scaled',
      description: 'Sets margin-right via --mr. Scaled.',
      keywords: ['margin', 'right', 'spacing'],
    },
    {
      type: 'vd',
      name: 'ms',
      accepts: 'scaled',
      description: 'Sets margin-inline-start (logical) via --ms. Scaled.',
      keywords: ['margin', 'start', 'logical', 'inline', 'spacing'],
    },
    {
      type: 'vd',
      name: 'me',
      accepts: 'scaled',
      description: 'Sets margin-inline-end (logical) via --me. Scaled.',
      keywords: ['margin', 'end', 'logical', 'inline', 'spacing'],
    },
    {
      type: 'cc',
      name: 'm-auto',
      description: 'Sets margin: auto on all sides.',
      keywords: ['margin', 'auto', 'center'],
    },
    {
      type: 'cc',
      name: 'mx-auto',
      description: 'Centers element horizontally via margin-inline: auto.',
      keywords: ['margin', 'auto', 'center', 'horizontal'],
    },
    {
      type: 'vd',
      name: 'p',
      accepts: 'scaled',
      description:
        'Sets padding on all sides via --p. Scaled by spacing unit. Use [p] for raw values.',
      keywords: ['padding', 'spacing', 'inner', 'inset'],
    },
    {
      type: 'vd',
      name: 'px',
      accepts: 'scaled',
      description: 'Sets horizontal padding (left & right) via --px. Scaled.',
      keywords: ['padding', 'horizontal', 'x-axis', 'spacing'],
    },
    {
      type: 'vd',
      name: 'py',
      accepts: 'scaled',
      description: 'Sets vertical padding (top & bottom) via --py. Scaled.',
      keywords: ['padding', 'vertical', 'y-axis', 'spacing'],
    },
    {
      type: 'vd',
      name: 'pt',
      accepts: 'scaled',
      description: 'Sets padding-top via --pt. Scaled.',
      keywords: ['padding', 'top', 'spacing'],
    },
    {
      type: 'vd',
      name: 'pb',
      accepts: 'scaled',
      description: 'Sets padding-bottom via --pb. Scaled.',
      keywords: ['padding', 'bottom', 'spacing'],
    },
    {
      type: 'vd',
      name: 'pl',
      accepts: 'scaled',
      description: 'Sets padding-left via --pl. Scaled.',
      keywords: ['padding', 'left', 'spacing'],
    },
    {
      type: 'vd',
      name: 'pr',
      accepts: 'scaled',
      description: 'Sets padding-right via --pr. Scaled.',
      keywords: ['padding', 'right', 'spacing'],
    },
    {
      type: 'vd',
      name: 'ps',
      accepts: 'scaled',
      description: 'Sets padding-inline-start (logical) via --ps. Scaled.',
      keywords: ['padding', 'start', 'logical', 'inline', 'spacing'],
    },
    {
      type: 'vd',
      name: 'pe',
      accepts: 'scaled',
      description: 'Sets padding-inline-end (logical) via --pe. Scaled.',
      keywords: ['padding', 'end', 'logical', 'inline', 'spacing'],
    },
    {
      type: 'vd',
      name: 'space-x',
      accepts: 'scaled',
      description: 'Adds horizontal margin between child elements via --space-x. Scaled.',
      keywords: ['space', 'gap', 'children', 'horizontal', 'between'],
    },
    {
      type: 'vd',
      name: 'space-y',
      accepts: 'scaled',
      description: 'Adds vertical margin between child elements via --space-y. Scaled.',
      keywords: ['space', 'gap', 'children', 'vertical', 'between'],
    },

    {
      type: 'cc',
      name: 'mt-auto',
      description:
        'Sets margin-top to auto, useful for pushing elements apart in flex/grid layouts.',
      keywords: ['margin', 'spacing', 'top', 'auto'],
    },
    {
      type: 'cc',
      name: 'mb-auto',
      description:
        'Sets margin-bottom to auto, useful for pushing elements apart in flex/grid layouts.',
      keywords: ['margin', 'spacing', 'bottom', 'auto'],
    },
    {
      type: 'cc',
      name: 'ml-auto',
      description: 'Sets margin-left to auto, commonly used to push an element to the right.',
      keywords: ['margin', 'spacing', 'left', 'auto'],
    },
    {
      type: 'cc',
      name: 'mr-auto',
      description: 'Sets margin-right to auto, commonly used to push an element to the left.',
      keywords: ['margin', 'spacing', 'right', 'auto'],
    },
    {
      type: 'cc',
      name: 'ms-auto',
      description: 'Sets logical margin-inline-start to auto, respecting writing direction.',
      keywords: ['margin', 'spacing', 'inline-start', 'logical', 'auto', 'rtl'],
    },
    {
      type: 'cc',
      name: 'me-auto',
      description: 'Sets logical margin-inline-end to auto, respecting writing direction.',
      keywords: ['margin', 'spacing', 'inline-end', 'logical', 'auto', 'rtl'],
    },
    {
      type: 'cc',
      name: 'my-auto',
      description: 'Sets margin-block (top and bottom) to auto.',
      keywords: ['margin', 'spacing', 'block', 'vertical', 'auto'],
    },

    {
      type: 'vd',
      name: '[gap]',
      description:
        'Applies raw --gap directly as gap between flex/grid children. Use for custom, unscaled spacing.',
      keywords: ['gap', 'spacing', 'flex', 'grid', 'raw'],
    },
    {
      type: 'vd',
      name: '[gap-x]',
      description:
        'Applies raw --gap-x directly as column-gap. Controls horizontal space between grid/flex items.',
      keywords: ['gap', 'column-gap', 'x', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[gap-y]',
      description:
        'Applies raw --gap-y directly as row-gap. Controls vertical space between grid/flex items.',
      keywords: ['gap', 'row-gap', 'y', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[m]',
      description:
        'Sets margin on all sides directly via --m. Raw, unscaled outer spacing. Use m for spacing-scaled margin.',
      keywords: ['margin', 'spacing', 'outer', 'gap', 'raw'],
    },
    {
      type: 'vd',
      name: '[mt]',
      description: 'Sets top margin directly via --mt. Raw outer spacing above the element.',
      keywords: ['margin', 'top', 'spacing', 'outer', 'raw'],
    },
    {
      type: 'vd',
      name: '[mb]',
      description: 'Sets bottom margin directly via --mb. Raw outer spacing below the element.',
      keywords: ['margin', 'bottom', 'spacing', 'outer', 'raw'],
    },
    {
      type: 'vd',
      name: '[ml]',
      description:
        'Sets left margin directly via --ml. Raw outer spacing to the left of the element.',
      keywords: ['margin', 'left', 'spacing', 'outer', 'raw'],
    },
    {
      type: 'vd',
      name: '[mr]',
      description:
        'Sets right margin directly via --mr. Raw outer spacing to the right of the element.',
      keywords: ['margin', 'right', 'spacing', 'outer', 'raw'],
    },
    {
      type: 'vd',
      name: '[ms]',
      description:
        'Sets inline-start margin directly via --ms. Raw logical outer spacing at the start edge.',
      keywords: ['margin', 'start', 'logical', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[me]',
      description:
        'Sets inline-end margin directly via --me. Raw logical outer spacing at the end edge.',
      keywords: ['margin', 'end', 'logical', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[mx]',
      description:
        'Sets inline-axis margins directly via --mx. Raw outer spacing on the start/end edges.',
      keywords: ['margin', 'inline', 'x', 'spacing', 'raw'],
    },

    {
      type: 'vd',
      name: '[my]',
      description:
        'Sets block-axis margin directly via --my. Raw vertical outer spacing in normal writing modes.',
      keywords: ['margin', 'y', 'block', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[p]',
      description:
        'Sets padding on all sides directly via --p. Raw inner spacing. Use p for spacing-scaled padding.',
      keywords: ['padding', 'spacing', 'inner', 'gap', 'raw'],
    },
    {
      type: 'vd',
      name: '[pt]',
      description: 'Sets top padding directly via --pt. Raw inner spacing above content.',
      keywords: ['padding', 'top', 'spacing', 'inner', 'raw'],
    },
    {
      type: 'vd',
      name: '[pb]',
      description: 'Sets bottom padding directly via --pb. Raw inner spacing below content.',
      keywords: ['padding', 'bottom', 'spacing', 'inner', 'raw'],
    },
    {
      type: 'vd',
      name: '[pl]',
      description: 'Sets left padding directly via --pl. Raw inner spacing to the left of content.',
      keywords: ['padding', 'left', 'spacing', 'inner', 'raw'],
    },
    {
      type: 'vd',
      name: '[pr]',
      description:
        'Sets right padding directly via --pr. Raw inner spacing to the right of content.',
      keywords: ['padding', 'right', 'spacing', 'inner', 'raw'],
    },
    {
      type: 'vd',
      name: '[ps]',
      description:
        'Sets inline-start padding directly via --ps. Raw logical inner spacing at the start edge.',
      keywords: ['padding', 'start', 'logical', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[pe]',
      description:
        'Sets inline-end padding directly via --pe. Raw logical inner spacing at the end edge.',
      keywords: ['padding', 'end', 'logical', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[px]',
      description:
        'Sets inline-axis padding directly via --px. Raw inner spacing on start/end edges.',
      keywords: ['padding', 'inline', 'x', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: '[py]',
      description:
        'Sets block-axis padding directly via --py. Raw inner spacing above and below content.',
      keywords: ['padding', 'block', 'y', 'spacing', 'raw'],
    },
    {
      type: 'vd',
      name: 'scroll-m',
      accepts: 'numeric',
      description:
        'Sets scroll-margin via --scroll-m. Scaled by spacing unit. Useful for scroll-snap and anchor offsets.',
      keywords: ['scroll', 'scroll-margin', 'spacing', 'snap', 'anchor'],
    },

    {
      type: 'vd',
      name: '[scroll-m]',
      description:
        'Applies raw --scroll-m directly to scroll-margin. Use scroll-m for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'snap', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-mt',
      accepts: 'numeric',
      description:
        'Sets scroll margin above a scroll target via --scroll-mt. Scaled by spacing unit. Use [scroll-mt] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'top', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-mt]',
      description:
        'Applies raw --scroll-mt directly to scroll-margin-top. Use scroll-mt for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'top', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-mb',
      accepts: 'numeric',
      description:
        'Sets scroll margin below a scroll target via --scroll-mb. Scaled by spacing unit. Use [scroll-mb] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'bottom', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-mb]',
      description:
        'Applies raw --scroll-mb directly to scroll-margin-bottom. Use scroll-mb for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'bottom', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-ml',
      accepts: 'numeric',
      description:
        'Sets scroll margin to the left of a scroll target via --scroll-ml. Scaled by spacing unit. Use [scroll-ml] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'left', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-ml]',
      description:
        'Applies raw --scroll-ml directly to scroll-margin-left. Use scroll-ml for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'left', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-mr',
      accepts: 'numeric',
      description:
        'Sets scroll margin to the right of a scroll target via --scroll-mr. Scaled by spacing unit. Use [scroll-mr] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'right', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-mr]',
      description:
        'Applies raw --scroll-mr directly to scroll-margin-right. Use scroll-mr for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'right', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-ms',
      accepts: 'numeric',
      description:
        'Sets inline-start scroll margin via --scroll-ms. Scaled by spacing unit. Use [scroll-ms] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'start', 'logical', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-ms]',
      description:
        'Applies raw --scroll-ms directly to scroll-margin-inline-start. Use scroll-ms for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'start', 'logical', 'raw'],
    },
    {
      type: 'vd',
      name: 'scroll-me',
      accepts: 'numeric',
      description:
        'Sets inline-end scroll margin via --scroll-me. Scaled by spacing unit. Use [scroll-me] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'end', 'logical', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-me]',
      description:
        'Applies raw --scroll-me directly to scroll-margin-inline-end. Use scroll-me for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'end', 'logical', 'raw'],
    },
    {
      type: 'vd',
      name: 'scroll-mx',
      accepts: 'numeric',
      description:
        'Sets inline-axis scroll margin via --scroll-mx. Scaled by spacing unit. Use [scroll-mx] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'x', 'inline', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-mx]',
      description:
        'Applies raw --scroll-mx directly to scroll-margin-inline. Use scroll-mx for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'x', 'inline', 'raw'],
    },
    {
      type: 'vd',
      name: 'scroll-my',
      accepts: 'numeric',
      description:
        'Sets block-axis scroll margin via --scroll-my. Scaled by spacing unit. Use [scroll-my] for raw values.',
      keywords: ['scroll', 'scroll-margin', 'y', 'block', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-my]',
      description:
        'Applies raw --scroll-my directly to scroll-margin-block. Use scroll-my for spacing-scaled values.',
      keywords: ['scroll', 'scroll-margin', 'y', 'block', 'raw'],
    },
    {
      type: 'vd',
      name: 'scroll-p',
      accepts: 'numeric',
      description:
        'Sets scroll padding inside the scroll container on all sides via --scroll-p. Scaled by spacing unit. Use [scroll-p] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'container', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-p]',
      description:
        'Applies raw --scroll-p directly to scroll-padding. Use scroll-p for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'container', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-pt',
      accepts: 'numeric',
      description:
        'Adds scroll padding above the scroll container viewport via --scroll-pt. Scaled by spacing unit. Use [scroll-pt] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'top', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-pb',
      accepts: 'numeric',
      description:
        'Adds scroll padding below the scroll container viewport via --scroll-pb. Scaled by spacing unit. Use [scroll-pb] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'bottom', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-pl',
      accepts: 'numeric',
      description:
        'Adds scroll padding to the left of the scroll container viewport via --scroll-pl. Scaled by spacing unit. Use [scroll-pl] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'left', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-pr',
      accepts: 'numeric',
      description:
        'Adds scroll padding to the right of the scroll container viewport via --scroll-pr. Scaled by spacing unit. Use [scroll-pr] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'right', 'snap', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-ps',
      accepts: 'numeric',
      description:
        'Adds inline-start scroll padding via --scroll-ps. Scaled by spacing unit. Use [scroll-ps] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'start', 'logical', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-pe',
      accepts: 'numeric',
      description:
        'Adds inline-end scroll padding via --scroll-pe. Scaled by spacing unit. Use [scroll-pe] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'end', 'logical', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-pt]',
      description:
        'Applies raw --scroll-pt directly to scroll-padding-top. Use scroll-pt for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'top', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-pb]',
      description:
        'Applies raw --scroll-pb directly to scroll-padding-bottom. Use scroll-pb for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'bottom', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-pl]',
      description:
        'Applies raw --scroll-pl directly to scroll-padding-left. Use scroll-pl for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'left', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-pr]',
      description:
        'Applies raw --scroll-pr directly to scroll-padding-right. Use scroll-pr for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'right', 'raw', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-ps]',
      description:
        'Applies raw --scroll-ps directly to scroll-padding-inline-start. Use scroll-ps for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'start', 'logical', 'raw'],
    },
    {
      type: 'vd',
      name: '[scroll-pe]',
      description:
        'Applies raw --scroll-pe directly to scroll-padding-inline-end. Use scroll-pe for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'end', 'logical', 'raw'],
    },
    {
      type: 'vd',
      name: 'scroll-px',
      accepts: 'numeric',
      description:
        'Sets inline-axis scroll padding via --scroll-px. Scaled by spacing unit. Use [scroll-px] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'x', 'inline', 'spacing'],
    },
    {
      type: 'vd',
      name: 'scroll-py',
      accepts: 'numeric',
      description:
        'Sets block-axis scroll padding via --scroll-py. Scaled by spacing unit. Use [scroll-py] for raw values.',
      keywords: ['scroll', 'scroll-padding', 'y', 'block', 'spacing'],
    },
    {
      type: 'vd',
      name: '[scroll-px]',
      description:
        'Applies raw --scroll-px directly to scroll-padding-inline. Use scroll-px for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'x', 'inline', 'raw'],
    },
    {
      type: 'vd',
      name: '[scroll-py]',
      description:
        'Applies raw --scroll-py directly to scroll-padding-block. Use scroll-py for spacing-scaled values.',
      keywords: ['scroll', 'scroll-padding', 'y', 'block', 'raw'],
    },

    {
      type: 'vd',
      name: '[space-x]',
      description: 'Applies the raw --space-x CSS variable directly to horizontal sibling spacing.',
      keywords: ['space', 'spacing', 'sibling', 'x', 'css-variable'],
    },
    {
      type: 'vd',
      name: '[space-y]',
      description: 'Applies the raw --space-y CSS variable directly to vertical sibling spacing.',
      keywords: ['space', 'spacing', 'sibling', 'y', 'css-variable'],
    },

    {
      type: 'cc',
      name: 'space-x-reverse',
      description:
        'Reverses the direction horizontal space-between-children margins are applied, for use with row-reverse layouts.',
      keywords: ['space', 'spacing', 'horizontal', 'reverse', 'children'],
    },
    {
      type: 'cc',
      name: 'space-y-reverse',
      description:
        'Reverses the direction vertical space-between-children margins are applied, for use with column-reverse layouts.',
      keywords: ['space', 'spacing', 'vertical', 'reverse', 'children'],
    },
  ],
};
