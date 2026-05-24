import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StockService } from './services/stock.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (!isAuthenticated()) {
      <main style="min-height: 100vh; width: 100vw;">
        <router-outlet></router-outlet>
      </main>
    } @else {
      <div class="app-shell">
        <!-- Barre latérale -->
        <aside class="sidebar" [class.collapsed]="isCollapsed()">
          <div class="sidebar-brand">
            <a class="brand-logo" routerLink="/dashboard">
              <div class="brand-icon">
                <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
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
              <span>Tableau de bord</span>
            </a>
 
            <div class="nav-label">Inventaire</div>
 
            <a class="nav-item" routerLink="/stock-items" routerLinkActive="active">
              <i class="pi pi-box"></i>
              <span>Articles en stock</span>
            </a>
 
            <a class="nav-item" routerLink="/warehouses" routerLinkActive="active">
              <i class="pi pi-building"></i>
              <span>Entrepôts</span>
            </a>
 
            <a class="nav-item" routerLink="/suppliers" routerLinkActive="active">
              <i class="pi pi-truck"></i>
              <span>Fournisseurs</span>
            </a>
 
            <div class="nav-label">Opérations</div>
 
            <a class="nav-item" routerLink="/movements" routerLinkActive="active">
              <i class="pi pi-arrow-right-arrow-left"></i>
              <span>Mouvements de stock</span>
            </a>
 
            <a class="nav-item" routerLink="/alerts" routerLinkActive="active">
              <i class="pi pi-bell"></i>
              <span>Alertes</span>
              @if (unreadAlerts() > 0) {
                <span class="nav-badge">{{ unreadAlerts() }}</span>
              }
            </a>
 
            <div class="nav-label">Configuration</div>
 
            <a class="nav-item" routerLink="/reference-data" routerLinkActive="active">
              <i class="pi pi-cog"></i>
              <span>Tables de référence</span>
            </a>
 
            @if (isAdmin()) {
              <div class="nav-label">Administration</div>
              <a class="nav-item" routerLink="/users" routerLinkActive="active">
                <i class="pi pi-users"></i>
                <span>Utilisateurs</span>
              </a>
            }
          </nav>
 
          <!-- Profil et Déconnexion -->
          <div class="sidebar-footer" style="padding: 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
            <a routerLink="/profile" style="display: flex; align-items: center; gap: 10px; text-decoration: none; cursor: pointer;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #7c3aed); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white; font-weight: 700; flex-shrink: 0;">
                {{ currentUser()?.fullName?.[0]?.toUpperCase() || 'U' }}
              </div>
              <div class="profile-details" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
                <div style="font-size: 12.5px; font-weight: 600; color: var(--text-primary)">
                  {{ currentUser()?.fullName }}
                </div>
                <div style="font-size: 11px; color: var(--text-muted)">
                  {{ currentUser()?.role }}
                </div>
              </div>
            </a>
            <button (click)="logout()" class="btn btn-secondary btn-sm sidebar-footer-btn" style="width: 100%; justify-content: center; gap: 6px;">
              <i class="pi pi-sign-out"></i>
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>
 
        <div class="main-content">
          <header class="topbar">
            <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
              <!-- Hamburger menu toggle -->
              <button (click)="toggleSidebar()" class="btn-icon" style="border: none; background: transparent; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px; width: 32px; height: 32px;" title="Menu">
                <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div style="font-size: 13px; color: var(--text-muted)">
                <span style="color: var(--success)">■</span> En ligne
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              @if (unreadAlerts() > 0) {
                <a routerLink="/alerts" style="position: relative; cursor: pointer;">
                  <i class="pi pi-bell" style="font-size: 17px; color: var(--text-muted)"></i>
                  <span style="position: absolute; top: -4px; right: -6px; background: var(--danger); color: white; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 8px;">
                    {{ unreadAlerts() }}
                  </span>
                </a>
              }
 
              <!-- Bouton de thème -->
              <button (click)="toggleTheme()"
                style="display: flex; align-items: center; gap: 6px; background: var(--bg-base); border: 1px solid var(--border); border-radius: 20px; padding: 5px 12px; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--text-muted); transition: all 0.2s ease; font-family: inherit;"
                [style.color]="isLight() ? '#0284c7' : '#94a3b8'"
                [title]="isLight() ? 'Passer en mode sombre' : 'Passer en mode clair'">
                @if (isLight()) {
                  <i class="pi pi-sun" style="font-size: 13px;"></i>
                  <span>Clair</span>
                } @else {
                  <i class="pi pi-moon" style="font-size: 13px;"></i>
                  <span>Sombre</span>
                }
              </button>
 
              <div style="width: 1px; height: 20px; background: var(--border)"></div>
              <div style="font-size: 12px; color: var(--text-muted)">{{ today }}</div>
            </div>
          </header>
 
          <main class="page-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    }
  `
})
export class AppComponent implements OnInit {
  private stockService = inject(StockService);
  private authService = inject(AuthService);
  private router = inject(Router);
 
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  isAdmin = this.authService.isAdmin;
 
  isCollapsed = signal(false);
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
 
    if (this.isAuthenticated()) {
      this.loadAlertCount();
    }
  }
 
  toggleSidebar() {
    this.isCollapsed.update(v => !v);
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
 
  logout() {
    this.authService.logout();
  }
}

