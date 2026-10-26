import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { API_URL } from '../../core/api';
import { Usuario } from '../../core/models';

/** Ruta protegida por authGuard y rolGuard (data.rol = ROLE_ADMIN). */
@Component({
  selector: 'app-admin',
  template: `
    <h1>Administración <small>(authGuard + rolGuard)</small></h1>
    <ul class="tarjeta lista">
      @for (usuario of usuarios(); track usuario.id) {
        <li>{{ usuario.username }} · {{ usuario.rol }}</li>
      }
    </ul>
  `,
})
export class Admin {
  readonly usuarios = toSignal(inject(HttpClient).get<Usuario[]>(`${API_URL}/api/admin/usuarios`), {
    initialValue: [],
  });
}
