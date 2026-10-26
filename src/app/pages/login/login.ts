import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <h1>Iniciar sesión</h1>
    <form class="tarjeta" (ngSubmit)="entrar()">
      <label>Usuario <input name="username" [(ngModel)]="username" required /></label>
      <label>Contraseña <input name="password" type="password" [(ngModel)]="password" required /></label>
      <button type="submit" [disabled]="cargando()">Entrar</button>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </form>
    <p class="ayuda">Usuarios de prueba: <code>ana / ana123</code> (USER) y <code>admin / admin123</code> (ADMIN).</p>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  entrar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        // Vuelve a la página que pidió antes de que el guard lo mandara al login
        const url = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/perfil';
        this.router.navigateByUrl(url);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(e.status === 401 ? 'Usuario o contraseña incorrectos' : 'No se pudo conectar con la API');
        this.cargando.set(false);
      },
    });
  }
}
