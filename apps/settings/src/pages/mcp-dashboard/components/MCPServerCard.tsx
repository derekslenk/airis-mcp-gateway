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
      alert('API Keys saved successfully and encrypted');
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
    <div className={`bg-white rounded-xl border-2 transition-all ${
      server.enabled ? 'border-blue-200 shadow-sm' : 'border-gray-200'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{server.name}</h3>
              {server.category && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {server.category}
                </span>
              )}
            </div>
            {server.description && (
              <p className="text-sm text-gray-600">{server.description}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
            <i className={getStatusIcon()}></i>
            <span>{server.enabled ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        {/* Command & Args */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Command:</div>
          <code className="text-xs bg-gray-50 px-2 py-1 rounded">{server.command}</code>
          {server.args && server.args.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">Args:</div>
              <div className="text-xs bg-gray-50 px-2 py-1 rounded break-words">
                {server.args.join(' ')}
              </div>
            </div>
          )}
        </div>

        {/* API Key Management */}
        {needsApiKeys && !showApiKeyInput && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              {allKeysConfigured ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <i className="ri-checkbox-circle-fill"></i>
                  <span>API Keys Configured</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600 text-sm">
                  <i className="ri-alert-fill"></i>
                  <span>API Keys Required</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <i className={allKeysConfigured ? "ri-key-fill text-green-600" : "ri-key-line text-gray-400"}></i>
              {allKeysConfigured ? 'Update API Keys' : 'Set API Keys'}
            </button>
          </div>
        )}

        {showApiKeyInput && serverConfig && (
          <div className="mb-4 space-y-3">
            {serverConfig.keys.map(keyConfig => (
              <div key={keyConfig.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {keyConfig.label}
                  {keyConfig.required && <span className="text-red-500 ml-1">*</span>}
                  {existingSecrets[keyConfig.name] && (
                    <span className="ml-2 text-xs text-green-600">
                      <i className="ri-checkbox-circle-fill"></i> Configured
                    </span>
                  )}
                </label>
                <input
                  type={keyConfig.type || 'password'}
                  value={apiKeyInputs[keyConfig.name] || ''}
                  onChange={(e) => setApiKeyInputs({
                    ...apiKeyInputs,
                    [keyConfig.name]: e.target.value,
                  })}
                  placeholder={keyConfig.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApiKeySubmit}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save & Encrypt'}
              </button>
              <button
                onClick={() => {
                  setShowApiKeyInput(false);
                  setApiKeyInputs({});
                }}
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:bg-gray-100"
              >
                Cancel
              </button>
            </div>
            {serverConfig.documentation && (
              <div className="text-xs text-gray-500 mt-2">
                <a
                  href={serverConfig.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  📚 Documentation
                </a>
              </div>
            )}
          </div>
        )}

        {/* Toggle & Delete */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(server.id, !server.enabled)}
            disabled={!allKeysConfigured && needsApiKeys}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
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
          {server.category === 'custom' && (
            <button
              onClick={() => onDelete(server.id)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          )}
        </div>

        {/* Environment Variables */}
        {server.env && Object.keys(server.env).length > 0 && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showDetails ? 'Hide' : 'Show'} Environment Variables
            </button>
            {showDetails && (
              <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                {Object.entries(server.env).map(([key, value]) => (
                  <div key={key} className="flex justify-between mb-1">
                    <span className="font-mono font-semibold">{key}:</span>
                    <span className="font-mono text-gray-600">{value.substring(0, 20)}...</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
