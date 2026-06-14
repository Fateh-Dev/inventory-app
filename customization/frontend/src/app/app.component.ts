import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from './services/stock.service';
import { AuthService } from './services/auth.service';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    @if (!isAuthenticated()) {
      <main style="min-height: 100vh; width: 100vw;">
        <router-outlet></router-outlet>
      </main>
    } @else {
      <div class="app-shell" [dir]="t.currentLang() === 'ar' ? 'rtl' : 'ltr'">
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
                <div class="brand-name">{{ t.t('brand_name') }}</div>
                <div class="brand-sub">{{ t.t('brand_sub') }}</div>
              </div>
            </a>
          </div>
 
          <nav class="nav-section">
            <div class="nav-label">{{ t.t('overview') }}</div>
 
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
              <i class="pi pi-chart-bar"></i>
              <span>{{ t.t('dashboard') }}</span>
            </a>
 
            <div class="nav-label">{{ t.t('inventory') }}</div>
 
            <a class="nav-item" routerLink="/stock-items" routerLinkActive="active">
              <i class="pi pi-box"></i>
              <span>{{ t.t('stock_items') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/warehouses" routerLinkActive="active">
              <i class="pi pi-building"></i>
              <span>{{ t.t('warehouses') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/suppliers" routerLinkActive="active">
              <i class="pi pi-truck"></i>
              <span>{{ t.t('suppliers') }}</span>
            </a>
 
            <div class="nav-label">{{ t.t('operations') }}</div>
 
            <a class="nav-item" routerLink="/movements" routerLinkActive="active">
              <i class="pi pi-arrow-right-arrow-left"></i>
              <span>{{ t.t('movements') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/lots" routerLinkActive="active">
              <i class="pi pi-list"></i>
              <span>{{ t.t('lots') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/inventory" routerLinkActive="active">
              <i class="pi pi-check-square"></i>
              <span>{{ t.t('physical_inventory') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/reports" routerLinkActive="active">
              <i class="pi pi-chart-bar"></i>
              <span>{{ t.t('reports') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/alerts" routerLinkActive="active">
              <i class="pi pi-bell"></i>
              <span>{{ t.t('alerts') }}</span>
              @if (unreadAlerts() > 0) {
                <span class="nav-badge">{{ unreadAlerts() }}</span>
              }
            </a>
 
            <div class="nav-label">{{ t.t('config') }}</div>
 
            <a class="nav-item" routerLink="/reference-data" routerLinkActive="active">
              <i class="pi pi-cog"></i>
              <span>{{ t.t('reference_data') }}</span>
            </a>
 
            <a class="nav-item" routerLink="/audit" routerLinkActive="active">
              <i class="pi pi-history"></i>
              <span>{{ t.t('audit') }}</span>
            </a>
 
            @if (isAdmin()) {
              <div class="nav-label">{{ t.t('users') }}</div>
              <a class="nav-item" routerLink="/users" routerLinkActive="active">
                <i class="pi pi-users"></i>
                <span>{{ t.t('users') }}</span>
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
              <span>{{ t.t('logout') }}</span>
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
                <span style="color: var(--success)">■</span> {{ t.t('online') }}
              </div>
              
              <!-- Recherche globale container -->
              <div class="global-search-container" style="position:relative; margin-left: 20px; width: 320px; z-index:1000;">
                <div style="position:relative; width: 100%;">
                  <i class="pi pi-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:13px;"></i>
                  <input type="text" class="form-input" style="width:100%; padding-left:32px; font-size:12.5px; border-radius:18px; height:32px; background:var(--bg-base); border:1px solid var(--border);"
                    [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" [placeholder]="t.t('search_placeholder')" (focus)="showResults.set(true)">
                  @if (searchQuery) {
                    <i class="pi pi-times" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:11px; cursor:pointer;" (click)="clearSearch()"></i>
                  }
                </div>
                <!-- Dropdown results -->
                @if (showResults() && results().length > 0) {
                  <div class="search-results-dropdown" style="position:absolute; top:36px; left:0; width:100%; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); max-height:300px; overflow-y:auto; padding:6px 0;">
                    @for (r of results(); track $index) {
                      <div (click)="selectResult(r)" style="padding:8px 12px; cursor:pointer; display:flex; align-items:center; gap:8px; border-bottom:1px solid var(--border-light); transition: background 0.15s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                        <i [class]="getSearchIcon(r.type)" style="color:var(--accent); font-size:14px; flex-shrink:0;"></i>
                        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                          <div style="font-size:12.5px; font-weight:600; color:var(--text-primary);">{{ r.title }}</div>
                          <div style="font-size:11px; color:var(--text-muted);">{{ r.subtitle }}</div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <!-- Selecteur de langue -->
              <select class="form-select" style="width: auto; padding: 4px 10px; font-size: 12px; height: 32px; border-radius: 20px; font-weight: 600; cursor: pointer; background: var(--bg-base); border: 1px solid var(--border); color: var(--text-muted); font-family: inherit; outline: none;"
                      [ngModel]="t.currentLang()" (ngModelChange)="t.setLanguage($event)">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>

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
              <div style="font-size: 12px; color: var(--text-muted)">{{ getToday() }}</div>
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
  public t = inject(TranslationService);
 
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  isAdmin = this.authService.isAdmin;
 
  isCollapsed = signal(false);
  unreadAlerts = signal(0);
  isLight = signal(true); // Défaut à vrai (mode clair)
 
  // Global search state
  searchQuery = '';
  results = signal<any[]>([]);
  showResults = signal(false);
 
  ngOnInit() {
    const saved = localStorage.getItem('fth-theme');
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

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.results.set([]);
      return;
    }
    this.stockService.searchGlobal(this.searchQuery).subscribe(res => {
      this.results.set(res);
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.results.set([]);
  }

  getSearchIcon(type: string): string {
    switch (type) {
      case 'item': return 'pi pi-box';
      case 'movement': return 'pi pi-arrow-right-arrow-left';
      case 'supplier': return 'pi pi-truck';
      case 'warehouse': return 'pi pi-building';
      default: return 'pi pi-search';
    }
  }

  selectResult(r: any) {
    this.showResults.set(false);
    this.clearSearch();
    switch (r.type) {
      case 'item':
        this.router.navigate(['/stock-items'], { queryParams: { selectId: r.id } });
        break;
      case 'movement':
        this.router.navigate(['/movements'], { queryParams: { selectId: r.id } });
        break;
      case 'supplier':
        this.router.navigate(['/suppliers']);
        break;
      case 'warehouse':
        this.router.navigate(['/warehouses']);
        break;
    }
  }

  getToday(): string {
    const lang = this.t.currentLang();
    const locale = lang === 'ar' ? 'ar-DZ' : (lang === 'en' ? 'en-US' : 'fr-FR');
    return new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.global-search-container')) {
      this.showResults.set(false);
    }
  }
}
