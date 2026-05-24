import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StockService } from './services/stock.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <!-- Barre latérale -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <a class="brand-logo" routerLink="/dashboard">
            <div class="brand-icon">🏗️</div>
            <div>
              <div class="brand-name">FTH Stock</div>
              <div class="brand-sub">Matériaux d'Infrastructure</div>
            </div>
          </a>
        </div>

        <nav class="nav-section">
          <div class="nav-label">Vue d'ensemble</div>

          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
            <i class="pi pi-chart-bar"></i>
            Tableau de bord
          </a>

          <div class="nav-label">Inventaire</div>

          <a class="nav-item" routerLink="/stock-items" routerLinkActive="active">
            <i class="pi pi-box"></i>
            Articles en stock
          </a>

          <a class="nav-item" routerLink="/warehouses" routerLinkActive="active">
            <i class="pi pi-building"></i>
            Entrepôts
          </a>

          <a class="nav-item" routerLink="/suppliers" routerLinkActive="active">
            <i class="pi pi-truck"></i>
            Fournisseurs
          </a>

          <div class="nav-label">Opérations</div>

          <a class="nav-item" routerLink="/movements" routerLinkActive="active">
            <i class="pi pi-arrow-right-arrow-left"></i>
            Mouvements de stock
          </a>

          <a class="nav-item" routerLink="/alerts" routerLinkActive="active">
            <i class="pi pi-bell"></i>
            Alertes
            @if (unreadAlerts() > 0) {
              <span class="nav-badge">{{ unreadAlerts() }}</span>
            }
          </a>

          <div class="nav-label">Configuration</div>

          <a class="nav-item" routerLink="/reference-data" routerLinkActive="active">
            <i class="pi pi-cog"></i>
            Tables de référence
          </a>
        </nav>

        <div style="padding: 16px; border-top: 1px solid var(--border);">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,var(--accent),#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;">👤</div>
            <div>
              <div style="font-size:12.5px;font-weight:600;color:var(--text-primary)">Administrateur</div>
              <div style="font-size:11px;color:var(--text-muted)">Gestionnaire de stock</div>
            </div>
          </div>
        </div>
      </aside>

      <div class="main-content">
        <header class="topbar">
          <div style="flex:1; display:flex; align-items:center; gap:12px;">
            <div style="font-size:13px; color:var(--text-muted)">
              <span style="color:var(--accent)">■</span> En ligne
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            @if (unreadAlerts() > 0) {
              <a routerLink="/alerts" style="position:relative; cursor:pointer;">
                <i class="pi pi-bell" style="font-size:17px; color:var(--text-muted)"></i>
                <span style="position:absolute;top:-4px;right:-6px;background:var(--danger);color:white;font-size:9px;font-weight:700;padding:1px 4px;border-radius:8px;">
                  {{ unreadAlerts() }}
                </span>
              </a>
            }

            <!-- Bouton de thème -->
            <button (click)="toggleTheme()"
              style="display:flex;align-items:center;gap:6px;background:var(--bg-base);border:1px solid var(--border);border-radius:20px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;color:var(--text-muted);transition:all 0.2s ease;font-family:inherit;"
              [style.color]="isLight() ? '#0284c7' : '#94a3b8'"
              [title]="isLight() ? 'Passer en mode sombre' : 'Passer en mode clair'">
              @if (isLight()) {
                <i class="pi pi-sun" style="font-size:13px;"></i>
                <span>Clair</span>
              } @else {
                <i class="pi pi-moon" style="font-size:13px;"></i>
                <span>Sombre</span>
              }
            </button>

            <div style="width:1px;height:20px;background:var(--border)"></div>
            <div style="font-size:12px;color:var(--text-muted)">{{ today }}</div>
          </div>
        </header>

        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  private stockService = inject(StockService);
  private router = inject(Router);

  unreadAlerts = signal(0);
  isLight = signal(true); // Défaut à vrai (mode clair)
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  ngOnInit() {
    const saved = localStorage.getItem('fth-theme');
    // Si 'dark', on applique le mode sombre. Sinon (si 'light' ou rien), on reste en clair.
    if (saved === 'dark') {
      this.isLight.set(false);
      document.documentElement.classList.add('dark');
    } else {
      this.isLight.set(true);
      document.documentElement.classList.remove('dark');
    }
    this.loadAlertCount();
  }

  toggleTheme() {
    this.isLight.update(v => !v);
    if (this.isLight()) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fth-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fth-theme', 'dark');
    }
  }

  private loadAlertCount() {
    this.stockService.getAlerts({ unreadOnly: true }).subscribe({
      next: (alerts) => this.unreadAlerts.set(alerts.length),
      error: () => {}
    });
  }
}
