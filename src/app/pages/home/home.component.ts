import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface ContactForm {
  name: string;
  email: string;
  userType: string;
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  // Landing page properties
  showMobileMenu = false;
  showChat = false;
  showUserMenu = false;

  // Contact form
  contactForm: ContactForm = {
    name: '',
    email: '',
    userType: '',
    message: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Configurar smooth scrolling para navegación
    this.setupSmoothScrolling();
  }

  // Getter para verificar si el usuario es administrador
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Getter para verificar si el usuario está logueado
  get isLoggedIn(): boolean {
    return this.authService.getToken() !== null;
  }

  // Método para obtener el usuario actual
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  // Navigation methods
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    this.showMobileMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  // Registration methods
  openRegistration(userType?: string): void {
    if (userType) {
      // Navegar a la página de registro con tipo de usuario
      this.router.navigate(['/auth/register'], {
        queryParams: { type: userType }
      });
    } else {
      // Navegar a registro general
      this.router.navigate(['/auth/register']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    // Opcional: mostrar mensaje de confirmación
    alert('Sesión cerrada exitosamente');
  }

  // Login method
  openLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // Contact form methods
  submitContactForm(): void {
    if (this.isFormValid()) {
      console.log('Enviando formulario:', this.contactForm);

      // Simular envío
      alert('¡Mensaje enviado correctamente! Nos contactaremos contigo pronto.');

      // Limpiar formulario
      this.contactForm = {
        name: '',
        email: '',
        userType: '',
        message: ''
      };
    } else {
      alert('Por favor, completa todos los campos obligatorios.');
    }
  }

  private isFormValid(): boolean {
    return !!(this.contactForm.name &&
              this.contactForm.email &&
              this.contactForm.userType);
  }

  // Chat widget
  toggleChat(): void {
    this.showChat = !this.showChat;
    if (this.showChat) {
      console.log('Abriendo chat...');
      // Aquí integrarías el sistema de chat
    }
  }

  // Utility methods
  private setupSmoothScrolling(): void {
    // Configurar comportamiento de scroll suave
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  // Analytics tracking (ejemplo)
  trackUserInteraction(action: string, category: string = 'Landing'): void {
    console.log(`Analytics: ${category} - ${action}`);
    // Aquí integrarías Google Analytics, Mixpanel, etc.
  }

  // Lead generation
  downloadBusinessPlan(): void {
    console.log('Descargando plan de negocios...');
    this.trackUserInteraction('Download Business Plan');
    // Implementar descarga de PDF
  }

  requestDemo(): void {
    console.log('Solicitando demo...');
    this.trackUserInteraction('Request Demo');
    this.scrollToSection('contacto');
  }
}
