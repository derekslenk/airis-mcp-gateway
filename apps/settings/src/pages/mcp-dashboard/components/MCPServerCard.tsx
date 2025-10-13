import { useState } from 'react';
import type { MCPServer } from '../../../lib/api';

interface MCPServerCardProps {
  server: MCPServer;
  onToggle: (id: number, enabled: boolean) => void;
  onSaveApiKey: (id: number, apiKey: string) => void;
  onDelete: (id: number) => void;
}

export function MCPServerCard({ server, onToggle, onSaveApiKey, onDelete }: MCPServerCardProps) {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(server.env?.API_KEY || '');
  const [showDetails, setShowDetails] = useState(false);

  const handleApiKeySubmit = () => {
    onSaveApiKey(server.id, apiKeyInput);
    setShowApiKeyInput(false);
  };

  const getStatusColor = () => {
    if (!server.enabled) return 'text-gray-600 bg-gray-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = () => {
    if (!server.enabled) return 'ri-stop-circle-fill';
    return 'ri-checkbox-circle-fill';
  };

  const hasApiKey = server.env?.API_KEY && server.env.API_KEY.length > 0;

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
              {server.category !== 'custom' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Default
                </span>
              )}
              {server.category === 'custom' && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                  Custom
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
              <div className="text-xs bg-gray-50 px-2 py-1 rounded">
                {server.args.join(' ')}
              </div>
            </div>
          )}
        </div>

        {/* API Key Management */}
        {!showApiKeyInput ? (
          <div className="mb-4">
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <i className={hasApiKey ? "ri-key-fill text-green-600" : "ri-key-line text-gray-400"}></i>
              {hasApiKey ? 'Update API Key' : 'Set API Key'}
            </button>
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleApiKeySubmit}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Toggle & Delete */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(server.id, !server.enabled)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              server.enabled
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
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
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Environment Variables
          </button>
        )}
        {showDetails && server.env && (
          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
            {Object.entries(server.env).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-mono">{key}:</span>
                <span className="font-mono text-gray-600">{value.substring(0, 20)}...</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
