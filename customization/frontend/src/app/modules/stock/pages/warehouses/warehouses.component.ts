import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { WarehouseDto } from '../../models/stock.models';
import { ExportService } from '../../../../services/export.service';
import { PrintService } from '../../../../services/print.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Entrepôts
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Gérez les emplacements de stockage de votre inventaire</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="exportCsv()">
            <i class="pi pi-download"></i> Exporter CSV
          </button>
          <button class="btn btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> Ajouter un entrepôt
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="Rechercher par nom ou code…" (ngModelChange)="applyFilter()">
        </div>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterActive" (change)="load()"> Actifs uniquement
        </label>
      </div>

      <!-- Grille de cartes -->
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <i class="pi pi-building"></i>
          <h3>Aucun entrepôt trouvé</h3>
          <p>Ajoutez votre premier entrepôt pour commencer à suivre les emplacements de stock.</p>
        </div>
      } @else {
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
          @for (wh of filtered(); track wh.id) {
            <div class="card" style="cursor:default;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:42px;height:42px;background:rgba(14,165,233,0.12);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <svg style="width: 22px; height: 22px;" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 21h18" />
                      <path d="M3 7v14h18V7L12 3z" />
                      <path d="M12 21v-8" />
                      <path d="M8 21v-4h8v4" />
                    </svg>
                  </div>
                  <div>
                    <div style="font-size:15px;font-weight:700;color:var(--text-primary)">{{ wh.name }}</div>
                    <div style="font-size:11.5px;font-family:monospace;color:var(--accent);background:rgba(14,165,233,0.08);padding:1px 6px;border-radius:4px;display:inline-block;margin-top:2px;">
                      {{ wh.code }}
                    </div>
                  </div>
                </div>
                @if (wh.isActive) {
                  <span class="badge badge-success">Actif</span>
                } @else {
                  <span class="badge badge-muted">Inactif</span>
                }
              </div>

              @if (wh.description) {
                <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">{{ wh.description }}</p>
              }

              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
                <div style="display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--text-muted);">
                  <i class="pi pi-map-marker" style="width:14px;color:var(--accent)"></i>
                  {{ wh.street }}, {{ wh.city }}, {{ wh.wilaya }}
                </div>
                <div style="display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--text-muted);">
                  <i class="pi pi-user" style="width:14px;color:var(--accent)"></i>
                  {{ wh.responsiblePerson }}
                </div>
              </div>

              <div style="display:flex;gap:8px;">
                <button class="btn btn-primary btn-sm" style="flex:1.2" (click)="openStock(wh)">
                  <i class="pi pi-box"></i> Stock
                </button>
                <button class="btn btn-secondary btn-sm" style="flex:1" (click)="openEdit(wh)">
                  <i class="pi pi-pencil"></i> Modifier
                </button>
                @if (wh.isActive) {
                  <button class="btn btn-danger btn-sm" (click)="confirmToggleActive(wh)" title="Désactiver">
                    <i class="pi pi-ban"></i>
                  </button>
                } @else {
                  <button class="btn btn-success btn-sm" (click)="confirmToggleActive(wh)" title="Activer">
                    <i class="pi pi-check"></i>
                  </button>
                }
                <button class="btn btn-danger btn-sm" (click)="confirmDelete(wh)" title="Supprimer">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:580px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editItem() ? "Modifier l'entrepôt" : "Nouvel entrepôt" }}</h2>
              <button class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Nom *</label>
                  <input class="form-input" [(ngModel)]="form.name" placeholder="Nom de l'entrepôt">
                </div>
                <div class="form-group">
                  <label class="form-label">Code *</label>
                  <input class="form-input" [(ngModel)]="form.code" placeholder="ex. ENT-01" [disabled]="!!editItem()">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Responsable *</label>
                <input class="form-input" [(ngModel)]="form.responsiblePerson" placeholder="Nom du responsable">
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" [(ngModel)]="form.description" placeholder="Notes optionnelles"></textarea>
              </div>
              <p class="form-label" style="margin-bottom:12px;">Adresse</p>
              <div class="form-group">
                <label class="form-label">Rue</label>
                <input class="form-input" [(ngModel)]="form.street" placeholder="Adresse de la rue">
              </div>
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Ville</label>
                  <input class="form-input" [(ngModel)]="form.city" placeholder="Ville">
                </div>
                <div class="form-group">
                  <label class="form-label">Wilaya</label>
                  <input class="form-input" [(ngModel)]="form.wilaya" placeholder="Wilaya">
                </div>
                <div class="form-group">
                  <label class="form-label">Code postal</label>
                  <input class="form-input" [(ngModel)]="form.postalCode" placeholder="Code">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                {{ editItem() ? 'Mettre à jour' : 'Créer' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Confirmation Dialog -->
      @if (itemToDeactivate()) {
        <div class="modal-overlay">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">Désactiver l'entrepôt</h2>
            <p class="confirm-message">
              Êtes-vous sûr de vouloir désactiver l'entrepôt <strong>{{ itemToDeactivate()?.name }}</strong> ?<br>
              Il ne pourra plus être utilisé pour de nouvelles transactions de stock.
            </p>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;">
              <button class="btn btn-secondary" (click)="cancelDeactivate()">Annuler</button>
              <button class="btn btn-danger" (click)="executeDeactivate()" [disabled]="saving()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                Oui, désactiver
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="modal-overlay" style="z-index: 2000;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">Supprimer l'entrepôt</h2>
            <p class="confirm-message">
              {{ deleteModalMessage() }}<br>
              Cette action est irréversible.
            </p>
            <div class="modal-footer" style="justify-content:center;margin-top:24px;gap:12px;">
              <button class="btn btn-secondary" (click)="showDeleteModal.set(false)">Annuler</button>
              <button class="btn btn-danger" (click)="executeDelete()">Oui, supprimer</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Stock de l'entrepôt -->
      @if (showStockModal() && selectedWarehouse()) {
        <div class="modal-overlay" style="z-index: 1500;">
          <div class="modal-panel" style="max-width:800px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Stock de l'entrepôt: {{ selectedWarehouse()?.name }}</h2>
                <p style="font-size:12px;color:var(--text-muted);margin-top:2px;">Code: <code>{{ selectedWarehouse()?.code }}</code></p>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <button class="btn btn-secondary btn-sm" (click)="printStock()"><i class="pi pi-print"></i> Imprimer</button>
                <button class="btn btn-secondary btn-sm" (click)="exportStockCsv()"><i class="pi pi-download"></i> Exporter CSV</button>
                <button class="modal-close" (click)="showStockModal.set(false)"><i class="pi pi-times"></i></button>
              </div>
            </div>
            <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
              @if (loadingStock()) {
                <div style="text-align:center;padding:30px;"><div class="spinner"></div></div>
              } @else if (warehouseStock().length === 0) {
                <p style="color:var(--text-muted);font-size:13px;text-align:center;padding:40px;">Aucun stock actuellement dans cet entrepôt</p>
              } @else {
                <table class="data-table" style="font-size:13px;">
                  <thead>
                    <tr>
                      <th>Article / Désignation</th>
                      <th>Référence</th>
                      <th>N° Lot</th>
                      <th>Péremption</th>
                      <th style="text-align:right">Stock courant</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (lot of warehouseStock(); track lot.id) {
                      @if (lot.currentQuantity > 0) {
                        <tr>
                          <td style="font-weight:600;color:var(--accent);cursor:pointer;" (click)="goToItem(lot.stockItemId)" title="Voir la fiche article">{{ lot.stockItemName }}</td>
                          <td><span style="font-family:monospace;font-size:11px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;color:var(--accent);">{{ lot.stockItemReference }}</span></td>
                          <td><code style="font-family:monospace;font-size:11px;">{{ lot.lotNumber }}</code></td>
                          <td>{{ lot.expiryDate ? (lot.expiryDate | date:'dd/MM/yyyy') : '—' }}</td>
                          <td style="text-align:right;font-weight:700;">{{ lot.currentQuantity }} {{ unitFr(lot.currentUnit) }}</td>
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showStockModal.set(false)">Fermer</button>
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
                Gestion des Entrepôts
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Ce module permet d'administrer les différents dépôts et zones de stockage de l'entreprise.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🏢 <strong>Gestion des Dépôts</strong> : Enregistrez, modifiez et configurez les adresses et responsables de chaque entrepôt.</li>
                <li>📦 <strong>Consultation de Stock</strong> : Visualisez le stock complet et détaillé d'un dépôt par lot.</li>
                <li>🖨️ <strong>Rapport de Stock</strong> : Imprimez l'état physique ou téléchargez-le au format CSV.</li>
                <li>🗑️ <strong>Désactivation & Suppression</strong> : Désactivez des entrepôts temporairement ou archivez-les de manière sécurisée.</li>
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
  `,
  styles: [
    `
      .confirm-panel {
        max-width: 400px !important;
        text-align: center;
        padding: 32px 24px !important;
      }

      .confirm-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin: 0 auto 16px;
      }

      .confirm-message {
        color: var(--text-muted);
        font-size: 14.5px;
        line-height: 1.5;
        margin-top: 8px;
      }
    `
  ]
})
export class WarehousesComponent implements OnInit {
  private stockService = inject(StockService);
  private exportService = inject(ExportService);
  private printService = inject(PrintService);
  private router = inject(Router);

  showInfoModal = signal(false);
  customAlert = signal<{ title: string; message: string; severity?: 'error' | 'warning' | 'success'; list?: string[] } | null>(null);

  closeCustomAlert() {
    this.customAlert.set(null);
  }
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<WarehouseDto | null>(null);
  itemToDeactivate = signal<WarehouseDto | null>(null);
  items = signal<WarehouseDto[]>([]);
  filtered = signal<WarehouseDto[]>([]);

  // Deletion properties
  showDeleteModal = signal(false);
  deleteModalMessage = signal('');
  deleteAction = signal<(() => void) | null>(null);

  // Stock Modal properties
  showStockModal = signal(false);
  selectedWarehouse = signal<WarehouseDto | null>(null);
  warehouseStock = signal<any[]>([]);
  loadingStock = signal(false);

  search = '';
  filterActive = false;
  form: any = {};

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.stockService.getWarehouses(this.filterActive || undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered.set(
      this.items().filter(i => !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
    );
  }

  openCreate() {
    this.editItem.set(null);
    this.form = { name: '', code: '', responsiblePerson: '', description: '', street: '', city: '', wilaya: '', postalCode: '' };
    this.showModal.set(true);
  }

  openEdit(item: WarehouseDto) {
    this.editItem.set(item);
    this.form = { name: item.name, code: item.code, responsiblePerson: item.responsiblePerson, description: item.description ?? '', street: item.street, city: item.city, wilaya: item.wilaya, postalCode: item.postalCode };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  validateForm(): boolean {
    const missing: string[] = [];
    if (!this.form.name?.trim()) {
      missing.push("Nom");
    }
    if (!this.form.code?.trim()) {
      missing.push("Code");
    }
    if (!this.form.responsiblePerson?.trim()) {
      missing.push("Responsable");
    }

    if (missing.length > 0) {
      this.customAlert.set({
        title: "Formulaire incomplet",
        message: "Veuillez renseigner les informations obligatoires suivants :",
        severity: "warning",
        list: missing
      });
      return false;
    }
    return true;
  }

  save() {
    if (!this.validateForm()) return;
    this.saving.set(true);
    const req = this.editItem()
      ? this.stockService.updateWarehouse(this.editItem()!.id, { id: this.editItem()!.id, ...this.form })
      : this.stockService.createWarehouse(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: () => this.saving.set(false) });
  }

  confirmToggleActive(item: WarehouseDto) {
    if (item.isActive) {
      this.itemToDeactivate.set(item);
    } else {
      const req = this.stockService.activateWarehouse(item.id);
      req.subscribe({ next: () => this.load() });
    }
  }

  cancelDeactivate() {
    this.itemToDeactivate.set(null);
  }

  executeDeactivate() {
    const item = this.itemToDeactivate();
    if (!item) return;

    this.saving.set(true);
    this.stockService.deactivateWarehouse(item.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.itemToDeactivate.set(null);
        this.load();
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  unitFr(u: string): string {
    const map: Record<string, string> = {
      Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kg', Meter: 'Mètre',
      SquareMeter: 'm²', CubicMeter: 'm³', Box: 'Carton', Pallet: 'Palette',
      Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
    };
    return map[u] ?? u;
  }

  exportCsv() {
    const data = this.items().map(wh => ({
      'Nom': wh.name,
      'Code': wh.code,
      'Responsable': wh.responsiblePerson,
      'Description': wh.description || '—',
      'Adresse': wh.street || '—',
      'Ville': wh.city || '—',
      'Wilaya': wh.wilaya || '—',
      'Code postal': wh.postalCode || '—',
      'Statut': wh.isActive ? 'Actif' : 'Inactif'
    }));
    this.exportService.exportToCsv(data, 'entrepot_list');
  }

  confirmDelete(item: WarehouseDto) {
    this.deleteModalMessage.set(`Êtes-vous sûr de vouloir supprimer l'entrepôt "${item.name}" ?`);
    this.deleteAction.set(() => this.deleteWarehouse(item));
    this.showDeleteModal.set(true);
  }

  deleteWarehouse(item: WarehouseDto) {
    this.stockService.deleteWarehouse(item.id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.load();
      }
    });
  }

  executeDelete() {
    const action = this.deleteAction();
    if (action) action();
  }

  openStock(item: WarehouseDto) {
    this.selectedWarehouse.set(item);
    this.warehouseStock.set([]);
    this.showStockModal.set(true);
    this.loadWarehouseStock();
  }

  loadWarehouseStock() {
    const wh = this.selectedWarehouse();
    if (!wh) return;

    this.loadingStock.set(true);
    this.stockService.getWarehouseStock(wh.id).subscribe({
      next: (stock) => {
        this.warehouseStock.set(stock);
        this.loadingStock.set(false);
      },
      error: () => this.loadingStock.set(false)
    });
  }

  printStock() {
    const wh = this.selectedWarehouse();
    if (!wh) return;
    const headers = ['Désignation', 'Référence', 'N° Lot', 'Péremption', 'Stock courant'];
    const rows = this.warehouseStock()
      .filter(l => l.currentQuantity > 0)
      .map(l => [
        l.stockItemName,
        l.stockItemReference,
        l.lotNumber || '—',
        l.expiryDate ? new Date(l.expiryDate).toLocaleDateString('fr-FR') : '—',
        `${l.currentQuantity} ${this.unitFr(l.currentUnit)}`
      ]);
    this.printService.printReport(`Stock de l'entrepôt: ${wh.name}`, headers, rows);
  }

  exportStockCsv() {
    const wh = this.selectedWarehouse();
    if (!wh) return;
    const data = this.warehouseStock()
      .filter(l => l.currentQuantity > 0)
      .map(l => ({
        'Article': l.stockItemName,
        'Référence': l.stockItemReference,
        'N° Lot': l.lotNumber,
        'Péremption': l.expiryDate ? new Date(l.expiryDate).toLocaleDateString('fr-FR') : '',
        'Quantité': l.currentQuantity,
        'Unité': this.unitFr(l.currentUnit)
      }));
    this.exportService.exportToCsv(data, `stock_entrepot_${wh.code}`);
  }

  goToItem(itemId: string) {
    this.showStockModal.set(false);
    this.router.navigate(['/stock-items'], { queryParams: { selectId: itemId } });
  }
}
