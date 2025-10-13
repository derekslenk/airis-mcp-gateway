import { useState, useEffect } from 'react';
import { MCPServerCard } from './components/MCPServerCard';
import { ConfigEditor } from './components/ConfigEditor';
import { StatusIndicator } from './components/StatusIndicator';
import { apiClient, MCPServer } from '../../lib/api';

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

  const handleSaveApiKey = async (id: number, apiKey: string) => {
    try {
      const updated = await apiClient.updateServer(id, {
        env: { ...servers.find(s => s.id === id)?.env, API_KEY: apiKey }
      });
      setServers(servers.map(s => s.id === id ? updated : s));
      alert('API Key saved successfully');
    } catch (err) {
      console.error('Failed to save API key:', err);
      alert(`Failed to save API key: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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

  const defaultServers = servers.filter(s => s.category !== 'custom');
  const customServers = servers.filter(s => s.category === 'custom');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">MCP Server Dashboard</h1>
            <p className="text-slate-300">Manage your MCP servers and API keys</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator servers={servers} />
            <button
              onClick={exportConfig}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Edit JSON Config
            </button>
          </div>
        </div>

        {/* Default Servers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Default Servers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultServers.map(server => (
              <MCPServerCard
                key={server.id}
                server={server}
                onToggle={handleToggle}
                onSaveApiKey={handleSaveApiKey}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>

        {/* Custom Servers */}
        {customServers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Custom Servers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customServers.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={handleToggle}
                  onSaveApiKey={handleSaveApiKey}
                  onDelete={handleDelete}
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
