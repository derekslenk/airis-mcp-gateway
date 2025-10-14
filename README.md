# 🌉 AIRIS MCP Gateway

**25個のMCPサーバーを一元管理。トークン爆発とエディタ設定地獄を解決。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

> **Claude Code、Cursor、Windsurf、Zed**—全エディタで統一設定。一度構築すれば、どこでも使える。

**[English README](./README.en.md)** | **[日本語 README](./README.ja.md)**

---

## 🚀 5分でスタート

```bash
# 1. クローン
git clone https://github.com/kazukinakai/airis-mcp-gateway.git ~/github/airis-mcp-gateway
cd ~/github/airis-mcp-gateway

# 2. 起動
make up

# 3. エディタ接続
ln -sf ~/github/airis-mcp-gateway/mcp.json ~/.claude/mcp.json

# 4. エディタ再起動 → 完了 🎉
```

**今すぐ25個のMCPサーバーが使える状態に。**

---

## 💡 なぜAIRIS MCP Gatewayか？

### 🎯 解決する問題

#### ❌ 問題1: トークン爆発
- **大量のツール定義** → IDEが起動時に全ツール定義を読み込む
- **パフォーマンス劣化** → トークン閾値を超えるとIDE動作が重くなる
- **使わないツールで無駄** → 一度も使わないツールの定義で容量を圧迫

#### ❌ 問題2: エディタ設定地獄
```
Cursor     → mcp.json (独自フォーマット)
Windsurf   → mcp.json (微妙に違う)
Zed        → mcp.json (また違う)
VS Code    → settings.json (完全に別物)
```
**結果**: エディタごとに別々のMCP設定 = メンテナンス地獄

#### ❌ 問題3: プロジェクトごとの重複起動
- 各プロジェクトがMCPサーバーを個別起動 → メモリ/CPU無駄
- APIキーが複数の`.env`に散在 → セキュリティリスク

---

### ✅ AIRIS MCP Gatewayの解決策

#### 🌟 メリット1: ゼロトークン起動
- **IDEはGateway URLのみ認識** → ツール定義は送信されない（0トークン）
- **オンデマンド読み込み** → 明示的にリクエストされたときだけ定義を取得
- **実際に使うまで容量消費なし** → 無駄なリソース消費ゼロ

#### 🌟 メリット2: 一度定義で永続利用
- **マスター設定ファイル** → `mcp.json`を全エディタ・全プロジェクトにsymlink
- **更新が自動反映** → Gateway側で更新すれば全環境に即座に適用
- **エディタ差異を吸収** → 各エディタの独自フォーマットを完全に隠蔽

#### 🌟 メリット3: カスタマイズ自由
- **MITライセンス** → 自由に改変・商用利用可能
- **自分用サーバー追加** → `mcp-config.json`に追加するだけ
- **既存サーバーのカスタム版** → 動作を変えたい場合も自由に調整

#### 🌟 メリット4: ホスト環境汚染ゼロ
- **全サーバーがDockerコンテナ内実行** → Macホストは完全にクリーン
- **npx/uvx不要** → Gateway内で完結、依存関係の競合なし
- **削除も簡単** → `make clean`で完全クリーンアップ

#### 🌟 メリット5: プロジェクト切替が即座
- **Gateway常駐** → プロジェクトを切り替えてもサーバーは起動済み
- **ゼロダウンタイム** → 開発フローを中断しない
- **統一体験** → どのプロジェクトでも同じツールセット

#### 🌟 メリット6: セキュリティ強化
- **Docker secrets統合** → APIキーを暗号化してDockerに一元保存
- **`.env`不要** → Git漏洩リスクを根本的に排除
- **ランタイム注入のみ** → 平文での保存を回避

---

## 🏗️ アーキテクチャ

