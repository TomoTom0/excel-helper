#!/bin/bash

# 過去PRへのラベル付けスクリプト
# PRタイトルとブランチ名から適切なラベルを推論して付与

echo "🏷️  過去PRへのラベル付けを開始します..."

# PR番号とラベルのマッピング
# Format: "PR番号:type/xxx,version/xxx,priority/xxx"

declare -A pr_labels=(
  # feat: 新機能
  ["1"]="type/feature,version/minor"
  ["4"]="type/feature,version/minor"
  ["6"]="type/feature,version/minor"
  ["13"]="type/feature,version/minor"
  ["18"]="type/feature,version/minor"
  
  # fix: バグ修正
  ["7"]="type/fix,version/patch"
  ["8"]="type/fix,version/patch"
  ["15"]="type/fix,version/patch"
  ["23"]="type/fix,version/patch"
  ["26"]="type/fix,version/patch"
  ["27"]="type/fix,version/patch"
  ["28"]="type/fix,version/patch"
  ["31"]="type/fix,version/patch"
  
  # docs: ドキュメント
  ["10"]="type/docs,version/patch"
  ["12"]="type/docs,version/patch"
  ["21"]="type/docs,version/patch"
  ["33"]="type/docs,version/patch"
  ["34"]="type/docs,version/patch"
  
  # refactor: リファクタリング
  ["9"]="type/refactor,version/patch"
  
  # test: テスト
  ["11"]="type/test"
  
  # ci: CI/CD
  ["30"]="type/ci"
  
  # chore: 雑務
  ["35"]="type/chore"
  ["36"]="type/chore"
  
  # release: リリース (複合)
  ["5"]="type/feature,version/minor"
  ["17"]="type/chore"
  ["29"]="type/chore"
)

# ラベルを付与
for pr in "${!pr_labels[@]}"; do
  labels="${pr_labels[$pr]}"
  echo "PR #$pr にラベルを付与: $labels"
  
  IFS=',' read -ra LABEL_ARRAY <<< "$labels"
  for label in "${LABEL_ARRAY[@]}"; do
    gh pr edit "$pr" --add-label "$label" 2>/dev/null || echo "  ⚠️  PR #$pr へのラベル付与失敗（既に付与済みまたはPRが存在しない）"
  done
  
  sleep 0.5  # API rate limit対策
done

echo "✅ ラベル付与完了！"
echo ""
echo "📊 確認: gh pr list --state all --limit 36 --json number,labels"
