import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GmnBadgeComponent,
  GmnButtonComponent,
  GmnCardComponent,
  GmnInputComponent,
  GmnModalComponent,
  GmnTableComponent,
  GmnTableColumn,
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { MaterialUnit, RawMaterial } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    GmnCardComponent,
    GmnButtonComponent,
    GmnInputComponent,
    GmnBadgeComponent,
    GmnModalComponent,
    GmnTableComponent,
  ],
  template: `
    <div class="inventory">
      <div class="inventory__header">
        <div>
          <h1>{{ ar.inventory.title }}</h1>
          <p>{{ ar.inventory.subtitle }}</p>
        </div>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.inventory.addMaterial }}</gmn-button>
      </div>

      <div class="inventory__kpis">
        <gmn-card variant="glass">
          <p class="kpi-label">{{ ar.inventory.totalMaterials }}</p>
          <p class="kpi-value">{{ materials().length }}</p>
        </gmn-card>
        <gmn-card variant="glass">
          <p class="kpi-label">{{ ar.inventory.lowStock }}</p>
          <p class="kpi-value">{{ lowStockCount() }}</p>
        </gmn-card>
      </div>

      <gmn-card [noPadding]="true">
        <gmn-table [columns]="columns" [data]="tableData()">
          <ng-template #cell let-row let-col="column">
            @if (col.key === 'name') {
              <strong>{{ row['name'] }}</strong>
            } @else if (col.key === 'unit') {
              {{ unitLabel(row['unit']) }}
            } @else if (col.key === 'currentStock') {
              {{ row['currentStock'] | number:'1.0-2' }}
            } @else if (col.key === 'minStockAlert') {
              {{ row['minStockAlert'] | number:'1.0-2' }}
            } @else if (col.key === 'costPerUnit') {
              {{ ar.dashboard.currency }} {{ row['costPerUnit'] | number:'1.2-2' }}
            } @else if (col.key === 'status') {
              @if (row['isLow']) {
                <gmn-badge variant="danger" [dot]="true">{{ ar.inventory.low }}</gmn-badge>
              } @else {
                <gmn-badge variant="success" [dot]="true">{{ ar.inventory.ok }}</gmn-badge>
              }
            } @else {
              {{ row[col.key] }}
            }
          </ng-template>
        </gmn-table>
      </gmn-card>
    </div>

    <gmn-modal
      [open]="showModal()"
      [title]="ar.inventory.addMaterial"
      size="md"
      (closed)="showModal.set(false)"
    >
      <div class="material-form">
        <gmn-input [label]="ar.inventory.name" [(ngModel)]="form.name" />
        <div class="material-form__field">
          <label>{{ ar.inventory.unit }}</label>
          <select [(ngModel)]="form.unit" class="material-form__select">
            @for (unit of units; track unit) {
              <option [value]="unit">{{ unitLabel(unit) }}</option>
            }
          </select>
        </div>
        <div class="material-form__row">
          <gmn-input [label]="ar.inventory.stock" type="number" [(ngModel)]="form.currentStock" />
          <gmn-input [label]="ar.inventory.minAlert" type="number" [(ngModel)]="form.minStockAlert" />
        </div>
        <gmn-input [label]="ar.inventory.cost" type="number" [(ngModel)]="form.costPerUnit" />
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.inventory.save }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .inventory__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .inventory__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .inventory__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .inventory__kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
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
    .material-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      direction: rtl;
    }
    .material-form__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .material-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .material-form__select {
      width: 100%;
      height: 2.75rem;
      padding: 0 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;
      direction: rtl;
      text-align: right;
    }
  `],
})
export class InventoryComponent implements OnInit {
  private api = inject(ApiService);
  readonly ar = AR;
  readonly units = Object.values(MaterialUnit);

  materials = signal<RawMaterial[]>([]);
  showModal = signal(false);
  saving = signal(false);

  form = {
    name: '',
    unit: MaterialUnit.KG,
    currentStock: 0,
    minStockAlert: 0,
    costPerUnit: 0,
  };

  columns: GmnTableColumn[] = [
    { key: 'name', label: AR.inventory.name },
    { key: 'unit', label: AR.inventory.unit },
    { key: 'currentStock', label: AR.inventory.stock },
    { key: 'minStockAlert', label: AR.inventory.minAlert },
    { key: 'costPerUnit', label: AR.inventory.cost },
    { key: 'status', label: AR.inventory.status },
  ];

  lowStockCount = computed(
    () => this.materials().filter((m) => m.currentStock <= m.minStockAlert).length,
  );

  tableData = computed(() =>
    this.materials().map((m) => ({
      ...m,
      isLow: m.currentStock <= m.minStockAlert,
    })),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<RawMaterial[]>('/raw-materials').subscribe({
      next: (data) => this.materials.set(data),
    });
  }

  unitLabel(unit: unknown): string {
    const key = String(unit) as keyof typeof AR.units;
    return AR.units[key] ?? String(unit);
  }

  openNew(): void {
    this.form = {
      name: '',
      unit: MaterialUnit.KG,
      currentStock: 0,
      minStockAlert: 0,
      costPerUnit: 0,
    };
    this.showModal.set(true);
  }

  save(): void {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.api.post('/raw-materials', this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
