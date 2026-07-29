import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GmnCardComponent } from '../../shared/components';
import { ChartComponent, ChartDatum } from '../../shared/components/chart/chart.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { AR } from '../../core/i18n/ar';

interface DashboardStats {
  totalSales: number;
  orderCount: number;
  batchCount: number;
  lowStockCount: number;
}

interface DashboardCharts {
  salesByDay: ChartDatum[];
  orderCountByDay: ChartDatum[];
  salesByCategory: ChartDatum[];
  topProducts: ChartDatum[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GmnCardComponent, DecimalPipe, ChartComponent],
  template: `
    <div class="dash">
      <div class="dash__header">
        <h1>{{ ar.dashboard.welcome }}، {{ auth.user()?.name }}</h1>
        <p>{{ ar.dashboard.subtitle }}</p>
      </div>

      <div class="dash__grid">
        <gmn-card variant="glass">
          <p class="kpi-label">{{ ar.dashboard.todaySales }}</p>
          <p class="kpi-value">{{ ar.dashboard.currency }} {{ stats().totalSales | number:'1.0-0' }}</p>
        </gmn-card>
        <gmn-card variant="glass">
          <p class="kpi-label">{{ ar.dashboard.orders }}</p>
          <p class="kpi-value">{{ stats().orderCount }}</p>
        </gmn-card>
        <gmn-card variant="glass">
          <p class="kpi-label">{{ ar.dashboard.batches }}</p>
          <p class="kpi-value">{{ stats().batchCount }}</p>
        </gmn-card>
        <gmn-card variant="glass">
          <p class="kpi-label">{{ ar.dashboard.lowStock }}</p>
          <p class="kpi-value">{{ stats().lowStockCount }}</p>
        </gmn-card>
      </div>

      <div class="dash__charts">
        <gmn-card>
          <h3 class="chart-title">{{ ar.dashboard.salesTrend }}</h3>
          <app-chart
            type="line"
            [label]="ar.dashboard.todaySales"
            [data]="charts().salesByDay"
            color="#d97706"
          />
        </gmn-card>

        <gmn-card>
          <h3 class="chart-title">{{ ar.dashboard.ordersTrend }}</h3>
          <app-chart
            type="bar"
            [label]="ar.dashboard.orders"
            [data]="charts().orderCountByDay"
            color="#b45309"
          />
        </gmn-card>

        <gmn-card>
          <h3 class="chart-title">{{ ar.dashboard.byCategory }}</h3>
          <app-chart
            type="doughnut"
            [data]="charts().salesByCategory"
          />
        </gmn-card>

        <gmn-card>
          <h3 class="chart-title">{{ ar.dashboard.topProducts }}</h3>
          <app-chart
            type="bar"
            [label]="ar.dashboard.topProducts"
            [data]="charts().topProducts"
            color="#78350f"
          />
        </gmn-card>
      </div>
    </div>
  `,
  styles: [`
    .dash__header { margin-bottom: 2rem; }
    .dash__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .dash__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .dash__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-label {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .kpi-value {
      margin: 0.5rem 0 0;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .dash__charts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }
    .chart-title {
      margin: 0 0 1rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    @media (max-width: 960px) {
      .dash__charts {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  readonly ar = AR;

  stats = signal<DashboardStats>({
    totalSales: 0,
    orderCount: 0,
    batchCount: 0,
    lowStockCount: 0,
  });

  charts = signal<DashboardCharts>({
    salesByDay: [],
    orderCountByDay: [],
    salesByCategory: [],
    topProducts: [],
  });

  ngOnInit(): void {
    this.api.get<{ totalSales: number; orderCount: number }>('/sales/stats/today').subscribe({
      next: (data) => this.stats.update((s) => ({ ...s, totalSales: data.totalSales, orderCount: data.orderCount })),
    });
    this.api.get<unknown[]>('/production-batches').subscribe({
      next: (data) => this.stats.update((s) => ({ ...s, batchCount: data.length })),
    });
    this.api.get<{ currentStock: number; minStockAlert: number }[]>('/raw-materials').subscribe({
      next: (data) => {
        const low = data.filter((m) => m.currentStock <= m.minStockAlert).length;
        this.stats.update((s) => ({ ...s, lowStockCount: low }));
      },
    });
    this.api.get<DashboardCharts>('/sales/stats/charts').subscribe({
      next: (data) => this.charts.set(data),
    });
  }
}
