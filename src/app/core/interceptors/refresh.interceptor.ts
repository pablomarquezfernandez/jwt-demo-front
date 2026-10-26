import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { necesitaToken } from './auth.interceptor';

/**
 * Si la API responde 401 (access token vencido), pide tokens nuevos y repite la petición original.
 * Si el refresh también falla, cierra la sesión. Se registra después de authInterceptor.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  // Se inyectan aquí: dentro de catchError ya no hay contexto de inyección
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo 401 de nuestra API, y nunca sobre /auth/ (evita bucles con el propio refresh)
      if (error.status !== 401 || !necesitaToken(req.url) || !auth.getRefreshToken()) {
        return throwError(() => error);
      }
      return auth.refrescar().pipe(
        catchError((errorRefresh) => {
          // El refresh también falló: fin de la sesión
          auth.logout();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => errorRefresh);
        }),
        // Repite la petición original con el token nuevo
        switchMap((respuesta) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${respuesta.token}` } })),
        ),
      );
    }),
  );
};
