$ErrorActionPreference = 'Stop'

$dbPath = Join-Path $PSScriptRoot '..\ad_network_database_2026-08-11.tsv'
$rows = @(Import-Csv -Delimiter "`t" -LiteralPath $dbPath)

$slugs = @{
  '1'='ninja-admax'; '2'='imobile-ad-network'; '3'='zucks-ad-network'; '4'='adsterra'; '5'='adstir';
  '6'='google-adsense'; '7'='admaven'; '8'='infolinks'; '9'='adcash'; '10'='hilltopads';
  '11'='popads'; '12'='clickadu'; '13'='bidvertiser'; '14'='monetag'; '15'='exoclick';
  '16'='revcontent'; '17'='mgid'; '18'='journey-by-mediavine'; '19'='monumetric'; '20'='newor-media';
  '21'='raptive'; '22'='ezoic'; '23'='setupad'; '24'='mediavine-official'; '25'='publift';
  '26'='microad-compass'; '27'='logly-ads-context'; '28'='fluct-ssp'; '29'='geniee-ssp'; '30'='freestar'
}

foreach ($row in $rows) {
  if (-not $row.PSObject.Properties['slug']) {
    $row | Add-Member -NotePropertyName slug -NotePropertyValue $slugs[$row.id]
  } elseif ([string]::IsNullOrWhiteSpace($row.slug)) {
    $row.slug = $slugs[$row.id]
  }
  if (-not $row.PSObject.Properties['affiliate_url']) {
    $row | Add-Member -NotePropertyName affiliate_url -NotePropertyValue ''
  }
  foreach ($field in @('operator_country', 'publisher_content_languages', 'recommended_audience_geos', 'language_revenue_note', 'source_language_geo_url', 'user_registration_regions', 'new_user_registration_status', 'new_site_review_process', 'identity_tax_requirements', 'source_registration_url')) {
    if (-not $row.PSObject.Properties[$field]) {
      $row | Add-Member -NotePropertyName $field -NotePropertyValue ''
    }
  }
$domainNotRequiredIds = @('4', '13')
$domainRequiredIds = @('6', '14', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '28', '29', '30')
  if ($row.id -in $domainNotRequiredIds) {
    $row.custom_domain_requirement = '必須ではない'
  } elseif ($row.id -in $domainRequiredIds) {
    $row.custom_domain_requirement = '必須'
  } else {
    $row.custom_domain_requirement = '要確認'
  }
}

