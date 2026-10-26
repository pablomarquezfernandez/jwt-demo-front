import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_URL } from '../api';
import { crearToken, respuestaLogin } from '../testing/tokens';
import { authInterceptor } from './auth.interceptor';
import { refreshInterceptor } from './refresh.interceptor';

describe('refreshInterceptor', () => {
  const perfil = `${API_URL}/api/perfil`;
  const refresh = `${API_URL}/auth/refresh`;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'vencido');
    localStorage.setItem('refreshToken', 'refresh-viejo');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('ante un 401 refresca el token y repite la petición', () => {
    const nuevo = crearToken('ana', ['ROLE_USER'], 900);
    let resultado: unknown;
    http.get(perfil).subscribe((r) => (resultado = r));

    backend.expectOne(perfil).flush(null, { status: 401, statusText: 'Unauthorized' });
    const peticionRefresh = backend.expectOne(refresh);
    expect(peticionRefresh.request.body).toEqual({ refreshToken: 'refresh-viejo' });
    peticionRefresh.flush(respuestaLogin(nuevo));

    const reintento = backend.expectOne(perfil);
    expect(reintento.request.headers.get('Authorization')).toBe(`Bearer ${nuevo}`);
    reintento.flush({ username: 'ana' });

    expect(resultado).toEqual({ username: 'ana' });
    expect(localStorage.getItem('token')).toBe(nuevo);
    expect(localStorage.getItem('refreshToken')).toBe('refresh-nuevo');
  });

  it('varias peticiones con 401 comparten un solo refresh', () => {
    const nuevo = crearToken('ana', ['ROLE_USER'], 900);
    http.get(perfil).subscribe();
    http.get(perfil).subscribe();
    http.get(perfil).subscribe();

    backend.match(perfil).forEach((p) => p.flush(null, { status: 401, statusText: 'Unauthorized' }));
    backend.expectOne(refresh).flush(respuestaLogin(nuevo));

    const reintentos = backend.match(perfil);
    expect(reintentos.length).toBe(3);
    reintentos.forEach((p) => p.flush({}));
  });

  it('si el refresh falla cierra la sesión y manda al login', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let estado = 0;
    http.get(perfil).subscribe({ error: (e) => (estado = e.status) });

    backend.expectOne(perfil).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(refresh).flush({ error: 'Refresh token inválido o expirado' }, { status: 401, statusText: 'Unauthorized' });

    expect(estado).toBe(401);
    expect(localStorage.getItem('token')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('un 403 no dispara el refresh', () => {
    let estado = 0;
    http.get(`${API_URL}/api/admin/usuarios`).subscribe({ error: (e) => (estado = e.status) });

    backend.expectOne(`${API_URL}/api/admin/usuarios`).flush(null, { status: 403, statusText: 'Forbidden' });

    backend.expectNone(refresh);
    expect(estado).toBe(403);
  });
});
