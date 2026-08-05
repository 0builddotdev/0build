export const COLORS = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone',
	'taupe',
	'mauve',
	'mist',
	'olive'
];

export const INTENSITIES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const COLOR_SUGGESTIONS = COLORS.flatMap((c) =>
	INTENSITIES.map((i) => `var(--color-${c}-${i})`)
);

export const BREAKPOINTS = {
	sm: '40rem',
	md: '48rem',
	lg: '64rem',
	xl: '80rem',
	'2xl': '96rem'
};

export const BREAKPOINT_KEYS = Object.keys(BREAKPOINTS);

export const PSEUDO_CLASSES = [
	':hover',
	':active',
	':focus',
	':focus-visible',
	':focus-within',
	':target',
	':checked',
	':disabled',
	':group-hover'
];

export const PSEUDO_ELEMENTS = ['::before', '::after'];

export const STATES = [...PSEUDO_CLASSES, ...PSEUDO_ELEMENTS];

export const BARE_STATE_LABELS = new Set(STATES.map((s) => s.replace(/^:+/, '')));
