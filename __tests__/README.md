# テスト全体管理

## テストファイル構成

### ユニットテスト
- `utils/`: ユーティリティ関数のテスト
  - `numberingConverter.test.ts`: 基本機能テスト
  - `numberingConverter.edge.test.ts`: エッジケーステスト
- `components/`: Vueコンポーネントのテスト
- `stores/`: Piniaストアのテスト
- `views/`: ビューコンポーネントのテスト

### テストカバレッジ目標
- 全体: 80%以上
- ユーティリティ関数: 90%以上
- コンポーネント: 70%以上

## テスト実行
\`\`\`bash
# 全テスト実行
npm test

# カバレッジ付き
npm run test:coverage

# ウォッチモード
npm run test:watch
\`\`\`

## テスト観点
1. 正常系: 期待される入力での正しい動作
2. 異常系: エラーハンドリング
3. 境界値: 最小値、最大値、境界条件
4. パフォーマンス: 大量データでの動作
