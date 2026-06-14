import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { StockService } from '../../../../services/stock.service';
import { StockItemDto, SupplierDto, BrandDto, BrandModelDto, CategoryDto } from '../../models/stock.models';

const UNITS = ['Piece','Liter','Kilogram','Meter','SquareMeter','CubicMeter','Box','Pallet','Roll','Bag','Can','Set'];
const UNIT_FR: Record<string, string> = {
  Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kilogramme', Meter: 'Mètre',
  SquareMeter: 'Mètre carré', CubicMeter: 'Mètre cube', Box: 'Carton',
  Pallet: 'Palette', Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
};

@Component({
  selector: 'app-stock-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Articles en stock</h1>
          <p class="page-subtitle">Gérez votre catalogue de matériaux d'infrastructure</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Ajouter un article
        </button>
      </div>

      <!-- Filtres -->
      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="Rechercher par nom ou référence…" (ngModelChange)="onSearchChange()">
        </div>
        <select class="form-select" style="width:180px" [(ngModel)]="filterCategoryId" (change)="onFilterChange()">
          <option value="">Toutes les catégories</option>
          @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterLowStock" (change)="onFilterChange()"> Stock faible uniquement
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterActive" (change)="onFilterChange()"> Actifs uniquement
        </label>
      </div>

      <!-- Tableau -->
      <div class="card" style="padding:0; overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-box"></i>
            <h3>Aucun article trouvé</h3>
            <p>Ajustez vos filtres ou ajoutez un nouvel article en stock.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Unité</th>
                <th>Qté totale</th>
                <th>Statut</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item.id) {
                <tr>
                  <td>
                    <span style="font-family:monospace;font-size:12px;background:rgba(14,165,233,0.08);padding:2px 7px;border-radius:4px;color:var(--accent)">
                      {{ item.reference }}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:600;">{{ item.name }}</div>
                    @if (item.brandName) {
                      <div style="font-size:11px;color:var(--text-muted)">{{ item.brandName }} {{ item.brandModelName }}</div>
                    }
                  </td>
                  <td><span class="badge badge-muted">{{ item.categoryName }}</span></td>
                  <td style="color:var(--text-muted)">{{ unitFr(item.defaultUnit) }}</td>
                  <td>
                    <span [style.color]="item.isLowStock ? 'var(--danger)' : 'var(--success)'" style="font-weight:700;">
                      {{ item.totalQuantity | number:'1.0-2' }}
                    </span>
                    @if (item.isLowStock) {
                      <span class="badge badge-danger" style="margin-left:6px;font-size:10px;">Faible</span>
                    }
                    @if (item.expiringLotCount > 0) {
                      <span class="badge badge-warning" style="margin-left:4px;font-size:10px;">{{ item.expiringLotCount }} exp.</span>
                    }
                  </td>
                  <td>
                    @if (item.isActive) {
                      <span class="badge badge-success">Actif</span>
                    } @else {
                      <span class="badge badge-muted">Inactif</span>
                    }
                  </td>
                  <td style="text-align:right">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      <button class="btn btn-secondary btn-sm" (click)="openEdit(item)" title="Modifier">
                        <i class="pi pi-pencil"></i>
                      </button>
                      @if (item.isActive) {
                        <button class="btn btn-danger btn-sm" (click)="confirmToggleActive(item)" title="Désactiver">
                          <i class="pi pi-ban"></i>
                        </button>
                      } @else {
                        <button class="btn btn-success btn-sm" (click)="confirmToggleActive(item)" title="Activer">
                          <i class="pi pi-check"></i>
                        </button>
                      }
                    </div>
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

      <!-- Modal Création / Modification -->
      @if (showModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:640px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editItem() ? "Modifier l'article" : "Nouvel article en stock" }}</h2>
              <button class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Référence *</label>
                  <input class="form-input" [(ngModel)]="form.reference" placeholder="ex. PEINTURE-BLANC-5L" [disabled]="!!editItem()">
                </div>
                <div class="form-group">
                  <label class="form-label">Désignation *</label>
                  <input class="form-input" [(ngModel)]="form.name" placeholder="Nom de l'article">
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Catégorie *</label>
                  <div class="input-group-append">
                    <select class="form-select" [(ngModel)]="form.categoryId">
                      @for (c of categories(); track c.id) { 
                        <option [value]="c.id" [disabled]="!c.isActive && form.categoryId !== c.id">
                          {{ c.name }}{{ !c.isActive ? ' (Inactif)' : '' }}
                        </option> 
                      }
                    </select>
                    <button class="btn-icon" (click)="openQuickAdd('category')" title="Ajouter une catégorie">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Unité par défaut *</label>
                  <select class="form-select" [(ngModel)]="form.defaultUnit">
                    @for (u of units; track u) { <option [value]="u">{{ unitFr(u) }}</option> }
                  </select>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Marque</label>
                  <div class="input-group-append">
                    <select class="form-select" [(ngModel)]="form.brandId" (change)="onBrandChange()">
                      <option value="">Aucune marque</option>
                      @for (b of brands(); track b.id) {
                        <option [value]="b.id" [disabled]="!b.isActive && form.brandId !== b.id">
                          {{ b.name }}{{ !b.isActive ? ' (Inactif)' : '' }}
                        </option>
                      }
                    </select>
                    <button class="btn-icon" (click)="openQuickAdd('brand')" title="Ajouter une marque">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Modèle</label>
                  <div class="input-group-append">
                    <select class="form-select" [(ngModel)]="form.brandModelId" [disabled]="!form.brandId">
                      <option value="">Aucun modèle</option>
                      @for (m of models(); track m.id) {
                        <option [value]="m.id">{{ m.name }}</option>
                      }
                    </select>
                    <button class="btn-icon" (click)="openQuickAdd('model')" [disabled]="!form.brandId" title="Ajouter un modèle">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Seuil de stock faible</label>
                  <input class="form-input" type="number" [(ngModel)]="form.defaultLowStockThreshold" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Fournisseur par défaut</label>
                  <select class="form-select" [(ngModel)]="form.defaultSupplierId">
                    <option value="">Aucun fournisseur</option>
                    @for (s of suppliers(); track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" [(ngModel)]="form.description" placeholder="Description optionnelle"></textarea>
              </div>
              <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-primary);">
                  <input type="checkbox" [(ngModel)]="form.requiresSerialNumber"> Numéro de série requis
                </label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-primary);">
                  <input type="checkbox" [(ngModel)]="form.hasExpiryDate"> A une date d'expiration
                </label>
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

      <!-- Quick Add Modals -->
      @if (quickAddType()) {
        <div class="modal-overlay" style="z-index: 2000;">
          <div class="modal-panel" style="max-width: 400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Ajouter {{ quickAddLabel() }}</h3>
              <button class="modal-close" (click)="closeQuickAdd()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-input" [(ngModel)]="quickAddForm.name" [placeholder]="'Nom de ' + quickAddLabel()">
              </div>
              @if (quickAddType() === 'category') {
                <div class="form-group" style="margin-top: 1rem;">
                  <label class="form-label">Code (optionnel)</label>
                  <input class="form-input" [(ngModel)]="quickAddForm.code" placeholder="ex. PAINT">
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="closeQuickAdd()">Annuler</button>
              <button class="btn btn-primary btn-sm" (click)="saveQuickAdd()" [disabled]="!quickAddForm.name || savingQuickAdd()">
                @if (savingQuickAdd()) { <div class="spinner" style="width:12px;height:12px;border-width:2px;"></div> }
                Ajouter
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Confirmation Dialog -->
      @if (itemToDeactivate()) {
        <div class="modal-overlay" style="z-index: 2000;">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">Désactiver l'article</h2>
            <p class="confirm-message">
              Êtes-vous sûr de vouloir désactiver l'article <strong>{{ itemToDeactivate()?.name }}</strong> ?<br>
              Il ne sera plus disponible pour les nouvelles entrées ou sorties.
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
export class StockItemsComponent implements OnInit {
  private stockService = inject(StockService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<StockItemDto | null>(null);
  itemToDeactivate = signal<StockItemDto | null>(null);

  items = signal<StockItemDto[]>([]);
  suppliers = signal<SupplierDto[]>([]);
  brands = signal<BrandDto[]>([]);
  models = signal<BrandModelDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  filtered = signal<StockItemDto[]>([]);

  search = '';
  filterCategoryId = '';
  filterLowStock = false;
  filterActive = true;

  pageNumber = signal(1);
  pageSize = signal(25);
  hasMore = signal(true);

  units = UNITS;
  form: any = {};

  // Quick Add
  quickAddType = signal<'category' | 'brand' | 'model' | null>(null);
  quickAddForm: any = { name: '', code: '' };
  savingQuickAdd = signal(false);

  ngOnInit() { 
    this.load(); 
    this.loadReferenceData();
  }

  loadReferenceData() {
    this.stockService.getCategories(false).subscribe(c => this.categories.set(c));
    this.stockService.getBrands(false).subscribe(b => this.brands.set(b));
    this.stockService.getSuppliers(false).subscribe(s => this.suppliers.set(s));
  }

  onBrandChange() {
    this.form.brandModelId = '';
    if (this.form.brandId) {
      this.stockService.getModels(this.form.brandId).subscribe(m => this.models.set(m));
    } else {
      this.models.set([]);
    }
  }

  load() {
    this.loading.set(true);
    this.stockService.getStockItems({
      categoryId: this.filterCategoryId || undefined,
      activeOnly: this.filterActive || undefined,
      lowStockOnly: this.filterLowStock || undefined,
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
    this.editItem.set(null);
    const firstCat = this.categories().length > 0 ? this.categories()[0].id : '';
    this.form = {
      reference: '', name: '', categoryId: firstCat, defaultUnit: 'Piece',
      brandId: '', brandModelId: '', description: '', defaultLowStockThreshold: 5,
      requiresSerialNumber: false, hasExpiryDate: false, defaultSupplierId: ''
    };
    this.models.set([]);
    this.showModal.set(true);
  }

  openEdit(item: StockItemDto) {
    this.editItem.set(item);
    this.form = {
      reference: item.reference, name: item.name, categoryId: item.categoryId,
      defaultUnit: item.defaultUnit, brandId: item.brandId ?? '', brandModelId: item.brandModelId ?? '',
      description: item.description ?? '', defaultLowStockThreshold: item.defaultLowStockThreshold,
      requiresSerialNumber: item.requiresSerialNumber, hasExpiryDate: item.hasExpiryDate,
      defaultSupplierId: item.defaultSupplierId ?? ''
    };
    if (this.form.brandId) {
      this.stockService.getModels(this.form.brandId).subscribe(m => this.models.set(m));
    } else {
      this.models.set([]);
    }
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  // Quick Add Logic
  openQuickAdd(type: 'category' | 'brand' | 'model') {
    this.quickAddType.set(type);
    this.quickAddForm = { name: '', code: '' };
  }

  closeQuickAdd() { this.quickAddType.set(null); }

  quickAddLabel(): string {
    switch (this.quickAddType()) {
      case 'category': return 'une catégorie';
      case 'brand': return 'une marque';
      case 'model': return 'un modèle';
      default: return '';
    }
  }

  saveQuickAdd() {
    if (!this.quickAddForm.name) return;
    this.savingQuickAdd.set(true);
    
    let obs: Observable<any>;
    const type = this.quickAddType();

    if (type === 'category') obs = this.stockService.createCategory(this.quickAddForm.name, this.quickAddForm.code);
    else if (type === 'brand') obs = this.stockService.createBrand(this.quickAddForm.name);
    else if (type === 'model') obs = this.stockService.createModel(this.form.brandId, this.quickAddForm.name);
    else return;

    obs.subscribe({
      next: (res: any) => {
        this.savingQuickAdd.set(false);
        if (type === 'category') {
          this.loadReferenceData();
          this.form.categoryId = res.id;
        } else if (type === 'brand') {
          this.loadReferenceData();
          this.form.brandId = res.id;
          this.onBrandChange();
        } else if (type === 'model') {
          this.onBrandChange();
          this.form.brandModelId = res.id;
        }
        this.closeQuickAdd();
      },
      error: () => this.savingQuickAdd.set(false)
    });
  }

  save() {
    this.saving.set(true);
    const payload = { 
      ...this.form, 
      defaultSupplierId: this.form.defaultSupplierId || null,
      brandId: this.form.brandId || null,
      brandModelId: this.form.brandModelId || null
    };
    const req = this.editItem()
      ? this.stockService.updateStockItem(this.editItem()!.id, { id: this.editItem()!.id, ...payload })
      : this.stockService.createStockItem(payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  confirmToggleActive(item: StockItemDto) {
    if (item.isActive) {
      this.itemToDeactivate.set(item);
    } else {
      const req = this.stockService.activateStockItem(item.id);
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
    this.stockService.deactivateStockItem(item.id).subscribe({
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

  unitFr(u: string): string { return UNIT_FR[u] ?? u; }
}
