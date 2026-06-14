import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { ExportService } from '../../../../services/export.service';
import { WarehouseDto } from '../../models/stock.models';

const UNIT_FR: Record<string, string> = {
  Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kg', Meter: 'Mètre',
  SquareMeter: 'm²', CubicMeter: 'm³', Box: 'Carton', Pallet: 'Palette',
  Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
};

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Inventaire Physique
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Saisissez vos comptages de stock réels et ajustez automatiquement les écarts</p>
        </div>
      </div>

      <!-- Étape 1 : Sélection de l'entrepôt et démarrage -->
      @if (!activeSession()) {
        <div class="card" style="max-width: 500px; margin: 40px auto; padding: 24px; text-align: center;">
          <div style="width:64px;height:64px;background:rgba(14,165,233,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:var(--accent);font-size:28px;">
            <i class="pi pi-building"></i>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Démarrer un nouvel inventaire</h2>
          <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:24px;line-height:1.5;">
            Sélectionnez un entrepôt ou dépôt pour générer la feuille de comptage contenant tous les lots de stock actuellement actifs.
          </p>

          <div class="form-group" style="text-align:left;margin-bottom:20px;">
            <label class="form-label">Entrepôt à inventorier *</label>
            <select class="form-select" [(ngModel)]="selectedWarehouseId" style="width:100%">
              <option value="">Choisir un entrepôt...</option>
              @for (wh of warehouses(); track wh.id) {
                <option [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
              }
            </select>
          </div>

          <button class="btn btn-primary" style="width:100%;justify-content:center;" 
            (click)="startSession()" [disabled]="!selectedWarehouseId || loading()">
            @if (loading()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px;"></div> }
            Démarrer le comptage
          </button>
        </div>
      } @else {
        <!-- Étape 2 : Session de comptage active -->
        <div class="card" style="background:var(--bg-card);border:1px solid var(--border);padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;">Inventaire En Cours</div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-primary);margin-top:2px;">
              {{ activeSession()?.warehouseName }}
            </h2>
            <div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">
              Débuté le {{ activeSession()?.startedAt | date:'dd/MM/yyyy à HH:mm' }} · Session: <code style="font-size:11px;">{{ activeSession()?.id.toString().substring(0,8) }}</code>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" (click)="exportSessionCsv()" title="Exporter la feuille de comptage en CSV">
              <i class="pi pi-download"></i> Exporter CSV
            </button>
            <button class="btn btn-danger btn-sm" (click)="confirmCancelSession()">
              <i class="pi pi-times"></i> Annuler la session
            </button>
          </div>
        </div>

        <!-- Filtres et stats de session -->
        <div style="display:flex;gap:16px;margin-bottom:20px;align-items:stretch;flex-wrap:wrap;">
          <!-- Barre de filtres -->
          <div class="filter-bar" style="flex:1;margin-bottom:0;display:flex;align-items:center;gap:16px;">
            <div class="search-box" style="flex:1;max-width:300px;margin-bottom:0;">
              <i class="pi pi-search"></i>
              <input class="search-input" [(ngModel)]="searchQuery" placeholder="Rechercher un article, référence, lot…" (ngModelChange)="applyFilter()">
            </div>
            
            <div style="display:flex;gap:16px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-primary);cursor:pointer;">
                <input type="radio" name="filterMode" [value]="'all'" [(ngModel)]="filterMode" (change)="applyFilter()">
                Tous ({{ activeSession()?.items?.length }})
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--warning);cursor:pointer;">
                <input type="radio" name="filterMode" [value]="'gaps'" [(ngModel)]="filterMode" (change)="applyFilter()">
                Avec écarts ({{ getGapsCount() }})
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
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Écarts détectés</div>
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
                <th>Article / Désignation</th>
                <th>Référence</th>
                <th>N° Lot</th>
                <th>Péremption</th>
                <th style="text-align:right;width:120px;">Théorique (Dépôt)</th>
                <th style="text-align:right;width:150px;">Physique (Compté)</th>
                <th style="text-align:right;width:100px;">Écart</th>
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
                  <td style="color:var(--text-muted)">{{ item.expiryDate ? (item.expiryDate | date:'dd/MM/yyyy') : '—' }}</td>
                  <td style="text-align:right;font-weight:600;color:var(--text-muted);">
                    {{ item.TheoreticalQuantity }} {{ unitFr(item.unit) }}
                  </td>
                  <td style="text-align:right;">
                    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">
                      <input type="number" class="form-input" style="width:90px;text-align:right;padding:4px 8px;font-size:13px;font-weight:700;"
                        [(ngModel)]="item.PhysicalQuantity" min="0" (ngModelChange)="onCountChange(item)">
                      <span style="font-size:12px;color:var(--text-muted);width:30px;text-align:left;">{{ unitFr(item.unit) }}</span>
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
                    Aucun lot ne correspond aux filtres.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Actions de pied de page -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;">
          <span style="font-size:13px;color:var(--text-muted);">
            Toutes les modifications sont conservées localement. Cliquez sur Valider pour appliquer les corrections.
          </span>
          <div style="display:flex;gap:12px;">
            <button class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving()">
              @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;"></div> }
              Enregistrer le brouillon
            </button>
            <button class="btn btn-primary" (click)="confirmValidate()" [disabled]="saving()">
              <i class="pi pi-check-circle"></i> Valider l'inventaire
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
            <h2 class="modal-title">Valider l'inventaire</h2>
            <div class="confirm-message">
              Vous êtes sur le point de valider l'inventaire physique pour l'entrepôt <strong>{{ activeSession()?.warehouseName }}</strong>.<br><br>
              @if (getGapsCount() > 0) {
                Un bon d'ajustement automatique de stock sera créé pour corriger les <strong>{{ getGapsCount() }} écart(s)</strong> de comptage détectés.<br>
                Les quantités des lots correspondants seront écrasées par vos valeurs mesurées.
              } @else {
                Aucun écart de stock n'a été détecté. Aucune modification ne sera appliquée.
              }
            </div>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="showConfirmValidationModal.set(false)">Retour</button>
              <button class="btn btn-primary" (click)="executeValidate()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;"></div> }
                Oui, valider et ajuster
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
            <h2 class="modal-title">Annuler la session</h2>
            <p class="confirm-message">
              Êtes-vous sûr de vouloir annuler cette session d'inventaire ?<br>
              Toutes les saisies actuelles de comptage seront perdues.
            </p>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="showCancelModal.set(false)">Retour</button>
              <button class="btn btn-danger" (click)="executeCancel()">Oui, abandonner</button>
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
                Inventaire Physique
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Ce module permet d'effectuer un comptage de stock réel dans un entrepôt et de corriger automatiquement les écarts constatés avec le stock informatique.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🏢 <strong>Démarrage par dépôt</strong> : Sélectionnez un dépôt pour générer sa feuille de comptage en temps réel.</li>
                <li>📝 <strong>Saisie interactive</strong> : Saisissez la quantité physique comptée pour chaque lot.</li>
                <li>📊 <strong>Calcul des écarts</strong> : L'écart est calculé automatiquement en temps réel (positif ou négatif).</li>
                <li>⚙️ <strong>Ajustement automatique</strong> : La validation de l'inventaire crée un bon d'ajustement qui corrige immédiatement les lots en stock.</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showInfoModal.set(false)">Fermer</button>
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
              <button class="btn btn-primary" (click)="closeCustomAlert()">D'accord</button>
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
    // We check if there's a stored session ID locally to resume it
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
        title: "Validation de formulaire",
        message: "Veuillez sélectionner un entrepôt pour démarrer le comptage.",
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
    // Guard against negative inputs
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
    
    // 1. Save current counts first to make sure they are synced
    const counts = session.items.map((i: any) => ({
      stockLotId: i.stockLotId,
      physicalQuantity: i.PhysicalQuantity
    }));

    const sessionId = session.Id || session.id;
    this.stockService.saveInventoryCounts(sessionId, counts).subscribe({
      next: () => {
        // 2. Call validate endpoint to confirm and apply stock adjustments
        this.stockService.validateInventorySession(sessionId).subscribe({
          next: () => {
            this.saving.set(false);
            this.showConfirmValidationModal.set(false);
            this.activeSession.set(null);
            localStorage.removeItem('active_inventory_session_id');
            this.customAlert.set({
              title: "Inventaire Validé",
              message: "Inventaire validé avec succès ! Les écarts ont été corrigés en stock.",
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

  unitFr(u: string): string { return UNIT_FR[u] || u; }

  exportSessionCsv() {
    const session = this.activeSession();
    if (!session) return;

    const data = session.items.map((i: any) => ({
      'Article': i.articleName,
      'Référence': i.articleReference,
      'N° Lot': i.lotNumber,
      'Théorique': i.TheoreticalQuantity,
      'Physique compté': i.PhysicalQuantity,
      'Écart': i.PhysicalQuantity - i.TheoreticalQuantity,
      'Unité': this.unitFr(i.unit)
    }));
    this.exportService.exportToCsv(data, `feuille_comptage_${session.warehouseName}`);
  }
}
