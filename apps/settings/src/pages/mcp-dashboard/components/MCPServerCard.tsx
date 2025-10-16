import { useState, useEffect } from 'react';
import type { MCPServer, SecretWithValue } from '../../../lib/api';
import { apiClient } from '../../../lib/api';
import { getServerConfig, requiresApiKeys } from '../../../lib/serverConfig';

interface MCPServerCardProps {
  server: MCPServer;
  onToggle: (id: number, enabled: boolean) => void;
  onDelete: (id: number) => void;
  onSecretsUpdated: () => void;
}

export function MCPServerCard({ server, onToggle, onDelete, onSecretsUpdated }: MCPServerCardProps) {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [existingSecrets, setExistingSecrets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const serverConfig = getServerConfig(server.name);
  const needsApiKeys = requiresApiKeys(server.name);

  // Load existing secrets on mount
  useEffect(() => {
    if (needsApiKeys) {
      loadExistingSecrets();
    }
  }, [server.name, needsApiKeys]);

  const loadExistingSecrets = async () => {
    try {
      const secrets = await apiClient.getSecretsByServer(server.name);
      const secretsMap: Record<string, boolean> = {};
      secrets.forEach(secret => {
        secretsMap[secret.key_name] = true;
      });
      setExistingSecrets(secretsMap);
    } catch (err) {
      console.error('Failed to load existing secrets:', err);
    }
  };

  const handleApiKeySubmit = async () => {
    if (!serverConfig) return;

    setLoading(true);
    try {
      // Save each API key to Secrets API
      for (const keyConfig of serverConfig.keys) {
        const value = apiKeyInputs[keyConfig.name];
        if (!value) {
          if (keyConfig.required) {
            alert(`${keyConfig.label} is required`);
            setLoading(false);
            return;
          }
          continue;
        }

        // Check if secret exists, update or create
        if (existingSecrets[keyConfig.name]) {
          await apiClient.updateSecret(server.name, keyConfig.name, value);
        } else {
          await apiClient.createSecret({
            server_name: server.name,
            key_name: keyConfig.name,
            value: value,
          });
        }
      }

      // Reload secrets to update UI
      await loadExistingSecrets();
      setApiKeyInputs({});
      setShowApiKeyInput(false);
      onSecretsUpdated();

      // Auto-enable server after API keys are configured
      if (!server.enabled) {
        await onToggle(server.id, true);
      }

      alert('API Keys saved and server enabled');
    } catch (err) {
      console.error('Failed to save API keys:', err);
      alert(`Failed to save API keys: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!server.enabled) return 'text-gray-600 bg-gray-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = () => {
    if (!server.enabled) return 'ri-stop-circle-fill';
    return 'ri-checkbox-circle-fill';
  };

  const allKeysConfigured = serverConfig
    ? serverConfig.keys
        .filter(k => k.required)
        .every(k => existingSecrets[k.name])
    : true;

  return (
    <div className={`bg-white rounded-lg border transition-all ${
      server.enabled ? 'border-green-400 shadow-sm' : 'border-gray-200'
    }`}>
      <div className="p-3">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{server.name}</h3>
            {server.description && (
              <p className="text-xs text-gray-500 truncate">{server.description}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ml-2 flex-shrink-0 ${getStatusColor()}`}>
            <i className={`${getStatusIcon()} text-xs`}></i>
          </div>
        </div>

        {/* API Key Status - Compact inline badge */}
        {needsApiKeys && (
          <div className="mb-2">
            {allKeysConfigured ? (
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="w-full px-2 py-1 text-xs bg-green-50 text-green-700 rounded flex items-center justify-center gap-1 hover:bg-green-100 transition-colors"
              >
                <i className="ri-key-fill"></i>
                <span>API Keys OK</span>
              </button>
            ) : (
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="w-full px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded flex items-center justify-center gap-1 hover:bg-amber-100 transition-colors"
              >
                <i className="ri-alert-fill"></i>
                <span>Set API Keys</span>
              </button>
            )}
          </div>
        )}

        {/* API Key Input - Compact modal style */}
        {showApiKeyInput && serverConfig && (
          <div className="mb-2 p-2 bg-gray-50 rounded space-y-2">
            {serverConfig.keys.map(keyConfig => (
              <div key={keyConfig.name}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {keyConfig.label}
                  {keyConfig.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type={keyConfig.type || 'password'}
                  value={apiKeyInputs[keyConfig.name] || ''}
                  onChange={(e) => setApiKeyInputs({
                    ...apiKeyInputs,
                    [keyConfig.name]: e.target.value,
                  })}
                  placeholder={keyConfig.placeholder}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            ))}
            <div className="flex gap-1">
              <button
                onClick={handleApiKeySubmit}
                disabled={loading}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowApiKeyInput(false);
                  setApiKeyInputs({});
                }}
                disabled={loading}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Toggle & Delete - Compact */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(server.id, !server.enabled)}
            disabled={!allKeysConfigured && needsApiKeys}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              server.enabled
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : !allKeysConfigured && needsApiKeys
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={!allKeysConfigured && needsApiKeys ? 'Configure API keys first' : ''}
          >
            {server.enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-xs transition-colors"
            title="Show details"
          >
            <i className={`ri-${showDetails ? 'arrow-up' : 'arrow-down'}-s-line`}></i>
          </button>
          {server.category === 'custom' && (
            <button
              onClick={() => onDelete(server.id)}
              className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
              title="Delete"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          )}
        </div>

        {/* Details - Expandable */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
            <div>
              <div className="text-xs text-gray-500 font-medium">Command:</div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">{server.command}</code>
            </div>
            {server.args && server.args.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-medium">Args:</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                  {server.args.join(' ')}
                </code>
              </div>
            )}
            {server.env && Object.keys(server.env).length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-medium">Environment:</div>
                <div className="text-xs bg-gray-100 p-2 rounded space-y-1">
                  {Object.entries(server.env).map(([key, value]) => (
                    <div key={key} className="font-mono">
                      <span className="text-gray-700">{key}:</span>{' '}
                      <span className="text-gray-500">{value.substring(0, 30)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
