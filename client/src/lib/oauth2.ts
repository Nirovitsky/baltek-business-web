import { queryClient } from "./queryClient";

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.baltek.net/api";
const OAUTH2_BASE_URL = import.meta.env.VITE_OAUTH2_BASE_URL || `${API_BASE_URL}/oauth2`;

// OAuth2 Configuration
const OAUTH2_CONFIG = {
  clientId: import.meta.env.VITE_OAUTH2_CLIENT_ID || "baltek-business-app",
  redirectUri: `${window.location.origin}/oauth/callback`,
  scope: import.meta.env.VITE_OAUTH2_SCOPE || "read write",
  responseType: import.meta.env.VITE_OAUTH2_RESPONSE_TYPE || "code",
};

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface UserInfo {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar?: string;
}

export class OAuth2Service {
  private isRefreshing = false;
  private refreshPromise: Promise<TokenResponse> | null = null;

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Start OAuth2 authorization flow
   */
  initiateLogin(): void {
    const state = this.generateState();
    localStorage.setItem("oauth2_state", state);

    const params = new URLSearchParams({
      client_id: OAUTH2_CONFIG.clientId,
      redirect_uri: OAUTH2_CONFIG.redirectUri,
      response_type: OAUTH2_CONFIG.responseType,
      scope: OAUTH2_CONFIG.scope,
      state: state,
    });

    const authUrl = `${OAUTH2_BASE_URL}/authorize/?${params.toString()}`;
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth2 callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    // Verify state parameter
    const storedState = localStorage.getItem("oauth2_state");
    if (!storedState || storedState !== state) {
      throw new Error("Invalid state parameter. Possible CSRF attack.");
    }

    // Clean up stored state
    localStorage.removeItem("oauth2_state");

    try {
      const response = await fetch(`${OAUTH2_BASE_URL}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: OAUTH2_CONFIG.clientId,
          code: code,
          redirect_uri: OAUTH2_CONFIG.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || errorData.error || "Token exchange failed");
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error("OAuth2 callback error:", error);
      throw error;
    }
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(tokens: TokenResponse): void {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("token_type", tokens.token_type || "Bearer");
    
    // Calculate and store expiration time
    if (tokens.expires_in) {
      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem("token_expires_at", expiresAt.toString());
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    const expiresAt = localStorage.getItem("token_expires_at");
    if (expiresAt && Date.now() >= parseInt(expiresAt)) {
      return false;
    }

    return true;
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    const tokenType = localStorage.getItem("token_type") || "Bearer";
    return token ? { Authorization: `${tokenType} ${token}` } : {};
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<TokenResponse> {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await fetch(`${OAUTH2_BASE_URL}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: OAUTH2_CONFIG.clientId,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || errorData.error || "Token refresh failed");
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error("Token refresh error:", error);
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<UserInfo> {
    const response = await fetch(`${OAUTH2_BASE_URL}/userinfo/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    return response.json();
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem("refresh_token");
    
    // Try to revoke refresh token
    if (refreshToken) {
      try {
        await fetch(`${OAUTH2_BASE_URL}/revoke_token/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: refreshToken,
            client_id: OAUTH2_CONFIG.clientId,
          }),
        });
      } catch (error) {
        console.error("Token revocation failed:", error);
      }
    }

    // Clear local storage and redirect
    this.clearTokens();
    queryClient.clear();
    
    // Redirect to logout endpoint for proper cleanup
    const logoutUrl = `${OAUTH2_BASE_URL}/logout/`;
    window.location.href = logoutUrl;
  }

  /**
   * Clear all stored tokens
   */
  private clearTokens(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("oauth2_state");
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithRefresh = true
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = {
          message: errorData.message || errorData.detail || response.statusText,
          status: response.status,
        };
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // If it's a 401 error and we haven't already retried with refresh
      if (
        error.status === 401 &&
        retryWithRefresh &&
        localStorage.getItem("refresh_token")
      ) {
        try {
          await this.refreshToken();
          // Retry the request with new token, but don't retry again
          return this.request<T>(endpoint, options, false);
        } catch (refreshError) {
          // Refresh failed, logout user
          console.log("Token refresh failed, logging out user");
          this.clearTokens();
          this.initiateLogin();
          throw refreshError;
        }
      }
      throw error;
    }
  }
}

export const oauth2Service = new OAuth2Service();