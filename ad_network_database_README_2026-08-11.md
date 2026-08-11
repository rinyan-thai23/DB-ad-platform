# 広告プラットフォームDB 2026-08-11

## 目的
日本語サイトを作る初心者が「自分の条件で使える広告」を絞り込めるようにするためのDB。
広告単価ランキングではなく、**0円→初収益のしやすさ / 日本語サイト適合 / 日本の銀行口座までの出金 / 無料サブドメイン・静的サイト適合**を重視しています。

## 収録
- 30サービス
- 63カラム
- 国内アドネットワーク、国内SSP、海外セルフサーブ、Native、Managed Programmatic、Enterpriseを同一スキーマで比較

## データ品質
- DB本体は30行×60列で、列順は `ad_network_schema_2026-08-11.tsv` と一致
- enum / enum-like列はスキーマの基本値に正規化し、条件の詳細は理由・方式・注記列に保持
- 空欄は「未調査」を意味しない。公開一次情報がない場合は `Unknown` / `不明` / `契約時確認` を明示
- `source_domain_url` は個別ホスト名や無料サブドメインを公式に扱うページがある場合だけ記録

## 重要な読み方
### 0. 独自ドメインの大分類
検索用の `custom_domain_category` は次の2値です。

- `独自ドメインなしでも候補`: Blogspot / WordPress.com / GitHub Pages / Vercel / Cloudflare Pagesのいずれかが公式OK・条件付き・技術推定OK
- `独自ドメイン必須`: 上記5種類に候補がなく、保守的に独自ドメイン前提として扱う

「なしでも候補」は媒体審査の承認保証ではありません。個別の根拠は既存の無料URL列と `hosting_evidence_level` を確認してください。

### 1. 「技術的に貼れる」と「広告会社が審査で承認する」は別
GitHub Pages / Vercel / Cloudflare PagesはHTML/JSを配信できますが、
広告ネットワーク側が `*.github.io` / `*.vercel.app` / `*.pages.dev` を媒体として承認するかは別問題です。

そのため本DBでは:
- `公式OK` = 広告会社が明示
- `条件付き` = 公式に例外/審査条件あり
- `技術推定OK` = タグ設置は可能だが、そのホスト名を広告会社が公式保証していない
- `実質NG` = 公式要件と衝突する、または対象層として現実的でない
- `不明` = 断定できる一次情報なし

を分離しています。

### 2. 日本の銀行口座だけで完結
`japan_bank_only_complete` を最重要フィルタの1つにしています。
PayPal/Payoneerを経由せず、日本の銀行口座まで入金できるかを `Yes / Conditional / Unknown` で管理します。

- `Yes`: 国内振込またはJapan/JPY Local Bank Transferの公式確認あり
- `Conditional`: SWIFT/Tipalti/Wise等で到達可能性は高いが、銀行・国・アカウント条件の確認が必要
- `Unknown`: 公開資料で確認できず

### 3. Stripe
Publisher広告収益の支払では、Stripeは主要レールではありません。
今回の30社では、Google Payments / 国内振込 / Tipalti / Hyperwallet / PayPal / Payoneer / Wise / SWIFTが中心です。
Stripe列は「対応が普通ではない」こと自体をDBで可視化する目的で残しています。

### 4. 更新が特に必要な行
`change_risk=High` は3〜6か月ごとに公式再確認推奨。
特に海外サービスの最低支払額・支払Processor・トラフィック条件は変わりやすいです。

### 5. 2026年の大きな変更例
- Journey by Mediavine: 2026-08-07に「1,000 premium sessions/月」へ更新、Growはoptionalへ
- Ezoic: 現行の一般要件は250,000+ monthly active users
- Adsterra: Japan/JPYのLocal Bank Transferを公式に掲載
- Google AdSense: 通常のサブドメイン申請は不可で、Blogger等Host Partnerは例外
- Monetag: free hosted platforms（Blogspot/WordPress.com/Wix/Weebly等）を明示的に非対応
- BidVertiser: free domainは自動承認せず、実績のあるサイトのみ条件付き
- MicroAd COMPASS: 公式利用規約で国内銀行振込、8,000円（税抜）未満の繰越、翌々月末までの支払、振込手数料会社負担を確認
- ExoClick: Wire最低支払額は200 EUR/USD、支払周期は週次Net7または月次Net20

## 推奨フィルタ例
### 完全初心者・日本の銀行だけ
`zero_to_one_score_1_5 >= 4` AND `japan_bank_only_complete = Yes`

### GitHub Pages無料URLで実験
`github_pages_free_url contains 技術推定OK`
※承認保証ではないので必ず小規模テスト

### 独自ドメインなし
`custom_domain_requirement` が「必須/実質必須」でないものを残す

### 成長後の乗換先
`growth_stage` に `10,000` / `25,000` / `100,000` / `250,000` 等を含む行を比較

## 保守方針
次回更新では `last_verified_date`、`change_risk`、各 `source_*_url` を使い、
High → Medium → Lowの順に公式ページを再確認すると効率的です。
