# Docker MCP Gateway

**MCP サーバーのトークン爆発問題を解決する統合ゲートウェイ**

Model Context Protocol (MCP) サーバーを Docker で一元管理し、IDE のトークン消費とマルチエディタ設定地獄を解決します。

**[English README](./README.md)**

---

## 🎯 解決する問題

### Problem 1: トークン爆発
- **MCP サーバーのツール説明文が膨大** → IDE が起動時に全ツール定義を読み込む
- **閾値超えで動作不良** → トークン数が一定値を超えると IDE がハングまたは出力低下
- **使わないツールでもトークン消費** → 必要ないツールの説明まで毎回読み込まれる

### Problem 2: マルチエディタ設定地獄
```
Cursor     → mcp.json (独自フォーマット)
Windsurf   → mcp.json (微妙に違う)
Zed        → mcp.json (また違う)
VS Code    → settings.json (全然違う)
```
**結果**: 各エディタで個別に MCP 設定を書き、メンテナンス地獄

### Problem 3: プロジェクトごとの重複起動
- 各プロジェクトで MCP サーバーを起動 → メモリ/CPU の無駄
- API キーが複数の `.env` に散在 → セキュリティリスク

---

## ✨ 解決策

### 🚀 Gateway パターン

```
Claude Code / Cursor / Windsurf / Zed
    ↓
Gateway (http://localhost:9090/sse)
│   ├─ time (2 tools)
│   ├─ fetch (1 tool)
│   ├─ git (12 tools)
│   ├─ memory (9 tools)
│   └─ sequentialthinking (1 tool)
│
└─ Direct Launch (npx)
    ├─ context7 (ライブラリドキュメント検索)
    ├─ mcp-postgres-server (PostgreSQL → Supabase self-hosted 接続)
    ├─ stripe (決済 API)
    └─ twilio (電話/SMS API)
```

**仕組み**:
1. **IDE には Gateway の URL だけ登録** → ツール説明文を送らない (0 トークン)
2. **必要な時だけ動的ロード** → ユーザーが明示的に指定した時のみツール定義を読み込む
3. **1つの設定ファイル** → `mcp.json` を symlink で全エディタ・全プロジェクトに共有

**効果**:
- ✅ **トークン消費ゼロ** (使わない限り)
- ✅ **動的ロード** (必要な時だけ)
- ✅ **一元管理** (設定ファイル 1 つ)
- ✅ **API キー集約** (Docker secrets で安全管理)

---

## 🚀 クイックスタート

### 1. インストール

```bash
git clone https://github.com/kazukinakai/docker-mcp-gateway.git ~/github/docker-mcp-gateway
cd ~/github/docker-mcp-gateway
```

### 2. 起動

```bash
make up    # Gateway + 全 MCP サーバー起動
```

### 3. エディタと接続

#### グローバル設定 (推奨)
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/.claude/mcp.json
```

#### プロジェクト個別設定
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

### 4. エディタ再起動

設定が反映されます。

---

## 📦 利用可能な MCP サーバー

### Gateway 経由 (25 ツール)
| サーバー | ツール数 | 説明 |
|----------|---------|------|
| **time** | 2 | 現在時刻/日付取得 |
| **fetch** | 1 | Web コンテンツ取得 |
| **git** | 12 | Git 操作 |
| **memory** | 9 | 永続ストレージ |
| **sequentialthinking** | 1 | 複雑な推論 |

### Direct Launch (npx 起動)
| サーバー | 説明 | 認証 |
|----------|------|------|
| **context7** | ライブラリドキュメント検索 | 不要 |
| **mcp-postgres-server** | PostgreSQL 操作 (Supabase self-hosted 接続) | 接続文字列必要 |
| **stripe** | 決済 API | API キー必要 |
| **twilio** | 電話/SMS API | API キー必要 |

---

## 🔧 設定

### 🔐 API キー管理 (推奨: Docker secrets)

```bash
# シークレット登録 (1回だけ)
docker mcp secret set STRIPE_SECRET_KEY=sk_...
docker mcp secret set TWILIO_ACCOUNT_SID=AC...
docker mcp secret set TWILIO_API_KEY=SK...
docker mcp secret set TWILIO_API_SECRET=...

# 確認
docker mcp secret ls

# 削除
docker mcp secret rm STRIPE_SECRET_KEY
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
| `make ps` | コンテナ状態表示 |
| `make info` | 利用可能なサーバー一覧 |
| `make clean` | クリーンアップ |

---

## 📁 ファイル構成

```
docker-mcp-gateway/
├── docker-compose.yml      # すべてのサービス (Gateway + MCP サーバー)
├── mcp-config.json         # Gateway 設定 (内部で起動する MCP サーバー)
├── mcp.json                # クライアント設定 (エディタ側)
├── .env.example            # 環境変数テンプレート
├── .env                    # 実際のシークレット (.gitignore)
├── Makefile                # ショートカット
├── README.md               # English
├── README.ja.md            # このファイル (日本語)
└── SECRETS.md              # シークレット管理ガイド
```

---

## 🌐 マルチエディタ & マルチプロジェクト対応

### 一元管理の仕組み

```
~/github/docker-mcp-gateway/mcp.json (マスター設定)
    ↓ symlink
├─ ~/.claude/mcp.json (Claude Code グローバル)
├─ ~/github/agiletec/mcp.json (agiletec プロジェクト)
├─ ~/github/neural/mcp.json (neural プロジェクト)
└─ ~/github/storage-smart/mcp.json (storage-smart プロジェクト)
```

**メリット**:
- マスター設定を更新 → 全エディタ・全プロジェクトに自動反映
- エディタごとの設定差異を吸収
- プロジェクト切り替え時も MCP サーバーは常時起動

**追加方法**:
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

---

## 🔒 セキュリティ

- **Git にコミット可能**: `mcp-config.json`, `mcp.json`, `docker-compose.yml`
- **Git にコミット禁止**: `.env` (実際の API キーを含む)
- **推奨**: Docker MCP secrets を使用 (`.env` 不要、より安全)

---

## 🐛 トラブルシューティング

### Gateway が起動しない
```bash
docker logs docker-mcp-gateway
```

### 個別 MCP サーバーの問題
```bash
# Gateway 内のサーバー
make logs

# npx 起動サーバー (Claude Code のコンソールに出力)
# context7, mcp-postgres-server, stripe, twilio
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

## 🔗 エディタとの統合

以下の操作後はエディタを再起動:
1. Gateway の起動/停止
2. `mcp.json` の変更
3. 新しい MCP サーバーの追加

Gateway は常時起動 - プロジェクト切り替え時の再起動は不要。

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

MCP サーバーのトークン爆発問題と設定地獄を解決するために生まれたツールです。
