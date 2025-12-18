# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/TomoTom0/excel-helper/compare/v1.0.0...v1.1.0) (2025-12-18)


### Features

* SQL INSERT文生成にファイルアップロード機能を追加 ([#74](https://github.com/TomoTom0/excel-helper/issues/74)) ([1268333](https://github.com/TomoTom0/excel-helper/commit/1268333ad9b36be223002ea1d25a810141dcac4f))
* SQL INSERT文生成機能の追加 ([#50](https://github.com/TomoTom0/excel-helper/issues/50)) ([0f8a32a](https://github.com/TomoTom0/excel-helper/commit/0f8a32a31f3fba700653efb17309e53549101614))


### Bug Fixes

* Add explicit commit message for Cloudflare deployment ([#63](https://github.com/TomoTom0/excel-helper/issues/63)) ([b361f17](https://github.com/TomoTom0/excel-helper/commit/b361f17ca03230302751b11fff4532b49d5d4482))
* Address Gemini PR[#38](https://github.com/TomoTom0/excel-helper/issues/38) review feedback ([#39](https://github.com/TomoTom0/excel-helper/issues/39)) ([010fc46](https://github.com/TomoTom0/excel-helper/commit/010fc4673738987b2481e123d21ba40306f152c2))
* address PR [#51](https://github.com/TomoTom0/excel-helper/issues/51) review comments ([#56](https://github.com/TomoTom0/excel-helper/issues/56)) ([963df8b](https://github.com/TomoTom0/excel-helper/commit/963df8b0e4662e3cc0ff27358ad48377e97a07ae))
* address review comments ([a3aa742](https://github.com/TomoTom0/excel-helper/commit/a3aa74286482c0b649e065f9caa2687ed1c5734a))
* forceType='number'で非数値文字列をNULLに変換 ([#71](https://github.com/TomoTom0/excel-helper/issues/71)) ([5f1ec8f](https://github.com/TomoTom0/excel-helper/commit/5f1ec8f667ddd8994222069c0238690ce945abcf))
* Use wrangler v3 to avoid commit message length issues ([#59](https://github.com/TomoTom0/excel-helper/issues/59)) ([3fefbfc](https://github.com/TomoTom0/excel-helper/commit/3fefbfcc21913964b0d74f2c63d0cddd9cbb05f5))
* コンポーネントテストをストア統合テストに変更 ([#69](https://github.com/TomoTom0/excel-helper/issues/69)) ([446e97c](https://github.com/TomoTom0/excel-helper/commit/446e97c8348139e113e29e161652ddbe33684eef))
* コンポーネントテストを復元しSQL値検証を追加 ([#72](https://github.com/TomoTom0/excel-helper/issues/72)) ([563254f](https://github.com/TomoTom0/excel-helper/commit/563254f6fd38a301ce3a01e4f01f55bcf1a04791))
* タブ文字の処理と区切り文字判定の改善 ([#49](https://github.com/TomoTom0/excel-helper/issues/49)) ([68058bf](https://github.com/TomoTom0/excel-helper/commit/68058bfb77c4d9ca967d10ccfca082adf58cc8d6))


### Reverts

* Remove unnecessary version parameters from favicon URLs ([#32](https://github.com/TomoTom0/excel-helper/issues/32)) ([8b2a0f4](https://github.com/TomoTom0/excel-helper/commit/8b2a0f40afd82c4157b555fe790a591f6d482786))

## [Unreleased]

### Added
- CSV/TSV出力時に全てのフィールドを引用符で囲むオプション（forceAllString）を追加
- SQL INSERT文生成機能にファイルアップロード機能を追加
  - 拡張子による形式自動判定（.csv, .tsv, .fix）
  - バイナリファイルの検証と拒否
  - Lazy loading（8KB検証、1KBプレビュー、変換時全読込）
  - 大量データの省略表示（10,000文字制限、コピー・ダウンロードは全データ出力）

### Changed
- パッケージマネージャーをnpmからBunに移行

### Fixed

### Tests
- delimited.tsの新規テストファイルを追加（14テスト）
- converter.tsにforceAllStringのテストケースを追加（5テスト）
- SqlInsertGenerator.vueのコンポーネントテストを追加（19テスト）

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
