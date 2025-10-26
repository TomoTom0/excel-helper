# GitHub Copilot CLI Instructions

## npm依存関係インストール

**devDependenciesを含めて必ずインストールすること**

```bash
npm install --include=dev
# または
npm ci
```

`npm install` だけではdevDependenciesがインストールされない場合がある。
パッケージが見つからないエラーが出た場合、npm環境の問題と決めつけず、まずdevDependenciesの未インストールを疑うこと。
