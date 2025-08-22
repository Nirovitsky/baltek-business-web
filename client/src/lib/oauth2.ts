import { queryClient } from "./queryClient";

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.baltek.net/api";
const OAUTH2_BASE_URL = import.meta.env.VITE_OAUTH2_BASE_URL || `${API_BASE_URL}/oauth2`;
const DISCOVERY_URL = `${OAUTH2_BASE_URL}/.well-known/openid-configuration/`;

// OAuth2 Configuration for Public Client
const OAUTH2_CONFIG = {
  clientId: import.meta.env.VITE_OAUTH2_CLIENT_ID, // Required from Replit Secrets
  redirectUri: `${window.location.origin}/oauth/callback`,
  scope: import.meta.env.VITE_OAUTH2_SCOPE || "read write",
  responseType: import.meta.env.VITE_OAUTH2_RESPONSE_TYPE || "code",
  // Public client configuration
  clientType: "public",
};

// Cache for OpenID configuration
let oidcConfig: any = null;

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
   * Fetch OpenID Connect configuration
   */
  private async getOIDCConfig(): Promise<any> {
    if (oidcConfig) {
      return oidcConfig;
    }

    try {
      const response = await fetch(DISCOVERY_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch OIDC configuration');
      }
      oidcConfig = await response.json();
      console.log('OIDC Configuration loaded:', oidcConfig);
      return oidcConfig;
    } catch (error) {
      console.error('Failed to load OIDC configuration:', error);
      // Fallback to manual endpoints
      oidcConfig = {
        authorization_endpoint: `${OAUTH2_BASE_URL}/authorize/`,
        token_endpoint: `${OAUTH2_BASE_URL}/token/`,
        userinfo_endpoint: `${OAUTH2_BASE_URL}/userinfo/`,
        revocation_endpoint: `${OAUTH2_BASE_URL}/revoke_token/`,
        end_session_endpoint: `${OAUTH2_BASE_URL}/logout/`,
      };
      return oidcConfig;
    }
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Start OAuth2 authorization flow
   */
  async initiateLogin(): Promise<void> {
    try {
      const config = await this.getOIDCConfig();
      const state = this.generateState();
      localStorage.setItem("oauth2_state", state);

      const params = new URLSearchParams({
        client_id: OAUTH2_CONFIG.clientId,
        redirect_uri: OAUTH2_CONFIG.redirectUri,
        response_type: OAUTH2_CONFIG.responseType,
        scope: OAUTH2_CONFIG.scope,
        state: state,
      });

      const authUrl = `${config.authorization_endpoint}?${params.toString()}`;
      console.log('Redirecting to OAuth2 authorization:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate OAuth2 login:', error);
      throw error;
    }
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
      const config = await this.getOIDCConfig();
      const response = await fetch(config.token_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: OAUTH2_CONFIG.clientId,
          code: code,
          redirect_uri: OAUTH2_CONFIG.redirectUri,
          // No client_secret needed for public clients
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token exchange error:', errorData);
        throw new Error(errorData.error_description || errorData.error || "Token exchange failed");
      }

      const tokens = await response.json();
      console.log('Token exchange successful');
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
      const config = await this.getOIDCConfig();
      const response = await fetch(config.token_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: OAUTH2_CONFIG.clientId,
          refresh_token: refreshToken,
          // No client_secret needed for public clients
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh error:', errorData);
        throw new Error(errorData.error_description || errorData.error || "Token refresh failed");
      }

      const tokens = await response.json();
      console.log('Token refresh successful');
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
    try {
      const config = await this.getOIDCConfig();
      const response = await fetch(config.userinfo_endpoint, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem("refresh_token");
    
    try {
      const config = await this.getOIDCConfig();
      
      // Try to revoke refresh token
      if (refreshToken && config.revocation_endpoint) {
        try {
          await fetch(config.revocation_endpoint, {
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
      if (config.end_session_endpoint) {
        window.location.href = config.end_session_endpoint;
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: just clear tokens and redirect
      this.clearTokens();
      queryClient.clear();
      window.location.href = '/login';
    }
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