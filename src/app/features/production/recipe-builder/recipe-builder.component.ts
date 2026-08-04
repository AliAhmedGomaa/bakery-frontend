import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GmnBadgeComponent,
  GmnCardComponent,
  GmnButtonComponent,
  GmnInputComponent,
  GmnModalComponent,
  GmnTableComponent,
  GmnTableColumn,
  ConfirmDialogService,
} from '../../../shared/components';
import { ApiService } from '../../../core/services/api.service';
import {
  Category,
  Product,
  RawMaterial,
  Recipe,
  SellType,
} from '../../../core/models/types';
import { AR } from '../../../core/i18n/ar';

interface IngredientDetail {
  name: string;
  unit: string;
  quantityRequired: number;
  costPerUnit: number;
  lineCost: number;
  currentStock: number;
}

interface RecipeIngredientForm {
  rawMaterialId: string;
  quantityRequired: string | number;
}

@Component({
  selector: 'app-recipe-builder',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    GmnCardComponent,
    GmnButtonComponent,
    GmnInputComponent,
    GmnModalComponent,
    GmnTableComponent,
    GmnBadgeComponent,
  ],
  template: `
    <div class="recipes">
      <div class="recipes__actions">
        <h2>{{ ar.production.recipeList }}</h2>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.production.newRecipe }}</gmn-button>
      </div>

      <gmn-card [noPadding]="true">
        <gmn-table [columns]="columns" [data]="tableData()">
          <ng-template #cell let-row let-col="column">
            @if (col.key === 'productName') {
              <strong>{{ row['productName'] }}</strong>
            } @else if (col.key === 'category') {
              <gmn-badge variant="neutral" size="sm">{{ row['category'] }}</gmn-badge>
            } @else if (col.key === 'ingredientsSummary') {
              <span class="ingredients-summary">{{ row['ingredientsSummary'] }}</span>
            } @else if (col.key === 'estimatedCost') {
              {{ ar.dashboard.currency }} {{ row['estimatedCost'] | number:'1.2-2' }}
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openDetails(row['_id'])">{{ ar.production.details }}</gmn-button>
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(row['_id'])">{{ ar.production.edit }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(row['_id'])">{{ ar.production.delete }}</gmn-button>
              </div>
            } @else {
              {{ row[col.key] }}
            }
          </ng-template>
        </gmn-table>
      </gmn-card>
    </div>

    <gmn-modal
      [open]="showDetails()"
      [title]="ar.production.recipeDetails"
      [subtitle]="detailsRecipe()?.product?.name ?? ''"
      size="lg"
      (closed)="showDetails.set(false)"
    >
      @if (detailsRecipe(); as recipe) {
        <div class="recipe-details">
          <div class="recipe-details__meta">
            <div>
              <span class="meta-label">{{ ar.production.category }}</span>
              <strong>{{ categoryLabel(recipe.product?.category) }}</strong>
            </div>
            <div>
              <span class="meta-label">{{ ar.production.sellType }}</span>
              <strong>{{ sellTypeLabel(recipe.product?.sellType) }}</strong>
            </div>
            <div>
              <span class="meta-label">{{ ar.production.productPrice }}</span>
              <strong>{{ ar.dashboard.currency }} {{ (recipe.product?.price ?? 0) | number:'1.2-2' }}</strong>
            </div>
            <div>
              <span class="meta-label">{{ ar.production.estimatedCost }}</span>
              <strong class="meta-accent">{{ ar.dashboard.currency }} {{ recipeCost(recipe) | number:'1.2-2' }}</strong>
            </div>
          </div>

          <h3>{{ ar.production.ingredients }}</h3>
          @if (ingredientDetails(recipe).length === 0) {
            <p class="recipe-details__empty">{{ ar.production.noIngredients }}</p>
          } @else {
            <div class="recipe-details__table-wrap">
              <table class="recipe-details__table">
                <thead>
                  <tr>
                    <th>{{ ar.production.material }}</th>
                    <th>{{ ar.production.qty }}</th>
                    <th>{{ ar.production.unit }}</th>
                    <th>{{ ar.production.cost }}</th>
                    <th>{{ ar.production.lineCost }}</th>
                    <th>{{ ar.production.stock }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ing of ingredientDetails(recipe); track ing.name) {
                    <tr>
                      <td><strong>{{ ing.name }}</strong></td>
                      <td>{{ ing.quantityRequired | number:'1.0-3' }}</td>
                      <td>{{ ing.unit }}</td>
                      <td>{{ ar.dashboard.currency }} {{ ing.costPerUnit | number:'1.2-2' }}</td>
                      <td>{{ ar.dashboard.currency }} {{ ing.lineCost | number:'1.2-2' }}</td>
                      <td>{{ ing.currentStock | number:'1.0-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
      <div footer>
        <gmn-button variant="ghost" (clicked)="showDetails.set(false)">{{ ar.production.close }}</gmn-button>
        <gmn-button
          variant="primary"
          (clicked)="editFromDetails()"
        >
          {{ ar.production.edit }}
        </gmn-button>
      </div>
    </gmn-modal>

    <gmn-modal
      [open]="showModal()"
      [title]="editingId() ? ar.production.editRecipe : ar.production.newRecipe"
      size="lg"
      (closed)="showModal.set(false)"
    >
      <div class="recipe-form">
        <div class="recipe-form__field">
          <label>{{ ar.production.product }}</label>
          <select [(ngModel)]="selectedProductId" class="recipe-form__select" [disabled]="!!editingId()">
            <option value="">{{ ar.production.selectProduct }}</option>
            @for (p of products(); track p._id) {
              <option [value]="p._id">{{ p.name }} ({{ categoryLabel(p.category) }})</option>
            }
          </select>
        </div>

        <div class="recipe-form__ingredients">
          <div class="recipe-form__ing-header">
            <h3>{{ ar.production.ingredients }}</h3>
            <gmn-button variant="ghost" size="sm" (clicked)="addIngredient()">+ {{ ar.production.add }}</gmn-button>
          </div>

          @for (ing of ingredients(); track $index; let idx = $index) {
            <div class="recipe-form__ing-row">
              <select [(ngModel)]="ing.rawMaterialId" class="recipe-form__select recipe-form__select--sm">
                <option value="">{{ ar.production.material }}</option>
                @for (m of materials(); track m._id) {
                  <option [value]="m._id">{{ m.name }} ({{ unitLabel(m.unit) }})</option>
                }
              </select>
              <gmn-input
                [label]="ar.production.qty"
                type="number"
                [ngModel]="ing.quantityRequired"
                (ngModelChange)="updateIngQty(idx, $event)"
              />
              <span class="recipe-form__unit">{{ materialUnit(ing.rawMaterialId) }}</span>
              <gmn-button variant="ghost" size="sm" [iconOnly]="true" (clicked)="removeIngredient(idx)">✕</gmn-button>
            </div>
          }
        </div>
      </div>

      <div footer>
        <gmn-button variant="ghost" (clicked)="showModal.set(false)">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="saveRecipe()">{{ ar.production.saveRecipe }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .recipes__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .recipes__actions h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .row-actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: nowrap;
    }
    .ingredients-summary {
      display: block;
      color: var(--text-muted);
      font-size: 0.8125rem;
      white-space: nowrap;
    }
    .recipe-details {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      direction: rtl;
    }
    .recipe-details__meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
      gap: 0.75rem;
    }
    .recipe-details__meta > div {
      padding: 0.85rem 1rem;
      border-radius: var(--radius-xl);
      background: var(--bg-surface-container);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .meta-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .meta-accent {
      color: var(--text-accent);
    }
    .recipe-details h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .recipe-details__empty {
      margin: 0;
      color: var(--text-muted);
    }
    .recipe-details__table-wrap {
      overflow-x: auto;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-subtle);
    }
    .recipe-details__table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .recipe-details__table th,
    .recipe-details__table td {
      padding: 0.75rem 0.85rem;
      text-align: right;
      border-bottom: 1px solid var(--border-subtle);
      white-space: nowrap;
    }
    .recipe-details__table th {
      background: var(--bg-surface-container);
      color: var(--text-muted);
      font-weight: 600;
    }
    .recipe-details__table tr:last-child td {
      border-bottom: none;
    }
    .recipe-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .recipe-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .recipe-form__select {
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
      transition: border-color var(--duration-fast) ease;

      &:focus {
        outline: none;
        border-color: var(--border-focus);
        box-shadow: var(--shadow-focus);
      }

      &:disabled {
        opacity: 0.7;
      }

      &--sm { width: auto; flex: 1; }
    }
    .recipe-form__ingredients {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .recipe-form__ing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    .recipe-form__ing-row {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;

      gmn-input { flex: 0 0 6rem; }
    }
    .recipe-form__unit {
      min-width: 2.5rem;
      padding-bottom: 0.85rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }
  `],
})
export class RecipeBuilderComponent implements OnInit {
  private api = inject(ApiService);
  private confirmDialog = inject(ConfirmDialogService);
  readonly ar = AR;

