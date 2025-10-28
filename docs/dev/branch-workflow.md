# ブランチワークフロー

## 概要

このプロジェクトではGitflowベースのブランチ戦略を採用しています。

## ブランチ構成

### メインブランチ

- **`main`**: 本番環境用ブランチ
  - Cloudflare Pagesに自動デプロイ
  - `dev`ブランチからのみマージ可能
  - 常に安定した状態を維持

- **`dev`**: 開発用ブランチ
  - 機能ブランチからマージ
  - mainへのマージ前の統合テスト用
  - CI/CDが常に通過する状態を維持

### 作業ブランチ

命名規則に従ってブランチを作成：

- `feature/機能名`: 新機能開発
- `fix/修正内容`: バグ修正
- `docs/文書名`: ドキュメント更新
- `refactor/対象`: リファクタリング
- `test/テスト名`: テスト追加
- `chore/作業内容`: ビルド設定などの雑務
- `ci/ワークフロー名`: CI/CD関連
- `sync/説明`: ブランチ同期用
- `hotfix/修正内容`: 緊急修正

## ワークフロー

### 通常の開発フロー

```
1. devから作業ブランチを作成
   git checkout dev
   git pull origin dev
   git checkout -b feature/new-feature

2. 開発・コミット
   git add .
   git commit -m "feat: Add new feature"

3. pushする前にローカルでCI実行（pre-pushフック）
   - テスト自動実行
   - ビルド自動実行
   - 失敗したらpush中止

4. Push
   git push origin feature/new-feature

5. PRを作成（feature/new-feature → dev）
   gh pr create --base dev --head feature/new-feature

6. CI成功とレビュー承認後、devにマージ
```

### リリースフロー

```
1. devが安定した状態でdev→mainのPRを作成
   gh pr create --base main --head dev

2. CI成功を確認

3. mainにマージ
   - 自動的にCloudflare Pagesにデプロイ
```

## ブランチ保護ルール

### mainブランチ

- ✅ PRが必須
- ✅ CI成功が必須（`test (20.x)`, `validate-branches`）
- ✅ Linear history（マージコミット禁止）
- ✅ devブランチからのみマージ可能（自動検証）
- ✅ Force pushは管理者でも不可

### devブランチ

- ✅ PRが必須
- ✅ CI成功が必須（`test (20.x)`, `validate-branches`）
- ✅ Linear history（マージコミット禁止）
- ✅ ブランチ命名規則の検証
- ✅ mainからのマージは禁止（同期はsync/ブランチ経由）
- ✅ 会話の解決が必須
- ✅ Force pushは管理者でも不可

## PR検証ワークフロー

`.github/workflows/validate-pr-branches.yml`が以下を自動検証：

### ルール

1. **mainへのPR**
   - ✅ `dev`ブランチからのみ許可
   - ❌ `feature/*`, `fix/*`などは拒否
   - ❌ `sync-dev-to-main`などの中間ブランチも拒否

2. **devへのPR**
   - ✅ `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*`, `chore/*`, `ci/*`
   - ✅ `release/*`, `hotfix/*`, `sync/*`
   - ❌ `main`ブランチからは拒否

3. **違反時の動作**
   - ❌ ワークフローが失敗
   - 💬 PRに自動コメント投稿（理由と正しい手順を説明）
   - 🚫 Mergeボタンが無効化

### 例：不正なPR

```
PR: feature/test → main

結果:
❌ Validate PR Branches / validate-branches — FAILED

自動コメント:
## ❌ Branch Validation Failed

**Error**: PRs to `main` must come from `dev` branch only.

- Current base: `main`
- Current head: `feature/test`

**Required workflow**:
1. Merge your changes to `dev` first
2. Test thoroughly on `dev`
3. Create PR from `dev` to `main`
```

## pre-pushフック

`.git/hooks/pre-push`が自動的に以下を実行：

```bash
1. npm run test -- --run
   → テストが失敗したらpush中止

2. npm run build
   → ビルドが失敗したらpush中止
```

スキップしたい場合：
```bash
git push --no-verify
```

## トラブルシューティング

### ブランチが古くなった場合

```bash
# devブランチを最新に
git checkout dev
git pull origin dev

# 作業ブランチにdevをマージ
git checkout feature/my-feature
git merge dev
```

### Conflictが発生した場合

```bash
# Conflictを解決
git merge dev
# ファイルを編集してconflict解決
git add .
git commit -m "fix: Resolve merge conflicts"
```

### 誤ったブランチからPRを作成した場合

```bash
# PRをクローズ
gh pr close <PR番号>

# 正しいブランチから作成し直す
git checkout dev
git pull origin dev
git checkout -b feature/correct-branch
git cherry-pick <コミットハッシュ>
git push origin feature/correct-branch
gh pr create --base dev --head feature/correct-branch
```
