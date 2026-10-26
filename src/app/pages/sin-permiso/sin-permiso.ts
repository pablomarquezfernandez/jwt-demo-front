import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A donde manda rolGuard cuando el token es válido pero le falta el rol. */
@Component({
  selector: 'app-sin-permiso',
  imports: [RouterLink],
  template: `
    <h1>Sin permiso</h1>
    <p class="tarjeta">Tu sesión es válida, pero esta página exige el rol ADMIN. <a routerLink="/productos">Volver</a></p>
  `,
})
export class SinPermiso {}