  columns: GmnTableColumn[] = [
    { key: 'productName', label: AR.production.product },
    { key: 'category', label: AR.production.category },
    { key: 'ingredientsSummary', label: AR.production.ingredients },
    { key: 'estimatedCost', label: AR.production.estimatedCost },
    { key: 'actions', label: AR.production.actions },
  ];

  recipes = signal<Recipe[]>([]);
  products = signal<Product[]>([]);
  materials = signal<RawMaterial[]>([]);
  categories = signal<Category[]>([]);
  sellTypes = signal<SellType[]>([]);
  showModal = signal(false);
  showDetails = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  detailsRecipe = signal<Recipe | null>(null);

  selectedProductId = '';
  ingredients = signal<RecipeIngredientForm[]>([]);

  tableData = computed(() =>
    this.recipes().map((r) => ({
      _id: r._id,
      productName: r.product?.name ?? r.productId,
      category: this.categoryLabel(r.product?.category),
      ingredientsSummary: this.ingredientsSummary(r),
      estimatedCost: this.recipeCost(r),
    })),
  );

  ngOnInit(): void {
    this.loadRecipes();
    this.api.get<Product[]>('/products').subscribe((d) => this.products.set(d));
    this.api.get<RawMaterial[]>('/raw-materials').subscribe((d) => this.materials.set(d));
    this.api.get<Category[]>('/categories').subscribe({
      next: (d) => this.categories.set(d),
      error: () => this.categories.set([]),
    });
    this.api.get<SellType[]>('/sell-types').subscribe({
      next: (d) => this.sellTypes.set(d),
      error: () => this.sellTypes.set([]),
    });
  }