$marketProfiles = @{
  '1'=@('日本','日本語','日本','日本語サイト向け。広告需要が国内中心のため、日本語以外の媒体は案件充足を要確認。','https://www.ninja.co.jp/admax/')
  '2'=@('日本','日本語','日本','日本語の国内トラフィック向け。媒体言語より訪問者の所在地と国内広告需要が収益を左右する。','https://adpf-info.i-mobile.co.jp/')
  '3'=@('日本','日本語中心','日本','日本のスマートフォン利用者向け案件が中心。外国語サイトは対象国の広告在庫を事前確認。','https://zucks.co.jp/publisher/adnetwork/')
  '4'=@('キプロス','多言語','世界各国（日本を含む）','サイトが英語である必要はない。広告は訪問者の国に合わせて配信され、公式データでも国・端末によりCPMが大きく異なる。','https://adsterra.com/blog/how-much-adsterra-pays/')
  '5'=@('日本','日本語中心','日本','国内案件中心。日本語以外でも技術的な掲載可否とは別に、その言語圏・地域向け広告在庫で収益が変わる。','https://ja.ad-stir.com/')
  '6'=@('アメリカ','多言語','世界各国','コンテンツ言語に対応した広告を配信できるが、Page RPMは訪問者の国、分野、広告需要で変動する。','https://support.google.com/adsense/answer/9727?hl=ja')
  '7'=@('イスラエル','多言語','世界各国','全ての国のトラフィックを受け付ける。言語そのものより訪問者の国・品質・広告形式でCPMが変わる。','https://webflow.ad-maven.com/publishers')
  '8'=@('アメリカ','多言語','世界各国','世界のPublisherを対象とするコンテキスト広告。ページ文脈と言語に合う広告需要が少ない市場では収益が下がり得る。','https://www.infolinks.com/')
  '9'=@('エストニア','多言語','世界各国','現地語サイトも収益化可能。事例ではベトナム語・インドネシア語の地域特化が有効で、同じ言語でも訪問者の国によりRPMが異なる。','https://adcash.com/knowledge/three-case-studies-playbook-in-southeast-asia/')
  '10'=@('イギリス','多言語','世界各国','多国籍トラフィック向け。英語必須ではなく、訪問者の国・広告形式・端末構成が単価を左右する。','https://hilltopads.com/publishers/')
  '11'=@('コスタリカ','多言語','40か国以上','英語サイト限定ではない。公式は米国訪問者の収益例を示しており、国別の広告需要差が大きい。','https://www.popads.net/publishers.html')
  '12'=@('チェコ','多言語','世界各国','多地域のトラフィックを扱う。Publisher収益は訪問者の国、広告主需要、形式、品質に依存する。','https://www.clickadu.com/cpm-ad-network')
  '13'=@('イスラエル','多言語','世界各国','固定単価はなく、公式説明ではトラフィックの品質・量と広告主の入札水準で収益が変わる。','https://zendesk.bidvertiser.com/hc/en-us/articles/213569789-Why-haven-t-I-generated-any-revenue')
  '14'=@('キプロス','多言語','世界各国','英語以外も対象。国別CPM差が大きく、同じ言語でも訪問者の所在地・広告形式・端末で収益が変わる。','https://monetag.com/blog/twitter-7k-case-study/')
  '15'=@('スペイン','多言語','世界各国','世界各国・複数言語の媒体を扱う。特に成人・娯楽系では国別需要と端末別の広告形式が収益を左右する。','https://www.exoclick.com/publishers/')
  '16'=@('アメリカ','英語中心','主にアメリカなど英語圏','英語圏Publisher向けのNative広告色が強い。日本語媒体での案件充足・収益性は事前確認が必要。','https://www.revcontent.com/publishers/')
  '17'=@('アメリカ','多言語','世界各国','多言語Native広告に対応するが、記事言語と広告需要の一致が重要。訪問者の国・分野で収益が変わる。','https://www.mgid.com/publishers')
  '18'=@('アメリカ','英語中心','アメリカ・カナダ・イギリス等','英語以外を一律禁止する意味ではないが、プレミアム英語圏トラフィック比率がRPMに強く影響する。','https://www.journeymv.com/')
  '19'=@('アメリカ','英語中心','主にアメリカなど英語圏','英語圏向けManaged広告。日本語など非英語トラフィックでは広告需要と審査適合を要確認。','https://www.monumetric.com/')
  '20'=@('アメリカ','英語中心','アメリカ中心','英語圏トラフィックを主対象とするManaged広告。サイト言語より米国訪問者比率が収益性に影響する。','https://newormedia.com/')
  '21'=@('アメリカ','英語中心','アメリカ・カナダ・イギリス・オーストラリア・ニュージーランド','プレミアム英語圏トラフィック中心。日本語サイトは主要対象外となる可能性が高い。','https://raptive.com/creator/')
  '22'=@('アメリカ','多言語','世界各国','多言語媒体を扱えるが、EPMVは訪問者の国・広告需要・サイト分野で変動する。','https://www.ezoic.com/')
  '23'=@('ラトビア','多言語','ヨーロッパ・世界各国','多言語Publisherに対応。Header Biddingの需要は訪問者の国ごとに異なり、欧米トラフィックが有利になりやすい。','https://setupad.com/')
  '24'=@('アメリカ','英語中心','主にアメリカなど英語圏','英語圏の高品質トラフィックを主対象とする。非英語媒体は申請可否と広告需要を個別確認。','https://www.mediavine.com/')
  '25'=@('オーストラリア','英語中心','オーストラリア・北米・イギリス等','主に英語圏のPremium Publisher向け。日本語媒体は規模と対象地域を個別相談。','https://www.publift.com/')
  '26'=@('日本','日本語中心','日本','国内Publisher向け。外国語媒体は訪問者地域に合うDSP需要があるか個別確認。','https://www.microad.co.jp/services/adplatform/microad-compass/')
  '27'=@('日本','日本語','日本','日本語記事の文脈解析を強みとするため、日本語媒体向き。外国語コンテンツの解析・案件は要確認。','https://lift.logly.co.jp/')
  '28'=@('日本','日本語中心','日本','国内SSPとして日本の広告需要に強い。外国語サイトは対象地域と接続需要を個別相談。','https://corp.fluct.jp/service/ssp/')
  '29'=@('日本','多言語','日本・世界各国','国内外の広告需要に接続し海外ユーザーも収益化可能。言語より訪問者の国と接続先需要が重要。','https://geniee.co.jp/products/ssp/')
  '30'=@('アメリカ','英語中心','主に北米・英語圏','大規模英語圏Publisher向け。非英語媒体は対象地域・規模・広告需要を個別確認。','https://freestar.com/')
}

