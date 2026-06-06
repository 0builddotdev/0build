import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { type PropertyValues, html } from 'lit';
import ApexCharts, { type ApexAxisChartSeries, type ApexNonAxisChartSeries } from 'apexcharts';

interface Cls extends Record<string, string> {
  'host-inner': string;
  chart: string;
  loading: string;
  error: string;
}

interface Stl extends Record<string, string> {
  'host-inner': string;
  chart: string;
  loading: string;
  error: string;
}

interface I18n extends Record<string, string> {
  'chart-label': string;
  'loading-message': string;
  'error-message': string;
  'no-data-message': string;
}

@customElement('z-chart')
export class Chart extends Base {
  protected readonly 'cls-default-element': string = 'host-inner';

  protected readonly 'stl-default-element': string = 'host-inner';

  protected readonly defaultI18n: I18n = {
    'chart-label': 'Chart',
    'loading-message': 'Loading chart...',
    'error-message': 'Failed to load chart. Please try again.',
    'no-data-message': 'No data available',
  };

  @property({ type: Boolean })
  loading: boolean = false;

  @property({ type: String })
  width: string = '100%';

  @property({ type: String })
  height: string = 'auto';

  @state()
  protected hasError: boolean = false;

  @state()
  protected $cls: Cls = {
    'host-inner': '',
    chart: 'z-chart',
    loading: 'sr-only',
    error: 'sr-only',
  };

  @state()
  protected $stl: Stl = {
    'host-inner': '',
    chart: '',
    loading: '',
    error: '',
  };

  private apexCharts: ApexCharts | null = null;

  protected get $apexChartsConfig(): object {
    if ('apexCharts' in this.$config && typeof this.$config === 'object') {
      return (this.$config as { apexCharts: object }).apexCharts;
    }

    return {};
  }

  private hasValidConfig(): boolean {
    return Object.keys(this.$apexChartsConfig).length > 0;
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    if (!this.loading) {
      this.initializeApexCharts();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('loading') && !this.loading && !this.apexCharts) {
      this.initializeApexCharts();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.apexCharts) {
      this.apexCharts.destroy();
      this.apexCharts = null;
    }
  }

  protected onConfigChanged(): void {
    if (this.apexCharts && this.hasValidConfig()) {
      try {
        this.apexCharts.updateOptions(this.$apexChartsConfig, true, true);
        this.hasError = false;
      } catch (error) {
        console.error('z-chart: Failed to update chart:', error);
        this.hasError = true;
      }
    } else if (!this.apexCharts && this.hasValidConfig()) {
      this.initializeApexCharts();
    }
  }

  private async initializeApexCharts(): Promise<void> {
    const chartContainer = this.renderRoot.querySelector('[data-chart-container]');

    if (!chartContainer) {
      console.warn('z-chart: Chart container not found in render root');

      return;
    }

    if (!this.hasValidConfig()) {
      console.warn('z-chart: No valid chart configuration found');
      this.hasError = true;

      return;
    }

    if (this.apexCharts === null) {
      try {
        const config = {
          ...this.$apexChartsConfig,
          chart: {
            ...(this.$apexChartsConfig as any).chart,
            width: this.width,
            height: this.height,
          },
        };

        this.apexCharts = new ApexCharts(chartContainer as HTMLElement, config);

        await this.apexCharts.render();

        this.isRendered = true;
        this.hasError = false;
      } catch (error) {
        console.error('z-chart: Failed to initialize chart:', error);
        this.hasError = true;
      }
    }
  }

  private renderLoading() {
    const message = this.getI18nText('loading-message', this.defaultI18n);

    return html`
      <div
        class="${this.$cls['loading']}"
        style="${this.$stl['loading']}"
        data-part="loading"
        role="status"
        aria-live="polite"
        aria-label="${message}"
      >
        <span>${message}</span>
      </div>
    `;
  }

  private renderError() {
    const message = this.hasValidConfig()
      ? this.getI18nText('error-message', this.defaultI18n)
      : this.getI18nText('no-data-message', this.defaultI18n);

    return html`
      <div
        class="${this.$cls['error']}"
        style="${this.$stl['error']}"
        data-part="error"
        role="alert"
        aria-live="assertive"
      >
        <span>${message}</span>
      </div>
    `;
  }

  render() {
    const ariaLabel = this.getI18nText('chart-label', this.defaultI18n);

    return html`
      <div
        data-host-inner
        class="${this.$cls['host-inner']}"
        style="${this.$stl['host-inner']}"
        data-part="host-inner"
        role="img"
        aria-label="${ariaLabel}"
        data-loading="${this.loading}"
        data-error="${this.hasError}"
        data-rendered="${this.isRendered}"
      >
        ${this.loading
          ? this.renderLoading()
          : this.hasError
            ? this.renderError()
            : html`
                <div
                  data-chart-container
                  class="${this.$cls['chart']}"
                  style="${this.$stl['chart']}"
                  data-part="chart"
                ></div>
              `}
      </div>
    `;
  }

  public async updateChart(
    options: object,
    redrawPaths: boolean = true,
    animate: boolean = true,
  ): Promise<void> {
    if (this.apexCharts) {
      try {
        await this.apexCharts.updateOptions(options, redrawPaths, animate);
        this.hasError = false;
      } catch (error) {
        console.error('z-chart: Failed to update chart:', error);
        this.hasError = true;
        throw error;
      }
    } else {
      throw new Error('Chart not initialized');
    }
  }

  public async updateSeries(
    newSeries: ApexAxisChartSeries | ApexNonAxisChartSeries,
    animate: boolean = true,
  ): Promise<void> {
    if (this.apexCharts) {
      try {
        await this.apexCharts.updateSeries(newSeries, animate);
        this.hasError = false;
      } catch (error) {
        console.error('z-chart: Failed to update series:', error);
        this.hasError = true;
        throw error;
      }
    } else {
      throw new Error('Chart not initialized');
    }
  }

  public getChartInstance(): ApexCharts | null {
    return this.apexCharts;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'z-chart': Chart;
  }
}