```
Claude Code / Cursor / Windsurf / Zed
    ↓
Gateway (http://localhost:9090/sse)
│
├─ 🔧 Core Tools (Gateway内実行)
│   ├─ time (2 tools)
│   ├─ fetch (1 tool)
│   ├─ git (12 tools)
│   ├─ memory (9 tools)
│   ├─ sequentialthinking (1 tool)
│   ├─ filesystem (secure file ops)
│   ├─ brave-search (web search)
│   └─ github (repo operations)
│
├─ 🧠 AI & Research (Gateway内実行)
│   └─ tavily (AI search engine)
│
├─ 🗄️ Database (Gateway内実行)
│   ├─ supabase (official integration)
│   ├─ mcp-postgres-server (self-hosted)
│   ├─ mongodb (NoSQL)
│   └─ sqlite (local DB)
│
├─ 📊 Productivity (Gateway内実行)
│   ├─ notion (workspace)
│   ├─ slack (collaboration)
│   └─ figma (design files)
│
├─ 💳 Payments & APIs (Gateway内実行)
│   ├─ stripe (payment)
│   └─ twilio (phone/SMS)
│
└─ 🛠️ Development (Gateway内実行)
    ├─ serena (symbol search)
    ├─ puppeteer (browser automation)
    └─ sentry (error monitoring)
```

**仕組み**:
1. **IDEがGateway URLのみ認識** → ツール定義は送信されない（0トークン）
2. **動的オンデマンドロード** → 明示的リクエスト時のみツール定義取得
3. **単一設定ファイル** → `mcp.json`を全エディタ・プロジェクトにsymlink

---

## 📦 利用可能なMCPサーバー (全25個)

### 🔧 コアツール

| サーバー | 説明 | 認証 |
|---------|------|------|
| **time** | 現在時刻・日付操作 | 不要 |
| **fetch** | Webコンテンツ取得 | 不要 |
| **git** | Gitリポジトリ操作 | 不要 |
| **memory** | 永続的な知識ストレージ | 不要 |
| **sequentialthinking** | 複雑な問題解決 | 不要 |
| **context7** | ライブラリドキュメント検索 | 不要 |
| **filesystem** | セキュアなファイル操作 | 不要 |
| **brave-search** | Web/ニュース/画像/動画検索 | `BRAVE_API_KEY` |
| **github** | GitHubリポジトリ操作 | `GITHUB_PERSONAL_ACCESS_TOKEN` |

### 🧠 AI検索 & リサーチ

| サーバー | 説明 | 認証 |
|---------|------|------|
| **tavily** | AIエージェント用検索エンジン | `TAVILY_API_KEY` |

### 🗄️ データベース

| サーバー | 説明 | 認証 |
|---------|------|------|
| **supabase** | 公式Supabase統合 | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| **mcp-postgres-server** | PostgreSQL操作（自己ホストSupabase） | `POSTGRES_CONNECTION_STRING` |
| **mongodb** | MongoDB NoSQLデータベース | `MONGODB_CONNECTION_STRING` |
| **sqlite** | SQLiteデータベース操作 | 不要 |

### 📊 生産性 & コラボレーション

| サーバー | 説明 | 認証 |
|---------|------|------|
| **notion** | Notionワークスペース統合 | `NOTION_API_KEY` |
| **slack** | Slackワークスペース統合 | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` |
| **figma** | Figmaデザインファイルアクセス | `FIGMA_ACCESS_TOKEN` |

### 💳 決済 & API統合

| サーバー | 説明 | 認証 |
|---------|------|------|
| **stripe** | 決済API | `STRIPE_SECRET_KEY` |
| **twilio** | 電話/SMS API | `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET` |

### 🛠️ 開発ツール

| サーバー | 説明 | 認証 |
|---------|------|------|
| **serena** | シンボル検索（Python/Go） | 不要 |
| **puppeteer** | ブラウザ自動化とWebスクレイピング | 不要 |
| **sentry** | エラー監視とデバッグ | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` |

---

## 🔐 セキュリティ（Docker secrets推奨）

```bash
# シークレット登録（初回のみ）
docker mcp secret set STRIPE_SECRET_KEY=sk_...
docker mcp secret set TWILIO_ACCOUNT_SID=AC...
docker mcp secret set FIGMA_ACCESS_TOKEN=figd_...

# シークレット確認
docker mcp secret ls

# シークレット削除
docker mcp secret rm STRIPE_SECRET_KEY
```

**セキュリティメリット**:
- ✅ Docker Desktopで暗号化保存
- ✅ Gitコミット不可（漏洩リスクゼロ）
- ✅ ランタイム注入のみ
- ✅ OrbStack互換

