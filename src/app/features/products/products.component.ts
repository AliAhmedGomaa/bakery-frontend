import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GmnBadgeComponent,
  GmnButtonComponent,
  GmnCardComponent,
  GmnInputComponent,
  GmnModalComponent,
  ConfirmDialogService,
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { Category, Product, SellType, isWeightPricing } from '../../core/models/types';
import { productImageUrl } from '../../core/utils/product-image';
import { AR } from '../../core/i18n/ar';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    GmnCardComponent,
    GmnButtonComponent,
    GmnInputComponent,
    GmnBadgeComponent,
    GmnModalComponent,
  ],
  template: `
    <div class="products">
      <div class="products__header">
        <div>
          <h1>{{ ar.products.title }}</h1>
          <p>{{ ar.products.subtitle }}</p>
        </div>
        <gmn-button variant="primary" (clicked)="openNew()">+ {{ ar.products.add }}</gmn-button>
      </div>

      <div class="products__search">
        <gmn-input
          [placeholder]="ar.common.search"
          (valueChange)="searchQuery.set($event)"
        >
          <span prefix>🔍</span>
        </gmn-input>
      </div>

      <div class="products__grid">
        @for (product of filteredProducts(); track product._id) {
          <gmn-card class="product-card">
            <div class="product-card__media">
              @if (imageUrl(product.image); as src) {
                <img [src]="src" [alt]="product.name" />
              } @else {
                <div class="product-card__placeholder">🍞</div>
              }
            </div>
            <div class="product-card__body">
              <strong>{{ product.name }}</strong>
              <div class="product-card__meta">
                <gmn-badge variant="neutral" size="sm">{{ categoryLabel(product.category) }}</gmn-badge>
                @if (isWeightProduct(product)) {
                  <gmn-badge variant="info" size="sm">{{ sellTypeLabel(product.sellType) }}</gmn-badge>
                } @else {
                  <gmn-badge variant="neutral" size="sm">{{ sellTypeLabel(product.sellType) }}</gmn-badge>
                }
              </div>
              <span class="product-card__price">
                {{ ar.dashboard.currency }} {{ product.price | number:'1.2-2' }}
              </span>
              <div class="product-card__actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(product)">{{ ar.products.edit }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(product)">{{ ar.products.delete }}</gmn-button>
              </div>
            </div>
          </gmn-card>
        } @empty {
          <p class="products__empty">
            {{ searchQuery().trim() ? ar.common.noSearchResults : ar.products.empty }}
          </p>
        }
      </div>
    </div>

    <gmn-modal
      [open]="showModal()"
      [title]="editingId() ? ar.products.edit : ar.products.add"
      size="md"
      (closed)="closeModal()"
    >
      <div class="product-form">
        <gmn-input [label]="ar.products.name" [(ngModel)]="form.name" />
        <div class="product-form__row">
          <gmn-input [label]="ar.products.price" type="number" [(ngModel)]="form.price" />
          <div class="product-form__field">
            <label>{{ ar.products.sellType }}</label>
            <select [(ngModel)]="form.sellType" class="product-form__select">
              @for (st of sellTypes(); track st.name) {
                <option [value]="st.name">{{ st.nameAr }}</option>
              }
            </select>
          </div>
        </div>
        <div class="product-form__field">
          <label>{{ ar.products.category }}</label>
          <select [(ngModel)]="form.category" class="product-form__select">
            @for (cat of categories(); track cat.name) {
              <option [value]="cat.name">{{ cat.nameAr }}</option>
            }
          </select>
        </div>
        <div class="product-form__field">
          <span class="product-form__label">{{ ar.products.image }}</span>
          <div
            class="image-drop"
            [class.image-drop--filled]="!!previewUrl()"
            role="button"
            tabindex="0"
            (click)="fileInput.click()"
            (keydown.enter)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <input
              #fileInput
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              (change)="onFileSelected($event)"
              (click)="$event.stopPropagation()"
            />
            @if (previewUrl()) {
              <img class="image-drop__preview" [src]="previewUrl()!" [alt]="ar.products.image" />
              <div class="image-drop__overlay">
                <span>{{ ar.products.imageChange }}</span>
              </div>
            } @else {
              <div class="image-drop__empty">
                <span class="image-drop__icon">📷</span>
                <strong>{{ ar.products.imagePick }}</strong>
                <small>{{ ar.products.imageHint }}</small>
              </div>
            }
          </div>
        </div>
        @if (formError()) {
          <p class="product-form__error">{{ formError() }}</p>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="closeModal()">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.products.save }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .products__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .products__search {
      margin-bottom: 1rem;
      max-width: 24rem;
    }
    .products__header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .products__header p {
      margin: 0.25rem 0 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .products__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
      gap: 1rem;
    }
    .products__empty {
      grid-column: 1 / -1;
      color: var(--text-muted);
      text-align: center;
      padding: 2rem;
    }
    .product-card__media {
      aspect-ratio: 1;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: var(--bg-surface-container);
      margin-bottom: 0.75rem;
    }
    .product-card__media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .product-card__placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      font-size: 2.5rem;
      opacity: 0.5;
    }
    .product-card__body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
    .product-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .product-card__price {
      font-weight: 700;
      color: var(--text-accent);
    }
    .product-card__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .product-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      direction: rtl;
    }
    .product-form__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .product-form__field label,
    .product-form__label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .product-form__select {
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
    .image-drop {
      position: relative;
      display: block;
      width: 100%;
      min-height: 10rem;
      border-radius: var(--radius-2xl);
      border: 1.5px dashed var(--border-default);
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--accent) 6%, transparent), transparent),
        var(--bg-surface-container);
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    }
    .image-drop:hover,
    .image-drop:focus-within,
    .image-drop--dragging {
      border-color: var(--text-accent);
      box-shadow: var(--shadow-focus);
    }
    .image-drop input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
    .image-drop__empty {
      min-height: 10rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 1.25rem;
      text-align: center;
      pointer-events: none;
    }
    .image-drop__icon {
      font-size: 1.75rem;
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    .image-drop__empty strong {
      color: var(--text-primary);
      font-size: 0.9375rem;
      font-weight: 700;
    }
    .image-drop__empty small {
      color: var(--text-muted);
      font-size: 0.75rem;
      line-height: 1.45;
      max-width: 16rem;
    }
    .image-drop__preview {
      display: block;
      width: 100%;
      height: 12rem;
      object-fit: cover;
    }
    .image-drop__overlay {
      position: absolute;
      inset: auto 0 0 0;
      padding: 0.65rem;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
      color: #fff;
      text-align: center;
      font-size: 0.8125rem;
      font-weight: 700;
      pointer-events: none;
    }
    .image-drop--filled {
      border-style: solid;
    }
    .product-form__error {
      margin: 0;
      color: var(--color-danger, #c62828);
      font-size: 0.8125rem;
      font-weight: 600;
    }
    @media (max-width: 640px) {
      .products__header {
        flex-direction: column;
        align-items: stretch;
      }
      .products__grid {
        grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      }
      .product-form__row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ProductsComponent implements OnInit {
  private api = inject(ApiService);
  private confirmDialog = inject(ConfirmDialogService);
  readonly ar = AR;

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  sellTypes = signal<SellType[]>([]);
  searchQuery = signal('');
  showModal = signal(false);
  saving = signal(false);
  formError = signal('');
  previewUrl = signal<string | null>(null);
  editingId = signal<string | null>(null);

  private selectedFile: File | null = null;

  form = {
    name: '',
    category: '',
    sellType: 'PIECE',
    price: '' as string | number,
  };

  filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.products();
    if (!q) return list;
    return list.filter((p) => {
      const category = this.categoryLabel(p.category).toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        category.includes(q) ||
        String(p.price).includes(q) ||
        p.sellType.toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.load();
    this.api.get<Category[]>('/categories').subscribe({
      next: (data) => this.categories.set(data.filter((c) => c.isActive)),
      error: () => this.categories.set([]),
    });
    this.api.get<SellType[]>('/sell-types').subscribe({
      next: (data) => this.sellTypes.set(data.filter((s) => s.isActive)),
      error: () => this.sellTypes.set([]),
    });
  }

  load(): void {
    this.api.get<Product[]>('/products').subscribe({
      next: (data) => this.products.set(data),
    });
  }

  imageUrl(image?: string): string | null {
    return productImageUrl(image);
  }

  categoryLabel(cat: string): string {
    return this.categories().find((c) => c.name === cat)?.nameAr ?? cat;
  }

  sellTypeLabel(code: string): string {
    return this.sellTypes().find((s) => s.name === code)?.nameAr
      ?? (code === 'WEIGHT' ? AR.products.weight : AR.products.piece);
  }

  isWeightProduct(product: Product): boolean {
    return isWeightPricing(product.sellType, this.sellTypes());
  }

  openNew(): void {
    this.editingId.set(null);
    this.form = {
      name: '',
      category: this.categories()[0]?.name ?? '',
      sellType: this.sellTypes().find((s) => s.name === 'PIECE')?.name
        ?? this.sellTypes()[0]?.name
        ?? 'PIECE',
      price: '',
    };
    this.clearImageSelection();
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editingId.set(product._id);
    this.form = {
      name: product.name,
      category: product.category,
      sellType: product.sellType,
      price: product.price,
    };
    this.selectedFile = null;
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(this.imageUrl(product.image));
    this.formError.set('');
    this.showModal.set(true);
  }

  async confirmDelete(product: Product): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      message: AR.products.confirmDelete,
      confirmLabel: AR.products.delete,
    });
    if (!ok) return;
    this.api.delete(`/products/${product._id}`).subscribe({
      next: () => this.load(),
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.clearImageSelection();
    this.formError.set('');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.applyImageFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement | null)?.classList.add('image-drop--dragging');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement | null)?.classList.remove('image-drop--dragging');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement | null)?.classList.remove('image-drop--dragging');
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (!file || !file.type.startsWith('image/')) return;
    this.applyImageFile(file);
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.formError.set(this.ar.products.nameRequired);
      return;
    }

    const editId = this.editingId();
    if (editId) {
      this.saveEdit(editId);
      return;
    }

    if (!this.selectedFile) {
      this.formError.set(this.ar.products.imageRequired);
      return;
    }

    const price = Number(this.form.price);
    if (this.form.price === '' || isNaN(price) || price < 0) {
      this.formError.set(this.ar.products.nameRequired);
      return;
    }

    const body = new FormData();
    body.append('name', this.form.name.trim());
    body.append('category', this.form.category);
    body.append('sellType', this.form.sellType);
    body.append('price', String(price));
    body.append('image', this.selectedFile, this.selectedFile.name);

    this.saving.set(true);
    this.api.upload<Product>('/products', body).subscribe({
      next: () => this.finishSave(),
      error: (err) => this.handleSaveError(err),
    });
  }

  private saveEdit(editId: string): void {
    const price = Number(this.form.price);
    if (this.form.price === '' || isNaN(price) || price < 0) {
      this.formError.set(this.ar.products.nameRequired);
      return;
    }
    this.saving.set(true);
    this.api
      .patch<Product>(`/products/${editId}`, {
        name: this.form.name.trim(),
        category: this.form.category,
        sellType: this.form.sellType,
        price,
      })
      .subscribe({
        next: () => {
          if (!this.selectedFile) {
            this.finishSave();
            return;
          }
          const body = new FormData();
          body.append('image', this.selectedFile, this.selectedFile.name);
          this.api.uploadPatch<Product>(`/products/${editId}/image`, body).subscribe({
            next: () => this.finishSave(),
            error: (err) => this.handleSaveError(err),
          });
        },
        error: (err) => this.handleSaveError(err),
      });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.closeModal();
    this.load();
  }

  private handleSaveError(err: { error?: { message?: string | string[] } }): void {
    this.saving.set(false);
    const msg = err.error?.message;
    this.formError.set(
      Array.isArray(msg) ? msg.join('، ') : msg || this.ar.products.saveError,
    );
  }

  private applyImageFile(file: File | null): void {
    this.selectedFile = file;
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
    this.formError.set('');
  }

  private clearImageSelection(): void {
    this.selectedFile = null;
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(null);
  }

  private revokePreview(url: string | null): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
