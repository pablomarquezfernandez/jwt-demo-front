import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../api';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('agrega Authorization: Bearer a las peticiones de la API', () => {
    localStorage.setItem('token', 'abc');
    http.get(`${API_URL}/api/perfil`).subscribe();

    expect(backend.expectOne(`${API_URL}/api/perfil`).request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('no envía el token a /auth/ ni a otros dominios', () => {
    localStorage.setItem('token', 'abc');
    http.post(`${API_URL}/auth/login`, {}).subscribe();
    http.get('https://otro-sitio.com/datos').subscribe();

    expect(backend.expectOne(`${API_URL}/auth/login`).request.headers.has('Authorization')).toBe(false);
    expect(backend.expectOne('https://otro-sitio.com/datos').request.headers.has('Authorization')).toBe(false);
  });

  it('sin token deja la petición como está', () => {
    http.get(`${API_URL}/api/productos`).subscribe();

    expect(backend.expectOne(`${API_URL}/api/productos`).request.headers.has('Authorization')).toBe(false);
  });
});
