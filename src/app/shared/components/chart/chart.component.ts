import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  afterNextRender,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

export interface ChartDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div class="chart-wrap"><canvas #canvas></canvas></div>`,
  styles: [`
    .chart-wrap {
      position: relative;
      width: 100%;
      height: 16rem;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
})
export class ChartComponent implements OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) type: ChartType = 'bar';
  @Input({ required: true }) data: ChartDatum[] = [];
  @Input() label = '';
  @Input() color = '#d97706';
  @Input() colors: string[] = ['#d97706', '#b45309', '#78350f', '#f59e0b', '#c2410c', '#92400e'];

  private chart: Chart | null = null;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    afterNextRender(() => this.render());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['type']) && this.chart) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.isBrowser || !this.canvas) return;

    this.chart?.destroy();

    const labels = this.data.map((d) => d.label);
    const values = this.data.map((d) => d.value);
    const isDoughnut = this.type === 'doughnut' || this.type === 'pie';

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels,
        datasets: [
          {
            label: this.label,
            data: values,
            backgroundColor: isDoughnut
              ? this.colors.slice(0, values.length)
              : this.withAlpha(this.color, 0.75),
            borderColor: isDoughnut ? this.colors.slice(0, values.length) : this.color,
            borderWidth: isDoughnut ? 0 : 2,
            borderRadius: isDoughnut ? 0 : 8,
            tension: 0.35,
            fill: this.type === 'line',
            pointRadius: this.type === 'line' ? 4 : 0,
            pointBackgroundColor: this.color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: isDoughnut,
            position: 'bottom',
            rtl: true,
            labels: {
              font: { family: 'Cairo', size: 12 },
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#44403c',
              usePointStyle: true,
              padding: 16,
            },
          },
          tooltip: {
            rtl: true,
            titleFont: { family: 'Cairo' },
            bodyFont: { family: 'Cairo' },
          },
        },
        scales: isDoughnut
          ? undefined
          : {
              x: {
                grid: { display: false },
                ticks: {
                  font: { family: 'Cairo', size: 11 },
                  color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#78716c',
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || 'rgba(0,0,0,0.06)',
                },
                ticks: {
                  font: { family: 'Cairo', size: 11 },
                  color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#78716c',
                },
              },
            },
      },
    };

    this.chart = new Chart(this.canvas.nativeElement, config);
  }

  private withAlpha(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
