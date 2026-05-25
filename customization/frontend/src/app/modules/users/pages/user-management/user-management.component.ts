import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserDto } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestion des Utilisateurs</h1>
          <p class="page-subtitle">Gérez les comptes des collaborateurs, les rôles et les accès système</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="pi pi-user-plus"></i> Ajouter un utilisateur
        </button>
      </div>

      <div class="filter-bar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input class="search-input" [(ngModel)]="search" placeholder="Rechercher par nom ou e-mail…" (ngModelChange)="applyFilter()" autocomplete="off" name="user-search">
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="pi pi-users"></i>
            <h3>Aucun utilisateur trouvé</h3>
            <p>Ajoutez des comptes utilisateurs pour collaborer.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Nom complet</th>
                <th>Nom d'utilisateur</th>
                <th>E-mail</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date de création</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered(); track u.id) {
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div style="width:34px;height:34px;background:linear-gradient(135deg,var(--accent),#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:white;font-weight:700;flex-shrink:0;">
                        {{ u.fullName[0].toUpperCase() }}
                      </div>
                      <div>
                        <div style="font-weight:600;">{{ u.fullName }}</div>
                        @if (u.id === currentUser()?.id) {
                          <span style="font-size:10px;background:var(--success);color:white;padding:1px 6px;border-radius:10px;font-weight:700;">Vous</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td><code>{{ u.username }}</code></td>
                  <td>
                    <a [href]="'mailto:' + u.email" style="color:var(--accent);text-decoration:none;font-size:13px;">
                      {{ u.email }}
                    </a>
                  </td>
                  <td>
                    <span class="role-chip" [class]="u.role.toLowerCase()">{{ u.role }}</span>
                  </td>
                  <td>
                    @if (u.isActive) {
                      <span class="badge badge-success">Actif</span>
                    } @else {
                      <span class="badge badge-muted">Inactif</span>
                    }
                  </td>
                  <td style="color:var(--text-muted);font-size:12.5px;">
                    {{ u.createdAt | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td style="text-align:right;">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      <button class="btn btn-secondary btn-sm" (click)="openEdit(u)" title="Modifier">
                        <i class="pi pi-pencil"></i>
                      </button>
                      @if (u.id !== currentUser()?.id && u.username !== 'admin') {
                        @if (u.isActive) {
                          <button class="btn btn-danger btn-sm" (click)="toggleActive(u)" title="Désactiver">
                            <i class="pi pi-ban"></i>
                          </button>
                        } @else {
                          <button class="btn btn-success btn-sm" (click)="toggleActive(u)" title="Activer">
                            <i class="pi pi-check"></i>
                          </button>
                        }
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
        <div class="modal-overlay">
          <div class="modal-panel" style="max-width:550px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ editItem() ? "Modifier l'utilisateur" : "Nouvel utilisateur" }}</h2>
              <button class="modal-close" (click)="closeModal()"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body">
              @if (errorMessage()) {
                <div class="danger-alert" style="margin-bottom:16px;">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <div class="form-group">
                <label class="form-label">Nom complet *</label>
                <input class="form-input" [(ngModel)]="form.fullName" placeholder="Ex. Fateh Admin">
              </div>

              <div class="form-group">
                <label class="form-label">Nom d'utilisateur *</label>
                <input class="form-input" [(ngModel)]="form.username" [disabled]="!!editItem()" placeholder="Ex. fadmin" autocomplete="new-username" name="username">
                @if (editItem()) {
                  <span class="field-help">Le nom d'utilisateur ne peut pas être modifié.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Adresse E-mail *</label>
                <input class="form-input" type="email" [(ngModel)]="form.email" placeholder="contact@fth.dz">
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Rôle *</label>
                  <select class="form-select" [(ngModel)]="form.role" [disabled]="form.username === 'admin'">
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Mot de passe {{ editItem() ? '(Optionnel)' : '*' }}</label>
                  <input class="form-input" type="password" [(ngModel)]="form.password" placeholder="{{ editItem() ? 'Laisser vide pour ne pas modifier' : '••••••••' }}" autocomplete="new-password" name="password">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="saving() || !isValid()">
                @if (saving()) { <div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> }
                {{ editItem() ? 'Mettre à jour' : 'Créer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .role-chip {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 11.5px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .role-chip.admin { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
      .role-chip.manager { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      .role-chip.worker { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }

      .danger-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        padding: 12px;
        color: #f87171;
        font-size: 13px;
      }

      .field-help {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 2px;
        display: block;
      }
    `
  ]
})
export class UserManagementComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editItem = signal<UserDto | null>(null);
  items = signal<UserDto[]>([]);
  filtered = signal<UserDto[]>([]);
  errorMessage = signal<string | null>(null);

  search = '';
  form: any = {};

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.authService.getUsers().subscribe({
      next: (items) => { this.items.set(items); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered.set(this.items().filter(i => 
      !q || 
      i.fullName.toLowerCase().includes(q) || 
      i.username.toLowerCase().includes(q) || 
      i.email.toLowerCase().includes(q)
    ));
  }

  openCreate() {
    this.editItem.set(null);
    this.errorMessage.set(null);
    this.form = { username: '', fullName: '', email: '', role: 'Worker', password: '' };
    this.showModal.set(true);
  }

  openEdit(item: UserDto) {
    this.editItem.set(item);
    this.errorMessage.set(null);
    this.form = { username: item.username, fullName: item.fullName, email: item.email, role: item.role, password: '' };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  isValid(): boolean {
    if (!this.form.fullName || !this.form.email) return false;
    if (!this.editItem() && (!this.form.username || !this.form.password || this.form.password.length < 4)) return false;
    return true;
  }

  save() {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const req = this.editItem()
      ? this.authService.updateUser(this.editItem()!.id, { id: this.editItem()!.id, ...this.form })
      : this.authService.createUser(this.form);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (err) => { 
        this.saving.set(false);
        this.errorMessage.set(err.error?.Message || 'Une erreur est survenue lors de la sauvegarde.');
      }
    });
  }

  toggleActive(item: UserDto) {
    const req = item.isActive ? this.authService.deactivateUser(item.id) : this.authService.activateUser(item.id);
    req.subscribe({ next: () => this.load() });
  }
}
