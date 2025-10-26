# CI/CD ドキュメント

## 概要

YT Excel Helperでは、GitHub Actionsを使用したCI/CDパイプラインを構築しています。

## ワークフロー構成

### 1. テスト・ビルドワークフロー (`ci.yml`)

**トリガー**:
- `main`ブランチへのpush
- `dev`ブランチへのpush
- Pull Request作成時

**ジョブ**:
- Lintチェック
- ユニットテスト実行
- ビルド検証
- カバレッジレポート生成

### 2. 自動修正ワークフロー (`auto-fix-on-failure.yml`)

**トリガー**:
- CI/CDワークフロー失敗時（`workflow_run`）

**処理フロー**:

#### 2.1. Issue自動作成
```yaml
- name: Create Issue
  uses: actions/github-script@v7
  with:
    script: |
      const issue = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: '🔴 CI Failed',
        body: `CI失敗: ${context.payload.workflow_run.html_url}`,
        labels: ['ci-failure', 'auto-created']
      });
      return issue.data.node_id;
```

**制約事項**:
- GitHub Copilot Botを自動的にAssigneeに設定することは技術的制約により困難です
- アサイン操作自体は可能ですが、Copilotが自動でレビューを開始するわけではありません
- 詳細は `CI_AI_INTEGRATION.md` を参照してください

#### 2.2. 手動でのレビュー依頼

プルリクエストのコメント欄で `/gemini review` コマンドを使用することで、Gemini Code Assistにレビューを依頼できます。

## 技術詳細

### GraphQL API vs REST API

| API | 結果 | 理由 |
|-----|------|------|
| REST API (POST/PATCH) | ❌ 失敗 | Copilot BotはBot typeであり、通常のUser nodeではない |
| GraphQL `addAssigneesToAssignable` | ❌ 失敗 | User nodeのみ受け付ける |
| GraphQL `replaceActorsForAssignable` | ✅ 成功 | Bot typeも受け付ける |

### GitHub Copilot Bot情報

```json
{
  "login": "Copilot",
  "id": 198982749,
  "node_id": "BOT_kgDOC9w8XQ",
  "type": "Bot"
}
```

## ブランチ戦略

### メインブランチ

- **`main`**: プロダクション環境
  - 常に安定したコード
  - タグ付けでバージョン管理
  - 自動デプロイ

- **`dev`**: 開発環境
  - 機能開発の統合ブランチ
  - CI/CD実行
  - `main`へのマージ前の検証

### フィーチャーブランチ

命名規則: `feature/[機能名]`, `bugfix/[バグ名]`, `hotfix/[修正名]`

**ワークフロー**:
1. `dev`から新しいブランチを作成
2. 機能開発・修正
3. Pull Request作成
4. CI/CD実行
5. レビュー・承認
6. `dev`へマージ
7. 検証後、`main`へマージ

## デプロイメント

### Cloudflare Pages

**設定**:
- プラットフォーム: Cloudflare Pages
- トリガー: PRマージ時（main/devブランチ）
- 自動デプロイ: GitHub Actions経由
- 本番環境: mainブランチ → Production
- プレビュー環境: devブランチ → Preview

**デプロイワークフロー**:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main, dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=excel-helper
```

## トラブルシューティング

### CI失敗時の対応

1. **自動Issue作成の確認**
   - `.github/workflows/auto-fix-on-failure.yml`を確認
   - Issueが作成されているか確認

2. **GitHub Copilot Assignの確認**
   - IssueのAssigneeにCopilotが設定されているか確認
   - GraphQL APIのレスポンスログを確認

3. **手動での修正**
   - CI失敗の原因を特定
   - ローカルで修正・テスト
   - コミット・プッシュ

### ワークフロー権限

**必要な権限**:
```yaml
permissions:
  contents: write
  issues: write
  pull-requests: write
```

## 参考資料

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [GitHub Copilot使い方](https://docs.github.com/en/copilot)
