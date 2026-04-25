import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // ✅ makes this service globally injectable
})
export class AuthService {
  private _isLoggedIn: boolean = false;

  constructor() {}

  // Login method
  login(email: string, password: string): boolean {
    // Dummy check — replace with real authentication logic
    if (email === 'admin@example.com' && password === '1234') {
      this._isLoggedIn = true;
      return true;
    }
    this._isLoggedIn = false;
    return false;
  }

  // Getter for login status
  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  logout(): void {
    this._isLoggedIn = false;
  }
}