# 広告プラットフォームDB 2026-08-11

## 目的
Google AdSenseの審査に通らない、または審査で停滞した日本語サイト初心者が「次に使える広告」を絞り込めるようにするためのDB。
広告単価ランキングではなく、**0円→初収益のしやすさ / 日本語サイト適合 / 日本の銀行口座までの出金 / 独自ドメイン要件**を重視しています。

## 収録
- 30サービス
- 63カラム
- 国内アドネットワーク、国内SSP、海外セルフサーブ、Native、Managed Programmatic、Enterpriseを同一スキーマで比較

## データ品質
- DB本体は30行×63列で、列順は `ad_network_schema_2026-08-11.tsv` と一致
- enum / enum-like列はスキーマの基本値に正規化し、条件の詳細は理由・方式・注記列に保持
- 実収益例は1サービス対複数行になるため、別表 `ad_network_revenue_examples_2026-08-12.tsv` で管理
- 運営国、媒体の推奨言語、収益化しやすい訪問者地域、言語・地域による収益差をDB本体で管理
- 金額付き事例が見つからないサービスも `evidence_status=not_found` の調査記録を2件残し、未調査と区別
- 空欄は「未調査」を意味しない。公開一次情報がない場合は `Unknown` / `不明` / `契約時確認` を明示

## 重要な読み方
### 0. 独自ドメインの大分類
検索用の `custom_domain_requirement` は次の3値です。

- `必須`: 独自ドメインでの運営が必要
- `必須ではない`: 独自ドメインなしの利用経路または例外を確認
- `要確認`: 公開情報だけでは断定できず、申請前の確認が必要

無料URLサービス別の列は廃止しました。「必須ではない」は媒体審査の承認保証ではありません。

### 1. 「独自ドメイン必須ではない」と「審査承認」は別
独自ドメインが必須ではなくても、広告会社がその媒体を承認するとは限りません。公開条件が曖昧な場合は `要確認` とし、申請前に公式情報または担当者へ確認します。

### 2. 日本の銀行口座だけで完結
`japan_bank_only_complete` を最重要フィルタの1つにしています。
PayPal/Payoneerを経由せず、日本の銀行口座まで入金できるかを `Yes / Conditional / Unknown` で管理します。

- `Yes`: 国内振込またはJapan/JPY Local Bank Transferの公式確認あり
- `Conditional`: SWIFT/Tipalti/Wise等で到達可能性は高いが、銀行・国・アカウント条件の確認が必要
- `Unknown`: 公開資料で確認できず

### 3. Stripe
利用者への広告収益の支払では、Stripeは主要レールではありません。
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
### AdSense以外の候補
`service_name != Google AdSense`

### 完全初心者・日本の銀行だけ
`zero_to_one_score_1_5 >= 4` AND `japan_bank_only_complete = Yes`

### 独自ドメインなし
`custom_domain_requirement = 必須ではない`

### 独自ドメイン条件が不明
`custom_domain_requirement = 要確認`

### 成長後の乗換先
`growth_stage` に `10,000` / `25,000` / `100,000` / `250,000` 等を含む行を比較

## 保守方針
次回更新では `last_verified_date`、`change_risk`、各 `source_*_url` を使い、
High → Medium → Lowの順に公式ページを再確認すると効率的です。

## Google AdSenseの位置づけ
AdSenseは代替候補ではなく比較基準として収録します。通常サイト申請は独自ドメイン必須として扱い、初心者向け順位は最下位です。Blogger等Host Partnerは別申請経路のため、一般サイトの独自ドメイン判定には含めません。Googleは承認率を公表していないため、非公式な却下率はDBへ記録しません。
