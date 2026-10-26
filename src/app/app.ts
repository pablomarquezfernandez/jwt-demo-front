import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly esAdmin = computed(() => !!this.auth.usuario() && this.auth.tieneRol('ROLE_ADMIN'));

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
