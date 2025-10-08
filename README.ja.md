# Docker MCP Gateway

**全プロジェクト共通の MCP サーバー管理基盤**

Model Context Protocol (MCP) サーバーを Docker で一元管理。すべてのプロジェクトから同じ MCP サーバー群にアクセス。

```
Claude Code (任意のプロジェクト)
    ↓
~/github/docker-mcp-gateway/mcp.json (Git管理)
    ↓
Gateway (http://localhost:9090/sse)
│   ├─ time
│   ├─ fetch
│   ├─ git
│   ├─ memory
│   └─ sequentialthinking
│
└─ npx Direct Launch (4 servers)
    ├─ context7 (ライブラリドキュメント)
    ├─ supabase (PostgreSQL)
    ├─ stripe (決済)
    └─ twilio (電話/SMS)
```

---

## 🎯 解決する問題

### ❌ Before
- プロジェクトごとに MCP サーバーを起動 (無駄なリソース消費)
- 設定ファイルが各プロジェクトに散在
- API キーが複数の `.env` に重複
- サーバー追加時に全プロジェクトで設定変更

### ✅ After
- **1つの Gateway で全プロジェクトをサポート**
- **mcp.json は symlink で共有** (設定は Git 管理)
- **API キーは Docker secrets で一元管理**
- **サーバー追加は1箇所だけ**

---

## 🚀 クイックスタート

### 1. インストール

```bash
git clone https://github.com/kazukinakai/docker-mcp-gateway.git ~/github/docker-mcp-gateway
cd ~/github/docker-mcp-gateway
```

### 2. 起動

```bash
make up    # すべての MCP サーバー + プロキシ起動
```

### 3. Claude Code と接続

#### グローバル設定 (推奨)
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/.claude/mcp.json
```

#### プロジェクト個別設定
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

### 4. Claude Code 再起動

設定が反映されます。

---

## 📦 利用可能な MCP サーバー

| サーバー | 説明 | タイプ | 認証 |
|----------|------|--------|------|
| **context7** | ライブラリドキュメント検索 | SSE | 不要 |
| **time** | 現在時刻/日付取得 | stdio | 不要 |
| **fetch** | Web コンテンツ取得 | stdio | 不要 |
| **memory** | 永続ストレージ | stdio | 不要 |
| **filesystem** | ファイル操作 | stdio | 不要 |
| **git** | Git 操作 | stdio | 不要 |
| **sequential-thinking** | 複雑な推論 | stdio | 不要 |
| **supabase** | PostgreSQL データベース | stdio | 不要 |
| **stripe** | 決済 API | stdio | API キー必要 |
| **twilio** | 電話/SMS API | stdio | API キー必要 |
| **brave-search** | Web 検索 | stdio | API キー必要 |
| **puppeteer** | ブラウザ自動化 | stdio | 不要 |
| **slack** | Slack API | stdio | トークン必要 |
| **github** | GitHub API | stdio | トークン必要 |

---

## 🔧 設定

### 🔐 API キー管理 (推奨)

Docker MCP の secrets 機能を使用:

```bash
# シークレット登録 (1回だけ)
docker mcp secret set STRIPE_API_KEY=sk_...
docker mcp secret set TWILIO_ACCOUNT_SID=AC...
docker mcp secret set TWILIO_API_KEY=SK...
docker mcp secret set TWILIO_API_SECRET=...

# 確認
docker mcp secret ls

# 削除
docker mcp secret rm STRIPE_API_KEY
```

**セキュリティ上の利点**:
- ✅ Docker Desktop で暗号化保存
- ✅ Git にコミットされない
- ✅ 実行時のみ注入
- ✅ OrbStack でも動作

詳細は [SECRETS.md](./SECRETS.md) を参照。

### 新しい MCP サーバーの追加

`mcp-config.json` を編集:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["-y", "@your/mcp-server"],
      "env": {
        "API_KEY": "${YOUR_API_KEY}"
      }
    }
  }
}
```

再起動:
```bash
make restart
```

---

## 🛠️ コマンド一覧

| コマンド | 説明 |
|---------|------|
| `make up` | すべてのサービス起動 |
| `make down` | すべてのサービス停止 |
| `make restart` | 再起動 |
| `make logs` | すべてのログ表示 |
| `make logs-context7` | context7 のログ |
| `make logs-supabase` | supabase のログ |
| `make ps` | コンテナ状態表示 |
| `make info` | 利用可能なサーバー一覧 |
| `make clean` | クリーンアップ |

---

## 📁 ファイル構成

```
docker-mcp-gateway/
├── docker-compose.yml      # すべてのサービス (サーバー + プロキシ)
├── mcp-config.json         # プロキシ設定 (17サーバー)
├── mcp.json                # Claude Code クライアント設定
├── .env.example            # 環境変数テンプレート
├── .env                    # 実際のシークレット (.gitignore)
├── Makefile                # ショートカット
├── README.md               # English (master)
├── README.ja.md            # 日本語
└── context7/               # カスタム MCP サーバービルド
```

---

## 🌐 複数プロジェクトからの利用

symlink を作成すれば、`docker-mcp-gateway/mcp.json` の変更が自動的に全プロジェクトに反映されます。

**現在の symlink**:
- `~/.claude/mcp.json` (グローバル)
- `~/github/agiletec/mcp.json` (agiletec プロジェクト)

**追加方法**:
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

---

## 🔒 セキュリティ

- **Git にコミット可能**: `mcp-config.json`, `mcp.json`, `docker-compose.yml`
- **Git にコミット禁止**: `.env` (実際の API キーを含む)
- **推奨**: Docker MCP secrets を使用 (`.env` 不要)

---

## 🐛 トラブルシューティング

### プロキシが起動しない
```bash
docker logs mcp-proxy
```

### 個別サーバーの問題
```bash
make logs-context7
make logs-supabase
```

### クリーン再起動
```bash
make clean
make up
```

### 実行中のサービス確認
```bash
make ps
```

---

## 🔗 Claude Code との統合

以下の操作後は Claude Code を再起動:
1. プロキシの起動/停止
2. `mcp.json` の変更
3. 新しい MCP サーバーの追加

プロキシは常時起動 - プロジェクト切り替え時の再起動は不要。

---

## 🤝 コントリビューション

Issue や Pull Request 大歓迎！

1. Fork する
2. Feature ブランチ作成 (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Pull Request 作成

---

## 📄 ライセンス

MIT License - 自由に使ってください

---

## 💬 作者

[@kazukinakai](https://github.com/kazukinakai)

複数プロジェクトで MCP サーバーを管理する中で生まれたツールです。
