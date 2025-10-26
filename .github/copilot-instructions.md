# GitHub Copilot CLI Instructions

## npm依存関係インストール

**`npm ci` または `npm install` を使用してください**

```bash
# CI環境やクリーンなインストールには `npm ci` を推奨
npm ci

# または、通常の開発セットアップ
npm install
```

`npm install` は通常 `devDependencies` を含めてインストールしますが、環境によっては（例: `NODE_ENV=production`）、`devDependencies` がスキップされることがあります。問題が発生した場合は `npm ci` を試してください。
