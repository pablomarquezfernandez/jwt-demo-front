import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';

import { API_URL } from '../api';
import { crearToken, respuestaLogin } from '../testing/tokens';
import { authGuard } from './auth.guard';
import { rolGuard } from './rol.guard';

describe('guards', () => {
  const estado = { url: '/perfil' } as RouterStateSnapshot;
  const rutaAdmin = { data: { rol: 'ROLE_ADMIN' } } as unknown as ActivatedRouteSnapshot;

  const ejecutarAuth = () => TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, estado));
  const ejecutarRol = () => TestBed.runInInjectionContext(() => rolGuard(rutaAdmin, estado));
  const url = (resultado: unknown) => TestBed.inject(Router).serializeUrl(resultado as UrlTree);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('authGuard deja pasar con un token vigente', () => {
    localStorage.setItem('token', crearToken('ana', ['ROLE_USER'], 900));
    expect(ejecutarAuth()).toBe(true);
  });

  it('authGuard sin token manda al login con returnUrl', () => {
    expect(url(ejecutarAuth())).toBe('/login?returnUrl=%2Fperfil');
  });

  it('authGuard con el token vencido intenta un refresh antes de mandar al login', async () => {
    localStorage.setItem('token', crearToken('ana', ['ROLE_USER'], -60));
    localStorage.setItem('refreshToken', 'refresh-viejo');

    const resultado = firstValueFrom(ejecutarAuth() as Observable<boolean | UrlTree>);
    TestBed.inject(HttpTestingController)
      .expectOne(`${API_URL}/auth/refresh`)
      .flush(respuestaLogin(crearToken('ana', ['ROLE_USER'], 900)));

    expect(await resultado).toBe(true);
  });

  it('rolGuard exige el rol de data.rol', () => {
    localStorage.setItem('token', crearToken('ana', ['ROLE_USER'], 900));
    expect(url(ejecutarRol())).toBe('/sin-permiso');

    localStorage.setItem('token', crearToken('admin', ['ROLE_ADMIN'], 900));
    expect(ejecutarRol()).toBe(true);
  });
});
