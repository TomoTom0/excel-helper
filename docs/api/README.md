# API仕様書

## 固定長変換 API

### `utils/converter.ts`

#### `parseColumnLengths(input: string): number[]`

カラム長さの文字列をパースして数値配列に変換します。

**パラメータ**:
- `input`: カンマ区切りの数値文字列（例: `"10,20,15"`）

**戻り値**:
- `number[]`: カラム長さの配列

**例**:
```typescript
parseColumnLengths("10,20,15")
// => [10, 20, 15]
```

**エラー**:
- 数値以外の値が含まれる場合は例外をスロー

---

#### `parseColumnOptions(input: string): ColumnOption[]`

カラムオプションの文字列をパースしてオプション配列に変換します。

**パラメータ**:
- `input`: カラムオプション文字列（例: `"string:right,number:left:0"`）

**戻り値**:
- `ColumnOption[]`: カラムオプションの配列

**ColumnOption型**:
```typescript
type ColumnOption = {
  type: 'string' | 'number'
  padding: 'left' | 'right'
  padChar: string
}
```

**例**:
```typescript
parseColumnOptions("string:right,number:left:0")
// => [
//   { type: 'string', padding: 'right', padChar: ' ' },
//   { type: 'number', padding: 'left', padChar: '0' }
// ]
```

**デフォルト値**:
- `type`: 指定なし（必須）
- `padding`: 指定なし（必須）
- `padChar`: `number` の場合 `'0'`、`string` の場合 `' '`

---

#### `convertFromFixed(data: string, lengths: number[], outputFormat: 'tsv' | 'csv' | 'fixed' = 'tsv', forceAllString: boolean = false): string`

固定長形式のデータをTSV/CSV形式に変換します。

**パラメータ**:
- `data`: 固定長形式のデータ
- `lengths`: 各カラムの長さの配列
- `outputFormat`: 出力形式（`'tsv'`、`'csv'`、または `'fixed'`、デフォルト: `'tsv'`）
- `forceAllString`: 全てのフィールドを引用符で囲むかどうか（デフォルト: `false`）

**戻り値**:
- `string`: TSV/CSV形式のデータ

**例**:
```typescript
const data = "John      Doe       30   "
const lengths = [10, 10, 5]
convertFromFixed(data, lengths, 'tsv')
// => "John\tDoe\t30"

// forceAllStringを使用
convertFromFixed(data, lengths, 'csv', true)
// => '"John","Doe","30"'
```

**処理**:
1. 各行を `lengths` に基づいて分割
2. 各カラムの前後の空白をトリム
3. TSV/CSV形式で結合
4. `forceAllString` が `true` の場合、全てのフィールドを引用符で囲む

---

#### `tsvToFixed(parsedData: string[][], lengths: number[], options: ColumnOption[]): string`

パース済みのTSV/CSVデータ（2次元配列）を固定長形式に変換します。

**パラメータ**:
- `parsedData`: パース済みの2次元配列 `string[][]`
- `lengths`: 各カラムの長さの配列
- `options`: 各カラムのオプション配列

**戻り値**:
- `string`: 固定長形式のデータ

**例**:
```typescript
const parsedData = [['John', 'Doe', '30']]
const lengths = [10, 10, 5]
const options = [
  { type: 'string', padding: 'right', padChar: ' ' },
  { type: 'string', padding: 'right', padChar: ' ' },
  { type: 'number', padding: 'left', padChar: '0' }
]
tsvToFixed(parsedData, lengths, options)
// => "John      Doe       00030"
```

**処理**:
1. 各カラムを指定された長さにパディング
2. 結合して固定長形式に変換

---

## ナンバリング変換 API

### `utils/numberingConverter.ts`

#### 型定義

```typescript
type PatternType = 'circled' | 'dotted' | 'parenthesized' | 'dummy'

type NumberFormat = 'circled' | 'dotted' | 'parenthesized'
```

---

#### `convertNumberingLines(text: string, detectPatterns: PatternType[], outputFormat: NumberFormat, dummyChar: string = 'x'): string`

テキスト内のナンバリング行を検出し、指定した形式に変換します。

**パラメータ**:
- `text`: 変換対象のテキスト
- `detectPatterns`: 検出するパターンの配列
- `outputFormat`: 出力形式
- `dummyChar`: ダミー文字（デフォルト: `'x'`）

**戻り値**:
- `string`: 変換後のテキスト

**例**:
```typescript
const text = "x概要\nx詳細\n①項目A\n②項目B"
convertNumberingLines(text, ['dummy', 'circled'], 'dotted', 'x')
// => "1. 概要\n2. 詳細\n3. 項目A\n4. 項目B"
```

**注**: この関数はテキストブロック全体で連続したカウンターを使用します。セルごとに独立したカウンターが必要な場合は、各セルに対して個別に呼び出してください。

**検出パターン**:
- `'circled'`: 丸数字（①②③...）
- `'dotted'`: 数字+ドット（1. 2. 3. ...）
- `'parenthesized'`: 括弧囲み数字（(1) (2) (3) ...）
- `'dummy'`: ダミー文字（指定した文字で始まる行）