  loadRecipes(): void {
    this.api.get<Recipe[]>('/recipes').subscribe((data) => {
      this.recipes.set(
        data.map((r) => ({
          ...r,
          productId: String(
            typeof r.productId === 'object' && r.productId && '_id' in (r.productId as object)
              ? (r.productId as { _id: string })._id
              : r.productId,
          ),
          product:
            r.product ??
            (typeof r.productId === 'object' ? (r.productId as unknown as Product) : undefined),
          ingredients: r.ingredients.map((ing) => ({
            ...ing,
            rawMaterialId: String(
              typeof ing.rawMaterialId === 'object' &&
                ing.rawMaterialId &&
                '_id' in (ing.rawMaterialId as object)
                ? (ing.rawMaterialId as { _id: string })._id
                : ing.rawMaterialId,
            ),
            rawMaterial:
              ing.rawMaterial ??
              (typeof ing.rawMaterialId === 'object'
                ? (ing.rawMaterialId as unknown as RawMaterial)
                : undefined),
          })),
        })),
      );
    });
  }

  categoryLabel(category?: string): string {
    if (!category) return '—';
    return this.categories().find((c) => c.name === category)?.nameAr ?? category;
  }

  sellTypeLabel(sellType?: string): string {
    if (!sellType) return '—';
    return this.sellTypes().find((s) => s.name === sellType)?.nameAr
      ?? (sellType === 'WEIGHT' ? AR.products.weight : AR.products.piece);
  }

  unitLabel(unit?: string): string {
    if (!unit) return '';
    const key = unit as keyof typeof AR.units;
    return AR.units[key] ?? unit;
  }

