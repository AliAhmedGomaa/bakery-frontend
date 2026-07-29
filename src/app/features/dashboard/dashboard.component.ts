import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GmnButtonComponent, GmnCardComponent } from '../../shared/components';
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

interface ProductionBatchRow {
  date?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GmnCardComponent, GmnButtonComponent, DecimalPipe, ChartComponent, FormsModule],
  template: `
    <div class="dash">
      <div class="dash__header">
        <div>
          <h1>{{ ar.dashboard.welcome }}، {{ auth.user()?.name }}</h1>
          <p>{{ ar.dashboard.subtitle }}</p>
        </div>

        <div class="dash__filters">
          <div class="dash__presets">
            <button type="button" class="dash__preset" (click)="setPreset('today')">{{ ar.dashboard.presetToday }}</button>
            <button type="button" class="dash__preset" (click)="setPreset('7')">{{ ar.dashboard.preset7 }}</button>
            <button type="button" class="dash__preset" (click)="setPreset('30')">{{ ar.dashboard.preset30 }}</button>
            <button type="button" class="dash__preset" (click)="setPreset('month')">{{ ar.dashboard.presetMonth }}</button>
          </div>
          <div class="dash__dates">
            <label>
              <span>{{ ar.dashboard.from }}</span>
              <input type="date" [(ngModel)]="fromDate" class="dash__date" />
            </label>
            <label>
              <span>{{ ar.dashboard.to }}</span>
              <input type="date" [(ngModel)]="toDate" class="dash__date" />
            </label>
            <gmn-button variant="primary" size="sm" [loading]="loading()" (clicked)="applyRange()">
              {{ ar.dashboard.apply }}
            </gmn-button>
          </div>
        </div>
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
    .dash__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.25rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
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
    .dash__filters {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }
    .dash__presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: flex-end;
    }
    .dash__preset {
      border: 1px solid var(--border-default);
      background: var(--bg-surface-container-high);
      color: var(--text-primary);
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .dash__preset:hover {
      border-color: var(--text-accent);
      color: var(--text-accent);
    }
    .dash__dates {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: end;
      justify-content: flex-end;
    }
    .dash__dates label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .dash__date {
      height: 2.5rem;
      padding: 0 0.75rem;
      border-radius: var(--radius-xl);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;
      min-width: 10rem;
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
      .dash__presets,
      .dash__dates {
        justify-content: flex-start;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  readonly ar = AR;

  fromDate = '';
  toDate = '';
  loading = signal(false);

  private batches = signal<ProductionBatchRow[]>([]);

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
    this.setPreset('7', false);
    this.api.get<{ currentStock: number; minStockAlert: number }[]>('/raw-materials').subscribe({
      next: (data) => {
        const low = data.filter((m) => m.currentStock <= m.minStockAlert).length;
        this.stats.update((s) => ({ ...s, lowStockCount: low }));
      },
    });
    this.api.get<ProductionBatchRow[]>('/production-batches').subscribe({
      next: (data) => {
        this.batches.set(data);
        this.updateBatchCount();
      },
    });
    this.applyRange();
  }

  setPreset(preset: 'today' | '7' | '30' | 'month', reload = true): void {
    const today = new Date();
    const to = this.formatDate(today);
    let from = to;

    if (preset === '7') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      from = this.formatDate(d);
    } else if (preset === '30') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      from = this.formatDate(d);
    } else if (preset === 'month') {
      from = this.formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }

    this.fromDate = from;
    this.toDate = to;
    if (reload) this.applyRange();
  }

  applyRange(): void {
    if (!this.fromDate || !this.toDate) return;
    if (this.fromDate > this.toDate) {
      const swap = this.fromDate;
      this.fromDate = this.toDate;
      this.toDate = swap;
    }

    this.loading.set(true);
    const params = { from: this.fromDate, to: this.toDate };

    this.api.get<{ totalSales: number; orderCount: number }>('/sales/stats/today', params).subscribe({
      next: (data) => {
        this.stats.update((s) => ({
          ...s,
          totalSales: data.totalSales,
          orderCount: data.orderCount,
        }));
        this.updateBatchCount();
      },
    });

    this.api.get<DashboardCharts>('/sales/stats/charts', params).subscribe({
      next: (data) => {
        this.charts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private updateBatchCount(): void {
    const from = this.fromDate;
    const to = this.toDate;
    const count = this.batches().filter((b) => {
      const raw = b.date || b.createdAt;
      if (!raw) return false;
      const key = this.formatDate(new Date(raw));
      return key >= from && key <= to;
    }).length;
    this.stats.update((s) => ({ ...s, batchCount: count }));
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
