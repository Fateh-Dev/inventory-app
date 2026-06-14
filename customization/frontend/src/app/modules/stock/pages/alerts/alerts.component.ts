import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { StockAlertDto } from '../../models/stock.models';

const SEVERITY_FR: Record<string, string> = { Critical: 'Critique', Warning: 'Avertissement', Info: 'Information' };
const ALERT_TYPE_FR: Record<string, string> = { LOW_STOCK: 'Stock faible', EXPIRING_SOON: 'Expire bientôt', EXPIRED: 'Expiré' };

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Alertes de stock
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Surveillez les stocks faibles, les lots expirants et autres avertissements</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="load()">
            <i class="pi pi-refresh"></i> Actualiser
          </button>
        </div>
      </div>

      <!-- Barre de statistiques -->
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
        <div class="stat-card" style="flex:1;min-width:160px;">
          <div class="stat-icon red"><i class="pi pi-exclamation-circle"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ criticalCount() }}</div>
            <div class="stat-label">Critiques</div>
          </div>
        </div>
        <div class="stat-card" style="flex:1;min-width:160px;">
          <div class="stat-icon orange"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ warningCount() }}</div>
            <div class="stat-label">Avertissements</div>
          </div>
        </div>
        <div class="stat-card" style="flex:1;min-width:160px;">
          <div class="stat-icon blue"><i class="pi pi-info-circle"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ infoCount() }}</div>
            <div class="stat-label">Informations</div>
          </div>
        </div>
        <div class="stat-card" style="flex:1;min-width:160px;">
          <div class="stat-icon cyan"><i class="pi pi-bell"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ unreadCount() }}</div>
            <div class="stat-label">Non lues</div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="Rechercher des alertes…" (ngModelChange)="applyFilter()">
        </div>
        <select class="form-select" style="width:170px" [(ngModel)]="filterSeverity" (change)="applyFilter()">
          <option value="">Toutes les sévérités</option>
          <option value="Critical">Critique</option>
          <option value="Warning">Avertissement</option>
          <option value="Info">Information</option>
        </select>
        <select class="form-select" style="width:180px" [(ngModel)]="filterType" (change)="applyFilter()">
          <option value="">Tous les types</option>
          <option value="LOW_STOCK">Stock faible</option>
          <option value="EXPIRING_SOON">Expire bientôt</option>
          <option value="EXPIRED">Expiré</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterUnread" (change)="applyFilter()"> Non lues uniquement
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterUnresolved" (change)="applyFilter()"> Non résolues uniquement
        </label>
      </div>

      <!-- Liste des alertes -->
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <i class="pi pi-check-circle" style="color:var(--success)"></i>
          <h3>Aucune alerte</h3>
          <p>Votre inventaire est en bon état ! Aucune alerte active ne correspond à vos filtres.</p>
        </div>
      } @else {
        <div>
          @for (alert of filtered(); track alert.id) {
            <div class="alert-item" [class.unread]="!alert.isRead" style="margin-bottom:10px;">
              <div class="alert-icon" [class]="'alert-icon ' + alert.severity.toLowerCase()">
                <i class="pi"
                  [class.pi-exclamation-circle]="alert.severity === 'Critical'"
                  [class.pi-exclamation-triangle]="alert.severity === 'Warning'"
                  [class.pi-info-circle]="alert.severity === 'Info'"></i>
              </div>

              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;">
                  <span style="font-size:13.5px;font-weight:700;color:var(--text-primary);">{{ alert.stockItemName }}</span>
                  <span class="badge" [class.badge-danger]="alert.severity==='Critical'" [class.badge-warning]="alert.severity==='Warning'" [class.badge-info]="alert.severity==='Info'">
                    {{ severityFr(alert.severity) }}
                  </span>
                  <span class="badge badge-muted" style="font-size:10px;">{{ alertTypeFr(alert.alertType) }}</span>
                  @if (alert.isResolved) { <span class="badge badge-success">Résolu</span> }
                </div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">{{ alert.message }}</div>
                <div style="display:flex;gap:12px;align-items:center;font-size:11.5px;color:var(--text-muted);flex-wrap:wrap;">
                  <span><i class="pi pi-tag" style="margin-right:4px;"></i>{{ alert.stockItemReference }}</span>
                  @if (alert.warehouseName) {
                    <span><i class="pi pi-building" style="margin-right:4px;"></i>{{ alert.warehouseName }}</span>
                  }
                  <span><i class="pi pi-calendar" style="margin-right:4px;"></i>{{ alert.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                </div>
                @if (alert.isResolved && alert.resolution) {
                  <div style="margin-top:6px;padding:6px 10px;background:rgba(16,185,129,0.06);border-radius:6px;border-left:2px solid var(--success);">
                    <span style="font-size:11.5px;color:var(--success);">✓ {{ alert.resolution }}</span>
                  </div>
                }
                @if (resolveId() === alert.id) {
                  <div style="display:flex;gap:8px;margin-top:8px;">
                    <input class="form-input" [(ngModel)]="resolutionText" placeholder="Décrivez comment le problème a été résolu…" style="font-size:12.5px;padding:6px 10px;">
                    <button class="btn btn-success btn-sm" (click)="confirmResolve(alert.id)">
                      <i class="pi pi-check"></i> Confirmer
                    </button>
                    <button class="btn btn-secondary btn-sm" (click)="resolveId.set(null)">Annuler</button>
                  </div>
                }
              </div>

              <!-- Actions -->
              <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                @if (!alert.isRead) {
                  <button class="btn btn-secondary btn-sm" (click)="markRead(alert)" title="Marquer comme lu">
                    <i class="pi pi-eye"></i>
                  </button>
                }
                @if (!alert.isResolved) {
                  <button class="btn btn-success btn-sm" (click)="startResolve(alert.id)" title="Résoudre">
                    <i class="pi pi-check-circle"></i>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
      
      <!-- Info Modal -->
      @if (showInfoModal()) {
        <div class="modal-overlay" style="z-index: 2100;">
          <div class="modal-panel" style="max-width:500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                <i class="pi pi-info-circle" style="color:var(--accent)"></i>
                Alertes de Stock
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Ce centre de notification liste en temps réel toutes les anomalies de stock nécessitant votre attention.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🔴 <strong>Gestion de Gravité</strong> : Visualisez les niveaux d'urgence (Critique, Warning, Info).</li>
                <li>👁️ <strong>Marquage de lecture</strong> : Masquez les alertes pour nettoyer votre flux une fois consultées.</li>
                <li>✅ <strong>Résolution motivée</strong> : Résolvez une alerte en saisissant une note de justification (ex. "Commande en cours").</li>
                <li>📦 <strong>Types d'alertes</strong> : Notifications automatiques de rupture de stock ou de péremption imminente.</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showInfoModal.set(false)">Fermer</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AlertsComponent implements OnInit {
  private stockService = inject(StockService);

  showInfoModal = signal(false);

  loading = signal(true);
  items = signal<StockAlertDto[]>([]);
  filtered = signal<StockAlertDto[]>([]);
  resolveId = signal<string | null>(null);
  resolutionText = '';

  search = '';
  filterSeverity = '';
  filterType = '';
  filterUnread = false;
  filterUnresolved = false;

  criticalCount = signal(0);
  warningCount = signal(0);
  infoCount = signal(0);
  unreadCount = signal(0);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.stockService.getAlerts().subscribe({
      next: (items) => {
        this.items.set(items);
        this.criticalCount.set(items.filter(a => a.severity === 'Critical').length);
        this.warningCount.set(items.filter(a => a.severity === 'Warning').length);
        this.infoCount.set(items.filter(a => a.severity === 'Info').length);
        this.unreadCount.set(items.filter(a => !a.isRead).length);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    let result = this.items();
    const q = this.search.toLowerCase();
    if (q) result = result.filter(a => a.stockItemName.toLowerCase().includes(q) || a.message.toLowerCase().includes(q));
    if (this.filterSeverity) result = result.filter(a => a.severity === this.filterSeverity);
    if (this.filterType) result = result.filter(a => a.alertType === this.filterType);
    if (this.filterUnread) result = result.filter(a => !a.isRead);
    if (this.filterUnresolved) result = result.filter(a => !a.isResolved);
    this.filtered.set(result);
  }

  markRead(alert: StockAlertDto) {
    this.stockService.markAlertRead(alert.id).subscribe({ next: () => this.load() });
  }

  startResolve(id: string) {
    this.resolveId.set(id);
    this.resolutionText = '';
  }

  confirmResolve(id: string) {
    if (!this.resolutionText.trim()) return;
    this.stockService.resolveAlert(id, this.resolutionText).subscribe({
      next: () => { this.resolveId.set(null); this.load(); }
    });
  }

  severityFr(s: string): string { return SEVERITY_FR[s] ?? s; }
  alertTypeFr(t: string): string { return ALERT_TYPE_FR[t] ?? t; }
}
