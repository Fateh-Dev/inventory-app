export interface SupplierDto {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  wilaya: string;
  postalCode: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BrandDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface BrandModelDto {
  id: string;
  brandId: string;
  name: string;
  isActive: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface DepartmentDto {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface WarehouseDto {
  id: string;
  name: string;
  code: string;
  street: string;
  city: string;
  wilaya: string;
  postalCode: string;
  description?: string;
  isActive: boolean;
  responsiblePerson: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface StockItemDto {
  id: string;
  reference: string;
  name: string;
  description?: string;
  categoryName: string;
  categoryId: string;
  defaultUnit: string;
  defaultUnitId: number;
  brandId?: string;
  brandName?: string;
  brandModelId?: string;
  brandModelName?: string;
  requiresSerialNumber: boolean;
  hasExpiryDate: boolean;
  defaultLowStockThreshold: number;
  isActive: boolean;
  defaultSupplierId?: string;
  defaultSupplierName?: string;
  totalQuantity: number;
  isLowStock: boolean;
  expiringLotCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface StockLotDto {
  id: string;
  stockItemId: string;
  stockItemName: string;
  stockItemReference: string;
  warehouseId: string;
  warehouseName: string;
  lotNumber: string;
  serialNumber?: string;
  currentQuantity: number;
  currentUnit: string;
  initialQuantity: number;
  initialUnit: string;
  expiryDate?: Date;
  receivedAt: Date;
  unitCost: number;
  currency: string;
  isExpired: boolean;
  isLowStock: boolean;
  lowStockThreshold: number;
}

export interface StockMovementLineDto {
  id: string;
  stockItemId: string;
  stockItemName: string;
  stockItemReference: string;
  stockLotId: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  unitCost: number;
  currency: string;
  lineTotal: number;
  notes?: string;
  expiryDate?: string | Date;
  serialNumber?: string;
}

export interface StockMovementDto {
  id: string;
  movementNumber: string;
  type: string;
  typeId: number;
  status: string;
  statusId: number;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
  supplierId?: string;
  supplierName?: string;
  departmentId?: string;
  departmentName?: string;
  reference?: string;
  movementDate: Date;
  notes?: string;
  createdByUser: string;
  createdAt: Date;
  updatedAt?: Date;
  lines: StockMovementLineDto[];
  totalValue: number;
}

export interface StockAlertDto {
  id: string;
  stockItemId: string;
  stockItemReference: string;
  stockItemName: string;
  warehouseId?: string;
  warehouseName?: string;
  severity: string;
  severityId: number;
  message: string;
  alertType: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
}

export interface CategoryStockDto {
  category: string;
  itemCount: number;
  totalQuantity: number;
}

export interface StockSummaryDto {
  totalItems: number;
  activeItems: number;
  lowStockCount: number;
  expiringCount: number;
  expiredCount: number;
  totalWarehouses: number;
  unreadAlerts: number;
  categoryBreakdown: CategoryStockDto[];
}
