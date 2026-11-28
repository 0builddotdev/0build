export type SlugOptions = {
  replacement: string;
  remove: undefined | RegExp;
  lower: boolean;
  strict: boolean;
  locale: string;
  trim: boolean;
};

const CHAR_MAP: Record<string, string> = {
  '&': ' and ',
  ß: 'ss',
  æ: 'ae',
  Æ: 'AE',
  œ: 'oe',
  Œ: 'OE',
  ø: 'o',
  Ø: 'O',
  đ: 'd',
  Đ: 'D',
  ł: 'l',
  Ł: 'L',
  þ: 'th',
  Þ: 'TH',
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slugify(input: string, options: Partial<SlugOptions> = {}): string {
  const {
    replacement = '-',
    remove,
    lower = true,
    strict = false,
    trim = true,
  } = options;

  let slug = input
    .replace(/[&ßæÆœŒøØđĐłŁþÞ]/g, (ch) => CHAR_MAP[ch] ?? ch)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  if (remove) {
    slug = slug.replace(remove, '');
  }

  slug = slug.replace(strict ? /[^\w\s-]/g : /[^\w\s$*_+~.()'"!\-:@]/g, '');

  if (trim) {
    slug = slug.trim();
  }

  slug = slug.replace(/[-\s]+/g, replacement);

  if (trim && replacement) {
    const escaped = escapeRegExp(replacement);
    slug = slug.replace(new RegExp(`^${escaped}+|${escaped}+$`, 'g'), '');
  }

  return lower ? slug.toLowerCase() : slug;
}
