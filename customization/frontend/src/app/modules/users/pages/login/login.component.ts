import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="split-login-container">
      
      <!-- Panel de gauche : Visuel & Branding -->
      <div class="brand-panel">
        <div class="brand-bg-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
        </div>
        
        <div class="brand-content">
          <div class="brand-logo">
            <svg style="width: 30px; height: 30px;" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 class="brand-title">FTH Stock</h1>
          <p class="brand-tagline">Système intelligent de gestion de matériaux d'infrastructure</p>
          
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">
                <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.29 7 12 12 20.71 7"/>
                  <line x1="12" y1="22" x2="12" y2="12"/>
                </svg>
              </div>
              <div>
                <h3 class="feature-title">Suivi en temps réel</h3>
                <p class="feature-desc">Contrôlez vos stocks et lots à travers tous vos entrepôts.</p>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">
                <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>
              <div>
                <h3 class="feature-title">Opérations de Mouvements</h3>
                <p class="feature-desc">Gérez facilement les réceptions, transferts et ajustements.</p>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">
                <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
              </div>
              <div>
                <h3 class="feature-title">Alertes Intelligentes</h3>
                <p class="feature-desc">Notifications automatiques pour les stocks bas et dates de péremption.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="brand-footer">
          <p>© 2026 FTH Stock — Solution Matériaux & Logistique</p>
        </div>
      </div>
      
      <!-- Panel de droite : Formulaire de connexion -->
      <div class="form-panel">
        <div class="form-content">
          <div class="mobile-logo-header">
            <div class="mobile-logo">
              <svg style="width: 22px; height: 22px;" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2>FTH Stock</h2>
          </div>

          <div class="form-header">
            <h2 class="form-title">Bienvenue</h2>
            <p class="form-subtitle">Veuillez renseigner vos identifiants pour vous connecter</p>
          </div>
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <!-- Alerte d'erreur -->
            @if (errorMessage()) {
              <div class="error-alert">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="form-group">
              <label class="form-label" for="username">Nom d'utilisateur</label>
              <div class="input-wrapper">
                <i class="pi pi-user input-icon"></i>
                <input
                  id="username"
                  type="text"
                  formControlName="username"
                  placeholder="Ex. admin, manager"
                  class="form-input"
                  [class.has-error]="isFieldInvalid('username')"
                />
              </div>
              @if (isFieldInvalid('username')) {
                <span class="field-error">Le nom d'utilisateur est requis.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Mot de passe</label>
              <div class="input-wrapper">
                <i class="pi pi-lock input-icon"></i>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  placeholder="••••••••"
                  class="form-input"
                  [class.has-error]="isFieldInvalid('password')"
                />
              </div>
              @if (isFieldInvalid('password')) {
                <span class="field-error">Le mot de passe est requis.</span>
              }
            </div>

            <button type="submit" class="submit-btn" [disabled]="isLoading() || loginForm.invalid">
              @if (isLoading()) {
                <div class="btn-spinner"></div>
                <span>Connexion en cours...</span>
              } @else {
                <span>Se connecter</span>
                <i class="pi pi-arrow-right"></i>
              }
            </button>
          </form>
          
          <!-- Informations de démo utiles pour l'utilisateur -->
          <div class="demo-info">
            <span class="demo-badge">Démo</span>
            <p>Admin : <code>admin</code> / <code>AdminPassword123!</code></p>
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 400 || err.status === 404) {
          this.errorMessage.set(err.error?.Message || 'Identifiants invalides.');
        } else {
          this.errorMessage.set('Une erreur réseau est survenue. Veuillez réessayer.');
        }
      }
    });
  }
}
