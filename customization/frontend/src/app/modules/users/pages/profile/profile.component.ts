import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UserDto } from '../../../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mon Profil</h1>
        <p class="page-subtitle">Gérez vos informations personnelles et votre sécurité</p>
      </div>
    </div>

    @if (user()) {
      <div class="profile-grid">
        <!-- Informations personnelles -->
        <div class="card profile-card">
          <div class="card-header">
            <div class="card-icon">
              <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 class="card-title">Informations Personnelles</h2>
              <p class="card-subtitle">Modifier votre nom et votre adresse e-mail</p>
            </div>
          </div>

          <form [formGroup]="infoForm" (ngSubmit)="onUpdateInfo()" class="profile-form">
            @if (infoSuccess()) {
              <div class="success-alert">
                <i class="pi pi-check-circle"></i>
                <span>Informations mises à jour avec succès.</span>
              </div>
            }
            @if (infoError()) {
              <div class="danger-alert">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ infoError() }}</span>
              </div>
            }

            <div class="form-group">
              <label class="form-label">Nom d'utilisateur</label>
              <input type="text" [value]="user()?.username" class="form-input disabled" disabled />
              <span class="field-help">Le nom d'utilisateur ne peut pas être modifié.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="fullName">Nom complet</label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                class="form-input"
                [class.has-error]="isFieldInvalid(infoForm, 'fullName')"
              />
              @if (isFieldInvalid(infoForm, 'fullName')) {
                <span class="field-error">Le nom complet est requis.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Adresse E-mail</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                [class.has-error]="isFieldInvalid(infoForm, 'email')"
              />
              @if (isFieldInvalid(infoForm, 'email')) {
                <span class="field-error">Un e-mail valide est requis.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Rôle / Habilitation</label>
              <span class="role-badge">{{ user()?.role }}</span>
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="isInfoLoading() || infoForm.invalid">
              @if (isInfoLoading()) {
                <div class="spinner-sm"></div>
                <span>Enregistrement...</span>
              } @else {
                <i class="pi pi-save"></i>
                <span>Enregistrer</span>
              }
            </button>
          </form>
        </div>

        <!-- Sécurité / Mot de passe -->
        <div class="card profile-card">
          <div class="card-header">
            <div class="card-icon">
              <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 1.5 1.5M15.5 7.5 14 6"/>
              </svg>
            </div>
            <div>
              <h2 class="card-title">Sécurité du Compte</h2>
              <p class="card-subtitle">Modifier votre mot de passe d'accès</p>
            </div>
          </div>

          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="profile-form">
            @if (passwordSuccess()) {
              <div class="success-alert">
                <i class="pi pi-check-circle"></i>
                <span>Mot de passe modifié avec succès.</span>
              </div>
            }
            @if (passwordError()) {
              <div class="danger-alert">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ passwordError() }}</span>
              </div>
            }

            <div class="form-group">
              <label class="form-label" for="currentPassword">Mot de passe actuel</label>
              <input
                id="currentPassword"
                type="password"
                formControlName="currentPassword"
                placeholder="Mot de passe actuel"
                class="form-input"
                [class.has-error]="isFieldInvalid(passwordForm, 'currentPassword')"
              />
              @if (isFieldInvalid(passwordForm, 'currentPassword')) {
                <span class="field-error">Le mot de passe actuel est requis.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="newPassword">Nouveau mot de passe</label>
              <input
                id="newPassword"
                type="password"
                formControlName="newPassword"
                placeholder="Nouveau mot de passe"
                class="form-input"
                [class.has-error]="isFieldInvalid(passwordForm, 'newPassword')"
                (input)="checkPasswordStrength()"
              />
              @if (isFieldInvalid(passwordForm, 'newPassword')) {
                <span class="field-error">Le nouveau mot de passe est requis (min 6 caractères).</span>
              }

              <!-- Indicateur de force du mot de passe -->
              @if (passwordForm.get('newPassword')?.value) {
                <div class="strength-meter">
                  <div class="strength-bar" [class]="strengthClass()"></div>
                  <span class="strength-text">{{ strengthLabel() }}</span>
                </div>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                placeholder="Confirmer le nouveau mot de passe"
                class="form-input"
                [class.has-error]="isFieldInvalid(passwordForm, 'confirmPassword') || passwordForm.hasError('mismatch')"
              />
              @if (isFieldInvalid(passwordForm, 'confirmPassword')) {
                <span class="field-error">La confirmation est requise.</span>
              }
              @if (passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched) {
                <span class="field-error">Les mots de passe ne correspondent pas.</span>
              }
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="isPasswordLoading() || passwordForm.invalid">
              @if (isPasswordLoading()) {
                <div class="spinner-sm"></div>
                <span>Modification...</span>
              } @else {
                <i class="pi pi-lock"></i>
                <span>Modifier le mot de passe</span>
              }
            </button>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .profile-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
      }

      @media (max-width: 992px) {
        .profile-grid {
          grid-template-columns: 1fr;
        }
      }

      .profile-card {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 16px;
      }

      .card-icon {
        width: 44px;
        height: 44px;
        background: var(--accent-glow);
        color: var(--accent);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .card-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .card-subtitle {
        font-size: 12px;
        color: var(--text-muted);
      }

      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .success-alert,
      .danger-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: var(--radius-sm);
        padding: 12px;
        font-size: 13px;
        line-height: 1.4;
      }

      .success-alert {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: var(--success);
      }

      .danger-alert {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: var(--danger);
      }

      .form-input.disabled {
        background: var(--bg-base);
        cursor: not-allowed;
        opacity: 0.7;
      }

      .field-help {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 2px;
      }

      .field-error {
        font-size: 12px;
        color: var(--danger);
        margin-top: 4px;
      }

      .role-badge {
        display: inline-block;
        background: var(--accent-glow);
        color: var(--accent);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        width: fit-content;
      }

      .has-error {
        border-color: var(--danger) !important;
      }

      /* Force du mot de passe */
      .strength-meter {
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .strength-bar {
        height: 4px;
        border-radius: 2px;
        background: #e2e8f0;
        width: 100%;
        position: relative;
        overflow: hidden;
      }

      .strength-bar::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        transition: all 0.3s ease;
      }

      .strength-bar.weak::before {
        width: 33%;
        background: var(--danger);
      }

      .strength-bar.medium::before {
        width: 66%;
        background: var(--warning);
      }

      .strength-bar.strong::before {
        width: 100%;
        background: var(--success);
      }

      .strength-text {
        font-size: 11px;
        font-weight: 500;
      }

      .weak + .strength-text { color: var(--danger); }
      .medium + .strength-text { color: var(--warning); }
      .strong + .strength-text { color: var(--success); }

      /* Petit spinner */
      .spinner-sm {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `
  ]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  user = this.authService.currentUser;

  isInfoLoading = signal(false);
  infoSuccess = signal(false);
  infoError = signal<string | null>(null);

  isPasswordLoading = signal(false);
  passwordSuccess = signal(false);
  passwordError = signal<string | null>(null);

  strengthClass = signal('weak');
  strengthLabel = signal('Faible');

  infoForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: (form) => {
      const newPass = form.get('newPassword')?.value;
      const confirmPass = form.get('confirmPassword')?.value;
      return newPass === confirmPass ? null : { mismatch: true };
    }
  });

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const currentUser = this.user();
    if (currentUser) {
      this.infoForm.patchValue({
        fullName: currentUser.fullName,
        email: currentUser.email
      });
    }
  }

  isFieldInvalid(form: any, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  checkPasswordStrength() {
    const pass = this.passwordForm.get('newPassword')?.value || '';
    if (pass.length === 0) {
      this.strengthClass.set('weak');
      this.strengthLabel.set('Faible');
      return;
    }

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) {
      this.strengthClass.set('weak');
      this.strengthLabel.set('Faible (ajouter majuscules/chiffres/symboles)');
    } else if (score <= 4) {
      this.strengthClass.set('medium');
      this.strengthLabel.set('Moyen (bon mot de passe)');
    } else {
      this.strengthClass.set('strong');
      this.strengthLabel.set('Fort (mot de passe sécurisé)');
    }
  }

  onUpdateInfo() {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.isInfoLoading.set(true);
    this.infoSuccess.set(false);
    this.infoError.set(null);

    const data = this.infoForm.getRawValue();

    this.authService.updateProfile(data).subscribe({
      next: () => {
        this.isInfoLoading.set(false);
        this.infoSuccess.set(true);
      },
      error: (err) => {
        this.isInfoLoading.set(false);
        this.infoError.set(err.error?.Message || 'Une erreur est survenue lors de la mise à jour.');
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isPasswordLoading.set(true);
    this.passwordSuccess.set(false);
    this.passwordError.set(null);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.isPasswordLoading.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isPasswordLoading.set(false);
        this.passwordError.set(err.error?.Message || 'Une erreur est survenue lors de la modification.');
      }
    });
  }
}
