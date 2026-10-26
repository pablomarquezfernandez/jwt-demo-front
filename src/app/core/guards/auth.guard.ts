import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Deja entrar solo con una sesión vigente. Si el access token venció pero queda refresh token,
 * intenta renovarlo antes de mandar al login. Es experiencia de usuario: la API valida igual.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.estaAutenticado()) {
    return true;
  }

  // Manda al login y recuerda a dónde quería ir
  const login = inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });

  if (!auth.getRefreshToken()) {
    return login;
  }
  return auth.refrescar().pipe(
    map(() => true),
    catchError(() => {
      auth.logout();
      return of(login);
    }),
  );
};
