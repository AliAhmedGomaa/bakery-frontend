export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  HEAD_BAKER = 'HEAD_BAKER',
  STOREKEEPER = 'STOREKEEPER',
  ACCOUNTANT = 'ACCOUNTANT',
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export enum ProductCategory {
  BREAD = 'Bread',
  PASTRY = 'Pastry',
  BISCUITS = 'Biscuits',
}

export enum SellType {
  PIECE = 'PIECE',
  WEIGHT = 'WEIGHT',
}

export interface Product {
  _id: string;
  name: string;
  category: ProductCategory;
  sellType: SellType;
  price: number;
  barcode?: string;
  /** Relative path e.g. /uploads/products/xxx.jpg */
  image?: string;
}

export enum MaterialUnit {
  KG = 'kg',
  GRAM = 'gram',
  LITER = 'liter',
  PIECE = 'piece',
}

export interface RawMaterial {
  _id: string;
  name: string;
  unit: MaterialUnit;
  currentStock: number;
  minStockAlert: number;
  costPerUnit: number;
}

export interface RecipeIngredient {
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  quantityRequired: number;
}

export interface Recipe {
  _id: string;
  productId: string;
  product?: Product;
  ingredients: RecipeIngredient[];
}

export enum BatchStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ProductionBatch {
  _id: string;
  batchNumber: string;
  productId: string;
  product?: Product;
  targetQuantity: number;
  producedQuantity: number;
  wasteQuantity: number;
  status: BatchStatus;
  bakerId: string;
  date: string;
}

export enum PaymentType {
  CASH = 'CASH',
}

export interface CartItem {
  product: Product;
  quantity: number;
  weightInGrams: number | null;
  unitPrice: number;
  subtotal: number;
}

export interface SalePayload {
  orderNumber: string;
  cashierId: string;
  items: {
    productId: string;
    quantity: number;
    weightInGrams?: number;
    unitPrice: number;
    subtotal: number;
  }[];
  totalAmount: number;
  paymentType: PaymentType;
  shiftId?: string;
}