**出力形式**:
- `'circled'`: ①②③...
- `'dotted'`: 1. 2. 3. ...
- `'parenthesized'`: (1) (2) (3) ...

**処理**:
1. テキストを行に分割
2. 各行の先頭が検出パターンにマッチするかチェック
3. マッチした場合、何番目のナンバリング行かカウント
4. 元のパターン部分を削除し、指定した形式の番号を付加
5. 行を結合して返す

---

### `utils/delimited.ts`

CSV/TSVパーサーとシリアライザー。`papaparse`ライブラリを使用。

#### `parseDelimitedData(text: string, delimiter: '\t' | ','): string[][]`

CSV/TSV形式のテキストをパースして2次元配列に変換します。`parseCSV`と`parseTSV`の共通実装です。

**パラメータ**:
- `text`: CSV/TSV形式のテキスト
- `delimiter`: デリミタ文字（`'\t'` または `','`）

**戻り値**:
- `string[][]`: パース結果の2次元配列

**例**:
```typescript
parseDelimitedData("項目1\t項目2\n値1\t値2", '\t')
// => [['項目1', '項目2'], ['値1', '値2']]
```

**実装**: `papaparse`の`parse`関数を使用

---

#### `parseCSV(text: string): string[][]`

CSV形式のテキストをパースして2次元配列に変換します。

**パラメータ**:
- `text`: CSV形式のテキスト

**戻り値**:
- `string[][]`: パース結果の2次元配列

**例**:
```typescript
parseCSV("項目1,項目2\n値1,値2")
// => [['項目1', '項目2'], ['値1', '値2']]
```

**実装**: `papaparse`の`parse`関数を使用

---

#### `parseTSV(text: string): string[][]`

TSV形式のテキストをパースして2次元配列に変換します。

**パラメータ**:
- `text`: TSV形式のテキスト

**戻り値**:
- `string[][]`: パース結果の2次元配列

**例**:
```typescript
parseTSV("項目1\t項目2\n値1\t値2")
// => [['項目1', '項目2'], ['値1', '値2']]
```

**実装**: `papaparse`の`parse`関数を使用

---

#### `toCSV(data: string[][], forceAllString: boolean = false): string`

2次元配列をCSV形式の文字列に変換します。

**パラメータ**:
- `data`: 2次元配列
- `forceAllString`: 全てのフィールドを引用符で囲むかどうか（デフォルト: `false`）

**戻り値**:
- `string`: CSV形式のテキスト

**例**:
```typescript
const data = [['項目1', '項目2'], ['値1', '値2']]
toCSV(data)
// => '項目1,項目2\n値1,値2'

// forceAllStringを使用
toCSV(data, true)
// => '"項目1","項目2"\n"値1","値2"'
```

**実装**: `papaparse`の`unparse`関数を使用

---

#### `toTSV(data: string[][], forceAllString: boolean = false): string`

2次元配列をTSV形式の文字列に変換します。

**パラメータ**:
- `data`: 2次元配列
- `forceAllString`: 全てのフィールドを引用符で囲むかどうか（デフォルト: `false`）

**戻り値**:
- `string`: TSV形式のテキスト

**例**:
```typescript
const data = [['項目1', '項目2'], ['値1', '値2']]
toTSV(data)
// => '項目1\t項目2\n値1\t値2'

// forceAllStringを使用
toTSV(data, true)
// => '"項目1"\t"項目2"\n"値1"\t"値2"'
```

**実装**: `papaparse`の`unparse`関数を使用

---

## Pinia Store API

### `useConverterStore`

固定長変換の状態を管理するストア。

**状態**:
```typescript
{
  columnLengths: string      // カラムごとの長さ
  dataBody: string           // データ本体
  columnTitles: string       // カラムタイトル
  columnOptions: string      // カラムごとのオプション
  delimiterType: 'auto' | 'tsv' | 'csv' | 'fixed'  // 区切り文字タイプ
  outputFormat: 'tsv' | 'csv' | 'fixed'  // 出力形式
  forceAllString: boolean    // 全てのフィールドを引用符で囲むかどうか
}
```

**アクション**:
- `clearColumnLengths()`: カラム長さをクリア
- `clearDataBody()`: データ本体をクリア
- `clearColumnTitles()`: カラムタイトルをクリア
- `clearColumnOptions()`: カラムオプションをクリア

**永続化**:
- `pinia-plugin-persistedstate` により、すべての状態が自動的に `localStorage` に保存されます

---

## エラーハンドリング

すべての変換関数は、不正な入力に対して例外をスローします。

**一般的なエラー**:
- パラメータが不正な形式
- データの構造が期待と異なる
- カラム数の不一致

**エラーハンドリングの例**:
```typescript
try {
  const result = convertFromFixed(data, lengths)
} catch (error) {
  console.error('変換エラー:', error.message)
}
```

---

## バージョニング

API は安定版として提供されていますが、破壊的変更が発生する可能性があります。
バージョン番号は `package.json` で管理されます。

現在のバージョン: `1.0.0`
