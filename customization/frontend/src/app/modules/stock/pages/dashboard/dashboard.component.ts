import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StockService } from '../../../../services/stock.service';
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
          <h1 class="page-title">Tableau de bord</h1>
          <p class="page-subtitle">Vue d'ensemble en temps réel de votre inventaire de matériaux d'infrastructure</p>
        </div>
        <a routerLink="/movements" class="btn btn-primary">
          <i class="pi pi-plus"></i> Nouveau mouvement
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
              <div class="stat-label">Total des articles</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.activeItems }}</div>
              <div class="stat-label">Articles actifs</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange"><i class="pi pi-exclamation-triangle"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.lowStockCount }}</div>
              <div class="stat-label">Stock faible</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><i class="pi pi-clock"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.expiringCount }}</div>
              <div class="stat-label">Expirant bientôt</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple"><i class="pi pi-building"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.totalWarehouses }}</div>
              <div class="stat-label">Entrepôts</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon pink"><i class="pi pi-bell"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ summary()!.unreadAlerts }}</div>
              <div class="stat-label">Alertes non lues</div>
            </div>
          </div>
        </div>

        <!-- Disposition en deux colonnes -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
          <!-- Répartition par catégorie -->
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary)">
                <i class="pi pi-chart-pie" style="color:var(--accent); margin-right:8px;"></i>
                Répartition par catégorie
              </h3>
            </div>
            @for (cat of summary()!.categoryBreakdown; track cat.category) {
              <div style="margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:13px; font-weight:500; color:var(--text-primary)">{{ cat.category }}</span>
                  <div style="display:flex; gap:12px; align-items:center;">
                    <span style="font-size:12px; color:var(--text-muted)">{{ cat.itemCount }} article(s)</span>
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
                <p>Aucune donnée par catégorie</p>
              </div>
            }
          </div>

          <!-- Alertes récentes -->
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary)">
                <i class="pi pi-bell" style="color:var(--warning); margin-right:8px;"></i>
                Alertes récentes
              </h3>
              <a routerLink="/alerts" style="font-size:12px; color:var(--accent); text-decoration:none;">Voir tout</a>
            </div>
            @for (alert of recentAlerts().slice(0, 5); track alert.id) {
              <div class="alert-item" [class.unread]="!alert.isRead">
                <div class="alert-icon" [class]="'alert-icon ' + alert.severity.toLowerCase()">
                  <i class="pi" [class.pi-exclamation-circle]="alert.severity === 'Critical'"
                               [class.pi-exclamation-triangle]="alert.severity === 'Warning'"
                               [class.pi-info-circle]="alert.severity === 'Info'"></i>
                </div>
                <div style="flex:1; min-width:0;">
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
                <p>Aucune alerte active</p>
              </div>
            }
          </div>
        </div>

        <!-- Articles à stock faible -->
        @if (lowStockItems().length > 0) {
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary)">
                <i class="pi pi-exclamation-triangle" style="color:var(--warning); margin-right:8px;"></i>
                Articles à stock faible
              </h3>
              <a routerLink="/stock-items" [queryParams]="{lowStockOnly: true}"
                style="font-size:12px; color:var(--accent); text-decoration:none;">Voir tout</a>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Désignation</th>
                  <th>Catégorie</th>
                  <th>Quantité</th>
                  <th>Seuil</th>
                  <th>Statut</th>
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
                    <td><span class="badge badge-danger"><i class="pi pi-exclamation-triangle"></i> Stock faible</span></td>
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
            <h3>Impossible d'atteindre l'API</h3>
            <p>Assurez-vous que le serveur .NET est démarré sur http://localhost:5270</p>
            <button class="btn btn-primary" style="margin-top:16px;" (click)="load()">
              <i class="pi pi-refresh"></i> Réessayer
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private stockService = inject(StockService);

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
    const map: Record<string, string> = { Critical: 'Critique', Warning: 'Avertissement', Info: 'Information' };
    return map[severity] ?? severity;
  }
}
