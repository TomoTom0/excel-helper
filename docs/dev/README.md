# 開発者ガイド

## 技術スタック

- **フレームワーク**: Vue 3 (Composition API)
- **ビルドツール**: Vite
- **言語**: TypeScript
- **状態管理**: Pinia (永続化プラグイン使用)
- **テスト**: Vitest
- **スタイル**: CSS (グローバルスタイル)
- **アイコン**: Material Design Icons

## プロジェクト構成

```
excel-helper/
├── src/
│   ├── App.vue                  # ルートコンポーネント
│   ├── main.ts                  # エントリーポイント
│   ├── style.css                # グローバルスタイル
│   ├── router/
│   │   └── index.ts             # Vue Routerの設定
│   ├── stores/
│   │   ├── converter.ts         # 固定長変換用ストア
│   │   └── numbering.ts         # ナンバリング変換用ストア
│   ├── types/
│   │   └── ...                  # TypeScript型定義
│   ├── utils/
│   │   ├── converter.ts         # 固定長変換ロジック
│   │   ├── delimited.ts         # CSV/TSVパーサー
│   │   └── numberingConverter.ts # ナンバリング変換ロジック
│   └── views/
│       ├── FixedLengthConverter.vue    # 固定長変換UI
│       └── NumberingLineConverter.vue  # ナンバリング変換UI
├── __tests__/
│   ├── setup.ts                 # テストセットアップ
│   ├── integration/             # 統合テスト
│   ├── components/              # コンポーネントテスト
│   └── stores/                  # ストアテスト
├── docs/
│   ├── usage/
│   │   └── README.md            # 使い方ガイド
│   ├── dev/
│   │   ├── README.md            # 開発者ガイド（このファイル）
│   │   ├── ci-cd.md             # CI/CD設定
│   │   ├── CI_AI_INTEGRATION.md # AI統合ガイド
│   │   └── branch-workflow.md   # ブランチワークフロー
│   ├── api/
│   │   └── README.md            # API仕様書
│   └── design/
│       └── chat/                # 初期設計チャット記録
├── imgs/
│   ├── demos/                   # デモGIF
│   └── screenshots/             # スクリーンショット
├── scripts/                     # 開発用スクリプト
├── tasks/                       # タスク管理
├── public/                      # 静的アセット
├── index.html                   # HTMLテンプレート
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# テスト実行
npm test

# テストUIの起動
npm run test:ui
```

## 開発ワークフロー

### 1. ローカル開発

```bash
npm run dev
```

開発サーバーが `http://localhost:5173` で起動します。

### 2. テスト駆動開発（TDD）

1. `__tests__/` ディレクトリにテストを作成
2. テストが失敗することを確認
3. 実装を追加してテストをパス
4. リファクタリング

```bash
# テストを実行
npm test

# ウォッチモードでテスト
npm test -- --watch

# UIでテスト実行
npm run test:ui
```

### 3. ビルドと確認

```bash
# 本番用ビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## コーディング規約

### TypeScript

- 型は明示的に定義する
- `any` の使用は避ける
- インターフェースまたは型エイリアスを活用

### Vue コンポーネント

- Composition APIを使用
- `<script setup>` 構文を推奨
- リアクティブな値は `ref` または `reactive` で定義

### スタイル

- グローバルスタイルは `src/style.css` に定義
- コンポーネント固有のスタイルは `<style scoped>` を使用
- 既存のクラス名と統一性を保つ

### ファイル命名

- コンポーネント: PascalCase（例: `FixedLengthConverter.vue`）
- ユーティリティ: camelCase（例: `converter.ts`）
- テスト: `*.test.ts`

## アーキテクチャ

### レイヤー構成

1. **View層** (`src/views/`)
   - UIコンポーネント
   - ユーザーインタラクション処理
   - Piniaストアとの連携

2. **Utils層** (`src/utils/`)
   - ビジネスロジック
   - データ変換処理
   - 純粋関数として実装

3. **Store層** (`src/stores/`)
   - 状態管理
   - 永続化対応

### データフロー

```
User Input → View Component → Utils (Logic) → Result
                ↓                               ↓
            Pinia Store (Persistence)    Display/Download
```

## 新機能の追加手順

### 例: 新しい変換機能を追加

1. **要件定義**
   - `docs/design/chat/` に設計ドキュメントを作成

2. **テスト作成**
   - `__tests__/` にテストファイルを作成
   - 期待する動作をテストケースとして記述

3. **ロジック実装**
   - `src/utils/` に変換ロジックを実装
   - テストをパスするまで実装

4. **UIコンポーネント作成**
   - `src/views/` に Vueコンポーネントを作成
   - 既存のコンポーネントのスタイルと統一

5. **ストア追加（必要な場合）**
   - `src/stores/` にストアを作成
   - 永続化プラグインを適用

6. **App.vueに統合**
   - 新機能のコンポーネントをタブとして追加し、ルーティングを設定

7. **ドキュメント更新**
   - `docs/usage.md` に使い方を追加
   - `docs/api.md` にAPI仕様を追加

## テスト戦略

### 単体テスト

- すべてのユーティリティ関数にテストを記述
- エッジケースを含める
- 正常系と異常系の両方をテスト

### テスト例

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../src/utils/myUtil'

describe('myFunction', () => {
  it('should handle normal case', () => {
    expect(myFunction('input')).toBe('expected')
  })

  it('should handle edge case', () => {
    expect(myFunction('')).toBe('')
  })

  it('should throw error for invalid input', () => {
    expect(() => myFunction('invalid-format')).toThrow()
  })
})
```

## デバッグ

### Vue Devtools

Vue Devtools を使用してコンポーネントの状態を確認

### Vitest UI

```bash
npm run test:ui
```

テストの実行状況を視覚的に確認

## デプロイ

### Cloudflare Pages（推奨）

```bash
npm run build
# dist/ ディレクトリをデプロイ
```

### その他の静的ホスティング

ビルドした `dist/` ディレクトリをそのままデプロイ可能

## パフォーマンス最適化

- 大量データ処理時は Web Worker の使用を検討
- 仮想スクロールの実装を検討（将来）
- バンドルサイズの最適化

## トラブルシューティング

### ビルドエラー

```bash
# node_modules と package-lock.json を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### テストが失敗する

- `happy-dom` が正しくインストールされているか確認
- `vitest.config.ts` の設定を確認

### 型エラー

```bash
# 型チェック
npx vue-tsc --noEmit
```

## コントリビューション

1. 機能追加や修正は issue を作成
2. feature ブランチを作成
3. テストを追加
4. プルリクエストを作成
5. レビュー後にマージ

## 参考資料

- [Vue 3 公式ドキュメント](https://vuejs.org/)
- [Vite 公式ドキュメント](https://vitejs.dev/)
- [Pinia 公式ドキュメント](https://pinia.vuejs.org/)
- [Vitest 公式ドキュメント](https://vitest.dev/)
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/)
