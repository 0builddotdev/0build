export function validateHex(hex: string): string | undefined {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  return hexPattern.test(hex) ? hex : undefined;
}

export function validateSize(size: string): string | undefined {
  const sizePattern = /^(\d*\.?\d+)(px|cm|mm|in|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/;

  return sizePattern.test(size) ? size : undefined;
}

export function validateBorderStyle(style: string): string | undefined {
  const validStyles = [
    'none',
    'hidden',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ];

  return validStyles.includes(style) ? style : undefined;
}

export function validateDuration(duration: string): string | undefined {
  const durationPattern = /^(\d*\.?\d+)(ms|s)$/;

  return durationPattern.test(duration) ? duration : undefined;
}

export function randomString(length = 5): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length)),
  ).join('');
}

export function titleCase(str: string): string {
  return str
    ? str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';
}
