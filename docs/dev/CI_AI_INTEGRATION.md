# CI/CD AI統合ガイド

## 概要

このドキュメントでは、CI/CDパイプライン失敗時のAIアシスタント統合について説明します。

## 自動化の範囲

### ✅ 実装済みの自動化

1. **CI失敗時の自動Issue作成**
   - ワークフロー: `.github/workflows/auto-fix-on-failure.yml`
   - トリガー: CIワークフローが失敗したとき
   - 作成内容:
     - 失敗したジョブの詳細
     - エラーログ（最後の50行）
     - ワークフロー実行へのリンク
     - AI支援の指示

2. **自動ラベル付与**
   - `ci-failure`: CI失敗を示す
   - `automated`: 自動生成されたIssue
   - `bug`: バグとして扱う
   - `needs-triage`: トリアージが必要
   - `needs-ai-review`: AIレビューを推奨

3. **自動アサイン**
   - コミット作成者に自動的にアサイン

4. **自動クローズ**
   - 同じブランチ・コミットでCIが成功したら自動的にIssueをクローズ

### ❌ 自動化できないこと

1. **GitHub CopilotをAssigneeに設定**
   - 理由: GitHub Copilotは通常のユーザーアカウントではない
   - 代替: 人間の開発者にアサインし、Copilot Chatの使用を推奨

2. **@mentionによる自動レビュー開始**
   - 理由: GitHub Copilot Chatは@mentionに自動反応しない
   - 代替: 開発者が手動でCopilot Chatを起動

3. **Claude Codeへの自動対応依頼**
   - 理由: @claude-codeは通常のGitHubユーザーで、Botではない
   - 代替: ローカルのClaude/Cursorツールの使用を推奨

## AIアシスタントの使用方法

### GitHub Copilot Chat

Issueが作成されたら、以下のコマンドを使用できます:

```
/explain #[ISSUE_NUMBER]
What caused this CI failure?
```

```
/fix #[ISSUE_NUMBER]
How can we fix this issue?
```

```
/tests #[ISSUE_NUMBER]
Generate tests to prevent this regression
```

### Claude / Cursor / その他のAIツール

1. Issueからエラーログをコピー
2. AIアシスタントに以下のプロンプトを使用:

```
I have a CI failure in my TypeScript/Node.js project.

Error details:
[エラーログを貼り付け]

Please:
1. Identify the root cause
2. Suggest a fix with code examples
3. Recommend tests to prevent this issue
4. Explain any potential side effects
```

## ワークフロー

### CI失敗時のフロー

```mermaid
graph TD
    A[CI実行] --> B{成功?}
    B -->|失敗| C[auto-fix-on-failure実行]
    B -->|成功| D[既存のIssueをクローズ]
    C --> E[失敗ジョブ情報を取得]
    E --> F[エラーログを取得]
    F --> G{同じIssueが存在?}
    G -->|いいえ| H[新しいIssueを作成]
    G -->|はい| I[処理をスキップ]
    H --> J[AI支援コメントを追加]
    J --> K[修正手順のコメントを追加]
    K --> L[通知送信]
```

### 修正フロー

```mermaid
graph TD
    A[Issue作成通知] --> B[開発者がIssueを確認]
    B --> C{修正方法を知っている?}
    C -->|はい| D[直接修正]
    C -->|いいえ| E[AIアシスタントを使用]
    E --> F[エラーログをコピー]
    F --> G[Copilot/Claude等に質問]
    G --> H[提案された修正を確認]
    H --> I[修正を実装]
    D --> I
    I --> J[ローカルでテスト]
    J --> K[修正をコミット & プッシュ]
    K --> L[CI再実行]
    L --> M{成功?}
    M -->|はい| N[Issueが自動クローズ]
    M -->|いいえ| O[新しいIssueが作成]
```

## Issue作成の仕組み

### トリガー条件

- CIワークフロー（`.github/workflows/ci.yml`）が失敗
- `workflow_run`イベントで`auto-fix-on-failure.yml`がトリガー
- 同じブランチ・コミットのIssueが存在しない場合のみ作成

### Issueに含まれる情報

1. **基本情報**
   - ブランチ名
   - コミットSHA
   - ワークフロー実行URL
   - 失敗したジョブ数

2. **詳細情報**
   - 各失敗ジョブの名前とステータス
   - 開始・完了時刻
   - ログURL
   - エラーログ（最後の50行）

3. **AI支援情報**
   - GitHub Copilot Chatでの使用方法
   - Claude/Cursorでの使用方法
   - プロンプトテンプレート

4. **修正手順**
   - 手動修正のコマンド例
   - AI支援修正の手順
   - クイック修正テンプレート

## カスタマイズ

### 通知の追加

Slack/Discordへの通知を有効にするには:

1. Repository Secretsに`SLACK_WEBHOOK_URL`を設定
2. `auto-fix-on-failure.yml`の該当セクションが自動的に有効化

### ラベルのカスタマイズ

`.github/workflows/auto-fix-on-failure.yml`の`labels`配列を編集:

```yaml
labels: ['ci-failure', 'automated', 'bug', 'needs-triage', 'needs-ai-review', 'your-custom-label']
```

### エラーログの行数変更

デフォルトは50行ですが、変更可能:

```javascript
const errorLines = logLines.slice(-100).join('\n'); // 100行に変更
```

## ベストプラクティス

1. **Issueを確認したらすぐに対応**
   - CI失敗は他の開発者にも影響する可能性がある
   - `needs-triage`ラベルのIssueを優先的に処理

2. **AIツールを効果的に使用**
   - エラーログだけでなく、関連するコードも提供
   - 複数のAIツールの提案を比較検討

3. **修正後はテストを追加**
   - 同じ問題の再発を防ぐ
   - AIツールにテストケースの生成を依頼

4. **ドキュメントを更新**
   - よくある失敗パターンをドキュメント化
   - 将来の参考のため

## トラブルシューティング

### Issueが作成されない

- ワークフローの権限を確認: `permissions.issues: write`
- CIワークフローの名前が一致しているか確認
- 同じIssueが既に存在していないか確認

### エラーログが取得できない

- ジョブログのダウンロード権限を確認
- ログが大きすぎる場合、GitHub APIの制限に引っかかる可能性

### 自動クローズが動作しない

- Issue作成時のタイトルフォーマットが一致しているか確認
- ラベルが正しく付与されているか確認

## 関連ドキュメント

- [GitHub Actions: workflow_run](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run)
- [GitHub Copilot Chat](https://docs.github.com/en/copilot/using-github-copilot/asking-github-copilot-questions-in-your-ide)
- [GitHub REST API: Issues](https://docs.github.com/en/rest/issues)

## 更新履歴

- 2025-10-25: AI統合の調査結果を反映、`needs-ai-review`ラベルを追加
- 初版: 基本的なCI失敗時のIssue作成機能を実装
