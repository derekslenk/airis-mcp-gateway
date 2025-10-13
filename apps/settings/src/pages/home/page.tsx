
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MCP Gateway Manager</h1>
          <p className="text-xl text-gray-600">Docker MCP Gatewayの管理ツール</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MCP Dashboard */}
          <Link 
            to="/mcp-dashboard"
            className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <i className="ri-dashboard-line text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">MCP Dashboard</h3>
              <p className="text-gray-600 mb-4">MCPサーバーの管理とオンオフ切り替え</p>
              <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                <span className="mr-2">ダッシュボードを開く</span>
                <i className="ri-arrow-right-line"></i>
              </div>
            </div>
          </Link>

          {/* 機能説明 */}
          <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-information-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">主な機能</h3>
              <div className="text-left text-gray-600 space-y-2">
                <div className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  <span>MCPサーバーのオンオフ切り替え</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  <span>APIキーの管理</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  <span>設定ファイルの自動生成</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  <span>ツール一覧の表示</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 説明セクション */}
        <div className="mt-12 bg-white rounded-xl p-8 border">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">MCP Gatewayについて</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">解決する問題</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 複数のMCPサーバーを個別に管理する手間</li>
                <li>• 不要なツールによるコンテキスト圧迫</li>
                <li>• エディター毎の設定の複雑さ</li>
                <li>• パフォーマンスの低下</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">提供する価値</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 統一されたMCPサーバー管理</li>
                <li>• 必要なツールのみの選択的利用</li>
                <li>• 複数エディターでの共通設定</li>
                <li>• レスポンス品質の向上</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
