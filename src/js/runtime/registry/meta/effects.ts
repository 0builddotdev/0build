export default {
  text: 'Effects',
  items: [
    {
      type: 'vd',
      name: 'opacity',
      accepts: 'raw',
      description: 'Sets element opacity via --opacity. E.g. 0.5, 0.75.',
      keywords: ['opacity', 'transparent', 'alpha', 'fade'],
    },
    {
      type: 'vd',
      name: 'shadow',
      accepts: 'raw',
      description: 'Sets box-shadow via --shadow. Full shadow definition string.',
      keywords: ['shadow', 'box-shadow', 'depth', 'elevation'],
    },
    {
      type: 'vd',
      name: 'shadow/o',
      accepts: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      description: 'Sets shadow color + opacity via --shadow and --shadow-o.',
      keywords: ['shadow', 'color', 'opacity', 'alpha'],
    },
    {
      type: 'co',
      name: 'shadow-sm',
      description: 'Applies a small box-shadow preset.',
      keywords: ['shadow', 'small', 'subtle', 'elevation'],
    },
    {
      type: 'co',
      name: 'shadow-md',
      description: 'Applies a medium box-shadow preset.',
      keywords: ['shadow', 'medium', 'elevation'],
    },
    {
      type: 'co',
      name: 'shadow-lg',
      description: 'Applies a large box-shadow preset.',
      keywords: ['shadow', 'large', 'elevation', 'depth'],
    },
    {
      type: 'co',
      name: 'shadow-xl',
      description: 'Applies an extra-large box-shadow preset.',
      keywords: ['shadow', 'xl', 'elevation', 'depth', 'float'],
    },
    {
      type: 'cc',
      name: 'shadow-none',
      description: 'Removes box-shadow.',
      keywords: ['shadow', 'none', 'flat', 'remove'],
    },
    {
      type: 'vd',
      name: 'ring',
      accepts: 'color-mix',
      description: 'Sets focus ring color via --ring. Width defaults to 1px.',
      keywords: ['ring', 'focus', 'outline', 'color', 'accessibility'],
    },
    {
      type: 'vd',
      name: 'ring/o',
      accepts: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      description: 'Sets ring color + opacity via --ring and --ring-o.',
      keywords: ['ring', 'focus', 'color', 'opacity', 'alpha'],
    },
    {
      type: 'vd',
      name: 'ring-w',
      accepts: 'raw',
      description: 'Sets ring width via --ring-w. Raw value (e.g. 2px).',
      keywords: ['ring', 'width', 'thickness', 'focus'],
    },
    {
      type: 'vd',
      name: 'inset-ring',
      accepts: 'color-mix',
      description: 'Sets an inset ring color via --inset-ring.',
      keywords: ['ring', 'inset', 'inner', 'color', 'focus'],
    },
    {
      type: 'vd',
      name: 'inset-ring-w',
      accepts: 'raw',
      description: 'Sets inset ring width via --inset-ring-w. Raw value.',
      keywords: ['ring', 'inset', 'width', 'thickness'],
    },
    {
      type: 'cc',
      name: 'mix-blend-multiply',
      description: 'Sets mix-blend-mode: multiply.',
      keywords: ['blend', 'mix', 'multiply', 'layer', 'effect'],
    },
    {
      type: 'cc',
      name: 'mix-blend-screen',
      description: 'Sets mix-blend-mode: screen.',
      keywords: ['blend', 'mix', 'screen', 'layer', 'effect'],
    },
    {
      type: 'cc',
      name: 'mix-blend-overlay',
      description: 'Sets mix-blend-mode: overlay.',
      keywords: ['blend', 'mix', 'overlay', 'layer', 'effect'],
    },
    {
      type: 'cc',
      name: 'mix-blend-darken',
      description: 'Sets mix-blend-mode: darken.',
      keywords: ['blend', 'mix', 'darken', 'dark', 'effect'],
    },
    {
      type: 'cc',
      name: 'mix-blend-lighten',
      description: 'Sets mix-blend-mode: lighten.',
      keywords: ['blend', 'mix', 'lighten', 'light', 'effect'],
    },
    {
      type: 'cc',
      name: 'mix-blend-difference',
      description: 'Sets mix-blend-mode: difference.',
      keywords: ['blend', 'mix', 'difference', 'invert', 'effect'],
    },
    {
      type: 'cc',
      name: 'bg-blend-multiply',
      description: 'Sets background-blend-mode: multiply.',
      keywords: ['background', 'blend', 'multiply', 'image', 'effect'],
    },
    {
      type: 'cc',
      name: 'bg-blend-overlay',
      description: 'Sets background-blend-mode: overlay.',
      keywords: ['background', 'blend', 'overlay', 'image', 'effect'],
    },

    {
      type: 'cc',
      name: 'scheme-normal',
      description: 'Sets color-scheme to normal, letting the browser choose the rendering scheme.',
      keywords: ['color-scheme', 'effects', 'normal', 'theme'],
    },
    {
      type: 'cc',
      name: 'scheme-dark',
      description:
        'Sets color-scheme to dark, hinting the browser to render UI controls with a dark theme.',
      keywords: ['color-scheme', 'effects', 'dark', 'theme'],
    },
    {
      type: 'cc',
      name: 'scheme-light',
      description:
        'Sets color-scheme to light, hinting the browser to render UI controls with a light theme.',
      keywords: ['color-scheme', 'effects', 'light', 'theme'],
    },
    {
      type: 'cc',
      name: 'scheme-light-dark',
      description: 'Sets color-scheme to light dark, allowing the browser to pick either scheme.',
      keywords: ['color-scheme', 'effects', 'light', 'dark', 'theme'],
    },
    {
      type: 'cc',
      name: 'scheme-only-dark',
      description: 'Sets color-scheme to only dark, forcing the dark rendering scheme.',
      keywords: ['color-scheme', 'effects', 'dark', 'forced', 'theme'],
    },
    {
      type: 'cc',
      name: 'scheme-only-light',
      description: 'Sets color-scheme to only light, forcing the light rendering scheme.',
      keywords: ['color-scheme', 'effects', 'light', 'forced', 'theme'],
    },
    {
      type: 'cc',
      name: 'forced-color-adjust-auto',
      description:
        "Sets forced-color-adjust to auto, allowing forced-colors mode (e.g. high-contrast) to override the element's colors.",
      keywords: ['forced-color-adjust', 'effects', 'accessibility', 'auto', 'contrast'],
    },
    {
      type: 'cc',
      name: 'forced-color-adjust-none',
      description:
        'Sets forced-color-adjust to none, opting the element out of forced-colors mode overrides.',
      keywords: ['forced-color-adjust', 'effects', 'accessibility', 'none', 'contrast'],
    },
    {
      type: 'cc',
      name: 'mask-clip-border',
      description: "Sets mask-clip to border-box, clipping the mask at the element's border edge.",
      keywords: ['mask', 'clip', 'effects', 'border-box'],
    },
    {
      type: 'cc',
      name: 'mask-clip-padding',
      description:
        "Sets mask-clip to padding-box, clipping the mask at the element's padding edge.",
      keywords: ['mask', 'clip', 'effects', 'padding-box'],
    },
    {
      type: 'cc',
      name: 'mask-clip-content',
      description:
        "Sets mask-clip to content-box, clipping the mask at the element's content edge.",
      keywords: ['mask', 'clip', 'effects', 'content-box'],
    },
    {
      type: 'cc',
      name: 'mask-clip-fill',
      description: "Sets mask-clip to fill-box, clipping the mask to the SVG object's fill area.",
      keywords: ['mask', 'clip', 'effects', 'fill-box', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-clip-stroke',
      description:
        "Sets mask-clip to stroke-box, clipping the mask to the SVG object's stroke area.",
      keywords: ['mask', 'clip', 'effects', 'stroke-box', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-clip-view',
      description: 'Sets mask-clip to view-box, clipping the mask to the SVG viewport.',
      keywords: ['mask', 'clip', 'effects', 'view-box', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-no-clip',
      description: 'Sets mask-clip to no-clip, disabling clipping of the mask painting area.',
      keywords: ['mask', 'clip', 'effects', 'no-clip'],
    },
    {
      type: 'cc',
      name: 'mask-add',
      description:
        'Sets mask-composite to add, combining this mask layer additively with layers below it.',
      keywords: ['mask', 'composite', 'effects', 'add'],
    },
    {
      type: 'cc',
      name: 'mask-subtract',
      description:
        "Sets mask-composite to subtract, removing this mask layer's area from layers below it.",
      keywords: ['mask', 'composite', 'effects', 'subtract'],
    },
    {
      type: 'cc',
      name: 'mask-intersect',
      description:
        'Sets mask-composite to intersect, keeping only the overlapping area between mask layers.',
      keywords: ['mask', 'composite', 'effects', 'intersect'],
    },
    {
      type: 'cc',
      name: 'mask-exclude',
      description:
        'Sets mask-composite to exclude, keeping only the non-overlapping area between mask layers.',
      keywords: ['mask', 'composite', 'effects', 'exclude'],
    },
    {
      type: 'cc',
      name: 'mask-alpha',
      description:
        "Sets mask-mode to alpha, using the mask layer's alpha channel to determine visibility.",
      keywords: ['mask', 'mode', 'effects', 'alpha'],
    },
    {
      type: 'cc',
      name: 'mask-luminance',
      description:
        "Sets mask-mode to luminance, using the mask layer's luminance values to determine visibility.",
      keywords: ['mask', 'mode', 'effects', 'luminance'],
    },
    {
      type: 'cc',
      name: 'mask-match',
      description:
        'Sets mask-mode to match-source, using the natural mask type of the source (luminance for images, alpha for others).',
      keywords: ['mask', 'mode', 'effects', 'match-source'],
    },
    {
      type: 'cc',
      name: 'mask-origin-border',
      description:
        'Sets mask-origin to border-box, positioning the mask relative to the border edge.',
      keywords: ['mask', 'origin', 'effects', 'border-box'],
    },
    {
      type: 'cc',
      name: 'mask-origin-padding',
      description:
        'Sets mask-origin to padding-box, positioning the mask relative to the padding edge.',
      keywords: ['mask', 'origin', 'effects', 'padding-box'],
    },
    {
      type: 'cc',
      name: 'mask-origin-content',
      description:
        'Sets mask-origin to content-box, positioning the mask relative to the content edge.',
      keywords: ['mask', 'origin', 'effects', 'content-box'],
    },
    {
      type: 'cc',
      name: 'mask-origin-fill',
      description:
        "Sets mask-origin to fill-box, positioning the mask relative to the SVG object's fill area.",
      keywords: ['mask', 'origin', 'effects', 'fill-box', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-origin-stroke',
      description:
        "Sets mask-origin to stroke-box, positioning the mask relative to the SVG object's stroke area.",
      keywords: ['mask', 'origin', 'effects', 'stroke-box', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-origin-view',
      description:
        'Sets mask-origin to view-box, positioning the mask relative to the SVG viewport.',
      keywords: ['mask', 'origin', 'effects', 'view-box', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-repeat',
      description: 'Sets mask-repeat to repeat, tiling the mask image in both directions.',
      keywords: ['mask', 'repeat', 'effects', 'tile'],
    },
    {
      type: 'cc',
      name: 'mask-no-repeat',
      description: 'Sets mask-repeat to no-repeat, showing the mask image only once.',
      keywords: ['mask', 'repeat', 'effects', 'no-repeat'],
    },
    {
      type: 'cc',
      name: 'mask-repeat-x',
      description: 'Sets mask-repeat to repeat-x, tiling the mask image horizontally only.',
      keywords: ['mask', 'repeat', 'effects', 'horizontal'],
    },
    {
      type: 'cc',
      name: 'mask-repeat-y',
      description: 'Sets mask-repeat to repeat-y, tiling the mask image vertically only.',
      keywords: ['mask', 'repeat', 'effects', 'vertical'],
    },
    {
      type: 'cc',
      name: 'mask-repeat-space',
      description:
        'Sets mask-repeat to space, tiling the mask image with even spacing between repeats.',
      keywords: ['mask', 'repeat', 'effects', 'space'],
    },
    {
      type: 'cc',
      name: 'mask-repeat-round',
      description:
        'Sets mask-repeat to round, tiling the mask image and stretching repeats to fit evenly.',
      keywords: ['mask', 'repeat', 'effects', 'round'],
    },
    {
      type: 'cc',
      name: 'mask-type-alpha',
      description:
        'Sets mask-type to alpha for an SVG mask element, using alpha values to determine visibility.',
      keywords: ['mask', 'type', 'effects', 'alpha', 'svg'],
    },
    {
      type: 'cc',
      name: 'mask-type-luminance',
      description:
        'Sets mask-type to luminance for an SVG mask element, using luminance values to determine visibility.',
      keywords: ['mask', 'type', 'effects', 'luminance', 'svg'],
    },
    {
      type: 'cc',
      name: 'mix-blend-normal',
      description: "Sets mix-blend-mode to normal, disabling blending with the element's backdrop.",
      keywords: ['mix-blend-mode', 'effects', 'normal'],
    },
    {
      type: 'cc',
      name: 'mix-blend-color-dodge',
      description: 'Blends the element with its backdrop using the color-dodge blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'color-dodge'],
    },
    {
      type: 'cc',
      name: 'mix-blend-color-burn',
      description: 'Blends the element with its backdrop using the color-burn blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'color-burn'],
    },
    {
      type: 'cc',
      name: 'mix-blend-hard-light',
      description: 'Blends the element with its backdrop using the hard-light blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'hard-light'],
    },
    {
      type: 'cc',
      name: 'mix-blend-soft-light',
      description: 'Blends the element with its backdrop using the soft-light blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'soft-light'],
    },
    {
      type: 'cc',
      name: 'mix-blend-exclusion',
      description: 'Blends the element with its backdrop using the exclusion blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'exclusion'],
    },
    {
      type: 'cc',
      name: 'mix-blend-hue',
      description: 'Blends the element with its backdrop using the hue blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'hue'],
    },
    {
      type: 'cc',
      name: 'mix-blend-saturation',
      description: 'Blends the element with its backdrop using the saturation blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'saturation'],
    },
    {
      type: 'cc',
      name: 'mix-blend-color',
      description: 'Blends the element with its backdrop using the color blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'color'],
    },
    {
      type: 'cc',
      name: 'mix-blend-luminosity',
      description: 'Blends the element with its backdrop using the luminosity blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'luminosity'],
    },
    {
      type: 'cc',
      name: 'mix-blend-plus-darker',
      description: 'Blends the element with its backdrop using the plus-darker blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'plus-darker'],
    },
    {
      type: 'cc',
      name: 'mix-blend-plus-lighter',
      description: 'Blends the element with its backdrop using the plus-lighter blend mode.',
      keywords: ['mix-blend-mode', 'effects', 'plus-lighter'],
    },
    {
      type: 'cc',
      name: 'mask-top-left',
      description: 'Positions the mask image at the top-left corner via mask-position.',
      keywords: ['mask', 'position', 'effects', 'top-left'],
    },
    {
      type: 'cc',
      name: 'mask-top',
      description: 'Positions the mask image at the top-center via mask-position.',
      keywords: ['mask', 'position', 'effects', 'top'],
    },
    {
      type: 'cc',
      name: 'mask-top-right',
      description: 'Positions the mask image at the top-right corner via mask-position.',
      keywords: ['mask', 'position', 'effects', 'top-right'],
    },
    {
      type: 'cc',
      name: 'mask-left',
      description: 'Positions the mask image at the center-left via mask-position.',
      keywords: ['mask', 'position', 'effects', 'left'],
    },
    {
      type: 'cc',
      name: 'mask-center',
      description: 'Positions the mask image at the center via mask-position.',
      keywords: ['mask', 'position', 'effects', 'center'],
    },
    {
      type: 'cc',
      name: 'mask-right',
      description: 'Positions the mask image at the center-right via mask-position.',
      keywords: ['mask', 'position', 'effects', 'right'],
    },
    {
      type: 'cc',
      name: 'mask-bottom-left',
      description: 'Positions the mask image at the bottom-left corner via mask-position.',
      keywords: ['mask', 'position', 'effects', 'bottom-left'],
    },
    {
      type: 'cc',
      name: 'mask-bottom',
      description: 'Positions the mask image at the bottom-center via mask-position.',
      keywords: ['mask', 'position', 'effects', 'bottom'],
    },
    {
      type: 'cc',
      name: 'mask-bottom-right',
      description: 'Positions the mask image at the bottom-right corner via mask-position.',
      keywords: ['mask', 'position', 'effects', 'bottom-right'],
    },
    {
      type: 'cc',
      name: 'mask-auto',
      description: 'Sets mask-size to auto, rendering the mask image at its natural size.',
      keywords: ['mask', 'size', 'effects', 'auto'],
    },
    {
      type: 'cc',
      name: 'mask-cover',
      description: 'Sets mask-size to cover, scaling the mask image to fully cover the element.',
      keywords: ['mask', 'size', 'effects', 'cover'],
    },
    {
      type: 'cc',
      name: 'mask-contain',
      description:
        'Sets mask-size to contain, scaling the mask image to fit fully within the element.',
      keywords: ['mask', 'size', 'effects', 'contain'],
    },

    {
      type: 'vd',
      name: 'mask-position',
      description: 'Positions the mask layer that controls which parts of an element are visible.',
      keywords: ['mask', 'position', 'reveal', 'effects', 'visibility'],
    },
    {
      type: 'vd',
      name: 'mask-size',
      description: 'Scales the mask layer that controls which parts of an element are visible.',
      keywords: ['mask', 'size', 'reveal', 'effects', 'visibility'],
    },

    {
      type: 'vd',
      name: '[shadow]',
      description: 'Applies raw --shadow directly to box-shadow. Supports dark mode.',
      keywords: ['shadow', 'box-shadow', 'elevation', 'depth', 'raw'],
    },
    {
      type: 'vd',
      name: 'inset-ring/o',
      accepts: 'numeric',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      description:
        'Adds a 1px inset ring and sets its color + opacity via --inset-ring and --inset-ring-o.',
      keywords: ['ring', 'inset', 'outline', 'focus', 'opacity'],
    },

    {
      type: 'co',
      name: 'shadow-2xs',
      description: 'Defines an ultra-subtle shadow token via --tw-shadow for very low elevation.',
      keywords: ['shadow', 'elevation', 'depth', '2xs', 'subtle'],
    },
    {
      type: 'co',
      name: 'shadow-xs',
      description: 'Defines an extra-small shadow token via --tw-shadow for low elevation.',
      keywords: ['shadow', 'elevation', 'depth', 'xs', 'subtle'],
    },
  ],
};
