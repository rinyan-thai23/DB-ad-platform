# 広告プラットフォーム比較DB（日本語サイト向け）

TSVを唯一のデータソースとして、広告サービスの比較サイトを静的HTMLで生成するRepositoryです。

## テストサイトを生成

Node.js 20以降を用意し、Repository直下で実行します。外部パッケージのインストールは不要です。

```bash
npm run build
npm run check
npm run serve
```

`http://localhost:4173/` で確認できます。生成物はGitHub Pages公開用の `docs/` です。標準の公開パスは `/DB-ad-platform` に設定されています。

本番ビルドでは公開URLを指定してください。

```bash
SITE_URL=https://example.jp npm run build
```

Repository名を変更する場合や別のProject Siteで配信する場合は `BASE_PATH` も指定します。

```bash
SITE_URL=https://example.github.io BASE_PATH=/repository-name npm run build
```

## データ更新

1. `ad_network_database_2026-08-11.tsv` を更新
2. 必要なら `ad_network_schema_2026-08-11.tsv` も更新
3. `npm run build && npm run check`
4. `docs/` の差分を確認して公開

個別ページURLに使う `slug` は公開後に変更しません。

外部申込リンクは次の優先順位です。

1. `affiliate_url`（値がある場合）
2. `official_site_url`（affiliate_urlが空欄の場合）

そのため、アフィリエイトリンクの追加・変更はTSVだけで完結します。生成HTMLのCTAには `rel="sponsored nofollow noopener"` が付きます。調査出典は `source_*_url` 列で管理します。

## 生成ページ

- トップ・検索／絞り込み
- 30サービスの個別HTML
- 初心者、日本の銀行、PayPal、Payoneer、Wise/Revolut、暗号資産、国際Wire、無料サブドメイン、広告形式などのカテゴリHTML
- 選び方・調査方針
- sitemap.xml / robots.txt / 404.html

## 月次更新

`main` ブランチへのpushでGitHub Pagesへ自動公開します。毎月1日のGitHub ActionsでもTSVからの再生成とHTML検証を実行します。実データの再調査は `change_risk=High` → `Medium` → `Low` の順に公式ページを確認してください。

## Repository構成

- `docs/`: GitHub Pagesへ公開する生成済みHTML
- `scripts/`: サイト生成・検証・ローカルプレビュー
- `src/`: CSS・ブラウザ側JavaScript
- `tools/`: DB整備用スクリプト
- `ad_network_database_2026-08-11.tsv`: 公開データ本体
- `ad_network_schema_2026-08-11.tsv`: 公開スキーマ

アフィリエイトURL、調査ソース、生成ロジックは公開Repositoryにそのまま含める方針です。AIエージェントも本READMEの構成・更新手順に従ってください。

カテゴリは `scripts/build-site.mjs` の定義とTSVの値から生成します。該当サービスが1件以上あるカテゴリだけを公開し、0件のカテゴリは生成しません。たとえばStripe Publisher支払いは現在0件のため非公開ですが、将来 `stripe_payout=Yes` の行が追加されると自動的に生成されます。

サイト種類の大分類は `custom_domain_category` を使用します。無料URL5種のどれかに候補があれば「独自ドメインなしでも候補」、候補がなければ保守的に「独自ドメイン必須」とします。細かなホスティング別判定は既存列を維持します。
