import { oauth2Service } from "./oauth2";
import { queryClient } from "./queryClient";

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.baltek.net/api";

export interface ApiError {
  message: string;
  status?: number;
}

export class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  private getAuthHeaders(): HeadersInit {
    return oauth2Service.getAuthHeaders();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', { status: response.status, data: errorData });
      
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
    return oauth2Service.request<T>(endpoint, options, retryWithRefresh);
  }

  // Legacy login method - now redirects to OAuth2
  async login(credentials: { phone: string; password: string }) {
    throw new Error("Legacy login is deprecated. Use OAuth2 authentication.");
  }

  // Public method for manual refresh (keep for backward compatibility)
  async refreshToken() {
    return oauth2Service.refreshToken();
  }

  logout() {
    oauth2Service.logout();
  }

  isAuthenticated(): boolean {
    return oauth2Service.isAuthenticated();
  }

  async uploadFile(
    file: File,
  ): Promise<{ id: number; url: string; name: string }> {
    const formData = new FormData();
    formData.append("path", file);

    const url = `${API_BASE_URL}/files/`;

    // Create headers WITHOUT Content-Type for FormData
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Explicitly DO NOT set Content-Type - browser will set multipart/form-data with boundary

    const uploadRequest = async (authToken?: string) => {
      const requestHeaders: Record<string, string> = {};
      if (authToken) {
        requestHeaders.Authorization = `Bearer ${authToken}`;
      }

      console.log('Upload request headers:', requestHeaders);
      console.log('FormData created with file');

      const response = await fetch(url, {
        method: "POST",
        headers: requestHeaders, // No Content-Type header!
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Upload error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        const error: ApiError = {
          message: errorData.message || errorData.detail || response.statusText,
          status: response.status,
        };
        throw error;
      }

      return response.json();
    };

    try {
      return await uploadRequest(token || undefined);
    } catch (error: any) {
      // Handle 401 errors with token refresh
      if (error.status === 401 && localStorage.getItem("refresh_token")) {
        try {
          await oauth2Service.refreshToken();
          const newToken = oauth2Service.getAccessToken();
          return await uploadRequest(newToken || undefined);
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
