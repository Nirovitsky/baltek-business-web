import { queryClient } from "./queryClient";

const API_BASE_URL = "/api";

export interface ApiError {
  message: string;
  status?: number;
}

export class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.message || errorData.detail || response.statusText,
        status: response.status,
      };

      throw error;
    }

    return response.json();
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithRefresh = true,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
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

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // If it's a 401 error and we haven't already retried with refresh
      if (
        error.status === 401 &&
        retryWithRefresh &&
        localStorage.getItem("refresh_token")
      ) {
        try {
          // Use the enhanced refresh method that prevents concurrent refreshes
          await this.performTokenRefresh();
          // Retry the request with new token, but don't retry again
          return this.request<T>(endpoint, options, false);
        } catch (refreshError) {
          // Refresh failed, logout user
          console.log("Token refresh failed, logging out user");
          this.logout();
          throw refreshError;
        }
      }
      throw error;
    }
  }

  async login(credentials: { phone: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Login failed");
    }

    const tokens = await response.json();
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);

    return tokens;
  }

  // Public method for manual refresh (keep for backward compatibility)
  async refreshToken() {
    return this.performTokenRefresh();
  }

  // Enhanced token refresh that prevents concurrent refreshes
  private async performTokenRefresh(): Promise<any> {
    // If already refreshing, wait for the existing refresh
    if (this.isRefreshing && this.refreshPromise) {
      console.log("Token refresh already in progress, waiting...");
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doTokenRefresh(): Promise<any> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      console.log("No refresh token available, logging out");
      this.logout();
      throw new Error("No refresh token available");
    }

    console.log("Refreshing access token...");

    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        console.log("Token refresh failed with status:", response.status);
        this.logout();
        throw new Error("Token refresh failed");
      }

      const tokens = await response.json();
      localStorage.setItem("access_token", tokens.access);

      // Update refresh token if provided
      if (tokens.refresh) {
        localStorage.setItem("refresh_token", tokens.refresh);
      }

      console.log("Access token refreshed successfully");
      return tokens;
    } catch (error) {
      console.error("Token refresh error:", error);
      this.logout();
      throw error;
    }
  }

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    queryClient.clear();
    window.location.href = "/login";
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }

  async uploadFile(
    file: File,
  ): Promise<{ id: number; url: string; name: string }> {
    const formData = new FormData();
    formData.append("path", file);

    const url = `${API_BASE_URL}/files/`;

    // For FormData uploads, only include Authorization header
    // DO NOT set Content-Type - let browser set it automatically with boundary
    const authHeaders = this.getAuthHeaders();
    const headers: Record<string, string> = {};
    if ("Authorization" in authHeaders) {
      headers.Authorization = authHeaders.Authorization as string;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers, // Only auth headers, no Content-Type
        body: formData,
      });

      return await this.handleResponse(response);
    } catch (error: any) {
      if (error.status === 401 && localStorage.getItem("refresh_token")) {
        try {
          await this.performTokenRefresh();
          // Retry upload with new token
          const retryAuthHeaders = this.getAuthHeaders();
          const retryHeaders: Record<string, string> = {};
          if ("Authorization" in retryAuthHeaders) {
            retryHeaders.Authorization =
              retryAuthHeaders.Authorization as string;
          }

          const retryResponse = await fetch(url, {
            method: "POST",
            headers: retryHeaders, // Only auth headers, no Content-Type
            body: formData,
          });
          return await this.handleResponse(retryResponse);
        } catch (refreshError) {
          this.logout();
          throw refreshError;
        }
      }
      throw error;
    }
  }

  // Note: This method is deprecated - use WebSocket with uploaded file IDs instead
  async sendMessageWithAttachment(
    roomId: number,
    text: string,
    attachments: number[],
  ): Promise<any> {
    // This should not be used anymore - messages with attachments should be sent via WebSocket
    // after uploading files and getting their IDs
    throw new Error("Use WebSocket sendMessage with attachments array instead");
  }
}

export const apiService = new ApiService();
