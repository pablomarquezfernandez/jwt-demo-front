import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';
import { Admin } from './pages/admin/admin';
import { Login } from './pages/login/login';
import { Perfil } from './pages/perfil/perfil';
import { Productos } from './pages/productos/productos';
import { SinPermiso } from './pages/sin-permiso/sin-permiso';

/** Reflejan las reglas de SecurityConfig en el backend. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },
  { path: 'login', component: Login },
  // Público
  { path: 'productos', component: Productos },
  // Con token
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  // Con token y rol ADMIN: los guards corren en orden, primero la sesión y luego el rol
  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard, rolGuard],
    data: { rol: 'ROLE_ADMIN' },
  },
  { path: 'sin-permiso', component: SinPermiso },
  { path: '**', redirectTo: 'productos' },
];
