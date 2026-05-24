import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { WarehouseDto } from '../../models/stock.models';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Entrepôts</h1>
          <p class="page-subtitle">Gérez les emplacements de stockage de votre inventaire</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Ajouter un entrepôt
        </button>
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
                  <div style="width:42px;height:42px;background:rgba(14,165,233,0.12);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏭</div>
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
                <button class="btn btn-secondary btn-sm" style="flex:1" (click)="openEdit(wh)">
                  <i class="pi pi-pencil"></i> Modifier
                </button>
                @if (wh.isActive) {
                  <button class="btn btn-danger btn-sm" (click)="toggleActive(wh)" title="Désactiver">
                    <i class="pi pi-ban"></i>
                  </button>
                } @else {
                  <button class="btn btn-success btn-sm" (click)="toggleActive(wh)" title="Activer">
                    <i class="pi pi-check"></i>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-panel" style="max-width:580px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editItem() ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt' }}</h2>
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
    </div>
  `
})
export class WarehousesComponent implements OnInit {
  private stockService = inject(StockService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<WarehouseDto | null>(null);
  items = signal<WarehouseDto[]>([]);
  filtered = signal<WarehouseDto[]>([]);

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

  save() {
    this.saving.set(true);
    const req = this.editItem()
      ? this.stockService.updateWarehouse(this.editItem()!.id, { id: this.editItem()!.id, ...this.form })
      : this.stockService.createWarehouse(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: () => this.saving.set(false) });
  }

  toggleActive(item: WarehouseDto) {
    const req = item.isActive ? this.stockService.deactivateWarehouse(item.id) : this.stockService.activateWarehouse(item.id);
    req.subscribe({ next: () => this.load() });
  }
}
