import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StockService } from '../../../../services/stock.service';
import { TranslationService } from '../../../../services/translation.service';
import { StockSummaryDto, StockAlertDto, StockItemDto } from '../../models/stock.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <!-- En-tête -->
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            {{ t.t('db_title') }}
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" [title]="t.t('db_info_title')"></i>
          </h1>
          <p class="page-subtitle">{{ t.t('db_subtitle') }}</p>
        </div>
        <a routerLink="/movements" class="btn btn-primary">
          <i class="pi pi-plus"></i> {{ t.t('mvt_btn_new') }}
        </a>
      </div>

      <!-- Chargement -->
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      }

      @if (!loading() && summary()) {
        <!-- Cartes de statistiques -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon blue"><i class="pi pi-box"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.totalItems }}</div>
              <div class="stat-label">{{ t.t('db_total_items') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.activeItems }}</div>
              <div class="stat-label">{{ t.t('db_active_items') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange"><i class="pi pi-exclamation-triangle"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.lowStockCount }}</div>
              <div class="stat-label">{{ t.t('db_low_stock') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><i class="pi pi-clock"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.expiringCount }}</div>
              <div class="stat-label">{{ t.t('db_expiring_soon') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple"><i class="pi pi-building"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.totalWarehouses }}</div>
              <div class="stat-label">{{ t.t('db_warehouses') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon pink"><i class="pi pi-bell"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.unreadAlerts }}</div>
              <div class="stat-label">{{ t.t('db_unread_alerts') }}</div>
            </div>
          </div>
        </div>

        <!-- Disposition en deux colonnes -->
        <div class="form-grid" style="margin-bottom:20px; gap:20px;">
          <!-- Répartition par catégorie -->
          <div class="card" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary)">
                <i class="pi pi-chart-pie" style="color:var(--accent); margin-right:8px; margin-left:8px;"></i>
                {{ t.t('db_category_breakdown') }}
              </h3>
            </div>
            @for (cat of summary()!.categoryBreakdown; track cat.category) {
              <div style="margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:13px; font-weight:500; color:var(--text-primary)">{{ cat.category }}</span>
                  <div style="display:flex; gap:12px; align-items:center;">
                    <span style="font-size:12px; color:var(--text-muted)">{{ cat.itemCount }} {{ t.t('stock_items').toLowerCase() }}</span>
                    <span style="font-size:12px; font-weight:600; color:var(--accent)">{{ cat.totalQuantity | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="stock-bar">
                  <div class="stock-bar-fill high"
                    [style.width.%]="getCategoryPercent(cat.totalQuantity)"></div>
                </div>
              </div>
            }
            @if (summary()!.categoryBreakdown.length === 0) {
              <div class="empty-state" style="padding:30px 0">
                <p>{{ t.t('db_no_data') }}</p>
              </div>
            }
          </div>

          <!-- Alertes récentes -->
          <div class="card" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary)">
                <i class="pi pi-bell" style="color:var(--warning); margin-right:8px; margin-left:8px;"></i>
                {{ t.t('db_recent_alerts') }}
              </h3>
              <a routerLink="/alerts" style="font-size:12px; color:var(--accent); text-decoration:none;">{{ t.t('db_view_all') }}</a>
            </div>
            @for (alert of recentAlerts().slice(0, 5); track alert.id) {
              <div class="alert-item" [class.unread]="!alert.isRead">
                <div class="alert-icon" [class]="'alert-icon ' + alert.severity.toLowerCase()">
                  <i class="pi" [class.pi-exclamation-circle]="alert.severity === 'Critical'"
                               [class.pi-exclamation-triangle]="alert.severity === 'Warning'"
                               [class.pi-info-circle]="alert.severity === 'Info'"></i>
                </div>
                <div style="flex:1; min-width:0; padding:0 8px;">
                  <div style="font-size:12.5px; font-weight:600; color:var(--text-primary); margin-bottom:2px;">
                    {{ alert.stockItemName }}
                  </div>
                  <div style="font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    {{ alert.message }}
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">
                    {{ alert.createdAt | date:'dd MMM, HH:mm' }}
                  </div>
                </div>
                <span class="badge" [class.badge-danger]="alert.severity === 'Critical'"
                                    [class.badge-warning]="alert.severity === 'Warning'"
                                    [class.badge-info]="alert.severity === 'Info'">
                  {{ getSeverityLabel(alert.severity) }}
                </span>
              </div>
            }
            @if (recentAlerts().length === 0) {
              <div class="empty-state" style="padding:30px 0">
                <i class="pi pi-check-circle" style="color:var(--success)"></i>
                <p>{{ t.t('db_no_alerts') }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Articles à stock faible -->
        @if (lowStockItems().length > 0) {
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary)">
                <i class="pi pi-exclamation-triangle" style="color:var(--warning); margin-right:8px; margin-left:8px;"></i>
                {{ t.t('db_low_stock_items') }}
              </h3>
              <a routerLink="/stock-items" [queryParams]="{lowStockOnly: true}"
                style="font-size:12px; color:var(--accent); text-decoration:none;">{{ t.t('db_view_all') }}</a>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ t.t('reference') }}</th>
                  <th>{{ t.t('name') }}</th>
                  <th>{{ t.t('items_tbl_cat') }}</th>
                  <th>{{ t.t('quantity') }}</th>
                  <th>Seuil</th>
                  <th>{{ t.t('status') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (item of lowStockItems(); track item.id) {
                  <tr>
                    <td><span style="font-family:monospace;font-size:12px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;">{{ item.reference }}</span></td>
                    <td style="font-weight:500;">{{ item.name }}</td>
                    <td><span class="badge badge-muted">{{ item.categoryName }}</span></td>
                    <td style="font-weight:700; color:var(--danger)">{{ item.totalQuantity | number:'1.0-2' }} {{ item.defaultUnit }}</td>
                    <td style="color:var(--text-muted)">{{ item.defaultLowStockThreshold }}</td>
                    <td><span class="badge badge-danger"><i class="pi pi-exclamation-triangle"></i> {{ t.t('db_low_stock') }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- État d'erreur -->
      @if (!loading() && !summary()) {
        <div class="card">
          <div class="empty-state">
            <i class="pi pi-wifi" style="color:var(--danger)"></i>
            <h3>{{ t.t('db_api_error_title') }}</h3>
            <p>{{ t.t('db_api_error_desc') }}</p>
            <button class="btn btn-primary" style="margin-top:16px;" (click)="load()">
              <i class="pi pi-refresh"></i> {{ t.t('db_retry') }}
            </button>
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
                {{ t.t('db_info_title') }}
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                {{ t.t('db_info_desc') }}
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>📊 {{ t.t('db_info_f1') }}</li>
                <li>📦 {{ t.t('db_info_f2') }}</li>
                <li>⚠️ {{ t.t('db_info_f3') }}</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showInfoModal.set(false)">{{ t.t('close') }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private stockService = inject(StockService);
  public t = inject(TranslationService);

  showInfoModal = signal(false);

  loading = signal(true);
  summary = signal<StockSummaryDto | null>(null);
  recentAlerts = signal<StockAlertDto[]>([]);
  lowStockItems = signal<StockItemDto[]>([]);

  private maxQty = 1;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.summary.set(null);

    this.stockService.getSummary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.maxQty = Math.max(...s.categoryBreakdown.map(c => c.totalQuantity), 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.stockService.getAlerts({ unresolvedOnly: true }).subscribe({
      next: (a) => this.recentAlerts.set(a),
      error: () => {}
    });

    this.stockService.getStockItems({ lowStockOnly: true, activeOnly: true }).subscribe({
      next: (items) => this.lowStockItems.set(items),
      error: () => {}
    });
  }

  getCategoryPercent(qty: number): number {
    return this.maxQty > 0 ? Math.min((qty / this.maxQty) * 100, 100) : 0;
  }

  getSeverityLabel(severity: string): string {
    const map: Record<string, string> = { 
      Critical: this.t.t('error'), 
      Warning: this.t.t('warning'), 
      Info: 'Info' 
    };
    return map[severity] ?? severity;
  }
}
