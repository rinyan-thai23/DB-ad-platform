# 広告プラットフォーム比較DB（日本語サイト向け）

TSVを唯一のデータソースとして、Google AdSenseの審査に通らない人が代替広告を探すための比較サイトを静的HTMLで生成するRepositoryです。

## テストサイトを生成

Node.js 20以降を用意し、Repository直下で実行します。外部パッケージのインストールは不要です。

```bash
npm run build
npm run check
npm run serve
```

`http://localhost:4173/` で確認できます。生成物はCloudflare Pages公開用の `docs/` です。標準の公開先はRepository名を使った `https://db-ad-platform.pages.dev/` とし、ルートパス `/` で動作します。

本番ビルドでは公開URLを指定してください。

```bash
SITE_URL=https://example.jp npm run build
```

Repository名を変更する場合や別のProject Siteで配信する場合は `BASE_PATH` も指定します。

```bash
SITE_URL=https://example.pages.dev BASE_PATH= npm run build
```

## Cloudflare Pagesへ公開

GitHub RepositoryをCloudflare Pagesへ接続し、次の値を設定します。

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `docs`
- Root directory: Repository直下

Cloudflareのプロジェクト名が `db-ad-platform` 以外の場合は、環境変数 `SITE_URL` に実際の `https://プロジェクト名.pages.dev` を設定して再デプロイしてください。独自ドメインへ移行した場合も、`SITE_URL`だけを新しいURLへ変更します。

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

個別ページの実収益欄は、別表 `ad_network_revenue_examples_2026-08-12.tsv` から生成します。金額、RPM、CPC、増加率を同じ「収益例」に混同せず、指標種別・期間・トラフィック条件・出典種別とともに表示します。

一覧カードのサービス種別は表示せず、国内サービスは `日本`、海外サービスは `海外/国名` と表示します。媒体言語は `publisher_content_languages`、主な訪問者地域は `recommended_audience_geos`、言語・地域と収益の関係は `language_revenue_note` で管理します。

## 生成ページ

- トップ・検索／絞り込み
- 30サービスの個別HTML
- 初心者、日本の銀行、独自ドメイン、PayPal、Payoneer、Wise/Revolut、暗号資産、国際Wire、広告形式などのカテゴリHTML
- 選び方・調査方針
- AI制作サイトをCloudflare Pagesで無料公開し、独自ドメイン取得後まで収益化するガイド記事
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
- `ad_network_revenue_examples_2026-08-12.tsv`: サービス別の実収益・RPM・CPC・増加率と調査記録
- `ad_network_revenue_examples_schema_2026-08-12.tsv`: 実収益例テーブルのスキーマ

アフィリエイトURL、調査ソース、生成ロジックは公開Repositoryにそのまま含める方針です。AIエージェントも本READMEの構成・更新手順に従ってください。

カテゴリは `scripts/build-site.mjs` の定義とTSVの値から生成します。該当サービスが1件以上あるカテゴリだけを公開し、0件のカテゴリは生成しません。たとえば利用者へのStripe支払いは現在0件のため非公開ですが、将来 `stripe_payout=Yes` の行が追加されると自動的に生成されます。

ユーザー登録関連は、国籍ではなく居住国・契約主体・サービス対象地域を基準にします。日本在住者だけでなく海外在住の日本人も判断できるよう、登録可能地域、新規登録受付、サイト追加時の確認、本人確認・税務手続きを分離して管理します。

サイト種類は `custom_domain_requirement` の「必須／必須ではない／要確認」で管理します。無料URLサービス別の列は廃止しています。
