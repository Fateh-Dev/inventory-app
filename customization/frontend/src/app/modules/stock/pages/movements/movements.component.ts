import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { StockMovementDto, SupplierDto, WarehouseDto, DepartmentDto, StockItemDto, StockLotDto } from '../../models/stock.models';

const TYPE_FR: Record<string, string> = {
  Reception: 'Réception', Issue: 'Sortie', Transfer: 'Transfert',
  Return: 'Retour', Adjustment: 'Ajustement', Disposal: 'Mise au rebut'
};

const STATUS_FR: Record<string, string> = {
  Pending: 'En attente', Confirmed: 'Confirmé', Cancelled: 'Annulé'
};

@Component({
  selector: 'app-movements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Mouvements de stock</h1>
          <p class="page-subtitle">Suivez toutes les réceptions, sorties, transferts et ajustements de matériaux</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Nouveau mouvement
        </button>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box" style="max-width:200px;">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="N° mouvement…" (ngModelChange)="applyFilter()">
        </div>
        <select class="form-select" style="width:170px" [(ngModel)]="filterType" (change)="load()">
          <option value="">Tous les types</option>
          <option value="Reception">Réception</option>
          <option value="Issue">Sortie</option>
          <option value="Transfer">Transfert</option>
          <option value="Return">Retour</option>
          <option value="Adjustment">Ajustement</option>
          <option value="Disposal">Mise au rebut</option>
        </select>
        <select class="form-select" style="width:160px" [(ngModel)]="filterStatus" (change)="load()">
          <option value="">Tous les statuts</option>
          <option value="Pending">En attente</option>
          <option value="Confirmed">Confirmé</option>
          <option value="Cancelled">Annulé</option>
        </select>
        <input class="form-input" type="date" [(ngModel)]="fromDate" (change)="load()" style="width:150px" title="Date de début">
        <input class="form-input" type="date" [(ngModel)]="toDate" (change)="load()" style="width:150px" title="Date de fin">
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
                    {{ m.totalValue | number:'1.2-2' }} DZD
                  </td>
                  <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm" (click)="viewDetail(m)" title="Voir le détail">
                      <i class="pi pi-eye"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Modal détail -->
      @if (selectedMovement()) {
        <div class="modal-overlay" (click)="selectedMovement.set(null)">
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
                <div style="background:var(--bg-base);padding:12px;border-radius:8px;border:1px solid var(--border);">
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">VALEUR TOTALE</div>
                  <div style="font-size:16px;font-weight:800;color:var(--success);">{{ selectedMovement()!.totalValue | number:'1.2-2' }} DZD</div>
                </div>
              </div>

              <!-- Tableau des lignes -->
              @if (selectedMovement()!.lines.length > 0) {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Lot</th>
                      <th>Quantité</th>
                      <th>Coût unitaire</th>
                      <th style="text-align:right">Total ligne</th>
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
                        <td style="color:var(--text-muted);">{{ line.unitCost }} {{ line.currency }}</td>
                        <td style="text-align:right;font-weight:700;color:var(--success);">{{ line.lineTotal | number:'1.2-2' }}</td>
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
        <div class="modal-overlay" (click)="showCreateModal.set(false)">
          <div class="modal-panel" style="max-width:620px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">Nouveau mouvement de stock</h2>
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
                <div class="form-group">
                  <label class="form-label">Entrepôt source</label>
                  <select class="form-select" [(ngModel)]="createForm.sourceWarehouseId">
                    <option value="">Sélectionner...</option>
                    @for (w of warehouses(); track w.id) {
                      <option [value]="w.id">{{ w.name }} ({{ w.code }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Entrepôt destination</label>
                  <select class="form-select" [(ngModel)]="createForm.destinationWarehouseId">
                    <option value="">Sélectionner...</option>
                    @for (w of warehouses(); track w.id) {
                      <option [value]="w.id">{{ w.name }} ({{ w.code }})</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Fournisseur</label>
                  <select class="form-select" [(ngModel)]="createForm.supplierId">
                    <option value="">Sélectionner...</option>
                    @for (s of suppliers(); track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Département</label>
                  <select class="form-select" [(ngModel)]="createForm.departmentId">
                    <option value="">Sélectionner...</option>
                    @for (d of departments(); track d.id) {
                      <option [value]="d.id">{{ d.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Référence externe</label>
                  <input class="form-input" [(ngModel)]="createForm.reference" placeholder="N° bon de commande, etc.">
                </div>
                <div class="form-group">
                  <label class="form-label">Créé par *</label>
                  <input class="form-input" [(ngModel)]="createForm.createdByUser" placeholder="Votre identifiant">
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
                <div class="form-grid" style="margin-bottom:8px;">
                  <div class="form-group">
                    <label class="form-label">Article *</label>
                    <select class="form-select" [(ngModel)]="newLine.stockItemId" (change)="onItemSelect()">
                      <option value="">Sélectionner...</option>
                      @for (item of stockItems(); track item.id) {
                        <option [value]="item.id">{{ item.name }} ({{ item.reference }})</option>
                      }
                    </select>
                  </div>
                  @if (createForm.type !== 'Reception') {
                    <div class="form-group">
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
                  } @else {
                    <div class="form-group">
                      <label class="form-label">Coût unitaire (DZD) *</label>
                      <input type="number" class="form-input" [(ngModel)]="newLine.unitCost" min="0">
                    </div>
                    @if (getSelectedItem()?.hasExpiryDate) {
                      <div class="form-group">
                        <label class="form-label">Date d'expiration *</label>
                        <input type="date" class="form-input" [(ngModel)]="newLine.expiryDate">
                      </div>
                    }
                    @if (getSelectedItem()?.requiresSerialNumber) {
                      <div class="form-group">
                        <label class="form-label">Numéro de série *</label>
                        <input type="text" class="form-input" [(ngModel)]="newLine.serialNumber" placeholder="N° Série">
                      </div>
                    }
                  }
                </div>
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
              <button class="btn btn-primary" (click)="saveMovement()" [disabled]="saving() || !createForm.lines?.length">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                Créer le mouvement
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MovementsComponent implements OnInit {
  private stockService = inject(StockService);

  loading = signal(true);
  saving = signal(false);
  showCreateModal = signal(false);
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

  search = '';
  filterType = '';
  filterStatus = '';
  fromDate = '';
  toDate = '';
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
      includeLines: true
    }).subscribe({
      next: (items) => { this.items.set(items); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadReferenceData() {
    this.stockService.getSuppliers(true).subscribe(data => this.suppliers.set(data));
    this.stockService.getWarehouses(true).subscribe(data => this.warehouses.set(data));
    this.stockService.getDepartments(true).subscribe(data => this.departments.set(data));
    this.stockService.getStockItems({ activeOnly: true }).subscribe(data => this.stockItems.set(data));
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered.set(this.items().filter(i => !q || i.movementNumber.toLowerCase().includes(q)));
  }

  openCreate() {
    this.createForm = {
      type: 'Reception', movementDate: new Date().toISOString().split('T')[0],
      sourceWarehouseId: '', destinationWarehouseId: '', supplierId: '',
      departmentId: '', reference: '', createdByUser: 'admin', notes: '', lines: []
    };
    this.resetNewLine();
    this.showCreateModal.set(true);
  }

  resetNewLine() {
    this.newLine = { stockItemId: '', stockLotId: '', quantity: 1, unit: 'Piece', unitCost: 0, currency: 'DZD', notes: '', expiryDate: '', serialNumber: '' };
    this.availableLots.set([]);
  }

  onItemSelect() {
    if (!this.newLine.stockItemId) {
      this.availableLots.set([]);
      return;
    }
    const item = this.stockItems().find(i => i.id === this.newLine.stockItemId);
    if (item) this.newLine.unit = item.defaultUnit;

    if (this.createForm.type !== 'Reception') {
      this.stockService.getStockItemLots(this.newLine.stockItemId, true).subscribe(lots => {
        this.availableLots.set(lots);
      });
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
    return this.stockItems().find(i => i.id === this.newLine.stockItemId);
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
    return this.stockItems().find(i => i.id === id)?.name ?? 'Inconnu';
  }

  viewDetail(m: StockMovementDto) {
    this.stockService.getMovement(m.id).subscribe({
      next: (full) => this.selectedMovement.set(full),
      error: () => this.selectedMovement.set(m)
    });
  }

  saveMovement() {
    if (!this.createForm.type || !this.createForm.movementDate) return;

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
    this.stockService.createMovement(payload).subscribe({
      next: () => { this.saving.set(false); this.showCreateModal.set(false); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  typeFr(type: string): string { return TYPE_FR[type] ?? type; }
  statusFr(status: string): string { return STATUS_FR[status] ?? status; }

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
