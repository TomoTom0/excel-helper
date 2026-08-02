# v1.1.0 (2026-05-16)

## New Features

- SQL表形式（PostgreSQLパイプ/MySQL表形式）とMarkdown表形式の入出力対応を追加
- html-tbl出力形式を追加（Markdown出力はmd-tblに名称変更）
- Frame表出力形式（toFrame関数）を追加
- プリセット削除時に2段階確認ダイアログを追加
- 入力元の形式を自動検出し、不一致時にエラーメッセージを表示

## Bug Fixes

- App.vueのラッパーdiv削除によるレイアウト問題を解決
- 固定長→固定長変換でヘッダーが統一されない問題を修正
- 固定長入力でuseFirstRowAsHeaderが正しく適用されない問題を修正
- usePresetCache.tsでNull合体演算子を使用した防御的実装
- 削除確認状態をプリセット名と紐付けて選択変更時の誤操作を防止
- 1カラムデータの場合に区切り文字存在チェックをスキップ
- DelimiterSelectorにoptions propを追加しDEFAULT_OPTIONSにフォールバック
- parseFrame正規表現から罫線文字を除去し空データ行のスキップを修正
- inputType表示にFrame表検出を追加、detectDelimiter重複呼び出しを解消
- isDelimitedDataでframe/html入力形式が正しく判定されない問題を修正
- handleDelimitedInputでhtml選択時のgetDelimiter例外を回避
- tableTransform.tsにinputFormat(pipe→sql)マイグレーションを追加
- toFrame/toMarkdown/toPipeで全角文字を含むデータの表示幅計算を修正（visualWidth/visualPadEnd関数を導入）
- visualWidth関数のUnicode範囲を拡張（絵文字、CJK拡張G-H対応）
- 表変換で変換オプション未選択時にエラーになる問題を修正（形式のみの変換を許容）

## Changes

- PresetDataの型定義をユニオン型に変更
- JSON.parseの結果に型チェックを追加
- プリセット上書き時に確認ダイアログを追加
- 変換ボタンの右に入力元・出力先形式選択を移動するUI改善

## Refactoring

- SettingsPage.vueの通知ロジックを共通化
- handleFixedWidthInputの変数を統合してコードを簡潔に
- OutputFormat型を共通化して重複を解消
- TableTransformerの冗長な入力形式セクションを削除
