import { DatePipe, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { API_URL } from '../../core/api';
import { Usuario } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

/**
 * Ruta protegida por authGuard. Muestra el payload del token y cuánto le queda,
 * y permite disparar peticiones para ver el refresh en acción cuando vence.
 */
@Component({
  selector: 'app-perfil',
  imports: [DatePipe, JsonPipe],
  template: `
    <h1>Mi perfil <small>(ruta con authGuard)</small></h1>
    @if (perfil(); as p) {
      <p class="tarjeta">Usuario <b>{{ p.username }}</b> con rol <b>{{ p.rol }}</b> (respuesta de GET /api/perfil)</p>
    }

    <section class="tarjeta">
      <h2>Access token</h2>
      @if (payload(); as datos) {
        <p>
          Vence {{ datos.exp * 1000 | date: 'HH:mm:ss' }} ·
          @if (segundosRestantes() > 0) {
            quedan <b>{{ segundosRestantes() }} s</b>
          } @else {
            <b class="error">vencido</b>: la próxima petición recibirá 401 y se refrescará
          }
        </p>
        <pre>{{ datos | json }}</pre>
      }
      <button (click)="cargarPerfil()">Llamar GET /api/perfil</button>
      <button class="secundario" (click)="variasPeticiones()">3 peticiones a la vez</button>
      <p class="ayuda">Con el token vencido, las 3 peticiones reciben 401 pero se hace un solo POST /auth/refresh (míralo en la pestaña Red).</p>
    </section>
  `,
})
export class Perfil implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${API_URL}/api/perfil`;

  readonly perfil = signal<Usuario | null>(null);
  private readonly ahora = signal(Date.now());
  /** Se vuelve a leer con cada tic del reloj: así se nota cuando el refresh cambia el token. */
  readonly payload = computed(() => {
    this.ahora();
    return this.auth.leerPayload();
  });
  readonly segundosRestantes = computed(() =>
    Math.max(0, Math.round(((this.payload()?.exp ?? 0) * 1000 - this.ahora()) / 1000)),
  );

  constructor() {
    const reloj = setInterval(() => this.ahora.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.http.get<Usuario>(this.url).subscribe((perfil) => this.perfil.set(perfil));
  }

  variasPeticiones(): void {
    forkJoin([
      this.http.get<Usuario>(this.url),
      this.http.get<Usuario>(this.url),
      this.http.get<Usuario>(this.url),
    ]).subscribe(([perfil]) => this.perfil.set(perfil));
  }
}
