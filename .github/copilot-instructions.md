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

## GitHub GraphQL API の使用

### PRのレビューコメントをresolveする

PRのレビューコメントをコマンドラインから解決する場合、GitHub GraphQL APIを使用します。

```bash
# 1. レビュースレッドIDを取得
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 10) {
        nodes {
          id
          isResolved
        }
      }
    }
  }
}'

# 2. スレッドをresolve
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "THREAD_ID"}) {
    thread {
      isResolved
    }
  }
}'
```

**注意**: `gh pr` コマンドではレビューコメントのresolveはできません。GraphQL APIを使用する必要があります。
