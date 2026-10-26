import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_URL } from '../api';
import { AuthService } from '../services/auth.service';

/** El access token solo viaja a nuestra API, y nunca a /auth/ (login, registro y refresh). */
export function necesitaToken(url: string): boolean {
  return url.startsWith(API_URL) && !url.startsWith(`${API_URL}/auth/`);
}

/**
 * Agrega "Authorization: Bearer <token>" a cada petición: ningún servicio tiene que hacerlo a mano.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token || !necesitaToken(req.url)) {
    return next(req);
  }

  // La petición es inmutable: se clona con el header
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq);
};
