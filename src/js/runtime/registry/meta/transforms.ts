export default {
  text: 'Transforms',
  items: [
    {
      type: 'vd',
      name: 'rotate',
      accepts: 'raw',
      description: 'Sets rotation via --rotate. E.g. 45deg, -90deg.',
      keywords: ['rotate', 'transform', 'angle', 'spin', 'turn'],
    },
    {
      type: 'vd',
      name: 'rotate-x',
      accepts: 'raw',
      description: 'Sets 3D X-axis rotation via --rotate-x. E.g. 180deg.',
      keywords: ['rotate', 'x-axis', '3d', 'transform', 'flip'],
    },
    {
      type: 'vd',
      name: 'rotate-y',
      accepts: 'raw',
      description: 'Sets 3D Y-axis rotation via --rotate-y. E.g. 180deg.',
      keywords: ['rotate', 'y-axis', '3d', 'transform', 'flip'],
    },
    {
      type: 'vd',
      name: 'scale',
      accepts: 'raw',
      description: 'Sets uniform scale (X & Y) via --scale. E.g. 1.1 to grow, 0.9 to shrink.',
      keywords: ['scale', 'transform', 'zoom', 'size', 'grow', 'shrink'],
    },
    {
      type: 'vd',
      name: 'scale-x',
      accepts: 'raw',
      description: 'Sets horizontal scale via --scale-x.',
      keywords: ['scale', 'x-axis', 'transform', 'width', 'stretch'],
    },
    {
      type: 'vd',
      name: 'scale-y',
      accepts: 'raw',
      description: 'Sets vertical scale via --scale-y.',
      keywords: ['scale', 'y-axis', 'transform', 'height', 'stretch'],
    },
    {
      type: 'vd',
      name: 'translate',
      accepts: 'scaled',
      description:
        'Sets X & Y translation via --translate. Scaled. Use [translate] for raw values like 50%.',
      keywords: ['translate', 'move', 'offset', 'transform', 'position'],
    },
    {
      type: 'vd',
      name: 'translate-x',
      accepts: 'scaled',
      description: 'Sets horizontal translation via --translate-x. Scaled.',
      keywords: ['translate', 'x-axis', 'move', 'horizontal', 'transform'],
    },
    {
      type: 'vd',
      name: 'translate-y',
      accepts: 'scaled',
      description: 'Sets vertical translation via --translate-y. Scaled.',
      keywords: ['translate', 'y-axis', 'move', 'vertical', 'transform'],
    },
    {
      type: 'vd',
      name: 'translate-z',
      accepts: 'scaled',
      description: 'Sets Z-axis translation via --translate-z. Scaled.',
      keywords: ['translate', 'z-axis', '3d', 'depth', 'transform'],
    },
    {
      type: 'vd',
      name: 'skew',
      accepts: 'raw',
      description: 'Sets X & Y skew via --skew. E.g. 10deg.',
      keywords: ['skew', 'transform', 'slant', 'angle', 'tilt'],
    },
    {
      type: 'vd',
      name: 'skew-x',
      accepts: 'raw',
      description: 'Sets horizontal skew via --skew-x.',
      keywords: ['skew', 'x-axis', 'slant', 'angle', 'transform'],
    },
    {
      type: 'vd',
      name: 'skew-y',
      accepts: 'raw',
      description: 'Sets vertical skew via --skew-y.',
      keywords: ['skew', 'y-axis', 'slant', 'angle', 'transform'],
    },
    {
      type: 'vd',
      name: 'transform',
      accepts: 'raw',
      description:
        'Sets a fully custom transform string via --transform. E.g. scale(1.5) rotate(45deg).',
      keywords: ['transform', 'custom', 'combined', 'matrix'],
    },
    {
      type: 'cc',
      name: 'transform-none',
      description: 'Resets all transform values.',
      keywords: ['transform', 'none', 'reset', 'identity'],
    },
    {
      type: 'co',
      name: 'transform-gpu',
      description:
        'Forces GPU acceleration via translateZ(0). Promotes element to its own compositor layer.',
      keywords: ['transform', 'gpu', 'acceleration', 'performance', 'compositing'],
    },
    {
      type: 'co',
      name: 'transform-cpu',
      description: 'Forces CPU processing. Opts out of GPU compositing.',
      keywords: ['transform', 'cpu', 'performance'],
    },
    {
      type: 'vd',
      name: 'origin',
      accepts: 'raw',
      description: 'Sets transform-origin via --origin. E.g. top left, 50% 50%.',
      keywords: ['transform-origin', 'pivot', 'anchor', 'origin', 'rotate'],
    },
    {
      type: 'vd',
      name: 'perspective',
      accepts: 'raw',
      description: 'Sets 3D perspective via --perspective. E.g. 1000px.',
      keywords: ['perspective', '3d', 'depth', 'transform', 'view'],
    },
    {
      type: 'cc',
      name: 'transform-3d',
      description: 'Sets transform-style: preserve-3d. Children are rendered in 3D space.',
      keywords: ['3d', 'transform', 'preserve', 'children', 'depth'],
    },
    {
      type: 'cc',
      name: 'transform-flat',
      description: "Sets transform-style: flat. Children are flattened into the element's plane.",
      keywords: ['transform', 'flat', '2d', 'style'],
    },
    {
      type: 'cc',
      name: 'backface-hidden',
      description: 'Sets backface-visibility: hidden. Hides the back face of flipped elements.',
      keywords: ['backface', 'visibility', 'flip', 'card', '3d', 'hidden'],
    },
    {
      type: 'cc',
      name: 'backface-visible',
      description: 'Sets backface-visibility: visible.',
      keywords: ['backface', 'visibility', '3d', 'visible'],
    },

    {
      type: 'co',
      name: 'perspective-dramatic',
      description: 'Applies a dramatic (very shallow) 3D perspective distance to child transforms.',
      keywords: ['perspective', 'transforms', '3d', 'dramatic'],
    },
    {
      type: 'co',
      name: 'perspective-near',
      description: 'Applies a near 3D perspective distance to child transforms.',
      keywords: ['perspective', 'transforms', '3d', 'near'],
    },
    {
      type: 'co',
      name: 'perspective-normal',
      description: 'Applies a normal (moderate) 3D perspective distance to child transforms.',
      keywords: ['perspective', 'transforms', '3d', 'normal'],
    },
    {
      type: 'co',
      name: 'perspective-midrange',
      description: 'Applies a midrange 3D perspective distance to child transforms.',
      keywords: ['perspective', 'transforms', '3d', 'midrange'],
    },
    {
      type: 'co',
      name: 'perspective-distant',
      description: 'Applies a distant (deep) 3D perspective distance to child transforms.',
      keywords: ['perspective', 'transforms', '3d', 'distant'],
    },
    {
      type: 'cc',
      name: 'perspective-none',
      description: 'Removes 3D perspective by setting perspective to none.',
      keywords: ['perspective', 'transforms', '3d', 'none'],
    },

    {
      type: 'vd',
      name: 'perspective-origin',
      description:
        'Sets the origin point for 3D perspective, changing the viewing angle of transformed children.',
      keywords: ['3d', 'perspective', 'origin', 'vanishing-point', 'transforms'],
    },

    {
      type: 'vd',
      name: 'rotate-z',
      description:
        'Rotates an element around the z-axis via --rotate-z, composing with other transform variables.',
      keywords: ['rotate', 'z-axis', 'transform', 'spin', 'transforms'],
    },
    {
      type: 'vd',
      name: 'scale-z',
      description:
        'Scales an element along the z-axis via --scale-z, composing with x/y scale variables.',
      keywords: ['scale', 'z-axis', '3d', 'depth', 'transforms'],
    },
    {
      type: 'vd',
      name: '[translate]',
      description:
        'Applies raw --translate directly to x/y translation. Use translate utilities for scaled movement when available.',
      keywords: ['translate', 'move', 'transform', 'raw', 'transforms'],
    },
    {
      type: 'vd',
      name: '[translate-x]',
      description: 'Applies raw --translate-x directly to horizontal translation.',
      keywords: ['translate', 'x', 'move', 'horizontal', 'raw'],
    },
    {
      type: 'vd',
      name: '[translate-y]',
      description: 'Applies raw --translate-y directly to vertical translation.',
      keywords: ['translate', 'y', 'move', 'vertical', 'raw'],
    },
    {
      type: 'vd',
      name: '[translate-z]',
      description:
        'Applies raw --translate-z directly to z-axis translation for 3D depth movement.',
      keywords: ['translate', 'z', '3d', 'depth', 'raw'],
    },

    {
      type: 'cc',
      name: 'rotate-none',
      description: 'Resets rotation by setting transform to none.',
      keywords: ['rotate', 'transform', 'reset', 'none'],
    },
    {
      type: 'cc',
      name: 'scale-none',
      description: 'Resets scaling by setting transform to none.',
      keywords: ['scale', 'transform', 'reset', 'none'],
    },
    {
      type: 'co',
      name: 'scale-3d',
      description: 'Applies x/y/z scale variables together as a 3D scale value.',
      keywords: ['scale', '3d', 'transform', 'depth'],
    },
    {
      type: 'cc',
      name: 'translate-none',
      description: 'Resets translation by setting the translate property to none.',
      keywords: ['translate', 'move', 'reset', 'none'],
    },
  ],
};
