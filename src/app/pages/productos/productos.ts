import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { API_URL } from '../../core/api';
import { Producto } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

/**
 * Un recurso con tres niveles de acceso: listar es público, crear pide token y eliminar pide ADMIN.
 * Ningún método arma el header Authorization: lo pone authInterceptor.
 */
@Component({
  selector: 'app-productos',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <h1>Productos <small>(listar es público)</small></h1>
    <ul class="tarjeta lista">
      @for (producto of productos(); track producto.id) {
        <li>
          {{ producto.nombre }} · {{ producto.precio | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
          @if (esAdmin()) {
            <button class="secundario" (click)="eliminar(producto)">Eliminar</button>
          }
        </li>
      } @empty {
        <li>Sin productos</li>
      }
    </ul>

    @if (auth.usuario()) {
      <form class="tarjeta" (ngSubmit)="crear()">
        <h2>Nuevo producto <small>(pide token)</small></h2>
        <label>Nombre <input name="nombre" [(ngModel)]="nombre" required /></label>
        <label>Precio <input name="precio" type="number" [(ngModel)]="precio" required /></label>
        <button type="submit">Crear</button>
      </form>
    } @else {
      <p class="ayuda">Inicia sesión para crear productos; con el rol ADMIN también puedes eliminarlos.</p>
    }

    @if (mensaje()) {
      <p class="error">{{ mensaje() }}</p>
    }
  `,
})
export class Productos implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly auth = inject(AuthService);
  private readonly url = `${API_URL}/api/productos`;

  readonly productos = signal<Producto[]>([]);
  readonly mensaje = signal<string | null>(null);
  readonly esAdmin = computed(() => !!this.auth.usuario() && this.auth.tieneRol('ROLE_ADMIN'));
  nombre = '';
  precio: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  crear(): void {
    this.http.post<Producto>(this.url, { nombre: this.nombre, precio: this.precio }).subscribe({
      next: () => {
        this.nombre = '';
        this.precio = null;
        this.cargar();
      },
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  eliminar(producto: Producto): void {
    this.http.delete(`${this.url}/${producto.id}`).subscribe({
      next: () => this.cargar(),
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  private cargar(): void {
    this.mensaje.set(null);
    this.http.get<Producto[]>(this.url).subscribe({
      next: (productos) => this.productos.set(productos),
      error: (e: HttpErrorResponse) => this.mostrarError(e),
    });
  }

  private mostrarError(e: HttpErrorResponse): void {
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con la API (¿está corriendo en el puerto 8080?)',
      401: '401: la API no aceptó el token',
      403: '403: el token es válido pero no tiene el rol necesario',
    };
    this.mensaje.set(mensajes[e.status] ?? e.error?.error ?? `Error ${e.status}`);
  }
}
