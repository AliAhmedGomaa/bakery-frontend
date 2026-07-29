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
import { BrandingService } from '../../core/branding/branding.service';
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
  private branding = inject(BrandingService);
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
  printAfterSale = signal(false);

  readonly weightPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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
    const kg = parseFloat(this.weightInput);
    if (!product || isNaN(kg) || kg <= 0) return;

    const grams = Math.round(kg * 1000 * 1000) / 1000;
    const subtotal = kg * product.price;
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

  selectWeightPreset(kg: number): void {
    this.weightInput = String(kg);
  }

  isWeightPresetActive(kg: number): boolean {
    return parseFloat(this.weightInput) === kg;
  }

  formatWeightKg(grams: number): string {
    const kg = grams / 1000;
    return Number.isInteger(kg) ? String(kg) : kg.toFixed(3).replace(/\.?0+$/, '');
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

  submitSale(withPrint = false): void {
    const items = this.cart();
    if (items.length === 0) return;

    this.printAfterSale.set(withPrint);
    this.processing.set(true);
    const user = this.auth.user();
    const orderNumber = `ORD-${Date.now()}`;
    const totalAmount = this.cartTotal();
    const discountAmount = this.discount();
    const receiptItems = items.map((i) => ({ ...i }));

    const sale: SalePayload = {
      orderNumber,
      cashierId: user?.id ?? '',
      items: items.map((i) => ({
        productId: i.product._id,
        quantity: i.quantity,
        ...(i.weightInGrams !== null && { weightInGrams: i.weightInGrams }),
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      totalAmount,
      paymentType: PaymentType.CASH,
    };

    const complete = (): void => {
      if (withPrint) {
        this.printReceipt({
          orderNumber,
          items: receiptItems,
          totalAmount,
          discountAmount,
          cashierName: user?.name ?? '',
        });
      }
      this.finishSale();
    };

    if (!this.isOnline()) {
      this.offline.enqueue(sale);
      complete();
      return;
    }

    this.api.post('/sales', sale).subscribe({
      next: () => complete(),
      error: () => {
        this.offline.enqueue(sale);
        complete();
      },
    });
  }

  private finishSale(): void {
    this.processing.set(false);
    this.printAfterSale.set(false);
    this.showPayment.set(false);
    this.clearCart();
  }

  private printReceipt(data: {
    orderNumber: string;
    items: CartItem[];
    totalAmount: number;
    discountAmount: number;
    cashierName: string;
  }): void {
    const appName = this.branding.branding().appName?.trim() || AR.appName;
    const currency = AR.dashboard.currency;
    const now = new Date();
    const dateStr = now.toLocaleString('ar-EG');

    const rows = data.items
      .map((item) => {
        const qty =
          item.weightInGrams !== null
            ? `${this.formatWeightKg(item.weightInGrams)} ${AR.pos.kg}`
            : String(item.quantity);
        return `
          <tr>
            <td>${this.escapeHtml(item.product.name)}</td>
            <td class="num">${this.escapeHtml(qty)}</td>
            <td class="num">${item.subtotal.toFixed(2)}</td>
          </tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(AR.pos.receipt)} — ${this.escapeHtml(data.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      margin: 0;
      padding: 12px;
      color: #111;
      width: 80mm;
      max-width: 100%;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 18px;
      text-align: center;
    }
    .meta {
      text-align: center;
      font-size: 12px;
      color: #444;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th, td {
      padding: 6px 2px;
      border-bottom: 1px dashed #ccc;
      text-align: right;
      vertical-align: top;
    }
    th { font-weight: 700; }
    .num { text-align: left; white-space: nowrap; }
    .totals {
      margin-top: 10px;
      font-size: 13px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .totals .grand {
      font-size: 16px;
      font-weight: 700;
      border-top: 1px solid #111;
      margin-top: 6px;
      padding-top: 8px;
    }
    .thanks {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
    }
    @media print {
      body { width: 80mm; }
      @page { margin: 4mm; size: auto; }
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(appName)}</h1>
  <div class="meta">
    <div>${this.escapeHtml(AR.pos.receipt)}</div>
    <div>${this.escapeHtml(AR.pos.orderNumber)}: ${this.escapeHtml(data.orderNumber)}</div>
    <div>${this.escapeHtml(dateStr)}</div>
    ${data.cashierName ? `<div>${this.escapeHtml(AR.pos.cashier)}: ${this.escapeHtml(data.cashierName)}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>${this.escapeHtml(AR.products.name)}</th>
        <th class="num">${this.escapeHtml(AR.pos.qty)}</th>
        <th class="num">${this.escapeHtml(AR.pos.price)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    ${
      data.discountAmount > 0
        ? `<div class="row"><span>${this.escapeHtml(AR.pos.discount)}</span><span>${currency} ${data.discountAmount.toFixed(2)}</span></div>`
        : ''
    }
    <div class="row grand"><span>${this.escapeHtml(AR.pos.total)}</span><span>${currency} ${data.totalAmount.toFixed(2)}</span></div>
  </div>
  <p class="thanks">${this.escapeHtml(AR.pos.thankYou)}</p>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=420,height=640');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
