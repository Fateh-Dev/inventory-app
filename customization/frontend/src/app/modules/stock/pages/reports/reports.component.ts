import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { ExportService } from '../../../../services/export.service';
import { PrintService } from '../../../../services/print.service';

const UNIT_FR: Record<string, string> = {
  Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kg', Meter: 'Mètre',
  SquareMeter: 'm²', CubicMeter: 'm³', Box: 'Carton', Pallet: 'Palette',
  Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Rapports & Statistiques
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Analysez vos données de stock, consommation et valorisation</p>
        </div>
      </div>

      <!-- Onglets -->
      <div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0;">
        @for (tab of tabs; track tab.id) {
          <button (click)="activeTab.set(tab.id)"
            style="padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s;"
            [style.color]="activeTab() === tab.id ? 'var(--accent)' : 'var(--text-muted)'"
            [style.borderBottom]="activeTab() === tab.id ? '2px solid var(--accent)' : '2px solid transparent'"
            [style.marginBottom]="'-2px'">
            <i [class]="'pi ' + tab.icon" style="margin-right:6px;"></i>{{ tab.label }}
          </button>
        }
      </div>

      <!-- Filtres période -->
      <div class="filter-bar" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <label style="font-size:13px;color:var(--text-muted);font-weight:600;">Période :</label>
          <input type="date" class="form-input" style="width:160px;padding:6px 10px;font-size:13px;" [(ngModel)]="fromDate">
          <span style="color:var(--text-muted)">→</span>
          <input type="date" class="form-input" style="width:160px;padding:6px 10px;font-size:13px;" [(ngModel)]="toDate">
          <button class="btn btn-primary btn-sm" (click)="loadCurrentTab()">
            <i class="pi pi-search"></i> Générer
          </button>
          <button class="btn btn-secondary btn-sm" (click)="resetDates()">Effacer</button>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" (click)="exportCurrentCsv()">
            <i class="pi pi-download"></i> CSV
          </button>
          <button class="btn btn-secondary btn-sm" (click)="printCurrentReport()">
            <i class="pi pi-print"></i> Imprimer
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      }

      <!-- Consommation -->
      @if (activeTab() === 'consumption' && !loading()) {
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);">
              <i class="pi pi-chart-bar" style="color:var(--accent);margin-right:8px;"></i>
              Consommation par département
            </h3>
            <span class="badge badge-muted">{{ consumptionData().length }} lignes</span>
          </div>
          @if (consumptionData().length === 0) {
            <div class="empty-state"><i class="pi pi-chart-bar"></i><p>Aucune sortie dans cette période.</p></div>
          } @else {
            <table class="data-table">
              <thead><tr>
                <th>Département</th><th>Article</th><th>Référence</th>
                <th style="text-align:right">Qté totale</th><th>Unité</th><th style="text-align:right">Mouvements</th>
              </tr></thead>
              <tbody>
                @for (r of consumptionData(); track $index) {
                  <tr>
                    <td><span class="badge badge-muted">{{ r.departmentName }}</span></td>
                    <td style="font-weight:600">{{ r.articleName }}</td>
                    <td><code style="font-size:11px;color:var(--accent)">{{ r.articleReference }}</code></td>
                    <td style="text-align:right;font-weight:700">{{ r.totalQuantity }}</td>
                    <td>{{ unitFr(r.unit) }}</td>
                    <td style="text-align:right;color:var(--text-muted)">{{ r.movementCount }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Valorisation -->
      @if (activeTab() === 'valuation' && !loading()) {
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);">
              <i class="pi pi-wallet" style="color:var(--success);margin-right:8px;"></i>
              Valorisation du stock
            </h3>
            <span style="font-size:16px;font-weight:800;color:var(--success)">Total : {{ totalValuation() | number:'1.2-2' }} DZD</span>
          </div>
          @if (valuationData().length === 0) {
            <div class="empty-state"><i class="pi pi-wallet"></i><p>Aucun stock valorisé.</p></div>
          } @else {
            <table class="data-table">
              <thead><tr>
                <th>Article</th><th>Référence</th><th>Entrepôt</th>
                <th style="text-align:right">Qté</th><th>Unité</th>
                <th style="text-align:right">P.U. (DZD)</th><th style="text-align:right">Valeur (DZD)</th>
              </tr></thead>
              <tbody>
                @for (r of valuationData(); track $index) {
                  <tr>
                    <td style="font-weight:600">{{ r.articleName }}</td>
                    <td><code style="font-size:11px;color:var(--accent)">{{ r.articleReference }}</code></td>
                    <td>{{ r.warehouseName }}</td>
                    <td style="text-align:right">{{ r.totalQuantity }}</td>
                    <td>{{ unitFr(r.unit) }}</td>
                    <td style="text-align:right">{{ r.unitCost | number:'1.2-2' }}</td>
                    <td style="text-align:right;font-weight:700;color:var(--success)">{{ r.totalValue | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Résumé mouvements -->
      @if (activeTab() === 'summary' && !loading()) {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:20px;">
          @for (r of summaryData(); track $index) {
            <div class="card" style="text-align:center;">
              <div style="font-size:28px;font-weight:800;color:var(--accent);margin-bottom:6px;">{{ r.count }}</div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">{{ r.typeFr }}</div>
              <div style="font-size:12px;color:var(--text-muted)">{{ r.totalQuantity | number:'1.0-2' }} unités traitées</div>
            </div>
          }
          @if (summaryData().length === 0) {
            <div class="empty-state"><i class="pi pi-chart-pie"></i><p>Aucun mouvement confirmé dans cette période.</p></div>
          }
        </div>
      }

      <!-- Top articles -->
      @if (activeTab() === 'top' && !loading()) {
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);">
            <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);">
              <i class="pi pi-star" style="color:var(--warning);margin-right:8px;"></i>
              Top articles consommés
            </h3>
          </div>
          @if (topData().length === 0) {
            <div class="empty-state"><i class="pi pi-star"></i><p>Aucune sortie dans cette période.</p></div>
          } @else {
            <table class="data-table">
              <thead><tr>
                <th style="width:40px">#</th><th>Article</th><th>Référence</th>
                <th style="text-align:right">Qté totale</th><th>Unité</th><th style="text-align:right">Nb. sorties</th>
              </tr></thead>
              <tbody>
                @for (r of topData(); track $index) {
                  <tr>
                    <td><span style="font-weight:700;color:var(--accent)">{{ $index + 1 }}</span></td>
                    <td style="font-weight:600">{{ r.articleName }}</td>
                    <td><code style="font-size:11px;color:var(--accent)">{{ r.articleReference }}</code></td>
                    <td style="text-align:right;font-weight:700">{{ r.totalQuantity }}</td>
                    <td>{{ unitFr(r.unit) }}</td>
                    <td style="text-align:right;color:var(--text-muted)">{{ r.movementCount }}</td>
                  </tr>
                }
              </tbody>
            </table>
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
                Rapports & Statistiques
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Ce module analytique consolide vos transactions physiques et financières de stock sous forme de quatre rapports synthétiques.
              </p>
              <p style="margin-bottom:8px;"><strong>Rapports disponibles :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>📈 <strong>Consommation</strong> : Suivi des sorties cumulées par département interne et par période.</li>
                <li>💰 <strong>Valorisation</strong> : Calcul financier de la valeur totale du stock (coût unitaire du lot × quantité courante).</li>
                <li>📊 <strong>Résumé Mouvements</strong> : Résumé comptable des volumes d'entrées et de sorties d'articles.</li>
                <li>⭐ <strong>Top Articles</strong> : Liste des matériaux les plus demandés/consommés sur le terrain.</li>
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
export class ReportsComponent implements OnInit {
  private stockService = inject(StockService);
  private exportService = inject(ExportService);
  private printService = inject(PrintService);

  showInfoModal = signal(false);

  tabs = [
    { id: 'consumption', label: 'Consommation', icon: 'pi-chart-bar' },
    { id: 'valuation', label: 'Valorisation', icon: 'pi-wallet' },
    { id: 'summary', label: 'Résumé mouvements', icon: 'pi-chart-pie' },
    { id: 'top', label: 'Top articles', icon: 'pi-star' },
  ];

  activeTab = signal('consumption');
  loading = signal(false);
  fromDate = '';
  toDate = '';

  consumptionData = signal<any[]>([]);
  valuationData = signal<any[]>([]);
  summaryData = signal<any[]>([]);
  topData = signal<any[]>([]);
  totalValuation = signal(0);

  ngOnInit() { this.loadCurrentTab(); }

  loadCurrentTab() {
    this.loading.set(true);
    const from = this.fromDate || undefined;
    const to = this.toDate || undefined;
    switch (this.activeTab()) {
      case 'consumption':
        this.stockService.getConsumptionReport({ fromDate: from, toDate: to }).subscribe({
          next: d => { this.consumptionData.set(d); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
      case 'valuation':
        this.stockService.getValuationReport().subscribe({
          next: d => {
            this.valuationData.set(d);
            this.totalValuation.set(d.reduce((s: number, r: any) => s + (r.totalValue || 0), 0));
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
        break;
      case 'summary':
        this.stockService.getMovementSummaryReport(from, to).subscribe({
          next: d => { this.summaryData.set(d); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
      case 'top':
        this.stockService.getTopItemsReport(from, to, 20).subscribe({
          next: d => { this.topData.set(d); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
        break;
    }
  }

  resetDates() { this.fromDate = ''; this.toDate = ''; this.loadCurrentTab(); }

  unitFr(u: string): string { return UNIT_FR[u] || u; }

  exportCurrentCsv() {
    switch (this.activeTab()) {
      case 'consumption':
        this.exportService.exportToCsv(this.consumptionData().map(r => ({
          'Département': r.departmentName, 'Article': r.articleName, 'Référence': r.articleReference,
          'Qté totale': r.totalQuantity, 'Unité': this.unitFr(r.unit), 'Mouvements': r.movementCount
        })), 'rapport_consommation');
        break;
      case 'valuation':
        this.exportService.exportToCsv(this.valuationData().map(r => ({
          'Article': r.articleName, 'Référence': r.articleReference, 'Entrepôt': r.warehouseName,
          'Qté': r.totalQuantity, 'Unité': this.unitFr(r.unit), 'P.U.': r.unitCost, 'Valeur': r.totalValue
        })), 'rapport_valorisation');
        break;
      case 'top':
        this.exportService.exportToCsv(this.topData().map((r, i) => ({
          'Rang': i + 1, 'Article': r.articleName, 'Référence': r.articleReference,
          'Qté totale': r.totalQuantity, 'Unité': this.unitFr(r.unit), 'Nb sorties': r.movementCount
        })), 'rapport_top_articles');
        break;
    }
  }

  printCurrentReport() {
    switch (this.activeTab()) {
      case 'consumption':
        this.printService.printReport('Rapport de consommation par département',
          ['Département', 'Article', 'Référence', 'Qté totale', 'Unité', 'Mouvements'],
          this.consumptionData().map(r => [r.departmentName, r.articleName, r.articleReference, r.totalQuantity, this.unitFr(r.unit), r.movementCount]));
        break;
      case 'valuation':
        this.printService.printReport('Rapport de valorisation du stock',
          ['Article', 'Référence', 'Entrepôt', 'Qté', 'Unité', 'P.U. (DZD)', 'Valeur (DZD)'],
          this.valuationData().map(r => [r.articleName, r.articleReference, r.warehouseName, r.totalQuantity, this.unitFr(r.unit), r.unitCost?.toFixed(2), r.totalValue?.toFixed(2)]),
          ['', '', '', '', '', 'Total :', this.totalValuation().toFixed(2) + ' DZD']);
        break;
      case 'top':
        this.printService.printReport('Top articles consommés',
          ['#', 'Article', 'Référence', 'Qté totale', 'Unité', 'Nb sorties'],
          this.topData().map((r, i) => [String(i + 1), r.articleName, r.articleReference, r.totalQuantity, this.unitFr(r.unit), r.movementCount]));
        break;
    }
  }
}
