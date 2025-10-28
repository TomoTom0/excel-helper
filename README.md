# YT Excel Helper

Excelデータの固定長形式変換とナンバリング形式変換を行うブラウザアプリケーション

## 主な機能

- **固定長⇔CSV/TSV相互変換**
  - 固定長形式のデータをCSV/TSV形式に変換
  - CSV/TSV形式のデータを固定長形式に変換
  - カラム長の自動調整・手動指定に対応

- **ナンバリング行変換**
  - セル内の複数行を番号付きリストに変換
  - 対応形式：①②③、1. 2. 3.、(1) (2) (3)、など
  - 検出対象セルの指定が可能

- **ブラウザで完結**
  - すべての処理がブラウザ内で完結
  - データを外部サーバーに送信しない
  - インストール不要

## 使い方

### 固定長相互変換

<img src="imgs/screenshots/screenshot-fixed-length-demo.png" alt="固定長変換デモ" style="max-width: 80vw; max-height: 60vh;">

固定長形式のデータをCSV/TSV形式に変換、またはCSV/TSV形式のデータを固定長形式に変換できます。

#### 固定長 → CSV/TSV変換の例

**カラムごとの長さ:**
```
5,5,10
```

**データ本体（固定長形式）:**
```
AAAA BBBB CCCCCCCCCC
XXXX YYYY ZZZZZZZZZZ
```

**出力結果（TSV形式）:**
```
AAAA	BBBB	CCCCCCCCCC
XXXX	YYYY	ZZZZZZZZZZ
```

#### CSV/TSV → 固定長変換の例

**カラムごとの長さ:**
```
5,5,10
```

**データ本体（TSV形式）:**
```
AAAA	BBBB	CCCCCCCCCC
XXXX	YYYY	ZZZZZZZZZZ
```

**出力結果（固定長形式）:**
```
AAAA BBBB CCCCCCCCCC
XXXX YYYY ZZZZZZZZZZ
```

### ナンバリング行変換

<img src="imgs/screenshots/screenshot-numbering-line-demo.png" alt="ナンバリング行変換デモ" style="max-width: 80vw; max-height: 60vh;">

セル内の複数行データのうち、番号が付いている行だけを検出して指定した形式に変換します。番号が付いていない行はそのまま残ります。**各セル内で番号は1から振り直されます。**

#### 変換例

**データ本体（CSV形式）:**
```
"③見出し1
詳細説明の内容
⑦見出し2
補足情報
①見出し3","②タイトルA
説明文
⑤タイトルB"
```

**出力結果（丸数字 → 1. 2. 3. 形式に変換、TSV形式）:**
```
"1. 見出し1
詳細説明の内容
2. 見出し2
補足情報
3. 見出し3"	"1. タイトルA
説明文
2. タイトルB"
```

この例では：
- 左のセル: `③見出し1`、`⑦見出し2`、`①見出し3` → `1. 見出し1`、`2. 見出し2`、`3. 見出し3` に変換（元の番号に関わらず1から振り直し）
- 左のセル: `詳細説明の内容`、`補足情報` → **そのまま残る**（番号なし行）
- 右のセル: `②タイトルA`、`⑤タイトルB` → `1. タイトルA`、`2. タイトルB` に変換（元の番号に関わらず1から振り直し）
- 右のセル: `説明文` → **そのまま残る**（番号なし行）

詳細な使い方は [docs/usage/README.md](docs/usage/README.md) を参照してください。

## 開発者向け情報

### クイックスタート

```bash
# インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test
```

### 技術スタック

- **フロントエンド**: Vue 3
- **言語**: TypeScript
- **ビルドツール**: Vite
- **状態管理**: Pinia
- **アイコン**: Material Design Icons

### ドキュメント

- [使い方](docs/usage/README.md) - 利用者向けドキュメント
- [開発](docs/dev/README.md) - 開発者向けドキュメント
- [API](docs/api/README.md) - API仕様

## ライセンス

ISC