  materialUnit(rawMaterialId: string): string {
    const material = this.materials().find((m) => m._id === rawMaterialId);
    return material ? this.unitLabel(material.unit) : '';
  }

  ingredientsSummary(recipe: Recipe): string {
    const details = this.ingredientDetails(recipe);
    if (details.length === 0) return AR.production.noIngredients;
    return details
      .slice(0, 4)
      .map((ing) => `${ing.name} ${ing.quantityRequired}${ing.unit ? ' ' + ing.unit : ''}`)
      .join(' · ') + (details.length > 4 ? '…' : '');
  }

  ingredientDetails(recipe: Recipe): IngredientDetail[] {
    return recipe.ingredients.map((ing) => {
      const material =
        ing.rawMaterial ??
        this.materials().find((m) => m._id === String(ing.rawMaterialId));
      const quantityRequired = Number(ing.quantityRequired) || 0;
      const costPerUnit = Number(material?.costPerUnit) || 0;
      return {
        name: material?.name ?? String(ing.rawMaterialId),
        unit: this.unitLabel(material?.unit),
        quantityRequired,
        costPerUnit,
        lineCost: Math.round(quantityRequired * costPerUnit * 100) / 100,
        currentStock: Number(material?.currentStock) || 0,
      };
    });
  }

  recipeCost(recipe: Recipe): number {
    return Math.round(
      this.ingredientDetails(recipe).reduce((sum, ing) => sum + ing.lineCost, 0) * 100,
    ) / 100;
  }

  openNew(): void {
    this.editingId.set(null);
    this.selectedProductId = '';
    this.ingredients.set([{ rawMaterialId: '', quantityRequired: '' }]);
    this.showModal.set(true);
  }

  openDetails(id: unknown): void {
    const recipe = this.recipes().find((r) => r._id === String(id));
    if (!recipe) return;
    this.detailsRecipe.set(recipe);
    this.showDetails.set(true);
  }

  editFromDetails(): void {
    const recipe = this.detailsRecipe();
    if (!recipe) return;
    this.showDetails.set(false);
    this.openEdit(recipe._id);
  }

  openEdit(id: unknown): void {
    const recipe = this.recipes().find((r) => r._id === String(id));
    if (!recipe) return;
    this.editingId.set(recipe._id);
    this.selectedProductId = String(recipe.productId);
    this.ingredients.set(
      recipe.ingredients.map((ing) => ({
        rawMaterialId: String(ing.rawMaterialId),
        quantityRequired: ing.quantityRequired,
      })),
    );
    this.showModal.set(true);
  }

  async confirmDelete(id: unknown): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      message: AR.production.confirmDeleteRecipe,
      confirmLabel: AR.production.delete,
    });
    if (!ok) return;
    this.api.delete(`/recipes/${String(id)}`).subscribe({
      next: () => this.loadRecipes(),
    });
  }

  addIngredient(): void {
    this.ingredients.update((list) => [...list, { rawMaterialId: '', quantityRequired: '' }]);
  }

  removeIngredient(idx: number): void {
    this.ingredients.update((list) => list.filter((_, i) => i !== idx));
  }

  updateIngQty(idx: number, value: string | number): void {
    this.ingredients.update((list) =>
      list.map((ing, i) => (i === idx ? { ...ing, quantityRequired: value } : ing)),
    );
  }

  saveRecipe(): void {
    if (!this.selectedProductId) return;
    const validIngredients = this.ingredients()
      .map((i) => ({
        rawMaterialId: i.rawMaterialId,
        quantityRequired: Number(i.quantityRequired),
      }))
      .filter((i) => i.rawMaterialId && !isNaN(i.quantityRequired) && i.quantityRequired > 0);
    if (validIngredients.length === 0) return;

    this.saving.set(true);
    const editId = this.editingId();
    const body = {
      productId: this.selectedProductId,
      ingredients: validIngredients,
    };

    const req = editId
      ? this.api.patch(`/recipes/${editId}`, body)
      : this.api.post('/recipes', body);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.loadRecipes();
      },
      error: () => this.saving.set(false),
    });
  }
}
