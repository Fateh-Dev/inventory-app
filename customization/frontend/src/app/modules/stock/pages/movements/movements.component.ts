import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { AuthService } from '../../../../services/auth.service';
import { PrintService } from '../../../../services/print.service';
import { ExportService } from '../../../../services/export.service';
import { StockMovementDto, SupplierDto, WarehouseDto, DepartmentDto, StockItemDto, StockLotDto } from '../../models/stock.models';
import { TranslationService } from '../../../../services/translation.service';

@Component({ 
  selector: 'app-movements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            {{ t.t('mvt_title') }}
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" [title]="t.t('mvt_info_title')"></i>
          </h1>
          <p class="page-subtitle">{{ t.t('mvt_subtitle') }}</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="exportCsv()">
            <i class="pi pi-download"></i> {{ t.t('items_btn_export') }}
          </button>
          <button class="btn btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> {{ t.t('mvt_btn_new') }}
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box" style="max-width:200px;">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" [placeholder]="t.t('mvt_filter_num_placeholder')" (ngModelChange)="onSearchChange()">
        </div>
        <select class="form-select" style="width:170px" [(ngModel)]="filterType" (change)="onFilterChange()">
          <option value="">{{ t.t('mvt_filter_type') }}</option>
          <option value="Reception">{{ t.t('mvt_type_reception') }}</option>
          <option value="Issue">{{ t.t('mvt_type_issue') }}</option>
          <option value="Transfer">{{ t.t('mvt_type_transfer') }}</option>
          <option value="Return">{{ t.t('mvt_type_return') }}</option>
          <option value="Adjustment">{{ t.t('mvt_type_adjustment') }}</option>
          <option value="Disposal">{{ t.t('mvt_type_disposal') }}</option>
        </select>
        <select class="form-select" style="width:160px" [(ngModel)]="filterStatus" (change)="onFilterChange()">
          <option value="">{{ t.t('mvt_filter_status') }}</option>
          <option value="Pending">{{ t.t('mvt_status_pending') }}</option>
          <option value="Confirmed">{{ t.t('mvt_status_confirmed') }}</option>
          <option value="Cancelled">{{ t.t('mvt_status_cancelled') }}</option>
        </select>
        <input class="form-input" type="date" [(ngModel)]="fromDate" (change)="onFilterChange()" style="width:150px" [title]="t.t('mvt_filter_start_date')">
        <input class="form-input" type="date" [(ngModel)]="toDate" (change)="onFilterChange()" style="width:150px" [title]="t.t('mvt_filter_end_date')">
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-arrow-right-arrow-left"></i>
            <h3>{{ t.t('mvt_empty') }}</h3>
            <p>{{ t.t('mvt_empty_desc') }}</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t.t('mvt_tbl_num') }}</th>
                <th>{{ t.t('type') }}</th>
                <th>{{ t.t('status') }}</th>
                <th>{{ t.t('date') }}</th>
                <th>{{ t.t('mvt_tbl_src') }}</th>
                <th>{{ t.t('mvt_tbl_dest_dept') }}</th>
                <th>{{ t.t('mvt_tbl_lines') }}</th>
                <th style="text-align:right">{{ t.t('mvt_tbl_total_value') }}</th>
                <th style="text-align:right">{{ t.t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (m of filtered(); track m.id) {
                <tr>
                  <td>
                    <span style="font-family:monospace;font-size:12px;color:var(--accent);background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;">
                      {{ m.movementNumber }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getTypeBadge(m.type)">{{ typeLocal(m.type) }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadge(m.status)">{{ statusLocal(m.status) }}</span>
                  </td>
                  <td style="color:var(--text-muted);font-size:12.5px;">{{ m.movementDate | date:'dd/MM/yyyy' }}</td>
                  <td style="font-size:12.5px;">{{ m.sourceWarehouseName ?? m.supplierName ?? '—' }}</td>
                  <td style="font-size:12.5px;">{{ m.destinationWarehouseName ?? m.departmentName ?? '—' }}</td>
                  <td style="text-align:center;color:var(--text-muted);">{{ m.lines.length }}</td>
                  <td style="text-align:right;font-weight:700;color:var(--success);">
                    @if (m.type === 'Reception') {
                      {{ m.totalValue | number:'1.2-2' }} DZD
                    } @else {
                      —
                    }
                  </td>
                  <td style="text-align:right; white-space:nowrap;">
                    @if (m.status === 'Pending') {
                      <button class="btn btn-primary btn-sm" style="margin-right:4px;" (click)="confirmMovement(m)" [title]="t.t('mvt_action_confirm')">
                        <i class="pi pi-check"></i>
                      </button>
                      <button class="btn btn-secondary btn-sm" style="margin-right:4px;" (click)="editMovement(m)" [title]="t.t('edit')">
                        <i class="pi pi-pencil"></i>
                      </button>
                    }
                    @if (m.status === 'Confirmed') {
                      <button class="btn btn-secondary btn-sm" style="margin-right:4px;" (click)="printMovement(m)" [title]="t.t('mvt_action_print')">
                        <i class="pi pi-print"></i>
                      </button>
                    }
                    <button class="btn btn-secondary btn-sm" (click)="viewDetail(m)" [title]="t.t('mvt_action_view')">
                      <i class="pi pi-eye"></i>
                    </button>
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

      <!-- Modal détail -->
      @if (selectedMovement()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:720px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">{{ selectedMovement()!.movementNumber }}</h2>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                  {{ typeLocal(selectedMovement()!.type) }} · {{ selectedMovement()!.movementDate | date:'dd/MM/yyyy' }} · {{ selectedMovement()!.createdByUser }}
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <span class="badge" [ngClass]="getStatusBadge(selectedMovement()!.status)">{{ statusLocal(selectedMovement()!.status) }}</span>
                @if (selectedMovement()!.status === 'Confirmed') {
                  <button class="btn btn-secondary btn-sm" (click)="printMovement(selectedMovement()!)" [title]="t.t('mvt_action_print')">
                    <i class="pi pi-print"></i> {{ t.t('history_btn_print') }}
                  </button>
                }
                <button class="modal-close" (click)="selectedMovement.set(null)"><i class="pi pi-times"></i></button>
              </div>
            </div>
            <div class="modal-body">
              <!-- Méta -->
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
                @if (selectedMovement()!.sourceWarehouseName) {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">{{ t.t('mvt_lbl_src_title') }}</div>
                    <div style="font-size:13px;font-weight:600;">{{ selectedMovement()!.sourceWarehouseName }}</div>
                  </div>
                }
                @if (selectedMovement()!.destinationWarehouseName || selectedMovement()!.departmentName) {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">{{ t.t('mvt_lbl_dest_title') }}</div>
                    <div style="font-size:13px;font-weight:600;">{{ selectedMovement()!.destinationWarehouseName ?? selectedMovement()!.departmentName }}</div>
                  </div>
                }
                @if (selectedMovement()!.supplierName) {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">{{ t.t('mvt_lbl_supplier_title') }}</div>
                    <div style="font-size:13px;font-weight:600;">{{ selectedMovement()!.supplierName }}</div>
                  </div>
                }
                @if (selectedMovement()!.type === 'Reception') {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">{{ t.t('mvt_lbl_val_title') }}</div>
                    <div style="font-size:16px;font-weight:800;color:var(--success);">{{ selectedMovement()!.totalValue | number:'1.2-2' }} DZD</div>
                  </div>
                }
              </div>

              <!-- Tableau des lignes -->
              @if (selectedMovement()!.lines.length > 0) {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>{{ t.t('mvt_lines_article') }}</th>
                      <th>{{ t.t('mvt_tbl_lot') }}</th>
                      <th>{{ t.t('quantity') }}</th>
                      @if (selectedMovement()!.type === 'Reception') {
                        <th>{{ t.t('mvt_lines_cost') }}</th>
                        <th style="text-align:right">{{ t.t('mvt_detail_line_total') }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of selectedMovement()!.lines; track line.id) {
                      <tr>
                        <td>
                          <div style="font-weight:600;font-size:13px;">{{ line.stockItemName }}</div>
                          <div style="font-size:11px;color:var(--accent);font-family:monospace;">{{ line.stockItemReference }}</div>
                        </td>
                        <td style="font-family:monospace;font-size:12px;color:var(--text-muted);">{{ line.lotNumber }}</td>
                        <td style="font-weight:700;">{{ line.quantity }} {{ unitLocal(line.unit) }}</td>
                        @if (selectedMovement()!.type === 'Reception') {
                          <td style="color:var(--text-muted);">{{ line.unitCost }} {{ line.currency }}</td>
                          <td style="text-align:right;font-weight:700;color:var(--success);">{{ line.lineTotal | number:'1.2-2' }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p style="color:var(--text-muted);text-align:center;padding:20px;">{{ t.t('mvt_lines_empty') }}</p>
              }

              @if (selectedMovement()!.notes) {
                <div style="margin-top:16px;padding:12px;background:var(--bg-base);border-radius:8px;border:1px solid var(--border);">
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">{{ t.t('mvt_modal_notes') }}</div>
                  <div style="font-size:13px;color:var(--text-primary);">{{ selectedMovement()!.notes }}</div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedMovement.set(null)">{{ t.t('close') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal création de mouvement -->
      @if (showCreateModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:850px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editingId() ? t.t('mvt_modal_edit') : t.t('mvt_modal_create') }}</h2>
              <button class="modal-close" (click)="showCreateModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">{{ t.t('mvt_modal_type') }}</label>
                  <select class="form-select" [(ngModel)]="createForm.type">
                    <option value="Reception">{{ t.t('mvt_type_reception') }}</option>
                    <option value="Issue">{{ t.t('mvt_type_issue') }}</option>
                    <option value="Transfer">{{ t.t('mvt_type_transfer') }}</option>
                    <option value="Return">{{ t.t('mvt_type_return') }}</option>
                    <option value="Adjustment">{{ t.t('mvt_type_adjustment') }}</option>
                    <option value="Disposal">{{ t.t('mvt_type_disposal') }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t.t('mvt_modal_date') }}</label>
                  <input class="form-input" type="date" [(ngModel)]="createForm.movementDate">
                </div>
              </div>
              <div class="form-grid">
                @if (createForm.type === 'Reception') {
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_dest_wh') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.destinationWarehouseId">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_supplier') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.supplierId">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (sup of suppliers(); track sup.id) { <option [value]="sup.id">{{ sup.name }}</option> }
                    </select>
                  </div>
                } @else if (createForm.type === 'Issue' || createForm.type === 'Disposal') {
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_src_wh') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId" (change)="resetNewLine()">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_dept') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.departmentId">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (dep of departments(); track dep.id) { <option [value]="dep.id">{{ dep.name }}</option> }
                    </select>
                  </div>
                } @else if (createForm.type === 'Transfer') {
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_src_wh') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId" (change)="resetNewLine()">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_dest_wh') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.destinationWarehouseId">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                } @else {
                  <div class="form-group">
                    <label class="form-label">{{ t.t('mvt_modal_wh_general') }}</label>
                    <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId" (change)="resetNewLine()">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                }
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">{{ t.t('mvt_modal_ref_ext') }}</label>
                  <input class="form-input" [(ngModel)]="createForm.reference" [placeholder]="t.t('mvt_placeholder_ref_ext')">
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t.t('mvt_modal_operator') }}</label>
                  <input type="text" class="form-input" [(ngModel)]="createForm.createdByUser" readonly style="background-color: var(--bg-hover); color: var(--text-muted); cursor: not-allowed;">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ t.t('mvt_modal_notes') }}</label>
                <textarea class="form-textarea" [(ngModel)]="createForm.notes" [placeholder]="t.t('mvt_placeholder_notes')"></textarea>
              </div>

              <!-- LIGNES -->
              <h3 style="margin-top:20px;margin-bottom:12px;font-size:15px;border-bottom:1px solid var(--border);padding-bottom:8px;">{{ t.t('mvt_lines_title') }}</h3>
              
              @if (createForm.lines?.length > 0) {
                <table class="data-table" style="margin-bottom:12px; font-size: 13px;">
                  <thead>
                    <tr>
                      <th>{{ t.t('mvt_lines_article') }}</th>
                      <th>{{ t.t('mvt_detail_lbl') }}</th>
                      <th>{{ t.t('quantity') }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (l of createForm.lines; track $index) {
                      <tr>
                        <td>{{ getItemName(l.stockItemId) }}</td>
                        <td>
                          @if (createForm.type === 'Reception') {
                            <span style="color:var(--success);font-weight:600">{{ l.unitCost | number:'1.2-2' }} DZD</span>
                          } @else {
                            <span style="font-family:monospace;font-size:11px;color:var(--accent);">{{ l._lotNumber ?? l.stockLotId }}</span>
                          }
                        </td>
                        <td style="font-weight:600">{{ l.quantity }} {{ unitLocal(l.unit) }}</td>
                        <td style="text-align:right">
                          <button class="btn btn-danger btn-sm" (click)="removeLine($index)"><i class="pi pi-trash"></i></button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }

              <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                <!-- ROW 1: Article and Coût unitaire in same row (if Reception) -->
                <div style="display:flex; gap:16px; margin-bottom:16px; align-items:flex-start;">
                  <div class="form-group autocomplete-container" style="position:relative; flex:1; margin:0;">
                    <label class="form-label">{{ t.t('mvt_lines_article') }}</label>
                    <input class="form-input" 
                           [(ngModel)]="itemSearchQuery" 
                           (ngModelChange)="searchArticles($event)" 
                           [placeholder]="t.t('items_search_placeholder')" 
                           (focus)="showSuggestions.set(true)">
                    
                    @if (showSuggestions() && suggestions().length > 0) {
                      <div class="suggestions-list" style="position:absolute; bottom:100%; left:0; right:0; background:var(--bg-base); border:1px solid var(--border); border-radius:6px; max-height:220px; overflow-y:auto; z-index:1000; box-shadow:0 -10px 15px -3px rgba(0,0,0,0.1), 0 -4px 6px -2px rgba(0,0,0,0.05); margin-bottom:4px;">
                        @for (item of suggestions(); track item.id) {
                          <div class="suggestion-item" 
                               style="padding:10px 12px; cursor:pointer; border-bottom:1px solid var(--border); transition:background 0.2s;"
                               (click)="selectArticle(item)">
                             <div style="font-weight:600; font-size:13px; color:var(--text-primary);">{{ item.name }}</div>
                             <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-top:2px;">
                               <span style="color:var(--accent); font-family:monospace;">{{ item.reference }}</span>
                               <span style="color:var(--text-muted); font-size:11px;">{{ t.t('mvt_avail_prefix') }} <strong style="color:var(--text-primary)">{{ item.totalQuantity }}</strong> {{ unitLocal(item.defaultUnit) }}</span>
                             </div>
                          </div>
                        }
                      </div>
                    }
                    @if (showSuggestions() && suggestions().length === 0 && itemSearchQuery.trim().length >= 2 && !loadingSuggestions()) {
                      <div style="position:absolute; bottom:100%; left:0; right:0; background:var(--bg-base); border:1px solid var(--border); border-radius:6px; padding:12px; font-size:13px; color:var(--text-muted); z-index:1000; text-align:center; box-shadow:0 -10px 15px -3px rgba(0,0,0,0.1); margin-bottom:4px;">
                        {{ t.t('items_empty') }}
                      </div>
                    }
                    @if (loadingSuggestions()) {
                      <div style="position:absolute; bottom:100%; left:0; right:0; background:var(--bg-base); border:1px solid var(--border); border-radius:6px; padding:12px; z-index:1000; display:flex; justify-content:center; box-shadow:0 -10px 15px -3px rgba(0,0,0,0.1); margin-bottom:4px;">
                        <div class="spinner" style="width:18px; height:18px; border-width:2px;"></div>
                      </div>
                    }
                  </div>

                  @if (createForm.type === 'Reception') {
                    <div class="form-group" style="width:160px; min-width:160px; margin:0;">
                      <label class="form-label">{{ t.t('mvt_lines_cost') }}</label>
                      <input type="number" class="form-input" [(ngModel)]="newLine.unitCost" min="0">
                    </div>
                  }
                </div>

                <!-- ROW 2: Lot details or Expiry/Serial details -->
                @if (createForm.type !== 'Reception') {
                  <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">{{ t.t('mvt_lines_lot') }}</label>
                    <select class="form-select" [(ngModel)]="newLine.stockLotId">
                      <option value="">{{ t.t('select_placeholder') }}</option>
                      @for (lot of availableLots(); track lot.id) {
                        <option [value]="lot.id" [disabled]="createForm.sourceWarehouseId && lot.warehouseId !== createForm.sourceWarehouseId">
                          {{ lot.lotNumber }} ({{ t.t('mvt_avail_prefix') }} {{ lot.currentQuantity }}) - {{ lot.warehouseName }}
                        </option>
                      }
                    </select>
                  </div>
                } @else if (getSelectedItem()?.hasExpiryDate || getSelectedItem()?.requiresSerialNumber) {
                  <div class="form-grid" style="margin-bottom:16px;">
                    @if (getSelectedItem()?.hasExpiryDate) {
                      <div class="form-group" style="margin:0;">
                        <label class="form-label">{{ t.t('mvt_lines_expiry') }}</label>
                        <input type="date" class="form-input" [(ngModel)]="newLine.expiryDate">
                      </div>
                    }
                    @if (getSelectedItem()?.requiresSerialNumber) {
                      <div class="form-group" style="margin:0;">
                        <label class="form-label">{{ t.t('mvt_lines_serial') }}</label>
                        <input type="text" class="form-input" [(ngModel)]="newLine.serialNumber" placeholder="N° Série">
                      </div>
                    }
                  </div>
                }

                <!-- ROW 3: Quantity and Unit (with add button) -->
                <div style="display:flex;gap:12px;align-items:flex-end;">
                  <div class="form-group" style="flex:1;margin:0;">
                    <label class="form-label">{{ createForm.type === 'Adjustment' ? t.t('mvt_lines_qty_absolute') : t.t('mvt_lines_qty') }}</label>
                    <input type="number" class="form-input" [(ngModel)]="newLine.quantity" min="0.01" step="0.01">
                  </div>
                  <div class="form-group" style="flex:1;margin:0;">
                    <label class="form-label">{{ t.t('mvt_lines_unit') }}</label>
                    <select class="form-select" [(ngModel)]="newLine.unit">
                      @for (u of units; track u) {
                        <option [value]="u">{{ unitLocal(u) }}</option>
                      }
                    </select>
                  </div>
                  <button class="btn btn-secondary" (click)="addLine()" [disabled]="!canAddLine()">
                    <i class="pi pi-plus"></i> {{ t.t('add') }}
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showCreateModal.set(false)">{{ t.t('cancel') }}</button>
              <button class="btn btn-primary" (click)="saveMovement()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                {{ editingId() ? t.t('mvt_btn_submit_save') : t.t('mvt_btn_submit') }}
              </button>
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
                {{ t.t('mvt_info_title') }}
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>{{ t.t('items_modal_desc') }} :</strong><br>
                {{ t.t('mvt_info_desc') }}
              </p>
              <p style="margin-bottom:8px;"><strong>{{ t.t('mvt_info_features_title') }}</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>{{ t.t('mvt_info_f1_title') }} : {{ t.t('mvt_info_f1_text') }}</li>
                <li>{{ t.t('mvt_info_f2_title') }} : {{ t.t('mvt_info_f2_text') }}</li>
                <li>{{ t.t('mvt_info_f3_title') }} : {{ t.t('mvt_info_f3_text') }}</li>
                <li>{{ t.t('mvt_info_f4_title') }} : {{ t.t('mvt_info_f4_text') }}</li>
                <li>{{ t.t('mvt_info_f5_title') }} : {{ t.t('mvt_info_f5_text') }}</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showInfoModal.set(false)">{{ t.t('close') }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Custom Alert Dialog -->
      @if (customAlert()) {
        <div class="modal-overlay" style="z-index: 2200;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper" [style.background]="customAlert()?.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'" [style.color]="customAlert()?.severity === 'error' ? '#ef4444' : '#f59e0b'">
              <i class="pi" [ngClass]="customAlert()?.severity === 'error' ? 'pi-times-circle' : 'pi-exclamation-triangle'"></i>
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

      <!-- Custom Confirm Dialog -->
      @if (customConfirm()) {
        <div class="modal-overlay" style="z-index: 2200;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper" style="background: rgba(14, 165, 233, 0.12); color: var(--accent);">
              <i class="pi pi-question-circle"></i>
            </div>
            <h2 class="modal-title">{{ customConfirm()?.title }}</h2>
            <p class="confirm-message" style="margin-top: 8px; color: var(--text-secondary);">
              {{ customConfirm()?.message }}
            </p>
            <div class="modal-footer" style="justify-content: center; margin-top: 24px; gap: 12px;">
              <button class="btn btn-secondary" (click)="closeCustomConfirm(false)">{{ t.t('cancel') }}</button>
              <button class="btn btn-primary" (click)="closeCustomConfirm(true)">{{ t.t('confirm') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MovementsComponent implements OnInit {
  private stockService = inject(StockService);
  private authService = inject(AuthService);
  private printService = inject(PrintService);
  private exportService = inject(ExportService);
  public t = inject(TranslationService);
  
  currentUser = this.authService.currentUser;
  units = ['Piece','Liter','Kilogram','Meter','SquareMeter','CubicMeter','Box','Pallet','Roll','Bag','Can','Set'];

  showInfoModal = signal(false);
  customAlert = signal<{ title: string; message: string; severity?: 'error' | 'warning' | 'success'; list?: string[] } | null>(null);
  customConfirm = signal<{ title: string; message: string; callback: () => void } | null>(null);

  closeCustomAlert() {
    this.customAlert.set(null);
  }

  showConfirm(title: string, message: string, callback: () => void) {
    this.customConfirm.set({ title, message, callback });
  }

  closeCustomConfirm(confirmed: boolean) {
    const confirmData = this.customConfirm();
    this.customConfirm.set(null);
    if (confirmed && confirmData?.callback) {
      confirmData.callback();
    }
  }

  validateForm(): boolean {
    const missing: string[] = [];
    if (!this.createForm.type) {
      missing.push("Type de mouvement");
    }
    if (!this.createForm.movementDate) {
      missing.push("Date du mouvement");
    }

    if (this.createForm.type === 'Reception') {
      if (!this.createForm.destinationWarehouseId) {
        missing.push(this.t.t('mvt_modal_dest_wh').replace(' *', ''));
      }
      if (!this.createForm.supplierId) {
        missing.push(this.t.t('mvt_modal_supplier').replace(' *', ''));
      }
    } else if (this.createForm.type === 'Issue' || this.createForm.type === 'Disposal') {
      if (!this.createForm.sourceWarehouseId) {
        missing.push(this.t.t('mvt_modal_src_wh').replace(' *', ''));
      }
      if (!this.createForm.departmentId) {
        missing.push(this.t.t('mvt_modal_dept').replace(' *', ''));
      }
    } else if (this.createForm.type === 'Transfer') {
      if (!this.createForm.sourceWarehouseId) {
        missing.push(this.t.t('mvt_modal_src_wh').replace(' *', ''));
      }
      if (!this.createForm.destinationWarehouseId) {
        missing.push(this.t.t('mvt_modal_dest_wh').replace(' *', ''));
      }
      if (this.createForm.sourceWarehouseId && this.createForm.destinationWarehouseId && this.createForm.sourceWarehouseId === this.createForm.destinationWarehouseId) {
        missing.push(this.t.currentLang() === 'ar' ? "يجب أن يكون مستودع الوجهة مختلفًا عن مستودع المصدر" : (this.t.currentLang() === 'en' ? "Destination warehouse must be different from source warehouse" : "L'entrepôt de destination doit être différent de l'entrepôt source"));
      }
    } else {
      if (!this.createForm.sourceWarehouseId) {
        missing.push(this.t.t('mvt_modal_wh_general').replace(' *', ''));
      }
    }

    if (!this.createForm.lines || this.createForm.lines.length === 0) {
      missing.push(this.t.t('mvt_lines_empty'));
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
  loading = signal(true);
  saving = signal(false);
  showCreateModal = signal(false);
  editingId = signal<string | null>(null);
  selectedMovement = signal<StockMovementDto | null>(null);
  items = signal<StockMovementDto[]>([]);
  filtered = signal<StockMovementDto[]>([]);

  // Reference data signals
  suppliers = signal<SupplierDto[]>([]);
  warehouses = signal<WarehouseDto[]>([]);
  departments = signal<DepartmentDto[]>([]);
  stockItems = signal<StockItemDto[]>([]);
  availableLots = signal<StockLotDto[]>([]);

  newLine: any = { stockItemId: '', stockLotId: '', quantity: 1, unit: 'Piece', unitCost: 0, currency: 'DZD', notes: '' };

  // Autocomplete search states
  suggestions = signal<StockItemDto[]>([]);
  loadingSuggestions = signal(false);
  showSuggestions = signal(false);
  itemSearchQuery = '';
  selectedArticle = signal<StockItemDto | null>(null);
  itemNamesMap = new Map<string, string>();

  search = '';
  filterType = '';
  filterStatus = '';
  fromDate = '';
  toDate = '';

  pageNumber = signal(1);
  pageSize = signal(25);
  hasMore = signal(true);
  createForm: any = {};

  ngOnInit() {
    this.load();
    this.loadReferenceData();
  }

  load() {
    this.loading.set(true);
    this.stockService.getMovements({
      type: this.filterType || undefined,
      status: this.filterStatus || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      includeLines: true,
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

  loadReferenceData() {
    this.stockService.getSuppliers(true).subscribe(data => this.suppliers.set(data));
    this.stockService.getWarehouses(true).subscribe(data => this.warehouses.set(data));
    this.stockService.getDepartments(true).subscribe(data => this.departments.set(data));
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
    this.editingId.set(null);
    this.createForm = {
      type: 'Reception', movementDate: new Date().toISOString().split('T')[0],
      sourceWarehouseId: '', destinationWarehouseId: '', supplierId: '',
      departmentId: '', reference: '', createdByUser: this.currentUser()?.username || 'admin', notes: '', lines: []
    };
    this.resetNewLine();
    this.showCreateModal.set(true);
  }

  editMovement(m: StockMovementDto) {
    this.stockService.getMovement(m.id).subscribe({
      next: (full) => {
        this.editingId.set(full.id);
        this.createForm = {
          type: full.type,
          movementDate: new Date(full.movementDate).toISOString().split('T')[0],
          sourceWarehouseId: full.sourceWarehouseId || '',
          destinationWarehouseId: full.destinationWarehouseId || '',
          supplierId: full.supplierId || '',
          departmentId: full.departmentId || '',
          reference: full.reference || '',
          createdByUser: full.createdByUser || 'admin',
          notes: full.notes || '',
          lines: full.lines.map((l: any) => ({
            stockItemId: l.stockItemId,
            stockLotId: l.stockLotId || '',
            quantity: l.quantity,
            unit: l.unit,
            unitCost: l.unitCost,
            currency: l.currency,
            notes: l.notes || '',
            expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString().split('T')[0] : '',
            serialNumber: l.serialNumber || ''
          }))
        };
        this.resetNewLine();
        this.showCreateModal.set(true);
      }
    });
  }

  confirmMovement(m: StockMovementDto) {
    this.showConfirm(
      this.t.t('mvt_confirm_title'),
      this.t.t('mvt_confirm_message').replace('{number}', m.movementNumber),
      () => {
        this.loading.set(true);
        this.stockService.confirmMovement(m.id).subscribe({
          next: () => this.load(),
          error: () => this.loading.set(false)
        });
      }
    );
  }

  resetNewLine() {
    this.newLine = { stockItemId: '', stockLotId: '', quantity: 1, unit: 'Piece', unitCost: 0, currency: 'DZD', notes: '', expiryDate: '', serialNumber: '' };
    this.availableLots.set([]);
    this.itemSearchQuery = '';
    this.selectedArticle.set(null);
  }

  onItemSelect() {
  }

  searchArticles(queryStr: string) {
    if (!queryStr || queryStr.trim().length < 2) {
      this.suggestions.set([]);
      return;
    }
    this.loadingSuggestions.set(true);
    this.stockService.getStockItems({
      activeOnly: true,
      searchTerm: queryStr,
      pageSize: 15
    }).subscribe({
      next: (data) => {
        this.suggestions.set(data);
        this.loadingSuggestions.set(false);
      },
      error: () => {
        this.loadingSuggestions.set(false);
      }
    });
  }

  selectArticle(item: StockItemDto) {
    this.selectedArticle.set(item);
    this.newLine.stockItemId = item.id;
    this.newLine.unit = item.defaultUnit;
    this.itemSearchQuery = `${item.name} (${item.reference})`;
    this.showSuggestions.set(false);
    this.itemNamesMap.set(item.id, item.name);

    if (this.createForm.type !== 'Reception') {
      this.stockService.getStockItemLots(item.id, true).subscribe(lots => {
        this.availableLots.set(lots);
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.autocomplete-container')) {
      this.showSuggestions.set(false);
    }
  }

  canAddLine(): boolean {
    if (!this.newLine.stockItemId || this.newLine.quantity <= 0) return false;
    
    if (this.createForm.type === 'Reception') {
      if (this.newLine.unitCost <= 0) return false;
      const item = this.getSelectedItem();
      if (item) {
        if (item.hasExpiryDate && !this.newLine.expiryDate) return false;
        if (item.requiresSerialNumber && !this.newLine.serialNumber?.trim()) return false;
      }
    } else {
      if (!this.newLine.stockLotId) return false;
    }
    
    return true;
  }

  getSelectedItem() {
    return this.selectedArticle();
  }

  addLine() {
    if (!this.canAddLine()) return;
    const lot = this.availableLots().find(l => l.id === this.newLine.stockLotId);
    this.createForm.lines.push({ ...this.newLine, _lotNumber: lot?.lotNumber ?? null });
    this.resetNewLine();
  }

  removeLine(index: number) {
    this.createForm.lines.splice(index, 1);
  }

  getItemName(id: string): string {
    return this.itemNamesMap.get(id) ?? this.stockItems().find(i => i.id === id)?.name ?? (this.t.currentLang() === 'ar' ? 'غير معروف' : (this.t.currentLang() === 'en' ? 'Unknown' : 'Inconnu'));
  }

  viewDetail(m: StockMovementDto) {
    this.stockService.getMovement(m.id).subscribe({
      next: (full) => this.selectedMovement.set(full),
      error: () => this.selectedMovement.set(m)
    });
  }

  saveMovement() {
    if (!this.validateForm()) return;

    this.saving.set(true);
    const payload = {
      ...this.createForm,
      sourceWarehouseId: this.createForm.sourceWarehouseId || null,
      destinationWarehouseId: this.createForm.destinationWarehouseId || null,
      supplierId: this.createForm.supplierId || null,
      departmentId: this.createForm.departmentId || null,
      movementDate: new Date(this.createForm.movementDate).toISOString(),
      lines: this.createForm.lines.map((l: any) => ({
        ...l,
        stockLotId: l.stockLotId ? l.stockLotId : null,
        expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString() : null,
        serialNumber: l.serialNumber || null
      }))
    };
    const editingId = this.editingId();
    if (editingId) {
      this.stockService.updateMovement(editingId, payload).subscribe({
        next: () => { this.saving.set(false); this.showCreateModal.set(false); this.load(); },
        error: () => this.saving.set(false)
      });
    } else {
      this.stockService.createMovement(payload).subscribe({
        next: () => { this.saving.set(false); this.showCreateModal.set(false); this.load(); },
        error: () => this.saving.set(false)
      });
    }
  }

  printMovement(m: StockMovementDto) {
    this.printService.printMovement(m);
  }

  exportCsv() {
    const data = this.items().map(m => ({
      [this.t.t('mvt_tbl_num')]: m.movementNumber,
      [this.t.t('type')]: this.typeLocal(m.type),
      [this.t.t('status')]: this.statusLocal(m.status),
      [this.t.t('date')]: new Date(m.movementDate).toLocaleDateString(this.t.currentLang() === 'ar' ? 'ar-EG' : (this.t.currentLang() === 'en' ? 'en-US' : 'fr-FR')),
      [this.t.t('mvt_tbl_src')]: m.sourceWarehouseName || m.supplierName || '—',
      [this.t.t('mvt_tbl_dest')]: m.destinationWarehouseName || m.departmentName || '—',
      [this.t.t('mvt_tbl_ref_ext')]: m.reference || '—',
      [this.t.t('mvt_tbl_operator')]: m.createdByUser || '—'
    }));
    this.exportService.exportToCsv(data, 'mouvements_stock');
  }

  typeLocal(type: string): string {
    if (!type) return '';
    const key = 'mvt_type_' + type.toLowerCase();
    return this.t.t(key);
  }

  statusLocal(status: string): string {
    if (!status) return '';
    const key = 'mvt_status_' + status.toLowerCase();
    return this.t.t(key);
  }

  unitLocal(u: string): string {
    if (!u) return '';
    const key = 'unit_' + u.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    return this.t.t(key);
  }

  getTypeBadge(type: string): string {
    const map: Record<string, string> = {
      Reception: 'badge-success', Issue: 'badge-warning', Transfer: 'badge-info',
      Return: 'badge-purple', Adjustment: 'badge-muted', Disposal: 'badge-danger'
    };
    return map[type] ?? 'badge-muted';
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      Confirmed: 'badge-success', Pending: 'badge-warning', Cancelled: 'badge-danger'
    };
    return map[status] ?? 'badge-muted';
  }
}
