# YT Excel Helper ドキュメント

## 概要

YT Excel Helperは、固定長データとTSV/CSV形式の相互変換、およびナンバリング行の変換を行うWebアプリケーションです。

## ドキュメント構成

### 📘 [使い方](./usage/README.md)
アプリケーションの使用方法、機能説明、トラブルシューティング

### 🛠️ [開発](./dev/)
- [開発ガイド](./dev/README.md)
- [CI/CD](./dev/ci-cd.md)
- [AI統合](./dev/CI_AI_INTEGRATION.md)
- [ブランチワークフロー](./dev/branch-workflow.md)

### 📡 [API](./api/README.md)
内部API仕様、関数リファレンス

### 🎨 [設計資料](./design/chat/)
初期設計時のチャット記録

## クイックスタート

```bash
# インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト
npm run test

# Lint
npm run lint
```

## 主な機能

1. **固定長相互変換**
   - 固定長 → TSV/CSV
   - TSV/CSV → 固定長

2. **ナンバリング行変換**
   - 複数パターンの自動検出
   - 統一された形式への変換

## プロジェクト情報

- **リポジトリ**: [TomoTom0/excel-helper](https://github.com/TomoTom0/excel-helper)
- **ライセンス**: ISC
- **技術スタック**: Vue 3, TypeScript, Vite, Pinia

## コントリビューション

プルリクエストを歓迎します！詳細は[開発ガイド](./dev/README.md)を参照してください。
