import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, finalize, shareReplay, tap } from 'rxjs';

import { API_URL } from '../api';
import { LoginResponse, TokenPayload } from '../models';

const CLAVE_TOKEN = 'token';
const CLAVE_REFRESH = 'refreshToken';

/**
 * Único lugar que sabe dónde están los tokens. Los guards y los interceptors le preguntan a él.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = `${API_URL}/auth`;

  /** Refresh en curso: varias peticiones con 401 lo comparten en lugar de pedir uno cada una. */
  private refresco$?: Observable<LoginResponse>;

  /** Usuario de la sesión (el "sub" del token), para mostrarlo en la barra de navegación. */
  readonly usuario = signal<string | null>(this.leerPayload()?.sub ?? null);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, { username, password })
      .pipe(tap((respuesta) => this.guardar(respuesta)));
  }

  /**
   * Canjea el refresh token por tokens nuevos. Si ya hay un refresh en curso, devuelve ese mismo:
   * shareReplay reparte la respuesta y finalize lo libera cuando termina.
   */
  refrescar(): Observable<LoginResponse> {
    this.refresco$ ??= this.http
      .post<LoginResponse>(`${this.api}/refresh`, { refreshToken: this.getRefreshToken() })
      .pipe(
        tap((respuesta) => this.guardar(respuesta)),
        finalize(() => (this.refresco$ = undefined)),
        shareReplay(1),
      );
    return this.refresco$;
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_REFRESH);
    this.usuario.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(CLAVE_REFRESH);
  }

  /** Hay access token y no ha vencido (exp viene en segundos, Date.now() en milisegundos). */
  estaAutenticado(): boolean {
    const payload = this.leerPayload();
    return !!payload && payload.exp * 1000 > Date.now();
  }

  /** El rol llega como ROLE_ADMIN: Spring agrega el prefijo ROLE_ al usar .roles("ADMIN"). */
  tieneRol(rol: string): boolean {
    return this.leerPayload()?.roles?.includes(rol) ?? false;
  }

  /** Lee el payload del access token. Decodificar no es verificar: la firma la valida el backend. */
  leerPayload(): TokenPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  private guardar(respuesta: LoginResponse): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_REFRESH, respuesta.refreshToken);
    this.usuario.set(this.leerPayload()?.sub ?? null);
  }
}
