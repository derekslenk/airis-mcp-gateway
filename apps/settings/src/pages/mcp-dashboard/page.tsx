
import { useState, useEffect } from 'react';
import { MCPServerCard } from './components/MCPServerCard';
import { ConfigEditor } from './components/ConfigEditor';
import { TipsModal } from './components/TipsModal';
import { MultiFieldConfigModal } from './components/MultiFieldConfigModal';
import { getServerConfigSchema } from '../../types/mcp-config';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  apiKeyRequired: boolean;
  apiKey?: string;
  status: 'connected' | 'disconnected' | 'error';
  category: string;
  recommended: boolean;
  builtin: boolean;
}

export default function MCPDashboard() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [configModalServer, setConfigModalServer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load server list, secrets, and toggle states from database on mount
  useEffect(() => {
    const loadServerData = async () => {
      try {
        // Load server list from mcp-config.json
        const serversResponse = await fetch('http://localhost:9000/api/v1/mcp-config/servers');
        if (!serversResponse.ok) {
          console.error('Failed to load server list');
          setIsLoading(false);
          return;
        }
        const serversData = await serversResponse.json();
        const serverList = serversData.servers || [];

        // Load saved secrets
        const secretsResponse = await fetch('http://localhost:9000/api/v1/secrets/');
        const secretsData = secretsResponse.ok ? await secretsResponse.json() : { secrets: [] };
        const savedSecrets = secretsData.secrets || [];

        // Group secrets by server_name
        const secretsByServer: Record<string, string[]> = {};
        savedSecrets.forEach((secret: any) => {
          if (!secretsByServer[secret.server_name]) {
            secretsByServer[secret.server_name] = [];
          }
          secretsByServer[secret.server_name].push(secret.key_name);
        });

        // Load server states (toggle persistence)
        const statesResponse = await fetch('http://localhost:9000/api/v1/server-states/');
        const statesData = statesResponse.ok ? await statesResponse.json() : { server_states: [] };
        const serverStates = statesData.server_states || [];

        // Create state lookup map
        const statesByServer: Record<string, boolean> = {};
        serverStates.forEach((state: any) => {
          statesByServer[state.server_id] = state.enabled;
        });

        // Merge server list with secrets and toggle states
        const mergedServers: MCPServer[] = serverList.map((server: any) => {
          const hasSecrets = secretsByServer[server.id]?.length > 0;
          const hasState = server.id in statesByServer;

          // Determine enabled state: DB state (highest priority) > default (recommended)
          // Note: Don't auto-enable based on secrets, user must explicitly toggle
          let enabled = server.recommended; // Default
          if (hasState) {
            // DB state has highest priority - always use it
            enabled = statesByServer[server.id];
          }

          return {
            id: server.id,
            name: server.name,
            description: server.description,
            enabled: enabled,
            apiKeyRequired: server.apiKeyRequired,
            apiKey: hasSecrets ? 'configured' : undefined,
            status: enabled ? ('connected' as const) : ('disconnected' as const),
            category: server.category,
            recommended: server.recommended,
            builtin: server.builtin
          };
        });

        setServers(mergedServers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading server data:', error);
        setIsLoading(false);
      }
    };

    loadServerData();
  }, []);

  const toggleServer = async (id: string) => {
    const currentServer = servers.find(s => s.id === id);
    if (!currentServer) return;

    const newEnabledState = !currentServer.enabled;

    // Check if enabling a server that requires API key
    if (newEnabledState && currentServer.apiKeyRequired && !currentServer.apiKey) {
      alert('このサーバーを有効にするには、まずAPIキーを設定してください。');
      return;
    }

    // If enabling server with API key, validate it first
    if (newEnabledState && currentServer.apiKey && currentServer.apiKey !== 'configured') {
      try {
        // Fetch saved secrets for validation
        const secretsResponse = await fetch('http://localhost:9000/api/v1/secrets/');
        if (!secretsResponse.ok) {
          alert('設定の取得に失敗しました');
          return;
        }

        const secretsData = await secretsResponse.json();
        const savedSecrets = secretsData.secrets || [];

        // Build config from saved secrets
        const config: Record<string, string> = {};
        savedSecrets.forEach((secret: any) => {
          if (secret.server_name === id) {
            config[secret.key_name] = secret.value;
          }
        });

        if (Object.keys(config).length === 0) {
          alert('このサーバーの設定が見つかりません。APIキーを再設定してください。');
          return;
        }

        // Validate configuration
        const validateResponse = await fetch(`http://localhost:9000/api/v1/validate/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server_id: id,
            config: config
          })
        });

        if (!validateResponse.ok) {
          alert('バリデーションリクエストに失敗しました');
          return;
        }

        const validation = await validateResponse.json();
        if (!validation.valid) {
          alert(`接続テスト失敗: ${validation.message}\n\nAPIキーが正しいか確認してください。`);
          return;
        }

        // Validation succeeded, show success message
        alert(`接続成功: ${validation.message}`);
      } catch (error) {
        console.error('Validation error:', error);
        alert(`エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }

    // Optimistic update
    setServers(prev => prev.map(server =>
      server.id === id
        ? { ...server, enabled: newEnabledState, status: newEnabledState ? 'connected' : 'disconnected' }
        : server
    ));

    // Persist to database
    try {
      const response = await fetch(`http://localhost:9000/api/v1/server-states/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: newEnabledState
        })
      });

      if (!response.ok) {
        console.error('Failed to persist server state');
        // Rollback on failure
        setServers(prev => prev.map(server =>
          server.id === id
            ? { ...server, enabled: currentServer.enabled, status: currentServer.status }
            : server
        ));
      }
    } catch (error) {
      console.error('Error persisting server state:', error);
    }
  };

  const updateApiKey = async (id: string, apiKey: string) => {
    // Check if server has multiple fields configuration
    const schema = getServerConfigSchema(id);

    if (schema && schema.configType !== 'single') {
      // Show multi-field modal
      setConfigModalServer(id);
      return;
    }

    // Single field configuration - legacy flow
    const keyNameMap: Record<string, string> = {
      'tavily': 'TAVILY_API_KEY',
      'stripe': 'STRIPE_SECRET_KEY',
      'figma': 'FIGMA_ACCESS_TOKEN',
      'github': 'GITHUB_PERSONAL_ACCESS_TOKEN',
      'notion': 'NOTION_API_KEY',
      'brave-search': 'BRAVE_API_KEY',
    };

    const keyName = keyNameMap[id];
    if (!keyName) {
      alert(`Unknown server: ${id}`);
      return;
    }

    try {
      // Save to API
      const response = await fetch('http://localhost:9000/api/v1/secrets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_name: id,
          key_name: keyName,
          value: apiKey
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save API key');
      }

      // Save enabled state to DB
      await fetch(`http://localhost:9000/api/v1/server-states/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });

      // Update local state
      setServers(prev => prev.map(server =>
        server.id === id
          ? {
              ...server,
              apiKey,
              enabled: true,
              status: 'connected' as const
            }
          : server
      ));

      // Restart Gateway to apply changes
      alert('APIキーを保存しました。Gatewayを再起動しています...');

      const restartResponse = await fetch('http://localhost:9000/api/v1/gateway/restart', {
        method: 'POST'
      });

      if (restartResponse.ok) {
        alert('Gateway再起動完了！ツールが利用可能になりました。');
      } else {
        alert('Gateway再起動に失敗しました。手動で再起動してください。');
      }

    } catch (error) {
      alert(`エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveMultiFieldConfig = async (serverId: string, config: Record<string, string>) => {
    try {
      // Save all fields to API
      for (const [keyName, value] of Object.entries(config)) {
        const response = await fetch('http://localhost:9000/api/v1/secrets/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server_name: serverId,
            key_name: keyName,
            value: value
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || `Failed to save ${keyName}`);
        }
      }

      // Save enabled state to DB
      await fetch(`http://localhost:9000/api/v1/server-states/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });

      // Update local state
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? {
              ...server,
              apiKey: 'configured',
              enabled: true,
              status: 'connected' as const
            }
          : server
      ));

      // Restart Gateway to apply changes
      alert('設定を保存しました。Gatewayを再起動しています...');

      const restartResponse = await fetch('http://localhost:9000/api/v1/gateway/restart', {
        method: 'POST'
      });

      if (restartResponse.ok) {
        alert('Gateway再起動完了！ツールが利用可能になりました。');
      } else {
        alert('Gateway再起動に失敗しました。手動で再起動してください。');
      }

    } catch (error) {
      throw error; // Re-throw for modal to handle
    }
  };

  const applyOfficialRecommended = (withApi: boolean = false) => {
    setServers(prev => prev.map(server => {
      // 公式推奨（APIなし）の設定
      const officialNoApi = [
        'sequential-thinking', 'time', 'fetch', 'git', 'memory',
        'filesystem', 'context7', 'serena', 'mindbase'
      ];
      
      // 公式推奨（APIあり）の追加設定
      const officialWithApi = ['tavily', 'supabase', 'github', 'brave-search'];
      
      if (officialNoApi.includes(server.id)) {
        return { ...server, enabled: true, status: 'connected' as const };
      }
      
      if (withApi && officialWithApi.includes(server.id) && server.apiKey) {
        return { ...server, enabled: true, status: 'connected' as const };
      }
      
      return { ...server, enabled: false, status: 'disconnected' as const };
    }));
  };

  const activeServers = servers.filter(s => s.enabled && s.status === 'connected');
  const needsApiKey = servers.filter(s => s.apiKeyRequired && !s.apiKey);
  const disabledServers = servers.filter(s => !s.enabled && (!s.apiKeyRequired || s.apiKey));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">MCP Gateway Dashboard</h1>
              <p className="text-sm text-gray-600">MCPサーバー管理 - {servers.length}個のサーバー</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">{activeServers.length}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-gray-600">{servers.length} アクティブ</span>
              </div>
              
              {/* 公式推奨設定ボタン */}
              <div className="flex gap-2">
                <button
                  onClick={() => applyOfficialRecommended(false)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <i className="ri-star-line mr-1"></i>
                  公式推奨（APIなし）
                </button>
                <button
                  onClick={() => applyOfficialRecommended(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  <i className="ri-star-fill mr-1"></i>
                  公式推奨（APIあり）
                </button>
              </div>

              {/* Tipsボタン */}
              <button
                onClick={() => setShowTips(true)}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-7

                00 transition-colors whitespace-nowrap"
              >
                <i className="ri-lightbulb-line mr-1"></i>
                Tips
              </button>

              <button
                onClick={() => setShowConfigEditor(!showConfigEditor)}
                className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <i className="ri-code-line mr-1"></i>
                設定生成
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 設定エディター */}
        {showConfigEditor && (
          <div className="mb-6">
            <ConfigEditor servers={servers} />
          </div>
        )}

        {/* Tipsモーダル */}
        {showTips && (
          <TipsModal onClose={() => setShowTips(false)} />
        )}

        {/* 複数フィールド設定モーダル */}
        {configModalServer && (() => {
          const schema = getServerConfigSchema(configModalServer);
          return schema ? (
            <MultiFieldConfigModal
              schema={schema}
              onSave={(config) => saveMultiFieldConfig(configModalServer, config)}
              onClose={() => setConfigModalServer(null)}
            />
          ) : null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* アクティブなサーバー */}
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
              <i className="ri-checkbox-circle-fill mr-2"></i>
              アクティブ ({activeServers.length})
            </h3>
            <div className="space-y-3">
              {activeServers.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={toggleServer}
                  onUpdateApiKey={updateApiKey}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* APIキー設定が必要 */}
          <div>
            <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center">
              <i className="ri-key-line mr-2"></i>
              APIキー設定が必要 ({needsApiKey.length})
            </h3>
            <div className="space-y-3">
              {needsApiKey.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={toggleServer}
                  onUpdateApiKey={updateApiKey}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* 無効化されたサーバー */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <i className="ri-stop-circle-line mr-2"></i>
              無効化 ({disabledServers.length})
            </h3>
            <div className="space-y-3">
              {disabledServers.map(server => (
                <MCPServerCard
                  key={server.id}
                  server={server}
                  onToggle={toggleServer}
                  onUpdateApiKey={updateApiKey}
                  compact={true}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
