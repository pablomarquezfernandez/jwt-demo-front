import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Exige el rol indicado en data.rol de la ruta. Va después de authGuard: ese ya revisó la sesión.
 */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const rol = route.data['rol'] as string;
  if (auth.tieneRol(rol)) {
    return true;
  }

  return inject(Router).createUrlTree(['/sin-permiso']);
};
