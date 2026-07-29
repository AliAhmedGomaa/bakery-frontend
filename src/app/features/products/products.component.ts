import { Component, OnInit, inject, signal } from '@angular/core';
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
import { Category, Product, SellType } from '../../core/models/types';
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

      <div class="products__grid">
        @for (product of products(); track product._id) {
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
                @if (product.sellType === 'WEIGHT') {
                  <gmn-badge variant="info" size="sm">{{ ar.pos.byWeight }}</gmn-badge>
                }
              </div>
              <span class="product-card__price">
                {{ ar.dashboard.currency }} {{ product.price | number:'1.2-2' }}
              </span>
              <div class="product-card__actions">
                <gmn-button variant="ghost" size="sm" (clicked)="openEdit(product)">{{ ar.products.edit }}</gmn-button>
                <gmn-button variant="ghost" size="sm" (clicked)="openImageReplace(product)">{{ ar.products.changeImage }}</gmn-button>
                <gmn-button variant="danger" size="sm" (clicked)="confirmDelete(product)">{{ ar.products.delete }}</gmn-button>
              </div>
            </div>
          </gmn-card>
        } @empty {
          <p class="products__empty">{{ ar.products.empty }}</p>
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
          <div class="product-form__field">
            <label>{{ ar.products.category }}</label>
            <select [(ngModel)]="form.category" class="product-form__select">
              @for (cat of categories(); track cat.name) {
                <option [value]="cat.name">{{ cat.nameAr }}</option>
              }
            </select>
          </div>
          <div class="product-form__field">
            <label>{{ ar.products.sellType }}</label>
            <select [(ngModel)]="form.sellType" class="product-form__select">
              <option [value]="SellType.PIECE">{{ ar.products.piece }}</option>
              <option [value]="SellType.WEIGHT">{{ ar.products.weight }}</option>
            </select>
          </div>
        </div>
        <div class="product-form__row">
          <gmn-input [label]="ar.products.price" type="number" [(ngModel)]="form.price" />
          <gmn-input [label]="ar.products.barcode" [(ngModel)]="form.barcode" />
        </div>
        @if (!editingId()) {
          <div class="product-form__field">
            <label>{{ ar.products.image }}</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="product-form__file"
              (change)="onFileSelected($event)"
            />
            @if (previewUrl()) {
              <img class="product-form__preview" [src]="previewUrl()!" [alt]="ar.products.image" />
            }
            <small>{{ ar.products.imageHint }}</small>
          </div>
        }
        @if (formError()) {
          <p class="product-form__error">{{ formError() }}</p>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="closeModal()">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="save()">{{ ar.products.save }}</gmn-button>
      </div>
    </gmn-modal>

    <gmn-modal
      [open]="showImageModal()"
      [title]="ar.products.changeImage"
      [subtitle]="imageTarget()?.name ?? ''"
      size="sm"
      (closed)="closeImageModal()"
    >
      <div class="product-form">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="product-form__file"
          (change)="onReplaceFileSelected($event)"
        />
        @if (replacePreviewUrl()) {
          <img class="product-form__preview" [src]="replacePreviewUrl()!" [alt]="ar.products.image" />
        }
        @if (formError()) {
          <p class="product-form__error">{{ formError() }}</p>
        }
      </div>
      <div footer>
        <gmn-button variant="ghost" (clicked)="closeImageModal()">{{ ar.pos.cancel }}</gmn-button>
        <gmn-button variant="primary" [loading]="saving()" (clicked)="saveImage()">{{ ar.products.saveImage }}</gmn-button>
      </div>
    </gmn-modal>
  `,
  styles: [`
    .products__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
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
    .product-form__field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }
    .product-form__select,
    .product-form__file {
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
    .product-form__file {
      padding-top: 0.55rem;
      cursor: pointer;
    }
    .product-form__preview {
      margin-top: 0.75rem;
      width: 100%;
      max-height: 12rem;
      object-fit: cover;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-subtle);
    }
    .product-form__field small {
      display: block;
      margin-top: 0.35rem;
      color: var(--text-muted);
      font-size: 0.75rem;
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
  readonly SellType = SellType;

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  showModal = signal(false);
  showImageModal = signal(false);
  saving = signal(false);
  formError = signal('');
  previewUrl = signal<string | null>(null);
  replacePreviewUrl = signal<string | null>(null);
  imageTarget = signal<Product | null>(null);
  editingId = signal<string | null>(null);

  private selectedFile: File | null = null;
  private replaceFile: File | null = null;

  form = {
    name: '',
    category: '',
    sellType: SellType.PIECE,
    price: 0,
    barcode: '',
  };

  ngOnInit(): void {
    this.load();
    this.api.get<Category[]>('/categories').subscribe({
      next: (data) => this.categories.set(data.filter((c) => c.isActive)),
      error: () => this.categories.set([]),
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

  openNew(): void {
    this.editingId.set(null);
    this.form = {
      name: '',
      category: this.categories()[0]?.name ?? '',
      sellType: SellType.PIECE,
      price: 0,
      barcode: '',
    };
    this.selectedFile = null;
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(null);
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
      barcode: product.barcode ?? '',
    };
    this.selectedFile = null;
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(null);
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
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(null);
    this.selectedFile = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.revokePreview(this.previewUrl());
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
    this.formError.set('');
  }

  openImageReplace(product: Product): void {
    this.imageTarget.set(product);
    this.replaceFile = null;
    this.revokePreview(this.replacePreviewUrl());
    this.replacePreviewUrl.set(null);
    this.formError.set('');
    this.showImageModal.set(true);
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
    this.imageTarget.set(null);
    this.revokePreview(this.replacePreviewUrl());
    this.replacePreviewUrl.set(null);
    this.replaceFile = null;
  }

  onReplaceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.replaceFile = file;
    this.revokePreview(this.replacePreviewUrl());
    this.replacePreviewUrl.set(file ? URL.createObjectURL(file) : null);
    this.formError.set('');
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.formError.set(this.ar.products.nameRequired);
      return;
    }

    const editId = this.editingId();
    if (editId) {
      this.saving.set(true);
      this.api
        .patch<Product>(`/products/${editId}`, {
          name: this.form.name.trim(),
          category: this.form.category,
          sellType: this.form.sellType,
          price: this.form.price,
          barcode: this.form.barcode.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.closeModal();
            this.load();
          },
          error: (err: { error?: { message?: string | string[] } }) => {
            this.saving.set(false);
            const msg = err.error?.message;
            this.formError.set(
              Array.isArray(msg) ? msg.join('، ') : msg || this.ar.products.saveError,
            );
          },
        });
      return;
    }

    if (!this.selectedFile) {
      this.formError.set(this.ar.products.imageRequired);
      return;
    }

    const body = new FormData();
    body.append('name', this.form.name.trim());
    body.append('category', this.form.category);
    body.append('sellType', this.form.sellType);
    body.append('price', String(this.form.price));
    if (this.form.barcode.trim()) {
      body.append('barcode', this.form.barcode.trim());
    }
    body.append('image', this.selectedFile, this.selectedFile.name);

    this.saving.set(true);
    this.api.upload<Product>('/products', body).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const msg = err.error?.message;
        this.formError.set(
          Array.isArray(msg) ? msg.join('، ') : msg || this.ar.products.saveError,
        );
      },
    });
  }

  saveImage(): void {
    const product = this.imageTarget();
    if (!product || !this.replaceFile) {
      this.formError.set(this.ar.products.imageRequired);
      return;
    }

    const body = new FormData();
    body.append('image', this.replaceFile, this.replaceFile.name);

    this.saving.set(true);
    this.api.uploadPatch<Product>(`/products/${product._id}/image`, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeImageModal();
        this.load();
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const msg = err.error?.message;
        this.formError.set(
          Array.isArray(msg) ? msg.join('، ') : msg || this.ar.products.saveError,
        );
      },
    });
  }

  private revokePreview(url: string | null): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
