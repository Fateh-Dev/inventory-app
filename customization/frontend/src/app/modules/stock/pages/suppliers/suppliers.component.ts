import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { SupplierDto } from '../../models/stock.models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Fournisseurs</h1>
          <p class="page-subtitle">Gérez vos fournisseurs de matériaux et contacts vendeurs</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-plus"></i> Ajouter un fournisseur
        </button>
      </div>

      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="Rechercher des fournisseurs…" (ngModelChange)="applyFilter()">
        </div>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="filterActive" (change)="load()"> Actifs uniquement
        </label>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-truck"></i>
            <h3>Aucun fournisseur trouvé</h3>
            <p>Ajoutez des fournisseurs pour suivre la provenance de vos matériaux.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Raison sociale</th>
                <th>Contact</th>
                <th>Téléphone</th>
                <th>E-mail</th>
                <th>Localisation</th>
                <th>Statut</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (s of filtered(); track s.id) {
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div style="width:34px;height:34px;background:linear-gradient(135deg,var(--accent),#7c3aed);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:white;font-weight:700;flex-shrink:0;">
                        {{ s.name[0].toUpperCase() }}
                      </div>
                      <div>
                        <div style="font-weight:600;">{{ s.name }}</div>
                        @if (s.notes) {
                          <div style="font-size:11px;color:var(--text-muted)">{{ s.notes | slice:0:40 }}...</div>
                        }
                      </div>
                    </div>
                  </td>
                  <td>{{ s.contactPerson }}</td>
                  <td>
                    <a [href]="'tel:' + s.phone" style="color:var(--accent);text-decoration:none;font-size:13px;">
                      {{ s.phone }}
                    </a>
                  </td>
                  <td>
                    <a [href]="'mailto:' + s.email" style="color:var(--accent);text-decoration:none;font-size:13px;">
                      {{ s.email }}
                    </a>
                  </td>
                  <td style="color:var(--text-muted);font-size:12.5px;">{{ s.city }}, {{ s.wilaya }}</td>
                  <td>
                    @if (s.isActive) {
                      <span class="badge badge-success">Actif</span>
                    } @else {
                      <span class="badge badge-muted">Inactif</span>
                    }
                  </td>
                  <td style="text-align:right;">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      <button class="btn btn-secondary btn-sm" (click)="openEdit(s)" title="Modifier">
                        <i class="pi pi-pencil"></i>
                      </button>
                      @if (s.isActive) {
                        <button class="btn btn-danger btn-sm" (click)="toggleActive(s)" title="Désactiver">
                          <i class="pi pi-ban"></i>
                        </button>
                      } @else {
                        <button class="btn btn-success btn-sm" (click)="toggleActive(s)" title="Activer">
                          <i class="pi pi-check"></i>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-panel" style="max-width:600px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editItem() ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}</h2>
              <button class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Raison sociale *</label>
                  <input class="form-input" [(ngModel)]="form.name" placeholder="Nom de l'entreprise fournisseur">
                </div>
                <div class="form-group">
                  <label class="form-label">Personne de contact *</label>
                  <input class="form-input" [(ngModel)]="form.contactPerson" placeholder="Nom complet">
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Téléphone</label>
                  <input class="form-input" [(ngModel)]="form.phone" placeholder="+213…">
                </div>
                <div class="form-group">
                  <label class="form-label">E-mail</label>
                  <input class="form-input" type="email" [(ngModel)]="form.email" placeholder="contact@fournisseur.com">
                </div>
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
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" [(ngModel)]="form.notes" placeholder="Notes optionnelles sur ce fournisseur"></textarea>
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
export class SuppliersComponent implements OnInit {
  private stockService = inject(StockService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<SupplierDto | null>(null);
  items = signal<SupplierDto[]>([]);
  filtered = signal<SupplierDto[]>([]);

  search = '';
  filterActive = false;
  form: any = {};

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.stockService.getSuppliers(this.filterActive || undefined).subscribe({
      next: (items) => { this.items.set(items); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered.set(this.items().filter(i => !q || i.name.toLowerCase().includes(q) || i.contactPerson.toLowerCase().includes(q)));
  }

  openCreate() {
    this.editItem.set(null);
    this.form = { name: '', contactPerson: '', phone: '', email: '', street: '', city: '', wilaya: '', postalCode: '', notes: '' };
    this.showModal.set(true);
  }

  openEdit(item: SupplierDto) {
    this.editItem.set(item);
    this.form = { name: item.name, contactPerson: item.contactPerson, phone: item.phone, email: item.email, street: item.street, city: item.city, wilaya: item.wilaya, postalCode: item.postalCode, notes: item.notes ?? '' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    this.saving.set(true);
    const req = this.editItem()
      ? this.stockService.updateSupplier(this.editItem()!.id, { id: this.editItem()!.id, ...this.form })
      : this.stockService.createSupplier(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: () => this.saving.set(false) });
  }

  toggleActive(item: SupplierDto) {
    const req = item.isActive ? this.stockService.deactivateSupplier(item.id) : this.stockService.activateSupplier(item.id);
    req.subscribe({ next: () => this.load() });
  }
}