foreach ($row in $rows) {
  $profile = $marketProfiles[$row.id]
  $row.operator_country = $profile[0]
  $row.publisher_content_languages = $profile[1]
  $row.recommended_audience_geos = $profile[2]
  $row.language_revenue_note = $profile[3]
  $row.source_language_geo_url = $profile[4]
  $row.home_region = if ($profile[0] -eq '日本') { '日本' } else { "海外/$($profile[0])" }
}

$registrationProfiles = @{
  '1'=@('日本中心。海外在住者は居住国・契約主体を個別確認','オンライン登録受付中','サイト登録後に広告枠を作成。サイト追加時の確認内容は要確認','登録者・支払先情報が必要。本人確認・税務書類の公開詳細は要確認','https://www.ninja.co.jp/admax/')
  '2'=@('日本中心。海外在住者は居住国・契約主体を個別確認','オンライン登録受付中','媒体ごとの登録・審査あり','契約者・支払情報が必要。本人確認・税務書類は登録時に確認','https://adpf-info.i-mobile.co.jp/')
  '3'=@('日本中心。海外在住者は問い合わせ時に確認','問い合わせ・審査制','媒体ごとの審査あり','契約主体・支払情報が必要。必要書類は契約時確認','https://zucks.co.jp/publisher/adnetwork/')
  '4'=@('日本を含む世界各国。居住国に応じた利用可否を登録時に確認','オンライン登録受付中','ドメイン・広告形式ごとに確認。通常5～10分との公式案内あり','メール確認と支払プロフィールが必要。追加確認・税務情報は居住国と支払方法による','https://adsterra.com/blog/set-up-publishers-dashboard/')
  '5'=@('日本中心。海外在住者は居住国・契約主体を個別確認','オンライン登録受付中','媒体ごとの登録・審査あり','登録者・支払情報が必要。本人確認・税務書類は要確認','https://ja.ad-stir.com/')
  '6'=@('日本を含む対応国・地域。海外在住者は実際の居住国で登録','オンライン登録受付中','新しいサイトごとに所有権確認とポリシー審査が必須','本人・住所確認あり。居住地等に応じて税務情報、非米国居住者は通常W-8系フォームが必要','https://support.google.com/adsense/answer/12169212?hl=ja')
  '7'=@('世界各国。制限地域と利用条件は登録時に確認','オンライン登録受付中','サイト・広告コードごとの確認あり','連絡先・支払情報が必要。本人確認・税務書類の詳細はアカウントで確認','https://webflow.ad-maven.com/publishers')
  '8'=@('世界各国。海外在住者を含め利用地域は申請時確認','オンライン登録受付中','サイトごとの申請・審査あり','支払プロフィールが必要。本人確認・税務情報は居住国と支払方法による','https://www.infolinks.com/')
  '9'=@('世界各国。制限地域は登録時に確認','オンライン登録受付中','サイトごとの登録・確認あり','アカウント・支払情報が必要。追加本人確認や税務情報は条件による','https://adcash.com/publishers/')
  '10'=@('世界各国。制限地域は利用規約・登録画面で確認','オンライン登録受付中','サイト・広告枠ごとの確認あり','支払情報が必要。本人確認・税務書類は居住国と支払方法による','https://hilltopads.com/publishers/')
  '11'=@('世界各国。居住国の利用可否は登録時に確認','オンライン登録受付中','サイトごとの登録・承認あり','登録者・支払情報が必要。追加確認・税務書類は要確認','https://www.popads.net/publishers.html')
  '12'=@('世界各国。制限地域は登録時に確認','オンライン登録受付中','サイト・広告枠ごとの確認あり','登録者・支払情報が必要。本人確認・税務情報は条件による','https://www.clickadu.com/publishers')
  '13'=@('世界各国。無料ドメイン等は条件付き','オンライン登録受付中','サイトごとの登録。無料ドメインは自動承認対象外','支払プロフィールが必要。本人確認・税務書類の公開詳細は要確認','https://www.bidvertiser.com/webmasters/')
  '14'=@('日本を含む世界各国。ただし公式の除外国・地域あり','オンライン登録受付中','サイトごとの追加と所有権確認が必要','登録者・支払情報が必要。本人確認・税務情報は居住国・支払方法により追加される場合あり','https://help.monetag.com/en/articles/6723848-what-countries-are-available-for-publishers-to-register-from')
  '15'=@('世界各国。EU等では地域別の確認事項あり','オンライン登録受付中','サイト・広告枠ごとの登録と審査あり','プロフィール確認とTax ID情報が必要。EU・スペインなどはVAT関連の追加確認あり','https://docs.exoclick.com/ja/docs/general/my-profile/')
  '16'=@('主に英語圏。海外在住者もサイトと訪問者条件により個別審査','申請・審査制','サイトごとの品質・トラフィック審査あり','契約・支払情報と、居住国に応じた税務書類が必要となる場合あり','https://www.revcontent.com/publishers/')
  '17'=@('世界各国。サイト言語・地域・品質を個別審査','オンライン申請受付中','サイトごとの審査あり','契約者・支払情報が必要。本人確認・税務情報は居住国により確認','https://www.mgid.com/publishers')
  '18'=@('対応地域の制限より、サイト品質・訪問者地域・セッション条件を重視','オンライン申請受付中','サイトごとの審査。Journeyは公開セッション条件あり','支払設定時に本人・事業情報と居住国に応じた税務情報を確認','https://www.journeymv.com/')
  '19'=@('主に英語圏サイト向け。海外在住者はサイト条件を満たす場合に申請','申請・審査制','サイトごとのトラフィック・品質審査あり','契約・支払情報、居住国に応じた税務書類が必要となる場合あり','https://www.monumetric.com/')
  '20'=@('主に米国トラフィックを持つサイト向け。運営者の居住地は個別確認','申請・審査制','サイトごとのトラフィック・品質審査あり','本人・事業・支払情報と税務情報を契約時に確認','https://newormedia.com/')
  '21'=@('海外在住者を含むInternational creatorsに対応。主な訪問者地域条件あり','申請・審査制','サイトごとの品質・トラフィック審査あり','米国外居住者は支払前にW-8BENまたはW-8BEN-Eが必要','https://help.raptive.com/hc/en-us/articles/360035935731-W-8-tax-form-for-international-creators-what-you-need-to-know')
  '22'=@('世界各国。サイトとトラフィック条件を満たす必要あり','オンライン申請受付中','サイト追加後に所有権・品質・ポリシー確認あり','本人・支払プロフィールと、居住国に応じた税務情報が必要','https://www.ezoic.com/')
  '23'=@('世界各国のサイトを個別審査。海外在住者も問い合わせ可能','申請・審査制','サイトごとのトラフィック・品質審査と技術導入あり','契約主体・支払情報、居住国に応じた税務情報を契約時確認','https://setupad.com/')
  '24'=@('海外在住者を含め申請可能。英語圏トラフィック等の品質条件を重視','オンライン申請受付中','サイトごとの品質審査。公開収益・セッション条件あり','本人・事業・支払情報と、米国外居住者向け税務情報が必要となる場合あり','https://help.mediavine.com/what-does-it-take-to-get-approved-by-mediavine')
  '25'=@('主に英語圏・プレミアム媒体向け。居住地より媒体条件を個別相談','問い合わせ・審査制','サイトごとの規模・品質・技術審査あり','契約主体・支払情報、居住国に応じた本人確認・税務情報を契約時確認','https://www.publift.com/')
  '26'=@('日本中心。海外在住者は契約主体・居住国を問い合わせ','問い合わせ・審査制','媒体ごとの審査あり','契約者・請求・支払情報が必要。必要書類は契約時確認','https://www.microad.co.jp/contact/compass/')
  '27'=@('日本語媒体中心。海外在住者の契約可否は問い合わせ','問い合わせ・審査制','媒体ごとの審査とタグ発行あり','契約主体・支払情報が必要。必要書類は契約時確認','https://lift.logly.co.jp/')
  '28'=@('日本中心。海外在住者は契約主体・対象媒体を問い合わせ','問い合わせ・審査制','媒体ごとの規模・品質・技術審査あり','法人・契約・支払情報が中心。本人確認・税務書類は契約時確認','https://corp.fluct.jp/service/ssp/')
  '29'=@('日本・海外媒体に対応。海外在住者は地域・契約主体を個別相談','問い合わせ・審査制','媒体ごとの審査と導入調整あり','契約主体・支払・税務情報を契約時に確認','https://geniee.co.jp/products/ssp/')
  '30'=@('主に北米・英語圏の大規模媒体向け。海外在住者は個別申請','申請・審査制','サイトごとの規模・品質・技術審査あり','契約・支払情報と、居住国に応じた税務書類が必要となる場合あり','https://freestar.com/')
}

