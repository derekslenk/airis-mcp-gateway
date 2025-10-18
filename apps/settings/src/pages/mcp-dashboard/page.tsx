
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
  tools: string[];
  apiKeyRequired: boolean;
  apiKey?: string;
  status: 'connected' | 'disconnected' | 'error';
  category: 'default' | 'custom';
  recommended?: boolean;
}

// Initial MCP servers definition (replaces placeholder)
const initialMCPServers: MCPServer[] = [
  // Built-in（常時有効）
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: '段階的思考と体系的分析',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['思考分析', '段階的推論', '論理構造']
  },
  {
    id: 'time',
    name: 'Time',
    description: '時間と日付の操作',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['日時取得', 'タイムゾーン', '時間計算']
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'HTTP リクエストとAPI呼び出し',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['HTTP リクエスト', 'API呼び出し', 'データ取得']
  },
  {
    id: 'git',
    name: 'Git',
    description: 'ローカルGitリポジトリ管理と操作',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['コミット', 'ブランチ操作', 'ログ確認', 'ステータス']
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'セッション間でのデータ永続化',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['データ保存', 'セッション管理', '永続化']
  },

  // Gateway（認証不要・推奨）
  {
    id: 'filesystem',
    name: 'File System',
    description: 'ローカルファイルシステム操作（必須）',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['ファイル読み書き', 'ディレクトリ操作', 'ファイル検索']
  },
  {
    id: 'context7',
    name: 'Context7',
    description: '公式ライブラリドキュメントとコード例（必須）',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['ドキュメント検索', 'コード例', 'API参照']
  },
  {
    id: 'serena',
    name: 'Serena',
    description: 'セマンティックコード分析とインテリジェント編集（推奨）',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['コード分析', 'セマンティック解析', 'インテリジェント編集']
  },
  {
    id: 'mindbase',
    name: 'Mindbase',
    description: '長期記憶・失敗学習システム（推奨）',
    status: 'connected',
    category: 'default',
    apiKeyRequired: false,
    enabled: true,
    recommended: true,
    tools: ['長期記憶', '失敗学習', 'ナレッジベース']
  },

  // 選択的（APIなし）
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'SQLiteデータベース操作（DB操作時のみ）',
    status: 'disconnected',
    category: 'default',
    apiKeyRequired: false,
    enabled: false,
    recommended: true,
    tools: ['SQL実行', 'データベース管理', 'テーブル操作']
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'ヘッドレスブラウザ自動化（E2Eテスト時のみ）',
    status: 'disconnected',
    category: 'default',
    apiKeyRequired: false,
    enabled: false,
    recommended: true,
    tools: ['ブラウザ自動化', 'スクリーンショット', 'PDF生成']
  },

  // APIキー設定が必要なサーバー（公式推奨）
  {
    id: 'tavily',
    name: 'Tavily',
    description: 'AI検索とリアルタイム情報取得（Fetch無効化推奨）',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: true,
    tools: ['AI検索', 'リアルタイム情報', 'データ取得']
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Supabaseデータベースと認証（Supabase開発時）',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: true,
    tools: ['データベース操作', '認証管理', 'リアルタイム']
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHubリポジトリとIssue管理（GitHub操作時）',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: true,
    tools: ['リポジトリ管理', 'Issue', 'プルリクエスト']
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'プライバシー重視のウェブ検索（Tavily併用時は非推奨）',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: true,
    tools: ['ウェブ検索', 'プライバシー保護', '検索結果']
  },

  // カスタム（追加オプション）
  {
    id: 'figma',
    name: 'Figma',
    description: 'Figmaデザインファイルとプロトタイプ管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['デザインファイル', 'プロトタイプ', 'コンポーネント管理']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Slackメッセージとチャンネル管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['メッセージ送信', 'チャンネル管理', 'ファイル共有']
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notionページとデータベース操作',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['ページ作成', 'データベース', 'コンテンツ管理']
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Google Driveファイル管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['ファイル管理', 'フォルダ操作', 'ドキュメント']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Googleカレンダーイベント管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['イベント作成', 'スケジュール', 'リマインダー']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Stripe決済とサブスクリプション管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['決済処理', 'サブスクリプション', '顧客管理']
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Shopifyストアと商品管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['商品管理', '注文処理', 'ストア運営']
  },
  {
    id: 'weather-api',
    name: 'Weather API',
    description: '天気情報と気象データ取得',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: true,
    enabled: false,
    recommended: false,
    tools: ['天気予報', '気象データ', '地域情報']
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: 'クロスブラウザE2Eテストと自動化',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: false,
    enabled: false,
    recommended: false,
    tools: ['E2Eテスト', 'ブラウザ自動化', 'テストスクリプト']
  },
  {
    id: 'chrome-devtools',
    name: 'Chrome DevTools',
    description: 'Chrome DevToolsデバッグとパフォーマンス分析',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: false,
    enabled: false,
    recommended: false,
    tools: ['デバッグ', 'パフォーマンス分析', 'DevTools']
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'PostgreSQLデータベース接続',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: false,
    enabled: false,
    recommended: false,
    tools: ['SQL実行', 'データ分析', 'データベース管理']
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Dockerコンテナ管理と操作',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: false,
    enabled: false,
    recommended: false,
    tools: ['コンテナ管理', 'イメージ操作', 'Docker Compose']
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Kubernetesクラスター管理',
    status: 'disconnected',
    category: 'custom',
    apiKeyRequired: false,
    enabled: false,
    recommended: false,
    tools: ['Pod管理', 'サービス操作', 'デプロイメント']
  }
];

export default function MCPDashboard() {
  const [servers, setServers] = useState<MCPServer[]>(initialMCPServers);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [configModalServer, setConfigModalServer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved secrets from database on mount
  useEffect(() => {
    const loadSavedSecrets = async () => {
      try {
        const response = await fetch('http://localhost:9000/api/v1/secrets/');
        if (!response.ok) {
          console.error('Failed to load secrets');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const savedSecrets = data.secrets || [];

        // Group secrets by server_name
        const secretsByServer: Record<string, string[]> = {};
        savedSecrets.forEach((secret: any) => {
          if (!secretsByServer[secret.server_name]) {
            secretsByServer[secret.server_name] = [];
          }
          secretsByServer[secret.server_name].push(secret.key_name);
        });

        // Update servers with saved configuration status
        setServers(prev => prev.map(server => {
          const hasSecrets = secretsByServer[server.id];
          if (hasSecrets && hasSecrets.length > 0) {
            return {
              ...server,
              apiKey: 'configured',
              enabled: true,
              status: 'connected' as const
            };
          }
          return server;
        }));

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading secrets:', error);
        setIsLoading(false);
      }
    };

    loadSavedSecrets();
  }, []);

  const toggleServer = (id: string) => {
    setServers(prev => prev.map(server =>
      server.id === id
        ? { ...server, enabled: !server.enabled, status: !server.enabled ? 'connected' : 'disconnected' }
        : server
    ));
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
