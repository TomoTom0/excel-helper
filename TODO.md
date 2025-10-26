# TODO

## 将来のリファクタリング

### 1. 共通ユーティリティの分離
- **優先度**: Medium
- **内容**: `parseDelimitedData`, `toCSV`, `toTSV` を `numberingConverter.ts` から `src/utils/delimited.ts` に移動
- **理由**: 現在これらの関数は汎用的なCSV/TSVパーサーだが、ナンバリング変換に特化したファイルに配置されている
- **効果**: コードの関心事を分離し、再利用性を向上
- **出典**: Gemini Code Review (2025-10-26 09:35:37)

### 2. ローディング状態のテスト改善
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

## 完了済み

- Vue Routerの導入
- 固定長変換の入力形式自動判定
- Cloudflare Pages自動デプロイ設定
- CI/CDドキュメントの統合
