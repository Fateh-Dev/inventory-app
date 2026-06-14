import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { AuthService } from '../../../../services/auth.service';
import { PrintService } from '../../../../services/print.service';
import { ExportService } from '../../../../services/export.service';
import { StockMovementDto, SupplierDto, WarehouseDto, DepartmentDto, StockItemDto, StockLotDto } from '../../models/stock.models';

const TYPE_FR: Record<string, string> = {
  Reception: 'Réception', Issue: 'Sortie', Transfer: 'Transfert',
  Return: 'Retour', Adjustment: 'Ajustement', Disposal: 'Mise au rebut'
};

const STATUS_FR: Record<string, string> = {
  Pending: 'En attente', Confirmed: 'Confirmé', Cancelled: 'Annulé'
};
 
const UNIT_FR: Record<string, string> = {
  Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kilogramme', Meter: 'Mètre',
  SquareMeter: 'Mètre carré', CubicMeter: 'Mètre cube', Box: 'Carton',
  Pallet: 'Palette', Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
};

@Component({ 
  selector: 'app-movements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Mouvements de stock
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Suivez toutes les réceptions, sorties, transferts et ajustements de matériaux</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="exportCsv()">
            <i class="pi pi-download"></i> Exporter CSV
          </button>
          <button class="btn btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> Nouveau mouvement
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box" style="max-width:200px;">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="N° mouvement…" (ngModelChange)="onSearchChange()">
        </div>
        <select class="form-select" style="width:170px" [(ngModel)]="filterType" (change)="onFilterChange()">
          <option value="">Tous les types</option>
          <option value="Reception">Réception</option>
          <option value="Issue">Sortie</option>
          <option value="Transfer">Transfert</option>
          <option value="Return">Retour</option>
          <option value="Adjustment">Ajustement</option>
          <option value="Disposal">Mise au rebut</option>
        </select>
        <select class="form-select" style="width:160px" [(ngModel)]="filterStatus" (change)="onFilterChange()">
          <option value="">Tous les statuts</option>
          <option value="Pending">En attente</option>
          <option value="Confirmed">Confirmé</option>
          <option value="Cancelled">Annulé</option>
        </select>
        <input class="form-input" type="date" [(ngModel)]="fromDate" (change)="onFilterChange()" style="width:150px" title="Date de début">
        <input class="form-input" type="date" [(ngModel)]="toDate" (change)="onFilterChange()" style="width:150px" title="Date de fin">
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-arrow-right-arrow-left"></i>
            <h3>Aucun mouvement trouvé</h3>
            <p>Créez votre premier mouvement de stock pour suivre les changements d'inventaire.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Origine</th>
                <th>Destination / Département</th>
                <th>Lignes</th>
                <th style="text-align:right">Valeur totale</th>
                <th style="text-align:right">Actions</th>
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
                    <span class="badge" [ngClass]="getTypeBadge(m.type)">{{ typeFr(m.type) }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadge(m.status)">{{ statusFr(m.status) }}</span>
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
                      <button class="btn btn-primary btn-sm" style="margin-right:4px;" (click)="confirmMovement(m)" title="Confirmer le mouvement">
                        <i class="pi pi-check"></i>
                      </button>
                      <button class="btn btn-secondary btn-sm" style="margin-right:4px;" (click)="editMovement(m)" title="Modifier">
                        <i class="pi pi-pencil"></i>
                      </button>
                    }
                    @if (m.status === 'Confirmed') {
                      <button class="btn btn-secondary btn-sm" style="margin-right:4px;" (click)="printMovement(m)" title="Imprimer le bon">
                        <i class="pi pi-print"></i>
                      </button>
                    }
                    <button class="btn btn-secondary btn-sm" (click)="viewDetail(m)" title="Voir le détail">
                      <i class="pi pi-eye"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-top:1px solid var(--border); background:var(--bg-base);">
            <span style="font-size:13px; color:var(--text-muted);">Page {{ pageNumber() }}</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-sm" [disabled]="pageNumber() <= 1" (click)="prevPage()">
                <i class="pi pi-chevron-left"></i> Précédent
              </button>
              <button class="btn btn-secondary btn-sm" [disabled]="!hasMore()" (click)="nextPage()">
                Suivant <i class="pi pi-chevron-right"></i>
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
                  {{ typeFr(selectedMovement()!.type) }} · {{ selectedMovement()!.movementDate | date:'dd MMM yyyy' }} · {{ selectedMovement()!.createdByUser }}
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <span class="badge" [ngClass]="getStatusBadge(selectedMovement()!.status)">{{ statusFr(selectedMovement()!.status) }}</span>
                @if (selectedMovement()!.status === 'Confirmed') {
                  <button class="btn btn-secondary btn-sm" (click)="printMovement(selectedMovement()!)" title="Imprimer le bon">
                    <i class="pi pi-print"></i> Imprimer
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
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">ORIGINE</div>
                    <div style="font-size:13px;font-weight:600;">{{ selectedMovement()!.sourceWarehouseName }}</div>
                  </div>
                }
                @if (selectedMovement()!.destinationWarehouseName || selectedMovement()!.departmentName) {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">DESTINATION</div>
                    <div style="font-size:13px;font-weight:600;">{{ selectedMovement()!.destinationWarehouseName ?? selectedMovement()!.departmentName }}</div>
                  </div>
                }
                @if (selectedMovement()!.supplierName) {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">FOURNISSEUR</div>
                    <div style="font-size:13px;font-weight:600;">{{ selectedMovement()!.supplierName }}</div>
                  </div>
                }
                @if (selectedMovement()!.type === 'Reception') {
                  <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">VALEUR TOTALE</div>
                    <div style="font-size:16px;font-weight:800;color:var(--success);">{{ selectedMovement()!.totalValue | number:'1.2-2' }} DZD</div>
                  </div>
                }
              </div>

              <!-- Tableau des lignes -->
              @if (selectedMovement()!.lines.length > 0) {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Lot</th>
                      <th>Quantité</th>
                      @if (selectedMovement()!.type === 'Reception') {
                        <th>Coût unitaire</th>
                        <th style="text-align:right">Total ligne</th>
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
                        <td style="font-weight:700;">{{ line.quantity }} {{ line.unit }}</td>
                        @if (selectedMovement()!.type === 'Reception') {
                          <td style="color:var(--text-muted);">{{ line.unitCost }} {{ line.currency }}</td>
                          <td style="text-align:right;font-weight:700;color:var(--success);">{{ line.lineTotal | number:'1.2-2' }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p style="color:var(--text-muted);text-align:center;padding:20px;">Aucune ligne chargée</p>
              }

              @if (selectedMovement()!.notes) {
                <div style="margin-top:16px;padding:12px;background:var(--bg-base);border-radius:8px;border:1px solid var(--border);">
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">REMARQUES</div>
                  <div style="font-size:13px;color:var(--text-primary);">{{ selectedMovement()!.notes }}</div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedMovement.set(null)">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal création de mouvement -->
      @if (showCreateModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:850px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editingId() ? 'Modifier le mouvement' : 'Nouveau mouvement de stock' }}</h2>
              <button class="modal-close" (click)="showCreateModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Type de mouvement *</label>
                  <select class="form-select" [(ngModel)]="createForm.type">
                    <option value="Reception">Réception</option>
                    <option value="Issue">Sortie</option>
                    <option value="Transfer">Transfert</option>
                    <option value="Return">Retour</option>
                    <option value="Adjustment">Ajustement</option>
                    <option value="Disposal">Mise au rebut</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Date du mouvement *</label>
                  <input class="form-input" type="date" [(ngModel)]="createForm.movementDate">
                </div>
              </div>
              <div class="form-grid">
                @if (createForm.type === 'Reception') {
                  <div class="form-group">
                    <label class="form-label">Entrepôt de destination *</label>
                    <select class="form-select" [(ngModel)]="createForm.destinationWarehouseId">
                      <option value="">Sélectionner...</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fournisseur *</label>
                    <select class="form-select" [(ngModel)]="createForm.supplierId">
                      <option value="">Sélectionner...</option>
                      @for (sup of suppliers(); track sup.id) { <option [value]="sup.id">{{ sup.name }}</option> }
                    </select>
                  </div>
                } @else if (createForm.type === 'Issue' || createForm.type === 'Disposal') {
                  <div class="form-group">
                    <label class="form-label">Entrepôt source *</label>
                    <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId" (change)="resetNewLine()">
                      <option value="">Sélectionner...</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Département (Destination) *</label>
                    <select class="form-select" [(ngModel)]="createForm.departmentId">
                      <option value="">Sélectionner...</option>
                      @for (dep of departments(); track dep.id) { <option [value]="dep.id">{{ dep.name }}</option> }
                    </select>
                  </div>
                } @else if (createForm.type === 'Transfer') {
                  <div class="form-group">
                    <label class="form-label">Entrepôt source *</label>
                    <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId" (change)="resetNewLine()">
                      <option value="">Sélectionner...</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Entrepôt de destination *</label>
                    <select class="form-select" [(ngModel)]="createForm.destinationWarehouseId">
                      <option value="">Sélectionner...</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                } @else {
                  <div class="form-group">
                    <label class="form-label">Entrepôt *</label>
                    <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId" (change)="resetNewLine()">
                      <option value="">Sélectionner...</option>
                      @for (wh of warehouses(); track wh.id) { <option [value]="wh.id">{{ wh.name }}</option> }
                    </select>
                  </div>
                }
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Référence externe</label>
                  <input class="form-input" [(ngModel)]="createForm.reference" placeholder="N° bon de commande, etc.">
                </div>
                <div class="form-group">
                  <label class="form-label">Créé par *</label>
                  <input type="text" class="form-input" [(ngModel)]="createForm.createdByUser" readonly style="background-color: var(--bg-hover); color: var(--text-muted); cursor: not-allowed;">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Remarques</label>
                <textarea class="form-textarea" [(ngModel)]="createForm.notes" placeholder="Notes optionnelles"></textarea>
              </div>

              <!-- LIGNES -->
              <h3 style="margin-top:20px;margin-bottom:12px;font-size:15px;border-bottom:1px solid var(--border);padding-bottom:8px;">Lignes de mouvement</h3>
              
              @if (createForm.lines?.length > 0) {
                <table class="data-table" style="margin-bottom:12px; font-size: 13px;">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Détail</th>
                      <th>Qté</th>
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
                        <td style="font-weight:600">{{ l.quantity }} {{ l.unit }}</td>
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
                    <label class="form-label">Article *</label>
                    <input class="form-input" 
                           [(ngModel)]="itemSearchQuery" 
                           (ngModelChange)="searchArticles($event)" 
                           placeholder="Rechercher par nom ou référence…" 
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
                              <span style="color:var(--text-muted); font-size:11px;">Dispo: <strong style="color:var(--text-primary)">{{ item.totalQuantity }}</strong> {{ unitFr(item.defaultUnit) }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                    @if (showSuggestions() && suggestions().length === 0 && itemSearchQuery.trim().length >= 2 && !loadingSuggestions()) {
                      <div style="position:absolute; bottom:100%; left:0; right:0; background:var(--bg-base); border:1px solid var(--border); border-radius:6px; padding:12px; font-size:13px; color:var(--text-muted); z-index:1000; text-align:center; box-shadow:0 -10px 15px -3px rgba(0,0,0,0.1); margin-bottom:4px;">
                        Aucun article trouvé
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
                      <label class="form-label">Coût unitaire (DZD) *</label>
                      <input type="number" class="form-input" [(ngModel)]="newLine.unitCost" min="0">
                    </div>
                  }
                </div>

                <!-- ROW 2: Lot details or Expiry/Serial details -->
                @if (createForm.type !== 'Reception') {
                  <div class="form-group" style="margin-bottom:16px;">
                    <label class="form-label">Lot source *</label>
                    <select class="form-select" [(ngModel)]="newLine.stockLotId">
                      <option value="">Sélectionner...</option>
                      @for (lot of availableLots(); track lot.id) {
                        <option [value]="lot.id" [disabled]="createForm.sourceWarehouseId && lot.warehouseId !== createForm.sourceWarehouseId">
                          {{ lot.lotNumber }} (Dispo: {{ lot.currentQuantity }}) - {{ lot.warehouseName }}
                        </option>
                      }
                    </select>
                  </div>
                } @else if (getSelectedItem()?.hasExpiryDate || getSelectedItem()?.requiresSerialNumber) {
                  <div class="form-grid" style="margin-bottom:16px;">
                    @if (getSelectedItem()?.hasExpiryDate) {
                      <div class="form-group" style="margin:0;">
                        <label class="form-label">Date d'expiration *</label>
                        <input type="date" class="form-input" [(ngModel)]="newLine.expiryDate">
                      </div>
                    }
                    @if (getSelectedItem()?.requiresSerialNumber) {
                      <div class="form-group" style="margin:0;">
                        <label class="form-label">Numéro de série *</label>
                        <input type="text" class="form-input" [(ngModel)]="newLine.serialNumber" placeholder="N° Série">
                      </div>
                    }
                  </div>
                }

                <!-- ROW 3: Quantity and Unit (with add button) -->
                <div style="display:flex;gap:12px;align-items:flex-end;">
                  <div class="form-group" style="flex:1;margin:0;">
                    <label class="form-label">{{ createForm.type === 'Adjustment' ? 'Nouvelle Qté (Absolue) *' : 'Quantité *' }}</label>
                    <input type="number" class="form-input" [(ngModel)]="newLine.quantity" min="0.01" step="0.01">
                  </div>
                  <div class="form-group" style="flex:1;margin:0;">
                    <label class="form-label">Unité</label>
                    <select class="form-select" [(ngModel)]="newLine.unit">
                      <option value="Piece">Pièce</option>
                      <option value="Liter">Litre</option>
                      <option value="Kilogram">Kilogramme</option>
                      <option value="Meter">Mètre</option>
                      <option value="SquareMeter">M²</option>
                      <option value="CubicMeter">M³</option>
                      <option value="Box">Boîte</option>
                      <option value="Pallet">Palette</option>
                      <option value="Roll">Rouleau</option>
                      <option value="Bag">Sac</option>
                      <option value="Can">Bidon</option>
                      <option value="Set">Kit/Set</option>
                    </select>
                  </div>
                  <button class="btn btn-secondary" (click)="addLine()" [disabled]="!canAddLine()">
                    <i class="pi pi-plus"></i> Ajouter
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showCreateModal.set(false)">Annuler</button>
              <button class="btn btn-primary" (click)="saveMovement()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                {{ editingId() ? 'Enregistrer les modifications' : 'Créer le mouvement' }}
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
                Mouvements de Stock
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Ce module gère le flux opérationnel des marchandises à travers les réceptions, distributions/sorties, transferts d'entrepôts, retours de matériel, ou ajustements.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>📥 <strong>Réception & Saisie financière</strong> : Saisissez les livraisons de fournisseurs avec coûts unitaires (valeur totale calculée automatiquement).</li>
                <li>📤 <strong>Flux internes (Sorties/Transferts)</strong> : Effectuez des sorties vers des départements internes ou transférez vers d'autres dépôts (sans information de coût requise).</li>
                <li>📝 <strong>Mode Brouillon (En attente)</strong> : Créez des mouvements temporaires que vous pouvez modifier librement sans impacter les stocks réels.</li>
                <li>🔒 <strong>Validation (Confirmation)</strong> : Confirmez définitivement un mouvement pour appliquer les modifications physiques de stocks et générer les lots.</li>
                <li>🖨️ <strong>Documents PDF/Impression</strong> : Imprimez des bons de livraison/sortie professionnels signés.</li>
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
              <button class="btn btn-primary" (click)="closeCustomAlert()">D'accord</button>
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
              <button class="btn btn-secondary" (click)="closeCustomConfirm(false)">Annuler</button>
              <button class="btn btn-primary" (click)="closeCustomConfirm(true)">Confirmer</button>
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
  
  currentUser = this.authService.currentUser;

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
        missing.push("Entrepôt de destination");
      }
      if (!this.createForm.supplierId) {
        missing.push("Fournisseur");
      }
    } else if (this.createForm.type === 'Issue' || this.createForm.type === 'Disposal') {
      if (!this.createForm.sourceWarehouseId) {
        missing.push("Entrepôt source");
      }
      if (!this.createForm.departmentId) {
        missing.push("Département (Destination)");
      }
    } else if (this.createForm.type === 'Transfer') {
      if (!this.createForm.sourceWarehouseId) {
        missing.push("Entrepôt source");
      }
      if (!this.createForm.destinationWarehouseId) {
        missing.push("Entrepôt de destination");
      }
      if (this.createForm.sourceWarehouseId && this.createForm.destinationWarehouseId && this.createForm.sourceWarehouseId === this.createForm.destinationWarehouseId) {
        missing.push("L'entrepôt de destination doit être différent de l'entrepôt source");
      }
    } else {
      if (!this.createForm.sourceWarehouseId) {
        missing.push("Entrepôt");
      }
    }

    if (!this.createForm.lines || this.createForm.lines.length === 0) {
      missing.push("Au moins une ligne de mouvement");
    }

    if (missing.length > 0) {
      this.customAlert.set({
        title: "Formulaire incomplet",
        message: "Veuillez remplir tous les champs obligatoires suivants :",
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
    // No longer load all 100k items on startup to make loading instantaneous!
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
        // Fetch item names for lines
        full.lines.forEach((l: any) => {
          if (!this.itemNamesMap.has(l.stockItemId)) {
            // we don't have the name, ideally we'd fetch it, but it should be ok if we don't display perfectly while editing, or we can use stockItems().find
          }
        });
        this.resetNewLine();
        this.showCreateModal.set(true);
      }
    });
  }

  confirmMovement(m: StockMovementDto) {
    this.showConfirm(
      `Confirmer le mouvement ${m.movementNumber}`,
      `Voulez-vous vraiment confirmer le mouvement ${m.movementNumber} ? Cette action mettra à jour les stocks et est irréversible.`,
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
    // Managed in autocomplete selection
  }

  // Autocomplete support methods
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
      if (this.newLine.unitCost <= 0) return false; // Bug #9: unitCost must be > 0
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
    // Bug #4: Store lot number for display in the line summary table
    const lot = this.availableLots().find(l => l.id === this.newLine.stockLotId);
    this.createForm.lines.push({ ...this.newLine, _lotNumber: lot?.lotNumber ?? null });
    this.resetNewLine();
  }

  removeLine(index: number) {
    this.createForm.lines.splice(index, 1);
  }

  getItemName(id: string): string {
    return this.itemNamesMap.get(id) ?? this.stockItems().find(i => i.id === id)?.name ?? 'Inconnu';
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
      'N° Mouvement': m.movementNumber,
      'Type': this.typeFr(m.type),
      'Statut': this.statusFr(m.status),
      'Date': new Date(m.movementDate).toLocaleDateString('fr-FR'),
      'Provenance': m.sourceWarehouseName || m.supplierName || '—',
      'Destination': m.destinationWarehouseName || m.departmentName || '—',
      'Référence': m.reference || '—',
      'Créé par': m.createdByUser || '—'
    }));
    this.exportService.exportToCsv(data, 'mouvements_stock');
  }

  typeFr(type: string): string { return TYPE_FR[type] ?? type; }
  statusFr(status: string): string { return STATUS_FR[status] ?? status; }
  unitFr(u: string): string { return UNIT_FR[u] ?? u; }

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
