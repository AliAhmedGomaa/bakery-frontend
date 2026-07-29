import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import {
  GmnButtonComponent,
  GmnInputComponent,
  GmnBadgeComponent,
  GmnModalComponent,
} from '../../shared/components';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { OfflineStoreService } from '../../core/services/offline-store.service';
import {
  Product,
  Category,
  SellType,
  CartItem,
  PaymentType,
  SalePayload,
} from '../../core/models/types';
import { AR } from '../../core/i18n/ar';
import { productImageUrl } from '../../core/utils/product-image';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    GmnButtonComponent,
    GmnInputComponent,
    GmnBadgeComponent,
    GmnModalComponent,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private offline = inject(OfflineStoreService);

  readonly ar = AR;
  readonly categories = signal<Category[]>([]);
  readonly isOnline = this.offline.isOnline;
  readonly queueCount = this.offline.queueCount;
  readonly imageUrl = productImageUrl;

  products = signal<Product[]>([]);
  searchQuery = signal('');
  activeCategory = signal<string | null>(null);
  cart = signal<CartItem[]>([]);
  showPayment = signal(false);
  showWeightModal = signal(false);
  weightProduct = signal<Product | null>(null);
  weightInput = '';
  discount = signal(0);
  processing = signal(false);

  filteredProducts = computed(() => {
    let list = this.products();
    const cat = this.activeCategory();
    const q = this.searchQuery().toLowerCase().trim();

    if (cat) list = list.filter((p) => p.category === cat);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q));

    return list;
  });

  cartTotal = computed(() => {
    const sum = this.cart().reduce((acc, item) => acc + item.subtotal, 0);
    return Math.max(0, sum - this.discount());
  });

  cartItemCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));

  ngOnInit(): void {
    this.api.get<Product[]>('/products').subscribe({
      next: (data) => this.products.set(data),
    });
    this.api.get<Category[]>('/categories').subscribe({
      next: (data) => this.categories.set(data.filter((c) => c.isActive)),
      error: () => this.categories.set([]),
    });
  }

  setCategory(cat: string | null): void {
    this.activeCategory.set(cat);
  }

  categoryLabel(cat: Category): string {
    return cat.nameAr || cat.name;
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  addToCart(product: Product): void {
    if (product.sellType === SellType.WEIGHT) {
      this.weightProduct.set(product);
      this.weightInput = '';
      this.showWeightModal.set(true);
      return;
    }

    this.cart.update((items) => {
      const existing = items.find((i) => i.product._id === product._id);
      if (existing) {
        return items.map((i) =>
          i.product._id === product._id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i,
        );
      }
      return [...items, {
        product,
        quantity: 1,
        weightInGrams: null,
        unitPrice: product.price,
        subtotal: product.price,
      }];
    });
  }

  confirmWeight(): void {
    const product = this.weightProduct();
    const grams = parseFloat(this.weightInput);
    if (!product || isNaN(grams) || grams <= 0) return;

    const subtotal = (grams / 1000) * product.price;
    this.cart.update((items) => [
      ...items,
      {
        product,
        quantity: 1,
        weightInGrams: grams,
        unitPrice: product.price,
        subtotal: Math.round(subtotal * 100) / 100,
      },
    ]);

    this.showWeightModal.set(false);
    this.weightProduct.set(null);
  }

  updateQuantity(index: number, delta: number): void {
    this.cart.update((items) => {
      const item = items[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return items.filter((_, i) => i !== index);
      return items.map((it, i) =>
        i === index
          ? { ...it, quantity: newQty, subtotal: newQty * it.unitPrice }
          : it,
      );
    });
  }

  removeFromCart(index: number): void {
    this.cart.update((items) => items.filter((_, i) => i !== index));
  }

  clearCart(): void {
    this.cart.set([]);
    this.discount.set(0);
  }

  submitSale(): void {
    const items = this.cart();
    if (items.length === 0) return;

    this.processing.set(true);
    const user = this.auth.user();

    const sale: SalePayload = {
      orderNumber: `ORD-${Date.now()}`,
      cashierId: user?.id ?? '',
      items: items.map((i) => ({
        productId: i.product._id,
        quantity: i.quantity,
        ...(i.weightInGrams !== null && { weightInGrams: i.weightInGrams }),
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      totalAmount: this.cartTotal(),
      paymentType: PaymentType.CASH,
    };

    if (!this.isOnline()) {
      this.offline.enqueue(sale);
      this.finishSale();
      return;
    }

    this.api.post('/sales', sale).subscribe({
      next: () => this.finishSale(),
      error: () => {
        this.offline.enqueue(sale);
        this.finishSale();
      },
    });
  }

  private finishSale(): void {
    this.processing.set(false);
    this.showPayment.set(false);
    this.clearCart();
  }
}
