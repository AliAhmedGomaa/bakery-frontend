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
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { Category } from '../../core/models/types';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-categories',
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
    <div class="categories">
      <div class="categories__header">
        <div>
          <h1>{{ ar.categoriesPage.title }}</h1>
          <p>{{ ar.categoriesPage.subtitle }}</p>
        </div>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.categoriesPage.add }}</gmn-button>
      </div>

      <gmn-card [noPadding]="true">
        <gmn-table [columns]="columns" [data]="tableData()">
          <ng-template #cell let-row let-col="column">
            @if (col.key === 'nameAr') {
              <strong>{{ row['nameAr'] }}</strong>
            } @else if (col.key === 'isActive') {
              @if (row['isActive']) {
                <gmn-badge variant="success" [dot]="true">{{ ar.categoriesPage.active }}</gmn-badge>
              } @else {
                <gmn-badge variant="neutral" [dot]="true">{{ ar.categoriesPage.inactive }}</gmn-badge>
              }
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(row['_id'])">{{ ar.categoriesPage.edit }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(row['_id'])">{{ ar.categoriesPage.delete }}</gmn-button>
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
      [title]="editingId() ? ar.categoriesPage.edit : ar.categoriesPage.add"
      size="md"
      (closed)="showModal.set(false)"
    >
      <div class="cat-form">
        <gmn-input [label]="ar.categoriesPage.name" [(ngModel)]="form.name" [disabled]="!!editingId()" />
        <small>{{ ar.categoriesPage.nameHint }}</small>
        <gmn-input [label]="ar.categoriesPage.nameAr" [(ngModel)]="form.nameAr" />
        <gmn-input [label]="ar.categoriesPage.sortOrder" type="number" [(ngModel)]="form.sortOrder" />
        @if (editingId()) {
          <label class="cat-form__check">
            <input type="checkbox" [(ngModel)]="form.isActive" />
            <span>{{ ar.categoriesPage.active }}</span>
          </label>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="showModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.categoriesPage.save }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .categories__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .categories__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .categories__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .cat-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      direction: rtl;
    }
    .cat-form small {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-top: -0.35rem;
    }
    .cat-form__check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
  `],
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  readonly ar = AR;

  categories = signal<Category[]>([]);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  form = {
    name: '',
    nameAr: '',
    sortOrder: 0,
    isActive: true,
  };

  columns: GmnTableColumn[] = [
    { key: 'nameAr', label: AR.categoriesPage.nameAr },
    { key: 'name', label: AR.categoriesPage.name },
    { key: 'sortOrder', label: AR.categoriesPage.sortOrder },
    { key: 'isActive', label: AR.categoriesPage.status },
    { key: 'actions', label: AR.categoriesPage.actions },
  ];

  tableData = computed(() =>
    this.categories().map((c) => ({
      _id: c._id,
      name: c.name,
      nameAr: c.nameAr,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    })),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<Category[]>('/categories').subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([]),
    });
  }

  openNew(): void {
    this.editingId.set(null);
    this.form = { name: '', nameAr: '', sortOrder: this.categories().length + 1, isActive: true };
    this.showModal.set(true);
  }

  openEdit(id: unknown): void {
    const cat = this.categories().find((c) => c._id === String(id));
    if (!cat) return;
    this.editingId.set(cat._id);
    this.form = {
      name: cat.name,
      nameAr: cat.nameAr,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    };
    this.showModal.set(true);
  }

  confirmDelete(id: unknown): void {
    if (!confirm(AR.categoriesPage.confirmDelete)) return;
    this.api.delete(`/categories/${String(id)}`).subscribe({ next: () => this.load() });
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.nameAr.trim()) return;
    const editId = this.editingId();
    this.saving.set(true);

    if (editId) {
      this.api
        .patch(`/categories/${editId}`, {
          nameAr: this.form.nameAr.trim(),
          sortOrder: Number(this.form.sortOrder) || 0,
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
      .post('/categories', {
        name: this.form.name.trim(),
        nameAr: this.form.nameAr.trim(),
        sortOrder: Number(this.form.sortOrder) || 0,
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
