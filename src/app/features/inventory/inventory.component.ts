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
  ConfirmDialogService,
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
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(String(row['_id']))">{{ ar.inventory.edit }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(String(row['_id']))">{{ ar.inventory.delete }}</gmn-button>
              </div>
            } @else {
              {{ row[col.key] }}
            }
          </ng-template>
        </gmn-table>
      </gmn-card>
    </div>

    <gmn-modal
      [open]="showModal()"
      [title]="editingId() ? ar.inventory.editMaterial : ar.inventory.addMaterial"
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
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: nowrap;
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
      padding-block: 0;
      padding-inline-start: 1rem;
      padding-inline-end: 2.35rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background-color: var(--bg-surface-container-high);
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
  private confirmDialog = inject(ConfirmDialogService);
  readonly ar = AR;
  readonly units = Object.values(MaterialUnit);
  readonly String = String;

  materials = signal<RawMaterial[]>([]);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form = {
    name: '',
    unit: MaterialUnit.KG,
    currentStock: '' as string | number,
    minStockAlert: '' as string | number,
    costPerUnit: '' as string | number,
  };

  columns: GmnTableColumn[] = [
    { key: 'name', label: AR.inventory.name },
    { key: 'unit', label: AR.inventory.unit },
    { key: 'currentStock', label: AR.inventory.stock },
    { key: 'minStockAlert', label: AR.inventory.minAlert },
    { key: 'costPerUnit', label: AR.inventory.cost },
    { key: 'status', label: AR.inventory.status },
    { key: 'actions', label: AR.inventory.actions },
  ];

  lowStockCount = computed(
    () => this.materials().filter((m) => m.currentStock <= m.minStockAlert).length,
  );

  tableData = computed(() =>
    this.materials().map((m) => {
      const isLow = m.currentStock <= m.minStockAlert;
      return {
        ...m,
        isLow,
        status: isLow ? AR.inventory.low : AR.inventory.ok,
        unitLabel: this.unitLabel(m.unit),
      };
    }),
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
    this.editingId.set(null);
    this.form = {
      name: '',
      unit: MaterialUnit.KG,
      currentStock: '',
      minStockAlert: '',
      costPerUnit: '',
    };
    this.showModal.set(true);
  }

  openEdit(id: string): void {
    const material = this.materials().find((m) => m._id === id);
    if (!material) return;
    this.editingId.set(id);
    this.form = {
      name: material.name,
      unit: material.unit,
      currentStock: material.currentStock,
      minStockAlert: material.minStockAlert,
      costPerUnit: material.costPerUnit,
    };
    this.showModal.set(true);
  }

  async confirmDelete(id: string): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      message: AR.inventory.confirmDelete,
      confirmLabel: AR.inventory.delete,
    });
    if (!ok) return;
    this.api.delete(`/raw-materials/${id}`).subscribe({
      next: () => this.load(),
    });
  }

  save(): void {
    if (!this.form.name.trim()) return;

    const currentStock = this.form.currentStock === '' ? NaN : Number(this.form.currentStock);
    const minStockAlert = this.form.minStockAlert === '' ? NaN : Number(this.form.minStockAlert);
    const costPerUnit = this.form.costPerUnit === '' ? NaN : Number(this.form.costPerUnit);
    if (
      isNaN(currentStock) ||
      currentStock < 0 ||
      isNaN(minStockAlert) ||
      minStockAlert < 0 ||
      isNaN(costPerUnit) ||
      costPerUnit < 0
    ) {
      return;
    }

    const body = {
      name: this.form.name.trim(),
      unit: this.form.unit,
      currentStock,
      minStockAlert,
      costPerUnit,
    };

    this.saving.set(true);
    const editId = this.editingId();
    const req = editId
      ? this.api.patch(`/raw-materials/${editId}`, body)
      : this.api.post('/raw-materials', body);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
