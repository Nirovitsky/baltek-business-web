import { apiService } from './api';
import type { LoginRequest, TokenResponse } from '@shared/schema';

export class AuthService {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    return apiService.login(credentials);
  }

  logout(): void {
    apiService.logout();
  }

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  async refreshToken(): Promise<TokenResponse> {
    return apiService.refreshToken();
  }
}

export const authService = new AuthService();
