import { LoginResponse } from '../models';

function base64Url(texto: string): string {
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Arma un JWT de prueba: jwt-decode solo lee el payload, así que la firma no importa aquí. */
export function crearToken(sub: string, roles: string[], segundosParaVencer: number): string {
  const ahora = Math.floor(Date.now() / 1000);
  const payload = { sub, roles, iss: 'jwt-demo', iat: ahora, exp: ahora + segundosParaVencer };
  return `${base64Url(JSON.stringify({ alg: 'HS256' }))}.${base64Url(JSON.stringify(payload))}.firma`;
}

export function respuestaLogin(token: string): LoginResponse {
  return { token, refreshToken: 'refresh-nuevo', tipo: 'Bearer', expiraEnSegundos: 900 };
}
