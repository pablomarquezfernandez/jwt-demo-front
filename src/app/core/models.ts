/** Lo que devuelven /auth/login y /auth/refresh (LoginResponse en el backend). */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  tipo: string;
  expiraEnSegundos: number;
}

/** Payload del access token que arma JwtService.generarToken. */
export interface TokenPayload {
  sub: string;
  roles: string[];
  iss: string;
  iat: number;
  exp: number;
}

export interface Usuario {
  id: number;
  username: string;
  rol: 'USER' | 'ADMIN';
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
}
