export function validateDate(value: string): Date {
  const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

  if (!datePattern.test(value)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD or YYYY-MM-DDTHH:MM');
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  return date;
}

export function validateTime(value: string): string {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timePattern.test(value)) {
    throw new Error('Invalid time format. Use HH:MM (24-hour format)');
  }

  return value;
}

export interface DateLocales {
  months: string[];
  weekdays: string[];
}

export function formatDate(date: Date, format: string, lang: string = 'en-US'): string {
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) {
      return 'th';
    }

    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const monthFormatter = new Intl.DateTimeFormat(lang, { month: 'long' });
  const shortMonthFormatter = new Intl.DateTimeFormat(lang, { month: 'short' });
  const weekdayFormatter = new Intl.DateTimeFormat(lang, { weekday: 'long' });
  const shortWeekdayFormatter = new Intl.DateTimeFormat(lang, {
    weekday: 'short',
  });

  const formatTokens: Record<string, () => string> = {
    YYYY: () => date.getFullYear().toString(),
    YY: () => (date.getFullYear() % 100).toString().padStart(2, '0'),

    MMMM: () => monthFormatter.format(date),
    MMM: () => shortMonthFormatter.format(date),
    MM: () => (date.getMonth() + 1).toString().padStart(2, '0'),
    M: () => (date.getMonth() + 1).toString(),

    dddd: () => weekdayFormatter.format(date),
    ddd: () => shortWeekdayFormatter.format(date),
    Do: () => date.getDate() + (lang.startsWith('en') ? getOrdinalSuffix(date.getDate()) : ''),
    DD: () => date.getDate().toString().padStart(2, '0'),
    D: () => date.getDate().toString(),

    HH: () => date.getHours().toString().padStart(2, '0'),
    H: () => date.getHours().toString(),

    hh: () => {
      const hour12 = date.getHours() % 12 || 12;

      return hour12.toString().padStart(2, '0');
    },
    h: () => (date.getHours() % 12 || 12).toString(),

    mm: () => date.getMinutes().toString().padStart(2, '0'),
    m: () => date.getMinutes().toString(),

    A: () => (date.getHours() >= 12 ? 'PM' : 'AM'),
    a: () => (date.getHours() >= 12 ? 'pm' : 'am'),
  };

  const tokenKeys = Object.keys(formatTokens).sort((a, b) => b.length - a.length);
  const tokenPattern = new RegExp(tokenKeys.join('|'), 'g');

  return format.replace(tokenPattern, match => formatTokens[match]());
}

export function parseDateString(dateString: string): Date {
  if (dateString.includes('T')) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
  } else {
    const [year, month, day] = dateString.split('-').map(Number);

    return new Date(year, month - 1, day);
  }
}
