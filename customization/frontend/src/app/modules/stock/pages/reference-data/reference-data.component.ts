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
          <h1 class="page-title">Tables de référence</h1>
          <p class="page-subtitle">Gérez les catégories, marques, modèles et départements</p>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'categories'" (click)="activeTab.set('categories')">Catégories</button>
        <button class="tab-btn" [class.active]="activeTab() === 'brands'" (click)="activeTab.set('brands')">Marques & Modèles</button>
        <button class="tab-btn" [class.active]="activeTab() === 'departments'" (click)="activeTab.set('departments')">Départements</button>
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
                    <button class="btn btn-secondary btn-sm" (click)="openEditCategory(c)">
                      <i class="pi pi-pencil"></i>
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
                        <button class="btn btn-secondary btn-xs" (click)="openEditBrand(b); $event.stopPropagation()">
                          <i class="pi pi-pencil" style="font-size:10px"></i>
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
                          <button class="btn btn-secondary btn-xs" (click)="openEditModel(m)">
                            <i class="pi pi-pencil" style="font-size:10px"></i>
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
                    <button class="btn btn-secondary btn-sm" (click)="openEditDepartment(d)">
                      <i class="pi pi-pencil"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
              <button class="btn btn-primary btn-sm" (click)="saveCategory()" [disabled]="!categoryForm.name">Enregistrer</button>
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
              <button class="btn btn-primary btn-sm" (click)="saveBrand()" [disabled]="!brandForm.name">Enregistrer</button>
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
              <button class="btn btn-primary btn-sm" (click)="saveModel()" [disabled]="!modelForm.name">Enregistrer</button>
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
              <button class="btn btn-primary btn-sm" (click)="saveDepartment()" [disabled]="!departmentForm.name || !departmentForm.code">Enregistrer</button>
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

  activeTab = signal<'categories' | 'brands' | 'departments'>('categories');
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

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.loadDepartments();
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
    const obs = this.editCategory() 
      ? this.stockService.updateCategory(this.editCategory()!.id, this.categoryForm.name, this.categoryForm.code)
      : this.stockService.createCategory(this.categoryForm.name, this.categoryForm.code);
    obs.subscribe(() => { this.loadCategories(); this.showCategoryModal.set(false); });
  }

  // Brand Actions
  openAddBrand() { this.editBrand.set(null); this.brandForm = { name: '' }; this.showBrandModal.set(true); }
  openEditBrand(b: BrandDto) { this.editBrand.set(b); this.brandForm = { name: b.name }; this.showBrandModal.set(true); }
  saveBrand() {
    const obs = this.editBrand()
      ? this.stockService.updateBrand(this.editBrand()!.id, this.brandForm.name)
      : this.stockService.createBrand(this.brandForm.name);
    obs.subscribe(() => { this.loadBrands(); this.showBrandModal.set(false); });
  }

  // Model Actions
  openAddModel() { if (!this.selectedBrand()) return; this.editModel.set(null); this.modelForm = { name: '' }; this.showModelModal.set(true); }
  openEditModel(m: BrandModelDto) { this.editModel.set(m); this.modelForm = { name: m.name }; this.showModelModal.set(true); }
  saveModel() {
    if (!this.selectedBrand()) return;
    const obs = this.editModel()
      ? this.stockService.updateModel(this.editModel()!.id, this.modelForm.name)
      : this.stockService.createModel(this.selectedBrand()!.id, this.modelForm.name);
    obs.subscribe(() => { this.loadModels(this.selectedBrand()!.id); this.showModelModal.set(false); });
  }

  // Department Actions
  openAddDepartment() { this.editDepartment.set(null); this.departmentForm = { name: '', code: '' }; this.showDepartmentModal.set(true); }
  openEditDepartment(d: DepartmentDto) { this.editDepartment.set(d); this.departmentForm = { name: d.name, code: d.code || '' }; this.showDepartmentModal.set(true); }
  saveDepartment() {
    const obs = this.editDepartment()
      ? this.stockService.updateDepartment(this.editDepartment()!.id, this.departmentForm.name, this.departmentForm.code)
      : this.stockService.createDepartment(this.departmentForm.name, this.departmentForm.code);
    obs.subscribe(() => { this.loadDepartments(); this.showDepartmentModal.set(false); });
  }
}
