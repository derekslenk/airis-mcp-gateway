import { useState, useEffect } from 'react';
import { MCPServerCard } from './components/MCPServerCard';
import { ConfigEditor } from './components/ConfigEditor';
import { StatusIndicator } from './components/StatusIndicator';
import { apiClient, MCPServer } from '../../lib/api';
import { requiresApiKeys } from '../../lib/serverConfig';

export default function MCPDashboard() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [configJson, setConfigJson] = useState('');

  // Fetch servers from API
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.listServers();
      setServers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
      console.error('Failed to load servers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      const updated = await apiClient.toggleServer(id, enabled);
      setServers(servers.map(s => s.id === id ? updated : s));
    } catch (err) {
      console.error('Failed to toggle server:', err);
      alert(`Failed to toggle server: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSecretsUpdated = () => {
    // Refresh servers list to reflect any changes
    loadServers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this server?')) return;

    try {
      await apiClient.deleteServer(id);
      setServers(servers.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete server:', err);
      alert(`Failed to delete server: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const config = JSON.parse(configJson);
      // TODO: Implement bulk config update API
      console.log('Save config:', config);
      setShowEditor(false);
      alert('Configuration saved (bulk update not yet implemented)');
    } catch (err) {
      alert('Invalid JSON format');
    }
  };

  const exportConfig = () => {
    const config = {
      mcpServers: servers.reduce((acc, server) => {
        acc[server.name] = {
          command: server.command,
          args: server.args,
          env: server.env || {}
        };
        return acc;
      }, {} as Record<string, any>)
    };
    setConfigJson(JSON.stringify(config, null, 2));
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading servers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">Error</h2>
          <p className="text-white">{error}</p>
          <button
            onClick={loadServers}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Organize servers by status
  const activeServers = servers.filter(s => s.enabled);
  const needsApiKeys = servers.filter(s => !s.enabled && requiresApiKeys(s.name));
  const readyToEnable = servers.filter(s => !s.enabled && !requiresApiKeys(s.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">MCP Server Dashboard</h1>
            <p className="text-sm text-slate-300">Manage your MCP servers and API keys (encrypted)</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusIndicator servers={servers} />
            <button
              onClick={exportConfig}
              className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Edit JSON Config
            </button>
          </div>
        </div>

        {/* Active Servers */}
        {activeServers.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              アクティブ
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({activeServers.length}個)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeServers.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onSecretsUpdated={handleSecretsUpdated}
                />
              ))}
            </div>
          </section>
        )}

        {/* Needs API Keys */}
        {needsApiKeys.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              APIキー設定待ち
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({needsApiKeys.length}個)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {needsApiKeys.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onSecretsUpdated={handleSecretsUpdated}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ready to Enable */}
        {readyToEnable.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
              有効化可能
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({readyToEnable.length}個)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {readyToEnable.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onSecretsUpdated={handleSecretsUpdated}
                />
              ))}
            </div>
          </section>
        )}

        {/* Config Editor Modal */}
        {showEditor && (
          <ConfigEditor
            config={configJson}
            onSave={handleSaveConfig}
            onCancel={() => setShowEditor(false)}
            onChange={setConfigJson}
          />
        )}
      </div>
    </div>
  );
}
