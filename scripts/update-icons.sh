#!/bin/bash

# アイコン更新スクリプト
# 使い方: ./scripts/update-icons.sh <512x512の画像パス>

set -e

if [ $# -eq 0 ]; then
    echo "❌ エラー: 画像ファイルのパスを指定してください"
    echo "使い方: $0 <512x512の画像パス>"
    echo "例: $0 tmp/yt-excel-helper-icon.png"
    exit 1
fi

SOURCE_IMAGE="$1"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ エラー: ファイルが存在しません: $SOURCE_IMAGE"
    exit 1
fi

# ImageMagickの確認
if ! command -v convert &> /dev/null; then
    echo "❌ エラー: ImageMagickがインストールされていません"
    echo "インストール方法: sudo apt-get install imagemagick"
    exit 1
fi

echo "🖼️  アイコン更新スクリプト"
echo "ソース画像: $SOURCE_IMAGE"
echo ""

# 画像サイズの確認
DIMENSIONS=$(identify -format "%wx%h" "$SOURCE_IMAGE")
echo "📏 画像サイズ: $DIMENSIONS"

if [ "$DIMENSIONS" != "512x512" ]; then
    echo "⚠️  警告: 画像サイズが512x512ではありません"
    echo "   推奨: 512x512のPNG画像を使用してください"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "中止しました"
        exit 1
    fi
fi

PUBLIC_DIR="public"
TEMP_DIR=$(mktemp -d)

echo ""
echo "🔄 アイコンファイルを生成中..."

# バックアップ作成
echo "📦 既存のアイコンをバックアップ中..."
BACKUP_DIR="tmp/icon-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "$PUBLIC_DIR"/*.{png,ico,svg} "$BACKUP_DIR/" 2>/dev/null || true
echo "   → $BACKUP_DIR に保存しました"

echo ""
echo "🎨 各サイズのアイコンを生成中..."

# 16x16
echo "   ✓ favicon-16x16.png (16x16)"
convert "$SOURCE_IMAGE" -resize 16x16 "$PUBLIC_DIR/favicon-16x16.png"

# 32x32
echo "   ✓ favicon-32x32.png (32x32)"
convert "$SOURCE_IMAGE" -resize 32x32 "$PUBLIC_DIR/favicon-32x32.png"

# 180x180 (Apple Touch Icon)
echo "   ✓ apple-touch-icon.png (180x180)"
convert "$SOURCE_IMAGE" -resize 180x180 "$PUBLIC_DIR/apple-touch-icon.png"

# 192x192 (Android Chrome)
echo "   ✓ android-chrome-192x192.png (192x192)"
convert "$SOURCE_IMAGE" -resize 192x192 "$PUBLIC_DIR/android-chrome-192x192.png"

# 512x512 (Android Chrome)
echo "   ✓ android-chrome-512x512.png (512x512)"
if [ "$DIMENSIONS" = "512x512" ]; then
    cp "$SOURCE_IMAGE" "$PUBLIC_DIR/android-chrome-512x512.png"
else
    convert "$SOURCE_IMAGE" -resize 512x512 "$PUBLIC_DIR/android-chrome-512x512.png"
fi

# favicon.ico (マルチサイズ: 16, 32, 48)
echo "   ✓ favicon.ico (16x16, 32x32, 48x48)"
convert "$SOURCE_IMAGE" -resize 16x16 "$TEMP_DIR/icon-16.png"
convert "$SOURCE_IMAGE" -resize 32x32 "$TEMP_DIR/icon-32.png"
convert "$SOURCE_IMAGE" -resize 48x48 "$TEMP_DIR/icon-48.png"
convert "$TEMP_DIR/icon-16.png" "$TEMP_DIR/icon-32.png" "$TEMP_DIR/icon-48.png" "$PUBLIC_DIR/favicon.ico"

# SVG版（オプション：元画像がSVGの場合）
if [ "${SOURCE_IMAGE##*.}" = "svg" ]; then
    echo "   ✓ favicon.svg (ベクター)"
    cp "$SOURCE_IMAGE" "$PUBLIC_DIR/favicon.svg"
else
    echo "   ℹ️  favicon.svg はスキップ（ソースがSVGではありません）"
fi

# 一時ファイル削除
rm -rf "$TEMP_DIR"

echo ""
echo "✅ アイコンの更新が完了しました！"
echo ""
echo "📁 生成されたファイル:"
ls -lh "$PUBLIC_DIR"/*.{png,ico} 2>/dev/null | awk '{print "   " $9, "(" $5 ")"}'

echo ""
echo "🔍 次のステップ:"
echo "   1. ブラウザでアイコンを確認"
echo "   2. git add public/"
echo "   3. git commit -m \"style: Update app icons\""
echo ""
echo "💡 ヒント:"
echo "   - バックアップ: $BACKUP_DIR"
echo "   - ブラウザのキャッシュをクリアすると変更が反映されます"
