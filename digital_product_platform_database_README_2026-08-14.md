# デジタル商品販売プラットフォームDB 2026-08-14

自作したデジタル商品を、PayPalへの直接送金だけに依存せず販売するための国内・海外プラットフォーム比較DBです。

## ファイル

- digital_product_platform_database_2026-08-14.tsv: 33サービスの本体
- digital_product_platform_schema_2026-08-14.tsv: 67カラムの定義

## 最重要の読み方

buyer_paypal_payment は購入者がPayPalで支払えるか、seller_paypal_payout は販売者が売上をPayPalで受け取れるかを表し、別項目です。

merchant_of_record=Yes はプラットフォームが購入者に対する法的販売者となり、対象となるVAT・売上税、決済、返金、チャージバック等を処理する方式です。Partial は商品・地域・決済方式によって範囲が変わります。Stripe Taxなどの税計算機能があるだけの場合はMoRではありません。

## 更新方針

手数料、対応国、PayPal、最低出金額は変わりやすいため、change_risk=Highから月次確認します。fee_summaryだけを信用せず、source_pricing_urlとlast_verified_dateを同時に確認してください。空欄は未調査、Unknownは公式公開情報から確定できない、Conditionalは地域・プラン・決済方法等の条件付きです。

## 商品適性

product_* は技術的な販売可否と、そのプラットフォームで現実的に売りやすいかを合わせた初期判定です。recommended_products、marketplace_discovery、main_caveatも併読してください。

## 第一版の制約

各国の所得税、事業登録、特定商取引法上の表示義務まで免除するDBではありません。MoRでも販売者自身の所得税・法人税・商品責任は通常残ります。海外在住の日本人は国籍ではなく居住国、契約主体、受取口座、本人確認書類を基準に登録可否を確認してください。
