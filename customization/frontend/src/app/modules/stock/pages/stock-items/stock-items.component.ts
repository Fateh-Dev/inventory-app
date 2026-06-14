import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { StockService } from '../../../../services/stock.service';
import { StockItemDto, SupplierDto, BrandDto, BrandModelDto, CategoryDto, StockLotDto } from '../../models/stock.models';
import { PrintService } from '../../../../services/print.service';
import { ExportService } from '../../../../services/export.service';
import { TranslationService } from '../../../../services/translation.service';

const UNITS = ['Piece','Liter','Kilogram','Meter','SquareMeter','CubicMeter','Box','Pallet','Roll','Bag','Can','Set'];

@Component({
  selector: 'app-stock-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            {{ t.t('items_title') }}
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" [title]="t.t('info_items_title')"></i>
          </h1>
          <p class="page-subtitle">{{ t.t('items_subtitle') }}</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="exportCsv()">
            <i class="pi pi-download"></i> {{ t.t('items_btn_export') }}
          </button>
          <button class="btn btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> {{ t.t('items_btn_add') }}
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" [placeholder]="t.t('items_search_placeholder')" (ngModelChange)="onSearchChange()">
        </div>
        <select class="form-select" style="width:180px" [(ngModel)]="filterCategoryId" (change)="onFilterChange()">
          <option value="">{{ t.t('items_filter_category') }}</option>
          @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterLowStock" (change)="onFilterChange()"> {{ t.t('items_filter_low') }}
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterActive" (change)="onFilterChange()"> {{ t.t('items_filter_active') }}
        </label>
      </div>

      <!-- Tableau -->
      <div class="card" style="padding:0; overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-box"></i>
            <h3>{{ t.t('items_empty') }}</h3>
            <p>{{ t.t('items_empty_desc') }}</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t.t('items_tbl_ref') }}</th>
                <th>{{ t.t('items_tbl_name') }}</th>
                <th>{{ t.t('items_tbl_cat') }}</th>
                <th>{{ t.t('items_tbl_unit') }}</th>
                <th>{{ t.t('items_tbl_qty') }}</th>
                <th>{{ t.t('items_tbl_status') }}</th>
                <th style="text-align:right">{{ t.t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item.id) {
                <tr>
                  <td>
                    <span style="font-family:monospace;font-size:12px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;color:var(--accent)">
                      {{ item.reference }}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:600;">{{ item.name }}</div>
                    @if (item.brandName) {
                      <div style="font-size:11px;color:var(--text-muted)">{{ item.brandName }} {{ item.brandModelName }}</div>
                    }
                  </td>
                  <td><span class="badge badge-muted">{{ item.categoryName }}</span></td>
                  <td style="color:var(--text-muted)">{{ unitLocal(item.defaultUnit) }}</td>
                  <td>
                    <span [style.color]="item.isLowStock ? 'var(--danger)' : 'var(--success)'" style="font-weight:700;">
                      {{ item.totalQuantity | number:'1.0-2' }}
                    </span>
                    @if (item.isLowStock) {
                      <span class="badge badge-danger" style="margin-left:6px;font-size:10px;">{{ t.t('badge_low') }}</span>
                    }
                    @if (item.expiringLotCount > 0) {
                      <span class="badge badge-warning" style="margin-left:4px;font-size:10px;">{{ item.expiringLotCount }} {{ t.t('badge_expiring') }}</span>
                    }
                  </td>
                  <td>
                    @if (item.isActive) {
                      <span class="badge badge-success">{{ t.t('active') }}</span>
                    } @else {
                      <span class="badge badge-muted">{{ t.t('inactive') }}</span>
                    }
                  </td>
                  <td style="text-align:right">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      <button class="btn btn-secondary btn-sm" (click)="openHistory(item)" [title]="t.t('history_title')">
                        <i class="pi pi-search"></i>
                      </button>
                      <button class="btn btn-secondary btn-sm" (click)="openEdit(item)" [title]="t.t('edit')">
                        <i class="pi pi-pencil"></i>
                      </button>
                      @if (item.isActive) {
                        <button class="btn btn-danger btn-sm" (click)="confirmToggleActive(item)" [title]="t.t('deactivate_title')">
                          <i class="pi pi-ban"></i>
                        </button>
                      } @else {
                        <button class="btn btn-success btn-sm" (click)="confirmToggleActive(item)" [title]="t.t('active')">
                          <i class="pi pi-check"></i>
                        </button>
                      }
                      <button class="btn btn-danger btn-sm" (click)="confirmDelete(item)" [title]="t.t('delete')">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-top:1px solid var(--border); background:var(--bg-base);">
            <span style="font-size:13px; color:var(--text-muted);">{{ t.t('page') }} {{ pageNumber() }}</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-sm" [disabled]="pageNumber() <= 1" (click)="prevPage()">
                <i class="pi pi-chevron-left"></i> {{ t.t('previous') }}
              </button>
              <button class="btn btn-secondary btn-sm" [disabled]="!hasMore()" (click)="nextPage()">
                {{ t.t('next') }} <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modal Création / Modification -->
      @if (showModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:640px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editItem() ? t.t('items_modal_edit') : t.t('items_modal_create') }}</h2>
              <button class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_ref') }}</label>
                  <input class="form-input" [(ngModel)]="form.reference" [placeholder]="t.t('items_placeholder_ref')" [disabled]="!!editItem()">
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_name') }}</label>
                  <input class="form-input" [(ngModel)]="form.name" [placeholder]="t.t('items_placeholder_name')">
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_cat') }}</label>
                  <div class="input-group-append">
                    <select class="form-select" [(ngModel)]="form.categoryId">
                      @for (c of categories(); track c.id) { 
                        <option [value]="c.id" [disabled]="!c.isActive && form.categoryId !== c.id">
                          {{ c.name }}{{ !c.isActive ? t.t('inactive_suffix') : '' }}
                        </option> 
                      }
                    </select>
                    <button class="btn-icon" (click)="openQuickAdd('category')" [title]="t.t('quick_add_title_category')">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_unit') }}</label>
                  <select class="form-select" [(ngModel)]="form.defaultUnit">
                    @for (u of units; track u) { <option [value]="u">{{ unitLocal(u) }}</option> }
                  </select>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_brand') }}</label>
                  <div class="input-group-append">
                    <select class="form-select" [(ngModel)]="form.brandId" (change)="onBrandChange()">
                      <option value="">{{ t.t('items_option_no_brand') }}</option>
                      @for (b of brands(); track b.id) {
                        <option [value]="b.id" [disabled]="!b.isActive && form.brandId !== b.id">
                          {{ b.name }}{{ !b.isActive ? t.t('inactive_suffix') : '' }}
                        </option>
                      }
                    </select>
                    <button class="btn-icon" (click)="openQuickAdd('brand')" [title]="t.t('quick_add_title_brand')">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_model') }}</label>
                  <div class="input-group-append">
                    <select class="form-select" [(ngModel)]="form.brandModelId" [disabled]="!form.brandId">
                      <option value="">{{ t.t('items_option_no_model') }}</option>
                      @for (m of models(); track m.id) {
                        <option [value]="m.id">{{ m.name }}</option>
                      }
                    </select>
                    <button class="btn-icon" (click)="openQuickAdd('model')" [disabled]="!form.brandId" [title]="t.t('quick_add_title_model')">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_threshold') }}</label>
                  <input class="form-input" type="number" [(ngModel)]="form.defaultLowStockThreshold" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t.t('items_modal_supplier') }}</label>
                  <select class="form-select" [(ngModel)]="form.defaultSupplierId">
                    <option value="">{{ t.t('items_option_no_supplier') }}</option>
                    @for (s of suppliers(); track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ t.t('items_modal_desc') }}</label>
                <textarea class="form-textarea" [(ngModel)]="form.description" [placeholder]="t.t('items_placeholder_desc')"></textarea>
              </div>
              <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-primary);">
                  <input type="checkbox" [(ngModel)]="form.requiresSerialNumber"> {{ t.t('items_modal_serial') }}
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-primary);">
                  <input type="checkbox" [(ngModel)]="form.hasExpiryDate"> {{ t.t('items_modal_expiry') }}
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">{{ t.t('cancel') }}</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                {{ editItem() ? t.t('btn_update') : t.t('btn_create') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Quick Add Modals -->
      @if (quickAddType()) {
        <div class="modal-overlay" style="z-index: 2000;">
          <div class="modal-panel" style="max-width: 400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ t.t('quick_add_title_' + quickAddType()) }}</h3>
              <button class="modal-close" (click)="closeQuickAdd()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">{{ t.t('quick_add_name') }}</label>
                <input class="form-input" [(ngModel)]="quickAddForm.name" [placeholder]="t.t('quick_add_placeholder_' + quickAddType())">
              </div>
              @if (quickAddType() === 'category') {
                <div class="form-group" style="margin-top: 1rem;">
                  <label class="form-label">{{ t.t('quick_add_code') }}</label>
                  <input class="form-input" [(ngModel)]="quickAddForm.code" [placeholder]="t.t('quick_add_placeholder_code')">
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="closeQuickAdd()">{{ t.t('cancel') }}</button>
              <button class="btn btn-primary btn-sm" (click)="saveQuickAdd()" [disabled]="!quickAddForm.name || savingQuickAdd()">
                @if (savingQuickAdd()) { <div class="spinner" style="width:12px;height:12px;border-width:2px;"></div> }
                {{ t.t('add') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Confirmation Dialog -->
      @if (itemToDeactivate()) {
        <div class="modal-overlay" style="z-index: 2000;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">{{ t.t('deactivate_title') }}</h2>
            <p class="confirm-message">
              {{ t.t('deactivate_confirm_p1') }} <strong>{{ itemToDeactivate()?.name }}</strong> ?<br>
              {{ t.t('deactivate_confirm_p2') }}
            </p>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="cancelDeactivate()">{{ t.t('cancel') }}</button>
              <button class="btn btn-danger" (click)="executeDeactivate()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;"></div> }
                {{ t.t('deactivate_btn_yes') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Fiche Article & Historique -->
      @if (showHistoryModal() && selectedItem()) {
        <div class="modal-overlay" style="z-index: 1500;">
          <div class="modal-panel" style="max-width:900px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">{{ t.t('history_title') }}: {{ selectedItem()?.name }}</h2>
                <p style="font-size:12px;color:var(--text-muted);margin-top:2px;">{{ t.t('history_ref_prefix') }}<code style="font-size:12px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;color:var(--accent)">{{ selectedItem()?.reference }}</code></p>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-secondary btn-sm" (click)="printItemCard()"><i class="pi pi-print"></i> {{ t.t('history_btn_print') }}</button>
                <button class="btn btn-secondary btn-sm" (click)="exportHistoryCsv()"><i class="pi pi-download"></i> {{ t.t('history_btn_export') }}</button>
                <button class="modal-close" (click)="showHistoryModal.set(false)"><i class="pi pi-times"></i></button>
              </div>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
              <!-- Grid info + lots -->
              <div class="form-grid" style="grid-template-columns: 1fr 1.5fr; gap: 20px;">
                <!-- Infos techniques -->
                <div class="card" style="margin-bottom:0; padding:16px;">
                  <h3 style="margin-top:0;margin-bottom:12px;font-size:14px;border-bottom:1px solid var(--border);padding-bottom:6px;color:var(--accent);">{{ t.t('history_specs_title') }}</h3>
                  <table style="width:100%;font-size:13px;border-collapse:collapse;">
                    <tr style="border-bottom:1px solid var(--border-light);"><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('items_tbl_cat') }}:</td><td style="padding:6px 0;font-weight:600;">{{ selectedItem()?.categoryName }}</td></tr>
                    <tr style="border-bottom:1px solid var(--border-light);"><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('items_modal_brand') }}:</td><td style="padding:6px 0;font-weight:600;">{{ selectedItem()?.brandName || '—' }}</td></tr>
                    <tr style="border-bottom:1px solid var(--border-light);"><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('items_modal_model') }}:</td><td style="padding:6px 0;font-weight:600;">{{ selectedItem()?.brandModelName || '—' }}</td></tr>
                    <tr style="border-bottom:1px solid var(--border-light);"><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('items_tbl_unit') }}:</td><td style="padding:6px 0;font-weight:600;">{{ unitLocal(selectedItem()!.defaultUnit) }}</td></tr>
                    <tr style="border-bottom:1px solid var(--border-light);"><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('history_stock_total') }}</td><td style="padding:6px 0;font-weight:700;" [style.color]="selectedItem()!.isLowStock ? 'var(--danger)' : 'var(--success)'">{{ selectedItem()?.totalQuantity }}</td></tr>
                    <tr style="border-bottom:1px solid var(--border-light);"><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('history_stock_threshold') }}</td><td style="padding:6px 0;font-weight:600;">{{ selectedItem()?.defaultLowStockThreshold }}</td></tr>
                    <tr><td style="padding:6px 0;color:var(--text-muted);">{{ t.t('history_status') }}</td><td style="padding:6px 0;"><span class="badge" [ngClass]="selectedItem()!.isActive ? 'badge-success' : 'badge-muted'">{{ selectedItem()!.isActive ? t.t('active') : t.t('inactive') }}</span></td></tr>
                  </table>
                </div>

                <!-- Répartition par dépôt -->
                <div class="card" style="margin-bottom:0; padding:16px;">
                  <h3 style="margin-top:0;margin-bottom:12px;font-size:14px;border-bottom:1px solid var(--border);padding-bottom:6px;color:var(--accent);">{{ t.t('history_lots_title') }}</h3>
                  @if (selectedItemLots().length === 0) {
                    <p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">{{ t.t('history_no_lots') }}</p>
                  } @else {
                    <div style="max-height:165px;overflow-y:auto;">
                      <table style="width:100%;font-size:12px;border-collapse:collapse;">
                        <thead>
                          <tr style="border-bottom:2px solid var(--border);text-align:left;color:var(--text-muted);">
                            <th style="padding:4px;">{{ t.t('history_tbl_lot_num') }}</th>
                            <th style="padding:4px;">{{ t.t('warehouse') }}</th>
                            <th style="padding:4px;text-align:right;">{{ t.t('quantity') }}</th>
                            <th style="padding:4px;">{{ t.t('history_tbl_expiry') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (lot of selectedItemLots(); track lot.id) {
                            @if (lot.currentQuantity > 0) {
                              <tr style="border-bottom:1px solid var(--border-light);">
                                <td style="padding:5px 4px;"><code style="font-family:monospace;font-size:11px;">{{ lot.lotNumber }}</code></td>
                                <td style="padding:5px 4px;">{{ lot.warehouseName }}</td>
                                <td style="padding:5px 4px;text-align:right;font-weight:600;">{{ lot.currentQuantity }}</td>
                                <td style="padding:5px 4px;">{{ lot.expiryDate ? (lot.expiryDate | date:'dd/MM/yyyy') : '—' }}</td>
                              </tr>
                            }
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              </div>

              <!-- Historique des mouvements -->
              <div class="card" style="margin-top:20px; margin-bottom:0; padding:16px;">
                <h3 style="margin-top:0;margin-bottom:12px;font-size:14px;border-bottom:1px solid var(--border);padding-bottom:6px;color:var(--accent);">{{ t.t('history_mvt_title') }}</h3>
                @if (loadingHistory()) {
                  <div style="text-align:center;padding:20px;"><div class="spinner"></div></div>
                } @else if (selectedItemHistory().length === 0) {
                  <p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px;">{{ t.t('history_no_mvt') }}</p>
                } @else {
                  <table style="width:100%;font-size:12px;border-collapse:collapse;">
                    <thead>
                      <tr style="border-bottom:2px solid var(--border);text-align:left;color:var(--text-muted);font-weight:bold;">
                        <th style="padding:6px 4px;">{{ t.t('date') }}</th>
                        <th style="padding:6px 4px;">{{ t.t('mvt_tbl_num') }}</th>
                        <th style="padding:6px 4px;">{{ t.t('type') }}</th>
                        <th style="padding:6px 4px;text-align:right;">{{ t.t('quantity') }}</th>
                        <th style="padding:6px 4px;">{{ t.t('mvt_tbl_src') }}</th>
                        <th style="padding:6px 4px;">{{ t.t('mvt_tbl_dest') }}</th>
                        <th style="padding:6px 4px;">{{ t.t('mvt_tbl_operator') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (h of selectedItemHistory(); track h.movementId) {
                        <tr style="border-bottom:1px solid var(--border-light);">
                          <td style="padding:6px 4px;">{{ h.movementDate | date:'dd/MM/yyyy' }}</td>
                          <td style="padding:6px 4px;"><span style="font-family:monospace;color:var(--accent)">{{ h.movementNumber }}</span></td>
                          <td style="padding:6px 4px;">{{ typeLocal(h.type) }}</td>
                          <td style="padding:6px 4px;text-align:right;font-weight:600;">{{ h.quantity }} {{ unitLocal(h.unit) }}</td>
                          <td style="padding:6px 4px;color:var(--text-muted);">{{ h.sourceWarehouseName || h.supplierName || '—' }}</td>
                          <td style="padding:6px 4px;color:var(--text-muted);">{{ h.destinationWarehouseName || h.departmentName || '—' }}</td>
                          <td style="padding:6px 4px;color:var(--text-muted);">{{ h.createdByUser }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                  <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:8px; border-top:1px solid var(--border);">
                    <span style="font-size:11px; color:var(--text-muted);">{{ t.t('page') }} {{ historyPage() }}</span>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-secondary btn-xs" [disabled]="historyPage() <= 1" (click)="prevHistoryPage()">
                        <i class="pi pi-chevron-left" style="font-size:10px;"></i> {{ t.t('previous') }}
                      </button>
                      <button class="btn btn-secondary btn-xs" [disabled]="!hasMoreHistory()" (click)="nextHistoryPage()">
                        {{ t.t('next') }} <i class="pi pi-chevron-right" style="font-size:10px;"></i>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showHistoryModal.set(false)">{{ t.t('close') }}</button>
            </div>
          </div>
        </div>
      }
      
      <!-- Info Modal -->
      @if (showInfoModal()) {
        <div class="modal-overlay" style="z-index: 2100;">
          <div class="modal-panel" style="max-width:500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                <i class="pi pi-info-circle" style="color:var(--accent)"></i>
                {{ t.t('info_items_title') }}
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>{{ t.t('items_modal_desc') }} :</strong><br>
                {{ t.t('info_items_desc') }}
              </p>
              <p style="margin-bottom:8px;"><strong>{{ t.t('info_items_features_title') }}</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>{{ t.t('info_items_f1_title') }} : {{ t.t('info_items_f1_text') }}</li>
                <li>{{ t.t('info_items_f2_title') }} : {{ t.t('info_items_f2_text') }}</li>
                <li>{{ t.t('info_items_f3_title') }} : {{ t.t('info_items_f3_text') }}</li>
                <li>{{ t.t('info_items_f4_title') }} : {{ t.t('info_items_f4_text') }}</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showInfoModal.set(false)">{{ t.t('close') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="modal-overlay" style="z-index: 2000;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper" style="background:rgba(239, 68, 68, 0.1);color:#ef4444;">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">{{ t.t('delete_item_title') }}</h2>
            <p class="confirm-message">
              {{ deleteModalMessage() }}
            </p>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="showDeleteModal.set(false)">{{ t.t('cancel') }}</button>
              <button class="btn btn-danger" (click)="executeDelete()">{{ t.t('delete') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Custom Alert Dialog -->
      @if (customAlert()) {
        <div class="modal-overlay" style="z-index: 2200;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper" [style.background]="customAlert()?.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : (customAlert()?.severity === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)')" [style.color]="customAlert()?.severity === 'error' ? '#ef4444' : (customAlert()?.severity === 'success' ? '#10b981' : '#f59e0b')">
              <i class="pi" [ngClass]="customAlert()?.severity === 'error' ? 'pi-times-circle' : (customAlert()?.severity === 'success' ? 'pi-check-circle' : 'pi-exclamation-triangle')"></i>
            </div>
            <h2 class="modal-title">{{ customAlert()?.title }}</h2>
            <div class="confirm-message" style="text-align: left; margin-top: 12px; color: var(--text-primary);">
              <p style="margin-bottom: 8px;">{{ customAlert()?.message }}</p>
              @if (customAlert()?.list && customAlert()!.list!.length > 0) {
                <ul style="padding-left: 20px; list-style-type: disc; display: flex; flex-direction: column; gap: 4px; color: var(--text-secondary);">
                  @for (item of customAlert()!.list; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              }
            </div>
            <div class="modal-footer" style="justify-content: center; margin-top: 24px;">
              <button class="btn btn-primary" (click)="closeCustomAlert()">{{ t.t('ok') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .confirm-panel {
        max-width: 400px !important;
        text-align: center;
        padding: 32px 24px !important;
      }

      .confirm-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin: 0 auto 16px;
      }

      .confirm-message {
        color: var(--text-muted);
        font-size: 14.5px;
        line-height: 1.5;
        margin-top: 8px;
      }
    `
  ]
})
export class StockItemsComponent implements OnInit {
  private stockService = inject(StockService);
  private printService = inject(PrintService);
  private exportService = inject(ExportService);
  private route = inject(ActivatedRoute);
  public t = inject(TranslationService);

  showInfoModal = signal(false);
  customAlert = signal<{ title: string; message: string; severity?: 'error' | 'warning' | 'success'; list?: string[] } | null>(null);

  closeCustomAlert() {
    this.customAlert.set(null);
  }
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<StockItemDto | null>(null);
  itemToDeactivate = signal<StockItemDto | null>(null);

  // New deletion signals
  showDeleteModal = signal(false);
  deleteModalMessage = signal('');
  deleteAction = signal<(() => void) | null>(null);

  // New Fiche Article / History signals
  showHistoryModal = signal(false);
  selectedItem = signal<StockItemDto | null>(null);
  selectedItemLots = signal<StockLotDto[]>([]);
  selectedItemHistory = signal<any[]>([]);
  loadingHistory = signal(false);
  historyPage = signal(1);
  hasMoreHistory = signal(true);

  items = signal<StockItemDto[]>([]);
  suppliers = signal<SupplierDto[]>([]);
  brands = signal<BrandDto[]>([]);
  models = signal<BrandModelDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  filtered = signal<StockItemDto[]>([]);

  search = '';
  filterCategoryId = '';
  filterLowStock = false;
  filterActive = true;

  pageNumber = signal(1);
  pageSize = signal(25);
  hasMore = signal(true);

  units = UNITS;
  form: any = {};

  // Quick Add
  quickAddType = signal<'category' | 'brand' | 'model' | null>(null);
  quickAddForm: any = { name: '', code: '' };
  savingQuickAdd = signal(false);

  ngOnInit() { 
    this.load(); 
    this.loadReferenceData();
    this.route.queryParams.subscribe(params => {
      const selectId = params['selectId'];
      if (selectId) {
        this.stockService.getStockItem(selectId).subscribe(item => {
          if (item) this.openHistory(item);
        });
      }
    });
  }

  loadReferenceData() {
    this.stockService.getCategories(false).subscribe(c => this.categories.set(c));
    this.stockService.getBrands(false).subscribe(b => this.brands.set(b));
    this.stockService.getSuppliers(false).subscribe(s => this.suppliers.set(s));
  }

  onBrandChange() {
    this.form.brandModelId = '';
    if (this.form.brandId) {
      this.stockService.getModels(this.form.brandId).subscribe(m => this.models.set(m));
    } else {
      this.models.set([]);
    }
  }

  load() {
    this.loading.set(true);
    this.stockService.getStockItems({
      categoryId: this.filterCategoryId || undefined,
      activeOnly: this.filterActive || undefined,
      lowStockOnly: this.filterLowStock || undefined,
      searchTerm: this.search || undefined,
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize()
    }).subscribe({
      next: (items) => {
        this.items.set(items);
        this.applyFilter();
        this.loading.set(false);
        this.hasMore.set(items.length >= this.pageSize());
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    this.filtered.set(this.items());
  }

  onSearchChange() {
    this.pageNumber.set(1);
    this.load();
  }

  onFilterChange() {
    this.pageNumber.set(1);
    this.load();
  }

  prevPage() {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(p => p - 1);
      this.load();
    }
  }

  nextPage() {
    if (this.hasMore()) {
      this.pageNumber.update(p => p + 1);
      this.load();
    }
  }

  openCreate() {
    this.editItem.set(null);
    const firstCat = this.categories().length > 0 ? this.categories()[0].id : '';
    this.form = {
      reference: '', name: '', categoryId: firstCat, defaultUnit: 'Piece',
      brandId: '', brandModelId: '', description: '', defaultLowStockThreshold: 5,
      requiresSerialNumber: false, hasExpiryDate: false, defaultSupplierId: ''
    };
    this.models.set([]);
    this.showModal.set(true);
  }

  openEdit(item: StockItemDto) {
    this.editItem.set(item);
    this.form = {
      reference: item.reference, name: item.name, categoryId: item.categoryId,
      defaultUnit: item.defaultUnit, brandId: item.brandId ?? '', brandModelId: item.brandModelId ?? '',
      description: item.description ?? '', defaultLowStockThreshold: item.defaultLowStockThreshold,
      requiresSerialNumber: item.requiresSerialNumber, hasExpiryDate: item.hasExpiryDate,
      defaultSupplierId: item.defaultSupplierId ?? ''
    };
    if (this.form.brandId) {
      this.stockService.getModels(this.form.brandId).subscribe(m => this.models.set(m));
    } else {
      this.models.set([]);
    }
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  // Quick Add Logic
  openQuickAdd(type: 'category' | 'brand' | 'model') {
    this.quickAddType.set(type);
    this.quickAddForm = { name: '', code: '' };
  }

  closeQuickAdd() { this.quickAddType.set(null); }

  quickAddLabel(): string {
    switch (this.quickAddType()) {
      case 'category': return 'une catégorie';
      case 'brand': return 'une marque';
      case 'model': return 'un modèle';
      default: return '';
    }
  }

  saveQuickAdd() {
    if (!this.quickAddForm.name) return;
    this.savingQuickAdd.set(true);
    
    let obs: Observable<any>;
    const type = this.quickAddType();

    if (type === 'category') obs = this.stockService.createCategory(this.quickAddForm.name, this.quickAddForm.code);
    else if (type === 'brand') obs = this.stockService.createBrand(this.quickAddForm.name);
    else if (type === 'model') obs = this.stockService.createModel(this.form.brandId, this.quickAddForm.name);
    else return;

    obs.subscribe({
      next: (res: any) => {
        this.savingQuickAdd.set(false);
        if (type === 'category') {
          this.loadReferenceData();
          this.form.categoryId = res.id;
        } else if (type === 'brand') {
          this.loadReferenceData();
          this.form.brandId = res.id;
          this.onBrandChange();
        } else if (type === 'model') {
          this.onBrandChange();
          this.form.brandModelId = res.id;
        }
        this.closeQuickAdd();
      },
      error: () => this.savingQuickAdd.set(false)
    });
  }

  validateForm(): boolean {
    const missing: string[] = [];
    if (!this.form.reference?.trim()) {
      missing.push(this.t.t('items_tbl_ref'));
    }
    if (!this.form.name?.trim()) {
      missing.push(this.t.t('items_tbl_name'));
    }
    if (!this.form.categoryId) {
      missing.push(this.t.t('items_tbl_cat'));
    }
    if (!this.form.defaultUnit) {
      missing.push(this.t.t('items_modal_unit').replace(' *', ''));
    }

    if (missing.length > 0) {
      this.customAlert.set({
        title: this.t.t('validation_title'),
        message: this.t.t('validation_desc'),
        severity: "warning",
        list: missing
      });
      return false;
    }
    return true;
  }

  save() {
    if (!this.validateForm()) return;
    this.saving.set(true);
    const payload = { 
      ...this.form, 
      defaultSupplierId: this.form.defaultSupplierId || null,
      brandId: this.form.brandId || null,
      brandModelId: this.form.brandModelId || null
    };
    const req = this.editItem()
      ? this.stockService.updateStockItem(this.editItem()!.id, { id: this.editItem()!.id, ...payload })
      : this.stockService.createStockItem(payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmToggleActive(item: StockItemDto) {
    if (item.isActive) {
      this.itemToDeactivate.set(item);
    } else {
      const req = this.stockService.activateStockItem(item.id);
      req.subscribe({ next: () => this.load() });
    }
  }

  cancelDeactivate() {
    this.itemToDeactivate.set(null);
  }

  executeDeactivate() {
    const item = this.itemToDeactivate();
    if (!item) return;

    this.saving.set(true);
    this.stockService.deactivateStockItem(item.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.itemToDeactivate.set(null);
        this.load();
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  unitLocal(u: string): string {
    if (!u) return '';
    const key = 'unit_' + u.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    return this.t.t(key);
  }

  typeLocal(type: string): string {
    if (!type) return '';
    const key = 'mvt_type_' + type.toLowerCase();
    return this.t.t(key);
  }

  exportCsv() {
    const data = this.items().map(item => ({
      [this.t.t('items_tbl_ref')]: item.reference,
      [this.t.t('items_tbl_name')]: item.name,
      [this.t.t('items_tbl_cat')]: item.categoryName,
      [this.t.t('items_modal_brand')]: item.brandName || '—',
      [this.t.t('items_modal_model')]: item.brandModelName || '—',
      [this.t.t('items_tbl_unit')]: this.unitLocal(item.defaultUnit),
      [this.t.t('items_tbl_qty')]: item.totalQuantity,
      [this.t.t('items_modal_threshold')]: item.defaultLowStockThreshold,
      [this.t.t('items_tbl_status')]: item.isActive ? this.t.t('active') : this.t.t('inactive')
    }));
    this.exportService.exportToCsv(data, 'articles_stock');
  }

  confirmDelete(item: StockItemDto) {
    this.deleteModalMessage.set(this.t.t('delete_item_confirm').replace('{name}', item.name));
    this.deleteAction.set(() => this.deleteItem(item));
    this.showDeleteModal.set(true);
  }

  deleteItem(item: StockItemDto) {
    this.stockService.deleteStockItem(item.id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.load();
      }
    });
  }

  executeDelete() {
    const action = this.deleteAction();
    if (action) action();
  }

  openHistory(item: StockItemDto) {
    this.selectedItem.set(item);
    this.selectedItemLots.set([]);
    this.selectedItemHistory.set([]);
    this.historyPage.set(1);
    this.hasMoreHistory.set(true);
    this.showHistoryModal.set(true);
    this.loadHistoryData();
  }

  loadHistoryData() {
    const item = this.selectedItem();
    if (!item) return;

    this.loadingHistory.set(true);
    
    // Fetch active lots
    this.stockService.getStockItemLots(item.id, false).subscribe({
      next: (lots) => this.selectedItemLots.set(lots)
    });

    // Fetch movement history
    this.stockService.getItemHistory(item.id, this.historyPage(), 10).subscribe({
      next: (history) => {
        this.selectedItemHistory.set(history);
        this.hasMoreHistory.set(history.length >= 10);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  prevHistoryPage() {
    if (this.historyPage() > 1) {
      this.historyPage.update(p => p - 1);
      this.loadHistoryData();
    }
  }

  nextHistoryPage() {
    if (this.hasMoreHistory()) {
      this.historyPage.update(p => p + 1);
      this.loadHistoryData();
    }
  }

  printItemCard() {
    const item = this.selectedItem();
    if (!item) return;
    this.printService.printItemCard(item, this.selectedItemLots(), this.selectedItemHistory());
  }

  exportHistoryCsv() {
    const item = this.selectedItem();
    if (!item) return;
    const data = this.selectedItemHistory().map(h => ({
      [this.t.t('date')]: new Date(h.movementDate).toLocaleDateString(this.t.currentLang() === 'ar' ? 'ar-EG' : (this.t.currentLang() === 'en' ? 'en-US' : 'fr-FR')),
      [this.t.t('mvt_tbl_num')]: h.movementNumber,
      [this.t.t('type')]: this.typeLocal(h.type),
      [this.t.t('quantity')]: h.quantity,
      [this.t.t('items_tbl_unit')]: this.unitLocal(h.unit),
      [this.t.t('mvt_tbl_lot')]: h.lotNumber || '—',
      [this.t.t('mvt_tbl_src')]: h.sourceWarehouseName || h.supplierName || '—',
      [this.t.t('mvt_tbl_dest')]: h.destinationWarehouseName || h.departmentName || '—',
      [this.t.t('mvt_tbl_operator')]: h.createdByUser || '—'
    }));
    this.exportService.exportToCsv(data, `historique_${item.reference}`);
  }
}
