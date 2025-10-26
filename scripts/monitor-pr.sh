#!/bin/bash

# PR監視スクリプト
# CI/CDの失敗またはGeminiレビュー結果を1分ごとに確認

set -e

# 引数チェック
if [ -z "$1" ]; then
  echo "Usage: $0 <PR_NUMBER>"
  exit 1
fi

PR_NUMBER=$1
INTERVAL=60  # 1分
LAST_CI_STATUS=""
LAST_REVIEW_COUNT=0

echo "=== PR #${PR_NUMBER} 監視開始 ==="
echo "間隔: ${INTERVAL}秒"
echo ""

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIMESTAMP] チェック中..."
  
  # CI/CDステータスを確認
  CI_STATUS=$(gh pr view $PR_NUMBER --json statusCheckRollup --jq '.statusCheckRollup[] | select(.workflowName == "CI") | .conclusion' 2>/dev/null || echo "PENDING")
  
  if [ "$CI_STATUS" != "$LAST_CI_STATUS" ]; then
    echo ""
    echo "🔄 CI/CDステータス変更: $LAST_CI_STATUS → $CI_STATUS"
    
    if [ "$CI_STATUS" = "FAILURE" ]; then
      echo ""
      echo "❌ CI/CD失敗を検出！"
      echo "詳細: https://github.com/TomoTom0/excel-helper/pull/${PR_NUMBER}/checks"
      
      # ログURLを取得
      RUN_ID=$(gh run list --branch $(gh pr view $PR_NUMBER --json headRefName --jq '.headRefName') --limit 1 --json databaseId --jq '.[0].databaseId')
      echo "ログ: https://github.com/TomoTom0/excel-helper/actions/runs/${RUN_ID}"
      echo ""
      echo "監視を終了します"
      exit 1
    elif [ "$CI_STATUS" = "SUCCESS" ]; then
      echo "✅ CI/CD成功"
    fi
    
    LAST_CI_STATUS=$CI_STATUS
  fi
  
  # Geminiレビューを確認
  REVIEW_COUNT=$(gh api graphql -f query='
    query {
      repository(owner: "TomoTom0", name: "excel-helper") {
        pullRequest(number: '$PR_NUMBER') {
          reviews(last: 10) {
            totalCount
            nodes {
              author { login }
              submittedAt
              state
            }
          }
        }
      }
    }' --jq '.data.repository.pullRequest.reviews.nodes | map(select(.author.login == "gemini-code-assist")) | length' 2>/dev/null || echo "0")
  
  if [ "$REVIEW_COUNT" -gt "$LAST_REVIEW_COUNT" ]; then
    echo ""
    echo "📝 新しいGeminiレビューを検出！ (総数: $REVIEW_COUNT)"
    
    # 最新のレビューを取得
    LATEST_REVIEW=$(gh api graphql -f query='
      query {
        repository(owner: "TomoTom0", name: "excel-helper") {
          pullRequest(number: '$PR_NUMBER') {
            reviews(last: 1) {
              nodes {
                author { login }
                submittedAt
                body
                comments { totalCount }
              }
            }
          }
        }
      }
    }' --jq '.data.repository.pullRequest.reviews.nodes[0]')
    
    REVIEW_BODY=$(echo "$LATEST_REVIEW" | jq -r '.body' | head -5)
    COMMENT_COUNT=$(echo "$LATEST_REVIEW" | jq -r '.comments.totalCount')
    SUBMITTED_AT=$(echo "$LATEST_REVIEW" | jq -r '.submittedAt')
    
    echo "投稿日時: $SUBMITTED_AT"
    echo "コメント数: $COMMENT_COUNT"
    echo ""
    echo "レビュー本文 (抜粋):"
    echo "$REVIEW_BODY"
    echo ""
    echo "完全なレビューを表示: https://github.com/TomoTom0/excel-helper/pull/${PR_NUMBER}"
    echo ""
    
    if [ "$COMMENT_COUNT" -eq 0 ]; then
      echo "✅ レビューコメントなし - 承認済みの可能性"
      echo "監視を終了します"
      exit 0
    else
      echo "⚠️  $COMMENT_COUNT 件のコメントあり"
      echo "監視を終了します"
      exit 0
    fi
    
    LAST_REVIEW_COUNT=$REVIEW_COUNT
  fi
  
  # 進捗表示
  echo "  CI: $CI_STATUS | Geminiレビュー: $REVIEW_COUNT 件"
  
  # 待機
  sleep $INTERVAL
done
