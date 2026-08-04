export enum Permission {
  DASHBOARD = 'dashboard',
  POS = 'pos',
  PRODUCTS = 'products',
  PRODUCTION = 'production',
  INVENTORY = 'inventory',
  USERS = 'users',
  BRANDING = 'branding',
  CATEGORIES = 'categories',
  SELL_TYPES = 'sell_types',
  ROLES = 'roles',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export interface AppRole {
  _id: string;
  code: string;
  nameAr: string;
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Category {
  _id: string;
  name: string;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}

export type PricingMode = 'UNIT' | 'WEIGHT';

export interface SellType {
  _id: string;
  name: string;
  nameAr: string;
  pricingMode: PricingMode;
  sortOrder: number;
  isActive: boolean;
}

export interface User {
  _id?: string;
  id: string;
  name: string;
  mobile: string;
  role: string;
  roleNameAr?: string;
  permissions?: Permission[];
  isActive?: boolean;
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

export interface Product {
  _id: string;
  name: string;
  category: string;
  /** Matches SellType.name */
  sellType: string;
  price: number;
  barcode?: string;
  /** Relative path e.g. /uploads/products/xxx.jpg */
  image?: string;
}

/** True when POS should open the weight entry modal for this product. */
export function isWeightPricing(
  sellTypeCode: string | undefined,
  sellTypes: SellType[],
): boolean {
  if (!sellTypeCode) return false;
  const match = sellTypes.find((s) => s.name === sellTypeCode);
  if (match) return match.pricingMode === 'WEIGHT';
  return sellTypeCode === 'WEIGHT';
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
