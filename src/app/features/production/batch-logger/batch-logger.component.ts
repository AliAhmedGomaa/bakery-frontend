import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  GmnCardComponent,
  GmnButtonComponent,
  GmnInputComponent,
  GmnBadgeComponent,
  GmnModalComponent,
} from '../../../shared/components';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductionBatch, BatchStatus } from '../../../core/models/types';
import { AR } from '../../../core/i18n/ar';

@Component({
  selector: 'app-batch-logger',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    GmnCardComponent,
    GmnButtonComponent,
    GmnInputComponent,
    GmnBadgeComponent,
    GmnModalComponent,
  ],
  template: `
    <div class="batches">
      <div class="batches__actions">
        <h2>{{ ar.production.batchList }}</h2>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.production.logBatch }}</gmn-button>
      </div>

      <!-- Batch Cards -->
      <div class="batches__grid">
        @for (batch of batches(); track batch._id) {
          <gmn-card>
            <div class="batch-card">
              <div class="batch-card__header">
                <span class="batch-card__number">{{ batch.batchNumber }}</span>
                <gmn-badge [variant]="statusVariant(batch.status)">{{ statusLabel(batch.status) }}</gmn-badge>
              </div>
              <p class="batch-card__product">{{ batch.product?.name ?? batch.productId }}</p>
              <div class="batch-card__stats">
                <div>
                  <span class="batch-card__label">{{ ar.production.target }}</span>
                  <span class="batch-card__value">{{ batch.targetQuantity }}</span>
                </div>
                <div>
                  <span class="batch-card__label">{{ ar.production.produced }}</span>
                  <span class="batch-card__value">{{ batch.producedQuantity }}</span>
                </div>
                <div>
                  <span class="batch-card__label">{{ ar.production.waste }}</span>
                  <span class="batch-card__value batch-card__value--waste">{{ batch.wasteQuantity }}</span>
                </div>
              </div>
              <p class="batch-card__date">{{ batch.date | date:'mediumDate' }}</p>

              @if (batch.status === 'PLANNED' || batch.status === 'IN_PROGRESS') {
                <div class="batch-card__actions">
                  @if (batch.status === 'PLANNED') {
                    <gmn-button variant="ghost" size="sm" (clicked)="startBatch(batch)">{{ ar.production.start }}</gmn-button>
                  }
                  @if (batch.status === 'IN_PROGRESS') {
                    <gmn-button variant="ghost" size="sm" (clicked)="openComplete(batch)">{{ ar.production.complete }}</gmn-button>
                  }
                </div>
              }
            </div>
          </gmn-card>
        } @empty {
          <gmn-card>
            <div class="batches__empty">{{ ar.production.noBatches }}</div>
          </gmn-card>
        }
      </div>
    </div>

    <!-- ═══ New Batch Modal ═══ -->
    <gmn-modal
      [open]="showNewModal()"
      [title]="ar.production.logProduction"
      size="md"
      (closed)="showNewModal.set(false)"
    >
      <div class="batch-form">
        <div class="batch-form__row">
          <div class="batch-form__field">
            <label>{{ ar.production.product }}</label>
            <select [(ngModel)]="newBatch.productId" class="batch-form__select">
              <option value="">{{ ar.production.selectProduct }}</option>
              @for (p of products(); track p._id) {
                <option [value]="p._id">{{ p.name }}</option>
              }
            </select>
          </div>
          <gmn-input
            [label]="ar.production.targetQty"
            type="number"
            [(ngModel)]="newBatch.targetQuantity"
          />
        </div>
        <gmn-input
          [label]="ar.production.batchNumber"
          [(ngModel)]="newBatch.batchNumber"
          [placeholder]="'BATCH-' + todayStr + '-001'"
        />
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showNewModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="saveBatch()">{{ ar.production.createBatch }}</gmn-button>
      </div>
    </gmn-modal>

    <!-- ═══ Complete Batch Modal ═══ -->
    <gmn-modal
      [open]="showCompleteModal()"
      [title]="ar.production.completeBatch"
      [subtitle]="completingBatch()?.batchNumber ?? ''"
      size="sm"
      (closed)="showCompleteModal.set(false)"
    >
      <div class="batch-form">
        <gmn-input
          [label]="ar.production.producedQty"
          type="number"
          [(ngModel)]="completeData.producedQuantity"
        />
        <gmn-input
          [label]="ar.production.wasteQty"
          type="number"
          [(ngModel)]="completeData.wasteQuantity"
        />
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showCompleteModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="completeBatch()">
          {{ ar.production.completeDeduct }}
        </gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .batches__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .batches__actions h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .batches__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      gap: 1rem;
    }
    .batches__empty {
      text-align: center;
      padding: 2rem;
      color: var(--text-faint);
    }
    .batch-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .batch-card__number {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      font-family: monospace;
    }
    .batch-card__product {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .batch-card__stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 0.75rem;

      div {
        display: flex;
        flex-direction: column;
      }
    }
    .batch-card__label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-faint);
    }
    .batch-card__value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);

      &--waste { color: var(--status-danger-text); }
    }
    .batch-card__date {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .batch-card__actions {
      margin-top: 0.75rem;
      display: flex;
      gap: 0.5rem;
    }
    .batch-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .batch-form__row {
      display: flex;
      gap: 1rem;

      > * { flex: 1; }
    }
    .batch-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .batch-form__select {
      width: 100%;
      height: 2.75rem;
      padding: 0 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--border-focus);
        box-shadow: var(--shadow-focus);
      }
    }
  `],
})
export class BatchLoggerComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  readonly ar = AR;

  batches = signal<ProductionBatch[]>([]);
  products = signal<Product[]>([]);
  showNewModal = signal(false);
  showCompleteModal = signal(false);
  saving = signal(false);
  completingBatch = signal<ProductionBatch | null>(null);

  todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  newBatch = {
    productId: '',
    targetQuantity: 0,
    batchNumber: '',
  };

  completeData = {
    producedQuantity: 0,
    wasteQuantity: 0,
  };

  ngOnInit(): void {
    this.loadBatches();
    this.api.get<Product[]>('/products').subscribe((d) => this.products.set(d));
  }

  loadBatches(): void {
    this.api.get<ProductionBatch[]>('/production-batches').subscribe({
      next: (data) => this.batches.set(data),
    });
  }

  statusVariant(status: BatchStatus): 'success' | 'info' | 'warning' | 'neutral' | 'danger' {
    const map: Record<BatchStatus, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
      [BatchStatus.COMPLETED]: 'success',
      [BatchStatus.IN_PROGRESS]: 'info',
      [BatchStatus.PLANNED]: 'warning',
      [BatchStatus.CANCELLED]: 'danger',
    };
    return map[status] ?? 'neutral';
  }

  statusLabel(status: BatchStatus): string {
    return AR.status[status] ?? status;
  }

  openNew(): void {
    this.newBatch = {
      productId: '',
      targetQuantity: 0,
      batchNumber: `BATCH-${this.todayStr}-${String(this.batches().length + 1).padStart(3, '0')}`,
    };
    this.showNewModal.set(true);
  }

  saveBatch(): void {
    if (!this.newBatch.productId || this.newBatch.targetQuantity <= 0) return;

    this.saving.set(true);
    this.api
      .post('/production-batches', {
        ...this.newBatch,
        bakerId: this.auth.user()?.id,
        date: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showNewModal.set(false);
          this.loadBatches();
        },
        error: () => this.saving.set(false),
      });
  }

  startBatch(batch: ProductionBatch): void {
    this.api
      .patch(`/production-batches/${batch._id}`, { status: BatchStatus.IN_PROGRESS })
      .subscribe(() => this.loadBatches());
  }

  openComplete(batch: ProductionBatch): void {
    this.completingBatch.set(batch);
    this.completeData = {
      producedQuantity: batch.targetQuantity,
      wasteQuantity: 0,
    };
    this.showCompleteModal.set(true);
  }

  completeBatch(): void {
    const batch = this.completingBatch();
    if (!batch) return;

    this.saving.set(true);
    this.api
      .patch(`/production-batches/${batch._id}`, {
        status: BatchStatus.COMPLETED,
        producedQuantity: this.completeData.producedQuantity,
        wasteQuantity: this.completeData.wasteQuantity,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showCompleteModal.set(false);
          this.loadBatches();
        },
        error: () => this.saving.set(false),
      });
  }
}