foreach ($row in $rows) {
  $profile = $registrationProfiles[$row.id]
  $row.user_registration_regions = $profile[0]
  $row.new_user_registration_status = $profile[1]
  $row.new_site_review_process = $profile[2]
  $row.identity_tax_requirements = $profile[3]
  $row.source_registration_url = $profile[4]
}


$jpFitMap = @{
  '高確度OK/個別審査' = '個別審査'
  '個別審査/不明' = '個別審査'
  '個別審査/実質不向き' = '実質不向き'
  '実質不向き/個別審査' = '実質不向き'
  '実質不向き（日本国内流入中心）' = '実質不向き'
}

foreach ($row in $rows) {
  if ($jpFitMap.ContainsKey($row.japanese_site_fit)) {
    $row.japanese_site_fit = $jpFitMap[$row.japanese_site_fit]
  }
  if ($row.bank_transfer -notin @('Yes', 'No', 'Conditional', 'Unknown')) {
    $row.bank_transfer = 'Unknown'
  }
  if ($row.japan_bank_only_complete -like 'Yes*') {
    $row.japan_bank_only_complete = 'Yes'
  } elseif ($row.japan_bank_only_complete -like 'Conditional*' -or $row.japan_bank_only_complete -like 'Likely Yes*') {
    $row.japan_bank_only_complete = 'Conditional'
  }
  if ($row.change_risk -eq 'Low-Medium') {
    $row.change_risk = 'Medium'
  }
}

