# Cloudflare Custom Domain Issue

## 問題
- カスタムドメイン https://excel-helper.scioj.com/ が古いバージョンのまま
- main.excel-helper.pages.dev は最新版がデプロイされている
- mainブランチへのCI/CDは成功している

## 原因の可能性
1. Cloudflareのカスタムドメイン設定で、mainブランチ以外（古いブランチやタグ）を指定している
2. カスタムドメインのキャッシュが更新されていない
3. カスタムドメインが別のプロジェクトやdeploymentを参照している

## 調査が必要な項目
1. Cloudflareダッシュボードでカスタムドメイン設定を確認
   - どのブランチ/deploymentを参照しているか
2. カスタムドメインのDNS設定を確認
3. Cloudflare Pagesのproduction branchの設定を確認

## 対応方法
Cloudflareの管理画面で以下を確認・設定：
1. Pages > excel-helper > Settings > Custom domains
   - excel-helper.scioj.com がどのブランチを参照しているか確認
   - production branch (main) を指定
2. Pages > excel-helper > Settings > Builds & deployments
   - Production branch が main になっているか確認
3. 必要に応じてカスタムドメインを削除して再追加

## 参考URL
- https://main.excel-helper.pages.dev/ (最新)
- https://excel-helper.scioj.com/ (古い)
