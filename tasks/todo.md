# TODOタスク

## テスト（完了済み）
- [x] 依存パッケージのインストール（@vue/test-utils, @pinia/testing）
- [x] vite.config.tsの更新（environment: happy-dom）
- [x] テストセットアップファイルの作成（__tests__/setup.ts）
- [x] NumberingLineConverter.vueのコンポーネントテスト作成
- [x] FixedLengthConverter.vueのコンポーネントテスト作成
- [x] Piniaストアのテスト作成
- [x] 統合テストの追加
- [x] 重複テストファイルの削除
- [x] カバレッジ75%達成（コアロジック98%）

## ドキュメント（完了済み）
- [x] docs/usage.md の充実化
- [x] docs/dev.md の充実化
- [x] docs/api.md の充実化
- [x] docs/design/chat/ の設計ドキュメント

## 次のタスク
- [x] feature branchのコードレビュー
- [x] dev branchへのマージ

## 固定長相互変換機能の改善
- [ ] カラムタイトルを活用した機能の追加
- [ ] エラーハンドリングの改善
- [ ] バリデーション機能の追加
- [ ] サンプルデータの提供

## UI/UX改善
- [ ] レスポンシブデザインの調整
- [ ] 操作性の向上

## 将来の機能拡張
- [ ] 将来の機能拡張用のタブ追加準備
- [ ] 第2、第3の機能の企画

## 将来のリファクタリング

### CSV/TSVパーサーのライブラリ化
- **優先度**: High
- **内容**: カスタム実装の`parseDelimited`を`papaparse`等の実績あるライブラリに置き換え
- **理由**: 不正なクォート処理（例：`"a"b,c`）が寛容すぎてデータ破損のリスクがある
- **効果**: エッジケースへの堅牢性向上、保守コスト削減
- **出典**: Gemini Code Review (2025-10-26 14:15:43) on PR #5

### 共通ユーティリティの分離
- **優先度**: Medium
- **内容**: `parseDelimitedData`, `toCSV`, `toTSV` を `numberingConverter.ts` から `src/utils/delimited.ts` に移動
- **理由**: 現在これらの関数は汎用的なCSV/TSVパーサーだが、ナンバリング変換に特化したファイルに配置されている
- **効果**: コードの関心事を分離し、再利用性を向上
- **出典**: Gemini Code Review (2025-10-26 09:35:37)

### ローディング状態のテスト改善
- **優先度**: Low
- **内容**: `vitest` の Fake Timers を使用してローディング状態を直接テスト
- **現状**: 変換結果の表示確認による間接的な検証のみ
- **改善案**: 
  ```typescript
  vi.useFakeTimers()
  await button.trigger('click')
  expect(button.classes()).toContain('loading')
  await vi.advanceTimersByTimeAsync(300)
  expect(button.classes()).not.toContain('loading')
  ```
- **出典**: Gemini Code Review (2025-10-26 10:09:40)
