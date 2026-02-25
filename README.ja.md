# Agent-Browser MCP サーバー

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

> [agent-browser](https://github.com/vercel-labs/agent-browser) のモデルコンテキストプロトコル (MCP) サーバー - AI エージェント向けの完全なブラウザ自動化機能を提供します。

本プロジェクトは、優れた [`agent-browser`](https://github.com/vercel-labs/agent-browser) CLI ツールをラップした独立した MCP サーバー実装であり、[モデルコンテキストプロトコル](https://modelcontextprotocol.io/) を通じて強力なブラウザ自動化機能を提供します。

## 機能

- 🔧 **44 のツール** - agent-browser の機能を完全カバー
- 🎯 **トークン効率の良い @ref システム** - 要素参照をキャッシュしてトークン使用量を削減
- 🌐 **完全な Playwright API** - 完全なブラウザ自動化機能を活用
- 🔄 **自動起動** - 必要に応じてブラウザを自動起動
- 💾 **状態永続化** - セッション間でブラウザ状態を保存・復元
- 🎬 **ビデオ録画** - デバッグ用にブラウザセッションを録画
- 🌐 **ネットワークインターセプト** - ネットワークリクエストの監視と変更
- 📊 **セッション管理** - 複数のタブとウィンドウを管理

## インストール

### npm を使用

```bash
npm install mcp-server-agent-browser
```

### ソースから

```bash
git clone https://github.com/your-org/agent-browser-mcp.git
cd agent-browser-mcp
npm install
npm run build
```

## クイックスタート

### Claude Desktop 用

1. パッケージをインストール
2. Claude Desktop 設定で構成 (`~/.claude/settings.json`)：

```json
{
  "mcpServers": {
    "agent-browser": {
      "command": "npx",
      "args": ["mcp-server-agent-browser"],
      "env": {
        "HEADED": "false"
      }
    }
  }
}
```

### スタンドアロン

```bash
mcp-server-agent-browser
```

## 利用可能なツール

### コアツール
- `browser_navigate` - URL に移動
- `browser_snapshot` - @ref システムでページ構造をキャプチャ
- `browser_screenshot` - スクリーンショットを撮影
- `browser_close` - ブラウザ/ページを閉じる

### ナビゲーションと履歴
- `browser_back` - 履歴を戻る
- `browser_forward` - 履歴を進む
- `browser_reload` - 現在のページを再読み込み

### 要素操作
- `browser_click` - 要素をクリック
- `browser_fill` - 入力フィールドを入力
- `browser_type` - 入力（既存内容をクリアせず）
- `browser_select` - ドロップダウンオプションを選択
- `browser_check` / `browser_uncheck` - チェックボックスのオン/オフ
- `browser_drag` - ドラッグ＆ドロップ
- `browser_upload` - ファイルアップロード
- `browser_dblclick` - ダブルクリック
- `browser_focus` - 要素にフォーカス
- `browser_hover` - 要素にホバー
- `browser_scroll` - ページスクロール
- `browser_press` - キーボードキーを押下

### 要素検索
- `browser_find` - セマンティック要素検索（role、text、label、placeholder など）
- `browser_get` - 要素情報を取得
- `browser_is` - 要素状態を確認

### タブとウィンドウ
- `browser_tab` - タブを管理
- `browser_window` - ウィンドウを管理
- `browser_frame` - iframe に切り替え

### 高度な機能
- `browser_record` - ブラウザセッションを録画
- `browser_network` - ネットワークリクエストを監視
- `browser_console` - コンソールにアクセス
- `browser_errors` - JavaScript エラーを追跡
- `browser_trace` - パフォーマンストレース
- `browser_profiler` - Chrome DevTools プロファイリング
- `browser_evaluate` - JavaScript を実行
- `browser_pdf` - PDF にエクスポート
- `browser_dialog` - JavaScript ダイアログを処理
- `browser_download` - ダウンロードを管理

### 状態とストレージ
- `browser_state` - ブラウザ状態を保存/ロード
- `browser_cookies` - Cookie を管理
- `browser_storage` - localStorage/sessionStorage にアクセス

### ユーティリティ
- `browser_wait` - 条件を待機
- `browser_set` - 要素属性を設定
- `browser_mouse` - マウス制御
- `browser_diff` - ページを比較
- `browser_highlight` - デバッグハイライト

## 設定

環境変数：

| 変数 | 説明 | デフォルト |
|----------|-------------|---------|
| `HEADED` | ヘッドモードで実行（ブラウザ表示） | `false` |
| `BROWSER` | 使用するブラウザ (chromium/firefox/webkit) | `chromium` |

## 開発

```bash
# 依存関係をインストール
npm install

# ビルド
npm run build

# 開発モードで実行（自動再ビルド）
npm run dev

# テストを実行
npm test

# ウォッチモード
npm run test:watch

# サーバーを起動
npm start
```

## ドキュメント

- **[CLAUDE.md](./CLAUDE.md)** - Claude Code 開発ガイド
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - テスト手順
- **[QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)** - クイックリファレンス

## 関連プロジェクト

- **[agent-browser](https://github.com/vercel-labs/agent-browser)** - 本プロジェクトがラップする元の CLI ツール
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - 本サーバーが実装するプロトコル

## ライセンス

Apache-2.0

---

**注意**: 本プロジェクトは独立した実装であり、Vercel や元の agent-browser プロジェクトとは公式に関連していません。
