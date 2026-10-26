import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { crearToken } from './core/testing/tokens';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function crear() {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('sin sesión muestra el enlace para iniciar sesión', () => {
    expect(crear().textContent).toContain('Iniciar sesión');
  });

  it('con un token de ADMIN muestra el usuario y el enlace Admin', () => {
    localStorage.setItem('token', crearToken('admin', ['ROLE_ADMIN'], 900));
    const texto = crear().textContent;
    expect(texto).toContain('admin');
    expect(texto).toContain('Admin');
  });
});
