import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { PricingMode, SellType } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-sell-types',
  standalone: true,
  imports: [
    FormsModule,
    GmnCardComponent,
    GmnBadgeComponent,
    GmnTableComponent,
    GmnButtonComponent,
    GmnInputComponent,
    GmnModalComponent,
  ],
  template: `
    <div class="sell-types">
      <div class="sell-types__header">
        <div>
          <h1>{{ ar.sellTypesPage.title }}</h1>
          <p>{{ ar.sellTypesPage.subtitle }}</p>
        </div>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.sellTypesPage.add }}</gmn-button>
      </div>

      <gmn-card [noPadding]="true">
        <gmn-table [columns]="columns" [data]="tableData()">
          <ng-template #cell let-row let-col="column">
            @if (col.key === 'nameAr') {
              <strong>{{ row['nameAr'] }}</strong>
            } @else if (col.key === 'pricingMode') {
              <gmn-badge [variant]="row['pricingMode'] === 'WEIGHT' ? 'info' : 'neutral'" size="sm">
                {{ pricingModeLabel(row['pricingMode']) }}
              </gmn-badge>
            } @else if (col.key === 'isActive') {
              @if (row['isActive']) {
                <gmn-badge variant="success" [dot]="true">{{ ar.sellTypesPage.active }}</gmn-badge>
              } @else {
                <gmn-badge variant="neutral" [dot]="true">{{ ar.sellTypesPage.inactive }}</gmn-badge>
              }
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(row['_id'])">{{ ar.sellTypesPage.edit }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(row['_id'])">{{ ar.sellTypesPage.delete }}</gmn-button>
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
      [title]="editingId() ? ar.sellTypesPage.edit : ar.sellTypesPage.add"
      size="md"
      (closed)="showModal.set(false)"
    >
      <div class="st-form">
        <gmn-input [label]="ar.sellTypesPage.name" [(ngModel)]="form.name" [disabled]="!!editingId()" />
        <small>{{ ar.sellTypesPage.nameHint }}</small>
        <gmn-input [label]="ar.sellTypesPage.nameAr" [(ngModel)]="form.nameAr" />
        <div class="st-form__field">
          <label>{{ ar.sellTypesPage.pricingMode }}</label>
          <select [(ngModel)]="form.pricingMode" class="st-form__select">
            <option value="UNIT">{{ ar.sellTypesPage.pricingUnit }}</option>
            <option value="WEIGHT">{{ ar.sellTypesPage.pricingWeight }}</option>
          </select>
        </div>
        <gmn-input [label]="ar.sellTypesPage.sortOrder" type="number" [(ngModel)]="form.sortOrder" />
        @if (editingId()) {
          <label class="st-form__check">
            <input type="checkbox" [(ngModel)]="form.isActive" />
            <span>{{ ar.sellTypesPage.active }}</span>
          </label>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.sellTypesPage.save }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .sell-types__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .sell-types__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .sell-types__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: nowrap;
    }
    .st-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      direction: rtl;
    }
    .st-form small {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-top: -0.35rem;
    }
    .st-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .st-form__select {
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
    .st-form__check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
  `],
})
export class SellTypesComponent implements OnInit {
  private api = inject(ApiService);
  private confirmDialog = inject(ConfirmDialogService);
  readonly ar = AR;

  sellTypes = signal<SellType[]>([]);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form = {
    name: '',
    nameAr: '',
    pricingMode: 'UNIT' as PricingMode,
    sortOrder: '' as string | number,
    isActive: true,
  };

  columns: GmnTableColumn[] = [
    { key: 'nameAr', label: AR.sellTypesPage.nameAr },
    { key: 'name', label: AR.sellTypesPage.name },
    { key: 'pricingMode', label: AR.sellTypesPage.pricingMode },
    { key: 'sortOrder', label: AR.sellTypesPage.sortOrder },
    { key: 'isActive', label: AR.sellTypesPage.status },
    { key: 'actions', label: AR.sellTypesPage.actions },
  ];

  tableData = computed(() =>
    this.sellTypes().map((s) => ({
      _id: s._id,
      name: s.name,
      nameAr: s.nameAr,
      pricingMode: s.pricingMode,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    })),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<SellType[]>('/sell-types').subscribe({
      next: (data) => this.sellTypes.set(data),
      error: () => this.sellTypes.set([]),
    });
  }

  pricingModeLabel(mode: unknown): string {
    return mode === 'WEIGHT' ? AR.sellTypesPage.pricingWeight : AR.sellTypesPage.pricingUnit;
  }

  openNew(): void {
    this.editingId.set(null);
    this.form = {
      name: '',
      nameAr: '',
      pricingMode: 'UNIT',
      sortOrder: '',
      isActive: true,
    };
    this.showModal.set(true);
  }

  openEdit(id: unknown): void {
    const item = this.sellTypes().find((s) => s._id === String(id));
    if (!item) return;
    this.editingId.set(item._id);
    this.form = {
      name: item.name,
      nameAr: item.nameAr,
      pricingMode: item.pricingMode,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    };
    this.showModal.set(true);
  }

  async confirmDelete(id: unknown): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      message: AR.sellTypesPage.confirmDelete,
      confirmLabel: AR.sellTypesPage.delete,
    });
    if (!ok) return;
    this.api.delete(`/sell-types/${String(id)}`).subscribe({ next: () => this.load() });
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.nameAr.trim()) return;
    const editId = this.editingId();
    this.saving.set(true);
    const sortOrder = this.form.sortOrder === '' ? 0 : Number(this.form.sortOrder) || 0;

    if (editId) {
      this.api
        .patch(`/sell-types/${editId}`, {
          nameAr: this.form.nameAr.trim(),
          pricingMode: this.form.pricingMode,
          sortOrder,
          isActive: this.form.isActive,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.showModal.set(false);
            this.load();
          },
          error: () => this.saving.set(false),
        });
      return;
    }

    this.api
      .post('/sell-types', {
        name: this.form.name.trim().toUpperCase(),
        nameAr: this.form.nameAr.trim(),
        pricingMode: this.form.pricingMode,
        sortOrder,
        isActive: true,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showModal.set(false);
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }
}
