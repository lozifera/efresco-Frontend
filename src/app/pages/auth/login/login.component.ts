import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Iniciar Sesión</h1>
          <p class="subtitle">Accede a tu cuenta de eFresco</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              [class.error]="isFieldInvalid('email')"
              placeholder="tu@email.com"
            >
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              {{ getFieldError('email') }}
            </div>
          </div>

          <!-- Contraseña -->
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              [class.error]="isFieldInvalid('password')"
              placeholder="Tu contraseña"
            >
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              {{ getFieldError('password') }}
            </div>
          </div>

          <!-- Error general -->
          <div class="error-message" *ngIf="submitError">
            {{ submitError }}
          </div>

          <!-- Botones -->
          <div class="form-actions flex flex-col gap-3">
            <button
              type="submit"
              class="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              [disabled]="loginForm.invalid || isSubmitting"
            >
              <span *ngIf="isSubmitting">⏳</span>
              {{ isSubmitting ? ' Iniciando...' : 'Iniciar Sesión' }}
            </button>

            <button
              type="button"
              class="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              (click)="goHome()"
              [disabled]="isSubmitting"
            >
              ← Volver
            </button>
          </div>

          <div class="register-link">
            <p>¿No tienes cuenta? <a [routerLink]="['/auth/register']">Regístrate aquí</a></p>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
      overflow: hidden;
    }

    .login-header {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 2rem;
      text-align: center;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
      }

      .subtitle {
        margin: 0;
        opacity: 0.9;
        font-size: 1.1rem;
      }
    }

    .login-form {
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
      }

      input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        &.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }
    }

    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-primary, .btn-outline {
      padding: 0.875rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border-color: #22c55e;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      }
    }

    .btn-outline {
      background: transparent;
      color: #6b7280;
      border-color: #d1d5db;

      &:hover:not(:disabled) {
        background-color: #f9fafb;
        border-color: #9ca3af;
      }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .register-link {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;

      p {
        margin: 0;
        color: #6b7280;

        a {
          color: #22c55e;
          text-decoration: none;
          font-weight: 600;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} es requerido`;
    if (field.errors['email']) return 'Email no válido';

    return 'Campo inválido';
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    try {
      const { email, password } = this.loginForm.value;

      // Call real login endpoint
      const response = await this.auth.login({ email, password }).toPromise();

      console.log('Login exitoso:', response);

      // Show success message
      alert(response?.mensaje || 'Login exitoso');

      // Redirect based on user role
      if (response?.usuario?.roles?.includes('administrador')) {
        // Redirect to admin panel
        this.router.navigate(['/admin']);
      } else if (response?.usuario?.roles?.includes('productor')) {
        this.router.navigate(['/dashboard/productor']);
      } else if (response?.usuario?.roles?.includes('cliente')) {
        this.router.navigate(['/dashboard/comprador']);
      } else {
        // Default redirect to profile or home
        this.router.navigate(['/profile']);
      }

    } catch (error: any) {
      console.error('Error en login:', error);
      this.submitError = error?.error?.mensaje || error?.message || 'Error al iniciar sesión';
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
