export default {
  text: 'Transitions & Animations',
  items: [
    {
      type: 'vd',
      name: 'animate',
      accepts: 'raw',
      description: 'Sets animation via --animate. E.g. spin 1s linear infinite.',
      keywords: ['animation', 'keyframe', 'motion', 'movement', 'effect'],
    },
    {
      type: 'co',
      name: 'animate-spin',
      description: 'Applies an infinite rotation animation. Useful for loading spinners.',
      keywords: ['animation', 'spin', 'rotate', 'loader', 'infinite'],
    },
    {
      type: 'co',
      name: 'animate-ping',
      description: 'Applies a radar-like ping animation. Good for notification badges.',
      keywords: ['animation', 'ping', 'pulse', 'notification', 'beacon'],
    },
    {
      type: 'co',
      name: 'animate-pulse',
      description: 'Applies a gentle fade in/out pulse. Good for skeleton loading states.',
      keywords: ['animation', 'pulse', 'fade', 'skeleton', 'loading'],
    },
    {
      type: 'co',
      name: 'animate-bounce',
      description: 'Applies a bounce animation.',
      keywords: ['animation', 'bounce', 'jump', 'motion'],
    },
    {
      type: 'cc',
      name: 'animate-none',
      description: 'Removes animation.',
      keywords: ['animation', 'none', 'stop', 'reset'],
    },
    {
      type: 'vd',
      name: 'transition',
      accepts: 'raw',
      description: 'Sets which CSS properties to transition via --transition. E.g. opacity.',
      keywords: ['transition', 'property', 'animate', 'change'],
    },
    {
      type: 'cc',
      name: 'transition-all',
      description: 'Transitions all CSS properties.',
      keywords: ['transition', 'all', 'properties'],
    },
    {
      type: 'cc',
      name: 'transition-colors',
      description:
        'Transitions color-related properties: color, background, border, fill, stroke, etc.',
      keywords: ['transition', 'colors', 'background', 'border', 'text'],
    },
    {
      type: 'cc',
      name: 'transition-opacity',
      description: 'Transitions opacity only.',
      keywords: ['transition', 'opacity', 'fade'],
    },
    {
      type: 'cc',
      name: 'transition-transform',
      description: 'Transitions transform properties: translate, scale, rotate.',
      keywords: ['transition', 'transform', 'move', 'scale', 'rotate'],
    },
    {
      type: 'cc',
      name: 'transition-shadow',
      description: 'Transitions box-shadow.',
      keywords: ['transition', 'shadow', 'elevation'],
    },
    {
      type: 'cc',
      name: 'transition-none',
      description: 'Removes transitions.',
      keywords: ['transition', 'none', 'instant', 'reset'],
    },
    {
      type: 'vd',
      name: 'duration',
      accepts: 'raw',
      description: 'Sets transition-duration via --duration. E.g. 300ms, 0.5s.',
      keywords: ['transition', 'duration', 'speed', 'time'],
    },
    {
      type: 'vd',
      name: 'delay',
      accepts: 'raw',
      description: 'Sets transition-delay via --delay. E.g. 200ms.',
      keywords: ['transition', 'delay', 'wait', 'time'],
    },
    {
      type: 'cc',
      name: 'ease-linear',
      description: 'Sets transition-timing-function: linear. Constant speed throughout.',
      keywords: ['easing', 'linear', 'timing', 'transition'],
    },
    {
      type: 'co',
      name: 'ease-in',
      description: 'Sets transition-timing-function to ease-in. Starts slow, ends fast.',
      keywords: ['easing', 'ease-in', 'timing', 'transition', 'accelerate'],
    },
    {
      type: 'co',
      name: 'ease-out',
      description: 'Sets transition-timing-function to ease-out. Starts fast, ends slow.',
      keywords: ['easing', 'ease-out', 'timing', 'transition', 'decelerate'],
    },
    {
      type: 'co',
      name: 'ease-in-out',
      description: 'Sets transition-timing-function to ease-in-out. Slow at both ends.',
      keywords: ['easing', 'ease-in-out', 'timing', 'transition', 'smooth'],
    },
    {
      type: 'vd',
      name: 'ease',
      accepts: 'raw',
      description: 'Sets custom timing function via --ease. E.g. cubic-bezier(0.4, 0, 0.2, 1).',
      keywords: ['easing', 'timing', 'transition', 'cubic-bezier', 'custom'],
    },
    {
      type: 'cc',
      name: 'transition-discrete',
      description:
        'Sets transition-behavior: allow-discrete. Enables animation of discrete properties like display.',
      keywords: ['transition', 'discrete', 'display', 'behavior', 'allow'],
    },

    {
      type: 'cc',
      name: 'transition-normal',
      description:
        'Sets transition-behavior to normal, so transitions do not interpolate discrete properties.',
      keywords: ['transition-behavior', 'transitions', 'normal'],
    },
    {
      type: 'cc',
      name: 'duration-initial',
      description: 'Resets transition-duration to its initial CSS value.',
      keywords: ['transition-duration', 'transitions', 'initial', 'reset'],
    },
    {
      type: 'cc',
      name: 'ease-initial',
      description: 'Resets transition-timing-function to its initial CSS value.',
      keywords: ['transition-timing-function', 'transitions', 'easing', 'initial', 'reset'],
    },

    {
      type: 'cc',
      name: 'will-change-auto',
      description: 'Lets the browser decide whether to apply will-change optimizations.',
      keywords: ['will-change', 'performance', 'animation', 'auto'],
    },
    {
      type: 'cc',
      name: 'will-change-scroll',
      description:
        'Hints that scroll position will change, helping the browser optimize scrolling.',
      keywords: ['will-change', 'scroll', 'performance', 'optimization'],
    },
    {
      type: 'cc',
      name: 'will-change-contents',
      description:
        'Hints that element content will change, helping the browser optimize rendering.',
      keywords: ['will-change', 'contents', 'performance', 'optimization'],
    },
    {
      type: 'cc',
      name: 'will-change-transform',
      description: 'Hints that transforms will change, helping the browser optimize compositing.',
      keywords: ['will-change', 'transform', 'performance', 'animation'],
    },
  ],
};
