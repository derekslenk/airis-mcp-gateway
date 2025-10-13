
import { useState } from 'react';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tools: string[];
  apiKeyRequired: boolean;
  apiKey?: string;
  status: 'connected' | 'disconnected' | 'error';
  category: 'default' | 'custom';
}

interface ConfigEditorProps {
  servers: MCPServer[];
}

export function ConfigEditor({ servers }: ConfigEditorProps) {
  const [selectedFormat, setSelectedFormat] = useState<'claude' | 'cursor' | 'json'>('claude');

  const generateConfig = () => {
    const enabledServers = servers.filter(s => s.enabled);
    
    switch (selectedFormat) {
      case 'claude':
        return JSON.stringify({
          mcpServers: enabledServers.reduce((acc, server) => {
            acc[server.id] = {
              command: "docker",
              args: ["run", "-i", "--rm", `mcp-${server.id}`],
              env: server.apiKey ? { API_KEY: server.apiKey } : undefined
            };
            return acc;
          }, {} as any)
        }, null, 2);
        
      case 'cursor':
        return JSON.stringify({
          "mcp.servers": enabledServers.reduce((acc, server) => {
            acc[server.id] = {
              command: "docker",
              args: ["run", "-i", "--rm", `mcp-${server.id}`],
              env: server.apiKey ? { API_KEY: server.apiKey } : undefined
            };
            return acc;
          }, {} as any)
        }, null, 2);
        
      case 'json':
        return JSON.stringify({
          servers: enabledServers.map(server => ({
            id: server.id,
            name: server.name,
            enabled: server.enabled,
            tools: server.tools,
            apiKey: server.apiKey || null
          }))
        }, null, 2);
        
      default:
        return '';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateConfig());
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          <i className="ri-code-line mr-2 text-blue-600"></i>
          設定ファイル生成
        </h3>
        <div className="flex gap-2">
          {[
            { key: 'claude', label: 'Claude Desktop' },
            { key: 'cursor', label: 'Cursor' },
            { key: 'json', label: 'JSON' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedFormat(key as any)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors whitespace-nowrap ${
                selectedFormat === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border max-h-96 overflow-y-auto">
          <code className="text-gray-800">{generateConfig()}</code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          <i className="ri-file-copy-line mr-1"></i>
          コピー
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">設定ファイルの配置場所</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {selectedFormat === 'claude' && (
            <p><strong>Claude Desktop:</strong> ~/.claude/claude_desktop_config.json</p>
          )}
          {selectedFormat === 'cursor' && (
            <p><strong>Cursor:</strong> 設定 &gt; Extensions &gt; MCP Servers</p>
          )}
          {selectedFormat === 'json' && (
            <p><strong>カスタム:</strong> 任意の場所に保存してアプリケーションで読み込み</p>
          )}
        </div>
      </div>
    </div>
  );
}
