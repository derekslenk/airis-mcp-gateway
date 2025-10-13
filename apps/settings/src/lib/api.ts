// API Client for AIRIS MCP Gateway

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

export interface MCPServer {
  id: number;
  name: string;
  enabled: boolean;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface MCPServerCreate {
  name: string;
  enabled: boolean;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description?: string;
  category?: string;
}

export interface MCPServerUpdate {
  enabled?: boolean;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
  category?: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // List all MCP servers
  async listServers(): Promise<MCPServer[]> {
    return this.request<MCPServer[]>('/mcp/servers/');
  }

  // Get specific server
  async getServer(id: number): Promise<MCPServer> {
    return this.request<MCPServer>(`/mcp/servers/${id}`);
  }

  // Create server
  async createServer(server: MCPServerCreate): Promise<MCPServer> {
    return this.request<MCPServer>('/mcp/servers/', {
      method: 'POST',
      body: JSON.stringify(server),
    });
  }

  // Update server
  async updateServer(id: number, update: MCPServerUpdate): Promise<MCPServer> {
    return this.request<MCPServer>(`/mcp/servers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }

  // Toggle server enabled status
  async toggleServer(id: number, enabled: boolean): Promise<MCPServer> {
    return this.request<MCPServer>(`/mcp/servers/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // Delete server
  async deleteServer(id: number): Promise<void> {
    await fetch(`${this.baseURL}/mcp/servers/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/../health');
  }
}

export const apiClient = new APIClient(API_BASE_URL);
