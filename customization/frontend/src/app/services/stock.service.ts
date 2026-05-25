import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SupplierDto,
  WarehouseDto,
  StockItemDto,
  StockLotDto,
  StockMovementDto,
  StockAlertDto,
  StockSummaryDto,
  BrandDto,
  BrandModelDto,
  CategoryDto
} from '../modules/stock/models/stock.models';

const API_URL = 'http://localhost:5270';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private base = `${API_URL}/api/stock`; // Global prefix for all stock module controllers

  // ── Dashboard ───────────────────────────────
  getSummary(): Observable<StockSummaryDto> {
    return this.http.get<StockSummaryDto>(`${this.base}/StockAlerts/summary`);
  }

  // ── Suppliers ───────────────────────────────
  getSuppliers(activeOnly?: boolean): Observable<SupplierDto[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<SupplierDto[]>(`${this.base}/Suppliers`, { params });
  }

  getSupplier(id: string): Observable<SupplierDto> {
    return this.http.get<SupplierDto>(`${this.base}/Suppliers/${id}`);
  }

  createSupplier(data: Partial<SupplierDto>): Observable<SupplierDto> {
    return this.http.post<SupplierDto>(`${this.base}/Suppliers`, data);
  }

  updateSupplier(id: string, data: Partial<SupplierDto>): Observable<SupplierDto> {
    return this.http.put<SupplierDto>(`${this.base}/Suppliers/${id}`, data);
  }

  deactivateSupplier(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Suppliers/${id}/deactivate`, {});
  }

  activateSupplier(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Suppliers/${id}/activate`, {});
  }

  // ── Warehouses ──────────────────────────────
  getWarehouses(activeOnly?: boolean): Observable<WarehouseDto[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<WarehouseDto[]>(`${this.base}/Warehouses`, { params });
  }

  getWarehouse(id: string): Observable<WarehouseDto> {
    return this.http.get<WarehouseDto>(`${this.base}/Warehouses/${id}`);
  }

  getWarehouseStock(id: string): Observable<StockLotDto[]> {
    return this.http.get<StockLotDto[]>(`${this.base}/Warehouses/${id}/stock`);
  }

  createWarehouse(data: Partial<WarehouseDto>): Observable<WarehouseDto> {
    return this.http.post<WarehouseDto>(`${this.base}/Warehouses`, data);
  }

  updateWarehouse(id: string, data: Partial<WarehouseDto>): Observable<WarehouseDto> {
    return this.http.put<WarehouseDto>(`${this.base}/Warehouses/${id}`, data);
  }

  deactivateWarehouse(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Warehouses/${id}/deactivate`, {});
  }

  activateWarehouse(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Warehouses/${id}/activate`, {});
  }

  // ── Stock Items ─────────────────────────────
  getStockItems(filters?: {
    categoryId?: string;
    activeOnly?: boolean;
    lowStockOnly?: boolean;
    hasExpiryOnly?: boolean;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<StockItemDto[]> {
    let params = new HttpParams();
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters?.activeOnly !== undefined) params = params.set('activeOnly', filters.activeOnly);
    if (filters?.lowStockOnly !== undefined) params = params.set('lowStockOnly', filters.lowStockOnly);
    if (filters?.hasExpiryOnly !== undefined) params = params.set('hasExpiryOnly', filters.hasExpiryOnly);
    if (filters?.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    if (filters?.pageNumber !== undefined) params = params.set('pageNumber', filters.pageNumber);
    if (filters?.pageSize !== undefined) params = params.set('pageSize', filters.pageSize);
    return this.http.get<StockItemDto[]>(`${this.base}/StockItems`, { params });
  }

  getStockItem(id: string): Observable<StockItemDto> {
    return this.http.get<StockItemDto>(`${this.base}/StockItems/${id}`);
  }

  getStockItemLots(id: string, excludeExpired?: boolean): Observable<StockLotDto[]> {
    let params = new HttpParams();
    if (excludeExpired !== undefined) params = params.set('excludeExpired', excludeExpired);
    return this.http.get<StockLotDto[]>(`${this.base}/StockItems/${id}/lots`, { params });
  }

  createStockItem(data: any): Observable<StockItemDto> {
    return this.http.post<StockItemDto>(`${this.base}/StockItems`, data);
  }

  updateStockItem(id: string, data: any): Observable<StockItemDto> {
    return this.http.put<StockItemDto>(`${this.base}/StockItems/${id}`, data);
  }

  deactivateStockItem(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/StockItems/${id}/deactivate`, {});
  }

  activateStockItem(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/StockItems/${id}/activate`, {});
  }

  // ── Movements ───────────────────────────────
  getMovements(filters?: {
    type?: string;
    status?: string;
    warehouseId?: string;
    supplierId?: string;
    fromDate?: string;
    toDate?: string;
    includeLines?: boolean;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<StockMovementDto[]> {
    let params = new HttpParams();
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.warehouseId) params = params.set('warehouseId', filters.warehouseId);
    if (filters?.supplierId) params = params.set('supplierId', filters.supplierId);
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    if (filters?.includeLines !== undefined) params = params.set('includeLines', filters.includeLines);
    if (filters?.searchTerm) params = params.set('searchTerm', filters.searchTerm);
    if (filters?.pageNumber !== undefined) params = params.set('pageNumber', filters.pageNumber);
    if (filters?.pageSize !== undefined) params = params.set('pageSize', filters.pageSize);
    return this.http.get<StockMovementDto[]>(`${this.base}/StockMovements`, { params });
  }

  getMovement(id: string): Observable<StockMovementDto> {
    return this.http.get<StockMovementDto>(`${this.base}/StockMovements/${id}`);
  }

  createMovement(data: any): Observable<StockMovementDto> {
    return this.http.post<StockMovementDto>(`${this.base}/StockMovements`, data);
  }

  cancelMovement(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/StockMovements/${id}/cancel`, { reason });
  }

  // ── Alerts ──────────────────────────────────
  getAlerts(filters?: {
    unreadOnly?: boolean;
    unresolvedOnly?: boolean;
    stockItemId?: string;
  }): Observable<StockAlertDto[]> {
    let params = new HttpParams();
    if (filters?.unreadOnly !== undefined) params = params.set('unreadOnly', filters.unreadOnly);
    if (filters?.unresolvedOnly !== undefined) params = params.set('unresolvedOnly', filters.unresolvedOnly);
    if (filters?.stockItemId) params = params.set('stockItemId', filters.stockItemId);
    return this.http.get<StockAlertDto[]>(`${this.base}/StockAlerts`, { params });
  }

  markAlertRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/StockAlerts/${id}/read`, {});
  }

  resolveAlert(id: string, resolution: string): Observable<void> {
    return this.http.post<void>(`${this.base}/StockAlerts/${id}/resolve`, { resolution });
  }

  // ── Brands & Models ────────────────────────
  getBrands(activeOnly?: boolean): Observable<BrandDto[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<BrandDto[]>(`${this.base}/Brands`, { params });
  }

  getModels(brandId?: string): Observable<BrandModelDto[]> {
    let params = new HttpParams();
    if (brandId) params = params.set('brandId', brandId);
    return this.http.get<BrandModelDto[]>(`${this.base}/Brands/models`, { params });
  }

  createBrand(name: string): Observable<BrandDto> {
    return this.http.post<BrandDto>(`${this.base}/Brands`, { name });
  }

  updateBrand(id: string, name: string): Observable<BrandDto> {
    return this.http.put<BrandDto>(`${this.base}/Brands/${id}`, { id, name });
  }

  createModel(brandId: string, name: string): Observable<BrandModelDto> {
    return this.http.post<BrandModelDto>(`${this.base}/Brands/models`, { brandId, name });
  }

  updateModel(id: string, name: string): Observable<BrandModelDto> {
    return this.http.put<BrandModelDto>(`${this.base}/Brands/models/${id}`, { id, name });
  }

  getCategories(activeOnly?: boolean): Observable<CategoryDto[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<CategoryDto[]>(`${this.base}/Categories`, { params });
  }

  createCategory(name: string, code?: string): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(`${this.base}/Categories`, { name, code });
  }

  updateCategory(id: string, name: string, code?: string): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.base}/Categories/${id}`, { id, name, code });
  }

  // ── Departments ────────────────────────────
  getDepartments(activeOnly?: boolean): Observable<any[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<any[]>(`${this.base}/Departments`, { params });
  }

  createDepartment(name: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.base}/Departments`, { name, code });
  }

  updateDepartment(id: string, name: string, code: string): Observable<any> {
    return this.http.put<any>(`${this.base}/Departments/${id}`, { id, name, code });
  }
}