$microAd = $rows | Where-Object id -eq '26'
$microAd.bank_transfer = 'Yes'
$microAd.japan_bank_only_complete = 'Yes'
$microAd.bank_method = '国内銀行振込'
$microAd.payout_processor = '自社支払'
$microAd.minimum_payout_overall = '8,000円（税抜。未満は繰越）'
$microAd.minimum_payout_bank = '8,000円（税抜）'
$microAd.payout_schedule = '月末締め・翌々月末まで'
$microAd.payout_currency = 'JPY'
$microAd.payout_fee_note = '振込手数料はMicroAd負担'
$microAd.source_requirements_url = 'https://www.microad.co.jp/contact/compass/'
$microAd.source_payment_url = 'https://www.microad.co.jp/contact/compass/'
$microAd.confidence = 'High'
$microAd.notes = '公式利用規約Article 12で国内銀行振込、8,000円（税抜）、翌々月末、振込手数料MicroAd負担を確認。'

$exoClick = $rows | Where-Object id -eq '15'
$exoClick.minimum_payout_overall = '20 EUR/USD（BitPay・Paxum）'
$exoClick.minimum_payout_bank = '200 EUR/USD（Wire）'
$exoClick.payout_schedule = '週次Net7（月曜）または月次Net20'
$exoClick.payout_currency = 'EUR/USD'
$exoClick.source_payment_url = 'https://docs.exoclick.com/publishers/payments/payment-options-timescales'
$exoClick.confidence = 'High'
$exoClick.notes = '公式Payments文書でWire最低200 EUR/USD、週次Net7または月次Net20を確認。日本の銀行での受取可否・中継銀行手数料は口座ごとに確認。'

