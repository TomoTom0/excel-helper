# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CSV/TSV出力時に全てのフィールドを引用符で囲むオプション（forceAllString）を追加

### Changed
- パッケージマネージャーをnpmからBunに移行

### Fixed

### Tests
- delimited.tsの新規テストファイルを追加（14テスト）
- converter.tsにforceAllStringのテストケースを追加（5テスト）

### Documentation
- README.mdをBunに対応して更新

## [1.0.0] - 2025-10-28

### Added
- 固定長⇔CSV/TSV相互変換機能
- ナンバリング行変換機能（丸数字、数字+ドット、括弧囲み数字対応）
- サイトfavicon（複数サイズ対応）([#13](https://github.com/TomoTom0/excel-helper/pull/13))
- スクリーンショットとデモGIF ([#21](https://github.com/TomoTom0/excel-helper/pull/21))
- PRブランチ検証ワークフロー ([#30](https://github.com/TomoTom0/excel-helper/pull/30))
- ブランチワークフロードキュメント ([#33](https://github.com/TomoTom0/excel-helper/pull/33))

### Changed
- CSV/TSVパーサーを`papaparse`に移行 ([#9](https://github.com/TomoTom0/excel-helper/pull/9))
- ドキュメントリンクを現在のコードベースに合わせて修正 ([#34](https://github.com/TomoTom0/excel-helper/pull/34))

### Fixed
- faviconのキャッシュバスティング ([#31](https://github.com/TomoTom0/excel-helper/pull/31))
- 複数のGeminiレビューフィードバックへの対応 ([#7](https://github.com/TomoTom0/excel-helper/pull/7), [#8](https://github.com/TomoTom0/excel-helper/pull/8), [#15](https://github.com/TomoTom0/excel-helper/pull/15), [#23](https://github.com/TomoTom0/excel-helper/pull/23), [#26](https://github.com/TomoTom0/excel-helper/pull/26))
- ブランチ同期の問題 ([#27](https://github.com/TomoTom0/excel-helper/pull/27), [#28](https://github.com/TomoTom0/excel-helper/pull/28))

### Tests
- Fake Timersを使用したローディング状態テストの改善 ([#11](https://github.com/TomoTom0/excel-helper/pull/11))
- 総テスト数: 180件、カバレッジ: コアロジック98%

### Documentation
- APIドキュメント、使い方ガイド、開発者ガイドの充実化
- タスク管理ドキュメントの整備

[Unreleased]: https://github.com/TomoTom0/excel-helper/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/TomoTom0/excel-helper/releases/tag/v1.0.0
