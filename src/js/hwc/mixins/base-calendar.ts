import { property } from 'lit/decorators.js';
import { validateDate } from '../../shared/helpers/date';
import { svgIcon } from '$js/shared/helpers/svg';
import type { InputMixin } from './input';

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export const BaseCalendarMixin = <
  TBase extends Constructor<InstanceType<ReturnType<typeof InputMixin>>>,
>(
  BaseClass: TBase,
) => {
  abstract class BaseCalendar extends BaseClass {
    @property({ type: Boolean })
    today: boolean = false;

    @property({ type: Boolean })
    jumpable: boolean = false;

    @property({ type: Number })
    'starts-with' = 0;

    @property({ type: String })
    'disabled-dates': string = '';

    @property({ type: String })
    'marked-dates': string = '';

    @property({ type: String })
    'view-date': string = new Date().toISOString().split('T')[0];

    @property({ type: String })
    min: string = '';

    @property({ type: String })
    max: string = '';

    @property({ type: String })
    'weekday-format': 'long' | 'short' | 'narrow' = 'short';

    @property({ type: String })
    lang: string = 'en-us';

    protected isDirty = false;

    protected get $viewDate(): Date {
      const [year, month, day] = this['view-date'].split('-').map(Number);

      return this.createUTCDate(year, month - 1, day);
    }

    protected createUTCDate(year: number, month: number, day: number): Date {
      return new Date(Date.UTC(year, month, day));
    }

    protected dateToUTC(date: Date): Date {
      return this.createUTCDate(date.getFullYear(), date.getMonth(), date.getDate());
    }

    protected getTodayUTC(): Date {
      return this.dateToUTC(new Date());
    }

    protected getUTCDate(date: Date): Date {
      return this.dateToUTC(date);
    }

    protected isDateInRange(date: string): boolean {
      if (!this.min && !this.max) {
        return true;
      }

      const current = new Date(date);

      if (this.min) {
        const minDate = validateDate(this.min);

        if (current < minDate) {
          return false;
        }
      }

      if (this.max) {
        const maxDate = validateDate(this.max);

        maxDate.setDate(maxDate.getDate() + 1);

        if (current >= maxDate) {
          return false;
        }
      }

      return true;
    }

    protected parseDates(dates: string): string[] {
      if (!dates) {
        return [];
      }

      return dates
        .split(',')
        .map(d => d.trim())
        .filter(Boolean)
        .map(date => {
          try {
            return validateDate(date).toISOString().slice(0, 10);
          } catch {
            console.warn(`[z-calendar] Invalid date format in list: "${date}".`);

            return '';
          }
        })
        .filter(Boolean);
    }

    protected getTimestampComponent(date: Date): {
      year: number;
      month: number;
      monthName: string;
      day: number;
      dayName: string;
      ISOString: string;
    } {
      const locale = this.lang || undefined;

      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        monthName: date.toLocaleDateString(locale, {
          month: 'long',
          timeZone: 'UTC',
        }),
        day: date.getUTCDate(),
        dayName: date.toLocaleDateString(locale, {
          weekday: 'long',
          timeZone: 'UTC',
        }),
        ISOString: date.toISOString(),
      };
    }

    protected $icons(icon: string) {
      const customIcon = super.$icons(icon);

      if (customIcon) {
        return customIcon;
      }

      return icon === 'chevron-left' || icon === 'chevron-right' || icon === 'calendar'
        ? svgIcon(icon)
        : undefined;
    }

    protected abstract initializeValue(): void;
  }

  return BaseCalendar;
};
