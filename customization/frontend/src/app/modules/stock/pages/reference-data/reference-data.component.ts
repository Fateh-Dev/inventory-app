import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { BrandDto, BrandModelDto, CategoryDto, DepartmentDto } from '../../models/stock.models';

@Component({
  selector: 'app-reference-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Tables de référence
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Gérez les catégories, marques, modèles et départements</p>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'categories'" (click)="activeTab.set('categories')">Catégories</button>
        <button class="tab-btn" [class.active]="activeTab() === 'brands'" (click)="activeTab.set('brands')">Marques & Modèles</button>
        <button class="tab-btn" [class.active]="activeTab() === 'departments'" (click)="activeTab.set('departments')">Départements</button>
        <button class="tab-btn" [class.active]="activeTab() === 'alerts-config'" (click)="activeTab.set('alerts-config')">Seuils d'alertes</button>
      </div>

      @if (activeTab() === 'categories') {
        <div class="card" style="padding:0; overflow:hidden;">
          <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
             <h3 style="margin:0">Liste des catégories</h3>
             <button class="btn btn-primary btn-sm" (click)="openAddCategory()">
               <i class="pi pi-plus"></i> Ajouter
             </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of categories(); track c.id) {
                <tr>
                  <td><span style="font-weight:600">{{ c.name }}</span></td>
                  <td><code style="font-size:12px;color:var(--accent)">{{ c.code || '-' }}</code></td>
                  <td style="text-align:right">
                    <button class="btn btn-secondary btn-sm" style="margin-right:4px;" (click)="openEditCategory(c)">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" (click)="requestDeleteCategory(c)">
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (activeTab() === 'brands') {
        <div class="form-grid">
          <!-- Brands -->
          <div class="card" style="padding:0; overflow:hidden;">
            <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
               <h3 style="margin:0">Marques</h3>
               <button class="btn btn-primary btn-sm" (click)="openAddBrand()">
                 <i class="pi pi-plus"></i>
               </button>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
              <table class="data-table">
                <tbody>
                  @for (b of brands(); track b.id) {
                    <tr [class.active-row]="selectedBrand()?.id === b.id" (click)="selectBrand(b)" style="cursor:pointer">
                      <td><span style="font-weight:600">{{ b.name }}</span></td>
                      <td style="text-align:right">
                        <button class="btn btn-secondary btn-xs" style="margin-right:4px;" (click)="openEditBrand(b); $event.stopPropagation()">
                          <i class="pi pi-pencil" style="font-size:10px"></i>
                        </button>
                        <button class="btn btn-danger btn-xs" (click)="requestDeleteBrand(b); $event.stopPropagation()">
                          <i class="pi pi-trash" style="font-size:10px"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Models -->
          <div class="card" style="padding:0; overflow:hidden;">
            <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
               <h3 style="margin:0">Modèles {{ selectedBrand() ? 'de ' + selectedBrand()?.name : '' }}</h3>
               <button class="btn btn-primary btn-sm" (click)="openAddModel()" [disabled]="!selectedBrand()">
                 <i class="pi pi-plus"></i>
               </button>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
              @if (!selectedBrand()) {
                <div class="empty-state" style="padding:40px 20px;">
                  <i class="pi pi-arrow-left" style="font-size:24px"></i>
                  <p>Sélectionnez une marque pour voir ses modèles</p>
                </div>
              } @else {
                <table class="data-table">
                  <tbody>
                    @for (m of models(); track m.id) {
                      <tr>
                        <td><span style="font-weight:600">{{ m.name }}</span></td>
                        <td style="text-align:right">
                          <button class="btn btn-secondary btn-xs" style="margin-right:4px;" (click)="openEditModel(m)">
                            <i class="pi pi-pencil" style="font-size:10px"></i>
                          </button>
                          <button class="btn btn-danger btn-xs" (click)="requestDeleteModel(m)">
                            <i class="pi pi-trash" style="font-size:10px"></i>
                          </button>
                        </td>
                      </tr>
                    }
                    @if (models().length === 0) {
                      <tr><td colspan="2" style="text-align:center;color:var(--text-muted);padding:20px;">Aucun modèle enregistré</td></tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        </div>
      }

      @if (activeTab() === 'departments') {
        <div class="card" style="padding:0; overflow:hidden;">
          <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
             <h3 style="margin:0">Départements / Services</h3>
             <button class="btn btn-primary btn-sm" (click)="openAddDepartment()">
               <i class="pi pi-plus"></i> Ajouter
             </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (d of departments(); track d.id) {
                <tr>
                  <td><span style="font-weight:600">{{ d.name }}</span></td>
                  <td><code style="font-size:12px;color:var(--accent)">{{ d.code || '-' }}</code></td>
                  <td style="text-align:right">
                    <button class="btn btn-secondary btn-sm" style="margin-right:4px;" (click)="openEditDepartment(d)">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" (click)="requestDeleteDepartment(d)">
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (activeTab() === 'alerts-config') {
        <div class="card" style="padding:24px; max-width:600px; margin:0 auto;">
          <h3 style="margin-top:0; margin-bottom:16px; font-size:16px; border-bottom:1px solid var(--border); padding-bottom:8px; color:var(--accent); display:flex; align-items:center; gap:8px;">
            <i class="pi pi-bell"></i> Configuration des Alertes de Stock
          </h3>
          <div class="form-group" style="margin-bottom:20px;">
            <label class="form-label" style="font-weight:600;">Seuil de pré-alerte péremption (Jours) *</label>
            <p style="font-size:12.5px;color:var(--text-muted);margin-top:2px;margin-bottom:8px;">
              Nombre de jours restants avant la date d'expiration d'un lot pour déclencher une alerte de type "Expire bientôt".
            </p>
            <input type="number" class="form-input" style="width:120px;font-weight:700;" [(ngModel)]="alertSettings.expiryWarningDays" min="1">
          </div>
          
          <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:16px; margin-top:24px;">
            <button class="btn btn-primary" (click)="saveAlertSettings()" [disabled]="savingAlerts()">
              @if (savingAlerts()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;"></div> }
              Enregistrer les paramètres
            </button>
          </div>
        </div>
      }

      <!-- Category Modal -->
      @if (showCategoryModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editCategory() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
              <button class="modal-close" (click)="showCategoryModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-input" [(ngModel)]="categoryForm.name">
              </div>
              <div class="form-group">
                <label class="form-label">Code</label>
                <input class="form-input" [(ngModel)]="categoryForm.code">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showCategoryModal.set(false)">Annuler</button>
              <button class="btn btn-primary btn-sm" (click)="saveCategory()">Enregistrer</button>
            </div>
          </div>
        </div>
      }

      <!-- Brand Modal -->
      @if (showBrandModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editBrand() ? 'Modifier la marque' : 'Nouvelle marque' }}</h2>
              <button class="modal-close" (click)="showBrandModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-input" [(ngModel)]="brandForm.name">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showBrandModal.set(false)">Annuler</button>
              <button class="btn btn-primary btn-sm" (click)="saveBrand()">Enregistrer</button>
            </div>
          </div>
        </div>
      }

      <!-- Model Modal -->
      @if (showModelModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editModel() ? 'Modifier le modèle' : 'Nouveau modèle' }}</h2>
              <button class="modal-close" (click)="showModelModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-input" [(ngModel)]="modelForm.name">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showModelModal.set(false)">Annuler</button>
              <button class="btn btn-primary btn-sm" (click)="saveModel()">Enregistrer</button>
            </div>
          </div>
        </div>
      }

      <!-- Department Modal -->
      @if (showDepartmentModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editDepartment() ? 'Modifier le département' : 'Nouveau département' }}</h2>
              <button class="modal-close" (click)="showDepartmentModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input class="form-input" [(ngModel)]="departmentForm.name">
              </div>
              <div class="form-group">
                <label class="form-label">Code *</label>
                <input class="form-input" [(ngModel)]="departmentForm.code">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showDepartmentModal.set(false)">Annuler</button>
              <button class="btn btn-primary btn-sm" (click)="saveDepartment()">Enregistrer</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:400px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">Confirmation</h2>
              <button class="modal-close" (click)="showDeleteModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <p style="margin-top: 0; margin-bottom: 12px;">{{ deleteModalMessage() }}</p>
              <p style="margin: 0; color: var(--text-muted); font-size: 13px;">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" (click)="showDeleteModal.set(false)">Annuler</button>
              <button class="btn btn-danger btn-sm" (click)="executeDelete()">Supprimer</button>
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
                Tables de Référence
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Cette page regroupe les nomenclatures et les configurations globales de l'application.
              </p>
              <p style="margin-bottom:8px;"><strong>Onglets de configuration :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>📂 <strong>Catégories</strong> : Catégorisez vos articles pour structurer les rapports.</li>
                <li>🏷️ <strong>Marques & Modèles</strong> : Gérez les marques de fabricants et les modèles associés.</li>
                <li>🏢 <strong>Départements</strong> : Déclarez les services bénéficiaires des distributions internes.</li>
                <li>⚙️ <strong>Seuils d'alertes</strong> : Ajustez le délai de pré-alerte pour la péremption des lots (en jours).</li>
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
  styles: [`
    .active-row { background: var(--accent-glow) !important; }
    .btn-xs { padding: 3px 6px; font-size: 10px; }
  `]
})
export class ReferenceDataComponent implements OnInit {
  private stockService = inject(StockService);

  showInfoModal = signal(false);
  customAlert = signal<{ title: string; message: string; severity?: 'error' | 'warning' | 'success'; list?: string[] } | null>(null);

  closeCustomAlert() {
    this.customAlert.set(null);
  }

  activeTab = signal<'categories' | 'brands' | 'departments' | 'alerts-config'>('categories');
  categories = signal<CategoryDto[]>([]);
  brands = signal<BrandDto[]>([]);
  models = signal<BrandModelDto[]>([]);
  departments = signal<DepartmentDto[]>([]);
  selectedBrand = signal<BrandDto | null>(null);

  // Modals state
  showCategoryModal = signal(false);
  editCategory = signal<CategoryDto | null>(null);
  categoryForm = { name: '', code: '' };

  showBrandModal = signal(false);
  editBrand = signal<BrandDto | null>(null);
  brandForm = { name: '' };

  showModelModal = signal(false);
  editModel = signal<BrandModelDto | null>(null);
  modelForm = { name: '' };

  showDepartmentModal = signal(false);
  editDepartment = signal<DepartmentDto | null>(null);
  departmentForm = { name: '', code: '' };

  // Delete Modal State
  showDeleteModal = signal(false);
  deleteModalMessage = signal('');
  deleteAction = signal<(() => void) | null>(null);

  // Alert Config State
  alertSettings = { expiryWarningDays: 30 };
  savingAlerts = signal(false);

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.loadDepartments();
    this.loadAlertSettings();
  }

  loadCategories() { this.stockService.getCategories(false).subscribe(c => this.categories.set(c)); }
  loadBrands() { this.stockService.getBrands(false).subscribe(b => this.brands.set(b)); }
  loadModels(brandId: string) { this.stockService.getModels(brandId).subscribe(m => this.models.set(m)); }
  loadDepartments() { this.stockService.getDepartments(false).subscribe(d => this.departments.set(d)); }

  selectBrand(brand: BrandDto) {
    this.selectedBrand.set(brand);
    this.models.set([]); // Bug #10 fix
    this.loadModels(brand.id);
  }

  // Category Actions
  openAddCategory() { this.editCategory.set(null); this.categoryForm = { name: '', code: '' }; this.showCategoryModal.set(true); }
  openEditCategory(c: CategoryDto) { this.editCategory.set(c); this.categoryForm = { name: c.name, code: c.code || '' }; this.showCategoryModal.set(true); }
  saveCategory() {
    if (!this.categoryForm.name?.trim()) {
      this.customAlert.set({
        title: "Validation de formulaire",
        message: "Veuillez remplir les champs requis :",
        severity: "warning",
        list: ["Nom de la catégorie"]
      });
      return;
    }
    const obs = this.editCategory() 
      ? this.stockService.updateCategory(this.editCategory()!.id, this.categoryForm.name, this.categoryForm.code)
      : this.stockService.createCategory(this.categoryForm.name, this.categoryForm.code);
    obs.subscribe(() => { this.loadCategories(); this.showCategoryModal.set(false); });
  }

  requestDeleteCategory(c: CategoryDto) {
    this.deleteModalMessage.set(`Êtes-vous sûr de vouloir supprimer la catégorie "${c.name}" ?`);
    this.deleteAction.set(() => this.deleteCategory(c));
    this.showDeleteModal.set(true);
  }

  deleteCategory(c: CategoryDto) {
    this.stockService.deleteCategory(c.id).subscribe({
      next: () => { this.loadCategories(); this.showDeleteModal.set(false); },
      error: (err) => {
        this.showDeleteModal.set(false);
        this.customAlert.set({
          title: "Erreur de suppression",
          message: err.error?.detail || err.error?.title || 'Impossible de supprimer cet élément (il est probablement utilisé).',
          severity: "error"
        });
      }
    });
  }

  // Brand Actions
  openAddBrand() { this.editBrand.set(null); this.brandForm = { name: '' }; this.showBrandModal.set(true); }
  openEditBrand(b: BrandDto) { this.editBrand.set(b); this.brandForm = { name: b.name }; this.showBrandModal.set(true); }
  saveBrand() {
    if (!this.brandForm.name?.trim()) {
      this.customAlert.set({
        title: "Validation de formulaire",
        message: "Veuillez remplir les champs requis :",
        severity: "warning",
        list: ["Nom de la marque"]
      });
      return;
    }
    const obs = this.editBrand()
      ? this.stockService.updateBrand(this.editBrand()!.id, this.brandForm.name)
      : this.stockService.createBrand(this.brandForm.name);
    obs.subscribe(() => { this.loadBrands(); this.showBrandModal.set(false); });
  }

  requestDeleteBrand(b: BrandDto) {
    this.deleteModalMessage.set(`Êtes-vous sûr de vouloir supprimer la marque "${b.name}" ?`);
    this.deleteAction.set(() => this.deleteBrand(b));
    this.showDeleteModal.set(true);
  }

  deleteBrand(b: BrandDto) {
    this.stockService.deleteBrand(b.id).subscribe({
      next: () => {
        if (this.selectedBrand()?.id === b.id) this.selectedBrand.set(null);
        this.loadBrands();
        this.showDeleteModal.set(false);
      },
      error: (err) => {
        this.showDeleteModal.set(false);
        this.customAlert.set({
          title: "Erreur de suppression",
          message: err.error?.detail || err.error?.title || 'Impossible de supprimer cet élément (il est probablement utilisé).',
          severity: "error"
        });
      }
    });
  }

  // Model Actions
  openAddModel() { if (!this.selectedBrand()) return; this.editModel.set(null); this.modelForm = { name: '' }; this.showModelModal.set(true); }
  openEditModel(m: BrandModelDto) { this.editModel.set(m); this.modelForm = { name: m.name }; this.showModelModal.set(true); }
  saveModel() {
    if (!this.selectedBrand()) return;
    if (!this.modelForm.name?.trim()) {
      this.customAlert.set({
        title: "Validation de formulaire",
        message: "Veuillez remplir les champs requis :",
        severity: "warning",
        list: ["Nom du modèle"]
      });
      return;
    }
    const obs = this.editModel()
      ? this.stockService.updateModel(this.editModel()!.id, this.modelForm.name)
      : this.stockService.createModel(this.selectedBrand()!.id, this.modelForm.name);
    obs.subscribe(() => { this.loadModels(this.selectedBrand()!.id); this.showModelModal.set(false); });
  }

  requestDeleteModel(m: BrandModelDto) {
    this.deleteModalMessage.set(`Êtes-vous sûr de vouloir supprimer le modèle "${m.name}" ?`);
    this.deleteAction.set(() => this.deleteModel(m));
    this.showDeleteModal.set(true);
  }

  deleteModel(m: BrandModelDto) {
    this.stockService.deleteModel(m.id).subscribe({
      next: () => { this.loadModels(this.selectedBrand()!.id); this.showDeleteModal.set(false); },
      error: (err) => {
        this.showDeleteModal.set(false);
        this.customAlert.set({
          title: "Erreur de suppression",
          message: err.error?.detail || err.error?.title || 'Impossible de supprimer cet élément (il est probablement utilisé).',
          severity: "error"
        });
      }
    });
  }

  // Department Actions
  openAddDepartment() { this.editDepartment.set(null); this.departmentForm = { name: '', code: '' }; this.showDepartmentModal.set(true); }
  openEditDepartment(d: DepartmentDto) { this.editDepartment.set(d); this.departmentForm = { name: d.name, code: d.code || '' }; this.showDepartmentModal.set(true); }
  saveDepartment() {
    const missing: string[] = [];
    if (!this.departmentForm.name?.trim()) {
      missing.push("Nom du département");
    }
    if (!this.departmentForm.code?.trim()) {
      missing.push("Code du département");
    }
    if (missing.length > 0) {
      this.customAlert.set({
        title: "Validation de formulaire",
        message: "Veuillez remplir les champs requis suivants :",
        severity: "warning",
        list: missing
      });
      return;
    }
    const obs = this.editDepartment()
      ? this.stockService.updateDepartment(this.editDepartment()!.id, this.departmentForm.name, this.departmentForm.code)
      : this.stockService.createDepartment(this.departmentForm.name, this.departmentForm.code);
    obs.subscribe(() => { this.loadDepartments(); this.showDepartmentModal.set(false); });
  }

  requestDeleteDepartment(d: DepartmentDto) {
    this.deleteModalMessage.set(`Êtes-vous sûr de vouloir supprimer le département "${d.name}" ?`);
    this.deleteAction.set(() => this.deleteDepartment(d));
    this.showDeleteModal.set(true);
  }

  deleteDepartment(d: DepartmentDto) {
    this.stockService.deleteDepartment(d.id).subscribe({
      next: () => { this.loadDepartments(); this.showDeleteModal.set(false); },
      error: (err) => {
        this.showDeleteModal.set(false);
        this.customAlert.set({
          title: "Erreur de suppression",
          message: err.error?.detail || err.error?.title || 'Impossible de supprimer cet élément (il est probablement utilisé).',
          severity: "error"
        });
      }
    });
  }

  executeDelete() {
    const action = this.deleteAction();
    if (action) action();
  }

  loadAlertSettings() {
    this.stockService.getAlertSettings().subscribe(settings => {
      if (settings) this.alertSettings = settings;
    });
  }

  saveAlertSettings() {
    this.savingAlerts.set(true);
    this.stockService.updateAlertSettings(this.alertSettings).subscribe({
      next: (res) => {
        this.alertSettings = res;
        this.savingAlerts.set(false);
        this.customAlert.set({
          title: "Paramètres enregistrés",
          message: "Paramètres d'alerte enregistrés avec succès !",
          severity: "success"
        });
      },
      error: () => this.savingAlerts.set(false)
    });
  }
}
