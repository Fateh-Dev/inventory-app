import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { ExportService } from '../../../../services/export.service';

const UNIT_FR: Record<string, string> = {
  Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kg', Meter: 'Mètre',
  SquareMeter: 'm²', CubicMeter: 'm³', Box: 'Carton', Pallet: 'Palette',
  Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
};

@Component({
  selector: 'app-lots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Gestion des Lots
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Vue consolidée de tous les lots de stock par article et entrepôt</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="load()">
            <i class="pi pi-refresh"></i> Actualiser
          </button>
          <button class="btn btn-secondary" (click)="exportCsv()">
            <i class="pi pi-download"></i> Exporter CSV
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="Rechercher par article, lot, entrepôt…" (ngModelChange)="applyFilter()">
        </div>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterExpiring" (change)="load()"> Expirant bientôt
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterLowStock" (change)="load()"> Stock faible
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterExcludeExpired" (change)="load()"> Masquer expirés
        </label>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
        <div class="stat-card" style="flex:1;min-width:130px;">
          <div class="stat-icon blue"><i class="pi pi-list"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ totalLots() }}</div>
            <div class="stat-label">Total lots</div>
          </div>
        </div>
        <div class="stat-card" style="flex:1;min-width:130px;">
          <div class="stat-icon orange"><i class="pi pi-clock"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ expiringCount() }}</div>
            <div class="stat-label">Expirant ≤ 30j</div>
          </div>
        </div>
        <div class="stat-card" style="flex:1;min-width:130px;">
          <div class="stat-icon red"><i class="pi pi-times-circle"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ expiredCount() }}</div>
            <div class="stat-label">Expirés</div>
          </div>
        </div>
        <div class="stat-card" style="flex:1;min-width:130px;">
          <div class="stat-icon orange"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ lowStockCount() }}</div>
            <div class="stat-label">Stock faible</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <h3>Aucun lot trouvé</h3>
            <p>Ajustez vos filtres ou créez une réception pour générer des lots.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>N° Lot</th>
                <th>Article</th>
                <th>Référence</th>
                <th>Entrepôt</th>
                <th>Qté courante</th>
                <th>Qté initiale</th>
                <th>Péremption</th>
                <th>Reçu le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (lot of filtered(); track lot.id) {
                <tr>
                  <td><code style="font-size:12px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;color:var(--accent)">{{ lot.lotNumber }}</code></td>
                  <td style="font-weight:600">{{ lot.stockItemName }}</td>
                  <td><span style="font-size:11px;color:var(--text-muted)">{{ lot.stockItemReference }}</span></td>
                  <td>
                    <span style="display:flex;align-items:center;gap:4px;">
                      <i class="pi pi-building" style="font-size:10px;color:var(--text-muted)"></i>
                      {{ lot.warehouseName }}
                    </span>
                  </td>
                  <td style="font-weight:700;" [style.color]="lot.isLowStock ? 'var(--warning)' : 'var(--text-primary)'">
                    {{ lot.currentQuantity }} {{ unitFr(lot.currentUnit) }}
                  </td>
                  <td style="color:var(--text-muted)">{{ lot.initialQuantity }} {{ unitFr(lot.initialUnit) }}</td>
                  <td>
                    @if (lot.expiryDate) {
                      <span [style.color]="lot.isExpired ? 'var(--danger)' : isExpiringSoon(lot.expiryDate) ? 'var(--warning)' : 'var(--text-primary)'">
                        {{ lot.expiryDate | date:'dd/MM/yyyy' }}
                      </span>
                    } @else {
                      <span style="color:var(--text-muted)">—</span>
                    }
                  </td>
                  <td style="color:var(--text-muted);font-size:12px;">{{ lot.receivedAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    @if (lot.isExpired) {
                      <span class="badge badge-danger"><i class="pi pi-times"></i> Expiré</span>
                    } @else if (isExpiringSoon(lot.expiryDate)) {
                      <span class="badge badge-warning"><i class="pi pi-clock"></i> Expire bientôt</span>
                    } @else if (lot.isLowStock) {
                      <span class="badge badge-warning"><i class="pi pi-exclamation-triangle"></i> Stock faible</span>
                    } @else {
                      <span class="badge badge-success"><i class="pi pi-check"></i> Normal</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
      
      <!-- Info Modal -->
      @if (showInfoModal()) {
        <div class="modal-overlay" style="z-index: 2100;">
          <div class="modal-panel" style="max-width:500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                <i class="pi pi-info-circle" style="color:var(--accent)"></i>
                Gestion des Lots
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Cette page présente une vue consolidée de tous les lots de stock actifs. Elle permet un contrôle rigoureux de la traçabilité et du cycle de vie de chaque approvisionnement.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🔍 <strong>Recherche & Filtres</strong> : Filtrez par entrepôt, par article ou par numéro de lot.</li>
                <li>⚠️ <strong>Alertes d'expiration</strong> : Identifiez visuellement les lots expirés (rouge) ou expirant sous 30 jours (orange).</li>
                <li>📦 <strong>Seuils critiques</strong> : Repérez les lots dont les quantités sont tombées en dessous du seuil critique de stock.</li>
                <li>⬇️ <strong>Export CSV</strong> : Téléchargez la feuille des lots pour audit.</li>
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
export class LotsComponent implements OnInit {
  private stockService = inject(StockService);
  private exportService = inject(ExportService);

  showInfoModal = signal(false);
  loading = signal(true);
  lots = signal<any[]>([]);
  filtered = signal<any[]>([]);

  search = '';
  filterExpiring = false;
  filterLowStock = false;
  filterExcludeExpired = false;

  totalLots = signal(0);
  expiringCount = signal(0);
  expiredCount = signal(0);
  lowStockCount = signal(0);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.stockService.getLots({
      expiringOnly: this.filterExpiring || undefined,
      lowStockOnly: this.filterLowStock || undefined,
      excludeExpired: this.filterExcludeExpired || undefined,
      pageSize: 500
    }).subscribe({
      next: (data) => {
        this.lots.set(data);
        this.totalLots.set(data.length);
        this.expiringCount.set(data.filter((l: any) => !l.isExpired && this.isExpiringSoon(l.expiryDate)).length);
        this.expiredCount.set(data.filter((l: any) => l.isExpired).length);
        this.lowStockCount.set(data.filter((l: any) => l.isLowStock).length);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    const result = q
      ? this.lots().filter((l: any) =>
          (l.stockItemName || '').toLowerCase().includes(q) ||
          (l.stockItemReference || '').toLowerCase().includes(q) ||
          (l.lotNumber || '').toLowerCase().includes(q) ||
          (l.warehouseName || '').toLowerCase().includes(q))
      : this.lots();
    this.filtered.set(result);
  }

  isExpiringSoon(date?: string): boolean {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }

  unitFr(u: string): string { return UNIT_FR[u] || u; }

  exportCsv() {
    const data = this.filtered().map((l: any) => ({
      'N° Lot': l.lotNumber,
      'Article': l.stockItemName,
      'Référence': l.stockItemReference,
      'Entrepôt': l.warehouseName,
      'Qté courante': l.currentQuantity,
      'Unité': this.unitFr(l.currentUnit),
      'Qté initiale': l.initialQuantity,
      'Péremption': l.expiryDate ? new Date(l.expiryDate).toLocaleDateString('fr-FR') : '',
      'Reçu le': new Date(l.receivedAt).toLocaleDateString('fr-FR'),
      'Statut': l.isExpired ? 'Expiré' : this.isExpiringSoon(l.expiryDate) ? 'Expire bientôt' : l.isLowStock ? 'Stock faible' : 'Normal'
    }));
    this.exportService.exportToCsv(data, 'lots_stock');
  }
}