詳細は [SECRETS.md](./SECRETS.md) 参照。

---

## 🎛️ サーバー有効化/無効化

**重要**: 全サーバーがGateway内で動作するため、`mcp-config.json`を編集。

```bash
# Gateway設定を編集
vim ~/github/airis-mcp-gateway/mcp-config.json
```

**無効化**: サーバーエントリを削除またはコメントアウト
```json
{
  "mcpServers": {
    "context7": { ... },
    "filesystem": { ... }
    // "puppeteer": { ... }  ← コメントアウトまたは削除
  }
}
```

**有効化**: `mcp-config.json`に追加
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

## 🛠️ コマンド

| コマンド | 説明 |
|---------|------|
| `make up` | 全サービス起動 |
| `make down` | 全サービス停止 |
| `make restart` | サービス再起動 |
| `make logs` | 全ログ表示 |
| `make ps` | コンテナ状態確認 |
| `make info` | 利用可能サーバー表示 |
| `make clean` | クリーンアップ |

---

## 🌐 マルチエディタ & マルチプロジェクト対応

### 統一管理

```
~/github/airis-mcp-gateway/mcp.json (マスター設定)
    ↓ symlink
├─ ~/.claude/mcp.json (Claude Codeグローバル)
├─ ~/github/agiletec/mcp.json (agiletecプロジェクト)
├─ ~/github/neural/mcp.json (neuralプロジェクト)
└─ ~/github/storage-smart/mcp.json (storage-smartプロジェクト)
```

**メリット**:
- マスター設定更新 → 全エディタ・プロジェクトに自動反映
- エディタごとの設定差異を吸収
- プロジェクト切替時もMCPサーバーは常駐

**プロジェクト追加**:
```bash
ln -sf ~/github/airis-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

---

## 📁 ファイル構成

```
airis-mcp-gateway/
├── docker-compose.yml      # 全サービス（Gateway + MCPサーバー）
├── mcp-config.json         # Gateway設定（内部MCPサーバー）
├── mcp.json                # クライアント設定（エディタ側）
├── .env.example            # 環境変数テンプレート
├── .env                    # 実際のシークレット（.gitignore済）
├── Makefile                # ショートカット
├── README.md               # English
├── README.ja.md            # 日本語
└── SECRETS.md              # シークレット管理ガイド
```

---

## 🐛 トラブルシューティング

### Gateway起動失敗
```bash
docker logs airis-mcp-gateway
```

### 個別MCPサーバー問題
```bash
# Gatewayサーバー
make logs

# npx起動サーバー（エディタコンソールにログ）
# context7, mcp-postgres-server, stripe, twilio
```

### クリーン再起動
```bash
make clean
make up
```

### 実行中サービス確認
```bash
make ps
```

---

## 🔗 エディタ統合

以下の操作後はエディタ再起動が必要:
1. Gateway起動/停止
2. `mcp.json`の変更
3. 新しいMCPサーバー追加

Gatewayは常駐するため、プロジェクト切替時に再起動は不要。

---

## 💖 サポート

このプロジェクトが役に立った場合、開発継続のためにサポートをお願いします:

### ☕ Ko-fi
継続的な開発支援
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b?logo=kofi&logoColor=white)](https://ko-fi.com/kazukinakai)

### 🎯 Patreon
月額支援で自立支援
[![Patreon](https://img.shields.io/badge/Patreon-Support-f96854?logo=patreon&logoColor=white)](https://www.patreon.com/kazukinakai)

### 💜 GitHub Sponsors
柔軟な支援体系
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsor-ea4aaa?logo=github&logoColor=white)](https://github.com/sponsors/kazukinakai)

**サポートによって実現できること**:
- 新しいMCPサーバーの追加
- パフォーマンス最適化
- ドキュメント充実
- コミュニティサポート

---

## 🤝 コントリビューション

IssueとPull Requestを歓迎します！

1. リポジトリをフォーク
2. フィーチャーブランチ作成（`git checkout -b feature/amazing`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing`）
5. Pull Request作成

---

## 📄 ライセンス

MIT License - 自由に利用可能

---

## 💬 作者

[@kazukinakai](https://github.com/kazukinakai)

MCPサーバーのトークン爆発と設定地獄を解決するために作成しました。
