import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { SupplierDto } from '../../models/stock.models';
import { ExportService } from '../../../../services/export.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Fournisseurs
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Gérez vos fournisseurs de matériaux et contacts vendeurs</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary" (click)="exportCsv()">
            <i class="pi pi-download"></i> Exporter CSV
          </button>
          <button class="btn btn-primary" (click)="openCreate()">
            <i class="pi pi-plus"></i> Ajouter un fournisseur
          </button>
        </div>
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
                        <button class="btn btn-danger btn-sm" (click)="confirmToggleActive(s)" title="Désactiver">
                          <i class="pi pi-ban"></i>
                        </button>
                      } @else {
                        <button class="btn btn-success btn-sm" (click)="confirmToggleActive(s)" title="Activer">
                          <i class="pi pi-check"></i>
                        </button>
                      }
                      <button class="btn btn-danger btn-sm" (click)="confirmDelete(s)" title="Supprimer">
                        <i class="pi pi-trash"></i>
                      </button>
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
        <div class="modal-overlay">
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

      <!-- Confirmation Dialog -->
      @if (itemToDeactivate()) {
        <div class="modal-overlay">
          <div class="modal-panel confirm-panel" (click)="$event.stopPropagation()">
            <div class="confirm-icon-wrapper">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h2 class="modal-title">Désactiver le fournisseur</h2>
            <p class="confirm-message">
              Êtes-vous sûr de vouloir désactiver le fournisseur <strong>{{ itemToDeactivate()?.name }}</strong> ?<br>
              Il n'apparaîtra plus dans les nouvelles sélections.
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
            <h2 class="modal-title">Supprimer le fournisseur</h2>
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
      
      <!-- Info Modal -->
      @if (showInfoModal()) {
        <div class="modal-overlay" style="z-index: 2100;">
          <div class="modal-panel" style="max-width:500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                <i class="pi pi-info-circle" style="color:var(--accent)"></i>
                Gestion des Fournisseurs
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Cette page contient l'annuaire de tous vos partenaires fournisseurs auprès desquels vous approvisionnez votre matériel.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🤝 <strong>Base Fournisseurs</strong> : Créez et mettez à jour les fiches de vos fournisseurs (téléphone, email, wilaya, personne de contact).</li>
                <li>📝 <strong>Activation/Désactivation</strong> : Désactivez temporairement un fournisseur pour l'empêcher d'apparaître dans les réceptions.</li>
                <li>❌ <strong>Soft Delete</strong> : Supprimez les fournisseurs obsolètes via une modale de validation.</li>
                <li>⬇️ <strong>Export CSV</strong> : Téléchargez l'annuaire des contacts au format CSV.</li>
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
export class SuppliersComponent implements OnInit {
  private stockService = inject(StockService);
  private exportService = inject(ExportService);

  showInfoModal = signal(false);
  customAlert = signal<{ title: string; message: string; severity?: 'error' | 'warning' | 'success'; list?: string[] } | null>(null);

  closeCustomAlert() {
    this.customAlert.set(null);
  }
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<SupplierDto | null>(null);
  itemToDeactivate = signal<SupplierDto | null>(null);
  items = signal<SupplierDto[]>([]);
  filtered = signal<SupplierDto[]>([]);

  // Deletion properties
  showDeleteModal = signal(false);
  deleteModalMessage = signal('');
  deleteAction = signal<(() => void) | null>(null);

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

  validateForm(): boolean {
    const missing: string[] = [];
    if (!this.form.name?.trim()) {
      missing.push("Raison sociale");
    }
    if (!this.form.contactPerson?.trim()) {
      missing.push("Personne de contact");
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
      ? this.stockService.updateSupplier(this.editItem()!.id, { id: this.editItem()!.id, ...this.form })
      : this.stockService.createSupplier(this.form);
    req.subscribe({ next: () => { this.saving.set(false); this.closeModal(); this.load(); }, error: () => this.saving.set(false) });
  }

  confirmToggleActive(item: SupplierDto) {
    if (item.isActive) {
      this.itemToDeactivate.set(item);
    } else {
      const req = this.stockService.activateSupplier(item.id);
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
    this.stockService.deactivateSupplier(item.id).subscribe({
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

  exportCsv() {
    const data = this.items().map(s => ({
      'Raison sociale': s.name,
      'Personne de contact': s.contactPerson,
      'Téléphone': s.phone,
      'E-mail': s.email,
      'Adresse': s.street || '—',
      'Ville': s.city || '—',
      'Wilaya': s.wilaya || '—',
      'Code postal': s.postalCode || '—',
      'Statut': s.isActive ? 'Actif' : 'Inactif'
    }));
    this.exportService.exportToCsv(data, 'fournisseurs_stock');
  }

  confirmDelete(item: SupplierDto) {
    this.deleteModalMessage.set(`Êtes-vous sûr de vouloir supprimer le fournisseur "${item.name}" ?`);
    this.deleteAction.set(() => this.deleteSupplier(item));
    this.showDeleteModal.set(true);
  }

  deleteSupplier(item: SupplierDto) {
    this.stockService.deleteSupplier(item.id).subscribe({
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
}
