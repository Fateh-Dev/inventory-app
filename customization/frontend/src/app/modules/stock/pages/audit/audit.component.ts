import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../../services/stock.service';
import { ExportService } from '../../../../services/export.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px;">
            Journal d'Audit
            <i class="pi pi-info-circle" style="font-size:16px;color:var(--text-muted);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'" (click)="showInfoModal.set(true)" title="À propos de cette page"></i>
          </h1>
          <p class="page-subtitle">Consultez l'historique et la traçabilité complète de toutes les opérations de stock</p>
        </div>
        <button class="btn btn-secondary" (click)="exportCsv()">
          <i class="pi pi-download"></i> Exporter CSV
        </button>
      </div>

      <!-- Filtres -->
      <div class="filter-bar" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <div class="search-box" style="max-width:200px;margin-bottom:0;">
          <i class="pi pi-user"></i>
          <input class="search-input" [(ngModel)]="userFilter" placeholder="Opérateur…" (ngModelChange)="load()">
        </div>
        <select class="form-select" style="width:160px" [(ngModel)]="actionFilter" (change)="load()">
          <option value="">Tous les types d'actions</option>
          <option value="Création">Créations</option>
          <option value="Confirmation">Confirmations</option>
          <option value="Annulation">Annulations</option>
        </select>
        <input class="form-input" type="date" [(ngModel)]="fromDate" (change)="load()" style="width:150px" title="Date de début">
        <input class="form-input" type="date" [(ngModel)]="toDate" (change)="load()" style="width:150px" title="Date de fin">
        <button class="btn btn-secondary btn-sm" (click)="resetFilters()"><i class="pi pi-refresh"></i> Réinitialiser</button>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden;">
        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (logs().length === 0) {
          <div class="empty-state">
            <i class="pi pi-history"></i>
            <h3>Aucun log d'audit trouvé</h3>
            <p>Ajustez vos filtres ou effectuez des opérations pour peupler le journal.</p>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:160px;">Date & Heure</th>
                <th style="width:140px;">Opérateur</th>
                <th style="width:120px;">Action</th>
                <th style="width:140px;">Module / Mouvement</th>
                <th>Description</th>
                <th style="width:120px;">Référence</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track $index) {
                <tr>
                  <td style="color:var(--text-muted);font-size:12.5px;">
                    {{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div style="width:24px;height:24px;background:var(--accent-glow);border:1px solid var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--accent);font-weight:700;">
                        {{ log.user.substring(0,2).toUpperCase() }}
                      </div>
                      <span style="font-weight:600;font-size:13px;">{{ log.user }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getActionBadge(log.actionType)">
                      {{ log.actionType }}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-muted">{{ log.entityType }}</span>
                  </td>
                  <td style="font-size:13px;color:var(--text-primary);">
                    {{ log.description }}
                  </td>
                  <td>
                    <code style="font-size:11.5px;color:var(--accent);background:rgba(14,165,233,0.08);padding:2px 6px;border-radius:4px;">
                      {{ log.reference }}
                    </code>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Info Modal -->
      @if (showInfoModal()) {
        <div class="modal-overlay" style="z-index: 2100;">
          <div class="modal-panel" style="max-width:500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                <i class="pi pi-info-circle" style="color:var(--accent)"></i>
                Journal d'Audit
              </h2>
              <button class="modal-close" (click)="showInfoModal.set(false)"><i class="pi pi-times"></i></button>
            </div>
            <div class="modal-body" style="font-size:14px;line-height:1.6;color:var(--text-primary);">
              <p style="margin-bottom:16px;"><strong>Description :</strong><br>
                Cette page contient l'historique complet et inaltérable de toutes les opérations de stock (création, confirmation, annulation). Elle permet de garantir la traçabilité des actions effectuées par chaque utilisateur.
              </p>
              <p style="margin-bottom:8px;"><strong>Fonctionnalités clés :</strong></p>
              <ul style="padding-left:20px;margin-bottom:16px;display:flex;flex-direction:column;gap:6px;">
                <li>🔍 <strong>Filtrage multicritère</strong> : Filtrez par utilisateur (opérateur), type d'action (Création, Confirmation, Annulation) ou période (dates).</li>
                <li>📋 <strong>Détails des logs</strong> : Affichez la date, l'opérateur, le type d'action, le module concerné, la description et la référence de l'action.</li>
                <li>📥 <strong>Exportation CSV</strong> : Exportez le journal d'audit filtré au format CSV pour des analyses externes ou archivage.</li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showInfoModal.set(false)">Fermer</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AuditComponent implements OnInit {
  private stockService = inject(StockService);
  private exportService = inject(ExportService);

  showInfoModal = signal(false);

  logs = signal<any[]>([]);
  loading = signal(true);

  userFilter = '';
  actionFilter = '';
  fromDate = '';
  toDate = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.stockService.getAuditLogs({
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      user: this.userFilter || undefined,
      actionType: this.actionFilter || undefined
    }).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters() {
    this.userFilter = '';
    this.actionFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.load();
  }

  getActionBadge(actionType: string): string {
    switch (actionType) {
      case 'Création': return 'badge-info';
      case 'Confirmation': return 'badge-success';
      case 'Annulation': return 'badge-danger';
      default: return 'badge-muted';
    }
  }

  exportCsv() {
    const data = this.logs().map(log => ({
      'Date & Heure': new Date(log.timestamp).toLocaleString('fr-FR'),
      'Opérateur': log.user,
      'Action': log.actionType,
      'Module': log.entityType,
      'Description': log.description,
      'Référence': log.reference
    }));
    this.exportService.exportToCsv(data, 'journal_audit_stock');
  }
}
