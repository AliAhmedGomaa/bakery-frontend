import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GmnCardComponent,
  GmnButtonComponent,
  GmnInputComponent,
  GmnModalComponent,
  GmnTableComponent,
  GmnTableColumn,
} from '../../../shared/components';
import { ApiService } from '../../../core/services/api.service';
import { Product, RawMaterial, Recipe, RecipeIngredient } from '../../../core/models/types';
import { AR } from '../../../core/i18n/ar';

@Component({
  selector: 'app-recipe-builder',
  standalone: true,
  imports: [FormsModule, GmnCardComponent, GmnButtonComponent, GmnInputComponent, GmnModalComponent, GmnTableComponent],
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
            } @else if (col.key === 'ingredientCount') {
              {{ row['ingredientCount'] }} {{ ar.production.materials }}
            } @else if (col.key === 'actions') {
              <div class="row-actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(String(row['_id']))">{{ ar.production.edit }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(String(row['_id']))">{{ ar.production.delete }}</gmn-button>
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
              <option [value]="p._id">{{ p.name }} ({{ p.category }})</option>
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
                  <option [value]="m._id">{{ m.name }} ({{ m.unit }})</option>
                }
              </select>
              <gmn-input
                [label]="ar.production.qty"
                type="number"
                [ngModel]="ing.quantityRequired"
                (ngModelChange)="updateIngQty(idx, $event)"
              />
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
      flex-wrap: wrap;
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
      padding: 0 1rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-default);
      background: var(--bg-surface-container-high);
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
  `],
})
export class RecipeBuilderComponent implements OnInit {
  private api = inject(ApiService);
  readonly ar = AR;
  readonly String = String;

  columns: GmnTableColumn[] = [
    { key: 'productName', label: AR.production.product },
    { key: 'ingredientCount', label: AR.production.ingredients },
    { key: 'actions', label: AR.production.actions },
  ];

  recipes = signal<Recipe[]>([]);
  products = signal<Product[]>([]);
  materials = signal<RawMaterial[]>([]);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  selectedProductId = '';
  ingredients = signal<RecipeIngredient[]>([]);

  tableData = computed(() =>
    this.recipes().map((r) => ({
      _id: r._id,
      productName: r.product?.name ?? r.productId,
      ingredientCount: r.ingredients.length,
    })),
  );

  ngOnInit(): void {
    this.loadRecipes();
    this.api.get<Product[]>('/products').subscribe((d) => this.products.set(d));
    this.api.get<RawMaterial[]>('/raw-materials').subscribe((d) => this.materials.set(d));
  }

  loadRecipes(): void {
    this.api.get<Recipe[]>('/recipes').subscribe((data) => {
      this.recipes.set(
        data.map((r) => ({
          ...r,
          productId: String(r.productId),
          ingredients: r.ingredients.map((ing) => ({
            ...ing,
            rawMaterialId: String(ing.rawMaterialId),
          })),
        })),
      );
    });
  }

  openNew(): void {
    this.editingId.set(null);
    this.selectedProductId = '';
    this.ingredients.set([{ rawMaterialId: '', quantityRequired: 0 }]);
    this.showModal.set(true);
  }

  openEdit(id: string): void {
    const recipe = this.recipes().find((r) => r._id === id);
    if (!recipe) return;
    this.editingId.set(id);
    this.selectedProductId = String(recipe.productId);
    this.ingredients.set(
      recipe.ingredients.map((ing) => ({
        rawMaterialId: String(ing.rawMaterialId),
        quantityRequired: ing.quantityRequired,
      })),
    );
    this.showModal.set(true);
  }

  confirmDelete(id: string): void {
    if (!confirm(AR.production.confirmDeleteRecipe)) return;
    this.api.delete(`/recipes/${id}`).subscribe({
      next: () => this.loadRecipes(),
    });
  }

  addIngredient(): void {
    this.ingredients.update((list) => [...list, { rawMaterialId: '', quantityRequired: 0 }]);
  }

  removeIngredient(idx: number): void {
    this.ingredients.update((list) => list.filter((_, i) => i !== idx));
  }

  updateIngQty(idx: number, value: number): void {
    this.ingredients.update((list) =>
      list.map((ing, i) => (i === idx ? { ...ing, quantityRequired: value } : ing)),
    );
  }

  saveRecipe(): void {
    if (!this.selectedProductId) return;
    const validIngredients = this.ingredients().filter((i) => i.rawMaterialId && i.quantityRequired > 0);
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
