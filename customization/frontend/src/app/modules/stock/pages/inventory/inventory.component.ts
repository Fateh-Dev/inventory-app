import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { ExportService } from '../../../../services/export.service';
import { TranslationService } from '../../../../services/translation.service';
import { WarehouseDto } from '../../models/stock.models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            {{ t.t('inv_title') }}
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" [title]="t.t('inv_title')"></i>
          </h1>
          <p class="page-subtitle">{{ t.t('inv_subtitle') }}</p>
        </div>
      </div>

      <!-- Étape 1 : Sélection de l'entrepôt et démarrage -->
      @if (!activeSession()) {
        <div class="card" style="max-width: 500px; margin: 40px auto; padding: 24px; text-align: center;">
          <div style="width:64px;height:64px;background:rgba(14,165,233,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:var(--accent);font-size:28px;">
            <i class="pi pi-building"></i>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">{{ t.t('inv_start_title') }}</h2>
          <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:24px;line-height:1.5;">
            {{ t.t('inv_start_desc') }}
          </p>

          <div class="form-group" style="text-align:left;margin-bottom:20px;">
            <label class="form-label">{{ t.t('inv_select_label') }}</label>
            <select class="form-select" [(ngModel)]="selectedWarehouseId" style="width:100%">
              <option value="">{{ t.t('inv_select_placeholder') }}</option>
              @for (wh of warehouses(); track wh.id) {
                <option [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
              }
            </select>
          </div>

          <button class="btn btn-primary" style="width:100%;justify-content:center;" 
            (click)="startSession()" [disabled]="!selectedWarehouseId || loading()">
            @if (loading()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px;"></div> }
            {{ t.t('inv_btn_start') }}
          </button>
        </div>
      } @else {
        <!-- Étape 2 : Session de comptage active -->
        <div class="card" style="background:var(--bg-card);border:1px solid var(--border);padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;">{{ t.t('inv_session_active') }}</div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-primary);margin-top:2px;">
              {{ activeSession()?.warehouseName }}
            </h2>
            <div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">
              {{ getFormattedStartedAt() }} · Session: <code style="font-size:11px;">{{ activeSession()?.id.toString().substring(0,8) }}</code>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" (click)="exportSessionCsv()" [title]="t.t('items_btn_export')">
              <i class="pi pi-download"></i> {{ t.t('items_btn_export') }}
            </button>
            <button class="btn btn-danger btn-sm" (click)="confirmCancelSession()">
              <i class="pi pi-times"></i> {{ t.t('inv_btn_cancel') }}
            </button>
          </div>
        </div>

        <!-- Filtres et stats de session -->
        <div style="display:flex;gap:16px;margin-bottom:20px;align-items:stretch;flex-wrap:wrap;">
          <!-- Barre de filtres -->
          <div class="filter-bar" style="flex:1;margin-bottom:0;display:flex;align-items:center;gap:16px;">
            <div class="search-box" style="flex:1;max-width:300px;margin-bottom:0;">
              <i class="pi pi-search"></i>
              <input class="search-input" [(ngModel)]="searchQuery" [placeholder]="t.t('inv_search_placeholder')" (ngModelChange)="applyFilter()">
            </div>
            
            <div style="display:flex;gap:16px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-primary);cursor:pointer;">
                <input type="radio" name="filterMode" [value]="'all'" [(ngModel)]="filterMode" (change)="applyFilter()">
                {{ t.t('all') }} ({{ activeSession()?.items?.length }})
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--warning);cursor:pointer;">
                <input type="radio" name="filterMode" [value]="'gaps'" [(ngModel)]="filterMode" (change)="applyFilter()">
                {{ t.t('inv_filter_gaps') }} ({{ getGapsCount() }})
              </label>
            </div>
          </div>

          <!-- Mini carte résumé -->
          <div class="card" style="margin-bottom:0;padding:12px 20px;display:flex;align-items:center;gap:16px;background:rgba(245,158,11,0.06);border-color:rgba(245,158,11,0.15);">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;color:var(--warning);font-size:18px;">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div>
              <div style="font-size:17px;font-weight:800;color:var(--text-primary);">{{ getGapsCount() }}</div>
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">{{ t.t('inv_gaps_detected') }}</div>
            </div>
          </div>
        </div>

        <!-- Tableau de saisie -->
        <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;position:relative;">
          @if (loading()) {
            <div class="loading-overlay"><div class="spinner"></div></div>
          }

          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t.t('inv_tbl_article') }}</th>
                <th>{{ t.t('items_tbl_ref') }}</th>
                <th>{{ t.t('history_tbl_lot_num') }}</th>
                <th>{{ t.t('history_tbl_expiry') }}</th>
                <th style="text-align:right;width:120px;">{{ t.t('inv_tbl_theoretical') }}</th>
                <th style="text-align:right;width:150px;">{{ t.t('inv_tbl_physical') }}</th>
                <th style="text-align:right;width:100px;">{{ t.t('inv_tbl_gap') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredItems(); track item.stockLotId) {
                <tr [style.background]="item.PhysicalQuantity !== item.TheoreticalQuantity ? 'rgba(245,158,11,0.03)' : null">
                  <td>
                    <div style="font-weight:600;color:var(--text-primary)">{{ item.articleName }}</div>
                  </td>
                  <td>
                    <span style="font-family:monospace;font-size:11.5px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;color:var(--accent);">
                      {{ item.articleReference }}
                    </span>
                  </td>
                  <td><code style="font-family:monospace;font-size:11.5px;">{{ item.lotNumber }}</code></td>
                  <td style="color:var(--text-muted)">{{ item.ExpiryDate ? (item.ExpiryDate | date:'dd/MM/yyyy') : '—' }}</td>
                  <td style="text-align:right;font-weight:600;color:var(--text-muted);">
                    {{ item.TheoreticalQuantity }} {{ unitLocal(item.unit) }}
                  </td>
                  <td style="text-align:right;">
                    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">
                      <input type="number" class="form-input" style="width:90px;text-align:right;padding:4px 8px;font-size:13px;font-weight:700;"
                        [(ngModel)]="item.PhysicalQuantity" min="0" (ngModelChange)="onCountChange(item)">
                      <span style="font-size:12px;color:var(--text-muted);width:30px;text-align:left;">{{ unitLocal(item.unit) }}</span>
                    </div>
                  </td>
                  <td style="text-align:right;font-weight:800;">
                    @if (item.Gap === 0) {
                      <span style="color:var(--text-muted);font-size:13px;">—</span>
                    } @else if (item.Gap > 0) {
                      <span style="color:var(--success);">+{{ item.Gap }}</span>
                    } @else {
                      <span style="color:var(--danger);">{{ item.Gap }}</span>
                    }
                  </td>
                </tr>
              }
              @if (filteredItems().length === 0) {
                <tr>
                  <td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">
                    {{ t.t('inv_empty_lots') }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Actions de pied de page -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;">
          <span style="font-size:13px;color:var(--text-muted);">
            {{ t.t('inv_footer_desc') }}
          </span>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving()">
              @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;"></div> }
              {{ t.t('inv_btn_save_draft') }}
            </button>
            <button class="btn btn-primary" (click)="confirmValidate()" [disabled]="saving()">
              <i class="pi pi-check-circle"></i> {{ t.t('inv_btn_validate') }}
            </button>
          </div>
        </div>
      }

      <!-- Modal de confirmation de validation -->
      @if (showConfirmValidationModal()) {
        <div class="modal-overlay" style="z-index:2000;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper" style="background:rgba(14,165,233,0.12);color:var(--accent);">
              <i class="pi pi-check-circle"></i>
            </div>
            <h2 class="modal-title">{{ t.t('inv_modal_val_title') }}</h2>
            <div class="confirm-message">
              {{ t.t('inv_modal_val_desc') }} <strong>{{ activeSession()?.warehouseName }}</strong>.<br><br>
              @if (getGapsCount() > 0) {
                {{ t.t('inv_modal_val_gap_p1') }} <strong>{{ getGapsCount() }} {{ t.t('inv_modal_val_gap_p2') }}</strong><br>
                {{ t.t('inv_modal_val_gap_p3') }}
              } @else {
                {{ t.t('inv_modal_val_no_gap') }}
              }
            </div>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="showConfirmValidationModal.set(false)">{{ t.t('cancel') }}</button>
              <button class="btn btn-primary" (click)="executeValidate()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;"></div> }
                {{ t.t('inv_btn_val_confirm') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de confirmation d'annulation -->
      @if (showCancelModal()) {
        <div class="modal-overlay" style="z-index:2000;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">{{ t.t('inv_modal_cancel_title') }}</h2>
            <p class="confirm-message">
              {{ t.t('inv_modal_cancel_confirm') }}<br>
              {{ t.t('inv_modal_cancel_desc') }}
            </p>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="showCancelModal.set(false)">{{ t.t('cancel') }}</button>
              <button class="btn btn-danger" (click)="executeCancel()">{{ t.t('inv_btn_cancel_confirm') }}</button>
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
                {{ t.t('inv_title') }}
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>{{ t.t('items_modal_desc') }} :</strong><br>
                {{ t.t('inv_info_desc') }}
              </p>
              <p style="margin-bottom:8px;"><strong>{{ t.t('info_items_features_title') }}</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🏢 {{ t.t('inv_info_f1') }}</li>
                <li>📝 {{ t.t('inv_info_f2') }}</li>
                <li>📊 {{ t.t('inv_info_f3') }}</li>
                <li>⚙️ {{ t.t('inv_info_f4') }}</li>
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
  `
})
export class InventoryComponent implements OnInit {
  private stockService = inject(StockService);
  private exportService = inject(ExportService);
  public t = inject(TranslationService);

  showInfoModal = signal(false);
  customAlert = signal<{ title: string; message: string; severity?: 'error' | 'warning' | 'success'; list?: string[] } | null>(null);

  closeCustomAlert() {
    this.customAlert.set(null);
  }

  warehouses = signal<WarehouseDto[]>([]);
  selectedWarehouseId = '';

  activeSession = signal<any | null>(null);
  filteredItems = signal<any[]>([]);

  loading = signal(false);
  saving = signal(false);

  searchQuery = '';
  filterMode: 'all' | 'gaps' = 'all';

  showConfirmValidationModal = signal(false);
  showCancelModal = signal(false);

  ngOnInit() {
    this.loadWarehouses();
    this.checkActiveSession();
  }

  loadWarehouses() {
    this.stockService.getWarehouses(true).subscribe(data => this.warehouses.set(data));
  }

  checkActiveSession() {
    const storedSessionId = localStorage.getItem('active_inventory_session_id');
    if (storedSessionId) {
      this.loading.set(true);
      this.stockService.getInventorySession(storedSessionId).subscribe({
        next: (session) => {
          if (session && !session.isValidated) {
            this.activeSession.set(session);
            this.applyFilter();
          } else {
            localStorage.removeItem('active_inventory_session_id');
          }
          this.loading.set(false);
        },
        error: () => {
          localStorage.removeItem('active_inventory_session_id');
          this.loading.set(false);
        }
      });
    }
  }

  startSession() {
    if (!this.selectedWarehouseId) {
      this.customAlert.set({
        title: this.t.t('validation_title'),
        message: this.t.t('validation_inv_start'),
        severity: "warning"
      });
      return;
    }
    this.loading.set(true);
    this.stockService.startInventorySession(this.selectedWarehouseId).subscribe({
      next: (session) => {
        this.activeSession.set(session);
        localStorage.setItem('active_inventory_session_id', session.Id || session.id);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onCountChange(item: any) {
    if (item.PhysicalQuantity < 0) item.PhysicalQuantity = 0;
  }

  getGapsCount(): number {
    const session = this.activeSession();
    if (!session || !session.items) return 0;
    return session.items.filter((i: any) => i.PhysicalQuantity !== i.TheoreticalQuantity).length;
  }

  applyFilter() {
    const session = this.activeSession();
    if (!session || !session.items) {
      this.filteredItems.set([]);
      return;
    }

    let items = session.items;
    const q = this.searchQuery.toLowerCase();

    if (q) {
      items = items.filter((i: any) =>
        (i.articleName || '').toLowerCase().includes(q) ||
        (i.articleReference || '').toLowerCase().includes(q) ||
        (i.lotNumber || '').toLowerCase().includes(q)
      );
    }

    if (this.filterMode === 'gaps') {
      items = items.filter((i: any) => i.PhysicalQuantity !== i.TheoreticalQuantity);
    }

    this.filteredItems.set(items);
  }

  saveDraft() {
    const session = this.activeSession();
    if (!session) return;

    this.saving.set(true);
    const counts = session.items.map((i: any) => ({
      stockLotId: i.stockLotId,
      physicalQuantity: i.PhysicalQuantity
    }));

    const sessionId = session.Id || session.id;
    this.stockService.saveInventoryCounts(sessionId, counts).subscribe({
      next: (updatedSession) => {
        this.activeSession.set(updatedSession);
        this.applyFilter();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  confirmValidate() {
    this.showConfirmValidationModal.set(true);
  }

  executeValidate() {
    const session = this.activeSession();
    if (!session) return;

    this.saving.set(true);
    
    const counts = session.items.map((i: any) => ({
      stockLotId: i.stockLotId,
      physicalQuantity: i.PhysicalQuantity
    }));

    const sessionId = session.Id || session.id;
    this.stockService.saveInventoryCounts(sessionId, counts).subscribe({
      next: () => {
        this.stockService.validateInventorySession(sessionId).subscribe({
          next: () => {
            this.saving.set(false);
            this.showConfirmValidationModal.set(false);
            this.activeSession.set(null);
            localStorage.removeItem('active_inventory_session_id');
            this.customAlert.set({
              title: this.t.t('inv_alert_val_title'),
              message: this.t.t('inv_alert_val_message'),
              severity: "success"
            });
          },
          error: () => this.saving.set(false)
        });
      },
      error: () => this.saving.set(false)
    });
  }

  confirmCancelSession() {
    this.showCancelModal.set(true);
  }

  executeCancel() {
    this.activeSession.set(null);
    localStorage.removeItem('active_inventory_session_id');
    this.showCancelModal.set(false);
  }

  unitLocal(u: string): string {
    if (!u) return '';
    const key = 'unit_' + u.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    return this.t.t(key);
  }

  getFormattedStartedAt(): string {
    const session = this.activeSession();
    if (!session || !session.startedAt) return '';
    const dateVal = new Date(session.startedAt);
    const dateStr = dateVal.toLocaleDateString(this.t.currentLang() === 'ar' ? 'ar-EG' : (this.t.currentLang() === 'en' ? 'en-US' : 'fr-FR'));
    const timeStr = dateVal.toLocaleTimeString(this.t.currentLang() === 'ar' ? 'ar-EG' : (this.t.currentLang() === 'en' ? 'en-US' : 'fr-FR'), { hour: '2-digit', minute: '2-digit' });
    return this.t.t('inv_started_at').replace('{date}', dateStr).replace('{time}', timeStr);
  }

  exportSessionCsv() {
    const session = this.activeSession();
    if (!session) return;

    const data = session.items.map((i: any) => ({
      [this.t.t('inv_tbl_article')]: i.articleName,
      [this.t.t('items_tbl_ref')]: i.articleReference,
      [this.t.t('history_tbl_lot_num')]: i.lotNumber,
      [this.t.t('inv_tbl_theoretical')]: i.TheoreticalQuantity,
      [this.t.t('inv_tbl_physical')]: i.PhysicalQuantity,
      [this.t.t('inv_tbl_gap')]: i.PhysicalQuantity - i.TheoreticalQuantity,
      [this.t.t('items_tbl_unit')]: this.unitLocal(i.unit)
    }));
    this.exportService.exportToCsv(data, `feuille_comptage_${session.warehouseName}`);
  }
}