foreach ($row in $rows) {
  if ($row.id -eq '6') {
    $row.recommendation_rank_jp_beginner = '30'
    $row.beginner_tier = 'C'
    $row.zero_to_one_score_1_5 = '1'
    $row.growth_stage = '比較基準 / AdSense審査通過後'
    $row.custom_domain_requirement = '必須'
    $row.beginner_recommendation = '本DBでは非推奨の比較基準。通常サイト申請は独自ドメイン前提で、審査不承認時に修正点を絞り込みにくい。AdSenseに通らない人は上位の代替候補を比較。'
    $row.source_requirements_url = 'https://support.google.com/adsense/answer/2784438?hl=ja'
    $row.notes = '通常サイト申請は標準ドメインURLを入力。Blogger等Host Partnerは別申請経路のため、このDBの独自ドメイン判定から除外。Googleは承認率を公表していないため、非公式な却下率は採用しない。'
  } elseif ($row.id -eq '1') {
    $row.recommendation_rank_jp_beginner = '29'
    $row.beginner_tier = 'C'
    $row.zero_to_one_score_1_5 = '2'
    $row.beginner_recommendation = '登録・設置は容易だが、公開された実収益例では極めて低収益の報告が複数ある。広告設置の練習用途を除き、主な収益源としては非推奨。'
    $row.notes = '公開実例として12か月・36,721表示で17円、月間約10万PVで約50円という報告を確認。媒体差はあるが、旧1位評価は収益実態と整合しないため29位へ変更。'
  } elseif ([int]$row.id -ge 2 -and [int]$row.id -le 5) {
    $row.recommendation_rank_jp_beginner = [string]([int]$row.id - 1)
  } elseif ([int]$row.id -gt 6) {
    $row.recommendation_rank_jp_beginner = [string]([int]$row.id - 2)
  } else {
    $row.recommendation_rank_jp_beginner = $row.id
  }
}

# 公開文言では業界用語の Publisher を避け、一般利用者に伝わる表現へ統一する。
foreach ($row in $rows) {
  foreach ($property in $row.PSObject.Properties) {
    $value = [string]$property.Value
    if ($value -and $value -notmatch '^https?://') {
      $property.Value = $value.Replace('Publisher', 'サイト運営者')
    }
  }
}

$removedDomainColumns = @(
  'free_subdomain_policy',
  'hosting_evidence_level',
  'blogspot_free_url',
  'wordpress_com_free_url',
  'github_pages_free_url',
  'vercel_free_subdomain',
  'cloudflare_pages_free_subdomain',
  'static_site_technical_fit',
  'source_domain_url',
  'custom_domain_category',
  'pros',
  'cons',
  'recommended_for',
  'pros_source_urls',
  'cons_source_urls'
)
foreach ($row in $rows) {
  foreach ($column in $removedDomainColumns) {
    $row.PSObject.Properties.Remove($column)
  }
}

$headers = @($rows[0].PSObject.Properties.Name)
$output = [System.Collections.Generic.List[string]]::new()
$output.Add(($headers -join "`t"))
foreach ($row in $rows) {
  $values = foreach ($header in $headers) {
    ([string]$row.$header).Replace("`t", ' ').Replace("`r", ' ').Replace("`n", ' ')
  }
  $output.Add(($values -join "`t"))
}
$output | Set-Content -LiteralPath $dbPath -Encoding utf8
